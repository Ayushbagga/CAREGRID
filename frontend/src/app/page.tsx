'use client';

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
  CalendarClock
} from 'lucide-react';
import { useLanguage } from '@/lib/i18n/context';
import { LanguageSwitcher } from '@/components/shared/language-switcher';

export default function HomePage() {
  const { t } = useLanguage();

  return (
    <div className="min-h-screen flex flex-col">
      {/* Top Government Header */}
      <div className="bg-slate-900 text-slate-300 text-xs py-2 px-4 border-b border-slate-800">
        <div className="max-w-6xl mx-auto flex flex-wrap justify-between items-center gap-2">
          <div className="flex items-center space-x-2">
            <span className="font-semibold text-white">{t.homeGovState}</span>
            <span className="text-slate-500">|</span>
            <span>{t.homeGovDept}</span>
          </div>
          <div className="flex items-center space-x-4 text-slate-400">
            <span>SIH26133</span>
            <span>•</span>
            <span>Team: The Glitch Gang (129855)</span>
          </div>
        </div>
      </div>

      {/* Main Navigation Bar */}
      <header className="bg-white border-b border-slate-200 py-4 px-4 sticky top-0 z-40 shadow-xs">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-lg bg-teal-600 text-white flex items-center justify-center font-black text-xl shadow-md">
              CG
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900 leading-tight">{t.appTitle}</h1>
              <p className="text-xs text-slate-600">{t.appSubtitle}</p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <LanguageSwitcher />
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="bg-gradient-to-b from-teal-50 to-white py-12 px-4 border-b border-teal-100/60">
        <div className="max-w-4xl mx-auto text-center space-y-4">
          <div className="inline-flex items-center space-x-2 bg-teal-100 text-teal-800 text-xs px-3 py-1 rounded-full font-semibold">
            <ShieldCheck className="w-4 h-4" />
            <span>{t.homeHeroBadge}</span>
          </div>

          <h2 className="text-2xl sm:text-4xl font-extrabold text-slate-900 tracking-tight leading-snug">
            {t.homeHeroTitle}
          </h2>

          <p className="text-sm sm:text-base text-slate-700 max-w-2xl mx-auto leading-relaxed">
            {t.homeHeroSubtitle}
          </p>

          {/* 4 Core Pillars */}
          <div className="pt-4 grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-3xl mx-auto text-left">
            <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-xs">
              <WifiOff className="w-5 h-5 text-teal-600 mb-1" />
              <h4 className="text-xs font-bold text-slate-900">{t.homePillarOfflineTitle}</h4>
              <p className="text-[11px] text-slate-600">{t.homePillarOfflineDesc}</p>
            </div>
            <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-xs">
              <Activity className="w-5 h-5 text-red-600 mb-1" />
              <h4 className="text-xs font-bold text-slate-900">{t.homePillarTriageTitle}</h4>
              <p className="text-[11px] text-slate-600">{t.homePillarTriageDesc}</p>
            </div>
            <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-xs">
              <GitPullRequest className="w-5 h-5 text-amber-600 mb-1" />
              <h4 className="text-xs font-bold text-slate-900">{t.homePillarReferralTitle}</h4>
              <p className="text-[11px] text-slate-600">{t.homePillarReferralDesc}</p>
            </div>
            <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-xs">
              <CalendarClock className="w-5 h-5 text-blue-600 mb-1" />
              <h4 className="text-xs font-bold text-slate-900">{t.homePillarQueueTitle}</h4>
              <p className="text-[11px] text-slate-600">{t.homePillarQueueDesc}</p>
            </div>
          </div>
        </div>
      </section>

      {/* Role-Based Workspaces */}
      <section className="py-10 px-4 max-w-5xl mx-auto w-full">
        <h3 className="text-lg font-bold text-slate-900 mb-6">
          {t.homeWorkflowsTitle}
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
                {t.homeOpenPortalBtn}
              </span>
            </div>
            <div>
              <h4 className="font-bold text-slate-900 text-base group-hover:text-teal-700 transition-colors">
                {t.homeAshaRoleTitle}
              </h4>
              <p className="text-xs text-slate-600 mt-1">
                {t.homeAshaRoleDesc}
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <span className="inline-block text-xs font-semibold text-teal-700 bg-teal-50 px-2.5 py-1 rounded">
                {t.homeAshaRoleBadge}
              </span>
            </div>
          </Link>

          {/* Doctor / PHC */}
          <Link
            href="/doctor"
            className="group bg-white p-5 rounded-xl border border-slate-200 hover:border-teal-400 hover:shadow-md transition-all space-y-3 block"
          >
            <div className="flex justify-between items-start">
              <div className="w-10 h-10 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
                <Stethoscope className="w-5 h-5" />
              </div>
              <span className="text-xs font-bold text-teal-700 group-hover:underline flex items-center">
                {t.homeOpenPortalBtn}
              </span>
            </div>
            <div>
              <h4 className="font-bold text-slate-900 text-base group-hover:text-teal-700 transition-colors">
                {t.homeDoctorRoleTitle}
              </h4>
              <p className="text-xs text-slate-600 mt-1">
                {t.homeDoctorRoleDesc}
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <span className="inline-block text-xs font-semibold text-blue-700 bg-blue-50 px-2.5 py-1 rounded">
                {t.homeDoctorRoleBadge}
              </span>
            </div>
          </Link>

          {/* Referral Coordination */}
          <Link
            href="/referrals"
            className="group bg-white p-5 rounded-xl border border-slate-200 hover:border-teal-400 hover:shadow-md transition-all space-y-3 block"
          >
            <div className="flex justify-between items-start">
              <div className="w-10 h-10 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center font-bold">
                <GitPullRequest className="w-5 h-5" />
              </div>
              <span className="text-xs font-bold text-teal-700 group-hover:underline flex items-center">
                {t.homeOpenPortalBtn}
              </span>
            </div>
            <div>
              <h4 className="font-bold text-slate-900 text-base group-hover:text-teal-700 transition-colors">
                {t.homeReferralRoleTitle}
              </h4>
              <p className="text-xs text-slate-600 mt-1">
                {t.homeReferralRoleDesc}
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <span className="inline-block text-xs font-semibold text-amber-700 bg-amber-50 px-2.5 py-1 rounded">
                {t.homeReferralRoleBadge}
              </span>
            </div>
          </Link>

          {/* Citizen */}
          <Link
            href="/citizen"
            className="group bg-white p-5 rounded-xl border border-slate-200 hover:border-teal-400 hover:shadow-md transition-all space-y-3 block"
          >
            <div className="flex justify-between items-start">
              <div className="w-10 h-10 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
                <Activity className="w-5 h-5" />
              </div>
              <span className="text-xs font-bold text-teal-700 group-hover:underline flex items-center">
                {t.homeOpenPortalBtn}
              </span>
            </div>
            <div>
              <h4 className="font-bold text-slate-900 text-base group-hover:text-teal-700 transition-colors">
                {t.homeCitizenRoleTitle}
              </h4>
              <p className="text-xs text-slate-600 mt-1">
                {t.homeCitizenRoleDesc}
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <span className="inline-block text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded">
                {t.homeCitizenRoleBadge}
              </span>
            </div>
          </Link>

          {/* Government / Facility Visibility */}
          <Link
            href="/admin"
            className="group bg-white p-5 rounded-xl border border-slate-200 hover:border-teal-400 hover:shadow-md transition-all space-y-3 block md:col-span-2 lg:col-span-2"
          >
            <div className="flex justify-between items-start">
              <div className="w-10 h-10 rounded-lg bg-purple-100 text-purple-700 flex items-center justify-center font-bold">
                <Building2 className="w-5 h-5" />
              </div>
              <span className="text-xs font-bold text-teal-700 group-hover:underline flex items-center">
                {t.homeOpenPortalBtn}
              </span>
            </div>
            <div>
              <h4 className="font-bold text-slate-900 text-base group-hover:text-teal-700 transition-colors">
                {t.homeAdminRoleTitle}
              </h4>
              <p className="text-xs text-slate-600 mt-1">
                {t.homeAdminRoleDesc}
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <span className="inline-block text-xs font-semibold text-purple-700 bg-purple-50 px-2.5 py-1 rounded">
                {t.homeAdminRoleBadge}
              </span>
            </div>
          </Link>
        </div>
      </section>

      {/* Clinical Disclaimer */}
      <footer className="mt-auto bg-slate-100 border-t border-slate-200 py-6 px-4 text-center text-xs text-slate-600 space-y-2">
        <div className="max-w-4xl mx-auto">
          <p className="font-semibold text-slate-700">
            {t.homeDisclaimerHeading}
          </p>
          <p className="mt-1 text-slate-500 leading-relaxed">
            {t.homeDisclaimerBody}
          </p>
          <div className="pt-3 text-slate-400 text-[11px]">
            {t.homeFooterTeamMeta}
          </div>
        </div>
      </footer>
    </div>
  );
}
