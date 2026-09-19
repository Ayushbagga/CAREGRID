# CAREGRID UI/UX Design Specification v1.0

**Document Reference:** CAREGRID-DOC-UIUX-V1.0  
**Problem Statement:** SIH26133 — Accessibility & Quality of Public Healthcare in Rural/Underserved Areas  
**Target Beneficiary:** Government of Maharashtra (Public Health Department)  
**Status:** Approved Design Specification  
**Companion Documents:**  
- [`docs/PRD-v1.0.md`](./PRD-v1.0.md) (Product Requirements Document v1.0)  
- [`docs/TRD-v1.0.md`](./TRD-v1.0.md) (Technical Requirements Document v1.0)  
- [`docs/Backend-Schema-v1.0.md`](./Backend-Schema-v1.0.md) (Backend Database Schema v1.0)  
- [`docs/API-Contract-v1.0.md`](./API-Contract-v1.0.md) (API Contract v1.0)  
- [`docs/Security-Privacy-v1.0.md`](./Security-Privacy-v1.0.md) (Security & Privacy Specification v1.0)  
- [`docs/AI-ML-Specification-v1.0.md`](./AI-ML-Specification-v1.0.md) (AI/ML Specification v1.0)  

---

## 1. Design Principles

The CAREGRID design language is grounded in the operational realities of rural Indian public healthcare: intermittent connectivity, low-cost Android smartphones with small displays, outdoor glare in village field visits, and diverse levels of digital literacy among citizens and community workers.

1. **Clarity Over Novelty (Clinical Pragmatism):**
   - The interface is clean, uncluttered, and purposeful.
   - **Zero "magic AI sparkles" or sci-fi visual gimmicks.** Assistive AI features are rendered as calm, authoritative clinical status badges (`EMERGENCY RED`, `URGENT AMBER`, `ROUTINE GREEN`) with explicit protocol citations.
2. **Speed & Glanceability:**
   - Frontline ASHA workers must assess a patient and log vital signs in under 90 seconds.
   - Critical triage indicators and red flags must be recognizable within 500 milliseconds through distinct high-contrast color coding and standardized icons.
3. **Pervasive State Awareness (Offline-First Visibility):**
   - Connectivity state (`Online`, `Offline`, `Syncing`) is permanently anchored in the global header so workers never wonder if their data is safe.
4. **Trilingual Dignity & Parity:**
   - Marathi (`मराठी`), Hindi (`हिंदी`), and English are first-class peers. The UI accommodates Devanagari text expansion (typically 15–25% longer than English strings) without clipping or awkward overflow.
5. **Human-in-the-Loop Clinical Authority:**
   - Every assistive suggestion features a clear, non-diagnostic disclaimer and requires human confirmation before a referral or appointment is submitted.

> [!NOTE]
> **Demo / Sample Data Disclaimers:**
> 1. **District Names as Demo Placeholders:** All district references (e.g., Gadchiroli, Nashik, Pune) appearing in this specification, UI mockups, and prototypes are strictly illustrative sample/demo placeholders for hackathon evaluation and do NOT denote confirmed or approved deployment locations.
> 2. **Mock Health Identifiers:** All identifiers in format `CARE-MH-...` (e.g. `CARE-MH-2026-A8F2`) shown across screens are purely synthetic demo/mock placeholders and do NOT represent real, issued, or official government health IDs.


---

## 2. Information Architecture (IA)

```
                                  CAREGRID IA
                                       │
         ┌─────────────────────────────┼─────────────────────────────┐
         ▼                             ▼                             ▼
   CITIZEN PORTAL              HEALTHCARE WORKER           GOVERNMENT & ADMIN
   (Public Access)                 WORKSPACES             (Governance Telemetry)
         │                             │                             │
 ┌───────┴───────┐             ┌───────┴───────┐             ┌───────┴───────┐
 ▼               ▼             ▼               ▼             ▼               ▼
Facility      Health ID      ASHA / ANM     Doctor / PHC   District       Referral
Discovery     & Timeline     Field Mode     OPD & Tele     Overview       Funnel
& Services    (CARE-MH-...   (Intake/Task)  (Queue/Notes)  & Facility     & Adherence
              Demo Mock)                                   Readiness      Metrics
```

---

## 3. Global Navigation Structure

### 3.1 Desktop / Tablet Navigation (Top Bar + Contextual Rail)
- **Top Application Header (Height: 64px):**
  - **Left:** CAREGRID Logo + Government of Maharashtra Public Health emblem + "Rural Health Access Platform" subtitle.
  - **Center:** Quick Workspace Switcher (Citizen | ASHA Field | Doctor OPD | Referral Desk | Admin Dashboard).
  - **Right:**
    - Network Connectivity Indicator Pill (`🟢 Online` / `🟡 Offline (3 unsynced)` / `🔵 Syncing`).
    - Dedicated Trilingual Switcher Dropdown (`English` | `हिंदी` | `मराठी`).
    - User Profile Avatar & Role Badge (`Sunita Patil • ASHA`).

### 3.2 Mobile Navigation (Bottom Action Bar)
Frontline mobile viewports (< 768px) utilize a persistent **Bottom Navigation Bar (Height: 64px)** with 4 core destinations:
1. **Home / Intake (`गृह / नोंदणी`)** — Icon: Clipboard-Plus.
2. **Tasks & Follow-ups (`पाठपुरावा कार्ये`)** — Icon: Calendar-Check with pending badge counter.
3. **Referrals (`संदर्भ सेवा`)** — Icon: Git-Commit / Arrow-Up-Right.
4. **Offline Sync (`सिंक स्थिती`)** — Icon: Refresh-Cw with pending item dot.

---

## 4. Design System & Tokens

### 4.1 Grid & Spacing
- **Base Unit:** 4px grid.
- **Common Spacers:**
  - `space-1`: 4px (tight badge padding)
  - `space-2`: 8px (icon gaps, chip margins)
  - `space-3`: 12px (card inner padding compact)
  - `space-4`: 16px (standard component padding)
  - `space-6`: 24px (card sections, form grouping)
  - `space-8`: 32px (page margins on desktop)
- **Container Max-Width:** 1280px for desktop dashboards; 100% width with 16px side gutters on mobile.

---

## 5. Typography

Typography is optimized for cross-platform legibility in both Latin and Devanagari scripts:

- **Latin Font Family:** `Inter`, `-apple-system`, `BlinkMacSystemFont`, `Segoe UI`, `Roboto`, `sans-serif`.
- **Devanagari Font Family:** `Noto Sans Devanagari`, `Mukta`, `system-ui`.
- **Typographic Scale & Hierarchy:**

| Token | Size | Line Height | Weight | Devanagari Adjustment | Usage |
|---|---|---|---|---|---|
| `display-lg` | 32px | 40px | 700 (Bold) | +4px line height | Hero titles, Public landing banners |
| `heading-xl` | 24px | 32px | 600 (Semibold)| +4px line height | Dashboard view titles, Module headers |
| `heading-md` | 18px | 26px | 600 (Semibold)| +2px line height | Section cards, Modal headers |
| `body-lg` | 16px | 24px | 400 / 500 | +2px line height | Form input text, Primary button text |
| `body-md` | 14px | 20px | 400 (Regular) | Standard | Table cells, Timeline body, Descriptions |
| `caption-sm`| 12px | 16px | 500 (Medium)  | Standard | Status pills, Table headers, Helper labels |

---

## 6. Color System

The palette uses **medical-grade clinical tones**, prioritizing accessibility, semantic urgency recognition, and outdoor contrast:

```
                          CAREGRID COLOR PALETTE
┌─────────────────────────────────────────────────────────────────────────────┐
│ PRIMARY BRAND & GOVERNMENT THEME                                            │
│ Primary Teal (Trust & Health):   #0D9488 (Teal 600) / #0F766E (Teal 700)     │
│ Deep Slate (Structure/Header):   #0F172A (Slate 900) / #1E293B (Slate 800)  │
│ Accent Navy (Official Accents):  #1E3A8A (Blue 900)                         │
├─────────────────────────────────────────────────────────────────────────────┤
│ SEMANTIC CLINICAL TRIAGE COLORS (NON-DIAGNOSTIC)                            │
│ Emergency Red:   Bg: #FEF2F2 | Border: #F87171 | Text: #991B1B (Red 800)   │
│ Urgent Amber:    Bg: #FFFBEB | Border: #FBBF24 | Text: #92400E (Amber 800) │
│ Routine Green:   Bg: #F0FDF4 | Border: #4ADE80 | Text: #166534 (Green 800) │
├─────────────────────────────────────────────────────────────────────────────┤
│ SYSTEM NEUTRALS & BACKGROUNDS                                               │
│ Page Background: #F8FAFC (Slate 50)                                         │
│ Card Surface:    #FFFFFF (Pure White)                                       │
│ Dividers/Borders:#E2E8F0 (Slate 200)                                        │
│ Text Primary:    #0F172A (Slate 900) — Contrast Ratio 14.2:1 against White   │
│ Text Secondary:  #475569 (Slate 600) — Contrast Ratio 5.8:1 against White    │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 7. Component System

1. **Clinical Action Cards (`ClinicalCard`):**
   - Pure white surface, subtle slate border (`1px solid #E2E8F0`), mild drop shadow (`shadow-sm`).
   - Distinct semantic left border (4px accent) indicating state or urgency.
2. **Interactive Triage Urgency Badge (`TriageBadge`):**
   - High-contrast pill with accompanying SVG shape icon (Square for Green, Triangle for Amber, Octagon for Red) to support color-blind users.
3. **Touch-Optimized Inputs (`FormInput`, `NumberStepper`):**
   - Minimum height: 48px.
   - Large numeric keypads automatically invoked on mobile (`inputMode="decimal"`).
   - Instant validation indicators with localized help text.
4. **State Transition Buttons (`ProgressButton`):**
   - High-contrast states: Default, Hover, Focused (visible 2px teal focus ring), Disabled (accessible 40% opacity), Loading (inline spinning indicator).

---

## 8. Responsive & Mobile-First Behavior

- **Mobile Viewport (360px – 767px):** Single-column stacked layout. Bottom navigation bar. Sticky action buttons at the bottom of forms (e.g. "Save & Evaluate" pinned to bottom).
- **Tablet Viewport (768px – 1023px):** 2-column layout. Split-screen triage runner (vitals on left, assistive evaluation on right).
- **Desktop Viewport (1024px+):** Full 3-column / multi-panel layout for doctors and administrators (live OPD queue rail on left, clinical consultation canvas in center, patient history timeline on right).

---

## 9. Accessibility Requirements (WCAG 2.1 Level AA)

1. **Color Contrast:** All body text meets or exceeds a **4.5:1** contrast ratio against backgrounds. Large text ($\ge 18\text{px}$) meets **3:1**.
2. **Touch Targets:** All interactive elements (buttons, inputs, language switches) have a minimum touch target size of **48 × 48 px**.
3. **Color-Blind Safe:** Clinical urgency never relies on color alone; always paired with text labels and geometric icons (● Red Octagon, ▲ Amber Triangle, ■ Green Square).
4. **Keyboard & Screen Reader Navigation:** Full ARIA roles (`role="alert"`, `aria-live="polite"` for queue updates, `aria-expanded` for language switcher).

---

## 10. Low-Digital-Literacy UX Design

In rural Maharashtra, many patients and some newly recruited community workers have limited experience with complex software:

1. **Visual Symbol Priming:** Every key concept has an intuitive icon accompanying the text (e.g. Blood Drop for Hemoglobin, Pulse Wave for Heart Rate, Stethoscope for Doctor).
2. **Visual Status Progress Bars:** Follow-up and referral stages are rendered as horizontal step trackers (`नोंदणी` $\rightarrow$ `तपासणी` $\rightarrow$ `संदर्भ सेवा` $\rightarrow$ `पूर्ण`) rather than abstract text dropdowns.
3. **Color-Coded Task Urgency:** Overdue tasks feature high-contrast red warning chips, Due Today tasks show amber, and Upcoming tasks show neutral slate.
4. **One-Tap Dialing:** Emergency referral and ambulance coordination contacts feature prominent green phone tap buttons that directly open the device dialer with verified numbers.

---

## 11. Multilingual Architecture & Language Switcher Behavior

1. **Language Control Placement:** Anchored permanently at the top-right of every screen for instant discoverability.
2. **Direct 1-Click Selection:** Click/tap opens an accessible popover presenting:
   - `English`
   - `हिंदी (Hindi)`
   - `मराठी (Marathi)`
3. **Dynamic Re-rendering Without Page Reload:** UI state, form inputs, and active queue lists persist seamlessly across language switches.
4. **Devanagari Typographic Breathing Room:** Devanagari line height is automatically boosted by `+2px` to `+4px` in CSS to prevent matra/diacritic clipping.

---

## 12. Citizen Screens

1. **Citizen Home & Search:** Clean hero banner with quick links: "Find Nearest Public Hospital", "Check Doctor Availability", "My Health Timeline", "Healthcare Schemes".
2. **Public Facility & Service Discovery:**
   - Filter by Sample Demo Districts (`Gadchiroli`, `Nashik`, `Pune` — illustrative placeholders only, not confirmed rollout sites), Taluka, and Facility Type (PHC, RH, SDH, DH).
   - Facility cards displaying operating hours, distance, available services (ANC, Lab, Teleconsultation), and verified contact phone.
3. **My Health Record Timeline:**
   - Patient enters their neutral identifier (e.g. `CARE-MH-2026-A8F2` — demo/mock placeholder only, not a real health ID) and receives a chronological care timeline.
   - Clean badges demarcating ASHA home visits, PHC checkups, laboratory results, and referral completions.
4. **Scheme Eligibility & Guidance:**
   - Interactive checklist for MJPJAY, PM-JAY, JSSK.
   - Plain-language document requirements (Ration card, Aadhaar card).

---

## 13. ASHA / ANM Frontline Screens

1. **ASHA Field Home & Task Hub:**
   - Prominent KPI tiles: `Pending Follow-ups`, `Due Today`, `Offline Queue Count`.
   - Big "+ New Patient Registration" floating action button.
2. **Offline Patient Intake & Vitals Entry:**
   - Stepper form with large numerical pads for BP, Pulse, SpO2, and point-of-care Hemoglobin.
   - Immediate out-of-range visual warnings.
3. **Assistive Triage Execution Modal:**
   - Live rendering of suggested urgency tier with protocol citation and human review checkbox.
4. **Sync Center & Local Data Vault:**
   - Shows count of locally stored records, last sync timestamp, and manual "Sync Now" button.

---

## 14. Doctor / PHC Screens

1. **PHC OPD Priority Queue:**
   - Real-time patient queue sorted strictly by `priority_level ASC, queue_number ASC`.
   - Emergency Red patients visually distinct at top of list.
   - "Call Next Patient" button.
2. **Doctor Consultation Canvas:**
   - 3-panel split view: Patient Vitals & History (left), Live Consultation / Tele-pod Notes (center), Diagnostic & Referral Orders (right).
3. **Specialist Teleconsultation Pod Screen:**
   - Integrated WebRTC video frame, live audio controls, real-time shared vitals stream, and specialist counter-notes documentation box.

---

## 15. Closed-Loop Referral Screens

1. **Create Referral View:**
   - Select target facility from verified public directory, specialty needed, urgency tier, and clinical summary.
   - Visual estimation of travel distance and receiving facility readiness.
2. **Receiving Facility Referral Desk:**
   - Incoming referrals tab with "Acknowledge Receipt" button.
   - Status transitions to `acknowledged`.
3. **Specialist Evaluation & Discharge View:**
   - Form to record clinical findings, discharge advice, and scheduled follow-up days (default: 5 days).
   - "Complete Referral" button triggers automated ASHA follow-up task.

---

## 16. Appointment & Live Queue Screens

1. **Appointment Scheduler:**
   - Calendar date picker and 30-minute time slot selection for PHC OPD or specialist teleconsultation.
2. **Live Facility Queue Display (Kiosk / Desk Mode):**
   - High-contrast, large-font public display showing: Token Number (e.g. `Q-001`), Urgency Tier, Counter/Room Number, and Status (`Calling`, `In Consultation`).

---

## 17. Follow-Up Task Management Screens

1. **Follow-Up Matrix View:**
   - 3 dedicated tabs: **Overdue (लाल)**, **Due Today (पिवळा)**, **Upcoming (हिरवा)**.
   - Patient name, village, task type (`post_referral_check`, `high_risk_pregnancy_visit`), and target due date.
2. **Home Visit Completion Modal:**
   - Checkbox checklist for ASHA: "Vitals Checked", "Medicine Compliance Verified", "Dizziness / Pallor Checked".
   - Notes field and "Mark Complete" button.

---

## 18. Government & Facility Visibility Dashboard

1. **District & Taluka Filter Bar:** Instant switching between sample demo districts (`Gadchiroli`, `Nashik`, `Pune` — illustrative placeholders only, not confirmed rollout sites) or State Aggregate view.
2. **Referral Continuum Funnel Card:** Visual funnel showing drop-off rates across Initiated $\rightarrow$ Acknowledged $\rightarrow$ Evaluated $\rightarrow$ Completed.
3. **Triage Urgency Ratio Chart:** Pie / bar representation of Emergency Red vs Urgent Amber vs Routine Green.
4. **Essential Medicine Stock Readiness Grid:** Matrix of facilities showing green/amber/red stock status for IFA, ORS, and Paracetamol.
5. **Data Privacy Notice:** Prominent banner: *"Anonymized administrative telemetry. No individual patient identifiable data is processed."*

---

## 19. AI Triage UI & Safety Disclaimer Component

### 19.1 Component Layout
```
┌─────────────────────────────────────────────────────────────────────────────┐
│ ⚠️ ASSISTIVE CLINICAL ROUTING RECOMMENDATION                                │
├─────────────────────────────────────────────────────────────────────────────┤
│ [ ▲ URGENT AMBER ] Priority Score: 2                                        │
│                                                                             │
│ Recommended Action:                                                         │
│ Refer to Medical Officer at PHC or District Hospital within 24 hours.       │
│                                                                             │
│ Triggered Factors:                                                          │
│ • Severe Gestational Anemia: Hemoglobin 7.8 g/dL in 3rd trimester (< 8.0)  │
│                                                                             │
│ ─────────────────────────────────────────────────────────────────────────── │
│ ⚖️ Non-Diagnostic Notice:                                                  │
│ This system provides assistive clinical decision support based on NHM       │
│ guidelines. It does NOT diagnose diseases or prescribe medication.          │
│ Qualified healthcare worker review and confirmation is mandatory.           │
│                                                                             │
│ [x] I confirm this clinical evaluation and authorize the referral.          │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 20. Offline & Sync States

1. **Header Connectivity Pills:**
   - `🟢 Online`: Connected to central server.
   - `🟡 Offline Mode (5)`: Local mode active; 5 unsynced records safely stored in device IndexedDB.
   - `🔵 Syncing...`: Active background synchronization in progress.
2. **Sync Conflict Resolution Dialog:**
   - Clear side-by-side comparison if a record was updated simultaneously; default rule keeps latest server state while saving offline copy as duplicate draft.

---

## 21. Loading, Error & Empty States

1. **Skeletons:** Animated pulse skeletons (`bg-slate-200`) mimicking card shapes to prevent layout shift (CLS).
2. **Empty States:** Friendly, actionable empty states with illustrations and primary action buttons (e.g. "No pending follow-ups today. Great job! Tap + to register a patient").
3. **Error Recovery Banners:** Clear error message in local language with a prominent "Retry" button.

---

## 22. Role-Based Navigation Routing

The application dynamically adapts available routes and navigation items based on the active user role:
- **`citizen`:** Home, Find Facility, My Timeline, Schemes.
- **`asha_anm`:** Field Home, New Intake, Follow-ups, Sync Center.
- **`mo_doctor`:** Doctor OPD, Live Queue, Teleconsultation, Referrals, Patient Search.
- **`admin_governance`:** District Overview, Referral Funnel, Service Readiness, Quality Analytics.

---

## 23. Progressive Web App (PWA) Considerations

1. **Manifest Configuration:**
   - `name`: "CAREGRID Maharashtra"
   - `short_name`: "CAREGRID"
   - `display`: "standalone"
   - `theme_color`: "#0D9488" (Teal 600)
   - `background_color`: "#F8FAFC" (Slate 50)
2. **Service Worker Strategy:**
   - Static assets (HTML, CSS, JS, icons): Cache-First.
   - API telemetry & live queues: Network-First with IndexedDB fallback.
3. **Hardware Storage Alert:** Warns worker if device storage drops below 50 MB.

---

## 24. Prototype & Demo Flow (End-to-End Walkthrough)

The recommended demonstration walkthrough for hackathon evaluators and public health stakeholders (*Note: All district names, village names, and patient IDs below are illustrative demo/mock placeholders*):
1. **Step 1: Frontline Field Intake (ASHA Persona):**
   - Open ASHA workspace $\rightarrow$ register high-risk pregnant patient in Mendha Lekha village (sample demo catchment) $\rightarrow$ record Hb 7.8 g/dL.
2. **Step 2: Assistive Triage Execution:**
   - System flags `URGENT AMBER` $\rightarrow$ displays rule explainability $\rightarrow$ worker confirms non-diagnostic disclaimer.
3. **Step 3: Closed-Loop Referral Creation:**
   - ASHA creates referral to sample District Hospital (e.g., Gadchiroli placeholder) for Obstetric review.
4. **Step 4: Hospital Specialist Acknowledgement & Evaluation:**
   - Switch to Doctor Persona $\rightarrow$ acknowledge incoming referral $\rightarrow$ record evaluation & discharge summary.
5. **Step 5: Automated Closed-Loop Follow-Up:**
   - Switch back to ASHA Persona $\rightarrow$ view newly created "Post-Referral Check" task in "Due Today" tab $\rightarrow$ mark home visit completed.
6. **Step 6: Government Visibility Dashboard:**
   - Switch to Admin Persona $\rightarrow$ observe real-time referral completion rate and district follow-up adherence increment on sample district telemetry (e.g. Gadchiroli demo view).

---

## 25. Google Stitch Screen Recreation Plan

For high-fidelity interactive UI prototyping in Google Stitch, the following **5 pivotal screens** must be recreated (*all IDs and districts shown in mockups are illustrative demo/sample placeholders*):

| # | Screen Name | Route / Context | Primary User Value & Visual Focus |
|---|---|---|---|
| 1 | **ASHA Frontline Intake & Triage Runner** | `/asha/intake` | Touch-optimized vitals entry, immediate out-of-range feedback, `urgent_amber` badge, and non-diagnostic safety disclaimer card. |
| 2 | **Doctor OPD Priority Queue & Tele-Pod** | `/doctor/queue` | Real-time emergency priority-sorted queue (`emergency_red` at top), WebRTC video frame, and specialist counter-notes canvas. |
| 3 | **Closed-Loop Referral Continuum Tracker** | `/referrals/tracking` | Multi-stage lifecycle visualizer (Initiated $\rightarrow$ Acknowledged $\rightarrow$ Evaluated $\rightarrow$ Completed), tracking code display (`REF-MH-GAD-7821` demo placeholder). |
| 4 | **Longitudinal Care Timeline (Citizen/Provider)**| `/patients/{id}/timeline`| Chronological visual care events (vitals, encounters, referrals, lab tests, follow-ups) under neutral ID `CARE-MH-2026-A8F2` (demo mock placeholder). |
| 5 | **District Public Health Governance Dashboard** | `/admin/dashboard` | Maharashtra sample demo district filter (`Gadchiroli`, `Nashik`, `Pune` — illustrative placeholders), referral funnel metrics, triage distribution, and service readiness grid. |

