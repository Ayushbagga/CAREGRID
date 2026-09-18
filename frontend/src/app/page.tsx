import React from 'react';
import Link from 'next/link';
import { 
  Users, 
  Stethoscope, 
  Ambulance, 
  Activity, 
  Building2, 
  ShieldCheck, 
  WifiOff, 
  Languages 
} from 'lucide-react';

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Top Government Banner */}
      <div className="bg-slate-900 text-slate-300 text-xs py-2 px-4 border-b border-slate-800">
        <div className="max-w-6xl mx-auto flex flex-wrap justify-between items-center gap-2">
          <div className="flex items-center space-x-2">
            <span className="font-semibold text-white">महाराष्ट्र शासन</span>
            <span className="text-slate-500">|</span>
            <span>सार्वजनिक आरोग्य विभाग (Arogya Vibhag)</span>
          </div>
          <div className="flex items-center space-x-4 text-slate-400">
            <span>SIH26133</span>
            <span>•</span>
            <span>Team: The Glitch Gang (129855)</span>
          </div>
        </div>
      </div>

      {/* Main Header */}
      <header className="bg-white border-b border-slate-200 py-4 px-4 sticky top-0 z-40">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-lg bg-teal-600 text-white flex items-center justify-center font-black text-xl shadow-md">
              CG
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900 leading-tight">केअरग्रिड / CAREGRID</h1>
              <p className="text-xs text-slate-600">Rural Healthcare Access & Care Coordination</p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <div className="flex items-center space-x-1 text-xs bg-slate-100 px-3 py-1.5 rounded-md text-slate-700">
              <Languages className="w-3.5 h-3.5 text-slate-500" />
              <span className="font-medium">मराठी / EN</span>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="bg-gradient-to-b from-teal-50 to-white py-12 px-4 border-b border-teal-100/60">
        <div className="max-w-4xl mx-auto text-center space-y-4">
          <div className="inline-flex items-center space-x-2 bg-teal-100 text-teal-800 text-xs px-3 py-1 rounded-full font-semibold">
            <ShieldCheck className="w-4 h-4" />
            <span>AI-Assisted Clinical Triage & Care Continuity (Non-Diagnostic)</span>
          </div>

          <h2 className="text-2xl sm:text-4xl font-extrabold text-slate-900 tracking-tight leading-snug">
            ग्रामीण भागातील प्रत्येक नागरिकासाठी वेळेवर व दर्जेदार आरोग्य सेवा
          </h2>

          <p className="text-sm sm:text-base text-slate-700 max-w-2xl mx-auto leading-relaxed">
            Connecting Citizens, ASHA/ANM field workers, Sub-Centres, PHCs, and District Hospitals across Maharashtra into a unified, offline-resilient care continuum.
          </p>

          {/* Core Architectural Highlights */}
          <div className="pt-4 grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-3xl mx-auto text-left">
            <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-sm">
              <WifiOff className="w-5 h-5 text-teal-600 mb-1" />
              <h4 className="text-xs font-bold text-slate-900">Offline-First PWA</h4>
              <p className="text-[11px] text-slate-600">Zero-connectivity local caching & background sync</p>
            </div>
            <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-sm">
              <Activity className="w-5 h-5 text-red-600 mb-1" />
              <h4 className="text-xs font-bold text-slate-900">Clinical Triage</h4>
              <p className="text-[11px] text-slate-600">Emergency, Urgent & Routine non-diagnostic tiering</p>
            </div>
            <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-sm">
              <Ambulance className="w-5 h-5 text-amber-600 mb-1" />
              <h4 className="text-xs font-bold text-slate-900">Closed-Loop Referral</h4>
              <p className="text-[11px] text-slate-600">PHC to District Hospital with return discharge notes</p>
            </div>
            <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-sm">
              <Building2 className="w-5 h-5 text-blue-600 mb-1" />
              <h4 className="text-xs font-bold text-slate-900">Facility Visibility</h4>
              <p className="text-[11px] text-slate-600">Live beds, specialists & emergency services</p>
            </div>
          </div>
        </div>
      </section>

      {/* Role-Based Portals */}
      <section className="py-10 px-4 max-w-5xl mx-auto w-full">
        <h3 className="text-lg font-bold text-slate-900 mb-6 flex items-center space-x-2">
          <span>भूमिका निहाय कार्यप्रवाह (Role-Based Workflows)</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* ASHA / ANM */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 hover:border-teal-400 hover:shadow-md transition-all space-y-3">
            <div className="w-10 h-10 rounded-lg bg-pink-100 text-pink-700 flex items-center justify-center font-bold">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold text-slate-900 text-base">आशा / एएनएम सेविका (ASHA Workspace)</h4>
              <p className="text-xs text-slate-600 mt-1">
                Offline registration, vitals screening, high-risk pregnancy alerts, and follow-up schedules.
              </p>
            </div>
            <span className="inline-block text-xs font-semibold text-teal-700 bg-teal-50 px-2.5 py-1 rounded">
              Offline PWA Enabled
            </span>
          </div>

          {/* Doctor / PHC */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 hover:border-teal-400 hover:shadow-md transition-all space-y-3">
            <div className="w-10 h-10 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
              <Stethoscope className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold text-slate-900 text-base">वैद्यकीय अधिकारी (Doctor & PHC OPD)</h4>
              <p className="text-xs text-slate-600 mt-1">
                Triage-prioritized digital queue, clinical timeline, rural teleconsultation, and e-prescriptions.
              </p>
            </div>
            <span className="inline-block text-xs font-semibold text-blue-700 bg-blue-50 px-2.5 py-1 rounded">
              Queue & Teleconsult
            </span>
          </div>

          {/* Referral & Facility */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 hover:border-teal-400 hover:shadow-md transition-all space-y-3">
            <div className="w-10 h-10 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center font-bold">
              <Ambulance className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold text-slate-900 text-base">संदर्भ सेवा (Closed-Loop Referral)</h4>
              <p className="text-xs text-slate-600 mt-1">
                Transfer tracking from Sub-Centre to District Hospital, 108 ambulance dispatch, and back-referral.
              </p>
            </div>
            <span className="inline-block text-xs font-semibold text-amber-700 bg-amber-50 px-2.5 py-1 rounded">
              Closed-Loop Tracking
            </span>
          </div>

          {/* Citizen */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 hover:border-teal-400 hover:shadow-md transition-all space-y-3">
            <div className="w-10 h-10 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold text-slate-900 text-base">नागरिक सेवा (Citizen Health Portal)</h4>
              <p className="text-xs text-slate-600 mt-1">
                Longitudinal records, OPD appointment token status, nearby PHC discovery, and health reminders.
              </p>
            </div>
            <span className="inline-block text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded">
              ABHA Ready
            </span>
          </div>

          {/* Government Dashboard */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 hover:border-teal-400 hover:shadow-md transition-all space-y-3 md:col-span-2 lg:col-span-2">
            <div className="w-10 h-10 rounded-lg bg-purple-100 text-purple-700 flex items-center justify-center font-bold">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold text-slate-900 text-base">जिल्हा व राज्य नियंत्रण कक्ष (Health Intelligence)</h4>
              <p className="text-xs text-slate-600 mt-1">
                Epidemiological surveillance, taluka-level referral bottlenecks, facility bed availability, and maternal health metrics for Maharashtra state health authorities.
              </p>
            </div>
            <span className="inline-block text-xs font-semibold text-purple-700 bg-purple-50 px-2.5 py-1 rounded">
              Real-time Public Health Intelligence
            </span>
          </div>
        </div>
      </section>

      {/* Clinical Disclaimer Footer */}
      <footer className="mt-auto bg-slate-100 border-t border-slate-200 py-6 px-4 text-center text-xs text-slate-600 space-y-2">
        <div className="max-w-4xl mx-auto">
          <p className="font-semibold text-slate-700">
            ⚠️ वैधानिक सूचना (Clinical Disclaimer):
          </p>
          <p className="mt-1 text-slate-500 leading-relaxed">
            CAREGRID Clinical Triage Assist is an assistive decision-support algorithm designed to help certified healthcare workers prioritize clinical urgency in rural Maharashtra. It does NOT replace clinical examination or doctor's diagnosis.
          </p>
          <div className="pt-3 text-slate-400 text-[11px]">
            Smart India Hackathon 2026 • SIH26133 • Government of Maharashtra • Team The Glitch Gang (129855)
          </div>
        </div>
      </footer>
    </div>
  );
}
