import React from 'react';
import Link from 'next/link';
import { 
  Users, 
  Stethoscope, 
  GitPullRequest, 
  Activity, 
  Building2, 
  ShieldCheck, 
  WifiOff, 
  Languages,
  CalendarClock,
  ClipboardList
} from 'lucide-react';

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Top Government Header */}
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

      {/* Main Navigation Bar */}
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
            <span>AI-Assisted Clinical Triage & Care Coordination (Non-Diagnostic)</span>
          </div>

          <h2 className="text-2xl sm:text-4xl font-extrabold text-slate-900 tracking-tight leading-snug">
            ग्रामीण भागातील प्रत्येक नागरिकासाठी वेळेवर व दर्जेदार आरोग्य सेवा
          </h2>

          <p className="text-sm sm:text-base text-slate-700 max-w-2xl mx-auto leading-relaxed">
            Coordinating Citizens, ASHA/ANM field workers, Sub-Centres, PHCs, and District Hospitals across Maharashtra into a unified, low-connectivity care continuum.
          </p>

          {/* 4 Core Pillars */}
          <div className="pt-4 grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-3xl mx-auto text-left">
            <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-sm">
              <WifiOff className="w-5 h-5 text-teal-600 mb-1" />
              <h4 className="text-xs font-bold text-slate-900">Offline-First ASHA</h4>
              <p className="text-[11px] text-slate-600">Zero-connectivity registration & vitals screening</p>
            </div>
            <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-sm">
              <Activity className="w-5 h-5 text-red-600 mb-1" />
              <h4 className="text-xs font-bold text-slate-900">Clinical Triage</h4>
              <p className="text-[11px] text-slate-600">Emergency, Urgent & Routine priority assist</p>
            </div>
            <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-sm">
              <GitPullRequest className="w-5 h-5 text-amber-600 mb-1" />
              <h4 className="text-xs font-bold text-slate-900">Closed-Loop Referral</h4>
              <p className="text-[11px] text-slate-600">Sub-Centre to DH transfer & back-referral notes</p>
            </div>
            <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-sm">
              <CalendarClock className="w-5 h-5 text-blue-600 mb-1" />
              <h4 className="text-xs font-bold text-slate-900">Queue & Follow-Up</h4>
              <p className="text-[11px] text-slate-600">Triage-ordered OPD & ASHA reminder tasks</p>
            </div>
          </div>
        </div>
      </section>

      {/* Role-Based Workspaces */}
      <section className="py-10 px-4 max-w-5xl mx-auto w-full">
        <h3 className="text-lg font-bold text-slate-900 mb-6">
          भूमिका निहाय कार्यप्रवाह (Care Coordination Workflows)
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* ASHA / ANM */}
          <Link
            href="/asha"
            className="group bg-white p-5 rounded-xl border border-slate-200 hover:border-teal-400 hover:shadow-md transition-all space-y-3 block"
          >
            <div className="flex justify-between items-start">
              <div className="w-10 h-10 rounded-lg bg-pink-100 text-pink-700 flex items-center justify-center font-bold">
                <Users className="w-5 h-5" />
              </div>
              <span className="text-xs font-bold text-teal-700 group-hover:underline flex items-center">
                उघडा / Open &rarr;
              </span>
            </div>
            <div>
              <h4 className="font-bold text-slate-900 text-base group-hover:text-teal-700 transition-colors">
                आशा / एएनएम सेविका (ASHA Field Workspace)
              </h4>
              <p className="text-xs text-slate-600 mt-1">
                Offline patient intake, vitals recording, danger sign alerts, and scheduled home follow-up tasks.
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <span className="inline-block text-xs font-semibold text-teal-700 bg-teal-50 px-2.5 py-1 rounded">
                Offline-First PWA Active
              </span>
            </div>
          </Link>

          {/* Doctor / PHC */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 hover:border-teal-400 hover:shadow-md transition-all space-y-3">
            <div className="w-10 h-10 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
              <Stethoscope className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold text-slate-900 text-base">वैद्यकीय अधिकारी (PHC Doctor & OPD Queue)</h4>
              <p className="text-xs text-slate-600 mt-1">
                Triage-prioritized OPD queue, longitudinal health records, diagnostic orders, and rural teleconsultation.
              </p>
            </div>
            <span className="inline-block text-xs font-semibold text-blue-700 bg-blue-50 px-2.5 py-1 rounded">
              Triage Queue & Teleconsult
            </span>
          </div>

          {/* Referral Coordination */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 hover:border-teal-400 hover:shadow-md transition-all space-y-3">
            <div className="w-10 h-10 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center font-bold">
              <GitPullRequest className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold text-slate-900 text-base">संदर्भ सेवा (Closed-Loop Referral Tracking)</h4>
              <p className="text-xs text-slate-600 mt-1">
                Sub-Centre / PHC to District Hospital transfers, receiving hospital intake, and discharge counter-referral to ASHA.
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
                Longitudinal health timeline, OPD appointment token status, and facility/service discovery.
              </p>
            </div>
            <span className="inline-block text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded">
              ABHA Ready
            </span>
          </div>

          {/* Government / Facility Visibility */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 hover:border-teal-400 hover:shadow-md transition-all space-y-3 md:col-span-2 lg:col-span-2">
            <div className="w-10 h-10 rounded-lg bg-purple-100 text-purple-700 flex items-center justify-center font-bold">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold text-slate-900 text-base">आरोग्य नियंत्रण कक्ष (Facility & District Dashboard)</h4>
              <p className="text-xs text-slate-600 mt-1">
                Taluka-wise referral completion rates, triage urgency distribution, ASHA follow-up compliance, and facility service utilization across Maharashtra districts.
              </p>
            </div>
            <span className="inline-block text-xs font-semibold text-purple-700 bg-purple-50 px-2.5 py-1 rounded">
              Administrative Health Intelligence
            </span>
          </div>
        </div>
      </section>

      {/* Clinical Disclaimer */}
      <footer className="mt-auto bg-slate-100 border-t border-slate-200 py-6 px-4 text-center text-xs text-slate-600 space-y-2">
        <div className="max-w-4xl mx-auto">
          <p className="font-semibold text-slate-700">
            ⚠️ वैधानिक सूचना (Clinical Disclaimer):
          </p>
          <p className="mt-1 text-slate-500 leading-relaxed">
            CAREGRID Clinical Triage Assist is an assistive decision-support algorithm designed to help certified healthcare workers prioritize clinical urgency in rural Maharashtra. It does NOT diagnose medical conditions or replace clinical examination by a licensed medical officer.
          </p>
          <div className="pt-3 text-slate-400 text-[11px]">
            Smart India Hackathon 2026 • SIH26133 • Government of Maharashtra • Team The Glitch Gang (129855)
          </div>
        </div>
      </footer>
    </div>
  );
}
