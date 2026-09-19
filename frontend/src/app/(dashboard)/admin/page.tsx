'use client';

import React, { useState, useEffect } from 'react';
import { useLanguage } from '@/lib/i18n/context';
import { AnalyticsService, type DashboardAnalytics } from '@/lib/analytics/analytics-service';
import { KpiStatCard } from '@/components/analytics/kpi-stat-card';
import { ReferralMetricsPanel } from '@/components/analytics/referral-metrics-panel';
import { TriageDistributionChart } from '@/components/analytics/triage-distribution-chart';
import { FacilityReadinessPanel } from '@/components/analytics/facility-readiness-panel';
import { FollowUpAdherencePanel } from '@/components/analytics/follow-up-adherence-panel';
import { 
  Building2, 
  GitPullRequest, 
  HeartHandshake, 
  Activity, 
  Wifi, 
  ArrowLeft, 
  Languages, 
  ShieldCheck, 
  Filter, 
  RefreshCw,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Stethoscope
} from 'lucide-react';
import Link from 'next/link';

export default function AdminDashboardPage() {
  const { t, locale, setLocale } = useLanguage();
  const [selectedDistrict, setSelectedDistrict] = useState<string>('all');
  const [activeTab, setActiveTab] = useState<'overview' | 'referrals' | 'asha' | 'facilities'>('overview');
  const [analytics, setAnalytics] = useState<DashboardAnalytics | null>(null);
  const [loading, setLoading] = useState(true);

  const loadData = async (dist: string) => {
    setLoading(true);
    try {
      const data = await AnalyticsService.getAnalytics(dist);
      setAnalytics(data);
    } catch (err) {
      console.error('Failed to load dashboard telemetry:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData(selectedDistrict);
  }, [selectedDistrict]);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Top Government Banner */}
      <div className="bg-slate-900 text-slate-300 text-xs py-2 px-4 border-b border-slate-800">
        <div className="max-w-6xl mx-auto flex flex-wrap justify-between items-center gap-2">
          <div className="flex items-center space-x-2">
            <span className="font-semibold text-white">महाराष्ट्र शासन</span>
            <span className="text-slate-500">|</span>
            <span>{t.governmentTag}</span>
          </div>
          <div className="flex items-center space-x-3 text-slate-400">
            <span>SIH26133</span>
            <span>•</span>
            <span>सार्वजनिक आरोग्य नियंत्रण कक्ष (State & District Care Coordination)</span>
          </div>
        </div>
      </div>

      {/* Main Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-xs">
        <div className="max-w-6xl mx-auto px-4 py-3 flex flex-wrap justify-between items-center gap-2">
          <div className="flex items-center space-x-3">
            <Link href="/" className="text-slate-400 hover:text-slate-600 p-1 rounded">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="text-base sm:text-lg font-extrabold text-slate-900 leading-tight flex items-center space-x-2">
                <Building2 className="w-5 h-5 text-purple-600" />
                <span>{t.adminDashboardTitle}</span>
              </h1>
              <p className="text-[11px] text-slate-500 font-medium">
                {t.adminDashboardSub}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => loadData(selectedDistrict)}
              className="p-1.5 text-slate-600 hover:text-slate-900 bg-slate-100 rounded-lg"
              title="Refresh telemetry"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>

            <div className="flex items-center space-x-1 text-xs bg-slate-100 p-1 rounded-lg border border-slate-200">
              <Languages className="w-3.5 h-3.5 text-slate-500 ml-1" />
              {(['mr', 'hi', 'en'] as const).map(lang => (
                <button
                  key={lang}
                  onClick={() => setLocale(lang)}
                  className={`px-2 py-0.5 rounded text-xs font-bold transition-all ${
                    locale === lang
                      ? 'bg-teal-600 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {lang === 'mr' ? 'मराठी' : lang === 'hi' ? 'हिंदी' : 'EN'}
                </button>
              ))}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 py-6 flex-1 w-full space-y-5">
        {/* District Filter Pill Bar */}
        <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center space-x-2 text-xs font-bold text-slate-700">
            <Filter className="w-4 h-4 text-slate-500" />
            <span>जिल्हा निवडा (District Filter):</span>
          </div>

          <div className="flex flex-wrap gap-1.5">
            {[
              { id: 'all', label: t.filterDistrictAll },
              { id: 'Gadchiroli', label: t.filterDistrictGadchiroli },
              { id: 'Nashik', label: t.filterDistrictNashik },
              { id: 'Pune', label: t.filterDistrictPune }
            ].map(d => (
              <button
                key={d.id}
                onClick={() => setSelectedDistrict(d.id)}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                  selectedDistrict === d.id
                    ? 'bg-purple-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                {d.label}
              </button>
            ))}
          </div>
        </div>

        {/* Loading Skeleton or Content */}
        {loading || !analytics ? (
          <div className="bg-white p-12 rounded-xl border border-slate-200 text-center text-xs text-slate-500">
            Loading public healthcare telemetry across Maharashtra...
          </div>
        ) : (
          <>
            {/* Top 5 KPI Summary Stat Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              <KpiStatCard
                title={t.totalFacilitiesCard}
                value={analytics.facilityMetrics.totalFacilities}
                subtext="उपकेंद्र ते जिल्हा रुग्णालय"
                badgeText="Active"
                badgeColor="blue"
                icon={Building2}
                iconBgColor="bg-blue-50 text-blue-700"
              />

              <KpiStatCard
                title={t.referralVolumeCard}
                value={analytics.referralMetrics.totalReferrals}
                subtext="प्राथमिक ते दुय्यम वर्गवारी"
                badgeText="Tracked"
                badgeColor="purple"
                icon={GitPullRequest}
                iconBgColor="bg-purple-50 text-purple-700"
              />

              <KpiStatCard
                title={t.referralCompletionRateCard}
                value={`${analytics.referralMetrics.closedLoopRate}%`}
                subtext="डिस्चार्ज व काउंटर-रेफरल"
                badgeText="Target > 80%"
                badgeColor="teal"
                icon={CheckCircle2}
                iconBgColor="bg-teal-50 text-teal-700"
              />

              <KpiStatCard
                title={t.followUpAdherenceCard}
                value={`${analytics.followUpMetrics.adherenceRate}%`}
                subtext="आशा गृहभेट वेळेवर पूर्तता"
                badgeText="Target > 85%"
                badgeColor="teal"
                icon={HeartHandshake}
                iconBgColor="bg-pink-50 text-pink-700"
              />

              <KpiStatCard
                title={t.triageUrgencyRatioCard}
                value={`${analytics.triageMetrics.redUrgencyRate}%`}
                subtext="तात्काळ वैद्यकीय निकड"
                badgeText="Triage Red"
                badgeColor="red"
                icon={Activity}
                iconBgColor="bg-red-50 text-red-700"
              />

              <KpiStatCard
                title={t.offlineSyncResilienceCard}
                value={`${analytics.offlineResilience.offlineResilienceRate}%`}
                subtext="स्थानिक IndexedDB सिंक"
                badgeText="Offline OK"
                badgeColor="amber"
                icon={Wifi}
                iconBgColor="bg-amber-50 text-amber-700"
              />
            </div>

            {/* Navigation Tabs */}
            <div className="flex space-x-2 border-b border-slate-200 pb-2">
              <button
                onClick={() => setActiveTab('overview')}
                className={`px-4 py-2 rounded-lg text-xs font-bold transition-colors ${
                  activeTab === 'overview'
                    ? 'bg-purple-600 text-white shadow-xs'
                    : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
                }`}
              >
                {t.overviewTab}
              </button>

              <button
                onClick={() => setActiveTab('referrals')}
                className={`px-4 py-2 rounded-lg text-xs font-bold transition-colors ${
                  activeTab === 'referrals'
                    ? 'bg-purple-600 text-white shadow-xs'
                    : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
                }`}
              >
                {t.referralContinuumTab}
              </button>

              <button
                onClick={() => setActiveTab('asha')}
                className={`px-4 py-2 rounded-lg text-xs font-bold transition-colors ${
                  activeTab === 'asha'
                    ? 'bg-purple-600 text-white shadow-xs'
                    : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
                }`}
              >
                {t.ashaContinuityTab}
              </button>

              <button
                onClick={() => setActiveTab('facilities')}
                className={`px-4 py-2 rounded-lg text-xs font-bold transition-colors ${
                  activeTab === 'facilities'
                    ? 'bg-purple-600 text-white shadow-xs'
                    : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
                }`}
              >
                {t.facilityReadinessTab}
              </button>
            </div>

            {/* Tab 1: Overview & Key Access Indicators */}
            {activeTab === 'overview' && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  <TriageDistributionChart analytics={analytics} />
                  <ReferralMetricsPanel analytics={analytics} />
                </div>

                {/* Additional Access Quality Row */}
                <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-3">
                  <h3 className="font-bold text-sm sm:text-base text-slate-900 flex items-center space-x-2">
                    <ShieldCheck className="w-4 h-4 text-teal-600" />
                    <span>{t.qualityIndicatorsTitle}</span>
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                    <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                      <p className="text-slate-500">{t.highRiskPregnancyIdentified}</p>
                      <p className="text-lg font-black text-slate-900 mt-1">
                        {analytics.followUpMetrics.byType.maternal_anc_check || 7} माता ट्रॅकिंगखाली
                      </p>
                      <p className="text-[11px] text-teal-700 mt-0.5">नियमित तपासणी व एएनसी सहाय्य</p>
                    </div>

                    <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                      <p className="text-slate-500">ग्रामीण टेलिकन्सल्टेशन सत्रे</p>
                      <p className="text-lg font-black text-slate-900 mt-1">
                        {analytics.opdQueueMetrics.teleconsultSessions} सत्रे पूर्ण
                      </p>
                      <p className="text-[11px] text-teal-700 mt-0.5">PHC ते जिल्हा रुग्णालय थेट सल्ला</p>
                    </div>

                    <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                      <p className="text-slate-500">स्थानिक ओपीडी टोकन वहन क्षमता</p>
                      <p className="text-lg font-black text-slate-900 mt-1">
                        {analytics.opdQueueMetrics.completed} रुग्ण तपासणी पूर्ण
                      </p>
                      <p className="text-[11px] text-teal-700 mt-0.5">रांगेत: {analytics.opdQueueMetrics.inQueue} • तपासणी सुरू: {analytics.opdQueueMetrics.inConsultation}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Tab 2: Referral Care Continuum */}
            {activeTab === 'referrals' && (
              <div className="space-y-4">
                <ReferralMetricsPanel analytics={analytics} />
              </div>
            )}

            {/* Tab 3: ASHA Continuity */}
            {activeTab === 'asha' && (
              <div className="space-y-4">
                <FollowUpAdherencePanel analytics={analytics} />
              </div>
            )}

            {/* Tab 4: Facilities & Services Readiness */}
            {activeTab === 'facilities' && (
              <div className="space-y-4">
                <FacilityReadinessPanel analytics={analytics} />
              </div>
            )}

            {/* Governance & Privacy Notice */}
            <div className="bg-purple-50/80 border border-purple-200 rounded-xl p-4 text-xs text-purple-950 space-y-1">
              <div className="flex items-center space-x-2 font-bold text-purple-900">
                <ShieldCheck className="w-4 h-4 text-purple-700" />
                <span>{t.clinicalGovernanceNotice}</span>
              </div>
              <p className="text-[11px] text-purple-800 leading-relaxed">
                {t.anonymizedDataNotice} एआय प्रणाली केवळ कर्मचाऱ्यांना प्राधान्यक्रम ठरवण्यासाठी साहाय्यकारी (Assistive Non-Diagnostic) आहे; कोणतेही वैद्यकीय निदान किंवा औषधोपचार स्वयंचलितरित्या निश्चित करत नाही.
              </p>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
