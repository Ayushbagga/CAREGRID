import React from 'react';
import { useLanguage } from '@/lib/i18n/context';
import type { DashboardAnalytics } from '@/lib/analytics/analytics-service';
import { Building2, Activity, HeartHandshake, ShieldCheck, Clock } from 'lucide-react';

interface FacilityReadinessPanelProps {
  analytics: DashboardAnalytics;
}

export function FacilityReadinessPanel({ analytics }: FacilityReadinessPanelProps) {
  const { t } = useLanguage();
  const fm = analytics.facilityMetrics;

  const tiers = [
    { label: 'उपकेंद्र (Sub-Centre)', count: fm.byTier.sub_centre || 3, desc: 'गाव पातळीवरील प्राथमिक तपासणी' },
    { label: 'प्राथमिक आरोग्य केंद्र (PHC)', count: fm.byTier.phc || 2, desc: 'वैद्यकीय अधिकारी ओपीडी व प्रसूती' },
    { label: 'ग्रामीण रुग्णालय (Rural Hospital)', count: fm.byTier.rural_hospital || 1, desc: '३० खाटांचे दुय्यम केंद्र व शस्त्रक्रिया' },
    { label: 'जिल्हा रुग्णालय (District Hospital)', count: fm.byTier.district_hospital || 1, desc: 'तज्ज्ञ वैद्यकीय शाखा व आयसीयू' }
  ];

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-5">
      <div className="flex justify-between items-center border-b border-slate-100 pb-3">
        <div>
          <h3 className="font-bold text-sm sm:text-base text-slate-900 flex items-center space-x-2">
            <Building2 className="w-4 h-4 text-teal-600" />
            <span>{t.serviceReadinessTitle}</span>
          </h3>
          <p className="text-xs text-slate-500">
            सार्वजनिक आरोग्य पायाभूत सुविधा स्तर व आवश्यक सेवा क्षमता
          </p>
        </div>
        <span className="text-xs font-bold text-teal-800 bg-teal-50 px-2.5 py-1 rounded-full border border-teal-200">
          एकूण संस्था: {fm.totalFacilities}
        </span>
      </div>

      {/* Facility Tier Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {tiers.map((tier, idx) => (
          <div key={idx} className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-1">
            <p className="text-xl font-black text-slate-900">{tier.count}</p>
            <h4 className="text-xs font-bold text-slate-900">{tier.label}</h4>
            <p className="text-[11px] text-slate-500">{tier.desc}</p>
          </div>
        ))}
      </div>

      {/* Essential 24x7 Services Matrix */}
      <div className="bg-teal-50/70 border border-teal-200 rounded-xl p-4 space-y-3">
        <h4 className="text-xs font-bold text-teal-950 uppercase tracking-wider flex items-center space-x-2">
          <ShieldCheck className="w-4 h-4 text-teal-700" />
          <span>{t.essentialServicesCoverage}</span>
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs text-teal-950 font-medium">
          <div className="bg-white p-3 rounded-lg border border-teal-200 shadow-2xs">
            <p className="text-[11px] text-slate-500">प्रसूती कक्ष (Labor Room) सक्षम</p>
            <p className="text-base font-black text-teal-900 mt-0.5">{fm.laborRoomCount} केंद्रे</p>
          </div>
          <div className="bg-white p-3 rounded-lg border border-teal-200 shadow-2xs">
            <p className="text-[11px] text-slate-500">२४/७ आपत्कालीन स्थिरीकरण</p>
            <p className="text-base font-black text-teal-900 mt-0.5">{fm.emergency24x7Count} केंद्रे</p>
          </div>
          <div className="bg-white p-3 rounded-lg border border-teal-200 shadow-2xs">
            <p className="text-[11px] text-slate-500">अतिदक्षता / आयसीयू सुविधा</p>
            <p className="text-base font-black text-teal-900 mt-0.5">{fm.icuCriticalCareCount} केंद्र (DH)</p>
          </div>
        </div>
      </div>
    </div>
  );
}
