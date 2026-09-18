# CAREGRID: Rural Healthcare Access & Care Coordination Platform

[![Smart India Hackathon 2026](https://img.shields.io/badge/SIH-2026-orange.svg)](https://www.sih.gov.in/)
[![Problem Statement](https://img.shields.io/badge/Problem%20Statement-SIH26133-blue.svg)](https://www.sih.gov.in/)
[![Organization](https://img.shields.io/badge/Organization-Government%20of%20Maharashtra-green.svg)](https://arogya.maharashtra.gov.in/)
[![Team](https://img.shields.io/badge/Team-The%20Glitch%20Gang%20%28129855%29-purple.svg)](#)

> **SIH Problem Statement SIH26133**: Accessibility & Quality of Public Healthcare in Rural/Underserved Areas  
> **Target Jurisdiction**: Government of Maharashtra (Public Health Department / Arogya Vibhag)  
> **Team Name**: The Glitch Gang | **Team ID**: 129855  

---

## 1. Executive Summary

**CAREGRID** is a production-oriented, offline-first digital healthcare coordination platform engineered specifically for rural and underserved areas in Maharashtra. It connects community health workers (ASHAs and ANMs), primary healthcare facilities (Sub-Centres, Primary Health Centres - PHCs, Community Health Centres - CHCs, and District Hospitals), medical officers, and state health administrators into a unified, secure care-delivery grid.

In rural belts (such as Gadchiroli, Nandurbar, Amravati/Melghat, and Palghar), public healthcare delivery is bottlenecked by intermittent internet connectivity, fragmented paper-based referrals, delays in emergency triage, and poor continuity of care for maternal health and non-communicable diseases (NCDs). CAREGRID solves these challenges by providing:

1. **Offline-First PWA for Field Health Workers**: Empowers ASHAs and ANMs to register citizens, record vital signs, assess red flags, and manage follow-ups even in zero-connectivity village settings, with automated synchronization upon network detection.
2. **Clinical Decision Support & Triage (Non-Diagnostic)**: AI-assisted clinical urgency classification (Emergency / Urgent / Routine priority tiers) to assist front-line health workers and doctors in identifying red flags, shock signs, and high-risk pregnancies early.
3. **Closed-Loop Referral Tracking**: Digitizes referrals from Sub-Centre/PHC up to CHC/District Hospital with live acknowledgment, bed/specialty visibility, transport prioritization, and return-loop discharge notes.
4. **Longitudinal Health Records**: Unified patient timelines tracking immunization, antenatal care (ANC/PNC), chronic conditions, diagnostic tests, and dispensed medications.
5. **Dynamic Queue & Teleconsultation**: Manages walk-in digital queues and connects remote PHCs to specialist doctors at Sub-District and District hospitals.
6. **Administrative & Epidemiological Dashboards**: Equips Taluka Health Officers (THO), Civil Surgeons, and State Health Directors with real-time visibility into referral bottlenecks, disease trends, stockouts, and maternal health metrics.

---

## 2. Core Care Delivery Flow

```
+----------------------------------------------------------------------------------------------------+
|                                           CAREGRID CARE FLOW                                       |
+----------------------------------------------------------------------------------------------------+
|                                                                                                    |
|  [Citizen / Patient]                                                                               |
|          |                                                                                         |
|          v                                                                                         |
|  [ASHA / ANM Community Worker] <---> (Offline-First Local Storage / PWA Sync)                     |
|          |                                                                                         |
|          v                                                                                         |
|  [Sub-Centre / PHC / CHC / Rural Hospital]                                                         |
|          |                                                                                         |
|          +---> [AI-Assisted Triage & Urgency Priority Support] (Non-Diagnostic Clinical Assist)    |
|          |                                                                                         |
|          v                                                                                         |
|  [Digital OPD Queue & Teleconsultation System]                                                     |
|          |                                                                                         |
|          +---> [Closed-Loop Inter-Facility Referral] ---> [Specialist / CHC / District Hospital]   |
|          |                                                                                         |
|          v                                                                                         |
|  [Diagnostics, Essential Medicines & Lab Services]                                                 |
|          |                                                                                         |
|          v                                                                                         |
|  [Follow-Up Care, Reminder Notifications & Continuum of Care]                                      |
|          |                                                                                         |
|          v                                                                                         |
|  [Taluka / District / State Healthcare Intelligence Dashboard]                                    |
|                                                                                                    |
+----------------------------------------------------------------------------------------------------+
```

---

## 3. Core Architectural Principles & Clinical Guardrails

### 🛡️ Non-Diagnostic Clinical Assist Guardrail
* **Strict Mandate**: The AI service **never** issues definitive medical diagnoses, prescriptions, or prognostic determinations.
* **Assistive Role**: It computes standardized clinical urgency scores (Red/Amber/Green priority tiers), identifies maternal/pediatric vital sign red flags, and recommends transport or specialty review based on established Indian Public Health Standards (IPHS) and WHO guidelines.
* **Human-in-the-Loop**: All clinical actions and prescriptions remain the sole legal and ethical responsibility of licensed Medical Officers and registered healthcare professionals.

### 🏛️ Strengthening Existing Public Healthcare Systems
* Built to augment and digitize Maharashtra’s tiered public health apparatus:
  - **Sub-Centres (Arogya Vardhini Mandir)**: Primary point of community contact.
  - **Primary Health Centres (PHCs)**: First-level medical officer consultation, basic lab tests, delivery services.
  - **Community Health Centres (CHCs) & Rural Hospitals (RH)**: 30-bed secondary facilities with specialized care (Gynecology, Pediatrics, Surgery, Medicine).
  - **Sub-District & District Hospitals (SDH/DH)**: Tertiary tertiary emergency, surgical, and diagnostic care.

### 🌐 Multilingual Accessibility
* Native support for **Marathi (मराठी)** as the primary administrative and vernacular language for Maharashtra field workers and citizens, alongside **Hindi (हिंदी)** and **English**.

### 📶 Offline-First & Low-Bandwidth Engineering
* Mobile-responsive Progressive Web App (PWA) with Service Worker asset precaching.
* Client-side persistent storage (IndexedDB) for full offline patient registration, vitals recording, and offline triage assistance.
* Resilient background synchronization queue that handles network reconnects, dropped connections, and packet loss without data loss.

### 🔒 Healthcare Data Security & Privacy
* **Role-Based Access Control (RBAC)**: Fine-grained permissions enforced at database level via PostgreSQL Row-Level Security (RLS).
* **ABDM Alignment**: Ready for Ayushman Bharat Digital Mission (ABHA ID) linkage and consent-governed electronic health record sharing.
* **Auditability**: Tamper-evident logging of all health record access and referral state modifications.

---

## 4. Technology Stack

| Layer | Technology | Rationale |
| :--- | :--- | :--- |
| **Frontend Web & PWA** | Next.js 14+ (App Router), React, Tailwind CSS | High performance, SEO/SSR capabilities, zero-bundle PWA caching, responsive across mobile, tablet, and desktop |
| **Offline Storage & Sync** | IndexedDB (Dexie.js), Service Workers | Reliable field operations in remote regions with no cellular connectivity |
| **Database & Auth** | Supabase (PostgreSQL 15+), PostGIS, Row-Level Security (RLS) | Relational integrity, spatial facility discovery, fine-grained multi-tenant security policies, real-time WebSocket change streams |
| **AI / Decision Assist** | FastAPI (Python 3.12+), Pydantic v2 | High-throughput, asynchronous REST endpoints for clinical priority scoring, rule validation, and red-flag detection |
| **Hosting & Infra** | Vercel (Frontend), Supabase Cloud / On-Premise, Containerized FastAPI | Scalable, high availability, zero cold-start edge network |

---

## 5. Repository Structure

```
CAREGRID/
├── .env.example                     # Environment configuration template
├── .gitignore                       # Production gitignore covering Node, Python, Next.js, OS
├── README.md                        # Project manifesto, architecture overview, and setup guide
│
├── docs/                            # Architectural and technical documentation
│   ├── ARCHITECTURE.md              # Detailed system architecture, data flow & component topology
│   ├── DATABASE_SCHEMA.md           # PostgreSQL tables, relations, indexes, and RLS specifications
│   ├── SECURITY_AND_PRIVACY.md      # Data governance, ABDM alignment, and privacy controls
│   ├── AI_TRIAGE_POLICY.md          # Clinical guardrails, non-diagnostic policy, and scoring criteria
│   └── DEVELOPMENT_ROADMAP.md       # Phased development timeline, milestones, and deliverables
│
├── frontend/                        # Next.js 14 App Router + Tailwind CSS + PWA
│   ├── public/                      # Static assets, web manifest, service worker
│   │   ├── manifest.json            # PWA manifest with Marathi/English localization
│   │   └── icons/                   # App icons for mobile homescreen install
│   ├── src/
│   │   ├── app/                     # Next.js App Router routes
│   │   │   ├── (auth)/              # Authentication routes (login, OTP)
│   │   │   ├── (dashboard)/         # Role-specific operational dashboards
│   │   │   │   ├── citizen/         # Patient portal (records, appointments)
│   │   │   │   ├── asha/            # Field worker offline-first mobile workspace
│   │   │   │   ├── doctor/          # OPD queue, teleconsult, prescription workspace
│   │   │   │   ├── facility/        # Bed, inventory, and referral intake dashboard
│   │   │   │   └── admin/           # District/State epidemiological monitoring
│   │   │   ├── api/                 # Next.js API edge proxy routes
│   │   │   ├── layout.tsx           # Global app layout with i18n & offline banner
│   │   │   └── page.tsx             # Public landing & service locator
│   │   ├── components/              # Modular UI components (triage, referrals, queue, offline)
│   │   ├── hooks/                   # Custom React hooks (useNetworkStatus, useOfflineQueue)
│   │   ├── lib/                     # Utilities (Supabase client, offline sync manager, i18n)
│   │   └── types/                   # TypeScript clinical and system domain types
│   ├── package.json
│   ├── tsconfig.json
│   ├── next.config.mjs
│   └── tailwind.config.ts
│
├── backend/                         # Database and backend services configuration
│   └── supabase/
│       ├── config.toml              # Supabase CLI configuration
│       └── migrations/              # Production PostgreSQL migration scripts
│           ├── 00001_initial_schema.sql         # Core tables, enums, triggers
│           ├── 00002_rls_policies.sql           # Role-based Row Level Security policies
│           └── 00003_seed_facilities_and_roles.sql # Realistic Maharashtra health facility seeds
│
└── ai-service/                      # FastAPI Python Clinical Triage & Decision Assist Service
    ├── Dockerfile                   # Containerized microservice deployment
    ├── requirements.txt             # Python dependencies (FastAPI, Pydantic, Uvicorn)
    ├── README.md                    # AI Service setup, API endpoints, and test instructions
    └── app/
        ├── main.py                  # FastAPI application entrypoint and middleware
        ├── config.py                # Environment configuration settings
        ├── api/v1/                  # Versioned API routes
        │   ├── triage.py            # Clinical priority assessment endpoint
        │   └── healthcheck.py       # Liveness and readiness probes
        ├── schemas/                 # Pydantic validation schemas
        │   └── triage.py            # Triage input & structured decision-support output
        └── services/                # Clinical business logic
            ├── red_flag_detector.py # Emergency symptom & vitals red-flag evaluator
            ├── priority_scorer.py   # Multi-factor urgency priority scorer
            └── triage_engine.py     # Orchestrator with mandatory clinical disclaimers
```

---

## 6. Quick Start Guide

### Prerequisites
- **Node.js**: v20.x or higher (Tested on v22.x)
- **Python**: 3.11+ (Tested on 3.12 / 3.14)
- **Supabase CLI** (optional for local database emulator) or remote Supabase project

### 1. Environment Setup
Clone the repository and copy the environment template:
```bash
cp .env.example .env
```

### 2. Frontend & PWA Setup
```bash
cd frontend
npm install
npm run dev
```
The application will be accessible at `http://localhost:3000`.

### 3. AI Clinical Triage Microservice Setup
```bash
cd ai-service
python -m venv .venv
# On Windows:
.venv\Scripts\activate
# On Linux/macOS:
source .venv/bin/activate

pip install -r requirements.txt
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```
Interactive OpenAPI documentation will be available at `http://localhost:8000/docs`.

---

## 7. Compliance & Standards
- **Government of Maharashtra**: Public Health Department guidelines & Primary Healthcare Standards.
- **National Health Mission (NHM)**: IPHS Guidelines for Sub-Centres, PHCs, and CHCs.
- **Ayushman Bharat Digital Mission (ABDM)**: M1/M2/M3 milestone architecture readiness.
- **Digital Personal Data Protection (DPDP) Act 2023**: Indian privacy law compliance for electronic health data.

---

## 8. Development Team

**Team Name**: The Glitch Gang  
**Team ID**: 129855  
**Hackathon**: Smart India Hackathon (SIH 2026)  
**Problem Statement**: SIH26133  
