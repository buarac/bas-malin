'use client';

import { CheckCircle, RefreshCw, WifiOff, Wifi, AlertTriangle } from 'lucide-react';
import { useOfflineSync } from '@/hooks/useOfflineSync';
import { useSyncConnection } from '@/hooks/useSyncConnection';
import { cn } from '@/lib/utils';

export const MobileSyncIndicator = () => {
  const { isOnline, pendingChanges, hasPendingSync } = useOfflineSync();
  const { syncStatus, connectionError, isConnected } = useSyncConnection();

  // Déterminer l'état d'affichage
  const getDisplayState = () => {
    if (connectionError) {
      return {
        icon: AlertTriangle,
        label: 'Erreur de connexion',
        color: 'bg-red-500',
        pulse: false
      };
    }
    
    if (syncStatus === 'connected' && isConnected) {
      return {
        icon: CheckCircle,
        label: 'Synchronisé',
        color: 'bg-green-500',
        pulse: false
      };
    }
    
    if (syncStatus === 'syncing') {
      return {
        icon: RefreshCw,
        label: 'Synchronisation...',
        color: 'bg-yellow-500',
        pulse: true
      };
    }
    
    if (isOnline && !isConnected) {
      return {
        icon: Wifi,
        label: 'Connexion...',
        color: 'bg-blue-500',
        pulse: true
      };
    }
    
    return {
      icon: WifiOff,
      label: hasPendingSync ? `Hors ligne (${pendingChanges} en attente)` : 'Hors ligne',
      color: 'bg-gray-500',
      pulse: false
    };
  };

  const { icon: Icon, label, color, pulse } = getDisplayState();

  return (
    <div className="fixed top-4 right-4 z-50 md:hidden">
      <div className={cn(
        "px-3 py-2 rounded-lg text-white text-sm shadow-lg backdrop-blur-sm",
        color,
        "transition-all duration-300 ease-in-out",
        pulse && "animate-pulse"
      )}>
        <div className="flex items-center space-x-2">
          <Icon 
            size={16} 
            className={cn(
              syncStatus === 'syncing' && "animate-spin"
            )} 
          />
          <span className="font-medium">{label}</span>
        </div>
        
        {/* Indicateur de détail pour debug en mode dev */}
        {process.env.NODE_ENV === 'development' && (
          <div className="text-xs opacity-75 mt-1">
            {isOnline ? '🟢' : '🔴'} {syncStatus} • {pendingChanges} pending
          </div>
        )}
      </div>
    </div>
  );
};

/**
 * Version compacte pour desktop (coin de l'écran)
 */
export const DesktopSyncIndicator = () => {
  const { pendingChanges } = useOfflineSync();
  const { syncStatus, isConnected } = useSyncConnection();

  const getStatusColor = () => {
    if (syncStatus === 'connected' && isConnected) return 'bg-green-400';
    if (syncStatus === 'syncing') return 'bg-yellow-400';
    return 'bg-gray-400';
  };

  return (
    <div className="fixed bottom-4 right-4 z-40 hidden md:block">
      <div className="flex items-center space-x-2 bg-white/90 backdrop-blur-sm border border-gray-200 rounded-lg px-3 py-2 shadow-sm">
        <div className={cn(
          "w-2 h-2 rounded-full",
          getStatusColor(),
          syncStatus === 'syncing' && "animate-pulse"
        )} />
        
        <span className="text-xs text-gray-600">
          {isConnected ? 'Sync actif' : 'Hors ligne'}
        </span>
        
        {pendingChanges > 0 && (
          <span className="text-xs bg-orange-100 text-orange-800 px-1.5 py-0.5 rounded-full">
            {pendingChanges}
          </span>
        )}
      </div>
    </div>
  );
};

/**
 * Barre de notification pour les états critiques
 */
export const SyncNotificationBar = () => {
  const { isOnline, pendingChanges, hasPendingSync } = useOfflineSync();
  const { connectionError } = useSyncConnection();

  // Afficher seulement en cas de problème ou changements en attente
  const shouldShow = !isOnline || connectionError || (hasPendingSync && pendingChanges > 5);
  
  if (!shouldShow) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-50">
      <div className={cn(
        "px-4 py-2 text-white text-sm text-center",
        connectionError ? 'bg-red-600' :
        !isOnline ? 'bg-orange-600' :
        'bg-blue-600'
      )}>
        <div className="flex items-center justify-center space-x-2">
          {!isOnline && (
            <>
              <WifiOff size={16} />
              <span>
                Mode hors ligne - {pendingChanges} modification{pendingChanges > 1 ? 's' : ''} en attente de synchronisation
              </span>
            </>
          )}
          
          {connectionError && (
            <>
              <AlertTriangle size={16} />
              <span>Problème de synchronisation : {connectionError}</span>
            </>
          )}
          
          {isOnline && hasPendingSync && pendingChanges > 5 && (
            <>
              <RefreshCw size={16} className="animate-spin" />
              <span>Synchronisation de {pendingChanges} modifications en cours...</span>
            </>
          )}
        </div>
      </div>
    </div>
  );
};