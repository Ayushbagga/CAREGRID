# CAREGRID AI/ML Specification v1.0

**Document Reference:** CAREGRID-DOC-AIML-V1.0  
**Problem Statement:** SIH26133 — Accessibility & Quality of Public Healthcare in Rural/Underserved Areas  
**Target Beneficiary:** Government of Maharashtra (Public Health Department)  
**Status:** Approved Technical Architecture  
**Companion Documents:**  
- [`docs/PRD-v1.0.md`](./PRD-v1.0.md) (Product Requirements Document v1.0)  
- [`docs/TRD-v1.0.md`](./TRD-v1.0.md) (Technical Requirements Document v1.0)  
- [`docs/Backend-Schema-v1.0.md`](./Backend-Schema-v1.0.md) (Backend Database Schema v1.0)  
- [`docs/API-Contract-v1.0.md`](./API-Contract-v1.0.md) (API Contract v1.0)  
- [`docs/Security-Privacy-v1.0.md`](./Security-Privacy-v1.0.md) (Security & Privacy Specification v1.0)  

---

## 1. Exact AI Role in CAREGRID: Assistive, Non-Diagnostic Decision Support

The core role of Artificial Intelligence and Machine Learning in CAREGRID is strictly **assistive and non-diagnostic**. 

In rural and tribal healthcare settings across Maharashtra—such as Gadchiroli, Nandurbar, Melghat, and tribal pockets of Nashik and Pune—frontline health workers (ASHAs and ANMs) are the primary point of community contact. These workers encounter complex clinical presentations but possess varying levels of specialized training. 

**CAREGRID AI does NOT act as an autonomous doctor.** It functions as an **intelligent clinical routing, triage prioritization, and continuity assistant**. Its objective is to:
1. Standardize frontline vital sign assessment and symptom intake.
2. Rapidly identify life-threatening "red flag" clinical conditions (e.g. severe maternal anemia, hypertensive crisis, shock).
3. Assign an objective, transparent triage urgency tier to guide prompt referral and queue prioritization at public healthcare facilities.
4. Assistive translation and local language phrasing (English $\leftrightarrow$ Hindi $\leftrightarrow$ Marathi) for community health literacy.

---

## 2. Core Boundary Guardrails & What AI Must NOT Do

To comply with medical device regulatory norms, clinical safety, and the SIH26133 mandate, CAREGRID enforces **hardcoded, non-bypassable constraints**:

```
                                  CAREGRID AI BOUNDARY
┌───────────────────────────────────────────────┬───────────────────────────────────────────────┐
│              PERMITTED / ASSISTIVE            │             PROHIBITED / OUT OF SCOPE         │
├───────────────────────────────────────────────┼───────────────────────────────────────────────┤
│ ✓ Clinical urgency triage (Red / Amber / Green)│ ✗ Standalone medical diagnosis (e.g., "Cancer")│
│ ✓ OPD queue priority calculation              │ ✗ Automated drug prescription / dosage        │
│ ✓ Red-flag symptom detection & alerting       │ ✗ Disease outbreak prediction / epidemiology   │
│ ✓ Referral destination specialty matching     │ ✗ Ambulance fleet / GPS dispatch tracking     │
│ ✓ Trilingual localization (EN / HI / MR)      │ ✗ Hospital bed tracking / management          │
│ ✓ Follow-up task scheduling recommendations   │ ✗ Water quality / JalRakshak functionality    │
│ ✓ Transparent rule-trigger explainability     │ ✗ Unverified clinical claims or guarantees    │
└───────────────────────────────────────────────┴───────────────────────────────────────────────┘
```

---

## 3. Triage Urgency Tiers & Response Protocols

CAREGRID classifies every clinical encounter into three standardized urgency tiers:

| Urgency Tier | Priority Score | Clinical Meaning | Recommended Action & Window | Target Operational Routing |
|---|---|---|---|---|
| `emergency_red` | **Priority 1** (Highest) | Imminent threat to life or organ viability (e.g., severe hemorrhage, shock, severe respiratory distress, eclampsia). | **Immediate stabilization & urgent referral (< 2 hours).** Fast-tracked to the top of OPD/emergency queue. | Sub-District / District Hospital emergency triage; immediate MO notification. |
| `urgent_amber` | **Priority 2** | Significant clinical condition requiring timely intervention (e.g., severe anemia Hb < 8 g/dL in pregnancy, moderate respiratory infection, persistent high fever). | **Evaluation within 24 to 48 hours.** Expedited OPD placement ahead of routine visits. | Primary Health Centre (PHC) Medical Officer review or teleconsultation with specialist. |
| `routine_green` | **Priority 3** | Stable, chronic, or minor self-limiting symptoms (e.g., routine ANC checkup, mild cold, routine immunization, chronic hypertension follow-up). | **Scheduled care (2 to 7 days).** Standard queue ordering (First-Come, First-Served within tier). | Sub-Center ANM clinic or routine PHC outpatient department. |

---

## 4. Input Signals & Feature Space

The triage engine evaluates deterministic, validated physiological and demographic parameters:

### 4.1 Vital Signs & Point-of-Care Lab Measurements
- **Systolic Blood Pressure (SBP):** Range `[50 - 260] mmHg`. Triggers `emergency_red` if $\ge 180$ or $\le 80$.
- **Diastolic Blood Pressure (DBP):** Range `[30 - 160] mmHg`. Triggers `emergency_red` if $\ge 120$ or $\le 50$.
- **Pulse / Heart Rate:** Range `[30 - 220] bpm`. Triggers `emergency_red` if $\ge 140$ or $\le 45$.
- **Respiratory Rate:** Range `[8 - 60] breaths/min`. Triggers `emergency_red` if $\ge 35$ or $\le 10$.
- **Blood Oxygen Saturation ($SpO_2$):** Range `[50 - 100]%`. Triggers `emergency_red` if $< 90\%$; `urgent_amber` if $90\% - 94\%$.
- **Hemoglobin ($Hb$):** Point-of-care strip measurement (`g/dL`). In pregnancy: $< 7.0$ triggers `emergency_red`; $7.0 - 8.9$ triggers `urgent_amber`.
- **Body Temperature:** Range `[34.0 - 42.0] °C`. $\ge 39.5$ °C triggers `urgent_amber`.

### 4.2 Categorical Red-Flag Symptoms
- Altered mental status / loss of consciousness / active convulsions.
- Severe chest pain radiating to jaw or left arm.
- Sudden severe shortness of breath at rest.
- Acute heavy vaginal bleeding during pregnancy or post-partum.
- Severe dehydration with sunken eyes, skin pinch $> 2$ seconds, inability to drink.
- Stiff neck with high fever and photophobia.

### 4.3 Contextual Modifiers
- **Gestational Status:** Patient is pregnant (trimester: 1st, 2nd, 3rd) or post-partum (< 42 days).
- **Age Vulnerability:** Neonates/infants (< 1 year) or elderly ($\ge 65$ years) receive increased priority weighting for fever and respiratory symptoms.
- **Pre-existing Chronic Flags:** Known diabetes, known hypertension, prior severe anemia.

---

## 5. Output Contract & Schema

The output contract returned by the triage service adheres strictly to the defined API and database specifications:

```json
{
  "urgency_tier": "urgent_amber",
  "priority_score": 2,
  "confidence_level": 0.94,
  "recommended_action": "Refer to Medical Officer at PHC or District Hospital for intravenous iron or blood management within 24 hours.",
  "recommended_specialty": "Obstetrics & Gynecology",
  "recommended_timeframe_hours": 24,
  "red_flag_triggers": [
    "Severe anemia: Hemoglobin 7.8 g/dL in 3rd trimester pregnancy (< 8.0 threshold)"
  ],
  "explainability": {
    "primary_factor": "Gestational anemia with hemoglobin below critical threshold",
    "contributing_vitals": {
      "hemoglobin_g_dl": 7.8,
      "systolic_bp": 105,
      "diastolic_bp": 68
    },
    "protocol_reference": "National Health Mission (NHM) / Maharashtra Public Health Maternal Care Protocol"
  },
  "non_diagnostic_disclaimer": "Assistive clinical recommendation only. This system does not provide medical diagnoses or prescriptions. Qualified healthcare professional review is required.",
  "human_review_required": true,
  "engine_version": "caregrid-triage-v1.0.0"
}
```

---

## 6. Human-Review Requirement & Clinical Governance

1. **Mandatory Human-in-the-Loop:**
   - No triage recommendation can initiate an invasive procedure, patient discharge, or definitive treatment plan autonomously.
   - Every referral generated based on triage recommendations must be confirmed and authorized by the initiating frontline worker (ASHA/ANM or Medical Officer).
2. **Clinical Override Capability:**
   - Any qualified health worker or Medical Officer can override the system-suggested urgency tier (e.g. elevating `routine_green` to `urgent_amber` based on qualitative clinical judgment).
   - All overrides require entering an override rationale and are logged into `audit_logs` for clinical governance and system fine-tuning.

---

## 7. Uncertainty Handling & Fail-Safe Defaults

When input signals are incomplete, missing, or ambiguous:
1. **Conservative Urgency Escalation (Pessimistic Safety):**
   - If a high-risk symptom (e.g., "severe dizziness with history of syncope") is reported but blood pressure equipment is temporarily unavailable or reading fails, the engine **defaults to the higher urgency tier** (`urgent_amber` rather than `routine_green`).
2. **Missing Essential Vitals Alert:**
   - If a critical vital parameter is missing (e.g. $SpO_2$ in a patient complaining of shortness of breath), the engine explicitly highlights: `"Uncertainty: Pulse oximetry measurement recommended to complete assessment"`.
3. **Out-of-Range Sensor Anomaly Detection:**
   - Physically impossible measurements (e.g., Pulse = 350 bpm, SBP = 30 mmHg in conscious patient) are flagged as potential measurement or data-entry errors, prompting the worker to re-test before routing.

---

## 8. Explainability & Transparent Decision Trees

Black-box opaque neural networks are strictly prohibited for core triage logic. CAREGRID uses a **deterministic, rule-based clinical decision engine** supplemented by transparent heuristic scoring:

```
                          TRIAGE DECISION FLOW
                                    │
                                    ▼
                      Are Red-Flag Vitals Present?
                 (SBP ≥ 180, SpO2 < 90%, Shock, Convulsions)
                                  /   \
                             YES /     \ NO
                                /       \
                ┌───────────────────┐    ▼
                │   EMERGENCY RED   │  Is High-Risk Criterion Met?
                │   (Immediate)     │  (Hb < 8 in Pregnancy, SBP ≥ 160,
                └───────────────────┘   Fever in Neonate, Resp > 28)
                                           /   \
                                      YES /     \ NO
                                         /       \
                         ┌───────────────────┐    ▼
                         │   URGENT AMBER    │  Standard Clinical Case
                         │   (Within 24-48h) │  (Routine Symptoms)
                         └───────────────────┘          │
                                                        ▼
                                                ┌───────────────────┐
                                                │   ROUTINE GREEN   │
                                                │   (Scheduled Care)│
                                                └───────────────────┘
```

Each output provides human-readable explanations citing specific Maharashtra public health guidelines so workers and doctors understand *why* a case was flagged.

---

## 9. Failure & Degraded States

In the event of network disruption, server downtime, or client service errors:
1. **Full Offline Client Evaluation:**
   - The entire core triage rule set is embedded client-side in the PWA TypeScript engine (`frontend/src/lib/triage-engine.ts`).
   - Frontline workers perform real-time triage entirely offline in deep rural areas without requiring active server connectivity.
2. **Engine Crash Fallback:**
   - In the unlikely event of a script error, the client UI falls back to the standard **Manual Paper / Standard WHO Emergency Triage Assessment and Treatment (ETAT)** guideline checklist printed in the ASHA handbook.

---

## 10. Model Evaluation, Bias & Fairness Considerations

### 10.1 Evaluation Metrics
- **Sensitivity (Recall) on Red-Flag Conditions:** Target $\ge 99.5\%$. Zero tolerance for false negatives on life-threatening states (e.g. eclampsia, acute severe respiratory distress).
- **Specificity on Routine Care:** Target $\ge 88.0\%$ to avoid overwhelming secondary referral facilities with routine complaints.
- **Provider Agreement Rate:** Monitored monthly; measures the frequency with which Medical Officers agree with the assistive urgency tier vs. overriding it.

### 10.2 Demographic & Rural Calibration
- **Nutritional Anemia Baseline:** Cutoffs are calibrated for rural Indian maternal populations where nutritional anemia is prevalent, ensuring mild anemia does not trigger inappropriate hospital diversion while severe anemia (< 8 g/dL) is consistently caught.
- **Tribal & High-Altitude Contexts:** Normal baselines for resting heart rates and SpO2 are calibrated to avoid false alarms in hilly tribal areas (e.g., Toranmal, Gadchiroli).

---

## 11. Testing & Validation Strategy

1. **Golden Test Suite (`test-triage-golden.mjs`):**
   - 100+ standardized synthetic patient cases covering every clinical edge case:
     - Third-trimester gestational anemia.
     - Post-partum hemorrhage signs.
     - Pediatric respiratory distress.
     - Elderly hypertensive urgency.
     - Normal healthy antenatal checkup.
2. **Adversarial Fuzz Testing:**
   - Boundary condition testing (e.g. SBP = 179 vs 180 mmHg; Hb = 7.9 vs 8.0 g/dL).
   - Incomplete and out-of-order vital inputs.
3. **Safety Keyword Scans:**
   - Automated regression tests verify that triage outputs never output prescription drugs (e.g., "Amoxicillin", "Ciprofloxacin", "Metoprolol") or standalone pathology diagnoses.

---

## 12. Versioning & Operational Monitoring

- **Engine Semantic Versioning:** Triage logic follows strict SemVer: `caregrid-triage-MAJOR.MINOR.PATCH`.
  - Major: Revision of core clinical protocol thresholds (requires state public health committee approval).
  - Minor: Addition of new non-diagnostic assistive features (e.g. new point-of-care test integration).
  - Patch: Localized phrasing or UI clarification fixes.
- **Continuous Telemetry:**
  - Real-time distribution of red/amber/green ratios monitored across districts.
  - Sudden anomalies (e.g. a district reporting 90% emergency red) trigger technical audit for sensor or data entry calibration issues.

---

## 13. Future Machine Learning Capabilities (Clearly Marked as Planned / Research)

The following advanced capabilities are **explicitly planned future enhancements** and are NOT active in MVP v1.0:

1. **Frontline Voice-to-Text in Rural Marathi & Gondi Dialects (Planned Future):**
   - On-device speech recognition to allow ASHAs to dictate visit notes in local rural dialects (e.g., Ahirani, Gondi, Warli) for automatic transcription into structured text fields.
2. **Point-of-Care Paper Slip OCR (Planned Future):**
   - Assistive camera OCR to transcribe printed hemoglobin strip readouts or manual laboratory slips into digital numbers, eliminating manual transcription errors.
3. **Longitudinal Risk Trend Analysis (Planned Future):**
   - Statistical trend detection across 4+ antenatal visits to detect slow deterioration (e.g., gradual drop in hemoglobin over 3 months) before clinical thresholds are breached.
