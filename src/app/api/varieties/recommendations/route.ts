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
  keyPrefix: 'bas-malin:varieties:recommendations:'
})

const varietyService = new VarietyManagementService(prisma, cache)

// Schéma pour paramètres de recommandation
const recommendationParamsSchema = z.object({
  context: z.enum(['seasonal', 'beginner', 'advanced', 'similar', 'complementary']).optional(),
  limit: z.number().min(1).max(20).optional(),
  categories: z.array(z.enum(['LEGUME', 'FRUIT', 'HERBE_AROMATIQUE', 'FLEUR', 'ARBRE', 'VIGNE'])).optional(),
  excludeFailures: z.boolean().optional(), // Exclure variétés qui ont échoué
  seasonalOnly: z.boolean().optional(), // Uniquement variétés de saison
  difficulty: z.object({
    max: z.number().min(1).max(5).optional(),
    adaptToUser: z.boolean().optional() // Adapter à l'expérience utilisateur
  }).optional()
})

/**
 * GET /api/varieties/recommendations - Obtenir recommandations personnalisées
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    
    if (!session?.user) {
      return NextResponse.json({
        success: false,
        error: 'Authentification requise pour les recommandations personnalisées'
      }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const params = recommendationParamsSchema.parse(Object.fromEntries(searchParams.entries()))

    // Obtenir recommandations de base du service
    const recommendations = await varietyService.getPersonalizedRecommendations(session.user.id)
    
    // Appliquer filtres spécifiques
    let filteredRecommendations = recommendations

    // Filtrer par contexte
    if (params.context) {
      filteredRecommendations = await filterByContext(
        filteredRecommendations, 
        params.context, 
        session.user.id
      )
    }

    // Filtrer par catégories
    if (params.categories?.length) {
      filteredRecommendations = filteredRecommendations.filter(rec =>
        params.categories!.includes(rec.variete.categorie)
      )
    }

    // Filtrer saisonnier
    if (params.seasonalOnly) {
      const currentMonth = new Date().getMonth() + 1
      filteredRecommendations = filteredRecommendations.filter(rec => {
        const calendrier = rec.variete.calendrierDefaut as any
        return (
          calendrier?.moisSemis?.includes(currentMonth) ||
          calendrier?.moisPlantation?.includes(currentMonth)
        )
      })
    }

    // Appliquer limite
    const limit = params.limit || 5
    const limitedRecommendations = filteredRecommendations.slice(0, limit)

    // Enrichir avec données contextuelles
    const enrichedRecommendations = await enrichRecommendations(
      limitedRecommendations,
      session.user.id,
      params
    )

    // Calculer métriques globales
    const metrics = {
      totalAvailable: recommendations.length,
      afterFiltering: filteredRecommendations.length,
      returned: enrichedRecommendations.length,
      averageScore: enrichedRecommendations.reduce((sum, r) => sum + r.scoreRecommandation, 0) / enrichedRecommendations.length || 0,
      averageSuccessProbability: enrichedRecommendations.reduce((sum, r) => sum + r.probabiliteSucces, 0) / enrichedRecommendations.length || 0
    }

    return NextResponse.json({
      success: true,
      data: {
        recommendations: enrichedRecommendations,
        context: params.context || 'general',
        metrics,
        userProfile: await getUserRecommendationProfile(session.user.id)
      },
      meta: {
        timestamp: new Date().toISOString(),
        userId: session.user.id,
        filters: params
      }
    })

  } catch (error) {
    console.error('Erreur API GET /varieties/recommendations:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json({
        success: false,
        error: 'Paramètres de recommandation invalides',
        details: error.issues
      }, { status: 400 })
    }

    return NextResponse.json({
      success: false,
      error: 'Erreur lors de la génération des recommandations'
    }, { status: 500 })
  }
}

/**
 * POST /api/varieties/recommendations/feedback - Feedback sur recommandation
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

    const body = await request.json()
    const feedbackSchema = z.object({
      varietyId: z.string(),
      feedback: z.enum(['interested', 'not_interested', 'already_tried', 'too_difficult', 'not_seasonal']),
      reason: z.string().optional(),
      wouldTry: z.boolean().optional()
    })

    const validatedFeedback = feedbackSchema.parse(body)

    // Enregistrer feedback pour améliorer futures recommandations
    // Pour le moment, on se contente de logguer - sera amélioré en Phase 14
    console.log('Recommendation feedback:', {
      userId: session.user.id,
      varietyId: validatedFeedback.varietyId,
      feedback: validatedFeedback.feedback,
      timestamp: new Date().toISOString()
    })

    // Optionnel: Marquer comme "pas intéressé" si feedback négatif
    if (['not_interested', 'too_difficult'].includes(validatedFeedback.feedback)) {
      // Ajouter à une liste de variétés à éviter pour cet utilisateur
      // Implémentation future avec une table dédiée
    }

    return NextResponse.json({
      success: true,
      message: 'Feedback enregistré, merci !'
    })

  } catch (error) {
    console.error('Erreur API POST /varieties/recommendations/feedback:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json({
        success: false,
        error: 'Feedback invalide',
        details: error.issues
      }, { status: 400 })
    }

    return NextResponse.json({
      success: false,
      error: 'Erreur lors de l\'enregistrement du feedback'
    }, { status: 500 })
  }
}

/**
 * Filtrer recommandations par contexte
 */
async function filterByContext(
  recommendations: any[], 
  context: string, 
  userId: string
): Promise<any[]> {
  
  const userContext = await getUserExperienceLevel(userId)

  switch (context) {
    case 'beginner':
      // Variétés faciles seulement
      return recommendations.filter(rec => {
        const infosCulture = rec.variete.infosCulture as any
        return infosCulture?.niveauDifficulte <= 2
      })

    case 'advanced':
      // Variétés plus challengeantes
      return recommendations.filter(rec => {
        const infosCulture = rec.variete.infosCulture as any
        return infosCulture?.niveauDifficulte >= 3
      })

    case 'seasonal':
      // Appropriées pour la saison actuelle
      const currentMonth = new Date().getMonth() + 1
      return recommendations.filter(rec => {
        const calendrier = rec.variete.calendrierDefaut as any
        return (
          calendrier?.moisSemis?.includes(currentMonth) ||
          calendrier?.moisPlantation?.includes(currentMonth)
        )
      })

    case 'similar':
      // Similaires aux variétés que l'utilisateur aime
      const favoriteVarieties = await prisma.varieteCultureUtilisateur.findMany({
        where: { 
          utilisateurId: userId,
          estFavorite: true 
        },
        include: { varieteBase: true }
      })
      
      const favoriteFamilies = favoriteVarieties.map(fv => fv.varieteBase.famille)
      
      return recommendations.filter(rec => 
        favoriteFamilies.includes(rec.variete.famille)
      )

    case 'complementary':
      // Complémentaires aux variétés existantes
      return recommendations.filter(rec => {
        const infosCulture = rec.variete.infosCulture as any
        // Logique simple : favoriser plantes compagnes
        return infosCulture?.plantesCompagnes?.length > 0
      })

    default:
      return recommendations
  }
}

/**
 * Enrichir recommandations avec contexte
 */
async function enrichRecommendations(
  recommendations: any[], 
  userId: string,
  params: any
): Promise<any[]> {
  
  const currentMonth = new Date().getMonth() + 1
  const currentSeason = getCurrentSeason(currentMonth)
  
  return recommendations.map(rec => {
    const infosCulture = rec.variete.infosCulture as any
    const calendrier = rec.variete.calendrierDefaut as any
    
    // Calculer urgence saisonnière
    const seasonalUrgency = calculateSeasonalUrgency(calendrier, currentMonth)
    
    // Calculer difficulté relative à l'utilisateur
    const relativeDifficulty = calculateRelativeDifficulty(infosCulture?.niveauDifficulte, params)
    
    // Enrichir raisons avec contexte
    const contextualReasons = [...rec.raisons]
    
    if (seasonalUrgency.urgent) {
      contextualReasons.unshift(`⏰ ${seasonalUrgency.reason}`)
    }
    
    if (relativeDifficulty.appropriate) {
      contextualReasons.push(`💪 ${relativeDifficulty.reason}`)
    }

    return {
      ...rec,
      raisons: contextualReasons,
      contextualInfo: {
        seasonalUrgency: seasonalUrgency.urgent,
        seasonalReason: seasonalUrgency.reason,
        currentSeason,
        relativeDifficulty: relativeDifficulty.level,
        estimatedStartDate: calculateEstimatedStartDate(calendrier, currentMonth),
        estimatedHarvestDate: calculateEstimatedHarvestDate(calendrier, infosCulture, currentMonth)
      }
    }
  })
}

/**
 * Obtenir profil de recommandation utilisateur
 */
async function getUserRecommendationProfile(userId: string) {
  const userVarieties = await prisma.varieteCultureUtilisateur.findMany({
    where: { utilisateurId: userId },
    include: { varieteBase: true }
  })

  const experienceLevel = await getUserExperienceLevel(userId)
  
  const categories = userVarieties.reduce((acc: any, uv) => {
    const cat = uv.varieteBase.categorie
    acc[cat] = (acc[cat] || 0) + 1
    return acc
  }, {})

  const families = userVarieties.reduce((acc: any, uv) => {
    const fam = uv.varieteBase.famille
    if (fam) acc[fam] = (acc[fam] || 0) + 1
    return acc
  }, {})

  return {
    experienceLevel,
    totalVarietiesTested: userVarieties.length,
    favoriteCategories: Object.entries(categories).sort((a: any, b: any) => b[1] - a[1]).slice(0, 3),
    favoriteFamilies: Object.entries(families).sort((a: any, b: any) => b[1] - a[1]).slice(0, 3),
    recommendationPreferences: {
      preferEasy: experienceLevel <= 2,
      preferSeasonal: true,
      preferSimilar: userVarieties.length > 5
    }
  }
}

/**
 * Obtenir niveau d'expérience utilisateur
 */
async function getUserExperienceLevel(userId: string): Promise<number> {
  const userVarieties = await prisma.varieteCultureUtilisateur.count({
    where: { utilisateurId: userId }
  })

  const successfulVarieties = await prisma.varieteCultureUtilisateur.count({
    where: { 
      utilisateurId: userId,
      // Considérer comme succès si performance > 0
      performancePersonnelle: {
        path: ['tauxReussite'],
        gte: 0.5
      }
    }
  })

  // Formule simple d'expérience
  let level = 1
  if (userVarieties > 3 && successfulVarieties > 1) level = 2
  if (userVarieties > 8 && successfulVarieties > 4) level = 3
  if (userVarieties > 15 && successfulVarieties > 8) level = 4
  if (userVarieties > 25 && successfulVarieties > 15) level = 5

  return level
}

/**
 * Utilitaires pour calculs contextuels
 */
function getCurrentSeason(month: number): string {
  if ([12, 1, 2].includes(month)) return 'hiver'
  if ([3, 4, 5].includes(month)) return 'printemps'
  if ([6, 7, 8].includes(month)) return 'été'
  return 'automne'
}

function calculateSeasonalUrgency(calendrier: any, currentMonth: number) {
  if (!calendrier) return { urgent: false, reason: '' }
  
  const moisSemis = calendrier.moisSemis || []
  const moisPlantation = calendrier.moisPlantation || []
  
  if (moisSemis.includes(currentMonth)) {
    return { urgent: true, reason: 'Période idéale pour semer maintenant' }
  }
  
  if (moisPlantation.includes(currentMonth)) {
    return { urgent: true, reason: 'Période idéale pour planter maintenant' }
  }
  
  // Vérifier mois suivant
  const nextMonth = currentMonth === 12 ? 1 : currentMonth + 1
  if (moisSemis.includes(nextMonth) || moisPlantation.includes(nextMonth)) {
    return { urgent: true, reason: 'À préparer pour le mois prochain' }
  }
  
  return { urgent: false, reason: 'Pas urgent saisonnièrement' }
}

function calculateRelativeDifficulty(varietyDifficulty: number, params: any) {
  if (!varietyDifficulty) return { appropriate: true, level: 'unknown', reason: '' }
  
  const maxDifficulty = params.difficulty?.max || 5
  
  if (varietyDifficulty <= maxDifficulty) {
    if (varietyDifficulty <= 2) {
      return { appropriate: true, level: 'easy', reason: 'Facile pour commencer' }
    } else if (varietyDifficulty <= 3) {
      return { appropriate: true, level: 'medium', reason: 'Difficulté modérée' }
    } else {
      return { appropriate: true, level: 'hard', reason: 'Challenge intéressant' }
    }
  }
  
  return { appropriate: false, level: 'too_hard', reason: 'Peut-être trop difficile' }
}

function calculateEstimatedStartDate(calendrier: any, currentMonth: number): string | null {
  if (!calendrier) return null
  
  const moisSemis = calendrier.moisSemis || []
  const moisPlantation = calendrier.moisPlantation || []
  
  // Trouver prochain mois approprié
  const allMonths = [...moisSemis, ...moisPlantation].sort()
  const nextMonth = allMonths.find(m => m >= currentMonth) || allMonths[0]
  
  if (!nextMonth) return null
  
  const currentYear = new Date().getFullYear()
  const targetYear = nextMonth >= currentMonth ? currentYear : currentYear + 1
  
  return new Date(targetYear, nextMonth - 1, 15).toISOString().split('T')[0]
}

function calculateEstimatedHarvestDate(calendrier: any, infosCulture: any, currentMonth: number): string | null {
  const startDate = calculateEstimatedStartDate(calendrier, currentMonth)
  if (!startDate || !infosCulture?.joursRecolte) return null
  
  const start = new Date(startDate)
  const harvest = new Date(start.getTime() + infosCulture.joursRecolte * 24 * 60 * 60 * 1000)
  
  return harvest.toISOString().split('T')[0]
}