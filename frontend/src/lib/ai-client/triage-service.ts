import type { Patient, Vitals, TriageAssessment, UrgencyTier } from '@/types/healthcare';
import { PatientService } from '@/lib/offline-sync/patient-service';

export interface TriageRequestPayload {
  patient: Patient;
  vitals?: Vitals;
  symptoms?: string[];
  clinicalObservations?: string;
}

export class TriageService {
  private static DISCLAIMER =
    'CAREGRID Clinical Triage Assist is an assistive decision-support algorithm designed to help certified healthcare workers prioritize clinical urgency. It does NOT diagnose medical conditions or replace clinical examination by a licensed medical officer.';

  /**
   * Evaluates triage urgency by calling the backend AI service when online,
   * with automatic fallback to local evidence-based rules when offline.
   */
  public static async assessUrgency(payload: TriageRequestPayload): Promise<TriageAssessment> {
    const isOnline = typeof navigator !== 'undefined' && navigator.onLine;

    if (isOnline) {
      try {
        const res = await fetch('/api/triage', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            patient_id: payload.patient.id,
            demographics: {
              age_years: payload.patient.estimated_age,
              gender: payload.patient.gender,
              is_pregnant: payload.patient.is_pregnant,
              gestational_age_weeks: payload.patient.gestational_age_weeks,
              chronic_conditions: payload.patient.chronic_conditions || []
            },
            vitals: payload.vitals,
            symptoms: (payload.symptoms || []).map(name => ({
              name,
              severity: 'moderate'
            })),
            clinical_observations: payload.clinicalObservations
          })
        });

        if (res.ok) {
          const data = await res.json();
          return {
            urgency_tier: data.urgency_tier as UrgencyTier,
            priority_score: data.priority_score,
            detected_red_flags: data.detected_red_flags || [],
            vital_anomalies: data.vital_anomalies || [],
            transport_recommended: data.transport_recommended,
            recommended_specialty: data.recommended_specialty,
            recommended_action: data.recommended_action,
            clinical_rationale: data.clinical_rationale,
            non_diagnostic_disclaimer: data.non_diagnostic_disclaimer || this.DISCLAIMER,
            assessed_at: new Date().toISOString()
          };
        }
      } catch (err) {
        console.warn('Remote AI service unreachable, executing local triage engine fallback:', err);
      }
    }

    // Local deterministic fallback engine (conforms to IPHS / WHO ETAT)
    return this.localTriageEvaluation(payload);
  }

  /**
   * Deterministic local clinical urgency evaluator for offline execution
   */
  private static localTriageEvaluation(payload: TriageRequestPayload): TriageAssessment {
    const vitals = payload.vitals || { recorded_at: new Date().toISOString() };
    const symptoms = payload.symptoms || [];
    const isPregnant = payload.patient.is_pregnant;

    const { dangerSigns, isEmergency } = PatientService.evaluateDangerSigns(
      vitals,
      isPregnant,
      symptoms
    );

    let tier: UrgencyTier = 'routine_green';
    let priorityScore = 10;
    let transportRecommended = false;
    let rationale = 'No acute red flags or severe physiological anomalies detected. Patient suitable for standard OPD queue.';
    let recommendedSpecialty = 'General Medicine (Primary Health Centre OPD)';
    let recommendedAction = 'Enroll in routine OPD consultation queue. Provide standard health counseling.';

    if (isEmergency || dangerSigns.length >= 2) {
      tier = 'emergency_red';
      priorityScore = dangerSigns.length >= 2 ? 1 : 2;
      transportRecommended = true;
      rationale = `Critical physiological urgency identified with ${dangerSigns.length} danger sign(s). Requires immediate medical officer stabilization and prioritized facility transfer.`;
      recommendedSpecialty = isPregnant ? 'Obstetrics & Gynecology (Maternal Care)' : 'Emergency Medicine / Critical Care';
      recommendedAction = 'Alert Medical Officer immediately. Place at the front of the OPD Queue. Prepare transfer protocol if stabilization requires higher secondary care.';
    } else if (dangerSigns.length === 1 || isPregnant || (payload.patient.chronic_conditions && payload.patient.chronic_conditions.length > 0)) {
      tier = 'urgent_amber';
      priorityScore = isPregnant ? 4 : 5;
      transportRecommended = false;
      rationale = 'Urgent clinical review indicated due to single danger sign or vulnerability factor (pregnancy / chronic condition).';
      recommendedSpecialty = isPregnant ? 'Obstetrics & Gynecology' : 'General Medicine';
      recommendedAction = 'Fast-track to top of OPD queue for Medical Officer review within 24 hours. Re-evaluate if symptoms progress.';
    }

    return {
      urgency_tier: tier,
      priority_score: priorityScore,
      detected_red_flags: dangerSigns,
      vital_anomalies: [],
      transport_recommended: transportRecommended,
      recommended_specialty: recommendedSpecialty,
      recommended_action: recommendedAction,
      clinical_rationale: rationale,
      non_diagnostic_disclaimer: this.DISCLAIMER,
      assessed_at: new Date().toISOString()
    };
  }
}
