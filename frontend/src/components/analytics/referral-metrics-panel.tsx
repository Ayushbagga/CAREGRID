import React from 'react';
import { useLanguage } from '@/lib/i18n/context';
import type { DashboardAnalytics } from '@/lib/analytics/analytics-service';
import { GitPullRequest, CheckCircle2, ArrowRight, ShieldCheck, HeartHandshake } from 'lucide-react';

interface ReferralMetricsPanelProps {
  analytics: DashboardAnalytics;
}

export function ReferralMetricsPanel({ analytics }: ReferralMetricsPanelProps) {
  const { t } = useLanguage();
  const r = analytics.referralMetrics;

  const funnelSteps = [
    { label: t.statusInitiated, count: r.byStatus.initiated, color: 'bg-blue-500' },
    { label: t.statusAcknowledged, count: r.byStatus.acknowledged, color: 'bg-amber-500' },
    { label: t.statusEvaluated, count: r.byStatus.evaluated, color: 'bg-purple-500' },
    { label: t.statusCompleted, count: r.byStatus.closed_loop, color: 'bg-teal-600' }
  ];

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-5">
      <div className="flex flex-wrap justify-between items-center gap-2 border-b border-slate-100 pb-3">
        <div>
          <h3 className="font-bold text-sm sm:text-base text-slate-900 flex items-center space-x-2">
            <GitPullRequest className="w-4 h-4 text-teal-600" />
            <span>{t.closedLoopFunnelTitle}</span>
          </h3>
          <p className="text-xs text-slate-500">
            प्राथमिक आरोग्य केंद्र &rarr; जिल्हा रुग्णालय &rarr; डिस्चार्ज &rarr; आशा गृहभेट सातत्य
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <span className="text-xs font-bold text-teal-800 bg-teal-50 border border-teal-200 px-2.5 py-1 rounded-full">
            पूर्णता दर: {r.closedLoopRate}%
          </span>
        </div>
      </div>

      {/* 4-Stage Funnel Progress */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {funnelSteps.map((step, idx) => (
          <div key={idx} className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-center space-y-1">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
              पायरी {idx + 1}
            </span>
            <p className="text-xl font-black text-slate-900">{step.count}</p>
            <p className="text-xs font-semibold text-slate-700 line-clamp-1">{step.label}</p>
          </div>
        ))}
      </div>

      {/* Specialty Distribution */}
      <div className="space-y-3 pt-2 border-t border-slate-100">
        <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
          {t.referralSpecialtyDistribution}
        </h4>
        <div className="space-y-2">
          {Object.entries(r.bySpecialty).map(([spec, count]) => {
            const percent = Math.round((count / (r.totalReferrals || 1)) * 100);
            return (
              <div key={spec} className="space-y-1 text-xs">
                <div className="flex justify-between font-medium">
                  <span className="text-slate-800 font-semibold">{spec}</span>
                  <span className="text-slate-500">{count} संदर्भ ({percent}%)</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                  <div className="bg-teal-600 h-2 rounded-full" style={{ width: `${percent}%` }} />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Counter-Referral Assurance */}
      <div className="bg-teal-50 border border-teal-200 rounded-xl p-3 flex items-center space-x-3 text-xs text-teal-950">
        <HeartHandshake className="w-5 h-5 text-teal-700 shrink-0" />
        <div>
          <span className="font-bold">१००% बंद-लूप हमी:</span> रुग्णालयातून डिस्चार्ज होताच संबंधित गावच्या आशा सेविकेकडे पाठपुरावा कार्य आपोआप नियुक्त केले जाते.
        </div>
      </div>
    </div>
  );
}
