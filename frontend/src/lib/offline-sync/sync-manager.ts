import { offlineDb } from './db';
import type { OfflineSyncItem } from '@/types/healthcare';

export class SyncManager {
  private static isSyncing = false;

  public static async enqueue(
    entity_type: OfflineSyncItem['entity_type'],
    operation: OfflineSyncItem['operation'],
    payload: Record<string, any>
  ): Promise<string> {
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
    return id;
  }

  public static async getPendingCount(): Promise<number> {
    return await offlineDb.syncQueue.where('status').equals('PENDING').count();
  }

  public static async processQueue(): Promise<{ synced: number; failed: number }> {
    if (this.isSyncing || typeof navigator === 'undefined' || !navigator.onLine) {
      return { synced: 0, failed: 0 };
    }

    this.isSyncing = true;
    let synced = 0;
    let failed = 0;

    try {
      const pendingItems = await offlineDb.syncQueue
        .where('status')
        .equals('PENDING')
        .limit(20)
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
              retry_count: item.retry_count + 1
            });
            failed++;
          }
        } catch (err) {
          await offlineDb.syncQueue.update(item.id, {
            status: 'PENDING',
            retry_count: item.retry_count + 1
          });
          failed++;
        }
      }
    } finally {
      this.isSyncing = false;
    }

    return { synced, failed };
  }
}
