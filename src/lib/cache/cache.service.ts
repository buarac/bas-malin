/* eslint-disable @typescript-eslint/no-explicit-any */
import Redis from 'ioredis'

export interface CacheConfig {
  host: string
  port: number
  password?: string
  keyPrefix?: string
  retryDelayOnFailover?: number
  maxRetriesPerRequest?: number
}

export class CacheService {
  private redis: Redis
  private keyPrefix: string

  constructor(config: CacheConfig) {
    this.keyPrefix = config.keyPrefix || 'basmalin:'
    
    this.redis = new Redis({
      host: config.host,
      port: config.port,
      password: config.password,
      // retryDelayOnFailover: config.retryDelayOnFailover || 100,
      maxRetriesPerRequest: config.maxRetriesPerRequest || 3,
      lazyConnect: true
    } as any)

    this.redis.on('error', (err) => {
      console.error('Redis connection error:', err)
    })

    this.redis.on('connect', () => {
      console.log('Redis connected successfully')
    })
  }

  private formatKey(key: string): string {
    return `${this.keyPrefix}${key}`
  }

  /**
   * Récupère une valeur du cache
   */
  async get<T>(key: string): Promise<T | null> {
    try {
      const formattedKey = this.formatKey(key)
      const value = await this.redis.get(formattedKey)
      
      if (value === null) return null
      
      return JSON.parse(value) as T
    } catch (error) {
      console.error('Cache get error:', error)
      return null
    }
  }

  /**
   * Met une valeur en cache avec TTL
   */
  async set<T>(key: string, value: T, ttlSeconds: number = 300): Promise<boolean> {
    try {
      const formattedKey = this.formatKey(key)
      const serializedValue = JSON.stringify(value)
      
      await this.redis.setex(formattedKey, ttlSeconds, serializedValue)
      return true
    } catch (error) {
      console.error('Cache set error:', error)
      return false
    }
  }

  /**
   * Supprime une clé du cache
   */
  async delete(key: string): Promise<boolean> {
    try {
      const formattedKey = this.formatKey(key)
      const result = await this.redis.del(formattedKey)
      return result > 0
    } catch (error) {
      console.error('Cache delete error:', error)
      return false
    }
  }

  /**
   * Récupère ou met en cache avec une fonction fetcher
   */
  async getOrSet<T>(
    key: string,
    fetcher: () => Promise<T>,
    ttlSeconds: number = 300
  ): Promise<T> {
    // Tentative de récupération depuis le cache
    const cachedValue = await this.get<T>(key)
    if (cachedValue !== null) {
      return cachedValue
    }

    // Si pas en cache, exécuter le fetcher
    const freshValue = await fetcher()
    
    // Mettre en cache pour la prochaine fois
    await this.set(key, freshValue, ttlSeconds)
    
    return freshValue
  }

  /**
   * Invalide toutes les clés correspondant à un pattern
   */
  async invalidatePattern(pattern: string): Promise<number> {
    try {
      const formattedPattern = this.formatKey(pattern)
      const keys = await this.redis.keys(formattedPattern)
      
      if (keys.length === 0) return 0
      
      const result = await this.redis.del(...keys)
      return result
    } catch (error) {
      console.error('Cache invalidate pattern error:', error)
      return 0
    }
  }

  /**
   * Incrémente une valeur numérique
   */
  async increment(key: string, by: number = 1, ttlSeconds?: number): Promise<number> {
    try {
      const formattedKey = this.formatKey(key)
      const result = await this.redis.incrby(formattedKey, by)
      
      if (ttlSeconds !== undefined) {
        await this.redis.expire(formattedKey, ttlSeconds)
      }
      
      return result
    } catch (error) {
      console.error('Cache increment error:', error)
      throw error
    }
  }

  /**
   * Vérifie si une clé existe
   */
  async exists(key: string): Promise<boolean> {
    try {
      const formattedKey = this.formatKey(key)
      const result = await this.redis.exists(formattedKey)
      return result === 1
    } catch (error) {
      console.error('Cache exists error:', error)
      return false
    }
  }

  /**
   * Définit le TTL d'une clé existante
   */
  async expire(key: string, ttlSeconds: number): Promise<boolean> {
    try {
      const formattedKey = this.formatKey(key)
      const result = await this.redis.expire(formattedKey, ttlSeconds)
      return result === 1
    } catch (error) {
      console.error('Cache expire error:', error)
      return false
    }
  }

  /**
   * Obtient des statistiques de cache
   */
  async getStats(): Promise<{
    memory: string
    keys: number
    hits: string
    misses: string
    hitRate: string
  }> {
    try {
      const info = await this.redis.info('memory')
      const keyCount = await this.redis.dbsize()
      const stats = await this.redis.info('stats')
      
      // Parser les infos Redis
      const memoryMatch = info.match(/used_memory_human:([^\r\n]+)/)
      const hitsMatch = stats.match(/keyspace_hits:(\d+)/)
      const missesMatch = stats.match(/keyspace_misses:(\d+)/)
      
      const hits = parseInt(hitsMatch?.[1] || '0')
      const misses = parseInt(missesMatch?.[1] || '0')
      const hitRate = hits + misses > 0 ? ((hits / (hits + misses)) * 100).toFixed(2) : '0'
      
      return {
        memory: memoryMatch?.[1] || 'Unknown',
        keys: keyCount,
        hits: hitsMatch?.[1] || '0',
        misses: missesMatch?.[1] || '0',
        hitRate: `${hitRate}%`
      }
    } catch (error) {
      console.error('Cache stats error:', error)
      return {
        memory: 'Error',
        keys: 0,
        hits: '0',
        misses: '0',
        hitRate: '0%'
      }
    }
  }

  /**
   * Ferme la connexion Redis
   */
  async disconnect(): Promise<void> {
    await this.redis.disconnect()
  }
}