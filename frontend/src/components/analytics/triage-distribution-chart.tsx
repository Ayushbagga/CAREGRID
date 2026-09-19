import React from 'react';
import { useLanguage } from '@/lib/i18n/context';
import type { DashboardAnalytics } from '@/lib/analytics/analytics-service';
import { Activity, ShieldAlert, ShieldCheck, UserCheck } from 'lucide-react';

interface TriageDistributionChartProps {
  analytics: DashboardAnalytics;
}

export function TriageDistributionChart({ analytics }: TriageDistributionChartProps) {
  const { t } = useLanguage();
  const tm = analytics.triageMetrics;
  const total = tm.totalScreened || 1;

  const redPercent = Math.round((tm.byTier.emergency_red / total) * 100);
  const amberPercent = Math.round((tm.byTier.urgent_amber / total) * 100);
  const greenPercent = Math.max(0, 100 - redPercent - amberPercent);

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-4">
      <div className="flex flex-wrap justify-between items-start gap-2 border-b border-slate-100 pb-3">
        <div>
          <h3 className="font-bold text-sm sm:text-base text-slate-900 flex items-center space-x-2">
            <Activity className="w-4 h-4 text-red-600" />
            <span>{t.triageBreakdownTitle}</span>
          </h3>
          <p className="text-xs text-slate-500">
            रूग्णांची क्लिनिकल निकड व शारीरिक लक्षणांनुसार प्राधान्यता क्रमवारी
          </p>
        </div>
        <span className="text-xs font-bold text-slate-700 bg-slate-100 px-2.5 py-1 rounded-full">
          एकूण तपासणी: {tm.totalScreened}
        </span>
      </div>

      {/* Visual Percentage Bar */}
      <div className="space-y-2">
        <div className="w-full h-4 bg-slate-100 rounded-full overflow-hidden flex shadow-inner">
          <div className="bg-red-500 h-full" style={{ width: `${redPercent}%` }} title={`Emergency Red: ${redPercent}%`} />
          <div className="bg-amber-400 h-full" style={{ width: `${amberPercent}%` }} title={`Urgent Amber: ${amberPercent}%`} />
          <div className="bg-emerald-500 h-full" style={{ width: `${greenPercent}%` }} title={`Routine Green: ${greenPercent}%`} />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
          {/* Red */}
          <div className="bg-red-50 border border-red-200 rounded-xl p-3 space-y-1">
            <div className="flex items-center space-x-1.5 text-xs font-bold text-red-900">
              <span className="w-2.5 h-2.5 rounded-full bg-red-600 inline-block" />
              <span>{t.emergencyStabilizationNeeded}</span>
            </div>
            <p className="text-xl font-black text-red-900">{tm.byTier.emergency_red} ({redPercent}%)</p>
            <p className="text-[11px] text-red-700">तात्काळ वैद्यकीय स्थिरीकरण व रेफरल</p>
          </div>

          {/* Amber */}
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 space-y-1">
            <div className="flex items-center space-x-1.5 text-xs font-bold text-amber-900">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block" />
              <span>{t.fastTrackReviewNeeded}</span>
            </div>
            <p className="text-xl font-black text-amber-900">{tm.byTier.urgent_amber} ({amberPercent}%)</p>
            <p className="text-[11px] text-amber-700">२४ तासांत वैद्यकीय अधिकारी तपासणी</p>
          </div>

          {/* Green */}
          <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 space-y-1">
            <div className="flex items-center space-x-1.5 text-xs font-bold text-emerald-900">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 inline-block" />
              <span>{t.routineOutpatientCare}</span>
            </div>
            <p className="text-xl font-black text-emerald-900">{tm.byTier.routine_green} ({greenPercent}%)</p>
            <p className="text-[11px] text-emerald-700">नियमित ओपीडी रांग व आरोग्य मार्गदर्शन</p>
          </div>
        </div>
      </div>

      {/* Clinical Governance Audit Notice */}
      <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 flex justify-between items-center text-xs text-slate-700">
        <div className="flex items-center space-x-2">
          <ShieldCheck className="w-4 h-4 text-teal-600" />
          <span>डॉक्टर पुनरावलोकन व श्रेणी बदल (Human Override): <strong>{tm.clinicianOverrideCount} रुग्ण</strong></span>
        </div>
        <span className="text-[11px] text-slate-500 italic">क्लिनिकल ऑडिट संरेखित</span>
      </div>
    </div>
  );
}
