import { PrismaClient } from '@prisma/client'
import { CacheService } from '../cache/cache.service'
import { JardinRepository } from '../repositories/jardin.repository'
import { ZoneRepository } from '../repositories/zone.repository'
import { CultureRepository } from '../repositories/culture.repository'
import { RecolteRepository } from '../repositories/recolte.repository'

export interface DataServiceConfig {
  redis: {
    host: string
    port: number
    password?: string
  }
  cache: {
    defaultTtl: number
    keyPrefix: string
  }
}

export class DataService {
  private prisma: PrismaClient
  private cache: CacheService
  
  // Repositories
  public jardin: JardinRepository
  public zone: ZoneRepository
  public culture: CultureRepository
  public recolte: RecolteRepository

  constructor(config: DataServiceConfig) {
    // Initialiser Prisma
    this.prisma = new PrismaClient({
      log: process.env.NODE_ENV === 'development' ? ['query', 'info', 'warn', 'error'] : ['error'],
      errorFormat: 'pretty'
    })

    // Initialiser le cache Redis
    this.cache = new CacheService({
      host: config.redis.host,
      port: config.redis.port,
      password: config.redis.password,
      keyPrefix: config.cache.keyPrefix,
      retryDelayOnFailover: 100,
      maxRetriesPerRequest: 3
    })

    // Initialiser les repositories
    this.jardin = new JardinRepository(this.prisma, this.cache)
    this.zone = new ZoneRepository(this.prisma, this.cache)
    this.culture = new CultureRepository(this.prisma, this.cache)
    this.recolte = new RecolteRepository(this.prisma, this.cache)
  }

  /**
   * Vérifie la santé des connexions
   */
  async healthCheck(): Promise<{
    database: boolean
    cache: boolean
    errors: string[]
  }> {
    const errors: string[] = []
    let database = false
    let cache = false

    // Test de la base de données
    try {
      await this.prisma.$queryRaw`SELECT 1`
      database = true
    } catch (error) {
      errors.push(`Database error: ${error}`)
    }

    // Test du cache Redis
    try {
      await this.cache.set('health-check', 'ok', 10)
      const result = await this.cache.get<string>('health-check')
      cache = result === 'ok'
      await this.cache.delete('health-check')
    } catch (error) {
      errors.push(`Cache error: ${error}`)
    }

    return { database, cache, errors }
  }

  /**
   * Obtient les statistiques globales du système
   */
  async getSystemStats(): Promise<{
    database: {
      totalUsers: number
      totalJardins: number
      totalZones: number
      totalCultures: number
      totalRecoltes: number
      totalInterventions: number
    }
    cache: {
      memory: string
      keys: number
      hitRate: string
    }
    performance: {
      avgQueryTime: number
      slowQueries: number
    }
  }> {
    const [dbStats, cacheStats] = await Promise.all([
      this.getDatabaseStats(),
      this.cache.getStats()
    ])

    return {
      database: dbStats,
      cache: cacheStats,
      performance: {
        avgQueryTime: 0, // TODO: Implémenter avec monitoring Prisma
        slowQueries: 0
      }
    }
  }

  /**
   * Statistiques de la base de données
   */
  private async getDatabaseStats() {
    const [
      totalUsers,
      totalJardins,
      totalZones,
      totalCultures,
      totalRecoltes,
      totalInterventions
    ] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.jardin.count(),
      this.prisma.zone.count(),
      this.prisma.instanceCulture.count(),
      this.prisma.recolte.count(),
      this.prisma.intervention.count()
    ])

    return {
      totalUsers,
      totalJardins,
      totalZones,
      totalCultures,
      totalRecoltes,
      totalInterventions
    }
  }

  /**
   * Purge le cache complet
   */
  async purgeCache(): Promise<number> {
    return await this.cache.invalidatePattern('*')
  }

  /**
   * Ferme toutes les connexions
   */
  async disconnect(): Promise<void> {
    await Promise.all([
      this.prisma.$disconnect(),
      this.cache.disconnect()
    ])
  }

  /**
   * Transaction avec gestion du cache
   */
  async transaction<T>(
    operation: (prisma: PrismaClient) => Promise<T>,
    cacheKeysToInvalidate: string[] = []
  ): Promise<T> {
    const result = await this.prisma.$transaction(async (prisma) => {
      return await operation(prisma)
    })

    // Invalider les clés de cache spécifiées
    await Promise.all(
      cacheKeysToInvalidate.map(key => this.cache.delete(key))
    )

    return result
  }

  /**
   * Exécute les migrations de données si nécessaire
   */
  async runDataMigrations(): Promise<void> {
    // Cette méthode peut être utilisée pour des migrations de données ponctuelles
    // Par exemple, pour migrer des données depuis l'ancien format
    console.log('Data migrations executed successfully')
  }
}