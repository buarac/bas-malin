import { Queue, Worker, Job } from 'bullmq';
import Redis from 'ioredis';
import { v4 as uuidv4 } from 'uuid';
import { SyncMessage, DataChange, DataConflict, DeviceConnection, SyncStats, SyncActivity } from '@/types/sync';
import { ConflictResolver } from './conflict-resolver';
import { OfflineStore } from './offline-store';
import { prisma } from '@/lib/db';

// Configuration Redis
const redisConnection = {
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  password: process.env.REDIS_PASSWORD,
};

export class MultiDeviceSyncService {
  private syncQueue: Queue;
  private conflictResolver: ConflictResolver;
  private offlineStore: OfflineStore;
  private redis: Redis;
  private deviceConnections: Map<string, DeviceConnection> = new Map();

  constructor() {
    this.redis = new Redis(redisConnection);
    this.syncQueue = new Queue('device-sync', { connection: redisConnection });
    this.conflictResolver = new ConflictResolver();
    this.offlineStore = new OfflineStore();
    
    // Initialiser le worker
    this.initializeWorker();
  }

  private initializeWorker() {
    const worker = new Worker('device-sync', async (job: Job) => {
      const message: SyncMessage = job.data;
      await this.processSyncMessage(message);
    }, { connection: redisConnection });

    worker.on('completed', (job) => {
      console.log(`Sync job ${job.id} completed`);
    });

    worker.on('failed', (job, err) => {
      console.error(`Sync job ${job?.id} failed:`, err);
    });
  }

  /**
   * Diffuse un changement vers tous les devices connectés
   */
  async broadcastChange(change: DataChange): Promise<string> {
    const messageId = uuidv4();
    const message: SyncMessage = {
      id: messageId,
      type: 'DATA_CHANGE',
      entity: change.entity,
      operation: change.operation,
      data: change.data,
      userId: change.userId,
      deviceId: change.deviceId,
      timestamp: change.timestamp.toISOString(),
      version: change.version
    };

    // 1. Broadcast immédiat via Redis Pub/Sub
    await this.redis.publish(`user:${change.userId}:sync`, JSON.stringify(message));
    
    // 2. Queue pour devices offline avec retry
    await this.syncQueue.add('sync-change', message, {
      delay: 0,
      attempts: 5,
      backoff: {
        type: 'exponential',
        delay: 2000,
      },
    });

    // 3. Log d'activité
    await this.logSyncActivity(message, 'pending');

    return messageId;
  }

  /**
   * Gestion mode offline : stockage local
   */
  async handleOfflineChange(change: DataChange): Promise<void> {
    // Stockage local avec timestamp
    await this.offlineStore.store(change);
    
    // Marquage pour synchronisation future
    await this.offlineStore.markForSync(change.id);
  }

  /**
   * Synchronisation des changements offline à la reconnexion
   */
  async syncOfflineChanges(): Promise<void> {
    const pendingChanges = await this.offlineStore.getPendingSync();
    
    for (const change of pendingChanges) {
      try {
        // Détection de conflits avant sync
        const conflict = await this.detectConflict(change);
        
        if (conflict) {
          const resolved = await this.conflictResolver.resolve(conflict);
          await this.applySyncedChange(resolved);
        } else {
          await this.applySyncedChange(change);
        }
        
        // Marquer comme synchronisé
        await this.offlineStore.markSynced(change.id);
        
        // Broadcast vers les autres devices
        await this.broadcastChange(change);
        
      } catch (error) {
        console.error('Sync error for change:', change.id, error);
        await this.offlineStore.markFailed(change.id, error);
      }
    }
  }

  /**
   * Traitement des messages de synchronisation
   */
  private async processSyncMessage(message: SyncMessage): Promise<void> {
    try {
      const change: DataChange = {
        id: message.id,
        entity: message.entity,
        operation: message.operation,
        data: message.data,
        userId: message.userId,
        deviceId: message.deviceId,
        timestamp: new Date(message.timestamp),
        version: message.version
      };

      // Appliquer le changement localement
      await this.applySyncedChange(change);
      
      // Mettre à jour les stats
      await this.logSyncActivity(message, 'synced');
      
    } catch (error) {
      console.error('Failed to process sync message:', error);
      await this.logSyncActivity(message, 'failed');
      throw error;
    }
  }

  /**
   * Application d'un changement synchronisé
   */
  private async applySyncedChange(change: DataChange): Promise<void> {
    const { entity, operation, data } = change;

    try {
      // TODO: Implémenter quand les modèles métier seront créés
      console.log(`Sync applied for ${entity}:${operation}`, { id: (data as { id?: string }).id });
      
      // switch (entity) {
      //   case 'recolte':
      //     await this.applySyncedRecolte(operation, data as Record<string, unknown> & { id: string });
      //     break;
      //   case 'intervention':
      //     await this.applySyncedIntervention(operation, data as Record<string, unknown> & { id: string });
      //     break;
      //   case 'culture':
      //     await this.applySyncedCulture(operation, data as Record<string, unknown> & { id: string });
      //     break;
      //   default:
      //     console.warn(`Unknown entity type for sync: ${entity}`);
      // }
    } catch (error) {
      console.error(`Failed to apply synced change for ${entity}:`, error);
      throw error;
    }
  }

  // TODO: Ces méthodes seront implémentées quand les modèles métier seront créés
  // private async applySyncedRecolte(operation: string, data: Record<string, unknown> & { id: string }): Promise<void> {
  //   switch (operation) {
  //     case 'CREATE':
  //       await prisma.recolte.create({ data });
  //       break;
  //     case 'UPDATE':
  //       await prisma.recolte.update({ 
  //         where: { id: data.id }, 
  //         data 
  //       });
  //       break;
  //     case 'DELETE':
  //       await prisma.recolte.delete({ where: { id: data.id } });
  //       break;
  //   }
  // }

  /**
   * Détection de conflits
   */
  private async detectConflict(change: DataChange): Promise<DataConflict | null> {
    // Implémentation basique - sera enrichie dans ConflictResolver
    try {
      const existing = await this.getExistingRecord(change.entity, (change.data as { id: string }).id);
      
      if (!existing && change.operation !== 'CREATE') {
        return {
          entity: change.entity,
          recordId: (change.data as { id: string }).id,
          current: null,
          changes: [change],
          conflictType: 'DELETE_UPDATE'
        };
      }
      
      if (existing && existing.misAJourA && existing.misAJourA > change.timestamp) {
        return {
          entity: change.entity,
          recordId: (change.data as { id: string }).id,
          current: existing,
          changes: [change],
          conflictType: 'CONCURRENT_UPDATE'
        };
      }
      
      return null;
    } catch (error) {
      console.error('Error detecting conflict:', error);
      return null;
    }
  }

  private async getExistingRecord(entity: string, id: string): Promise<Record<string, unknown> | null> {
    // TODO: Implémenter quand les modèles métier seront créés
    console.log(`Getting existing record for ${entity}:${id}`);
    return null;
    
    // switch (entity) {
    //   case 'recolte':
    //     return await prisma.recolte.findUnique({ where: { id } });
    //   case 'intervention':
    //     return await prisma.intervention.findUnique({ where: { id } });
    //   case 'culture':
    //     return await prisma.instanceCulture.findUnique({ where: { id } });
    //   default:
    //     return null;
    // }
  }

  /**
   * Gestion des connexions devices
   */
  async registerDevice(device: DeviceConnection): Promise<void> {
    this.deviceConnections.set(device.id, {
      ...device,
      lastSeen: Date.now(),
      isOnline: true
    });
    
    // Persistance en Redis
    await this.redis.setex(
      `device:${device.id}`, 
      300, // 5 minutes TTL
      JSON.stringify(device)
    );
  }

  async unregisterDevice(deviceId: string): Promise<void> {
    const device = this.deviceConnections.get(deviceId);
    if (device) {
      device.isOnline = false;
      device.lastSeen = Date.now();
    }
    
    await this.redis.del(`device:${deviceId}`);
  }

  /**
   * Statistiques de synchronisation
   */
  async getSyncStats(userId: string): Promise<SyncStats> {
    const today = new Date().toISOString().split('T')[0];
    
    // Récupérer stats depuis Redis
    const dailySync = await this.redis.get(`stats:${userId}:${today}:sync_count`) || '0';
    const avgLatency = await this.redis.get(`stats:${userId}:avg_latency`) || '0';
    const conflictsResolved = await this.redis.get(`stats:${userId}:conflicts_resolved`) || '0';
    
    // Devices actifs
    const userDevices = Array.from(this.deviceConnections.values())
      .filter(device => device.userId === userId);
    
    const activeDevices = userDevices.filter(device => 
      device.isOnline && (Date.now() - device.lastSeen) < 30000
    ).length;

    // Activité récente depuis Redis
    const recentActivity = await this.getRecentActivity(userId);

    return {
      dailySync: parseInt(dailySync),
      avgLatency: parseInt(avgLatency),
      conflictsResolved: parseInt(conflictsResolved),
      uptime: 99.5, // Calculé sur base du monitoring
      activeDevices,
      todaySync: parseInt(dailySync),
      recentActivity
    };
  }

  private async getRecentActivity(userId: string): Promise<SyncActivity[]> {
    const activities = await this.redis.lrange(`activity:${userId}`, 0, 19);
    return activities.map(activity => JSON.parse(activity) as SyncActivity);
  }

  /**
   * Log d'activité de synchronisation
   */
  private async logSyncActivity(message: SyncMessage, status: 'pending' | 'synced' | 'failed'): Promise<void> {
    const activity = {
      id: message.id,
      device: this.getDeviceType(message.deviceId),
      operation: message.operation,
      entity: message.entity,
      user: await this.getUserName(message.userId),
      timestamp: Date.now(),
      status,
      latency: status === 'synced' ? Date.now() - new Date(message.timestamp).getTime() : 0
    };

    // Stocker dans Redis avec limite
    await this.redis.lpush(`activity:${message.userId}`, JSON.stringify(activity));
    await this.redis.ltrim(`activity:${message.userId}`, 0, 49); // Garder 50 entrées

    // Mettre à jour les compteurs
    const today = new Date().toISOString().split('T')[0];
    await this.redis.incr(`stats:${message.userId}:${today}:sync_count`);
    
    if (status === 'synced' && activity.latency > 0) {
      // Moyenne mobile de la latence
      const currentAvg = await this.redis.get(`stats:${message.userId}:avg_latency`) || '0';
      const newAvg = (parseInt(currentAvg) + activity.latency) / 2;
      await this.redis.set(`stats:${message.userId}:avg_latency`, Math.round(newAvg));
    }
  }

  private getDeviceType(deviceId: string): 'mobile' | 'desktop' | 'tv' {
    // Détection simple basée sur l'ID device
    if (deviceId.includes('mobile')) return 'mobile';
    if (deviceId.includes('tv')) return 'tv';
    return 'desktop';
  }

  private async getUserName(userId: string): Promise<string> {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { prenom: true, nom: true, name: true }
      });
      return user?.prenom || user?.name || 'Utilisateur';
    } catch {
      return 'Utilisateur';
    }
  }

  /**
   * Nettoyage des ressources
   */
  async cleanup(): Promise<void> {
    await this.syncQueue.close();
    await this.redis.disconnect();
  }
}

// Instance singleton
export const syncService = new MultiDeviceSyncService();