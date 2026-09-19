# CAREGRID Business Model v1.0

**Document Reference:** CAREGRID-DOC-BIZ-V1.0  
**Problem Statement:** SIH26133 — Accessibility & Quality of Public Healthcare in Rural/Underserved Areas  
**Target Beneficiary:** Government of Maharashtra (Public Health Department / National Health Mission)  
**Status:** Strategic Architecture & Proposed Sustainability Framework  
**Nature of Platform:** Public Digital Infrastructure / Digital Public Good (DPG) for Rural Health  
**Companion Documents:**  
- [`docs/PRD-v1.0.md`](./PRD-v1.0.md) (Product Requirements Document v1.0)  
- [`docs/TRD-v1.0.md`](./TRD-v1.0.md) (Technical Requirements Document v1.0)  
- [`docs/Backend-Schema-v1.0.md`](./Backend-Schema-v1.0.md) (Backend Database Schema v1.0)  
- [`docs/API-Contract-v1.0.md`](./API-Contract-v1.0.md) (API Contract v1.0)  
- [`docs/Security-Privacy-v1.0.md`](./Security-Privacy-v1.0.md) (Security & Privacy Specification v1.0)  
- [`docs/AI-ML-Specification-v1.0.md`](./AI-ML-Specification-v1.0.md) (AI/ML Specification v1.0)  
- [`docs/UI-UX-Design-v1.0.md`](./UI-UX-Design-v1.0.md) (UI/UX Design Specification v1.0)  

---

> [!IMPORTANT]
> **Public Healthcare Disclaimer:**  
> CAREGRID is an institutional public-health platform designed for state and district health administration, primary healthcare centers, frontline community workers, and rural citizens. **It is NOT a consumer B2C subscription app, nor does it monetize health data or advertisements.**  
> All deployment phases, institutional partnerships, budget estimates, and procurement pathways outlined in this document represent **proposed technical and operational strategies** for hackathon evaluation and future pilot exploration. They do not constitute signed government contracts, confirmed budgetary appropriations, or official state commitments.

---

## 1. Product & Value Proposition

### 1.1 Core Value Proposition
CAREGRID delivers an **offline-first rural care continuum and coordination platform** that bridges the structural divide between remote tribal/rural communities and secondary/tertiary public health facilities in Maharashtra.

```
                          VALUE PROPOSITION MAP
┌─────────────────────────────────────────────────────────────────────────────┐
│ 1. For Frontline Workers (ASHAs / ANMs):                                    │
│    • Offline-capable mobile intake & vital recording (<90 seconds).         │
│    • Objective assistive triage and red-flag escalation.                   │
│    • Structured, automated follow-up task lists (Overdue / Due Today).      │
│                                                                             │
│ 2. For Rural Patients & Citizens:                                           │
│    • Free discovery of verified public health facilities & doctors.         │
│    • Longitudinal health record timeline under a neutral ID.                │
│    • Clear eligibility guidance for government schemes (MJPJAY, PM-JAY).   │
│    • Guaranteed continuity of care following hospital discharge.            │
│                                                                             │
│ 3. For Treating Doctors & PHC Staff:                                        │
│    • Priority-sorted OPD queues (Emergency Red fast-tracked to the top).     │
│    • Complete clinical context received before patient arrives via referral.│
│    • Integrated specialist teleconsultation session documentation.          │
│                                                                             │
│ 4. For District & State Health Administrators:                              │
│    • End-to-end closed-loop referral tracking (eliminates "lost" patients). │
│    • Real-time visibility into essential medicine stocks and readiness.     │
│    • Anonymized governance telemetry compliant with DISHA principles.       │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Target Stakeholders

1. **State Health Authority:** Department of Public Health, Government of Maharashtra; State Health Society (National Health Mission - Maharashtra).
2. **District Health Administration:** District Health Officers (DHO), Civil Surgeons, District Program Managers (DPM).
3. **Taluka Health Establishments:** Taluka Health Officers (THO), Medical Superintendents of Sub-District Hospitals (SDH) and Rural Hospitals (RH).
4. **Primary Health Infrastructure:** Primary Health Centres (PHC), Ayushman Arogya Mandirs (Health & Wellness Centres), and Sub-Centers.
5. **Community Frontline Cadre:** Accredited Social Health Activists (ASHA), Auxiliary Nurse Midwives (ANM), and Multipurpose Workers (MPW).
6. **Rural Citizens & Beneficiaries:** Villagers, pregnant women, high-risk mothers, infants, elderly, and rural families seeking public healthcare.

---

## 3. Primary Users

| User Persona | Operational Context | Primary Touchpoints in CAREGRID |
|---|---|---|
| **ASHA Worker** | Village home visits, immunization days, maternal checks | Mobile PWA (Offline Mode), Patient Intake, Triage Runner, Follow-Up Task Matrix. |
| **PHC Medical Officer** | Rural Primary Health Centre outpatient clinic | Desktop / Tablet OPD Queue Rail, Consultation Canvas, Referral Dispatcher, Tele-pod. |
| **Specialist Physician** | Sub-District / District Hospital | Incoming Referral Desk, Evaluation & Discharge Summary, Specialist Teleconsultation Counter-Notes. |
| **PHC Staff / Pharmacist** | PHC registration desk and pharmacy dispensing counter | Queue Token Check-in, Point-of-Care Lab Results Entry, Medicine Stock Status Manager. |
| **District Health Official**| District Health Office | Governance Dashboard, Referral Funnel Analytics, Follow-Up Adherence Matrix, Readiness Map. |
| **Rural Citizen** | Community common service center or personal mobile | Public Facility & Service Discovery, My Health Record Timeline, Welfare Scheme Guidance. |

---

## 4. Public Healthcare Problem Addressed

In rural and tribal Maharashtra, public healthcare delivery faces four structural breakdowns:
1. **The "Open-Loop" Referral Void:** When an ASHA or PHC doctor refers a critical patient (e.g. high-risk pregnancy with severe anemia) to a District Hospital, there is zero visibility into whether the patient reached the facility, received treatment, or returned home safely.
2. **Fragmented Longitudinal Records:** Patients carry paper slips that are easily damaged or lost in rural environments. Doctors at higher-tier hospitals must treat emergencies with no prior medical history.
3. **Queue Inefficiency & Triage Delay:** Traditional first-come-first-served queues in overcrowded rural OPDs force emergency cases to wait alongside routine consultations.
4. **Intermittent Connectivity Barriers:** Cloud-only commercial electronic health systems fail completely in tribal and remote talukas with zero or unstable cellular signals.

---

## 5. Stakeholder Benefits & Impact Metrics

| Stakeholder Group | Qualitative Benefit | Measurable Target Indicator (Internal Benchmark) |
|---|---|---|
| **Maternal & Child Health** | Prompt escalation of high-risk pregnancies and severe gestational anemia. | Referral completion rate $>75\%$ across tracked high-risk antenatal cases. |
| **Frontline Workers** | Transition from manual paper registers to automated task schedules with offline persistence. | Frontline home visit follow-up adherence rate $>80\%$. |
| **PHC Doctors** | Urgent cases triaged to the top of queues; counter-notes received from remote specialists. | Median queue wait time for `emergency_red` patients $<15$ minutes. |
| **Health Administrators** | Elimination of paper reporting lag; real-time detection of stock-outs (IFA, ORS). | Reporting lag reduced from 30 days (monthly paper returns) to near real-time synchronization. |

---

## 6. Operating Model

CAREGRID functions as a **public-service digital coordination infrastructure**:

```
                         CAREGRID OPERATING MODEL
                                    │
                                    ▼
                 ┌──────────────────────────────────────┐
                 │    PUBLIC HEALTH CARE CONTINUUM     │
                 │   (Sub-Center → PHC → RH → DH)       │
                 └──────────────────┬───────────────────┘
                                    │
         ┌──────────────────────────┼──────────────────────────┐
         ▼                          ▼                          ▼
  FRONTLINE DELIVERY         CLINICAL CARE             SYSTEM GOVERNANCE
  • ASHA / ANM Intake        • Priority OPD Queues     • District Telemetry
  • Offline Field Triage     • Specialist Tele-Pod     • Referral Funnels
  • Community Follow-ups     • Closed-Loop Care        • Stock Monitoring
```

- **Hosting & Infrastructure:** Cloud-hosted or State Data Centre (SDC) hosted backend API with PostgreSQL / Supabase, paired with client-side progressive web application caching.
- **Maintenance & Upgrades:** Centralized DevOps deployment for server APIs; client PWA updates transparently via service worker caching upon network connection.
- **Frontline Usability:** Fully functional offline on standard Android devices (Android 9.0+) without dedicated hardware purchases.

---

## 7. Adoption & Capacity-Building Model

To overcome low digital literacy and field operational friction:
1. **Master Trainer "Cascade" Approach:**
   - District ASHA Coordinators and Block Community Mobilizers (BCMs) undergo intensive train-the-trainer workshops.
   - BCMs train primary PHC ANMs and village ASHAs during existing monthly sectoral review meetings.
2. **Incentive Alignment:**
   - Tasks are structured to align directly with existing National Health Mission (NHM) ASHA incentive reporting indicators (e.g. institutional delivery tracking, antenatal checkup completion).
3. **Low-Friction Trilingual Interface:**
   - Universal Marathi (`मराठी`) and Hindi (`हिंदी`) translations ensure workers operate in their native working language with audio/icon-guided cues.
4. **Peer Support Network:**
   - PHC-level data entry operators provide on-site assistance for workers encountering hardware or synchronization issues.

---

## 8. Sustainability & Digital Public Good (DPG) Model

1. **Non-Commercial Open Core:**
   - Platform core architecture is built using open-source, non-proprietary frameworks (Next.js, TypeScript, PostgreSQL, Tailwind CSS, Dexie.js).
   - Prevents vendor lock-in for the state government.
2. **Data Sovereignty:**
   - 100% of patient data, clinical records, and administrative telemetry reside within sovereign Government of Maharashtra / State Data Centre infrastructure.
   - Strictly prohibited from commercial licensing, advertising, or third-party monetization.
3. **Long-Term Maintainability:**
   - Low compute overhead; lightweight REST endpoints; minimal server load due to edge client processing of triage logic.

---

## 9. Proposed Deployment & Phasing Model

*(Note: All rollout phases below represent proposed technical execution stages, not confirmed government deployment commitments.)*

```
                           PROPOSED ROLLOUT PHASES
                                      │
     ┌────────────────────────────────┼────────────────────────────────┐
     ▼                                ▼                                ▼
  PHASE 1: PILOT PROOF          PHASE 2: TALUKA CLUSTER          PHASE 3: DISTRICT EXPANSION
  (Proposed 1-2 Talukas)        (Proposed 3-5 Talukas)           (Proposed State Scale-up)
  • 5 Facilities                • 25 Facilities                  • 100+ Facilities
  • 100 ASHA Workers            • 500 ASHA Workers               • Full District Integration
  • Closed-loop referral focus  • Teleconsultation pod scale     • Cross-district referrals
  • Initial offline validation  • Stock availability tracking    • Administrative automation
```

1. **Proposed Phase 1 (Pilot Proof-of-Concept):** Deployment in 1 high-priority rural/tribal taluka to validate offline sync resilience, ASHA task completion, and closed-loop referral acknowledgement.
2. **Proposed Phase 2 (Taluka Cluster Scale):** Expansion across a cluster of 3–5 talukas to test cross-facility referrals between PHCs, Rural Hospitals, and Sub-District Hospitals.
3. **Proposed Phase 3 (District-Wide Full Scale):** State-level integration covering all public health tiers within participating districts.

---

## 10. Potential Funding & Procurement Pathways

As a public digital health solution, CAREGRID can be funded and procured through established public healthcare financing mechanisms:

| Funding / Procurement Channel | Mechanism & Nature | Current Status in CAREGRID |
|---|---|---|
| **NHM Program Implementation Plan (PIP)** | State-level annual budget proposal under National Health Mission Innovation & Digital Health line items. | *Proposed Future Channel* (Requires official departmental sponsorship). |
| **State Health Innovation Grants** | Government of Maharashtra public health technology innovation funds or smart governance initiatives. | *Proposed Exploration Pathway*. |
| **Corporate Social Responsibility (CSR)** | Healthcare CSR grants from public sector undertakings (PSUs) or institutional health foundations to fund pilot tablets and ASHA training. | *Potential Pilot Support Channel*. |
| **National Smart India Hackathon (SIH) Incubation** | Post-hackathon institutional validation, prototype mentorship, and departmental pilot sponsorship. | *Active Engagement Stage (SIH26133)*. |

---

## 11. Government & Institutional Ecosystem Alignment

CAREGRID is architected to operate synergistically alongside existing public healthcare digital initiatives without duplicating infrastructure:

1. **Ayushman Bharat Digital Mission (ABDM) Direction:**
   - Architectural alignment with ABDM guidelines; patient identifiers utilize neutral schemas (`CARE-MH-YYYY-XXXX`) designed for future interoperability once sandbox accreditation is formally initiated.
2. **eSanjeevani Teleconsultation Co-existence:**
   - Teleconsultation pod notes in CAREGRID capture referral-linked specialist guidance, acting as an operational bridge between community triage and tele-specialists.
3. **State Health Resource Center (SHRC) & NHM Maharashtra:**
   - Collaboration pathway for validating triage protocol thresholds against approved Maharashtra maternal and child health guidelines.

---

## 12. Technology & Operating Cost Categories

Because CAREGRID is a public-sector digital platform, operational costs are structured around **predictable infrastructure and capacity-building drivers** rather than per-user SaaS licenses:

```
                            COST ARCHITECTURE
┌──────────────────────────────────────┬──────────────────────────────────────┐
│ FIXED / INFRASTRUCTURE DRIVERS       │ VARIABLE / OPERATIONAL DRIVERS       │
├──────────────────────────────────────┼──────────────────────────────────────┤
│ • Cloud Hosting / State Data Centre  │ • ASHA / ANM Training & Workshops    │
│ • Database & Storage (PostgreSQL)    │ • Master Trainer Capacity Building   │
│ • TLS / Security & Domain Gateways   │ • Field Pilot Support & Troubleshooting│
│ • WebRTC Signaling & Telemetry Infra │ • SMS / Push Notification Gateways   │
│ • Codebase Maintenance & Bug Fixes   │ • Hardware Maintenance (Existing Tabs)│
└──────────────────────────────────────┴──────────────────────────────────────┘
```

1. **Core Compute & Cloud Hosting:** Highly cost-effective due to lightweight Next.js edge-rendering and client-side IndexedDB caching.
2. **SMS & Alert Gateways:** Transactional SMS notifications utilizing Government C-DAC or National Informatics Centre (NIC) SMS gateways for public service messaging.
3. **Frontline Hardware:** Zero incremental hardware costs; designed to run on existing government-issued Android tablets and personal smartphones.

---

## 13. Scalability Model

1. **Horizontal Backend Scaling:** Stateless REST API containers deployed behind load balancers; database scales via read-replicas for administrative analytics.
2. **Client-Side Edge Offloading:** Triage logic runs locally on client devices via TypeScript rule execution, ensuring zero compute bottleneck on the server even during peak morning OPD check-in hours.
3. **Database Partitioning Strategy:** Relational schema supports horizontal partitioning by `district` and `facility_id` as the system expands across Maharashtra's 36 districts.

---

## 14. Risks & Mitigation Constraints

| Identified Risk | Risk Severity | Operational Mitigation Strategy |
|---|---|---|
| **Intermittent Rural Connectivity** | High | True offline-first PWA architecture with Dexie.js; local mutation queues; optimistic UI updates; automatic synchronization upon 2G/3G/4G/Wi-Fi reconnection. |
| **Worker Attrition & Literacy Barriers** | Medium | Universal Marathi UI, visual icons, audio-visual prompts, and simplified 1-tap workflows; continuous training integrated into monthly ASHA meetings. |
| **Clinical Liability Concerns** | High | Non-diagnostic architecture; zero autonomous prescriptions; mandatory human review; explicit disclaimers on every triage recommendation. |
| **Data Privacy & Leakage** | High | PostgreSQL Row Level Security (RLS); minimum necessary health data collection; zero real PII in test environments; strict DISHA/DPDP alignment. |
| **Referral Non-Compliance (Patient Drop-off)** | Medium | Automated follow-up task assignment to originating village ASHA ensures community tracking and home visits post-referral. |

---

## 15. Business Model Canvas (Public Healthcare Edition)

```
┌──────────────────┬──────────────────┬──────────────────┬──────────────────┬──────────────────┐
│ KEY PARTNERS     │ KEY ACTIVITIES   │ VALUE            │ BENEFICIARY      │ BENEFICIARY      │
│                  │                  │ PROPOSITION      │ RELATIONSHIPS    │ SEGMENTS         │
│ • Maharashtra    │ • Offline Triage │ • Closed-Loop    │ • Institutional  │ • Rural Citizens │
│   Public Health  │   Execution      │   Care Continuum │   Public Trust   │   & Patients     │
│   Department     │ • Referral Sync  │ • Fast-tracked   │ • Frontline ASHA │ • Frontline ASHA │
│ • National       │   & Routing      │   Urgent OPD     │   Community      │   & ANM Workers  │
│   Health Mission │ • Automated      │   Queues         │   Engagement     │ • PHC Medical    │
│ • District       │   Follow-Up Tasks│ • Zero-Loss      │ • In-person      │   Officers & MOs │
│   Health Offices │ • Stock Status   │   Referral Care  │   Clinical Care  │ • District Health│
│ • Primary Health │   Monitoring     │ • Complete Field │                  │   Administrators │
│   Centres (PHCs) ├──────────────────┤   Offline PWA    ├──────────────────┤                  │
│ • Common Service │ KEY RESOURCES    │ • Trilingual     │ CHANNELS         │                  │
│   Centres (CSCs) │ • Open Core      │   Accessibility  │ • Frontline PWA  │                  │
│                  │   Software       │   (MR / HI / EN) │ • PHC Desktops   │                  │
│                  │ • Frontline ASHA │                  │ • Kiosk Displays │                  │
│                  │   Cadre Network  │                  │ • SMS Reminders  │                  │
│                  │ • Cloud / SDC    │                  │ • CSC Centers    │                  │
│                  │   Infrastructure │                  │                  │                  │
├──────────────────┴──────────────────┼──────────────────┴──────────────────┴──────────────────┤
│ COST STRUCTURE                      │ REVENUE / SUSTAINABILITY STREAMS (PUBLIC GOODS)        │
│ • Cloud Compute & PostgreSQL Hosting│ • National Health Mission (NHM) Innovation Pipeline     │
│ • ASHA Training & Capacity Building │ • State Public Health Department Annual Budget Lines   │
│ • SMS Gateway Transaction Delivery  │ • Institutional Healthcare Grants & CSR Pilot Funds    │
│ • Technical Maintenance & DevOps    │ • Zero Cost to Citizens; Zero Monetization of Data     │
└─────────────────────────────────────┴────────────────────────────────────────────────────────┘
```
