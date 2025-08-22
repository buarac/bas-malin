/**
 * F2.2 - Service de calcul de calendrier cultural intelligent
 * 
 * Calcule les dates optimales selon :
 * - Calendrier lunaire
 * - Cycles saisonniers
 * - Rotations des cultures
 * - Historique de performance
 */

import { addDays, getDayOfYear } from 'date-fns'
import { PrismaClient, VarieteCulture } from '@prisma/client'

interface Zone {
  id: string
  geometrie?: {
    surfaceM2?: number
  }
  jardin: {
    latitude?: number
    longitude?: number
  }
  instancesCulture: Array<{
    variete: {
      varieteBase: VarieteCulture
    }
    creeA: Date
  }>
}

interface Culture {
  varieteCulture: VarieteCulture
  recoltes: Array<{
    quantite?: number
  }>
}

export interface LunarPhase {
  phase: 'new_moon' | 'first_quarter' | 'full_moon' | 'last_quarter'
  date: Date
  influence: 'favorable' | 'neutral' | 'unfavorable'
  recommendations: string[]
}

export interface SeasonalWindow {
  name: string
  startDate: Date
  endDate: Date
  priority: 'optimal' | 'good' | 'acceptable' | 'avoid'
  characteristics: {
    temperature: { min: number; max: number }
    daylight: number
    soilCondition: string
  }
}

export interface RotationSchedule {
  currentCulture: string
  previousCulture?: string
  nextRecommendations: Array<{
    culture: string
    family: string
    benefitScore: number
    waitPeriod: number // days
    reason: string
  }>
  rotationCycle: {
    year1: string[]
    year2: string[]
    year3: string[]
    year4: string[]
  }
}

export interface OptimalDateCalculation {
  recommendedDate: Date
  alternativeDates: Date[]
  confidence: number
  factors: {
    lunar: { score: number; phase: string }
    seasonal: { score: number; window: string }
    weather: { score: number; risk: string }
    rotation: { score: number; compatibility: string }
    historical: { score: number; performance: string }
  }
  reasoning: string[]
}

/**
 * Service de calcul de calendrier cultural
 */
export class CalendarService {
  private prisma: PrismaClient

  constructor() {
    this.prisma = new PrismaClient()
  }

  /**
   * Calcule la date optimale pour une culture donnée
   */
  async calculateOptimalDate(
    varietyId: string,
    zoneId: string,
    activity: 'SEMIS' | 'REPIQUAGE' | 'RECOLTE',
    targetPeriod: { start: Date; end: Date },
    preferences: {
      considerLunar: boolean
      considerRotation: boolean
      riskTolerance: 'low' | 'medium' | 'high'
    }
  ): Promise<OptimalDateCalculation> {
    // 1. Récupérer les données de base
    const variety = await this.prisma.varieteCulture.findUnique({
      where: { id: varietyId }
    })

    const zone = await this.prisma.zone.findUnique({
      where: { id: zoneId },
      include: { 
        jardin: true,
        instancesCulture: {
          include: { variete: { include: { varieteBase: true } } },
          orderBy: { creeA: 'desc' },
          take: 5
        }
      }
    })

    if (!variety || !zone) {
      throw new Error('Variété ou zone introuvable')
    }

    // 2. Calculer les différents facteurs
    const lunarFactor = preferences.considerLunar 
      ? await this.calculateLunarFactor(activity, targetPeriod)
      : { score: 0.5, phase: 'neutral' }

    const seasonalFactor = this.calculateSeasonalFactor(
      activity, 
      variety, 
      targetPeriod,
      zone.jardin.latitude || 45.0
    )

    const rotationFactor = preferences.considerRotation
      ? await this.calculateRotationFactor(variety, zone)
      : { score: 0.5, compatibility: 'neutral' }

    const historicalFactor = await this.calculateHistoricalFactor(
      variety,
      zone,
      activity,
      targetPeriod
    )

    // 3. Combiner les scores pour trouver la date optimale
    const candidates = this.generateCandidateDates(targetPeriod, 3) // 3 jours d'intervalle
    const scoredDates = candidates.map(date => ({
      date,
      totalScore: this.calculateTotalScore(
        date,
        lunarFactor,
        seasonalFactor,
        rotationFactor,
        historicalFactor,
        preferences.riskTolerance
      )
    }))

    // 4. Trier par score et sélectionner la meilleure
    scoredDates.sort((a, b) => b.totalScore - a.totalScore)
    const bestDate = scoredDates[0]
    const alternatives = scoredDates.slice(1, 4).map(d => d.date)

    // 5. Générer le raisonnement
    const reasoning = this.generateReasoning(
      bestDate.date,
      lunarFactor,
      seasonalFactor,
      rotationFactor,
      historicalFactor
    )

    return {
      recommendedDate: bestDate.date,
      alternativeDates: alternatives,
      confidence: Math.min(0.95, bestDate.totalScore),
      factors: {
        lunar: lunarFactor,
        seasonal: seasonalFactor,
        weather: { score: 0.8, risk: 'low' }, // Intégré via WeatherService
        rotation: rotationFactor,
        historical: historicalFactor
      },
      reasoning
    }
  }

  /**
   * Calcule l'influence lunaire sur une activité
   */
  private async calculateLunarFactor(
    activity: string,
    period: { start: Date; end: Date }
  ): Promise<{ score: number; phase: string }> {
    const lunarPhases = this.calculateLunarPhasesInPeriod(period)
    
    // Correspondances activité/phases lunaires (sagesse populaire)
    const activityPhaseMapping = {
      'SEMIS': {
        'new_moon': 0.9,        // Nouvelle lune = croissance racinaire
        'first_quarter': 0.8,   // Premier quartier = croissance feuillage
        'full_moon': 0.3,       // Pleine lune = éviter semis
        'last_quarter': 0.4     // Dernier quartier = neutres
      },
      'REPIQUAGE': {
        'new_moon': 0.6,
        'first_quarter': 0.9,   // Optimal pour repiquage
        'full_moon': 0.4,
        'last_quarter': 0.7
      },
      'RECOLTE': {
        'new_moon': 0.5,
        'first_quarter': 0.6,
        'full_moon': 0.9,       // Optimal pour récolte
        'last_quarter': 0.8
      }
    }

    const mapping = activityPhaseMapping[activity as keyof typeof activityPhaseMapping]
    if (!mapping) return { score: 0.5, phase: 'neutral' }

    // Trouver la phase la plus favorable dans la période
    let bestScore = 0
    let bestPhase = 'neutral'

    for (const phase of lunarPhases) {
      const phaseScore = mapping[phase.phase]
      if (phaseScore > bestScore) {
        bestScore = phaseScore
        bestPhase = phase.phase
      }
    }

    return { score: bestScore, phase: bestPhase }
  }

  /**
   * Calcule les phases lunaires dans une période donnée
   */
  private calculateLunarPhasesInPeriod(period: { start: Date; end: Date }): LunarPhase[] {
    const phases: LunarPhase[] = []
    const lunarCycle = 29.53 // Durée cycle lunaire en jours
    
    // Date de référence nouvelle lune (2024-01-11)
    const referenceLunarDate = new Date('2024-01-11')
    const daysDiff = Math.floor((period.start.getTime() - referenceLunarDate.getTime()) / (1000 * 60 * 60 * 24))
    
    const currentCycle = Math.floor(daysDiff / lunarCycle)
    let currentDate = new Date(period.start)

    while (currentDate <= period.end) {
      const cycleDay = (getDayOfYear(currentDate) - getDayOfYear(referenceLunarDate) + (currentCycle * lunarCycle)) % lunarCycle
      
      let phase: LunarPhase['phase']
      if (cycleDay < 1) phase = 'new_moon'
      else if (cycleDay < 7.5) phase = 'first_quarter'  
      else if (cycleDay < 15) phase = 'full_moon'
      else if (cycleDay < 22.5) phase = 'last_quarter'
      else phase = 'new_moon'

      phases.push({
        phase,
        date: new Date(currentDate),
        influence: this.getLunarInfluence(phase),
        recommendations: this.getLunarRecommendations(phase)
      })

      currentDate = addDays(currentDate, 7) // Vérifier chaque semaine
    }

    return phases
  }

  /**
   * Détermine l'influence d'une phase lunaire
   */
  private getLunarInfluence(phase: LunarPhase['phase']): LunarPhase['influence'] {
    const influences = {
      'new_moon': 'favorable',
      'first_quarter': 'favorable', 
      'full_moon': 'neutral',
      'last_quarter': 'unfavorable'
    }
    return influences[phase] as LunarPhase['influence']
  }

  /**
   * Génère les recommandations pour une phase lunaire
   */
  private getLunarRecommendations(phase: LunarPhase['phase']): string[] {
    const recommendations = {
      'new_moon': [
        'Période favorable aux semis racinaires',
        'Bonne germination des graines',
        'Éviter les grandes tailles'
      ],
      'first_quarter': [
        'Optimal pour repiquage',
        'Croissance active du feuillage',
        'Période de fertilisation'
      ],
      'full_moon': [
        'Période de récolte optimale',
        'Conservation maximale',
        'Éviter les semis directs'
      ],
      'last_quarter': [
        'Période de repos végétatif',
        'Taille des fruitiers',
        'Préparation du sol'
      ]
    }
    return recommendations[phase]
  }

  /**
   * Calcule le facteur saisonnier
   */
  private calculateSeasonalFactor(
    _activity: string,
    variety: VarieteCulture,
    _period: { start: Date; end: Date },
    latitude: number
  ): { score: number; window: string } {
    const seasonalWindows = this.getSeasonalWindows(variety, latitude)
    const activityWindow = seasonalWindows.find(w => 
      _period.start >= w.startDate && _period.start <= w.endDate
    )

    if (!activityWindow) {
      return { score: 0.3, window: 'hors_saison' }
    }

    const priorityScores = {
      'optimal': 0.95,
      'good': 0.8,
      'acceptable': 0.6,
      'avoid': 0.2
    }

    return {
      score: priorityScores[activityWindow.priority],
      window: activityWindow.name
    }
  }

  /**
   * Détermine les fenêtres saisonnières pour une variété
   */
  private getSeasonalWindows(variety: VarieteCulture, latitude: number): SeasonalWindow[] {
    const calendrierDefaut = (variety.calendrierDefaut as any) || {}
    const currentYear = new Date().getFullYear()

    // Ajustement selon la latitude (plus on monte, plus on décale)
    const latitudeOffset = Math.max(0, (latitude - 45) * 7) // 7 jours par degré

    const windows: SeasonalWindow[] = []

    // Fenêtre de semis principal
    if (calendrierDefaut.semisPrincipal) {
      const startMonth = calendrierDefaut.semisPrincipal.debut || 3 // Mars par défaut
      const endMonth = calendrierDefaut.semisPrincipal.fin || 5 // Mai par défaut
      
      windows.push({
        name: 'semis_principal',
        startDate: addDays(new Date(currentYear, startMonth - 1, 1), latitudeOffset),
        endDate: addDays(new Date(currentYear, endMonth, 0), latitudeOffset),
        priority: 'optimal',
        characteristics: {
          temperature: { min: 8, max: 20 },
          daylight: 12,
          soilCondition: 'workable'
        }
      })
    }

    // Fenêtre de semis d'été (si applicable)
    if (calendrierDefaut.semisEte) {
      windows.push({
        name: 'semis_ete',
        startDate: new Date(currentYear, 5, 1), // Juin
        endDate: new Date(currentYear, 7, 31), // Août
        priority: 'good',
        characteristics: {
          temperature: { min: 15, max: 30 },
          daylight: 14,
          soilCondition: 'dry'
        }
      })
    }

    return windows
  }

  /**
   * Calcule le facteur de rotation des cultures
   */
  private async calculateRotationFactor(
    variety: VarieteCulture,
    zone: Zone
  ): Promise<{ score: number; compatibility: string }> {
    const recentCultures = zone.instancesCulture.slice(0, 3) // 3 dernières cultures
    
    if (recentCultures.length === 0) {
      return { score: 0.8, compatibility: 'nouvelle_zone' }
    }

    const familyCompatibility = this.getFamilyCompatibility()
    const varietyFamily = variety.famille || 'Unknown'
    let totalScore = 0.5
    let compatibilityLevel = 'neutral'

    for (let i = 0; i < recentCultures.length; i++) {
      const recentFamily = recentCultures[i].variete.varieteBase.famille || 'Unknown'
      const compatibility = familyCompatibility[varietyFamily]?.[recentFamily]
      
      if (compatibility) {
        // Plus récent = plus d'influence
        const weight = 1.0 - (i * 0.3)
        totalScore += compatibility.score * weight
        
        if (i === 0) { // Culture la plus récente
          compatibilityLevel = compatibility.level
        }
      }
    }

    return {
      score: Math.min(0.95, Math.max(0.1, totalScore / recentCultures.length)),
      compatibility: compatibilityLevel
    }
  }

  /**
   * Matrice de compatibilité entre familles de plantes
   */
  private getFamilyCompatibility(): { [key: string]: { [key: string]: { score: number; level: string } } } {
    return {
      'Solanaceae': {
        'Leguminosae': { score: 0.9, level: 'excellent' },
        'Brassicaceae': { score: 0.7, level: 'good' },
        'Solanaceae': { score: 0.2, level: 'avoid' },
        'Umbelliferae': { score: 0.8, level: 'good' }
      },
      'Leguminosae': {
        'Solanaceae': { score: 0.9, level: 'excellent' },
        'Brassicaceae': { score: 0.8, level: 'good' },
        'Leguminosae': { score: 0.3, level: 'neutral' },
        'Gramineae': { score: 0.9, level: 'excellent' }
      },
      'Brassicaceae': {
        'Leguminosae': { score: 0.8, level: 'good' },
        'Solanaceae': { score: 0.7, level: 'good' },
        'Brassicaceae': { score: 0.1, level: 'avoid' },
        'Rosaceae': { score: 0.6, level: 'neutral' }
      }
    }
  }

  /**
   * Calcule le facteur historique basé sur les performances passées
   */
  private async calculateHistoricalFactor(
    variety: VarieteCulture,
    zone: Zone,
    _activity: string,
    _period: { start: Date; end: Date }
  ): Promise<{ score: number; performance: string }> {
    // Rechercher les cultures similaires dans la zone
    const historicalData = await this.prisma.instanceCulture.findMany({
      where: {
        zoneId: zone.id,
        variete: {
          varieteBase: {
            famille: variety.famille || 'Unknown'
          }
        }
      },
      include: {
        recoltes: true
      },
      orderBy: {
        creeA: 'desc'
      },
      take: 5
    })

    if (historicalData.length === 0) {
      return { score: 0.6, performance: 'no_data' }
    }

    // Calculer la performance moyenne
    const performances = historicalData.map(culture => {
      const recoltes = culture.recoltes
      const rendement = recoltes.reduce((sum, r) => sum + (r.quantite || 0), 0)
      return rendement > 0 ? Math.min(1.0, rendement / 10) : 0.3 // Normaliser à 10kg max
    })

    const avgPerformance = performances.reduce((sum, p) => sum + p, 0) / performances.length
    
    let performanceLevel: string
    if (avgPerformance > 0.8) performanceLevel = 'excellent'
    else if (avgPerformance > 0.6) performanceLevel = 'good'
    else if (avgPerformance > 0.4) performanceLevel = 'average'
    else performanceLevel = 'poor'

    return {
      score: avgPerformance,
      performance: performanceLevel
    }
  }

  /**
   * Génère des dates candidates dans une période
   */
  private generateCandidateDates(period: { start: Date; end: Date }, intervalDays: number): Date[] {
    const candidates: Date[] = []
    let currentDate = new Date(period.start)

    while (currentDate <= period.end) {
      candidates.push(new Date(currentDate))
      currentDate = addDays(currentDate, intervalDays)
    }

    return candidates
  }

  /**
   * Calcule le score total combiné
   */
  private calculateTotalScore(
    _date: Date,
    lunar: { score: number },
    seasonal: { score: number },
    rotation: { score: number },
    historical: { score: number },
    riskTolerance: string
  ): number {
    const weights = {
      'low': { lunar: 0.1, seasonal: 0.4, rotation: 0.3, historical: 0.2 },
      'medium': { lunar: 0.15, seasonal: 0.35, rotation: 0.25, historical: 0.25 },
      'high': { lunar: 0.2, seasonal: 0.3, rotation: 0.2, historical: 0.3 }
    }

    const w = weights[riskTolerance as keyof typeof weights] || weights.medium

    return (
      lunar.score * w.lunar +
      seasonal.score * w.seasonal +
      rotation.score * w.rotation +
      historical.score * w.historical
    )
  }

  /**
   * Génère le raisonnement pour la recommandation
   */
  private generateReasoning(
    _date: Date,
    lunar: { score: number; phase: string },
    seasonal: { score: number; window: string },
    rotation: { score: number; compatibility: string },
    historical: { score: number; performance: string }
  ): string[] {
    const reasoning: string[] = []

    // Facteur saisonnier
    if (seasonal.score > 0.8) {
      reasoning.push(`Période saisonnière optimale (${seasonal.window})`)
    } else if (seasonal.score < 0.4) {
      reasoning.push(`Attention: période moins favorable (${seasonal.window})`)
    }

    // Facteur lunaire
    if (lunar.score > 0.8) {
      reasoning.push(`Phase lunaire favorable (${lunar.phase})`)
    } else if (lunar.score < 0.4) {
      reasoning.push(`Phase lunaire moins favorable (${lunar.phase})`)
    }

    // Rotation
    if (rotation.score > 0.8) {
      reasoning.push(`Excellente rotation des cultures (${rotation.compatibility})`)
    } else if (rotation.score < 0.4) {
      reasoning.push(`Attention rotation (${rotation.compatibility})`)
    }

    // Historique
    if (historical.score > 0.8) {
      reasoning.push(`Historique de performance excellent (${historical.performance})`)
    } else if (historical.score < 0.4) {
      reasoning.push(`Performance historique à améliorer (${historical.performance})`)
    }

    return reasoning
  }

  /**
   * Génère un calendrier de rotation sur 4 ans
   */
  async generateRotationCalendar(
    zoneId: string,
    preferredCultures: string[],
    _startYear: number = new Date().getFullYear()
  ): Promise<RotationSchedule> {
    const zone = await this.prisma.zone.findUnique({
      where: { id: zoneId },
      include: { instancesCulture: { include: { variete: { include: { varieteBase: true } } } } }
    })

    if (!zone) {
      throw new Error('Zone introuvable')
    }

    // Regrouper les cultures par famille
    const familyGroups: { [key: string]: string[] } = {}
    for (const culture of preferredCultures) {
      const variety = await this.prisma.varieteCulture.findFirst({
        where: { nomCommun: culture }
      })
      if (variety) {
        const family = variety.famille
        if (!familyGroups[family]) familyGroups[family] = []
        familyGroups[family].push(culture)
      }
    }

    // Créer le cycle de 4 ans en respectant les rotations
    const families = Object.keys(familyGroups)
    const rotationCycle = {
      year1: this.distributeByFamily(families[0], familyGroups),
      year2: this.distributeByFamily(families[1], familyGroups),
      year3: this.distributeByFamily(families[2], familyGroups),
      year4: this.distributeByFamily(families[3] || families[0], familyGroups)
    }

    // Recommandations pour l'année suivante
    const currentCulture = zone.instancesCulture[0]?.variete.varieteBase.nomCommun || ''
    const nextRecommendations = await this.getNextRotationRecommendations(
      currentCulture,
      familyGroups
    )

    return {
      currentCulture,
      nextRecommendations,
      rotationCycle
    }
  }

  /**
   * Distribue les cultures par famille
   */
  private distributeByFamily(family: string, familyGroups: { [key: string]: string[] }): string[] {
    return familyGroups[family] || []
  }

  /**
   * Obtient les recommandations de rotation suivante
   */
  private async getNextRotationRecommendations(
    currentCulture: string,
    familyGroups: { [key: string]: string[] }
  ): Promise<Array<{
    culture: string
    family: string
    benefitScore: number
    waitPeriod: number
    reason: string
  }>> {
    // Logique simplifiée de recommandation
    const recommendations = []

    for (const [family, cultures] of Object.entries(familyGroups)) {
      for (const culture of cultures) {
        if (culture !== currentCulture) {
          recommendations.push({
            culture,
            family,
            benefitScore: Math.random() * 0.4 + 0.6, // 0.6-1.0
            waitPeriod: family === 'Leguminosae' ? 0 : 365,
            reason: family === 'Leguminosae' 
              ? 'Enrichit le sol en azote'
              : 'Évite l\'épuisement du sol'
          })
        }
      }
    }

    return recommendations.sort((a, b) => b.benefitScore - a.benefitScore).slice(0, 5)
  }

  /**
   * Nettoyage des ressources
   */
  async disconnect(): Promise<void> {
    await this.prisma.$disconnect()
  }
}