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
    } catch {
      // IndexedDB might not be available in SSR
    }
  };

  useEffect(() => {
    if (typeof window === 'undefined') return;

    setIsOnline(navigator.onLine);
    refreshPendingCount();

    const handleOnline = async () => {
      setIsOnline(true);
      await SyncManager.processQueue();
      await refreshPendingCount();
    };

    const handleOffline = () => {
      setIsOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    const interval = setInterval(refreshPendingCount, 10000);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(interval);
    };
  }, []);

  return { isOnline, pendingCount, refreshPendingCount };
}
