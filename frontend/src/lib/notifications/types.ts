/**
 * CAREGRID In-App Notification Center Types
 */

import type { UserRole } from '@/lib/auth/roles';

export type NotificationUrgency = 'urgent' | 'warning' | 'info';

export type NotificationCategory = 
  | 'urgent_case'
  | 'referral_update'
  | 'followup_overdue'
  | 'sync_alert'
  | 'system_event';

export interface CareGridNotification {
  id: string;
  title: string;
  body: string;
  urgency: NotificationUrgency;
  category: NotificationCategory;
  timestamp: string;
  read: boolean;
  targetRoles: UserRole[];
  actionUrl?: string;
  metadata?: Record<string, any>;
}
