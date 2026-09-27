'use client';

import React, { useState, useEffect } from 'react';
import { useLanguage } from '@/lib/i18n/context';
import { getPhaseDI18n } from '@/lib/i18n/phase-d-i18n';
import { PatientService } from '@/lib/offline-sync/patient-service';
import { Activity, AlertTriangle, CheckCircle2, Sparkles, Search, Plus, Minus, HeartHandshake } from 'lucide-react';
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
  const { t, locale } = useLanguage();
  const tD = getPhaseDI18n(locale);

  const [patients, setPatients] = useState<Patient[]>([]);
  const [selectedPatientId, setSelectedPatientId] = useState(initialPatientId || '');
  const [patientSearch, setPatientSearch] = useState('');
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

  const applyPreset = (type: 'adult' | 'antenatal') => {
    if (type === 'adult') {
      setVitals({
        systolic_bp: 120,
        diastolic_bp: 80,
        heart_rate_bpm: 76,
        respiratory_rate_bpm: 16,
        spo2_percentage: 98,
        body_temperature_f: 98.6,
        random_blood_glucose_mg_dl: 95,
        fetal_heart_rate_bpm: undefined,
        recorded_at: new Date().toISOString()
      });
    } else {
      setVitals({
        systolic_bp: 115,
        diastolic_bp: 75,
        heart_rate_bpm: 82,
        respiratory_rate_bpm: 18,
        spo2_percentage: 99,
        body_temperature_f: 98.4,
        random_blood_glucose_mg_dl: 90,
        fetal_heart_rate_bpm: 140,
        recorded_at: new Date().toISOString()
      });
    }
  };

  const stepVital = (field: keyof Vitals, delta: number, min: number, max: number) => {
    const current = (vitals[field] as number) || (field === 'spo2_percentage' ? 98 : field === 'systolic_bp' ? 120 : field === 'heart_rate_bpm' ? 76 : 80);
    const updated = Math.max(min, Math.min(max, current + delta));
    setVitals(prev => ({ ...prev, [field]: updated }));
  };

  const filteredPatients = patients.filter(p => {
    if (!patientSearch.trim()) return true;
    const q = patientSearch.toLowerCase();
    return (
      p.full_name?.toLowerCase().includes(q) ||
      p.village?.toLowerCase().includes(q) ||
      p.primary_phone?.includes(q) ||
      p.abha_id?.includes(q)
    );
  });

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

  // Vital threshold flags
  const isHypoxic = vitals.spo2_percentage !== undefined && vitals.spo2_percentage < 90;
  const isHypotensive = vitals.systolic_bp !== undefined && vitals.systolic_bp < 80;
  const isHypertensive = activePatient?.is_pregnant
    ? (vitals.systolic_bp && vitals.systolic_bp >= 140) || (vitals.diastolic_bp && vitals.diastolic_bp >= 90)
    : (vitals.systolic_bp && vitals.systolic_bp >= 140) || (vitals.diastolic_bp && vitals.diastolic_bp >= 90);

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 sm:p-6 max-w-2xl mx-auto space-y-5">
      {/* Header */}
      <div className="flex items-center space-x-3 pb-4 border-b border-slate-100">
        <div className="w-10 h-10 rounded-lg bg-red-100 text-red-700 flex items-center justify-center font-bold">
          <Activity className="w-5 h-5" />
        </div>
        <div>
          <h3 className="font-bold text-slate-900 text-base sm:text-lg">{t.recordVitalsTitle}</h3>
          <p className="text-xs text-slate-500">{t.recordVitalsSub}</p>
        </div>
      </div>

      {successMsg && (
        <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs sm:text-sm flex items-center space-x-2">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Quick Vitals Presets Bar */}
      <div className="p-3.5 bg-gradient-to-r from-teal-50/80 to-teal-100/40 rounded-xl border border-teal-200/80 space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-extrabold text-teal-950 flex items-center space-x-1.5">
            <Sparkles className="w-4 h-4 text-teal-600" />
            <span>{tD.quickPresetsTitle}</span>
          </span>
          <span className="text-[10px] text-teal-700 font-bold bg-white px-2 py-0.5 rounded-full border border-teal-200">
            Fast Mobile Entry
          </span>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => applyPreset('adult')}
            className="px-3.5 py-2 bg-white hover:bg-teal-50 active:bg-teal-100 text-teal-900 text-xs font-bold rounded-lg border border-teal-300 shadow-2xs transition-all flex items-center space-x-1.5 min-h-[44px] focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-500"
          >
            <span>⚡ {tD.normalAdultPreset}</span>
          </button>
          <button
            type="button"
            onClick={() => applyPreset('antenatal')}
            className="px-3.5 py-2 bg-white hover:bg-pink-50 active:bg-pink-100 text-pink-900 text-xs font-bold rounded-lg border border-pink-300 shadow-2xs transition-all flex items-center space-x-1.5 min-h-[44px] focus:outline-none focus-visible:ring-2 focus-visible:ring-pink-500"
          >
            <span>🤰 {tD.normalAntenatalPreset}</span>
          </button>
        </div>
        <p className="text-[11px] text-teal-800">{tD.quickVitalsHelper}</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Fast Patient Search & Selector */}
        <div className="space-y-2">
          <label className="block text-xs font-semibold text-slate-700">
            {t.selectPatientLabel} <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              value={patientSearch}
              onChange={e => setPatientSearch(e.target.value)}
              placeholder={tD.searchPatientPlaceholder}
              className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white min-h-[44px]"
            />
          </div>
          <select
            value={selectedPatientId}
            onChange={e => setSelectedPatientId(e.target.value)}
            required
            className="w-full px-3 py-2.5 text-xs sm:text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white min-h-[44px]"
          >
            {filteredPatients.map(p => (
              <option key={p.id} value={p.id}>
                {p.full_name} ({p.estimated_age}y, {p.village}) {p.is_pregnant ? '🤰 [Pregnant]' : ''} {p.high_risk_pregnancy ? '⚠️ [High-Risk]' : ''}
              </option>
            ))}
          </select>
        </div>

        {/* High-Risk Pregnancy Alert Flag */}
        {activePatient?.high_risk_pregnancy && (
          <div className="p-3 bg-rose-50 border border-rose-300 rounded-xl flex items-center space-x-2 text-rose-900 text-xs font-bold">
            <HeartHandshake className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{tD.highRiskPregnancyAlert}: Priority Antenatal Care Protocol Active</span>
          </div>
        )}

        {/* Danger Signs Alert Banner */}
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

        {/* Vitals Numeric Inputs with Touch Steppers */}
        <div className="space-y-3">
          <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">{t.vitalsSection}</h4>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Blood Pressure Card with Steppers */}
            <div className={`p-3 rounded-xl border ${isHypertensive ? 'border-amber-400 bg-amber-50/40' : isHypotensive ? 'border-red-400 bg-red-50/40' : 'border-slate-200 bg-slate-50/50'}`}>
              <div className="flex justify-between items-center mb-1.5">
                <label className="text-[11px] font-bold text-slate-700">{t.systolicBP} / {t.diastolicBP} (mmHg)</label>
                <div className="flex space-x-1">
                  <button
                    type="button"
                    onClick={() => {
                      stepVital('systolic_bp', -5, 40, 260);
                      stepVital('diastolic_bp', -5, 20, 180);
                    }}
                    className="w-7 h-7 bg-white hover:bg-slate-100 border border-slate-300 rounded flex items-center justify-center font-bold text-slate-700"
                    title="-5 BP"
                  >
                    <Minus className="w-3 h-3" />
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      stepVital('systolic_bp', 5, 40, 260);
                      stepVital('diastolic_bp', 5, 20, 180);
                    }}
                    className="w-7 h-7 bg-white hover:bg-slate-100 border border-slate-300 rounded flex items-center justify-center font-bold text-slate-700"
                    title="+5 BP"
                  >
                    <Plus className="w-3 h-3" />
                  </button>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="number"
                  placeholder="120"
                  min="40"
                  max="260"
                  value={vitals.systolic_bp || ''}
                  onChange={e => setVitals({ ...vitals, systolic_bp: e.target.value ? Number(e.target.value) : undefined })}
                  className="w-full px-2.5 py-2 text-xs rounded-lg border border-slate-300 focus:ring-2 focus:ring-teal-500 bg-white min-h-[44px]"
                />
                <input
                  type="number"
                  placeholder="80"
                  min="20"
                  max="180"
                  value={vitals.diastolic_bp || ''}
                  onChange={e => setVitals({ ...vitals, diastolic_bp: e.target.value ? Number(e.target.value) : undefined })}
                  className="w-full px-2.5 py-2 text-xs rounded-lg border border-slate-300 focus:ring-2 focus:ring-teal-500 bg-white min-h-[44px]"
                />
              </div>
            </div>

            {/* SpO2 Card with Steppers */}
            <div className={`p-3 rounded-xl border ${isHypoxic ? 'border-red-400 bg-red-50/40' : 'border-slate-200 bg-slate-50/50'}`}>
              <div className="flex justify-between items-center mb-1.5">
                <label className="text-[11px] font-bold text-slate-700">{t.spo2} (%)</label>
                <div className="flex space-x-1">
                  <button
                    type="button"
                    onClick={() => stepVital('spo2_percentage', -1, 30, 100)}
                    className="w-7 h-7 bg-white hover:bg-slate-100 border border-slate-300 rounded flex items-center justify-center font-bold text-slate-700"
                    title="-1 SpO2"
                  >
                    <Minus className="w-3 h-3" />
                  </button>
                  <button
                    type="button"
                    onClick={() => stepVital('spo2_percentage', 1, 30, 100)}
                    className="w-7 h-7 bg-white hover:bg-slate-100 border border-slate-300 rounded flex items-center justify-center font-bold text-slate-700"
                    title="+1 SpO2"
                  >
                    <Plus className="w-3 h-3" />
                  </button>
                </div>
              </div>
              <input
                type="number"
                placeholder="98"
                min="30"
                max="100"
                value={vitals.spo2_percentage || ''}
                onChange={e => setVitals({ ...vitals, spo2_percentage: e.target.value ? Number(e.target.value) : undefined })}
                className="w-full px-2.5 py-2 text-xs rounded-lg border border-slate-300 focus:ring-2 focus:ring-teal-500 bg-white min-h-[44px]"
              />
            </div>

            {/* Pulse Rate Card with Steppers */}
            <div className="p-3 rounded-xl border border-slate-200 bg-slate-50/50">
              <div className="flex justify-between items-center mb-1.5">
                <label className="text-[11px] font-bold text-slate-700">{t.heartRate} (bpm)</label>
                <div className="flex space-x-1">
                  <button
                    type="button"
                    onClick={() => stepVital('heart_rate_bpm', -2, 30, 240)}
                    className="w-7 h-7 bg-white hover:bg-slate-100 border border-slate-300 rounded flex items-center justify-center font-bold text-slate-700"
                    title="-2 HR"
                  >
                    <Minus className="w-3 h-3" />
                  </button>
                  <button
                    type="button"
                    onClick={() => stepVital('heart_rate_bpm', 2, 30, 240)}
                    className="w-7 h-7 bg-white hover:bg-slate-100 border border-slate-300 rounded flex items-center justify-center font-bold text-slate-700"
                    title="+2 HR"
                  >
                    <Plus className="w-3 h-3" />
                  </button>
                </div>
              </div>
              <input
                type="number"
                placeholder="76"
                min="30"
                max="240"
                value={vitals.heart_rate_bpm || ''}
                onChange={e => setVitals({ ...vitals, heart_rate_bpm: e.target.value ? Number(e.target.value) : undefined })}
                className="w-full px-2.5 py-2 text-xs rounded-lg border border-slate-300 focus:ring-2 focus:ring-teal-500 bg-white min-h-[44px]"
              />
            </div>

            {/* Respiratory Rate & Temperature */}
            <div className="p-3 rounded-xl border border-slate-200 bg-slate-50/50">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1.5">{t.respiratoryRate}</label>
                  <input
                    type="number"
                    placeholder="18"
                    min="6"
                    max="80"
                    value={vitals.respiratory_rate_bpm || ''}
                    onChange={e => setVitals({ ...vitals, respiratory_rate_bpm: e.target.value ? Number(e.target.value) : undefined })}
                    className="w-full px-2.5 py-2 text-xs rounded-lg border border-slate-300 focus:ring-2 focus:ring-teal-500 bg-white min-h-[44px]"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1.5">{t.temperature}</label>
                  <input
                    type="number"
                    step="0.1"
                    placeholder="98.6"
                    min="85"
                    max="110"
                    value={vitals.body_temperature_f || ''}
                    onChange={e => setVitals({ ...vitals, body_temperature_f: e.target.value ? Number(e.target.value) : undefined })}
                    className="w-full px-2.5 py-2 text-xs rounded-lg border border-slate-300 focus:ring-2 focus:ring-teal-500 bg-white min-h-[44px]"
                  />
                </div>
              </div>
            </div>

            {/* Antenatal Fetal Heart Rate */}
            {activePatient?.is_pregnant && (
              <div className="p-3 rounded-xl border border-pink-200 bg-pink-50/40 col-span-1 sm:col-span-2">
                <label className="block text-[11px] font-bold text-pink-900 mb-1.5">{t.fetalHeartRate} (bpm)</label>
                <input
                  type="number"
                  placeholder="140"
                  min="60"
                  max="200"
                  value={vitals.fetal_heart_rate_bpm || ''}
                  onChange={e => setVitals({ ...vitals, fetal_heart_rate_bpm: e.target.value ? Number(e.target.value) : undefined })}
                  className="w-full px-2.5 py-2 text-xs rounded-lg border border-pink-300 focus:ring-2 focus:ring-pink-500 bg-white min-h-[44px]"
                />
              </div>
            )}
          </div>
        </div>

        {/* Symptoms Section */}
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
                className={`flex items-center space-x-2 p-2 rounded-lg border cursor-pointer transition-colors min-h-[44px] ${
                  selectedSymptoms.includes(symp.id)
                    ? symp.danger 
                      ? 'bg-red-50 border-red-300 text-red-900 font-bold' 
                      : 'bg-teal-50 border-teal-300 text-teal-900 font-semibold'
                    : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                }`}
              >
                <input
                  type="checkbox"
                  checked={selectedSymptoms.includes(symp.id)}
                  onChange={() => handleSymptomToggle(symp.id)}
                  className="rounded text-teal-600 w-4 h-4"
                />
                <span className="text-[11px] leading-tight">{symp.label}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Clinical Notes */}
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

        {/* Action Buttons */}
        <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-100">
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg min-h-[44px]"
            >
              {t.closeBtn}
            </button>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full sm:w-auto px-6 py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs sm:text-sm rounded-lg shadow-sm disabled:opacity-50 min-h-[44px] focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-500"
          >
            {isSubmitting ? t.savingEncounter : t.saveEncounterBtn}
          </button>
        </div>
      </form>
    </div>
  );
};
