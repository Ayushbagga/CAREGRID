# Product Requirement Document (PRD) v1.0
## CAREGRID — Rural Healthcare Access & Care Coordination Platform

---

| Document Metadata | Details |
| :--- | :--- |
| **Product Name** | **CAREGRID** (केअरग्रिड) |
| **Document Version** | **1.0 (Final Architecture & Implementation Specification)** |
| **Date of Publication** | September 19, 2026 |
| **Problem Statement** | **SIH26133**: Accessibility & Quality of Public Healthcare in Rural/Underserved Areas |
| **Nodal Jurisdiction** | **Government of Maharashtra** — Public Health Department (सार्वजनिक आरोग्य विभाग) |
| **Team Designation** | **The Glitch Gang** (Team ID: 129855) |
| **Project Status** | **MVP Feature-Complete & Fully Verified** (Sprints 1–5 Implemented & Tested) |
| **Target Implementation** | Primary Health Centres (PHCs), Community Health Centres (CHCs), Sub-Centres, District Hospitals, and ASHA/ANM Village Field Workers in Maharashtra |

---

## 1. Product Overview

### 1.1 Executive Summary
**CAREGRID** is a resilient, offline-first rural public healthcare access and care coordination platform engineered specifically for the public healthcare delivery ecosystem of Maharashtra. It bridges the critical "last-mile" divide separating tribal, remote, and underserved rural populations from primary, secondary, and tertiary clinical care.

Operating seamlessly across severe cellular and electrical connectivity constraints, CAREGRID unites the village health worker (ASHA/ANM), primary care physicians at Primary Health Centres (PHCs), and specialist physicians at Community Health Centres (CHCs) and District Hospitals (DHs) into a unified, closed-loop care delivery continuum. 

### 1.2 The Core 9-Stage Care Pipeline
CAREGRID operationalizes the public healthcare journey across 9 distinct, interconnected steps:

```
[1. Citizen / Patient Intake]
          │
          ▼
[2. ASHA / ANM Field Workflow]  <─── (Low-Bandwidth / Offline-First Dexie Storage)
          │
          ▼
[3. Primary Care Facility (Sub-Centre / PHC / CHC / Rural Hospital)]
          │
          ▼
[4. AI-Assisted Triage & Urgency Support]  <─── (Strictly Non-Diagnostic Decision Assist)
          │
          ▼
[5. Appointment / Digital Queue / Teleconsultation Coordination]
          │
          ▼
[6. Closed-Loop Referral Tracking (REF-MH-*)]  <─── (Intake Ack ➔ Evaluation ➔ Completion)
          │
          ▼
[7. Diagnostics / Medicines / Facility Service Directory]
          │
          ▼
[8. Follow-Up & Continuity of Care]  <─── (Automated ASHA Home Visit Counter-Tasks)
          │
          ▼
[9. Facility & Government Administrative Telemetry]
```

### 1.3 Strict Source of Truth & Heritage Boundary
- **Source of Truth**: SIH26133 exclusively.
- **Legacy Boundary**: The legacy SIH25001 / JalRakshak project is permanently abandoned. CAREGRID contains zero water-quality sensors, water-monitoring, or flood-related logic.
- **Scope Integrity**: CAREGRID strictly eliminates distracting non-core features (ambulance fleet dispatch, hospital bed telemetry, autonomous diagnosis, automated prescription generation) to deliver an uncompromised, battle-tested coordination backbone.

---

## 2. Problem Definition

### 2.1 The Rural Public Healthcare Challenge in Maharashtra
Public healthcare delivery across Maharashtra's 36 districts encounters stark geographic and operational divides. In tribal and remote belts such as Gadchiroli (Sironcha, Bhamragad, Aheri), Nandurbar (Dhadgaon, Akkalkuwa), Melghat (Dharni, Chikhaldara), and rural tracts of Nashik and Palghar, rural citizens face acute barriers to timely care:

1. **Severe Cellular Blackouts ("The Offline Reality")**: Field health workers operate in zero-reception forest and hilly hamlets where conventional cloud-only health apps fail completely.
2. **Disconnected, Paper-Based Referral "Dropouts"**: When a PHC Medical Officer refers a patient with pre-eclampsia or severe diabetic ulcers to a District Hospital, the patient is handed a paper slip. Up to 60% of rural patients drop out of the referral chain due to travel costs, lack of receiving facility acknowledgement, or confusion upon arrival.
3. **Unstructured, Overburdened OPD Queues**: Primary health centres experience chaotic walk-in rushes where critical, deteriorating patients (e.g., acute respiratory distress, severe maternal hypertension) wait in unprioritized queues alongside routine minor ailments.
4. **Lack of Post-Discharge Follow-up**: Once a patient is discharged from a higher hospital, the local village ASHA worker receives no notification or care summary, leading to missed post-operative checks, neonatal complications, and preventable readmissions.
5. **Information Asymmetry for Citizens**: Rural families often travel 40–80 km to a hospital only to discover that the specialist is on leave, sonography is unavailable that day, or they do not know how to avail benefits under the Mahatma Jyotirao Phule Jan Arogya Yojana (MJPJAY).

---

## 3. Goals and Non-Goals

### 3.1 Product Goals
- **Goal 1: True Offline-First Architecture**: Provide instantaneous client-side persistence (IndexedDB via Dexie.js) allowing ASHAs and PHC staff to register patients, screen vitals, queue appointments, and record encounters with zero active internet connection.
- **Goal 2: 100% Trilingual Parity**: Support Marathi (मराठी), Hindi (हिंदी), and English with identical feature access, consistent state public health terminology, and instantaneous language switching. English is the default load language.
- **Goal 3: Standardized Urgency Triage Assistance**: Provide transparent, rule-based clinical urgency classification (`Emergency Red`, `Urgent Amber`, `Routine Green`) with vital sign anomaly alerts and red-flag danger sign detection to help overburdened healthcare staff prioritize care safely.
- **Goal 4: Closed-Loop Referral Continuum**: Standardize inter-facility transfers using state referral codes (`REF-MH-[DIST]-[NUM]`), enforcing receiving facility intake acknowledgement, structured evaluation logging, and automatic generation of village-level ASHA follow-up counter-tasks.
- **Goal 5: Longitudinal Patient Health Record**: Provide a clear, tamper-resistant chronological timeline combining community vitals screenings, PHC consultations, specialist referrals, and home follow-up visits.
- **Goal 6: Rural Teleconsultation Room**: Enable low-bandwidth, asynchronous and synchronous video/audio teleconsultation connecting remote PHCs with district specialists, backed by digital health notes.
- **Goal 7: Facility & Service Directory**: Provide geo-aware discovery of public healthcare infrastructure (Sub-Centres, PHCs, CHCs, SDHs, DHs) detailing verified service availability, diagnostic timings, and empaneled schemes.
- **Goal 8: Transparent Administrative Visibility**: Supply district and state health administrators with anonymized operational KPIs (referral completion rates, triage urgency distribution, ASHA follow-up compliance) without violating patient privacy.

### 3.2 Non-Goals (Explicit Boundaries)
- **Non-Goal 1: NO Autonomous AI Diagnosis**: The AI triage module does NOT diagnose diseases, suggest clinical differential diagnoses, or replace licensed physicians. It acts strictly as an administrative urgency and priority ranking aid.
- **Non-Goal 2: NO Automated Drug Prescriptions**: CAREGRID does NOT generate automated drug dosages, e-prescriptions, or pharmacotherapy recommendations. Prescriptions remain clinician-entered.
- **Non-Goal 3: NO 108 Ambulance Fleet Tracking**: CAREGRID manages the clinical referral handover and care status; it does NOT track GPS telemetry or dispatch emergency ambulance fleets.
- **Non-Goal 4: NO Real-Time Hospital Bed Census**: Hospital bed occupancy tracking is excluded. Facilities publish operational service and specialty availability, not live bed census data.
- **Non-Goal 5: NO Epidemiological Outbreak Forecasting**: The system does not attempt algorithmic outbreak forecasting or contagion modeling.
- **Non-Goal 6: NO Water Quality / JalRakshak Functionality**: All water-sensor, water-quality, and flood-monitoring logic is strictly and permanently excluded.
- **Non-Goal 7: NO Unverified ABDM/ABHA Integration Claims**: Unless real government sandbox credentials and technical verification exist, CAREGRID uses neutral, compliant "Health ID / Health Record" placeholders and does not make uncertified legal claims of ABDM compliance.
- **Non-Goal 8: NO False Cloud Sync Claims**: When cloud database endpoints are unconfigured, the app truthfully displays local queue status and does not falsely claim active cloud synchronization.

---

## 4. Target Users and Stakeholders

| Stakeholder Persona | Typical Environment | Primary Needs & Pain Points | Primary CAREGRID Surface |
| :--- | :--- | :--- | :--- |
| **Rural Citizen / Patient** | Remote village, low digital literacy, smartphone access variable | Needs clear Health ID, visit history, upcoming visit reminders, transparent PHC service timings, and scheme eligibility information. | **Citizen Portal** (`/citizen`) |
| **ASHA Worker / ANM** | Field door-to-door visits in tribal/rural hamlets; entry-level Android smartphone; offline environment | Needs rapid household registration, mobile vitals screening, danger-sign checklists, offline data caching, and clear follow-up task reminders. | **ASHA Field Workspace** (`/asha`) |
| **PHC Medical Officer** | Overcrowded rural primary health centre (OPD 80–150 patients/day); intermittent electricity/Wi-Fi | Needs an urgency-prioritized OPD queue, immediate visibility of high-risk pregnancies, rapid specialist referral initiation, and rural teleconsultation tools. | **Doctor / PHC Workspace** (`/doctor`) |
| **Specialist / DH Doctor** | District Hospital / Sub-District Hospital OPD & Inpatient Ward | Needs pre-notified incoming referral packages, patient vitals history from rural PHCs, structured discharge summaries, and counter-referral instructions to village ASHAs. | **Referral Workspace** (`/referrals`) & `/doctor` |
| **Taluka Health Officer (THO)** | Taluka administrative office | Needs operational visibility into PHC queue wait times, referral completion rates, and ASHA home visit adherence across the taluka. | **Government Dashboard** (`/admin`) |
| **District Health Officer (DHO) / Civil Surgeon** | District Health Administration (Zilla Parishad / DH) | Needs high-level telemetry on secondary care bottlenecks, maternal high-risk tracking, referral leakage, and public facility service readiness. | **Government Dashboard** (`/admin`) |

---

## 5. User Roles and Permissions (RBAC Matrix)

CAREGRID enforces strict, principle-of-least-privilege Role-Based Access Control:

| Capability / Resource | Citizen (`citizen`) | ASHA / ANM (`asha_worker`) | PHC Doctor (`medical_officer`) | Hospital Specialist (`specialist_doctor`) | Health Administrator (`administrative_officer`) |
| :--- | :---: | :---: | :---: | :---: | :---: |
| **Register New Patient** | Personal only | Assigned Village | Full Facility | Full Facility | No (Audit Only) |
| **Record Community Vitals** | No | Yes (Assigned) | Yes | Yes | No |
| **View Full Longitudinal Timeline** | Personal only | Assigned Village | Full Facility | Referred Patients | No (Anonymized Only) |
| **Digital OPD Queue & Token Issuance** | View Personal | View Village | Manage & Prioritize | Manage Specialty | View Aggregates |
| **Override AI Urgency Tier** | No | No | Yes (Mandatory Justification) | Yes (Mandatory Justification) | No |
| **Initiate Inter-Facility Referral** | No | Recommend Only | Full Authority | Full Authority | No |
| **Acknowledge / Complete Referral** | No | No | Receiving Facility | Receiving Facility | No |
| **Conduct Teleconsultation** | Join (Assisted) | Assist Citizen | Initiate / Host | Host / Consult | No |
| **Close Follow-Up Tasks** | View Personal | Full Authority | Full Authority | Review Only | View Adherence % |
| **Access Anonymized State Telemetry** | No | No | Local Facility | Local Facility | State & District Full |

---

## 6. Core User Journeys

### 6.1 Journey A: High-Risk Maternal Screening to District Hospital Care
```
[ASHA Worker: Village Reguntha, Gadchiroli]
  1. Opens CAREGRID mobile app in offline mode.
  2. Selects pregnant citizen Sunita Gawade (26y).
  3. Records vitals: BP 160/110 mmHg, severe headache, bilateral pedal edema.
  4. CAREGRID Triage Engine flags "Emergency Red" (Severe Gestational Hypertension).
  5. ASHA escorts patient to Chamorshi PHC.
         │
         ▼
[PHC Medical Officer: Chamorshi PHC]
  6. Patient appears at top of OPD Queue with pulsing "Emergency Red" token.
  7. Medical Officer verifies vitals and initiates closed-loop referral to Gadchiroli District Hospital.
  8. System generates official tracking code: REF-MH-GAD-7821.
         │
         ▼
[District Hospital Specialist: Gadchiroli DH]
  9. Receiving Obstetrician receives incoming notification and clicks "Acknowledge Referral".
  10. Patient arrives; Obstetrician evaluates, manages pre-eclampsia, and stabilizes patient.
  11. Specialist enters clinical evaluation and marks referral "Completed".
         │
         ▼
[Closed-Loop Counter-Referral: Automatic Generation]
  12. CAREGRID automatically creates a high-priority ASHA Follow-up Task:
      "Post-Discharge Maternal Check: Blood Pressure monitoring and medication compliance check within 48 hours."
  13. ASHA in Reguntha receives task notification, completes home visit, logs follow-up vitals, and closes the loop.
```

### 6.2 Journey B: Rural Walk-In Patient with Acute Chest Pain
```
[Citizen: Walk-in at Bhamragad PHC]
  1. Staff registers walk-in token.
  2. Patient reports crushing chest pain and diaphoresis.
  3. AI Triage Engine flags "Emergency Red" with danger sign.
  4. Patient is fast-tracked ahead of routine green cases.
  5. Medical Officer initiates rural teleconsultation link with District Hospital Cardiologist.
  6. Low-bandwidth audio/video canvas launches; specialist reviews vitals timeline and advises stabilization protocol.
```

### 6.3 Journey C: Citizen Self-Discovery of Facility Services and Scheme Benefits
```
[Citizen: Gadchiroli District]
  1. Citizen opens Citizen Portal on mobile browser.
  2. Views neutral digital Health ID and QR code.
  3. Enters "Facility Discovery": filters for "Sonography / Ultrasound" within 30 km.
  4. System displays Aheri Sub-District Hospital with confirmed operating hours (Mon/Wed/Fri).
  5. Citizen checks "Health Scheme Info" tab and verifies eligibility for free ultrasound and transport under JSSK.
```

---

## 7. MVP Scope Specifications

The MVP comprises 11 fully functional, interconnected modules:

```
┌────────────────────────────────────────────────────────────────────────┐
│                         CAREGRID CORE MODULES                          │
├───────────────────────────┬───────────────────────────┬────────────────┤
│ 1. Citizen / Intake       │ 5. OPD Queue & Tokens     │ 9. ASHA Tasks  │
│ 2. ASHA Field Workflow    │ 6. Rural Teleconsultation │ 10. Trilingual │
│ 3. AI Triage Assist       │ 7. Closed-Loop Referrals  │ 11. Offline DB │
│ 4. Facility Discovery     │ 8. Longitudinal Timeline  │                │
└───────────────────────────┴───────────────────────────┴────────────────┘
```

All 11 modules are designed to operate locally on the device (client-side) using Dexie.js (IndexedDB), synchronizing seamlessly with the server backend when online.

---

## 8. Functional Requirements — Deep Dive

---

### 9. Citizen / Patient Flow
- **FR-CIT-01**: Unique Patient Identifier: Every registered patient is assigned a deterministic, state-standard identifier formatted as `CARE-MH-[YEAR]-[RANDOM_HEX]` (e.g., `CARE-MH-2026-A8F2`).
- **FR-CIT-02**: Demographic Profile: Capture full legal name, age, biological sex (`male`, `female`, `other`), 10-digit mobile number, village/hamlet, taluka, and district.
- **FR-CIT-03**: Vulnerability Tagging: Capture active pregnancy status, gestational age (weeks), high-risk pregnancy markers (anemia, previous C-section, hypertension), and chronic non-communicable disease (NCD) flags (diabetes, hypertension, COPD).
- **FR-CIT-04**: Neutral Health ID Card: Display a printable, mobile-responsive Health ID card showing patient demographic summary, emergency contact, blood group (if known), and local QR code encoding the identifier for rapid PHC check-in.
- **FR-CIT-05**: Strictly Zero Unverified ABHA Claims: The UI shall present a neutral "Health ID / Health Record" placeholder. It shall NOT claim active ABDM/ABHA integration until formal government sandbox certification is secured.

---

### 10. ASHA / ANM Workflow
- **FR-ASH-01**: Mobile Field Workspace: Mobile-optimized interface configured with assigned village context (e.g., "Reguntha, Taluka Sironcha, Dist. Gadchiroli").
- **FR-ASH-02**: Household Patient Roster: Instantaneous search and filterable directory displaying total registered citizens, active pregnant women, high-risk cases, and chronic patients.
- **FR-ASH-03**: Rapid Field Vitals Screening: Mobile form capturing:
  - Systolic and Diastolic Blood Pressure (mmHg)
  - Heart Rate / Pulse (bpm)
  - Oxygen Saturation ($SpO_2$ %)
  - Blood Glucose (Random / Fasting in mg/dL)
  - Body Temperature (°F)
- **FR-ASH-04**: Clinical Danger Signs Checklist: Mandatory multi-select check for clinical red flags:
  - Maternal: Severe headache/blurred vision, vaginal bleeding, reduced fetal movements, severe abdominal pain, facial/pedal puffiness.
  - General/Pediatric: Extreme lethargy, difficulty breathing / chest indrawing, high fever with stiff neck, persistent vomiting, severe dehydration.
- **FR-ASH-05**: Offline Data Queuing: All patient intake records and vitals screenings must commit to IndexedDB within 50ms, updating the pending synchronization queue.

---

### 11. PHC / Doctor Workflow
- **FR-DOC-01**: Facility Assignment Context: Header dynamically displays the active facility profile (e.g., "Chamorshi Primary Health Centre, Gadchiroli").
- **FR-DOC-02**: Clinical Overview: Real-time counter of total patients waiting in queue, active consultations, high-risk flags, and incoming referrals.
- **FR-DOC-03**: Patient Encounter Documentation: Doctor interface to record clinical consultation notes, advised diagnostic investigations, and medical advice during OPD visits.
- **FR-DOC-04**: Clinical Safety Disclaimer: Prominent alert banner permanently rendered above clinical lists: *"Notice: AI assists healthcare staff in clinical prioritization; it does NOT formulate diagnoses."*

---

### 12. Referral & Continuity-of-Care Workflow
- **FR-REF-01**: State Referral Code Generation: Inter-facility transfers must generate a standardized tracking code formatted as `REF-MH-[DISTRICT_3]-[UNIQUE_ID]` (e.g., `REF-MH-GAD-7821`).
- **FR-REF-02**: Referral Lifecycle Stepper: Strict 4-stage closed-loop progression:
  1. `initiated`: Originating PHC/CHC generates transfer with required specialty, urgency tier, and clinical justification.
  2. `acknowledged`: Receiving hospital (District Hospital / CHC) reviews notification and accepts patient intake.
  3. `evaluated`: Receiving specialist records clinical findings, investigations, and inpatient/OPD interventions.
  4. `completed` (Closed-Loop): Patient is discharged with structured summary and counter-referral instructions.
- **FR-REF-03**: Tabbed Referral Manager: Dedicated dual-tab interface separating **Outgoing Referrals** (patients transferred out) and **Incoming Referrals** (patients arriving from peripheral centres).
- **FR-REF-04**: Automatic ASHA Counter-Task Trigger: Marking a referral as `completed` automatically dispatches a linked follow-up home visit task to the patient's assigned village ASHA.

---

### 13. Appointment / Queue / Teleconsultation
- **FR-APT-01**: Urgency-Ordered Digital OPD Queue: Queue items are sorted by urgency tier first (`emergency_red` $\rightarrow$ `urgent_amber` $\rightarrow$ `routine_green`), followed by chronological arrival time.
- **FR-APT-02**: Token Generation Modal: Quick-issue modal generating daily OPD token numbers (e.g., `#01`, `#02`) linked to patient ID, urgency tier, and visit purpose.
- **FR-APT-03**: Status Progression: Instant one-click token transitions: `in_queue` $\rightarrow$ `in_consultation` $\rightarrow$ `completed` or `referred`.
- **FR-APT-04**: Rural Teleconsultation Room: Web-based teleconsultation interface featuring:
  - Low-Bandwidth Mode toggle (disables high-res video, prioritizing audio and real-time vitals telemetry).
  - Audio Mute and Video Feed toggles.
  - Live patient vitals display alongside consultation notes canvas.
  - End-call clinical action summarizing recommendations.

---

### 14. Facility & Service Discovery
- **FR-FAC-01**: Public Facility Hierarchy: Comprehensive directory supporting:
  - Sub-Centres / Health & Wellness Centres (Arogyavardhini)
  - Primary Health Centres (PHCs)
  - Community Health Centres (CHCs) / Rural Hospitals (RHs)
  - Sub-District Hospitals (SDHs) & District Hospitals (DHs)
- **FR-FAC-02**: Service & Specialty Catalog: Search and filter facilities by clinical services: General Medicine, Obstetrics & Gynecology, Pediatrics, Emergency Care, Minor OT, X-Ray, Sonography, Laboratory, and NCD Screening.
- **FR-FAC-03**: Operating Metadata: Facility profile displaying full address, contact numbers, operating hours, emergency 24/7 status, and ambulance tie-up information.

---

### 15. Follow-Up Workflow
- **FR-FOL-01**: Automated Task Categorization: ASHA follow-up task engine categorizing assignments into:
  - `Overdue` (Past due date — highlighted red)
  - `Due Today` (Due within 24 hours — highlighted amber)
  - `Upcoming` (Scheduled within next 7 days — highlighted slate)
- **FR-FOL-02**: Follow-Up Types: Standardized task triggers:
  - `post_referral_check`: Verification of patient compliance and recovery post-hospital discharge.
  - `high_risk_pregnancy_visit`: Fortnightly home monitoring of maternal danger signs and blood pressure.
  - `routine_check`: Child immunization reminder or chronic disease medication review.
- **FR-FOL-03**: Task Resolution: One-click task completion form allowing ASHA to log visit notes, current vitals, and mark task as resolved.

---

### 16. Government / Facility Dashboard
- **FR-ADM-01**: Planned Capability Transparency: Header permanently displays: *"Notice: Taluka/District administrative dashboard is a planned capability."*
- **FR-ADM-02**: Six Core Operational KPIs:
  1. Total Healthcare Facilities Monitored (Sub-Centres, PHCs, CHCs, DHs)
  2. Total Referral Volume across Jurisdiction
  3. Closed-Loop Referral Completion Rate (%)
  4. ASHA Follow-up Compliance & Adherence Rate (%)
  5. Triage Urgency Distribution (Emergency Red vs Urgent Amber vs Routine Green)
  6. Offline Sync Resilience Index (%)
- **FR-ADM-03**: District & Taluka Filtering: Filter pills allowing administrators to isolate data by district (e.g., `All Maharashtra`, `Gadchiroli`, `Nashik`, `Pune`).
- **FR-ADM-04**: Anonymized Telemetry: All dashboard charts and metrics are computed from aggregated counts; zero personal identifiers, names, or phone numbers are exposed.

---

### 17. AI-Assisted Triage & Priority Support

```
┌────────────────────────────────────────────────────────────────────────┐
│                     AI TRIAGE MATRIX (NON-DIAGNOSTIC)                  │
├─────────────────┬──────────────────────────┬───────────────────────────┤
│ Urgency Tier    │ Clinical Criteria Trigger│ Action Required           │
├─────────────────┼──────────────────────────┼───────────────────────────┤
│ EMERGENCY RED   │ SBP ≥ 160 or DBP ≥ 110,  │ Immediate stabilization;  │
│                 │ SpO2 < 90%, active chest │ Fast-track OPD queue top; │
│                 │ pain, maternal bleeding  │ Specialist referral alert │
├─────────────────┼──────────────────────────┼───────────────────────────┤
│ URGENT AMBER    │ SBP 140–159 or DBP 90–99,│ Priority review within    │
│                 │ SpO2 90–94%, persistent  │ 60 minutes; secondary care│
│                 │ fever, diabetic foot     │ workup                    │
├─────────────────┼──────────────────────────┼───────────────────────────┤
│ ROUTINE GREEN   │ Normal vitals, mild cold/│ Standard OPD sequence;    │
│                 │ cough, routine follow-up │ Community health check    │
└─────────────────┴──────────────────────────┴───────────────────────────┘
```

- **FR-TRG-01**: Objective Urgency Classification: Evaluates patient vitals, pregnancy flags, and clinical danger signs against standardized public health protocols, assigning an urgency tier:
  - `emergency_red` (Immediate clinical priority)
  - `urgent_amber` (Fast-track priority within 1 hour)
  - `routine_green` (Standard outpatient queue order)
- **FR-TRG-02**: Transparent Urgency Factors: UI displays the exact clinical triggers explaining the rating (e.g., *"Triggers: Diastolic BP ≥ 110 mmHg, Severe Headache at 34w gestation"*).
- **FR-TRG-03**: Mandatory Doctor Urgency Override: Physicians maintain absolute clinical authority and can override any AI urgency suggestion with a single click, entering a mandatory justification note.
- **FR-TRG-04**: Permanent Non-Diagnostic Disclaimers: Disclaimers are rendered alongside all triage suggestions in Marathi, Hindi, and English.

---

## 18. Multilingual Support: English, Hindi, Marathi

- **FR-LAN-01**: Trilingual Implementation: Full native support for:
  - **English (`en`)** — Default application load language.
  - **Hindi (`hi`)** — हिंदी.
  - **Marathi (`mr`)** — मराठी (Official State Language of Maharashtra).
- **FR-LAN-02**: 100% Dictionary Parity: All 3 translation files maintain exact 1-to-1 key parity across 266+ UI keys, verified by automated CI test suites.
- **FR-LAN-03**: Language Switcher Control: Accessible, visible segmented control positioned in the top navigation header across every route. Switching is instantaneous (< 10ms) without full page reload.
- **FR-LAN-04**: Terminology Standardization: Terminology conforms to Maharashtra Directorate of Health Services guidelines:
  - PHC: प्राथमिक आरोग्य केंद्र (PHC)
  - Referral: संदर्भ सेवा (Referral)
  - High Risk: उच्च जोखीम
  - Vitals: आरोग्य तपासणी / जीवनचिन्हे
  - Follow-up: पाठपुरावा गृहभेट

---

## 19. Offline-First & Low-Connectivity Behavior

- **FR-OFF-01**: Client-Side Persistence Engine: All entity writes (patients, encounters, tokens, referrals, follow-up resolutions) commit immediately to client-side IndexedDB via Dexie.js.
- **FR-OFF-02**: Independent Offline Operation: Zero network requests are required for registering patients, viewing rosters, updating queue tokens, or reviewing health records.
- **FR-OFF-03**: Truthful Offline & Queue Status Banner:
  - When network is offline: Display amber banner: *"Offline Mode: No network connection. Data safely saved locally on device."*
  - When network is online but cloud backend is unconfigured: Display slate banner: *"Local Storage Active: Records queued on device (Cloud sync unconfigured)"*.
  - When cloud backend is configured and syncing: Display teal banner: *"Connected: Syncing offline records with CAREGRID cloud..."*.
  - When online with 0 pending records: Banner automatically hides.
- **FR-OFF-04**: Deterministic Client-Side ID Generation: All records use UUIDv4 generated locally to eliminate ID collisions during multi-device asynchronous syncing.
- **FR-OFF-05**: Sync Queue Architecture: Dedicated `syncQueue` table in IndexedDB tracking `{ id, entity_type, operation, payload, created_at, retry_count, status }`.
- **FR-OFF-06**: Conflict Resolution Policy: Last-Write-Wins (LWW) timestamped conflict resolution combined with idempotent upsert endpoints on the backend.

---

## 20. Notifications Architecture

- **FR-NOT-01**: In-App Event Notifications: Lightweight, reactive notification badges within the ASHA and Doctor workspaces for:
  - Incoming emergency red referral arrivals.
  - Overdue maternal follow-up home visit tasks.
  - Token queue updates.
- **FR-NOT-02**: Citizen Reminder Modal: Dedicated popup accessible on the Citizen Portal displaying upcoming appointment dates, immunizations, and referral follow-up schedules.
- **FR-NOT-03**: SMS Gateway Extensibility: Data structures pre-configured with telephone numbers and notification templates ready for integration with national/state SMS gateways (C-DAC Mobile Seva / NIC SMS).

---

## 21. Health Scheme Information Module

- **FR-SCH-01**: State Scheme Catalog: Trilingual information repository detailing Maharashtra's premier public healthcare protection schemes:
  1. **Mahatma Jyotirao Phule Jan Arogya Yojana (MJPJAY)**: Cashless health insurance up to ₹5 Lakhs/family/year for 996 identified medical and surgical procedures across secondary and tertiary public/empaneled private hospitals.
  2. **Ayushman Bharat — Pradhan Mantri Jan Arogya Yojana (PMJAY)**: Integrated central insurance cover of ₹5 Lakhs for vulnerable rural households.
  3. **Janani Shishu Suraksha Karyakram (JSSK)**: 100% free institutional delivery, free drugs, free diagnostics (ultrasound/blood), free diet, and free transport from home to facility and back for pregnant women and sick neonates.
  4. **Pradhan Mantri Matru Vandana Yojana (PMMVY)**: Direct cash transfer incentive of ₹5,000 for first living child to promote maternal nutrition.
  5. **National Tuberculosis Elimination Programme (NTEP / Nikshay Poshan)**: ₹500/month direct nutrition support during active TB treatment.
- **FR-SCH-02**: Scheme Search & Filter: Citizens and ASHAs can filter schemes by target beneficiary (`pregnant_women`, `children`, `bpl_families`, `chronic_illness`).
- **FR-SCH-03**: Document Checklists: Plain-language checklist of required documents (Ration Card, Aadhaar Card, Voter ID, Doctor's referral slip).

---

## 22. Security and Privacy Requirements

- **FR-SEC-01**: Data Privacy Compliance: Architecture adheres to the principles of the Digital Personal Data Protection Act (DPDPA 2023) and DISHA (Digital Information Security in Healthcare Act).
- **FR-SEC-02**: Aggregated Telemetry Governance: Administrative dashboards are mathematically decoupled from patient PII; data aggregation occurs before transmission to administrative interfaces.
- **FR-SEC-03**: Minimal PII Exposure: Patient profiles utilize neutral identifiers; phone numbers and demographic addresses are masked on referral sheets outside the direct care circle.
- **FR-SEC-04**: Client-Side Storage Hygiene: Local IndexedDB data is sandboxed to the application origin; sensitive session tokens are stored in `httpOnly` secure cookies or ephemeral memory.
- **FR-SEC-05**: Transport Security: All network communication is strictly enforced over TLS 1.3 with HTTPS redirection, Content Security Policies (CSP), and `nosniff` header configurations.

---

## 23. Interoperability Direction (ABDM Alignment)

- **FR-INT-01**: Neutral Identifier Architecture: CAREGRID uses a clean, compliant internal identifier (`CARE-MH-YYYY-XXXX`) designed to bind seamlessly to an 14-digit ABHA ID once formal gateway APIs are provisioned.
- **FR-INT-02**: FHIR R4 Ready Data Structures: All internal healthcare models (Patient, Encounter, Observation, ServiceRequest, Appointment) mirror HL7 FHIR Release 4 resource profiles:
  - `Patient` $\rightarrow$ FHIR `Patient` resource
  - `VitalsScreening` $\rightarrow$ FHIR `Observation` bundle
  - `Referral` $\rightarrow$ FHIR `ServiceRequest` resource
  - `Appointment` $\rightarrow$ FHIR `Appointment` resource
- **FR-INT-03**: ABDM Milestone Roadmap: Technical provisions ready for Sandbox M1 (ABHA creation), M2 (HIP - Health Information Provider), and M3 (HIU - Health Information User) integration.

---

## 24. Non-Functional Requirements (NFRs)

- **NFR-PERF-01**: Initial Page Load: First Contentful Paint (FCP) $\le 1.2$ seconds and Largest Contentful Paint (LCP) $\le 2.0$ seconds on 3G rural mobile network connections.
- **NFR-PERF-02**: Client-Side Query Latency: IndexedDB roster filter, search, and token issuance response time $\le 50$ milliseconds.
- **NFR-A11Y-01**: Accessibility Standards: Adherence to WCAG 2.1 Level AA; minimum touch target dimensions $\ge 44 \times 44$ pixels for mobile field screens.
- **NFR-RELI-01**: Data Loss Prevention: Guaranteed zero local data loss during abrupt browser tab closure, device battery shutdown, or background app termination.
- **NFR-BUNDLE-01**: Optimized Bundle Footprint: Total shared JavaScript bundle $\le 90$ kB gzip; route-specific JS chunks $\le 35$ kB gzip.
- **NFR-COMPAT-01**: Browser & OS Compatibility: Support for Android Chrome (v80+), Samsung Internet, Mobile Safari (iOS 15+), and desktop modern browsers (Chrome, Edge, Firefox).

---

## 25. MVP vs Post-MVP Phasing

| Functional Area | Sprint 1–5 MVP (Implemented & Verified) | Phase 2 (Taluka/District Pilot) | Phase 3 (State-Wide Scale) |
| :--- | :--- | :--- | :--- |
| **Connectivity** | Offline-First Dexie.js + truthful local queue status | Supabase Cloud Database sync with auto-reconnect | State Data Centre (SDC) PostgreSQL cluster |
| **Language Support** | Full English, Hindi, Marathi (100% parity) | Regional dialect glossaries (Gondi, Korku, Bhili) | Voice-based multilingual speech-to-text |
| **Triage Module** | Rule-based clinical urgency heuristics + Doctor override | Enhanced vital trend scoring & pediatric risk alerts | Federated multi-centre priority calibration |
| **Referral System** | Closed-loop 4-stage transfer + ASHA counter-tasks | Inter-district transfers across Maharashtra | National referral exchange across state borders |
| **Teleconsultation** | Web canvas with low-bandwidth video/audio simulation | WebRTC live video/audio rooms with packet throttling | Integrated satellite VSAT teleconsultation links |
| **Digital Health ID** | Neutral `CARE-MH-*` identifier with QR code | ABDM Sandbox M1 (ABHA ID verification) | National Health Record Exchange (M2/M3 certified) |
| **Notifications** | In-app notification feeds & Citizen reminder modal | Automated SMS alerts via C-DAC Mobile Seva | Interactive WhatsApp bot & IVR automated calls |
| **Dashboard** | Operational district/state telemetry + district filters | Real-time taluka GIS maps & facility heatmaps | Predictive supply chain & resource allocation |

---

## 26. Acceptance Criteria

```
┌────────────────────────────────────────────────────────────────────────┐
│                      CORE ACCEPTANCE CRITERIA MATRIX                   │
├───────────────────────┬────────────────────────────────────────────────┤
│ AC-01: Offline Intake │ Patient registration and vitals screening must │
│                       │ succeed with network disconnected.             │
├───────────────────────┼────────────────────────────────────────────────┤
│ AC-02: Trilingual     │ Seamless switching between EN, HI, and MR with │
│                       │ 0 untranslated keys and 0 layout breaks.       │
├───────────────────────┼────────────────────────────────────────────────┤
│ AC-03: AI Disclaimer  │ Mandatory non-diagnostic disclaimer visible on │
│                       │ all triage cards and queue surfaces.           │
├───────────────────────┼────────────────────────────────────────────────┤
│ AC-04: Closed Loop    │ Initiating, acknowledging, evaluating, and     │
│                       │ completing referral must create ASHA task.     │
├───────────────────────┼────────────────────────────────────────────────┤
│ AC-05: Strict Scope   │ Exactly 0 mentions of water sensors, beds,     │
│                       │ ambulances, outbreaks, or auto-prescriptions.  │
└───────────────────────┴────────────────────────────────────────────────┘
```

- **AC-01 (Offline Operation)**: Disconnecting the browser network must allow full registration of a new citizen, entry of vitals screening, and generation of an OPD token. Data must persist in IndexedDB and appear upon page refresh.
- **AC-02 (Trilingual Fidelity)**: Toggling the language control between English, Hindi, and Marathi must instantly translate all UI headers, buttons, cards, and disclaimers with zero untranslated fallback strings.
- **AC-03 (Triage Transparency & Safety)**: When systolic BP $\ge 160$ mmHg or danger signs are checked, the system must assign `emergency_red` tier with pulsing visual indicator and display the exact clinical triggers. A doctor override modal must be accessible.
- **AC-04 (Closed-Loop Referral Cycle)**: Completing a referral at a receiving hospital must automatically create a linked post-referral home visit task in the originating village ASHA's workspace.
- **AC-05 (Neutral Health ID Verification)**: The Citizen Portal must display a neutral "Health ID / Health Record" card without claiming uncertified ABHA integration.
- **AC-06 (Strict Scope Boundaries)**: Global code and interface audit must confirm exactly zero code references or UI elements related to water testing, outbreak prediction models, 108 ambulance dispatch, or inpatient bed tracking.
- **AC-07 (Quality & Performance)**: TypeScript check (`tsc --noEmit`) must exit with 0 errors; production build (`next build`) must compile cleanly with 15/15 valid routes; automated browser QA must pass 100%.

---

## 27. Risks, Assumptions, and Dependencies

### 27.1 Risks and Mitigations
- **Risk 1: Device Memory Exhaustion on Low-End ASHA Phones**: Low-cost smartphones with limited RAM may struggle with large local databases.  
  *Mitigation*: Dexie database enforces pagination, limits local active caches to the assigned village (max ~2,000 residents), and archives completed historical tasks.
- **Risk 2: Resistance to Digital Workflow Transition**: Field workers accustomed to paper registers (MCTS / RCH registers) may resist digital entry.  
  *Mitigation*: Designed with high-contrast, large touch targets, minimal typing (dropdowns and checkboxes), and native Marathi language labels matching physical register terms.
- **Risk 3: Misinterpretation of AI Triage as Final Diagnosis**: Rural staff might mistakenly treat triage suggestions as medical diagnosis.  
  *Mitigation*: Explicit, non-dismissible disclaimers across all views; triage outputs explicitly labeled as "Urgency Tier" rather than disease conditions; mandatory doctor override enabled.

### 27.2 Operational Assumptions
- ASHA workers possess entry-level touchscreen Android smartphones running Android 8.0+.
- Primary Health Centres possess at least one desktop PC, laptop, or tablet with intermittent power backup (solar/inverter).
- Receiving District Hospitals possess designated Medical Officers or data entry operators to acknowledge incoming transfers.

### 27.3 External Dependencies
- **State Cloud Infrastructure**: Future cloud hosting on Maharashtra State Data Centre (SDC) or compliant GovCloud.
- **Telecommunications**: Periodic cellular connectivity (2G/3G/4G) at village weekly markets (haats) or PHCs to trigger synchronization.
- **Government Authorization**: Official administrative circular from the Public Health Department sanctioning digital referral handovers.

---

## 28. Success Metrics (Key Performance Indicators)

### 28.1 Clinical & Care Access KPIs
- **Referral Completion Rate**: Increase closed-loop referral follow-through from baseline ~40% to $\ge 85\%$ across pilot talukas within 6 months.
- **Maternal High-Risk Detection to Care Latency**: Decrease time elapsed between ASHA village detection of high-risk pregnancy and specialist evaluation from 14 days to $\le 48$ hours.
- **Emergency Triage Response Time**: Ensure 100% of `emergency_red` patients at PHC OPDs receive medical officer attention within 5 minutes of token issuance.
- **Post-Discharge Follow-Up Adherence**: Achieve $\ge 90\%$ timely home visit completion by village ASHAs within 72 hours of hospital discharge.

### 28.2 Operational & Technical KPIs
- **Zero Field Data Loss**: 100% local persistence reliability with 0 records lost during network outages or device reboots.
- **Sync Completion Rate**: $\ge 99.5\%$ successful transmission of offline queues upon reconnection.
- **Trilingual Parity Index**: 100% parity maintained across all releases (0 missing translation keys).
- **User Adoption Rate**: $\ge 90\%$ daily active utilization among pilot ASHA field workers and PHC Medical Officers.

---

*Document compiled in strict accordance with SIH26133 by **The Glitch Gang** (Team ID: 129855) for the Government of Maharashtra Public Health Department.*
