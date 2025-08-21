import { TypeProfil } from '@prisma/client';

export interface SyncMessage {
  id: string;
  type: 'DATA_CHANGE' | 'CONFLICT_RESOLUTION' | 'SYNC_REQUEST' | 'HEARTBEAT';
  entity: string;
  operation: 'CREATE' | 'UPDATE' | 'DELETE';
  data: Record<string, unknown>;
  userId: string;
  deviceId: string;
  timestamp: string;
  version: number;
}

export interface DataChange {
  id: string;
  entity: string;
  operation: 'CREATE' | 'UPDATE' | 'DELETE';
  data: Record<string, unknown>;
  userId: string;
  deviceId: string;
  timestamp: Date;
  version: number;
  userProfile?: TypeProfil;
}

export interface DataConflict {
  entity: string;
  recordId: string;
  current: Record<string, unknown> | null;
  changes: DataChange[];
  conflictType: 'CONCURRENT_UPDATE' | 'DELETE_UPDATE' | 'CREATE_DUPLICATE';
}

export type ConflictStrategy = 'LAST_WRITE_WINS' | 'MERGE_FIELDS' | 'USER_PRIORITY' | 'DEVICE_SPECIFIC';

export interface DeviceConnection {
  id: string;
  userId: string;
  type: 'mobile' | 'desktop' | 'tv';
  name: string;
  lastSeen: number;
  isOnline: boolean;
  pendingSync: number;
  socketId?: string;
}

export interface SyncStats {
  dailySync: number;
  avgLatency: number;
  conflictsResolved: number;
  uptime: number;
  activeDevices: number;
  todaySync: number;
  recentActivity: SyncActivity[];
}

export interface SyncActivity {
  id: string;
  device: 'mobile' | 'desktop' | 'tv';
  operation: string;
  entity: string;
  user: string;
  timestamp: number;
  status: 'synced' | 'pending' | 'failed';
  latency: number;
}

export type SyncStatus = 'connected' | 'offline' | 'syncing';

export interface OfflineChange extends DataChange {
  storedAt: string;
  synced: boolean;
  failed: boolean;
  syncedAt?: string;
  error?: string;
}