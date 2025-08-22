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
  keyPrefix: 'bas-malin:varieties:search:'
})

const varietyService = new VarietyManagementService(prisma, cache)

// Schéma validation pour recherche avancée
const advancedSearchSchema = z.object({
  // Recherche textuelle
  query: z.string().min(2).optional(),
  
  // Filtres catégoriels
  categories: z.array(z.enum(['LEGUME', 'FRUIT', 'HERBE_AROMATIQUE', 'FLEUR', 'ARBRE', 'VIGNE'])).optional(),
  families: z.array(z.string()).optional(),
  
  // Filtres techniques
  difficultyRange: z.object({
    min: z.number().min(1).max(5),
    max: z.number().min(1).max(5)
  }).optional(),
  
  // Filtres saisonniers
  plantingMonths: z.array(z.number().min(1).max(12)).optional(),
  harvestMonths: z.array(z.number().min(1).max(12)).optional(),
  currentSeason: z.boolean().optional(),
  
  // Filtres conditions de culture
  sunExposure: z.array(z.enum(['PLEIN_SOLEIL', 'MI_OMBRE', 'OMBRE'])).optional(),
  waterNeeds: z.array(z.enum(['FAIBLE', 'MOYEN', 'ELEVE'])).optional(),
  soilTypes: z.array(z.string()).optional(),
  phRange: z.object({
    min: z.number().min(3).max(9),
    max: z.number().min(3).max(9)
  }).optional(),
  
  // Filtres utilisateur
  favoritesOnly: z.boolean().optional(),
  testedOnly: z.boolean().optional(),
  successfulOnly: z.boolean().optional(),
  
  // Options IA
  includeAI: z.boolean().optional(),
  includeCompatibilityScore: z.boolean().optional(),
  recommendationsOnly: z.boolean().optional(),
  
  // Tri et pagination
  sortBy: z.enum([
    'name', 'difficulty', 'popularity', 'performance', 
    'compatibility', 'seasonal', 'harvest_time'
  ]).optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
  offset: z.number().min(0).optional(),
  limit: z.number().min(1).max(100).optional()
})

/**
 * POST /api/varieties/search - Recherche avancée avec filtres complexes
 * Interface principale pour recherche intelligente F2.1
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    const body = await request.json()
    
    // Validation des paramètres
    const searchParams = advancedSearchSchema.parse(body)
    
    // Convertir en format service
    const serviceParams = {
      userId: session?.user?.id,
      query: searchParams.query,
      categories: searchParams.categories,
      difficultyMax: searchParams.difficultyRange?.max,
      currentMonth: searchParams.currentSeason ? new Date().getMonth() + 1 : undefined,
      favoritesOnly: searchParams.favoritesOnly,
      includeAI: searchParams.includeAI,
      includeRecommendations: searchParams.recommendationsOnly,
      sortBy: searchParams.sortBy === 'compatibility' ? 'performance' : searchParams.sortBy,
      limit: searchParams.limit || 20
    }

    // Recherche enrichie
    const result = await varietyService.searchVarieties(serviceParams)
    
    // Post-traitement selon filtres avancés
    let filteredVarieties = result.varieties

    // Filtrer par familles si spécifié
    if (searchParams.families?.length) {
      filteredVarieties = filteredVarieties.filter(v => 
        searchParams.families!.includes(v.famille || '')
      )
    }

    // Filtrer par range difficulté
    if (searchParams.difficultyRange) {
      const { min, max } = searchParams.difficultyRange
      filteredVarieties = filteredVarieties.filter(v => {
        const infosCulture = v.infosCulture as any
        const difficulty = infosCulture?.niveauDifficulte
        return difficulty && difficulty >= min && difficulty <= max
      })
    }

    // Filtrer par exposition soleil
    if (searchParams.sunExposure?.length) {
      filteredVarieties = filteredVarieties.filter(v => {
        const infosCulture = v.infosCulture as any
        return searchParams.sunExposure!.includes(infosCulture?.expositionSoleil)
      })
    }

    // Filtrer par besoins en eau
    if (searchParams.waterNeeds?.length) {
      filteredVarieties = filteredVarieties.filter(v => {
        const infosCulture = v.infosCulture as any
        return searchParams.waterNeeds!.includes(infosCulture?.besoinsEau)
      })
    }

    // Filtrer par mois de plantation
    if (searchParams.plantingMonths?.length) {
      filteredVarieties = filteredVarieties.filter(v => {
        const calendrier = v.calendrierDefaut as any
        return searchParams.plantingMonths!.some(month => 
          calendrier?.moisSemis?.includes(month) || 
          calendrier?.moisPlantation?.includes(month)
        )
      })
    }

    // Filtrer par mois de récolte
    if (searchParams.harvestMonths?.length) {
      filteredVarieties = filteredVarieties.filter(v => {
        const calendrier = v.calendrierDefaut as any
        return searchParams.harvestMonths!.some(month => 
          calendrier?.moisRecolte?.includes(month)
        )
      })
    }

    // Filtrer par pH si spécifié
    if (searchParams.phRange) {
      const { min, max } = searchParams.phRange
      filteredVarieties = filteredVarieties.filter(v => {
        const infosCulture = v.infosCulture as any
        const phOptimal = infosCulture?.phOptimal
        if (!phOptimal || !Array.isArray(phOptimal)) return true
        const [varMin, varMax] = phOptimal
        // Intersection des ranges
        return !(varMax < min || varMin > max)
      })
    }

    // Filtres utilisateur avancés
    if (session?.user?.id) {
      // Filtre "testées seulement"
      if (searchParams.testedOnly) {
        filteredVarieties = filteredVarieties.filter(v => 
          (v._userSpecific?.performance?.nombreCultivations ?? 0) > 0
        )
      }

      // Filtre "succès seulement"
      if (searchParams.successfulOnly) {
        filteredVarieties = filteredVarieties.filter(v => 
          (v._userSpecific?.performance?.tauxReussite ?? 0) > 0.7
        )
      }
    }

    // Tri personnalisé
    if (searchParams.sortBy && searchParams.sortBy !== 'name') {
      filteredVarieties = sortVarieties(filteredVarieties, searchParams.sortBy, searchParams.sortOrder)
    }

    // Pagination
    const offset = searchParams.offset || 0
    const limit = searchParams.limit || 20
    const paginatedVarieties = filteredVarieties.slice(offset, offset + limit)

    // Statistiques de recherche
    const searchStats = {
      totalFound: filteredVarieties.length,
      totalFiltered: result.totalCount,
      hasMore: offset + limit < filteredVarieties.length,
      filters: {
        applied: Object.keys(searchParams).length,
        userId: session?.user?.id || null
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        varieties: paginatedVarieties,
        filters: result.filters,
        recommendations: result.recommendations,
        stats: searchStats
      },
      meta: {
        timestamp: new Date().toISOString(),
        searchParams,
        performance: {
          cached: true, // Sera dynamique selon cache hit/miss
          executionTime: Date.now() // Placeholder
        }
      }
    })

  } catch (error) {
    console.error('Erreur API POST /varieties/search:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json({
        success: false,
        error: 'Paramètres de recherche invalides',
        details: error.issues.map(issue => ({
          path: issue.path.join('.'),
          message: issue.message
        }))
      }, { status: 400 })
    }

    return NextResponse.json({
      success: false,
      error: 'Erreur lors de la recherche'
    }, { status: 500 })
  }
}

/**
 * GET /api/varieties/search - Obtenir les filtres disponibles
 */
export async function GET() {
  try {
    const session = await auth()
    
    // Obtenir statistiques pour construire filtres dynamiques
    const stats = await varietyService.getVarietyStats(session?.user?.id)
    
    // Obtenir filtres disponibles
    const searchResult = await varietyService.searchVarieties({ 
      userId: session?.user?.id,
      limit: 1 
    })

    return NextResponse.json({
      success: true,
      data: {
        availableFilters: searchResult.filters,
        stats,
        userContext: session?.user?.id ? {
          hasVarieties: (stats as any).userVarieties > 0,
          hasFavorites: (stats as any).favoriteVarieties > 0
        } : null
      }
    })

  } catch (error) {
    console.error('Erreur API GET /varieties/search:', error)
    return NextResponse.json({
      success: false,
      error: 'Erreur lors de la récupération des filtres'
    }, { status: 500 })
  }
}

/**
 * Fonction utilitaire pour tri avancé des variétés
 */
function sortVarieties(varieties: any[], sortBy: string, order: string = 'asc') {
  const multiplier = order === 'desc' ? -1 : 1
  
  return varieties.sort((a, b) => {
    let comparison = 0

    switch (sortBy) {
      case 'difficulty':
        const diffA = (a.infosCulture as any)?.niveauDifficulte || 0
        const diffB = (b.infosCulture as any)?.niveauDifficulte || 0
        comparison = diffA - diffB
        break

      case 'popularity':
        const popA = a._count?.varietesUtilisateur || 0
        const popB = b._count?.varietesUtilisateur || 0
        comparison = popA - popB
        break

      case 'performance':
        const perfA = a._userSpecific?.performance?.tauxReussite || 0
        const perfB = b._userSpecific?.performance?.tauxReussite || 0
        comparison = perfA - perfB
        break

      case 'compatibility':
        const compA = (a as any)._aiInsights?.compatibilityScore || 0
        const compB = (b as any)._aiInsights?.compatibilityScore || 0
        comparison = compA - compB
        break

      case 'harvest_time':
        const harvestA = ((a.infosCulture as any)?.joursRecolte || 999)
        const harvestB = ((b.infosCulture as any)?.joursRecolte || 999)
        comparison = harvestA - harvestB
        break

      case 'seasonal':
        const currentMonth = new Date().getMonth() + 1
        const seasonalA = isSeasonallyAppropriate(a, currentMonth) ? 1 : 0
        const seasonalB = isSeasonallyAppropriate(b, currentMonth) ? 1 : 0
        comparison = seasonalA - seasonalB
        break

      default: // 'name'
        comparison = a.nomCommun.localeCompare(b.nomCommun)
    }

    return comparison * multiplier
  })
}

/**
 * Vérifier si une variété est appropriée pour la saison
 */
function isSeasonallyAppropriate(variety: any, currentMonth: number): boolean {
  const calendrier = variety.calendrierDefaut as any
  if (!calendrier) return false
  
  return (
    calendrier.moisSemis?.includes(currentMonth) ||
    calendrier.moisPlantation?.includes(currentMonth) ||
    calendrier.moisRecolte?.includes(currentMonth)
  )
}