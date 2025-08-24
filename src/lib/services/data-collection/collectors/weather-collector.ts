/**
 * F3.1 - Weather Data Collector
 * 
 * Integrates with WeatherAPI to collect:
 * - Current weather conditions
 * - 7-day forecast
 * - Historical weather data
 * - Specialized garden weather metrics
 */

import { BaseCollector, CollectorConfig } from '../base-collector'

export interface WeatherCollectorConfig extends CollectorConfig {
  apiKey: string
  latitude: number
  longitude: number
  includeForecast: boolean
  forecastDays: number // 1-10 days
  includeHistorical: boolean
  historicalDays: number // 1-30 days
  language: 'fr' | 'en'
}

export interface WeatherReading {
  timestamp: Date
  location: {
    latitude: number
    longitude: number
    region: string
    country: string
  }
  current: {
    temperature: {
      celsius: number
      fahrenheit: number
      feelsLike: number
    }
    humidity: number // percentage
    pressure: number // hPa
    wind: {
      speed: number // km/h
      direction: number // degrees
      gust: number // km/h
    }
    precipitation: number // mm
    uvIndex: number
    visibility: number // km
    cloudCover: number // percentage
    conditions: string
    conditionCode: number
  }
  soil?: {
    temperature: number // °C
    moisture: number // percentage (estimated from recent precipitation)
  }
  gardenMetrics: {
    optimalForWatering: boolean
    optimalForPlanting: boolean
    optimalForHarvesting: boolean
    frostRisk: 'none' | 'low' | 'medium' | 'high'
    heatStress: 'none' | 'low' | 'medium' | 'high'
  }
}

export interface WeatherForecast {
  date: Date
  temperature: {
    min: number
    max: number
    avg: number
  }
  humidity: {
    min: number
    max: number
    avg: number
  }
  precipitation: {
    probability: number // percentage
    total: number // mm
    type: 'rain' | 'snow' | 'mixed' | 'none'
  }
  wind: {
    maxSpeed: number
    avgSpeed: number
    direction: number
  }
  conditions: string
  conditionCode: number
  uvIndex: number
  gardenSuitability: {
    watering: 'poor' | 'fair' | 'good' | 'excellent'
    planting: 'poor' | 'fair' | 'good' | 'excellent'
    harvesting: 'poor' | 'fair' | 'good' | 'excellent'
  }
}

export interface WeatherCollectionResult extends Record<string, unknown> {
  type: 'weather'
  location: {
    latitude: number
    longitude: number
    region: string
    country: string
  }
  current: WeatherReading
  forecast?: WeatherForecast[]
  historical?: WeatherReading[]
  collectionTimestamp: Date
  apiProvider: string
  dataQuality: {
    currentDataAge: number // minutes
    forecastReliability: number // 0-1
    spatialAccuracy: number // km
  }
}

/**
 * Weather Data Collector using WeatherAPI
 */
export class WeatherCollector extends BaseCollector {
  readonly type = 'weather'
  private readonly baseUrl = 'https://api.weatherapi.com/v1'

  constructor(config: WeatherCollectorConfig) {
    super(config)
  }

  /**
   * Main collection method
   */
  async collect(config: WeatherCollectorConfig): Promise<WeatherCollectionResult> {
    const location = `${config.latitude},${config.longitude}`

    try {
      // 1. Get current weather
      const currentData = await this.fetchCurrentWeather(location, config)

      // 2. Get forecast if requested
      let forecastData: WeatherForecast[] | undefined
      if (config.includeForecast) {
        forecastData = await this.fetchForecast(location, config)
      }

      // 3. Get historical data if requested
      let historicalData: WeatherReading[] | undefined
      if (config.includeHistorical) {
        historicalData = await this.fetchHistoricalData(location, config)
      }

      // 4. Build result
      const result: WeatherCollectionResult = {
        type: 'weather',
        location: currentData.location,
        current: currentData,
        forecast: forecastData,
        historical: historicalData,
        collectionTimestamp: new Date(),
        apiProvider: 'WeatherAPI',
        dataQuality: {
          currentDataAge: this.calculateDataAge(currentData),
          forecastReliability: this.assessForecastReliability(forecastData),
          spatialAccuracy: this.estimateSpatialAccuracy()
        }
      }

      this.emit('weatherCollected', {
        location: result.location,
        temperature: result.current.current.temperature.celsius,
        conditions: result.current.current.conditions
      })

      return result

    } catch (error) {
      throw new Error(`Weather collection failed: ${error}`)
    }
  }

  /**
   * Fetch current weather data
   */
  private async fetchCurrentWeather(
    location: string, 
    config: WeatherCollectorConfig
  ): Promise<WeatherReading> {
    const url = `${this.baseUrl}/current.json?key=${config.apiKey}&q=${location}&lang=${config.language}&aqi=yes`

    const response = await fetch(url)
    if (!response.ok) {
      throw new Error(`WeatherAPI error: ${response.status} ${response.statusText}`)
    }

    const data = await response.json()
    return this.parseCurrentWeather(data)
  }

  /**
   * Fetch weather forecast
   */
  private async fetchForecast(
    location: string,
    config: WeatherCollectorConfig
  ): Promise<WeatherForecast[]> {
    const days = Math.min(config.forecastDays, 10)
    const url = `${this.baseUrl}/forecast.json?key=${config.apiKey}&q=${location}&days=${days}&lang=${config.language}&aqi=yes`

    const response = await fetch(url)
    if (!response.ok) {
      throw new Error(`WeatherAPI forecast error: ${response.status} ${response.statusText}`)
    }

    const data = await response.json()
    return this.parseForecast(data)
  }

  /**
   * Fetch historical weather data
   */
  private async fetchHistoricalData(
    location: string,
    config: WeatherCollectorConfig
  ): Promise<WeatherReading[]> {
    const historicalReadings: WeatherReading[] = []
    const days = Math.min(config.historicalDays, 30)

    // WeatherAPI requires separate calls for each historical day
    for (let i = 1; i <= days; i++) {
      try {
        const date = new Date()
        date.setDate(date.getDate() - i)
        const dateStr = date.toISOString().split('T')[0]

        const url = `${this.baseUrl}/history.json?key=${config.apiKey}&q=${location}&dt=${dateStr}&lang=${config.language}`

        const response = await fetch(url)
        if (response.ok) {
          const data = await response.json()
          const reading = this.parseHistoricalWeather(data)
          historicalReadings.push(reading)
        }
      } catch (error) {
        // Continue with other days even if one fails
        this.emit('historicalDataError', { day: i, error })
      }
    }

    return historicalReadings.reverse() // Oldest first
  }

  /**
   * Parse current weather response
   */
  private parseCurrentWeather(data: Record<string, unknown>): WeatherReading {
    const current = data.current as Record<string, unknown>
    const location = data.location as Record<string, unknown>

    return {
      timestamp: new Date(),
      location: {
        latitude: location.lat as number,
        longitude: location.lon as number,
        region: location.region as string,
        country: location.country as string
      },
      current: {
        temperature: {
          celsius: current.temp_c as number,
          fahrenheit: current.temp_f as number,
          feelsLike: current.feelslike_c as number
        },
        humidity: current.humidity as number,
        pressure: current.pressure_mb as number,
        wind: {
          speed: current.wind_kph as number,
          direction: current.wind_degree as number,
          gust: current.gust_kph as number
        },
        precipitation: current.precip_mm as number,
        uvIndex: current.uv as number,
        visibility: current.vis_km as number,
        cloudCover: current.cloud as number,
        conditions: (current.condition as Record<string, unknown>).text as string,
        conditionCode: (current.condition as Record<string, unknown>).code as number
      },
      soil: {
        temperature: this.estimateSoilTemperature(current.temp_c as number),
        moisture: this.estimateSoilMoisture(current.precip_mm as number, current.humidity as number)
      },
      gardenMetrics: this.calculateGardenMetrics({
        temperature: current.temp_c as number,
        humidity: current.humidity as number,
        windSpeed: current.wind_kph as number,
        precipitation: current.precip_mm as number,
        uvIndex: current.uv as number,
        conditions: (current.condition as Record<string, unknown>).text as string
      })
    }
  }

  /**
   * Parse forecast data
   */
  private parseForecast(data: Record<string, unknown>): WeatherForecast[] {
    const forecast = data.forecast as Record<string, unknown>
    const forecastDays = forecast.forecastday as Record<string, unknown>[]
    return forecastDays.map((day: Record<string, unknown>) => {
      const dayData = day.day as Record<string, unknown>
      
      return {
        date: new Date(day.date as string),
        temperature: {
          min: dayData.mintemp_c as number,
          max: dayData.maxtemp_c as number,
          avg: dayData.avgtemp_c as number
        },
        humidity: {
          min: (dayData.mintemp_c as number) < 10 ? 90 : 50, // Estimate min humidity
          max: (dayData.avghumidity as number) + 20, // Estimate max humidity
          avg: dayData.avghumidity as number
        },
        precipitation: {
          probability: dayData.daily_chance_of_rain as number,
          total: dayData.totalprecip_mm as number,
          type: this.determinePrecipitationType(dayData.totalprecip_mm as number, dayData.avgtemp_c as number)
        },
        wind: {
          maxSpeed: dayData.maxwind_kph as number,
          avgSpeed: (dayData.maxwind_kph as number) * 0.6, // Estimate
          direction: 0 // Not available in forecast
        },
        conditions: (dayData.condition as Record<string, unknown>).text as string,
        conditionCode: (dayData.condition as Record<string, unknown>).code as number,
        uvIndex: dayData.uv as number,
        gardenSuitability: this.assessGardenSuitability({
          temperature: dayData.avgtemp_c as number,
          precipitation: dayData.totalprecip_mm as number,
          windSpeed: dayData.maxwind_kph as number,
          uvIndex: dayData.uv as number
        })
      }
    })
  }

  /**
   * Parse historical weather data
   */
  private parseHistoricalWeather(data: Record<string, unknown>): WeatherReading {
    const forecast = data.forecast as Record<string, unknown>
    const forecastDay = (forecast.forecastday as Record<string, unknown>[])[0]
    const histDay = forecastDay.day as Record<string, unknown>
    const location = data.location as Record<string, unknown>

    return {
      timestamp: new Date(forecastDay.date as string),
      location: {
        latitude: location.lat as number,
        longitude: location.lon as number,
        region: location.region as string,
        country: location.country as string
      },
      current: {
        temperature: {
          celsius: histDay.avgtemp_c as number,
          fahrenheit: histDay.avgtemp_f as number,
          feelsLike: histDay.avgtemp_c as number
        },
        humidity: histDay.avghumidity as number,
        pressure: 1013, // Default - not available in historical
        wind: {
          speed: histDay.maxwind_kph as number,
          direction: 0,
          gust: histDay.maxwind_kph as number
        },
        precipitation: histDay.totalprecip_mm as number,
        uvIndex: histDay.uv as number,
        visibility: 10, // Default
        cloudCover: 50, // Default
        conditions: (histDay.condition as Record<string, unknown>).text as string,
        conditionCode: (histDay.condition as Record<string, unknown>).code as number
      },
      soil: {
        temperature: this.estimateSoilTemperature(histDay.avgtemp_c as number),
        moisture: this.estimateSoilMoisture(histDay.totalprecip_mm as number, histDay.avghumidity as number)
      },
      gardenMetrics: this.calculateGardenMetrics({
        temperature: histDay.avgtemp_c as number,
        humidity: histDay.avghumidity as number,
        windSpeed: histDay.maxwind_kph as number,
        precipitation: histDay.totalprecip_mm as number,
        uvIndex: histDay.uv as number,
        conditions: (histDay.condition as Record<string, unknown>).text as string
      })
    }
  }

  /**
   * Estimate soil temperature from air temperature
   */
  private estimateSoilTemperature(airTemp: number): number {
    // Soil temperature is typically 2-5°C lower than air temperature
    // and has less variation
    return airTemp - 3
  }

  /**
   * Estimate soil moisture from precipitation and humidity
   */
  private estimateSoilMoisture(precipitation: number, humidity: number): number {
    // Simple heuristic for soil moisture percentage
    let moisture = 20 // Base soil moisture

    // Add moisture from recent precipitation
    moisture += Math.min(precipitation * 5, 40)

    // Adjust for humidity
    moisture += (humidity - 50) * 0.2

    return Math.max(0, Math.min(100, moisture))
  }

  /**
   * Calculate garden-specific metrics
   */
  private calculateGardenMetrics(weatherData: {
    temperature: number
    humidity: number
    windSpeed: number
    precipitation: number
    uvIndex: number
    conditions: string
  }): WeatherReading['gardenMetrics'] {
    const { temperature, humidity, windSpeed, precipitation, uvIndex, conditions } = weatherData

    // Optimal watering conditions
    const optimalForWatering = 
      temperature >= 10 && temperature <= 25 &&
      windSpeed < 20 &&
      !conditions.toLowerCase().includes('rain') &&
      humidity < 80

    // Optimal planting conditions
    const optimalForPlanting = 
      temperature >= 8 && temperature <= 30 &&
      windSpeed < 15 &&
      precipitation < 5 &&
      !conditions.toLowerCase().includes('storm')

    // Optimal harvesting conditions
    const optimalForHarvesting = 
      temperature >= 5 && temperature <= 35 &&
      windSpeed < 25 &&
      precipitation < 2 &&
      !conditions.toLowerCase().includes('rain')

    // Frost risk assessment
    let frostRisk: 'none' | 'low' | 'medium' | 'high' = 'none'
    if (temperature <= 5) frostRisk = 'high'
    else if (temperature <= 10) frostRisk = 'medium'
    else if (temperature <= 15 && humidity > 80) frostRisk = 'low'

    // Heat stress assessment
    let heatStress: 'none' | 'low' | 'medium' | 'high' = 'none'
    if (temperature >= 35 || (temperature >= 30 && uvIndex > 8)) heatStress = 'high'
    else if (temperature >= 30 || (temperature >= 25 && uvIndex > 6)) heatStress = 'medium'
    else if (temperature >= 25) heatStress = 'low'

    return {
      optimalForWatering,
      optimalForPlanting,
      optimalForHarvesting,
      frostRisk,
      heatStress
    }
  }

  /**
   * Determine precipitation type
   */
  private determinePrecipitationType(
    precipitation: number,
    temperature: number
  ): 'rain' | 'snow' | 'mixed' | 'none' {
    if (precipitation < 0.1) return 'none'
    if (temperature < 0) return 'snow'
    if (temperature < 2) return 'mixed'
    return 'rain'
  }

  /**
   * Assess garden suitability for different activities
   */
  private assessGardenSuitability(conditions: {
    temperature: number
    precipitation: number
    windSpeed: number
    uvIndex: number
  }): WeatherForecast['gardenSuitability'] {
    const { temperature, precipitation, windSpeed, uvIndex } = conditions

    // Scoring function (0-100)
    const scoreActivity = (
      tempMin: number,
      tempMax: number,
      maxPrecip: number,
      maxWind: number,
      maxUV: number
    ): 'poor' | 'fair' | 'good' | 'excellent' => {
      let score = 100

      // Temperature penalty
      if (temperature < tempMin || temperature > tempMax) score -= 40
      else if (temperature < tempMin + 5 || temperature > tempMax - 5) score -= 20

      // Precipitation penalty
      if (precipitation > maxPrecip) score -= 30
      else if (precipitation > maxPrecip * 0.5) score -= 15

      // Wind penalty
      if (windSpeed > maxWind) score -= 20
      else if (windSpeed > maxWind * 0.7) score -= 10

      // UV penalty
      if (uvIndex > maxUV) score -= 15

      if (score >= 80) return 'excellent'
      if (score >= 60) return 'good'
      if (score >= 40) return 'fair'
      return 'poor'
    }

    return {
      watering: scoreActivity(10, 25, 2, 20, 10),
      planting: scoreActivity(8, 30, 5, 15, 8),
      harvesting: scoreActivity(5, 35, 2, 25, 12)
    }
  }

  /**
   * Calculate age of current weather data
   */
  private calculateDataAge(reading: WeatherReading): number {
    const now = Date.now()
    const dataTime = reading.timestamp.getTime()
    return Math.floor((now - dataTime) / (1000 * 60)) // minutes
  }

  /**
   * Assess forecast reliability
   */
  private assessForecastReliability(forecast?: WeatherForecast[]): number {
    if (!forecast || forecast.length === 0) return 0

    // Reliability decreases with distance into future
    const avgReliability = forecast.reduce((sum, day, index) => {
      const dayReliability = Math.max(0.5, 1 - (index * 0.1)) // 100% -> 50% over 5 days
      return sum + dayReliability
    }, 0) / forecast.length

    return avgReliability
  }

  /**
   * Estimate spatial accuracy of weather data
   */
  private estimateSpatialAccuracy(): number {
    // WeatherAPI typically accurate within 10km
    return 10
  }

  /**
   * Override data validity assessment for weather data
   */
  protected assessDataValidity(data: WeatherCollectionResult): number {
    let score = 1.0

    // Check if current data is reasonable
    const temp = data.current.current.temperature.celsius
    if (temp < -50 || temp > 60) score *= 0.5

    const humidity = data.current.current.humidity
    if (humidity < 0 || humidity > 100) score *= 0.5

    const pressure = data.current.current.pressure
    if (pressure < 800 || pressure > 1100) score *= 0.5

    // Check data freshness (weather data should be recent)
    if (data.dataQuality.currentDataAge > 60) score *= 0.8 // Older than 1 hour

    return score
  }
}