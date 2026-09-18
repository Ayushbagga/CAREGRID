import React, { useState, useEffect } from 'react';
import { useLanguage } from '@/lib/i18n/context';
import type { FollowUpTask, Patient, Referral } from '@/types/healthcare';
import { FollowUpService } from '@/lib/offline-sync/follow-up-service';
import { PatientService } from '@/lib/offline-sync/patient-service';
import { ReferralService } from '@/lib/offline-sync/referral-service';
import { 
  HeartHandshake, 
  Clock, 
  AlertTriangle, 
  CheckCircle2, 
  Calendar, 
  User, 
  FileText, 
  Activity, 
  X, 
  Building2,
  Plus
} from 'lucide-react';

interface AshaFollowUpListProps {
  ashaId?: string;
  onViewHealthRecord?: (patientId: string) => void;
}

export function AshaFollowUpList({ ashaId = 'asha-001', onViewHealthRecord }: AshaFollowUpListProps) {
  const { t } = useLanguage();
  const [tasks, setTasks] = useState<{
    overdue: FollowUpTask[];
    dueToday: FollowUpTask[];
    upcoming: FollowUpTask[];
    all: FollowUpTask[];
  }>({ overdue: [], dueToday: [], upcoming: [], all: [] });

  const [patients, setPatients] = useState<Record<string, Patient>>({});
  const [referrals, setReferrals] = useState<Record<string, Referral>>({});
  const [activeTab, setActiveTab] = useState<'dueToday' | 'overdue' | 'upcoming' | 'completed'>('dueToday');
  const [loading, setLoading] = useState(true);

  // Completion modal state
  const [selectedTask, setSelectedTask] = useState<FollowUpTask | null>(null);
  const [completionNotes, setCompletionNotes] = useState('');
  const [systolicBp, setSystolicBp] = useState('');
  const [diastolicBp, setDiastolicBp] = useState('');
  const [spo2, setSpo2] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const [taskData, patientList, referralList] = await Promise.all([
        FollowUpService.getTasksForAsha(ashaId),
        PatientService.getPatients(),
        ReferralService.getReferrals()
      ]);

      setTasks(taskData);

      const patMap: Record<string, Patient> = {};
      patientList.forEach(p => { patMap[p.id] = p; });
      setPatients(patMap);

      const refMap: Record<string, Referral> = {};
      referralList.forEach(r => { refMap[r.id] = r; });
      setReferrals(refMap);
    } catch (err) {
      console.error('Failed to load follow-up tasks:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [ashaId]);

  const handleCompleteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTask) return;
    setIsSubmitting(true);
    try {
      const vitals = (systolicBp || spo2) ? {
        systolic_bp: systolicBp ? Number(systolicBp) : undefined,
        diastolic_bp: diastolicBp ? Number(diastolicBp) : undefined,
        spo2_percentage: spo2 ? Number(spo2) : undefined,
        recorded_at: new Date().toISOString()
      } : undefined;

      await FollowUpService.completeTask(
        selectedTask.id,
        completionNotes || 'Home visit conducted successfully. Patient advised on medication adherence.',
        vitals
      );

      setSelectedTask(null);
      setCompletionNotes('');
      setSystolicBp('');
      setDiastolicBp('');
      setSpo2('');
      await loadData();
    } catch (err) {
      console.error('Failed to complete task:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getVisibleTasks = () => {
    if (activeTab === 'overdue') return tasks.overdue;
    if (activeTab === 'dueToday') return tasks.dueToday;
    if (activeTab === 'upcoming') return tasks.upcoming;
    return tasks.all.filter(t => t.status === 'completed');
  };

  const visibleTasks = getVisibleTasks();

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-wrap justify-between items-center gap-2">
        <div>
          <h2 className="text-base sm:text-lg font-bold text-slate-900 flex items-center space-x-2">
            <HeartHandshake className="w-5 h-5 text-pink-600" />
            <span>{t.followUpTasksTitle}</span>
          </h2>
          <p className="text-xs text-slate-600 mt-0.5">
            {t.followUpTasksSub}
          </p>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        <button
          onClick={() => setActiveTab('dueToday')}
          className={`p-3 rounded-xl border text-left transition-all ${
            activeTab === 'dueToday'
              ? 'bg-amber-50 border-amber-300 ring-2 ring-amber-400/30'
              : 'bg-white border-slate-200 hover:bg-slate-50'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-amber-900">{t.dueTodayTasks}</span>
            <Clock className="w-4 h-4 text-amber-600" />
          </div>
          <p className="text-xl font-black text-amber-900 mt-1">{tasks.dueToday.length}</p>
        </button>

        <button
          onClick={() => setActiveTab('overdue')}
          className={`p-3 rounded-xl border text-left transition-all ${
            activeTab === 'overdue'
              ? 'bg-red-50 border-red-300 ring-2 ring-red-400/30'
              : 'bg-white border-slate-200 hover:bg-slate-50'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-red-900">{t.overdueTasks}</span>
            <AlertTriangle className="w-4 h-4 text-red-600" />
          </div>
          <p className="text-xl font-black text-red-900 mt-1">{tasks.overdue.length}</p>
        </button>

        <button
          onClick={() => setActiveTab('upcoming')}
          className={`p-3 rounded-xl border text-left transition-all ${
            activeTab === 'upcoming'
              ? 'bg-blue-50 border-blue-300 ring-2 ring-blue-400/30'
              : 'bg-white border-slate-200 hover:bg-slate-50'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-blue-900">{t.upcomingTasks}</span>
            <Calendar className="w-4 h-4 text-blue-600" />
          </div>
          <p className="text-xl font-black text-blue-900 mt-1">{tasks.upcoming.length}</p>
        </button>

        <button
          onClick={() => setActiveTab('completed')}
          className={`p-3 rounded-xl border text-left transition-all ${
            activeTab === 'completed'
              ? 'bg-emerald-50 border-emerald-300 ring-2 ring-emerald-400/30'
              : 'bg-white border-slate-200 hover:bg-slate-50'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-emerald-900">{t.followUpCompleted}</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-xl font-black text-emerald-900 mt-1">
            {tasks.all.filter(t => t.status === 'completed').length}
          </p>
        </button>
      </div>

      {/* Task List */}
      {loading ? (
        <div className="bg-white p-8 rounded-xl border border-slate-200 text-center text-xs text-slate-500">
          Loading follow-up tasks...
        </div>
      ) : visibleTasks.length === 0 ? (
        <div className="bg-white p-8 rounded-xl border border-slate-200 text-center space-y-2">
          <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto" />
          <p className="text-xs font-semibold text-slate-600">
            {t.noPendingFollowUps}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {visibleTasks.map(task => {
            const patient = patients[task.patient_id];
            const referral = task.originating_referral_id ? referrals[task.originating_referral_id] : undefined;

            const formatTaskType = (type: string) => {
              switch (type) {
                case 'post_referral_check': return 'रुग्णालय डिस्चार्ज पाठपुरावा (Post-Discharge Check)';
                case 'maternal_anc_check': return 'गर्भवती माता तपासणी (Maternal ANC Follow-Up)';
                case 'chronic_vitals_check': return 'दीर्घ आजार तपासणी (Chronic Vitals Check)';
                default: return 'नियमित पाठपुरावा (Routine Follow-Up)';
              }
            };

            return (
              <div
                key={task.id}
                className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs space-y-3 hover:border-pink-300 transition-colors text-slate-900"
              >
                <div className="flex flex-wrap justify-between items-start gap-2 border-b border-slate-100 pb-2">
                  <div className="space-y-0.5">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-pink-50 text-pink-700 border border-pink-200">
                      {formatTaskType(task.task_type)}
                    </span>
                    <h4 className="text-sm font-bold text-slate-900 mt-1">
                      {patient ? patient.full_name : 'Patient Name'}
                    </h4>
                    <p className="text-xs text-slate-500">
                      {patient ? `${patient.estimated_age}y • ${patient.gender} • ${patient.village}` : ''}
                    </p>
                  </div>

                  <div className="text-right">
                    <span
                      className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                        task.status === 'completed'
                          ? 'bg-emerald-100 text-emerald-800'
                          : activeTab === 'overdue'
                          ? 'bg-red-100 text-red-800'
                          : activeTab === 'dueToday'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-blue-100 text-blue-800'
                      }`}
                    >
                      {task.status === 'completed'
                        ? 'पूर्ण (Completed)'
                        : `नियोजित दिनांक: ${task.due_date}`}
                    </span>
                  </div>
                </div>

                {/* Originating Referral Context if post-discharge */}
                {referral && (
                  <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-xs space-y-1.5">
                    <div className="flex items-center space-x-1.5 font-bold text-slate-700">
                      <Building2 className="w-3.5 h-3.5 text-teal-600" />
                      <span>संदर्भ रुग्णालय माहिती ({referral.referral_code})</span>
                    </div>
                    {referral.discharge_summary && (
                      <p className="text-[11px] text-slate-600">
                        <span className="font-semibold text-slate-700">उपचार सारांश:</span> {referral.discharge_summary}
                      </p>
                    )}
                    {referral.post_discharge_instructions_for_asha && (
                      <div className="bg-pink-50 border border-pink-200 rounded p-2 text-[11px] text-pink-900 font-medium">
                        <span className="font-bold">डॉक्टरांच्या गृहभेट सूचना:</span> "{referral.post_discharge_instructions_for_asha}"
                      </div>
                    )}
                  </div>
                )}

                {/* Completed Details */}
                {task.status === 'completed' && (
                  <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-2.5 text-xs text-emerald-950">
                    <p className="font-semibold">गृहभेट पूर्ण नोंद:</p>
                    <p className="text-emerald-900 italic mt-0.5">"{task.completion_notes}"</p>
                    <p className="text-[10px] text-emerald-700 mt-1">
                      पूर्ण वेळ: {new Date(task.completed_at || '').toLocaleString()}
                    </p>
                  </div>
                )}

                {/* Actions */}
                <div className="flex flex-wrap justify-between items-center gap-2 pt-1 border-t border-slate-100">
                  {onViewHealthRecord && (
                    <button
                      onClick={() => onViewHealthRecord(task.patient_id)}
                      className="text-xs font-semibold text-teal-700 hover:underline flex items-center space-x-1"
                    >
                      <FileText className="w-3.5 h-3.5" />
                      <span>{t.viewHealthRecordBtn}</span>
                    </button>
                  )}

                  {task.status !== 'completed' && (
                    <button
                      onClick={() => setSelectedTask(task)}
                      className="px-3 py-1.5 text-xs font-bold text-white bg-teal-600 hover:bg-teal-700 rounded-lg shadow-xs flex items-center space-x-1 transition-colors"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>{t.completeTaskBtn}</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Completion Modal */}
      {selectedTask && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-md w-full p-5 space-y-4 text-slate-900">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="font-bold text-base text-slate-900 flex items-center space-x-2">
                <HeartHandshake className="w-5 h-5 text-pink-600" />
                <span>{t.completeTaskBtn}</span>
              </h3>
              <button onClick={() => setSelectedTask(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCompleteSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {t.homeVisitNotesLabel} *
                </label>
                <textarea
                  value={completionNotes}
                  onChange={e => setCompletionNotes(e.target.value)}
                  rows={3}
                  placeholder={t.homeVisitNotesPlaceholder}
                  className="w-full text-xs p-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-teal-500 focus:outline-hidden"
                  required
                />
              </div>

              {/* Optional Vitals recorded during home visit */}
              <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 space-y-2">
                <p className="text-xs font-bold text-slate-800">
                  गृहभेटीतील शारीरिक तपासणी (ऐच्छिक / Optional)
                </p>
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="block text-[10px] font-semibold text-slate-600 mb-0.5">BP Sys</label>
                    <input
                      type="number"
                      value={systolicBp}
                      onChange={e => setSystolicBp(e.target.value)}
                      placeholder="120"
                      className="w-full text-xs p-1.5 bg-white border border-slate-200 rounded"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-semibold text-slate-600 mb-0.5">BP Dia</label>
                    <input
                      type="number"
                      value={diastolicBp}
                      onChange={e => setDiastolicBp(e.target.value)}
                      placeholder="80"
                      className="w-full text-xs p-1.5 bg-white border border-slate-200 rounded"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-semibold text-slate-600 mb-0.5">SpO2 %</label>
                    <input
                      type="number"
                      value={spo2}
                      onChange={e => setSpo2(e.target.value)}
                      placeholder="98"
                      className="w-full text-xs p-1.5 bg-white border border-slate-200 rounded"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedTask(null)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  {t.closeBtn}
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 text-xs font-bold text-white bg-teal-600 hover:bg-teal-700 rounded-lg shadow-xs disabled:opacity-50"
                >
                  {isSubmitting ? 'जतन करत आहे...' : 'जतन करा व पूर्ण करा'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
