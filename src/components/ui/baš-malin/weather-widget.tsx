import * as React from "react"
import { cn } from "@/lib/utils"
import { useDeviceType } from "@/hooks/use-theme"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/data-display/card"

export interface WeatherData {
  temperature: number
  humidity: number
  condition: 'sunny' | 'cloudy' | 'rainy' | 'stormy' | 'snowy'
  windSpeed?: number
  uvIndex?: number
  precipitation?: number
  forecast?: {
    date: string
    tempMin: number
    tempMax: number
    condition: string
  }[]
}

export interface WeatherWidgetProps {
  data: WeatherData
  className?: string
  variant?: 'compact' | 'detailed' | 'forecast'
  showForecast?: boolean
  location?: string
}

const conditionIcons = {
  sunny: "☀️",
  cloudy: "☁️", 
  rainy: "🌧️",
  stormy: "⛈️",
  snowy: "❄️"
}

const conditionColors = {
  sunny: "text-yellow-500",
  cloudy: "text-gray-500",
  rainy: "text-blue-500", 
  stormy: "text-purple-500",
  snowy: "text-blue-200"
}

const conditionBackgrounds = {
  sunny: "from-yellow-50 to-orange-50",
  cloudy: "from-gray-50 to-gray-100",
  rainy: "from-blue-50 to-blue-100",
  stormy: "from-purple-50 to-gray-100", 
  snowy: "from-blue-50 to-white"
}

const WeatherWidget = React.forwardRef<HTMLDivElement, WeatherWidgetProps>(
  ({ data, className, variant = 'compact', showForecast = false, location, ...props }, ref) => {
    const deviceType = useDeviceType()

    if (variant === 'compact') {
      return (
        <div
          ref={ref}
          className={cn(
            "flex items-center gap-3 p-3 rounded-lg border bg-gradient-to-r transition-theme",
            conditionBackgrounds[data.condition],
            className
          )}
          {...props}
        >
          <div className={cn(
            "text-2xl",
            deviceType === 'tv' && "text-4xl"
          )}>
            {conditionIcons[data.condition]}
          </div>
          
          <div className="flex-1">
            <div className={cn(
              "font-bold text-lg",
              deviceType === 'tv' ? "text-2xl" : "text-xl"
            )}>
              {Math.round(data.temperature)}°C
            </div>
            <div className="text-sm text-muted-foreground">
              Humidité {data.humidity}%
            </div>
          </div>

          {data.windSpeed && (
            <div className="text-right text-sm">
              <div className="font-medium">🌬️ {data.windSpeed} km/h</div>
            </div>
          )}
        </div>
      )
    }

    if (variant === 'detailed') {
      return (
        <Card ref={ref} variant="weather" className={className} {...props}>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center justify-between">
              <span>Météo{location && ` - ${location}`}</span>
              <div className={cn(
                "text-3xl",
                deviceType === 'tv' && "text-5xl"
              )}>
                {conditionIcons[data.condition]}
              </div>
            </CardTitle>
          </CardHeader>

          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="text-center">
                  <div className={cn(
                    "text-3xl font-bold",
                    deviceType === 'tv' && "text-5xl",
                    conditionColors[data.condition]
                  )}>
                    {Math.round(data.temperature)}°C
                  </div>
                  <div className="text-sm text-muted-foreground capitalize">
                    {data.condition}
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <span className="text-blue-500">💧</span>
                  <span className="text-sm">Humidité: {data.humidity}%</span>
                </div>

                {data.windSpeed && (
                  <div className="flex items-center gap-2">
                    <span>🌬️</span>
                    <span className="text-sm">Vent: {data.windSpeed} km/h</span>
                  </div>
                )}

                {data.uvIndex !== undefined && (
                  <div className="flex items-center gap-2">
                    <span className="text-orange-500">☀️</span>
                    <span className="text-sm">UV: {data.uvIndex}/10</span>
                  </div>
                )}

                {data.precipitation !== undefined && data.precipitation > 0 && (
                  <div className="flex items-center gap-2">
                    <span className="text-blue-600">🌧️</span>
                    <span className="text-sm">Pluie: {data.precipitation}mm</span>
                  </div>
                )}
              </div>
            </div>

            {showForecast && data.forecast && data.forecast.length > 0 && (
              <div className="pt-4 border-t">
                <h4 className="text-sm font-medium mb-3">Prévisions</h4>
                <div className="grid grid-cols-3 gap-2 text-xs">
                  {data.forecast.slice(0, 3).map((day, index) => (
                    <div key={index} className="text-center p-2 rounded bg-muted/50">
                      <div className="font-medium">{new Date(day.date).toLocaleDateString('fr', { weekday: 'short' })}</div>
                      <div className="text-xs text-muted-foreground mt-1">
                        {Math.round(day.tempMin)}° / {Math.round(day.tempMax)}°
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )
    }

    // Variant forecast
    return (
      <Card ref={ref} variant="weather" className={className} {...props}>
        <CardHeader>
          <CardTitle>Prévisions météo</CardTitle>
        </CardHeader>

        <CardContent>
          {data.forecast && data.forecast.length > 0 ? (
            <div className="space-y-3">
              {data.forecast.slice(0, 5).map((day, index) => (
                <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                  <div className="flex items-center gap-3">
                    <div className="text-sm font-medium min-w-[60px]">
                      {new Date(day.date).toLocaleDateString('fr', { 
                        weekday: 'short',
                        day: 'numeric'
                      })}
                    </div>
                    <div className="text-lg">
                      {conditionIcons[data.condition]}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4">
                    <div className="text-sm text-muted-foreground">
                      {Math.round(day.tempMin)}°
                    </div>
                    <div className="w-16 h-1 bg-gradient-to-r from-blue-200 to-red-200 rounded" />
                    <div className="text-sm font-medium">
                      {Math.round(day.tempMax)}°
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center text-muted-foreground py-4">
              Aucune prévision disponible
            </div>
          )}
        </CardContent>
      </Card>
    )
  }
)
WeatherWidget.displayName = "WeatherWidget"

// Hook pour récupérer les données météo
export function useWeatherData(location?: string) {
  const [weatherData, setWeatherData] = React.useState<WeatherData | null>(null)
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)

  const fetchWeatherData = React.useCallback(async () => {
      try {
        setLoading(true)
        setError(null)

        // Simuler une API call - à remplacer par l'API réelle
        // const response = await fetch(`/api/weather?location=${location}`)
        // const data = await response.json()

        // Données de démonstration
        const mockData: WeatherData = {
          temperature: 22,
          humidity: 65,
          condition: 'sunny',
          windSpeed: 12,
          uvIndex: 6,
          precipitation: 0,
          forecast: [
            { date: new Date().toISOString(), tempMin: 18, tempMax: 25, condition: 'sunny' },
            { date: new Date(Date.now() + 24*60*60*1000).toISOString(), tempMin: 16, tempMax: 23, condition: 'cloudy' },
            { date: new Date(Date.now() + 2*24*60*60*1000).toISOString(), tempMin: 19, tempMax: 26, condition: 'rainy' },
          ]
        }

        setWeatherData(mockData)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erreur de chargement météo')
      } finally {
        setLoading(false)
      }
  }, [location])

  React.useEffect(() => {
    fetchWeatherData()
  }, [fetchWeatherData])

  return { weatherData, loading, error, refetch: () => fetchWeatherData() }
}

// Composant avec données intégrées
export interface WeatherWidgetWithDataProps extends Omit<WeatherWidgetProps, 'data'> {
  location?: string
}

export function WeatherWidgetWithData({ location, ...props }: WeatherWidgetWithDataProps) {
  const { weatherData, loading, error } = useWeatherData(location)

  if (loading) {
    return (
      <Card className={props.className}>
        <CardContent className="flex items-center justify-center p-6">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
            <span className="text-sm text-muted-foreground">Chargement météo...</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error || !weatherData) {
    return (
      <Card variant="error" className={props.className}>
        <CardContent className="text-center p-6">
          <div className="text-2xl mb-2">🌡️</div>
          <div className="text-sm text-muted-foreground">
            {error || 'Données météo indisponibles'}
          </div>
        </CardContent>
      </Card>
    )
  }

  return <WeatherWidget data={weatherData} {...props} />
}

export { WeatherWidget }