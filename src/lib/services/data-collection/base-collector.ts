/**
 * F3.1 - Base class for all data collectors
 * 
 * Provides common functionality for:
 * - Error handling and retries
 * - Quality assessment
 * - Metrics tracking
 * - Configuration validation
 */

import { EventEmitter } from 'events'

export interface CollectionResult<T = Record<string, unknown>> {
  type: string
  data: T
  timestamp: Date
  quality: DataQuality
  metadata: CollectionMetadata
}

export interface DataQuality {
  score: number // 0.0 to 1.0
  issues: string[]
  level: 'excellent' | 'good' | 'degraded' | 'poor'
}

export interface CollectionMetadata {
  collectionDuration: number // milliseconds
  dataSize: number // bytes
  sourceVersion?: string
  processingTime?: number
  retryCount?: number
}

export interface CollectorConfig {
  enabled: boolean
  frequencyMs: number
  retryCount: number
  timeout: number
  [key: string]: unknown
}

export interface CollectorMetrics {
  totalCollections: number
  successfulCollections: number
  failedCollections: number
  averageTime: number
  lastSuccess?: Date
  lastError?: string
}

/**
 * Base abstract class for all data collectors
 */
export abstract class BaseCollector extends EventEmitter {
  protected metrics: CollectorMetrics = {
    totalCollections: 0,
    successfulCollections: 0,
    failedCollections: 0,
    averageTime: 0
  }

  abstract readonly type: string
  protected isRunning = false

  constructor(protected config: CollectorConfig) {
    super()
  }

  /**
   * Main collection method - implemented by each collector
   */
  abstract collect(config: Record<string, unknown>): Promise<Record<string, unknown>>

  /**
   * Collect with error handling, retries and metrics
   */
  async collectSafely(config: Record<string, unknown>): Promise<CollectionResult> {
    const startTime = Date.now()
    let retryCount = 0
    let lastError: Error | null = null

    this.metrics.totalCollections++

    while (retryCount <= this.config.retryCount) {
      try {
        this.emit('collectionStarted', { type: this.type, attempt: retryCount + 1 })

        // Collect raw data
        const rawData = await Promise.race([
          this.collect(config),
          this.createTimeoutPromise(this.config.timeout)
        ])

        // Assess data quality
        const quality = this.assessDataQuality(rawData as Record<string, unknown>)

        // Create result
        const result: CollectionResult = {
          type: this.type,
          data: rawData as Record<string, unknown>,
          timestamp: new Date(),
          quality,
          metadata: {
            collectionDuration: Date.now() - startTime,
            dataSize: this.calculateDataSize(rawData as Record<string, unknown>),
            retryCount
          }
        }

        // Update metrics on success
        this.metrics.successfulCollections++
        this.updateAverageTime(Date.now() - startTime)
        this.metrics.lastSuccess = new Date()

        this.emit('collectionSuccess', result)
        return result

      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error))
        this.emit('collectionError', { 
          type: this.type, 
          error: lastError, 
          attempt: retryCount + 1 
        })

        retryCount++
        if (retryCount <= this.config.retryCount) {
          // Exponential backoff
          await this.delay(Math.min(1000 * Math.pow(2, retryCount), 30000))
        }
      }
    }

    // All retries exhausted
    this.metrics.failedCollections++
    this.metrics.lastError = lastError?.message || 'Unknown error'

    throw new Error(`Collection failed after ${retryCount} attempts: ${lastError?.message}`)
  }

  /**
   * Assess the quality of collected data
   */
  protected assessDataQuality(data: Record<string, unknown>): DataQuality {
    const issues: string[] = []
    let score = 1.0

    // Check if data is null or undefined
    if (!data) {
      issues.push('no_data')
      score = 0
    } else {
      // Check data freshness (implemented by specific collectors)
      const freshnessScore = this.assessDataFreshness(data)
      if (freshnessScore < 0.8) {
        issues.push('stale_data')
        score *= freshnessScore
      }

      // Check data completeness
      const completenessScore = this.assessDataCompleteness(data)
      if (completenessScore < 0.8) {
        issues.push('incomplete_data')
        score *= completenessScore
      }

      // Check data validity
      const validityScore = this.assessDataValidity(data)
      if (validityScore < 0.8) {
        issues.push('invalid_data')
        score *= validityScore
      }
    }

    // Determine quality level
    let level: DataQuality['level']
    if (score >= 0.9) level = 'excellent'
    else if (score >= 0.7) level = 'good'
    else if (score >= 0.4) level = 'degraded'
    else level = 'poor'

    return { score, issues, level }
  }

  /**
   * Assess data freshness - override in specific collectors
   */
  protected assessDataFreshness(_data: Record<string, unknown>): number {
    return 1.0 // Default: assume fresh
  }

  /**
   * Assess data completeness - override in specific collectors
   */
  protected assessDataCompleteness(_data: Record<string, unknown>): number {
    return 1.0 // Default: assume complete
  }

  /**
   * Assess data validity - override in specific collectors
   */
  protected assessDataValidity(_data: Record<string, unknown>): number {
    return 1.0 // Default: assume valid
  }

  /**
   * Calculate estimated data size in bytes
   */
  protected calculateDataSize(data: Record<string, unknown>): number {
    try {
      return new Blob([JSON.stringify(data)]).size
    } catch {
      return 0
    }
  }

  /**
   * Update running average of collection time
   */
  private updateAverageTime(newTime: number): void {
    const total = this.metrics.successfulCollections
    this.metrics.averageTime = 
      ((this.metrics.averageTime * (total - 1)) + newTime) / total
  }

  /**
   * Create timeout promise
   */
  private createTimeoutPromise<T>(timeoutMs: number): Promise<T> {
    return new Promise((_, reject) => {
      setTimeout(() => {
        reject(new Error(`Collection timeout after ${timeoutMs}ms`))
      }, timeoutMs)
    })
  }

  /**
   * Simple delay utility
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  /**
   * Get collector metrics
   */
  getMetrics(): CollectorMetrics {
    return { ...this.metrics }
  }

  /**
   * Reset metrics
   */
  resetMetrics(): void {
    this.metrics = {
      totalCollections: 0,
      successfulCollections: 0,
      failedCollections: 0,
      averageTime: 0
    }
  }

  /**
   * Update collector configuration
   */
  updateConfig(newConfig: Partial<CollectorConfig>): void {
    this.config = { ...this.config, ...newConfig }
    this.emit('configUpdated', this.config)
  }

  /**
   * Check if collector is healthy (success rate > 80% and recent success)
   */
  isHealthy(): boolean {
    const successRate = this.metrics.totalCollections > 0 
      ? this.metrics.successfulCollections / this.metrics.totalCollections 
      : 1

    const recentSuccess = this.metrics.lastSuccess && 
      (Date.now() - this.metrics.lastSuccess.getTime()) < (this.config.frequencyMs * 3)

    return successRate >= 0.8 && (this.metrics.totalCollections === 0 || Boolean(recentSuccess))
  }

  /**
   * Get health status
   */
  getHealthStatus(): { 
    healthy: boolean
    successRate: number 
    lastSuccess?: Date
    lastError?: string 
  } {
    const successRate = this.metrics.totalCollections > 0 
      ? this.metrics.successfulCollections / this.metrics.totalCollections 
      : 1

    return {
      healthy: this.isHealthy(),
      successRate,
      lastSuccess: this.metrics.lastSuccess,
      lastError: this.metrics.lastError
    }
  }
}