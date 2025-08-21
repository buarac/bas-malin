import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { DeviceConnection, SyncStats } from '@/types/sync';

export const useDeviceConnections = () => {
  const { data: session } = useSession();
  const [connections, setConnections] = useState<DeviceConnection[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchConnections = useCallback(async () => {
    if (!session?.user?.id) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/ws/sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'get_connections',
          userId: session.user.id
        })
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch device connections');
      }
      
      const data = await response.json();
      setConnections(data.connections || []);
      
    } catch (error) {
      console.error('Error fetching device connections:', error);
      setError(error instanceof Error ? error.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, [session?.user?.id]);

  const disconnectDevice = useCallback(async (deviceId: string) => {
    if (!session?.user?.id) return false;
    
    try {
      const response = await fetch('/api/ws/sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'disconnect_device',
          deviceId,
          userId: session.user.id
        })
      });
      
      if (!response.ok) {
        throw new Error('Failed to disconnect device');
      }
      
      // Actualiser la liste des connexions
      await fetchConnections();
      return true;
      
    } catch (error) {
      console.error('Error disconnecting device:', error);
      setError(error instanceof Error ? error.message : 'Unknown error');
      return false;
    }
  }, [session?.user?.id, fetchConnections]);

  const broadcastMessage = useCallback(async (message: Record<string, unknown>) => {
    if (!session?.user?.id) return false;
    
    try {
      const response = await fetch('/api/ws/sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'broadcast_message',
          message,
          userId: session.user.id
        })
      });
      
      return response.ok;
      
    } catch (error) {
      console.error('Error broadcasting message:', error);
      return false;
    }
  }, [session?.user?.id]);

  // Charger les connexions au montage et périodiquement
  useEffect(() => {
    fetchConnections();
    
    const interval = setInterval(fetchConnections, 30000); // Toutes les 30 secondes
    
    return () => clearInterval(interval);
  }, [fetchConnections]);

  return {
    connections,
    loading,
    error,
    fetchConnections,
    disconnectDevice,
    broadcastMessage,
    
    // Stats dérivées
    connectedDevices: connections.filter(c => c.isOnline).length,
    totalDevices: connections.length,
    deviceTypes: {
      mobile: connections.filter(c => c.type === 'mobile').length,
      desktop: connections.filter(c => c.type === 'desktop').length,
      tv: connections.filter(c => c.type === 'tv').length,
    }
  };
};

export const useSyncStats = () => {
  const { data: session } = useSession();
  const [stats, setStats] = useState<SyncStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = useCallback(async () => {
    if (!session?.user?.id) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/sync/stats?userId=${session.user.id}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch sync stats');
      }
      
      const data = await response.json();
      setStats(data);
      
    } catch (error) {
      console.error('Error fetching sync stats:', error);
      setError(error instanceof Error ? error.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, [session?.user?.id]);

  useEffect(() => {
    fetchStats();
    
    const interval = setInterval(fetchStats, 10000); // Toutes les 10 secondes
    
    return () => clearInterval(interval);
  }, [fetchStats]);

  return {
    data: stats,
    loading,
    error,
    refetch: fetchStats
  };
};