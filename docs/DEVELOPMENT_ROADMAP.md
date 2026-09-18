# CAREGRID: Phased Development Roadmap (SIH26133 - Revised MVP)

> **SIH Problem Statement**: SIH26133 — Accessibility & Quality of Public Healthcare in Rural/Underserved Areas  
> **Jurisdiction**: Government of Maharashtra (Public Health Department / Arogya Vibhag)  
> **Team**: The Glitch Gang (Team ID: 129855)  

---

## 1. Focused MVP Scope & Principles

In strict alignment with the problem statement and practical rural healthcare realities in Maharashtra, the CAREGRID MVP is focused directly on the **9-stage care coordination pipeline**:

```
[1. Citizen / Patient Intake]
          │
          ▼
[2. ASHA / ANM Community Field Workflow]  <--- (Offline-First / Low-Connectivity)
          │
          ▼
[3. Primary Care Facility (Sub-Centre / PHC / CHC / Rural Hospital)]
          │
          ▼
[4. AI-Assisted Triage & Priority Support]  <--- (Non-Diagnostic Decision Assist)
          │
          ▼
[5. Appointment / Queue / Teleconsultation Coordination]
          │
          ▼
[6. Closed-Loop Referral Tracking]  <--- (Inter-Facility Transfer & Back-Referral)
          │
          ▼
[7. Diagnostics / Medicines / Services Availability]
          │
          ▼
[8. Follow-Up & Continuity of Care]  <--- (ASHA Home Visit Reminders)
          │
          ▼
[9. Facility & Government Administrative Visibility]
```

### 🚫 Explicit Scope Boundaries for MVP:
- **NO 108 ambulance fleet tracking/dispatch** (referral status tracks transfer lifecycle without managing external fleet telematics).
- **NO epidemiological disease outbreak prediction models** (focus is on patient care coordination, not statistical epidemic modeling).
- **NO real-time hospital inpatient bed tracking** (facilities publish static/periodic service and specialty availability, not live bed census).
- **NO complex e-prescription formulary** (doctors record clinical notes, required diagnostic tests, and advised medicines as part of standard encounter records).
- **NO water-quality, water-sensor, or legacy JalRakshak functionality**.
- **AI assists healthcare workers and doctors; it does NOT diagnose or replace doctors**.

---

## 2. The 11 Core MVP Deliverables

| Priority | Feature Module | Core Functionality |
| :---: | :--- | :--- |
| **1** | **Citizen / Patient Intake** | Patient registration (ABHA-ready), demographic capture, vulnerability tags (pregnancy, age, chronic illness). |
| **2** | **ASHA / ANM Field Workflow** | Mobile-first household screening, vitals recording, and task management for village health workers. |
| **3** | **AI-Assisted Triage & Priority Support** | Standardized urgency classification (`emergency_red`, `urgent_amber`, `routine_green`), vital anomaly alerts, and red-flag danger sign detection. **Strictly non-diagnostic.** |
| **4** | **Facility & Service Discovery** | Geo-located directory of Sub-Centres, PHCs, CHCs, and District Hospitals showing services, functional specialties, and operating hours. |
| **5** | **Appointment / Queue / Teleconsultation** | Urgency-sorted digital OPD queue tokens, walk-in registration, and rural teleconsultation room links between PHCs and specialists. |
| **6** | **Closed-Loop Referral Tracking** | Structured transfer generation from Sub-Centre/PHC to higher facility, arrival acknowledgment, and post-discharge counter-referral back to village ASHA. |
| **7** | **Basic Longitudinal Health Record** | Unified patient chronological timeline showing previous encounters, vitals trends, danger-sign history, and referral records. |
| **8** | **Follow-up & Continuity of Care** | Automated scheduled follow-up tasks for ASHAs (post-referral checks, high-risk pregnancy visits, routine check-ins). |
| **9** | **Multilingual Support** | Complete vernacular accessibility in **Marathi (मराठी)**, **Hindi (हिंदी)**, and **English**. |
| **10** | **Low-Connectivity / Offline-First Engine** | Client-side IndexedDB persistence, background sync queue, and conflict-free submission for field workers in zero-reception areas. |
| **11** | **Facility & Government Dashboard** | Aggregated operational metrics: taluka-wise referral completion rates, triage urgency distribution, ASHA follow-up compliance, and facility service utilization. |

---

## 3. Revised Phased Implementation Plan

```mermaid
flowchart TD
    subgraph Phase1["Phase 1: Architecture & Foundations (Current)"]
        P1A[Verified Scoped Documentation & Schemas]
        P1B[FastAPI AI Triage Microservice - Non-Diagnostic]
        P1C[Supabase DB Migrations & Scoped RLS]
    end

    subgraph Phase2["Phase 2: Core Patient & Offline ASHA Workflow"]
        P2A[Client-Side IndexedDB & Offline Sync Manager]
        P2B[ASHA Mobile Intake & Vitals Recording UI]
        P2C[Local Pre-Triage Urgency Flags & Offline Storage]
    end

    subgraph Phase3["Phase 3: PHC Clinic, Queue & Teleconsultation"]
        P3A[Facility Service Directory & Discovery View]
        P3B[Triage-Prioritized OPD Queue & Token System]
        P3C[Doctor Clinical Encounter Workspace & Teleconsult Link]
    end

    subgraph Phase4["Phase 4: Closed-Loop Referral & Continuity of Care"]
        P4A[Inter-Facility Referral Generator with Urgency Tier]
        P4B[Receiving Facility Acknowledgment & Clinical Handover]
        P4C[Discharge Counter-Referral & ASHA Follow-up Reminders]
    end

    subgraph Phase5["Phase 5: Longitudinal Records & Administrative Visibility"]
        P5A[Unified Citizen Longitudinal Health Record View]
        P5B[Taluka & District Facility Administrative Dashboard]
        P5C[Multilingual Audit (Marathi/Hindi/En) & Verification]
    end

    Phase1 --> Phase2
    Phase2 --> Phase3
    Phase3 --> Phase4
    Phase4 --> Phase5
```

---

## 4. Detailed Sprint Breakdown

### Milestone 1: Foundations & Architecture Baseline (Complete)
- [x] Streamlined architecture and database design omitting unneeded external dependencies (ambulances, bed trackers, outbreak models).
- [x] AI Microservice with deterministic, non-diagnostic urgency scoring and danger-sign detection.
- [x] Supabase PostgreSQL migrations with scoped tables and role-based policies.

### Milestone 2: Patient Intake & Offline-First ASHA Experience
- [ ] Mobile-optimized PWA intake form for ASHAs to register citizens and record vitals.
- [ ] IndexedDB persistence using `Dexie.js` for 100% offline functionality in remote hamlets.
- [ ] Resilient background sync manager with retry logic and idempotency protection.
- [ ] Immediate client-side warning flags for severe vitals anomalies.

### Milestone 3: Facility Discovery & Digital OPD Queue
- [ ] Public facility and service directory (searchable by taluka, district, services available).
- [ ] Digital OPD Queue at PHC level that sorts waiting patients by clinical urgency (`emergency_red` > `urgent_amber` > `routine_green`) rather than pure time of arrival.
- [ ] Medical Officer consultation view with basic notes and diagnostic service orders.
- [ ] Rural teleconsultation session initiation linking PHC to specialist.

### Milestone 4: Closed-Loop Referral & Follow-up Reminders
- [ ] Structured digital referral creation from PHC to CHC / Sub-District Hospital / District Hospital.
- [ ] Receiving hospital triage view with referral intake acknowledgment.
- [ ] Counter-referral discharge summary dispatched to originating PHC.
- [ ] Automated follow-up task generation assigned to village ASHA for home monitoring.

### Milestone 5: Longitudinal Timeline & Administrative Visibility
- [ ] Patient-facing and provider-facing longitudinal health record timeline.
- [ ] Facility and District Health Officer operational dashboard (referral loop closure rate, triage distribution, ASHA visit compliance).
- [ ] Vernacular language verification (full Marathi localization).
