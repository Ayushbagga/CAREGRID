'use client';

import React, { useState } from 'react';
import { useLanguage } from '@/lib/i18n/context';
import { 
  Video, 
  Mic, 
  MicOff, 
  VideoOff, 
  PhoneOff, 
  Activity, 
  ShieldCheck, 
  AlertTriangle, 
  Stethoscope,
  User,
  Heart
} from 'lucide-react';
import type { Patient, Appointment } from '@/types/healthcare';

interface TeleconsultRoomProps {
  patient: Patient;
  appointment?: Appointment;
  onEndConsultation?: () => void;
}

export const TeleconsultRoom: React.FC<TeleconsultRoomProps> = ({
  patient,
  appointment,
  onEndConsultation
}) => {
  const { t } = useLanguage();
  const [isAudioMuted, setIsAudioMuted] = useState(false);
  const [isVideoMuted, setIsVideoMuted] = useState(false);
  const [specialistNotes, setSpecialistNotes] = useState('');
  const [isEnding, setIsEnding] = useState(false);

  const handleEnd = () => {
    setIsEnding(true);
    setTimeout(() => {
      if (onEndConsultation) onEndConsultation();
    }, 600);
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col space-y-4 p-4 sm:p-5">
      {/* Top Banner */}
      <div className="flex flex-wrap justify-between items-center gap-2 pb-3 border-b border-slate-100">
        <div>
          <h3 className="font-extrabold text-slate-900 text-base sm:text-lg flex items-center space-x-2">
            <Video className="w-5 h-5 text-indigo-600" />
            <span>{t.teleconsultTitle}</span>
          </h3>
          <p className="text-xs text-slate-500 font-medium">{t.teleconsultSub}</p>
        </div>

        <div className="flex items-center space-x-2">
          <span className="inline-flex items-center space-x-1.5 bg-emerald-50 text-emerald-800 border border-emerald-200 px-3 py-1 rounded-full text-xs font-bold animate-pulse">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            <span>{t.callActive}</span>
          </span>
        </div>
      </div>

      {/* Main Split Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Left: Video / Teleconference Canvas (7 cols) */}
        <div className="lg:col-span-7 bg-slate-950 rounded-xl overflow-hidden flex flex-col justify-between p-4 min-h-[300px] sm:min-h-[360px] text-white shadow-inner relative">
          {/* Top Info Overlay */}
          <div className="flex justify-between items-center text-xs bg-slate-900/80 backdrop-blur-xs p-2.5 rounded-lg border border-slate-800">
            <span className="font-bold text-slate-200">{t.connectedSpecialist}</span>
            <span className="text-[10px] text-slate-400 font-mono">Room: CG-TC-RUR-2026</span>
          </div>

          {/* Central Specialist Video Feed Simulation */}
          <div className="my-auto flex flex-col items-center justify-center text-center space-y-3">
            <div className="w-20 h-20 rounded-full bg-indigo-900/60 border-2 border-indigo-400/50 flex items-center justify-center shadow-lg">
              <Stethoscope className="w-10 h-10 text-indigo-300" />
            </div>
            <div>
              <h4 className="font-bold text-sm text-slate-100">Dr. Vikas Salve, MD</h4>
              <p className="text-xs text-slate-400">Consultant Physician • District Civil Hospital</p>
            </div>
          </div>

          {/* Patient Picture-in-Picture / Call Controls */}
          <div className="flex flex-wrap justify-between items-center gap-2 pt-2 border-t border-slate-800">
            {/* Small PiP */}
            <div className="bg-slate-900 border border-slate-700 px-3 py-1.5 rounded-lg text-[11px] flex items-center space-x-2">
              <User className="w-3.5 h-3.5 text-teal-400" />
              <span>PHC Medical Officer (Local)</span>
            </div>

            {/* Audio / Video Controls */}
            <div className="flex items-center space-x-2 mx-auto sm:mx-0">
              <button
                type="button"
                onClick={() => setIsAudioMuted(!isAudioMuted)}
                className={`p-2 rounded-full transition-colors ${
                  isAudioMuted ? 'bg-red-600 text-white' : 'bg-slate-800 hover:bg-slate-700 text-slate-200'
                }`}
              >
                {isAudioMuted ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
              </button>

              <button
                type="button"
                onClick={() => setIsVideoMuted(!isVideoMuted)}
                className={`p-2 rounded-full transition-colors ${
                  isVideoMuted ? 'bg-red-600 text-white' : 'bg-slate-800 hover:bg-slate-700 text-slate-200'
                }`}
              >
                {isVideoMuted ? <VideoOff className="w-4 h-4" /> : <Video className="w-4 h-4" />}
              </button>

              <button
                type="button"
                onClick={handleEnd}
                className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-lg flex items-center space-x-1 shadow-sm transition-colors"
              >
                <PhoneOff className="w-4 h-4" />
                <span>Disconnect</span>
              </button>
            </div>
          </div>
        </div>

        {/* Right: Live Clinical Summary Panel (5 cols) */}
        <div className="lg:col-span-5 bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3 flex flex-col justify-between text-xs">
          <div className="space-y-3">
            <div className="flex justify-between items-start pb-2 border-b border-slate-200">
              <div>
                <span className="font-bold text-slate-800 text-sm">{patient.full_name}</span>
                <p className="text-slate-500 text-[11px]">
                  {patient.estimated_age}y • {patient.gender} • {patient.village}
                </p>
              </div>
              {appointment && (
                <span className="px-2 py-0.5 rounded bg-slate-900 text-white font-black text-[11px]">
                  Token #{appointment.token_number}
                </span>
              )}
            </div>

            {/* Maternal & Chronic Badges */}
            <div className="flex flex-wrap gap-1">
              {patient.is_pregnant && (
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-pink-100 text-pink-800">
                  🤰 Gestation: {patient.gestational_age_weeks || 0} weeks
                </span>
              )}
              {patient.high_risk_pregnancy && (
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-red-100 text-red-800">
                  ⚠️ High Risk Pregnancy
                </span>
              )}
              {patient.chronic_conditions?.map((c, i) => (
                <span key={i} className="px-2 py-0.5 rounded text-[10px] bg-slate-200 text-slate-800 font-semibold">
                  {c}
                </span>
              ))}
            </div>

            {/* AI Triage Urgency Indicator (Non-Diagnostic) */}
            <div className="p-2.5 rounded-lg border bg-white border-slate-200 space-y-1">
              <span className="font-bold text-slate-700 block text-[11px]">
                {t.triageCardTitle}:
              </span>
              <div className="flex items-center space-x-2">
                <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                  appointment?.queue_tier === 'emergency_red' 
                    ? 'bg-red-600 text-white' 
                    : appointment?.queue_tier === 'urgent_amber'
                    ? 'bg-amber-500 text-white'
                    : 'bg-emerald-600 text-white'
                }`}>
                  {appointment?.queue_tier ? appointment.queue_tier.replace('_', ' ') : 'urgent_amber'}
                </span>
                <span className="text-[11px] text-slate-600 font-medium">
                  Triage Priority Evaluated
                </span>
              </div>
              <p className="text-[10px] text-slate-500 italic mt-1">
                {t.disclaimer}
              </p>
            </div>

            {/* Clinical Observations Area */}
            <div>
              <label className="block font-bold text-slate-800 mb-1">
                {t.consultNotesLabel}:
              </label>
              <textarea
                rows={3}
                value={specialistNotes}
                onChange={e => setSpecialistNotes(e.target.value)}
                placeholder={t.consultNotesPlaceholder}
                className="w-full p-2 text-xs rounded-lg border border-slate-300 bg-white focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div className="pt-2 border-t border-slate-200">
            <button
              type="button"
              onClick={handleEnd}
              disabled={isEnding}
              className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg shadow-xs transition-colors"
            >
              {isEnding ? 'Closing Session...' : t.endConsultBtn}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
