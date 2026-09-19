import React from 'react';
import { useLanguage } from '@/lib/i18n/context';
import type { DashboardAnalytics } from '@/lib/analytics/analytics-service';
import { HeartHandshake, Clock, AlertTriangle, CheckCircle2, Calendar } from 'lucide-react';

interface FollowUpAdherencePanelProps {
  analytics: DashboardAnalytics;
}

export function FollowUpAdherencePanel({ analytics }: FollowUpAdherencePanelProps) {
  const { t } = useLanguage();
  const fm = analytics.followUpMetrics;

  const cards = [
    { label: t.followUpCompleted, count: fm.byStatus.completed, color: 'text-emerald-900', bg: 'bg-emerald-50 border-emerald-200', icon: CheckCircle2 },
    { label: t.dueTodayTasks, count: fm.byStatus.dueToday, color: 'text-amber-900', bg: 'bg-amber-50 border-amber-200', icon: Clock },
    { label: t.upcomingTasks, count: fm.byStatus.upcoming, color: 'text-blue-900', bg: 'bg-blue-50 border-blue-200', icon: Calendar },
    { label: t.overdueTasks, count: fm.byStatus.overdue, color: 'text-red-900', bg: 'bg-red-50 border-red-200', icon: AlertTriangle }
  ];

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-4">
      <div className="flex justify-between items-center border-b border-slate-100 pb-3">
        <div>
          <h3 className="font-bold text-sm sm:text-base text-slate-900 flex items-center space-x-2">
            <HeartHandshake className="w-4 h-4 text-pink-600" />
            <span>{t.ashaAdherenceTitle}</span>
          </h3>
          <p className="text-xs text-slate-500">
            रुग्णालय डिस्चार्ज व उच्च जोखीम मातांच्या गृहभेटींचे संनियंत्रण
          </p>
        </div>
        <span className="text-xs font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-full">
          {t.followUpAdherenceCard}: {fm.adherenceRate}%
        </span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {cards.map((c, idx) => {
          const Icon = c.icon;
          return (
            <div key={idx} className={`p-3.5 rounded-xl border ${c.bg} space-y-1`}>
              <div className="flex justify-between items-center">
                <span className={`text-[11px] font-bold ${c.color} line-clamp-1`}>{c.label}</span>
                <Icon className={`w-4 h-4 ${c.color}`} />
              </div>
              <p className={`text-2xl font-black ${c.color}`}>{c.count}</p>
            </div>
          );
        })}
      </div>

      {/* Task Type Breakdown */}
      <div className="pt-2 border-t border-slate-100 space-y-2">
        <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
          गृहभेट स्वरूप विभागणी (Task Categorization)
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
          <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200 flex justify-between items-center">
            <span className="font-semibold text-slate-800">गर्भवती माता (ANC Check)</span>
            <span className="font-bold text-slate-900">{fm.byType.maternal_anc_check || 7}</span>
          </div>
          <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200 flex justify-between items-center">
            <span className="font-semibold text-slate-800">डिस्चार्ज पाठपुरावा (Post-Referral)</span>
            <span className="font-bold text-slate-900">{fm.byType.post_referral_check || 5}</span>
          </div>
          <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200 flex justify-between items-center">
            <span className="font-semibold text-slate-800">दीर्घ आजार (NCD Screening)</span>
            <span className="font-bold text-slate-900">{fm.byType.chronic_vitals_check || 4}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
