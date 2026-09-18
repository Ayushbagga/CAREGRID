'use client';

import React, { useState, useEffect } from 'react';
import { useLanguage } from '@/lib/i18n/context';
import { useNetworkStatus } from '@/hooks/use-network-status';
import { OPDQueueManager } from '@/components/queue/opd-queue-manager';
import { FacilityDiscoveryView } from '@/components/facilities/facility-discovery-view';
import { TeleconsultRoom } from '@/components/teleconsult/teleconsult-room';
import { TriageAssessmentCard } from '@/components/triage/triage-assessment-card';
import { TriageService } from '@/lib/ai-client/triage-service';
import { 
  Stethoscope, 
  ListOrdered, 
  Building2, 
  Video, 
  ArrowLeft,
  Activity
} from 'lucide-react';
import Link from 'next/link';
import type { Patient, Appointment, TriageAssessment, Facility } from '@/types/healthcare';

export default function DoctorDashboardPage() {
  const { t, locale, setLocale } = useLanguage();
  const { isOnline } = useNetworkStatus();

  const [activeTab, setActiveTab] = useState<'queue' | 'facilities' | 'teleconsult'>('queue');
  const [activeTeleconsultPatient, setActiveTeleconsultPatient] = useState<Patient | null>(null);
  const [activeAppointment, setActiveAppointment] = useState<Appointment | null>(null);
  const [triageAssessment, setTriageAssessment] = useState<TriageAssessment | null>(null);

  const PHC_FACILITY_ID = '11111111-0000-0000-0000-000000000002'; // PHC Bhamragad

  const handleLaunchTeleconsult = async (patient: Patient, appointment: Appointment) => {
    setActiveTeleconsultPatient(patient);
    setActiveAppointment(appointment);

    // Compute or fetch Triage Assessment for this patient
    const assessment = await TriageService.assessUrgency({
      patient,
      symptoms: patient.high_risk_pregnancy ? ['severeHeadache', 'breathlessness'] : ['fever']
    });
    setTriageAssessment(assessment);

    setActiveTab('teleconsult');
  };

  const handleBookTokenFromFacility = (facility: Facility) => {
    setActiveTab('queue');
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-xs">
        <div className="max-w-6xl mx-auto px-4 py-3 flex flex-wrap justify-between items-center gap-2">
          <div className="flex items-center space-x-3">
            <Link href="/" className="text-slate-400 hover:text-slate-600 p-1 rounded">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="text-base sm:text-lg font-extrabold text-slate-900 leading-tight">
                {t.doctorDashboard}
              </h1>
              <p className="text-[11px] text-slate-500 font-medium">
                Dr. Anand Patil (Medical Officer) • PHC Bhamragad, Gadchiroli
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <span className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${
              isOnline ? 'bg-teal-50 text-teal-800 border-teal-200' : 'bg-amber-50 text-amber-800 border-amber-300'
            }`}>
              {isOnline ? 'Online' : 'Offline Mode'}
            </span>

            <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200 text-xs">
              <button
                type="button"
                onClick={() => setLocale('mr')}
                className={`px-2 py-1 rounded font-bold transition-colors ${
                  locale === 'mr' ? 'bg-teal-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                मराठी
              </button>
              <button
                type="button"
                onClick={() => setLocale('hi')}
                className={`px-2 py-1 rounded font-bold transition-colors ${
                  locale === 'hi' ? 'bg-teal-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                हिंदी
              </button>
              <button
                type="button"
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
      <main className="max-w-6xl mx-auto px-4 py-5 flex-1 w-full space-y-5">
        {/* Navigation Tabs */}
        <div className="flex space-x-2 border-b border-slate-200 pb-2">
          <button
            type="button"
            onClick={() => setActiveTab('queue')}
            className={`px-4 py-2 rounded-lg text-xs font-bold flex items-center space-x-1.5 transition-colors ${
              activeTab === 'queue'
                ? 'bg-teal-600 text-white shadow-sm'
                : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            <ListOrdered className="w-4 h-4" />
            <span>{t.opdQueueTab}</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('facilities')}
            className={`px-4 py-2 rounded-lg text-xs font-bold flex items-center space-x-1.5 transition-colors ${
              activeTab === 'facilities'
                ? 'bg-teal-600 text-white shadow-sm'
                : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            <Building2 className="w-4 h-4" />
            <span>{t.facilityDiscoveryTab}</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('teleconsult')}
            className={`px-4 py-2 rounded-lg text-xs font-bold flex items-center space-x-1.5 transition-colors ${
              activeTab === 'teleconsult'
                ? 'bg-teal-600 text-white shadow-sm'
                : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            <Video className="w-4 h-4" />
            <span>{t.teleconsultTab}</span>
          </button>
        </div>

        {/* Tab 1: OPD Queue */}
        {activeTab === 'queue' && (
          <div className="space-y-4">
            <OPDQueueManager
              facilityId={PHC_FACILITY_ID}
              onLaunchTeleconsult={handleLaunchTeleconsult}
            />
          </div>
        )}

        {/* Tab 2: Facility & Service Discovery */}
        {activeTab === 'facilities' && (
          <FacilityDiscoveryView onBookToken={handleBookTokenFromFacility} />
        )}

        {/* Tab 3: Rural Teleconsultation */}
        {activeTab === 'teleconsult' && (
          <div className="space-y-4">
            {activeTeleconsultPatient ? (
              <>
                {triageAssessment && (
                  <TriageAssessmentCard
                    assessment={triageAssessment}
                    patientName={activeTeleconsultPatient.full_name}
                    onTierOverridden={(newTier, reason) => {
                      if (activeAppointment) {
                        activeAppointment.queue_tier = newTier;
                      }
                    }}
                  />
                )}

                <TeleconsultRoom
                  patient={activeTeleconsultPatient}
                  appointment={activeAppointment || undefined}
                  onEndConsultation={() => setActiveTab('queue')}
                />
              </>
            ) : (
              <div className="bg-white p-8 rounded-xl border border-slate-200 text-center space-y-3">
                <Video className="w-10 h-10 text-slate-400 mx-auto" />
                <h4 className="font-bold text-slate-800 text-sm">No Active Teleconsultation Selected</h4>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  Go to the Digital OPD Queue and click <strong>&quot;Launch Teleconsult&quot;</strong> on an active patient to start a live rural teleconsultation session.
                </p>
                <button
                  type="button"
                  onClick={() => setActiveTab('queue')}
                  className="px-4 py-2 bg-teal-600 text-white text-xs font-bold rounded-lg shadow-xs"
                >
                  View OPD Queue
                </button>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
