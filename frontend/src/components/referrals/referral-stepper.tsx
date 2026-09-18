import React from 'react';
import { useLanguage } from '@/lib/i18n/context';
import type { Referral, ReferralStatus } from '@/types/healthcare';
import { CheckCircle2, Circle, Clock, ArrowRight, ShieldAlert, HeartHandshake } from 'lucide-react';

interface ReferralStepperProps {
  referral: Referral;
}

export function ReferralStepper({ referral }: ReferralStepperProps) {
  const { t } = useLanguage();

  const steps: { key: ReferralStatus | 'follow_up'; label: string; description: string }[] = [
    { key: 'initiated', label: t.statusInitiated, description: 'Created at primary center' },
    { key: 'acknowledged', label: t.statusAcknowledged, description: 'Accepted by receiving hospital' },
    { key: 'evaluated', label: t.statusEvaluated, description: 'Under specialist care / observation' },
    { key: 'closed_loop', label: t.statusCompleted, description: 'Discharged with counter-referral' },
    { key: 'follow_up', label: t.statusFollowUpScheduled, description: 'ASHA home visit scheduled' }
  ];

  const getStepState = (stepKey: string): 'completed' | 'active' | 'pending' => {
    const statusOrder = ['initiated', 'acknowledged', 'evaluated', 'closed_loop'];
    const currentIdx = statusOrder.indexOf(referral.status === 'discharged' ? 'closed_loop' : referral.status);

    if (stepKey === 'follow_up') {
      return referral.status === 'closed_loop' || referral.status === 'discharged' ? 'active' : 'pending';
    }

    const stepIdx = statusOrder.indexOf(stepKey);
    if (stepIdx < currentIdx) return 'completed';
    if (stepIdx === currentIdx) return 'active';
    return 'pending';
  };

  return (
    <div className="w-full py-2">
      <div className="flex items-center justify-between relative">
        <div className="absolute left-0 top-4 w-full h-0.5 bg-slate-200 -z-0" />
        {steps.map((s, idx) => {
          const state = getStepState(s.key);
          return (
            <div key={s.key} className="flex flex-col items-center relative z-10 flex-1 text-center px-1">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all shadow-xs ${
                  state === 'completed'
                    ? 'bg-teal-600 text-white ring-4 ring-teal-100'
                    : state === 'active'
                    ? 'bg-amber-500 text-white ring-4 ring-amber-100 animate-pulse'
                    : 'bg-white text-slate-400 border-2 border-slate-300'
                }`}
              >
                {state === 'completed' ? (
                  <CheckCircle2 className="w-4 h-4" />
                ) : state === 'active' ? (
                  <Clock className="w-4 h-4" />
                ) : (
                  <span>{idx + 1}</span>
                )}
              </div>
              <span
                className={`text-[11px] font-bold mt-1.5 line-clamp-1 ${
                  state === 'completed'
                    ? 'text-teal-800'
                    : state === 'active'
                    ? 'text-amber-800'
                    : 'text-slate-400'
                }`}
              >
                {s.label}
              </span>
              <span className="text-[9px] text-slate-500 hidden sm:inline-block line-clamp-1">
                {s.description}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
