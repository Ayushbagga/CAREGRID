# CAREGRID: Security, Privacy & Healthcare Compliance Framework

> **SIH Problem Statement**: SIH26133 — Accessibility & Quality of Public Healthcare in Rural/Underserved Areas  
> **Jurisdiction**: Government of Maharashtra (Public Health Department)  
> **Team**: The Glitch Gang (Team ID: 129855)  

---

## 1. Compliance Mandate & Legal Standards

CAREGRID handles sensitive electronic Protected Health Information (ePHI) across rural populations. The security architecture is designed to comply with:

1. **Digital Personal Data Protection (DPDP) Act, 2023 (India)**:
   - Lawful, consent-based processing of citizen health data.
   - Purpose limitation: Patient data is collected strictly for clinical care delivery, referral continuity, and public health disease surveillance.
   - Right to access, correction, and grievance redressal for rural citizens.
2. **Ayushman Bharat Digital Mission (ABDM) Standards**:
   - Readiness for ABHA (Ayushman Bharat Health Account) 14-digit identifier resolution.
   - Electronic Health Record (EHR) data structures conforming to National Digital Health Blueprint (NDHB).
   - Milestone M1 (ABHA creation), M2 (Building longitudinal health records), and M3 (Unified Health Interface - UHI) architecture alignment.
3. **DISHA (Digital Information Security in Healthcare Act) Principles**:
   - Strict privacy by default.
   - Absolute ban on commercialization, unconsented third-party monetization, or unauthorized secondary usage of health data.

---

## 2. Role-Based Access Control (RBAC) Matrix

| User Role | Patient Demographics | Vitals & Intake | Doctor Clinical Notes | Triage Urgency | Referrals | Facility Admin / Bed Status | Aggregated State Intelligence |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **Citizen / Patient** | Own Only | Own Only | Own Only | Own Only | Own Only | Read Only | ❌ |
| **ASHA Worker** | Assigned Village | Create & Read (Assigned) | Read (Assigned) | Create & Read | Track Initiated | Read Only | ❌ |
| **ANM Worker** | Sub-Centre Area | Create & Read | Read & Add Notes | Create & Read | Create & Track | Read Only | Sub-Centre Stats |
| **PHC Medical Officer** | Registered / Walk-in | Full Read/Write | Full Read/Write | Full Read/Write | Create & Manage | Read/Update OPD | PHC Level Stats |
| **Specialist Doctor** | Referred Patients | Full Read/Write | Full Read/Write | Full Read/Write | Acknowledge & Discharge | Read / Update Beds | Facility Stats |
| **Pharmacist / Lab Tech** | Associated Encounters | Read Only | Prescribed Items Only | Read Only | ❌ | Dispense / Inventory | Stockout Stats |
| **Facility Administrator** | Facility Patients | Read Only | Read Only | Read Only | Facility Referrals | Full Admin Control | Facility Stats |
| **District Officer (DHO)** | Anonymized Cohorts | Anonymized | Anonymized | Aggregated | District Transfers | District Facility Ops | Full District |
| **State Directorate** | De-identified / Macro | Aggregated | Aggregated | Aggregated | State Flow Metrics | State Infrastructure | State-wide Macro |

---

## 3. PostgreSQL Row-Level Security (RLS) Implementation

Security is enforced at the database kernel level rather than relying entirely on application code.

### Policy Rules:
1. **Patient Data Isolation**:
   ```sql
   -- A patient can only view their own record
   CREATE POLICY patient_self_access ON patients
   FOR SELECT
   USING (auth.uid() = id);

   -- ASHA workers can only access patients within their assigned village
   CREATE POLICY asha_village_access ON patients
   FOR ALL
   USING (
     EXISTS (
       SELECT 1 FROM profiles
       WHERE profiles.id = auth.uid()
         AND profiles.role = 'asha_worker'
         AND profiles.assigned_village = patients.village
     )
   );

   -- Medical Officers can access patients registered at their facility or actively referred to it
   CREATE POLICY doctor_facility_access ON patients
   FOR SELECT
   USING (
     EXISTS (
       SELECT 1 FROM profiles
       WHERE profiles.id = auth.uid()
         AND profiles.role IN ('medical_officer', 'specialist_doctor')
         AND (
           profiles.facility_id = patients.primary_facility_id
           OR EXISTS (
             SELECT 1 FROM referrals
             WHERE referrals.patient_id = patients.id
               AND (referrals.to_facility_id = profiles.facility_id OR referrals.from_facility_id = profiles.facility_id)
           )
         )
     )
   );
   ```

2. **Audit Logging Enforced via Database Triggers**:
   - Any query or modification touching the `patients`, `vitals`, `encounters`, or `referrals` tables automatically generates an immutable record in `audit_logs`.

---

## 4. Cryptographic Security Standards

1. **Transport Encryption**:
   - HTTPS / TLS 1.3 enforced for all web and mobile traffic.
   - Strict HTTP Strict Transport Security (HSTS) with preloading.
2. **Data-at-Rest Encryption**:
   - AES-256 encryption at disk storage layer.
   - Encrypted PostgreSQL tablespaces for sensitive clinical attributes.
3. **Identity & Identifier Hashing**:
   - Aadhaar / National ID numbers are **never** stored in plain text. Only a one-way cryptographically salted SHA-256 hash (`national_id_hash`) is maintained for deduplication.
   - Primary linkage is anchored to ABHA (Ayushman Bharat Health Account) IDs.

---

## 5. Offline Data Protection on Edge Devices

Because ASHA workers carry mobile devices into remote villages, local data on the device is protected:
1. **IndexedDB Scoping**:
   - Offline records cached on the client are scoped to the authenticated session.
   - Logging out securely purges cached PHI from IndexedDB unless explicitly flagged for pending offline sync.
2. **Session Timeout & PIN Unlock**:
   - Field workers can set a fast 4-digit biometric/PIN lock to resume offline operation without transmitting credentials over unauthenticated channels.
