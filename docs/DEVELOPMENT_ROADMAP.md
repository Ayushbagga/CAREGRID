# CAREGRID: Phased Development Roadmap

> **SIH Problem Statement**: SIH26133 — Accessibility & Quality of Public Healthcare in Rural/Underserved Areas  
> **Target Jurisdiction**: Government of Maharashtra (Public Health Department)  
> **Team**: The Glitch Gang (Team ID: 129855)  

---

## 1. Roadmap Overview

```mermaid
gantt
    title CAREGRID Development Roadmap (SIH26133)
    dateFormat  YYYY-MM-DD
    section Phase 1: Architecture & Foundation
    Clean Project Architecture & Docs         :done, p1a, 2026-09-18, 1d
    Schema & RLS Design                       :done, p1b, 2026-09-18, 1d
    AI Triage Service Skeleton                :active, p1c, 2026-09-18, 2d
    section Phase 2: Core Patient & Offline
    Offline IndexedDB & PWA Caching           :p2a, 2026-09-20, 3d
    ASHA Registration & Vitals Intake         :p2b, 2026-09-21, 3d
    Bi-directional Sync Worker                :p2c, 2026-09-23, 2d
    section Phase 3: PHC & Doctor OPD
    Prioritized OPD Queue UI                  :p3a, 2026-09-25, 3d
    Doctor Clinical Notes & Formulary         :p3b, 2026-09-26, 3d
    Rural Teleconsultation WebRTC             :p3c, 2026-09-28, 2d
    section Phase 4: Closed-Loop Referral
    Referral Initiation & Facility Matching   :p4a, 2026-09-30, 3d
    Receiving Facility Acknowledgment & Beds  :p4b, 2026-10-02, 3d
    Discharge Counter-Referral to ASHA        :p4c, 2026-10-04, 2d
    section Phase 5: State Analytics & Polish
    District & State Healthcare Dashboard     :p5a, 2026-10-06, 3d
    Multilingual Polish (Marathi/Hindi/En)    :p5b, 2026-10-08, 2d
    Field Testing & Security Audit            :p5c, 2026-10-09, 2d
```

---

## 2. Milestone Deliverables

### Phase 1: Architecture, Schemas & AI Microservice Foundation (Current)
- [x] Production repository layout without legacy water-monitoring artifacts.
- [x] Comprehensive architecture, database schema, security/privacy, and clinical triage documentation.
- [x] Production `.gitignore` and `.env.example`.
- [x] Complete PostgreSQL database migration scripts with enums, tables, and Row-Level Security (RLS).
- [x] Seed data with realistic Maharashtra public healthcare facilities (Nashik, Gadchiroli, Pune).
- [x] Standalone FastAPI microservice for non-diagnostic clinical triage scoring and maternal/pediatric red-flag detection.

### Phase 2: Offline-First PWA & ASHA Field Module
- [ ] Progressive Web App service worker setup with asset precaching and offline fallback.
- [ ] IndexedDB local storage engine (`Dexie.js`) for local patient records and vitals.
- [ ] Background sync queue with idempotency keys and retry management.
- [ ] Multilingual mobile-first ASHA intake forms (Marathi / Hindi / English).
- [ ] Client-side pre-triage alert engine for zero-connectivity emergency notification.

### Phase 3: PHC Digital OPD & Doctor Workspace
- [ ] Dynamic, urgency-sorted OPD Queue (Emergency Red, Urgent Amber, Routine Green).
- [ ] Longitudinal patient timeline (vitals trend chart, previous encounters, allergies).
- [ ] Essential medicine prescription formulary aligned with Maharashtra state essential drug lists.
- [ ] Low-bandwidth rural teleconsultation interface connecting PHCs to Sub-District and District specialists.

### Phase 4: Closed-Loop Referral System
- [ ] Smart referral generator with facility capability matching (ICU beds, specialists, blood bank availability).
- [ ] Live ambulance tracking code and transit status updates.
- [ ] Receiving hospital intake dashboard with 1-click bed reservation.
- [ ] Back-referral counter discharge summary dispatched back to originating PHC and local ASHA for home follow-up.

### Phase 5: District/State Health Administration & Field Validation
- [ ] High-density analytics portal for Taluka Health Officers (THO) and District Health Officers (DHO).
- [ ] Real-time referral drop-off heatmaps and facility bed utilization rates.
- [ ] Disease symptom cluster tracking (e.g., unusual spikes in fever or acute respiratory distress in a taluka).
- [ ] End-to-end integration tests and load tests on 2G/3G throttled networks.
