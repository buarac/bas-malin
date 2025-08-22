/* eslint-disable @typescript-eslint/no-explicit-any */
import { PrismaClient } from '@prisma/client'
import { CacheService } from '../cache/cache.service'
import { 
  VarietyRepository, 
  VarietySearchParams, 
  VarietySearchResult,
  PersonalizedRecommendation,
  PerformancePersonnelle,
  VarietyWithUserData
} from '../repositories/variety.repository'

export interface VarietyCustomization {
  nomPersonnalise?: string
  notesPersonnelles?: string
  infosCulture?: any
  estFavorite?: boolean
}

export interface PerformanceUpdate {
  annee: number
  zone: string
  poidsTotalKg: number
  qualiteMoyenne: number
  problemes?: string[]
  succes?: string[]
  surfaceM2?: number
}

export interface GardenProfile {
  climat: {
    zone: string
    temperatureMin: number
    temperatureMax: number
    precipitationAnnuelle: number
  }
  sol: {
    type: string
    ph: number
    drainAge: string
  }
  zones: Array<{
    id: string
    exposition: string
    surfaceM2: number
    typeZone: string
  }>
}

export interface UserHistory {
  varietesTestees: string[]
  varietesReussies: string[]
  varietesEchouees: string[]
  famillesPreferees: string[]
  niveauExperience: number
  saisonsActives: number[]
}

/**
 * Service principal de gestion des variétés F2.1
 * Orchestré la logique métier complexe, recherche intelligente et recommandations
 */
export class VarietyManagementService {
  private varietyRepo: VarietyRepository
  private cache: CacheService

  constructor(
    private prisma: PrismaClient,
    cache: CacheService
  ) {
    this.varietyRepo = new VarietyRepository(prisma, cache)
    this.cache = cache
  }

  /**
   * Recherche intelligente avec enrichissement contexte utilisateur
   */
  async searchVarieties(params: VarietySearchParams): Promise<VarietySearchResult> {
    // Enrichir les paramètres avec contexte intelligent
    const enrichedParams = await this.enrichSearchParams(params)
    
    // Déléguer à repository avec cache intelligent
    const result = await this.varietyRepo.searchVarieties(enrichedParams)

    // Post-traitement avec recommandations IA si demandé
    if (params.includeAI && params.userId) {
      result.varieties = await this.enrichWithAIInsights(result.varieties, params.userId)
    }

    return result
  }

  /**
   * Enrichissement intelligent des paramètres de recherche
   */
  private async enrichSearchParams(params: VarietySearchParams): Promise<VarietySearchParams> {
    const enriched = { ...params }

    // Si utilisateur connecté, adapter la recherche à son contexte
    if (params.userId) {
      const userContext = await this.getUserContext(params.userId)
      
      // Ajuster difficultés selon expérience utilisateur
      if (!params.difficultyMax && userContext.experience) {
        if (userContext.experience.niveauExperience <= 2) {
          enriched.difficultyMax = 2 // Débutant : facile
        } else if (userContext.experience.niveauExperience <= 4) {
          enriched.difficultyMax = 3 // Intermédiaire : moyen
        }
        // Expérimenté : pas de limite
      }

      // Favoriser les familles avec succès passés
      if (userContext.experience.famillesPreferees.length > 0 && !params.query) {
        // Boost implicite dans le tri (implémenté côté repository)
      }
    }

    // Ajustement saisonnier automatique si pas de mois spécifié
    if (!params.currentMonth && !params.query) {
      enriched.currentMonth = new Date().getMonth() + 1
    }

    return enriched
  }

  /**
   * Obtenir le contexte utilisateur pour personnalisation
   */
  private async getUserContext(userId: string) {
    const cacheKey = `user_context:${userId}`
    
    return this.cache.getOrSet(
      cacheKey,
      async () => {
        // Analyser historique utilisateur
        const userVarieties = await this.prisma.varieteCultureUtilisateur.findMany({
          where: { utilisateurId: userId },
          include: {
            varieteBase: true,
            instancesCulture: {
              select: {
                etapeCycleVie: true,
                anneeSaison: true
              }
            }
          }
        })

        const experience: UserHistory = {
          varietesTestees: userVarieties.map(v => v.varieteBaseId),
          varietesReussies: userVarieties.filter(v => {
            const perf = v.performancePersonnelle as unknown as PerformancePersonnelle
            return perf.tauxReussite > 0.7
          }).map(v => v.varieteBaseId),
          varietesEchouees: userVarieties.filter(v => {
            const perf = v.performancePersonnelle as unknown as PerformancePersonnelle
            return perf.tauxReussite < 0.3
          }).map(v => v.varieteBaseId),
          famillesPreferees: this.extractPreferredFamilies(userVarieties),
          niveauExperience: this.calculateExperienceLevel(userVarieties),
          saisonsActives: this.extractActiveSeasonsIds(userVarieties)
        }

        return { experience }
      },
      900 // 15 minutes de cache
    )
  }

  /**
   * Extraire familles préférées de l'utilisateur
   */
  private extractPreferredFamilies(userVarieties: any[]): string[] {
    const familyCounts = new Map<string, number>()
    
    userVarieties.forEach(uv => {
      const famille = uv.varieteBase.famille
      if (famille) {
        const perf = uv.performancePersonnelle as PerformancePersonnelle
        // Pondérer par succès
        const score = perf.tauxReussite > 0.5 ? 2 : 1
        familyCounts.set(famille, (familyCounts.get(famille) || 0) + score)
      }
    })

    return Array.from(familyCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([famille]) => famille)
  }

  /**
   * Calculer niveau d'expérience utilisateur
   */
  private calculateExperienceLevel(userVarieties: any[]): number {
    if (userVarieties.length === 0) return 1

    const avgSuccessRate = userVarieties.reduce((sum, uv) => {
      const perf = uv.performancePersonnelle as PerformancePersonnelle
      return sum + perf.tauxReussite
    }, 0) / userVarieties.length

    const varietyCount = userVarieties.length
    const totalCultivations = userVarieties.reduce((sum, uv) => {
      const perf = uv.performancePersonnelle as PerformancePersonnelle
      return sum + perf.nombreCultivations
    }, 0)

    // Formule composite
    let level = 1
    if (varietyCount > 3 && avgSuccessRate > 0.6) level = 2
    if (varietyCount > 8 && avgSuccessRate > 0.7 && totalCultivations > 15) level = 3
    if (varietyCount > 15 && avgSuccessRate > 0.8 && totalCultivations > 30) level = 4
    if (varietyCount > 25 && avgSuccessRate > 0.85 && totalCultivations > 50) level = 5

    return level
  }

  /**
   * Extraire saisons actives utilisateur
   */
  private extractActiveSeasonsIds(userVarieties: any[]): number[] {
    const currentYear = new Date().getFullYear()
    const activesSeasons = new Set<number>()

    userVarieties.forEach(uv => {
      uv.instancesCulture.forEach((ic: any) => {
        if (ic.anneeSaison >= currentYear - 2) {
          // Extraire mois de l'année de la saison
          const season = ic.anneeSaison
          const month = season % 100 // Simplification
          if (month >= 1 && month <= 12) {
            activesSeasons.add(month)
          }
        }
      })
    })

    return Array.from(activesSeasons)
  }

  /**
   * Enrichissement IA des variétés (simplifié - sera amélioré Phase 14)
   */
  private async enrichWithAIInsights(
    varieties: VarietyWithUserData[], 
    userId: string
  ): Promise<VarietyWithUserData[]> {
    const userContext = await this.getUserContext(userId)
    
    return varieties.map(variety => {
      // Calcul score de compatibilité simple
      let compatibilityScore = 0.5 // Base

      // Bonus famille préférée
      if (userContext.experience.famillesPreferees.includes(variety.famille || '')) {
        compatibilityScore += 0.2
      }

      // Bonus niveau de difficulté adapté
      const infosCulture = variety.infosCulture as any
      if (infosCulture?.niveauDifficulte) {
        const userLevel = userContext.experience.niveauExperience
        const difficultyFit = Math.max(0, 1 - Math.abs(infosCulture.niveauDifficulte - userLevel) / 5)
        compatibilityScore += difficultyFit * 0.2
      }

      // Malus si déjà échoué
      if (userContext.experience.varietesEchouees.includes(variety.id)) {
        compatibilityScore -= 0.3
      }

      return {
        ...variety,
        _aiInsights: {
          compatibilityScore: Math.min(1, Math.max(0, compatibilityScore)),
          recommendationReasons: this.generateRecommendationReasons(variety, userContext),
          difficultyFit: infosCulture?.niveauDifficulte ? 
            this.calculateDifficultyFit(infosCulture.niveauDifficulte, userContext.experience.niveauExperience) : 0
        }
      }
    })
  }

  /**
   * Générer raisons de recommandation
   */
  private generateRecommendationReasons(variety: VarietyWithUserData, userContext: any): string[] {
    const reasons: string[] = []
    const infosCulture = variety.infosCulture as any

    // Famille préférée
    if (userContext.experience.famillesPreferees.includes(variety.famille || '')) {
      reasons.push(`Vous avez du succès avec les ${variety.famille}`)
    }

    // Niveau de difficulté adapté
    if (infosCulture?.niveauDifficulte <= userContext.experience.niveauExperience + 1) {
      reasons.push('Niveau de difficulté adapté à votre expérience')
    }

    // Popularité
    if ((variety._count?.varietesUtilisateur ?? 0) > 5) {
      reasons.push('Variété populaire auprès des jardiniers')
    }

    // Saisonnalité
    const currentMonth = new Date().getMonth() + 1
    const calendrier = variety.calendrierDefaut as any
    if (calendrier?.moisSemis?.includes(currentMonth) || calendrier?.moisPlantation?.includes(currentMonth)) {
      reasons.push('Période idéale pour semer/planter')
    }

    return reasons.length > 0 ? reasons : ['Variété intéressante à découvrir']
  }

  /**
   * Calculer adéquation niveau difficulté
   */
  private calculateDifficultyFit(varietyDifficulty: number, userLevel: number): number {
    const diff = Math.abs(varietyDifficulty - userLevel)
    if (diff === 0) return 1 // Parfait match
    if (diff === 1) return 0.8 // Très bon
    if (diff === 2) return 0.5 // Moyen
    return 0.2 // Difficile
  }

  /**
   * Créer personnalisation variété utilisateur
   */
  async createPersonalizedVariety(
    userId: string,
    baseVarietyId: string,
    customizations: VarietyCustomization
  ) {
    return this.varietyRepo.upsertUserVariety(userId, baseVarietyId, customizations)
  }

  /**
   * Mettre à jour performance utilisateur
   */
  async updateUserPerformance(
    userId: string,
    varietyId: string,
    performanceData: PerformanceUpdate
  ) {
    await this.varietyRepo.updatePerformance(userId, varietyId, performanceData)
    
    // Invalider cache contexte utilisateur pour recalcul
    await this.cache.delete(`user_context:${userId}`)
  }

  /**
   * Obtenir variétés favorites
   */
  async getFavoriteVarieties(userId: string): Promise<VarietyWithUserData[]> {
    return this.varietyRepo.getFavorites(userId)
  }

  /**
   * Obtenir recommandations personnalisées avancées (Phase 14 complète)
   */
  async getPersonalizedRecommendations(userId: string): Promise<PersonalizedRecommendation[]> {
    const cacheKey = `recommendations:${userId}`
    
    return this.cache.getOrSet(
      cacheKey,
      async () => {
        const userContext = await this.getUserContext(userId)
        const gardenProfile = await this.getGardenProfile(userId)
        
        // Algorithme de recommandation basique (à améliorer Phase 14)
        const candidates = await this.prisma.varieteCulture.findMany({
          where: {
            id: { notIn: userContext.experience.varietesTestees }
          },
          include: {
            _count: { select: { varietesUtilisateur: true } }
          },
          take: 20
        })

        const recommendations: PersonalizedRecommendation[] = candidates
          .map(variety => {
            const score = this.calculateRecommendationScore(variety, userContext, gardenProfile)
            
            return {
              variete: variety,
              scoreRecommandation: score,
              raisons: this.generateRecommendationReasons(variety as any, userContext),
              adaptationTerrain: this.calculateTerrainFit(variety, gardenProfile),
              probabiliteSucces: Math.min(0.95, score * 0.8 + userContext.experience.niveauExperience * 0.1),
              conseilsSpecifiques: this.generateSpecificTips(variety, userContext)
            }
          })
          .filter(r => r.scoreRecommandation > 0.3)
          .sort((a, b) => b.scoreRecommandation - a.scoreRecommandation)
          .slice(0, 5)

        return recommendations
      },
      1800 // 30 minutes de cache
    )
  }

  /**
   * Calculer score de recommandation
   */
  private calculateRecommendationScore(variety: any, userContext: any, gardenProfile: GardenProfile): number {
    let score = 0.3 // Base

    const infosCulture = variety.infosCulture as any

    // Famille préférée (+20%)
    if (userContext.experience.famillesPreferees.includes(variety.famille)) {
      score += 0.2
    }

    // Popularité (+15%)
    if (variety._count.varietesUtilisateur > 3) {
      score += 0.15
    }

    // Niveau difficulté approprié (+25%)
    if (infosCulture?.niveauDifficulte) {
      const difficultyFit = this.calculateDifficultyFit(infosCulture.niveauDifficulte, userContext.experience.niveauExperience)
      score += difficultyFit * 0.25
    }

    // Adaptation climat/sol (+20%)
    score += this.calculateTerrainFit(variety, gardenProfile) * 0.2

    return Math.min(1, score)
  }

  /**
   * Calculer adaptation terrain
   */
  private calculateTerrainFit(variety: any, gardenProfile: GardenProfile): number {
    const infosCulture = variety.infosCulture as any
    if (!infosCulture) return 0.5

    let fit = 0.5 // Base

    // Adaptation pH sol
    if (infosCulture.phOptimal && gardenProfile.sol.ph) {
      const [minPh, maxPh] = infosCulture.phOptimal
      if (gardenProfile.sol.ph >= minPh && gardenProfile.sol.ph <= maxPh) {
        fit += 0.2
      }
    }

    // Adaptation type de sol
    if (infosCulture.typesolPrefere && gardenProfile.sol.type) {
      if (infosCulture.typesolPrefere.includes(gardenProfile.sol.type)) {
        fit += 0.2
      }
    }

    // Adaptation température (simplifié)
    if (infosCulture.temperatureOptimaleCroissance) {
      // Comparaison simplifiée avec profil climatique
      fit += 0.1
    }

    return Math.min(1, fit)
  }

  /**
   * Obtenir profil jardin utilisateur
   */
  private async getGardenProfile(userId: string): Promise<GardenProfile> {
    // Simplification pour Phase 3-4, sera enrichi avec vraies données jardin
    return {
      climat: {
        zone: 'tempéré',
        temperatureMin: -5,
        temperatureMax: 35,
        precipitationAnnuelle: 600
      },
      sol: {
        type: 'limon',
        ph: 6.5,
        drainAge: 'bon'
      },
      zones: []
    }
  }

  /**
   * Générer conseils spécifiques
   */
  private generateSpecificTips(variety: any, userContext: any): string[] {
    const tips: string[] = []
    const infosCulture = variety.infosCulture as any

    // Conseils basés sur expérience
    if (userContext.experience.niveauExperience <= 2) {
      tips.push('Commencer par une petite quantité pour tester')
    }

    // Conseils saisonniers
    const currentMonth = new Date().getMonth() + 1
    const calendrier = variety.calendrierDefaut as any
    if (calendrier?.moisSemis?.includes(currentMonth)) {
      tips.push('Période idéale pour semer maintenant')
    }

    // Conseils de la variété elle-même
    if (infosCulture?.conseilsCulture) {
      tips.push(...infosCulture.conseilsCulture.slice(0, 2))
    }

    return tips.slice(0, 3)
  }

  /**
   * Obtenir statistiques globales variétés
   */
  async getVarietyStats(userId?: string) {
    const cacheKey = userId ? `variety_stats:${userId}` : 'variety_stats:global'
    
    return this.cache.getOrSet(
      cacheKey,
      async () => {
        const totalVarieties = await this.prisma.varieteCulture.count()
        
        let userSpecificStats = {}
        if (userId) {
          const userVarieties = await this.prisma.varieteCultureUtilisateur.count({
            where: { utilisateurId: userId }
          })
          const favoriteVarieties = await this.prisma.varieteCultureUtilisateur.count({
            where: { 
              utilisateurId: userId,
              estFavorite: true 
            }
          })
          
          userSpecificStats = {
            userVarieties,
            favoriteVarieties
          }
        }

        // Statistiques par catégorie
        const byCategory = await this.prisma.varieteCulture.groupBy({
          by: ['categorie'],
          _count: { categorie: true }
        })

        return {
          totalVarieties,
          ...userSpecificStats,
          byCategory: byCategory.map(c => ({
            category: c.categorie,
            count: c._count.categorie
          }))
        }
      },
      1800 // 30 minutes
    )
  }
}