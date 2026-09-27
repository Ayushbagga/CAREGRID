import { offlineDb } from './db';
import type { OfflineSyncItem } from '@/types/healthcare';

const LAST_SYNC_KEY = 'caregrid_last_synced_at';

export type SyncEngineState = 'OFFLINE' | 'IDLE' | 'SYNCING' | 'SYNCED' | 'SYNC_FAILED';

export interface SyncTelemetry {
  status: SyncEngineState;
  pendingCount: number;
  lastSyncTime: string | null;
  isSyncing: boolean;
  failedCount: number;
  failedItems?: OfflineSyncItem[];
}

export class SyncManager {
  private static isSyncing = false;
  private static telemetryListeners: Set<(telemetry: SyncTelemetry) => void> = new Set();

  public static getLastSyncTime(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(LAST_SYNC_KEY);
  }

  public static setLastSyncTime(timestamp: string): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem(LAST_SYNC_KEY, timestamp);
    this.notifyTelemetry();
  }

  /**
   * Subscribe to live sync telemetry changes (state transitions, pending/failed counts)
   */
  public static onTelemetryChange(listener: (telemetry: SyncTelemetry) => void): () => void {
    this.telemetryListeners.add(listener);
    this.getTelemetry().then(t => listener(t));
    return () => {
      this.telemetryListeners.delete(listener);
    };
  }

  private static async notifyTelemetry(): Promise<void> {
    if (this.telemetryListeners.size === 0) return;
    try {
      const telemetry = await this.getTelemetry();
      this.telemetryListeners.forEach(listener => {
        try {
          listener(telemetry);
        } catch (err) {
          console.warn('Telemetry listener error:', err);
        }
      });
    } catch {
      // ignore
    }
  }

  /**
   * Enqueue operation with idempotency and duplicate elimination
   */
  public static async enqueue(
    entity_type: OfflineSyncItem['entity_type'],
    operation: OfflineSyncItem['operation'],
    payload: Record<string, any>
  ): Promise<string> {
    // Check if an identical pending item for this entity & ID already exists to prevent duplicate creation
    if (payload.id) {
      const existing = await offlineDb.syncQueue
        .filter(item => item.entity_type === entity_type && item.payload?.id === payload.id && item.status === 'PENDING')
        .first();

      if (existing) {
        await offlineDb.syncQueue.update(existing.id, {
          payload,
          operation,
          created_at: new Date().toISOString()
        });
        await this.notifyTelemetry();
        return existing.id;
      }
    }

    const id = crypto.randomUUID();
    const item: OfflineSyncItem = {
      id,
      entity_type,
      operation,
      payload,
      created_at: new Date().toISOString(),
      retry_count: 0,
      status: 'PENDING'
    };

    await offlineDb.syncQueue.add(item);
    await this.notifyTelemetry();
    return id;
  }

  public static async getPendingCount(): Promise<number> {
    return await offlineDb.syncQueue.where('status').equals('PENDING').count();
  }

  public static async getFailedItems(): Promise<OfflineSyncItem[]> {
    return await offlineDb.syncQueue.filter(item => (item.retry_count || 0) > 0).toArray();
  }

  /**
   * Derive clear macroscopic state: OFFLINE / SYNCING / SYNC_FAILED / SYNCED / IDLE
   */
  public static async getTelemetry(): Promise<SyncTelemetry> {
    const isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;
    const pendingCount = await this.getPendingCount();
    const failedItems = await this.getFailedItems();
    const failedCount = failedItems.length;
    const lastSyncTime = this.getLastSyncTime();

    let status: SyncEngineState = 'IDLE';
    if (!isOnline) {
      status = 'OFFLINE';
    } else if (this.isSyncing) {
      status = 'SYNCING';
    } else if (failedCount > 0) {
      status = 'SYNC_FAILED';
    } else if (pendingCount === 0 && lastSyncTime) {
      status = 'SYNCED';
    }

    return {
      status,
      pendingCount,
      lastSyncTime,
      isSyncing: this.isSyncing,
      failedCount,
      failedItems
    };
  }

  /**
   * Safe conflict resolution:
   * Keeps server version if newer updated_at exists, else preserves client modification.
   */
  public static resolveConflict<T extends { updated_at?: string }>(
    clientRecord: T,
    serverRecord: T
  ): T {
    if (!serverRecord.updated_at) return clientRecord;
    if (!clientRecord.updated_at) return serverRecord;

    const clientTime = new Date(clientRecord.updated_at).getTime();
    const serverTime = new Date(serverRecord.updated_at).getTime();

    // Prefer server timestamp if ahead by at least 1 millisecond
    return serverTime > clientTime ? serverRecord : clientRecord;
  }

  /**
   * Retries failed sync items selectively or globally
   */
  public static async retryFailed(targetId?: string): Promise<{ synced: number; failed: number }> {
    if (targetId) {
      await offlineDb.syncQueue.update(targetId, {
        status: 'PENDING',
        retry_count: 0
      });
    } else {
      const failed = await this.getFailedItems();
      for (const item of failed) {
        await offlineDb.syncQueue.update(item.id, {
          status: 'PENDING',
          retry_count: 0
        });
      }
    }
    await this.notifyTelemetry();
    return await this.processQueue();
  }

  /**
   * Processes the pending sync queue using transactional idempotency
   */
  public static async processQueue(): Promise<{ synced: number; failed: number }> {
    if (this.isSyncing || typeof navigator === 'undefined' || !navigator.onLine) {
      return { synced: 0, failed: 0 };
    }

    this.isSyncing = true;
    await this.notifyTelemetry();

    let synced = 0;
    let failed = 0;

    try {
      const pendingItems = await offlineDb.syncQueue
        .where('status')
        .equals('PENDING')
        .limit(25)
        .toArray();

      for (const item of pendingItems) {
        try {
          await offlineDb.syncQueue.update(item.id, { status: 'SYNCING' });

          const response = await fetch('/api/sync', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(item)
          });

          if (response.ok) {
            await offlineDb.syncQueue.delete(item.id);
            synced++;
          } else {
            await offlineDb.syncQueue.update(item.id, {
              status: 'PENDING',
              retry_count: (item.retry_count || 0) + 1
            });
            failed++;
          }
        } catch {
          await offlineDb.syncQueue.update(item.id, {
            status: 'PENDING',
            retry_count: (item.retry_count || 0) + 1
          });
          failed++;
        }
      }

      if (synced > 0) {
        this.setLastSyncTime(new Date().toISOString());
      }
    } finally {
      this.isSyncing = false;
      await this.notifyTelemetry();
    }

    return { synced, failed };
  }
}
