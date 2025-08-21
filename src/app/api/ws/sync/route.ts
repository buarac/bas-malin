import { NextRequest, NextResponse } from 'next/server';
import { WebSocketServer, WebSocket } from 'ws';
import { getToken } from 'next-auth/jwt';
import { createServer } from 'http';
import { SyncMessage, DeviceConnection } from '@/types/sync';
import { syncService } from '@/lib/sync/multi-device-sync-service';
import { Redis } from 'ioredis';

// Configuration Redis pour pub/sub
const redis = new Redis({
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  password: process.env.REDIS_PASSWORD,
});

// Map des connexions WebSocket par device
const deviceConnections = new Map<string, {
  ws: WebSocket;
  device: DeviceConnection;
  userId: string;
}>();

// Singleton WebSocket Server
let wss: WebSocketServer | null = null;

function getWebSocketServer(): WebSocketServer {
  if (!wss) {
    // Créer le serveur WebSocket sur port séparé
    const server = createServer();
    wss = new WebSocketServer({ 
      server,
      path: '/api/ws/sync',
      clientTracking: true 
    });

    // Démarrer le serveur sur port 3001
    server.listen(3001, () => {
      console.log('WebSocket server started on port 3001');
    });

    setupWebSocketHandlers(wss);
  }
  return wss;
}

function setupWebSocketHandlers(wss: WebSocketServer) {
  wss.on('connection', async (ws, request) => {
    console.log('New WebSocket connection attempt');
    
    try {
      // Extraire les paramètres de la requête
      const url = new URL(request.url!, `http://${request.headers.host}`);
      const deviceId = url.searchParams.get('deviceId');
      const userId = url.searchParams.get('userId');
      const deviceType = url.searchParams.get('deviceType') as 'mobile' | 'desktop' | 'tv';
      const token = url.searchParams.get('token');

      if (!deviceId || !userId || !deviceType || !token) {
        ws.close(1008, 'Missing required parameters');
        return;
      }

      // Vérification du token d'authentification
      const decodedToken = await getToken({ 
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        req: { headers: { authorization: `Bearer ${token}` } } as any 
      });

      if (!decodedToken || decodedToken.sub !== userId) {
        ws.close(1008, 'Invalid or expired token');
        return;
      }

      // Enregistrer la connexion device
      const deviceConnection: DeviceConnection = {
        id: deviceId,
        userId,
        type: deviceType,
        name: `${deviceType.charAt(0).toUpperCase() + deviceType.slice(1)} - ${decodedToken.name || 'Utilisateur'}`,
        lastSeen: Date.now(),
        isOnline: true,
        pendingSync: 0,
        socketId: generateSocketId()
      };

      await syncService.registerDevice(deviceConnection);
      deviceConnections.set(deviceId, { ws, device: deviceConnection, userId });

      console.log(`Device ${deviceId} connected for user ${userId} (${deviceType})`);

      // S'abonner aux messages de sync pour cet utilisateur
      const subscriber = redis.duplicate();
      subscriber.subscribe(`user:${userId}:sync`);
      
      subscriber.on('message', (channel, message) => {
        if (ws.readyState === WebSocket.OPEN) {
          const syncMessage: SyncMessage = JSON.parse(message);
          // Ne pas renvoyer le message à l'expéditeur
          if (syncMessage.deviceId !== deviceId) {
            ws.send(message);
          }
        }
      });

      // Handler des messages entrants
      ws.on('message', async (data) => {
        try {
          const message: SyncMessage = JSON.parse(data.toString());
          
          console.log(`Received sync message from ${deviceId}:`, {
            type: message.type,
            entity: message.entity,
            operation: message.operation
          });

          // Valider le message
          if (!validateSyncMessage(message)) {
            ws.send(JSON.stringify({
              type: 'error',
              message: 'Invalid sync message format'
            }));
            return;
          }

          // Traiter selon le type de message
          switch (message.type) {
            case 'DATA_CHANGE':
              await handleDataChangeMessage(message);
              break;
              
            case 'SYNC_REQUEST':
              await handleSyncRequestMessage(message, deviceId, ws);
              break;
              
            case 'HEARTBEAT':
              await handleHeartbeatMessage(deviceId);
              ws.send(JSON.stringify({ type: 'heartbeat_ack', timestamp: Date.now() }));
              break;
              
            default:
              console.warn(`Unknown message type: ${message.type}`);
          }

        } catch (error) {
          console.error('Error processing WebSocket message:', error);
          ws.send(JSON.stringify({
            type: 'error',
            message: 'Failed to process message'
          }));
        }
      });

      // Handler de fermeture de connexion
      ws.on('close', async () => {
        console.log(`Device ${deviceId} disconnected`);
        await syncService.unregisterDevice(deviceId);
        deviceConnections.delete(deviceId);
        subscriber.disconnect();
      });

      // Handler d'erreurs WebSocket
      ws.on('error', (error) => {
        console.error(`WebSocket error for device ${deviceId}:`, error);
      });

      // Confirmer la connexion
      ws.send(JSON.stringify({
        type: 'connection_established',
        deviceId,
        timestamp: Date.now()
      }));

      // Déclencher la synchronisation des changements offline si nécessaire
      setTimeout(async () => {
        try {
          await syncService.syncOfflineChanges();
        } catch (error) {
          console.error('Failed to sync offline changes on connection:', error);
        }
      }, 1000);

    } catch (error) {
      console.error('WebSocket connection error:', error);
      ws.close(1011, 'Internal server error');
    }
  });

  // Cleanup périodique des connexions fermées
  setInterval(() => {
    for (const [deviceId, connection] of deviceConnections.entries()) {
      if (connection.ws.readyState === WebSocket.CLOSED) {
        console.log(`Cleaning up closed connection for device ${deviceId}`);
        deviceConnections.delete(deviceId);
        syncService.unregisterDevice(deviceId);
      }
    }
  }, 30000); // Toutes les 30 secondes
}

async function handleDataChangeMessage(message: SyncMessage): Promise<void> {
  const dataChange = {
    id: message.id,
    entity: message.entity,
    operation: message.operation,
    data: message.data,
    userId: message.userId,
    deviceId: message.deviceId,
    timestamp: new Date(message.timestamp),
    version: message.version
  };

  // Diffuser le changement vers les autres devices
  await syncService.broadcastChange(dataChange);
}

async function handleSyncRequestMessage(
  message: SyncMessage, 
  deviceId: string, 
  ws: WebSocket
): Promise<void> {
  // Récupérer les changements en attente pour ce device
  const deviceConnection = deviceConnections.get(deviceId);
  if (deviceConnection) {
    // Envoyer les stats de synchronisation
    const stats = await syncService.getSyncStats(deviceConnection.userId);
    
    ws.send(JSON.stringify({
      type: 'sync_response',
      stats,
      timestamp: Date.now()
    }));
  }
}

async function handleHeartbeatMessage(deviceId: string): Promise<void> {
  const deviceConnection = deviceConnections.get(deviceId);
  if (deviceConnection) {
    deviceConnection.device.lastSeen = Date.now();
    await syncService.registerDevice(deviceConnection.device);
  }
}

function validateSyncMessage(message: SyncMessage): boolean {
  return !!(
    message.id &&
    message.type &&
    message.userId &&
    message.deviceId &&
    message.timestamp
  );
}

function generateSocketId(): string {
  return `sock_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// API Routes pour Next.js
export async function GET() {
  // Cette route initialise le serveur WebSocket
  getWebSocketServer();
  
  return NextResponse.json({ 
    status: 'WebSocket server running',
    port: 3001,
    connections: deviceConnections.size
  });
}

export async function POST(request: NextRequest) {
  try {
    const { action, deviceId, userId } = await request.json();
    
    switch (action) {
      case 'get_connections':
        const connections = Array.from(deviceConnections.values())
          .filter(conn => conn.userId === userId)
          .map(conn => conn.device);
        
        return NextResponse.json({ connections });
        
      case 'disconnect_device':
        const connection = deviceConnections.get(deviceId);
        if (connection && connection.userId === userId) {
          connection.ws.close(1000, 'Disconnected by user');
          return NextResponse.json({ success: true });
        }
        return NextResponse.json({ error: 'Device not found' }, { status: 404 });
        
      case 'broadcast_message':
        const { message } = await request.json();
        await redis.publish(`user:${userId}:sync`, JSON.stringify(message));
        return NextResponse.json({ success: true });
        
      default:
        return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
    }
    
  } catch (error) {
    console.error('WebSocket API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}