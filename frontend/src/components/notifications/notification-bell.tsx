'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useLanguage } from '@/lib/i18n/context';
import { getPhaseDI18n } from '@/lib/i18n/phase-d-i18n';
import { notificationService, type CareGridNotification } from '@/lib/notifications';
import type { UserRole } from '@/lib/auth/roles';
import { 
  Bell, 
  X, 
  CheckCheck, 
  AlertTriangle, 
  GitPullRequest, 
  Clock, 
  RefreshCw, 
  Info,
  ExternalLink 
} from 'lucide-react';
import Link from 'next/link';

interface NotificationBellProps {
  role: UserRole;
}

export const NotificationBell: React.FC<NotificationBellProps> = ({ role }) => {
  const { locale } = useLanguage();
  const tD = getPhaseDI18n(locale);

  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<CareGridNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const popoverRef = useRef<HTMLDivElement>(null);

  const updateList = () => {
    const list = notificationService.getNotificationsForRole(role);
    setNotifications(list);
    setUnreadCount(list.filter(n => !n.read).length);
  };

  useEffect(() => {
    updateList();
    const unsubscribe = notificationService.subscribe(() => {
      updateList();
    });
    return () => unsubscribe();
  }, [role]);

  // Click outside and Esc key listener
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const handleMarkAllRead = () => {
    notificationService.markAllAsRead(role);
    updateList();
  };

  const handleClearAll = () => {
    notificationService.clearAll(role);
    updateList();
  };

  const handleItemClick = (item: CareGridNotification) => {
    if (!item.read) {
      notificationService.markAsRead(item.id);
      updateList();
    }
    setIsOpen(false);
  };

  const getUrgencyIcon = (item: CareGridNotification) => {
    switch (item.category) {
      case 'urgent_case':
        return <AlertTriangle className="w-4 h-4 text-red-500 shrink-0" />;
      case 'referral_update':
        return <GitPullRequest className="w-4 h-4 text-purple-500 shrink-0" />;
      case 'followup_overdue':
        return <Clock className="w-4 h-4 text-amber-500 shrink-0" />;
      case 'sync_alert':
        return <RefreshCw className="w-4 h-4 text-blue-500 shrink-0" />;
      default:
        return <Info className="w-4 h-4 text-teal-600 shrink-0" />;
    }
  };

  const formatTimestamp = (iso: string) => {
    try {
      const d = new Date(iso);
      const diffMin = Math.round((Date.now() - d.getTime()) / 60000);
      if (diffMin < 1) return 'Just now';
      if (diffMin < 60) return `${diffMin}m ago`;
      if (diffMin < 1440) return `${Math.round(diffMin / 60)}h ago`;
      return d.toLocaleDateString();
    } catch {
      return iso;
    }
  };

  return (
    <div className="relative inline-block" ref={popoverRef}>
      {/* Bell Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        aria-label={`${tD.notificationsTitle} (${unreadCount} unread)`}
        aria-haspopup="dialog"
        aria-expanded={isOpen}
        className="relative p-2 rounded-full text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-500"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 flex h-4 min-w-4 px-1 items-center justify-center rounded-full bg-red-600 text-[10px] font-black text-white shadow-xs animate-pulse">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Popover Dropdown */}
      {isOpen && (
        <div 
          role="dialog"
          aria-label={tD.notificationsTitle}
          className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-xl shadow-2xl border border-slate-200 z-50 overflow-hidden text-xs animate-in fade-in slide-in-from-top-2 duration-150"
        >
          {/* Header */}
          <div className="p-3.5 bg-slate-900 text-white flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Bell className="w-4 h-4 text-teal-400" />
              <h3 className="font-extrabold text-sm">{tD.notificationsTitle}</h3>
              {unreadCount > 0 && (
                <span className="bg-teal-500/20 text-teal-300 text-[10px] font-bold px-1.5 py-0.5 rounded-full border border-teal-500/40">
                  {unreadCount} new
                </span>
              )}
            </div>

            <div className="flex items-center space-x-2">
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllRead}
                  title={tD.markAllRead}
                  className="text-slate-300 hover:text-white p-1 rounded transition-colors flex items-center space-x-1 text-[11px]"
                >
                  <CheckCheck className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">{tD.markAllRead}</span>
                </button>
              )}
              <button
                onClick={() => setIsOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded"
                aria-label="Close notifications"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Notification List */}
          <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
            {notifications.length === 0 ? (
              <div className="p-8 text-center text-slate-400 space-y-1">
                <Bell className="w-6 h-6 text-slate-300 mx-auto" />
                <p className="font-medium text-slate-600">{tD.noNotifications}</p>
                <p className="text-[11px] text-slate-400">All clinical alerts are cleared.</p>
              </div>
            ) : (
              notifications.map(item => (
                <div
                  key={item.id}
                  onClick={() => handleItemClick(item)}
                  className={`p-3.5 transition-colors cursor-pointer flex items-start space-x-3 ${
                    !item.read ? 'bg-teal-50/40 hover:bg-teal-50/80' : 'bg-white hover:bg-slate-50'
                  }`}
                >
                  <div className="mt-0.5">{getUrgencyIcon(item)}</div>

                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className={`font-bold text-slate-900 truncate ${!item.read ? 'text-teal-950 font-black' : ''}`}>
                        {item.title}
                      </span>
                      <span className="text-[10px] text-slate-400 shrink-0 ml-2">
                        {formatTimestamp(item.timestamp)}
                      </span>
                    </div>

                    <p className="text-slate-600 text-[11px] leading-relaxed line-clamp-2">
                      {item.body}
                    </p>

                    {item.actionUrl && (
                      <Link
                        href={item.actionUrl}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleItemClick(item);
                        }}
                        className="inline-flex items-center space-x-1 text-teal-700 hover:text-teal-900 font-semibold text-[10px] pt-1"
                      >
                        <span>{tD.viewDetailsBtn}</span>
                        <ExternalLink className="w-3 h-3" />
                      </Link>
                    )}
                  </div>

                  {!item.read && (
                    <span className="w-2 h-2 rounded-full bg-teal-600 shrink-0 mt-1.5" />
                  )}
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="p-2 bg-slate-50 border-t border-slate-100 flex justify-between items-center text-[11px] text-slate-500 px-3">
              <span>{notifications.length} total</span>
              <button
                onClick={handleClearAll}
                className="hover:text-slate-700 underline font-medium"
              >
                {tD.clearNotifications}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
