'use client';

import React, { useState, useEffect } from 'react';
import { useLanguage } from '@/lib/i18n/context';
import { useNetworkStatus } from '@/hooks/use-network-status';
import { PatientService } from '@/lib/offline-sync/patient-service';
import { PatientIntakeForm } from '@/components/asha/patient-intake-form';
import { VitalsScreeningForm } from '@/components/asha/vitals-screening-form';
import { PatientRoster } from '@/components/asha/patient-roster';
import { SyncStatusModal } from '@/components/asha/sync-status-modal';
import { 
  Users, 
  HeartHandshake, 
  AlertCircle, 
  RefreshCw, 
  PlusCircle, 
  ListOrdered,
  Activity,
  ArrowLeft
} from 'lucide-react';
import Link from 'next/link';

export default function AshaDashboardPage() {
  const { t, locale, setLocale } = useLanguage();
  const { isOnline, pendingCount, refreshPendingCount } = useNetworkStatus();

  const [activeTab, setActiveTab] = useState<'roster' | 'intake' | 'screening'>('roster');
  const [selectedPatientIdForScreening, setSelectedPatientIdForScreening] = useState<string | undefined>();
  const [isSyncModalOpen, setIsSyncModalOpen] = useState(false);

  const [stats, setStats] = useState({
    total: 0,
    pregnant: 0,
    highRisk: 0
  });

  const loadStats = async () => {
    try {
      const all = await PatientService.getPatients();
      setStats({
        total: all.length,
        pregnant: all.filter(p => p.is_pregnant).length,
        highRisk: all.filter(p => p.high_risk_pregnancy).length
      });
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    loadStats();
    refreshPendingCount();
  }, [activeTab]);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-xs">
        <div className="max-w-5xl mx-auto px-4 py-3 flex flex-wrap justify-between items-center gap-2">
          <div className="flex items-center space-x-3">
            <Link href="/" className="text-slate-400 hover:text-slate-600 p-1 rounded">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="text-base sm:text-lg font-extrabold text-slate-900 leading-tight">
                {t.ashaDashboard}
              </h1>
              <p className="text-[11px] text-slate-500 font-medium">
                {t.assignedVillage}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => setIsSyncModalOpen(true)}
              className={`flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border transition-colors ${
                pendingCount > 0
                  ? 'bg-amber-50 text-amber-800 border-amber-300 animate-pulse'
                  : 'bg-slate-100 text-slate-700 border-slate-200'
              }`}
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>{pendingCount > 0 ? `${pendingCount} ${t.pendingSyncLabel}` : 'Synced'}</span>
            </button>

            <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200 text-xs">
              <button
                onClick={() => setLocale('mr')}
                className={`px-2 py-1 rounded font-bold transition-colors ${
                  locale === 'mr' ? 'bg-teal-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                मराठी
              </button>
              <button
                onClick={() => setLocale('hi')}
                className={`px-2 py-1 rounded font-bold transition-colors ${
                  locale === 'hi' ? 'bg-teal-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                हिंदी
              </button>
              <button
                onClick={() => setLocale('en')}
                className={`px-2 py-1 rounded font-bold transition-colors ${
                  locale === 'en' ? 'bg-teal-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                EN
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-5xl mx-auto px-4 py-5 flex-1 w-full space-y-5">
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
            <div className="flex items-center space-x-2 text-slate-500 mb-1">
              <Users className="w-4 h-4 text-teal-600" />
              <span className="text-[11px] font-semibold">{t.registeredPatients}</span>
            </div>
            <p className="text-xl font-black text-slate-900">{stats.total}</p>
          </div>

          <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
            <div className="flex items-center space-x-2 text-pink-600 mb-1">
              <HeartHandshake className="w-4 h-4" />
              <span className="text-[11px] font-semibold">{t.pregnantFilter}</span>
            </div>
            <p className="text-xl font-black text-pink-900">{stats.pregnant}</p>
          </div>

          <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
            <div className="flex items-center space-x-2 text-red-600 mb-1">
              <AlertCircle className="w-4 h-4" />
              <span className="text-[11px] font-semibold">{t.highRiskFilter}</span>
            </div>
            <p className="text-xl font-black text-red-900">{stats.highRisk}</p>
          </div>
        </div>

        <div className="flex space-x-2 border-b border-slate-200 pb-2">
          <button
            onClick={() => setActiveTab('roster')}
            className={`px-4 py-2 rounded-lg text-xs font-bold flex items-center space-x-1.5 transition-colors ${
              activeTab === 'roster'
                ? 'bg-teal-600 text-white shadow-sm'
                : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            <ListOrdered className="w-4 h-4" />
            <span>{t.allPatients}</span>
          </button>

          <button
            onClick={() => setActiveTab('intake')}
            className={`px-4 py-2 rounded-lg text-xs font-bold flex items-center space-x-1.5 transition-colors ${
              activeTab === 'intake'
                ? 'bg-teal-600 text-white shadow-sm'
                : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            <PlusCircle className="w-4 h-4" />
            <span>{t.newRegistrationBtn}</span>
          </button>

          <button
            onClick={() => setActiveTab('screening')}
            className={`px-4 py-2 rounded-lg text-xs font-bold flex items-center space-x-1.5 transition-colors ${
              activeTab === 'screening'
                ? 'bg-teal-600 text-white shadow-sm'
                : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            <Activity className="w-4 h-4" />
            <span>{t.recordVitalsBtn}</span>
          </button>
        </div>

        {activeTab === 'roster' && (
          <PatientRoster
            onSelectForScreening={patientId => {
              setSelectedPatientIdForScreening(patientId);
              setActiveTab('screening');
            }}
            onNewRegistration={() => setActiveTab('intake')}
          />
        )}

        {activeTab === 'intake' && (
          <PatientIntakeForm
            onSuccess={() => {
              setActiveTab('roster');
              loadStats();
            }}
            onCancel={() => setActiveTab('roster')}
          />
        )}

        {activeTab === 'screening' && (
          <VitalsScreeningForm
            initialPatientId={selectedPatientIdForScreening}
            onSuccess={() => {
              setActiveTab('roster');
              loadStats();
            }}
            onCancel={() => setActiveTab('roster')}
          />
        )}
      </main>

      <SyncStatusModal
        isOpen={isSyncModalOpen}
        onClose={() => setIsSyncModalOpen(false)}
      />
    </div>
  );
}
