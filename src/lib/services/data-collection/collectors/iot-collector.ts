/**
 * F3.1 - IoT Data Collector
 * 
 * Collects data from Home Assistant and direct IoT devices
 * Supports:
 * - Home Assistant API integration
 * - Direct ESP32/sensor communication
 * - Multi-sensor data aggregation
 * - Quality validation for sensor readings
 */

import { BaseCollector, CollectorConfig } from '../base-collector'
import { PrismaClient } from '@prisma/client'

export interface IoTCollectorConfig extends CollectorConfig {
  gardenId: string
  homeAssistantUrl?: string
  homeAssistantToken?: string
  deviceTypes: string[] // ['temperature', 'humidity', 'soil_moisture']
  maxDeviceAge: number // Maximum age in minutes for valid readings
  qualityThresholds: {
    temperature: { min: number; max: number }
    humidity: { min: number; max: number }
    soil_moisture: { min: number; max: number }
  }
}

export interface SensorReading {
  deviceId: string
  entityId?: string // Home Assistant entity ID
  sensorType: string
  value: number
  unit: string
  timestamp: Date
  quality: 'excellent' | 'good' | 'degraded' | 'poor'
  location?: {
    zoneId?: string
    coordinates?: { latitude: number; longitude: number }
  }
  metadata?: {
    batteryLevel?: number
    signalStrength?: number
    firmwareVersion?: string
  }
}

export interface IoTCollectionResult extends Record<string, unknown> {
  type: 'iot'
  gardenId: string
  readings: SensorReading[]
  collectionTimestamp: Date
  deviceCount: number
  successfulReadings: number
  homeAssistantStatus: 'connected' | 'disconnected' | 'error'
  summary: {
    temperatureDevices: number
    humidityDevices: number
    soilMoistureDevices: number
    batteryLowDevices: number
  }
}

/**
 * IoT Data Collector for Home Assistant and direct sensors
 */
export class IoTCollector extends BaseCollector {
  readonly type = 'iot'
  private prisma: PrismaClient
  private homeAssistantClient?: HomeAssistantClient

  constructor(config: IoTCollectorConfig) {
    super(config)
    this.prisma = new PrismaClient()
    
    if (config.homeAssistantUrl && config.homeAssistantToken) {
      this.homeAssistantClient = new HomeAssistantClient(
        config.homeAssistantUrl,
        config.homeAssistantToken
      )
    }
  }

  /**
   * Main collection method
   */
  async collect(config: IoTCollectorConfig): Promise<IoTCollectionResult> {
    const startTime = Date.now()
    const readings: SensorReading[] = []
    let homeAssistantStatus: 'connected' | 'disconnected' | 'error' = 'disconnected'

    // 1. Collect from Home Assistant if configured
    if (this.homeAssistantClient) {
      try {
        const haReadings = await this.collectFromHomeAssistant(config)
        readings.push(...haReadings)
        homeAssistantStatus = 'connected'
        this.emit('homeAssistantConnected', { deviceCount: haReadings.length })
      } catch (error) {
        homeAssistantStatus = 'error'
        this.emit('homeAssistantError', error)
      }
    }

    // 2. Collect from direct IoT devices (Prisma database)
    try {
      const directReadings = await this.collectFromDirectDevices(config)
      readings.push(...directReadings)
    } catch (error) {
      this.emit('directDevicesError', error)
    }

    // 3. Generate summary statistics
    const summary = this.generateSummary(readings)

    const result: IoTCollectionResult = {
      type: 'iot',
      gardenId: config.gardenId,
      readings,
      collectionTimestamp: new Date(),
      deviceCount: new Set(readings.map(r => r.deviceId)).size,
      successfulReadings: readings.length,
      homeAssistantStatus,
      summary
    }

    this.emit('collectionComplete', {
      duration: Date.now() - startTime,
      readingsCount: readings.length,
      devicesCount: result.deviceCount
    })

    return result
  }

  /**
   * Collect data from Home Assistant
   */
  private async collectFromHomeAssistant(config: IoTCollectorConfig): Promise<SensorReading[]> {
    if (!this.homeAssistantClient) return []

    const readings: SensorReading[] = []

    try {
      // Get all sensor entities
      const entities = await this.homeAssistantClient.getEntities()
      
      for (const entity of entities) {
        if (this.isRelevantSensor(entity, config.deviceTypes)) {
          try {
            const entityObj = entity as Record<string, unknown>
            const entityId = entityObj.entity_id as string
            const state = await this.homeAssistantClient.getEntityState(entityId)
            
            if (this.isValidReading(state, config)) {
              const reading: SensorReading = {
                deviceId: entityId,
                entityId: entityId,
                sensorType: this.extractSensorType(entityId),
                value: parseFloat(state.state as string),
                unit: (state.attributes as Record<string, unknown>)?.unit_of_measurement as string || '',
                timestamp: new Date(state.last_updated as string),
                quality: this.assessSensorReadingQuality(
                  parseFloat(state.state as string),
                  this.extractSensorType(entityId),
                  config
                ),
                metadata: {
                  batteryLevel: (state.attributes as Record<string, unknown>)?.battery_level as number | undefined,
                  signalStrength: (state.attributes as Record<string, unknown>)?.signal_strength as number | undefined,
                  firmwareVersion: (state.attributes as Record<string, unknown>)?.sw_version as string | undefined
                }
              }

              readings.push(reading)
            }
          } catch (error) {
            this.emit('sensorReadingError', { entityId: entity.entity_id, error })
          }
        }
      }
    } catch (error) {
      throw new Error(`Home Assistant collection failed: ${error}`)
    }

    return readings
  }

  /**
   * Collect data from direct IoT devices in database
   */
  private async collectFromDirectDevices(config: IoTCollectorConfig): Promise<SensorReading[]> {
    const readings: SensorReading[] = []

    try {
      // Get active IoT devices for this garden
      const devices = await this.prisma.appareilIoT.findMany({
        where: {
          jardinId: config.gardenId,
          statut: 'ACTIF'
        },
        include: {
          zone: true,
          lecturesCapteur: {
            orderBy: { mesureA: 'desc' },
            take: 1 // Latest reading per device
          }
        }
      })

      for (const device of devices) {
        if (device.lecturesCapteur.length > 0) {
          const latestReading = device.lecturesCapteur[0]
          
          // Check if reading is recent enough
          const readingAge = Date.now() - latestReading.mesureA.getTime()
          if (readingAge <= config.maxDeviceAge * 60 * 1000) {
            const reading: SensorReading = {
              deviceId: device.id,
              sensorType: latestReading.typeCapteur,
              value: Number(latestReading.valeur),
              unit: latestReading.unite,
              timestamp: latestReading.mesureA,
              quality: this.assessSensorReadingQuality(
                Number(latestReading.valeur),
                latestReading.typeCapteur,
                config
              ),
              location: {
                zoneId: device.zone?.id,
                coordinates: device.localisationInstallation as { latitude: number; longitude: number } | undefined
              },
              metadata: {
                batteryLevel: device.niveauBatteriePourcent || undefined,
                firmwareVersion: device.versionFirmware || undefined
              }
            }

            readings.push(reading)
          }
        }
      }
    } catch (error) {
      throw new Error(`Direct devices collection failed: ${error}`)
    }

    return readings
  }

  /**
   * Check if sensor entity is relevant
   */
  private isRelevantSensor(entity: Record<string, unknown>, deviceTypes: string[]): boolean {
    const entityId = (entity.entity_id as string).toLowerCase()
    return deviceTypes.some(type => 
      entityId.includes(type.toLowerCase().replace('_', ''))
    )
  }

  /**
   * Validate sensor reading
   */
  private isValidReading(state: Record<string, unknown>, config: IoTCollectorConfig): boolean {
    // Check if state is numeric
    const value = parseFloat(state.state as string)
    if (isNaN(value)) return false

    // Check reading age
    const readingAge = Date.now() - new Date(state.last_updated as string).getTime()
    if (readingAge > config.maxDeviceAge * 60 * 1000) return false

    return true
  }

  /**
   * Extract sensor type from entity ID
   */
  private extractSensorType(entityId: string): string {
    const id = entityId.toLowerCase()
    
    if (id.includes('temperature')) return 'temperature'
    if (id.includes('humidity') || id.includes('humidite')) return 'humidity'
    if (id.includes('soil') || id.includes('moisture') || id.includes('sol')) return 'soil_moisture'
    if (id.includes('pressure') || id.includes('pression')) return 'pressure'
    if (id.includes('light') || id.includes('lumiere')) return 'light'
    
    return 'unknown'
  }

  /**
   * Assess quality of individual sensor reading
   */
  private assessSensorReadingQuality(
    value: number,
    sensorType: string,
    config: IoTCollectorConfig
  ): 'excellent' | 'good' | 'degraded' | 'poor' {
    const thresholds = config.qualityThresholds[sensorType as keyof typeof config.qualityThresholds]
    
    if (!thresholds) return 'good' // Default for unknown sensor types

    // Check if value is within expected range
    if (value < thresholds.min || value > thresholds.max) {
      return 'poor'
    }

    // Check if value is in optimal range (middle 80% of valid range)
    const range = thresholds.max - thresholds.min
    const optimalMin = thresholds.min + (range * 0.1)
    const optimalMax = thresholds.max - (range * 0.1)

    if (value >= optimalMin && value <= optimalMax) {
      return 'excellent'
    }

    return 'good'
  }

  /**
   * Generate summary statistics
   */
  private generateSummary(readings: SensorReading[]) {
    const summary = {
      temperatureDevices: 0,
      humidityDevices: 0,
      soilMoistureDevices: 0,
      batteryLowDevices: 0
    }

    for (const reading of readings) {
      switch (reading.sensorType) {
        case 'temperature':
          summary.temperatureDevices++
          break
        case 'humidity':
          summary.humidityDevices++
          break
        case 'soil_moisture':
          summary.soilMoistureDevices++
          break
      }

      if (reading.metadata?.batteryLevel && reading.metadata.batteryLevel < 20) {
        summary.batteryLowDevices++
      }
    }

    return summary
  }

  /**
   * Override data freshness assessment
   */
  protected assessDataFreshness(data: IoTCollectionResult): number {
    const now = Date.now()
    const maxAge = (this.config as IoTCollectorConfig).maxDeviceAge * 60 * 1000

    if (data.readings.length === 0) return 0

    const avgAge = data.readings.reduce((sum, reading) => {
      return sum + (now - reading.timestamp.getTime())
    }, 0) / data.readings.length

    // Linear degradation: 1.0 at age 0, 0.5 at maxAge, 0.0 at 2*maxAge
    return Math.max(0, Math.min(1, 1 - (avgAge / (maxAge * 2))))
  }

  /**
   * Override data completeness assessment
   */
  protected assessDataCompleteness(data: IoTCollectionResult): number {
    const config = this.config as IoTCollectorConfig
    const expectedTypes = config.deviceTypes
    const actualTypes = new Set(data.readings.map(r => r.sensorType))

    if (expectedTypes.length === 0) return 1

    const completeness = actualTypes.size / expectedTypes.length
    return Math.min(1, completeness)
  }

  /**
   * Override data validity assessment
   */
  protected assessDataValidity(data: IoTCollectionResult): number {
    if (data.readings.length === 0) return 0

    const validReadings = data.readings.filter(reading => 
      reading.quality === 'excellent' || reading.quality === 'good'
    ).length

    return validReadings / data.readings.length
  }

  /**
   * Cleanup resources
   */
  async disconnect(): Promise<void> {
    await this.prisma.$disconnect()
    if (this.homeAssistantClient) {
      await this.homeAssistantClient.disconnect()
    }
  }
}

/**
 * Simple Home Assistant API client
 */
class HomeAssistantClient {
  constructor(
    private baseUrl: string,
    private token: string
  ) {}

  async getEntities(): Promise<Record<string, unknown>[]> {
    const response = await fetch(`${this.baseUrl}/api/states`, {
      headers: {
        'Authorization': `Bearer ${this.token}`,
        'Content-Type': 'application/json'
      }
    })

    if (!response.ok) {
      throw new Error(`Home Assistant API error: ${response.statusText}`)
    }

    return response.json()
  }

  async getEntityState(entityId: string): Promise<Record<string, unknown>> {
    const response = await fetch(`${this.baseUrl}/api/states/${entityId}`, {
      headers: {
        'Authorization': `Bearer ${this.token}`,
        'Content-Type': 'application/json'
      }
    })

    if (!response.ok) {
      throw new Error(`Home Assistant API error: ${response.statusText}`)
    }

    return response.json()
  }

  async disconnect(): Promise<void> {
    // No persistent connection to close for REST API
  }
}