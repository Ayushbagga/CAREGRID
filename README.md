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

**CAREGRID** is an offline-first digital healthcare coordination platform engineered specifically for rural and underserved areas in Maharashtra. It bridges community health workers (ASHAs and ANMs), primary healthcare facilities (Sub-Centres, Primary Health Centres - PHCs, Community Health Centres - CHCs, and District Hospitals), medical officers, and state health administrators into a unified, secure care-delivery grid.

In rural talukas across Maharashtra (such as Gadchiroli, Nandurbar, Melghat/Amravati, and Palghar), public healthcare delivery is bottlenecked by intermittent internet connectivity, fragmented paper-based referrals, delays in emergency triage, and poor continuity of care. CAREGRID solves these challenges by directly digitizing the core care continuum:

```
Citizen/Patient
→ ASHA/ANM
→ PHC/CHC/Rural Hospital
→ AI-assisted triage & priority support
→ Appointment / Queue / Teleconsultation
→ Referral tracking
→ Diagnostics / Medicines / Services
→ Follow-up / Continuity of Care
→ Facility / Government Dashboard
```

---

## 2. Core Principles & Clinical Guardrails

### 🛡️ Non-Diagnostic Clinical Assist Guardrail
* **Strict Mandate**: The AI service **never** issues definitive medical diagnoses, prescriptions, or prognostic determinations.
* **Assistive Role**: It computes standardized clinical urgency tiers (`emergency_red`, `urgent_amber`, `routine_green`), highlights vital anomalies, and identifies maternal and pediatric danger signs based on Indian Public Health Standards (IPHS) and WHO ETAT guidelines.
* **Human-in-the-Loop**: All clinical actions and treatments remain the sole legal and professional responsibility of licensed Medical Officers.

### 🏛️ Strengthening Existing Public Healthcare Systems
* Built around Maharashtra’s tiered public health infrastructure:
  - **Sub-Centres (Ayushman Arogya Mandir)**: Primary village outreach and screening.
  - **Primary Health Centres (PHCs)**: First-contact medical officer consultation, normal delivery, basic lab tests, and rural teleconsultation.
  - **Community Health Centres (CHCs) & Rural Hospitals (RH)**: Secondary secondary care (Pediatrics, Gynecology, Surgery).
  - **Sub-District & District Hospitals (SDH/DH)**: Tertiary emergency and specialized referral care.

### 🌐 Multilingual Accessibility
* Native support for **Marathi (मराठी)** as the primary administrative and vernacular language for Maharashtra field workers and citizens, alongside **Hindi (हिंदी)** and **English**.

### 📶 Offline-First & Low-Bandwidth Engineering
* Progressive Web App (PWA) with client-side persistent storage (IndexedDB).
* Allows ASHAs and ANMs to register patients, record vitals, and evaluate red flags in zero-connectivity village settings, with automated synchronization upon network detection.

### 🔒 Healthcare Data Security & Privacy
* **Role-Based Access Control (RBAC)**: Enforced directly at the database level via PostgreSQL Row-Level Security (RLS).
* **ABDM Alignment**: Ready for ABHA (Ayushman Bharat Health Account) identifier linkage.
* **Audit Trail**: Tamper-evident logging of all health record access.

---

## 3. The 11 Core MVP Deliverables

1. **Citizen / Patient Intake**: Demographic capture, vulnerability flags (pregnancy, chronic disease), and ABHA-ready master profile.
2. **ASHA / ANM Field Workflow**: Mobile-first field screening, vitals recording, and scheduled household visit task lists.
3. **AI-Assisted Triage & Priority Support**: Urgency priority classification (`emergency_red`, `urgent_amber`, `routine_green`) and danger-sign detection. **Strictly non-diagnostic.**
4. **Facility & Service Discovery**: Searchable directory of public health facilities with available clinical services, specialties, and operational hours.
5. **Appointment, Queue & Teleconsultation Coordination**: Urgency-sorted digital OPD queue tokens and low-bandwidth teleconsultation links between PHC and district specialists.
6. **Closed-Loop Referral Tracking**: Structured transfers from Sub-Centre/PHC to higher facility, arrival acknowledgment, and post-discharge counter-referral notes.
7. **Basic Longitudinal Health Record**: Chronological timeline displaying historical encounters, vitals trends, danger signs, and referrals.
8. **Follow-Up & Continuity of Care**: Automated scheduled follow-up tasks for village ASHAs (post-referral checks, maternal visits, routine follow-ups).
9. **Multilingual Support**: Trilingual interface in Marathi, Hindi, and English.
10. **Low-Connectivity / Offline-First Engine**: Local IndexedDB caching and background sync queue with idempotency protection.
11. **Facility & Government Dashboard**: Administrative visibility into referral loop closure rates, triage urgency distribution, and ASHA follow-up compliance across talukas.

---

## 4. Technology Stack

| Layer | Technology | Rationale |
| :--- | :--- | :--- |
| **Frontend Web & PWA** | Next.js 14 (App Router), React, Tailwind CSS | Responsive across mobile, tablet, and desktop; PWA installable |
| **Offline Storage & Sync** | IndexedDB (`Dexie.js`), Service Workers | 100% operational continuity in zero-reception rural hamlets |
| **Database & Auth** | Supabase (PostgreSQL 15), Row-Level Security (RLS) | Multi-tenant security policies, relational integrity, realtime WebSockets |
| **AI Decision Support** | FastAPI (Python 3.11+), Pydantic v2 | High-throughput, deterministic clinical urgency scoring and rule evaluation |
| **Deployment** | Vercel (Frontend), Supabase Cloud / Container | Scalable, high availability, edge CDN |

---

## 5. Repository Structure

```
CAREGRID/
├── .env.example                     # Environment configuration template
├── .gitignore                       # Production gitignore covering Node, Python, Supabase, OS
├── README.md                        # Project manifesto, architecture overview & quickstart
│
├── docs/                            # Architectural and technical documentation
│   ├── ARCHITECTURE.md              # System architecture, data flow & 9-stage care pipeline
│   ├── DATABASE_SCHEMA.md           # PostgreSQL tables, relations, indexes & RLS specs
│   ├── SECURITY_AND_PRIVACY.md      # Data governance, ABDM alignment & privacy controls
│   ├── AI_TRIAGE_POLICY.md          # Clinical guardrails, non-diagnostic policy & scoring criteria
│   └── DEVELOPMENT_ROADMAP.md       # Phased MVP development timeline & milestones
│
├── frontend/                        # Next.js 14 App Router + Tailwind CSS + PWA
│   ├── public/                      # Static assets, web manifest, icons
│   ├── src/
│   │   ├── app/                     # App Router pages (auth, asha, doctor, citizen, facility, admin)
│   │   ├── components/              # Reusable UI components (offline banner, triage tags, queues)
│   │   ├── hooks/                   # React hooks (useNetworkStatus)
│   │   ├── lib/                     # Supabase client, offline sync manager, i18n translations
│   │   └── types/                   # Healthcare TypeScript domain types
│   ├── package.json
│   └── tailwind.config.ts
│
├── backend/                         # Database migrations and Supabase configuration
│   └── supabase/
│       ├── config.toml              # Supabase CLI configuration
│       └── migrations/              # Scoped PostgreSQL migration scripts
│           ├── 00001_initial_schema.sql         # Tables, enums, triggers, indexes
│           ├── 00002_rls_policies.sql           # Role-based Row Level Security policies
│           └── 00003_seed_facilities_and_roles.sql # Realistic Maharashtra health facility seeds
│
└── ai-service/                      # FastAPI Python Clinical Triage Microservice
    ├── Dockerfile                   # Containerized microservice deployment
    ├── requirements.txt             # Python dependencies (FastAPI, Pydantic, Uvicorn)
    ├── README.md                    # AI Service setup & API documentation
    └── app/
        ├── main.py                  # FastAPI application entrypoint
        ├── config.py                # Environment configuration & disclaimers
        ├── api/v1/                  # Endpoints (/healthcheck, /triage/assess)
        ├── schemas/triage.py        # Input & structured output validation schemas
        └── services/                # RedFlagDetector, PriorityScorer, TriageEngine
```

---

## 6. Quick Start Guide

### Prerequisites
- **Node.js**: v20.x or higher
- **Python**: 3.11+
- Remote Supabase project or local Supabase CLI

### 1. Environment Setup
```bash
cp .env.example .env
```

### 2. Frontend & PWA Setup
```bash
cd frontend
npm install
npm run dev
```
Accessible at `http://localhost:3000`.

### 3. AI Clinical Triage Microservice Setup
```bash
cd ai-service
python -m venv .venv
# Activate virtualenv:
.venv\Scripts\activate      # Windows
source .venv/bin/activate   # Linux/macOS

pip install -r requirements.txt
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```
Interactive OpenAPI documentation at `http://localhost:8000/docs`.

---

## 7. Development Team

**Team Name**: The Glitch Gang  
**Team ID**: 129855  
**Hackathon**: Smart India Hackathon (SIH 2026)  
**Problem Statement**: SIH26133 — Accessibility & Quality of Public Healthcare in Rural/Underserved Areas  
