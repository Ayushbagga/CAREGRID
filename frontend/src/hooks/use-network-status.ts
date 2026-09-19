'use client';

import { useState, useEffect } from 'react';
import { SyncManager } from '@/lib/offline-sync/sync-manager';

export function useNetworkStatus() {
  const [isOnline, setIsOnline] = useState<boolean>(true);
  const [pendingCount, setPendingCount] = useState<number>(0);

  const refreshPendingCount = async () => {
    try {
      const count = await SyncManager.getPendingCount();
      setPendingCount(count);
      return count;
    } catch {
      // IndexedDB might not be available in SSR
      return 0;
    }
  };

  const syncAndRefresh = async () => {
    try {
      if (typeof navigator !== 'undefined' && navigator.onLine) {
        const count = await SyncManager.getPendingCount();
        if (count > 0) {
          await SyncManager.processQueue();
        }
      }
    } catch {
      // ignore
    } finally {
      await refreshPendingCount();
    }
  };

  useEffect(() => {
    if (typeof window === 'undefined') return;

    setIsOnline(navigator.onLine);
    syncAndRefresh();

    const handleOnline = async () => {
      setIsOnline(true);
      await syncAndRefresh();
    };

    const handleOffline = () => {
      setIsOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    const interval = setInterval(syncAndRefresh, 8000);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(interval);
    };
  }, []);

  return { isOnline, pendingCount, refreshPendingCount };
}
