import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
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
    const session = await getServerSession(authOptions)
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
    totalZones: jardins.reduce((total, j) => total + (j._stats?.nombreZones || 0), 0),
    zonesActives: jardins.reduce((total, j) => total + (j._stats?.nombreZonesActives || 0), 0),
    culturesActives: culturesActives.length,
    recoltesCeMois: statsRecoltesMoisActuel.nombreRecoltes,
    poidsTotalCeMois: statsRecoltesMoisActuel.poidsTotalKg
  }

  // Activité récente
  const recentActivity = {
    recoltes: recoltesRecentes.slice(0, 10).map(r => ({
      id: r.id,
      dateRecolte: r.dateRecolte,
      poidsTotalKg: Number(r.poidsTotalKg),
      variete: r.instanceCulture?.variete?.varieteBase?.nomCommun || 'Variété inconnue',
      zone: r.zone.nom
    })),
    cultures: culturesActives
      .filter(c => c._stats?.joursDepuisSemis !== undefined)
      .slice(0, 8)
      .map(c => ({
        id: c.id,
        nom: c.nom,
        etapeCycleVie: c.etapeCycleVie,
        joursDepuisSemis: c._stats?.joursDepuisSemis || 0,
        variete: c.variete.varieteBase.nomCommun
      }))
  }

  // Données pour les graphiques
  const charts = {
    productionMensuelle: statsRecoltes.evolutionMensuelle,
    repartitionVarietes: statsRecoltes.varietesRecoltees.slice(0, 8),
    evolutionQualite: await generateEvolutionQualite(dataService, userId, debutPeriode, maintenant)
  }

  // Insights et tendances
  const insights = await generateInsights(dataService, userId, statsRecoltes, jardins, culturesActives)

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
  dataService: any,
  userId: string,
  debutPeriode: Date,
  finPeriode: Date
): Promise<Array<{ mois: string; noteQualite: number }>> {
  const moisList: Array<{ mois: string; noteQualite: number }> = []
  
  let dateActuelle = new Date(debutPeriode)
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
  dataService: any,
  userId: string,
  statsRecoltes: any,
  jardins: any[],
  culturesActives: any[]
): Promise<DashboardData['insights']> {
  // Meilleure variété (par poids)
  const meilleureVariete = statsRecoltes.varietesRecoltees.length > 0 
    ? {
        nom: statsRecoltes.varietesRecoltees[0].variete,
        poidsTotalKg: statsRecoltes.varietesRecoltees[0].poidsTotalKg,
        noteQualite: 4.2 // TODO: Calculer depuis les évaluations réelles
      }
    : {
        nom: 'Aucune donnée',
        poidsTotalKg: 0,
        noteQualite: 0
      }

  // Zone la plus performante
  const zonePerformante = {
    nom: jardins[0]?.zones?.[0]?.nom || 'Aucune zone',
    rendementM2: 2.5, // TODO: Calculer le vrai rendement
    nombreRecoltes: Math.floor(statsRecoltes.nombreRecoltes / Math.max(jardins.length, 1))
  }

  // Tendances
  const tendances = []
  
  // Tendance production
  if (statsRecoltes.evolutionMensuelle.length >= 2) {
    const dernierMois = statsRecoltes.evolutionMensuelle[statsRecoltes.evolutionMensuelle.length - 1]
    const avantDernierMois = statsRecoltes.evolutionMensuelle[statsRecoltes.evolutionMensuelle.length - 2]
    
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
  if (statsRecoltes.varietesRecoltees.length >= 3) {
    tendances.push({
      type: 'positive' as const,
      message: 'Bonne diversité des cultures',
      valeur: statsRecoltes.varietesRecoltees.length,
      comparaison: 'variétés actives'
    })
  }

  // Tendance qualité
  if (statsRecoltes.noteQualiteMoyenne >= 4) {
    tendances.push({
      type: 'positive' as const,
      message: 'Excellente qualité moyenne',
      valeur: Math.round(statsRecoltes.noteQualiteMoyenne * 10) / 10,
      comparaison: 'note sur 5'
    })
  }

  return {
    meilleureVariete,
    zonePerformante,
    tendances
  }
}