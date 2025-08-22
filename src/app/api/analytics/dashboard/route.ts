/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { getDataService, CacheTTL } from '@/lib/config/database'

interface DashboardData {
  overview: {
    totalJardins: number
    totalZones: number
    zonesActives: number
    culturesActives: number
    recoltesCeMois: number
    poidsTotalCeMois: number
  }
  recentActivity: {
    recoltes: Array<{
      id: string
      dateRecolte: Date
      poidsTotalKg: number
      variete: string
      zone: string
    }>
    cultures: Array<{
      id: string
      nom: string
      etapeCycleVie: string
      joursDepuisSemis: number
      variete: string
    }>
  }
  charts: {
    productionMensuelle: Array<{
      mois: string
      poids: number
      nombreRecoltes: number
    }>
    repartitionVarietes: Array<{
      variete: string
      poids: number
      pourcentage: number
    }>
    evolutionQualite: Array<{
      mois: string
      noteQualite: number
    }>
  }
  insights: {
    meilleureVariete: {
      nom: string
      poidsTotalKg: number
      noteQualite: number
    }
    zonePerformante: {
      nom: string
      rendementM2: number
      nombreRecoltes: number
    }
    tendances: Array<{
      type: 'positive' | 'negative' | 'stable'
      message: string
      valeur: number
      comparaison: string
    }>
  }
}

/**
 * GET /api/analytics/dashboard - Données dashboard principal
 */
export async function GET(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const periode = searchParams.get('periode') || '6' // Défaut 6 mois
    const moisRecul = parseInt(periode)

    const dataService = getDataService()
    const cacheKey = `dashboard:user:${session.user.id}:periode:${periode}`

    // Utiliser le cache pour éviter les requêtes lourdes
    const dashboardData = await dataService.cache.getOrSet(
      cacheKey,
      async () => {
        return await generateDashboardData(dataService, session.user.id, moisRecul)
      },
      CacheTTL.DASHBOARD_DATA
    )

    return NextResponse.json({ data: dashboardData }, { status: 200 })
  } catch (error) {
    console.error('Erreur lors de la génération du dashboard:', error)
    return NextResponse.json(
      { error: 'Erreur serveur lors de la génération du dashboard' },
      { status: 500 }
    )
  }
}

/**
 * Génère toutes les données du dashboard
 */
async function generateDashboardData(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  dataService: any,
  userId: string,
  moisRecul: number
): Promise<DashboardData> {
  const maintenant = new Date()
  const debutPeriode = new Date(maintenant.getFullYear(), maintenant.getMonth() - moisRecul, 1)
  const debutMoisActuel = new Date(maintenant.getFullYear(), maintenant.getMonth(), 1)

  // Récupérer les données de base en parallèle
  const [
    jardins,
    culturesActives,
    recoltesRecentes,
    statsRecoltes,
    statsRecoltesMoisActuel
  ] = await Promise.all([
    dataService.jardin.findByUserIdWithActivity(userId),
    dataService.culture.findByUserId(userId, false),
    dataService.recolte.findRecentForDashboard(userId, 30),
    dataService.recolte.getDetailedStats(userId, debutPeriode, maintenant),
    dataService.recolte.getDetailedStats(userId, debutMoisActuel, maintenant)
  ])

  // Calculer les métriques d'overview
  const overview = {
    totalJardins: jardins.length,
    totalZones: jardins.reduce((total: number, j: Record<string, unknown>) => total + (((j._stats as Record<string, unknown>)?.nombreZones as number) || 0), 0),
    zonesActives: jardins.reduce((total: number, j: Record<string, unknown>) => total + (((j._stats as Record<string, unknown>)?.nombreZonesActives as number) || 0), 0),
    culturesActives: culturesActives.length,
    recoltesCeMois: statsRecoltesMoisActuel.nombreRecoltes,
    poidsTotalCeMois: statsRecoltesMoisActuel.poidsTotalKg
  }

  // Activité récente
  const recentActivity = {
    recoltes: recoltesRecentes.slice(0, 10).map((r: Record<string, unknown>) => ({
      id: r.id,
      dateRecolte: r.dateRecolte,
      poidsTotalKg: Number(r.poidsTotalKg as number),
      variete: (((r.instanceCulture as Record<string, unknown>)?.variete as Record<string, unknown>)?.varieteBase as Record<string, unknown>)?.nomCommun as string || 'Variété inconnue',
      zone: (r.zone as Record<string, unknown>).nom as string
    })),
    cultures: culturesActives
      .filter((c: Record<string, unknown>) => ((c._stats as Record<string, unknown>)?.joursDepuisSemis as number) !== undefined)
      .slice(0, 8)
      .map((c: Record<string, unknown>) => ({
        id: c.id,
        nom: c.nom,
        etapeCycleVie: c.etapeCycleVie,
        joursDepuisSemis: ((c._stats as Record<string, unknown>)?.joursDepuisSemis as number) || 0,
        variete: (((c.variete as Record<string, unknown>).varieteBase as Record<string, unknown>).nomCommun as string)
      }))
  }

  // Variétés récoltées pour les graphiques
  const varietesRecoltees = (statsRecoltes as Record<string, unknown>).varietesRecoltees as unknown[] || []

  // Données pour les graphiques
  const charts = {
    productionMensuelle: ((statsRecoltes as Record<string, unknown>).evolutionMensuelle as any[]) || [],
    repartitionVarietes: (varietesRecoltees.slice(0, 8) as any[]),
    evolutionQualite: await generateEvolutionQualite(dataService, userId, debutPeriode, maintenant)
  }

  // Insights et tendances
  const insights = await generateInsights(dataService, userId, statsRecoltes, jardins, varietesRecoltees)

  return {
    overview,
    recentActivity,
    charts,
    insights
  }
}

/**
 * Génère l'évolution de la qualité par mois
 */
async function generateEvolutionQualite(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  dataService: any,
  userId: string,
  debutPeriode: Date,
  finPeriode: Date
): Promise<Array<{ mois: string; noteQualite: number }>> {
  const moisList: Array<{ mois: string; noteQualite: number }> = []
  
  const dateActuelle = new Date(debutPeriode)
  while (dateActuelle <= finPeriode) {
    const debutMois = new Date(dateActuelle.getFullYear(), dateActuelle.getMonth(), 1)
    const finMois = new Date(dateActuelle.getFullYear(), dateActuelle.getMonth() + 1, 0)
    
    const statsMois = await dataService.recolte.getStats(userId, debutMois, finMois)
    
    moisList.push({
      mois: `${dateActuelle.getFullYear()}-${String(dateActuelle.getMonth() + 1).padStart(2, '0')}`,
      noteQualite: Math.round(statsMois.noteQualiteMoyenne * 10) / 10
    })
    
    dateActuelle.setMonth(dateActuelle.getMonth() + 1)
  }
  
  return moisList
}

/**
 * Génère les insights et tendances
 */
async function generateInsights(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  dataService: any,
  userId: string,
  statsRecoltes: Record<string, unknown>,
  jardins: Record<string, unknown>[],
  varietesRecoltees: unknown[]
  // culturesActives parameter removed as unused
): Promise<DashboardData['insights']> {
  // Meilleure variété (par poids)
  const meilleureVariete = varietesRecoltees.length > 0 
    ? {
        nom: (varietesRecoltees[0] as any).variete,
        poidsTotalKg: (varietesRecoltees[0] as any).poidsTotalKg,
        noteQualite: 4.2 // TODO: Calculer depuis les évaluations réelles
      }
    : {
        nom: 'Aucune donnée',
        poidsTotalKg: 0,
        noteQualite: 0
      }

  // Zone la plus performante
  const zonePerformante = {
    nom: (((jardins[0] as Record<string, unknown>)?.zones as unknown[])?.[0] as Record<string, unknown>)?.nom as string || 'Aucune zone',
    rendementM2: 2.5, // TODO: Calculer le vrai rendement
    nombreRecoltes: Math.floor(((statsRecoltes as Record<string, unknown>).nombreRecoltes as number) / Math.max(jardins.length, 1))
  }

  // Tendances
  const tendances = []
  
  // Tendance production
  const evolutionMensuelle = (statsRecoltes as Record<string, unknown>).evolutionMensuelle as unknown[] || []
  if (evolutionMensuelle.length >= 2) {
    const dernierMois = evolutionMensuelle[evolutionMensuelle.length - 1] as any
    const avantDernierMois = evolutionMensuelle[evolutionMensuelle.length - 2] as any
    
    if (dernierMois.poidsTotalKg > avantDernierMois.poidsTotalKg) {
      tendances.push({
        type: 'positive' as const,
        message: 'Production en hausse ce mois',
        valeur: Math.round(((dernierMois.poidsTotalKg - avantDernierMois.poidsTotalKg) / avantDernierMois.poidsTotalKg) * 100),
        comparaison: 'vs mois précédent'
      })
    } else if (dernierMois.poidsTotalKg < avantDernierMois.poidsTotalKg) {
      tendances.push({
        type: 'negative' as const,
        message: 'Production en baisse ce mois',
        valeur: Math.round(((avantDernierMois.poidsTotalKg - dernierMois.poidsTotalKg) / avantDernierMois.poidsTotalKg) * 100),
        comparaison: 'vs mois précédent'
      })
    }
  }

  // Tendance diversité
  if (varietesRecoltees.length >= 3) {
    tendances.push({
      type: 'positive' as const,
      message: 'Bonne diversité des cultures',
      valeur: varietesRecoltees.length,
      comparaison: 'variétés actives'
    })
  }

  // Tendance qualité
  const noteQualiteMoyenne = (statsRecoltes as Record<string, unknown>).noteQualiteMoyenne as number || 0
  if (noteQualiteMoyenne >= 4) {
    tendances.push({
      type: 'positive' as const,
      message: 'Excellente qualité moyenne',
      valeur: Math.round(noteQualiteMoyenne * 10) / 10,
      comparaison: 'note sur 5'
    })
  }

  return {
    meilleureVariete,
    zonePerformante,
    tendances
  }
}