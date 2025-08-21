import { PrismaClient, Jardin, Zone, TypeZone } from '@prisma/client'
import { BaseRepository } from './base.repository'
import { CacheService } from '../cache/cache.service'

export interface JardinWithStats extends Jardin {
  _stats: {
    nombreZones: number
    nombreZonesActives: number
    surfaceCultivableM2: number
    nombreCulturesActives: number
  }
}

export interface CreateJardinInput {
  nom: string
  description?: string
  proprietaireId: string
  localisation: {
    latitude: number
    longitude: number
    altitude?: number
    adresse: string
    ville: string
    region: string
    pays: string
    codePostal: string
    zoneClimatique?: string
  }
  surfaceTotaleM2: number
  typeSol: string
  phSol?: number
  sourceEau: string
  configAmenagement: {
    type: 'structure'
    contenants: Array<{
      id: string
      longueur_m: number
      largeur_m: number
      position: { x: number; y: number }
    }>
  }
}

export interface UpdateJardinInput extends Partial<CreateJardinInput> {
  id: string
}

export class JardinRepository extends BaseRepository<Jardin> {
  constructor(prisma: PrismaClient, cache: CacheService) {
    super(prisma, cache, 'jardin')
  }

  /**
   * Trouve tous les jardins d'un utilisateur
   */
  async findByUserId(userId: string, ttlSeconds: number = 300): Promise<Jardin[]> {
    const cacheKey = this.getCacheKey('findByUserId', { userId })
    
    return this.getOrSetCache(
      cacheKey,
      async () => {
        return await this.prisma.jardin.findMany({
          where: { proprietaireId: userId },
          orderBy: { creeA: 'desc' }
        })
      },
      ttlSeconds
    )
  }

  /**
   * Trouve un jardin avec ses statistiques
   */
  async findByIdWithStats(jardinId: string, ttlSeconds: number = 300): Promise<JardinWithStats | null> {
    const cacheKey = this.getCacheKey('findByIdWithStats', { jardinId })
    
    return this.getOrSetCache(
      cacheKey,
      async () => {
        const jardin = await this.prisma.jardin.findUnique({
          where: { id: jardinId },
          include: {
            zones: {
              include: {
                _count: {
                  select: {
                    instancesCulture: {
                      where: { estActive: true }
                    }
                  }
                }
              }
            }
          }
        })

        if (!jardin) return null

        // Calculer les statistiques
        const stats = {
          nombreZones: jardin.zones.length,
          nombreZonesActives: jardin.zones.filter(z => z.estActive).length,
          surfaceCultivableM2: jardin.zones
            .filter(z => z.estActive)
            .reduce((total, zone) => {
              const geometrie = zone.geometrie as any
              return total + (geometrie.surfaceM2 || 0)
            }, 0),
          nombreCulturesActives: jardin.zones.reduce((total, zone) => {
            return total + (zone._count?.instancesCulture || 0)
          }, 0)
        }

        return {
          ...jardin,
          _stats: stats
        } as JardinWithStats
      },
      ttlSeconds
    )
  }

  /**
   * Crée un nouveau jardin avec zones par défaut
   */
  async create(data: CreateJardinInput): Promise<Jardin> {
    const jardin = await this.prisma.jardin.create({
      data: {
        nom: data.nom,
        description: data.description,
        proprietaireId: data.proprietaireId,
        localisation: data.localisation,
        surfaceTotaleM2: data.surfaceTotaleM2,
        typeSol: data.typeSol as any,
        phSol: data.phSol,
        sourceEau: data.sourceEau as any,
        configAmenagement: data.configAmenagement
      }
    })

    // Créer les zones par défaut basées sur la configuration Sacha
    if (data.configAmenagement.type === 'structure') {
      const zonesPromises = data.configAmenagement.contenants.map((contenant, index) => {
        return this.prisma.zone.create({
          data: {
            jardinId: jardin.id,
            nom: `Bac ${index + 1}`,
            typeZone: TypeZone.BAC,
            geometrie: {
              type: 'rectangle',
              coordonnees: [contenant.position.x, contenant.position.y],
              surfaceM2: contenant.longueur_m * contenant.largeur_m
            },
            expositionSoleil: 'PLEIN_SOLEIL',
            accesEau: 'FACILE',
            qualiteSol: 4
          }
        })
      })

      await Promise.all(zonesPromises)
    }

    // Invalider le cache
    await this.invalidateCache()
    await this.cache.delete(`zone:findByJardinId:jardinId:${jardin.id}`)

    return jardin
  }

  /**
   * Met à jour un jardin
   */
  async update(data: UpdateJardinInput): Promise<Jardin> {
    const { id, ...updateData } = data
    
    const jardin = await this.prisma.jardin.update({
      where: { id },
      data: updateData
    })

    // Invalider le cache
    await this.invalidateCache()
    
    return jardin
  }

  /**
   * Supprime un jardin (soft delete en gardant l'historique)
   */
  async delete(jardinId: string): Promise<boolean> {
    // Marquer comme inactif plutôt que supprimer
    await this.prisma.jardin.update({
      where: { id: jardinId },
      data: {
        zones: {
          updateMany: {
            where: { jardinId },
            data: { estActive: false }
          }
        }
      }
    })

    // Invalider le cache
    await this.invalidateCache()
    
    return true
  }

  /**
   * Obtient les jardins avec leurs dernières activités
   */
  async findByUserIdWithActivity(
    userId: string,
    ttlSeconds: number = 600
  ): Promise<Array<Jardin & { derniereActivite?: Date; nombreActivitesRecentes: number }>> {
    const cacheKey = this.getCacheKey('findByUserIdWithActivity', { userId })
    
    return this.getOrSetCache(
      cacheKey,
      async () => {
        const jardins = await this.prisma.jardin.findMany({
          where: { proprietaireId: userId },
          include: {
            zones: {
              include: {
                recoltes: {
                  take: 1,
                  orderBy: { dateRecolte: 'desc' },
                  select: { dateRecolte: true }
                },
                interventions: {
                  take: 1,
                  orderBy: { dateReelle: 'desc' },
                  select: { dateReelle: true }
                },
                _count: {
                  select: {
                    recoltes: {
                      where: {
                        dateRecolte: {
                          gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // 7 derniers jours
                        }
                      }
                    },
                    interventions: {
                      where: {
                        dateReelle: {
                          gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // 7 derniers jours
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        })

        return jardins.map(jardin => {
          // Trouver la dernière activité (récolte ou intervention)
          const dernieresActivites: Date[] = []
          
          jardin.zones.forEach(zone => {
            if (zone.recoltes[0]) {
              dernieresActivites.push(zone.recoltes[0].dateRecolte)
            }
            if (zone.interventions[0]) {
              dernieresActivites.push(zone.interventions[0].dateReelle)
            }
          })

          const derniereActivite = dernieresActivites.length > 0 
            ? new Date(Math.max(...dernieresActivites.map(d => d.getTime())))
            : undefined

          const nombreActivitesRecentes = jardin.zones.reduce((total, zone) => {
            return total + (zone._count.recoltes + zone._count.interventions)
          }, 0)

          return {
            ...jardin,
            derniereActivite,
            nombreActivitesRecentes
          }
        })
      },
      ttlSeconds
    )
  }

  /**
   * Recherche de jardins par critères géographiques
   */
  async searchByLocation(
    latitude: number,
    longitude: number,
    radiusKm: number = 50,
    ttlSeconds: number = 1800
  ): Promise<Jardin[]> {
    const cacheKey = this.getCacheKey('searchByLocation', {
      latitude,
      longitude,
      radiusKm
    })
    
    return this.getOrSetCache(
      cacheKey,
      async () => {
        // Requête SQL brute pour recherche géospatiale
        // Cette requête sera optimisée quand PostGIS sera ajouté
        const jardins = await this.prisma.$queryRaw`
          SELECT * FROM jardins j
          WHERE (
            6371 * acos(
              cos(radians(${latitude})) 
              * cos(radians(CAST(j.localisation->>'latitude' AS FLOAT))) 
              * cos(radians(CAST(j.localisation->>'longitude' AS FLOAT)) - radians(${longitude})) 
              + sin(radians(${latitude})) 
              * sin(radians(CAST(j.localisation->>'latitude' AS FLOAT)))
            )
          ) <= ${radiusKm}
          ORDER BY (
            6371 * acos(
              cos(radians(${latitude})) 
              * cos(radians(CAST(j.localisation->>'latitude' AS FLOAT))) 
              * cos(radians(CAST(j.localisation->>'longitude' AS FLOAT)) - radians(${longitude})) 
              + sin(radians(${latitude})) 
              * sin(radians(CAST(j.localisation->>'latitude' AS FLOAT)))
            )
          ) ASC
        `
        
        return jardins as Jardin[]
      },
      ttlSeconds
    )
  }
}