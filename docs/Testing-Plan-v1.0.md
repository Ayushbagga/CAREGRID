# CAREGRID Testing Plan v1.0

**Document Reference:** CAREGRID-DOC-TEST-V1.0  
**Problem Statement:** SIH26133 — Accessibility & Quality of Public Healthcare in Rural/Underserved Areas  
**Target Beneficiary:** Government of Maharashtra (Public Health Department)  
**Status:** Approved Quality Assurance & Verification Specification  
**Companion Documents:**  
- [`docs/PRD-v1.0.md`](./PRD-v1.0.md) (Product Requirements Document v1.0)  
- [`docs/TRD-v1.0.md`](./TRD-v1.0.md) (Technical Requirements Document v1.0)  
- [`docs/Backend-Schema-v1.0.md`](./Backend-Schema-v1.0.md) (Backend Database Schema v1.0)  
- [`docs/API-Contract-v1.0.md`](./API-Contract-v1.0.md) (API Contract v1.0)  
- [`docs/Security-Privacy-v1.0.md`](./Security-Privacy-v1.0.md) (Security & Privacy Specification v1.0)  
- [`docs/AI-ML-Specification-v1.0.md`](./AI-ML-Specification-v1.0.md) (AI/ML Specification v1.0)  
- [`docs/UI-UX-Design-v1.0.md`](./UI-UX-Design-v1.0.md) (UI/UX Design Specification v1.0)  
- [`docs/Business-Model-v1.0.md`](./Business-Model-v1.0.md) (Business Model v1.0)  

---

> [!IMPORTANT]
> **Testing Scope & Safety Rules:**
> 1. **Synthetic Data Mandate:** 100% of test fixtures, mock records, and automated test scenarios utilize synthetic dummy data. Real patient records, real ASHA identities, and active hospital PII are strictly prohibited.
> 2. **SIH26133 Boundary Verification:** Automated test suites continuously assert the absence of water sensor data, outbreak prediction models, ambulance fleet GPS dispatchers, hospital bed management, autonomous diagnoses, and automated drug prescriptions.
> 3. **Clear Distinction of Automated vs Manual:** Every section explicitly differentiates between automated continuous integration (CI) tests and manual field User Acceptance Testing (UAT).

---

## 1. Unit Testing Strategy

### 1.1 Scope & Test Framework
- **Test Runner:** Node.js native test runner (`node --test`), Vitest / Jest equivalent.
- **Coverage Target:** Minimum **85% statement coverage** across all utility, validation, and domain calculation functions.

### 1.2 Core Test Modules (Automated)
1. **Clinical Triage Rule Engine (`frontend/src/lib/triage-engine.ts`):**
   - Vitals evaluation logic: Systolic BP, Diastolic BP, Pulse, SpO2, Respiratory rate, Temperature.
   - Point-of-care Hemoglobin thresholds: Verifies Hb < 8.0 g/dL in 3rd trimester triggers `urgent_amber` or `emergency_red`.
   - Red-flag symptom matching and priority score computation (1, 2, 3).
2. **Identifier Formatter & Validator:**
   - Validates neutral Maharashtra Care ID format: `^CARE-MH-\d{4}-[A-Z0-9]{4}$` (e.g. `CARE-MH-2026-A8F2`).
   - Validates state referral code format: `^REF-MH-[A-Z]{3}-\d{4}$` (e.g. `REF-MH-GAD-7821`).
3. **Queue Sorting Comparator:**
   - Evaluates ordering comparator: `(a.priority_level - b.priority_level) || (a.queue_number - b.queue_number)`.
   - Confirms `emergency_red` always precedes `urgent_amber` and `routine_green`.
4. **Follow-Up Schedule Calculator:**
   - Calculates target due dates from discharge date: `due_date = discharge_date + due_days`.
   - Categorizes tasks into `overdue` (due < today), `due_today` (due == today), and `upcoming` (due > today).

---

## 2. Integration Testing

### 2.1 Scope & Boundaries
Validates end-to-end data flow between interconnected client and server modules without external third-party dependencies.

### 2.2 Integration Test Suites (Automated)
1. **Intake-to-Triage-to-Referral Flow:**
   - Generates synthetic patient intake $\rightarrow$ runs triage runner $\rightarrow$ generates outgoing referral payload with urgency tier and specialty matching.
2. **Referral-to-Follow-Up Trigger Flow:**
   - Transitions referral status: `initiated` $\rightarrow$ `acknowledged` $\rightarrow$ `evaluated` $\rightarrow$ `completed`.
   - Asserts that completing a referral automatically instantiates a linked `follow_ups` task assigned to the originating ASHA worker.
3. **Queue-to-Consultation Handoff:**
   - Issues queue token $\rightarrow$ changes state to `in_consultation` $\rightarrow$ initializes teleconsultation session with patient vitals pre-populated.

---

## 3. API Contract Testing

### 3.1 Scope & Standards
Validates strict adherence to [`docs/API-Contract-v1.0.md`](./API-Contract-v1.0.md) across all 18 functional domains.

### 3.2 Key Automated Checks
1. **Schema & Envelope Compliance:**
   - Asserts all 200/201 responses wrap payloads in `{ success: true, data: { ... }, metadata: { ... } }`.
   - Asserts all 4xx/5xx responses return `{ success: false, error: { code, message, timestamp } }`.
2. **Idempotency Enforcement:**
   - Submits identical `Idempotency-Key` or `client_event_id` twice.
   - Asserts second request returns cached response with HTTP 200 and zero duplicate database rows created.
3. **Payload Sanitization & Boundary Rejection:**
   - Submits negative blood pressure or SpO2 > 100%; asserts `400 VALIDATION_ERROR`.
   - Attempts to complete unacknowledged referral; asserts `422 BUSINESS_RULE_VIOLATION`.

---

## 4. Browser End-to-End (E2E) Testing

### 4.1 Scope & Tooling
- **Test Runner:** Playwright / Chromium headless browser automation.
- **Environment:** Local production build (`npm run build && npm start`) on port 3000.

### 4.2 Core E2E Scenarios (Automated)
| Scenario ID | User Persona | User Flow | Pass Criteria |
|---|---|---|---|
| `E2E-01` | Citizen | Homepage $\rightarrow$ Facility Discovery $\rightarrow$ Filter by District $\rightarrow$ View Services. | Facilities list updates dynamically; contact phone button clickable. |
| `E2E-02` | Citizen | Homepage $\rightarrow$ My Health Timeline $\rightarrow$ Input Demo ID `CARE-MH-2026-A8F2`. | Chronological timeline renders with correct event badges. |
| `E2E-03` | ASHA Worker | Field Mode $\rightarrow$ Register Patient $\rightarrow$ Input Vitals (Hb 7.8) $\rightarrow$ Run Triage. | `urgent_amber` badge displays; disclaimer checkbox interactive. |
| `E2E-04` | Doctor | Doctor OPD Workspace $\rightarrow$ Live Queue Rail $\rightarrow$ Call Patient. | Priority 1 (`emergency_red`) displayed at top; status changes to `in_consultation`. |
| `E2E-05` | Specialist | Referral Desk $\rightarrow$ Incoming Tab $\rightarrow$ Acknowledge $\rightarrow$ Complete Discharge. | Closed-loop status advances; ASHA follow-up task verified in database. |
| `E2E-06` | Administrator | Governance Dashboard $\rightarrow$ Toggle District Filter $\rightarrow$ View Funnel. | Aggregate charts update without exposing individual patient PII. |

---

## 5. Offline-First & Online Recovery Testing

### 5.1 Failure & Recovery Matrix (Automated & Manual)

```
                       OFFLINE-ONLINE RECOVERY FLOW
┌──────────────────────┐      Network Cut      ┌──────────────────────┐
│     ONLINE STATE     │ ────────────────────► │    OFFLINE STATE     │
│  🟢 Sync Pill Active │                       │  🟡 Offline Pill (N) │
│  Direct API updates  │                       │  Dexie.js Local Save │
└──────────────────────┘                       └──────────────────────┘
           ▲                                               │
           │           Network Restored                    │
           └───────────────────────────────────────────────┘
                     Auto-Flushes Mutation Queue
                     Deterministic Idempotency Key
```

1. **Simulated Network Interruption (Automated):**
   - Disconnect network (`page.setOffline(true)`) during patient intake.
   - Fill form and click "Save & Triage".
   - **Verification:** Form saves locally to Dexie IndexedDB; header updates to `🟡 Offline Mode (1 unsynced)`; zero data loss.
2. **Reconnection Auto-Flush (Automated):**
   - Restore network (`page.setOffline(false)`).
   - Trigger sync or wait for background reconciliation.
   - **Verification:** Mutation batch pushed to `/sync/push`; header updates to `🟢 Online`; server database contains record.
3. **Mid-Flight Drop Failure (Manual Recovery Test):**
   - Sever Wi-Fi during mid-stream sync payload transmission.
   - **Verification:** Client retries using exponential backoff; no duplicate records created on server due to unique `(user_id, client_event_id)` constraint.

---

## 6. Sync Conflict Resolution Testing

1. **Optimistic Locking Conflict (Automated):**
   - Seed record at `sync_version = 1`.
   - Client A updates offline (targeting `sync_version = 1`).
   - Server receives an update from Client B updating record to `sync_version = 2`.
   - Client A reconnects and submits update.
   - **Verification:** Server detects version mismatch; applies server-latest state; returns conflict notice; logs event in `audit_logs`.
2. **Side-by-Side Conflict UI (Manual UAT):**
   - Verify that worker receives a clear side-by-side prompt allowing them to keep server data while preserving their local entry as an offline note.

---

## 7. Multilingual Testing (Trilingual Parity)

### 7.1 Automated Key Parity Verification
- **Automated Script:** `node frontend/scripts/test-sprint5.mjs` (Verifies 100% parity across English, Hindi, and Marathi).
- **Rule:** Every localization key defined in English must exist in Marathi (`mr.json`) and Hindi (`hi.json`).
- **Pass Metric:** 266 / 266 keys identical across all 3 languages (0 missing, 0 untranslated placeholders).

### 7.2 Manual Visual Typography & Overflow Testing
- **Visual Inspection:**
  - Verify Marathi text does not clip or overflow card boundaries.
  - Verify Devanagari vowel signs (matras: उ, ऊ, ौ) have sufficient vertical clearance (`line-height` +2px to +4px).
  - Verify language switcher in top-right navbar updates all page headings and navigation labels instantly without requiring page reload.

---

## 8. Accessibility Testing (WCAG 2.1 Level AA)

### 8.1 Automated Accessibility Audits
- **Tooling:** Lighthouse Accessibility Audit, `axe-core`.
- **Pass Threshold:** Minimum **Lighthouse Accessibility Score: 95/100**.

### 8.2 Manual Verification Checklist
1. **Touch Target Sizing:** Every button, input field, and language switch measured $\ge 48 \times 48\text{ px}$.
2. **Color-Blind Redundancy:** Triage urgency tiers verified with geometric icons:
   - `emergency_red`: Octagon icon + Red color + text "EMERGENCY".
   - `urgent_amber`: Triangle icon + Amber color + text "URGENT".
   - `routine_green`: Square icon + Green color + text "ROUTINE".
3. **Color Contrast:** All body text verified $\ge 4.5:1$ against card surfaces using WebAIM contrast checker.
4. **Screen Reader Usability:** ARIA live regions tested on live queue updates (`aria-live="polite"`).

---

## 9. RBAC & Security Testing

### 9.1 Automated Security Verification
1. **Unauthorized Access Rejection:**
   - Submit request to `/referrals/{id}/acknowledge` with `asha_anm` role token.
   - **Verification:** Rejects with `403 FORBIDDEN`.
2. **PostgreSQL RLS Boundary Isolation:**
   - ASHA in Aheri taluka queries `/patients`.
   - **Verification:** Only patients residing in assigned village are returned; patients from other talukas are invisible.
3. **Administrative Privacy Barrier:**
   - `admin_governance` token requests `/patients/e000...`.
   - **Verification:** Rejects with `403 FORBIDDEN`. Administrative roles cannot query individual patient PII.
4. **Audit Log Immutability:**
   - Attempt `UPDATE` or `DELETE` on `audit_logs` table.
   - **Verification:** Database trigger aborts transaction with `CAREGRID Security Violation`.

### 9.2 Secrets & Repository Hygiene
- Execute `git log -p | grep -E "AKIA|PRIVATE KEY|password|supabase_secret"`.
- **Verification:** Zero matches. All secrets injected via `.env` (gitignored).

---

## 10. AI Safety & Non-Diagnostic Testing

### 10.1 Prohibited Output Keyword Scanning (Automated)
Automated test scans all triage and consultation API outputs against a blacklist of unauthorized clinical actions:
- **Prescription Drugs:** `Amoxicillin`, `Ciprofloxacin`, `Metformin`, `Paracetamol 500mg`, `Atorvastatin`.
- **Standalone Diagnoses:** `Confirmed Tuberculosis`, `Stage 2 Hypertension`, `Carcinoma`, `Pneumonia Diagnosis`.
- **Pass Criterion:** Zero matches across 500+ generated triage scenarios.

### 10.2 Disclaimer & Human-Review Verification (Automated)
- Every response from `/triage/assess` must include:
  - `"non_diagnostic_disclaimer"` string present.
  - `"human_review_required": true`.
- Forms prevent referral submission if human review acknowledgement checkbox is unchecked.

---

## 11. Performance Testing

| Performance Parameter | Measurement Method | Target SLA |
|---|---|---|
| **Largest Contentful Paint (LCP)** | Lighthouse performance run on mobile profile | $\le 2.5\text{ seconds}$ |
| **First Input Delay (FID) / INP** | Chrome DevTools performance recording | $\le 100\text{ ms}$ |
| **Cumulative Layout Shift (CLS)** | DevTools layout shift tracking | $\le 0.1$ |
| **Offline IndexedDB Query Latency** | Console execution time for 1,000 cached records | $\le 50\text{ ms}$ |
| **2G/3G Low-Bandwidth Simulation** | Network throttling to 250 kbps / 300ms RTT | Core triage runner interactive within 3 seconds |
| **Client Bundle Size** | Production build chunk analysis (`npm run build`) | Total initial JS bundle $\le 300\text{ KB}$ (gzipped) |

---

## 12. Mobile & PWA Testing

1. **Service Worker Lifecycle:**
   - Unregister and re-register service worker; verify static asset pre-caching (`index.html`, CSS, JS bundles).
2. **Standalone Display Mode:**
   - Test on Android Chrome via "Add to Home Screen"; verify browser address bar hides and app renders in full-screen standalone frame.
3. **Storage Quota Depletion Simulation:**
   - Inject dummy IndexedDB data until storage threshold reaches 90%; verify system renders non-blocking warning notification to worker.

---

## 13. Data Integrity Testing

1. **Neutral Identifier Format:** All newly registered patients receive verified `CARE-MH-YYYY-XXXX` identifiers.
2. **Referral Code Format:** All newly initiated referrals receive verified `REF-MH-[DIST]-[NUM/HEX]` codes.
3. **Cascade Deletion Prohibition:** Hard deletes on clinical tables are strictly blocked; soft deletes verify `is_deleted = TRUE` with data preservation.

---

## 14. Regression Testing Framework

Continuous regression is enforced across all sprints via the automated verification scripts:
- **Sprint 2 Suite (`test-sprint2.mjs`):** Patient intake, vital ranges, triage rule base.
- **Sprint 3 Suite (`test-sprint3.mjs`):** Priority OPD queue sorting, facility discovery, teleconsult notes.
- **Sprint 4 Suite (`test-sprint4.mjs`):** Closed-loop referral lifecycle, longitudinal health timeline, follow-up categorization.
- **Sprint 5 Suite (`test-sprint5.mjs`):** Trilingual parity (266 keys), admin governance KPIs, telemetry anonymization.
- **Current Baseline:** **128 / 128 tests passing (100% success rate)**.

---

## 15. Demo & User Acceptance Testing (UAT)

### 15.1 Hackathon Evaluator Walkthrough Checklist
A structured 6-step manual testing protocol for evaluators:

- [ ] **Step 1: Frontline Field Intake (ASHA Persona):**
  - Navigate to ASHA workspace.
  - Fill intake form for pregnant patient with severe dizziness; enter Hb = `7.8 g/dL`.
  - Verify `urgent_amber` recommendation with NHM protocol explainability.
  - Check non-diagnostic disclaimer box.
- [ ] **Step 2: Closed-Loop Referral Creation:**
  - Create referral to District Hospital for Obstetric evaluation.
  - Verify tracking code generated (`REF-MH-...`).
- [ ] **Step 3: Hospital Specialist Acknowledgement & Evaluation:**
  - Switch to Doctor Persona.
  - View incoming referral; click "Acknowledge Receipt" (status becomes `acknowledged`).
  - Input specialist notes and discharge advice (Hb raised to 9.2 g/dL).
  - Click "Complete Referral".
- [ ] **Step 4: Automated Follow-Up Task Verification:**
  - Switch back to ASHA Persona.
  - Open "Follow-Up Tasks" $\rightarrow$ verify newly generated "Post-Referral Check" task in "Due Today" tab.
  - Click "Complete Task" and input home visit observations.
- [ ] **Step 5: Longitudinal Timeline Inspection (Citizen Persona):**
  - Navigate to Citizen portal $\rightarrow$ input patient ID.
  - Verify all events (Intake $\rightarrow$ Triage $\rightarrow$ Referral $\rightarrow$ Evaluation $\rightarrow$ Follow-up) appear in strict chronological order.
- [ ] **Step 6: District Governance Dashboard:**
  - Switch to Administrator Persona.
  - Confirm referral volume, closed-loop completion rate, and follow-up adherence increment in real time with zero patient PII exposure.

---

## 16. Acceptance Criteria & Release Checklist

Before any production or evaluation release, the release engineer must sign off on the following:

```
                          RELEASE SIGN-OFF CHECKLIST
┌───┬─────────────────────────────────────────────────────────────┬──────────┐
│ # │ Verification Item                                           │ Status   │
├───┼─────────────────────────────────────────────────────────────┼──────────┤
│ 1 │ TypeScript compilation clean (`npm run build` zero errors)  │ [x] PASS │
│ 2 │ Automated sprint regression test suite (128/128 passed)     │ [x] PASS │
│ 3 │ Trilingual parity verified (266 keys across EN, HI, MR)     │ [x] PASS │
│ 4 │ SIH26133 scope audit: Zero water, outbreak, bed, ambulance  │ [x] PASS │
│ 5 │ AI safety audit: Zero prescriptions, zero auto-diagnoses    │ [x] PASS │
│ 6 │ Disclaimer audit: Non-diagnostic disclaimer on all triage   │ [x] PASS │
│ 7 │ Security audit: Zero secrets in git, .gitignore verified    │ [x] PASS │
│ 8 │ Data privacy audit: 100% synthetic test data only           │ [x] PASS │
│ 9 │ Offline PWA audit: Offline intake and sync tested           │ [x] PASS │
│ 10│ Git working directory clean                                 │ [x] PASS │
└───┴─────────────────────────────────────────────────────────────┴──────────┘
```
