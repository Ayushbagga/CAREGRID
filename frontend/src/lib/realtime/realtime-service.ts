/**
 * CAREGRID Realtime Operations Service
 * 
 * Manages targeted Supabase Realtime subscriptions with:
 * - Authorization & RLS compliance via authenticated browser client
 * - Event deduplication via bounded LRU/Set
 * - Clean teardown and unsubscribe
 * - Connection state tracking
 * - Graceful fallback polling when offline or websockets unavailable
 */

import { createClient } from '@/lib/supabase/client';
import type { RealtimeChannel } from '@supabase/supabase-js';
import type { 
  RealtimeConnectionState, 
  RealtimeTable, 
  RealtimeEventListener, 
  RealtimeEventPayload,
  CareAlertPayload 
} from './types';

export class CareGridRealtimeService {
  private static instance: CareGridRealtimeService | null = null;
  private channels: Map<string, RealtimeChannel> = new Map();
  private listeners: Map<string, Set<RealtimeEventListener>> = new Map();
  private alertListeners: Set<(alert: CareAlertPayload) => void> = new Set();
  private processedEvents: Set<string> = new Set();
  private maxDeduplicationWindow = 500;
  private connectionState: RealtimeConnectionState = 'DISCONNECTED';
  private stateListeners: Set<(state: RealtimeConnectionState) => void> = new Set();
  private fallbackInterval: NodeJS.Timeout | null = null;

  private constructor() {
    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => this.handleNetworkChange(true));
      window.addEventListener('offline', () => this.handleNetworkChange(false));
    }
  }

  public static getInstance(): CareGridRealtimeService {
    if (!this.instance) {
      this.instance = new CareGridRealtimeService();
    }
    return this.instance;
  }

  public getConnectionState(): RealtimeConnectionState {
    return this.connectionState;
  }

  public onConnectionStateChange(listener: (state: RealtimeConnectionState) => void): () => void {
    this.stateListeners.add(listener);
    listener(this.connectionState);
    return () => {
      this.stateListeners.delete(listener);
    };
  }

  private setConnectionState(newState: RealtimeConnectionState): void {
    if (this.connectionState !== newState) {
      this.connectionState = newState;
      this.stateListeners.forEach(listener => {
        try {
          listener(newState);
        } catch (err) {
          console.warn('Realtime state listener error:', err);
        }
      });
    }
  }

  private handleNetworkChange(isOnline: boolean): void {
    if (!isOnline) {
      this.setConnectionState('DISCONNECTED');
      this.startFallbackPolling();
    } else {
      this.stopFallbackPolling();
      this.reconnectAll();
    }
  }

  /**
   * Subscribe to postgres_changes on a specific table
   */
  public subscribeToTable(
    table: RealtimeTable,
    listener: RealtimeEventListener
  ): () => void {
    if (typeof window === 'undefined') {
      return () => {};
    }

    const channelKey = `realtime:${table}`;

    if (!this.listeners.has(channelKey)) {
      this.listeners.set(channelKey, new Set());
    }
    this.listeners.get(channelKey)!.add(listener);

    // Initialize Supabase channel if not already open
    if (!this.channels.has(channelKey)) {
      this.initTableChannel(table, channelKey);
    }

    // Return cleanup / unsubscribe callback
    return () => {
      const set = this.listeners.get(channelKey);
      if (set) {
        set.delete(listener);
        if (set.size === 0) {
          this.unsubscribeChannel(channelKey);
        }
      }
    };
  }

  /**
   * Subscribe to care alert broadcasts (high-priority alerts)
   */
  public subscribeToCareAlerts(listener: (alert: CareAlertPayload) => void): () => void {
    this.alertListeners.add(listener);
    const channelKey = 'broadcast:caregrid_alerts';

    if (!this.channels.has(channelKey)) {
      try {
        const supabase = createClient();
        const channel = supabase.channel('caregrid-alerts');
        channel
          .on('broadcast', { event: 'care_alert' }, payload => {
            const alert = payload.payload as CareAlertPayload;
            if (alert && alert.id && !this.isDuplicateEvent(`alert:${alert.id}`)) {
              this.alertListeners.forEach(l => l(alert));
            }
          })
          .subscribe(status => {
            if (status === 'SUBSCRIBED') {
              this.setConnectionState('CONNECTED');
            }
          });
        this.channels.set(channelKey, channel);
      } catch (err) {
        console.warn('Could not initialize care alerts channel:', err);
      }
    }

    return () => {
      this.alertListeners.delete(listener);
      if (this.alertListeners.size === 0) {
        this.unsubscribeChannel(channelKey);
      }
    };
  }

  /**
   * Dispatches an alert to local listeners and broadcast channel
   */
  public broadcastCareAlert(alert: CareAlertPayload): void {
    if (this.isDuplicateEvent(`alert:${alert.id}`)) return;
    
    // Notify local subscribers
    this.alertListeners.forEach(listener => {
      try {
        listener(alert);
      } catch (err) {
        console.warn('Alert listener error:', err);
      }
    });

    // Broadcast across Supabase Realtime channel if available
    try {
      const channel = this.channels.get('broadcast:caregrid_alerts');
      if (channel) {
        channel.send({
          type: 'broadcast',
          event: 'care_alert',
          payload: alert
        });
      }
    } catch (err) {
      console.warn('Failed to broadcast alert:', err);
    }
  }

  private initTableChannel(table: RealtimeTable, channelKey: string): void {
    try {
      this.setConnectionState('CONNECTING');
      const supabase = createClient();

      const channel = supabase
        .channel(`public:${table}`)
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table },
          payload => {
            this.handlePostgresChange(table, payload);
          }
        )
        .subscribe(status => {
          if (status === 'SUBSCRIBED') {
            this.setConnectionState('CONNECTED');
            this.stopFallbackPolling();
          } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
            this.setConnectionState('FALLBACK_POLLING');
            this.startFallbackPolling();
          } else if (status === 'CLOSED') {
            this.setConnectionState('DISCONNECTED');
          }
        });

      this.channels.set(channelKey, channel);
    } catch (err) {
      console.warn(`Could not initialize realtime channel for ${table}:`, err);
      this.setConnectionState('FALLBACK_POLLING');
      this.startFallbackPolling();
    }
  }

  private handlePostgresChange(table: RealtimeTable, payload: any): void {
    const eventType = payload.eventType as 'INSERT' | 'UPDATE' | 'DELETE';
    const newRecord = payload.new || null;
    const oldRecord = payload.old || null;
    const recordId = (newRecord && newRecord.id) || (oldRecord && oldRecord.id) || crypto.randomUUID();
    const eventKey = `${table}:${eventType}:${recordId}:${payload.commit_timestamp || Date.now()}`;

    // Deduplicate duplicate event dispatches
    if (this.isDuplicateEvent(eventKey)) {
      return;
    }

    const eventPayload: RealtimeEventPayload = {
      table,
      eventType,
      newRecord,
      oldRecord,
      timestamp: new Date().toISOString(),
      eventId: eventKey
    };

    const channelKey = `realtime:${table}`;
    const listeners = this.listeners.get(channelKey);
    if (listeners) {
      listeners.forEach(listener => {
        try {
          listener(eventPayload);
        } catch (err) {
          console.error(`Error in realtime listener for ${table}:`, err);
        }
      });
    }
  }

  private isDuplicateEvent(eventKey: string): boolean {
    if (this.processedEvents.has(eventKey)) {
      return true;
    }
    this.processedEvents.add(eventKey);
    if (this.processedEvents.size > this.maxDeduplicationWindow) {
      const oldestKey = this.processedEvents.values().next().value;
      if (oldestKey) {
        this.processedEvents.delete(oldestKey);
      }
    }
    return false;
  }

  private unsubscribeChannel(channelKey: string): void {
    const channel = this.channels.get(channelKey);
    if (channel) {
      try {
        const supabase = createClient();
        supabase.removeChannel(channel);
      } catch (err) {
        console.warn(`Error removing channel ${channelKey}:`, err);
      }
      this.channels.delete(channelKey);
    }
    this.listeners.delete(channelKey);
  }

  private startFallbackPolling(): void {
    if (this.fallbackInterval) return;
    // Periodic poll every 15s when websocket is offline
    this.fallbackInterval = setInterval(() => {
      this.triggerLocalRefreshEvents();
    }, 15000);
  }

  private stopFallbackPolling(): void {
    if (this.fallbackInterval) {
      clearInterval(this.fallbackInterval);
      this.fallbackInterval = null;
    }
  }

  private triggerLocalRefreshEvents(): void {
    // Notify table listeners of a synthetic refresh update
    this.listeners.forEach((set, channelKey) => {
      const table = channelKey.replace('realtime:', '') as RealtimeTable;
      const syntheticEvent: RealtimeEventPayload = {
        table,
        eventType: 'UPDATE',
        newRecord: null,
        oldRecord: null,
        timestamp: new Date().toISOString(),
        eventId: `synthetic:${table}:${Date.now()}`
      };
      set.forEach(l => l(syntheticEvent));
    });
  }

  private reconnectAll(): void {
    this.channels.forEach((_, key) => {
      this.unsubscribeChannel(key);
    });
    this.listeners.forEach((_, key) => {
      const table = key.replace('realtime:', '') as RealtimeTable;
      this.initTableChannel(table, key);
    });
  }

  /**
   * Complete teardown for test isolation and page disposal
   */
  public cleanupAll(): void {
    this.stopFallbackPolling();
    this.channels.forEach(channel => {
      try {
        const supabase = createClient();
        supabase.removeChannel(channel);
      } catch {
        // ignore
      }
    });
    this.channels.clear();
    this.listeners.clear();
    this.alertListeners.clear();
    this.stateListeners.clear();
    this.processedEvents.clear();
    this.setConnectionState('DISCONNECTED');
  }
}

export const realtimeService = CareGridRealtimeService.getInstance();
