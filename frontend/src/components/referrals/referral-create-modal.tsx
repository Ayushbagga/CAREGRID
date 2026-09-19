import React, { useState, useEffect } from 'react';
import { useLanguage } from '@/lib/i18n/context';
import type { Patient, Facility, UrgencyTier } from '@/types/healthcare';
import { ReferralService } from '@/lib/offline-sync/referral-service';
import { FacilityService } from '@/lib/offline-sync/facility-service';
import { GitPullRequest, X, ShieldAlert, ArrowRight, Building2, User } from 'lucide-react';

interface ReferralCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  patient: Patient;
  currentFacilityId?: string;
  onReferralCreated: () => void;
}

export function ReferralCreateModal({
  isOpen,
  onClose,
  patient,
  currentFacilityId = 'fac-001',
  onReferralCreated
}: ReferralCreateModalProps) {
  const { t } = useLanguage();
  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [toFacilityId, setToFacilityId] = useState('');
  const [specialty, setSpecialty] = useState('Obstetrics & Gynecology');
  const [urgencyTier, setUrgencyTier] = useState<UrgencyTier>('urgent_amber');
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    async function load() {
      const all = await FacilityService.getFacilities();
      // Filter higher secondary facilities (CHC, Rural Hospital, District Hospital)
      const secondary = all.filter(f => f.facility_type !== 'sub_centre' && f.id !== currentFacilityId);
      setFacilities(secondary);
      if (secondary.length > 0) {
        setToFacilityId(secondary[0].id);
      }
    }
    if (isOpen) {
      load();
    }
  }, [isOpen, currentFacilityId]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!toFacilityId || !reason) return;
    setIsSubmitting(true);
    try {
      await ReferralService.createReferral({
        patient_id: patient.id,
        from_facility_id: currentFacilityId,
        to_facility_id: toFacilityId,
        referring_officer_id: 'doc-phc-001',
        referral_reason: reason,
        required_specialty: specialty,
        urgency_tier: urgencyTier
      });
      onReferralCreated();
      onClose();
    } catch (err) {
      console.error('Failed to create referral:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-lg w-full overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="bg-slate-900 text-white p-4 flex justify-between items-center">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-teal-500/20 text-teal-400 flex items-center justify-center">
              <GitPullRequest className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm sm:text-base leading-tight">
                {t.initiateReferralBtn}
              </h3>
              <p className="text-[11px] text-slate-400">
                {t.referralTrackingSub}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4 overflow-y-auto flex-1 text-slate-900">
          {/* Patient Card */}
          <div className="bg-teal-50/80 border border-teal-200 rounded-xl p-3 flex justify-between items-center text-xs">
            <div>
              <p className="font-bold text-teal-950 flex items-center space-x-1">
                <User className="w-3.5 h-3.5 text-teal-700 inline mr-1" />
                <span>{patient.full_name}</span>
                <span className="text-slate-500 font-normal">({patient.estimated_age}y • {patient.gender})</span>
              </p>
              <p className="text-[11px] text-teal-800 mt-0.5">
                {patient.village}, {patient.taluka}, {patient.district}
              </p>
            </div>
            {patient.is_pregnant && (
              <span className="bg-pink-100 text-pink-800 text-[10px] font-bold px-2 py-0.5 rounded-full">
                ANC ({patient.gestational_age_weeks || 0}w)
              </span>
            )}
          </div>

          {/* Receiving Facility */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              {t.receivingFacilityCol} *
            </label>
            <select
              value={toFacilityId}
              onChange={e => setToFacilityId(e.target.value)}
              className="w-full text-xs p-2.5 rounded-lg border border-slate-300 bg-white focus:ring-2 focus:ring-teal-500 focus:outline-none"
              required
            >
              {facilities.map(f => (
                <option key={f.id} value={f.id}>
                  {f.name} ({f.facility_type.replace('_', ' ').toUpperCase()} • {f.district})
                </option>
              ))}
            </select>
          </div>

          {/* Specialty Required */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                {t.specialtyCol} *
              </label>
              <select
                value={specialty}
                onChange={e => setSpecialty(e.target.value)}
                className="w-full text-xs p-2.5 rounded-lg border border-slate-300 bg-white focus:ring-2 focus:ring-teal-500 focus:outline-none"
              >
                <option value="Obstetrics & Gynecology">Obstetrics & Gynecology (स्त्रीरोग व प्रसूती)</option>
                <option value="Pediatrics & Neonatology">Pediatrics (बालरोग विभाग)</option>
                <option value="General Medicine">General Medicine (औषधशास्त्र / जनरल मेडिसिन)</option>
                <option value="General Surgery / Trauma">General Surgery (शल्यचिकित्सा / अपघात)</option>
                <option value="Cardiology / Critical Care">Cardiology / ICU (हृदयरोग व अतिदक्षता)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                {t.urgencyCol} *
              </label>
              <select
                value={urgencyTier}
                onChange={e => setUrgencyTier(e.target.value as UrgencyTier)}
                className="w-full text-xs p-2.5 rounded-lg border border-slate-300 bg-white focus:ring-2 focus:ring-teal-500 focus:outline-none"
              >
                <option value="emergency_red">🔴 {t.triageEmergency} (Immediate Transfer)</option>
                <option value="urgent_amber">🟡 {t.triageUrgent} (Transfer within 24h)</option>
                <option value="routine_green">🟢 {t.triageRoutine} (Elective Consultation)</option>
              </select>
            </div>
          </div>

          {/* Reason for Referral */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              {t.referralReasonCol} *
            </label>
            <textarea
              value={reason}
              onChange={e => setReason(e.target.value)}
              rows={3}
              placeholder="Clinical reason, current vitals, danger signs observed, and reason secondary/tertiary care is required..."
              className="w-full text-xs p-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-teal-500 focus:outline-none"
              required
            />
          </div>

          {/* Non diagnostic disclaimer */}
          <div className="bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-[11px] text-slate-600 flex items-center space-x-2">
            <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0" />
            <span>{t.disclaimer}</span>
          </div>

          {/* Buttons */}
          <div className="pt-2 flex justify-end space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
            >
              {t.closeBtn}
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !reason}
              className="px-5 py-2 text-xs font-bold text-white bg-teal-600 hover:bg-teal-700 rounded-lg shadow-sm disabled:opacity-50 transition-colors"
            >
              {isSubmitting ? 'नोंदवत आहे...' : t.initiateReferralBtn}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
