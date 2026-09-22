'use client';

import React, { Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { 
  ShieldAlert, 
  ArrowLeft, 
  LogOut, 
  Home, 
  ExternalLink,
  Lock,
  Loader2
} from 'lucide-react';
import { useLanguage } from '@/lib/i18n/context';
import { LanguageSwitcher } from '@/components/shared/language-switcher';
import { CareGridSymbol } from '@/components/shared/caregrid-logo';
import { useAuth } from '@/lib/auth';
import { CareGridRole, getWorkspaceForRole, normalizeRole } from '@/lib/auth/roles';

function UnauthorizedContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { t } = useLanguage();
  const { user, signOut } = useAuth();

  const roleParam = searchParams.get('role');
  const requiredParam = searchParams.get('required');
  const attemptedPath = searchParams.get('path') || 'Requested workspace';

  const userRole: CareGridRole = normalizeRole(roleParam) || 'citizen';
  const designatedWorkspace = getWorkspaceForRole(userRole);

  const handleSignOut = async () => {
    await signOut();
    router.push('/login');
    router.refresh();
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-between">
      {/* Top Government Header */}
      <div className="bg-slate-900 text-slate-300 text-xs py-2 px-4 border-b border-slate-800">
        <div className="max-w-4xl mx-auto flex flex-wrap justify-between items-center gap-2">
          <div className="flex items-center space-x-2">
            <span className="font-semibold text-white">{t.homeGovState}</span>
            <span className="text-slate-500">|</span>
            <span>{t.homeGovDept}</span>
          </div>
          <div className="flex items-center space-x-4 text-slate-400">
            <span>SIH26133</span>
            <span>•</span>
            <span>Team: The Glitch Gang</span>
          </div>
        </div>
      </div>

      {/* Main Bar */}
      <header className="bg-white border-b border-slate-200 py-3 px-4 shadow-xs">
        <div className="max-w-4xl mx-auto flex justify-between items-center">
          <Link href="/" className="flex items-center space-x-3 group">
            <CareGridSymbol className="w-9 h-9" />
            <div>
              <h1 className="text-lg font-bold text-slate-900 group-hover:text-teal-700 transition-colors">
                {t.appTitle}
              </h1>
              <p className="text-[11px] text-slate-500">{t.appSubtitle}</p>
            </div>
          </Link>

          <div className="flex items-center space-x-3">
            <LanguageSwitcher />
            <Link
              href="/"
              className="text-xs font-semibold text-slate-600 hover:text-teal-700 flex items-center space-x-1"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>{t.backToHome}</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Unauthorized Card Body */}
      <main className="flex-1 flex items-center justify-center p-4 py-12">
        <div className="max-w-lg w-full bg-white rounded-2xl border border-red-200 shadow-md p-6 sm:p-8 space-y-6">
          {/* Status Icon & Header */}
          <div className="text-center space-y-3">
            <div className="w-14 h-14 bg-red-100 text-red-600 rounded-2xl mx-auto flex items-center justify-center shadow-xs">
              <ShieldAlert className="w-8 h-8" />
            </div>

            <div className="inline-flex items-center space-x-1.5 bg-red-50 border border-red-200 text-red-700 text-xs px-3 py-1 rounded-full font-bold uppercase tracking-wider">
              <Lock className="w-3.5 h-3.5" />
              <span>HTTP 403 Forbidden</span>
            </div>

            <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">
              {t.unauthorizedTitle}
            </h2>

            <p className="text-xs text-slate-600 max-w-sm mx-auto leading-relaxed">
              {t.unauthorizedSubtitle}
            </p>
          </div>

          {/* Details Box */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-xs space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-slate-500">{t.unauthorizedRoleBadge}</span>
              <span className="font-semibold text-slate-800 bg-white border border-slate-200 px-2.5 py-0.5 rounded-md uppercase tracking-wider text-[11px]">
                {userRole}
              </span>
            </div>

            {requiredParam && (
              <div className="flex items-center justify-between">
                <span className="text-slate-500">{t.unauthorizedRequiredBadge}</span>
                <span className="font-semibold text-amber-700 bg-amber-50 border border-amber-200 px-2.5 py-0.5 rounded-md uppercase tracking-wider text-[11px]">
                  {requiredParam}
                </span>
              </div>
            )}

            <div className="flex items-center justify-between pt-1 border-t border-slate-200/60">
              <span className="text-slate-500">Attempted Path:</span>
              <span className="font-mono text-slate-700 text-[11px] truncate max-w-[200px]">{attemptedPath}</span>
            </div>

            {user?.email && (
              <div className="flex items-center justify-between">
                <span className="text-slate-500">{t.loggedInAs}</span>
                <span className="font-mono text-slate-700 text-[11px] truncate max-w-[200px]">{user.email}</span>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="space-y-2 pt-2">
            <Link
              href={designatedWorkspace}
              className="w-full bg-teal-600 hover:bg-teal-700 text-white font-bold py-2.5 px-4 rounded-xl text-xs flex items-center justify-center space-x-2 transition-all shadow-xs"
            >
              <ExternalLink className="w-4 h-4" />
              <span>{t.unauthorizedGoToWorkspace} ({userRole})</span>
            </Link>

            <button
              type="button"
              onClick={handleSignOut}
              className="w-full bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 font-semibold py-2.5 px-4 rounded-xl text-xs flex items-center justify-center space-x-2 transition-all"
            >
              <LogOut className="w-4 h-4 text-slate-500" />
              <span>{t.unauthorizedSwitchAccount}</span>
            </button>

            <Link
              href="/"
              className="w-full text-slate-500 hover:text-slate-800 text-center text-xs py-2 flex items-center justify-center space-x-1.5 transition-colors font-medium"
            >
              <Home className="w-3.5 h-3.5" />
              <span>{t.unauthorizedReturnHome}</span>
            </Link>
          </div>

          {/* Institutional Advisory */}
          <div className="border-t border-slate-100 pt-3 text-center">
            <p className="text-[11px] text-slate-500">
              Government of Maharashtra • SIH26133 Clinical Access Governance
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-slate-100 border-t border-slate-200 py-3 px-4 text-center text-xs text-slate-500">
        <p className="text-[11px]">{t.homeFooterTeamMeta}</p>
      </footer>
    </div>
  );
}

export default function UnauthorizedPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-slate-50">
          <Loader2 className="w-8 h-8 animate-spin text-teal-600" />
        </div>
      }
    >
      <UnauthorizedContent />
    </Suspense>
  );
}
