# CAREGRID Deployment Plan v1.0

**Document Reference:** CAREGRID-DOC-DEP-V1.0  
**Problem Statement:** SIH26133 — Accessibility & Quality of Public Healthcare in Rural/Underserved Areas  
**Target Beneficiary:** Government of Maharashtra (Public Health Department)  
**Status:** Approved Deployment Architecture & Execution Roadmap  
**Companion Documents:**  
- [`docs/PRD-v1.0.md`](./PRD-v1.0.md) (Product Requirements Document v1.0)  
- [`docs/TRD-v1.0.md`](./TRD-v1.0.md) (Technical Requirements Document v1.0)  
- [`docs/Backend-Schema-v1.0.md`](./Backend-Schema-v1.0.md) (Backend Database Schema v1.0)  
- [`docs/API-Contract-v1.0.md`](./API-Contract-v1.0.md) (API Contract v1.0)  
- [`docs/Security-Privacy-v1.0.md`](./Security-Privacy-v1.0.md) (Security & Privacy Specification v1.0)  
- [`docs/AI-ML-Specification-v1.0.md`](./AI-ML-Specification-v1.0.md) (AI/ML Specification v1.0)  
- [`docs/UI-UX-Design-v1.0.md`](./UI-UX-Design-v1.0.md) (UI/UX Design Specification v1.0)  
- [`docs/Business-Model-v1.0.md`](./Business-Model-v1.0.md) (Business Model v1.0)  
- [`docs/Testing-Plan-v1.0.md`](./Testing-Plan-v1.0.md) (Testing Plan v1.0)  

---

> [!IMPORTANT]
> **Deployment Status & Resource Provisioning Disclaimer:**  
> 1. **No External Cloud Resources Provisioned Yet:** As mandated for this stage, live Supabase projects and production Vercel projects have **not** been instantiated. This document defines the exact execution roadmap, configuration contracts, and migration sequencing to be executed during the deployment phase.
> 2. **Completed vs Planned Work:**
>    - **Completed Work:** Monorepo architecture, Next.js / TypeScript frontend application, Tailwind CSS design system, trilingual localization (EN, HI, MR), client-side Dexie.js offline store, rule-based triage runner, and regression test suites (128 passing tests).
>    - **Planned Work:** Live cloud database provisioning, automated GitHub Actions CI/CD pipelines, remote DNS routing, and production SSL termination.
> 3. **Synthetic Test Data Only:** Zero live patient PII or real institutional data will be introduced into development, staging, or demonstration environments.

---

## 1. Development Environment Architecture

### 1.1 Local Workstation Specifications
- **Operating System:** Windows 10/11, macOS, or Linux (Ubuntu 22.04 LTS).
- **Node.js Runtime:** Node.js v20 LTS (Active LTS, minimum v18.18+).
- **Package Manager:** `npm` v10+ (using `package-lock.json` for deterministic dependency trees).
- **Local Application Port:** `http://localhost:3000` (Next.js PWA runtime).

### 1.2 Monorepo Directory Layout
```
c:\Users\CAREGRID\
├── docs/                        # Approved technical & architectural specifications
│   ├── PRD-v1.0.md
│   ├── TRD-v1.0.md
│   ├── Backend-Schema-v1.0.md
│   ├── API-Contract-v1.0.md
│   ├── Security-Privacy-v1.0.md
│   ├── AI-ML-Specification-v1.0.md
│   ├── UI-UX-Design-v1.0.md
│   ├── Business-Model-v1.0.md
│   ├── Testing-Plan-v1.0.md
│   ├── Deployment-Plan-v1.0.md
│   └── design/                  # Design assets & Stitch UI backups
├── frontend/                    # Web Application & PWA Client
│   ├── src/
│   │   ├── app/                 # Next.js App Router pages & layouts
│   │   ├── components/          # Reusable UI component system
│   │   ├── lib/                 # Core domain logic, triage engine, offline DB
│   │   └── locales/             # Trilingual dictionaries (en.json, hi.json, mr.json)
│   ├── public/                  # Static assets, PWA manifest, service worker
│   └── scripts/                 # Automated sprint regression test suites
├── package.json
└── tsconfig.json
```

---

## 2. Git & GitHub Workflow

### 2.1 Branching Strategy
The project follows a modified **Trunk-Based Development** model with release tags:
- `main`: Production-ready, stable codebase. Direct pushes are restricted; changes land via reviewed Pull Requests (PRs).
- `feat/<feature-name>`: Scoped feature development branches (e.g. `feat/offline-sync-engine`).
- `fix/<issue-name>`: Targeted bug fix branches (e.g. `fix/marathi-matra-overflow`).
- `release/vX.Y.Z`: Release staging branches for final validation before tagging.

### 2.2 Pre-Commit & Commit Conventions
- **Commit Formatting:** Conventional Commits standard (`docs: ...`, `feat: ...`, `fix: ...`, `test: ...`, `chore: ...`).
- **Pre-Commit Checks (Local):**
  1. `npm run lint`: ESLint static analysis.
  2. `npx tsc --noEmit`: TypeScript strict type checking.
  3. `git diff | grep -E "AKIA|PRIVATE KEY|password"`: Local credential scan.

---

## 3. Supabase Architecture & Setup Sequence (Planned Roadmap)

When cloud resources are instantiated, Supabase will provide managed PostgreSQL 15+, GoTrue Auth, and PostgREST API access.

```
                          SUPABASE PROVISIONING ORDER
┌─────────────────────────────────────────────────────────────────────────────┐
│ 1. Project Creation & Region Selection                                      │
│    • Target Region: `ap-south-1` (Mumbai, India) for data sovereignty.      │
├─────────────────────────────────────────────────────────────────────────────┤
│ 2. Core Extension Activation                                                │
│    • `uuid-ossp` (UUID v4 generation)                                       │
│    • `pgcrypto` (Cryptographic functions)                                   │
├─────────────────────────────────────────────────────────────────────────────┤
│ 3. DDL Migration Sequence (Batches 1 to 8)                                 │
│    • Batch 1: Enum Types & Reference Tables (`roles`, `schemes`)            │
│    • Batch 2: Facilities (`facilities`, `facility_services`)                │
│    • Batch 3: User Profiles & Staff (`users`)                               │
│    • Batch 4: Patients & Master Records (`patients`, `health_records`)      │
│    • Batch 5: Encounters & Triage (`encounters`, `triage_assessments`)      │
│    • Batch 6: Appointments & Queues (`appointments`, `queues`)              │
│    • Batch 7: Care Continuum (`consultations`, `referrals`, `follow_ups`)   │
│    • Batch 8: Operations & Audit (`services_availability`, `audit_logs`)   │
├─────────────────────────────────────────────────────────────────────────────┤
│ 4. Row Level Security (RLS) & Trigger Enforcement                           │
│    • Enable RLS on all 16 clinical & operational tables                     │
│    • Deploy `trg_audit_protect` trigger (blocks UPDATE/DELETE on audit_logs)│
├─────────────────────────────────────────────────────────────────────────────┤
│ 5. Synthetic Seed Data Injection                                            │
│    • 5 verified public facilities (Gadchiroli, Nashik, Pune sample demo)    │
│    • 5 test worker accounts (1 ASHA, 2 MO Doctors, 1 Staff, 1 Admin)        │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 4. Environment Variables & Secrets Management

All configuration is strictly runtime-injected via environment variables. **No credentials or secrets are stored in Git.**

### 4.1 Client-Safe Environment Variables (`.env.production`)
Variables prefixed with `NEXT_PUBLIC_` are bundled client-side for public browser execution:
```bash
# Public API & Gateway
NEXT_PUBLIC_API_BASE_URL=https://caregrid.maharashtra.gov.in/api/v1
NEXT_PUBLIC_APP_ENV=production
NEXT_PUBLIC_DEFAULT_LANGUAGE=en

# Supabase Public Client (Safe for browser bundle)
NEXT_PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOi...<public-anon-key>

# PWA / Build Info
NEXT_PUBLIC_APP_VERSION=1.0.0
```

### 4.2 Server-Only Environment Secrets (Never Exposed to Client)
Configured exclusively within Vercel Project Settings or secure server runtime:
```bash
# Supabase Admin / Service Role (Bypasses RLS for system triggers & audit)
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOi...<service-role-secret>

# JWT Verification Secret (RS256 Public Key)
SUPABASE_JWT_SECRET=<jwt-secret-string>

# SMS Gateway Integration (Government CDAC / NIC API Key)
SMS_GATEWAY_API_URL=https://api.sms.gov.in/send
SMS_GATEWAY_API_KEY=<sms-secret-key>
```

---

## 5. Frontend Deployment Architecture (Vercel)

### 5.1 Platform Selection & Edge Network
- **Hosting Provider:** Vercel Global Edge Network.
- **Edge Regions:** Primary deployment routed to `bom1` (Mumbai, India Edge) to ensure minimal latency for rural Maharashtra networks.
- **Build Settings:**
  - **Framework Preset:** Next.js
  - **Root Directory:** `./frontend` (or project root depending on monorepo configuration)
  - **Build Command:** `npm run build`
  - **Output Directory:** `.next`
  - **Node.js Version:** `20.x`

### 5.2 Build & Cache Optimization
- **Static Site Generation (SSG):** Public facility directory, educational scheme guides, and localized UI dictionaries pre-rendered at build time.
- **Incremental Static Regeneration (ISR):** Facility readiness and stock availability pages revalidated on a 60-second background window.
- **Dynamic Server-Side Rendering (SSR):** Doctor OPD queues, referral desks, and administrative telemetry rendered on-demand with secure header caching.

---

## 6. Backend / API / AI Service Deployment

### 6.1 Serverless API Routes (Next.js Edge & Node Runtime)
- REST API routes specified in [`docs/API-Contract-v1.0.md`](./API-Contract-v1.0.md) run as stateless Next.js Serverless Functions (`/api/v1/...`).
- Auto-scaling: Scales from 0 to 100+ concurrent requests automatically, mitigating morning PHC OPD traffic spikes.

### 6.2 Embedded Edge AI Triage Runner
- In accordance with [`docs/AI-ML-Specification-v1.0.md`](./AI-ML-Specification-v1.0.md), the assistive triage engine operates **directly at the client edge**:
  - Embedded TypeScript logic runs inside the PWA client without calling external inference APIs.
  - Guarantees instant sub-50ms triage evaluations even in complete rural cellular dead-zones.

---

## 7. Database Migration & DDL Management

1. **Version-Controlled Migration Files:**
   - Database migrations reside under `supabase/migrations/YYYYMMDDHHMMSS_name.sql`.
2. **Deterministic Sequence:**
   - Migrations are applied in strict numerical order using the Supabase CLI (`supabase db push`).
3. **Idempotent DDL:**
   - All migration scripts use `CREATE TABLE IF NOT EXISTS`, `CREATE INDEX IF NOT EXISTS`, and `DO $$ BEGIN ... EXCEPTION ... END $$;` blocks to prevent deployment crashes.

---

## 8. Row Level Security (RLS) & Auth Rollout

1. **Mandatory RLS Verification Script:**
   - A post-migration script queries PostgreSQL catalog tables to verify that **100% of tables in `public` schema have `rowsecurity = true`**:
     ```sql
     SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND rowsecurity = false;
     ```
   - Build/deployment fails immediately if any table lacks active RLS.
2. **Policy Smoke Testing:**
   - Automated deployment verification scripts authenticate as synthetic users (`asha_user`, `doctor_user`, `admin_user`) and assert that data leakage between catchments is blocked.

---

## 9. Continuous Integration & Continuous Deployment (CI/CD)

### 9.1 Planned GitHub Actions Pipeline (`.github/workflows/deploy.yml`)

```
                         CI/CD PIPELINE FLOW
┌─────────────────────────────────────────────────────────────────────────────┐
│ 1. Lint & Typecheck Stage                                                   │
│    • `npm run lint`                                                         │
│    • `npx tsc --noEmit`                                                     │
├─────────────────────────────────────────────────────────────────────────────┤
│ 2. Automated Regression Test Suite                                          │
│    • `node frontend/scripts/test-sprint2.mjs` (Intake & Triage)             │
│    • `node frontend/scripts/test-sprint3.mjs` (OPD Queue & Facility Search) │
│    • `node frontend/scripts/test-sprint4.mjs` (Closed-Loop Referral)       │
│    • `node frontend/scripts/test-sprint5.mjs` (Trilingual & Governance)     │
│    • Pass threshold: 128 / 128 tests passing (100%)                         │
├─────────────────────────────────────────────────────────────────────────────┤
│ 3. Security & Boundary Scan                                                 │
│    • Blacklist scan: Asserts zero references to water/bed/ambulance code    │
│    • Prohibited AI keyword scan: Asserts zero drug prescriptions generated  │
│    • Secret scan: Asserts zero private keys or passwords in commit diff     │
├─────────────────────────────────────────────────────────────────────────────┤
│ 4. Build & Preview Deployment                                               │
│    • Trigger Vercel preview deployment on PR branches                       │
│    • Trigger Vercel production deployment on merge to `main`                │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 10. Staging vs. Production Environment Matrix

| Parameter | Staging Environment | Production Environment |
|---|---|---|
| **Domain URL** | `https://staging.caregrid.maharashtra.gov.in` | `https://caregrid.maharashtra.gov.in` |
| **Vercel Branch** | `release/*` or `preview` branches | `main` branch |
| **Database Instance**| Dedicated Supabase Staging Project | Dedicated Supabase Production Project |
| **Database Data** | 100% Synthetic Demo Fixtures | Operational Health Records (Field Launch) |
| **SMS Gateway Mode** | Mock Sandbox (console logging) | Live CDAC / NIC Transactional SMS Route |
| **Telemetry Level** | Verbose debug logging enabled | Anonymized audit & error logging only |

---

## 11. Monitoring, Logging & Telemetry

1. **Performance & Vitals Monitoring:**
   - Vercel Speed Insights monitors real-world Core Web Vitals (LCP, FID, CLS) from rural mobile devices.
2. **Application Error Tracking:**
   - Sentry / Datadog integration for unhandled client exceptions:
     - **Zero PII Rule:** All request bodies, patient names, and phone numbers are stripped via `beforeSend` sanitizers before sending crash reports.
3. **Database Telemetry:**
   - Supabase Studio monitors connection pool utilization, slow query logs (>100ms), and storage growth.

---

## 12. Backup, Disaster Recovery & High Availability

1. **Automated Point-In-Time Recovery (PITR):**
   - Continuous Write-Ahead Log (WAL) archiving allows point-in-time recovery to any second within the past 7 days.
2. **Daily Logical Backups:**
   - Daily encrypted database snapshots stored in geo-redundant object storage.
3. **Recovery Time Objective (RTO) & Recovery Point Objective (RPO):**
   - **Target RTO:** $< 60\text{ minutes}$ in the event of major cloud region failure.
   - **Target RPO:** $< 5\text{ minutes}$ data loss window.

---

## 13. Rollback Strategy

1. **Instant Frontend Rollback:**
   - Vercel provides atomic, single-click instant rollbacks to any previous successful deployment hash within 3 seconds.
2. **Database Rollback Protection:**
   - Destructive migrations (e.g. dropping columns) are prohibited during deployment.
   - All migrations follow the **Expand and Contract** pattern (add new column $\rightarrow$ deploy code $\rightarrow$ retire old column).

---

## 14. Progressive Web App (PWA) Production Rollout

1. **Service Worker Versioning:**
   - Service worker cache keys follow semantic releases: `caregrid-cache-v1.0.0`.
   - On deployment, a new service worker installs in the background and activates via `skipWaiting()` once all open tabs close.
2. **Manifest Verification:**
   - Serves `manifest.json` with high-resolution icons (192px, 512px), maskable icons, and standalone display mode.

---

## 15. Offline & Sync Production Considerations

1. **Dexie.js Client Database Migration:**
   - Schema version increments on the client (e.g. `version(2)`) are defined with upgrade handlers to ensure existing cached records on frontline tablets are migrated without data loss.
2. **Sync Throttling & Storm Prevention:**
   - Frontline devices returning to connectivity use **jittered exponential backoff** (random delay between 0–15 seconds) to prevent a thunderous herd problem from overwhelming the `/sync/push` endpoint.

---

## 16. Pre-Flight Security Checklist

Before approving any production deployment:

- [ ] All environment variables configured; `.env` files confirmed in `.gitignore`.
- [ ] No API keys, database connection strings, or private certificates committed to Git history.
- [ ] PostgreSQL Row Level Security (RLS) confirmed enabled on all public tables.
- [ ] Immutable audit logging trigger `trg_audit_protect` verified active.
- [ ] TLS 1.3 enforced with HSTS header preload configured.
- [ ] CORS policies locked to official Maharashtra domain origins.
- [ ] Synthetic test data verified across all pre-production databases.

---

## 17. Final Release Checklist

```
                            RELEASE SIGN-OFF
┌───┬─────────────────────────────────────────────────────────────┬──────────┐
│ # │ Verification Step                                           │ Sign-off │
├───┼─────────────────────────────────────────────────────────────┼──────────┤
│ 1 │ TypeScript compilation clean (`npm run build` succeeds)     │ [x] PASS │
│ 2 │ Sprint regression test suite (128/128 tests passing)        │ [x] PASS │
│ 3 │ Trilingual parity verified (266 keys in EN, HI, MR)         │ [x] PASS │
│ 4 │ SIH26133 boundary check: Zero water, outbreak, ambulance    │ [x] PASS │
│ 5 │ AI safety check: Zero prescriptions, zero auto-diagnoses    │ [x] PASS │
│ 6 │ Non-diagnostic disclaimer verified on all triage outputs    │ [x] PASS │
│ 7 │ Offline intake and sync engine operational                  │ [x] PASS │
│ 8 │ PWA manifest and service worker cache verified              │ [x] PASS │
│ 9 │ Git working tree verified clean                             │ [x] PASS │
└───┴─────────────────────────────────────────────────────────────┴──────────┘
```
