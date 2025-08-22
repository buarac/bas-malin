import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { getDataService } from '@/lib/config/database'
import { z } from 'zod'

// Schema de validation pour création de jardin
const createJardinSchema = z.object({
  nom: z.string().min(1, 'Le nom est requis').max(100, 'Nom trop long'),
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
  }),
  surfaceTotaleM2: z.number().min(1, 'Surface doit être positive'),
  typeSol: z.enum(['ARGILE', 'SABLE', 'LIMON', 'LIMON_FIN', 'TOURBE', 'CALCAIRE']),
  phSol: z.number().min(0).max(14).optional(),
  sourceEau: z.enum(['ROBINET', 'PUITS', 'EAU_PLUIE', 'MIXTE']),
  configAmenagement: z.object({
    type: z.literal('structure'),
    contenants: z.array(z.object({
      id: z.string(),
      longueur_m: z.number().positive(),
      largeur_m: z.number().positive(),
      position: z.object({
        x: z.number(),
        y: z.number()
      })
    }))
  })
})

/**
 * GET /api/jardins - Récupère tous les jardins de l'utilisateur
 */
export async function GET(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const withActivity = searchParams.get('withActivity') === 'true'
    const withStats = searchParams.get('withStats') === 'true'

    const dataService = getDataService()

    let jardins
    if (withActivity) {
      jardins = await dataService.jardin.findByUserIdWithActivity(session.user.id)
    } else if (withStats) {
      const jardinsBasiques = await dataService.jardin.findByUserId(session.user.id)
      jardins = await Promise.all(
        jardinsBasiques.map(jardin => dataService.jardin.findByIdWithStats(jardin.id))
      )
    } else {
      jardins = await dataService.jardin.findByUserId(session.user.id)
    }

    return NextResponse.json({ jardins }, { status: 200 })
  } catch (error) {
    console.error('Erreur lors de la récupération des jardins:', error)
    return NextResponse.json(
      { error: 'Erreur serveur lors de la récupération des jardins' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/jardins - Crée un nouveau jardin
 */
export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const body = await req.json()
    
    // Validation des données
    const validatedData = createJardinSchema.parse(body)

    const dataService = getDataService()
    const jardin = await dataService.jardin.create({
      ...validatedData,
      proprietaireId: session.user.id
    })

    return NextResponse.json({ jardin }, { status: 201 })
  } catch (error) {
    console.error('Erreur lors de la création du jardin:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Données invalides', details: error.issues },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Erreur serveur lors de la création du jardin' },
      { status: 500 }
    )
  }
}