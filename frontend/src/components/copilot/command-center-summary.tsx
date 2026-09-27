'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useLanguage } from '@/lib/i18n/context';
import { getCopilotI18n } from '@/lib/copilot/copilot-i18n';
import { getPhaseDI18n } from '@/lib/i18n/phase-d-i18n';
import { CareGridSymbol } from '@/components/shared/caregrid-logo';
import { useRealtimeTable, useRealtimeStatus } from '@/lib/realtime';
import { SyncManager } from '@/lib/offline-sync/sync-manager';
import type { UserRole, CopilotQueryResponse } from '@/lib/copilot';
import { 
  Sparkles, 
  Clock, 
  ArrowRight,
  ShieldAlert,
  GitPullRequest,
  RefreshCw,
  Activity,
  Radio
} from 'lucide-react';

interface CommandCenterSummaryProps {
  role: UserRole;
  onOpenCopilot?: () => void;
}

interface RecentOperationalEvent {
  id: string;
  type: 'urgent' | 'referral' | 'sync' | 'system';
  title: string;
  time: string;
}

export const CommandCenterSummary: React.FC<CommandCenterSummaryProps> = ({ role, onOpenCopilot }) => {
  const { locale } = useLanguage();
  const tCop = getCopilotI18n(locale);
  const tD = getPhaseDI18n(locale);
  const realtimeState = useRealtimeStatus();

  const [stats, setStats] = useState({
    urgentCases: 0,
    pendingReferrals: 0,
    overdueFollowUps: 0,
    unresolvedSync: 0,
    liveUrgentQueue: 0
  });

  const [recentEvents, setRecentEvents] = useState<RecentOperationalEvent[]>([
    {
      id: 'ev-1',
      type: 'urgent',
      title: 'Emergency Red triage evaluation in Gadchiroli PHC',
      time: '12m ago'
    },
    {
      id: 'ev-2',
      type: 'referral',
      title: 'High-risk antenatal referral acknowledged by Sub-District Hospital',
      time: '28m ago'
    },
    {
      id: 'ev-3',
      type: 'sync',
      title: 'Offline queue batch synchronized successfully',
      time: '45m ago'
    }
  ]);

  const [loading, setLoading] = useState(true);

  const fetchStats = useCallback(async () => {
    try {
      const res = await fetch('/api/copilot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ intent: 'command_center' })
      });
      if (res.ok) {
        const data: CopilotQueryResponse = await res.json();
        const s = (data.verified_data?.summary_stats as Record<string, number>) || {};
        const syncTel = await SyncManager.getTelemetry();
        
        setStats({
          urgentCases: Number(s.urgentCases || 0),
          pendingReferrals: Number(s.pendingReferrals || 0),
          overdueFollowUps: Number(s.overdueFollowUps || 0),
          unresolvedSync: syncTel.pendingCount + syncTel.failedCount,
          liveUrgentQueue: Number(s.urgentCases || 0)
        });
      }
    } catch {
      // fallback
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
    // Reactively update sync stats
    const unsubSync = SyncManager.onTelemetryChange(tel => {
      setStats(prev => ({
        ...prev,
        unresolvedSync: tel.pendingCount + tel.failedCount
      }));
    });
    return () => unsubSync();
  }, [fetchStats]);

  // Realtime subscriptions for appointments and referrals
  useRealtimeTable('appointments', useCallback((payload) => {
    fetchStats();
    if (payload.eventType === 'INSERT' && payload.newRecord?.queue_tier === 'emergency_red') {
      setRecentEvents(prev => [
        {
          id: crypto.randomUUID(),
          type: 'urgent',
          title: 'New Emergency Red patient added to OPD Queue',
          time: 'Just now'
        },
        ...prev.slice(0, 2)
      ]);
    }
  }, [fetchStats]));

  useRealtimeTable('referrals', useCallback((payload) => {
    fetchStats();
    if (payload.eventType === 'UPDATE') {
      setRecentEvents(prev => [
        {
          id: crypto.randomUUID(),
          type: 'referral',
          title: `Referral status updated: ${payload.newRecord?.status || 'updated'}`,
          time: 'Just now'
        },
        ...prev.slice(0, 2)
      ]);
    }
  }, [fetchStats]));

  const getRealtimeBadge = () => {
    if (realtimeState === 'CONNECTED') {
      return (
        <span className="flex items-center space-x-1 text-[10px] font-bold text-emerald-400 bg-emerald-950/70 border border-emerald-800/80 px-2 py-0.5 rounded-full">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping inline-block" />
          <span>{tD.realtimeConnected}</span>
        </span>
      );
    }
    return (
      <span className="flex items-center space-x-1 text-[10px] font-medium text-amber-300 bg-amber-950/70 border border-amber-800/80 px-2 py-0.5 rounded-full">
        <Radio className="w-2.5 h-2.5 text-amber-400" />
        <span>{tD.realtimeFallback}</span>
      </span>
    );
  };

  return (
    <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-teal-950 text-white rounded-xl p-4 shadow-md border border-slate-700/80 mb-4 space-y-3">
      {/* Header Row */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        {/* Left branding & title */}
        <div className="flex items-center space-x-3">
          <CareGridSymbol size={28} className="shrink-0" />
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-extrabold text-xs tracking-wider text-teal-300 uppercase">
                {tCop.commandCenterTitle}
              </span>
              <span className="bg-teal-500/20 text-teal-300 text-[10px] font-bold px-2 py-0.5 rounded-full border border-teal-500/40">
                {role.toUpperCase()}
              </span>
              {getRealtimeBadge()}
            </div>
            <p className="text-[11px] text-slate-400">
              {tCop.commandCenterDesc}
            </p>
          </div>
        </div>

        {/* Action button to launch Copilot */}
        {onOpenCopilot && (
          <button
            onClick={onOpenCopilot}
            className="bg-teal-600 hover:bg-teal-500 active:bg-teal-700 text-white text-xs font-bold px-3 py-1.5 rounded-lg shadow-sm flex items-center space-x-1.5 transition-all hover:scale-102 focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-400"
          >
            <Sparkles className="w-3.5 h-3.5 text-teal-200" />
            <span>Launch Care Copilot</span>
            <ArrowRight className="w-3 h-3 text-teal-200" />
          </button>
        )}
      </div>

      {/* Metrics Row (5 Cards) */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-xs">
        {/* Urgent Cases */}
        <div className="bg-slate-900/80 p-2.5 rounded-lg border border-slate-700/60 flex items-center justify-between">
          <div className="flex items-center space-x-1.5 min-w-0">
            <ShieldAlert className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span className="text-[11px] text-slate-300 font-medium truncate">
              {tCop.urgentCases}
            </span>
          </div>
          <span className="font-extrabold text-sm text-amber-400 ml-1">
            {loading ? '...' : stats.urgentCases}
          </span>
        </div>

        {/* Pending Referrals */}
        <div className="bg-slate-900/80 p-2.5 rounded-lg border border-slate-700/60 flex items-center justify-between">
          <div className="flex items-center space-x-1.5 min-w-0">
            <GitPullRequest className="w-3.5 h-3.5 text-teal-400 shrink-0" />
            <span className="text-[11px] text-slate-300 font-medium truncate">
              {tCop.pendingReferrals}
            </span>
          </div>
          <span className="font-extrabold text-sm text-teal-400 ml-1">
            {loading ? '...' : stats.pendingReferrals}
          </span>
        </div>

        {/* Overdue Follow-ups */}
        <div className="bg-slate-900/80 p-2.5 rounded-lg border border-slate-700/60 flex items-center justify-between">
          <div className="flex items-center space-x-1.5 min-w-0">
            <Clock className="w-3.5 h-3.5 text-rose-400 shrink-0" />
            <span className="text-[11px] text-slate-300 font-medium truncate">
              {tCop.overdueFollowUps}
            </span>
          </div>
          <span className="font-extrabold text-sm text-rose-400 ml-1">
            {loading ? '...' : stats.overdueFollowUps}
          </span>
        </div>

        {/* Live Urgent Queue */}
        <div className="bg-slate-900/80 p-2.5 rounded-lg border border-slate-700/60 flex items-center justify-between">
          <div className="flex items-center space-x-1.5 min-w-0">
            <Activity className="w-3.5 h-3.5 text-red-400 shrink-0" />
            <span className="text-[11px] text-slate-300 font-medium truncate">
              {tD.liveUrgentQueue}
            </span>
          </div>
          <span className="font-extrabold text-sm text-red-400 ml-1">
            {loading ? '...' : stats.liveUrgentQueue}
          </span>
        </div>

        {/* Unresolved Sync */}
        <div className="bg-slate-900/80 p-2.5 rounded-lg border border-slate-700/60 flex items-center justify-between col-span-2 sm:col-span-1">
          <div className="flex items-center space-x-1.5 min-w-0">
            <RefreshCw className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
            <span className="text-[11px] text-slate-300 font-medium truncate">
              {tD.unresolvedSyncLabel}
            </span>
          </div>
          <span className={`font-extrabold text-sm ml-1 ${stats.unresolvedSync > 0 ? 'text-amber-400 animate-pulse' : 'text-emerald-400'}`}>
            {loading ? '...' : stats.unresolvedSync}
          </span>
        </div>
      </div>

      {/* Recent Operational Events Strip */}
      <div className="pt-2 border-t border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-[11px] text-slate-300">
        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center space-x-1">
          <Activity className="w-3 h-3 text-teal-400" />
          <span>{tD.recentEventsTitle}:</span>
        </span>
        <div className="flex flex-wrap items-center gap-2">
          {recentEvents.slice(0, 2).map(ev => (
            <div key={ev.id} className="flex items-center space-x-1 bg-slate-950/60 border border-slate-800 px-2 py-0.5 rounded text-[10px]">
              {ev.type === 'urgent' && <span className="w-1.5 h-1.5 rounded-full bg-red-400" />}
              {ev.type === 'referral' && <span className="w-1.5 h-1.5 rounded-full bg-purple-400" />}
              {ev.type === 'sync' && <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />}
              <span className="text-slate-300 truncate max-w-[200px]">{ev.title}</span>
              <span className="text-slate-500 font-mono text-[9px]">({ev.time})</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
