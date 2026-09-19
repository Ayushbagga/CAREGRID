'use client';

import React from 'react';
import { useNetworkStatus } from '@/hooks/use-network-status';
import { useLanguage } from '@/lib/i18n/context';
import { WifiOff, RefreshCw, Database } from 'lucide-react';

export const OfflineBanner: React.FC = () => {
  const { isOnline, pendingCount } = useNetworkStatus();
  const { t } = useLanguage();

  if (isOnline && pendingCount === 0) {
    return null;
  }

  const isCloudConfigured = Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );

  return (
    <div
      role="alert"
      aria-live="polite"
      className={`w-full px-4 py-2 text-xs md:text-sm font-medium flex items-center justify-between transition-colors ${
        !isOnline
          ? 'bg-amber-600 text-white'
          : isCloudConfigured
          ? 'bg-teal-700 text-white'
          : 'bg-slate-700 text-white'
      }`}
    >
      <div className="flex items-center space-x-2 max-w-4xl mx-auto w-full justify-between">
        <div className="flex items-center space-x-2">
          {!isOnline ? (
            <WifiOff className="w-4 h-4 shrink-0 text-amber-200 animate-pulse" />
          ) : isCloudConfigured ? (
            <RefreshCw className="w-4 h-4 shrink-0 text-teal-200 animate-spin" />
          ) : (
            <Database className="w-4 h-4 shrink-0 text-slate-300" />
          )}
          <span>
            {!isOnline
              ? t.offlineBanner
              : isCloudConfigured
              ? t.onlineSyncBanner
              : t.localQueueBanner}
          </span>
        </div>
        {pendingCount > 0 && (
          <span className="bg-black/30 px-2 py-0.5 rounded-full text-xs shrink-0">
            {t.pendingRecords}: {pendingCount}
          </span>
        )}
      </div>
    </div>
  );
};
