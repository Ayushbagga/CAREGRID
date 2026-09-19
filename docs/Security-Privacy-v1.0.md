# CAREGRID Security & Privacy Specification v1.0

**Document Reference:** CAREGRID-DOC-SEC-V1.0  
**Problem Statement:** SIH26133 — Accessibility & Quality of Public Healthcare in Rural/Underserved Areas  
**Target Beneficiary:** Government of Maharashtra (Public Health Department)  
**Status:** Approved Technical Architecture  
**Companion Documents:**  
- [`docs/PRD-v1.0.md`](./PRD-v1.0.md) (Product Requirements Document v1.0)  
- [`docs/TRD-v1.0.md`](./TRD-v1.0.md) (Technical Requirements Document v1.0)  
- [`docs/Backend-Schema-v1.0.md`](./Backend-Schema-v1.0.md) (Backend Database Schema v1.0)  
- [`docs/API-Contract-v1.0.md`](./API-Contract-v1.0.md) (API Contract v1.0)  

---

## 1. Executive Summary & Security Philosophy

CAREGRID is engineered specifically for frontline rural healthcare delivery across Maharashtra's public health infrastructure (Sub-Centers, PHCs, Rural Hospitals, and District Hospitals). Because the platform manages sensitive clinical encounters, maternal health indicators, and community health worker tasks in intermittently connected and low-bandwidth rural environments, the security architecture balances **uncompromising patient data confidentiality** with **frontline operational resilience**.

### Core Guiding Principles:
1. **Zero Trust & Least Privilege:** No actor, device, or network zone is inherently trusted. Permissions are strictly scoped to the user's operational role and administrative jurisdiction (Village, Sub-Center, PHC, or District).
2. **Data Minimization (Minimum Necessary Standard):** Only data points strictly necessary for clinical routing, triage, referral continuity, and follow-up adherence are collected. Superfluous biometric, genetic, or commercial financial data is prohibited.
3. **Defense in Depth:** Security controls exist at the transport layer (TLS 1.3), application gateway (JWT authentication, rate limiting), database layer (PostgreSQL Row Level Security), and client storage layer (scoped IndexedDB with cryptographic storage hygiene).
4. **DISHA & DPDP Alignment:** Architecture adheres to the principles of the Digital Information Security in Healthcare Act (DISHA) draft and the Digital Personal Data Protection (DPDP) Act 2023. *Note: Formal certification is a future administrative milestone; the technical design adheres to these foundational principles.*
5. **No Secrets / No Real Data in Public Repositories:** Absolute zero tolerance for live API keys, database credentials, or real patient PII in code repositories or demo environments.

---

## 2. Authentication Architecture

CAREGRID utilizes a hardened, token-based authentication mechanism integrated with Supabase Auth / PostgreSQL backend.

### 2.1 Passwordless Mobile OTP Authentication
Frontline health workers (ASHAs/ANMs) and rural citizens frequently operate in environments where complex password memorization leads to credential sharing on sticky notes or insecure workarounds.
- **Workflow:** Users authenticate using their verified 10-digit Indian mobile number (`MSISDN`).
- **OTP Generation & Verification:** 6-digit cryptographically random OTP generated server-side with a strict 300-second (5-minute) expiry window.
- **Brute-Force & Rate Limiting:**
  - Maximum 3 OTP dispatch requests per 5 minutes per phone number.
  - Maximum 5 failed verification attempts per session before a 15-minute lock-out.
  - IP-based rate limiting (100 requests per minute per IP) enforced at the API reverse proxy.

### 2.2 JWT Bearer Token Specification
Upon successful verification, the authentication service issues an RS256-signed JSON Web Token (JWT):
- **Access Token Lifetime:**
  - Standard web / desktop sessions: 60 minutes.
  - Frontline PWA Offline Mode: 12 hours max offline validity window before re-authentication is required upon network restoration.
- **Refresh Token Lifetime:** 30 days with single-use refresh token rotation (RTR). Re-use of an invalidated refresh token revokes all descendant tokens across all devices.
- **JWT Claims Payload:**
  ```json
  {
    "sub": "a0000000-0000-0000-0000-000000000001",
    "role": "asha_anm",
    "facility_id": "c0000000-0000-0000-0000-000000000001",
    "assigned_district": "Gadchiroli",
    "assigned_taluka": "Aheri",
    "assigned_village": "Mendha Lekha",
    "preferred_language": "mr",
    "iss": "https://auth.caregrid.maharashtra.gov.in",
    "exp": 1789814400
  }
  ```

---

## 3. Role-Based Access Control (RBAC)

CAREGRID implements a strict 5-tier hierarchical and contextual RBAC model:

| Role Identifier | Real-World Persona | Read Scope | Write / Mutate Scope | Prohibited Actions |
|---|---|---|---|---|
| `asha_anm` | ASHA & ANM frontline workers | Patients, encounters, triage, and follow-up tasks in assigned village/sub-center. | Register patients, record encounters, run triage, initiate referrals, complete follow-up tasks. | Cannot view patients outside catchment; cannot acknowledge/evaluate hospital referrals; cannot issue medical prescriptions. |
| `mo_doctor` | PHC Medical Officer, Specialist Physician | All patients and clinical records within facility catchment and active referral chain. | Clinical notes, teleconsultation counter-notes, referral acknowledgement/evaluation/completion, diagnostic orders. | Cannot alter immutable audit logs; cannot delete finalized encounters. |
| `phc_staff` | Staff Nurse, Pharmacist, Lab Tech, Registration Clerk | Facility OPD queues, appointment schedules, essential medicine availability. | Check-in queue tokens, record point-of-care lab results, update medicine stock status. | Cannot modify clinical specialist notes or doctor diagnostic summaries. |
| `admin_governance`| Taluka Health Officer, Civil Surgeon, State Director | Anonymized aggregate telemetry, referral funnel rates, service availability KPIs. | None (Read-only analytical access). | **Zero row-level patient clinical access.** Cannot see individual patient names, phone numbers, or addresses. |
| `citizen` | Rural Patient, Family Caregiver | Own patient profile, own health record timeline, own appointments, public facility directory. | Book appointments, acknowledge own notification alerts. | Cannot access other patients' records; cannot view provider-internal clinical notes. |

---

## 4. PostgreSQL Row Level Security (RLS) Policies

Every database table storing clinical or personal data enforces PostgreSQL Row Level Security (`ALTER TABLE <table> ENABLE ROW LEVEL SECURITY;`). Database queries execute within the security context of the authenticated user's JWT claims.

### 4.1 RLS Context Helpers
```sql
-- Extracts role from current JWT
CREATE OR REPLACE FUNCTION caregrid_user_role() RETURNS VARCHAR AS $$
  SELECT COALESCE(
    current_setting('request.jwt.claims', true)::jsonb->>'role',
    'anonymous'
  );
$$ LANGUAGE sql STABLE;

-- Extracts facility_id from current JWT
CREATE OR REPLACE FUNCTION caregrid_user_facility() RETURNS UUID AS $$
  SELECT (current_setting('request.jwt.claims', true)::jsonb->>'facility_id')::uuid;
$$ LANGUAGE sql STABLE;
```

### 4.2 Representative RLS Policies
```sql
-- 1. Patients Table: ASHAs see only patients in their operational village/sub-center
CREATE POLICY asha_patient_access ON patients
  FOR ALL
  TO authenticated
  USING (
    caregrid_user_role() = 'asha_anm' AND (
      registered_by = auth.uid() OR
      village = (current_setting('request.jwt.claims', true)::jsonb->>'assigned_village')
    )
  );

-- 2. Patients Table: Doctors see patients in their facility or referred to their facility
CREATE POLICY doctor_patient_access ON patients
  FOR SELECT
  TO authenticated
  USING (
    caregrid_user_role() = 'mo_doctor' AND (
      home_facility_id = caregrid_user_facility() OR
      id IN (SELECT patient_id FROM referrals WHERE target_facility_id = caregrid_user_facility() OR source_facility_id = caregrid_user_facility())
    )
  );

-- 3. Referrals Table: Only target facility staff can acknowledge and evaluate incoming referrals
CREATE POLICY target_facility_referral_update ON referrals
  FOR UPDATE
  TO authenticated
  USING (
    target_facility_id = caregrid_user_facility() AND
    caregrid_user_role() IN ('mo_doctor', 'phc_staff')
  );

-- 4. Audit Logs: Read-only even for administrators; inserts handled via trigger/service role
CREATE POLICY audit_logs_read_only ON audit_logs
  FOR SELECT
  TO authenticated
  USING (caregrid_user_role() = 'admin_governance');
```

---

## 5. Minimum Necessary Health Data & Anonymization

### 5.1 Permitted Data Elements
- **Demographics:** First name, last name, approximate age / DOB, gender, village/taluka/district, mobile phone (optional).
- **Vitals & Triage Signals:** Systolic/diastolic BP, pulse, SpO2, respiratory rate, temperature, point-of-care hemoglobin (Hb), reported symptom tags, red flag flags.
- **Care Continuity Metadata:** Referral tracking code (`REF-MH-[DIST]-[NUM]`), originating facility, receiving facility, appointment date/slot, follow-up visit due date, completion status.

### 5.2 Prohibited Data Elements
- Biometric scans (fingerprints, iris prints).
- National financial IDs (bank account numbers, PAN cards, credit information).
- Genetic sequence data or specialized genomic profiles.
- Unnecessary caste, religion, or political affiliations.
- Free-form non-clinical surveillance notes.

### 5.3 Administrative Telemetry Anonymization
All metrics displayed on Government and Facility Dashboards (`/analytics/*`) undergo strict aggregation and k-anonymity filtering:
- No individual patient identifier or name is included in analytical queries.
- Cell suppression: Any reporting cell with fewer than 5 patients in a rural sub-center is clamped or aggregated to the taluka level to prevent deanonymization via small numbers.

---

## 6. Patient Consent & Authorization

1. **Frontline Verbal & Digital Consent:**
   - When an ASHA or ANM registers a patient or inputs community triage data, an explicit digital consent flag (`consent_granted = TRUE`) must be recorded.
   - The worker must verbally explain in Marathi or Hindi that the record is utilized solely to coordinate medical referrals and follow-up care within the Government of Maharashtra public healthcare system.
2. **Referral Authorization:**
   - Referrals include explicit data-sharing authorization between referring PHC and receiving District Hospital specialists.
3. **Right to Correction & Revocation:**
   - Patients may request correction of demographic records through their assigned Sub-Center ANM or PHC Medical Officer.

---

## 7. Encryption Architecture

### 7.1 Encryption in Transit
- **Enforcement:** HTTPS over TLS 1.3 strictly mandated (TLS 1.2 minimum). Plain HTTP (port 80) automatically redirects to HTTPS with HTTP Strict Transport Security (HSTS) enabled:
  ```http
  Strict-Transport-Security: max-age=63072000; includeSubDomains; preload
  ```
- **Cipher Suites:** Modern forward-secrecy cipher suites (`TLS_AES_128_GCM_SHA256`, `TLS_AES_256_GCM_SHA384`, `ECDHE-ECDSA-AES128-GCM-SHA256`).
- **WebRTC Encryption:** All teleconsultation media streams are encrypted end-to-end using DTLS-SRTP.

### 7.2 Encryption at Rest
- **Database Layer:** PostgreSQL managed instances utilize AES-256 transparent database encryption (XTS-AES-256).
- **Database Backups:** All automated daily WAL logs and logical snapshot backups are encrypted using envelope encryption with dedicated cloud KMS keys.
- **Client-Side Storage (IndexedDB):** PWA client-side offline database (Dexie `CareGridOfflineDB`) stores operational working sets locally. Devices are protected via Android device encryption (FBE - File-Based Encryption) and screen lock enforcement policies for frontline tablets.

---

## 8. Secrets Management & Public GitHub Hygiene

### 8.1 Public Repository Guardrails
Because the CAREGRID codebase is developed and maintained within public/collaborative environments for SIH26133, the following rules are **strictly enforced**:
- **Zero Secrets in Git:** No database connection strings, JWT signing secrets, API tokens, passwords, or private keys may ever be committed.
- **Configuration via Environment Variables:** All dynamic runtime values are injected strictly via `.env` files which are included in `.gitignore`.
- **Pre-Commit Secret Scanning:** Git hooks execute secret scanning (`gitleaks` / `trufflehog` patterns) blocking commits containing strings matching high-entropy credentials or private key headers (`BEGIN PRIVATE KEY`).
- **Sanitized Dummy Config Example:**
  ```bash
  # .env.example (Safe for version control)
  VITE_API_BASE_URL=http://localhost:3000/api/v1
  VITE_SUPABASE_URL=https://placeholder-project.supabase.co
  VITE_SUPABASE_ANON_KEY=placeholder-anon-key-never-commit-real-secrets
  VITE_DEFAULT_LANGUAGE=en
  ```

### 8.2 Synthetic Test Data Only
- Under no circumstances shall real patient information, real ASHA phone numbers, or live hospital records be used in tests, mock databases, or seed fixtures.
- All seed data is 100% synthetic, utilizing generic Maharashtrian names, synthetic addresses (e.g., "Ghot Road, Aheri"), and dummy phone prefixes (`+919800000000`).

---

## 9. Immutable Audit Logging

To guarantee legal non-repudiation and traceability without compromising system performance:
- All sensitive operations (`PATIENT_READ`, `TRIAGE_ASSESS`, `REFERRAL_DISPATCH`, `FOLLOWUP_COMPLETE`, `SYNC_EVENT`) generate an append-only row in `audit_logs`.
- **Immutability Enforcement:**
  A PostgreSQL database trigger explicitly rejects any `UPDATE` or `DELETE` statement targeting the `audit_logs` table:
  ```sql
  CREATE OR REPLACE FUNCTION caregrid_protect_audit_logs() RETURNS TRIGGER AS $$
  BEGIN
    RAISE EXCEPTION 'CAREGRID Security Violation: audit_logs is append-only and cannot be altered or deleted.';
  END;
  $$ LANGUAGE plpgsql;

  CREATE TRIGGER trg_audit_protect
    BEFORE UPDATE OR DELETE ON audit_logs
    FOR EACH ROW EXECUTE FUNCTION caregrid_protect_audit_logs();
  ```
- **Audit Attributes Captured:**
  - `user_id` (Actor UUID)
  - `action` (`READ`, `CREATE`, `UPDATE`, `DELETE`, `SYNC_PUSH`)
  - `entity_name` and `record_id`
  - `client_ip` and `user_agent`
  - `timestamp_utc`
  - Zero raw passwords, OTPs, or full unmasked clinical notes in audit diffs.

---

## 10. Secure Offline Storage & Synchronization

### 10.1 Local PWA Storage Scope
- Frontline devices cache only the **active operational working set** necessary for their assigned tasks:
  - Patients assigned to the worker's operational village.
  - Active encounters created by the worker within the last 30 days.
  - Pending follow-up tasks due within 14 days.
  - Static facility catalog and emergency referral contact directories.
- Stale completed tasks are purged from local Dexie IndexedDB after successful server reconciliation.

### 10.2 Sync Payload Integrity & Tamper Prevention
- Every offline mutation batch submitted to `POST /sync/push` includes:
  - `client_event_id`: Unique client UUID preventing replay or duplicate creation.
  - `client_timestamp`: Generation time.
  - `user_id`: Validated against the authenticated JWT bearer identity.
- The server validates foreign key referential integrity and checks for concurrent updates using monotonic `sync_version` counters.

---

## 11. Threat Model & Abuse Scenarios (STRIDE Analysis)

| STRIDE Threat | Attack Vector / Scenario | CAREGRID Mitigation Strategy |
|---|---|---|
| **Spoofing** | Attacker attempts to forge ASHA credentials or spoof OTP. | Short-lived 5-minute OTP, strict rate limiting, 15-minute lockouts, cryptographic RS256 JWT tokens. |
| **Tampering** | Rogue actor intercepts offline sync payloads to alter triage urgency tiers. | TLS 1.3 in transit; server-side re-validation of triage rule thresholds before committing to database; optimistic lock version verification. |
| **Repudiation** | Healthcare worker denies initiating a critical emergency referral. | Append-only, trigger-protected `audit_logs` storing immutable timestamp, actor ID, and transaction hash. |
| **Information Disclosure** | Unauthorized official attempts bulk download of patient health data. | Strict PostgreSQL Row Level Security (RLS); Taluka/District administrative tokens have zero SELECT permissions on clinical tables; rate-limited pagination. |
| **Denial of Service** | Botnet floods appointment booking or triage assessment endpoints. | API gateway rate limiting (100 req/min per IP); Cloudflare DDoS mitigation; client-side queue throttling. |
| **Elevation of Privilege** | Citizen or staff nurse attempts to access Medical Officer specialist counter-notes or admin telemetry. | Enforced RBAC at both API gateway middleware and PostgreSQL RLS policy layers; role claims verified via cryptographic JWT signature. |

---

## 12. Incident Response & Error Handling

1. **Sanitized Error Outputs:**
   - API error responses return structured, generic error messages and localized error codes.
   - Internal stack traces, SQL syntax strings, table structures, and environment variable paths are **never** exposed to the HTTP client (HTTP 500 displays: `{"success": false, "error": {"code": "INTERNAL_SERVER_ERROR", "message": "An unexpected error occurred. Reference ID: req-xxx"}}`).
2. **Security Incident Protocol:**
   - If token compromise or credential leakage is detected:
     1. Invalidate all active sessions for the compromised `user_id` via Supabase Auth revocation.
     2. Rotate JWT signing keys if token signature leak is suspected.
     3. Isolate the affected facility records and perform an automated audit review on `audit_logs`.
     4. Notify the designated Public Health Department Security Officer within 24 hours.
