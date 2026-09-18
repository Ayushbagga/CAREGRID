'use client';

import React, { useState, useEffect } from 'react';
import { useLanguage } from '@/lib/i18n/context';
import { PatientService } from '@/lib/offline-sync/patient-service';
import { LongitudinalHealthRecord } from '@/components/records/longitudinal-health-record';
import { PatientRemindersModal } from '@/components/records/patient-reminders-modal';
import type { Patient } from '@/types/healthcare';
import { 
  Activity, 
  Bell, 
  HeartHandshake, 
  ArrowLeft, 
  Languages, 
  ShieldCheck, 
  UserCheck, 
  CreditCard,
  QrCode,
  Calendar
} from 'lucide-react';
import Link from 'next/link';

export default function CitizenPortalPage() {
  const { t, locale, setLocale } = useLanguage();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [selectedPatientId, setSelectedPatientId] = useState<string>('');
  const [isRemindersOpen, setIsRemindersOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const all = await PatientService.getPatients();
        setPatients(all);
        if (all.length > 0) {
          setSelectedPatientId(all[0].id);
        }
      } catch (err) {
        console.error('Failed to load patients:', err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const currentPatient = patients.find(p => p.id === selectedPatientId) || patients[0];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Top Government Banner */}
      <div className="bg-slate-900 text-slate-300 text-xs py-2 px-4 border-b border-slate-800">
        <div className="max-w-5xl mx-auto flex flex-wrap justify-between items-center gap-2">
          <div className="flex items-center space-x-2">
            <span className="font-semibold text-white">महाराष्ट्र शासन</span>
            <span className="text-slate-500">|</span>
            <span>{t.governmentTag}</span>
          </div>
          <div className="flex items-center space-x-3 text-slate-400">
            <span>आयुष्मान भारत डिजिटल मिशन (ABDM) सक्षम</span>
          </div>
        </div>
      </div>

      {/* Main Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-xs">
        <div className="max-w-5xl mx-auto px-4 py-3 flex flex-wrap justify-between items-center gap-2">
          <div className="flex items-center space-x-3">
            <Link href="/" className="text-slate-400 hover:text-slate-600 p-1 rounded">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="text-base sm:text-lg font-extrabold text-slate-900 leading-tight">
                नागरिक आरोग्य पोर्टल (Citizen Health Portal)
              </h1>
              <p className="text-[11px] text-slate-500 font-medium">
                आपला वैयक्तिक आरोग्य इतिहास व फॉलो-अप स्मरणपत्रे
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {/* Patient Switcher */}
            {patients.length > 1 && (
              <select
                value={selectedPatientId}
                onChange={e => setSelectedPatientId(e.target.value)}
                className="text-xs bg-slate-50 border border-slate-200 rounded-lg py-1 px-2 font-semibold text-slate-800 focus:outline-hidden"
              >
                {patients.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.full_name} ({p.village})
                  </option>
                ))}
              </select>
            )}

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
      <main className="max-w-5xl mx-auto px-4 py-6 flex-1 w-full space-y-5">
        {loading ? (
          <div className="bg-white p-8 rounded-xl border border-slate-200 text-center text-xs text-slate-500">
            Loading citizen profile...
          </div>
        ) : !currentPatient ? (
          <div className="bg-white p-8 rounded-xl border border-slate-200 text-center text-xs text-slate-500">
            कोणताही नागरिक आढळला नाही. प्रथम आशा कार्यक्षेत्रात जाऊन नागरिक नोंदणी करा.
          </div>
        ) : (
          <>
            {/* ABHA Digital Health Card */}
            <div className="bg-gradient-to-r from-teal-800 via-teal-900 to-slate-900 rounded-2xl text-white p-5 shadow-lg relative overflow-hidden">
              <div className="flex flex-wrap justify-between items-start gap-4 relative z-10">
                <div className="space-y-2">
                  <div className="flex items-center space-x-2 text-xs text-teal-300 font-bold uppercase tracking-wider">
                    <CreditCard className="w-4 h-4" />
                    <span>राष्ट्रीय आरोग्य प्राधिकरण (NHA) • आयुष्मान भारत डिजिटल मिशन</span>
                  </div>
                  <h2 className="text-xl font-black text-white tracking-wide">
                    {currentPatient.full_name}
                  </h2>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs pt-1">
                    <div>
                      <span className="text-teal-300/80 block text-[10px]">आभा क्रमांक (ABHA ID)</span>
                      <span className="font-mono font-bold">{currentPatient.abha_id || '91-4521-9874-1234'}</span>
                    </div>
                    <div>
                      <span className="text-teal-300/80 block text-[10px]">वय / लिंग (Age / Gender)</span>
                      <span className="font-semibold">{currentPatient.estimated_age} वर्षे • {currentPatient.gender.toUpperCase()}</span>
                    </div>
                    <div>
                      <span className="text-teal-300/80 block text-[10px]">गाव / पत्ता (Village)</span>
                      <span className="font-semibold">{currentPatient.village}, {currentPatient.taluka}</span>
                    </div>
                  </div>
                </div>

                {/* Quick Reminders Action Card */}
                <div className="flex flex-col items-end space-y-2">
                  <button
                    onClick={() => setIsRemindersOpen(true)}
                    className="px-4 py-2 bg-pink-500 hover:bg-pink-600 text-white rounded-xl text-xs font-bold shadow-md flex items-center space-x-1.5 transition-all transform hover:scale-105"
                  >
                    <Bell className="w-4 h-4 animate-bounce" />
                    <span>{t.patientRemindersTitle}</span>
                  </button>
                  <span className="text-[10px] text-teal-200">
                    फॉलो-अप व गृहभेट वेळापत्रक
                  </span>
                </div>
              </div>

              {/* Background watermark */}
              <div className="absolute right-3 bottom-0 opacity-10 text-white pointer-events-none">
                <ShieldCheck className="w-48 h-48 -mb-10 -mr-10" />
              </div>
            </div>

            {/* Longitudinal Health Timeline */}
            <div className="space-y-2">
              <h3 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
                <Activity className="w-4 h-4 text-teal-600" />
                <span>{t.longitudinalRecordTitle}</span>
              </h3>
              <LongitudinalHealthRecord patientId={currentPatient.id} />
            </div>

            {/* Reminders Modal */}
            <PatientRemindersModal
              isOpen={isRemindersOpen}
              onClose={() => setIsRemindersOpen(false)}
              patient={currentPatient}
            />
          </>
        )}
      </main>
    </div>
  );
}
