import { openDB, IDBPDatabase } from 'idb';
import { DataChange, OfflineChange } from '@/types/sync';
import { v4 as uuidv4 } from 'uuid';

interface OfflineStoreDB {
  offline_changes: {
    key: string;
    value: OfflineChange;
    indexes: {
      'by-entity': string;
      'by-sync-status': boolean;
      'by-timestamp': number;
    };
  };
  sync_metadata: {
    key: string;
    value: {
      lastSync: string;
      deviceId: string;
      queueSize: number;
    };
  };
}

export class OfflineStore {
  private db: Promise<IDBPDatabase<OfflineStoreDB>>;
  private readonly DB_NAME = 'BasMalinOfflineStore';
  private readonly DB_VERSION = 1;
  private readonly MAX_QUEUE_SIZE = 1000;

  constructor() {
    this.db = this.initDB();
  }

  /**
   * Initialisation de la base IndexedDB
   */
  private async initDB(): Promise<IDBPDatabase<OfflineStoreDB>> {
    return openDB<OfflineStoreDB>(this.DB_NAME, this.DB_VERSION, {
      upgrade(db) {
        // Store pour les changements offline
        const changesStore = db.createObjectStore('offline_changes', {
          keyPath: 'id'
        });
        changesStore.createIndex('by-entity', 'entity');
        changesStore.createIndex('by-sync-status', 'synced');
        changesStore.createIndex('by-timestamp', 'timestamp');

        // Store pour les métadonnées de sync
        db.createObjectStore('sync_metadata', {
          keyPath: 'key'
        });
      },
    });
  }

  /**
   * Stockage d'un changement offline
   */
  async store(change: DataChange): Promise<void> {
    const db = await this.db;
    
    // Vérifier la taille de la queue avant d'ajouter
    const currentSize = await this.getQueueSize();
    if (currentSize >= this.MAX_QUEUE_SIZE) {
      // Supprimer les plus anciens changements synchronisés
      await this.cleanupSyncedChanges();
    }

    const offlineChange: OfflineChange = {
      ...change,
      storedAt: new Date().toISOString(),
      synced: false,
      failed: false
    };

    try {
      const transaction = db.transaction(['offline_changes'], 'readwrite');
      const store = transaction.objectStore('offline_changes');
      
      await store.add(offlineChange);
      await transaction.done;
      
      console.log(`Offline change stored: ${change.entity}:${change.operation}`);
      
      // Mettre à jour les métadonnées
      await this.updateMetadata();
      
    } catch (error) {
      console.error('Failed to store offline change:', error);
      throw error;
    }
  }

  /**
   * Récupération des changements en attente de synchronisation
   */
  async getPendingSync(): Promise<OfflineChange[]> {
    const db = await this.db;
    
    try {
      const transaction = db.transaction(['offline_changes'], 'readonly');
      const store = transaction.objectStore('offline_changes');
      const index = store.index('by-sync-status');
      
      // Récupérer tous les changements non synchronisés et non échoués
      const changes = await index.getAll(IDBKeyRange.only(false));
      
      // Filtrer ceux qui ne sont pas en échec
      const pending = changes.filter(change => !change.failed);
      
      // Trier par timestamp pour ordre chronologique
      pending.sort((a, b) => 
        new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
      );
      
      console.log(`Retrieved ${pending.length} pending sync changes`);
      return pending;
      
    } catch (error) {
      console.error('Failed to get pending sync changes:', error);
      return [];
    }
  }

  /**
   * Marquer un changement comme synchronisé
   */
  async markSynced(changeId: string): Promise<void> {
    const db = await this.db;
    
    try {
      const transaction = db.transaction(['offline_changes'], 'readwrite');
      const store = transaction.objectStore('offline_changes');
      
      const change = await store.get(changeId);
      if (change) {
        change.synced = true;
        change.syncedAt = new Date().toISOString();
        change.failed = false; // Reset failed status
        delete change.error;
        
        await store.put(change);
      }
      
      await transaction.done;
      console.log(`Change marked as synced: ${changeId}`);
      
      // Mettre à jour les métadonnées
      await this.updateMetadata();
      
    } catch (error) {
      console.error('Failed to mark change as synced:', error);
      throw error;
    }
  }

  /**
   * Marquer un changement comme échoué
   */
  async markFailed(changeId: string, error: Error | unknown): Promise<void> {
    const db = await this.db;
    
    try {
      const transaction = db.transaction(['offline_changes'], 'readwrite');
      const store = transaction.objectStore('offline_changes');
      
      const change = await store.get(changeId);
      if (change) {
        change.failed = true;
        change.error = error instanceof Error ? error.message : 'Unknown error';
        
        await store.put(change);
      }
      
      await transaction.done;
      console.log(`Change marked as failed: ${changeId}`, error);
      
    } catch (error) {
      console.error('Failed to mark change as failed:', error);
    }
  }

  /**
   * Marquer un changement pour synchronisation
   */
  async markForSync(changeId: string): Promise<void> {
    const db = await this.db;
    
    try {
      const transaction = db.transaction(['offline_changes'], 'readwrite');
      const store = transaction.objectStore('offline_changes');
      
      const change = await store.get(changeId);
      if (change) {
        change.synced = false;
        change.failed = false;
        delete change.error;
        delete change.syncedAt;
        
        await store.put(change);
      }
      
      await transaction.done;
      
    } catch (error) {
      console.error('Failed to mark change for sync:', error);
      throw error;
    }
  }

  /**
   * Récupération des statistiques de la queue offline
   */
  async getStats(): Promise<{
    total: number;
    pending: number;
    synced: number;
    failed: number;
  }> {
    const db = await this.db;
    
    try {
      const transaction = db.transaction(['offline_changes'], 'readonly');
      const store = transaction.objectStore('offline_changes');
      
      const allChanges = await store.getAll();
      
      const total = allChanges.length;
      const pending = allChanges.filter(c => !c.synced && !c.failed).length;
      const synced = allChanges.filter(c => c.synced).length;
      const failed = allChanges.filter(c => c.failed).length;
      
      return { total, pending, synced, failed };
      
    } catch (error) {
      console.error('Failed to get offline store stats:', error);
      return { total: 0, pending: 0, synced: 0, failed: 0 };
    }
  }

  /**
   * Nettoyage des changements synchronisés anciens
   */
  async cleanupSyncedChanges(maxAge?: number): Promise<void> {
    const db = await this.db;
    const ageLimit = maxAge || 7 * 24 * 60 * 60 * 1000; // 7 jours par défaut
    const cutoffTime = Date.now() - ageLimit;
    
    try {
      const transaction = db.transaction(['offline_changes'], 'readwrite');
      const store = transaction.objectStore('offline_changes');
      const index = store.index('by-timestamp');
      
      // Récupérer les changements synchronisés anciens
      const range = IDBKeyRange.upperBound(cutoffTime);
      const cursor = await index.openCursor(range);
      
      let deletedCount = 0;
      
      if (cursor) {
        for await (const item of cursor) {
          const change = item.value;
          if (change.synced && new Date(change.syncedAt!).getTime() < cutoffTime) {
            await item.delete();
            deletedCount++;
          }
        }
      }
      
      await transaction.done;
      console.log(`Cleaned up ${deletedCount} old synced changes`);
      
      // Mettre à jour les métadonnées
      await this.updateMetadata();
      
    } catch (error) {
      console.error('Failed to cleanup synced changes:', error);
    }
  }

  /**
   * Vider complètement le store offline
   */
  async clear(): Promise<void> {
    const db = await this.db;
    
    try {
      const transaction = db.transaction(['offline_changes', 'sync_metadata'], 'readwrite');
      const changesStore = transaction.objectStore('offline_changes');
      const metadataStore = transaction.objectStore('sync_metadata');
      
      await changesStore.clear();
      await metadataStore.clear();
      
      await transaction.done;
      console.log('Offline store cleared');
      
    } catch (error) {
      console.error('Failed to clear offline store:', error);
      throw error;
    }
  }

  /**
   * Obtenir la taille actuelle de la queue
   */
  private async getQueueSize(): Promise<number> {
    const db = await this.db;
    
    try {
      const transaction = db.transaction(['offline_changes'], 'readonly');
      const store = transaction.objectStore('offline_changes');
      
      return await store.count();
      
    } catch (error) {
      console.error('Failed to get queue size:', error);
      return 0;
    }
  }

  /**
   * Mettre à jour les métadonnées de synchronisation
   */
  private async updateMetadata(): Promise<void> {
    const db = await this.db;
    const queueSize = await this.getQueueSize();
    
    try {
      const transaction = db.transaction(['sync_metadata'], 'readwrite');
      const store = transaction.objectStore('sync_metadata');
      
      await store.put({
        key: 'sync_info',
        lastSync: new Date().toISOString(),
        deviceId: this.getDeviceId(),
        queueSize
      });
      
      await transaction.done;
      
    } catch (error) {
      console.error('Failed to update metadata:', error);
    }
  }

  /**
   * Génération d'un ID unique pour le device
   */
  private getDeviceId(): string {
    let deviceId = localStorage.getItem('bas-malin-device-id');
    
    if (!deviceId) {
      deviceId = `device-${uuidv4()}`;
      localStorage.setItem('bas-malin-device-id', deviceId);
    }
    
    return deviceId;
  }

  /**
   * Récupération des changements par entité
   */
  async getChangesByEntity(entity: string): Promise<OfflineChange[]> {
    const db = await this.db;
    
    try {
      const transaction = db.transaction(['offline_changes'], 'readonly');
      const store = transaction.objectStore('offline_changes');
      const index = store.index('by-entity');
      
      const changes = await index.getAll(entity);
      
      return changes.sort((a, b) => 
        new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
      );
      
    } catch (error) {
      console.error('Failed to get changes by entity:', error);
      return [];
    }
  }
}