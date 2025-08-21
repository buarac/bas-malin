import { useState, useEffect, useCallback } from 'react';
import { OfflineStore } from '@/lib/sync/offline-store';
import { DataChange, OfflineChange } from '@/types/sync';
import { useSession } from 'next-auth/react';

const offlineStore = new OfflineStore();

export const useOfflineSync = () => {
  const { data: session } = useSession();
  const [isOnline, setIsOnline] = useState(typeof navigator !== 'undefined' ? navigator.onLine : true);
  const [pendingChanges, setPendingChanges] = useState<OfflineChange[]>([]);
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    synced: 0,
    failed: 0
  });

  // Mettre à jour le statut online/offline
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleOnline = async () => {
      setIsOnline(true);
      console.log('Connection restored - starting offline sync');
      
      // Récupérer les changements en attente
      const changes = await offlineStore.getPendingSync();
      setPendingChanges(changes);
      
      // TODO: Déclencher la synchronisation via WebSocket
      // Cette partie sera connectée au WebSocket client
    };

    const handleOffline = () => {
      setIsOnline(false);
      console.log('Connection lost - switching to offline mode');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Vérification initiale
    handleOnline();

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Charger les statistiques périodiquement
  useEffect(() => {
    const loadStats = async () => {
      const newStats = await offlineStore.getStats();
      setStats(newStats);
      
      if (newStats.pending > 0) {
        const pending = await offlineStore.getPendingSync();
        setPendingChanges(pending);
      }
    };

    loadStats();
    
    // Actualiser toutes les 10 secondes
    const interval = setInterval(loadStats, 10000);
    
    return () => clearInterval(interval);
  }, []);

  /**
   * Stocker un changement en mode offline
   */
  const storeOfflineChange = useCallback(async (change: Omit<DataChange, 'id' | 'timestamp' | 'deviceId' | 'userId'>) => {
    if (!session?.user?.id) {
      throw new Error('User not authenticated');
    }

    const deviceId = getDeviceId();
    const fullChange: DataChange = {
      ...change,
      id: `offline_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      userId: session.user.id,
      deviceId,
      timestamp: new Date(),
      version: 1
    };

    await offlineStore.store(fullChange);
    
    // Mettre à jour l'état local
    const newStats = await offlineStore.getStats();
    setStats(newStats);
    
    if (!isOnline) {
      const pending = await offlineStore.getPendingSync();
      setPendingChanges(pending);
    }

    console.log(`Offline change stored: ${change.entity}:${change.operation}`);
  }, [session?.user?.id, isOnline]);

  /**
   * Forcer la synchronisation des changements offline
   */
  const forceSyncOfflineChanges = useCallback(async () => {
    if (!isOnline || !session?.user?.id) {
      console.warn('Cannot sync offline changes: no connection or not authenticated');
      return;
    }

    try {
      const changes = await offlineStore.getPendingSync();
      
      for (const change of changes) {
        // TODO: Envoyer via WebSocket
        // Pour l'instant, marquer comme synchronisé
        await offlineStore.markSynced(change.id);
      }
      
      // Actualiser les stats
      const newStats = await offlineStore.getStats();
      setStats(newStats);
      setPendingChanges([]);
      
      console.log(`Forced sync of ${changes.length} offline changes`);
      
    } catch (error) {
      console.error('Failed to force sync offline changes:', error);
    }
  }, [isOnline, session?.user?.id]);

  /**
   * Nettoyer les changements synchronisés anciens
   */
  const cleanupSyncedChanges = useCallback(async () => {
    await offlineStore.cleanupSyncedChanges();
    
    const newStats = await offlineStore.getStats();
    setStats(newStats);
    
    console.log('Cleaned up old synced changes');
  }, []);

  /**
   * Vider complètement le store offline
   */
  const clearOfflineStore = useCallback(async () => {
    await offlineStore.clear();
    
    setStats({ total: 0, pending: 0, synced: 0, failed: 0 });
    setPendingChanges([]);
    
    console.log('Offline store cleared');
  }, []);

  return {
    // État de connexion
    isOnline,
    
    // Statistiques
    pendingChanges: pendingChanges.length,
    hasPendingSync: pendingChanges.length > 0,
    stats,
    
    // Actions
    storeOfflineChange,
    forceSyncOfflineChanges,
    cleanupSyncedChanges,
    clearOfflineStore,
    
    // Données détaillées pour debug
    pendingChangesList: pendingChanges
  };
};

/**
 * Génération/récupération de l'ID device
 */
function getDeviceId(): string {
  if (typeof window === 'undefined') {
    return 'server-side';
  }

  let deviceId = localStorage.getItem('bas-malin-device-id');
  
  if (!deviceId) {
    // Générer un ID basé sur les caractéristiques du device
    const userAgent = navigator.userAgent;
    const isMobile = /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);
    const isTablet = /iPad/i.test(userAgent);
    
    let deviceType = 'desktop';
    if (isMobile && !isTablet) deviceType = 'mobile';
    else if (isTablet) deviceType = 'tablet';
    
    deviceId = `${deviceType}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    localStorage.setItem('bas-malin-device-id', deviceId);
  }
  
  return deviceId;
}

/**
 * Hook utilitaire pour détecter le type de device
 */
export const useDeviceType = () => {
  const [deviceType, setDeviceType] = useState<'mobile' | 'desktop' | 'tv'>('desktop');
  
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const userAgent = navigator.userAgent;
    const isMobile = /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);
    const isTV = /TV|SmartTV|WebTV/i.test(userAgent) || window.screen.width >= 1920;
    
    if (isMobile) {
      setDeviceType('mobile');
    } else if (isTV) {
      setDeviceType('tv');
    } else {
      setDeviceType('desktop');
    }
  }, []);
  
  return deviceType;
};