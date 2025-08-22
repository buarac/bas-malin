/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { PrismaClient } from '@prisma/client'
import { CacheService } from '@/lib/cache/cache.service'
import { VarietyManagementService } from '@/lib/services/variety-management.service'
import { z } from 'zod'

const prisma = new PrismaClient()
const cache = new CacheService({
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  keyPrefix: 'bas-malin:varieties:'
})

const varietyService = new VarietyManagementService(prisma, cache)

// Schéma validation pour GET search
const searchSchema = z.object({
  query: z.string().optional(),
  categories: z.string().optional(), // Comma-separated
  difficultyMax: z.coerce.number().min(1).max(5).optional(),
  currentMonth: z.coerce.number().min(1).max(12).optional(),
  favoritesOnly: z.coerce.boolean().optional(),
  includeAI: z.coerce.boolean().optional(),
  includeRecommendations: z.coerce.boolean().optional(),
  sortBy: z.enum(['name', 'difficulty', 'popularity', 'performance']).optional(),
  limit: z.coerce.number().min(1).max(100).optional()
})

/**
 * GET /api/varieties - Recherche et liste des variétés
 * Support de tous les filtres et recherche intelligente F2.1
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    const { searchParams } = new URL(request.url)
    
    // Validation paramètres
    const validatedParams = searchSchema.parse(Object.fromEntries(searchParams.entries()))
    
    // Conversion paramètres
    const searchFilters = {
      userId: session?.user?.id,
      query: validatedParams.query,
      categories: validatedParams.categories?.split(',') as any,
      difficultyMax: validatedParams.difficultyMax,
      currentMonth: validatedParams.currentMonth,
      favoritesOnly: validatedParams.favoritesOnly,
      includeAI: validatedParams.includeAI,
      includeRecommendations: validatedParams.includeRecommendations,
      sortBy: validatedParams.sortBy,
      limit: validatedParams.limit
    }

    // Recherche via service
    const result = await varietyService.searchVarieties(searchFilters)
    
    return NextResponse.json({
      success: true,
      data: result,
      meta: {
        timestamp: new Date().toISOString(),
        userId: session?.user?.id,
        filters: validatedParams
      }
    })

  } catch (error) {
    console.error('Erreur API GET /varieties:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json({
        success: false,
        error: 'Paramètres invalides',
        details: error.issues
      }, { status: 400 })
    }

    return NextResponse.json({
      success: false,
      error: 'Erreur interne du serveur'
    }, { status: 500 })
  }
}

// Schéma validation pour POST create variety
const createVarietySchema = z.object({
  nomScientifique: z.string().optional(),
  nomCommun: z.string().min(1).max(200),
  famille: z.string().max(100).optional(),
  categorie: z.enum(['LEGUME', 'FRUIT', 'HERBE_AROMATIQUE', 'FLEUR', 'ARBRE', 'VIGNE']),
  infosCulture: z.object({
    profondeurPlantationCm: z.number(),
    espacementCm: z.number(),
    expositionSoleil: z.enum(['PLEIN_SOLEIL', 'MI_OMBRE', 'OMBRE']),
    joursGermination: z.number(),
    joursRecolte: z.number(),
    dureeRecolte: z.number().optional(),
    temperatureMinSemis: z.number(),
    temperatureOptimaleCroissance: z.array(z.number()).length(2),
    besoinsEau: z.enum(['FAIBLE', 'MOYEN', 'ELEVE']),
    typesolPrefere: z.array(z.string()),
    phOptimal: z.array(z.number()).length(2),
    plantesCompagnes: z.array(z.string()),
    plantesIncompatibles: z.array(z.string()),
    niveauDifficulte: z.number().min(1).max(5),
    conseilsCulture: z.array(z.string()),
    problemesCourants: z.array(z.string()),
    rendementMoyenKgM2: z.number().optional(),
    hauteurMoyenneCm: z.number().optional(),
    resistanceFroid: z.boolean().optional(),
    resistanceMaladies: z.array(z.string()).optional()
  }),
  calendrierDefaut: z.object({
    moisSemis: z.array(z.number().min(1).max(12)),
    moisPlantation: z.array(z.number().min(1).max(12)),
    moisRecolte: z.array(z.number().min(1).max(12))
  }),
  photos: z.array(z.object({
    url: z.string().url(),
    legende: z.string().optional(),
    type: z.string().optional()
  })).optional(),
  liens: z.array(z.object({
    url: z.string().url(),
    titre: z.string(),
    type: z.string().optional()
  })).optional()
})

/**
 * POST /api/varieties - Créer une variété personnalisée
 * Réservé aux utilisateurs EXPERT
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    
    if (!session?.user) {
      return NextResponse.json({
        success: false,
        error: 'Authentification requise'
      }, { status: 401 })
    }

    // Vérifier permissions EXPERT
    const user = await prisma.user.findUnique({
      where: { id: session.user.id }
    })

    if (user?.typeProfil !== 'EXPERT') {
      return NextResponse.json({
        success: false,
        error: 'Permissions insuffisantes - profil EXPERT requis'
      }, { status: 403 })
    }

    const body = await request.json()
    const validatedData = createVarietySchema.parse(body)

    // Créer la variété personnalisée
    const newVariety = await prisma.varieteCulture.create({
      data: {
        ...validatedData,
        sourceDonnees: 'MANUEL',
        estPersonnalise: true,
        creeParId: session.user.id
      }
    })

    // Invalider cache recherche
    await cache.invalidatePattern('*searchVarieties*')

    return NextResponse.json({
      success: true,
      data: newVariety,
      message: 'Variété personnalisée créée avec succès'
    }, { status: 201 })

  } catch (error) {
    console.error('Erreur API POST /varieties:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json({
        success: false,
        error: 'Données invalides',
        details: error.issues
      }, { status: 400 })
    }

    return NextResponse.json({
      success: false,
      error: 'Erreur interne du serveur'
    }, { status: 500 })
  }
}

/**
 * OPTIONS /api/varieties - CORS preflight
 */
export async function OPTIONS() {
  return NextResponse.json({}, { 
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    }
  })
}