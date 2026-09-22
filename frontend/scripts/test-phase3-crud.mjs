import fs from 'fs';

console.log("==================================================");
console.log("=== CAREGRID PHASE 3: SUPABASE CRUD TEST SUITE ===");
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

const BASE_URL = 'http://localhost:3000';

// -----------------------------------------------------------------------------
// 1. Source Code Audit: In-Memory / Mock Data Elimination & Supabase Integration
// -----------------------------------------------------------------------------
console.log("\n[TEST 1] Auditing API Route Handlers for Supabase CRUD & Mock Elimination...");

const facilitiesRoute = fs.readFileSync('frontend/src/app/api/facilities/route.ts', 'utf8');
const patientsRoute = fs.readFileSync('frontend/src/app/api/patients/route.ts', 'utf8');
const referralsRoute = fs.readFileSync('frontend/src/app/api/referrals/route.ts', 'utf8');
const followUpsRoute = fs.readFileSync('frontend/src/app/api/follow-ups/route.ts', 'utf8');
const syncRoute = fs.readFileSync('frontend/src/app/api/sync/route.ts', 'utf8');
const triageRoute = fs.readFileSync('frontend/src/app/api/triage/route.ts', 'utf8');

// Verification of Supabase query integration
assert(facilitiesRoute.includes("from('facilities')"), "facilities route queries Supabase 'facilities' table");
assert(patientsRoute.includes("from('patients')"), "patients route queries/inserts Supabase 'patients' table");
assert(referralsRoute.includes("from('referrals')"), "referrals route queries/inserts/updates Supabase 'referrals' table");
assert(followUpsRoute.includes("from('follow_up_tasks')"), "follow-ups route queries/inserts/updates Supabase 'follow_up_tasks' table");
assert(syncRoute.includes("from('patients')"), "sync route handles 'patients' table upserts");
assert(syncRoute.includes("from('encounters')"), "sync route handles 'encounters' table upserts");
assert(syncRoute.includes("from('vitals')"), "sync route handles 'vitals' table upserts");
assert(syncRoute.includes("from('referrals')"), "sync route handles 'referrals' table upserts");
assert(syncRoute.includes("from('follow_up_tasks')"), "sync route handles 'follow_up_tasks' table upserts");

// Elimination of volatile in-memory mutation stores
assert(!referralsRoute.includes('inMemoryReferrals'), "referrals route does not use mutable 'inMemoryReferrals' store");
assert(!followUpsRoute.includes('inMemoryTasks'), "follow-ups route does not use mutable 'inMemoryTasks' store");

// RBAC & RLS preservation on all 6 routes
assert(facilitiesRoute.includes('authorizeRequest'), "facilities route enforces RBAC authorization");
assert(patientsRoute.includes('authorizeRequest'), "patients route enforces RBAC authorization");
assert(referralsRoute.includes('authorizeRequest'), "referrals route enforces RBAC authorization");
assert(followUpsRoute.includes('authorizeRequest'), "follow-ups route enforces RBAC authorization");
assert(syncRoute.includes('authorizeRequest'), "sync route enforces RBAC authorization");
assert(triageRoute.includes('authorizeRequest'), "triage route enforces RBAC authorization");

// -----------------------------------------------------------------------------
// 2. Server Client & Token Forwarding Verification
// -----------------------------------------------------------------------------
console.log("\n[TEST 2] Verifying Supabase Server Client & Auth Context Token Forwarding...");

const serverClientSource = fs.readFileSync('frontend/src/lib/supabase/server.ts', 'utf8');
const rbacSource = fs.readFileSync('frontend/src/lib/auth/rbac.ts', 'utf8');

assert(serverClientSource.includes('accessToken?: string'), "server.ts createClient supports optional accessToken parameter");
assert(serverClientSource.includes('Authorization: `Bearer ${accessToken}`'), "server.ts attaches Bearer authorization header when accessToken provided");
assert(rbacSource.includes('client: supabase') || rbacSource.includes('client?: SupabaseClient'), "rbac.ts passes SupabaseClient instance on authorization context");

// -----------------------------------------------------------------------------
// 3. Clinical Safety & Triage Deterministic Fallback Contract
// -----------------------------------------------------------------------------
console.log("\n[TEST 3] Verifying /api/triage POST-Only Contract & Deterministic Safety Engine...");

assert(triageRoute.includes("status: 405, headers: { Allow: 'POST' }"), "/api/triage strictly responds with HTTP 405 Method Not Allowed on GET");
assert(triageRoute.includes('deterministic_clinical_fallback'), "/api/triage provides deterministic clinical fallback when upstream AI is offline");
assert(triageRoute.includes('emergency_red'), "/api/triage evaluates emergency red clinical tier");
assert(triageRoute.includes('urgent_amber'), "/api/triage evaluates urgent amber clinical tier");
assert(triageRoute.includes('routine_green'), "/api/triage evaluates routine green clinical tier");
assert(triageRoute.includes('DISCLAIMER') && triageRoute.includes('non_diagnostic_disclaimer'), "/api/triage enforces mandatory non-diagnostic disclaimer");

// -----------------------------------------------------------------------------
// 4. Live Server HTTP Verification: Unauthenticated Rejection (Security Boundary)
// -----------------------------------------------------------------------------
console.log("\n[TEST 4] Testing Live HTTP Endpoints for Unauthenticated 401 Rejections...");

async function verifyEndpoint401(endpoint, method, body = null) {
  try {
    const opts = {
      method,
      headers: { 'Content-Type': 'application/json' }
    };
    if (body) opts.body = JSON.stringify(body);

    const res = await fetch(`${BASE_URL}${endpoint}`, opts);
    const data = await res.json().catch(() => ({}));
    assert(res.status === 401, `Unauthenticated ${method} ${endpoint} returns HTTP 401 (Received ${res.status})`);
    assert(data.error && data.error.includes('Unauthorized'), `Response body contains unauthorized notice: "${data.error}"`);
  } catch (err) {
    assert(false, `Failed testing unauthenticated ${method} ${endpoint}: ${err.message}`);
  }
}

await verifyEndpoint401('/api/facilities', 'GET');
await verifyEndpoint401('/api/patients', 'GET');
await verifyEndpoint401('/api/patients', 'POST', { full_name: 'Test', village: 'V', primary_phone: '1' });
await verifyEndpoint401('/api/referrals', 'GET');
await verifyEndpoint401('/api/referrals', 'POST', { patient_id: 'p1', from_facility_id: 'f1', to_facility_id: 'f2' });
await verifyEndpoint401('/api/referrals', 'PATCH', { id: 'r1', status: 'acknowledged' });
await verifyEndpoint401('/api/follow-ups', 'GET');
await verifyEndpoint401('/api/follow-ups', 'POST', { patient_id: 'p1', assigned_asha_id: 'a1', due_date: '2026-09-30' });
await verifyEndpoint401('/api/follow-ups', 'PATCH', { id: 't1', status: 'completed' });
await verifyEndpoint401('/api/sync', 'GET');
await verifyEndpoint401('/api/sync', 'POST', { entity_type: 'patient', payload: {} });
await verifyEndpoint401('/api/triage', 'POST', { symptoms: ['fever'], age: 25 });

// -----------------------------------------------------------------------------
// 5. Live Server HTTP Verification: /api/triage 405 Method Not Allowed Contract
// -----------------------------------------------------------------------------
console.log("\n[TEST 5] Testing Live HTTP /api/triage 405 Method Not Allowed Contract...");

try {
  const getRes = await fetch(`${BASE_URL}/api/triage`, { method: 'GET' });
  assert(getRes.status === 405, `GET /api/triage returned HTTP 405 (Received ${getRes.status})`);
  assert(getRes.headers.get('allow') === 'POST', "Response headers contain 'Allow: POST'");
  const getData = await getRes.json();
  assert(getData.error && getData.error.includes('Method Not Allowed'), "GET /api/triage response contains 'Method Not Allowed' message");
} catch (err) {
  assert(false, `Failed testing /api/triage GET 405: ${err.message}`);
}

// -----------------------------------------------------------------------------
// 6. Schema & Data Attribute Alignment Verification
// -----------------------------------------------------------------------------
console.log("\n[TEST 6] Verifying Database Schema & API Contract Alignment...");

const schemaMigration = fs.readFileSync('backend/supabase/migrations/00001_initial_schema.sql', 'utf8');

// Facilities schema validation
assert(schemaMigration.includes('CREATE TABLE IF NOT EXISTS facilities'), "Database schema defines 'facilities' table");
assert(schemaMigration.includes('facility_code TEXT UNIQUE NOT NULL'), "facilities table has unique 'facility_code'");
assert(schemaMigration.includes('facility_type facility_type NOT NULL'), "facilities table has 'facility_type' enum");

// Patients schema validation
assert(schemaMigration.includes('CREATE TABLE IF NOT EXISTS patients'), "Database schema defines 'patients' table");
assert(schemaMigration.includes('full_name TEXT NOT NULL'), "patients table has 'full_name'");
assert(schemaMigration.includes('primary_facility_id UUID REFERENCES facilities(id)'), "patients table references 'facilities'");
assert(schemaMigration.includes('is_pregnant BOOLEAN DEFAULT FALSE'), "patients table has 'is_pregnant'");
assert(schemaMigration.includes('high_risk_pregnancy BOOLEAN DEFAULT FALSE'), "patients table has 'high_risk_pregnancy'");

// Referrals schema validation
assert(schemaMigration.includes('CREATE TABLE IF NOT EXISTS referrals'), "Database schema defines 'referrals' table");
assert(schemaMigration.includes('referral_code TEXT UNIQUE NOT NULL'), "referrals table has 'referral_code'");
assert(schemaMigration.includes('urgency_tier urgency_tier NOT NULL'), "referrals table has 'urgency_tier'");
assert(schemaMigration.includes('status referral_status NOT NULL'), "referrals table has 'status'");
assert(schemaMigration.includes('closed_at TIMESTAMPTZ'), "referrals table has 'closed_at'");

// Follow-up tasks schema validation
assert(schemaMigration.includes('CREATE TABLE IF NOT EXISTS follow_up_tasks'), "Database schema defines 'follow_up_tasks' table");
assert(schemaMigration.includes('assigned_asha_id UUID NOT NULL REFERENCES profiles(id)'), "follow_up_tasks references 'profiles'");
assert(schemaMigration.includes('due_date DATE NOT NULL'), "follow_up_tasks has 'due_date'");
assert(schemaMigration.includes('status follow_up_status NOT NULL'), "follow_up_tasks has 'status'");

// Sync queue entities support
assert(schemaMigration.includes('CREATE TABLE IF NOT EXISTS encounters'), "Database schema defines 'encounters' table for sync");
assert(schemaMigration.includes('CREATE TABLE IF NOT EXISTS vitals'), "Database schema defines 'vitals' table for sync");

// -----------------------------------------------------------------------------
// 7. Security Isolation Verification
// -----------------------------------------------------------------------------
console.log("\n[TEST 7] Verifying Security Isolation & Zero Client-Side Secret Leakage...");

if (fs.existsSync('frontend/.env.local')) {
  const envText = fs.readFileSync('frontend/.env.local', 'utf8');
  assert(!envText.includes('SUPABASE_SERVICE_ROLE_KEY'), "No SUPABASE_SERVICE_ROLE_KEY in frontend/.env.local");
  assert(!envText.includes('POSTGRES_PASSWORD'), "No database POSTGRES_PASSWORD in frontend/.env.local");
  assert(envText.includes('NEXT_PUBLIC_SUPABASE_URL'), "NEXT_PUBLIC_SUPABASE_URL is configured");
  assert(
    envText.includes('NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY') || envText.includes('NEXT_PUBLIC_SUPABASE_ANON_KEY'),
    "Publishable/Anon key is configured"
  );
}

console.log("\n==================================================");
console.log(`TOTAL PHASE 3 TESTS: ${totalPassed} PASSED / ${totalFailed} FAILED`);
console.log("==================================================");

if (totalFailed > 0) {
  process.exit(1);
} else {
  console.log("ALL PHASE 3 SUPABASE CRUD VERIFICATION CHECKS COMPLETED SUCCESSFULLY!");
}
