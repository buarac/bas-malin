/**
 * F3.1 - Mobile Collection Status Card Component
 * 
 * Displays real-time collection status on mobile devices:
 * - Active sources overview
 * - Collection health indicators  
 * - Recent data collection metrics
 * - Quick action buttons
 */

'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { 
  Activity, 
  Database, 
  Wifi, 
  WifiOff, 
  AlertTriangle, 
  CheckCircle,
  Settings,
  RefreshCw,
  TrendingUp,
  Camera,
  Cloud
} from 'lucide-react'

interface CollectionStatusCardProps {
  jardinId: string
}

interface CollectionStatus {
  garden: {
    id: string
    isRunning: boolean
    overallHealth: 'healthy' | 'warning' | 'error'
    lastUpdate: Date
  }
  sources: {
    total: number
    active: number
    healthy: number
    warning: number
    error: number
    details: SourceDetail[]
  }
  collections: {
    today: number
    lastHour: number
    averageQualityToday: number
  }
  performance: {
    averageCollectionTime: number
    dataVolumeToday: number
    errorsToday: number
  }
}

interface SourceDetail {
  id: string
  nom: string
  type: string
  enabled: boolean
  health: 'healthy' | 'warning' | 'error'
  isActive: boolean
  metrics: {
    derniereCollecte?: Date
    collectesAujourdhui: number
    qualiteMoyenne: number
    tauxSucces?: number
  }
}

export function CollectionStatusCard({ jardinId }: CollectionStatusCardProps) {
  const [status, setStatus] = useState<CollectionStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  // Fetch collection status
  const fetchStatus = async () => {
    try {
      const response = await fetch(`/api/collection/status?jardinId=${jardinId}`)
      if (response.ok) {
        const data = await response.json()
        setStatus(data)
      }
    } catch (error) {
      console.error('Failed to fetch collection status:', error)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  // Manual refresh
  const handleRefresh = async () => {
    setRefreshing(true)
    await fetchStatus()
  }

  // Auto refresh every 30 seconds
  useEffect(() => {
    fetchStatus()
    const interval = setInterval(fetchStatus, 30000)
    return () => clearInterval(interval)
  }, [jardinId])

  if (loading) {
    return (
      <Card className="w-full bg-white/80 backdrop-blur-sm">
        <CardContent className="p-4">
          <div className="flex items-center justify-center h-32">
            <RefreshCw className="w-6 h-6 animate-spin text-green-600" />
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!status) {
    return (
      <Card className="w-full bg-white/80 backdrop-blur-sm">
        <CardContent className="p-4">
          <div className="text-center text-gray-500">
            Impossible de charger le statut de collecte
          </div>
        </CardContent>
      </Card>
    )
  }

  // Get status indicators
  const getHealthIcon = (health: string, isActive: boolean) => {
    if (!isActive) return <WifiOff className="w-4 h-4 text-gray-400" />
    
    switch (health) {
      case 'healthy':
        return <CheckCircle className="w-4 h-4 text-green-500" />
      case 'warning':
        return <AlertTriangle className="w-4 h-4 text-yellow-500" />
      case 'error':
        return <AlertTriangle className="w-4 h-4 text-red-500" />
      default:
        return <Wifi className="w-4 h-4 text-gray-400" />
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'IOT_HOME_ASSISTANT':
      case 'SENSOR_DIRECT':
        return <Activity className="w-4 h-4" />
      case 'WEATHER_API':
        return <Cloud className="w-4 h-4" />
      case 'PHOTO_LOCAL':
      case 'PHOTO_UPLOAD':
        return <Camera className="w-4 h-4" />
      case 'MANUAL_INPUT':
        return <Database className="w-4 h-4" />
      default:
        return <Database className="w-4 h-4" />
    }
  }

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`
  }

  return (
    <Card className="w-full bg-white/80 backdrop-blur-sm shadow-lg">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            {getHealthIcon(status.garden.overallHealth, status.garden.isRunning)}
            État de Collecte
          </CardTitle>
          <div className="flex items-center gap-2">
            <Badge 
              variant={status.garden.isRunning ? 'default' : 'secondary'}
              className={status.garden.isRunning ? 'bg-green-500' : 'bg-gray-400'}
            >
              {status.garden.isRunning ? 'Actif' : 'Arrêté'}
            </Badge>
            <Button 
              variant="ghost" 
              size="icon"
              onClick={handleRefresh}
              disabled={refreshing}
              className="h-8 w-8"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Summary metrics */}
        <div className="grid grid-cols-3 gap-3">
          <div className="text-center p-2 bg-green-50 rounded-lg">
            <div className="text-lg font-bold text-green-700">
              {status.sources.active}
            </div>
            <div className="text-xs text-green-600">Sources actives</div>
          </div>
          <div className="text-center p-2 bg-blue-50 rounded-lg">
            <div className="text-lg font-bold text-blue-700">
              {status.collections.today}
            </div>
            <div className="text-xs text-blue-600">Collectes aujourd'hui</div>
          </div>
          <div className="text-center p-2 bg-purple-50 rounded-lg">
            <div className="text-lg font-bold text-purple-700">
              {Math.round(status.collections.averageQualityToday * 100)}%
            </div>
            <div className="text-xs text-purple-600">Qualité moyenne</div>
          </div>
        </div>

        <Separator />

        {/* Source details */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-medium text-gray-700">Sources de données</h4>
            <div className="flex items-center gap-1 text-xs text-gray-500">
              <CheckCircle className="w-3 h-3 text-green-500" />
              {status.sources.healthy}
              <AlertTriangle className="w-3 h-3 text-yellow-500" />
              {status.sources.warning}
              <AlertTriangle className="w-3 h-3 text-red-500" />
              {status.sources.error}
            </div>
          </div>

          <div className="space-y-1 max-h-32 overflow-y-auto">
            {status.sources.details.map((source) => (
              <div
                key={source.id}
                className="flex items-center justify-between p-2 bg-gray-50 rounded text-xs"
              >
                <div className="flex items-center gap-2">
                  {getTypeIcon(source.type)}
                  <span className="font-medium truncate">{source.nom}</span>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  {source.metrics.collectesAujourdhui > 0 && (
                    <Badge variant="outline" className="h-5 text-xs">
                      {source.metrics.collectesAujourdhui}
                    </Badge>
                  )}
                  {getHealthIcon(source.health, source.isActive)}
                </div>
              </div>
            ))}
          </div>
        </div>

        <Separator />

        {/* Performance metrics */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-gray-700">Performance</h4>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Volume données:</span>
              <span className="font-medium">{formatBytes(status.performance.dataVolumeToday)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Dernière heure:</span>
              <span className="font-medium">{status.collections.lastHour}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Temps moyen:</span>
              <span className="font-medium">{status.performance.averageCollectionTime}ms</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Erreurs:</span>
              <span className={`font-medium ${status.performance.errorsToday > 0 ? 'text-red-600' : 'text-green-600'}`}>
                {status.performance.errorsToday}
              </span>
            </div>
          </div>
        </div>

        {/* Quick actions */}
        <div className="flex gap-2 pt-2">
          <Button 
            variant="outline" 
            size="sm" 
            className="flex-1 text-xs"
            onClick={() => {
              // Navigate to collection configuration
              window.location.href = `/gardens/${jardinId}/collection/config`
            }}
          >
            <Settings className="w-3 h-3 mr-1" />
            Configurer
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            className="flex-1 text-xs"
            onClick={() => {
              // Navigate to collection data view
              window.location.href = `/gardens/${jardinId}/collection/data`
            }}
          >
            <TrendingUp className="w-3 h-3 mr-1" />
            Données
          </Button>
        </div>

        {/* Last update */}
        <div className="text-center text-xs text-gray-500 pt-1">
          Mis à jour il y a {Math.round((Date.now() - new Date(status.garden.lastUpdate).getTime()) / 1000)}s
        </div>
      </CardContent>
    </Card>
  )
}