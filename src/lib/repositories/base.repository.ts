import { PrismaClient } from '@prisma/client'
import { CacheService } from '../cache/cache.service'

export abstract class BaseRepository<TModel> {
  protected prisma: PrismaClient
  protected cache: CacheService
  protected modelName: string

  constructor(prisma: PrismaClient, cache: CacheService, modelName: string) {
    this.prisma = prisma
    this.cache = cache
    this.modelName = modelName
  }

  /**
   * Génère une clé de cache standardisée
   */
  protected getCacheKey(operation: string, params: Record<string, unknown> = {}): string {
    const paramString = Object.keys(params)
      .sort()
      .map(key => `${key}:${params[key]}`)
      .join('|')
    
    return `${this.modelName}:${operation}:${paramString}`
  }

  /**
   * Récupère ou met en cache avec une fonction fetcher
   */
  protected async getOrSetCache<T>(
    key: string,
    fetcher: () => Promise<T>,
    ttlSeconds: number = 300
  ): Promise<T> {
    return this.cache.getOrSet(key, fetcher, ttlSeconds)
  }

  /**
   * Invalide le cache pour ce modèle
   */
  protected async invalidateCache(pattern?: string): Promise<void> {
    const cachePattern = pattern || `${this.modelName}:*`
    await this.cache.invalidatePattern(cachePattern)
  }

  /**
   * Méthode de base pour trouver par ID avec cache
   */
  async findById(id: string, ttlSeconds: number = 300): Promise<TModel | null> {
    const cacheKey = this.getCacheKey('findById', { id })
    
    return this.getOrSetCache(
      cacheKey,
      async () => {
        // @ts-expect-error - Generic Prisma call
        return await this.prisma[this.modelName].findUnique({
          where: { id }
        })
      },
      ttlSeconds
    )
  }

  /**
   * Méthode de base pour compter avec cache
   */
  async count(where: Record<string, unknown> = {}, ttlSeconds: number = 600): Promise<number> {
    const cacheKey = this.getCacheKey('count', { where: JSON.stringify(where) })
    
    return this.getOrSetCache(
      cacheKey,
      async () => {
        // @ts-expect-error - Generic Prisma call
        return await this.prisma[this.modelName].count({ where })
      },
      ttlSeconds
    )
  }

  /**
   * Méthode de base pour lister avec pagination et cache
   */
  async findMany(
    where: Record<string, unknown> = {},
    orderBy: Record<string, unknown> = {},
    take?: number,
    skip?: number,
    ttlSeconds: number = 300
  ): Promise<TModel[]> {
    const cacheKey = this.getCacheKey('findMany', {
      where: JSON.stringify(where),
      orderBy: JSON.stringify(orderBy),
      take,
      skip
    })
    
    return this.getOrSetCache(
      cacheKey,
      async () => {
        // @ts-expect-error - Generic Prisma call
        return await this.prisma[this.modelName].findMany({
          where,
          orderBy,
          take,
          skip
        })
      },
      ttlSeconds
    )
  }
}