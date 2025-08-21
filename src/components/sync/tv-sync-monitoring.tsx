'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSyncStats } from '@/hooks/useDeviceConnections';
// Types importés pour référence future
// import { SyncStats } from '@/types/sync';
import { Badge } from '@/components/ui/badge';
import { formatDistance } from 'date-fns';
import { fr } from 'date-fns/locale';

export const TVSyncMonitoring = () => {
  const { data: realtimeStats, loading } = useSyncStats();
  const [currentTime, setCurrentTime] = useState(new Date());

  // Mettre à jour l'heure toutes les secondes
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    
    return () => clearInterval(interval);
  }, []);

  if (loading || !realtimeStats) {
    return (
      <div className="h-screen bg-gradient-to-br from-blue-900 to-indigo-900 text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-xl">Chargement des données de synchronisation...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-gradient-to-br from-blue-900 via-indigo-900 to-purple-900 text-white overflow-hidden">
      {/* Header avec horloge et titre */}
      <div className="relative p-8 text-center border-b border-white/20">
        <div className="absolute top-4 right-8 text-2xl font-mono">
          {currentTime.toLocaleTimeString('fr-FR')}
        </div>
        
        <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-blue-200 to-purple-200 bg-clip-text text-transparent">
          🌱 Baš-Malin
        </h1>
        <h2 className="text-2xl font-light opacity-90">État de synchronisation multi-device</h2>
      </div>

      <div className="p-8">
        {/* Métriques principales */}
        <div className="flex justify-center space-x-12 mb-12">
          <TVSyncMetric
            icon="⚡"
            label="Latence moyenne"
            value={`${realtimeStats.avgLatency}ms`}
            status={realtimeStats.avgLatency < 3000 ? 'good' : 'warning'}
            target="< 3000ms"
          />
          
          <TVSyncMetric
            icon="🔄"
            label="Sync aujourd'hui"
            value={realtimeStats.todaySync.toString()}
            status="good"
          />
          
          <TVSyncMetric
            icon="📱"
            label="Devices actifs"
            value={realtimeStats.activeDevices.toString()}
            status="good"
          />

          <TVSyncMetric
            icon="⏱️"
            label="Uptime"
            value={`${realtimeStats.uptime}%`}
            status={realtimeStats.uptime > 99 ? 'good' : 'warning'}
            target="> 99%"
          />
        </div>

        {/* Activité temps réel */}
        <div className="max-w-6xl mx-auto">
          <h3 className="text-3xl font-bold mb-8 text-center">Activité en temps réel</h3>
          
          <div className="space-y-4 max-h-96 overflow-y-auto custom-scrollbar">
            <AnimatePresence mode="popLayout">
              {realtimeStats.recentActivity && realtimeStats.recentActivity.length > 0 ? (
                realtimeStats.recentActivity.slice(0, 8).map((activity, index) => (
                  <motion.div
                    key={activity.id}
                    initial={{ opacity: 0, x: -100, scale: 0.9 }}
                    animate={{ opacity: 1, x: 0, scale: 1 }}
                    exit={{ opacity: 0, x: 100, scale: 0.9 }}
                    transition={{ 
                      delay: index * 0.1, 
                      type: "spring", 
                      stiffness: 100,
                      damping: 15 
                    }}
                    className="flex items-center justify-between bg-white/10 backdrop-blur-sm p-6 rounded-xl border border-white/20 shadow-lg"
                  >
                    <div className="flex items-center space-x-6">
                      <div className="text-4xl">
                        {getDeviceEmoji(activity.device)}
                      </div>
                      
                      <div>
                        <p className="text-xl font-semibold">
                          {activity.operation} {activity.entity}
                        </p>
                        <p className="text-lg opacity-75">
                          {activity.user} • {formatDistance(new Date(activity.timestamp), new Date(), { locale: fr, addSuffix: true })}
                        </p>
                      </div>
                    </div>
                    
                    <div className="text-right flex items-center space-x-4">
                      <Badge 
                        variant={getStatusVariant(activity.status)}
                        className="text-sm py-1 px-3"
                      >
                        {getStatusText(activity.status)}
                      </Badge>
                      <div className="text-2xl font-mono font-bold">
                        {activity.latency}ms
                      </div>
                    </div>
                  </motion.div>
                ))
              ) : (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-center py-16 opacity-50"
                >
                  <div className="text-6xl mb-4">🔄</div>
                  <p className="text-2xl">En attente d&apos;activité de synchronisation...</p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Indicateur de santé global */}
        <div className="fixed bottom-8 right-8">
          <motion.div
            animate={{ 
              scale: [1, 1.05, 1],
              opacity: [0.8, 1, 0.8] 
            }}
            transition={{ 
              duration: 2, 
              repeat: Infinity, 
              ease: "easeInOut" 
            }}
            className={`w-16 h-16 rounded-full flex items-center justify-center text-2xl ${
              realtimeStats.avgLatency < 3000 && realtimeStats.uptime > 99 
                ? 'bg-green-500' 
                : 'bg-yellow-500'
            }`}
          >
            {realtimeStats.avgLatency < 3000 && realtimeStats.uptime > 99 ? '✅' : '⚠️'}
          </motion.div>
        </div>
      </div>

      {/* Styles pour la scrollbar personnalisée */}
      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.1);
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.3);
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.5);
        }
      `}</style>
    </div>
  );
};

interface TVSyncMetricProps {
  icon: string;
  label: string;
  value: string;
  status: 'good' | 'warning' | 'error';
  target?: string;
}

const TVSyncMetric = ({ icon, label, value, status, target }: TVSyncMetricProps) => (
  <motion.div 
    className="text-center"
    initial={{ scale: 0, rotate: -180 }}
    animate={{ scale: 1, rotate: 0 }}
    transition={{ type: "spring", stiffness: 100, damping: 15 }}
  >
    <motion.div 
      className="text-8xl mb-4"
      animate={{ 
        rotate: [0, 5, -5, 0],
        scale: [1, 1.1, 1] 
      }}
      transition={{ 
        duration: 3, 
        repeat: Infinity, 
        ease: "easeInOut" 
      }}
    >
      {icon}
    </motion.div>
    <div className="text-4xl font-bold mb-2">{value}</div>
    <div className="text-xl opacity-75 mb-2">{label}</div>
    {target && (
      <div className="text-sm opacity-60">Objectif : {target}</div>
    )}
    <div className={`text-sm mt-3 px-4 py-1 rounded-full inline-block ${
      status === 'good' ? 'bg-green-500' : 
      status === 'warning' ? 'bg-yellow-500' : 
      'bg-red-500'
    }`}>
      {status === 'good' ? 'Normal' : status === 'warning' ? 'Attention' : 'Critique'}
    </div>
  </motion.div>
);

// Utilitaires pour l'affichage
function getDeviceEmoji(device: string): string {
  switch (device) {
    case 'mobile': return '📱';
    case 'desktop': return '💻';
    case 'tv': return '📺';
    default: return '🖥️';
  }
}

function getStatusVariant(status: string): 'success' | 'warning' | 'destructive' | 'default' {
  switch (status) {
    case 'synced': return 'success';
    case 'pending': return 'warning';
    case 'failed': return 'destructive';
    default: return 'default';
  }
}

function getStatusText(status: string): string {
  switch (status) {
    case 'synced': return 'Synchronisé';
    case 'pending': return 'En cours';
    case 'failed': return 'Échec';
    default: return status;
  }
}