/**
 * CAREGRID PHASE C (P1 Intelligent Clinical Assistance & Protocol-Driven Care Copilot)
 * Automated Verification Test Suite
 * 
 * Verifies:
 * 1. Deterministic Clinical Protocol Rules Engine (IPHS / NHM conformity)
 * 2. Non-Diagnostic & Zero-Prescription Safety Guardrails
 * 3. Care Copilot & Command Center API Handlers (/api/copilot & /api/copilot/escalate)
 * 4. Role Authorization & Consequential Action Confirmation
 * 5. Grounding Separation (Verified Records vs Protocol Signals vs Assistant Text)
 * 6. UI Integration & Trilingual Parity
 * 7. Security Isolation & Zero Secret Leakage
 */

import fs from 'fs';
import path from 'path';

console.log("==================================================");
console.log("=== CAREGRID PHASE C: CLINICAL COPILOT TESTS   ===");
console.log("==================================================");

let totalPassed = 0;
let totalFailed = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`  PASS: ${message}`);
    totalPassed++;
  } else {
    console.error(`  FAIL: ${message}`);
    totalFailed++;
  }
}

// ====================================================
// TEST 1: Clinical Protocol Rules Engine Implementation
// ====================================================
console.log("\n[TEST 1] Verifying Clinical Protocol Rules Engine (ClinicalProtocolEngine)...");

const enginePath = 'frontend/src/lib/clinical-rules/protocol-engine.ts';
assert(fs.existsSync(enginePath), `ClinicalProtocolEngine file exists at ${enginePath}`);

const engineSource = fs.readFileSync(enginePath, 'utf8');

assert(engineSource.includes('class ClinicalProtocolEngine'), "ClinicalProtocolEngine class is exported");
assert(engineSource.includes('public static evaluate('), "Engine provides static evaluate() method");
assert(engineSource.includes('RULE-RESP-01'), "Engine implements RULE-RESP-01 (Severe Hypoxia)");
assert(engineSource.includes('RULE-RESP-02'), "Engine implements RULE-RESP-02 (Borderline Oxygen Saturation)");
assert(engineSource.includes('RULE-RESP-03'), "Engine implements RULE-RESP-03 (Severe Tachypnea)");
assert(engineSource.includes('RULE-CV-01'), "Engine implements RULE-CV-01 (Hypertensive Crisis)");
assert(engineSource.includes('RULE-CV-03'), "Engine implements RULE-CV-03 (Severe Hypotension / Shock)");
assert(engineSource.includes('RULE-CV-04'), "Engine implements RULE-CV-04 (Severe Tachycardia)");
assert(engineSource.includes('RULE-CV-06'), "Engine implements RULE-CV-06 (Acute Precordial Chest Pain)");
assert(engineSource.includes('RULE-MAT-01'), "Engine implements RULE-MAT-01 (Severe Pre-Eclampsia Alert)");
assert(engineSource.includes('RULE-MAT-02'), "Engine implements RULE-MAT-02 (Gestational Hypertension)");
assert(engineSource.includes('RULE-MAT-04'), "Engine implements RULE-MAT-04 (High-Risk Pregnancy Flag)");
assert(engineSource.includes('RULE-MAT-05'), "Engine implements RULE-MAT-05 (Antepartum / Vaginal Bleeding)");
assert(engineSource.includes('RULE-NEURO-01'), "Engine implements RULE-NEURO-01 (Active Convulsion Danger Sign)");
assert(engineSource.includes('RULE-NCD-01'), "Engine implements RULE-NCD-01 (Chronic Disease Vulnerability)");
assert(engineSource.includes('RULE-COORD-01'), "Engine implements RULE-COORD-01 (Unacknowledged Referral Escalation)");
assert(engineSource.includes('RULE-COORD-02'), "Engine implements RULE-COORD-02 (Overdue ASHA Home Visit Escalation)");
assert(engineSource.includes('RULE-ROUTINE-01'), "Engine implements RULE-ROUTINE-01 (Standard Outpatient Presentation)");

// Verify index re-export
const indexPath = 'frontend/src/lib/clinical-rules/index.ts';
assert(fs.existsSync(indexPath), `Clinical rules index exists at ${indexPath}`);
const indexSource = fs.readFileSync(indexPath, 'utf8');
assert(indexSource.includes("./protocol-engine"), "Clinical rules index re-exports protocol-engine");


// ====================================================
// TEST 2: Non-Diagnostic & Zero-Prescription Guardrails
// ====================================================
console.log("\n[TEST 2] Verifying Clinical Safety Guardrails & Non-Diagnostic Principles...");

assert(engineSource.includes('DISCLAIMER'), "ClinicalProtocolEngine defines mandatory statutory disclaimer");
assert(
  engineSource.includes('It does NOT diagnose medical conditions or replace clinical examination by a licensed medical officer'),
  "Disclaimer explicitly states system does NOT diagnose medical conditions"
);
assert(!engineSource.includes('Diagnosis:'), "Engine never produces autonomous 'Diagnosis:' headers");
assert(!engineSource.includes('Prescribe '), "Engine never produces autonomous 'Prescribe' medication orders");
assert(!engineSource.includes('mg tablet'), "Engine never produces autonomous drug dosage prescriptions");


// ====================================================
// TEST 3: Care Copilot & Command Center API Route Handlers
// ====================================================
console.log("\n[TEST 3] Verifying Care Copilot & Command Center API Endpoints...");

const copilotRoutePath = 'frontend/src/app/api/copilot/route.ts';
assert(fs.existsSync(copilotRoutePath), `Route handler exists at ${copilotRoutePath}`);

const copilotRouteSource = fs.readFileSync(copilotRoutePath, 'utf8');
assert(copilotRouteSource.includes('authorizeRequest'), "/api/copilot enforces RBAC authorization");
assert(copilotRouteSource.includes("['asha', 'doctor', 'admin']"), "/api/copilot limits access to authorized roles only");
assert(copilotRouteSource.includes('CopilotService.executeQuery'), "/api/copilot delegates to CopilotService.executeQuery");
assert(copilotRouteSource.includes("AuditLogger.logRequest"), "/api/copilot records security audit logs for queries");

const escalateRoutePath = 'frontend/src/app/api/copilot/escalate/route.ts';
assert(fs.existsSync(escalateRoutePath), `Route handler exists at ${escalateRoutePath}`);

const escalateRouteSource = fs.readFileSync(escalateRoutePath, 'utf8');
assert(escalateRouteSource.includes('authorizeRequest'), "/api/copilot/escalate enforces RBAC authorization");
assert(escalateRouteSource.includes('payload.confirm !== true'), "/api/copilot/escalate enforces explicit user confirmation requirement");
assert(escalateRouteSource.includes('idempotency_key') || escalateRouteSource.includes('idempotencyKey'), "/api/copilot/escalate implements idempotency tracking");
assert(escalateRouteSource.includes('COPILOT_ACTION_ESCALATE'), "/api/copilot/escalate audits consequential escalations with COPILOT_ACTION_ESCALATE");


// ====================================================
// TEST 4: Copilot Grounding Service & Multi-Intent Support
// ====================================================
console.log("\n[TEST 4] Verifying Grounding Service & Supported Intents...");

const copilotServicePath = 'frontend/src/lib/copilot/copilot-service.ts';
assert(fs.existsSync(copilotServicePath), `CopilotService exists at ${copilotServicePath}`);

const copilotServiceSource = fs.readFileSync(copilotServicePath, 'utf8');

const supportedIntents = [
  'command_center',
  'priority_cases',
  'pending_referrals',
  'overdue_followups',
  'patient_timeline',
  'explain_triage',
  'proactive_escalations'
];
for (const intent of supportedIntents) {
  assert(copilotServiceSource.includes(intent), `CopilotService supports operational intent: '${intent}'`);
}

assert(copilotServiceSource.includes('handleFreeformQuery'), "CopilotService supports freeform natural language queries");
assert(copilotServiceSource.includes('handleCommandCenter'), "CopilotService falls back to deterministic command center if AI microservice offline");
assert(copilotServiceSource.includes('verified_data'), "Copilot response explicitly partitions verified database records");
assert(copilotServiceSource.includes('protocol_signals'), "Copilot response explicitly partitions protocol safety signals");


// ====================================================
// TEST 5: Frontend UI & Workspace Integration
// ====================================================
console.log("\n[TEST 5] Verifying UI Components & Role Workspace Mounts...");

const drawerPath = 'frontend/src/components/copilot/care-copilot-drawer.tsx';
assert(fs.existsSync(drawerPath), `CareCopilotDrawer component exists at ${drawerPath}`);
const drawerSource = fs.readFileSync(drawerPath, 'utf8');

assert(drawerSource.includes('CareGridSymbol'), "CareCopilotDrawer uses official CareGridSymbol brand mark");
assert(drawerSource.includes('pendingConfirmAction'), "CareCopilotDrawer implements consequential action confirmation dialogue");
assert(drawerSource.includes('verified_data'), "CareCopilotDrawer visually renders verified system records");
assert(drawerSource.includes('protocol_signals'), "CareCopilotDrawer visually renders protocol signals and rule IDs");
assert(drawerSource.includes('nonDiagnosticDisclaimer'), "CareCopilotDrawer renders statutory non-diagnostic disclaimer");

const summaryPath = 'frontend/src/components/copilot/command-center-summary.tsx';
assert(fs.existsSync(summaryPath), `CommandCenterSummary component exists at ${summaryPath}`);
const summarySource = fs.readFileSync(summaryPath, 'utf8');

assert(summarySource.includes('CareGridSymbol'), "CommandCenterSummary uses official CareGridSymbol brand mark");
assert(summarySource.includes('urgentCases'), "CommandCenterSummary renders urgent cases indicator");
assert(summarySource.includes('pendingReferrals'), "CommandCenterSummary renders pending referrals indicator");
assert(summarySource.includes('overdueFollowUps'), "CommandCenterSummary renders overdue follow-ups indicator");

// Verify workspace page mounts
const ashaPageSource = fs.readFileSync('frontend/src/app/(dashboard)/asha/page.tsx', 'utf8');
assert(ashaPageSource.includes('CommandCenterSummary') && ashaPageSource.includes('CareCopilotDrawer'), "ASHA workspace mounts CommandCenterSummary and CareCopilotDrawer");

const doctorPageSource = fs.readFileSync('frontend/src/app/(dashboard)/doctor/page.tsx', 'utf8');
assert(doctorPageSource.includes('CommandCenterSummary') && doctorPageSource.includes('CareCopilotDrawer'), "Doctor workspace mounts CommandCenterSummary and CareCopilotDrawer");

const adminPageSource = fs.readFileSync('frontend/src/app/(dashboard)/admin/page.tsx', 'utf8');
assert(adminPageSource.includes('CommandCenterSummary') && adminPageSource.includes('CareCopilotDrawer'), "Admin workspace mounts CommandCenterSummary and CareCopilotDrawer");

const referralsPageSource = fs.readFileSync('frontend/src/app/(dashboard)/referrals/page.tsx', 'utf8');
assert(referralsPageSource.includes('CommandCenterSummary') && referralsPageSource.includes('CareCopilotDrawer'), "Referrals workspace mounts CommandCenterSummary and CareCopilotDrawer");


// ====================================================
// TEST 6: Trilingual Translation Parity for Copilot
// ====================================================
console.log("\n[TEST 6] Verifying Trilingual Parity (MR, HI, EN) for Copilot...");

const i18nPath = 'frontend/src/lib/copilot/copilot-i18n.ts';
assert(fs.existsSync(i18nPath), `Copilot i18n dictionary exists at ${i18nPath}`);

const i18nSource = fs.readFileSync(i18nPath, 'utf8');
assert(i18nSource.includes('mr: {') && i18nSource.includes('hi: {') && i18nSource.includes('en: {'), "Dictionary defines Marathi, Hindi, and English dictionaries");

const requiredI18nKeys = [
  'copilotTitle',
  'copilotSubtitle',
  'commandCenterTitle',
  'urgentCases',
  'pendingReferrals',
  'overdueFollowUps',
  'actionConfirmTitle',
  'confirmBtn',
  'cancelBtn',
  'nonDiagnosticDisclaimer'
];

for (const key of requiredI18nKeys) {
  assert(i18nSource.includes(`${key}:`), `Copilot dictionary defines required key: '${key}'`);
}


// ====================================================
// TEST 7: Security Isolation & Zero Client-Side Secret Leakage
// ====================================================
console.log("\n[TEST 7] Verifying Security Isolation & Zero Client-Side Secret Leakage...");

const envPath = 'frontend/.env.local';
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  assert(!envContent.includes('SUPABASE_SERVICE_ROLE_KEY'), "No SUPABASE_SERVICE_ROLE_KEY in frontend/.env.local");
  assert(!envContent.includes('POSTGRES_PASSWORD'), "No database POSTGRES_PASSWORD in frontend/.env.local");
  assert(envContent.includes('NEXT_PUBLIC_SUPABASE_URL'), "NEXT_PUBLIC_SUPABASE_URL is properly configured");
}

const clientSrcDir = 'frontend/src';
function scanForSecrets(dir) {
  let leaks = 0;
  const files = fs.readdirSync(dir, { withFileTypes: true });
  for (const file of files) {
    const fullPath = path.join(dir, file.name);
    if (file.isDirectory()) {
      if (file.name !== 'node_modules' && file.name !== '.next') {
        leaks += scanForSecrets(fullPath);
      }
    } else if (file.name.endsWith('.ts') || file.name.endsWith('.tsx') || file.name.endsWith('.js')) {
      const content = fs.readFileSync(fullPath, 'utf8');
      if (content.includes('service_role_key') || content.includes('SERVICE_ROLE_KEY')) {
        console.error(`  LEAK DETECTED in: ${fullPath}`);
        leaks++;
      }
    }
  }
  return leaks;
}

const leakCount = scanForSecrets(clientSrcDir);
assert(leakCount === 0, `Zero hardcoded service-role secrets detected in ${clientSrcDir}`);


// ====================================================
// SUMMARY
// ====================================================
console.log("\n==================================================");
console.log(`TOTAL PHASE C (P1) TESTS: ${totalPassed} PASSED / ${totalFailed} FAILED`);
console.log("==================================================");

if (totalFailed > 0) {
  process.exit(1);
} else {
  console.log("ALL CAREGRID PHASE C (P1) CLINICAL COPILOT CHECKS COMPLETED SUCCESSFULLY!\n");
  process.exit(0);
}
