/**
 * F3.1 - Manual Data Collector
 * 
 * Collects manually entered data from multiple devices:
 * - Form submissions from mobile/desktop/TV
 * - Quick voice notes transcriptions
 * - Offline data sync when devices reconnect
 * - Cross-device validation and conflict resolution
 */

import { BaseCollector, CollectorConfig } from '../base-collector'
import { PrismaClient } from '@prisma/client'

export interface ManualDataCollectorConfig extends CollectorConfig {
  gardenId: string
  deviceId: string // Unique device identifier
  syncWindowHours: number // How far back to look for manual entries
  includeInterventions: boolean
  includeObservations: boolean
  includeQuickNotes: boolean
  validateCrossDevice: boolean // Check for conflicts between devices
  priorityOrder: string[] // Device priority for conflict resolution
}

export interface ManualEntry {
  id: string
  deviceId: string
  userId: string
  type: 'intervention' | 'observation' | 'quick_note' | 'measurement'
  timestamp: Date
  submittedAt: Date
  zoneId?: string
  instanceCultureId?: string
  data: any
  metadata: {
    inputMethod: 'keyboard' | 'voice' | 'form' | 'quick_capture'
    deviceType: 'mobile' | 'desktop' | 'tv'
    location?: { latitude: number; longitude: number }
    confidence: number // 0-1, higher for form inputs vs voice
    language: string
    sessionId?: string
  }
  validation: {
    isComplete: boolean
    hasErrors: boolean
    conflictsWith?: string[] // IDs of conflicting entries
    confidence: number
    issues: string[]
  }
  sync: {
    needsSync: boolean
    syncedDevices: string[]
    syncAttempts: number
    lastSyncAt?: Date
  }
}

export interface ManualDataCollectionResult {
  type: 'manual_input'
  gardenId: string
  deviceId: string
  entries: ManualEntry[]
  collectionTimestamp: Date
  timeWindow: {
    start: Date
    end: Date
  }
  summary: {
    interventions: number
    observations: number
    quickNotes: number
    measurements: number
    conflicts: number
    validationErrors: number
  }
  deviceSync: {
    devicesInvolved: string[]
    conflictsResolved: number
    pendingSync: number
    lastFullSync?: Date
  }
}

/**
 * Manual Data Collector for user input from all devices
 */
export class ManualDataCollector extends BaseCollector {
  readonly type = 'manual_input'
  private prisma: PrismaClient

  constructor(config: ManualDataCollectorConfig) {
    super(config)
    this.prisma = new PrismaClient()
  }

  /**
   * Main collection method
   */
  async collect(config: ManualDataCollectorConfig): Promise<ManualDataCollectionResult> {
    const startTime = Date.now()
    const entries: ManualEntry[] = []
    
    // Define time window for collection
    const endTime = new Date()
    const startTimeWindow = new Date(endTime.getTime() - (config.syncWindowHours * 60 * 60 * 1000))

    try {
      // 1. Collect interventions if enabled
      if (config.includeInterventions) {
        const interventionEntries = await this.collectInterventions(config, startTimeWindow, endTime)
        entries.push(...interventionEntries)
      }

      // 2. Collect observations and quick notes
      if (config.includeObservations) {
        const observationEntries = await this.collectObservations(config, startTimeWindow, endTime)
        entries.push(...observationEntries)
      }

      // 3. Collect quick notes and voice transcriptions
      if (config.includeQuickNotes) {
        const quickNoteEntries = await this.collectQuickNotes(config, startTimeWindow, endTime)
        entries.push(...quickNoteEntries)
      }

      // 4. Cross-device validation and conflict detection
      if (config.validateCrossDevice) {
        await this.validateCrossDevice(entries, config)
      }

      // 5. Generate summary statistics
      const summary = this.generateSummary(entries)

      // 6. Analyze device synchronization status
      const deviceSync = await this.analyzeDeviceSync(entries, config)

      const result: ManualDataCollectionResult = {
        type: 'manual_input',
        gardenId: config.gardenId,
        deviceId: config.deviceId,
        entries,
        collectionTimestamp: new Date(),
        timeWindow: {
          start: startTimeWindow,
          end: endTime
        },
        summary,
        deviceSync
      }

      this.emit('manualDataCollected', {
        duration: Date.now() - startTime,
        entriesCount: entries.length,
        conflictsFound: summary.conflicts
      })

      return result

    } catch (error) {
      throw new Error(`Manual data collection failed: ${error}`)
    }
  }

  /**
   * Collect intervention data
   */
  private async collectInterventions(
    config: ManualDataCollectorConfig,
    startTime: Date,
    endTime: Date
  ): Promise<ManualEntry[]> {
    const entries: ManualEntry[] = []

    try {
      // Get recent interventions from database
      const interventions = await this.prisma.intervention.findMany({
        where: {
          instanceCulture: {
            variete: {
              utilisateurId: await this.getUserIdFromDevice(config.deviceId)
            }
          },
          creeA: {
            gte: startTime,
            lte: endTime
          }
        },
        include: {
          instanceCulture: {
            include: {
              zone: true
            }
          },
          utilisateur: true
        },
        orderBy: {
          dateReelle: 'desc'
        }
      })

      for (const intervention of interventions) {
        const entry: ManualEntry = {
          id: intervention.id,
          deviceId: config.deviceId, // Current device collecting
          userId: intervention.utilisateurId,
          type: 'intervention',
          timestamp: intervention.dateReelle,
          submittedAt: intervention.creeA,
          zoneId: intervention.zoneId || undefined,
          instanceCultureId: intervention.instanceCultureId || undefined,
          data: {
            types: [], // Would need junction table data
            duration: intervention.dureeMinutes,
            weatherConditions: intervention.conditionsMeteo,
            details: intervention.detailsIntervention,
            photos: intervention.photos,
            notes: intervention.notes,
            effectiveness: intervention.noteEfficacite,
            observedResults: intervention.resultatsObserves
          },
          metadata: {
            inputMethod: this.inferInputMethod(intervention),
            deviceType: this.inferDeviceType(intervention),
            location: intervention.geolocalisation as any,
            confidence: this.assessInputConfidence(intervention),
            language: 'fr', // Default
            sessionId: undefined
          },
          validation: {
            isComplete: this.validateInterventionCompleteness(intervention),
            hasErrors: false,
            confidence: this.assessInputConfidence(intervention),
            issues: []
          },
          sync: {
            needsSync: true,
            syncedDevices: [],
            syncAttempts: 0
          }
        }

        entries.push(entry)
      }

    } catch (error) {
      this.emit('interventionCollectionError', error)
    }

    return entries
  }

  /**
   * Collect observation data (from various sources)
   */
  private async collectObservations(
    config: ManualDataCollectorConfig,
    startTime: Date,
    endTime: Date
  ): Promise<ManualEntry[]> {
    const entries: ManualEntry[] = []

    try {
      // Collect from harvest records (which often include observations)
      const harvests = await this.prisma.recolte.findMany({
        where: {
          zone: {
            jardinId: config.gardenId
          },
          creeA: {
            gte: startTime,
            lte: endTime
          }
        },
        include: {
          zone: true,
          instanceCulture: true,
          utilisateur: true
        }
      })

      for (const harvest of harvests) {
        const entry: ManualEntry = {
          id: `harvest_${harvest.id}`,
          deviceId: config.deviceId,
          userId: harvest.utilisateurId,
          type: 'observation',
          timestamp: harvest.dateRecolte,
          submittedAt: harvest.creeA,
          zoneId: harvest.zoneId,
          instanceCultureId: harvest.instanceCultureId || undefined,
          data: {
            type: 'harvest',
            weight: harvest.poidsTotalKg,
            quantity: harvest.quantiteUnites,
            quality: harvest.evaluationQualite,
            aiRecognition: harvest.reconnaissanceIA,
            photos: harvest.photos,
            destination: harvest.destinationUsage,
            location: harvest.localisationRecolte,
            weatherConditions: harvest.meteoARecolte
          },
          metadata: {
            inputMethod: 'form', // Harvests typically use forms
            deviceType: this.inferDeviceFromLocation(harvest.localisationRecolte as any),
            location: harvest.localisationRecolte as any,
            confidence: 0.9, // Manual harvest data is usually reliable
            language: 'fr'
          },
          validation: {
            isComplete: this.validateHarvestCompleteness(harvest),
            hasErrors: false,
            confidence: 0.9,
            issues: []
          },
          sync: {
            needsSync: true,
            syncedDevices: [],
            syncAttempts: 0
          }
        }

        entries.push(entry)
      }

    } catch (error) {
      this.emit('observationCollectionError', error)
    }

    return entries
  }

  /**
   * Collect quick notes and voice transcriptions
   */
  private async collectQuickNotes(
    config: ManualDataCollectorConfig,
    startTime: Date,
    endTime: Date
  ): Promise<ManualEntry[]> {
    const entries: ManualEntry[] = []

    try {
      // Get user activities that might represent quick notes
      const activities = await this.prisma.activiteUtilisateur.findMany({
        where: {
          utilisateur: {
            jardins: {
              some: {
                id: config.gardenId
              }
            }
          },
          typeActivite: {
            in: ['CREATION', 'MISE_A_JOUR']
          },
          creeA: {
            gte: startTime,
            lte: endTime
          },
          metadonneesActivite: {
            not: null
          }
        },
        include: {
          utilisateur: true
        }
      })

      for (const activity of activities) {
        const metadata = activity.metadonneesActivite as any
        
        // Filter for activities that look like quick notes
        if (this.isQuickNoteActivity(metadata)) {
          const entry: ManualEntry = {
            id: `activity_${activity.id}`,
            deviceId: config.deviceId,
            userId: activity.utilisateurId,
            type: 'quick_note',
            timestamp: activity.creeA,
            submittedAt: activity.creeA,
            data: {
              type: 'quick_note',
              content: metadata.content || metadata.note,
              voice: metadata.isVoiceTranscription || false,
              tags: metadata.tags || [],
              confidence: metadata.transcriptionConfidence
            },
            metadata: {
              inputMethod: metadata.isVoiceTranscription ? 'voice' : 'keyboard',
              deviceType: activity.typeAppareil?.toLowerCase() as any || 'mobile',
              location: activity.geolocalisation as any,
              confidence: metadata.transcriptionConfidence || 0.7,
              language: metadata.language || 'fr',
              sessionId: metadata.sessionId
            },
            validation: {
              isComplete: !!metadata.content,
              hasErrors: false,
              confidence: metadata.transcriptionConfidence || 0.7,
              issues: metadata.transcriptionErrors || []
            },
            sync: {
              needsSync: true,
              syncedDevices: [],
              syncAttempts: 0
            }
          }

          entries.push(entry)
        }
      }

    } catch (error) {
      this.emit('quickNotesCollectionError', error)
    }

    return entries
  }

  /**
   * Cross-device validation and conflict detection
   */
  private async validateCrossDevice(entries: ManualEntry[], config: ManualDataCollectorConfig): Promise<void> {
    if (!config.validateCrossDevice || entries.length === 0) return

    // Group entries by time and location for conflict detection
    const timeGroups = this.groupEntriesByTime(entries, 30) // 30-minute windows

    for (const group of timeGroups) {
      // Check for potential conflicts (same activity recorded on multiple devices)
      const conflicts = this.detectConflicts(group)
      
      if (conflicts.length > 0) {
        // Resolve conflicts based on device priority
        await this.resolveConflicts(conflicts, config.priorityOrder)
      }
    }
  }

  /**
   * Generate summary statistics
   */
  private generateSummary(entries: ManualEntry[]): ManualDataCollectionResult['summary'] {
    const summary = {
      interventions: 0,
      observations: 0,
      quickNotes: 0,
      measurements: 0,
      conflicts: 0,
      validationErrors: 0
    }

    for (const entry of entries) {
      switch (entry.type) {
        case 'intervention':
          summary.interventions++
          break
        case 'observation':
          summary.observations++
          break
        case 'quick_note':
          summary.quickNotes++
          break
        case 'measurement':
          summary.measurements++
          break
      }

      if (entry.validation.conflictsWith?.length) {
        summary.conflicts++
      }

      if (entry.validation.hasErrors) {
        summary.validationErrors++
      }
    }

    return summary
  }

  /**
   * Analyze device synchronization status
   */
  private async analyzeDeviceSync(
    entries: ManualEntry[],
    config: ManualDataCollectorConfig
  ): Promise<ManualDataCollectionResult['deviceSync']> {
    const devicesInvolved = new Set(entries.map(e => e.deviceId))
    const conflictsResolved = entries.filter(e => 
      e.validation.conflictsWith?.length && !e.validation.hasErrors
    ).length
    const pendingSync = entries.filter(e => e.sync.needsSync).length

    // Get last full sync time (placeholder - would need actual sync tracking)
    const lastFullSync = await this.getLastFullSyncTime(config.gardenId)

    return {
      devicesInvolved: Array.from(devicesInvolved),
      conflictsResolved,
      pendingSync,
      lastFullSync
    }
  }

  // Helper methods

  private async getUserIdFromDevice(deviceId: string): Promise<string> {
    // Placeholder - would need device-user mapping
    // For now, return a default user
    const user = await this.prisma.user.findFirst()
    return user?.id || 'default-user'
  }

  private inferInputMethod(intervention: any): ManualEntry['metadata']['inputMethod'] {
    // Heuristics based on intervention data
    if (intervention.notes && intervention.notes.length < 50) return 'quick_capture'
    if (intervention.detailsIntervention) return 'form'
    return 'keyboard'
  }

  private inferDeviceType(intervention: any): ManualEntry['metadata']['deviceType'] {
    // Heuristics based on data patterns
    if (intervention.geolocalisation) return 'mobile'
    if (intervention.photos && Array.isArray(intervention.photos) && intervention.photos.length > 0) return 'mobile'
    return 'desktop'
  }

  private inferDeviceFromLocation(location: any): ManualEntry['metadata']['deviceType'] {
    return location ? 'mobile' : 'desktop'
  }

  private assessInputConfidence(intervention: any): number {
    let confidence = 0.5

    // More complete data = higher confidence
    if (intervention.detailsIntervention) confidence += 0.2
    if (intervention.dureeMinutes) confidence += 0.1
    if (intervention.noteEfficacite) confidence += 0.1
    if (intervention.photos) confidence += 0.1

    return Math.min(1, confidence)
  }

  private validateInterventionCompleteness(intervention: any): boolean {
    return !!(
      intervention.dateReelle &&
      (intervention.instanceCultureId || intervention.zoneId)
    )
  }

  private validateHarvestCompleteness(harvest: any): boolean {
    return !!(
      harvest.dateRecolte &&
      harvest.zoneId &&
      (harvest.poidsTotalKg > 0 || harvest.quantiteUnites > 0)
    )
  }

  private isQuickNoteActivity(metadata: any): boolean {
    return !!(
      metadata &&
      (metadata.content || metadata.note) &&
      typeof (metadata.content || metadata.note) === 'string'
    )
  }

  private groupEntriesByTime(entries: ManualEntry[], windowMinutes: number): ManualEntry[][] {
    const groups: ManualEntry[][] = []
    const sortedEntries = [...entries].sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime())

    let currentGroup: ManualEntry[] = []
    let groupStartTime: Date | null = null

    for (const entry of sortedEntries) {
      if (!groupStartTime || 
          entry.timestamp.getTime() - groupStartTime.getTime() > windowMinutes * 60 * 1000) {
        // Start new group
        if (currentGroup.length > 0) {
          groups.push(currentGroup)
        }
        currentGroup = [entry]
        groupStartTime = entry.timestamp
      } else {
        // Add to current group
        currentGroup.push(entry)
      }
    }

    if (currentGroup.length > 0) {
      groups.push(currentGroup)
    }

    return groups
  }

  private detectConflicts(entries: ManualEntry[]): ManualEntry[][] {
    const conflicts: ManualEntry[][] = []

    // Simple conflict detection: same type + same zone + different devices
    const grouped = new Map<string, ManualEntry[]>()

    for (const entry of entries) {
      const key = `${entry.type}_${entry.zoneId || 'no_zone'}_${entry.instanceCultureId || 'no_culture'}`
      if (!grouped.has(key)) {
        grouped.set(key, [])
      }
      grouped.get(key)!.push(entry)
    }

    for (const group of grouped.values()) {
      if (group.length > 1 && new Set(group.map(e => e.deviceId)).size > 1) {
        conflicts.push(group)
      }
    }

    return conflicts
  }

  private async resolveConflicts(conflictGroups: ManualEntry[][], priorityOrder: string[]): Promise<void> {
    for (const group of conflictGroups) {
      // Sort by device priority
      group.sort((a, b) => {
        const aPriority = priorityOrder.indexOf(a.deviceId)
        const bPriority = priorityOrder.indexOf(b.deviceId)
        return (aPriority === -1 ? 999 : aPriority) - (bPriority === -1 ? 999 : bPriority)
      })

      // Mark conflicts
      for (let i = 1; i < group.length; i++) {
        group[i].validation.conflictsWith = [group[0].id]
        group[i].validation.hasErrors = true
        group[i].validation.issues.push('Duplicate entry from different device')
      }
    }
  }

  private async getLastFullSyncTime(gardenId: string): Promise<Date | undefined> {
    // Placeholder - would track actual sync times
    return undefined
  }

  /**
   * Override data freshness assessment
   */
  protected assessDataFreshness(data: ManualDataCollectionResult): number {
    if (data.entries.length === 0) return 0

    const now = Date.now()
    const avgAge = data.entries.reduce((sum, entry) => {
      return sum + (now - entry.submittedAt.getTime())
    }, 0) / data.entries.length

    // Manual data is considered fresh if submitted within sync window
    const maxFreshAge = data.timeWindow.end.getTime() - data.timeWindow.start.getTime()
    return Math.max(0, Math.min(1, 1 - (avgAge / (maxFreshAge * 2))))
  }

  /**
   * Override data validity assessment
   */
  protected assessDataValidity(data: ManualDataCollectionResult): number {
    if (data.entries.length === 0) return 0

    const validEntries = data.entries.filter(entry => 
      entry.validation.isComplete && !entry.validation.hasErrors
    ).length

    return validEntries / data.entries.length
  }

  /**
   * Cleanup resources
   */
  async disconnect(): Promise<void> {
    await this.prisma.$disconnect()
  }
}