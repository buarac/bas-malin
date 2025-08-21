import { PrismaClient, Recolte, DestinationUsage } from '@prisma/client'
import { BaseRepository } from './base.repository'
import { CacheService } from '../cache/cache.service'

export interface RecolteWithDetails extends Recolte {
  instanceCulture?: {
    id: string
    nom: string
    variete: {
      nomPersonnalise?: string
      varieteBase: {
        nomCommun: string
        categorie: string
      }
    }
  }
  zone: {
    id: string
    nom: string
    typeZone: string
  }
  _analytics?: {
    rendementParM2?: number
    valeurParKg?: number
    scoreQualiteGlobal?: number
    comparaisonPrecedente?: {
      poidsEvolution: number
      qualiteEvolution: number
    }
  }
}

export interface CreateRecolteInput {
  utilisateurId: string
  instanceCultureId?: string
  zoneId: string
  dateRecolte: Date
  heureRecolte?: Date
  poidsTotalKg: number
  quantiteUnites?: number
  valeurMarcheEstimee?: number
  evaluationQualite?: {
    noteGenerale: number
    noteTaille: number
    noteGout: number
    noteApparence: number
    notes?: string
  }
  reconnaissanceIA?: any
  photos?: Array<{
    url: string
    legende?: string
    analyseeIA?: boolean
    donneesReconnaissance?: any
  }>
  destinationUsage?: DestinationUsage
  methodeStockage?: string
  dureeStockagePrevueJours?: number
  localisationRecolte?: {
    latitude: number
    longitude: number
    precisionMetres?: number
  }
  meteoARecolte?: any
  notes?: string
}

export interface RecolteStats {
  periodeDu: Date
  periodeAu: Date
  nombreRecoltes: number
  poidsTotalKg: number
  poidsMinKg: number
  poidsMaxKg: number
  poidsMoyenKg: number
  valeurTotaleEstimee: number
  noteQualiteMoyenne: number
  varietesRecoltees: Array<{
    variete: string
    nombreRecoltes: number
    poidsTotalKg: number
    pourcentageTotal: number
  }>
  evolutionMensuelle: Array<{
    mois: string
    nombreRecoltes: number
    poidsTotalKg: number
  }>
}

export class RecolteRepository extends BaseRepository<Recolte> {
  constructor(prisma: PrismaClient, cache: CacheService) {
    super(prisma, cache, 'recolte')
  }

  /**
   * Trouve toutes les récoltes d'un utilisateur
   */
  async findByUserId(
    userId: string,
    limit?: number,
    ttlSeconds: number = 300
  ): Promise<RecolteWithDetails[]> {
    const cacheKey = this.getCacheKey('findByUserId', { userId, limit })
    
    return this.getOrSetCache(
      cacheKey,
      async () => {
        const recoltes = await this.prisma.recolte.findMany({
          where: { utilisateurId: userId },
          include: {
            instanceCulture: {
              include: {
                variete: {
                  include: {
                    varieteBase: {
                      select: {
                        nomCommun: true,
                        categorie: true
                      }
                    }
                  }
                }
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
          orderBy: { dateRecolte: 'desc' },
          take: limit
        })

        return await Promise.all(recoltes.map(recolte => this.enrichWithAnalytics(recolte)))
      },
      ttlSeconds
    )
  }

  /**
   * Trouve les récoltes par culture
   */
  async findByCultureId(cultureId: string, ttlSeconds: number = 300): Promise<RecolteWithDetails[]> {
    const cacheKey = this.getCacheKey('findByCultureId', { cultureId })
    
    return this.getOrSetCache(
      cacheKey,
      async () => {
        const recoltes = await this.prisma.recolte.findMany({
          where: { instanceCultureId: cultureId },
          include: {
            instanceCulture: {
              include: {
                variete: {
                  include: {
                    varieteBase: {
                      select: {
                        nomCommun: true,
                        categorie: true
                      }
                    }
                  }
                }
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
          orderBy: { dateRecolte: 'desc' }
        })

        return await Promise.all(recoltes.map(recolte => this.enrichWithAnalytics(recolte)))
      },
      ttlSeconds
    )
  }

  /**
   * Trouve les récoltes par zone
   */
  async findByZoneId(zoneId: string, ttlSeconds: number = 300): Promise<RecolteWithDetails[]> {
    const cacheKey = this.getCacheKey('findByZoneId', { zoneId })
    
    return this.getOrSetCache(
      cacheKey,
      async () => {
        const recoltes = await this.prisma.recolte.findMany({
          where: { zoneId },
          include: {
            instanceCulture: {
              include: {
                variete: {
                  include: {
                    varieteBase: {
                      select: {
                        nomCommun: true,
                        categorie: true
                      }
                    }
                  }
                }
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
          orderBy: { dateRecolte: 'desc' }
        })

        return await Promise.all(recoltes.map(recolte => this.enrichWithAnalytics(recolte)))
      },
      ttlSeconds
    )
  }

  /**
   * Obtient les statistiques de récoltes pour une période
   */
  async getStats(
    userId: string,
    debutPeriode: Date,
    finPeriode: Date,
    ttlSeconds: number = 600
  ): Promise<RecolteStats> {
    const cacheKey = this.getCacheKey('getStats', {
      userId,
      debutPeriode: debutPeriode.toISOString(),
      finPeriode: finPeriode.toISOString()
    })
    
    return this.getOrSetCache(
      cacheKey,
      async () => {
        const recoltes = await this.prisma.recolte.findMany({
          where: {
            utilisateurId: userId,
            dateRecolte: {
              gte: debutPeriode,
              lte: finPeriode
            }
          },
          include: {
            instanceCulture: {
              include: {
                variete: {
                  include: {
                    varieteBase: {
                      select: {
                        nomCommun: true
                      }
                    }
                  }
                }
              }
            }
          }
        })

        // Calculs statistiques
        const nombreRecoltes = recoltes.length
        const poids = recoltes.map(r => Number(r.poidsTotalKg))
        const valeurs = recoltes.map(r => Number(r.valeurMarcheEstimee || 0))
        const qualites = recoltes
          .map(r => {
            const evaluation = r.evaluationQualite as any
            return evaluation?.noteGenerale || 0
          })
          .filter(q => q > 0)

        // Statistiques par variété
        const varietesMap = new Map<string, { nombre: number; poids: number }>()
        recoltes.forEach(recolte => {
          const nomVariete = recolte.instanceCulture?.variete?.varieteBase?.nomCommun || 'Inconnue'
          const existing = varietesMap.get(nomVariete) || { nombre: 0, poids: 0 }
          varietesMap.set(nomVariete, {
            nombre: existing.nombre + 1,
            poids: existing.poids + Number(recolte.poidsTotalKg)
          })
        })

        const poidsTotalKg = poids.reduce((sum, p) => sum + p, 0)
        const varietesRecoltees = Array.from(varietesMap.entries()).map(([variete, stats]) => ({
          variete,
          nombreRecoltes: stats.nombre,
          poidsTotalKg: stats.poids,
          pourcentageTotal: poidsTotalKg > 0 ? Math.round((stats.poids / poidsTotalKg) * 100) : 0
        }))

        // Évolution mensuelle
        const moisMap = new Map<string, { nombre: number; poids: number }>()
        recoltes.forEach(recolte => {
          const mois = recolte.dateRecolte.toISOString().substring(0, 7) // YYYY-MM
          const existing = moisMap.get(mois) || { nombre: 0, poids: 0 }
          moisMap.set(mois, {
            nombre: existing.nombre + 1,
            poids: existing.poids + Number(recolte.poidsTotalKg)
          })
        })

        const evolutionMensuelle = Array.from(moisMap.entries()).map(([mois, stats]) => ({
          mois,
          nombreRecoltes: stats.nombre,
          poidsTotalKg: stats.poids
        })).sort((a, b) => a.mois.localeCompare(b.mois))

        return {
          periodeDu: debutPeriode,
          periodeAu: finPeriode,
          nombreRecoltes,
          poidsTotalKg,
          poidsMinKg: poids.length > 0 ? Math.min(...poids) : 0,
          poidsMaxKg: poids.length > 0 ? Math.max(...poids) : 0,
          poidsMoyenKg: poids.length > 0 ? poids.reduce((sum, p) => sum + p, 0) / poids.length : 0,
          valeurTotaleEstimee: valeurs.reduce((sum, v) => sum + v, 0),
          noteQualiteMoyenne: qualites.length > 0 ? qualites.reduce((sum, q) => sum + q, 0) / qualites.length : 0,
          varietesRecoltees,
          evolutionMensuelle
        }
      },
      ttlSeconds
    )
  }

  /**
   * Crée une nouvelle récolte
   */
  async create(data: CreateRecolteInput): Promise<Recolte> {
    const recolte = await this.prisma.recolte.create({
      data: {
        ...data,
        heureRecolte: data.heureRecolte || data.dateRecolte
      }
    })

    // Invalider les caches liés
    await this.invalidateCache()
    await this.cache.invalidatePattern(`instanceCulture:*`)
    await this.cache.invalidatePattern(`zone:*`)
    
    return recolte
  }

  /**
   * Met à jour une récolte
   */
  async update(id: string, data: Partial<CreateRecolteInput>): Promise<Recolte> {
    const recolte = await this.prisma.recolte.update({
      where: { id },
      data
    })

    // Invalider le cache
    await this.invalidateCache()
    
    return recolte
  }

  /**
   * Enrichit une récolte avec des analytics calculés
   */
  private async enrichWithAnalytics(recolte: any): Promise<RecolteWithDetails> {
    // Calculer rendement par m²
    let rendementParM2: number | undefined
    if (recolte.zone?.geometrie) {
      const geometrie = recolte.zone.geometrie as any
      if (geometrie.surfaceM2) {
        rendementParM2 = Number(recolte.poidsTotalKg) / geometrie.surfaceM2
      }
    }

    // Calculer valeur par kg
    let valeurParKg: number | undefined
    if (recolte.valeurMarcheEstimee && Number(recolte.poidsTotalKg) > 0) {
      valeurParKg = Number(recolte.valeurMarcheEstimee) / Number(recolte.poidsTotalKg)
    }

    // Score qualité global
    let scoreQualiteGlobal: number | undefined
    const evaluationQualite = recolte.evaluationQualite as any
    if (evaluationQualite) {
      const notes = [
        evaluationQualite.noteGenerale,
        evaluationQualite.noteTaille,
        evaluationQualite.noteGout,
        evaluationQualite.noteApparence
      ].filter(n => n && n > 0)
      
      if (notes.length > 0) {
        scoreQualiteGlobal = notes.reduce((sum, note) => sum + note, 0) / notes.length
      }
    }

    const analytics = {
      rendementParM2,
      valeurParKg,
      scoreQualiteGlobal
    }

    return {
      ...recolte,
      _analytics: analytics
    }
  }

  /**
   * Trouve les meilleures récoltes par critère
   */
  async findTopRecoltes(
    userId: string,
    critere: 'poids' | 'qualite' | 'valeur',
    limit: number = 10,
    ttlSeconds: number = 600
  ): Promise<RecolteWithDetails[]> {
    const cacheKey = this.getCacheKey('findTopRecoltes', { userId, critere, limit })
    
    return this.getOrSetCache(
      cacheKey,
      async () => {
        const orderBy: any = {}
        
        switch (critere) {
          case 'poids':
            orderBy.poidsTotalKg = 'desc'
            break
          case 'valeur':
            orderBy.valeurMarcheEstimee = 'desc'
            break
          case 'qualite':
            // Pour la qualité, on doit utiliser une requête plus complexe
            const recoltes = await this.prisma.recolte.findMany({
              where: { 
                utilisateurId: userId,
                evaluationQualite: { not: null }
              },
              include: {
                instanceCulture: {
                  include: {
                    variete: {
                      include: {
                        varieteBase: {
                          select: {
                            nomCommun: true,
                            categorie: true
                          }
                        }
                      }
                    }
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

            // Trier par score qualité calculé
            const recoltesAvecScore = await Promise.all(
              recoltes.map(async r => await this.enrichWithAnalytics(r))
            )
            
            return recoltesAvecScore
              .filter(r => r._analytics?.scoreQualiteGlobal)
              .sort((a, b) => (b._analytics?.scoreQualiteGlobal || 0) - (a._analytics?.scoreQualiteGlobal || 0))
              .slice(0, limit)
        }

        const recoltes = await this.prisma.recolte.findMany({
          where: { utilisateurId: userId },
          include: {
            instanceCulture: {
              include: {
                variete: {
                  include: {
                    varieteBase: {
                      select: {
                        nomCommun: true,
                        categorie: true
                      }
                    }
                  }
                }
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
          orderBy,
          take: limit
        })

        return await Promise.all(recoltes.map(recolte => this.enrichWithAnalytics(recolte)))
      },
      ttlSeconds
    )
  }

  /**
   * Obtient les statistiques de récoltes détaillées
   */
  async getDetailedStats(
    userId: string,
    debutPeriode: Date,
    finPeriode: Date,
    ttlSeconds: number = 600
  ): Promise<RecolteStats> {
    const cacheKey = this.getCacheKey('getDetailedStats', {
      userId,
      debutPeriode: debutPeriode.toISOString(),
      finPeriode: finPeriode.toISOString()
    })
    
    return this.getOrSetCache(
      cacheKey,
      async () => {
        const recoltes = await this.prisma.recolte.findMany({
          where: {
            utilisateurId: userId,
            dateRecolte: {
              gte: debutPeriode,
              lte: finPeriode
            }
          },
          include: {
            instanceCulture: {
              include: {
                variete: {
                  include: {
                    varieteBase: {
                      select: {
                        nomCommun: true
                      }
                    }
                  }
                }
              }
            }
          }
        })

        const nombreRecoltes = recoltes.length
        const poids = recoltes.map(r => Number(r.poidsTotalKg))
        const valeurs = recoltes.map(r => Number(r.valeurMarcheEstimee || 0))
        const qualites = recoltes
          .map(r => {
            const evaluation = r.evaluationQualite as any
            return evaluation?.noteGenerale || 0
          })
          .filter(q => q > 0)

        // Statistiques par variété
        const varietesMap = new Map<string, { nombre: number; poids: number }>()
        recoltes.forEach(recolte => {
          const nomVariete = recolte.instanceCulture?.variete?.varieteBase?.nomCommun || 'Inconnue'
          const existing = varietesMap.get(nomVariete) || { nombre: 0, poids: 0 }
          varietesMap.set(nomVariete, {
            nombre: existing.nombre + 1,
            poids: existing.poids + Number(recolte.poidsTotalKg)
          })
        })

        const poidsTotalKg = poids.reduce((sum, p) => sum + p, 0)
        const varietesRecoltees = Array.from(varietesMap.entries())
          .map(([variete, stats]) => ({
            variete,
            nombreRecoltes: stats.nombre,
            poidsTotalKg: stats.poids,
            pourcentageTotal: poidsTotalKg > 0 ? Math.round((stats.poids / poidsTotalKg) * 100) : 0
          }))
          .sort((a, b) => b.poidsTotalKg - a.poidsTotalKg)

        // Évolution mensuelle
        const moisMap = new Map<string, { nombre: number; poids: number }>()
        recoltes.forEach(recolte => {
          const date = new Date(recolte.dateRecolte)
          const mois = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
          const existing = moisMap.get(mois) || { nombre: 0, poids: 0 }
          moisMap.set(mois, {
            nombre: existing.nombre + 1,
            poids: existing.poids + Number(recolte.poidsTotalKg)
          })
        })

        const evolutionMensuelle = Array.from(moisMap.entries())
          .map(([mois, stats]) => ({
            mois,
            nombreRecoltes: stats.nombre,
            poidsTotalKg: stats.poids
          }))
          .sort((a, b) => a.mois.localeCompare(b.mois))

        return {
          periodeDu: debutPeriode,
          periodeAu: finPeriode,
          nombreRecoltes,
          poidsTotalKg,
          poidsMinKg: poids.length > 0 ? Math.min(...poids) : 0,
          poidsMaxKg: poids.length > 0 ? Math.max(...poids) : 0,
          poidsMoyenKg: poids.length > 0 ? poids.reduce((sum, p) => sum + p, 0) / poids.length : 0,
          valeurTotaleEstimee: valeurs.reduce((sum, v) => sum + v, 0),
          noteQualiteMoyenne: qualites.length > 0 ? qualites.reduce((sum, q) => sum + q, 0) / qualites.length : 0,
          varietesRecoltees,
          evolutionMensuelle
        }
      },
      ttlSeconds
    )
  }

  /**
   * Crée une nouvelle récolte
   */
  async create(data: CreateRecolteInput): Promise<Recolte> {
    const recolte = await this.prisma.recolte.create({
      data
    })

    // Invalider les caches liés
    await this.invalidateCache()
    await this.cache.invalidatePattern(`instanceCulture:*`)
    await this.cache.invalidatePattern(`zone:*`)
    
    return recolte
  }

  /**
   * Met à jour une récolte
   */
  async update(id: string, data: Partial<CreateRecolteInput>): Promise<Recolte> {
    const recolte = await this.prisma.recolte.update({
      where: { id },
      data
    })

    // Invalider le cache
    await this.invalidateCache()
    
    return recolte
  }

  /**
   * Trouve les récoltes récentes pour dashboard
   */
  async findRecentForDashboard(
    userId: string,
    joursRecents: number = 7,
    ttlSeconds: number = 300
  ): Promise<RecolteWithDetails[]> {
    const cacheKey = this.getCacheKey('findRecentForDashboard', { userId, joursRecents })
    
    return this.getOrSetCache(
      cacheKey,
      async () => {
        const dateDebut = new Date(Date.now() - joursRecents * 24 * 60 * 60 * 1000)
        
        const recoltes = await this.prisma.recolte.findMany({
          where: {
            utilisateurId: userId,
            dateRecolte: { gte: dateDebut }
          },
          include: {
            instanceCulture: {
              include: {
                variete: {
                  include: {
                    varieteBase: {
                      select: {
                        nomCommun: true,
                        categorie: true
                      }
                    }
                  }
                }
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
          orderBy: { dateRecolte: 'desc' },
          take: 20
        })

        return await Promise.all(recoltes.map(recolte => this.enrichWithAnalytics(recolte)))
      },
      ttlSeconds
    )
  }
}