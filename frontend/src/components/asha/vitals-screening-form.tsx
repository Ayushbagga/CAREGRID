'use client';

import React, { useState, useEffect } from 'react';
import { useLanguage } from '@/lib/i18n/context';
import { PatientService } from '@/lib/offline-sync/patient-service';
import { Activity, AlertTriangle, CheckCircle2 } from 'lucide-react';
import type { Patient, Vitals } from '@/types/healthcare';

interface VitalsScreeningFormProps {
  initialPatientId?: string;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export const VitalsScreeningForm: React.FC<VitalsScreeningFormProps> = ({
  initialPatientId,
  onSuccess,
  onCancel
}) => {
  const { t } = useLanguage();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [selectedPatientId, setSelectedPatientId] = useState(initialPatientId || '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const [vitals, setVitals] = useState<Vitals>({
    systolic_bp: undefined,
    diastolic_bp: undefined,
    heart_rate_bpm: undefined,
    respiratory_rate_bpm: undefined,
    spo2_percentage: undefined,
    body_temperature_f: undefined,
    random_blood_glucose_mg_dl: undefined,
    fetal_heart_rate_bpm: undefined,
    recorded_at: new Date().toISOString()
  });

  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>([]);
  const [clinicalNotes, setClinicalNotes] = useState('');
  const [dangerSigns, setDangerSigns] = useState<string[]>([]);
  const [isEmergency, setIsEmergency] = useState(false);

  useEffect(() => {
    PatientService.getPatients().then(list => {
      setPatients(list);
      if (!selectedPatientId && list.length > 0) {
        setSelectedPatientId(list[0].id);
      }
    });
  }, []);

  const activePatient = patients.find(p => p.id === selectedPatientId);

  useEffect(() => {
    const isPregnant = activePatient ? activePatient.is_pregnant : false;
    const { dangerSigns: signs, isEmergency: emergency } = PatientService.evaluateDangerSigns(
      vitals,
      isPregnant,
      selectedSymptoms
    );
    setDangerSigns(signs);
    setIsEmergency(emergency);
  }, [vitals, selectedSymptoms, activePatient]);

  const handleSymptomToggle = (symptomKey: string) => {
    setSelectedSymptoms(prev =>
      prev.includes(symptomKey) ? prev.filter(s => s !== symptomKey) : [...prev, symptomKey]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPatientId || !activePatient) return;

    setIsSubmitting(true);
    try {
      await PatientService.recordEncounter(
        activePatient.id,
        activePatient.full_name,
        vitals,
        selectedSymptoms,
        clinicalNotes,
        activePatient.is_pregnant
      );

      const isOnline = typeof navigator !== 'undefined' && navigator.onLine;
      setSuccessMsg(isOnline ? t.encounterSavedOnline : t.encounterSavedOffline);

      setTimeout(() => {
        if (onSuccess) onSuccess();
      }, 1500);
    } catch (err) {
      console.error('Encounter recording failed:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 sm:p-6 max-w-2xl mx-auto">
      <div className="flex items-center space-x-3 pb-4 border-b border-slate-100 mb-5">
        <div className="w-10 h-10 rounded-lg bg-red-100 text-red-700 flex items-center justify-center font-bold">
          <Activity className="w-5 h-5" />
        </div>
        <div>
          <h3 className="font-bold text-slate-900 text-base sm:text-lg">{t.recordVitalsTitle}</h3>
          <p className="text-xs text-slate-500">{t.recordVitalsSub}</p>
        </div>
      </div>

      {successMsg && (
        <div className="mb-5 p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs sm:text-sm flex items-center space-x-2">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            {t.selectPatientLabel} <span className="text-red-500">*</span>
          </label>
          <select
            value={selectedPatientId}
            onChange={e => setSelectedPatientId(e.target.value)}
            required
            className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white"
          >
            {patients.map(p => (
              <option key={p.id} value={p.id}>
                {p.full_name} ({p.estimated_age}y, {p.village}) {p.is_pregnant ? '🤰' : ''}
              </option>
            ))}
          </select>
        </div>

        {dangerSigns.length > 0 && (
          <div className={`p-4 rounded-xl border ${
            isEmergency 
              ? 'bg-red-50 border-red-300 text-red-950 animate-pulse' 
              : 'bg-amber-50 border-amber-300 text-amber-950'
          }`}>
            <div className="flex items-center space-x-2 font-bold text-sm mb-2 text-red-700">
              <AlertTriangle className="w-5 h-5 text-red-600 shrink-0" />
              <span>{t.dangerSignHeader}</span>
            </div>
            
            <ul className="list-disc list-inside space-y-1 text-xs font-medium mb-3">
              {dangerSigns.map((sign, idx) => (
                <li key={idx} className="text-red-800">{sign}</li>
              ))}
            </ul>

            <div className="pt-2 border-t border-red-200 text-xs text-red-900 font-medium space-y-1">
              <p>👉 <strong>{t.dangerSignGuidance}</strong></p>
              <p className="text-[11px] text-red-700/80 italic">{t.alertNonDiagnosticNotice}</p>
            </div>
          </div>
        )}

        <div className="space-y-3">
          <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">{t.vitalsSection}</h4>
          
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">{t.systolicBP}</label>
              <input
                type="number"
                placeholder="120"
                min="40"
                max="260"
                value={vitals.systolic_bp || ''}
                onChange={e => setVitals({ ...vitals, systolic_bp: e.target.value ? Number(e.target.value) : undefined })}
                className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-300 focus:ring-2 focus:ring-teal-500"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">{t.diastolicBP}</label>
              <input
                type="number"
                placeholder="80"
                min="20"
                max="180"
                value={vitals.diastolic_bp || ''}
                onChange={e => setVitals({ ...vitals, diastolic_bp: e.target.value ? Number(e.target.value) : undefined })}
                className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-300 focus:ring-2 focus:ring-teal-500"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">{t.spo2}</label>
              <input
                type="number"
                placeholder="98"
                min="30"
                max="100"
                value={vitals.spo2_percentage || ''}
                onChange={e => setVitals({ ...vitals, spo2_percentage: e.target.value ? Number(e.target.value) : undefined })}
                className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-300 focus:ring-2 focus:ring-teal-500"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">{t.heartRate}</label>
              <input
                type="number"
                placeholder="76"
                min="30"
                max="240"
                value={vitals.heart_rate_bpm || ''}
                onChange={e => setVitals({ ...vitals, heart_rate_bpm: e.target.value ? Number(e.target.value) : undefined })}
                className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-300 focus:ring-2 focus:ring-teal-500"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">{t.respiratoryRate}</label>
              <input
                type="number"
                placeholder="18"
                min="6"
                max="80"
                value={vitals.respiratory_rate_bpm || ''}
                onChange={e => setVitals({ ...vitals, respiratory_rate_bpm: e.target.value ? Number(e.target.value) : undefined })}
                className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-300 focus:ring-2 focus:ring-teal-500"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">{t.temperature}</label>
              <input
                type="number"
                step="0.1"
                placeholder="98.6"
                min="85"
                max="110"
                value={vitals.body_temperature_f || ''}
                onChange={e => setVitals({ ...vitals, body_temperature_f: e.target.value ? Number(e.target.value) : undefined })}
                className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-300 focus:ring-2 focus:ring-teal-500"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">{t.bloodGlucose}</label>
              <input
                type="number"
                placeholder="110"
                min="20"
                max="600"
                value={vitals.random_blood_glucose_mg_dl || ''}
                onChange={e => setVitals({ ...vitals, random_blood_glucose_mg_dl: e.target.value ? Number(e.target.value) : undefined })}
                className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-300 focus:ring-2 focus:ring-teal-500"
              />
            </div>

            {activePatient?.is_pregnant && (
              <div>
                <label className="block text-[11px] font-semibold text-pink-700 mb-1">{t.fetalHeartRate}</label>
                <input
                  type="number"
                  placeholder="140"
                  min="60"
                  max="200"
                  value={vitals.fetal_heart_rate_bpm || ''}
                  onChange={e => setVitals({ ...vitals, fetal_heart_rate_bpm: e.target.value ? Number(e.target.value) : undefined })}
                  className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-pink-300 focus:ring-2 focus:ring-pink-500 bg-pink-50/40"
                />
              </div>
            )}
          </div>
        </div>

        <div className="space-y-3">
          <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">{t.symptomsSection}</h4>
          
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
            {[
              { id: 'fever', label: t.fever },
              { id: 'cough', label: t.cough },
              { id: 'breathlessness', label: t.breathlessness, danger: true },
              { id: 'chestPain', label: t.chestPain, danger: true },
              { id: 'severeHeadache', label: t.severeHeadache },
              { id: 'bleeding', label: t.bleeding, danger: true },
              { id: 'convulsions', label: t.convulsions, danger: true },
              { id: 'vomiting', label: t.vomiting }
            ].map(symp => (
              <label
                key={symp.id}
                className={`flex items-center space-x-2 p-2 rounded-lg border cursor-pointer transition-colors ${
                  selectedSymptoms.includes(symp.id)
                    ? symp.danger 
                      ? 'bg-red-50 border-red-300 text-red-900 font-bold' 
                      : 'bg-teal-50 border-teal-300 text-teal-900 font-semibold'
                    : 'bg-white border-slate-200 text-slate-700'
                }`}
              >
                <input
                  type="checkbox"
                  checked={selectedSymptoms.includes(symp.id)}
                  onChange={() => handleSymptomToggle(symp.id)}
                  className="rounded text-teal-600"
                />
                <span className="text-[11px] leading-tight">{symp.label}</span>
              </label>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">{t.observationsLabel}</label>
          <textarea
            rows={2}
            value={clinicalNotes}
            onChange={e => setClinicalNotes(e.target.value)}
            placeholder={t.observationsPlaceholder}
            className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:ring-2 focus:ring-teal-500"
          />
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
            {isSubmitting ? t.savingEncounter : t.saveEncounterBtn}
          </button>
        </div>
      </form>
    </div>
  );
};
