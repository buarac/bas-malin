import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { getDataService } from '@/lib/config/database'
import { z } from 'zod'

// Schema de validation pour mise à jour de jardin
const updateJardinSchema = z.object({
  nom: z.string().min(1, 'Le nom est requis').max(100, 'Nom trop long').optional(),
  description: z.string().optional(),
  localisation: z.object({
    latitude: z.number().min(-90).max(90),
    longitude: z.number().min(-180).max(180),
    altitude: z.number().optional(),
    adresse: z.string().min(1, 'Adresse requise'),
    ville: z.string().min(1, 'Ville requise'),
    region: z.string().min(1, 'Région requise'),
    pays: z.string().min(1, 'Pays requis'),
    codePostal: z.string().min(1, 'Code postal requis'),
    zoneClimatique: z.string().optional()
  }).optional(),
  surfaceTotaleM2: z.number().min(1, 'Surface doit être positive').optional(),
  typeSol: z.enum(['ARGILE', 'SABLE', 'LIMON', 'LIMON_FIN', 'TOURBE', 'CALCAIRE']).optional(),
  phSol: z.number().min(0).max(14).optional(),
  sourceEau: z.enum(['ROBINET', 'PUITS', 'EAU_PLUIE', 'MIXTE']).optional()
})

/**
 * GET /api/jardins/[jardinId] - Récupère un jardin spécifique
 */
export async function GET(
  req: NextRequest,
  context: { params: Promise<{ jardinId: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const params = await context.params
    const { searchParams } = new URL(req.url)
    const withStats = searchParams.get('withStats') === 'true'

    const dataService = getDataService()
    
    // Vérifier que le jardin appartient à l'utilisateur
    const jardins = await dataService.jardin.findByUserId(session.user.id)
    const jardinExists = jardins.some(j => j.id === params.jardinId)
    
    if (!jardinExists) {
      return NextResponse.json({ error: 'Jardin non trouvé' }, { status: 404 })
    }

    let jardin
    if (withStats) {
      jardin = await dataService.jardin.findByIdWithStats(params.jardinId)
    } else {
      jardin = await dataService.jardin.findById(params.jardinId)
    }

    if (!jardin) {
      return NextResponse.json({ error: 'Jardin non trouvé' }, { status: 404 })
    }

    return NextResponse.json({ jardin }, { status: 200 })
  } catch (error) {
    console.error('Erreur lors de la récupération du jardin:', error)
    return NextResponse.json(
      { error: 'Erreur serveur lors de la récupération du jardin' },
      { status: 500 }
    )
  }
}

/**
 * PATCH /api/jardins/[jardinId] - Met à jour un jardin
 */
export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ jardinId: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const params = await context.params
    const body = await req.json()
    
    // Validation des données
    const validatedData = updateJardinSchema.parse(body)

    const dataService = getDataService()
    
    // Vérifier que le jardin appartient à l'utilisateur
    const jardins = await dataService.jardin.findByUserId(session.user.id)
    const jardinExists = jardins.some(j => j.id === params.jardinId)
    
    if (!jardinExists) {
      return NextResponse.json({ error: 'Jardin non trouvé' }, { status: 404 })
    }

    const jardin = await dataService.jardin.update({
      id: params.jardinId,
      ...validatedData
    })

    return NextResponse.json({ jardin }, { status: 200 })
  } catch (error) {
    console.error('Erreur lors de la mise à jour du jardin:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Données invalides', details: error.issues },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Erreur serveur lors de la mise à jour du jardin' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/jardins/[jardinId] - Supprime un jardin
 */
export async function DELETE(
  req: NextRequest,
  context: { params: Promise<{ jardinId: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const params = await context.params
    const dataService = getDataService()
    
    // Vérifier que le jardin appartient à l'utilisateur
    const jardins = await dataService.jardin.findByUserId(session.user.id)
    const jardinExists = jardins.some(j => j.id === params.jardinId)
    
    if (!jardinExists) {
      return NextResponse.json({ error: 'Jardin non trouvé' }, { status: 404 })
    }

    await dataService.jardin.delete(params.jardinId)

    return NextResponse.json({ message: 'Jardin supprimé avec succès' }, { status: 200 })
  } catch (error) {
    console.error('Erreur lors de la suppression du jardin:', error)
    return NextResponse.json(
      { error: 'Erreur serveur lors de la suppression du jardin' },
      { status: 500 }
    )
  }
}