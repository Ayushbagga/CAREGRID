import React, { useState, useEffect } from 'react';
import { useLanguage } from '@/lib/i18n/context';
import type { Referral, Patient, Facility, ReferralStatus } from '@/types/healthcare';
import { ReferralService } from '@/lib/offline-sync/referral-service';
import { PatientService } from '@/lib/offline-sync/patient-service';
import { FacilityService } from '@/lib/offline-sync/facility-service';
import { ReferralStepper } from './referral-stepper';
import { 
  GitPullRequest, 
  Search, 
  Filter, 
  CheckCircle2, 
  Building2, 
  Clock, 
  User, 
  FileText, 
  ArrowUpRight, 
  ArrowDownLeft, 
  HeartHandshake,
  AlertTriangle,
  X
} from 'lucide-react';

interface ReferralManagerProps {
  currentFacilityId?: string;
  onInitiateNewReferral?: () => void;
  onViewHealthRecord?: (patientId: string) => void;
}

export function ReferralManager({
  currentFacilityId = 'fac-001',
  onInitiateNewReferral,
  onViewHealthRecord
}: ReferralManagerProps) {
  const { t } = useLanguage();
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [patients, setPatients] = useState<Record<string, Patient>>({});
  const [facilities, setFacilities] = useState<Record<string, Facility>>({});
  const [activeTab, setActiveTab] = useState<'outgoing' | 'incoming'>('outgoing');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [loading, setLoading] = useState(true);

  // Modal states for Evaluation and Discharge
  const [selectedReferralForAction, setSelectedReferralForAction] = useState<Referral | null>(null);
  const [actionType, setActionType] = useState<'evaluate' | 'discharge' | null>(null);
  const [evaluationNotes, setEvaluationNotes] = useState('');
  const [dischargeSummary, setDischargeSummary] = useState('');
  const [ashaInstructions, setAshaInstructions] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const [allReferrals, allPatients, allFacilities] = await Promise.all([
        ReferralService.getReferrals(),
        PatientService.getPatients(),
        FacilityService.getFacilities()
      ]);

      setReferrals(allReferrals);

      const patientMap: Record<string, Patient> = {};
      allPatients.forEach(p => { patientMap[p.id] = p; });
      setPatients(patientMap);

      const facilityMap: Record<string, Facility> = {};
      allFacilities.forEach(f => { facilityMap[f.id] = f; });
      setFacilities(facilityMap);
    } catch (err) {
      console.error('Failed to load referral data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleAcknowledge = async (referralId: string) => {
    try {
      await ReferralService.acknowledgeReferral(referralId, 'doc-dh-001');
      await loadData();
    } catch (err) {
      console.error('Failed to acknowledge referral:', err);
    }
  };

  const handleActionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedReferralForAction) return;
    setIsSubmitting(true);
    try {
      if (actionType === 'evaluate') {
        await ReferralService.updateReferralEvaluation(selectedReferralForAction.id, evaluationNotes);
      } else if (actionType === 'discharge') {
        await ReferralService.completeReferral(
          selectedReferralForAction.id,
          dischargeSummary || 'Stabilized and discharged. Patient instructed for regular medication and home rest.',
          ashaInstructions || 'Conduct home check within 3 days. Check blood pressure and monitor for headache/blurred vision.'
        );
      }
      setSelectedReferralForAction(null);
      setActionType(null);
      setEvaluationNotes('');
      setDischargeSummary('');
      setAshaInstructions('');
      await loadData();
    } catch (err) {
      console.error('Failed to execute referral action:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filter referrals by Tab (outgoing vs incoming)
  const filteredReferrals = referrals.filter(r => {
    const isOutgoing = r.from_facility_id === currentFacilityId;
    const isIncoming = r.to_facility_id === currentFacilityId;

    if (activeTab === 'outgoing' && !isOutgoing) return false;
    if (activeTab === 'incoming' && !isIncoming) return false;

    if (statusFilter !== 'all' && r.status !== statusFilter) return false;

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const patient = patients[r.patient_id];
      const matchCode = r.referral_code.toLowerCase().includes(q);
      const matchSpecialty = r.required_specialty.toLowerCase().includes(q);
      const matchPatient = patient ? patient.full_name.toLowerCase().includes(q) : false;
      return matchCode || matchSpecialty || matchPatient;
    }

    return true;
  });

  return (
    <div className="space-y-4">
      {/* Top Controls */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-wrap justify-between items-center gap-3">
        <div>
          <h2 className="text-base sm:text-lg font-bold text-slate-900 flex items-center space-x-2">
            <GitPullRequest className="w-5 h-5 text-teal-600" />
            <span>{t.referralTrackingTitle}</span>
          </h2>
          <p className="text-xs text-slate-600 mt-0.5">
            {t.referralTrackingSub}
          </p>
        </div>

        {onInitiateNewReferral && (
          <button
            onClick={onInitiateNewReferral}
            className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-xs font-bold shadow-xs transition-colors"
          >
            {t.initiateReferralBtn}
          </button>
        )}
      </div>

      {/* Tabs & Search Filter */}
      <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-2">
        <div className="flex space-x-2 border-b sm:border-b-0 border-slate-200 pb-1 sm:pb-0">
          <button
            onClick={() => setActiveTab('outgoing')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold flex items-center space-x-1.5 transition-colors ${
              activeTab === 'outgoing'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            <ArrowUpRight className="w-4 h-4 text-teal-400" />
            <span>{t.outgoingReferralsTab}</span>
            <span className="ml-1 px-1.5 py-0.2 bg-slate-800 text-teal-300 rounded-full text-[10px]">
              {referrals.filter(r => r.from_facility_id === currentFacilityId).length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('incoming')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold flex items-center space-x-1.5 transition-colors ${
              activeTab === 'incoming'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            <ArrowDownLeft className="w-4 h-4 text-amber-400" />
            <span>{t.incomingReferralsTab}</span>
            <span className="ml-1 px-1.5 py-0.2 bg-slate-800 text-amber-300 rounded-full text-[10px]">
              {referrals.filter(r => r.to_facility_id === currentFacilityId).length}
            </span>
          </button>
        </div>

        <div className="flex items-center space-x-2">
          <div className="relative flex-1 sm:w-64">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search code, patient, specialty..."
              className="w-full pl-9 pr-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-teal-500 focus:outline-hidden"
            />
          </div>

          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="text-xs py-1.5 px-2.5 rounded-lg border border-slate-200 bg-white focus:outline-hidden font-medium text-slate-700"
          >
            <option value="all">सर्व स्थिती (All)</option>
            <option value="initiated">Initiated</option>
            <option value="acknowledged">Acknowledged</option>
            <option value="evaluated">In Care / Evaluated</option>
            <option value="closed_loop">Completed / Discharged</option>
          </select>
        </div>
      </div>

      {/* Referrals List */}
      {loading ? (
        <div className="bg-white p-8 rounded-xl border border-slate-200 text-center text-xs text-slate-500">
          Loading referrals...
        </div>
      ) : filteredReferrals.length === 0 ? (
        <div className="bg-white p-8 rounded-xl border border-slate-200 text-center space-y-2">
          <GitPullRequest className="w-8 h-8 text-slate-300 mx-auto" />
          <p className="text-xs font-semibold text-slate-600">
            {activeTab === 'outgoing' ? 'कोणतेही पाठवलेले संदर्भ आढळले नाहीत.' : 'कोणतेही आलेले संदर्भ आढळले नाहीत.'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredReferrals.map(referral => {
            const patient = patients[referral.patient_id];
            const fromFac = facilities[referral.from_facility_id];
            const toFac = facilities[referral.to_facility_id];

            return (
              <div
                key={referral.id}
                className="bg-white rounded-xl border border-slate-200 hover:border-teal-300 p-4 shadow-xs space-y-3 transition-colors"
              >
                {/* Card Header */}
                <div className="flex flex-wrap justify-between items-start gap-2 border-b border-slate-100 pb-2.5">
                  <div className="flex items-center space-x-2">
                    <span className="font-mono font-bold text-xs bg-slate-100 text-slate-800 px-2 py-0.5 rounded">
                      {referral.referral_code}
                    </span>
                    <span
                      className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                        referral.urgency_tier === 'emergency_red'
                          ? 'bg-red-100 text-red-800 border border-red-200'
                          : referral.urgency_tier === 'urgent_amber'
                          ? 'bg-amber-100 text-amber-800 border border-amber-200'
                          : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                      }`}
                    >
                      {referral.urgency_tier === 'emergency_red'
                        ? '🔴 EMERGENCY RED'
                        : referral.urgency_tier === 'urgent_amber'
                        ? '🟡 URGENT AMBER'
                        : '🟢 ROUTINE GREEN'}
                    </span>
                  </div>

                  <div className="flex items-center space-x-2 text-xs text-slate-500">
                    <Clock className="w-3.5 h-3.5" />
                    <span>{new Date(referral.created_at).toLocaleDateString()}</span>
                  </div>
                </div>

                {/* Patient & Facility Details */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                  {/* Patient info */}
                  <div className="space-y-1">
                    <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">रुग्ण (Patient)</p>
                    <p className="font-bold text-slate-900 text-sm">
                      {patient ? patient.full_name : 'Unknown Patient'}
                    </p>
                    <p className="text-slate-600 text-[11px]">
                      {patient ? `${patient.estimated_age}y • ${patient.gender} • ${patient.village}` : ''}
                    </p>
                    {onViewHealthRecord && (
                      <button
                        onClick={() => onViewHealthRecord(referral.patient_id)}
                        className="text-[11px] font-semibold text-teal-700 hover:underline flex items-center space-x-1 mt-1"
                      >
                        <FileText className="w-3.5 h-3.5" />
                        <span>{t.viewHealthRecordBtn}</span>
                      </button>
                    )}
                  </div>

                  {/* Transfer path */}
                  <div className="space-y-1">
                    <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">मार्ग (Transfer Path)</p>
                    <p className="text-slate-800 font-medium">
                      <span className="text-slate-500">From:</span> {fromFac ? fromFac.name : referral.from_facility_id}
                    </p>
                    <p className="text-slate-900 font-bold">
                      <span className="text-slate-500 font-medium">To:</span> {toFac ? toFac.name : referral.to_facility_id}
                    </p>
                    <p className="text-teal-700 font-semibold text-[11px]">
                      शाखा: {referral.required_specialty}
                    </p>
                  </div>

                  {/* Clinical Reason */}
                  <div className="space-y-1 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                    <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">{t.referralReasonCol}</p>
                    <p className="text-slate-700 text-xs italic">
                      "{referral.referral_reason}"
                    </p>
                  </div>
                </div>

                {/* Stepper */}
                <div className="pt-1 border-t border-slate-100">
                  <ReferralStepper referral={referral} />
                </div>

                {/* Discharge / Follow-up Notes (if closed-loop) */}
                {referral.status === 'closed_loop' && (
                  <div className="bg-teal-50 border border-teal-200 rounded-lg p-3 text-xs space-y-1 text-teal-950">
                    <div className="flex items-center space-x-1.5 font-bold text-teal-900">
                      <HeartHandshake className="w-4 h-4 text-teal-700" />
                      <span>{t.instructionsForAshaLabel}</span>
                    </div>
                    <p className="text-xs text-teal-900 italic">
                      "{referral.post_discharge_instructions_for_asha || 'Perform routine home follow-up within 3 days.'}"
                    </p>
                    {referral.discharge_summary && (
                      <p className="text-[11px] text-teal-800 pt-1 border-t border-teal-200/60">
                        <span className="font-semibold">डिस्चार्ज सारांश:</span> {referral.discharge_summary}
                      </p>
                    )}
                  </div>
                )}

                {/* Actions Footer */}
                <div className="flex justify-end space-x-2 pt-1 border-t border-slate-100">
                  {/* Receiving Hospital Actions */}
                  {referral.status === 'initiated' && (
                    <button
                      onClick={() => handleAcknowledge(referral.id)}
                      className="px-3 py-1.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs flex items-center space-x-1"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>{t.acknowledgeReferralBtn}</span>
                    </button>
                  )}

                  {referral.status === 'acknowledged' && (
                    <>
                      <button
                        onClick={() => {
                          setSelectedReferralForAction(referral);
                          setActionType('evaluate');
                        }}
                        className="px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg"
                      >
                        {t.updateEvaluationBtn}
                      </button>
                      <button
                        onClick={() => {
                          setSelectedReferralForAction(referral);
                          setActionType('discharge');
                        }}
                        className="px-3 py-1.5 text-xs font-bold text-white bg-teal-600 hover:bg-teal-700 rounded-lg shadow-xs flex items-center space-x-1"
                      >
                        <HeartHandshake className="w-3.5 h-3.5" />
                        <span>{t.completeDischargeBtn}</span>
                      </button>
                    </>
                  )}

                  {referral.status === 'evaluated' && (
                    <button
                      onClick={() => {
                        setSelectedReferralForAction(referral);
                        setActionType('discharge');
                      }}
                      className="px-3 py-1.5 text-xs font-bold text-white bg-teal-600 hover:bg-teal-700 rounded-lg shadow-xs flex items-center space-x-1"
                    >
                      <HeartHandshake className="w-3.5 h-3.5" />
                      <span>{t.completeDischargeBtn}</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Action Modal (Evaluation or Discharge & ASHA counter-referral) */}
      {selectedReferralForAction && actionType && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-lg w-full p-5 space-y-4 text-slate-900">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="font-bold text-base text-slate-900">
                {actionType === 'evaluate' ? t.updateEvaluationBtn : t.completeDischargeBtn}
              </h3>
              <button
                onClick={() => {
                  setSelectedReferralForAction(null);
                  setActionType(null);
                }}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleActionSubmit} className="space-y-4">
              {actionType === 'evaluate' ? (
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    रुग्णालयातील तपासणी व उपचार नोंद (Clinical Notes) *
                  </label>
                  <textarea
                    value={evaluationNotes}
                    onChange={e => setEvaluationNotes(e.target.value)}
                    rows={3}
                    placeholder="Enter specialist findings, bedside observations, or lab test results..."
                    className="w-full text-xs p-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-teal-500 focus:outline-hidden"
                    required
                  />
                </div>
              ) : (
                <>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      {t.dischargeSummaryLabel} *
                    </label>
                    <textarea
                      value={dischargeSummary}
                      onChange={e => setDischargeSummary(e.target.value)}
                      rows={2}
                      placeholder={t.dischargeSummaryPlaceholder}
                      className="w-full text-xs p-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-teal-500 focus:outline-hidden"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      {t.instructionsForAshaLabel} *
                    </label>
                    <textarea
                      value={ashaInstructions}
                      onChange={e => setAshaInstructions(e.target.value)}
                      rows={3}
                      placeholder={t.instructionsForAshaPlaceholder}
                      className="w-full text-xs p-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-teal-500 focus:outline-hidden"
                      required
                    />
                    <p className="text-[11px] text-teal-800 mt-1">
                      * ही माहिती आपोआप रुग्णाच्या आशा सेविकेकडे पाठपुरावा कार्य म्हणून नियुक्त होईल (Due in 3 days).
                    </p>
                  </div>
                </>
              )}

              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedReferralForAction(null);
                    setActionType(null);
                  }}
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
