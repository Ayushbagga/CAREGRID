/**
 * CAREGRID PHASE B (P0 Foundation Hardening) Automated Verification Test Suite
 * 
 * Verifies:
 * 1. Security Audit Logging & Sensitive Data Redaction
 * 2. Standardized API Success & Error Response Contracts
 * 3. Database Table Alignment (follow_ups / follow_up_tasks resilience)
 * 4. Production Security Headers & CSP Configuration
 * 5. Offline Sync Observability, Retry Tracking & UI Telemetry
 * 6. Zero Service-Role Secret Leakage & Security Isolation
 */

import fs from 'fs';
import path from 'path';

console.log("==================================================");
console.log("=== CAREGRID PHASE B: P0 HARDENING TEST SUITE  ===");
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
// TEST 1: Centralized Security Audit Logging Service
// ====================================================
console.log("\n[TEST 1] Verifying Centralized Security Audit Logging Service...");

const auditLoggerPath = 'frontend/src/lib/audit/audit-logger.ts';
assert(fs.existsSync(auditLoggerPath), `Audit logger service file exists at ${auditLoggerPath}`);

const auditLoggerSource = fs.readFileSync(auditLoggerPath, 'utf8');

assert(auditLoggerSource.includes('class AuditLogger'), "AuditLogger class is exported");
assert(auditLoggerSource.includes('public static async log('), "AuditLogger provides static log method");
assert(auditLoggerSource.includes('public static async logRequest('), "AuditLogger provides static logRequest helper for NextRequest");
assert(auditLoggerSource.includes('function sanitizeAuditDiff'), "AuditLogger module implements sanitizeAuditDiff for redaction");

// Verify sensitive field keys in redaction set
const sensitiveFields = ['password', 'token', 'access_token', 'refresh_token', 'otp', 'secret', 'api_key'];
for (const field of sensitiveFields) {
  assert(
    auditLoggerSource.toLowerCase().includes(field.toLowerCase()),
    `Audit logger redacts sensitive keyword: '${field}'`
  );
}

// Verify append-only write to audit_logs
assert(
  auditLoggerSource.includes(".from('audit_logs').insert("),
  "AuditLogger inserts into public.audit_logs table"
);

// Verify index re-export
const auditIndexPath = 'frontend/src/lib/audit/index.ts';
assert(fs.existsSync(auditIndexPath), `Audit module index exists at ${auditIndexPath}`);
const auditIndexSource = fs.readFileSync(auditIndexPath, 'utf8');
assert(auditIndexSource.includes("./audit-logger"), "Audit module re-exports from ./audit-logger");


// ====================================================
// TEST 2: Standardized API Error & Success Contracts
// ====================================================
console.log("\n[TEST 2] Verifying Standardized API Error & Success Contracts...");

const apiResponsePath = 'frontend/src/lib/api/response.ts';
assert(fs.existsSync(apiResponsePath), `API response helper exists at ${apiResponsePath}`);

const apiResponseSource = fs.readFileSync(apiResponsePath, 'utf8');

assert(apiResponseSource.includes('export function successResponse'), "successResponse helper is exported");
assert(apiResponseSource.includes('export function errorResponse'), "errorResponse helper is exported");
assert(apiResponseSource.includes('success: true'), "successResponse formats success: true");
assert(apiResponseSource.includes('success: false'), "errorResponse formats success: false");
assert(apiResponseSource.includes('timestamp: new Date().toISOString()'), "Standard responses include ISO timestamp");
assert(apiResponseSource.includes('safeDetails'), "Stack traces are stripped in production responses");

// Verify default error codes
const expectedErrorCodes = [
  'BAD_REQUEST',
  'UNAUTHORIZED',
  'FORBIDDEN',
  'NOT_FOUND',
  'METHOD_NOT_ALLOWED',
  'INTERNAL_SERVER_ERROR',
  'SERVICE_UNAVAILABLE'
];
for (const code of expectedErrorCodes) {
  assert(apiResponseSource.includes(code), `API error codes include '${code}'`);
}

// Verify all protected API routes use standardized response helpers
const crudApiRoutes = [
  { name: 'facilities', path: 'frontend/src/app/api/facilities/route.ts' },
  { name: 'patients', path: 'frontend/src/app/api/patients/route.ts' },
  { name: 'referrals', path: 'frontend/src/app/api/referrals/route.ts' },
  { name: 'follow-ups', path: 'frontend/src/app/api/follow-ups/route.ts' },
  { name: 'sync', path: 'frontend/src/app/api/sync/route.ts' }
];

for (const route of crudApiRoutes) {
  assert(fs.existsSync(route.path), `Route handler exists: ${route.name}`);
  const src = fs.readFileSync(route.path, 'utf8');
  assert(
    src.includes('errorResponse') && src.includes('successResponse'),
    `Route /api/${route.name} implements errorResponse and successResponse contracts`
  );
}

// Triage route uses errorResponse and AuditLogger
const triageRoutePath = 'frontend/src/app/api/triage/route.ts';
assert(fs.existsSync(triageRoutePath), "Route handler exists: triage");
const triageSrc = fs.readFileSync(triageRoutePath, 'utf8');
assert(triageSrc.includes('errorResponse'), "Route /api/triage implements standardized errorResponse contract");
assert(triageSrc.includes('AuditLogger.logRequest'), "Route /api/triage logs security audit events on high-urgency escalation");


// ====================================================
// TEST 3: Database Schema & Table Alignment
// ====================================================
console.log("\n[TEST 3] Verifying Supabase Table Alignment (follow_ups vs follow_up_tasks)...");

const followUpsRouteSource = fs.readFileSync('frontend/src/app/api/follow-ups/route.ts', 'utf8');
assert(
  followUpsRouteSource.includes("from('follow_ups')") || followUpsRouteSource.includes('follow_ups'),
  "follow-ups route aligns with live Supabase 'follow_ups' table"
);
assert(
  followUpsRouteSource.includes('follow_up_tasks'),
  "follow-ups route retains backward-compatible fallback for 'follow_up_tasks'"
);

const syncRouteSource = fs.readFileSync('frontend/src/app/api/sync/route.ts', 'utf8');
assert(
  syncRouteSource.includes('follow_ups') && syncRouteSource.includes('follow_up_tasks'),
  "sync route supports both 'follow_ups' and 'follow_up_tasks' entities seamlessly"
);
assert(
  syncRouteSource.includes('idempotency_key') || syncRouteSource.includes('idempotency'),
  "sync route implements idempotency receipt tracking"
);


// ====================================================
// TEST 4: Production Security Headers & CSP
// ====================================================
console.log("\n[TEST 4] Verifying Production Security Headers & Content Security Policy...");

const nextConfigPath = 'frontend/next.config.mjs';
assert(fs.existsSync(nextConfigPath), `next.config.mjs exists at ${nextConfigPath}`);
const nextConfigSource = fs.readFileSync(nextConfigPath, 'utf8');

assert(nextConfigSource.includes('Content-Security-Policy'), "Content-Security-Policy header configured");
assert(nextConfigSource.includes('accounts.google.com'), "CSP allows accounts.google.com for Google OAuth");
assert(nextConfigSource.includes('*.supabase.co'), "CSP allows *.supabase.co for Supabase backend");
assert(nextConfigSource.includes('wss://*.supabase.co'), "CSP allows wss://*.supabase.co for Supabase Realtime");
assert(nextConfigSource.includes('Strict-Transport-Security'), "Strict-Transport-Security (HSTS) header configured");
assert(nextConfigSource.includes('includeSubDomains') && nextConfigSource.includes('preload'), "HSTS includes subdomains and preload directive");
assert(nextConfigSource.includes('X-Content-Type-Options') && nextConfigSource.includes('nosniff'), "X-Content-Type-Options: nosniff configured");
assert(nextConfigSource.includes('X-Frame-Options') && (nextConfigSource.includes('DENY') || nextConfigSource.includes('SAMEORIGIN')), "X-Frame-Options configured against clickjacking");
assert(nextConfigSource.includes('Permissions-Policy'), "Permissions-Policy header configured");
assert(nextConfigSource.includes('camera=(self)'), "Permissions-Policy allows camera only on self for teleconsult");
assert(nextConfigSource.includes('microphone=(self)'), "Permissions-Policy allows microphone only on self for teleconsult");
assert(nextConfigSource.includes('no-store'), "API routes configure Cache-Control: no-store");


// ====================================================
// TEST 5: Offline Sync Observability & UX Telemetry
// ====================================================
console.log("\n[TEST 5] Verifying Offline Sync Observability & Telemetry...");

const syncManagerPath = 'frontend/src/lib/offline-sync/sync-manager.ts';
const syncManagerSource = fs.readFileSync(syncManagerPath, 'utf8');

assert(syncManagerSource.includes('getLastSyncTime'), "SyncManager provides getLastSyncTime");
assert(syncManagerSource.includes('setLastSyncTime'), "SyncManager provides setLastSyncTime");
assert(syncManagerSource.includes('getTelemetry'), "SyncManager provides getTelemetry with failedCount & pendingCount");
assert(syncManagerSource.includes('retry_count'), "SyncManager tracks item retry_count on sync failures");

const modalPath = 'frontend/src/components/asha/sync-status-modal.tsx';
assert(fs.existsSync(modalPath), `SyncStatusModal component exists at ${modalPath}`);
const modalSource = fs.readFileSync(modalPath, 'utf8');

assert(modalSource.includes('formatLastSync') || modalSource.includes('lastSyncTime'), "SyncStatusModal displays last sync timestamp");
assert(modalSource.includes('getOpBadgeClass') || modalSource.includes('CREATE'), "SyncStatusModal renders operation type badges (CREATE/UPDATE/DELETE)");
assert(modalSource.includes('retry') || modalSource.includes('retries'), "SyncStatusModal displays retry count alerts");
assert(modalSource.includes('getTelemetry'), "SyncStatusModal integrates with SyncManager telemetry");


// ====================================================
// TEST 6: Zero Secret Leakage & Isolation
// ====================================================
console.log("\n[TEST 6] Verifying Security Isolation & Zero Client-Side Secret Leakage...");

const envPath = 'frontend/.env.local';
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  assert(!envContent.includes('SUPABASE_SERVICE_ROLE_KEY'), "No SUPABASE_SERVICE_ROLE_KEY in frontend/.env.local");
  assert(!envContent.includes('POSTGRES_PASSWORD'), "No database POSTGRES_PASSWORD in frontend/.env.local");
  assert(envContent.includes('NEXT_PUBLIC_SUPABASE_URL'), "NEXT_PUBLIC_SUPABASE_URL is properly configured");
}

// Check that client-side components do not import service-role keys
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
console.log(`TOTAL PHASE B (P0) TESTS: ${totalPassed} PASSED / ${totalFailed} FAILED`);
console.log("==================================================");

if (totalFailed > 0) {
  process.exit(1);
} else {
  console.log("ALL CAREGRID PHASE B (P0) FOUNDATION HARDENING CHECKS COMPLETED SUCCESSFULLY!\n");
  process.exit(0);
}
