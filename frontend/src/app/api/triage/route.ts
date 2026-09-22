import { NextRequest, NextResponse } from 'next/server';
import { authorizeRequest } from '@/lib/auth/rbac';

const AI_SERVICE_URL = process.env.NEXT_PUBLIC_AI_SERVICE_URL || 'http://localhost:8000';
const AI_SERVICE_API_KEY = process.env.AI_SERVICE_API_KEY || 'caregrid-internal-dev-key-change-in-prod';

/**
 * /api/triage is strictly POST-only per API specification and clinical safety contract.
 */
export async function GET() {
  return NextResponse.json(
    { error: 'Method Not Allowed. /api/triage supports POST only.' },
    { status: 405, headers: { Allow: 'POST' } }
  );
}

export async function POST(req: NextRequest) {
  // Authorize request: required role is asha or doctor (admin inherits)
  const auth = await authorizeRequest(req, ['asha', 'doctor']);
  if (!auth.authorized) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
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

    const dangerSigns: string[] = [];
    const vitalAnomalies: string[] = [];
    let isEmergency = false;

    // SpO2
    if (vitals.spo2_percentage !== undefined && vitals.spo2_percentage !== null) {
      if (vitals.spo2_percentage < 90) {
        dangerSigns.push(`Severe Hypoxia: SpO2 ${vitals.spo2_percentage}% (< 90%)`);
        vitalAnomalies.push(`SpO2 critically low (${vitals.spo2_percentage}%)`);
        isEmergency = true;
      } else if (vitals.spo2_percentage <= 93) {
        dangerSigns.push(`Low Oxygen Saturation: SpO2 ${vitals.spo2_percentage}% (90-93%)`);
        vitalAnomalies.push(`SpO2 borderline (${vitals.spo2_percentage}%)`);
      }
    }

    // Blood Pressure
    if (vitals.systolic_bp || vitals.diastolic_bp) {
      const sys = vitals.systolic_bp || 0;
      const dia = vitals.diastolic_bp || 0;

      if (isPregnant) {
        if (sys >= 160 || dia >= 110) {
          dangerSigns.push(`Severe Pre-Eclampsia Alert: BP ${sys}/${dia} mmHg`);
          vitalAnomalies.push(`Severe gestational hypertension (${sys}/${dia} mmHg)`);
          isEmergency = true;
        } else if (sys >= 140 || dia >= 90) {
          dangerSigns.push(`Gestational Hypertension: BP ${sys}/${dia} mmHg`);
          vitalAnomalies.push(`Elevated BP during pregnancy (${sys}/${dia} mmHg)`);
        }
      } else {
        if (sys >= 180 || dia >= 120) {
          dangerSigns.push(`Hypertensive Crisis: BP ${sys}/${dia} mmHg`);
          vitalAnomalies.push(`Hypertensive crisis (${sys}/${dia} mmHg)`);
          isEmergency = true;
        } else if (sys < 80 && sys > 0) {
          dangerSigns.push(`Severe Hypotension / Shock: Systolic ${sys} mmHg (< 80)`);
          vitalAnomalies.push(`Hypotension / Shock indicator (${sys} mmHg)`);
          isEmergency = true;
        }
      }
    }

    // Heart Rate
    if (vitals.heart_rate_bpm) {
      if (vitals.heart_rate_bpm > 130) {
        dangerSigns.push(`Severe Tachycardia: ${vitals.heart_rate_bpm} bpm (> 130)`);
        vitalAnomalies.push(`Tachycardia (${vitals.heart_rate_bpm} bpm)`);
        isEmergency = true;
      } else if (vitals.heart_rate_bpm < 40) {
        dangerSigns.push(`Severe Bradycardia: ${vitals.heart_rate_bpm} bpm (< 40)`);
        vitalAnomalies.push(`Bradycardia (${vitals.heart_rate_bpm} bpm)`);
        isEmergency = true;
      }
    }

    // High Risk Symptoms
    const symptomsLower = symptoms.map(s => s.toLowerCase());
    if (symptomsLower.some(s => s.includes('chest') || s.includes('pain') && s.includes('chest'))) {
      dangerSigns.push('Acute Chest Pain Alert');
      isEmergency = true;
    }
    if (symptomsLower.some(s => s.includes('convulsion') || s.includes('seizure') || s.includes('झटके'))) {
      dangerSigns.push('Active Convulsion Danger Sign');
      isEmergency = true;
    }
    if (symptomsLower.some(s => s.includes('bleed') || s.includes('hemorrhage') || s.includes('रक्तस्राव'))) {
      dangerSigns.push('Severe Bleeding / Hemorrhage');
      isEmergency = true;
    }
    if (symptomsLower.some(s => s.includes('breath') || s.includes('dyspnea') || s.includes('श्वसन'))) {
      dangerSigns.push('Severe Respiratory Distress');
      isEmergency = true;
    }

    let urgencyTier = 'routine_green';
    let priorityScore = 10;
    let transportRecommended = false;
    let rationale = 'No acute red flags or severe physiological anomalies detected. Patient suitable for standard OPD queue.';
    let recommendedSpecialty = 'General Medicine (Primary Health Centre OPD)';
    let recommendedAction = 'Enroll in routine OPD consultation queue. Provide standard health counseling.';

    if (isEmergency || dangerSigns.length >= 2) {
      urgencyTier = 'emergency_red';
      priorityScore = dangerSigns.length >= 2 ? 1 : 2;
      transportRecommended = true;
      rationale = `Critical physiological urgency identified with ${dangerSigns.length} danger sign(s). Requires immediate medical officer stabilization and prioritized facility transfer.`;
      recommendedSpecialty = isPregnant ? 'Obstetrics & Gynecology (Maternal Care)' : 'Emergency Medicine / Critical Care';
      recommendedAction = 'Alert Medical Officer immediately. Place at the front of the OPD Queue. Prepare transfer protocol if stabilization requires higher secondary care.';
    } else if (dangerSigns.length === 1 || isPregnant || (payload.demographics?.chronic_conditions && payload.demographics.chronic_conditions.length > 0)) {
      urgencyTier = 'urgent_amber';
      priorityScore = isPregnant ? 4 : 5;
      transportRecommended = false;
      rationale = 'Urgent clinical review indicated due to single danger sign or vulnerability factor (pregnancy / chronic condition).';
      recommendedSpecialty = isPregnant ? 'Obstetrics & Gynecology' : 'General Medicine';
      recommendedAction = 'Fast-track to top of OPD queue for Medical Officer review within 24 hours. Re-evaluate if symptoms progress.';
    }

    const assessment = {
      urgency_tier: urgencyTier,
      priority_score: priorityScore,
      detected_red_flags: dangerSigns,
      vital_anomalies: vitalAnomalies,
      transport_recommended: transportRecommended,
      recommended_specialty: recommendedSpecialty,
      recommended_action: recommendedAction,
      clinical_rationale: rationale,
      non_diagnostic_disclaimer: DISCLAIMER,
      assessed_at: new Date().toISOString(),
      engine: 'deterministic_clinical_fallback',
      model_version: 'caregrid-clinical-rules-v1.0'
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

    return NextResponse.json(assessment);
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to process triage request', details: String(error) },
      { status: 500 }
    );
  }
}
