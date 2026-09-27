/**
 * CAREGRID In-App Notification Service
 * 
 * Provides centralized, role-authorized, non-intrusive in-app notifications with:
 * - Role-scoped filtering (asha, doctor, admin)
 * - Safe clinical summaries without unauthorized PII exposure
 * - Zero spam/noise deduplication
 * - Integration with Realtime alerts and Offline Sync telemetry
 */

import type { UserRole } from '@/lib/auth/roles';
import type { CareGridNotification, NotificationUrgency, NotificationCategory } from './types';
import { SyncManager } from '@/lib/offline-sync/sync-manager';

const NOTIFICATIONS_STORAGE_KEY = 'caregrid_in_app_notifications';

export class NotificationService {
  private static instance: NotificationService | null = null;
  private notifications: CareGridNotification[] = [];
  private listeners: Set<(notifications: CareGridNotification[]) => void> = new Set();

  private constructor() {
    this.loadFromStorage();
    this.initDefaultNotifications();
    this.listenToSyncEvents();
  }

  public static getInstance(): NotificationService {
    if (!this.instance) {
      this.instance = new NotificationService();
    }
    return this.instance;
  }

  private loadFromStorage(): void {
    if (typeof window === 'undefined') return;
    try {
      const stored = localStorage.getItem(NOTIFICATIONS_STORAGE_KEY);
      if (stored) {
        this.notifications = JSON.parse(stored);
      }
    } catch {
      this.notifications = [];
    }
  }

  private saveToStorage(): void {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(NOTIFICATIONS_STORAGE_KEY, JSON.stringify(this.notifications.slice(0, 50)));
    } catch {
      // ignore
    }
  }

  private initDefaultNotifications(): void {
    if (this.notifications.length === 0) {
      this.notifications = [
        {
          id: 'notif-init-01',
          title: 'CAREGRID Operational',
          body: 'Clinical coordination system active with offline-first synchronization.',
          urgency: 'info',
          category: 'system_event',
          timestamp: new Date().toISOString(),
          read: true,
          targetRoles: ['asha', 'doctor', 'admin']
        },
        {
          id: 'notif-init-02',
          title: 'High-Risk Maternal Queue',
          body: 'Antenatal care protocol alert active for priority review.',
          urgency: 'warning',
          category: 'urgent_case',
          timestamp: new Date(Date.now() - 3600000).toISOString(),
          read: false,
          targetRoles: ['doctor', 'asha'],
          actionUrl: '/doctor'
        }
      ];
      this.saveToStorage();
    }
  }

  private listenToSyncEvents(): void {
    if (typeof window === 'undefined') return;
    SyncManager.onTelemetryChange(telemetry => {
      if (telemetry.failedCount > 0) {
        this.addNotification({
          title: 'Sync Queue Delay',
          body: `${telemetry.failedCount} offline sync item(s) pending retry. Tap to review.`,
          urgency: 'warning',
          category: 'sync_alert',
          targetRoles: ['asha', 'admin'],
          actionUrl: '/asha'
        });
      }
    });
  }

  /**
   * Returns notifications authorized for the specified role
   */
  public getNotificationsForRole(role: UserRole): CareGridNotification[] {
    return this.notifications
      .filter(n => n.targetRoles.includes(role))
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }

  public getUnreadCount(role: UserRole): number {
    return this.getNotificationsForRole(role).filter(n => !n.read).length;
  }

  public addNotification(params: {
    title: string;
    body: string;
    urgency: NotificationUrgency;
    category: NotificationCategory;
    targetRoles: UserRole[];
    actionUrl?: string;
    metadata?: Record<string, any>;
  }): CareGridNotification {
    // Avoid noisy identical duplicate notifications within 5 minutes
    const recentDuplicate = this.notifications.find(
      n => n.title === params.title && 
           n.category === params.category && 
           Date.now() - new Date(n.timestamp).getTime() < 300000
    );

    if (recentDuplicate) {
      return recentDuplicate;
    }

    const notification: CareGridNotification = {
      id: crypto.randomUUID(),
      title: params.title,
      body: params.body,
      urgency: params.urgency,
      category: params.category,
      timestamp: new Date().toISOString(),
      read: false,
      targetRoles: params.targetRoles,
      actionUrl: params.actionUrl,
      metadata: params.metadata
    };

    this.notifications.unshift(notification);
    this.saveToStorage();
    this.notifyListeners();
    return notification;
  }

  public markAsRead(id: string): void {
    const item = this.notifications.find(n => n.id === id);
    if (item && !item.read) {
      item.read = true;
      this.saveToStorage();
      this.notifyListeners();
    }
  }

  public markAllAsRead(role: UserRole): void {
    let changed = false;
    this.notifications.forEach(n => {
      if (n.targetRoles.includes(role) && !n.read) {
        n.read = true;
        changed = true;
      }
    });
    if (changed) {
      this.saveToStorage();
      this.notifyListeners();
    }
  }

  public clearAll(role: UserRole): void {
    this.notifications = this.notifications.filter(n => !n.targetRoles.includes(role));
    this.saveToStorage();
    this.notifyListeners();
  }

  public subscribe(listener: (notifications: CareGridNotification[]) => void): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notifyListeners(): void {
    this.listeners.forEach(l => {
      try {
        l(this.notifications);
      } catch (err) {
        console.warn('Notification listener error:', err);
      }
    });
  }
}

export const notificationService = NotificationService.getInstance();
