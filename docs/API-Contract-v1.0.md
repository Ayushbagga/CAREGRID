# CAREGRID API Contract v1.0

**Document Reference:** CAREGRID-DOC-API-V1.0  
**Problem Statement:** SIH26133 — Accessibility & Quality of Public Healthcare in Rural/Underserved Areas  
**Target Beneficiary:** Government of Maharashtra (Public Health Department)  
**Status:** Approved Specification  
**Architecture Base:** RESTful API over HTTPS (TLS 1.3), JSON payloads, Bearer JWT Auth, Supabase / PostgreSQL backend integration  
**Companion Documents:**  
- [`docs/PRD-v1.0.md`](./PRD-v1.0.md) (Product Requirements Document v1.0)  
- [`docs/TRD-v1.0.md`](./TRD-v1.0.md) (Technical Requirements Document v1.0)  
- [`docs/Backend-Schema-v1.0.md`](./Backend-Schema-v1.0.md) (Backend Database Schema v1.0)  

---

## 1. Global API Conventions & Standards

### 1.1 Base URL & Versioning
- **Production Base URL:** `https://api.caregrid.maharashtra.gov.in/api/v1` (Proposed production gateway)
- **Staging / Local Base URL:** `http://localhost:3000/api/v1`
- **Protocol:** HTTPS only (TLS 1.3 mandated, TLS 1.2 minimum).
- **Format:** `application/json; charset=utf-8` for all request and response bodies.

### 1.2 Common HTTP Headers
| Header | Required | Description | Example |
|---|---|---|---|
| `Authorization` | Yes (except public) | Bearer JWT token from Supabase / Auth service | `Bearer eyJhbGciOi...` |
| `Content-Type` | Yes (on POST/PUT/PATCH) | MIME type of request body | `application/json` |
| `Accept-Language` | Optional (default `en`) | Trilingual localization preference | `mr` (Marathi), `hi` (Hindi), `en` (English) |
| `X-Client-Version` | Optional | Client app version string | `caregrid-pwa/1.0.0` |
| `Idempotency-Key` | Optional / Mandatory on mutative sync | Client-generated UUIDv4 preventing double-submission | `c56a4180-65aa-42ec-a945-5fd2dec05382` |

### 1.3 Standard Response Formats

#### Success Envelope (200 OK, 201 Created)
```json
{
  "success": true,
  "data": { ... },
  "metadata": {
    "timestamp": "2026-09-19T10:45:00Z",
    "request_id": "req-98f2-4bc1",
    "pagination": {
      "page": 1,
      "limit": 20,
      "total_items": 142,
      "total_pages": 8
    }
  }
}
```

#### Error Envelope (4xx Client Error, 5xx Server Error)
```json
{
  "success": false,
  "error": {
    "code": "INVALID_TRIAGE_PAYLOAD",
    "message": "Localized human-readable error description based on Accept-Language.",
    "details": [
      {
        "field": "systolic_bp",
        "issue": "Systolic blood pressure must be between 50 and 260 mmHg"
      }
    ],
    "timestamp": "2026-09-19T10:45:00Z",
    "request_id": "req-98f2-4bc1"
  }
}
```

### 1.4 Standard Error Codes
| HTTP Status | Error Code | Description |
|---|---|---|
| `400 Bad Request` | `VALIDATION_ERROR` | Schema validation failed on input fields. |
| `401 Unauthorized` | `AUTH_REQUIRED` / `TOKEN_EXPIRED` | Missing, invalid, or expired JWT Bearer token. |
| `403 Forbidden` | `PERMISSION_DENIED` | Insufficient role permissions or RLS policy violation. |
| `404 Not Found` | `RESOURCE_NOT_FOUND` | Target entity does not exist or is marked soft-deleted. |
| `409 Conflict` | `VERSION_CONFLICT` / `DUPLICATE_IDEMPOTENCY` | Optimistic lock failure (`sync_version` mismatch) or idempotency collision. |
| `422 Unprocessable` | `BUSINESS_RULE_VIOLATION` | Logical failure (e.g. attempting to complete an unacknowledged referral). |
| `500 Internal Error` | `INTERNAL_SERVER_ERROR` | Unhandled server exception (audited with zero PII exposure). |

### 1.5 Role-Based Access Control (RBAC) Hierarchy
- `asha_anm`: ASHA and Auxiliary Nurse Midwife community frontline workers.
- `mo_doctor`: Medical Officers and specialist physicians at PHC, RH, SDH, DH.
- `phc_staff`: Pharmacists, laboratory technicians, nurses, and registration desk staff.
- `admin_governance`: Taluka/District/State public health administrators (read-only telemetry & aggregate indicators).
- `citizen`: Registered patients and their authorized family caregivers.

---

## 2. Authentication & User Session Endpoints

### 2.1 Send OTP for Login
- **Method:** `POST`
- **Route:** `/auth/otp/send`
- **Purpose:** Initiates passwordless authentication for citizens or frontline healthcare workers via mobile OTP.
- **Authentication:** Public (No token required). Rate limited to 3 requests per 5 minutes per mobile number.
- **Role/Permission:** Any user.
- **Request Schema:**
  ```json
  {
    "mobile_number": "9820012345",
    "language": "mr"
  }
  ```
- **Validation:** `mobile_number` must be valid 10-digit Indian MSISDN (`^[6-9]\d{9}$`). `language` enum: `["en", "hi", "mr"]`.
- **Response Schema (`200 OK`):**
  ```json
  {
    "success": true,
    "data": {
      "session_id": "sess_89f023a1-c241-47ec",
      "expires_in_seconds": 300,
      "message": "OTP sent successfully via SMS"
    }
  }
  ```
- **Error Responses:** `400 VALIDATION_ERROR`, `429 TOO_MANY_REQUESTS`.
- **Offline/Sync Considerations:** Authentication requires active network connectivity. Cached JWTs remain valid offline until expiration (12-hour shelf-life for frontline workers).

### 2.2 Verify OTP & Issue Session
- **Method:** `POST`
- **Route:** `/auth/otp/verify`
- **Purpose:** Verifies OTP code, provisions or retrieves user profile, and issues Supabase JWT Bearer session.
- **Authentication:** Public.
- **Role/Permission:** Any user.
- **Request Schema:**
  ```json
  {
    "session_id": "sess_89f023a1-c241-47ec",
    "mobile_number": "9820012345",
    "otp_code": "482910"
  }
  ```
- **Validation:** `otp_code` must be 6 numeric digits.
- **Response Schema (`200 OK`):**
  ```json
  {
    "success": true,
    "data": {
      "access_token": "eyJhbGciOi...",
      "refresh_token": "v1.re...",
      "token_type": "Bearer",
      "expires_in": 43200,
      "user": {
        "id": "a0000000-0000-0000-0000-000000000001",
        "full_name": "Sunita Patil",
        "role": "asha_anm",
        "phone": "+919820012345",
        "facility_id": "c0000000-0000-0000-0000-000000000001",
        "facility_name": "Korpana Primary Health Centre",
        "assigned_district": "Gadchiroli",
        "assigned_taluka": "Aheri",
        "assigned_village": "Mendha Lekha",
        "preferred_language": "mr"
      }
    }
  }
  ```
- **Error Responses:** `400 VALIDATION_ERROR`, `401 INVALID_OTP`.

### 2.3 Get Current User Profile & Capabilities
- **Method:** `GET`
- **Route:** `/auth/me`
- **Purpose:** Returns authenticated user profile, assigned facility, village jurisdiction, and role permissions.
- **Authentication:** Bearer JWT.
- **Role/Permission:** All authenticated roles (`asha_anm`, `mo_doctor`, `phc_staff`, `admin_governance`, `citizen`).
- **Response Schema (`200 OK`):**
  ```json
  {
    "success": true,
    "data": {
      "id": "a0000000-0000-0000-0000-000000000001",
      "full_name": "Sunita Patil",
      "role": "asha_anm",
      "phone": "+919820012345",
      "facility_id": "c0000000-0000-0000-0000-000000000001",
      "preferred_language": "mr",
      "permissions": [
        "patients:create", "patients:read", "encounters:create",
        "triage:conduct", "referrals:initiate", "follow_ups:manage"
      ]
    }
  }
  ```

---

## 3. Patients Endpoints

### 3.1 List / Search Patients
- **Method:** `GET`
- **Route:** `/patients`
- **Purpose:** Search and filter registered patients within the worker's assigned facility catchment or jurisdiction.
- **Authentication:** Bearer JWT.
- **Role/Permission:** `asha_anm`, `mo_doctor`, `phc_staff`, `admin_governance`.
- **Query Parameters:**
  - `query`: Free-text search on name, phone, or `care_id`.
  - `care_id`: Exact match on neutral identifier (e.g. `CARE-MH-2026-A8F2`).
  - `village`: Filter by village name.
  - `is_high_risk`: Boolean (`true` / `false`).
  - `page`: Integer (default `1`).
  - `limit`: Integer (default `20`, max `100`).
- **Response Schema (`200 OK`):**
  ```json
  {
    "success": true,
    "data": [
      {
        "id": "e0000000-0000-0000-0000-000000000001",
        "care_id": "CARE-MH-2026-A8F2",
        "first_name": "Kavita",
        "last_name": "Madavi",
        "date_of_birth": "1998-04-12",
        "age": 28,
        "gender": "female",
        "phone": "+919800112233",
        "district": "Gadchiroli",
        "taluka": "Aheri",
        "village": "Mendha Lekha",
        "is_high_risk": true,
        "high_risk_reason": "Severe anemia in 3rd trimester pregnancy",
        "sync_version": 1,
        "updated_at": "2026-09-18T10:00:00Z"
      }
    ],
    "metadata": { "pagination": { "page": 1, "limit": 20, "total_items": 1 } }
  }
  ```

### 3.2 Register New Patient
- **Method:** `POST`
- **Route:** `/patients`
- **Purpose:** Registers a patient into the care continuum. Allocates a neutral Maharashtra CARE ID (`CARE-MH-YYYY-XXXX`).
- **Authentication:** Bearer JWT.
- **Role/Permission:** `asha_anm`, `mo_doctor`, `phc_staff`.
- **Request Schema:**
  ```json
  {
    "id": "e0000000-0000-0000-0000-000000000001",
    "first_name": "Kavita",
    "last_name": "Madavi",
    "date_of_birth": "1998-04-12",
    "gender": "female",
    "phone": "+919800112233",
    "emergency_contact_phone": "+919800112244",
    "address": "House No 42, Ghot Road",
    "village": "Mendha Lekha",
    "taluka": "Aheri",
    "district": "Gadchiroli",
    "pincode": "442705",
    "home_facility_id": "c0000000-0000-0000-0000-000000000001",
    "is_high_risk": true,
    "high_risk_reason": "Severe anemia in 3rd trimester pregnancy",
    "client_created_at": "2026-09-18T09:30:00Z"
  }
  ```
- **Validation Rules:**
  - `id`: Optional client-generated UUIDv4 (for offline creation).
  - `first_name`, `last_name`, `gender`, `district`, `taluka`, `village`: Mandatory.
  - `gender` enum: `["female", "male", "other", "undisclosed"]`.
  - `phone`: 10-digit Indian phone or null.
  - Neutral ID: Server generates `CARE-MH-YYYY-XXXX` if absent.
- **Response Schema (`201 Created`):**
  ```json
  {
    "success": true,
    "data": {
      "id": "e0000000-0000-0000-0000-000000000001",
      "care_id": "CARE-MH-2026-A8F2",
      "sync_version": 1,
      "created_at": "2026-09-18T09:30:00Z"
    }
  }
  ```
- **Idempotency Requirements:** Handled via client UUID `id`. If a patient with identical UUID exists, server checks `sync_version`.
- **Offline/Sync Considerations:** ASHA clients generate local UUIDv4 in Dexie IndexedDB and queue patient registration. Server accepts the offline UUID on sync.

### 3.3 Get Patient by ID
- **Method:** `GET`
- **Route:** `/patients/{id}`
- **Purpose:** Retrieves full demographic profile and summary clinical flags for a patient.
- **Authentication:** Bearer JWT.
- **Role/Permission:** Frontline health workers, treating doctors, or the patient themselves.

---

## 4. Health Records (Longitudinal Timeline)

### 4.1 Get Longitudinal Patient Timeline
- **Method:** `GET`
- **Route:** `/patients/{patient_id}/health-record`
- **Purpose:** Fetches unified chronological care events (encounters, triage, vitals, referrals, diagnostics, follow-ups).
- **Authentication:** Bearer JWT.
- **Role/Permission:** `asha_anm`, `mo_doctor`, `phc_staff`, `citizen` (self only).
- **Query Parameters:**
  - `event_type`: Optional filter (`vitals`, `encounter`, `referral`, `diagnostic`, `follow_up`).
  - `start_date`: ISO8601 date.
  - `end_date`: ISO8601 date.
- **Response Schema (`200 OK`):**
  ```json
  {
    "success": true,
    "data": {
      "patient_id": "e0000000-0000-0000-0000-000000000001",
      "care_id": "CARE-MH-2026-A8F2",
      "patient_name": "Kavita Madavi",
      "age": 28,
      "gender": "female",
      "non_diagnostic_disclaimer": "Assistive care timeline. Requires qualified medical verification.",
      "blood_group": "O+",
      "allergies": ["Penicillin"],
      "chronic_conditions": ["Gestational Anemia"],
      "events": [
        {
          "event_id": "f0000000-0000-0000-0000-000000000001",
          "event_type": "encounter",
          "event_date": "2026-09-18T10:00:00Z",
          "title": "ASHA Home Visit & Antenatal Checkup",
          "provider_name": "Sunita Patil (ASHA)",
          "facility_name": "Aheri Sub-Center",
          "summary": "Patient reports mild dizziness. Pale conjunctiva noted.",
          "vitals": {
            "systolic_bp": 105,
            "diastolic_bp": 68,
            "pulse_bpm": 84,
            "sp_o2_percent": 98
          },
          "triage_urgency": "urgent_amber"
        },
        {
          "event_id": "k0000000-0000-0000-0000-000000000001",
          "event_type": "referral",
          "event_date": "2026-09-18T10:15:00Z",
          "title": "Referral Initiated to District Hospital Gadchiroli",
          "urgency_tier": "urgent_amber",
          "specialty_requested": "Obstetrics & Gynecology",
          "status": "initiated"
        }
      ]
    }
  }
  ```

---

## 5. Encounters Endpoints

### 5.1 Create Clinical / Community Encounter
- **Method:** `POST`
- **Route:** `/encounters`
- **Purpose:** Logs an in-person or community interaction (ASHA home visit, PHC OPD check, or nurse intake).
- **Authentication:** Bearer JWT.
- **Role/Permission:** `asha_anm`, `mo_doctor`, `phc_staff`.
- **Request Schema:**
  ```json
  {
    "id": "f0000000-0000-0000-0000-000000000001",
    "patient_id": "e0000000-0000-0000-0000-000000000001",
    "facility_id": "c0000000-0000-0000-0000-000000000001",
    "encounter_type": "asha_home_visit",
    "chief_complaint": "Dizziness and fatigue in 32nd week of pregnancy",
    "symptoms": ["fatigue", "dizziness", "pallor"],
    "notes": "Patient advised to maintain hydration and take IFA tablets.",
    "client_created_at": "2026-09-18T10:00:00Z"
  }
  ```
- **Validation:**
  - `encounter_type` enum: `["asha_home_visit", "phc_opd", "teleconsultation", "specialist_review", "emergency_triage"]`.
- **Response Schema (`201 Created`):**
  ```json
  {
    "success": true,
    "data": {
      "id": "f0000000-0000-0000-0000-000000000001",
      "sync_version": 1,
      "created_at": "2026-09-18T10:00:00Z"
    }
  }
  ```

---

## 6. Triage Assessments Endpoints (Assistive & Non-Diagnostic)

### 6.1 Conduct Assistive Triage Assessment
- **Method:** `POST`
- **Route:** `/triage/assess`
- **Purpose:** Evaluates vital signs, red-flag symptoms, and assigns an assistive urgency tier (`emergency_red`, `urgent_amber`, `routine_green`) to guide routing.
- **Safety Boundary:** Strict rule-based assistive routing. Does NOT diagnose pathology or generate prescriptions.
- **Authentication:** Bearer JWT.
- **Role/Permission:** `asha_anm`, `mo_doctor`, `phc_staff`.
- **Request Schema:**
  ```json
  {
    "id": "g0000000-0000-0000-0000-000000000001",
    "encounter_id": "f0000000-0000-0000-0000-000000000001",
    "patient_id": "e0000000-0000-0000-0000-000000000001",
    "systolic_bp": 105,
    "diastolic_bp": 68,
    "pulse_bpm": 84,
    "respiratory_rate_bpm": 18,
    "temperature_celsius": 36.8,
    "sp_o2_percent": 98,
    "hemoglobin_g_dl": 7.8,
    "symptoms_reported": ["dizziness", "fatigue", "pallor"],
    "red_flag_symptoms": ["severe_pallor_third_trimester"],
    "client_created_at": "2026-09-18T10:05:00Z"
  }
  ```
- **Validation Rules:**
  - Vitals ranges: `systolic_bp` [50–260], `diastolic_bp` [30–160], `pulse_bpm` [30–220], `sp_o2_percent` [50–100].
  - `hemoglobin_g_dl` < 8.0 in pregnancy automatically triggers `urgent_amber` or `emergency_red`.
- **Response Schema (`201 Created`):**
  ```json
  {
    "success": true,
    "data": {
      "id": "g0000000-0000-0000-0000-000000000001",
      "urgency_tier": "urgent_amber",
      "priority_score": 2,
      "recommended_action": "Refer to Medical Officer at PHC or District Hospital for intravenous iron or blood management within 24 hours.",
      "red_flag_triggers": ["hemoglobin < 8.0 g/dL in pregnancy"],
      "non_diagnostic_disclaimer": "Assistive clinical recommendation only. Not a medical diagnosis.",
      "disclaimer_acknowledged": true,
      "sync_version": 1
    }
  }
  ```

---

## 7. Facilities & Discovery Endpoints

### 7.1 Discover Public Healthcare Facilities
- **Method:** `GET`
- **Route:** `/facilities`
- **Purpose:** Public and worker discovery of verified public health facilities across Maharashtra districts.
- **Authentication:** Public (Optional Bearer token for personalized sorting).
- **Query Parameters:**
  - `district`: Filter by district name (e.g. `Gadchiroli`, `Nashik`, `Pune`).
  - `taluka`: Filter by taluka name (e.g. `Aheri`, `Igatpuri`, `Ambegaon`).
  - `facility_type`: Enum `["sub_center", "phc", "rural_hospital", "sub_district_hospital", "district_hospital"]`.
  - `has_teleconsultation`: Boolean (`true` / `false`).
  - `service_code`: E.g. `ANC_PNC`, `EMERGENCY_OBSTETRICS`, `LAB_CBC`.
  - `page`: Integer (default `1`).
  - `limit`: Integer (default `20`).
- **Response Schema (`200 OK`):**
  ```json
  {
    "success": true,
    "data": [
      {
        "id": "c0000000-0000-0000-0000-000000000001",
        "name": "Korpana Primary Health Centre",
        "facility_type": "phc",
        "district": "Gadchiroli",
        "taluka": "Aheri",
        "address": "Main Road, Korpana",
        "pincode": "442705",
        "phone": "+917138222111",
        "operating_hours": "24x7 Emergency, OPD 09:00 - 16:00",
        "has_teleconsultation": true,
        "is_active": true,
        "services": ["OPD", "ANC_PNC", "IMMUNIZATION", "TELECONSULTATION", "BASIC_LAB"]
      }
    ],
    "metadata": { "pagination": { "page": 1, "limit": 20, "total_items": 1 } }
  }
  ```

### 7.2 Get Facility Details & Service Readiness
- **Method:** `GET`
- **Route:** `/facilities/{id}`
- **Purpose:** Returns comprehensive facility details, active services, doctor availability, and essential medicine stock status.
- **Authentication:** Public.
- **Response Schema (`200 OK`):**
  ```json
  {
    "success": true,
    "data": {
      "id": "c0000000-0000-0000-0000-000000000001",
      "name": "Korpana Primary Health Centre",
      "facility_type": "phc",
      "district": "Gadchiroli",
      "taluka": "Aheri",
      "services": [
        {
          "service_code": "ANC_PNC",
          "service_name": "Antenatal & Postnatal Care",
          "is_available": true
        },
        {
          "service_code": "TELECONSULTATION",
          "service_name": "eSanjeevani Specialist Teleconsultation",
          "is_available": true
        }
      ],
      "readiness": {
        "electricity_available": true,
        "water_supply_functional": true,
        "functional_teleconsultation_pod": true
      }
    }
  }
  ```

---

## 8. Facility Services Catalog Endpoints

### 8.1 List Facility Services
- **Method:** `GET`
- **Route:** `/facilities/{facility_id}/services`
- **Purpose:** Lists all operational clinical and diagnostic services configured for a health facility.
- **Authentication:** Public.
- **Response Schema (`200 OK`):**
  ```json
  {
    "success": true,
    "data": [
      {
        "id": "d0000000-0000-0000-0000-000000000001",
        "facility_id": "c0000000-0000-0000-0000-000000000001",
        "service_code": "ANC_PNC",
        "service_name": "Antenatal Care Clinic",
        "service_category": "maternal_child",
        "is_available": true,
        "schedule_days": ["Monday", "Wednesday", "Friday"],
        "schedule_hours": "09:00 - 13:00"
      }
    ]
  }
  ```

---

## 9. Appointments Endpoints

### 9.1 Book / Schedule Appointment
- **Method:** `POST`
- **Route:** `/appointments`
- **Purpose:** Books an OPD visit or teleconsultation slot at a PHC or referral center.
- **Authentication:** Bearer JWT.
- **Role/Permission:** `citizen`, `asha_anm`, `phc_staff`, `mo_doctor`.
- **Request Schema:**
  ```json
  {
    "patient_id": "e0000000-0000-0000-0000-000000000001",
    "facility_id": "c0000000-0000-0000-0000-000000000001",
    "appointment_type": "phc_opd",
    "scheduled_date": "2026-09-20",
    "scheduled_time_slot": "10:30-11:00",
    "reason_for_visit": "Follow-up for third-trimester anemia"
  }
  ```
- **Validation:** `scheduled_date` must be current or future date. `appointment_type` enum: `["phc_opd", "teleconsultation", "follow_up_visit", "diagnostic_test"]`.
- **Response Schema (`201 Created`):**
  ```json
  {
    "success": true,
    "data": {
      "id": "h0000000-0000-0000-0000-000000000001",
      "status": "scheduled",
      "scheduled_date": "2026-09-20",
      "scheduled_time_slot": "10:30-11:00",
      "queue_token_generated": true
    }
  }
  ```

### 9.2 List Appointments
- **Method:** `GET`
- **Route:** `/appointments`
- **Purpose:** View upcoming and historical appointments filtered by patient, facility, date, or status.
- **Authentication:** Bearer JWT.
- **Role/Permission:** Treating staff or the patient.

---

## 10. Priority-Sorted Queues Endpoints

### 10.1 Issue Queue Token
- **Method:** `POST`
- **Route:** `/queues/issue-token`
- **Purpose:** Generates an OPD or Teleconsultation queue token dynamically ordered by urgency tier.
- **Authentication:** Bearer JWT.
- **Role/Permission:** `phc_staff`, `asha_anm`, `mo_doctor`.
- **Request Schema:**
  ```json
  {
    "facility_id": "c0000000-0000-0000-0000-000000000001",
    "patient_id": "e0000000-0000-0000-0000-000000000001",
    "appointment_id": "h0000000-0000-0000-0000-000000000001",
    "urgency_tier": "emergency_red"
  }
  ```
- **Response Schema (`201 Created`):**
  ```json
  {
    "success": true,
    "data": {
      "id": "i0000000-0000-0000-0000-000000000001",
      "queue_token": "Q-001",
      "priority_level": 1,
      "urgency_tier": "emergency_red",
      "estimated_wait_minutes": 5,
      "status": "waiting"
    }
  }
  ```

### 10.2 Get Live Facility Queue
- **Method:** `GET`
- **Route:** `/queues/live/{facility_id}`
- **Purpose:** Returns the live active queue ordered strictly by: `priority_level ASC, queue_number ASC`.
- **Ordering Algorithm:**
  1. `emergency_red` (Priority 1) — Fast-tracked to top.
  2. `urgent_amber` (Priority 2) — Second tier.
  3. `routine_green` (Priority 3) — First-come first-served within tier.
- **Authentication:** Bearer JWT.
- **Role/Permission:** `mo_doctor`, `phc_staff`, `asha_anm`.
- **Response Schema (`200 OK`):**
  ```json
  {
    "success": true,
    "data": [
      {
        "queue_token": "Q-001",
        "patient_name": "Rani Uike",
        "priority_level": 1,
        "urgency_tier": "emergency_red",
        "status": "waiting",
        "checked_in_at": "2026-09-19T09:15:00Z"
      },
      {
        "queue_token": "Q-002",
        "patient_name": "Kavita Madavi",
        "priority_level": 2,
        "urgency_tier": "urgent_amber",
        "status": "waiting",
        "checked_in_at": "2026-09-19T09:00:00Z"
      }
    ]
  }
  ```

### 10.3 Update Queue Token Status
- **Method:** `PATCH`
- **Route:** `/queues/{id}/status`
- **Purpose:** Advances token state (`waiting` $\rightarrow$ `called` $\rightarrow$ `in_consultation` $\rightarrow$ `completed`).
- **Authentication:** Bearer JWT.
- **Role/Permission:** `mo_doctor`, `phc_staff`.

---

## 11. Consultations & Teleconsultation Endpoints

### 11.1 Initiate / Update Teleconsultation Session
- **Method:** `POST`
- **Route:** `/consultations`
- **Purpose:** Initiates or records a teleconsultation session between a community/PHC provider and a remote specialist.
- **Authentication:** Bearer JWT.
- **Role/Permission:** `mo_doctor`, `asha_anm`, `phc_staff`.
- **Request Schema:**
  ```json
  {
    "id": "j0000000-0000-0000-0000-000000000001",
    "encounter_id": "f0000000-0000-0000-0000-000000000001",
    "patient_id": "e0000000-0000-0000-0000-000000000001",
    "consultation_type": "teleconsultation",
    "specialist_provider_id": "a0000000-0000-0000-0000-000000000002",
    "session_status": "in_progress",
    "clinical_notes": "Patient examined via tele-pod. Pale conjunctiva confirmed.",
    "specialist_advice": "Start oral IFA twice daily with Vitamin C. Review in 14 days.",
    "teleconsult_room_id": "caregrid-room-korpana-gadchiroli-892"
  }
  ```
- **Validation:** Autonomous prescriptions are strictly blocked. Advice fields represent human clinical decisions only.
- **Response Schema (`201 Created`):**
  ```json
  {
    "success": true,
    "data": {
      "id": "j0000000-0000-0000-0000-000000000001",
      "session_status": "in_progress",
      "sync_version": 1
    }
  }
  ```

### 11.2 Complete Consultation & Document Counter-Notes
- **Method:** `PATCH`
- **Route:** `/consultations/{id}/complete`
- **Purpose:** Finalizes specialist counter-notes, marks teleconsultation completed, and records duration.
- **Authentication:** Bearer JWT.
- **Role/Permission:** `mo_doctor`.
- **Request Schema:**
  ```json
  {
    "clinical_notes": "Final clinical advice recorded after remote video examination.",
    "specialist_advice": "Refer to District Hospital if hemoglobin does not rise above 9.0 g/dL by 34th week.",
    "duration_minutes": 15
  }
  ```
- **Response Schema (`200 OK`):**
  ```json
  {
    "success": true,
    "data": {
      "id": "j0000000-0000-0000-0000-000000000001",
      "session_status": "completed",
      "completed_at": "2026-09-19T10:45:00Z"
    }
  }
  ```

---

## 12. Closed-Loop Referrals Endpoints

### 12.1 Initiate Referral
- **Method:** `POST`
- **Route:** `/referrals`
- **Purpose:** Initiates a closed-loop referral from Sub-Center/PHC to an advanced secondary/tertiary hospital.
- **Authentication:** Bearer JWT.
- **Role/Permission:** `asha_anm`, `mo_doctor`, `phc_staff`.
- **Request Schema:**
  ```json
  {
    "id": "k0000000-0000-0000-0000-000000000001",
    "patient_id": "e0000000-0000-0000-0000-000000000001",
    "source_facility_id": "c0000000-0000-0000-0000-000000000001",
    "target_facility_id": "c0000000-0000-0000-0000-000000000002",
    "urgency_tier": "urgent_amber",
    "specialty_requested": "Obstetrics & Gynecology",
    "clinical_summary": "High risk pregnancy (32 weeks) with severe nutritional anemia (Hb 7.8 g/dL). Requires specialized obstetric evaluation.",
    "assigned_asha_id": "a0000000-0000-0000-0000-000000000001",
    "client_created_at": "2026-09-18T10:15:00Z"
  }
  ```
- **Validation Rules:**
  - `urgency_tier` enum: `["emergency_red", "urgent_amber", "routine_green"]`.
  - `target_facility_id` must differ from `source_facility_id`.
  - Server auto-allocates tracking code: `REF-MH-[DIST]-[NUM/HEX]`.
- **Response Schema (`201 Created`):**
  ```json
  {
    "success": true,
    "data": {
      "id": "k0000000-0000-0000-0000-000000000001",
      "referral_tracking_code": "REF-MH-GAD-7821",
      "status": "initiated",
      "sync_version": 1
    }
  }
  ```

### 12.2 List Referrals (Incoming / Outgoing)
- **Method:** `GET`
- **Route:** `/referrals`
- **Purpose:** Lists referrals by direction (`incoming` at receiving facility, `outgoing` at referring facility).
- **Authentication:** Bearer JWT.
- **Role/Permission:** `mo_doctor`, `phc_staff`, `asha_anm`, `admin_governance`.
- **Query Parameters:**
  - `direction`: `incoming` or `outgoing`.
  - `facility_id`: Facility UUID.
  - `status`: Filter by status (`initiated`, `acknowledged`, `evaluated`, `completed`, `cancelled`).
  - `urgency_tier`: Filter by tier.
- **Response Schema (`200 OK`):**
  ```json
  {
    "success": true,
    "data": [
      {
        "id": "k0000000-0000-0000-0000-000000000001",
        "referral_tracking_code": "REF-MH-GAD-7821",
        "patient_name": "Kavita Madavi",
        "care_id": "CARE-MH-2026-A8F2",
        "source_facility_name": "Korpana Primary Health Centre",
        "target_facility_name": "Gadchiroli District Hospital",
        "urgency_tier": "urgent_amber",
        "specialty_requested": "Obstetrics & Gynecology",
        "status": "initiated",
        "initiated_at": "2026-09-18T10:15:00Z"
      }
    ]
  }
  ```

### 12.3 Acknowledge Referral (Receiving Facility)
- **Method:** `PATCH`
- **Route:** `/referrals/{id}/acknowledge`
- **Purpose:** Step 2 of Closed Loop. Receiving hospital confirms receipt of patient referral and reserves slot.
- **Authentication:** Bearer JWT.
- **Role/Permission:** `mo_doctor`, `phc_staff` at target facility.
- **Request Schema:**
  ```json
  {
    "acknowledging_notes": "Patient scheduled for specialist obstetric evaluation on arrival."
  }
  ```
- **Response Schema (`200 OK`):**
  ```json
  {
    "success": true,
    "data": {
      "id": "k0000000-0000-0000-0000-000000000001",
      "status": "acknowledged",
      "acknowledged_at": "2026-09-18T11:00:00Z"
    }
  }
  ```

### 12.4 Update Evaluation (Receiving Facility)
- **Method:** `PATCH`
- **Route:** `/referrals/{id}/evaluate`
- **Purpose:** Step 3 of Closed Loop. Specialist records clinical evaluation upon patient arrival.
- **Authentication:** Bearer JWT.
- **Role/Permission:** `mo_doctor` at target facility.
- **Request Schema:**
  ```json
  {
    "evaluation_notes": "Patient examined by Dr. Deshmukh. Blood transfusion completed. Hb raised to 9.2 g/dL."
  }
  ```
- **Response Schema (`200 OK`):**
  ```json
  {
    "success": true,
    "data": {
      "id": "k0000000-0000-0000-0000-000000000001",
      "status": "evaluated",
      "evaluated_at": "2026-09-18T14:30:00Z"
    }
  }
  ```

### 12.5 Complete Referral & Trigger Closed-Loop Follow-Up
- **Method:** `POST`
- **Route:** `/referrals/{id}/complete`
- **Purpose:** Step 4 & 5 of Closed Loop. Specialist completes referral discharge notes. **System automatically generates an assigned follow-up task** for the village ASHA/ANM.
- **Authentication:** Bearer JWT.
- **Role/Permission:** `mo_doctor` at target facility.
- **Request Schema:**
  ```json
  {
    "discharge_summary": "Discharged in stable condition. Oral iron therapy prescribed. Requires home check within 5 days.",
    "follow_up_due_days": 5,
    "follow_up_instructions": "Monitor for dizziness and adherence to iron supplements."
  }
  ```
- **Response Schema (`200 OK`):**
  ```json
  {
    "success": true,
    "data": {
      "referral_id": "k0000000-0000-0000-0000-000000000001",
      "status": "completed",
      "completed_at": "2026-09-18T16:00:00Z",
      "auto_created_follow_up": {
        "follow_up_id": "m0000000-0000-0000-0000-000000000001",
        "task_type": "post_referral_check",
        "assigned_asha_id": "a0000000-0000-0000-0000-000000000001",
        "due_date": "2026-09-23",
        "status": "pending"
      }
    }
  }
  ```

---

## 13. Diagnostics Endpoints

### 13.1 Order Point-of-Care Diagnostic Test
- **Method:** `POST`
- **Route:** `/diagnostics`
- **Purpose:** Records a routine point-of-care laboratory test (e.g. Hemoglobin strip, Blood Glucose, Urine Albumin).
- **Authentication:** Bearer JWT.
- **Role/Permission:** `mo_doctor`, `phc_staff`, `asha_anm`.
- **Request Schema:**
  ```json
  {
    "encounter_id": "f0000000-0000-0000-0000-000000000001",
    "patient_id": "e0000000-0000-0000-0000-000000000001",
    "facility_id": "c0000000-0000-0000-0000-000000000001",
    "test_name": "Hemoglobin (Strip Method)",
    "test_code": "LAB_HB",
    "test_category": "point_of_care"
  }
  ```
- **Response Schema (`201 Created`):**
  ```json
  {
    "success": true,
    "data": {
      "id": "l0000000-0000-0000-0000-000000000001",
      "status": "ordered",
      "ordered_at": "2026-09-18T10:10:00Z"
    }
  }
  ```

### 13.2 Record Diagnostic Test Result
- **Method:** `PATCH`
- **Route:** `/diagnostics/{id}/result`
- **Purpose:** Updates ordered test with measured values and clinical interpretation.
- **Authentication:** Bearer JWT.
- **Role/Permission:** `phc_staff`, `mo_doctor`, `asha_anm`.
- **Request Schema:**
  ```json
  {
    "result_value": "7.8",
    "result_unit": "g/dL",
    "reference_range": "11.0 - 15.0 g/dL",
    "clinical_interpretation": "Severe anemia"
  }
  ```
- **Response Schema (`200 OK`):**
  ```json
  {
    "success": true,
    "data": {
      "id": "l0000000-0000-0000-0000-000000000001",
      "status": "completed",
      "completed_at": "2026-09-18T10:20:00Z"
    }
  }
  ```

---

## 14. Essential Medicines & Service Availability Endpoints

### 14.1 Get Facility Medicine & Service Stock Status
- **Method:** `GET`
- **Route:** `/facilities/{facility_id}/availability`
- **Purpose:** Public and frontline visibility of stock status for essential medicines and services.
- **Authentication:** Public.
- **Query Parameters:** `category`: Optional filter (`essential_medicines`, `diagnostics`, `services`).
- **Response Schema (`200 OK`):**
  ```json
  {
    "success": true,
    "data": [
      {
        "id": "s0000000-0000-0000-0000-000000000001",
        "item_type": "medicine",
        "item_code": "MED_IFA",
        "item_name": "Iron Folic Acid (IFA) Tablets",
        "is_available": true,
        "stock_status": "adequate",
        "quantity_on_hand": 1200,
        "unit": "tablets",
        "last_updated_at": "2026-09-18T08:00:00Z"
      },
      {
        "id": "s0000000-0000-0000-0000-000000000002",
        "item_type": "medicine",
        "item_code": "MED_ORS",
        "item_name": "Oral Rehydration Salts (ORS)",
        "is_available": true,
        "stock_status": "low",
        "quantity_on_hand": 35,
        "unit": "packets",
        "last_updated_at": "2026-09-18T08:00:00Z"
      }
    ]
  }
  ```

### 14.2 Update Stock / Availability Status
- **Method:** `PUT`
- **Route:** `/facilities/{facility_id}/availability/{item_code}`
- **Purpose:** PHC Pharmacist or Medical Officer updates real-time availability.
- **Authentication:** Bearer JWT.
- **Role/Permission:** `phc_staff`, `mo_doctor`.
- **Request Schema:**
  ```json
  {
    "is_available": true,
    "stock_status": "adequate",
    "quantity_on_hand": 1500
  }
  ```
- **Validation:** `stock_status` enum: `["adequate", "low", "stock_out"]`.
- **Response Schema (`200 OK`):**
  ```json
  {
    "success": true,
    "data": {
      "item_code": "MED_IFA",
      "is_available": true,
      "stock_status": "adequate",
      "updated_at": "2026-09-19T10:00:00Z"
    }
  }
  ```

---

## 15. Follow-Ups Endpoints

### 15.1 Get Assigned ASHA Follow-Up Tasks
- **Method:** `GET`
- **Route:** `/follow-ups`
- **Purpose:** Retrieves assigned follow-up visit tasks categorized into: Overdue, Due Today, and Upcoming.
- **Authentication:** Bearer JWT.
- **Role/Permission:** `asha_anm`, `mo_doctor`, `phc_staff`.
- **Query Parameters:**
  - `asha_id`: User UUID (defaults to authenticated worker).
  - `status`: `pending`, `completed`, `missed`.
  - `urgency_filter`: `overdue`, `due_today`, `upcoming`.
- **Response Schema (`200 OK`):**
  ```json
  {
    "success": true,
    "data": {
      "overdue": [
        {
          "id": "m0000000-0000-0000-0000-000000000002",
          "patient_name": "Sita Bai",
          "care_id": "CARE-MH-2026-B101",
          "village": "Mendha Lekha",
          "task_type": "high_risk_pregnancy_visit",
          "due_date": "2026-09-17",
          "days_overdue": 2,
          "instructions": "Verify BP and check for ankle edema."
        }
      ],
      "due_today": [
        {
          "id": "m0000000-0000-0000-0000-000000000001",
          "patient_name": "Kavita Madavi",
          "care_id": "CARE-MH-2026-A8F2",
          "village": "Mendha Lekha",
          "task_type": "post_referral_check",
          "due_date": "2026-09-19",
          "instructions": "Check post-transfusion pallor and IFA compliance."
        }
      ],
      "upcoming": []
    }
  }
  ```

### 15.2 Mark Follow-Up Task Complete
- **Method:** `PATCH`
- **Route:** `/follow-ups/{id}/complete`
- **Purpose:** ASHA records completed home visit and updates patient condition.
- **Authentication:** Bearer JWT.
- **Role/Permission:** `asha_anm`, `mo_doctor`.
- **Request Schema:**
  ```json
  {
    "notes": "Home visit completed. Patient reports reduced fatigue. IFA tablets taken daily.",
    "patient_condition": "improving"
  }
  ```
- **Response Schema (`200 OK`):**
  ```json
  {
    "success": true,
    "data": {
      "id": "m0000000-0000-0000-0000-000000000001",
      "status": "completed",
      "completed_at": "2026-09-19T10:30:00Z"
    }
  }
  ```

---

## 16. Multilingual Notifications Endpoints

### 16.1 List User Notifications
- **Method:** `GET`
- **Route:** `/notifications`
- **Purpose:** Fetches localized SMS and In-App alert notifications for the authenticated user or patient.
- **Authentication:** Bearer JWT.
- **Role/Permission:** All authenticated roles.
- **Query Parameters:** `is_read`: Boolean (`true`/`false`).
- **Response Schema (`200 OK`):**
  ```json
  {
    "success": true,
    "data": [
      {
        "id": "n0000000-0000-0000-0000-000000000001",
        "title": "पाठपुरावा भेट स्मरणपत्र (Follow-up Reminder)",
        "message": "कविता मडावी यांच्यासाठी आज गृहभेटीचे नियोजन आहे.",
        "language": "mr",
        "notification_type": "follow_up_reminder",
        "is_read": false,
        "created_at": "2026-09-19T07:00:00Z"
      }
    ]
  }
  ```

### 16.2 Mark Notification as Read
- **Method:** `PATCH`
- **Route:** `/notifications/{id}/read`
- **Purpose:** Acknowledges receipt of notification.
- **Authentication:** Bearer JWT.
- **Role/Permission:** Recipient user.

---

## 17. Health Schemes & Guidance Endpoints

### 17.1 List Healthcare Schemes
- **Method:** `GET`
- **Route:** `/schemes`
- **Purpose:** Returns public Maharashtra and national health welfare schemes (PM-JAY, MJPJAY, JSSK, PMMVY).
- **Authentication:** Public.
- **Query Parameters:** `language`: Enum `["en", "hi", "mr"]` (default `en`).
- **Response Schema (`200 OK`):**
  ```json
  {
    "success": true,
    "data": [
      {
        "id": "MJPJAY",
        "scheme_name": "Mahatma Jyotirao Phule Jan Arogya Yojana",
        "scheme_name_mr": "महात्मा ज्योतिराव फुले जन आरोग्य योजना",
        "scheme_name_hi": "महात्मा ज्योतिराव फुले जन आरोग्य योजना",
        "coverage_amount_inr": 500000,
        "category": "health_insurance",
        "is_active": true
      },
      {
        "id": "JSSK",
        "scheme_name": "Janani Shishu Suraksha Karyakram",
        "scheme_name_mr": "जननी शिशु सुरक्षा कार्यक्रम",
        "scheme_name_hi": "जननी शिशु सुरक्षा कार्यक्रम",
        "coverage_amount_inr": 0,
        "category": "maternal_welfare",
        "is_active": true
      }
    ]
  }
  ```

### 17.2 Get Scheme Guidance & Eligibility Checklist
- **Method:** `GET`
- **Route:** `/schemes/{scheme_id}/guidance`
- **Purpose:** Returns step-by-step application guidance, eligibility rules, and required documentation in selected language.
- **Authentication:** Public.
- **Query Parameters:** `language`: `en`, `hi`, `mr`.
- **Response Schema (`200 OK`):**
  ```json
  {
    "success": true,
    "data": {
      "scheme_id": "MJPJAY",
      "language": "mr",
      "eligibility_criteria": [
        "पिवळे किंवा केशरी शिधापत्रिकाधारक कुटुंब",
        "महाराष्ट्रातील रहिवासी"
      ],
      "required_documents": [
        "शिधापत्रिका (Ration Card)",
        "आधार कार्ड (Aadhaar Card / Official Photo ID)"
      ],
      "application_steps": [
        "१. जवळच्या ग्रामीण किंवा जिल्हा रुग्णालयातील आरोग्यमित्राशी संपर्क साधा.",
        "२. आवश्यक कागदपत्रांची पडताळणी करा.",
        "३. मोफत उपचारासाठी ई-कार्ड तयार केले जाईल."
      ]
    }
  }
  ```

---

## 18. Offline Synchronization Endpoints

### 18.1 Push Offline Mutation Batch
- **Method:** `POST`
- **Route:** `/sync/push`
- **Purpose:** Flushes local Dexie.js mutation queues from frontline PWA clients to the backend upon reconnecting.
- **Authentication:** Bearer JWT.
- **Role/Permission:** `asha_anm`, `mo_doctor`, `phc_staff`.
- **Request Schema:**
  ```json
  {
    "client_device_id": "dev_moto_g24_asha_01",
    "events": [
      {
        "client_event_id": "9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d",
        "entity_table": "patients",
        "action": "CREATE",
        "record_id": "e0000000-0000-0000-0000-000000000001",
        "client_version": 1,
        "client_timestamp": "2026-09-18T09:30:00Z",
        "payload": {
          "id": "e0000000-0000-0000-0000-000000000001",
          "care_id": "CARE-MH-2026-A8F2",
          "first_name": "Kavita",
          "last_name": "Madavi",
          "gender": "female",
          "district": "Gadchiroli",
          "taluka": "Aheri",
          "village": "Mendha Lekha",
          "is_high_risk": true
        }
      },
      {
        "client_event_id": "a2c3d4e5-6f7a-8b9c-0d1e-2f3a4b5c6d7e",
        "entity_table": "encounters",
        "action": "CREATE",
        "record_id": "f0000000-0000-0000-0000-000000000001",
        "client_version": 1,
        "client_timestamp": "2026-09-18T10:00:00Z",
        "payload": {
          "id": "f0000000-0000-0000-0000-000000000001",
          "patient_id": "e0000000-0000-0000-0000-000000000001",
          "encounter_type": "asha_home_visit",
          "chief_complaint": "Fatigue and dizziness"
        }
      }
    ]
  }
  ```
- **Validation & Processing Logic:**
  1. Server inspects unique constraint `(user_id, client_event_id)`: if already processed, skips idempotently.
  2. Resolves foreign keys within the batch (patients created first, encounters second).
  3. Detects conflicts: if server `sync_version` > `client_version`, server applies deterministic conflict resolution (server-latest wins, logged to audit).
- **Response Schema (`200 OK`):**
  ```json
  {
    "success": true,
    "data": {
      "processed_count": 2,
      "results": [
        {
          "client_event_id": "9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d",
          "status": "applied",
          "record_id": "e0000000-0000-0000-0000-000000000001",
          "server_version": 1
        },
        {
          "client_event_id": "a2c3d4e5-6f7a-8b9c-0d1e-2f3a4b5c6d7e",
          "status": "applied",
          "record_id": "f0000000-0000-0000-0000-000000000001",
          "server_version": 1
        }
      ]
    }
  }
  ```

### 18.2 Pull Incremental Delta Changes
- **Method:** `GET`
- **Route:** `/sync/pull`
- **Purpose:** Downloads new or updated records modified since `since_timestamp` for the worker's operational catchment.
- **Authentication:** Bearer JWT.
- **Role/Permission:** `asha_anm`, `mo_doctor`, `phc_staff`.
- **Query Parameters:**
  - `since_timestamp`: ISO8601 string (e.g. `2026-09-18T00:00:00Z`).
  - `facility_id`: Facility UUID.
- **Response Schema (`200 OK`):**
  ```json
  {
    "success": true,
    "data": {
      "server_timestamp": "2026-09-19T10:45:00Z",
      "patients": [ ... ],
      "encounters": [ ... ],
      "referrals": [ ... ],
      "follow_ups": [ ... ],
      "deleted_record_ids": {
        "follow_ups": ["m0000000-0000-0000-0000-000000000099"]
      }
    }
  }
  ```

---

## 19. Government & Facility Visibility Analytics Endpoints

### 19.1 Get Overview Health System KPIs
- **Method:** `GET`
- **Route:** `/analytics/overview`
- **Purpose:** Provides district and state administrators aggregated, anonymized system performance indicators.
- **Safety Boundary:** Purely telemetry and aggregate counts. Zero patient PII, zero ICD diagnosis codes, zero hospital bed tracking, zero ambulance tracking.
- **Authentication:** Bearer JWT.
- **Role/Permission:** `admin_governance`, `mo_doctor`.
- **Query Parameters:**
  - `district`: Optional district filter (`Gadchiroli`, `Nashik`, `Pune`).
  - `taluka`: Optional taluka filter.
  - `time_period`: Enum `["7d", "30d", "90d", "ytd"]` (default `30d`).
- **Response Schema (`200 OK`):**
  ```json
  {
    "success": true,
    "data": {
      "total_facilities_monitored": 5,
      "referral_volume": 12,
      "closed_loop_completion_rate_percent": 75.0,
      "follow_up_adherence_rate_percent": 88.5,
      "triage_urgency_distribution": {
        "emergency_red": 3,
        "urgent_amber": 5,
        "routine_green": 4
      },
      "offline_sync_resilience_rate_percent": 99.4,
      "anonymized_governance_notice": "Aggregated administrative indicators. Compliant with DISHA principles."
    }
  }
  ```

### 19.2 Get Closed-Loop Referral Funnel
- **Method:** `GET`
- **Route:** `/analytics/referral-funnel`
- **Purpose:** Visualizes stage-by-stage progression across the referral continuum: Initiated $\rightarrow$ Acknowledged $\rightarrow$ Evaluated $\rightarrow$ Completed.
- **Authentication:** Bearer JWT.
- **Role/Permission:** `admin_governance`, `mo_doctor`.
- **Response Schema (`200 OK`):**
  ```json
  {
    "success": true,
    "data": {
      "funnel": {
        "initiated": 12,
        "acknowledged": 10,
        "evaluated": 9,
        "completed": 9
      },
      "specialty_distribution": {
        "Obstetrics & Gynecology": 5,
        "Pediatrics": 3,
        "General Medicine": 4
      },
      "median_acknowledgement_time_hours": 1.5,
      "median_completion_time_days": 2.2
    }
  }
  ```

### 19.3 Get Service Availability & Facility Readiness Metrics
- **Method:** `GET`
- **Route:** `/analytics/service-readiness`
- **Purpose:** Monitors essential medicine stock levels and active service coverage across public health centers.
- **Authentication:** Bearer JWT.
- **Role/Permission:** `admin_governance`.
- **Response Schema (`200 OK`):**
  ```json
  {
    "success": true,
    "data": {
      "facilities_reporting": 5,
      "essential_services_coverage_percent": 92.0,
      "essential_medicines_stock_adequacy_percent": 86.4,
      "critical_stock_out_alerts": [
        {
          "facility_name": "Aheri Sub-Center",
          "district": "Gadchiroli",
          "item_name": "Oral Rehydration Salts (ORS)",
          "status": "low"
        }
      ]
    }
  }
  ```

---

## 20. End-to-End Consistency Matrix

| Domain | PRD v1.0 Section | TRD v1.0 Section | Backend Schema Table | API Route Base |
|---|---|---|---|---|
| **Auth & Session** | §5 Roles & Permissions | §5 & §6 Auth/RBAC | `users`, `roles` | `/auth` |
| **Patients** | §9 Citizen Flow | §17 Security & Privacy | `patients` | `/patients` |
| **Health Records** | §10 & §12 Continuity | §12 Longitudinal Care | `health_records`, `encounters` | `/patients/{id}/health-record` |
| **Encounters** | §10 ASHA & §11 PHC | §12 Care Workflow | `encounters` | `/encounters` |
| **Triage** | §10 & §11 Assistive Triage | §9 & §10 Assistive AI | `triage_assessments` | `/triage/assess` |
| **Facilities** | §14 Discovery | §14 Discovery Architecture | `facilities` | `/facilities` |
| **Services Catalog** | §14 Discovery | §14 Discovery Architecture | `facility_services` | `/facilities/{id}/services` |
| **Appointments** | §13 Appointment/Queue | §13 Queue Architecture | `appointments` | `/appointments` |
| **Priority Queues** | §13 Queue Architecture | §13 Priority Sorting | `queues` | `/queues` |
| **Consultations** | §13 Teleconsultation | §13 Teleconsult WebRTC | `consultations` | `/consultations` |
| **Referrals** | §12 Closed-Loop Continuum | §12 Referral Lifecycle | `referrals` | `/referrals` |
| **Diagnostics** | §11 PHC Workflow | §12 Diagnostics Flow | `diagnostics` | `/diagnostics` |
| **Availability** | §14 Service Visibility | §14 Availability Sync | `services_availability` | `/facilities/{id}/availability` |
| **Follow-Ups** | §15 Follow-Up Tasks | §12 Continuity Tasks | `follow_ups` | `/follow-ups` |
| **Notifications** | §10 & §15 Reminders | §11 Trilingual Service | `notifications` | `/notifications` |
| **Schemes** | §17 Welfare Schemes | §14 Schemes Architecture | `schemes`, `scheme_guidance` | `/schemes` |
| **Offline Sync** | §18 Offline-First | §7 & §8 Sync Engine | `offline_sync_events` | `/sync` |
| **Analytics** | §16 Admin Dashboard | §15 Telemetry Engine | Aggregated Views | `/analytics` |

---

## 21. Compliance & Security Audit Verification

1. **Strict SIH26133 Scope Compliance:**
   - Zero water or water sensor endpoints.
   - Zero epidemic or outbreak prediction endpoints.
   - Zero ambulance fleet or GPS tracking endpoints.
   - Zero hospital bed tracking or bed management endpoints.
   - Zero autonomous diagnostic generation endpoints.
   - Zero automatic prescription generation endpoints.

2. **Interoperability & Identity Truthfulness:**
   - Patient identifier strictly adheres to neutral standard: `CARE-MH-YYYY-XXXX`.
   - Zero unverified claims of active ABDM/ABHA integration.
   - Future standards alignment fields reserved under neutral schemas.

3. **Clinical Safety & Non-Diagnostic Guarantee:**
   - All triage and clinical endpoints mandate `non_diagnostic_disclaimer` field.
   - Clinical advice fields represent certified human provider entries only.

4. **Trilingual Governance:**
   - Supports `en`, `hi`, and `mr` localization through `Accept-Language` headers and dedicated localized text fields.
