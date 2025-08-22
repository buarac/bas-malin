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
  keyPrefix: 'bas-malin:varieties:personalize:'
})

const varietyService = new VarietyManagementService(prisma, cache)

// Schéma validation personnalisation
const personalizeSchema = z.object({
  nomPersonnalise: z.string().min(1).max(200).optional(),
  notesPersonnelles: z.string().max(2000).optional(),
  estFavorite: z.boolean().optional(),
  noteGlobale: z.number().min(1).max(5).optional(),
  infosCulturePersonnalisees: z.object({
    // Permettre override des infos de base
    espacementCm: z.number().positive().optional(),
    profondeurPlantationCm: z.number().positive().optional(),
    joursRecolte: z.number().positive().optional(),
    besoinsEau: z.enum(['FAIBLE', 'MOYEN', 'ELEVE']).optional(),
    conseilsPersonnels: z.array(z.string()).optional(),
    amendementsPreferes: z.array(z.string()).optional(),
    zonesOptimales: z.array(z.string()).optional()
  }).optional(),
  photos: z.array(z.object({
    url: z.string().url(),
    legende: z.string().optional(),
    priseA: z.string().datetime().optional(),
    stade: z.enum(['semis', 'germination', 'croissance', 'floraison', 'fructification', 'recolte']).optional()
  })).optional()
})

// Schéma validation performance
const performanceUpdateSchema = z.object({
  annee: z.number().min(2020).max(new Date().getFullYear() + 1),
  zone: z.string().min(1),
  poidsTotalKg: z.number().min(0),
  qualiteMoyenne: z.number().min(1).max(5),
  problemes: z.array(z.string()).optional(),
  succes: z.array(z.string()).optional(),
  surfaceM2: z.number().positive().optional(),
  dateDebut: z.string().datetime().optional(),
  dateFin: z.string().datetime().optional(),
  interventions: z.array(z.object({
    type: z.string(),
    date: z.string().datetime(),
    description: z.string().optional()
  })).optional()
})

/**
 * POST /api/varieties/[id]/personalize - Créer/Mettre à jour personnalisation
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    
    if (!session?.user) {
      return NextResponse.json({
        success: false,
        error: 'Authentification requise'
      }, { status: 401 })
    }

    const { id: varietyId } = await params
    const body = await request.json()
    
    // Validation
    const validatedData = personalizeSchema.parse(body)

    // Vérifier que la variété base existe
    const baseVariety = await prisma.varieteCulture.findUnique({
      where: { id: varietyId }
    })

    if (!baseVariety) {
      return NextResponse.json({
        success: false,
        error: 'Variété non trouvée'
      }, { status: 404 })
    }

    // Créer/Mettre à jour personnalisation
    const personalizedVariety = await varietyService.createPersonalizedVariety(
      session.user.id,
      varietyId,
      validatedData
    )

    return NextResponse.json({
      success: true,
      data: personalizedVariety,
      message: 'Personnalisation sauvegardée'
    })

  } catch (error) {
    console.error('Erreur API POST /varieties/[id]/personalize:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json({
        success: false,
        error: 'Données de personnalisation invalides',
        details: error.issues
      }, { status: 400 })
    }

    return NextResponse.json({
      success: false,
      error: 'Erreur lors de la personnalisation'
    }, { status: 500 })
  }
}

/**
 * GET /api/varieties/[id]/personalize - Obtenir personnalisation utilisateur
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    
    if (!session?.user) {
      return NextResponse.json({
        success: false,
        error: 'Authentification requise'
      }, { status: 401 })
    }

    const { id: varietyId } = await params

    // Rechercher personnalisation existante
    const userVariety = await prisma.varieteCultureUtilisateur.findUnique({
      where: {
        utilisateurId_varieteBaseId: {
          utilisateurId: session.user.id,
          varieteBaseId: varietyId
        }
      },
      include: {
        varieteBase: true,
        instancesCulture: {
          select: {
            id: true,
            nom: true,
            anneeSaison: true,
            etapeCycleVie: true
          },
          orderBy: {
            creeA: 'desc'
          },
          take: 5
        }
      }
    })

    if (!userVariety) {
      // Retourner variété de base avec personnalisation vide
      const baseVariety = await prisma.varieteCulture.findUnique({
        where: { id: varietyId }
      })

      if (!baseVariety) {
        return NextResponse.json({
          success: false,
          error: 'Variété non trouvée'
        }, { status: 404 })
      }

      return NextResponse.json({
        success: true,
        data: {
          variety: baseVariety,
          personalization: null,
          instances: []
        }
      })
    }

    // Calculer métriques de performance
    const performance = userVariety.performancePersonnelle as any
    const performanceMetrics = {
      totalCultivations: performance?.nombreCultivations || 0,
      successRate: performance?.tauxReussite || 0,
      averageYield: performance?.rendementMoyenKg || 0,
      bestHarvest: performance?.meilleureRecolte || null,
      lastUpdate: performance?.derniereMiseAJour || null,
      trends: calculatePerformanceTrends(performance?.historique || [])
    }

    return NextResponse.json({
      success: true,
      data: {
        variety: userVariety.varieteBase,
        personalization: {
          id: userVariety.id,
          nomPersonnalise: userVariety.nomPersonnalise,
          notesPersonnelles: userVariety.notesPersonnelles,
          estFavorite: userVariety.estFavorite,
          noteGlobale: userVariety.noteGlobale,
          infosCulturePersonnalisees: userVariety.infosCulturePersonnalisees,
          photos: userVariety.photos,
          dateTest: userVariety.dateTest,
          createdAt: userVariety.creeA,
          updatedAt: userVariety.misAJourA
        },
        performance: performanceMetrics,
        instances: userVariety.instancesCulture
      }
    })

  } catch (error) {
    console.error('Erreur API GET /varieties/[id]/personalize:', error)
    return NextResponse.json({
      success: false,
      error: 'Erreur lors de la récupération'
    }, { status: 500 })
  }
}

/**
 * PUT /api/varieties/[id]/personalize/performance - Mettre à jour performance
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    
    if (!session?.user) {
      return NextResponse.json({
        success: false,
        error: 'Authentification requise'
      }, { status: 401 })
    }

    const { id: varietyId } = await params
    const body = await request.json()
    
    // Validation
    const validatedData = performanceUpdateSchema.parse(body)

    // Mettre à jour performance
    await varietyService.updateUserPerformance(
      session.user.id,
      varietyId,
      validatedData
    )

    // Récupérer données mises à jour
    const updatedUserVariety = await prisma.varieteCultureUtilisateur.findUnique({
      where: {
        utilisateurId_varieteBaseId: {
          utilisateurId: session.user.id,
          varieteBaseId: varietyId
        }
      }
    })

    if (!updatedUserVariety) {
      return NextResponse.json({
        success: false,
        error: 'Personnalisation non trouvée'
      }, { status: 404 })
    }

    const performance = updatedUserVariety.performancePersonnelle as any

    return NextResponse.json({
      success: true,
      data: {
        performance: {
          totalCultivations: performance?.nombreCultivations || 0,
          successRate: performance?.tauxReussite || 0,
          averageYield: performance?.rendementMoyenKg || 0,
          bestHarvest: performance?.meilleureRecolte || null,
          lastUpdate: performance?.derniereMiseAJour || null,
          recentEntry: validatedData
        }
      },
      message: 'Performance mise à jour avec succès'
    })

  } catch (error) {
    console.error('Erreur API PUT /varieties/[id]/personalize/performance:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json({
        success: false,
        error: 'Données de performance invalides',
        details: error.issues
      }, { status: 400 })
    }

    return NextResponse.json({
      success: false,
      error: 'Erreur lors de la mise à jour de performance'
    }, { status: 500 })
  }
}

/**
 * DELETE /api/varieties/[id]/personalize - Supprimer personnalisation
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    
    if (!session?.user) {
      return NextResponse.json({
        success: false,
        error: 'Authentification requise'
      }, { status: 401 })
    }

    const { id: varietyId } = await params

    // Vérifier existence
    const userVariety = await prisma.varieteCultureUtilisateur.findUnique({
      where: {
        utilisateurId_varieteBaseId: {
          utilisateurId: session.user.id,
          varieteBaseId: varietyId
        }
      }
    })

    if (!userVariety) {
      return NextResponse.json({
        success: false,
        error: 'Personnalisation non trouvée'
      }, { status: 404 })
    }

    // Supprimer personnalisation
    await prisma.varieteCultureUtilisateur.delete({
      where: {
        utilisateurId_varieteBaseId: {
          utilisateurId: session.user.id,
          varieteBaseId: varietyId
        }
      }
    })

    // Invalider cache
    await cache.invalidatePattern(`*${session.user.id}*`)

    return NextResponse.json({
      success: true,
      message: 'Personnalisation supprimée'
    })

  } catch (error) {
    console.error('Erreur API DELETE /varieties/[id]/personalize:', error)
    return NextResponse.json({
      success: false,
      error: 'Erreur lors de la suppression'
    }, { status: 500 })
  }
}

/**
 * Calculer tendances performance
 */
function calculatePerformanceTrends(historique: any[]) {
  if (!historique || historique.length < 2) {
    return { trend: 'stable', confidence: 0 }
  }

  // Trier par année
  const sorted = historique.sort((a, b) => a.annee - b.annee)
  const recent = sorted.slice(-3) // 3 dernières années
  
  let improvementCount = 0
  let degradationCount = 0

  for (let i = 1; i < recent.length; i++) {
    const current = recent[i]
    const previous = recent[i - 1]
    
    if (current.poidsTotalKg > previous.poidsTotalKg) {
      improvementCount++
    } else if (current.poidsTotalKg < previous.poidsTotalKg) {
      degradationCount++
    }
  }

  let trend = 'stable'
  if (improvementCount > degradationCount) {
    trend = 'improving'
  } else if (degradationCount > improvementCount) {
    trend = 'declining'
  }

  const confidence = Math.abs(improvementCount - degradationCount) / (recent.length - 1)

  return { 
    trend, 
    confidence: Math.round(confidence * 100),
    dataPoints: recent.length
  }
}