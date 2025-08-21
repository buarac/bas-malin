import { useState, useEffect, useRef, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { SyncMessage, SyncStatus } from '@/types/sync';
import { useDeviceType } from './useOfflineSync';

export const useSyncConnection = () => {
  const { data: session } = useSession();
  const deviceType = useDeviceType();
  const [ws, setWs] = useState<WebSocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>('offline');
  const [lastMessage, setLastMessage] = useState<SyncMessage | null>(null);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);
  const heartbeatIntervalRef = useRef<NodeJS.Timeout | undefined>(undefined);
  const reconnectAttempts = useRef(0);
  const maxReconnectAttempts = 5;

  const getDeviceId = useCallback(() => {
    if (typeof window === 'undefined') return 'server-side';
    
    let deviceId = localStorage.getItem('bas-malin-device-id');
    if (!deviceId) {
      deviceId = `${deviceType}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      localStorage.setItem('bas-malin-device-id', deviceId);
    }
    return deviceId;
  }, [deviceType]);

  const connect = useCallback(async () => {
    if (!session?.user?.id) {
      console.log('Cannot connect WebSocket: user not authenticated');
      return;
    }

    if (ws?.readyState === WebSocket.OPEN) {
      console.log('WebSocket already connected');
      return;
    }

    try {
      setSyncStatus('syncing');
      setConnectionError(null);
      
      const deviceId = getDeviceId();
      
      // Obtenir le token d'authentification
      const tokenResponse = await fetch('/api/auth/token');
      const { token } = await tokenResponse.json();
      
      const wsUrl = new URL('ws://localhost:3001');
      wsUrl.searchParams.set('userId', session.user.id);
      wsUrl.searchParams.set('deviceId', deviceId);
      wsUrl.searchParams.set('deviceType', deviceType);
      wsUrl.searchParams.set('token', token);

      const websocket = new WebSocket(wsUrl.toString());

      websocket.onopen = () => {
        console.log('WebSocket connected');
        setIsConnected(true);
        setSyncStatus('connected');
        reconnectAttempts.current = 0;
        
        // Démarrer le heartbeat
        if (heartbeatIntervalRef.current) {
          clearInterval(heartbeatIntervalRef.current);
        }
        
        heartbeatIntervalRef.current = setInterval(() => {
          if (websocket.readyState === WebSocket.OPEN) {
            const heartbeat: SyncMessage = {
              id: `heartbeat_${Date.now()}`,
              type: 'HEARTBEAT',
              entity: 'system',
              operation: 'CREATE',
              data: { timestamp: Date.now() },
              userId: session.user.id,
              deviceId,
              timestamp: new Date().toISOString(),
              version: 1
            };
            websocket.send(JSON.stringify(heartbeat));
          }
        }, 30000); // Heartbeat toutes les 30 secondes
      };

      websocket.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          
          if (message.type === 'connection_established') {
            console.log('WebSocket connection confirmed:', message.deviceId);
            return;
          }
          
          if (message.type === 'heartbeat_ack') {
            console.log('Heartbeat acknowledged');
            return;
          }
          
          if (message.type === 'error') {
            console.error('WebSocket error message:', message.message);
            setConnectionError(message.message);
            return;
          }
          
          // Message de synchronisation normal
          const syncMessage: SyncMessage = message;
          setLastMessage(syncMessage);
          
          console.log('Received sync message:', {
            type: syncMessage.type,
            entity: syncMessage.entity,
            operation: syncMessage.operation,
            from: syncMessage.deviceId
          });
          
          // Déclencher les handlers de synchronisation
          handleIncomingSync(syncMessage);
          
        } catch (error) {
          console.error('Failed to parse WebSocket message:', error);
        }
      };

      websocket.onclose = (event) => {
        console.log('WebSocket disconnected:', event.code, event.reason);
        setIsConnected(false);
        setSyncStatus('offline');
        
        // Nettoyer le heartbeat
        if (heartbeatIntervalRef.current) {
          clearInterval(heartbeatIntervalRef.current);
          heartbeatIntervalRef.current = undefined;
        }
        
        // Tentative de reconnexion avec backoff exponentiel
        if (reconnectAttempts.current < maxReconnectAttempts && event.code !== 1000) {
          const delay = Math.pow(2, reconnectAttempts.current) * 1000; // 1s, 2s, 4s, 8s, 16s
          reconnectAttempts.current++;
          
          console.log(`Reconnecting in ${delay}ms (attempt ${reconnectAttempts.current}/${maxReconnectAttempts})`);
          
          reconnectTimeoutRef.current = setTimeout(() => {
            connect();
          }, delay);
        } else {
          setConnectionError('Connection failed after multiple attempts');
        }
      };

      websocket.onerror = (error) => {
        console.error('WebSocket error:', error);
        setConnectionError('WebSocket connection error');
        setSyncStatus('offline');
      };

      setWs(websocket);
      
    } catch (error) {
      console.error('Failed to connect WebSocket:', error);
      setConnectionError('Failed to establish connection');
      setSyncStatus('offline');
    }
  }, [session?.user?.id, deviceType, getDeviceId, ws?.readyState]);

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }
    
    if (heartbeatIntervalRef.current) {
      clearInterval(heartbeatIntervalRef.current);
    }
    
    if (ws?.readyState === WebSocket.OPEN) {
      ws.close(1000, 'Disconnected by user');
    }
    
    setWs(null);
    setIsConnected(false);
    setSyncStatus('offline');
    reconnectAttempts.current = 0;
  }, [ws]);

  const sendMessage = useCallback((message: SyncMessage) => {
    if (!ws || ws.readyState !== WebSocket.OPEN) {
      console.warn('Cannot send message: WebSocket not connected');
      return false;
    }
    
    try {
      ws.send(JSON.stringify(message));
      console.log('Sent sync message:', {
        type: message.type,
        entity: message.entity,
        operation: message.operation
      });
      return true;
    } catch (error) {
      console.error('Failed to send WebSocket message:', error);
      return false;
    }
  }, [ws]);

  // Connecter automatiquement quand l'utilisateur est authentifié
  useEffect(() => {
    if (session?.user?.id && !isConnected && syncStatus === 'offline') {
      connect();
    }
    
    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (heartbeatIntervalRef.current) {
        clearInterval(heartbeatIntervalRef.current);
      }
    };
  }, [session?.user?.id, isConnected, syncStatus, connect]);

  // Nettoyage à la fermeture
  useEffect(() => {
    return () => {
      disconnect();
    };
  }, [disconnect]);

  return {
    // État de connexion
    isConnected,
    syncStatus,
    connectionError,
    
    // Dernière activité
    lastMessage,
    
    // Contrôles
    connect,
    disconnect,
    sendMessage,
    
    // Informations device
    deviceId: getDeviceId(),
    deviceType
  };
};

/**
 * Handler pour les messages de synchronisation entrants
 */
function handleIncomingSync(message: SyncMessage) {
  // Cette fonction sera étendue pour traiter les différents types de messages
  // et mettre à jour l'état local de l'application
  
  console.log('Handling incoming sync message:', message);
  
  // Dispatch d'événements custom pour que les composants puissent écouter
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('bas-malin-sync', {
      detail: message
    }));
  }
}

/**
 * Hook pour écouter les messages de synchronisation
 */
export const useSyncMessageListener = (callback: (message: SyncMessage) => void) => {
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const handleSyncMessage = (event: CustomEvent<SyncMessage>) => {
      callback(event.detail);
    };
    
    window.addEventListener('bas-malin-sync', handleSyncMessage as EventListener);
    
    return () => {
      window.removeEventListener('bas-malin-sync', handleSyncMessage as EventListener);
    };
  }, [callback]);
};