import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { getDataService } from '@/lib/config/database'
import { z } from 'zod'

// Schema de validation pour création de zone
const createZoneSchema = z.object({
  nom: z.string().min(1, 'Le nom est requis').max(100, 'Nom trop long'),
  jardinId: z.string().min(1, 'ID jardin requis'),
  typeZone: z.enum(['BAC', 'PARCELLE', 'SERRE', 'ZONE_LIBRE', 'ARBRE', 'VIGNE']),
  geometrie: z.object({
    type: z.string(),
    coordonnees: z.array(z.number()).or(z.array(z.array(z.number()))),
    surfaceM2: z.number().positive('Surface doit être positive')
  }),
  expositionSoleil: z.enum(['PLEIN_SOLEIL', 'MI_OMBRE', 'OMBRE']),
  accesEau: z.enum(['FACILE', 'MOYEN', 'DIFFICILE']),
  qualiteSol: z.number().min(1).max(5, 'Qualité sol entre 1 et 5')
})

/**
 * GET /api/zones - Récupère les zones selon les filtres
 */
export async function GET(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const jardinId = searchParams.get('jardinId')
    const disponibleSeulement = searchParams.get('disponible') === 'true'
    const withCultures = searchParams.get('withCultures') === 'true'

    if (!jardinId) {
      return NextResponse.json({ error: 'ID jardin requis' }, { status: 400 })
    }

    const dataService = getDataService()
    
    // Vérifier que le jardin appartient à l'utilisateur
    const jardins = await dataService.jardin.findByUserId(session.user.id)
    const jardinExists = jardins.some(j => j.id === jardinId)
    
    if (!jardinExists) {
      return NextResponse.json({ error: 'Jardin non autorisé' }, { status: 403 })
    }

    let zones
    if (disponibleSeulement) {
      zones = await dataService.zone.findAvailableZones(jardinId)
    } else if (withCultures) {
      const zonesBasiques = await dataService.zone.findByJardinId(jardinId)
      zones = await Promise.all(
        zonesBasiques.map(zone => dataService.zone.findByIdWithCultures(zone.id))
      )
    } else {
      zones = await dataService.zone.findByJardinId(jardinId)
    }

    return NextResponse.json({ zones }, { status: 200 })
  } catch (error) {
    console.error('Erreur lors de la récupération des zones:', error)
    return NextResponse.json(
      { error: 'Erreur serveur lors de la récupération des zones' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/zones - Crée une nouvelle zone
 */
export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const body = await req.json()
    
    // Validation des données
    const validatedData = createZoneSchema.parse(body)

    const dataService = getDataService()
    
    // Vérifier que le jardin appartient à l'utilisateur
    const jardins = await dataService.jardin.findByUserId(session.user.id)
    const jardinExists = jardins.some(j => j.id === validatedData.jardinId)
    
    if (!jardinExists) {
      return NextResponse.json({ error: 'Jardin non autorisé' }, { status: 403 })
    }

    const zone = await dataService.zone.create(validatedData)

    return NextResponse.json({ zone }, { status: 201 })
  } catch (error) {
    console.error('Erreur lors de la création de la zone:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Données invalides', details: error.issues },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Erreur serveur lors de la création de la zone' },
      { status: 500 }
    )
  }
}