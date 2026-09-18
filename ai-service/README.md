# CAREGRID Clinical Triage & Decision Assist Microservice

> **SIH26133**: Rural Healthcare Access & Care Coordination Platform  
> **Jurisdiction**: Government of Maharashtra (Public Health Department)  
> **Team**: The Glitch Gang (129855)  

---

## 1. Service Overview

The CAREGRID AI Microservice is a high-performance Python FastAPI service providing real-time, non-diagnostic clinical triage prioritization and danger-sign detection for rural community health workers (ASHAs/ANMs) and Primary Health Centre doctors.

### 🛡️ Clinical Policy & Non-Diagnostic Guarantee:
- **Assistive Priority Scoring Only**: The engine categorizes clinical urgency into `EMERGENCY_RED`, `URGENT_AMBER`, or `ROUTINE_GREEN`.
- **Zero Autonomous Diagnoses or Prescriptions**: Every response includes programmatic clinical disclaimers and mandates licensed physician oversight.
- **Evidence-Based Rule Engine**: Physiological anomaly triggers and red-flag rules conform to Indian Public Health Standards (IPHS) and WHO Emergency Triage Assessment and Treatment (ETAT).

---

## 2. API Endpoints

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/v1/healthcheck` | Liveness and readiness healthcheck probe |
| `POST` | `/api/v1/triage/assess` | Computes clinical urgency tier, red flags, and transport recommendations |

---

## 3. Local Development

```bash
cd ai-service
python -m venv .venv
# Activate virtualenv
.venv\Scripts\activate      # Windows
source .venv/bin/activate   # Linux/macOS

pip install -r requirements.txt
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

Interactive OpenAPI Swagger docs available at: `http://localhost:8000/docs`
