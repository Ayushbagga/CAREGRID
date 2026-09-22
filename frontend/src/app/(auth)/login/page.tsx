'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { 
  ShieldCheck, 
  Mail, 
  KeyRound, 
  ArrowLeft, 
  CheckCircle2, 
  AlertCircle, 
  Loader2, 
  LogOut,
  Send,
  Lock
} from 'lucide-react';
import { useLanguage } from '@/lib/i18n/context';
import { LanguageSwitcher } from '@/components/shared/language-switcher';
import { CareGridSymbol } from '@/components/shared/caregrid-logo';
import { createClient as createBrowserClient } from '@/lib/supabase/client';
import { useAuth } from '@/lib/auth';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTarget = searchParams.get('redirect') || '/';

  const { t } = useLanguage();
  const { user, isAuthenticated, loading: authLoading, signOut } = useAuth();

  const [authMode, setAuthMode] = useState<'otp' | 'password'>('otp');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [otpStep, setOtpStep] = useState<'request' | 'verify'>('request');

  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Clear messages on mode switch
  useEffect(() => {
    setErrorMsg(null);
    setSuccessMsg(null);
  }, [authMode]);

  // Handle Send OTP
  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    const cleanEmail = email.trim();
    if (!cleanEmail || !cleanEmail.includes('@')) {
      setErrorMsg(t.loginEmailPlaceholder || 'Please enter a valid email address.');
      return;
    }

    try {
      setSubmitting(true);
      const supabase = createBrowserClient();
      const { error } = await supabase.auth.signInWithOtp({
        email: cleanEmail,
        options: {
          shouldCreateUser: true,
        },
      });

      if (error) {
        setErrorMsg(error.message);
      } else {
        setOtpStep('verify');
        setSuccessMsg(t.otpSentNotice);
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to send verification code.';
      setErrorMsg(message);
    } finally {
      setSubmitting(false);
    }
  };

  // Handle Verify OTP
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    const cleanOtp = otpCode.trim();
    if (!cleanOtp || cleanOtp.length < 6) {
      setErrorMsg(t.enterOtpLabel);
      return;
    }

    try {
      setSubmitting(true);
      const supabase = createBrowserClient();
      const { data, error } = await supabase.auth.verifyOtp({
        email: email.trim(),
        token: cleanOtp,
        type: 'email',
      });

      if (error) {
        setErrorMsg(t.loginErrorInvalidOtp || error.message);
      } else if (data.session) {
        setSuccessMsg(t.loginSuccessNotice);
        setTimeout(() => {
          router.push(redirectTarget);
          router.refresh();
        }, 800);
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'OTP verification failed.';
      setErrorMsg(message);
    } finally {
      setSubmitting(false);
    }
  };

  // Handle Password Login
  const handlePasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    const cleanEmail = email.trim();
    if (!cleanEmail || !cleanEmail.includes('@')) {
      setErrorMsg(t.loginEmailPlaceholder || 'Please enter a valid email address.');
      return;
    }

    if (!password) {
      setErrorMsg(t.loginPasswordLabel);
      return;
    }

    try {
      setSubmitting(true);
      const supabase = createBrowserClient();
      const { data, error } = await supabase.auth.signInWithPassword({
        email: cleanEmail,
        password: password,
      });

      if (error) {
        setErrorMsg(t.loginErrorInvalidCredentials || error.message);
      } else if (data.session) {
        setSuccessMsg(t.loginSuccessNotice);
        setTimeout(() => {
          router.push(redirectTarget);
          router.refresh();
        }, 800);
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Login failed.';
      setErrorMsg(message);
    } finally {
      setSubmitting(false);
    }
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

      {/* Login Card Body */}
      <main className="flex-1 flex items-center justify-center p-4 py-10">
        <div className="max-w-md w-full bg-white rounded-2xl border border-slate-200 shadow-md p-6 sm:p-8 space-y-6">
          {/* Title & Badge */}
          <div className="text-center space-y-2">
            <div className="inline-flex items-center space-x-1.5 bg-teal-50 border border-teal-200 text-teal-800 text-xs px-3 py-1 rounded-full font-semibold">
              <ShieldCheck className="w-3.5 h-3.5 text-teal-600" />
              <span>{t.sessionActive || 'Secure Access'}</span>
            </div>
            <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">
              {t.loginTitle}
            </h2>
            <p className="text-xs text-slate-600">
              {t.loginSubtitle}
            </p>
          </div>

          {/* Already Logged In Banner */}
          {isAuthenticated && user && !authLoading && (
            <div className="bg-teal-50 border border-teal-200 rounded-xl p-4 text-xs text-slate-800 space-y-3">
              <div className="flex items-start space-x-2">
                <CheckCircle2 className="w-4 h-4 text-teal-600 mt-0.5 shrink-0" />
                <div>
                  <p className="font-semibold text-teal-900">{t.loggedInAs}</p>
                  <p className="font-mono text-slate-700 break-all">{user.email}</p>
                </div>
              </div>
              <div className="flex items-center justify-between pt-1 gap-2">
                <Link
                  href="/"
                  className="bg-teal-600 hover:bg-teal-700 text-white font-semibold px-3 py-1.5 rounded-lg transition-colors text-center flex-1"
                >
                  {t.homeWorkflowsTitle || 'Enter Workspaces'}
                </Link>
                <button
                  type="button"
                  onClick={() => signOut()}
                  className="bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 font-semibold px-3 py-1.5 rounded-lg transition-colors flex items-center justify-center space-x-1"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>{t.logoutBtn}</span>
                </button>
              </div>
            </div>
          )}

          {/* Error & Success Feedback Banners */}
          {errorMsg && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-xs text-red-700 flex items-start space-x-2">
              <AlertCircle className="w-4 h-4 text-red-600 mt-0.5 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 text-xs text-emerald-800 flex items-start space-x-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Auth Method Tabs */}
          <div className="grid grid-cols-2 gap-1 bg-slate-100 p-1 rounded-xl text-xs font-semibold">
            <button
              type="button"
              onClick={() => {
                setAuthMode('otp');
                setOtpStep('request');
              }}
              className={`py-2 px-3 rounded-lg transition-all flex items-center justify-center space-x-1.5 ${
                authMode === 'otp'
                  ? 'bg-white text-teal-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Mail className="w-3.5 h-3.5" />
              <span>{t.loginOtpTab}</span>
            </button>
            <button
              type="button"
              onClick={() => setAuthMode('password')}
              className={`py-2 px-3 rounded-lg transition-all flex items-center justify-center space-x-1.5 ${
                authMode === 'password'
                  ? 'bg-white text-teal-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <KeyRound className="w-3.5 h-3.5" />
              <span>{t.loginPasswordTab}</span>
            </button>
          </div>

          {/* Tab 1: Email OTP Authentication */}
          {authMode === 'otp' && (
            <>
              {otpStep === 'request' ? (
                <form onSubmit={handleSendOtp} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      {t.loginEmailLabel}
                    </label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder={t.loginEmailPlaceholder}
                        disabled={submitting}
                        className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-hidden transition-all"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={submitting || !email.trim()}
                    className="w-full bg-teal-600 hover:bg-teal-700 disabled:opacity-60 text-white font-bold py-2.5 px-4 rounded-xl text-xs flex items-center justify-center space-x-2 transition-all shadow-xs"
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>{t.loginLoading}</span>
                      </>
                    ) : (
                      <>
                        <Send className="w-3.5 h-3.5" />
                        <span>{t.sendOtpBtn}</span>
                      </>
                    )}
                  </button>
                </form>
              ) : (
                <form onSubmit={handleVerifyOtp} className="space-y-4">
                  <div className="bg-slate-50 border border-slate-200 rounded-lg p-2.5 flex items-center justify-between text-xs">
                    <span className="font-mono text-slate-700 truncate max-w-[200px]">{email}</span>
                    <button
                      type="button"
                      onClick={() => setOtpStep('request')}
                      className="text-teal-700 font-semibold hover:underline text-[11px]"
                    >
                      {t.changeEmailBtn}
                    </button>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      {t.enterOtpLabel}
                    </label>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                      <input
                        type="text"
                        required
                        maxLength={8}
                        value={otpCode}
                        onChange={(e) => setOtpCode(e.target.value)}
                        placeholder={t.enterOtpPlaceholder}
                        disabled={submitting}
                        autoFocus
                        className="w-full pl-9 pr-3 py-2 text-xs font-mono tracking-widest text-center border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-hidden transition-all"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={submitting || !otpCode.trim()}
                    className="w-full bg-teal-600 hover:bg-teal-700 disabled:opacity-60 text-white font-bold py-2.5 px-4 rounded-xl text-xs flex items-center justify-center space-x-2 transition-all shadow-xs"
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>{t.loginLoading}</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>{t.verifyOtpBtn}</span>
                      </>
                    )}
                  </button>

                  <div className="text-center pt-1">
                    <button
                      type="button"
                      disabled={submitting}
                      onClick={handleSendOtp}
                      className="text-xs text-slate-500 hover:text-teal-700 font-medium transition-colors"
                    >
                      {t.resendOtpBtn}
                    </button>
                  </div>
                </form>
              )}
            </>
          )}

          {/* Tab 2: Password Authentication */}
          {authMode === 'password' && (
            <form onSubmit={handlePasswordLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {t.loginEmailLabel}
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder={t.loginEmailPlaceholder}
                    disabled={submitting}
                    className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-hidden transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {t.loginPasswordLabel}
                </label>
                <div className="relative">
                  <KeyRound className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder={t.loginPasswordPlaceholder}
                    disabled={submitting}
                    className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-hidden transition-all"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={submitting || !email.trim() || !password}
                className="w-full bg-teal-600 hover:bg-teal-700 disabled:opacity-60 text-white font-bold py-2.5 px-4 rounded-xl text-xs flex items-center justify-center space-x-2 transition-all shadow-xs"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>{t.loginLoading}</span>
                  </>
                ) : (
                  <>
                    <Lock className="w-3.5 h-3.5" />
                    <span>{t.loginBtn}</span>
                  </>
                )}
              </button>
            </form>
          )}

          {/* Institutional Advisory */}
          <div className="border-t border-slate-100 pt-4 text-center">
            <p className="text-[11px] text-slate-500">
              Government of Maharashtra • Public Health Department
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

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-slate-50">
          <Loader2 className="w-8 h-8 animate-spin text-teal-600" />
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
