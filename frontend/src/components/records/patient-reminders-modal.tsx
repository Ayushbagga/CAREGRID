import React, { useState, useEffect } from 'react';
import { useLanguage } from '@/lib/i18n/context';
import type { Patient, FollowUpTask } from '@/types/healthcare';
import { FollowUpService } from '@/lib/offline-sync/follow-up-service';
import { 
  Bell, 
  Calendar, 
  User, 
  HeartHandshake, 
  CheckCircle2, 
  ShieldCheck, 
  Phone, 
  X 
} from 'lucide-react';

interface PatientRemindersModalProps {
  isOpen: boolean;
  onClose: () => void;
  patient: Patient;
}

export function PatientRemindersModal({ isOpen, onClose, patient }: PatientRemindersModalProps) {
  const { t } = useLanguage();
  const [reminders, setReminders] = useState<{
    activeReminders: FollowUpTask[];
    completedVisits: FollowUpTask[];
  }>({ activeReminders: [], completedVisits: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const res = await FollowUpService.getPatientReminders(patient.id);
        setReminders(res);
      } catch (err) {
        console.error('Failed to load patient reminders:', err);
      } finally {
        setLoading(false);
      }
    }
    if (isOpen && patient?.id) {
      load();
    }
  }, [isOpen, patient?.id]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-md w-full overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="bg-slate-900 text-white p-4 flex justify-between items-center">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-pink-500/20 text-pink-400 flex items-center justify-center">
              <Bell className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm sm:text-base leading-tight">
                {t.patientRemindersTitle}
              </h3>
              <p className="text-[11px] text-slate-400">
                {patient.full_name} ({patient.village})
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4 overflow-y-auto flex-1 text-slate-900">
          {/* Assigned ASHA Banner */}
          <div className="bg-pink-50/80 border border-pink-200 rounded-xl p-3 flex items-center space-x-3">
            <div className="w-10 h-10 rounded-full bg-pink-200 text-pink-800 flex items-center justify-center shrink-0">
              <HeartHandshake className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-bold text-pink-950">
                {t.assignedAshaLabel}: सुनिता मेश्राम (आशा सेविका)
              </p>
              <p className="text-[11px] text-pink-800">
                कार्यक्षेत्र: {patient.village}, {patient.taluka} • 📞 +91 98230 45678
              </p>
            </div>
          </div>

          {/* Active Reminders List */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              {t.upcomingTasks}
            </h4>

            {loading ? (
              <p className="text-xs text-slate-400">Loading reminders...</p>
            ) : reminders.activeReminders.length === 0 ? (
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-center text-xs text-slate-600">
                {t.noPendingFollowUps}
              </div>
            ) : (
              reminders.activeReminders.map(task => (
                <div
                  key={task.id}
                  className="bg-amber-50/80 border border-amber-200 rounded-xl p-3 space-y-1.5"
                >
                  <div className="flex justify-between items-start">
                    <span className="text-xs font-bold text-amber-950">
                      {task.task_type === 'post_referral_check'
                        ? 'रुग्णालय डिस्चार्ज नंतरची गृहभेट'
                        : task.task_type === 'maternal_anc_check'
                        ? 'गर्भवती माता आरोग्य तपासणी'
                        : 'नियमित आरोग्य पाठपुरावा'}
                    </span>
                    <span className="text-[11px] font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded-full">
                      {task.due_date}
                    </span>
                  </div>
                  <p className="text-[11px] text-amber-900 leading-relaxed">
                    आशा सेविका आपल्या घरी येऊन रक्तदाब, ऑक्सिजन आणि आरोग्याची तपासणी करतील. कृपया आपली सर्व औषधे व डिस्चार्ज कार्ड जवळ ठेवावे.
                  </p>
                </div>
              ))
            )}
          </div>

          {/* Past Completed Visits */}
          {reminders.completedVisits.length > 0 && (
            <div className="space-y-2 pt-2 border-t border-slate-100">
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                {t.followUpCompleted}
              </h4>
              {reminders.completedVisits.map(visit => (
                <div
                  key={visit.id}
                  className="bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs text-slate-700 space-y-1"
                >
                  <div className="flex justify-between items-center text-[11px]">
                    <span className="font-semibold text-emerald-800 flex items-center space-x-1">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>गृहभेट यशस्वीपणे संपन्न</span>
                    </span>
                    <span className="text-slate-400">
                      {new Date(visit.completed_at || '').toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-slate-600 text-[11px] italic">
                    "{visit.completion_notes}"
                  </p>
                </div>
              ))}
            </div>
          )}

          {/* Reassuring Care Guidance */}
          <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-[11px] text-slate-600 space-y-1">
            <p className="font-bold text-slate-800 flex items-center space-x-1">
              <ShieldCheck className="w-3.5 h-3.5 text-teal-600 inline mr-1" />
              <span>आरोग्य मार्गदर्शक सूचना:</span>
            </p>
            <p>
              १. डॉक्टरांनी दिलेली औषधे वेळेवर घ्या.
              <br />२. चक्कर येणे, धाप लागणे, किंवा तीव्र डोकेदुखी झाल्यास तात्काळ जवळच्या आरोग्य केंद्राशी संपर्क साधा.
            </p>
          </div>
        </div>

        {/* Close Button */}
        <div className="p-3 bg-slate-50 border-t border-slate-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-bold rounded-lg transition-colors"
          >
            {t.closeBtn}
          </button>
        </div>
      </div>
    </div>
  );
}
