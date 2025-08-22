/* eslint-disable @typescript-eslint/no-explicit-any */
import { PrismaClient, VarieteCulture, VarieteCultureUtilisateur, CategorieCulture } from '@prisma/client'
import { BaseRepository } from './base.repository'
import { CacheService } from '../cache/cache.service'

// Types pour F2.1
export interface VarietyWithUserData extends VarieteCulture {
  varietesUtilisateur?: VarieteCultureUtilisateur[]
  _count?: {
    varietesUtilisateur: number
  }
  _userSpecific?: {
    isFavorite: boolean
    personalizedName?: string
    performance?: PerformancePersonnelle
    userRating?: number
  }
}

export interface PerformancePersonnelle {
  nombreCultivations: number
  tauxReussite: number
  rendementMoyenKg: number
  rendementMoyenKgM2: number
  meilleureRecolte?: {
    annee: number
    poids: number
    notesQualite: number
  }
  meilleureDateSemis?: string
  meilleureDateRecolte?: string
  conditionsOptimales?: {
    zone: string
    exposition: string
    amendements: string[]
  }
  historique: Array<{
    annee: number
    zoneCultivee: string
    poidsTotalKg: number
    qualiteMoyenne: number
    problemes: string[]
    succes: string[]
  }>
  derniereMiseAJour: string
  calculPar: 'MANUEL' | 'AUTO'
}

export interface VarietySearchParams {
  userId?: string
  query?: string
  categories?: CategorieCulture[]
  difficultyMax?: number
  currentMonth?: number
  climate?: {
    typeSol: string
    zone: string
  }
  favoritesOnly?: boolean
  includeAI?: boolean
  includeRecommendations?: boolean
  sortBy?: 'name' | 'difficulty' | 'popularity' | 'performance' | 'seasonal' | 'harvest_time'
  limit?: number
}

export interface VarietySearchResult {
  varieties: VarietyWithUserData[]
  totalCount: number
  filters: AvailableFilters
  recommendations?: PersonalizedRecommendation[]
}

export interface AvailableFilters {
  categories: Array<{ value: CategorieCulture, label: string, count: number }>
  difficulties: Array<{ value: number, label: string, count: number }>
  families: Array<{ value: string, label: string, count: number }>
}

export interface PersonalizedRecommendation {
  variete: VarieteCulture
  scoreRecommandation: number
  raisons: string[]
  adaptationTerrain: number
  probabiliteSucces: number
  conseilsSpecifiques: string[]
}

export class VarietyRepository extends BaseRepository<VarieteCulture> {
  constructor(prisma: PrismaClient, cache: CacheService) {
    super(prisma, cache, 'varieteCulture')
  }

  /**
   * Recherche avancée de variétés avec filtres
   */
  async searchVarieties(params: VarietySearchParams): Promise<VarietySearchResult> {
    const cacheKey = this.getCacheKey('searchVarieties', params as any)
    
    return this.getOrSetCache(
      cacheKey,
      async () => {
        // Construire la requête WHERE
        const where = this.buildSearchWhereClause(params)
        
        // Exécuter la recherche
        const varieties = await this.prisma.varieteCulture.findMany({
          where,
          include: {
            varietesUtilisateur: params.userId ? {
              where: { utilisateurId: params.userId },
              select: {
                id: true,
                nomPersonnalise: true,
                estFavorite: true,
                noteGlobale: true,
                performancePersonnelle: true,
                estRecommandee: true
              }
            } : false,
            _count: {
              select: {
                varietesUtilisateur: true
              }
            }
          },
          orderBy: this.buildOrderBy(params.sortBy) as any,
          take: params.limit || 50
        })

        // Enrichir avec données utilisateur
        const enrichedVarieties = varieties.map(variety => this.enrichWithUserData(variety, params.userId))

        // Obtenir filtres disponibles
        const filters = await this.getAvailableFilters()

        return {
          varieties: enrichedVarieties,
          totalCount: varieties.length,
          filters,
          recommendations: params.includeRecommendations && params.userId ? 
            await this.getPersonalizedRecommendations(params.userId) : undefined
        }
      },
      300 // 5 minutes de cache
    )
  }

  /**
   * Construction de la clause WHERE pour la recherche
   */
  private buildSearchWhereClause(params: VarietySearchParams) {
    const where: any = {}

    // Recherche textuelle
    if (params.query) {
      where.OR = [
        { nomCommun: { contains: params.query, mode: 'insensitive' } },
        { nomScientifique: { contains: params.query, mode: 'insensitive' } },
        { famille: { contains: params.query, mode: 'insensitive' } }
      ]
    }

    // Filtrer par catégories
    if (params.categories?.length) {
      where.categorie = { in: params.categories }
    }

    // Filtrer par niveau de difficulté
    if (params.difficultyMax) {
      where.infosCulture = {
        path: ['niveauDifficulte'],
        lte: params.difficultyMax
      }
    }

    // Filtrer par mois de semis/plantation
    if (params.currentMonth) {
      where.OR = [
        {
          calendrierDefaut: {
            path: ['moisSemis'],
            array_contains: params.currentMonth
          }
        },
        {
          calendrierDefaut: {
            path: ['moisPlantation'],
            array_contains: params.currentMonth
          }
        }
      ]
    }

    // Uniquement les favoris
    if (params.favoritesOnly && params.userId) {
      where.varietesUtilisateur = {
        some: {
          utilisateurId: params.userId,
          estFavorite: true
        }
      }
    }

    return where
  }

  /**
   * Construction de l'ordre de tri
   */
  private buildOrderBy(sortBy?: string) {
    switch (sortBy) {
      case 'name':
        return { nomCommun: 'asc' as const }
      case 'difficulty':
        return [
          { infosCulture: { path: ['niveauDifficulte'], sort: 'asc' as const } }
        ]
      case 'popularity':
        return { varietesUtilisateur: { _count: 'desc' as const } }
      default:
        return { nomCommun: 'asc' as const }
    }
  }

  /**
   * Enrichir une variété avec les données utilisateur
   */
  private enrichWithUserData(variety: any, userId?: string): VarietyWithUserData {
    const userVariety = variety.varietesUtilisateur?.[0]
    
    const enriched: VarietyWithUserData = {
      ...variety,
      _userSpecific: userVariety ? {
        isFavorite: userVariety.estFavorite,
        personalizedName: userVariety.nomPersonnalise,
        performance: userVariety.performancePersonnelle as PerformancePersonnelle,
        userRating: userVariety.noteGlobale
      } : {
        isFavorite: false
      }
    }

    return enriched
  }

  /**
   * Obtenir les filtres disponibles
   */
  private async getAvailableFilters(): Promise<AvailableFilters> {
    const cacheKey = this.getCacheKey('availableFilters')
    
    return this.getOrSetCache(
      cacheKey,
      async () => {
        // Compter par catégorie
        const categories = await this.prisma.varieteCulture.groupBy({
          by: ['categorie'],
          _count: { categorie: true }
        })

        // Compter par famille
        const families = await this.prisma.varieteCulture.groupBy({
          by: ['famille'],
          _count: { famille: true },
          where: { famille: { not: null } }
        })

        // Pour la difficulté, on doit utiliser une requête raw car c'est dans JSON
        const difficulties = await this.prisma.$queryRaw<Array<{ niveau: number, count: number }>>`
          SELECT 
            CAST(infos_culture->>'niveauDifficulte' AS INTEGER) as niveau,
            COUNT(*) as count
          FROM varietes_culture 
          WHERE infos_culture->>'niveauDifficulte' IS NOT NULL
          GROUP BY infos_culture->>'niveauDifficulte'
          ORDER BY niveau
        `

        return {
          categories: categories.map(c => ({
            value: c.categorie,
            label: this.getCategoryLabel(c.categorie),
            count: c._count.categorie
          })),
          difficulties: difficulties.map(d => ({
            value: d.niveau,
            label: this.getDifficultyLabel(d.niveau),
            count: Number(d.count)
          })),
          families: families.map(f => ({
            value: f.famille!,
            label: f.famille!,
            count: f._count.famille
          }))
        }
      },
      3600 // 1 heure de cache
    )
  }

  /**
   * Recommandations personnalisées basiques (sera amélioré en Phase 14)
   */
  private async getPersonalizedRecommendations(userId: string): Promise<PersonalizedRecommendation[]> {
    // Pour le moment, retourner les variétés les plus populaires non testées par l'utilisateur
    const userVarieties = await this.prisma.varieteCultureUtilisateur.findMany({
      where: { utilisateurId: userId },
      select: { varieteBaseId: true }
    })

    const userVarietyIds = userVarieties.map(v => v.varieteBaseId)

    const popularVarieties = await this.prisma.varieteCulture.findMany({
      where: {
        id: { notIn: userVarietyIds }
      },
      include: {
        _count: {
          select: { varietesUtilisateur: true }
        }
      },
      orderBy: {
        varietesUtilisateur: { _count: 'desc' }
      },
      take: 5
    })

    return popularVarieties.map(variety => ({
      variete: variety,
      scoreRecommandation: Math.min(0.8, variety._count.varietesUtilisateur * 0.1),
      raisons: ['Populaire auprès des autres jardiniers', 'Facile à cultiver'],
      adaptationTerrain: 0.7,
      probabiliteSucces: 0.75,
      conseilsSpecifiques: ['Commencer avec une petite quantité', 'Suivre le calendrier recommandé']
    }))
  }

  /**
   * Créer ou mettre à jour une personnalisation utilisateur
   */
  async upsertUserVariety(
    userId: string,
    varietyId: string,
    data: Partial<{
      nomPersonnalise: string
      notesPersonnelles: string
      estFavorite: boolean
      noteGlobale: number
      infosCulturePersonnalisees: any
    }>
  ): Promise<VarieteCultureUtilisateur> {
    // Vérifier que la variété base existe
    const baseVariety = await this.prisma.varieteCulture.findUnique({
      where: { id: varietyId }
    })

    if (!baseVariety) {
      throw new Error('Variété non trouvée')
    }

    // Performance par défaut
    const defaultPerformance: PerformancePersonnelle = {
      nombreCultivations: 0,
      tauxReussite: 0,
      rendementMoyenKg: 0,
      rendementMoyenKgM2: 0,
      historique: [],
      derniereMiseAJour: new Date().toISOString(),
      calculPar: 'MANUEL'
    }

    const userVariety = await this.prisma.varieteCultureUtilisateur.upsert({
      where: {
        utilisateurId_varieteBaseId: {
          utilisateurId: userId,
          varieteBaseId: varietyId
        }
      },
      create: {
        utilisateurId: userId,
        varieteBaseId: varietyId,
        performancePersonnelle: defaultPerformance as any,
        ...data
      },
      update: {
        ...data,
        misAJourA: new Date()
      },
      include: {
        varieteBase: true
      }
    })

    // Invalider les caches liés
    await this.cache.invalidatePattern(`searchVarieties:*${userId}*`)
    
    return userVariety
  }

  /**
   * Mettre à jour les données de performance
   */
  async updatePerformance(
    userId: string,
    varietyId: string,
    performanceUpdate: {
      annee: number
      zone: string
      poidsTotalKg: number
      qualiteMoyenne: number
      problemes?: string[]
      succes?: string[]
      surfaceM2?: number
    }
  ): Promise<void> {
    const existing = await this.prisma.varieteCultureUtilisateur.findUnique({
      where: {
        utilisateurId_varieteBaseId: {
          utilisateurId: userId,
          varieteBaseId: varietyId
        }
      }
    })

    if (!existing) {
      throw new Error('Variété utilisateur non trouvée')
    }

    const currentPerf = existing.performancePersonnelle as unknown as PerformancePersonnelle
    const updatedPerf = this.calculateUpdatedPerformance(currentPerf, performanceUpdate)

    await this.prisma.varieteCultureUtilisateur.update({
      where: {
        utilisateurId_varieteBaseId: {
          utilisateurId: userId,
          varieteBaseId: varietyId
        }
      },
      data: {
        performancePersonnelle: updatedPerf as any,
        misAJourA: new Date()
      }
    })

    // Invalider cache
    await this.cache.invalidatePattern(`searchVarieties:*${userId}*`)
  }

  /**
   * Calculer performance mise à jour
   */
  private calculateUpdatedPerformance(
    current: PerformancePersonnelle,
    update: any
  ): PerformancePersonnelle {
    const newEntry = {
      annee: update.annee,
      zoneCultivee: update.zone,
      poidsTotalKg: update.poidsTotalKg,
      qualiteMoyenne: update.qualiteMoyenne,
      problemes: update.problemes || [],
      succes: update.succes || []
    }

    const newHistorique = [...current.historique, newEntry]
    const totalKg = newHistorique.reduce((sum, entry) => sum + entry.poidsTotalKg, 0)
    const totalCultivations = newHistorique.length

    const bestHarvest = newHistorique.reduce((best, entry) => 
      entry.poidsTotalKg > best.poidsTotalKg ? entry : best
    )

    return {
      ...current,
      nombreCultivations: totalCultivations,
      tauxReussite: newHistorique.filter(entry => entry.poidsTotalKg > 0).length / totalCultivations,
      rendementMoyenKg: totalKg / totalCultivations,
      rendementMoyenKgM2: update.surfaceM2 ? totalKg / (totalCultivations * update.surfaceM2) : current.rendementMoyenKgM2,
      meilleureRecolte: {
        annee: bestHarvest.annee,
        poids: bestHarvest.poidsTotalKg,
        notesQualite: bestHarvest.qualiteMoyenne
      },
      historique: newHistorique,
      derniereMiseAJour: new Date().toISOString(),
      calculPar: 'AUTO'
    }
  }

  /**
   * Obtenir les variétés favorites d'un utilisateur
   */
  async getFavorites(userId: string): Promise<VarietyWithUserData[]> {
    const cacheKey = this.getCacheKey('getFavorites', { userId })
    
    return this.getOrSetCache(
      cacheKey,
      async () => {
        const favorites = await this.prisma.varieteCulture.findMany({
          where: {
            varietesUtilisateur: {
              some: {
                utilisateurId: userId,
                estFavorite: true
              }
            }
          },
          include: {
            varietesUtilisateur: {
              where: { utilisateurId: userId }
            },
            _count: {
              select: { varietesUtilisateur: true }
            }
          }
        })

        return favorites.map(variety => this.enrichWithUserData(variety, userId))
      },
      600 // 10 minutes de cache
    )
  }

  // Utilitaires pour labels
  private getCategoryLabel(category: CategorieCulture): string {
    const labels = {
      LEGUME: 'Légumes',
      FRUIT: 'Fruits', 
      HERBE_AROMATIQUE: 'Herbes aromatiques',
      FLEUR: 'Fleurs',
      ARBRE: 'Arbres',
      VIGNE: 'Vignes'
    }
    return labels[category] || category
  }

  private getDifficultyLabel(level: number): string {
    const labels = {
      1: 'Très facile',
      2: 'Facile', 
      3: 'Moyen',
      4: 'Difficile',
      5: 'Très difficile'
    }
    return labels[level as keyof typeof labels] || `Niveau ${level}`
  }
}