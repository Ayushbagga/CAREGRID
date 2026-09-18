'use client';

import React, { useState, useEffect } from 'react';
import { useLanguage } from '@/lib/i18n/context';
import { QueueService } from '@/lib/offline-sync/queue-service';
import { PatientService } from '@/lib/offline-sync/patient-service';
import { 
  Users, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  Stethoscope, 
  Video, 
  PlusCircle, 
  X,
  Ticket
} from 'lucide-react';
import type { Appointment, Patient, UrgencyTier, AppointmentStatus } from '@/types/healthcare';

interface OPDQueueManagerProps {
  facilityId: string;
  onLaunchTeleconsult?: (patient: Patient, appointment: Appointment) => void;
}

export const OPDQueueManager: React.FC<OPDQueueManagerProps> = ({
  facilityId,
  onLaunchTeleconsult
}) => {
  const { t } = useLanguage();
  const [queue, setQueue] = useState<Appointment[]>([]);
  const [patients, setPatients] = useState<Record<string, Patient>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isTokenModalOpen, setIsTokenModalOpen] = useState(false);

  // New Token Form State
  const [selectedPatientId, setSelectedPatientId] = useState('');
  const [tokenUrgency, setTokenUrgency] = useState<UrgencyTier>('routine_green');
  const [allPatientsList, setAllPatientsList] = useState<Patient[]>([]);

  const loadQueue = async () => {
    setIsLoading(true);
    try {
      const appointments = await QueueService.getFacilityQueue(facilityId);
      setQueue(appointments);

      const patientList = await PatientService.getPatients();
      setAllPatientsList(patientList);

      const map: Record<string, Patient> = {};
      for (const p of patientList) {
        map[p.id] = p;
      }
      setPatients(map);

      if (!selectedPatientId && patientList.length > 0) {
        setSelectedPatientId(patientList[0].id);
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadQueue();
  }, [facilityId]);

  const handleUpdateStatus = async (id: string, newStatus: AppointmentStatus) => {
    await QueueService.updateStatus(id, newStatus);
    await loadQueue();
  };

  const handleGenerateToken = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPatientId) return;

    await QueueService.generateToken({
      patient_id: selectedPatientId,
      facility_id: facilityId,
      queue_tier: tokenUrgency,
      appointment_type: 'physical_opd'
    });

    setIsTokenModalOpen(false);
    await loadQueue();
  };

  const getTierBadge = (tier: UrgencyTier) => {
    switch (tier) {
      case 'emergency_red':
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-black bg-red-600 text-white animate-pulse">
            {t.triageEmergency}
          </span>
        );
      case 'urgent_amber':
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-amber-500 text-white">
            {t.triageUrgent}
          </span>
        );
      case 'routine_green':
      default:
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-600 text-white">
            {t.triageRoutine}
          </span>
        );
    }
  };

  const inQueueCount = queue.filter(a => a.status === 'in_queue').length;
  const inConsultCount = queue.filter(a => a.status === 'in_consultation').length;

  return (
    <div className="space-y-4">
      {/* Top Header & Metrics */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
        <div>
          <h3 className="font-extrabold text-slate-900 text-base sm:text-lg">{t.queueSummary}</h3>
          <p className="text-xs text-slate-500">Urgency-ordered triage queue (Emergency Red &rarr; Urgent Amber &rarr; Routine Green)</p>
        </div>

        <div className="flex items-center space-x-2 w-full sm:w-auto justify-between">
          <div className="flex space-x-2 text-xs">
            <span className="bg-amber-100 text-amber-900 px-2.5 py-1 rounded-lg font-bold">
              {inQueueCount} {t.inQueueCount}
            </span>
            <span className="bg-blue-100 text-blue-900 px-2.5 py-1 rounded-lg font-bold">
              {inConsultCount} {t.inConsultCount}
            </span>
          </div>

          <button
            type="button"
            onClick={() => setIsTokenModalOpen(true)}
            className="px-3.5 py-1.5 bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs rounded-lg shadow-xs flex items-center space-x-1.5 transition-colors"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>{t.generateTokenBtn}</span>
          </button>
        </div>
      </div>

      {/* Queue List */}
      {isLoading ? (
        <div className="py-8 text-center text-xs text-slate-500">Loading OPD queue...</div>
      ) : queue.length === 0 ? (
        <div className="p-8 text-center bg-white rounded-xl border border-slate-200 text-xs text-slate-500">
          {t.emptyQueueMsg}
        </div>
      ) : (
        <div className="space-y-2.5">
          {queue.map(item => {
            const patient = patients[item.patient_id];
            const isEmergency = item.queue_tier === 'emergency_red';

            return (
              <div
                key={item.id}
                className={`p-4 rounded-xl border shadow-xs transition-all flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 ${
                  isEmergency
                    ? 'bg-red-50/70 border-red-300'
                    : item.status === 'in_consultation'
                    ? 'bg-blue-50/60 border-blue-300'
                    : 'bg-white border-slate-200 hover:border-teal-200'
                }`}
              >
                {/* Token & Patient Details */}
                <div className="flex items-start space-x-3">
                  <div className="w-12 h-12 rounded-xl bg-slate-900 text-white flex flex-col items-center justify-center font-black shrink-0 shadow-xs">
                    <span className="text-[10px] uppercase text-slate-400 font-medium">Token</span>
                    <span className="text-base leading-none">#{item.token_number}</span>
                  </div>

                  <div>
                    <div className="flex items-center space-x-2">
                      <h4 className="font-bold text-slate-900 text-sm sm:text-base">
                        {patient ? patient.full_name : `Patient ${item.patient_id.slice(0, 6)}`}
                      </h4>
                      {patient?.is_pregnant && (
                        <span className="text-xs bg-pink-100 text-pink-800 font-bold px-2 py-0.5 rounded-full">
                          🤰 Pregnant
                        </span>
                      )}
                    </div>

                    <p className="text-xs text-slate-600 mt-0.5">
                      {patient ? `${patient.estimated_age}y, ${patient.gender}, ${patient.village}` : 'Demographics loaded'}
                    </p>
                  </div>
                </div>

                {/* Triage Urgency & Action Buttons */}
                <div className="flex flex-wrap items-center gap-2 self-end sm:self-center">
                  <div>{getTierBadge(item.queue_tier)}</div>

                  {item.status === 'in_queue' && (
                    <button
                      type="button"
                      onClick={() => handleUpdateStatus(item.id, 'in_consultation')}
                      className="px-3 py-1.5 bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold rounded-lg shadow-xs flex items-center space-x-1"
                    >
                      <Stethoscope className="w-3.5 h-3.5" />
                      <span>{t.startConsultBtn}</span>
                    </button>
                  )}

                  {item.status === 'in_consultation' && (
                    <div className="flex items-center space-x-2">
                      {onLaunchTeleconsult && patient && (
                        <button
                          type="button"
                          onClick={() => onLaunchTeleconsult(patient, item)}
                          className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg shadow-xs flex items-center space-x-1"
                        >
                          <Video className="w-3.5 h-3.5" />
                          <span>{t.openTeleconsultBtn}</span>
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => handleUpdateStatus(item.id, 'completed')}
                        className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg shadow-xs flex items-center space-x-1"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>{t.completeConsultBtn}</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Manual Walk-In Token Modal */}
      {isTokenModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 max-w-md w-full p-5 space-y-4">
            <div className="flex justify-between items-start">
              <div className="flex items-center space-x-2">
                <Ticket className="w-5 h-5 text-teal-600" />
                <h3 className="font-bold text-base text-slate-900">{t.generateTokenBtn}</h3>
              </div>
              <button onClick={() => setIsTokenModalOpen(false)} className="text-slate-400 hover:text-slate-600 p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleGenerateToken} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">{t.selectPatientLabel}</label>
                <select
                  value={selectedPatientId}
                  onChange={e => setSelectedPatientId(e.target.value)}
                  required
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white"
                >
                  {allPatientsList.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.full_name} ({p.estimated_age}y, {p.village}) {p.is_pregnant ? '🤰' : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">{t.urgencyCol}</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'emergency_red', label: t.triageEmergency, bg: 'bg-red-600 text-white' },
                    { id: 'urgent_amber', label: t.triageUrgent, bg: 'bg-amber-500 text-white' },
                    { id: 'routine_green', label: t.triageRoutine, bg: 'bg-emerald-600 text-white' }
                  ].map(tObj => (
                    <button
                      key={tObj.id}
                      type="button"
                      onClick={() => setTokenUrgency(tObj.id as any)}
                      className={`p-2 rounded-lg text-center font-bold border transition-all ${
                        tokenUrgency === tObj.id
                          ? `${tObj.bg} ring-2 ring-teal-500`
                          : 'bg-slate-50 text-slate-700 border-slate-200'
                      }`}
                    >
                      {tObj.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsTokenModalOpen(false)}
                  className="px-3 py-1.5 font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  {t.closeBtn}
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-lg shadow-xs"
                >
                  Issue Token
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
