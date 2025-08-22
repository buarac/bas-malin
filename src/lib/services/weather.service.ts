/**
 * F2.2 - Service météorologique pour la planification intelligente
 * 
 * Intègre les données météo pour optimiser les dates de semis/récolte
 * Support pour APIs externes et données simulées
 */

import { addDays, format, subDays, parseISO } from 'date-fns'

export interface WeatherData {
  date: string
  temperature: {
    min: number
    max: number
    avg: number
  }
  precipitation: number
  humidity: number
  windSpeed: number
  conditions: 'sunny' | 'partly_cloudy' | 'cloudy' | 'rainy' | 'stormy' | 'snowy'
  uvIndex?: number
  pressure?: number
}

export interface WeatherForecast {
  current: WeatherData
  forecast7days: WeatherData[]
  historical30days: WeatherData[]
}

export interface ClimateZone {
  zone: string
  averageFirstFrost: string // MM-DD format
  averageLastFrost: string  // MM-DD format
  growingSeasonDays: number
  temperatureProfile: {
    winter: { min: number; max: number }
    spring: { min: number; max: number }
    summer: { min: number; max: number }
    autumn: { min: number; max: number }
  }
}

/**
 * Service météorologique principal
 */
export class WeatherService {
  private apiKey: string | null
  private baseUrl: string
  private cache: Map<string, { data: WeatherForecast; timestamp: number }> = new Map()
  private readonly CACHE_DURATION = 10 * 60 * 1000 // 10 minutes

  constructor() {
    this.apiKey = process.env.WEATHER_API_KEY || null
    this.baseUrl = process.env.WEATHER_API_URL || 'https://api.openweathermap.org/data/2.5'
  }

  /**
   * Obtient les données météo complètes pour une localisation
   */
  async getWeatherForecast(latitude: number, longitude: number): Promise<WeatherForecast> {
    const cacheKey = `weather_${latitude}_${longitude}`
    
    // Vérifier le cache
    const cached = this.cache.get(cacheKey)
    if (cached && Date.now() - cached.timestamp < this.CACHE_DURATION) {
      return cached.data
    }

    let forecast: WeatherForecast

    if (this.apiKey) {
      // Utiliser l'API réelle
      forecast = await this.fetchRealWeatherData(latitude, longitude)
    } else {
      // Utiliser des données simulées
      forecast = await this.generateRealisticWeatherData(latitude, longitude)
    }

    // Mettre en cache
    this.cache.set(cacheKey, {
      data: forecast,
      timestamp: Date.now()
    })

    return forecast
  }

  /**
   * Récupère les données météo via une API externe
   */
  private async fetchRealWeatherData(latitude: number, longitude: number): Promise<WeatherForecast> {
    try {
      // Données actuelles
      const currentResponse = await fetch(
        `${this.baseUrl}/weather?lat=${latitude}&lon=${longitude}&appid=${this.apiKey}&units=metric`
      )
      const currentData = await currentResponse.json()

      // Prévisions 7 jours
      const forecastResponse = await fetch(
        `${this.baseUrl}/forecast?lat=${latitude}&lon=${longitude}&appid=${this.apiKey}&units=metric`
      )
      const forecastData = await forecastResponse.json()

      // Historique 30 jours (nécessite une API payante, simulé pour l'instant)
      const historical = await this.generateHistoricalData(latitude, longitude, 30)

      return {
        current: this.transformCurrentWeather(currentData),
        forecast7days: this.transformForecastWeather(forecastData),
        historical30days: historical
      }
    } catch (error) {
      console.warn('Erreur API météo, utilisation des données simulées:', error)
      return this.generateRealisticWeatherData(latitude, longitude)
    }
  }

  /**
   * Transforme les données actuelles de l'API
   */
  private transformCurrentWeather(data: {
    main: { temp_min: number; temp_max: number; temp: number; humidity: number; pressure: number }
    rain?: { '1h'?: number }
    wind: { speed: number }
    weather: Array<{ main: string }>
    uvi?: number
  }): WeatherData {
    return {
      date: format(new Date(), 'yyyy-MM-dd'),
      temperature: {
        min: data.main.temp_min,
        max: data.main.temp_max,
        avg: data.main.temp
      },
      precipitation: data.rain?.['1h'] || 0,
      humidity: data.main.humidity,
      windSpeed: data.wind.speed * 3.6, // m/s to km/h
      conditions: this.mapWeatherCondition(data.weather[0].main),
      uvIndex: data.uvi || undefined,
      pressure: data.main.pressure
    }
  }

  /**
   * Transforme les prévisions de l'API
   */
  private transformForecastWeather(data: {
    list: Array<{
      dt_txt: string
      main: { temp: number; humidity: number }
      rain?: { '3h'?: number }
      wind: { speed: number }
      weather: Array<{ main: string }>
    }>
  }): WeatherData[] {
    const dailyData: Map<string, (typeof data.list)[0][]> = new Map()

    // Grouper par jour
    data.list.forEach((item) => {
      const date = format(parseISO(item.dt_txt), 'yyyy-MM-dd')
      if (!dailyData.has(date)) {
        dailyData.set(date, [])
      }
      dailyData.get(date)!.push(item)
    })

    // Convertir en données journalières
    const forecast: WeatherData[] = []
    for (const [date, items] of dailyData) {
      if (forecast.length >= 7) break

      const temps = items.map(item => item.main.temp)
      const precip = items.reduce((sum, item) => sum + (item.rain?.['3h'] || 0), 0)
      
      forecast.push({
        date,
        temperature: {
          min: Math.min(...temps),
          max: Math.max(...temps),
          avg: temps.reduce((sum, t) => sum + t, 0) / temps.length
        },
        precipitation: precip,
        humidity: items.reduce((sum, item) => sum + item.main.humidity, 0) / items.length,
        windSpeed: items.reduce((sum, item) => sum + item.wind.speed, 0) / items.length * 3.6,
        conditions: this.mapWeatherCondition(items[Math.floor(items.length / 2)].weather[0].main)
      })
    }

    return forecast
  }

  /**
   * Mappe les conditions météo de l'API vers notre format
   */
  private mapWeatherCondition(condition: string): WeatherData['conditions'] {
    const mapping: { [key: string]: WeatherData['conditions'] } = {
      'Clear': 'sunny',
      'Clouds': 'cloudy',
      'Rain': 'rainy',
      'Drizzle': 'rainy',
      'Thunderstorm': 'stormy',
      'Snow': 'snowy',
      'Mist': 'cloudy',
      'Fog': 'cloudy'
    }
    
    return mapping[condition] || 'partly_cloudy'
  }

  /**
   * Génère des données météo réalistes basées sur la localisation et la saison
   */
  private async generateRealisticWeatherData(latitude: number, longitude: number): Promise<WeatherForecast> {
    const climateZone = this.getClimateZone(latitude)
    const currentDate = new Date()
    const currentMonth = currentDate.getMonth()

    // Profil saisonnier pour la France métropolitaine
    const seasonalProfile = this.getSeasonalProfile(currentMonth, climateZone)

    const current = this.generateDayWeather(currentDate, seasonalProfile)
    
    const forecast7days: WeatherData[] = []
    for (let i = 1; i <= 7; i++) {
      const date = addDays(currentDate, i)
      forecast7days.push(this.generateDayWeather(date, seasonalProfile))
    }

    const historical30days: WeatherData[] = []
    for (let i = 1; i <= 30; i++) {
      const date = subDays(currentDate, i)
      historical30days.push(this.generateDayWeather(date, seasonalProfile))
    }

    return { current, forecast7days, historical30days }
  }

  /**
   * Détermine la zone climatique basée sur la latitude
   */
  private getClimateZone(latitude: number): ClimateZone {
    // Zones climatiques françaises simplifiées
    if (latitude > 49) {
      // Nord de la France
      return {
        zone: 'northern_france',
        averageFirstFrost: '10-15',
        averageLastFrost: '04-15',
        growingSeasonDays: 180,
        temperatureProfile: {
          winter: { min: 0, max: 7 },
          spring: { min: 8, max: 16 },
          summer: { min: 15, max: 24 },
          autumn: { min: 7, max: 15 }
        }
      }
    } else if (latitude > 45) {
      // Centre de la France
      return {
        zone: 'central_france',
        averageFirstFrost: '11-01',
        averageLastFrost: '04-01',
        growingSeasonDays: 210,
        temperatureProfile: {
          winter: { min: 2, max: 10 },
          spring: { min: 10, max: 18 },
          summer: { min: 17, max: 27 },
          autumn: { min: 9, max: 18 }
        }
      }
    } else {
      // Sud de la France
      return {
        zone: 'southern_france',
        averageFirstFrost: '12-15',
        averageLastFrost: '02-15',
        growingSeasonDays: 250,
        temperatureProfile: {
          winter: { min: 5, max: 13 },
          spring: { min: 12, max: 20 },
          summer: { min: 20, max: 30 },
          autumn: { min: 12, max: 21 }
        }
      }
    }
  }

  /**
   * Obtient le profil saisonnier pour un mois donné
   */
  private getSeasonalProfile(month: number, zone: ClimateZone) {
    const seasons = {
      winter: [11, 0, 1], // Dec, Jan, Feb
      spring: [2, 3, 4],  // Mar, Apr, May
      summer: [5, 6, 7],  // Jun, Jul, Aug
      autumn: [8, 9, 10]  // Sep, Oct, Nov
    }

    for (const [season, months] of Object.entries(seasons)) {
      if (months.includes(month)) {
        return zone.temperatureProfile[season as keyof typeof zone.temperatureProfile]
      }
    }

    return zone.temperatureProfile.spring // Fallback
  }

  /**
   * Génère les données météo pour un jour spécifique
   */
  private generateDayWeather(date: Date, profile: { min: number; max: number }): WeatherData {
    const tempVariation = profile.max - profile.min
    const minTemp = profile.min + (Math.random() - 0.5) * tempVariation * 0.3
    const maxTemp = profile.max + (Math.random() - 0.5) * tempVariation * 0.3
    const avgTemp = (minTemp + maxTemp) / 2

    // Probabilité de pluie selon la saison
    const month = date.getMonth()
    const rainProbability = [0.4, 0.3, 0.3, 0.4, 0.4, 0.3, 0.2, 0.2, 0.3, 0.4, 0.5, 0.5][month]
    const hasRain = Math.random() < rainProbability

    const conditions: WeatherData['conditions'][] = hasRain 
      ? ['rainy', 'cloudy'] 
      : ['sunny', 'partly_cloudy', 'cloudy']
    
    return {
      date: format(date, 'yyyy-MM-dd'),
      temperature: {
        min: Math.round(minTemp * 10) / 10,
        max: Math.round(maxTemp * 10) / 10,
        avg: Math.round(avgTemp * 10) / 10
      },
      precipitation: hasRain ? Math.random() * 15 + 1 : Math.random() * 0.5,
      humidity: 50 + Math.random() * 40,
      windSpeed: Math.random() * 25 + 5,
      conditions: conditions[Math.floor(Math.random() * conditions.length)],
      uvIndex: Math.max(0, Math.min(11, avgTemp / 3 + Math.random() * 3)),
      pressure: 1000 + Math.random() * 40
    }
  }

  /**
   * Génère des données historiques simulées
   */
  private async generateHistoricalData(
    latitude: number, 
    _longitude: number, 
    days: number
  ): Promise<WeatherData[]> {
    const climateZone = this.getClimateZone(latitude)
    const historical: WeatherData[] = []
    const currentDate = new Date()

    for (let i = 1; i <= days; i++) {
      const date = subDays(currentDate, i)
      const profile = this.getSeasonalProfile(date.getMonth(), climateZone)
      historical.push(this.generateDayWeather(date, profile))
    }

    return historical.reverse() // Plus ancien en premier
  }

  /**
   * Analyse les tendances météorologiques
   */
  async analyzeWeatherTrends(
    latitude: number,
    longitude: number,
    _startDate: Date,
    _endDate: Date
  ): Promise<{
    averageTemperature: number
    totalPrecipitation: number
    riskLevel: 'low' | 'medium' | 'high'
    recommendations: string[]
  }> {
    const weather = await this.getWeatherForecast(latitude, longitude)
    
    // Analyser les données historiques et prévisionnelles
    const allData = [...weather.historical30days, weather.current, ...weather.forecast7days]
    
    const avgTemp = allData.reduce((sum, day) => sum + day.temperature.avg, 0) / allData.length
    const totalPrecip = allData.reduce((sum, day) => sum + day.precipitation, 0)
    
    // Évaluer le niveau de risque
    let riskLevel: 'low' | 'medium' | 'high' = 'low'
    const recommendations: string[] = []

    if (avgTemp < 5) {
      riskLevel = 'high'
      recommendations.push('Risque de gel - prévoir protection des cultures')
    } else if (avgTemp > 30) {
      riskLevel = 'high'
      recommendations.push('Canicule possible - prévoir arrosage renforcé')
    }

    if (totalPrecip > 200) {
      riskLevel = riskLevel === 'high' ? 'high' : 'medium'
      recommendations.push('Forte pluviométrie - vérifier le drainage')
    } else if (totalPrecip < 20) {
      riskLevel = riskLevel === 'high' ? 'high' : 'medium'
      recommendations.push('Sécheresse possible - planifier l\'irrigation')
    }

    return {
      averageTemperature: Math.round(avgTemp * 10) / 10,
      totalPrecipitation: Math.round(totalPrecip * 10) / 10,
      riskLevel,
      recommendations
    }
  }

  /**
   * Vérifie les conditions optimales pour une intervention
   */
  isOptimalConditionForTask(
    weather: WeatherData,
    taskType: 'SEMIS' | 'ARROSAGE' | 'RECOLTE' | 'MAINTENANCE'
  ): { optimal: boolean; reason: string } {
    switch (taskType) {
      case 'SEMIS':
        if (weather.temperature.avg < 8) {
          return { optimal: false, reason: 'Température trop basse pour la germination' }
        }
        if (weather.precipitation > 10) {
          return { optimal: false, reason: 'Trop de pluie, sol potentiellement détrempé' }
        }
        if (weather.windSpeed > 20) {
          return { optimal: false, reason: 'Vent trop fort pour le semis' }
        }
        return { optimal: true, reason: 'Conditions optimales pour le semis' }

      case 'ARROSAGE':
        if (weather.precipitation > 5) {
          return { optimal: false, reason: 'Pluie suffisante, arrosage non nécessaire' }
        }
        if (weather.temperature.max > 30) {
          return { optimal: false, reason: 'Trop chaud, risque d\'évaporation élevé' }
        }
        return { optimal: true, reason: 'Conditions favorables à l\'arrosage' }

      case 'RECOLTE':
        if (weather.precipitation > 2) {
          return { optimal: false, reason: 'Pluie, récolte difficile et qualité altérée' }
        }
        if (weather.humidity > 80) {
          return { optimal: false, reason: 'Humidité élevée, risque de moisissures' }
        }
        return { optimal: true, reason: 'Conditions idéales pour la récolte' }

      case 'MAINTENANCE':
        if (weather.windSpeed > 25) {
          return { optimal: false, reason: 'Vent trop fort pour les interventions' }
        }
        if (weather.temperature.avg < 0) {
          return { optimal: false, reason: 'Température négative, sol gelé' }
        }
        return { optimal: true, reason: 'Conditions acceptables pour la maintenance' }

      default:
        return { optimal: true, reason: 'Conditions non spécifiées' }
    }
  }

  /**
   * Nettoie le cache
   */
  clearCache(): void {
    this.cache.clear()
  }
}