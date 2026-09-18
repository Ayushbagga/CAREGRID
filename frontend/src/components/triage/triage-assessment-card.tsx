'use client';

import React, { useState } from 'react';
import { useLanguage } from '@/lib/i18n/context';
import { AlertTriangle, ShieldCheck, CheckCircle2, Stethoscope, ChevronRight, X } from 'lucide-react';
import type { TriageAssessment, UrgencyTier } from '@/types/healthcare';

interface TriageAssessmentCardProps {
  assessment: TriageAssessment;
  patientName?: string;
  onTierOverridden?: (newTier: UrgencyTier, justification: string) => void;
}

export const TriageAssessmentCard: React.FC<TriageAssessmentCardProps> = ({
  assessment,
  patientName,
  onTierOverridden
}) => {
  const { t } = useLanguage();
  const [currentTier, setCurrentTier] = useState<UrgencyTier>(assessment.urgency_tier);
  const [isOverrideModalOpen, setIsOverrideModalOpen] = useState(false);
  const [selectedOverrideTier, setSelectedOverrideTier] = useState<UrgencyTier>(assessment.urgency_tier);
  const [overrideReason, setOverrideReason] = useState('');
  const [isOverridden, setIsOverridden] = useState(false);

  const getTierStyles = (tier: UrgencyTier) => {
    switch (tier) {
      case 'emergency_red':
        return {
          bg: 'bg-red-50 border-red-300 text-red-950',
          badge: 'bg-red-600 text-white',
          label: t.triageEmergency,
          pulse: 'animate-pulse'
        };
      case 'urgent_amber':
        return {
          bg: 'bg-amber-50 border-amber-300 text-amber-950',
          badge: 'bg-amber-500 text-white',
          label: t.triageUrgent,
          pulse: ''
        };
      case 'routine_green':
      default:
        return {
          bg: 'bg-emerald-50 border-emerald-300 text-emerald-950',
          badge: 'bg-emerald-600 text-white',
          label: t.triageRoutine,
          pulse: ''
        };
    }
  };

  const currentStyles = getTierStyles(currentTier);

  const handleConfirmOverride = () => {
    setCurrentTier(selectedOverrideTier);
    setIsOverridden(true);
    setIsOverrideModalOpen(false);
    if (onTierOverridden) {
      onTierOverridden(selectedOverrideTier, overrideReason);
    }
  };

  return (
    <div className={`p-4 sm:p-5 rounded-xl border shadow-xs transition-all ${currentStyles.bg}`}>
      {/* Top Header */}
      <div className="flex flex-wrap justify-between items-start gap-2 pb-3 border-b border-black/10">
        <div>
          <div className="flex items-center space-x-2">
            <span className={`px-2.5 py-1 rounded-full text-xs font-black uppercase tracking-wider ${currentStyles.badge} ${currentStyles.pulse}`}>
              {currentStyles.label}
            </span>
            <span className="text-xs font-semibold text-slate-700">
              {t.urgencyPriorityScore}: {assessment.priority_score}/10
            </span>
            {isOverridden && (
              <span className="text-[10px] bg-blue-100 text-blue-800 px-2 py-0.5 rounded font-bold">
                Doctor Reviewed
              </span>
            )}
          </div>
          {patientName && (
            <h4 className="text-sm font-bold text-slate-900 mt-1">{patientName}</h4>
          )}
        </div>

        {/* Human Review Button */}
        <button
          type="button"
          onClick={() => setIsOverrideModalOpen(true)}
          className="px-3 py-1 bg-white/90 hover:bg-white text-slate-800 border border-slate-300 text-xs font-bold rounded-lg shadow-xs flex items-center space-x-1"
        >
          <Stethoscope className="w-3.5 h-3.5 text-teal-700" />
          <span>{t.doctorOverrideBtn}</span>
        </button>
      </div>

      {/* Rationale & Danger Signs */}
      <div className="py-3 space-y-2 text-xs">
        <p className="font-medium leading-relaxed">{assessment.clinical_rationale}</p>

        {assessment.detected_red_flags.length > 0 && (
          <div className="space-y-1 pt-1">
            <span className="font-bold text-red-900 flex items-center space-x-1">
              <AlertTriangle className="w-3.5 h-3.5 text-red-600" />
              <span>{t.detectedAnomalies}:</span>
            </span>
            <ul className="list-disc list-inside space-y-0.5 text-[11px] text-red-950 font-medium pl-1">
              {assessment.detected_red_flags.map((flag, idx) => (
                <li key={idx}>{flag}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Recommended Specialty & Action */}
        <div className="pt-2 grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] border-t border-black/5">
          {assessment.recommended_specialty && (
            <div>
              <span className="font-bold text-slate-700">{t.recommendedSpecialty}:</span>{' '}
              <span className="font-semibold text-slate-900">{assessment.recommended_specialty}</span>
            </div>
          )}
          <div>
            <span className="font-bold text-slate-700">{t.recommendedAction}:</span>{' '}
            <span className="font-medium text-slate-900">{assessment.recommended_action || 'Review and triage according to standard OPD protocol.'}</span>
          </div>
        </div>
      </div>

      {/* Mandatory Non-Diagnostic Disclaimer */}
      <div className="pt-2 border-t border-black/10 flex items-center space-x-1.5 text-[10px] text-slate-600 italic">
        <ShieldCheck className="w-3.5 h-3.5 text-teal-700 shrink-0" />
        <span>{assessment.non_diagnostic_disclaimer}</span>
      </div>

      {/* Clinician Review & Override Modal (Human-in-the-loop) */}
      {isOverrideModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 max-w-md w-full p-5 space-y-4 text-slate-900">
            <div className="flex justify-between items-start">
              <div className="flex items-center space-x-2">
                <Stethoscope className="w-5 h-5 text-teal-600" />
                <h3 className="font-bold text-base">{t.overrideModalTitle}</h3>
              </div>
              <button onClick={() => setIsOverrideModalOpen(false)} className="text-slate-400 hover:text-slate-600 p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Medical Officers retain absolute clinical judgment to adjust the patient urgency tier based on in-person clinical examination.
            </p>

            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-700">Select Clinician-Approved Urgency Tier:</label>
              <div className="grid grid-cols-3 gap-2 text-xs">
                {(['emergency_red', 'urgent_amber', 'routine_green'] as UrgencyTier[]).map(tier => {
                  const style = getTierStyles(tier);
                  return (
                    <button
                      key={tier}
                      type="button"
                      onClick={() => setSelectedOverrideTier(tier)}
                      className={`p-2 rounded-lg border font-bold text-center transition-all ${
                        selectedOverrideTier === tier
                          ? `${style.badge} ring-2 ring-offset-1 ring-teal-600`
                          : 'bg-slate-50 text-slate-700 border-slate-200'
                      }`}
                    >
                      {style.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Doctor Observation / Clinical Justification:</label>
              <textarea
                rows={2}
                value={overrideReason}
                onChange={e => setOverrideReason(e.target.value)}
                placeholder="Reason for confirming or modifying priority tier..."
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:ring-2 focus:ring-teal-500"
              />
            </div>

            <div className="flex justify-end space-x-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsOverrideModalOpen(false)}
                className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                {t.closeBtn}
              </button>
              <button
                type="button"
                onClick={handleConfirmOverride}
                className="px-4 py-1.5 bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs rounded-lg shadow-sm"
              >
                {t.confirmTierBtn}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
