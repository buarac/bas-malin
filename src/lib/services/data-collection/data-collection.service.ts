/**
 * F3.1 - Main Data Collection Service
 * 
 * Orchestrates all data collectors:
 * - Manages collector lifecycle and scheduling
 * - Handles data storage and caching
 * - Triggers enrichment pipeline
 * - Manages multi-device synchronization
 * - Provides real-time collection status
 */

import { EventEmitter } from 'events'
import { PrismaClient } from '@prisma/client'
import Redis from 'ioredis'

import { BaseCollector, CollectionResult } from './base-collector'
import { IoTCollector, IoTCollectorConfig } from './collectors/iot-collector'
import { WeatherCollector, WeatherCollectorConfig } from './collectors/weather-collector'
import { PhotoCollector, PhotoCollectorConfig } from './collectors/photo-collector'
import { ManualDataCollector, ManualDataCollectorConfig } from './collectors/manual-data-collector'

export interface DataCollectionServiceConfig {
  gardenId: string
  userId: string
  deviceId: string
  collectors: {
    iot?: IoTCollectorConfig
    weather?: WeatherCollectorConfig
    photo?: PhotoCollectorConfig
    manual?: ManualDataCollectorConfig
  }
  storage: {
    enableCache: boolean
    cacheTTL: number // seconds
    batchSize: number
    compressionEnabled: boolean
  }
  enrichment: {
    autoTrigger: boolean
    batchProcessing: boolean
    priorityTypes: string[] // Which data types to prioritize for enrichment
  }
  sync: {
    enableRealtime: boolean
    syncIntervalMs: number
    maxRetries: number
  }
}

export interface CollectionStatus {
  isRunning: boolean
  activeCollectors: string[]
  lastCollectionTimes: { [collectorType: string]: Date }
  collectionsToday: number
  errorsToday: number
  totalDataSize: number // bytes
  healthStatus: {
    overall: 'healthy' | 'warning' | 'error'
    collectors: { [type: string]: 'healthy' | 'warning' | 'error' }
    issues: string[]
  }
}

export interface DataCollectionMetrics {
  totalCollections: number
  successfulCollections: number
  failedCollections: number
  averageCollectionTime: number
  dataVolumeBytes: number
  enrichmentsPending: number
  syncsPending: number
  collectorMetrics: { [type: string]: Record<string, unknown> }
}

/**
 * Main Data Collection Service
 */
export class DataCollectionService extends EventEmitter {
  private prisma: PrismaClient
  private redis: Redis
  private collectors = new Map<string, BaseCollector>()
  private collectionIntervals = new Map<string, NodeJS.Timeout>()
  private isRunning = false
  private metrics: DataCollectionMetrics

  constructor(
    private config: DataCollectionServiceConfig,
    prismaClient?: PrismaClient,
    redisClient?: Redis
  ) {
    super()
    this.prisma = prismaClient || new PrismaClient()
    this.redis = redisClient || new Redis(process.env.REDIS_URL || 'redis://localhost:6379')
    
    this.metrics = {
      totalCollections: 0,
      successfulCollections: 0,
      failedCollections: 0,
      averageCollectionTime: 0,
      dataVolumeBytes: 0,
      enrichmentsPending: 0,
      syncsPending: 0,
      collectorMetrics: {}
    }

    this.initializeCollectors()
    this.setupEventHandlers()
  }

  /**
   * Initialize all configured collectors
   */
  private initializeCollectors(): void {
    const { collectors } = this.config

    // Initialize IoT collector
    if (collectors.iot?.enabled) {
      const iotCollector = new IoTCollector(collectors.iot)
      this.collectors.set('iot', iotCollector)
      this.emit('collectorInitialized', { type: 'iot', config: collectors.iot })
    }

    // Initialize Weather collector
    if (collectors.weather?.enabled) {
      const weatherCollector = new WeatherCollector(collectors.weather)
      this.collectors.set('weather', weatherCollector)
      this.emit('collectorInitialized', { type: 'weather', config: collectors.weather })
    }

    // Initialize Photo collector
    if (collectors.photo?.enabled) {
      const photoCollector = new PhotoCollector(collectors.photo)
      this.collectors.set('photo', photoCollector)
      this.emit('collectorInitialized', { type: 'photo', config: collectors.photo })
    }

    // Initialize Manual Data collector
    if (collectors.manual?.enabled) {
      const manualCollector = new ManualDataCollector(collectors.manual)
      this.collectors.set('manual', manualCollector)
      this.emit('collectorInitialized', { type: 'manual', config: collectors.manual })
    }
  }

  /**
   * Setup event handlers for all collectors
   */
  private setupEventHandlers(): void {
    for (const [type, collector] of this.collectors) {
      // Collection success
      collector.on('collectionSuccess', async (result: CollectionResult) => {
        await this.handleCollectionSuccess(type, result)
      })

      // Collection error
      collector.on('collectionError', (error: Error | Record<string, unknown>) => {
        this.handleCollectionError(type, error)
      })

      // Configuration updates
      collector.on('configUpdated', (config: Record<string, unknown>) => {
        this.emit('collectorConfigUpdated', { type, config })
      })
    }
  }

  /**
   * Start data collection for all collectors
   */
  async startCollection(): Promise<void> {
    if (this.isRunning) {
      this.emit('warning', 'Data collection is already running')
      return
    }

    this.isRunning = true
    this.emit('collectionStarted', {
      collectors: Array.from(this.collectors.keys()),
      startTime: new Date()
    })

    // Start each collector with its configured frequency
    for (const [type, collector] of this.collectors) {
      await this.startCollectorSchedule(type, collector)
    }

    // Start sync process if enabled
    if (this.config.sync.enableRealtime) {
      this.startSyncProcess()
    }

    this.emit('collectionSystemReady')
  }

  /**
   * Stop data collection
   */
  async stopCollection(): Promise<void> {
    if (!this.isRunning) return

    this.isRunning = false

    // Clear all intervals
    for (const [type, interval] of this.collectionIntervals) {
      clearInterval(interval)
      this.emit('collectorStopped', { type })
    }
    this.collectionIntervals.clear()

    this.emit('collectionStopped')
  }

  /**
   * Start collection schedule for a specific collector
   */
  private async startCollectorSchedule(type: string, collector: BaseCollector): Promise<void> {
    const collectorConfig = this.getCollectorConfig(type)
    if (!collectorConfig || !collectorConfig.enabled) return

    // Initial collection
    await this.performCollection(type, collector, collectorConfig)

    // Schedule recurring collections
    const interval = setInterval(async () => {
      if (this.isRunning) {
        await this.performCollection(type, collector, collectorConfig)
      }
    }, collectorConfig.frequencyMs as number)

    this.collectionIntervals.set(type, interval)
    this.emit('collectorScheduled', { 
      type, 
      frequency: collectorConfig.frequencyMs as number,
      nextCollection: new Date(Date.now() + (collectorConfig.frequencyMs as number))
    })
  }

  /**
   * Perform single collection for a collector
   */
  private async performCollection(type: string, collector: BaseCollector, config: Record<string, unknown>): Promise<void> {
    const startTime = Date.now()

    try {
      this.emit('collectionStarted', { type, startTime: new Date() })

      // Perform the collection
      const result = await collector.collectSafely(config)
      
      const duration = Date.now() - startTime
      this.updateMetrics(type, duration, true, result)

      this.emit('collectionCompleted', { 
        type, 
        duration, 
        dataSize: this.calculateDataSize(result.data)
      })

    } catch (error) {
      const duration = Date.now() - startTime
      this.updateMetrics(type, duration, false)
      
      this.emit('collectionFailed', { type, error, duration })
    }
  }

  /**
   * Handle successful collection
   */
  private async handleCollectionSuccess(type: string, result: CollectionResult): Promise<void> {
    try {
      // 1. Store data in database
      await this.storeCollectionData(type, result)

      // 2. Cache frequently accessed data
      if (this.config.storage.enableCache) {
        await this.cacheCollectionData(type, result)
      }

      // 3. Trigger enrichment if enabled
      if (this.config.enrichment.autoTrigger) {
        await this.triggerEnrichment(type, result)
      }

      // 4. Sync to other devices if enabled
      if (this.config.sync.enableRealtime) {
        await this.syncToDevices(type, result)
      }

      this.emit('dataProcessed', { type, result })

    } catch (error) {
      this.emit('dataProcessingError', { type, error, result })
    }
  }

  /**
   * Handle collection error
   */
  private handleCollectionError(type: string, error: Error | Record<string, unknown>): void {
    this.metrics.failedCollections++
    
    // Log error details
    this.emit('error', {
      collector: type,
      error,
      timestamp: new Date(),
      retryScheduled: (error as Record<string, unknown>).attempt ? (error as Record<string, unknown>).attempt as number <= this.config.sync.maxRetries : false
    })

    // Store error for analysis
    this.storeCollectionError(type, error).catch(err => {
      this.emit('error', `Failed to store collection error: ${err}`)
    })
  }

  /**
   * Store collection data in database
   */
  private async storeCollectionData(type: string, result: CollectionResult): Promise<void> {
    const sourceCollecte = await this.getOrCreateSource(type)

    // Store in DonneesCollectees table
    const donneesCollectees = await this.prisma.donneesCollectees.create({
      data: {
        sourceId: sourceCollecte.id as string,
        timestamp: result.timestamp,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        donneesRaw: result.data as any,
        dureeCollecteMs: result.metadata.collectionDuration,
        scoreQualite: result.quality.score,
        tailleDonnees: result.metadata.dataSize,
        enrichissementStatut: 'PENDING'
      }
    })

    // Update source statistics
    await this.updateSourceStats(sourceCollecte.id as string, true)

    this.emit('dataStored', { type, dataId: donneesCollectees.id })
  }

  /**
   * Cache collection data in Redis
   */
  private async cacheCollectionData(type: string, result: CollectionResult): Promise<void> {
    const cacheKey = `collection:${this.config.gardenId}:${type}:latest`
    
    const cacheData = {
      timestamp: result.timestamp,
      data: result.data,
      quality: result.quality,
      metadata: result.metadata
    }

    await this.redis.setex(
      cacheKey,
      this.config.storage.cacheTTL,
      JSON.stringify(cacheData)
    )

    // Also cache collection summary for quick access
    const summaryKey = `summary:${this.config.gardenId}:${type}`
    const summary = this.generateCollectionSummary(type, result)
    
    await this.redis.setex(summaryKey, this.config.storage.cacheTTL, JSON.stringify(summary))
  }

  /**
   * Trigger enrichment pipeline
   */
  private async triggerEnrichment(type: string, result: CollectionResult): Promise<void> {
    if (!this.config.enrichment.priorityTypes.includes(type)) return

    try {
      // Queue enrichment job (would integrate with BullMQ or similar)
      const enrichmentJob = {
        type,
        dataId: `temp_${Date.now()}`, // Would be actual stored data ID
        data: result.data,
        priority: this.getEnrichmentPriority(type),
        config: this.getEnrichmentConfig(type)
      }

      // For now, emit event that enrichment service would listen to
      this.emit('enrichmentQueued', enrichmentJob)
      this.metrics.enrichmentsPending++

    } catch (error) {
      this.emit('enrichmentError', { type, error })
    }
  }

  /**
   * Sync data to other devices
   */
  private async syncToDevices(type: string, result: CollectionResult): Promise<void> {
    try {
      // Get list of devices to sync to
      const targetDevices = await this.getTargetDevices()
      
      const syncJob = {
        sourceDevice: this.config.deviceId,
        targetDevices,
        dataType: type,
        data: result,
        timestamp: new Date()
      }

      // Queue sync job
      this.emit('syncQueued', syncJob)
      this.metrics.syncsPending++

    } catch (error) {
      this.emit('syncError', { type, error })
    }
  }

  /**
   * Get or create source configuration in database
   */
  private async getOrCreateSource(type: string): Promise<Record<string, unknown>> {
    const existing = await this.prisma.sourceCollecte.findFirst({
      where: {
        type: type.toUpperCase() as 'IOT_HOME_ASSISTANT' | 'WEATHER_API' | 'PHOTO_LOCAL' | 'MANUAL_INPUT' | 'EXTERNAL_API',
        jardinId: this.config.gardenId,
        utilisateurId: this.config.userId
      }
    })

    if (existing) return existing

    // Create new source
    const collectorConfig = this.getCollectorConfig(type)
    return await this.prisma.sourceCollecte.create({
      data: {
        jardinId: this.config.gardenId,
        utilisateurId: this.config.userId,
        nom: `${type.charAt(0).toUpperCase() + type.slice(1)} Collector`,
        type: this.mapCollectorTypeToEnum(type),
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        configuration: collectorConfig as any,
        frequenceMs: (collectorConfig?.frequencyMs as number) || 60000
      }
    })
  }

  /**
   * Update source statistics
   */
  private async updateSourceStats(sourceId: string, success: boolean): Promise<void> {
    const updateData: Record<string, unknown> = {
      derniereCollecteA: new Date(),
      totalCollectes: { increment: 1 }
    }

    if (success) {
      updateData.collectesReussies = { increment: 1 }
    } else {
      updateData.erreurCount = { increment: 1 }
    }

    await this.prisma.sourceCollecte.update({
      where: { id: sourceId },
      data: updateData
    })
  }

  /**
   * Store collection error for analysis
   */
  private async storeCollectionError(type: string, error: Error | Record<string, unknown>): Promise<void> {
    try {
      const source = await this.getOrCreateSource(type)
      
      await this.prisma.sourceCollecte.update({
        where: { id: source.id as string },
        data: {
          derniereErreur: error.message || String(error),
          erreurCount: { increment: 1 }
        }
      })
    } catch (err) {
      // Silent fail - don't throw on error logging
      console.error('Failed to store collection error:', err)
    }
  }

  /**
   * Get current collection status
   */
  async getStatus(): Promise<CollectionStatus> {
    const activeCollectors = Array.from(this.collectors.keys()).filter(type => {
      const collector = this.collectors.get(type)
      return collector?.isHealthy() && this.collectionIntervals.has(type)
    })

    const lastCollectionTimes: { [type: string]: Date } = {}
    for (const type of this.collectors.keys()) {
      const cacheKey = `summary:${this.config.gardenId}:${type}`
      try {
        const cached = await this.redis.get(cacheKey)
        if (cached) {
          const summary = JSON.parse(cached)
          lastCollectionTimes[type] = new Date(summary.lastCollection)
        }
      } catch (error) {
        // Silent fail
      }
    }

    // Get today's collection count
    const todayStart = new Date()
    todayStart.setHours(0, 0, 0, 0)
    
    const collectionsToday = await this.prisma.donneesCollectees.count({
      where: {
        source: {
          jardinId: this.config.gardenId
        },
        timestamp: {
          gte: todayStart
        }
      }
    })

    // Health assessment
    const healthStatus = this.assessOverallHealth()

    return {
      isRunning: this.isRunning,
      activeCollectors,
      lastCollectionTimes,
      collectionsToday,
      errorsToday: this.metrics.failedCollections, // Simplified
      totalDataSize: this.metrics.dataVolumeBytes,
      healthStatus
    }
  }

  /**
   * Get collection metrics
   */
  getMetrics(): DataCollectionMetrics {
    return { ...this.metrics }
  }

  // Helper methods

  private getCollectorConfig(type: string): Record<string, unknown> | undefined {
    return this.config.collectors[type as keyof typeof this.config.collectors]
  }

  private updateMetrics(type: string, duration: number, success: boolean, result?: CollectionResult): void {
    this.metrics.totalCollections++
    
    if (success) {
      this.metrics.successfulCollections++
      this.metrics.averageCollectionTime = 
        ((this.metrics.averageCollectionTime * (this.metrics.successfulCollections - 1)) + duration) 
        / this.metrics.successfulCollections
      
      if (result) {
        this.metrics.dataVolumeBytes += result.metadata.dataSize
      }
    } else {
      this.metrics.failedCollections++
    }

    // Update collector-specific metrics
    const collector = this.collectors.get(type)
    if (collector) {
      this.metrics.collectorMetrics[type] = collector.getMetrics() as unknown as Record<string, unknown>
    }
  }

  private calculateDataSize(data: Record<string, unknown>): number {
    try {
      return new Blob([JSON.stringify(data)]).size
    } catch {
      return 0
    }
  }

  private generateCollectionSummary(type: string, result: CollectionResult): Record<string, unknown> {
    return {
      type,
      lastCollection: result.timestamp,
      quality: result.quality,
      dataSize: result.metadata.dataSize,
      duration: result.metadata.collectionDuration
    }
  }

  private getEnrichmentPriority(type: string): number {
    const priorities = { photo: 1, iot: 2, weather: 3, manual: 4 }
    return priorities[type as keyof typeof priorities] || 5
  }

  private getEnrichmentConfig(type: string): Record<string, unknown> {
    return { type, autoProcess: true }
  }

  private async getTargetDevices(): Promise<string[]> {
    // Placeholder - would get from device registry
    return ['mobile-001', 'desktop-001', 'tv-001']
  }

  private mapCollectorTypeToEnum(type: string): 'IOT_HOME_ASSISTANT' | 'WEATHER_API' | 'PHOTO_LOCAL' | 'MANUAL_INPUT' | 'EXTERNAL_API' {
    const mapping = {
      iot: 'IOT_HOME_ASSISTANT',
      weather: 'WEATHER_API',
      photo: 'PHOTO_LOCAL',
      manual: 'MANUAL_INPUT'
    }
    return (mapping[type as keyof typeof mapping] as 'IOT_HOME_ASSISTANT' | 'WEATHER_API' | 'PHOTO_LOCAL' | 'MANUAL_INPUT' | 'EXTERNAL_API') || 'EXTERNAL_API'
  }

  private assessOverallHealth(): CollectionStatus['healthStatus'] {
    const collectors: { [type: string]: 'healthy' | 'warning' | 'error' } = {}
    const issues: string[] = []
    
    let overallScore = 0
    let totalCollectors = 0

    for (const [type, collector] of this.collectors) {
      totalCollectors++
      const health = collector.getHealthStatus()
      
      if (health.healthy) {
        collectors[type] = 'healthy'
        overallScore += 1
      } else if (health.successRate > 0.5) {
        collectors[type] = 'warning'
        overallScore += 0.5
        if (health.lastError) issues.push(`${type}: ${health.lastError}`)
      } else {
        collectors[type] = 'error'
        if (health.lastError) issues.push(`${type}: ${health.lastError}`)
      }
    }

    let overall: 'healthy' | 'warning' | 'error'
    if (totalCollectors === 0) overall = 'error'
    else if (overallScore / totalCollectors >= 0.8) overall = 'healthy'
    else if (overallScore / totalCollectors >= 0.5) overall = 'warning'
    else overall = 'error'

    return { overall, collectors, issues }
  }

  private startSyncProcess(): void {
    // Placeholder for real-time sync process
    // Would use WebSocket or similar for real-time sync
  }

  /**
   * Cleanup resources
   */
  async disconnect(): Promise<void> {
    await this.stopCollection()
    
    // Disconnect all collectors
    for (const [type, collector] of this.collectors) {
      if ('disconnect' in collector && typeof collector.disconnect === 'function') {
        await collector.disconnect()
      }
    }

    await this.prisma.$disconnect()
    this.redis.disconnect()
  }
}