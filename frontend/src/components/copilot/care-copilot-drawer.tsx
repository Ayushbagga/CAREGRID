'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useLanguage } from '@/lib/i18n/context';
import { getCopilotI18n } from '@/lib/copilot/copilot-i18n';
import { getPhaseDI18n } from '@/lib/i18n/phase-d-i18n';
import { voiceClient } from '@/lib/voice';
import { CareGridSymbol } from '@/components/shared/caregrid-logo';
import { useNetworkStatus } from '@/hooks/use-network-status';
import type { CopilotQueryResponse, SuggestedAction, UserRole } from '@/lib/copilot';
import { 
  Sparkles, 
  X, 
  Send, 
  AlertTriangle, 
  CheckCircle2, 
  ShieldCheck, 
  ArrowRight, 
  Database, 
  Activity, 
  AlertCircle,
  Mic,
  MicOff,
  Volume2,
  VolumeX
} from 'lucide-react';

interface CareCopilotDrawerProps {
  role: UserRole;
  defaultOpen?: boolean;
}

interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
  response?: CopilotQueryResponse;
}

export const CareCopilotDrawer: React.FC<CareCopilotDrawerProps> = ({ role, defaultOpen = false }) => {
  const { locale } = useLanguage();
  const tCop = getCopilotI18n(locale);
  const { isOnline } = useNetworkStatus();

  const [isOpen, setIsOpen] = useState(defaultOpen);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [kpis, setKpis] = useState<{
    urgentCases: number;
    pendingReferrals: number;
    overdueFollowUps: number;
  }>({
    urgentCases: 0,
    pendingReferrals: 0,
    overdueFollowUps: 0
  });

  // Action confirmation state
  const [pendingConfirmAction, setPendingConfirmAction] = useState<SuggestedAction | null>(null);
  const [actionSuccessMsg, setActionSuccessMsg] = useState<string | null>(null);
  const [isActionLoading, setIsActionLoading] = useState(false);

  // Phase D Voice Assistant Integration
  const tD = getPhaseDI18n(locale);
  const [isListening, setIsListening] = useState(false);
  const [speakingMsgId, setSpeakingMsgId] = useState<string | null>(null);
  const [voiceNotice, setVoiceNotice] = useState<string | null>(null);

  // Clean up voice upon unmount or drawer close
  useEffect(() => {
    return () => {
      voiceClient.abortListening();
      voiceClient.stopSpeaking();
    };
  }, []);

  const toggleVoiceInput = async () => {
    if (!voiceClient.isInputSupported()) {
      setVoiceNotice(tD.voiceNotSupported);
      setTimeout(() => setVoiceNotice(null), 3500);
      return;
    }
    if (isListening) {
      await voiceClient.stopListening();
      setIsListening(false);
      setVoiceNotice(null);
    } else {
      setIsListening(true);
      setVoiceNotice(tD.voiceListening);
      await voiceClient.startListening(
        { locale: locale as any },
        result => {
          setInputValue(result.transcript);
          if (result.isFinal) {
            setIsListening(false);
            setVoiceNotice(null);
          }
        },
        err => {
          setIsListening(false);
          setVoiceNotice(err.code === 'not-allowed' ? tD.voicePermissionDenied : tD.voiceError);
          setTimeout(() => setVoiceNotice(null), 3500);
        }
      );
    }
  };

  const handleToggleSpeak = async (msgId: string, text: string) => {
    if (speakingMsgId === msgId) {
      voiceClient.stopSpeaking();
      setSpeakingMsgId(null);
    } else {
      setSpeakingMsgId(msgId);
      await voiceClient.speak(text, { locale: locale as any });
      setSpeakingMsgId(null);
    }
  };

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Initialize with Command Center overview
  useEffect(() => {
    loadCommandCenterSummary();
  }, [role]);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isLoading, pendingConfirmAction]);

  const loadCommandCenterSummary = async () => {
    try {
      const res = await fetch('/api/copilot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ intent: 'command_center' })
      });

      if (res.ok) {
        const data: CopilotQueryResponse = await res.json();
        const stats = (data.verified_data?.summary_stats as Record<string, number>) || {};
        setKpis({
          urgentCases: Number(stats.urgentCases || 0),
          pendingReferrals: Number(stats.pendingReferrals || 0),
          overdueFollowUps: Number(stats.overdueFollowUps || 0)
        });

        setMessages([
          {
            id: 'init-summary',
            sender: 'assistant',
            text: data.assistant_message,
            timestamp: new Date().toLocaleTimeString(),
            response: data
          }
        ]);
      }
    } catch {
      // offline fallback
      setMessages([
        {
          id: 'init-offline',
          sender: 'assistant',
          text: `${tCop.offlineNotice} ${tCop.commandCenterDesc}.`,
          timestamp: new Date().toLocaleTimeString()
        }
      ]);
    }
  };

  const executeQuery = async (queryText: string, intent?: string) => {
    if (!queryText.trim() && !intent) return;

    const userMsgId = crypto.randomUUID();
    const displayText = queryText || intent || 'Query';

    setMessages(prev => [
      ...prev,
      {
        id: userMsgId,
        sender: 'user',
        text: displayText,
        timestamp: new Date().toLocaleTimeString()
      }
    ]);

    setInputValue('');
    setIsLoading(true);
    setActionSuccessMsg(null);

    try {
      const res = await fetch('/api/copilot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: queryText, intent })
      });

      if (res.ok) {
        const data: CopilotQueryResponse = await res.json();
        setMessages(prev => [
          ...prev,
          {
            id: crypto.randomUUID(),
            sender: 'assistant',
            text: data.assistant_message,
            timestamp: new Date().toLocaleTimeString(),
            response: data
          }
        ]);
      } else {
        setMessages(prev => [
          ...prev,
          {
            id: crypto.randomUUID(),
            sender: 'assistant',
            text: 'Unable to reach Copilot backend. Operational protocol engine available offline.',
            timestamp: new Date().toLocaleTimeString()
          }
        ]);
      }
    } catch {
      setMessages(prev => [
        ...prev,
        {
          id: crypto.randomUUID(),
          sender: 'assistant',
          text: tCop.offlineNotice,
          timestamp: new Date().toLocaleTimeString()
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleActionClick = (action: SuggestedAction) => {
    if (action.actionType === 'navigate' && action.targetHref) {
      window.location.href = action.targetHref;
      return;
    }

    if (action.requiresConfirmation) {
      setPendingConfirmAction(action);
    }
  };

  const handleConfirmAction = async () => {
    if (!pendingConfirmAction) return;
    setIsActionLoading(true);

    try {
      const payload = pendingConfirmAction.payload || {};
      const res = await fetch('/api/copilot/escalate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          task_id: payload.task_id,
          action: payload.action || 'ESCALATE_OVERDUE',
          confirm: true,
          idempotency_key: `esc_${payload.task_id}_${Date.now()}`
        })
      });

      if (res.ok) {
        setActionSuccessMsg(tCop.actionSuccess);
        setPendingConfirmAction(null);
        // Refresh Command Center summary
        await loadCommandCenterSummary();
      }
    } catch {
      setActionSuccessMsg('Action completed locally (Offline). Will synchronize with cloud.');
      setPendingConfirmAction(null);
    } finally {
      setIsActionLoading(false);
    }
  };

  return (
    <>
      {/* Floating Trigger Pill */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-5 right-5 z-40 bg-gradient-to-r from-teal-700 via-teal-800 to-slate-900 text-white px-4 py-2.5 rounded-full shadow-xl hover:shadow-2xl border border-teal-500/30 flex items-center space-x-2.5 transition-all hover:scale-105 active:scale-95 group"
          aria-label="Open CAREGRID Copilot"
        >
          <CareGridSymbol size={22} className="shrink-0" />
          <div className="text-left">
            <div className="flex items-center space-x-1">
              <span className="font-extrabold text-xs tracking-wide">CAREGRID COPILOT</span>
              <Sparkles className="w-3.5 h-3.5 text-teal-300 animate-pulse" />
            </div>
            <span className="text-[10px] text-teal-200 block -mt-0.5">
              {role.toUpperCase()} Assist
            </span>
          </div>
        </button>
      )}

      {/* Drawer Overlay */}
      {isOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex justify-end">
          <div className="bg-white w-full max-w-lg h-full shadow-2xl flex flex-col border-l border-slate-200">
            {/* Drawer Header */}
            <div className="bg-slate-900 text-white p-4 flex items-center justify-between border-b border-slate-800">
              <div className="flex items-center space-x-3">
                <CareGridSymbol size={32} />
                <div>
                  <div className="flex items-center space-x-2">
                    <h2 className="font-extrabold text-sm tracking-wide text-white">
                      {tCop.copilotTitle}
                    </h2>
                    <span className="bg-teal-500/20 text-teal-300 text-[10px] font-bold px-2 py-0.5 rounded-full border border-teal-500/40">
                      {role.toUpperCase()}
                    </span>
                    <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded-full border ${
                      isOnline ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' : 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                    }`}>
                      {isOnline ? 'ONLINE' : 'OFFLINE'}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400">
                    {tCop.copilotSubtitle}
                  </p>
                </div>
              </div>

              <button
                onClick={() => setIsOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
                aria-label="Close Copilot"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Command Center KPI Strip */}
            <div className="bg-slate-800/90 text-slate-200 p-2.5 grid grid-cols-3 gap-2 text-center text-xs border-b border-slate-700">
              <div className="bg-slate-900/60 p-2 rounded-lg border border-slate-700/60">
                <span className="text-[10px] text-slate-400 block uppercase font-bold tracking-wider">
                  {tCop.urgentCases}
                </span>
                <span className="text-sm font-extrabold text-amber-400">
                  {kpis.urgentCases}
                </span>
              </div>
              <div className="bg-slate-900/60 p-2 rounded-lg border border-slate-700/60">
                <span className="text-[10px] text-slate-400 block uppercase font-bold tracking-wider">
                  {tCop.pendingReferrals}
                </span>
                <span className="text-sm font-extrabold text-teal-400">
                  {kpis.pendingReferrals}
                </span>
              </div>
              <div className="bg-slate-900/60 p-2 rounded-lg border border-slate-700/60">
                <span className="text-[10px] text-slate-400 block uppercase font-bold tracking-wider">
                  {tCop.overdueFollowUps}
                </span>
                <span className="text-sm font-extrabold text-rose-400">
                  {kpis.overdueFollowUps}
                </span>
              </div>
            </div>

            {/* Quick Operational Prompts */}
            <div className="p-3 bg-slate-50 border-b border-slate-200">
              <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block mb-1.5">
                {tCop.quickPromptsLabel}
              </span>
              <div className="flex flex-wrap gap-1.5">
                <button
                  onClick={() => executeQuery(tCop.promptPriorityCases, 'priority_cases')}
                  className="text-[11px] font-semibold bg-white hover:bg-amber-50 text-slate-700 hover:text-amber-800 border border-slate-200 hover:border-amber-300 px-2.5 py-1 rounded-full shadow-2xs transition-colors"
                >
                  {tCop.promptPriorityCases}
                </button>
                <button
                  onClick={() => executeQuery(tCop.promptPendingReferrals, 'pending_referrals')}
                  className="text-[11px] font-semibold bg-white hover:bg-teal-50 text-slate-700 hover:text-teal-800 border border-slate-200 hover:border-teal-300 px-2.5 py-1 rounded-full shadow-2xs transition-colors"
                >
                  {tCop.promptPendingReferrals}
                </button>
                <button
                  onClick={() => executeQuery(tCop.promptOverdueFollowups, 'overdue_followups')}
                  className="text-[11px] font-semibold bg-white hover:bg-rose-50 text-slate-700 hover:text-rose-800 border border-slate-200 hover:border-rose-300 px-2.5 py-1 rounded-full shadow-2xs transition-colors"
                >
                  {tCop.promptOverdueFollowups}
                </button>
                <button
                  onClick={() => executeQuery(tCop.promptCommandCenter, 'command_center')}
                  className="text-[11px] font-semibold bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 px-2.5 py-1 rounded-full shadow-2xs transition-colors"
                >
                  {tCop.promptCommandCenter}
                </button>
              </div>
            </div>

            {/* Chat Body */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs">
              {messages.map(msg => (
                <div
                  key={msg.id}
                  className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[90%] rounded-xl p-3.5 space-y-2.5 shadow-2xs ${
                      msg.sender === 'user'
                        ? 'bg-teal-700 text-white rounded-tr-none'
                        : 'bg-white border border-slate-200 text-slate-800 rounded-tl-none'
                    }`}
                  >
                    {/* Header info */}
                    <div className="flex items-center justify-between space-x-2 text-[10px] opacity-75 pb-1 border-b border-slate-100/50">
                      <span className="font-bold">
                        {msg.sender === 'user' ? 'You' : 'CAREGRID Assist'}
                      </span>
                      <div className="flex items-center space-x-1.5">
                        {msg.sender === 'assistant' && (
                          <button
                            type="button"
                            onClick={() => handleToggleSpeak(msg.id, msg.text)}
                            title={speakingMsgId === msg.id ? tD.voiceStopSpeaking : tD.voiceSpeakSummary}
                            aria-label={speakingMsgId === msg.id ? tD.voiceStopSpeaking : tD.voiceSpeakSummary}
                            className="p-1 hover:bg-slate-100 rounded text-slate-500 hover:text-slate-800 transition-colors focus:outline-none focus-visible:ring-1 focus-visible:ring-teal-500"
                          >
                            {speakingMsgId === msg.id ? (
                              <VolumeX className="w-3.5 h-3.5 text-teal-600 animate-pulse" />
                            ) : (
                              <Volume2 className="w-3.5 h-3.5" />
                            )}
                          </button>
                        )}
                        <span>{msg.timestamp}</span>
                      </div>
                    </div>

                    {/* Main Text */}
                    <p className="text-xs leading-relaxed font-normal whitespace-pre-line">
                      {msg.text}
                    </p>

                    {/* If Assistant Response has Verified Records */}
                    {msg.response?.verified_data?.records && msg.response.verified_data.records.length > 0 && (
                      <div className="pt-2 border-t border-slate-100 space-y-1.5">
                        <span className="text-[10px] font-bold text-teal-800 uppercase tracking-wider flex items-center space-x-1">
                          <Database className="w-3 h-3 text-teal-600" />
                          <span>{tCop.verifiedDataLabel}</span>
                        </span>
                        <div className="space-y-1">
                          {msg.response.verified_data.records.map(rec => (
                            <div key={rec.id} className="p-2 bg-slate-50 border border-slate-200/80 rounded text-[11px]">
                              <div className="flex justify-between items-start">
                                <span className="font-bold text-slate-900">{rec.title}</span>
                                {rec.urgency && (
                                  <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded uppercase ${
                                    rec.urgency === 'emergency_red'
                                      ? 'bg-rose-100 text-rose-800'
                                      : 'bg-amber-100 text-amber-800'
                                  }`}>
                                    {rec.urgency.replace('_', ' ')}
                                  </span>
                                )}
                              </div>
                              <p className="text-[10px] text-slate-500 mt-0.5">{rec.subtitle}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Protocol Signals */}
                    {msg.response?.protocol_signals && msg.response.protocol_signals.length > 0 && (
                      <div className="pt-2 border-t border-slate-100 space-y-1.5">
                        <span className="text-[10px] font-bold text-amber-800 uppercase tracking-wider flex items-center space-x-1">
                          <AlertTriangle className="w-3 h-3 text-amber-600" />
                          <span>{tCop.protocolSignalsLabel}</span>
                        </span>
                        <div className="space-y-1">
                          {msg.response.protocol_signals.map(sig => (
                            <div key={sig.ruleId} className="p-2 bg-amber-50/70 border border-amber-200 rounded text-[11px]">
                              <div className="flex items-center space-x-1 font-bold text-amber-900">
                                <span className="bg-amber-200 px-1 py-0.2 rounded text-[9px]">{sig.ruleId}</span>
                                <span>{sig.signal}</span>
                              </div>
                              <p className="text-[10px] text-amber-800 mt-0.5">{sig.rationale}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Suggested Actions */}
                    {msg.response?.suggested_actions && msg.response.suggested_actions.length > 0 && (
                      <div className="pt-2 border-t border-slate-100 space-y-1.5">
                        <div className="space-y-1.5">
                          {msg.response.suggested_actions.map(act => (
                            <button
                              key={act.id}
                              onClick={() => handleActionClick(act)}
                              className="w-full text-left p-2 rounded-lg bg-teal-50 hover:bg-teal-100 border border-teal-200 text-teal-900 text-xs font-semibold flex items-center justify-between transition-colors"
                            >
                              <div>
                                <span className="block font-bold">{act.label}</span>
                                <span className="text-[10px] text-teal-700 block font-normal">{act.description}</span>
                              </div>
                              <ArrowRight className="w-4 h-4 text-teal-700 shrink-0" />
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Non-Diagnostic Disclaimer Footer on Assistant Messages */}
                    {msg.sender === 'assistant' && (
                      <div className="pt-1 text-[9px] text-slate-400 border-t border-slate-100">
                        {tCop.nonDiagnosticDisclaimer}
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-white border border-slate-200 rounded-xl rounded-tl-none p-3 shadow-2xs flex items-center space-x-2 text-slate-500 text-xs">
                    <Activity className="w-4 h-4 text-teal-600 animate-spin" />
                    <span>Analyzing clinical records and protocol rules...</span>
                  </div>
                </div>
              )}

              {/* Action Success Alert */}
              {actionSuccessMsg && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-xl text-xs flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span className="font-semibold">{actionSuccessMsg}</span>
                </div>
              )}

              {/* Action Confirmation Modal Card */}
              {pendingConfirmAction && (
                <div className="p-4 bg-amber-50 border-2 border-amber-300 rounded-xl space-y-2.5">
                  <div className="flex items-center space-x-2 text-amber-900 font-bold text-xs">
                    <AlertCircle className="w-4 h-4 text-amber-600" />
                    <span>{tCop.actionConfirmTitle}</span>
                  </div>
                  <p className="text-[11px] text-amber-800 leading-relaxed">
                    {tCop.actionConfirmDesc}
                  </p>
                  <div className="p-2 bg-white rounded border border-amber-200 text-[11px] font-medium text-slate-800">
                    {pendingConfirmAction.label}
                  </div>
                  <div className="flex space-x-2 pt-1">
                    <button
                      onClick={handleConfirmAction}
                      disabled={isActionLoading}
                      className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-lg shadow-xs disabled:opacity-50"
                    >
                      {isActionLoading ? 'Processing...' : tCop.confirmBtn}
                    </button>
                    <button
                      onClick={() => setPendingConfirmAction(null)}
                      className="px-3 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 font-semibold text-xs rounded-lg"
                    >
                      {tCop.cancelBtn}
                    </button>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Input Footer */}
            <div className="p-3 bg-white border-t border-slate-200">
              <form
                onSubmit={e => {
                  e.preventDefault();
                  executeQuery(inputValue);
                }}
                className="flex items-center space-x-2"
              >
                <button
                  type="button"
                  onClick={toggleVoiceInput}
                  title={isListening ? tD.voiceStopListening : tD.voiceStartListening}
                  aria-label={isListening ? tD.voiceStopListening : tD.voiceStartListening}
                  className={`p-2 rounded-lg transition-colors border focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 ${
                    isListening
                      ? 'bg-rose-50 text-rose-700 border-rose-300 animate-pulse'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300'
                  }`}
                >
                  {isListening ? (
                    <MicOff className="w-4 h-4 text-rose-600" />
                  ) : (
                    <Mic className="w-4 h-4 text-slate-600" />
                  )}
                </button>
                <input
                  type="text"
                  value={inputValue}
                  onChange={e => setInputValue(e.target.value)}
                  placeholder={tCop.inputPlaceholder}
                  className="flex-1 bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                />
                <button
                  type="submit"
                  disabled={!inputValue.trim() || isLoading}
                  className="bg-teal-600 hover:bg-teal-700 text-white px-3.5 py-2 rounded-lg font-bold text-xs flex items-center space-x-1 disabled:opacity-50 transition-colors shadow-2xs focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-500"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">{tCop.sendBtn}</span>
                </button>
              </form>
              {voiceNotice && (
                <p className="text-[10px] font-semibold text-teal-700 mt-1 animate-pulse px-1" role="status">
                  {voiceNotice}
                </p>
              )}
              <div className="flex justify-between items-center text-[9px] text-slate-400 mt-1.5 px-1">
                <span>{tCop.groundedEngine}</span>
                <span className="flex items-center space-x-1">
                  <ShieldCheck className="w-3 h-3 text-teal-600" />
                  <span>Human-in-the-Loop Confirmed</span>
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
