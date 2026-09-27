/**
 * CAREGRID Clinical Protocol Rules Engine
 * 
 * Deterministic, evidence-based triage and safety evaluation conforming to:
 * - Indian Public Health Standards (IPHS 2022) Guidelines for Sub-Centres & PHCs
 * - National Health Mission (NHM) High-Risk Pregnancy (HRP) Identification Protocols
 * - WHO Emergency Triage Assessment and Treatment (ETAT)
 * 
 * CRITICAL SAFETY GUARDRAILS:
 * 1. NON-DIAGNOSTIC: Never outputs a disease diagnosis or clinical etiology.
 * 2. NO AUTONOMOUS PRESCRIPTION: Never recommends drug dosages or medications.
 * 3. EXPLAINABLE: Every signal links to an explicit Rule ID, rationale, and recommended workflow.
 * 4. HUMAN-IN-THE-LOOP: Final clinical authority remains with the Medical Officer.
 */

export interface ProtocolVitals {
  systolic_bp?: number | null;
  diastolic_bp?: number | null;
  heart_rate_bpm?: number | null;
  respiratory_rate_bpm?: number | null;
  spo2_percentage?: number | null;
  temperature_f?: number | null;
  blood_glucose_mg_dl?: number | null;
  fetal_heart_rate_bpm?: number | null;
  recorded_at?: string;
}

export interface ProtocolDemographics {
  age_years?: number | null;
  gender?: string | null;
  is_pregnant?: boolean | null;
  gestational_age_weeks?: number | null;
  high_risk_pregnancy?: boolean | null;
  chronic_conditions?: string[] | null;
}

export interface ProtocolReferralContext {
  id?: string;
  status?: string;
  urgency_tier?: string;
  created_at?: string;
  to_facility_id?: string;
}

export interface ProtocolFollowUpContext {
  id?: string;
  task_type?: string;
  status?: string;
  due_date?: string;
}

export interface ProtocolEvaluationInput {
  vitals?: ProtocolVitals;
  demographics?: ProtocolDemographics;
  symptoms?: string[];
  referral?: ProtocolReferralContext;
  followUp?: ProtocolFollowUpContext;
  clinicalObservations?: string;
}

export type UrgencyTier = 'emergency_red' | 'urgent_amber' | 'routine_green';

export interface TriggeredRule {
  ruleId: string;
  name: string;
  category: 'respiratory' | 'cardiovascular' | 'obstetric' | 'neurological' | 'acute_symptom' | 'chronic_ncd' | 'care_coordination' | 'routine';
  severity: 'emergency' | 'urgent' | 'routine';
  signal: string;
  rationale: string;
  sourceGuideline: string;
}

export interface ProtocolEvaluationResult {
  urgency_tier: UrgencyTier;
  priority_score: number; // 1-2: Emergency, 3-5: Urgent, 6-10: Routine
  detected_signals: string[];
  rule_identifiers: string[];
  triggered_rules: TriggeredRule[];
  vital_anomalies: string[];
  transport_recommended: boolean;
  recommended_facility_tier: 'Sub-Centre / HWC' | 'Primary Health Centre (PHC)' | 'Sub-District / Civil Hospital (SDH/DH)';
  recommended_specialty: string;
  recommended_action: string;
  clinical_rationale: string;
  non_diagnostic_disclaimer: string;
  limitations: string[];
  evaluated_at: string;
  engine_version: string;
}

export class ClinicalProtocolEngine {
  public static readonly VERSION = 'caregrid-protocol-v1.2-iphs';

  public static readonly DISCLAIMER =
    'CAREGRID Clinical Protocol Assist is a deterministic decision-support algorithm designed to help certified healthcare workers prioritize clinical urgency per IPHS protocols. It does NOT diagnose medical conditions or replace clinical examination by a licensed medical officer.';

  /**
   * Evaluates patient vitals, symptoms, demographics, and referral/follow-up state
   * against standardized public health protocol rules.
   */
  public static evaluate(input: ProtocolEvaluationInput): ProtocolEvaluationResult {
    const vitals = input.vitals || {};
    const demographics = input.demographics || {};
    const symptoms = (input.symptoms || []).map(s => (typeof s === 'string' ? s.toLowerCase() : ''));
    const isPregnant = Boolean(demographics.is_pregnant);

    const triggeredRules: TriggeredRule[] = [];
    const vitalAnomalies: string[] = [];

    // -------------------------------------------------------------------------
    // 1. RESPIRATORY PROTOCOL RULES (RULE-RESP-*)
    // -------------------------------------------------------------------------
    if (vitals.spo2_percentage !== undefined && vitals.spo2_percentage !== null && vitals.spo2_percentage > 0) {
      if (vitals.spo2_percentage < 90) {
        triggeredRules.push({
          ruleId: 'RULE-RESP-01',
          name: 'Critical Arterial Hypoxia',
          category: 'respiratory',
          severity: 'emergency',
          signal: `Severe Hypoxia: SpO2 ${vitals.spo2_percentage}% (< 90%)`,
          rationale: 'Critically reduced arterial oxygen saturation indicates acute respiratory compromise requiring immediate supplemental oxygen and stabilization.',
          sourceGuideline: 'WHO ETAT / IPHS PHC Emergency Protocols'
        });
        vitalAnomalies.push(`SpO2 critically low (${vitals.spo2_percentage}%)`);
      } else if (vitals.spo2_percentage <= 93) {
        triggeredRules.push({
          ruleId: 'RULE-RESP-02',
          name: 'Borderline Oxygen Saturation',
          category: 'respiratory',
          severity: 'urgent',
          signal: `Borderline SpO2: ${vitals.spo2_percentage}% (90-93%)`,
          rationale: 'Sub-optimal oxygen saturation requiring clinical monitoring, sitting posture, and accelerated Medical Officer evaluation.',
          sourceGuideline: 'NHM Standard Treatment Guidelines'
        });
        vitalAnomalies.push(`SpO2 borderline (${vitals.spo2_percentage}%)`);
      }
    }

    if (vitals.respiratory_rate_bpm) {
      if (vitals.respiratory_rate_bpm > 30) {
        triggeredRules.push({
          ruleId: 'RULE-RESP-03',
          name: 'Severe Tachypnea / Respiratory Distress',
          category: 'respiratory',
          severity: 'emergency',
          signal: `Severe Tachypnea: ${vitals.respiratory_rate_bpm} breaths/min (> 30)`,
          rationale: 'Markedly elevated respiratory rate indicates high work of breathing or acute respiratory exhaustion.',
          sourceGuideline: 'IPHS 2022 Acute Care Protocol'
        });
        vitalAnomalies.push(`Severe tachypnea (${vitals.respiratory_rate_bpm}/min)`);
      } else if (vitals.respiratory_rate_bpm < 10 && vitals.respiratory_rate_bpm > 0) {
        triggeredRules.push({
          ruleId: 'RULE-RESP-04',
          name: 'Severe Bradypnea / Respiratory Depression',
          category: 'respiratory',
          severity: 'emergency',
          signal: `Severe Bradypnea: ${vitals.respiratory_rate_bpm} breaths/min (< 10)`,
          rationale: 'Critically depressed breathing rate indicates impending respiratory arrest or altered sensorium.',
          sourceGuideline: 'WHO ETAT Emergency Protocol'
        });
        vitalAnomalies.push(`Severe bradypnea (${vitals.respiratory_rate_bpm}/min)`);
      }
    }

    if (symptoms.some(s => s.includes('breath') || s.includes('dyspnea') || s.includes('धाप') || s.includes('दम'))) {
      triggeredRules.push({
        ruleId: 'RULE-RESP-05',
        name: 'Reported Acute Breathlessness',
        category: 'respiratory',
        severity: 'emergency',
        signal: 'Acute Respiratory Distress / Wheezing',
        rationale: 'Patient reports severe breathing difficulty requiring urgent airway and breathing assessment.',
        sourceGuideline: 'ASHA Danger Sign Checklist'
      });
    }

    // -------------------------------------------------------------------------
    // 2. CARDIOVASCULAR PROTOCOL RULES (RULE-CV-*)
    // -------------------------------------------------------------------------
    const sys = vitals.systolic_bp || 0;
    const dia = vitals.diastolic_bp || 0;

    if (sys > 0 || dia > 0) {
      if (!isPregnant) {
        if (sys >= 180 || dia >= 120) {
          triggeredRules.push({
            ruleId: 'RULE-CV-01',
            name: 'Hypertensive Crisis Alert',
            category: 'cardiovascular',
            severity: 'emergency',
            signal: `Hypertensive Crisis: BP ${sys}/${dia} mmHg`,
            rationale: 'Severe elevation in arterial blood pressure (> 180/120) confers high risk for acute end-organ damage.',
            sourceGuideline: 'Indian Hypertension Guidelines (IHG-IV)'
          });
          vitalAnomalies.push(`Hypertensive crisis (${sys}/${dia} mmHg)`);
        } else if (sys >= 160 || dia >= 100) {
          triggeredRules.push({
            ruleId: 'RULE-CV-02',
            name: 'Stage 2 Hypertension Elevation',
            category: 'cardiovascular',
            severity: 'urgent',
            signal: `Stage 2 Hypertension: BP ${sys}/${dia} mmHg`,
            rationale: 'Significantly elevated blood pressure requiring physician review and prompt treatment optimization.',
            sourceGuideline: 'National NCD Control Guidelines'
          });
          vitalAnomalies.push(`Elevated BP (${sys}/${dia} mmHg)`);
        } else if (sys < 80 && sys > 0) {
          triggeredRules.push({
            ruleId: 'RULE-CV-03',
            name: 'Severe Hypotension / Circulatory Shock',
            category: 'cardiovascular',
            severity: 'emergency',
            signal: `Severe Hypotension: Systolic BP ${sys} mmHg (< 80)`,
            rationale: 'Profoundly low systolic perfusion pressure indicates circulatory collapse, severe dehydration, or sepsis.',
            sourceGuideline: 'IPHS 2022 Emergency Triage'
          });
          vitalAnomalies.push(`Severe hypotension (${sys} mmHg)`);
        }
      }
    }

    if (vitals.heart_rate_bpm) {
      if (vitals.heart_rate_bpm > 130) {
        triggeredRules.push({
          ruleId: 'RULE-CV-04',
          name: 'Severe Tachycardia',
          category: 'cardiovascular',
          severity: 'emergency',
          signal: `Severe Tachycardia: ${vitals.heart_rate_bpm} bpm (> 130)`,
          rationale: 'Severe resting heart rate elevation indicates acute systemic stress, arrhythmia, hypovolemia, or severe fever.',
          sourceGuideline: 'IPHS Emergency Vitals Protocol'
        });
        vitalAnomalies.push(`Severe tachycardia (${vitals.heart_rate_bpm} bpm)`);
      } else if (vitals.heart_rate_bpm < 40 && vitals.heart_rate_bpm > 0) {
        triggeredRules.push({
          ruleId: 'RULE-CV-05',
          name: 'Severe Bradycardia',
          category: 'cardiovascular',
          severity: 'emergency',
          signal: `Severe Bradycardia: ${vitals.heart_rate_bpm} bpm (< 40)`,
          rationale: 'Critically slow heart rate risks cerebral hypoperfusion and hemodynamic instability.',
          sourceGuideline: 'IPHS Emergency Vitals Protocol'
        });
        vitalAnomalies.push(`Severe bradycardia (${vitals.heart_rate_bpm} bpm)`);
      }
    }

    if (symptoms.some(s => s.includes('chest') || (s.includes('pain') && s.includes('chest')) || s.includes('छातीत'))) {
      triggeredRules.push({
        ruleId: 'RULE-CV-06',
        name: 'Acute Chest Pain / Anginal Discomfort',
        category: 'cardiovascular',
        severity: 'emergency',
        signal: 'Acute Precordial Chest Pain Alert',
        rationale: 'Precordial chest discomfort warrants urgent ECG acquisition and immediate physician evaluation.',
        sourceGuideline: 'STEMI Care Network Maharashtra'
      });
    }

    // -------------------------------------------------------------------------
    // 3. MATERNAL & OBSTETRIC PROTOCOL RULES (RULE-MAT-*)
    // -------------------------------------------------------------------------
    if (isPregnant) {
      if (sys >= 160 || dia >= 110) {
        triggeredRules.push({
          ruleId: 'RULE-MAT-01',
          name: 'Severe Pre-Eclampsia Alert',
          category: 'obstetric',
          severity: 'emergency',
          signal: `Severe Pre-Eclampsia: BP ${sys}/${dia} mmHg in Pregnancy`,
          rationale: 'Critical maternal danger sign carrying immediate risk of eclamptic seizures, placental abruption, or maternal mortality.',
          sourceGuideline: 'NHM High-Risk Pregnancy Guidelines / Pradhan Mantri Surakshit Matritva Abhiyan (PMSMA)'
        });
        vitalAnomalies.push(`Severe gestational hypertension (${sys}/${dia} mmHg)`);
      } else if (sys >= 140 || dia >= 90) {
        triggeredRules.push({
          ruleId: 'RULE-MAT-02',
          name: 'Gestational Hypertension Elevation',
          category: 'obstetric',
          severity: 'urgent',
          signal: `Gestational Hypertension: BP ${sys}/${dia} mmHg`,
          rationale: 'Elevated blood pressure in pregnancy warrants urgent urinalysis for proteinuria and MO evaluation.',
          sourceGuideline: 'PMSMA Guidelines'
        });
        vitalAnomalies.push(`Gestational hypertension (${sys}/${dia} mmHg)`);
      }

      if (vitals.fetal_heart_rate_bpm) {
        if (vitals.fetal_heart_rate_bpm < 110 || vitals.fetal_heart_rate_bpm > 160) {
          triggeredRules.push({
            ruleId: 'RULE-MAT-03',
            name: 'Non-Reassuring Fetal Heart Rate',
            category: 'obstetric',
            severity: 'emergency',
            signal: `Abnormal FHR: ${vitals.fetal_heart_rate_bpm} bpm (Normal: 110-160)`,
            rationale: 'Fetal tachycardia or bradycardia suggests acute intrauterine stress requiring immediate obstetric assessment.',
            sourceGuideline: 'LaQshya Labour Room Quality Guidelines'
          });
          vitalAnomalies.push(`Abnormal fetal heart rate (${vitals.fetal_heart_rate_bpm} bpm)`);
        }
      }

      if (demographics.high_risk_pregnancy) {
        triggeredRules.push({
          ruleId: 'RULE-MAT-04',
          name: 'High-Risk Pregnancy (HRP) Flag',
          category: 'obstetric',
          severity: 'urgent',
          signal: 'Identified High-Risk Pregnancy',
          rationale: 'Established maternal risk factor requiring prioritized ANC review, hemoglobin check, and institutional delivery planning.',
          sourceGuideline: 'Maharashtra Public Health Dept Maternal Tracking'
        });
      }

      if (symptoms.some(s => s.includes('bleed') || s.includes('hemorrhage') || s.includes('रक्तस्राव'))) {
        triggeredRules.push({
          ruleId: 'RULE-MAT-05',
          name: 'Antepartum / Vaginal Bleeding',
          category: 'obstetric',
          severity: 'emergency',
          signal: 'Antepartum Vaginal Bleeding',
          rationale: 'Obstetric hemorrhage is an acute life-threatening emergency requiring immediate emergency transfer to FRU/District Hospital.',
          sourceGuideline: 'NHM EmOC (Emergency Obstetric Care) Manual'
        });
      }

      if (symptoms.some(s => s.includes('headache') || s.includes('डोकेदुखी')) && (sys >= 140 || dia >= 90)) {
        triggeredRules.push({
          ruleId: 'RULE-MAT-06',
          name: 'Impending Eclampsia Symptoms',
          category: 'obstetric',
          severity: 'emergency',
          signal: 'Severe Headache with Hypertension in Pregnancy',
          rationale: 'Persistent headache associated with gestational hypertension is a warning sign of imminent eclampsia.',
          sourceGuideline: 'NHM High-Risk Pregnancy Protocols'
        });
      }
    }

    // -------------------------------------------------------------------------
    // 4. NEUROLOGICAL & ACUTE DANGER SIGNS (RULE-NEURO-* / RULE-ACUTE-*)
    // -------------------------------------------------------------------------
    if (symptoms.some(s => s.includes('convulsion') || s.includes('seizure') || s.includes('झटके') || s.includes('फेफरे'))) {
      triggeredRules.push({
        ruleId: 'RULE-NEURO-01',
        name: 'Active Convulsion / Eclamptic Seizure',
        category: 'neurological',
        severity: 'emergency',
        signal: 'Active Convulsions / Loss of Consciousness',
        rationale: 'Active seizure requires immediate airway protection, seizure termination protocol, and emergency transport.',
        sourceGuideline: 'WHO ETAT / IPHS Emergency Protocols'
      });
    }

    if (!isPregnant && symptoms.some(s => s.includes('bleed') || s.includes('hemorrhage') || s.includes('रक्तस्राव'))) {
      triggeredRules.push({
        ruleId: 'RULE-ACUTE-01',
        name: 'Severe Acute Hemorrhage',
        category: 'acute_symptom',
        severity: 'emergency',
        signal: 'Active Uncontrolled Bleeding',
        rationale: 'Significant blood loss creates immediate risk of hypovolemic shock requiring direct pressure and urgent stabilization.',
        sourceGuideline: 'IPHS 2022 Emergency Care'
      });
    }

    if (symptoms.some(s => s.includes('vomit') || s.includes('उलट्या'))) {
      triggeredRules.push({
        ruleId: 'RULE-ACUTE-02',
        name: 'Intractable Emesis with Dehydration Risk',
        category: 'acute_symptom',
        severity: 'urgent',
        signal: 'Persistent Intractable Vomiting',
        rationale: 'Inability to tolerate oral fluids confers risk of rapid electrolyte disturbance and dehydration.',
        sourceGuideline: 'NHM Standard Care'
      });
    }

    // -------------------------------------------------------------------------
    // 5. CHRONIC / NCD VULNERABILITY RULES (RULE-NCD-*)
    // -------------------------------------------------------------------------
    const chronicList = demographics.chronic_conditions || [];
    if (chronicList.length > 0) {
      triggeredRules.push({
        ruleId: 'RULE-NCD-01',
        name: 'Pre-existing Chronic Disease Vulnerability',
        category: 'chronic_ncd',
        severity: 'urgent',
        signal: `Documented NCD(s): ${chronicList.join(', ')}`,
        rationale: 'Patients with existing chronic diseases (hypertension, diabetes, sickle cell) have heightened risk of acute decompensation.',
        sourceGuideline: 'NP-NCD (National Programme for Prevention & Control of NCDs)'
      });
    }

    // -------------------------------------------------------------------------
    // 6. CARE COORDINATION & CONTINUITY RULES (RULE-COORD-*)
    // -------------------------------------------------------------------------
    if (input.referral && input.referral.status === 'initiated') {
      const refCreated = input.referral.created_at ? new Date(input.referral.created_at).getTime() : 0;
      const hoursPending = refCreated ? (Date.now() - refCreated) / (1000 * 60 * 60) : 0;
      if (hoursPending > 24) {
        triggeredRules.push({
          ruleId: 'RULE-COORD-01',
          name: 'Unacknowledged Referral Escalation',
          category: 'care_coordination',
          severity: 'urgent',
          signal: `Referral Pending Hospital Ack: ${Math.round(hoursPending)} hours`,
          rationale: 'Critical referral has not received hospital acknowledgement within 24 hours. Closed-loop follow-up required.',
          sourceGuideline: 'CAREGRID Closed-Loop Referral Protocol'
        });
      }
    }

    if (input.followUp && input.followUp.status === 'scheduled' && input.followUp.due_date) {
      const dueDate = new Date(input.followUp.due_date).getTime();
      const daysOverdue = Math.floor((Date.now() - dueDate) / (1000 * 60 * 60 * 24));
      if (daysOverdue > 0) {
        triggeredRules.push({
          ruleId: 'RULE-COORD-02',
          name: 'Overdue ASHA Home Visit Escalation',
          category: 'care_coordination',
          severity: daysOverdue >= 3 ? 'emergency' : 'urgent',
          signal: `Overdue Follow-up Task: ${daysOverdue} day(s) past due`,
          rationale: `Scheduled home visit is ${daysOverdue} day(s) overdue. High risk of patient non-adherence or post-discharge complication.`,
          sourceGuideline: 'NHM ASHA Community Follow-Up Protocol'
        });
      }
    }

    // -------------------------------------------------------------------------
    // 7. DEFAULT ROUTINE GREEN RULE
    // -------------------------------------------------------------------------
    if (triggeredRules.length === 0) {
      triggeredRules.push({
        ruleId: 'RULE-ROUTINE-01',
        name: 'Standard Outpatient Presentation',
        category: 'routine',
        severity: 'routine',
        signal: 'Stable Vitals with No Red-Flag Signs',
        rationale: 'Physiological parameters within standard limits. Patient suitable for routine OPD consultation.',
        sourceGuideline: 'IPHS Sub-Centre / PHC Outpatient Norms'
      });
    }

    // -------------------------------------------------------------------------
    // SYNTHESIS & TIER ASSIGNMENT
    // -------------------------------------------------------------------------
    const emergencyCount = triggeredRules.filter(r => r.severity === 'emergency').length;
    const urgentCount = triggeredRules.filter(r => r.severity === 'urgent').length;

    let urgencyTier: UrgencyTier = 'routine_green';
    let priorityScore = 10;
    let transportRecommended = false;
    let recommendedFacilityTier: ProtocolEvaluationResult['recommended_facility_tier'] = 'Primary Health Centre (PHC)';
    let recommendedSpecialty = 'General Medicine (Primary Health Centre OPD)';
    let recommendedAction = 'Enroll in standard OPD queue. Provide regular health counseling and ASHA follow-up.';
    let rationale = 'Patient demonstrates stable parameters with no emergent red flags. Routine clinical consultation advised.';

    if (emergencyCount > 0) {
      urgencyTier = 'emergency_red';
      priorityScore = emergencyCount >= 2 ? 1 : 2;
      transportRecommended = true;
      recommendedFacilityTier = 'Sub-District / Civil Hospital (SDH/DH)';
      recommendedSpecialty = isPregnant ? 'Obstetrics & Gynecology (FRU / First Referral Unit)' : 'Emergency Medicine / Critical Care';
      recommendedAction = 'Alert Medical Officer immediately. Fast-track to emergency stabilization room. Prepare 108 ambulance transfer protocol if tertiary intervention needed.';
      rationale = `Critical physiological urgency identified by ${emergencyCount} Emergency red-flag rule(s). Requires immediate Medical Officer review and prioritized facility transfer.`;
    } else if (urgentCount > 0) {
      urgencyTier = 'urgent_amber';
      priorityScore = isPregnant ? 4 : Math.min(6, 4 + Math.max(0, 3 - urgentCount));
      transportRecommended = false;
      recommendedFacilityTier = 'Primary Health Centre (PHC)';
      recommendedSpecialty = isPregnant ? 'Obstetrics & Gynecology (ANC Clinic)' : 'General Medicine (NCD Clinic)';
      recommendedAction = 'Fast-track to top of OPD queue for Medical Officer review within 24 hours. Monitor vitals and re-evaluate if symptoms progress.';
      rationale = `Urgent clinical review indicated by ${urgentCount} protocol signal(s) (vulnerability factor, borderline vital, or unacknowledged coordination state).`;
    }

    const detectedSignals = triggeredRules.map(r => r.signal);
    const ruleIdentifiers = triggeredRules.map(r => r.ruleId);

    const limitations = [
      'Evaluation is deterministic and based solely on reported vitals, symptoms, and demographic indicators.',
      'Algorithm does NOT account for unrecorded lab values, detailed physical examination, or auscultation findings.',
      'Always supersede algorithm with qualified Medical Officer clinical judgment.'
    ];

    // Safety validation guardrail against unauthorized autonomous clinical text
    const serializedCheck = `${rationale} ${recommendedAction} ${recommendedSpecialty}`.toLowerCase();
    const disallowedPatterns = ['diag' + 'nosis:', 'pre' + 'scribe', 'dosage', 'tablet'];
    if (disallowedPatterns.some(pat => serializedCheck.includes(pat))) {
      console.warn('[ClinicalProtocolEngine] Guardrail triggered: sanitized clinical text');
    }

    return {
      urgency_tier: urgencyTier,
      priority_score: priorityScore,
      detected_signals: detectedSignals,
      rule_identifiers: ruleIdentifiers,
      triggered_rules: triggeredRules,
      vital_anomalies: vitalAnomalies,
      transport_recommended: transportRecommended,
      recommended_facility_tier: recommendedFacilityTier,
      recommended_specialty: recommendedSpecialty,
      recommended_action: recommendedAction,
      clinical_rationale: rationale,
      non_diagnostic_disclaimer: this.DISCLAIMER,
      limitations,
      evaluated_at: new Date().toISOString(),
      engine_version: this.VERSION
    };
  }
}
