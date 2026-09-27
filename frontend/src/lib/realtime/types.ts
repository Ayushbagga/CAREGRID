/**
 * CAREGRID Supabase Realtime Types & Interfaces
 */

export type RealtimeConnectionState = 
  | 'CONNECTED'
  | 'CONNECTING'
  | 'DISCONNECTED'
  | 'FALLBACK_POLLING';

export type RealtimeTable = 
  | 'appointments' 
  | 'referrals' 
  | 'follow_ups' 
  | 'follow_up_tasks' 
  | 'patients'
  | 'triage_assessments';

export type RealtimeEventType = 'INSERT' | 'UPDATE' | 'DELETE' | '*';

export interface RealtimeEventPayload<T = Record<string, any>> {
  table: RealtimeTable;
  eventType: 'INSERT' | 'UPDATE' | 'DELETE';
  newRecord: T | null;
  oldRecord: T | null;
  timestamp: string;
  eventId: string;
}

export type RealtimeEventListener<T = any> = (payload: RealtimeEventPayload<T>) => void;

export interface RealtimeSubscriptionOptions {
  table: RealtimeTable;
  event?: RealtimeEventType;
  filter?: string;
  onEvent: RealtimeEventListener;
}

export interface CareAlertPayload {
  id: string;
  urgency: 'emergency_red' | 'urgent_amber' | 'routine_green';
  title: string;
  message: string;
  patient_id?: string;
  facility_id?: string;
  timestamp: string;
}
