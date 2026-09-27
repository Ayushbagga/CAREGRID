'use client';

import React, { useState, useEffect } from 'react';
import { useLanguage } from '@/lib/i18n/context';
import { getCopilotI18n } from '@/lib/copilot/copilot-i18n';
import { CareGridSymbol } from '@/components/shared/caregrid-logo';
import type { UserRole, CopilotQueryResponse } from '@/lib/copilot';
import { 
  Sparkles, 
  Clock, 
  ArrowRight,
  ShieldAlert,
  GitPullRequest
} from 'lucide-react';

interface CommandCenterSummaryProps {
  role: UserRole;
  onOpenCopilot?: () => void;
}

export const CommandCenterSummary: React.FC<CommandCenterSummaryProps> = ({ role, onOpenCopilot }) => {
  const { locale } = useLanguage();
  const tCop = getCopilotI18n(locale);

  const [stats, setStats] = useState({
    urgentCases: 0,
    pendingReferrals: 0,
    overdueFollowUps: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    async function fetchStats() {
      try {
        const res = await fetch('/api/copilot', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ intent: 'command_center' })
        });
        if (res.ok && isMounted) {
          const data: CopilotQueryResponse = await res.json();
          const s = (data.verified_data?.summary_stats as Record<string, number>) || {};
          setStats({
            urgentCases: Number(s.urgentCases || 0),
            pendingReferrals: Number(s.pendingReferrals || 0),
            overdueFollowUps: Number(s.overdueFollowUps || 0)
          });
        }
      } catch {
        // fallback
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    fetchStats();
    return () => {
      isMounted = false;
    };
  }, [role]);

  return (
    <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-teal-950 text-white rounded-xl p-4 shadow-md border border-slate-700/80 mb-4">
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
            className="bg-teal-600 hover:bg-teal-500 active:bg-teal-700 text-white text-xs font-bold px-3 py-1.5 rounded-lg shadow-sm flex items-center space-x-1.5 transition-all hover:scale-102"
          >
            <Sparkles className="w-3.5 h-3.5 text-teal-200" />
            <span>Launch Care Copilot</span>
            <ArrowRight className="w-3 h-3 text-teal-200" />
          </button>
        )}
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 mt-3 pt-3 border-t border-slate-800/80 text-xs">
        <div className="bg-slate-900/80 p-2.5 rounded-lg border border-slate-700/60 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0" />
            <span className="text-[11px] text-slate-300 font-medium">
              {tCop.urgentCases}
            </span>
          </div>
          <span className="font-extrabold text-sm text-amber-400">
            {loading ? '...' : stats.urgentCases}
          </span>
        </div>

        <div className="bg-slate-900/80 p-2.5 rounded-lg border border-slate-700/60 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <GitPullRequest className="w-4 h-4 text-teal-400 shrink-0" />
            <span className="text-[11px] text-slate-300 font-medium">
              {tCop.pendingReferrals}
            </span>
          </div>
          <span className="font-extrabold text-sm text-teal-400">
            {loading ? '...' : stats.pendingReferrals}
          </span>
        </div>

        <div className="bg-slate-900/80 p-2.5 rounded-lg border border-slate-700/60 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Clock className="w-4 h-4 text-rose-400 shrink-0" />
            <span className="text-[11px] text-slate-300 font-medium">
              {tCop.overdueFollowUps}
            </span>
          </div>
          <span className="font-extrabold text-sm text-rose-400">
            {loading ? '...' : stats.overdueFollowUps}
          </span>
        </div>
      </div>
    </div>
  );
};
