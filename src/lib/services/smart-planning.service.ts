/**
 * F2.2 - Service de planification intelligente avec intégration météorologique
 * 
 * Calcule les dates optimales de semis/repiquage/récolte en fonction :
 * - Données historiques météo
 * - Caractéristiques variétales
 * - Contraintes géographiques
 * - Intelligence artificielle prédictive
 */

import { PrismaClient, VarieteCulture } from '@prisma/client'
import { addDays, addWeeks, format, isBefore } from 'date-fns'

interface Zone {
  id: string
  geometrie?: unknown
  jardin: {
    localisation: unknown
  }
}

// Types pour l'intégration météorologique
interface WeatherData {
  date: string
  temperature: {
    min: number
    max: number
    avg: number
  }
  precipitation: number
  humidity: number
  windSpeed: number
  conditions: string
}

interface WeatherForecast {
  current: WeatherData
  forecast7days: WeatherData[]
  historical30days: WeatherData[]
}

// Types pour la planification intelligente
interface OptimalDateWindow {
  startDate: Date
  endDate: Date
  confidenceScore: number
  reasoning: string[]
  weatherFactors: {
    temperature: number
    precipitation: number
    riskScore: number
  }
}

interface CultureRequirements {
  temperatureMin: number
  temperatureMax: number
  temperatureOptimal: number
  germination: {
    durationDays: number
    temperatureMin: number
  }
  growth: {
    durationDays: number
    waterNeeds: 'low' | 'medium' | 'high'
  }
  harvest: {
    durationDays: number
    indicators: string[]
  }
}

interface PlanificationResult {
  dateSemisPrevue: Date
  fenetreSemis: {
    debut: string
    fin: string
    scoreConfiance: number
    reasoning: string
  }
  dateRepiquagePrevue?: Date
  fenetreRecolte: {
    debut: string
    fin: string
    dureeEstimee: number
    rendementAttendu: number
  }
  interventionsProgrammees: Array<{
    type: string
    date: string
    description: string
    criticite: 'FAIBLE' | 'NORMALE' | 'ELEVEE' | 'URGENTE'
    dependsOnWeather: boolean
  }>
  risquesIdentifies: Array<{
    type: string
    date: string
    severite: 'FAIBLE' | 'MOYEN' | 'ELEVE'
    recommandation: string
  }>
  scoreOptimisation: number
}

/**
 * Service principal de planification intelligente
 */
export class SmartPlanningService {
  private prisma: PrismaClient
  private weatherApiKey: string | null

  constructor() {
    this.prisma = new PrismaClient()
    this.weatherApiKey = process.env.WEATHER_API_KEY || null
  }

  /**
   * Calcule la planification optimale pour une culture donnée
   */
  async calculateOptimalPlanning(
    varietyId: string,
    zoneId: string,
    targetYear: number,
    userPreferences: {
      strategieRisque: 'conservative' | 'equilibree' | 'agressive'
      prioriteRendement: boolean
      eviterGelTardif: boolean
      maxInterventionsParSemaine: number
    }
  ): Promise<PlanificationResult> {
    try {
      // 1. Récupérer les données de la variété
      const variety = await this.prisma.varieteCulture.findUnique({
        where: { id: varietyId }
      })

      if (!variety) {
        throw new Error(`Variété ${varietyId} introuvable`)
      }

      // 2. Récupérer les données de la zone
      const zone = await this.prisma.zone.findUnique({
        where: { id: zoneId },
        include: { jardin: true }
      })

      if (!zone) {
        throw new Error(`Zone ${zoneId} introuvable`)
      }

      // 3. Extraire les exigences culturales
      const requirements = this.extractCultureRequirements(variety)

      // 4. Obtenir les données météorologiques
      const localisation = zone.jardin.localisation as Record<string, unknown>
      const weatherData = await this.getWeatherDataForZone(
        (localisation?.latitude as number) || 45.0, 
        (localisation?.longitude as number) || 5.0,
        targetYear
      )

      // 5. Calculer la fenêtre de semis optimale
      const semisWindow = await this.calculateOptimalSemisWindow(
        requirements,
        weatherData,
        userPreferences,
        targetYear
      )

      // 6. Calculer les dates de repiquage (si nécessaire)
      const repiquageDate = this.needsTransplanting(variety) 
        ? addWeeks(semisWindow.startDate, requirements.germination.durationDays / 7)
        : undefined

      // 7. Calculer la fenêtre de récolte
      const recolteWindow = this.calculateHarvestWindow(
        semisWindow.startDate,
        requirements,
        weatherData
      )

      // 8. Programmer les interventions automatiques
      const interventions = await this.generateAutomaticInterventions(
        semisWindow.startDate,
        repiquageDate,
        recolteWindow.startDate,
        requirements,
        variety,
        userPreferences
      )

      // 9. Identifier les risques
      const risques = await this.identifyRisks(
        semisWindow.startDate,
        recolteWindow.endDate,
        weatherData,
        zone,
        variety
      )

      // 10. Calculer le score d'optimisation global
      const scoreOptimisation = this.calculateOptimizationScore(
        semisWindow,
        recolteWindow,
        interventions,
        risques,
        userPreferences
      )

      return {
        dateSemisPrevue: semisWindow.startDate,
        fenetreSemis: {
          debut: format(semisWindow.startDate, 'yyyy-MM-dd'),
          fin: format(semisWindow.endDate, 'yyyy-MM-dd'),
          scoreConfiance: semisWindow.confidenceScore,
          reasoning: semisWindow.reasoning.join('; ')
        },
        dateRepiquagePrevue: repiquageDate,
        fenetreRecolte: {
          debut: format(recolteWindow.startDate, 'yyyy-MM-dd'),
          fin: format(recolteWindow.endDate, 'yyyy-MM-dd'),
          dureeEstimee: Math.ceil((recolteWindow.endDate.getTime() - recolteWindow.startDate.getTime()) / (1000 * 60 * 60 * 24 * 7)),
          rendementAttendu: this.estimateYield(variety, zone, scoreOptimisation)
        },
        interventionsProgrammees: interventions,
        risquesIdentifies: risques,
        scoreOptimisation: scoreOptimisation
      }

    } catch (error) {
      console.error('Erreur dans calculateOptimalPlanning:', error)
      throw error
    }
  }

  /**
   * Extrait les exigences culturales depuis les données de la variété
   */
  private extractCultureRequirements(variety: VarieteCulture): CultureRequirements {
    const infosCulture = (variety.infosCulture as Record<string, unknown>) || {}
    const calendrierDefaut = (variety.calendrierDefaut as Record<string, unknown>) || {}

    return {
      temperatureMin: (infosCulture.temperatureMin as number) || 8,
      temperatureMax: (infosCulture.temperatureMax as number) || 35,
      temperatureOptimal: (infosCulture.temperatureOptimal as number) || 20,
      germination: {
        durationDays: (infosCulture.dureeGermination as number) || 7,
        temperatureMin: (infosCulture.temperatureGermination as number) || 12
      },
      growth: {
        durationDays: (calendrierDefaut.dureeCroissance as number) || 90,
        waterNeeds: (infosCulture.besoinsEau as 'low' | 'medium' | 'high') || 'medium'
      },
      harvest: {
        durationDays: (calendrierDefaut.dureeRecolte as number) || 14,
        indicators: (infosCulture.indicateursRecolte as string[]) || ['size', 'color']
      }
    }
  }

  /**
   * Obtient les données météorologiques pour une zone géographique
   * Intègre avec une API météo externe ou utilise des données simulées
   */
  private async getWeatherDataForZone(
    latitude: number,
    longitude: number,
    _year: number
  ): Promise<WeatherForecast> {
    if (this.weatherApiKey) {
      // TODO: Intégrer avec une vraie API météo (OpenWeatherMap, WeatherAPI, etc.)
      return this.fetchRealWeatherData(latitude, longitude, _year)
    } else {
      // Mode simulation avec données réalistes
      return this.generateSimulatedWeatherData(latitude, longitude, _year)
    }
  }

  /**
   * Génère des données météo simulées réalistes pour les tests
   */
  private async generateSimulatedWeatherData(
    latitude: number,
    longitude: number,
    year: number
  ): Promise<WeatherForecast> {
    const currentDate = new Date()
    const current: WeatherData = {
      date: format(currentDate, 'yyyy-MM-dd'),
      temperature: { min: 8, max: 18, avg: 13 },
      precipitation: 2.5,
      humidity: 75,
      windSpeed: 12,
      conditions: 'partly_cloudy'
    }

    const forecast7days: WeatherData[] = []
    const historical30days: WeatherData[] = []

    // Simulation des 7 prochains jours
    for (let i = 1; i <= 7; i++) {
      const date = addDays(currentDate, i)
      forecast7days.push({
        date: format(date, 'yyyy-MM-dd'),
        temperature: {
          min: 8 + Math.random() * 5,
          max: 15 + Math.random() * 10,
          avg: 12 + Math.random() * 8
        },
        precipitation: Math.random() * 10,
        humidity: 65 + Math.random() * 20,
        windSpeed: 5 + Math.random() * 15,
        conditions: ['sunny', 'partly_cloudy', 'cloudy', 'rainy'][Math.floor(Math.random() * 4)]
      })
    }

    // Simulation des 30 derniers jours
    for (let i = 1; i <= 30; i++) {
      const date = addDays(currentDate, -i)
      historical30days.push({
        date: format(date, 'yyyy-MM-dd'),
        temperature: {
          min: 5 + Math.random() * 8,
          max: 12 + Math.random() * 12,
          avg: 9 + Math.random() * 10
        },
        precipitation: Math.random() * 15,
        humidity: 60 + Math.random() * 25,
        windSpeed: 3 + Math.random() * 20,
        conditions: ['sunny', 'partly_cloudy', 'cloudy', 'rainy'][Math.floor(Math.random() * 4)]
      })
    }

    return { current, forecast7days, historical30days }
  }

  /**
   * Intégration avec une API météo réelle (à implémenter)
   */
  private async fetchRealWeatherData(
    latitude: number,
    longitude: number,
    year: number
  ): Promise<WeatherForecast> {
    // TODO: Implémenter l'intégration avec OpenWeatherMap ou équivalent
    // Pour l'instant, retourner les données simulées
    return this.generateSimulatedWeatherData(latitude, longitude, year)
  }

  /**
   * Calcule la fenêtre optimale de semis
   */
  private async calculateOptimalSemisWindow(
    requirements: CultureRequirements,
    weather: WeatherForecast,
    userPreferences: {
      strategieRisque: string
      eviterGelTardif: boolean
    },
    targetYear: number
  ): Promise<OptimalDateWindow> {
    const baseDate = new Date(targetYear, 2, 15) // 15 mars comme base
    const reasoning: string[] = []

    // Ajustement selon la température minimale
    let adjustedStartDate = baseDate
    const avgTempNext7Days = weather.forecast7days.reduce((sum, day) => 
      sum + day.temperature.avg, 0
    ) / weather.forecast7days.length

    if (avgTempNext7Days < requirements.temperatureMin) {
      adjustedStartDate = addWeeks(baseDate, 2)
      reasoning.push(`Report de 2 semaines - température moyenne prévue (${avgTempNext7Days.toFixed(1)}°C) inférieure au minimum requis (${requirements.temperatureMin}°C)`)
    }

    // Ajustement selon la stratégie de risque
    if (userPreferences.strategieRisque === 'conservative') {
      adjustedStartDate = addWeeks(adjustedStartDate, 1)
      reasoning.push('Stratégie conservatrice: report d\'1 semaine supplémentaire')
    } else if (userPreferences.strategieRisque === 'agressive') {
      adjustedStartDate = addDays(adjustedStartDate, -7)
      reasoning.push('Stratégie agressive: avancement d\'1 semaine')
    }

    // Protection contre le gel tardif
    if (userPreferences.eviterGelTardif && avgTempNext7Days < 5) {
      adjustedStartDate = addWeeks(adjustedStartDate, 1)
      reasoning.push('Protection gel tardif activée')
    }

    const windowEnd = addWeeks(adjustedStartDate, 2)
    const confidenceScore = this.calculateWindowConfidence(weather, requirements)

    return {
      startDate: adjustedStartDate,
      endDate: windowEnd,
      confidenceScore,
      reasoning,
      weatherFactors: {
        temperature: avgTempNext7Days,
        precipitation: weather.forecast7days.reduce((sum, day) => sum + day.precipitation, 0),
        riskScore: avgTempNext7Days < requirements.temperatureMin ? 0.7 : 0.2
      }
    }
  }

  /**
   * Calcule le score de confiance de la fenêtre de semis
   */
  private calculateWindowConfidence(weather: WeatherForecast, requirements: CultureRequirements): number {
    let score = 0.8 // Score de base

    // Ajustement selon la stabilité météo
    const tempVariation = Math.abs(
      Math.max(...weather.forecast7days.map(d => d.temperature.max)) -
      Math.min(...weather.forecast7days.map(d => d.temperature.min))
    )

    if (tempVariation < 10) score += 0.15
    else if (tempVariation > 20) score -= 0.20

    // Ajustement selon les précipitations
    const totalRain = weather.forecast7days.reduce((sum, day) => sum + day.precipitation, 0)
    if (totalRain > 50) score -= 0.10 // Trop de pluie
    else if (totalRain < 5) score -= 0.05 // Trop sec

    return Math.max(0.1, Math.min(1.0, score))
  }

  /**
   * Détermine si la variété nécessite un repiquage
   */
  private needsTransplanting(variety: VarieteCulture): boolean {
    const infosCulture = (variety.infosCulture as Record<string, unknown>) || {}
    return (infosCulture.necessiteRepiquage as boolean) === true || 
           ['TOMATE', 'AUBERGINE', 'POIVRON', 'CONCOMBRE'].includes(variety.categorie)
  }

  /**
   * Calcule la fenêtre de récolte
   */
  private calculateHarvestWindow(
    semisDate: Date,
    requirements: CultureRequirements,
    weather: WeatherForecast
  ): { startDate: Date; endDate: Date } {
    const growthDuration = requirements.growth.durationDays
    const harvestDuration = requirements.harvest.durationDays

    const harvestStart = addDays(semisDate, growthDuration)
    const harvestEnd = addDays(harvestStart, harvestDuration)

    return {
      startDate: harvestStart,
      endDate: harvestEnd
    }
  }

  /**
   * Génère les interventions automatiques programmées
   */
  private async generateAutomaticInterventions(
    semisDate: Date,
    repiquageDate: Date | undefined,
    recolteDate: Date,
    _requirements: CultureRequirements,
    _variety: VarieteCulture,
    _userPreferences: {
      strategieRisque: string
      prioriteRendement: boolean
      eviterGelTardif: boolean
      maxInterventionsParSemaine: number
    }
  ): Promise<Array<{
    type: string
    date: string
    description: string
    criticite: 'FAIBLE' | 'NORMALE' | 'ELEVEE' | 'URGENTE'
    dependsOnWeather: boolean
  }>> {
    const interventions = []

    // Arrosage post-semis
    interventions.push({
      type: 'ARROSAGE',
      date: format(addDays(semisDate, 1), 'yyyy-MM-dd'),
      description: 'Premier arrosage après semis',
      criticite: 'ELEVEE' as const,
      dependsOnWeather: true
    })

    // Repiquage si nécessaire
    if (repiquageDate) {
      interventions.push({
        type: 'MAINTENANCE',
        date: format(repiquageDate, 'yyyy-MM-dd'),
        description: 'Repiquage des plants',
        criticite: 'ELEVEE' as const,
        dependsOnWeather: true
      })
    }

    // Fertilisation mi-croissance
    const midGrowthDate = addDays(semisDate, Math.floor(_requirements.growth.durationDays / 2))
    interventions.push({
      type: 'FERTILISATION',
      date: format(midGrowthDate, 'yyyy-MM-dd'),
      description: 'Fertilisation de croissance',
      criticite: 'NORMALE' as const,
      dependsOnWeather: false
    })

    // Début de récolte
    interventions.push({
      type: 'RECOLTE',
      date: format(recolteDate, 'yyyy-MM-dd'),
      description: 'Début de la période de récolte',
      criticite: 'NORMALE' as const,
      dependsOnWeather: false
    })

    return interventions
  }

  /**
   * Identifie les risques potentiels
   */
  private async identifyRisks(
    startDate: Date,
    endDate: Date,
    _weather: WeatherForecast,
    _zone: Zone,
    _variety: VarieteCulture
  ): Promise<Array<{
    type: string
    date: string
    severite: 'FAIBLE' | 'MOYEN' | 'ELEVE'
    recommandation: string
  }>> {
    const risks = []

    // Risque de gel tardif
    const springRiskDate = new Date(startDate.getFullYear(), 3, 15) // 15 avril
    if (isBefore(startDate, springRiskDate)) {
      risks.push({
        type: 'GEL_TARDIF',
        date: format(springRiskDate, 'yyyy-MM-dd'),
        severite: 'MOYEN' as const,
        recommandation: 'Prévoir voile de protection si températures < 5°C'
      })
    }

    // Risque de sécheresse
    const summerRiskDate = new Date(startDate.getFullYear(), 6, 15) // 15 juillet
    if (isBefore(summerRiskDate, endDate)) {
      risks.push({
        type: 'SECHERESSE',
        date: format(summerRiskDate, 'yyyy-MM-dd'),
        severite: 'ELEVE' as const,
        recommandation: 'Prévoir arrosage automatique ou mulching'
      })
    }

    return risks
  }

  /**
   * Calcule le score d'optimisation global
   */
  private calculateOptimizationScore(
    semisWindow: OptimalDateWindow,
    _recolteWindow: { startDate: Date; endDate: Date },
    interventions: Array<{ type: string; date: string; description: string; criticite: string; dependsOnWeather: boolean }>,
    risks: Array<{ type: string; date: string; severite: string; recommandation: string }>,
    userPreferences: {
      strategieRisque: string
      prioriteRendement: boolean
      eviterGelTardif: boolean
      maxInterventionsParSemaine: number
    }
  ): number {
    let score = 0.7 // Score de base

    // Bonus pour confiance élevée
    score += semisWindow.confidenceScore * 0.2

    // Malus pour risques élevés
    const highRisks = risks.filter(r => r.severite === 'ELEVE')
    score -= highRisks.length * 0.1

    // Bonus pour optimisation des interventions
    if (interventions.length <= userPreferences.maxInterventionsParSemaine * 12) { // ~3 mois
      score += 0.05
    }

    return Math.max(0.1, Math.min(1.0, score))
  }

  /**
   * Estime le rendement attendu
   */
  private estimateYield(variety: VarieteCulture, zone: Zone, optimizationScore: number): number {
    const infosCulture = (variety.infosCulture as Record<string, unknown>) || {}
    const baseYield = (infosCulture.rendementMoyenKgM2 as number) || 5.0
    const geometrie = (zone.geometrie as Record<string, unknown>) || {}
    const zoneArea = (geometrie.surfaceM2 as number) || 1.0
    
    return baseYield * zoneArea * optimizationScore
  }

  /**
   * Nettoyage des ressources
   */
  async disconnect(): Promise<void> {
    await this.prisma.$disconnect()
  }
}