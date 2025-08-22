import * as React from "react"
import { cn } from "@/lib/utils"
import { useDeviceType } from "@/hooks/use-theme"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/data-display/card"

export interface HarvestData {
  totalWeight: number
  totalHarvests: number
  todayWeight: number
  todayHarvests: number
  weekWeight: number
  weekHarvests: number
  unit?: 'g' | 'kg'
  trend?: 'up' | 'down' | 'stable'
  topVarieties?: {
    name: string
    weight: number
    count: number
  }[]
}

export interface HarvestCounterProps {
  data: HarvestData
  className?: string
  variant?: 'summary' | 'detailed' | 'animated'
  period?: 'today' | 'week' | 'month' | 'total'
  animate?: boolean
}

const HarvestCounter = React.forwardRef<HTMLDivElement, HarvestCounterProps>(
  ({ data, className, variant = 'summary', period = 'total', animate = true, ...props }, ref) => {
    const deviceType = useDeviceType()
    const [displayWeight, setDisplayWeight] = React.useState(0)
    const [displayCount, setDisplayCount] = React.useState(0)

    const { totalWeight, totalHarvests, todayWeight, todayHarvests, weekWeight, weekHarvests, unit = 'kg' } = data

    // Sélectionner les données selon la période
    const getPeriodData = () => {
      switch (period) {
        case 'today':
          return { weight: todayWeight, count: todayHarvests, label: "Aujourd'hui" }
        case 'week':
          return { weight: weekWeight, count: weekHarvests, label: "Cette semaine" }
        case 'total':
        default:
          return { weight: totalWeight, count: totalHarvests, label: "Total" }
      }
    }

    const periodData = getPeriodData()

    // Animation des compteurs
    React.useEffect(() => {
      if (!animate) {
        setDisplayWeight(periodData.weight)
        setDisplayCount(periodData.count)
        return
      }

      const duration = 1500 // 1.5 secondes
      const steps = 60
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const weightStep = periodData.weight / steps
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const countStep = periodData.count / steps

      let currentStep = 0
      const timer = setInterval(() => {
        currentStep++
        const progress = currentStep / steps
        
        // Fonction d'easing out cubic
        const easedProgress = 1 - Math.pow(1 - progress, 3)
        
        setDisplayWeight(Math.round(periodData.weight * easedProgress * 100) / 100)
        setDisplayCount(Math.round(periodData.count * easedProgress))

        if (currentStep >= steps) {
          clearInterval(timer)
          setDisplayWeight(periodData.weight)
          setDisplayCount(periodData.count)
        }
      }, duration / steps)

      return () => clearInterval(timer)
    }, [periodData.weight, periodData.count, animate])

    // Formatage du poids
    const formatWeight = (weight: number) => {
      if (unit === 'kg' && weight >= 1) {
        return `${weight.toFixed(1)} kg`
      } else if (unit === 'kg' && weight < 1) {
        return `${(weight * 1000).toFixed(0)} g`
      } else {
        return `${weight.toFixed(0)} g`
      }
    }

    // Icône de tendance
    const getTrendIcon = () => {
      switch (data.trend) {
        case 'up': return '📈'
        case 'down': return '📉'
        case 'stable': return '➡️'
        default: return ''
      }
    }

    const getTrendColor = () => {
      switch (data.trend) {
        case 'up': return 'text-success'
        case 'down': return 'text-error'
        case 'stable': return 'text-muted-foreground'
        default: return 'text-muted-foreground'
      }
    }

    if (variant === 'summary') {
      return (
        <Card ref={ref} variant="harvest" className={cn("text-center", className)} {...props}>
          <CardContent className="pt-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <div className={cn(
                  "text-4xl font-bold text-jardin-earth-600",
                  deviceType === 'tv' && "text-6xl"
                )}>
                  🧺
                </div>
                <p className="text-sm text-muted-foreground">{periodData.label}</p>
              </div>

              <div className="space-y-3">
                <div>
                  <div className={cn(
                    "text-2xl font-bold text-jardin-green-700",
                    deviceType === 'tv' && "text-4xl",
                    animate && "transition-all duration-200"
                  )}>
                    {formatWeight(displayWeight)}
                  </div>
                  <p className="text-xs text-muted-foreground">Poids récolté</p>
                </div>

                <div>
                  <div className={cn(
                    "text-xl font-semibold text-jardin-earth-600",
                    deviceType === 'tv' && "text-2xl",
                    animate && "transition-all duration-200"
                  )}>
                    {displayCount}
                  </div>
                  <p className="text-xs text-muted-foreground">Récoltes</p>
                </div>
              </div>

              {data.trend && (
                <div className={cn("flex items-center justify-center gap-1", getTrendColor())}>
                  <span>{getTrendIcon()}</span>
                  <span className="text-sm">Tendance</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )
    }

    if (variant === 'detailed') {
      return (
        <Card ref={ref} variant="harvest" className={className} {...props}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <span className="text-2xl">🧺</span>
              <span>Compteur de récoltes</span>
            </CardTitle>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Métriques principales */}
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-4 rounded-lg bg-jardin-green-50">
                <div className={cn(
                  "text-2xl font-bold text-jardin-green-700",
                  deviceType === 'tv' && "text-3xl"
                )}>
                  {formatWeight(displayWeight)}
                </div>
                <p className="text-sm text-jardin-green-600 mt-1">{periodData.label}</p>
              </div>

              <div className="text-center p-4 rounded-lg bg-jardin-earth-50">
                <div className={cn(
                  "text-2xl font-bold text-jardin-earth-700",
                  deviceType === 'tv' && "text-3xl"
                )}>
                  {displayCount}
                </div>
                <p className="text-sm text-jardin-earth-600 mt-1">Récoltes</p>
              </div>
            </div>

            {/* Comparaisons de périodes */}
            <div className="space-y-3">
              <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground">Aujourd&apos;hui</span>
                <div className="flex items-center gap-2">
                  <span className="font-medium">{formatWeight(todayWeight)}</span>
                  <span className="text-muted-foreground">({todayHarvests} récoltes)</span>
                </div>
              </div>

              <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground">Cette semaine</span>
                <div className="flex items-center gap-2">
                  <span className="font-medium">{formatWeight(weekWeight)}</span>
                  <span className="text-muted-foreground">({weekHarvests} récoltes)</span>
                </div>
              </div>

              <div className="flex justify-between items-center text-sm border-t pt-2">
                <span className="font-medium">Total</span>
                <div className="flex items-center gap-2">
                  <span className="font-bold">{formatWeight(totalWeight)}</span>
                  <span className="text-muted-foreground">({totalHarvests} récoltes)</span>
                </div>
              </div>
            </div>

            {/* Top variétés */}
            {data.topVarieties && data.topVarieties.length > 0 && (
              <div className="space-y-3">
                <h4 className="text-sm font-semibold text-muted-foreground">Top variétés</h4>
                <div className="space-y-2">
                  {data.topVarieties.slice(0, 3).map((variety, index) => (
                    <div key={index} className="flex justify-between items-center text-sm">
                      <span className="flex items-center gap-2">
                        <span className="text-xs bg-muted rounded-full w-5 h-5 flex items-center justify-center">
                          {index + 1}
                        </span>
                        <span>{variety.name}</span>
                      </span>
                      <div className="text-right">
                        <div className="font-medium">{formatWeight(variety.weight)}</div>
                        <div className="text-xs text-muted-foreground">{variety.count} récoltes</div>
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

    // Variant animated avec graphique circulaire
    return (
      <Card ref={ref} variant="harvest" className={className} {...props}>
        <CardContent className="pt-6">
          <div className="relative flex items-center justify-center">
            {/* Graphique circulaire animé */}
            <div className="relative">
              <svg className="transform -rotate-90" width="120" height="120" viewBox="0 0 120 120">
                <circle
                  cx="60"
                  cy="60"
                  r="50"
                  stroke="currentColor"
                  strokeWidth="8"
                  fill="transparent"
                  className="text-muted-foreground/20"
                />
                <circle
                  cx="60"
                  cy="60"
                  r="50"
                  stroke="currentColor"
                  strokeWidth="8"
                  fill="transparent"
                  strokeDasharray={`${2 * Math.PI * 50}`}
                  strokeDashoffset={`${2 * Math.PI * 50 * (1 - Math.min(displayWeight / 10, 1))}`}
                  className="text-jardin-green-500 transition-all duration-1000 ease-out"
                />
              </svg>

              {/* Contenu central */}
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <div className="text-xl mb-1">🧺</div>
                <div className={cn(
                  "text-lg font-bold text-jardin-green-700",
                  deviceType === 'tv' && "text-xl"
                )}>
                  {formatWeight(displayWeight)}
                </div>
                <div className="text-xs text-muted-foreground">
                  {displayCount} récoltes
                </div>
              </div>
            </div>
          </div>

          <div className="text-center mt-4">
            <p className="text-sm text-muted-foreground">{periodData.label}</p>
            {data.trend && (
              <div className={cn("flex items-center justify-center gap-1 mt-2", getTrendColor())}>
                <span>{getTrendIcon()}</span>
                <span className="text-xs">Tendance</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    )
  }
)
HarvestCounter.displayName = "HarvestCounter"

// Hook pour récupérer les données de récolte
export function useHarvestData() {
  const [harvestData, setHarvestData] = React.useState<HarvestData | null>(null)
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)

  const fetchHarvestData = React.useCallback(async () => {
      try {
        setLoading(true)
        setError(null)

        // Simuler une API call - à remplacer par l'API réelle
        // const response = await fetch('/api/harvests/stats')
        // const data = await response.json()

        // Données de démonstration
        const mockData: HarvestData = {
          totalWeight: 15.7,
          totalHarvests: 23,
          todayWeight: 2.1,
          todayHarvests: 3,
          weekWeight: 8.4,
          weekHarvests: 12,
          unit: 'kg',
          trend: 'up',
          topVarieties: [
            { name: 'Tomates cerises', weight: 4.2, count: 8 },
            { name: 'Courgettes', weight: 3.8, count: 5 },
            { name: 'Radis', weight: 1.9, count: 10 }
          ]
        }

        setHarvestData(mockData)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erreur de chargement')
      } finally {
        setLoading(false)
      }
  }, [])

  React.useEffect(() => {
    fetchHarvestData()
  }, [fetchHarvestData])

  return { harvestData, loading, error, refetch: () => fetchHarvestData() }
}

// Composant avec données intégrées
export interface HarvestCounterWithDataProps extends Omit<HarvestCounterProps, 'data'> {
  refreshInterval?: number
}

export function HarvestCounterWithData(props: HarvestCounterWithDataProps) {
  const { harvestData, loading, error } = useHarvestData()

  if (loading) {
    return (
      <Card className={props.className}>
        <CardContent className="flex items-center justify-center p-6">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
            <span className="text-sm text-muted-foreground">Chargement...</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error || !harvestData) {
    return (
      <Card variant="error" className={props.className}>
        <CardContent className="text-center p-6">
          <div className="text-2xl mb-2">🧺</div>
          <div className="text-sm text-muted-foreground">
            {error || 'Données indisponibles'}
          </div>
        </CardContent>
      </Card>
    )
  }

  return <HarvestCounter data={harvestData} {...props} />
}

export { HarvestCounter }