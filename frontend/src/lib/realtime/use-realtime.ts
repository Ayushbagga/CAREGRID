'use client';

import { useState, useEffect } from 'react';
import { realtimeService } from './realtime-service';
import type { 
  RealtimeTable, 
  RealtimeEventListener, 
  RealtimeConnectionState, 
  CareAlertPayload 
} from './types';

/**
 * Hook to subscribe to real-time changes on a specific Supabase table
 * Automatically registers listener and cleans up on component unmount
 */
export function useRealtimeTable(
  table: RealtimeTable,
  onEvent: RealtimeEventListener
) {
  const [connectionState, setConnectionState] = useState<RealtimeConnectionState>(
    realtimeService.getConnectionState()
  );

  useEffect(() => {
    // Track connection state
    const unsubscribeState = realtimeService.onConnectionStateChange(setConnectionState);

    // Subscribe to table changes
    const unsubscribeTable = realtimeService.subscribeToTable(table, onEvent);

    return () => {
      unsubscribeState();
      unsubscribeTable();
    };
  }, [table, onEvent]);

  return { connectionState };
}

/**
 * Hook to subscribe to critical broadcast care alerts
 */
export function useCareAlerts(onAlert: (alert: CareAlertPayload) => void) {
  useEffect(() => {
    const unsubscribe = realtimeService.subscribeToCareAlerts(onAlert);
    return () => {
      unsubscribe();
    };
  }, [onAlert]);
}

/**
 * Hook to observe the global Realtime connection status
 */
export function useRealtimeStatus() {
  const [state, setState] = useState<RealtimeConnectionState>(
    realtimeService.getConnectionState()
  );

  useEffect(() => {
    return realtimeService.onConnectionStateChange(setState);
  }, []);

  return state;
}
