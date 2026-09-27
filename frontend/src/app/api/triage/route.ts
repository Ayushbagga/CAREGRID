import { NextRequest, NextResponse } from 'next/server';
import { authorizeRequest } from '@/lib/auth/rbac';
import { errorResponse } from '@/lib/api';
import { AuditLogger } from '@/lib/audit';
import { ClinicalProtocolEngine } from '@/lib/clinical-rules';

const AI_SERVICE_URL = process.env.NEXT_PUBLIC_AI_SERVICE_URL || 'http://localhost:8000';
const AI_SERVICE_API_KEY = process.env.AI_SERVICE_API_KEY || 'caregrid-internal-dev-key-change-in-prod';

/**
 * /api/triage is strictly POST-only per API specification and clinical safety contract.
 */
export async function GET() {
  return NextResponse.json(
    { 
      success: false, 
      error: 'Method Not Allowed. /api/triage supports POST only.',
      code: 'METHOD_NOT_ALLOWED',
      status: 405,
      timestamp: new Date().toISOString()
    },
    { status: 405, headers: { Allow: 'POST' } }
  );
}

export async function POST(req: NextRequest) {
  // Authorize request: required role is asha or doctor (admin inherits)
  const auth = await authorizeRequest(req, ['asha', 'doctor']);
  if (!auth.authorized) {
    return errorResponse(auth.error || 'Unauthorized', auth.status, auth.status === 401 ? 'UNAUTHORIZED' : 'FORBIDDEN');
  }

  const DISCLAIMER =
    'CAREGRID Clinical Triage Assist is an assistive decision-support algorithm designed to help certified healthcare workers prioritize clinical urgency. It does NOT diagnose medical conditions or replace clinical examination by a licensed medical officer.';

  try {
    const payload = await req.json();

    // 1. Attempt upstream AI microservice call
    try {
      const response = await fetch(`${AI_SERVICE_URL}/api/v1/triage/assess`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': AI_SERVICE_API_KEY
        },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(3000)
      });

      if (response.ok) {
        const data = await response.json();
        return NextResponse.json({
          ...data,
          engine: 'upstream_ai_service',
          non_diagnostic_disclaimer: data.non_diagnostic_disclaimer || DISCLAIMER
        });
      }
    } catch {
      // Upstream AI service unreachable or timeout -> seamlessly proceed to local deterministic fallback
    }

    // 2. Deterministic Local Clinical Evaluation Engine (conforms to IPHS / WHO ETAT)
    const vitals = payload.vitals || {};
    const symptoms: string[] = Array.isArray(payload.symptoms)
      ? payload.symptoms.map((s: any) => (typeof s === 'string' ? s : s.name || ''))
      : [];
    const isPregnant = Boolean(payload.demographics?.is_pregnant || payload.patient?.is_pregnant || payload.is_pregnant);

    const protocolResult = ClinicalProtocolEngine.evaluate({
      vitals,
      demographics: {
        is_pregnant: isPregnant,
        age_years: payload.demographics?.age_years,
        gender: payload.demographics?.gender,
        chronic_conditions: payload.demographics?.chronic_conditions
      },
      symptoms,
      clinicalObservations: payload.clinical_observations
    });

    // Evaluated clinical tiers: 'emergency_red' | 'urgent_amber' | 'routine_green'
    const urgencyTier: 'emergency_red' | 'urgent_amber' | 'routine_green' = protocolResult.urgency_tier || 'routine_green';
    const priorityScore = protocolResult.priority_score;
    const dangerSigns = protocolResult.detected_signals;
    const vitalAnomalies = protocolResult.vital_anomalies;
    const transportRecommended = protocolResult.transport_recommended;
    const recommendedSpecialty = protocolResult.recommended_specialty;
    const recommendedAction = protocolResult.recommended_action;
    const rationale = protocolResult.clinical_rationale;

    const assessment = {
      urgency_tier: urgencyTier,
      priority_score: priorityScore,
      detected_red_flags: dangerSigns,
      vital_anomalies: vitalAnomalies,
      transport_recommended: transportRecommended,
      recommended_specialty: recommendedSpecialty,
      recommended_action: recommendedAction,
      clinical_rationale: rationale,
      non_diagnostic_disclaimer: protocolResult.non_diagnostic_disclaimer,
      rule_identifiers: protocolResult.rule_identifiers,
      triggered_rules: protocolResult.triggered_rules,
      assessed_at: protocolResult.evaluated_at,
      engine: 'deterministic_clinical_fallback',
      model_version: protocolResult.engine_version
    };

    // Optionally log to Supabase triage_assessments if encounter_id and patient_id are valid UUIDs
    const supabase = auth.client;
    if (supabase && payload.encounter_id && payload.patient_id && payload.encounter_id.length === 36 && payload.patient_id.length === 36) {
      try {
        await supabase.from('triage_assessments').insert({
          encounter_id: payload.encounter_id,
          patient_id: payload.patient_id,
          urgency_tier: urgencyTier,
          priority_score: priorityScore,
          detected_red_flags: dangerSigns,
          vital_anomalies: vitalAnomalies,
          transport_recommended: transportRecommended,
          recommended_specialty: recommendedSpecialty,
          clinical_rationale: rationale,
          non_diagnostic_disclaimer: DISCLAIMER,
          model_version: 'caregrid-clinical-rules-v1.0'
        });
      } catch (err) {
        console.warn('Could not persist triage assessment to Supabase:', err);
      }
    }

    // Forensic audit log for high-urgency escalations (Emergency Red & Urgent Amber)
    if (urgencyTier === 'emergency_red' || urgencyTier === 'urgent_amber') {
      await AuditLogger.logRequest(req, {
        action: 'TRIAGE_ESCALATE',
        entityName: 'triage_assessments',
        recordId: payload.encounter_id && payload.encounter_id.length === 36 ? payload.encounter_id : null,
        userId: auth.context?.user?.id,
        diff: {
          urgency_tier: urgencyTier,
          priority_score: priorityScore,
          danger_signs_count: dangerSigns.length,
          transport_recommended: transportRecommended
        }
      }, supabase);
    }

    return NextResponse.json(assessment);
  } catch (error) {
    return errorResponse('Failed to process triage request', 500, 'INTERNAL_SERVER_ERROR', error);
  }
}
