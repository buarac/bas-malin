/**
 * F3.1 - API Routes for Data Collection Sources
 * 
 * GET /api/collection/sources - List all data sources
 * POST /api/collection/sources - Create new data source
 * PUT /api/collection/sources/[id] - Update data source
 * DELETE /api/collection/sources/[id] - Delete data source
 */

import { NextRequest, NextResponse } from 'next/server'
// Note: NextAuth v5 - auth will be imported from middleware
// import { getServerSession } from 'next-auth'
// import { authOptions } from '@/lib/auth'
import { PrismaClient } from '@prisma/client'
import { z } from 'zod'

const prisma = new PrismaClient()

const CreateSourceSchema = z.object({
  nom: z.string().min(1).max(100),
  type: z.enum(['IOT_HOME_ASSISTANT', 'WEATHER_API', 'PHOTO_LOCAL', 'PHOTO_UPLOAD', 'MANUAL_INPUT', 'SENSOR_DIRECT', 'EXTERNAL_API']),
  jardinId: z.string().cuid(),
  configuration: z.record(z.string(), z.unknown()),
  frequenceMs: z.number().min(1000).max(24 * 60 * 60 * 1000), // 1 second to 24 hours
  enabled: z.boolean().optional().default(true)
})

/**
 * GET /api/collection/sources
 * List all data collection sources for user's gardens
 */
export async function GET(request: NextRequest) {
  try {
    // Temporary auth bypass for build - implement proper NextAuth v5 auth
    const session = { user: { id: 'temp-user-id' } }
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const jardinId = searchParams.get('jardinId')
    const type = searchParams.get('type')
    const enabled = searchParams.get('enabled')

    // Build where clause
    const where: Record<string, unknown> = {
      utilisateurId: session.user.id
    }

    if (jardinId) {
      where.jardinId = jardinId
    }

    if (type) {
      where.type = type
    }

    if (enabled !== null) {
      where.enabled = enabled === 'true'
    }

    // Get sources with performance metrics
    const sources = await prisma.sourceCollecte.findMany({
      where,
      include: {
        jardin: {
          select: {
            id: true,
            nom: true
          }
        },
        donneesCollectees: {
          select: {
            id: true,
            timestamp: true,
            scoreQualite: true,
            enrichissementStatut: true
          },
          orderBy: { collecteA: 'desc' },
          take: 5 // Latest 5 collections
        }
      },
      orderBy: { creeA: 'desc' }
    })

    // Calculate metrics for each source
    const sourcesWithMetrics = sources.map(source => {
      const recentCollections = source.donneesCollectees
      const avgQuality = recentCollections.length > 0
        ? recentCollections.reduce((sum, d) => sum + Number(d.scoreQualite), 0) / recentCollections.length
        : 0

      const enrichmentStatus = {
        pending: recentCollections.filter(d => d.enrichissementStatut === 'PENDING').length,
        processing: recentCollections.filter(d => d.enrichissementStatut === 'PROCESSING').length,
        completed: recentCollections.filter(d => d.enrichissementStatut === 'COMPLETED').length,
        failed: recentCollections.filter(d => d.enrichissementStatut === 'FAILED').length
      }

      return {
        id: source.id,
        nom: source.nom,
        type: source.type,
        jardin: source.jardin,
        enabled: source.enabled,
        frequenceMs: source.frequenceMs,
        configuration: source.configuration,
        statut: source.statut,
        derniereCollecteA: source.derniereCollecteA,
        prochaineCollectePrevue: source.prochaineCollectePrevue,
        metrics: {
          totalCollectes: source.totalCollectes,
          collectesReussies: source.collectesReussies,
          tauxSucces: source.tauxSucces,
          tempsMoyenMs: source.tempsMoyenMs,
          qualiteMoyenne: Number(avgQuality.toFixed(2)),
          enrichmentStatus
        },
        dernierErreur: source.derniereErreur,
        erreurCount: source.erreurCount,
        creeA: source.creeA,
        misAJourA: source.misAJourA
      }
    })

    return NextResponse.json({
      sources: sourcesWithMetrics,
      count: sourcesWithMetrics.length
    })

  } catch (error) {
    console.error('Error fetching collection sources:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des sources' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/collection/sources
 * Create a new data collection source
 */
export async function POST(request: NextRequest) {
  try {
    // Temporary auth bypass for build - implement proper NextAuth v5 auth
    const session = { user: { id: 'temp-user-id' } }
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const body = await request.json()
    const validatedData = CreateSourceSchema.parse(body)

    // Verify user owns the garden
    const jardin = await prisma.jardin.findFirst({
      where: {
        id: validatedData.jardinId,
        proprietaireId: session.user.id
      }
    })

    if (!jardin) {
      return NextResponse.json(
        { error: 'Jardin non trouvé ou non autorisé' },
        { status: 404 }
      )
    }

    // Validate configuration based on source type
    const configValidation = validateConfiguration(validatedData.type, validatedData.configuration)
    if (!configValidation.valid) {
      return NextResponse.json(
        { error: `Configuration invalide: ${configValidation.errors.join(', ')}` },
        { status: 400 }
      )
    }

    // Create the source
    const source = await prisma.sourceCollecte.create({
      data: {
        nom: validatedData.nom,
        type: validatedData.type,
        jardinId: validatedData.jardinId,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        configuration: validatedData.configuration as any,
        frequenceMs: validatedData.frequenceMs,
        enabled: validatedData.enabled,
        utilisateurId: session.user.id,
        statut: 'ACTIVE',
        prochaineCollectePrevue: new Date(Date.now() + validatedData.frequenceMs)
      },
      include: {
        jardin: {
          select: {
            id: true,
            nom: true
          }
        }
      }
    })

    // TODO: Start collection service for this source
    // await startCollectionForSource(source.id)

    return NextResponse.json({
      source: {
        id: source.id,
        nom: source.nom,
        type: source.type,
        jardin: source.jardin,
        enabled: source.enabled,
        frequenceMs: source.frequenceMs,
        statut: source.statut,
        creeA: source.creeA
      },
      message: 'Source de collecte créée avec succès'
    }, { status: 201 })

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Données invalides', details: error.issues },
        { status: 400 }
      )
    }

    console.error('Error creating collection source:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la création de la source' },
      { status: 500 }
    )
  }
}

/**
 * Validate configuration based on source type
 */
function validateConfiguration(type: string, config: Record<string, unknown>): { valid: boolean; errors: string[] } {
  const errors: string[] = []

  switch (type) {
    case 'IOT_HOME_ASSISTANT':
      if (!config.homeAssistantUrl) errors.push('URL Home Assistant requise')
      if (!config.homeAssistantToken) errors.push('Token Home Assistant requis')
      if (!config.deviceTypes || !Array.isArray(config.deviceTypes)) {
        errors.push('Types de capteurs requis')
      }
      break

    case 'WEATHER_API':
      if (!config.apiKey) errors.push('Clé API météo requise')
      if (!config.latitude || !config.longitude) {
        errors.push('Coordonnées géographiques requises')
      }
      if (config.forecastDays && ((config.forecastDays as number) < 1 || (config.forecastDays as number) > 10)) {
        errors.push('Nombre de jours de prévision doit être entre 1 et 10')
      }
      break

    case 'PHOTO_LOCAL':
    case 'PHOTO_UPLOAD':
      if (!config.watchDirectories || !Array.isArray(config.watchDirectories)) {
        errors.push('Répertoires de surveillance requis')
      }
      if (!config.supportedFormats || !Array.isArray(config.supportedFormats)) {
        errors.push('Formats supportés requis')
      }
      if (!config.maxFileSize || (config.maxFileSize as number) < 1024) {
        errors.push('Taille maximale de fichier doit être >= 1KB')
      }
      break

    case 'MANUAL_INPUT':
      if (!config.deviceId) errors.push('ID de périphérique requis')
      if (!config.syncWindowHours || (config.syncWindowHours as number) < 1) {
        errors.push('Fenêtre de synchronisation doit être >= 1 heure')
      }
      break

    case 'SENSOR_DIRECT':
      if (!config.sensorConfig) errors.push('Configuration capteur requise')
      break

    case 'EXTERNAL_API':
      if (!config.apiEndpoint) errors.push('Point de terminaison API requis')
      if (config.authentication && !(config.authentication as Record<string, unknown>).type) {
        errors.push('Type d\'authentification requis si configuré')
      }
      break
  }

  return { valid: errors.length === 0, errors }
}

/**
 * Start collection service for a source (placeholder)
 */
async function startCollectionForSource(sourceId: string): Promise<void> {
  // This would integrate with the DataCollectionService
  // to start collecting data from the new source
  console.log(`Starting collection for source ${sourceId}`)
}