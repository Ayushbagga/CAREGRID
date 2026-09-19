'use client';

import React, { useState } from 'react';
import { useLanguage } from '@/lib/i18n/context';
import { LanguageSwitcher } from '@/components/shared/language-switcher';
import { useNetworkStatus } from '@/hooks/use-network-status';
import { ReferralManager } from '@/components/referrals/referral-manager';
import { ReferralCreateModal } from '@/components/referrals/referral-create-modal';
import { LongitudinalHealthRecord } from '@/components/records/longitudinal-health-record';
import { PatientService } from '@/lib/offline-sync/patient-service';
import type { Patient } from '@/types/healthcare';
import { GitPullRequest, ArrowLeft, Languages } from 'lucide-react';
import Link from 'next/link';

export default function ReferralsPage() {
  const { t, locale, setLocale } = useLanguage();
  const { isOnline } = useNetworkStatus();

  const [selectedPatientForReferral, setSelectedPatientForReferral] = useState<Patient | null>(null);
  const [selectedPatientForRecord, setSelectedPatientForRecord] = useState<string | null>(null);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Top Banner */}
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
            <span>Care Coordination & Referral Continuum</span>
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
              <h1 className="text-base sm:text-lg font-extrabold text-slate-900 leading-tight">
                {t.referralTrackingTitle}
              </h1>
              <p className="text-[11px] text-slate-500 font-medium">
                {t.referralTrackingSub}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <LanguageSwitcher />
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-6xl mx-auto px-4 py-6 flex-1 w-full">
        <ReferralManager
          currentFacilityId="fac-001"
          onInitiateNewReferral={async () => {
            const patients = await PatientService.getPatients();
            if (patients.length > 0) setSelectedPatientForReferral(patients[0]);
          }}
          onViewHealthRecord={patientId => setSelectedPatientForRecord(patientId)}
        />
      </main>

      {/* Referral Creation Modal */}
      {selectedPatientForReferral && (
        <ReferralCreateModal
          isOpen={true}
          onClose={() => setSelectedPatientForReferral(null)}
          patient={selectedPatientForReferral}
          currentFacilityId="fac-001"
          onReferralCreated={() => {
            setSelectedPatientForReferral(null);
          }}
        />
      )}

      {/* Patient Longitudinal Health Record Modal */}
      {selectedPatientForRecord && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="max-w-3xl w-full">
            <LongitudinalHealthRecord
              patientId={selectedPatientForRecord}
              onClose={() => setSelectedPatientForRecord(null)}
            />
          </div>
        </div>
      )}
    </div>
  );
}
