'use client';

import { useState, useEffect } from 'react';
import { useDeviceConnections, useSyncStats } from '@/hooks/useDeviceConnections';
import { DeviceConnection, DataConflict } from '@/types/sync';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Smartphone, 
  Monitor, 
  Tv, 
  Wifi, 
  WifiOff, 
  Activity,
  Clock,
  AlertTriangle,
  CheckCircle,
  RefreshCw,
  XCircle
} from 'lucide-react';
import { formatDistance } from 'date-fns';
import { fr } from 'date-fns/locale';

export const SyncControlDashboard = () => {
  const { connections, loading, error, disconnectDevice, deviceTypes } = useDeviceConnections();
  const { data: syncStats, loading: statsLoading, refetch: refetchStats } = useSyncStats();
  const [resolvingConflicts, setResolvingConflicts] = useState<DataConflict[]>([]);

  // Simuler quelques conflits pour la démo (à remplacer par vraies données)
  useEffect(() => {
    // En développement, simuler des conflits
    if (process.env.NODE_ENV === 'development') {
      setResolvingConflicts([]);
    }
  }, []);

  if (loading || statsLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin text-gray-500" />
        <span className="ml-2 text-gray-500">Chargement des données de synchronisation...</span>
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          Erreur lors du chargement des données de synchronisation : {error}
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Synchronisation Multi-Device</h1>
          <p className="text-gray-600">Gestion et monitoring des connexions entre appareils</p>
        </div>
        <Button onClick={refetchStats} variant="outline">
          <RefreshCw className="h-4 w-4 mr-2" />
          Actualiser
        </Button>
      </div>

      {/* État des devices connectés */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Activity className="h-5 w-5 mr-2" />
            Appareils connectés
          </CardTitle>
        </CardHeader>
        <CardContent>
          {connections.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <WifiOff className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Aucun appareil connecté</p>
              <p className="text-sm">Connectez-vous depuis vos autres appareils</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {connections.map(device => (
                <DeviceConnectionCard 
                  key={device.id}
                  device={device}
                  onDisconnect={disconnectDevice}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Métriques de synchronisation */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard 
          title="Sync aujourd'hui"
          value={syncStats?.todaySync || 0}
          unit="opérations"
          icon={Activity}
          trend="up"
        />
        <MetricCard 
          title="Latence moyenne"
          value={syncStats?.avgLatency || 0}
          unit="ms"
          target="< 3000ms"
          icon={Clock}
          status={!syncStats?.avgLatency || syncStats.avgLatency < 3000 ? 'good' : 'warning'}
        />
        <MetricCard 
          title="Conflits résolus"
          value={syncStats?.conflictsResolved || 0}
          unit="conflits"
          icon={CheckCircle}
          trend="neutral"
        />
        <MetricCard 
          title="Uptime sync"
          value={syncStats?.uptime || 0}
          unit="%"
          target="> 99%"
          icon={Wifi}
          status={!syncStats?.uptime || syncStats.uptime > 99 ? 'good' : 'warning'}
        />
      </div>

      {/* Résumé par type d'appareil */}
      <Card>
        <CardHeader>
          <CardTitle>Répartition par type d&apos;appareil</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex space-x-8">
            <div className="flex items-center space-x-2">
              <Smartphone className="h-5 w-5 text-blue-500" />
              <span className="text-sm font-medium">{deviceTypes.mobile} Mobile{deviceTypes.mobile > 1 ? 's' : ''}</span>
            </div>
            <div className="flex items-center space-x-2">
              <Monitor className="h-5 w-5 text-green-500" />
              <span className="text-sm font-medium">{deviceTypes.desktop} Desktop{deviceTypes.desktop > 1 ? 's' : ''}</span>
            </div>
            <div className="flex items-center space-x-2">
              <Tv className="h-5 w-5 text-purple-500" />
              <span className="text-sm font-medium">{deviceTypes.tv} TV{deviceTypes.tv > 1 ? 's' : ''}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Résolution manuelle des conflits */}
      {resolvingConflicts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-yellow-600 flex items-center">
              <AlertTriangle className="h-5 w-5 mr-2" />
              Conflits nécessitant une résolution manuelle
            </CardTitle>
          </CardHeader>
          <CardContent>
            {resolvingConflicts.map(conflict => (
              <ConflictResolutionCard 
                key={conflict.recordId}
                conflict={conflict}
                onResolve={() => {
                  // TODO: Implémenter la résolution de conflit
                  console.log('Résolution du conflit:', conflict.recordId);
                }}
              />
            ))}
          </CardContent>
        </Card>
      )}

      {/* Activité récente */}
      {syncStats?.recentActivity && syncStats.recentActivity.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Activité récente</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {syncStats.recentActivity.slice(0, 10).map((activity) => (
                <div key={activity.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                  <div className="flex items-center space-x-3">
                    <div className="text-lg">
                      {activity.device === 'mobile' ? '📱' : 
                       activity.device === 'desktop' ? '💻' : '📺'}
                    </div>
                    <div>
                      <p className="text-sm font-medium">
                        {activity.operation} {activity.entity}
                      </p>
                      <p className="text-xs text-gray-500">
                        {activity.user} • {formatDistance(new Date(activity.timestamp), new Date(), { locale: fr })}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge variant={activity.status === 'synced' ? 'success' : activity.status === 'pending' ? 'warning' : 'destructive'}>
                      {activity.status}
                    </Badge>
                    <span className="text-xs text-gray-500">{activity.latency}ms</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

interface DeviceConnectionCardProps {
  device: DeviceConnection;
  onDisconnect: (deviceId: string) => Promise<boolean>;
}

const DeviceConnectionCard = ({ device, onDisconnect }: DeviceConnectionCardProps) => {
  const [isDisconnecting, setIsDisconnecting] = useState(false);
  const isOnline = device.isOnline && (Date.now() - device.lastSeen) < 30000;

  const getDeviceIcon = () => {
    switch (device.type) {
      case 'mobile': return <Smartphone className="h-6 w-6" />;
      case 'tv': return <Tv className="h-6 w-6" />;
      default: return <Monitor className="h-6 w-6" />;
    }
  };

  const handleDisconnect = async () => {
    setIsDisconnecting(true);
    try {
      await onDisconnect(device.id);
    } finally {
      setIsDisconnecting(false);
    }
  };

  return (
    <div className={`p-4 rounded-lg border transition-all ${
      isOnline ? 'bg-green-50 border-green-200 shadow-sm' : 'bg-gray-50 border-gray-200'
    }`}>
      <div className="flex items-start justify-between">
        <div className="flex items-center space-x-3">
          <div className={`text-2xl ${isOnline ? 'text-green-600' : 'text-gray-400'}`}>
            {getDeviceIcon()}
          </div>
          <div>
            <h3 className="font-medium text-gray-900">{device.name}</h3>
            <p className="text-sm text-gray-500">
              {isOnline ? (
                <span className="flex items-center">
                  <Wifi className="h-3 w-3 mr-1 text-green-500" />
                  Connecté
                </span>
              ) : (
                <span className="flex items-center">
                  <WifiOff className="h-3 w-3 mr-1 text-gray-400" />
                  Vu il y a {formatDistance(new Date(device.lastSeen), new Date(), { locale: fr })}
                </span>
              )}
            </p>
          </div>
        </div>
        
        {isOnline && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDisconnect}
            disabled={isDisconnecting}
          >
            {isDisconnecting ? (
              <RefreshCw className="h-3 w-3 animate-spin" />
            ) : (
              <XCircle className="h-3 w-3" />
            )}
          </Button>
        )}
      </div>
      
      {device.pendingSync > 0 && (
        <div className="mt-3 pt-3 border-t border-gray-200">
          <p className="text-sm text-yellow-600 flex items-center">
            <Clock className="h-3 w-3 mr-1" />
            {device.pendingSync} modification{device.pendingSync > 1 ? 's' : ''} en attente
          </p>
        </div>
      )}
    </div>
  );
};

interface MetricCardProps {
  title: string;
  value: number;
  unit: string;
  target?: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  icon: React.ComponentType<any>;
  status?: 'good' | 'warning' | 'error';
  trend?: 'up' | 'down' | 'neutral';
}

const MetricCard = ({ title, value, unit, target, icon: Icon, status = 'good' }: MetricCardProps) => {
  const getStatusColor = () => {
    switch (status) {
      case 'good': return 'text-green-600 bg-green-100';
      case 'warning': return 'text-yellow-600 bg-yellow-100';
      case 'error': return 'text-red-600 bg-red-100';
      default: return 'text-blue-600 bg-blue-100';
    }
  };

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600">{title}</p>
            <div className="flex items-baseline space-x-2">
              <p className="text-2xl font-bold text-gray-900">{value.toLocaleString()}</p>
              <p className="text-sm text-gray-500">{unit}</p>
            </div>
            {target && (
              <p className="text-xs text-gray-400 mt-1">Objectif : {target}</p>
            )}
          </div>
          <div className={`p-3 rounded-lg ${getStatusColor()}`}>
            <Icon className="h-6 w-6" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

interface ConflictResolutionCardProps {
  conflict: DataConflict;
  onResolve: (recordId: string, resolution: 'current' | 'incoming' | 'merged') => void;
}

const ConflictResolutionCard = ({ conflict, onResolve }: ConflictResolutionCardProps) => {
  const [selectedResolution, setSelectedResolution] = useState<'current' | 'incoming' | 'merged'>();

  return (
    <div className="border-l-4 border-yellow-400 bg-yellow-50 p-4 rounded">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-lg font-medium text-yellow-800">
            Conflit sur {conflict.entity} #{conflict.recordId}
          </h3>
          <p className="text-yellow-700">
            Modifications concurrentes détectées
          </p>
        </div>
        <Badge variant="warning">
          {conflict.changes.length} versions
        </Badge>
      </div>

      {/* Options de résolution */}
      <div className="flex space-x-4">
        <Button
          variant={selectedResolution === 'current' ? 'default' : 'outline'}
          onClick={() => setSelectedResolution('current')}
          size="sm"
        >
          Garder actuelle
        </Button>
        
        <Button
          variant={selectedResolution === 'incoming' ? 'default' : 'outline'}
          onClick={() => setSelectedResolution('incoming')}
          size="sm"
        >
          Accepter entrante
        </Button>
        
        <Button
          variant={selectedResolution === 'merged' ? 'default' : 'outline'}
          onClick={() => setSelectedResolution('merged')}
          size="sm"
        >
          Fusionner
        </Button>
        
        <Button 
          onClick={() => selectedResolution && onResolve(conflict.recordId, selectedResolution)}
          disabled={!selectedResolution}
          className="ml-auto"
          size="sm"
        >
          Résoudre
        </Button>
      </div>
    </div>
  );
};