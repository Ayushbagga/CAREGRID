import React, { useState, useEffect } from 'react';
import { useLanguage } from '@/lib/i18n/context';
import type { Patient, Referral, FollowUpTask } from '@/types/healthcare';
import { offlineDb, type LocalEncounter } from '@/lib/offline-sync/db';
import { 
  Activity, 
  HeartHandshake, 
  GitPullRequest, 
  CalendarClock, 
  User, 
  Stethoscope, 
  Clock, 
  ShieldCheck, 
  FileText, 
  CheckCircle2, 
  AlertCircle,
  X,
  Filter
} from 'lucide-react';

interface LongitudinalHealthRecordProps {
  patientId: string;
  onClose?: () => void;
}

interface TimelineItem {
  id: string;
  type: 'registration' | 'vitals' | 'encounter' | 'referral' | 'follow_up';
  title: string;
  timestamp: string;
  facilityOrWorker?: string;
  urgencyTier?: string;
  summary: string;
  details?: Record<string, any>;
}

export function LongitudinalHealthRecord({ patientId, onClose }: LongitudinalHealthRecordProps) {
  const { t } = useLanguage();
  const [patient, setPatient] = useState<Patient | null>(null);
  const [timeline, setTimeline] = useState<TimelineItem[]>([]);
  const [filterType, setFilterType] = useState<string>('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadRecord() {
      setLoading(true);
      try {
        const pat = await offlineDb.localPatients.get(patientId);
        setPatient(pat || null);

        const items: TimelineItem[] = [];

        // 1. Intake / Registration
        if (pat) {
          items.push({
            id: `reg-${pat.id}`,
            type: 'registration',
            title: t.registrationEvent,
            timestamp: pat.created_at,
            facilityOrWorker: `ASHA Worker (${pat.assigned_asha_id || 'asha-001'})`,
            summary: `Initial registration at ${pat.village}, ${pat.taluka}. Age: ${pat.estimated_age}y, Gender: ${pat.gender}. ${pat.abha_id ? `ABHA: ${pat.abha_id}` : ''}`,
            details: {
              chronic_conditions: pat.chronic_conditions || [],
              is_pregnant: pat.is_pregnant,
              high_risk: pat.high_risk_pregnancy
            }
          });
        }

        // 2. Encounters & Vitals
        const encounters = await offlineDb.localEncounters
          .where('patient_id')
          .equals(patientId)
          .toArray();

        encounters.forEach(enc => {
          if (enc.vitals) {
            const v = enc.vitals;
            const vitalsSummary = [
              v.systolic_bp ? `BP: ${v.systolic_bp}/${v.diastolic_bp} mmHg` : null,
              v.spo2_percentage ? `SpO2: ${v.spo2_percentage}%` : null,
              v.heart_rate_bpm ? `HR: ${v.heart_rate_bpm} bpm` : null,
              v.body_temperature_f ? `Temp: ${v.body_temperature_f}°F` : null,
              v.random_blood_glucose_mg_dl ? `RBG: ${v.random_blood_glucose_mg_dl} mg/dL` : null
            ].filter(Boolean).join(' • ');

            items.push({
              id: `vit-${enc.id}`,
              type: 'vitals',
              title: t.vitalsEvent,
              timestamp: enc.created_at,
              facilityOrWorker: enc.encounter_type === 'asha_home_visit' ? 'ASHA Field Screening' : 'PHC Clinical Screening',
              summary: vitalsSummary || 'Baseline vitals screened',
              details: { vitals: enc.vitals, complaints: enc.chief_complaints }
            });
          }

          if (enc.clinical_notes || enc.chief_complaints?.length > 0) {
            items.push({
              id: `enc-${enc.id}`,
              type: 'encounter',
              title: enc.encounter_type === 'teleconsultation' ? 'Teleconsultation Consultation' : t.encounterEvent,
              timestamp: enc.created_at,
              facilityOrWorker: 'Medical Officer / Specialist',
              summary: enc.clinical_notes || (enc.chief_complaints || []).join(', '),
              details: { complaints: enc.chief_complaints }
            });
          }
        });

        // 3. Referrals
        const referrals = await offlineDb.localReferrals
          .where('patient_id')
          .equals(patientId)
          .toArray();

        referrals.forEach(ref => {
          items.push({
            id: `ref-${ref.id}`,
            type: 'referral',
            title: `${t.referralEvent} (${ref.referral_code})`,
            timestamp: ref.created_at,
            urgencyTier: ref.urgency_tier,
            facilityOrWorker: `${ref.required_specialty}`,
            summary: ref.referral_reason,
            details: {
              status: ref.status,
              discharge_summary: ref.discharge_summary,
              instructions_for_asha: ref.post_discharge_instructions_for_asha
            }
          });
        });

        // 4. Follow-Up Tasks
        const followUps = await offlineDb.localFollowUpTasks
          .where('patient_id')
          .equals(patientId)
          .toArray();

        followUps.forEach(fu => {
          items.push({
            id: `fu-${fu.id}`,
            type: 'follow_up',
            title: `${t.followUpEvent} (${fu.task_type.replace(/_/g, ' ').toUpperCase()})`,
            timestamp: fu.completed_at || fu.due_date,
            facilityOrWorker: `ASHA Worker (${fu.assigned_asha_id})`,
            summary: fu.status === 'completed'
              ? `Completed: ${fu.completion_notes || 'Home follow-up visit successfully conducted.'}`
              : `Scheduled due on: ${fu.due_date}`,
            details: { status: fu.status, notes: fu.completion_notes }
          });
        });

        // Sort descending (latest first)
        items.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
        setTimeline(items);
      } catch (err) {
        console.error('Failed to load longitudinal record:', err);
      } finally {
        setLoading(false);
      }
    }

    if (patientId) {
      loadRecord();
    }
  }, [patientId]);

  const filteredTimeline = timeline.filter(item => {
    if (filterType === 'all') return true;
    return item.type === filterType;
  });

  return (
    <div className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
      {/* Header Banner */}
      <div className="bg-slate-900 text-white p-4 sm:p-5 flex justify-between items-start gap-3">
        <div className="space-y-1">
          <div className="flex items-center space-x-2">
            <span className="text-xs bg-teal-500/20 text-teal-300 font-mono px-2 py-0.5 rounded font-bold">
              {patient?.abha_id || 'ABHA PENDING'}
            </span>
            {patient?.high_risk_pregnancy && (
              <span className="text-[10px] bg-red-500/20 text-red-300 font-bold px-2 py-0.5 rounded-full border border-red-500/30">
                HIGH RISK PREGNANCY
              </span>
            )}
          </div>
          <h2 className="text-lg sm:text-xl font-black text-white">
            {patient ? patient.full_name : 'Patient Record'}
          </h2>
          <p className="text-xs text-slate-300">
            {patient ? `${patient.estimated_age}y • ${patient.gender.toUpperCase()} • ${patient.village}, ${patient.taluka}, ${patient.district}` : ''}
          </p>
          {patient?.chronic_conditions && patient.chronic_conditions.length > 0 && (
            <div className="flex flex-wrap gap-1 pt-1">
              {patient.chronic_conditions.map((c, idx) => (
                <span key={idx} className="text-[10px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded">
                  {c}
                </span>
              ))}
            </div>
          )}
        </div>

        {onClose && (
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Filter Tabs */}
      <div className="bg-slate-50 border-b border-slate-200 px-4 py-2 flex flex-wrap items-center gap-1.5 text-xs font-semibold">
        <button
          onClick={() => setFilterType('all')}
          className={`px-3 py-1 rounded-lg transition-colors ${
            filterType === 'all' ? 'bg-teal-600 text-white shadow-xs' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
          }`}
        >
          {t.timelineFilterAll} ({timeline.length})
        </button>
        <button
          onClick={() => setFilterType('vitals')}
          className={`px-3 py-1 rounded-lg transition-colors ${
            filterType === 'vitals' ? 'bg-teal-600 text-white shadow-xs' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
          }`}
        >
          {t.timelineFilterVitals}
        </button>
        <button
          onClick={() => setFilterType('encounter')}
          className={`px-3 py-1 rounded-lg transition-colors ${
            filterType === 'encounter' ? 'bg-teal-600 text-white shadow-xs' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
          }`}
        >
          {t.timelineFilterEncounters}
        </button>
        <button
          onClick={() => setFilterType('referral')}
          className={`px-3 py-1 rounded-lg transition-colors ${
            filterType === 'referral' ? 'bg-teal-600 text-white shadow-xs' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
          }`}
        >
          {t.timelineFilterReferrals}
        </button>
        <button
          onClick={() => setFilterType('follow_up')}
          className={`px-3 py-1 rounded-lg transition-colors ${
            filterType === 'follow_up' ? 'bg-teal-600 text-white shadow-xs' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
          }`}
        >
          {t.timelineFilterFollowUps}
        </button>
      </div>

      {/* Timeline List */}
      <div className="p-4 sm:p-5 overflow-y-auto space-y-4 flex-1">
        {loading ? (
          <div className="text-center py-8 text-xs text-slate-500">Loading timeline...</div>
        ) : filteredTimeline.length === 0 ? (
          <div className="text-center py-8 text-xs text-slate-500">
            {t.noTimelineEvents}
          </div>
        ) : (
          <div className="relative border-l-2 border-slate-200 ml-4 pl-4 space-y-5">
            {filteredTimeline.map(item => {
              const getIcon = () => {
                switch (item.type) {
                  case 'registration': return <User className="w-3.5 h-3.5 text-blue-600" />;
                  case 'vitals': return <Activity className="w-3.5 h-3.5 text-teal-600" />;
                  case 'encounter': return <Stethoscope className="w-3.5 h-3.5 text-indigo-600" />;
                  case 'referral': return <GitPullRequest className="w-3.5 h-3.5 text-amber-600" />;
                  case 'follow_up': return <HeartHandshake className="w-3.5 h-3.5 text-pink-600" />;
                }
              };

              const getBadge = () => {
                if (item.urgencyTier) {
                  return (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-100 text-amber-800 uppercase">
                      {item.urgencyTier.replace('_', ' ')}
                    </span>
                  );
                }
                if (item.details?.status) {
                  return (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700 uppercase">
                      {item.details.status}
                    </span>
                  );
                }
                return null;
              };

              return (
                <div key={item.id} className="relative group">
                  {/* Timeline Dot */}
                  <div className="absolute -left-[25px] top-1.5 w-6 h-6 rounded-full bg-white border-2 border-teal-600 flex items-center justify-center shadow-xs">
                    {getIcon()}
                  </div>

                  {/* Timeline Content Card */}
                  <div className="bg-slate-50 hover:bg-white border border-slate-200 rounded-xl p-3.5 shadow-2xs space-y-1.5 transition-colors text-slate-900">
                    <div className="flex flex-wrap justify-between items-start gap-1">
                      <div>
                        <h4 className="font-bold text-xs sm:text-sm text-slate-900">
                          {item.title}
                        </h4>
                        <p className="text-[11px] text-slate-500 font-medium">
                          {item.facilityOrWorker}
                        </p>
                      </div>
                      <div className="flex items-center space-x-2">
                        {getBadge()}
                        <span className="text-[11px] text-slate-400 font-medium">
                          {new Date(item.timestamp).toLocaleDateString()}
                        </span>
                      </div>
                    </div>

                    <p className="text-xs text-slate-700 leading-relaxed font-normal">
                      {item.summary}
                    </p>

                    {/* Extended Details if referral */}
                    {item.details?.instructions_for_asha && (
                      <div className="mt-2 p-2 bg-teal-50 border border-teal-200 rounded-md text-[11px] text-teal-900">
                        <span className="font-bold">आशा सेविकेसाठी सूचना:</span> {item.details.instructions_for_asha}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Footer Disclaimer */}
      <div className="bg-slate-50 border-t border-slate-200 p-3 flex items-center space-x-2 text-[11px] text-slate-500 italic">
        <ShieldCheck className="w-4 h-4 text-teal-600 shrink-0" />
        <span>{t.disclaimer}</span>
      </div>
    </div>
  );
}
