'use client';

import React, { useState } from 'react';
import { useLanguage } from '@/lib/i18n/context';
import { PatientService } from '@/lib/offline-sync/patient-service';
import { UserPlus, CheckCircle2 } from 'lucide-react';
import type { Patient } from '@/types/healthcare';

interface PatientIntakeFormProps {
  onSuccess?: (patient: Patient) => void;
  onCancel?: () => void;
}

export const PatientIntakeForm: React.FC<PatientIntakeFormProps> = ({ onSuccess, onCancel }) => {
  const { t } = useLanguage();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    fullName: '',
    estimatedAge: 25,
    gender: 'female' as 'male' | 'female' | 'other',
    primaryPhone: '',
    village: 'रेगुंठा (Reguntha)',
    taluka: 'सिरोंचा (Sironcha)',
    district: 'गडचिरोली (Gadchiroli)',
    primaryFacilityId: '11111111-0000-0000-0000-000000000002',
    abhaId: '',
    isPregnant: false,
    gestationalWeeks: 20,
    highRiskPregnancy: false,
    chronicConditions: [] as string[]
  });

  const handleChronicToggle = (condition: string) => {
    setFormData(prev => ({
      ...prev,
      chronicConditions: prev.chronicConditions.includes(condition)
        ? prev.chronicConditions.filter(c => c !== condition)
        : [...prev.chronicConditions, condition]
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.fullName || !formData.primaryPhone) return;

    setIsSubmitting(true);
    try {
      const newPatient = await PatientService.registerPatient({
        full_name: formData.fullName,
        estimated_age: Number(formData.estimatedAge),
        gender: formData.gender,
        primary_phone: formData.primaryPhone,
        village: formData.village,
        taluka: formData.taluka,
        district: formData.district,
        primary_facility_id: formData.primaryFacilityId,
        abha_id: formData.abhaId || undefined,
        is_pregnant: formData.isPregnant,
        gestational_age_weeks: formData.isPregnant ? Number(formData.gestationalWeeks) : undefined,
        high_risk_pregnancy: formData.isPregnant && formData.highRiskPregnancy,
        chronic_conditions: formData.chronicConditions
      });

      const isOnline = typeof navigator !== 'undefined' && navigator.onLine;
      setSuccessMsg(isOnline ? t.savedOnlineSuccess : t.savedOfflineSuccess);

      setTimeout(() => {
        if (onSuccess) onSuccess(newPatient);
      }, 1500);
    } catch (err) {
      console.error('Registration failed:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 sm:p-6 max-w-2xl mx-auto">
      <div className="flex items-center space-x-3 pb-4 border-b border-slate-100 mb-5">
        <div className="w-10 h-10 rounded-lg bg-teal-100 text-teal-700 flex items-center justify-center font-bold">
          <UserPlus className="w-5 h-5" />
        </div>
        <div>
          <h3 className="font-bold text-slate-900 text-base sm:text-lg">{t.patientRegistration}</h3>
          <p className="text-xs text-slate-500">{t.patientRegistrationSub}</p>
        </div>
      </div>

      {successMsg && (
        <div className="mb-5 p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs sm:text-sm flex items-center space-x-2">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            {t.fullName} <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            required
            value={formData.fullName}
            onChange={e => setFormData({ ...formData, fullName: e.target.value })}
            placeholder={t.fullNamePlaceholder}
            className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              {t.age} <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              min="0"
              max="125"
              required
              value={formData.estimatedAge}
              onChange={e => setFormData({ ...formData, estimatedAge: Number(e.target.value) })}
              className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              {t.gender} <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.gender}
              onChange={e => setFormData({ ...formData, gender: e.target.value as any })}
              className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white"
            >
              <option value="female">{t.female}</option>
              <option value="male">{t.male}</option>
              <option value="other">{t.other}</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              {t.phone} <span className="text-red-500">*</span>
            </label>
            <input
              type="tel"
              required
              pattern="[0-9]{10}"
              value={formData.primaryPhone}
              onChange={e => setFormData({ ...formData, primaryPhone: e.target.value })}
              placeholder={t.phonePlaceholder}
              className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              {t.abhaId}
            </label>
            <input
              type="text"
              value={formData.abhaId}
              onChange={e => setFormData({ ...formData, abhaId: e.target.value })}
              placeholder={t.abhaPlaceholder}
              className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2 bg-slate-50 p-3 rounded-lg border border-slate-200 text-xs">
          <div>
            <label className="block font-medium text-slate-600 mb-0.5">{t.village}</label>
            <input
              type="text"
              value={formData.village}
              onChange={e => setFormData({ ...formData, village: e.target.value })}
              className="w-full px-2 py-1.5 rounded border border-slate-300 bg-white"
            />
          </div>
          <div>
            <label className="block font-medium text-slate-600 mb-0.5">{t.taluka}</label>
            <input
              type="text"
              value={formData.taluka}
              onChange={e => setFormData({ ...formData, taluka: e.target.value })}
              className="w-full px-2 py-1.5 rounded border border-slate-300 bg-white"
            />
          </div>
          <div>
            <label className="block font-medium text-slate-600 mb-0.5">{t.district}</label>
            <input
              type="text"
              value={formData.district}
              onChange={e => setFormData({ ...formData, district: e.target.value })}
              className="w-full px-2 py-1.5 rounded border border-slate-300 bg-white"
            />
          </div>
        </div>

        {formData.gender === 'female' && (
          <div className="p-3 bg-pink-50/60 border border-pink-200 rounded-lg space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-pink-900">{t.isPregnant}</span>
              <input
                type="checkbox"
                checked={formData.isPregnant}
                onChange={e => setFormData({ ...formData, isPregnant: e.target.checked })}
                className="w-4 h-4 text-pink-600 rounded focus:ring-pink-500 cursor-pointer"
              />
            </div>

            {formData.isPregnant && (
              <div className="grid grid-cols-2 gap-3 pt-2 border-t border-pink-100">
                <div>
                  <label className="block text-[11px] font-semibold text-pink-900 mb-1">
                    {t.gestationalWeeks}
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="42"
                    value={formData.gestationalWeeks}
                    onChange={e => setFormData({ ...formData, gestationalWeeks: Number(e.target.value) })}
                    className="w-full px-2 py-1.5 text-xs rounded border border-pink-300 bg-white focus:ring-pink-500"
                  />
                </div>

                <div className="flex items-center space-x-2 pt-4">
                  <input
                    type="checkbox"
                    id="hrpCheck"
                    checked={formData.highRiskPregnancy}
                    onChange={e => setFormData({ ...formData, highRiskPregnancy: e.target.checked })}
                    className="w-4 h-4 text-red-600 rounded focus:ring-red-500 cursor-pointer"
                  />
                  <label htmlFor="hrpCheck" className="text-xs font-bold text-red-700 cursor-pointer">
                    {t.highRiskFlag}
                  </label>
                </div>
              </div>
            )}
          </div>
        )}

        <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-2">
          <label className="block text-xs font-bold text-slate-800">{t.chronicConditions}</label>
          <div className="grid grid-cols-2 gap-2 text-xs">
            {[
              { id: 'hypertension', label: t.hypertension },
              { id: 'diabetes', label: t.diabetes },
              { id: 'sickleCell', label: t.sickleCell },
              { id: 'asthma', label: t.asthma }
            ].map(cond => (
              <label
                key={cond.id}
                className={`flex items-center space-x-2 p-2 rounded-md border cursor-pointer transition-colors ${
                  formData.chronicConditions.includes(cond.label)
                    ? 'bg-teal-50 border-teal-300 text-teal-900 font-semibold'
                    : 'bg-white border-slate-200 text-slate-700'
                }`}
              >
                <input
                  type="checkbox"
                  checked={formData.chronicConditions.includes(cond.label)}
                  onChange={() => handleChronicToggle(cond.label)}
                  className="rounded text-teal-600"
                />
                <span className="text-[11px] leading-tight">{cond.label}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-100">
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
            >
              {t.closeBtn}
            </button>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full sm:w-auto px-6 py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs sm:text-sm rounded-lg shadow disabled:opacity-50"
          >
            {isSubmitting ? t.savingPatient : t.savePatientBtn}
          </button>
        </div>
      </form>
    </div>
  );
};
