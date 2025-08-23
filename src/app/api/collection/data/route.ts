/**
 * F3.1 - API Route for Collected Data
 * 
 * GET /api/collection/data - Get collected data with filtering and pagination
 * POST /api/collection/data/enrich - Trigger enrichment for specific data
 * GET /api/collection/data/export - Export collected data
 */

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { PrismaClient } from '@prisma/client'
import { z } from 'zod'

const prisma = new PrismaClient()

const DataQuerySchema = z.object({
  jardinId: z.string().cuid(),
  sourceId: z.string().cuid().optional(),
  type: z.string().optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  enrichmentStatus: z.enum(['PENDING', 'PROCESSING', 'COMPLETED', 'FAILED', 'SKIPPED']).optional(),
  qualityMin: z.number().min(0).max(1).optional(),
  page: z.number().min(1).default(1),
  limit: z.number().min(1).max(100).default(20),
  includeEnrichments: z.boolean().default(false),
  sortBy: z.enum(['timestamp', 'quality', 'size', 'created']).default('timestamp'),
  sortOrder: z.enum(['asc', 'desc']).default('desc')
})

/**
 * GET /api/collection/data
 * Get collected data with filtering and pagination
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const query = Object.fromEntries(searchParams.entries())
    
    // Convert string parameters to appropriate types
    if (query.page) query.page = parseInt(query.page)
    if (query.limit) query.limit = parseInt(query.limit)
    if (query.qualityMin) query.qualityMin = parseFloat(query.qualityMin)
    if (query.includeEnrichments) query.includeEnrichments = query.includeEnrichments === 'true'

    const validatedQuery = DataQuerySchema.parse(query)

    // Verify user owns the garden
    const jardin = await prisma.jardin.findFirst({
      where: {
        id: validatedQuery.jardinId,
        proprietaireId: session.user.id
      }
    })

    if (!jardin) {
      return NextResponse.json({ error: 'Jardin non trouvé' }, { status: 404 })
    }

    // Build where clause
    const where: any = {
      source: {
        jardinId: validatedQuery.jardinId,
        utilisateurId: session.user.id
      }
    }

    if (validatedQuery.sourceId) {
      where.sourceId = validatedQuery.sourceId
    }

    if (validatedQuery.type) {
      where.source.type = validatedQuery.type.toUpperCase()
    }

    if (validatedQuery.startDate || validatedQuery.endDate) {
      where.timestamp = {}
      if (validatedQuery.startDate) {
        where.timestamp.gte = new Date(validatedQuery.startDate)
      }
      if (validatedQuery.endDate) {
        where.timestamp.lte = new Date(validatedQuery.endDate)
      }
    }

    if (validatedQuery.enrichmentStatus) {
      where.enrichissementStatut = validatedQuery.enrichmentStatus
    }

    if (validatedQuery.qualityMin !== undefined) {
      where.scoreQualite = {
        gte: validatedQuery.qualityMin
      }
    }

    // Calculate pagination
    const skip = (validatedQuery.page - 1) * validatedQuery.limit

    // Determine sort field
    const sortField = {
      timestamp: 'timestamp',
      quality: 'scoreQualite',
      size: 'tailleDonnees',
      created: 'collecteA'
    }[validatedQuery.sortBy]

    // Get data with pagination
    const [data, totalCount] = await Promise.all([
      prisma.donneesCollectees.findMany({
        where,
        include: {
          source: {
            select: {
              id: true,
              nom: true,
              type: true
            }
          },
          enrichissements: validatedQuery.includeEnrichments ? {
            select: {
              id: true,
              typeEnrichissement: true,
              scoreConfiance: true,
              resultat: true,
              dureeTraitementMs: true,
              coutTraitement: true,
              creeA: true
            }
          } : false
        },
        orderBy: {
          [sortField]: validatedQuery.sortOrder
        },
        skip,
        take: validatedQuery.limit
      }),
      prisma.donneesCollectees.count({ where })
    ])

    // Format response data
    const formattedData = data.map(item => ({
      id: item.id,
      source: item.source,
      timestamp: item.timestamp,
      collecteA: item.collecteA,
      donneesRaw: item.donneesRaw,
      tailleDonnees: item.tailleDonnees,
      scoreQualite: Number(item.scoreQualite),
      dureeCollecteMs: item.dureeCollecteMs,
      enrichissementStatut: item.enrichissementStatut,
      enrichissementDemarreA: item.enrichissementDemarreA,
      enrichissementTermineA: item.enrichissementTermineA,
      conflitsDetectes: item.conflitsDetectes,
      checksumDonnees: item.checksumDonnees,
      enrichissements: validatedQuery.includeEnrichments ? item.enrichissements?.map(enrichment => ({
        id: enrichment.id,
        type: enrichment.typeEnrichissement,
        confidence: Number(enrichment.scoreConfiance),
        result: enrichment.resultat,
        processingTime: enrichment.dureeTraitementMs,
        cost: Number(enrichment.coutTraitement || 0),
        createdAt: enrichment.creeA
      })) : undefined
    }))

    // Calculate summary statistics
    const summary = {
      totalItems: totalCount,
      currentPage: validatedQuery.page,
      totalPages: Math.ceil(totalCount / validatedQuery.limit),
      itemsPerPage: validatedQuery.limit,
      hasNextPage: validatedQuery.page < Math.ceil(totalCount / validatedQuery.limit),
      hasPreviousPage: validatedQuery.page > 1,
      averageQuality: data.length > 0 
        ? data.reduce((sum, item) => sum + Number(item.scoreQualite), 0) / data.length
        : 0,
      totalDataSize: data.reduce((sum, item) => sum + item.tailleDonnees, 0),
      enrichmentBreakdown: calculateEnrichmentBreakdown(data)
    }

    return NextResponse.json({
      data: formattedData,
      summary,
      filters: {
        jardinId: validatedQuery.jardinId,
        sourceId: validatedQuery.sourceId,
        type: validatedQuery.type,
        dateRange: {
          start: validatedQuery.startDate,
          end: validatedQuery.endDate
        },
        enrichmentStatus: validatedQuery.enrichmentStatus,
        qualityMin: validatedQuery.qualityMin
      }
    })

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Paramètres invalides', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Error fetching collection data:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des données' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/collection/data/enrich
 * Trigger enrichment for specific data items
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const { dataIds, priority = 5, processorTypes } = await request.json()

    if (!dataIds || !Array.isArray(dataIds) || dataIds.length === 0) {
      return NextResponse.json({ error: 'IDs de données requis' }, { status: 400 })
    }

    // Verify user owns all the data items
    const dataItems = await prisma.donneesCollectees.findMany({
      where: {
        id: { in: dataIds },
        source: {
          utilisateurId: session.user.id
        }
      },
      include: {
        source: {
          select: {
            id: true,
            type: true,
            jardinId: true
          }
        }
      }
    })

    if (dataItems.length !== dataIds.length) {
      return NextResponse.json(
        { error: 'Certaines données sont introuvables ou non autorisées' },
        { status: 404 }
      )
    }

    // Queue enrichment jobs
    const queuedJobs = []

    for (const dataItem of dataItems) {
      // Update status to processing
      await prisma.donneesCollectees.update({
        where: { id: dataItem.id },
        data: {
          enrichissementStatut: 'PROCESSING',
          enrichissementDemarreA: new Date()
        }
      })

      // Create enrichment job (in production, this would use a job queue like BullMQ)
      const job = {
        id: dataItem.id,
        type: dataItem.source.type.toLowerCase(),
        data: dataItem.donneesRaw,
        priority,
        processorTypes: processorTypes || null,
        queuedAt: new Date()
      }

      queuedJobs.push(job)

      // Emit event for enrichment service to pick up
      // In production: await enrichmentQueue.add('enrich-data', job, { priority })
    }

    return NextResponse.json({
      message: `${queuedJobs.length} éléments mis en file d'attente pour enrichissement`,
      jobs: queuedJobs.map(job => ({
        id: job.id,
        type: job.type,
        priority: job.priority,
        queuedAt: job.queuedAt
      }))
    })

  } catch (error) {
    console.error('Error queuing enrichment:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la mise en file d\'attente de l\'enrichissement' },
      { status: 500 }
    )
  }
}

/**
 * Calculate enrichment status breakdown
 */
function calculateEnrichmentBreakdown(data: any[]): any {
  const breakdown = {
    PENDING: 0,
    PROCESSING: 0,
    COMPLETED: 0,
    FAILED: 0,
    SKIPPED: 0
  }

  for (const item of data) {
    if (item.enrichissementStatut && breakdown.hasOwnProperty(item.enrichissementStatut)) {
      breakdown[item.enrichissementStatut as keyof typeof breakdown]++
    }
  }

  const total = Object.values(breakdown).reduce((sum, count) => sum + count, 0)

  return {
    counts: breakdown,
    percentages: {
      PENDING: total > 0 ? (breakdown.PENDING / total) * 100 : 0,
      PROCESSING: total > 0 ? (breakdown.PROCESSING / total) * 100 : 0,
      COMPLETED: total > 0 ? (breakdown.COMPLETED / total) * 100 : 0,
      FAILED: total > 0 ? (breakdown.FAILED / total) * 100 : 0,
      SKIPPED: total > 0 ? (breakdown.SKIPPED / total) * 100 : 0
    }
  }
}