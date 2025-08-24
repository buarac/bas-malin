/**
 * F3.1 - Photo Data Collector
 * 
 * Collects and processes garden photos from:
 * - Local photo directories (watch folders)
 * - Recent uploads
 * - Scheduled photo captures
 * - EXIF metadata extraction
 * - Geolocation data
 */

import { BaseCollector, CollectorConfig } from '../base-collector'
import { PrismaClient, Prisma } from '@prisma/client'
import * as fs from 'fs/promises'
import * as path from 'path'
// TODO: Install exifreader package when needed
// import ExifReader from 'exifreader'

export interface PhotoCollectorConfig extends CollectorConfig {
  gardenId: string
  watchDirectories: string[]
  uploadDirectory?: string
  supportedFormats: string[] // ['.jpg', '.jpeg', '.png', '.tiff']
  maxFileSize: number // bytes
  minFileAge: number // minutes - avoid processing files still being written
  maxPhotosPerCollection: number
  processExif: boolean
  extractGps: boolean
  autoOrganize: boolean // Organize photos by date/location
}

export interface PhotoMetadata {
  filename: string
  filePath: string
  size: number // bytes
  format: string
  createdAt: Date
  modifiedAt: Date
  exif?: {
    camera?: {
      make?: string
      model?: string
      software?: string
    }
    capture?: {
      dateTime?: Date
      iso?: number
      aperture?: number
      shutterSpeed?: string
      focalLength?: number
      flash?: boolean
    }
    gps?: {
      latitude?: number
      longitude?: number
      altitude?: number
      accuracy?: number
    }
    dimensions?: {
      width: number
      height: number
      orientation?: number
    }
  }
}

export interface ProcessedPhoto {
  id: string
  metadata: PhotoMetadata
  url: string // Local file path or uploaded URL
  timestamp: Date // When photo was taken (from EXIF or file date)
  location?: {
    latitude: number
    longitude: number
    zoneId?: string // Matched garden zone
    accuracy: number
  }
  gardenContext?: {
    season: string
    estimatedStage?: string // 'seedling', 'growing', 'flowering', 'fruiting'
    weatherConditions?: Record<string, unknown> // From concurrent weather data
  }
  quality: {
    resolution: 'low' | 'medium' | 'high' | 'ultra'
    brightness: 'dark' | 'normal' | 'bright'
    focus: 'poor' | 'fair' | 'good' | 'excellent'
    overall: number // 0-1 score
  }
  processingFlags: {
    needsAIAnalysis: boolean
    needsGeocoding: boolean
    needsOrganizing: boolean
    hasErrors: boolean
  }
}

export interface PhotoCollectionResult extends Record<string, unknown> {
  type: 'photo'
  gardenId: string
  photos: ProcessedPhoto[]
  collectionTimestamp: Date
  sources: {
    watchDirectories: number
    uploads: number
    scheduled: number
  }
  processing: {
    totalPhotos: number
    processedPhotos: number
    skippedPhotos: number
    errorPhotos: number
    duplicatesFound: number
  }
  storage: {
    totalSizeBytes: number
    averageSizeBytes: number
    organizationChanges: number
  }
}

/**
 * Photo Data Collector for garden image processing
 */
export class PhotoCollector extends BaseCollector {
  readonly type = 'photo'
  private prisma: PrismaClient
  private processedFiles = new Set<string>() // Track processed files to avoid duplicates

  constructor(config: PhotoCollectorConfig) {
    super(config)
    this.prisma = new PrismaClient()
  }

  /**
   * Main collection method
   */
  async collect(config: PhotoCollectorConfig): Promise<PhotoCollectionResult> {
    const startTime = Date.now()
    const photos: ProcessedPhoto[] = []
    const sources = { watchDirectories: 0, uploads: 0, scheduled: 0 }
    const processing = { 
      totalPhotos: 0, 
      processedPhotos: 0, 
      skippedPhotos: 0, 
      errorPhotos: 0, 
      duplicatesFound: 0 
    }

    try {
      // 1. Scan watch directories
      const watchPhotos = await this.scanWatchDirectories(config)
      photos.push(...watchPhotos)
      sources.watchDirectories = watchPhotos.length

      // 2. Process recent uploads
      const uploadPhotos = await this.processRecentUploads(config)
      photos.push(...uploadPhotos)
      sources.uploads = uploadPhotos.length

      // 3. Check for scheduled captures (future feature)
      // const scheduledPhotos = await this.processScheduledCaptures(config)
      // photos.push(...scheduledPhotos)
      // sources.scheduled = scheduledPhotos.length

      processing.totalPhotos = photos.length
      processing.processedPhotos = photos.filter(p => !p.processingFlags.hasErrors).length
      processing.errorPhotos = photos.filter(p => p.processingFlags.hasErrors).length

      // 4. Calculate storage statistics
      const totalSize = photos.reduce((sum, photo) => sum + photo.metadata.size, 0)
      const averageSize = photos.length > 0 ? totalSize / photos.length : 0

      const result: PhotoCollectionResult = {
        type: 'photo',
        gardenId: config.gardenId,
        photos,
        collectionTimestamp: new Date(),
        sources,
        processing,
        storage: {
          totalSizeBytes: totalSize,
          averageSizeBytes: averageSize,
          organizationChanges: 0 // Placeholder for auto-organization feature
        }
      }

      this.emit('photoCollectionComplete', {
        duration: Date.now() - startTime,
        photosProcessed: processing.processedPhotos,
        errorsEncountered: processing.errorPhotos
      })

      return result

    } catch (error) {
      throw new Error(`Photo collection failed: ${error}`)
    }
  }

  /**
   * Scan watch directories for new photos
   */
  private async scanWatchDirectories(config: PhotoCollectorConfig): Promise<ProcessedPhoto[]> {
    const photos: ProcessedPhoto[] = []
    const now = Date.now()
    const minAgeMs = config.minFileAge * 60 * 1000

    for (const directory of config.watchDirectories) {
      try {
        // Check if directory exists
        const stats = await fs.stat(directory)
        if (!stats.isDirectory()) continue

        // Scan directory recursively
        const files = await this.scanDirectoryRecursive(directory, config.supportedFormats)

        for (const filePath of files) {
          try {
            const fileStats = await fs.stat(filePath)

            // Skip files that are too new (might still be writing)
            if (now - fileStats.mtime.getTime() < minAgeMs) continue

            // Skip files that are too large
            if (fileStats.size > config.maxFileSize) continue

            // Skip already processed files
            const fileKey = `${filePath}_${fileStats.mtime.getTime()}`
            if (this.processedFiles.has(fileKey)) continue

            // Process the photo
            const photo = await this.processPhoto(filePath, config)
            if (photo) {
              photos.push(photo)
              this.processedFiles.add(fileKey)

              // Respect max photos per collection
              if (photos.length >= config.maxPhotosPerCollection) break
            }

          } catch (error) {
            this.emit('photoProcessingError', { filePath, error })
          }
        }

        if (photos.length >= config.maxPhotosPerCollection) break

      } catch (error) {
        this.emit('directoryError', { directory, error })
      }
    }

    return photos
  }

  /**
   * Process recent uploads from database
   */
  private async processRecentUploads(config: PhotoCollectorConfig): Promise<ProcessedPhoto[]> {
    const photos: ProcessedPhoto[] = []

    try {
      // Get recent photos from database (uploaded in last 24 hours)
      const recentUploads = await this.prisma.recolte.findMany({
        where: {
          zoneId: { in: await this.getZoneIds(config.gardenId) },
          creeA: {
            gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // Last 24 hours
          },
          photos: {
            not: Prisma.AnyNull
          }
        },
        take: config.maxPhotosPerCollection
      })

      for (const recolte of recentUploads) {
        const photosJson = recolte.photos as Record<string, unknown>[]
        if (Array.isArray(photosJson)) {
          for (const photoInfo of photosJson) {
            if (photoInfo.url) {
              const photo = await this.processUploadedPhoto(photoInfo, recolte, config)
              if (photo) photos.push(photo)
            }
          }
        }
      }

    } catch (error) {
      this.emit('uploadProcessingError', error)
    }

    return photos
  }

  /**
   * Process individual photo file
   */
  private async processPhoto(filePath: string, config: PhotoCollectorConfig): Promise<ProcessedPhoto | null> {
    try {
      // 1. Extract basic file metadata
      const fileStats = await fs.stat(filePath)
      const filename = path.basename(filePath)
      const format = path.extname(filePath).toLowerCase()

      // 2. Extract EXIF data if enabled
      let exif: PhotoMetadata['exif'] | undefined
      if (config.processExif) {
        exif = await this.extractExifData(filePath)
      }

      // 3. Create photo metadata
      const metadata: PhotoMetadata = {
        filename,
        filePath,
        size: fileStats.size,
        format,
        createdAt: fileStats.birthtime || fileStats.ctime,
        modifiedAt: fileStats.mtime,
        exif
      }

      // 4. Determine photo timestamp (prefer EXIF date)
      const timestamp = exif?.capture?.dateTime || metadata.createdAt

      // 5. Extract GPS location if available
      let location: ProcessedPhoto['location']
      if (config.extractGps && exif?.gps?.latitude && exif?.gps?.longitude) {
        location = {
          latitude: exif.gps.latitude,
          longitude: exif.gps.longitude,
          accuracy: exif.gps.accuracy || 10,
          zoneId: await this.matchPhotoToZone(exif.gps.latitude, exif.gps.longitude, config.gardenId)
        }
      }

      // 6. Assess photo quality
      const quality = this.assessPhotoQuality(metadata)

      // 7. Determine processing flags
      const processingFlags = {
        needsAIAnalysis: quality.overall > 0.5 && this.isGardenPhoto(metadata),
        needsGeocoding: !location && this.couldHaveLocation(metadata),
        needsOrganizing: config.autoOrganize,
        hasErrors: false
      }

      const photo: ProcessedPhoto = {
        id: this.generatePhotoId(filePath, timestamp),
        metadata,
        url: filePath,
        timestamp,
        location,
        quality,
        processingFlags
      }

      return photo

    } catch (error) {
      this.emit('photoProcessingError', { filePath, error })
      return null
    }
  }

  /**
   * Process uploaded photo from database
   */
  private async processUploadedPhoto(
    photoInfo: Record<string, unknown>,
    recolte: Record<string, unknown>,
    config: PhotoCollectorConfig
  ): Promise<ProcessedPhoto | null> {
    try {
      const metadata: PhotoMetadata = {
        filename: (photoInfo.filename as string) || 'upload.jpg',
        filePath: photoInfo.url as string,
        size: (photoInfo.size as number) || 0,
        format: (photoInfo.format as string) || '.jpg',
        createdAt: photoInfo.priseA ? new Date(photoInfo.priseA as string) : new Date(recolte.creeA as string),
        modifiedAt: new Date((recolte.misAJourA || recolte.creeA) as string)
      }

      // Get location from harvest zone
      const zone = await this.prisma.zone.findUnique({
        where: { id: recolte.zoneId as string },
        include: { jardin: true }
      })

      let location: ProcessedPhoto['location']
      if (zone?.jardin.localisation) {
        const jardinLocation = zone.jardin.localisation as Record<string, unknown>
        if (jardinLocation.latitude && jardinLocation.longitude) {
          location = {
            latitude: jardinLocation.latitude as number,
            longitude: jardinLocation.longitude as number,
            accuracy: 100, // Garden-level accuracy
            zoneId: zone.id
          }
        }
      }

      const quality = this.assessPhotoQuality(metadata)
      
      const photo: ProcessedPhoto = {
        id: this.generatePhotoId(photoInfo.url as string, metadata.createdAt),
        metadata,
        url: photoInfo.url as string,
        timestamp: metadata.createdAt,
        location,
        quality,
        processingFlags: {
          needsAIAnalysis: true, // Uploads are likely garden photos
          needsGeocoding: false, // Already have location from zone
          needsOrganizing: false,
          hasErrors: false
        }
      }

      return photo

    } catch (error) {
      this.emit('uploadPhotoError', { photoInfo, error })
      return null
    }
  }

  /**
   * Recursively scan directory for supported image files
   */
  private async scanDirectoryRecursive(dirPath: string, supportedFormats: string[]): Promise<string[]> {
    const files: string[] = []

    try {
      const entries = await fs.readdir(dirPath, { withFileTypes: true })

      for (const entry of entries) {
        const fullPath = path.join(dirPath, entry.name)

        if (entry.isDirectory()) {
          // Recursively scan subdirectories
          const subFiles = await this.scanDirectoryRecursive(fullPath, supportedFormats)
          files.push(...subFiles)
        } else if (entry.isFile()) {
          // Check if file has supported format
          const ext = path.extname(entry.name).toLowerCase()
          if (supportedFormats.includes(ext)) {
            files.push(fullPath)
          }
        }
      }
    } catch (error) {
      this.emit('directoryError', { dirPath, error })
    }

    return files
  }

  /**
   * Extract EXIF data from image file
   */
  private async extractExifData(filePath: string): Promise<PhotoMetadata['exif']> {
    try {
      // TODO: Implement ExifReader when package is installed
      // const buffer = await fs.readFile(filePath)
      // const tags = ExifReader.load(buffer)
      const tags: Record<string, unknown> = {} // Temporary placeholder

      const exif: PhotoMetadata['exif'] = {}

      // TODO: Implement camera information extraction when ExifReader is available
      // Camera information
      // if (tags.Make?.description || tags.Model?.description) {
      //   exif.camera = {
      //     make: tags.Make?.description,
      //     model: tags.Model?.description,
      //     software: tags.Software?.description
      //   }
      // }

      // TODO: Implement capture settings extraction when ExifReader is available
      // Capture settings
      // const captureData: Record<string, unknown> = {}
      // if (tags.DateTime?.description) {
      //   captureData.dateTime = new Date(tags.DateTime.description)
      // } else if (tags.DateTimeOriginal?.description) {
      //   captureData.dateTime = new Date(tags.DateTimeOriginal.description)
      // }
      // 
      // if (tags.ISOSpeedRatings?.value) captureData.iso = tags.ISOSpeedRatings.value
      // if (tags.FNumber?.description) captureData.aperture = parseFloat(tags.FNumber.description)
      // if (tags.ExposureTime?.description) captureData.shutterSpeed = tags.ExposureTime.description
      // if (tags.FocalLength?.description) captureData.focalLength = parseFloat(tags.FocalLength.description)
      // if (tags.Flash?.description) captureData.flash = tags.Flash.description.includes('fired')
      //
      // if (Object.keys(captureData).length > 0) {
      //   exif.capture = captureData as PhotoMetadata['exif']['capture']
      // }

      // TODO: Implement GPS information extraction when ExifReader is available
      // GPS information
      // if (tags.GPSLatitude && tags.GPSLongitude) {
      //   const lat = this.parseGPSCoordinate(tags.GPSLatitude as Record<string, unknown>, tags.GPSLatitudeRef?.description)
      //   const lng = this.parseGPSCoordinate(tags.GPSLongitude as Record<string, unknown>, tags.GPSLongitudeRef?.description)
      //   
      //   if (lat !== null && lng !== null) {
      //     exif.gps = {
      //       latitude: lat,
      //       longitude: lng,
      //       altitude: tags.GPSAltitude?.value,
      //       accuracy: tags.GPSHPositioningError?.value || 10
      //     }
      //   }
      // }

      // TODO: Implement image dimensions extraction when ExifReader is available
      // Image dimensions
      // if (tags.PixelXDimension?.value || tags.ImageWidth?.value) {
      //   exif.dimensions = {
      //     width: tags.PixelXDimension?.value || tags.ImageWidth?.value,
      //     height: tags.PixelYDimension?.value || tags.ImageHeight?.value,
      //     orientation: tags.Orientation?.value
      //   }
      // }

      return Object.keys(exif).length > 0 ? exif : undefined

    } catch (error) {
      this.emit('exifError', { filePath, error })
      return undefined
    }
  }

  /**
   * Parse GPS coordinate from EXIF tags
   */
  private parseGPSCoordinate(coordinate: Record<string, unknown>, ref?: string): number | null {
    if (!coordinate || !coordinate.value) return null

    const [degrees, minutes, seconds] = coordinate.value as number[]
    let decimal = degrees + (minutes / 60) + (seconds / 3600)

    // Apply hemisphere
    if (ref && (ref.includes('S') || ref.includes('W'))) {
      decimal = -decimal
    }

    return decimal
  }

  /**
   * Assess photo quality based on metadata
   */
  private assessPhotoQuality(metadata: PhotoMetadata): ProcessedPhoto['quality'] {
    let score = 0.5 // Base score

    // Resolution assessment
    let resolution: 'low' | 'medium' | 'high' | 'ultra' = 'medium'
    if (metadata.exif?.dimensions) {
      const pixels = metadata.exif.dimensions.width * metadata.exif.dimensions.height
      if (pixels > 8000000) resolution = 'ultra' // >8MP
      else if (pixels > 3000000) resolution = 'high' // >3MP
      else if (pixels > 1000000) resolution = 'medium' // >1MP
      else resolution = 'low'

      score += (resolution === 'ultra' ? 0.3 : resolution === 'high' ? 0.2 : resolution === 'medium' ? 0.1 : 0)
    }

    // File size as quality indicator
    const sizeScore = Math.min(0.2, metadata.size / (5 * 1024 * 1024)) // Up to 0.2 for 5MB+
    score += sizeScore

    // EXIF data presence indicates better quality
    if (metadata.exif?.capture) score += 0.1
    if (metadata.exif?.gps) score += 0.1

    // Simple heuristics for brightness and focus (placeholder - would need actual image analysis)
    const brightness = 'normal' // Placeholder
    const focus = 'good' // Placeholder

    return {
      resolution,
      brightness,
      focus,
      overall: Math.min(1, score)
    }
  }

  /**
   * Check if photo is likely a garden photo based on metadata
   */
  private isGardenPhoto(metadata: PhotoMetadata): boolean {
    // Simple heuristics - in real implementation, could use AI or file location
    const filename = metadata.filename.toLowerCase()
    const gardenKeywords = ['garden', 'jardin', 'plant', 'plante', 'culture', 'recolte', 'harvest']
    
    return gardenKeywords.some(keyword => filename.includes(keyword)) ||
           metadata.exif?.gps !== undefined // Photos with GPS are more likely to be garden photos
  }

  /**
   * Check if photo could potentially have location data
   */
  private couldHaveLocation(metadata: PhotoMetadata): boolean {
    // Modern smartphones and cameras with GPS capability
    const hasCamera = Boolean(metadata.exif?.camera?.make || metadata.exif?.camera?.model)
    const recentPhoto = metadata.createdAt.getTime() > Date.now() - (30 * 24 * 60 * 60 * 1000) // Last 30 days
    
    return hasCamera && recentPhoto
  }

  /**
   * Match photo GPS coordinates to garden zone
   */
  private async matchPhotoToZone(latitude: number, longitude: number, gardenId: string): Promise<string | undefined> {
    try {
      // Simple implementation - find closest zone
      // In production, would use proper geographical calculations
      const zones = await this.prisma.zone.findMany({
        where: { jardinId: gardenId },
        include: { jardin: true }
      })

      let closestZone: string | undefined
      let minDistance = Infinity

      for (const zone of zones) {
        const jardinLocation = zone.jardin.localisation as Record<string, unknown>
        if (jardinLocation.latitude && jardinLocation.longitude) {
          const distance = this.calculateDistance(
            latitude, longitude,
            jardinLocation.latitude as number, jardinLocation.longitude as number
          )
          
          if (distance < minDistance && distance < 0.1) { // Within 100m
            minDistance = distance
            closestZone = zone.id
          }
        }
      }

      return closestZone

    } catch (error) {
      this.emit('zoneMatchingError', error)
      return undefined
    }
  }

  /**
   * Calculate distance between two GPS points (simplified)
   */
  private calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const R = 6371 // Earth's radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180
    const dLng = (lng2 - lng1) * Math.PI / 180
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLng/2) * Math.sin(dLng/2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
    return R * c
  }

  /**
   * Get zone IDs for a garden
   */
  private async getZoneIds(gardenId: string): Promise<string[]> {
    const zones = await this.prisma.zone.findMany({
      where: { jardinId: gardenId },
      select: { id: true }
    })
    return zones.map(z => z.id)
  }

  /**
   * Generate unique photo ID
   */
  private generatePhotoId(path: string, timestamp: Date): string {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const crypto = require('crypto')
    const hash = crypto.createHash('md5')
      .update(path + timestamp.toISOString())
      .digest('hex')
    return hash.substring(0, 12)
  }

  /**
   * Override data validity assessment
   */
  protected assessDataValidity(data: PhotoCollectionResult): number {
    if (data.photos.length === 0) return 0

    const validPhotos = data.photos.filter(photo => 
      !photo.processingFlags.hasErrors &&
      photo.quality.overall > 0.3 &&
      photo.metadata.size > 1024 // At least 1KB
    ).length

    return validPhotos / data.photos.length
  }

  /**
   * Cleanup resources
   */
  async disconnect(): Promise<void> {
    await this.prisma.$disconnect()
    this.processedFiles.clear()
  }
}