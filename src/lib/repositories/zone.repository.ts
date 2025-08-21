import { PrismaClient, Zone, TypeZone, ExpositionSoleil, AccesEau } from '@prisma/client'
import { BaseRepository } from './base.repository'
import { CacheService } from '../cache/cache.service'

export interface ZoneWithCultures extends Zone {
  instancesCulture: Array<{
    id: string
    nom: string
    etapeCycleVie: string
    variete: {
      nomPersonnalise?: string
      varieteBase: {
        nomCommun: string
      }
    }
  }>
  _stats: {
    nombreCultures: number
    nombreCulturesActives: number
    tauxOccupation: number
  }
}

export interface CreateZoneInput {
  nom: string
  jardinId: string
  typeZone: TypeZone
  geometrie: {
    type: string
    coordonnees: number[] | number[][]
    surfaceM2: number
  }
  expositionSoleil: ExpositionSoleil
  accesEau: AccesEau
  qualiteSol: number
}

export interface UpdateZoneInput extends Partial<CreateZoneInput> {
  id: string
}

export class ZoneRepository extends BaseRepository<Zone> {
  constructor(prisma: PrismaClient, cache: CacheService) {
    super(prisma, cache, 'zone')
  }

  /**
   * Trouve toutes les zones d'un jardin
   */
  async findByJardinId(jardinId: string, ttlSeconds: number = 300): Promise<Zone[]> {
    const cacheKey = this.getCacheKey('findByJardinId', { jardinId })
    
    return this.getOrSetCache(
      cacheKey,
      async () => {
        return await this.prisma.zone.findMany({
          where: { jardinId, estActive: true },
          orderBy: { nom: 'asc' }
        })
      },
      ttlSeconds
    )
  }

  /**
   * Trouve une zone avec ses cultures actives
   */
  async findByIdWithCultures(zoneId: string, ttlSeconds: number = 300): Promise<ZoneWithCultures | null> {
    const cacheKey = this.getCacheKey('findByIdWithCultures', { zoneId })
    
    return this.getOrSetCache(
      cacheKey,
      async () => {
        const zone = await this.prisma.zone.findUnique({
          where: { id: zoneId },
          include: {
            instancesCulture: {
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
              },
              orderBy: { creeA: 'desc' }
            }
          }
        })

        if (!zone) return null

        // Calculer les statistiques
        const nombreCultures = zone.instancesCulture.length
        const nombreCulturesActives = zone.instancesCulture.filter(c => c.estActive).length
        const geometrie = zone.geometrie as any
        const surfaceM2 = geometrie.surfaceM2 || 1
        
        // Estimer le taux d'occupation basé sur le nombre de cultures actives
        // et la surface (approximation simple)
        const tauxOccupation = Math.min((nombreCulturesActives * 2) / Math.max(surfaceM2 / 5, 1), 1) * 100

        const stats = {
          nombreCultures,
          nombreCulturesActives,
          tauxOccupation: Math.round(tauxOccupation)
        }

        return {
          ...zone,
          _stats: stats
        } as ZoneWithCultures
      },
      ttlSeconds
    )
  }

  /**
   * Trouve les zones disponibles pour nouvelle culture
   */
  async findAvailableZones(jardinId: string, ttlSeconds: number = 300): Promise<Zone[]> {
    const cacheKey = this.getCacheKey('findAvailableZones', { jardinId })
    
    return this.getOrSetCache(
      cacheKey,
      async () => {
        return await this.prisma.zone.findMany({
          where: {
            jardinId,
            estActive: true,
            OR: [
              { cultureActuelleId: null },
              {
                cultureActuelle: {
                  etapeCycleVie: {
                    in: ['TERMINE', 'RECOLTE']
                  }
                }
              }
            ]
          },
          include: {
            cultureActuelle: {
              select: {
                id: true,
                nom: true,
                etapeCycleVie: true,
                dateFinCycle: true
              }
            },
            _count: {
              select: {
                instancesCulture: {
                  where: { estActive: true }
                }
              }
            }
          },
          orderBy: { nom: 'asc' }
        })
      },
      ttlSeconds
    )
  }

  /**
   * Crée une nouvelle zone
   */
  async create(data: CreateZoneInput): Promise<Zone> {
    const zone = await this.prisma.zone.create({
      data
    })

    // Invalider le cache
    await this.invalidateCache()
    await this.cache.delete(`jardin:findByIdWithStats:jardinId:${data.jardinId}`)
    
    return zone
  }

  /**
   * Met à jour une zone
   */
  async update(data: UpdateZoneInput): Promise<Zone> {
    const { id, ...updateData } = data
    
    const zone = await this.prisma.zone.update({
      where: { id },
      data: updateData
    })

    // Invalider le cache
    await this.invalidateCache()
    await this.cache.delete(`jardin:findByIdWithStats:jardinId:${zone.jardinId}`)
    
    return zone
  }

  /**
   * Assigne une culture à une zone
   */
  async assignCulture(zoneId: string, instanceCultureId: string): Promise<Zone> {
    const zone = await this.prisma.zone.update({
      where: { id: zoneId },
      data: { cultureActuelleId: instanceCultureId }
    })

    // Invalider le cache
    await this.invalidateCache()
    
    return zone
  }

  /**
   * Libère une zone (retire la culture actuelle)
   */
  async releaseCulture(zoneId: string): Promise<Zone> {
    const zone = await this.prisma.zone.update({
      where: { id: zoneId },
      data: { cultureActuelleId: null }
    })

    // Invalider le cache
    await this.invalidateCache()
    
    return zone
  }

  /**
   * Obtient les statistiques d'utilisation des zones
   */
  async getUtilizationStats(
    jardinId: string,
    ttlSeconds: number = 600
  ): Promise<{
    totalZones: number
    zonesActives: number
    zonesOccupees: number
    zonesLibres: number
    surfaceTotaleM2: number
    surfaceOccupeeM2: number
    tauxOccupationGlobal: number
    repartitionParType: Record<string, number>
  }> {
    const cacheKey = this.getCacheKey('getUtilizationStats', { jardinId })
    
    return this.getOrSetCache(
      cacheKey,
      async () => {
        const zones = await this.prisma.zone.findMany({
          where: { jardinId },
          include: {
            instancesCulture: {
              where: { estActive: true },
              select: { id: true }
            }
          }
        })

        const stats = {
          totalZones: zones.length,
          zonesActives: zones.filter(z => z.estActive).length,
          zonesOccupees: zones.filter(z => z.cultureActuelleId !== null).length,
          zonesLibres: zones.filter(z => z.estActive && z.cultureActuelleId === null).length,
          surfaceTotaleM2: 0,
          surfaceOccupeeM2: 0,
          tauxOccupationGlobal: 0,
          repartitionParType: {} as Record<string, number>
        }

        zones.forEach(zone => {
          const geometrie = zone.geometrie as any
          const surfaceM2 = geometrie.surfaceM2 || 0
          
          stats.surfaceTotaleM2 += surfaceM2
          
          if (zone.cultureActuelleId) {
            stats.surfaceOccupeeM2 += surfaceM2
          }
          
          // Compter par type
          const typeZone = zone.typeZone
          stats.repartitionParType[typeZone] = (stats.repartitionParType[typeZone] || 0) + 1
        })

        stats.tauxOccupationGlobal = stats.surfaceTotaleM2 > 0 
          ? Math.round((stats.surfaceOccupeeM2 / stats.surfaceTotaleM2) * 100)
          : 0

        return stats
      },
      ttlSeconds
    )
  }

  /**
   * Recherche zones par critères
   */
  async search(
    jardinId: string,
    filters: {
      typeZone?: TypeZone[]
      expositionSoleil?: ExpositionSoleil[]
      accesEau?: AccesEau[]
      qualiteSolMin?: number
      estDisponible?: boolean
    },
    ttlSeconds: number = 300
  ): Promise<Zone[]> {
    const cacheKey = this.getCacheKey('search', { jardinId, filters })
    
    return this.getOrSetCache(
      cacheKey,
      async () => {
        const whereClause: any = {
          jardinId,
          estActive: true
        }

        if (filters.typeZone?.length) {
          whereClause.typeZone = { in: filters.typeZone }
        }

        if (filters.expositionSoleil?.length) {
          whereClause.expositionSoleil = { in: filters.expositionSoleil }
        }

        if (filters.accesEau?.length) {
          whereClause.accesEau = { in: filters.accesEau }
        }

        if (filters.qualiteSolMin !== undefined) {
          whereClause.qualiteSol = { gte: filters.qualiteSolMin }
        }

        if (filters.estDisponible === true) {
          whereClause.OR = [
            { cultureActuelleId: null },
            {
              cultureActuelle: {
                etapeCycleVie: {
                  in: ['TERMINE', 'RECOLTE']
                }
              }
            }
          ]
        }

        return await this.prisma.zone.findMany({
          where: whereClause,
          include: {
            cultureActuelle: {
              select: {
                id: true,
                nom: true,
                etapeCycleVie: true
              }
            }
          },
          orderBy: [
            { qualiteSol: 'desc' },
            { nom: 'asc' }
          ]
        })
      },
      ttlSeconds
    )
  }

  /**
   * Désactive une zone (soft delete)
   */
  async deactivate(zoneId: string): Promise<Zone> {
    const zone = await this.prisma.zone.update({
      where: { id: zoneId },
      data: { 
        estActive: false,
        cultureActuelleId: null
      }
    })

    // Invalider le cache
    await this.invalidateCache()
    
    return zone
  }
}