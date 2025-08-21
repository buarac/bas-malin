import { PrismaClient, InstanceCulture, EtapeCycleVie, VarieteCulture, VarieteCultureUtilisateur } from '@prisma/client'
import { BaseRepository } from './base.repository'
import { CacheService } from '../cache/cache.service'

export interface CultureWithVariete extends InstanceCulture {
  variete: VarieteCultureUtilisateur & {
    varieteBase: VarieteCulture
  }
  zone: {
    id: string
    nom: string
    typeZone: string
  }
  _stats?: {
    joursDepuisSemis?: number
    joursPrevusAvantRecolte?: number
    tauxSurvieCalcule?: number
    derniereMiseAJour: Date
  }
}

export interface CreateCultureInput {
  nom: string
  utilisateurId: string
  varieteId: string
  zoneId: string
  anneeSaison: number
  dateSemisPrevue?: Date
  quantitePlantee?: number
  conditionsCulture?: any
  notes?: string
}

export interface UpdateCultureInput extends Partial<CreateCultureInput> {
  id: string
  etapeCycleVie?: EtapeCycleVie
  dateSemisReelle?: Date
  dateRepiquagePrevue?: Date
  dateRepiquageReelle?: Date
  datePremiereRecolte?: Date
  dateDerniereRecolte?: Date
  dateFinCycle?: Date
  quantiteGermee?: number
  quantiteRepiquee?: number
  tauxSurvie?: number
  predictionsIA?: any
  estActive?: boolean
}

export class CultureRepository extends BaseRepository<InstanceCulture> {
  constructor(prisma: PrismaClient, cache: CacheService) {
    super(prisma, cache, 'instanceCulture')
  }

  /**
   * Trouve toutes les cultures d'un utilisateur
   */
  async findByUserId(
    userId: string,
    includeInactive: boolean = false,
    ttlSeconds: number = 300
  ): Promise<CultureWithVariete[]> {
    const cacheKey = this.getCacheKey('findByUserId', { userId, includeInactive })
    
    return this.getOrSetCache(
      cacheKey,
      async () => {
        const whereClause: any = { utilisateurId: userId }
        if (!includeInactive) {
          whereClause.estActive = true
        }

        const cultures = await this.prisma.instanceCulture.findMany({
          where: whereClause,
          include: {
            variete: {
              include: {
                varieteBase: true
              }
            },
            zone: {
              select: {
                id: true,
                nom: true,
                typeZone: true
              }
            }
          },
          orderBy: { creeA: 'desc' }
        })

        // Enrichir avec statistiques calculées
        return cultures.map(culture => this.enrichWithStats(culture))
      },
      ttlSeconds
    )
  }

  /**
   * Trouve les cultures par zone
   */
  async findByZoneId(zoneId: string, ttlSeconds: number = 300): Promise<CultureWithVariete[]> {
    const cacheKey = this.getCacheKey('findByZoneId', { zoneId })
    
    return this.getOrSetCache(
      cacheKey,
      async () => {
        const cultures = await this.prisma.instanceCulture.findMany({
          where: { zoneId, estActive: true },
          include: {
            variete: {
              include: {
                varieteBase: true
              }
            },
            zone: {
              select: {
                id: true,
                nom: true,
                typeZone: true
              }
            }
          },
          orderBy: { dateSemisPrevue: 'asc' }
        })

        return cultures.map(culture => this.enrichWithStats(culture))
      },
      ttlSeconds
    )
  }

  /**
   * Trouve une culture avec détails complets
   */
  async findByIdWithDetails(cultureId: string, ttlSeconds: number = 300): Promise<CultureWithVariete | null> {
    const cacheKey = this.getCacheKey('findByIdWithDetails', { cultureId })
    
    return this.getOrSetCache(
      cacheKey,
      async () => {
        const culture = await this.prisma.instanceCulture.findUnique({
          where: { id: cultureId },
          include: {
            variete: {
              include: {
                varieteBase: true
              }
            },
            zone: {
              select: {
                id: true,
                nom: true,
                typeZone: true
              }
            },
            interventions: {
              select: {
                id: true,
                dateReelle: true,
                notes: true,
                typesIntervention: {
                  include: {
                    typeIntervention: {
                      select: {
                        nom: true,
                        categorie: true
                      }
                    }
                  }
                }
              },
              orderBy: { dateReelle: 'desc' },
              take: 5
            },
            recoltes: {
              select: {
                id: true,
                dateRecolte: true,
                poidsTotalKg: true,
                evaluationQualite: true
              },
              orderBy: { dateRecolte: 'desc' },
              take: 10
            }
          }
        })

        if (!culture) return null

        return this.enrichWithStats(culture)
      },
      ttlSeconds
    )
  }

  /**
   * Trouve les cultures par saison
   */
  async findBySaison(
    userId: string,
    anneeSaison: number,
    ttlSeconds: number = 600
  ): Promise<CultureWithVariete[]> {
    const cacheKey = this.getCacheKey('findBySaison', { userId, anneeSaison })
    
    return this.getOrSetCache(
      cacheKey,
      async () => {
        const cultures = await this.prisma.instanceCulture.findMany({
          where: {
            utilisateurId: userId,
            anneeSaison
          },
          include: {
            variete: {
              include: {
                varieteBase: true
              }
            },
            zone: {
              select: {
                id: true,
                nom: true,
                typeZone: true
              }
            }
          },
          orderBy: { dateSemisPrevue: 'asc' }
        })

        return cultures.map(culture => this.enrichWithStats(culture))
      },
      ttlSeconds
    )
  }

  /**
   * Trouve les cultures par étape du cycle de vie
   */
  async findByEtapeCycle(
    userId: string,
    etapes: EtapeCycleVie[],
    ttlSeconds: number = 300
  ): Promise<CultureWithVariete[]> {
    const cacheKey = this.getCacheKey('findByEtapeCycle', { userId, etapes })
    
    return this.getOrSetCache(
      cacheKey,
      async () => {
        const cultures = await this.prisma.instanceCulture.findMany({
          where: {
            utilisateurId: userId,
            estActive: true,
            etapeCycleVie: { in: etapes }
          },
          include: {
            variete: {
              include: {
                varieteBase: true
              }
            },
            zone: {
              select: {
                id: true,
                nom: true,
                typeZone: true
              }
            }
          },
          orderBy: { dateSemisPrevue: 'asc' }
        })

        return cultures.map(culture => this.enrichWithStats(culture))
      },
      ttlSeconds
    )
  }

  /**
   * Crée une nouvelle culture
   */
  async create(data: CreateCultureInput): Promise<InstanceCulture> {
    // Générer un code lot unique
    const codeLot = this.generateCodeLot(data.nom, data.anneeSaison)
    
    const culture = await this.prisma.instanceCulture.create({
      data: {
        ...data,
        codeLot
      }
    })

    // Assigner la culture à la zone
    await this.prisma.zone.update({
      where: { id: data.zoneId },
      data: { cultureActuelleId: culture.id }
    })

    // Invalider le cache
    await this.invalidateCache()
    await this.cache.delete(`zone:findByIdWithCultures:zoneId:${data.zoneId}`)
    
    return culture
  }

  /**
   * Met à jour une culture
   */
  async update(data: UpdateCultureInput): Promise<InstanceCulture> {
    const { id, ...updateData } = data
    
    const culture = await this.prisma.instanceCulture.update({
      where: { id },
      data: {
        ...updateData,
        // Auto-calculer le taux de survie si les données sont présentes
        ...(updateData.quantiteGermee && updateData.quantitePlantee && {
          tauxSurvie: updateData.quantiteGermee / updateData.quantitePlantee
        })
      }
    })

    // Invalider le cache
    await this.invalidateCache()
    
    return culture
  }

  /**
   * Change l'étape du cycle de vie
   */
  async updateEtapeCycle(
    cultureId: string,
    nouvelleEtape: EtapeCycleVie,
    dateEtape?: Date
  ): Promise<InstanceCulture> {
    const updateData: any = { etapeCycleVie: nouvelleEtape }
    
    // Définir automatiquement les dates selon l'étape
    switch (nouvelleEtape) {
      case EtapeCycleVie.SEME:
        updateData.dateSemisReelle = dateEtape || new Date()
        break
      case EtapeCycleVie.REPIQUE:
        updateData.dateRepiquageReelle = dateEtape || new Date()
        break
      case EtapeCycleVie.RECOLTE:
        updateData.datePremiereRecolte = dateEtape || new Date()
        break
      case EtapeCycleVie.TERMINE:
        updateData.dateFinCycle = dateEtape || new Date()
        updateData.estActive = false
        break
    }

    const culture = await this.prisma.instanceCulture.update({
      where: { id: cultureId },
      data: updateData
    })

    // Si terminé, libérer la zone
    if (nouvelleEtape === EtapeCycleVie.TERMINE) {
      await this.prisma.zone.update({
        where: { id: culture.zoneId },
        data: { cultureActuelleId: null }
      })
    }

    // Invalider le cache
    await this.invalidateCache()
    
    return culture
  }

  /**
   * Obtient le calendrier cultural pour une période
   */
  async getCalendrierCultural(
    userId: string,
    debutPeriode: Date,
    finPeriode: Date,
    ttlSeconds: number = 600
  ): Promise<Array<{
    date: Date
    type: 'semis_prevu' | 'semis_realise' | 'repiquage' | 'recolte' | 'fin_cycle'
    culture: CultureWithVariete
  }>> {
    const cacheKey = this.getCacheKey('getCalendrierCultural', {
      userId,
      debutPeriode: debutPeriode.toISOString(),
      finPeriode: finPeriode.toISOString()
    })
    
    return this.getOrSetCache(
      cacheKey,
      async () => {
        const cultures = await this.prisma.instanceCulture.findMany({
          where: {
            utilisateurId: userId,
            OR: [
              { dateSemisPrevue: { gte: debutPeriode, lte: finPeriode } },
              { dateSemisReelle: { gte: debutPeriode, lte: finPeriode } },
              { dateRepiquagePrevue: { gte: debutPeriode, lte: finPeriode } },
              { dateRepiquageReelle: { gte: debutPeriode, lte: finPeriode } },
              { datePremiereRecolte: { gte: debutPeriode, lte: finPeriode } },
              { dateFinCycle: { gte: debutPeriode, lte: finPeriode } }
            ]
          },
          include: {
            variete: {
              include: {
                varieteBase: true
              }
            },
            zone: {
              select: {
                id: true,
                nom: true,
                typeZone: true
              }
            }
          }
        })

        const evenements: Array<{
          date: Date
          type: 'semis_prevu' | 'semis_realise' | 'repiquage' | 'recolte' | 'fin_cycle'
          culture: CultureWithVariete
        }> = []

        cultures.forEach(culture => {
          const cultureEnrichie = this.enrichWithStats(culture)
          
          if (culture.dateSemisPrevue && culture.dateSemisPrevue >= debutPeriode && culture.dateSemisPrevue <= finPeriode) {
            evenements.push({ date: culture.dateSemisPrevue, type: 'semis_prevu', culture: cultureEnrichie })
          }
          if (culture.dateSemisReelle && culture.dateSemisReelle >= debutPeriode && culture.dateSemisReelle <= finPeriode) {
            evenements.push({ date: culture.dateSemisReelle, type: 'semis_realise', culture: cultureEnrichie })
          }
          if (culture.dateRepiquageReelle && culture.dateRepiquageReelle >= debutPeriode && culture.dateRepiquageReelle <= finPeriode) {
            evenements.push({ date: culture.dateRepiquageReelle, type: 'repiquage', culture: cultureEnrichie })
          }
          if (culture.datePremiereRecolte && culture.datePremiereRecolte >= debutPeriode && culture.datePremiereRecolte <= finPeriode) {
            evenements.push({ date: culture.datePremiereRecolte, type: 'recolte', culture: cultureEnrichie })
          }
          if (culture.dateFinCycle && culture.dateFinCycle >= debutPeriode && culture.dateFinCycle <= finPeriode) {
            evenements.push({ date: culture.dateFinCycle, type: 'fin_cycle', culture: cultureEnrichie })
          }
        })

        return evenements.sort((a, b) => a.date.getTime() - b.date.getTime())
      },
      ttlSeconds
    )
  }

  /**
   * Enrichit une culture avec des statistiques calculées
   */
  private enrichWithStats(culture: any): CultureWithVariete {
    const stats: any = {
      derniereMiseAJour: culture.misAJourA
    }

    // Calculer jours depuis semis
    const dateSemis = culture.dateSemisReelle || culture.dateSemisPrevue
    if (dateSemis) {
      const joursDepuisSemis = Math.floor(
        (Date.now() - dateSemis.getTime()) / (1000 * 60 * 60 * 24)
      )
      stats.joursDepuisSemis = joursDepuisSemis
    }

    // Estimer jours avant récolte (basé sur les infos de la variété)
    const infosCulture = culture.variete?.varieteBase?.infosCulture as any
    if (infosCulture?.joursRecolte && dateSemis) {
      const joursTotal = infosCulture.joursRecolte
      const joursEcoules = stats.joursDepuisSemis || 0
      stats.joursPrevusAvantRecolte = Math.max(0, joursTotal - joursEcoules)
    }

    // Calculer taux de survie
    if (culture.quantitePlantee && culture.quantiteGermee) {
      stats.tauxSurvieCalcule = Math.round((culture.quantiteGermee / culture.quantitePlantee) * 100)
    }

    return {
      ...culture,
      _stats: stats
    }
  }

  /**
   * Génère un code lot unique
   */
  private generateCodeLot(nom: string, anneeSaison: number): string {
    const nomCourt = nom.substring(0, 4).toUpperCase()
    const timestamp = Date.now().toString().slice(-6)
    return `${nomCourt}${anneeSaison}${timestamp}`
  }

  /**
   * Archive une culture (soft delete)
   */
  async archive(cultureId: string): Promise<InstanceCulture> {
    const culture = await this.prisma.instanceCulture.update({
      where: { id: cultureId },
      data: { 
        estActive: false,
        etapeCycleVie: EtapeCycleVie.TERMINE,
        dateFinCycle: new Date()
      }
    })

    // Libérer la zone
    await this.prisma.zone.update({
      where: { id: culture.zoneId },
      data: { cultureActuelleId: null }
    })

    // Invalider le cache
    await this.invalidateCache()
    
    return culture
  }
}