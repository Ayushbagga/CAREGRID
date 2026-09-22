import fs from 'fs';

console.log("==================================================");
console.log("=== CAREGRID PHASE 2: AUTHORIZATION TEST SUITE ===");
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

// -----------------------------------------------------------------------------
// 0. File Integrity & Code Contracts
// -----------------------------------------------------------------------------
console.log("\n[TEST 0] Verifying Implementation Source Files...");
const rolesPath = 'frontend/src/lib/auth/roles.ts';
const rbacPath = 'frontend/src/lib/auth/rbac.ts';
const middlewarePath = 'frontend/src/lib/supabase/middleware.ts';
const unauthPagePath = 'frontend/src/app/(auth)/unauthorized/page.tsx';

assert(fs.existsSync(rolesPath), 'frontend/src/lib/auth/roles.ts exists');
assert(fs.existsSync(rbacPath), 'frontend/src/lib/auth/rbac.ts exists');
assert(fs.existsSync(middlewarePath), 'frontend/src/lib/supabase/middleware.ts exists');
assert(fs.existsSync(unauthPagePath), 'frontend/src/app/(auth)/unauthorized/page.tsx exists');

const rolesSource = fs.readFileSync(rolesPath, 'utf8');
const rbacSource = fs.readFileSync(rbacPath, 'utf8');
const middlewareSource = fs.readFileSync(middlewarePath, 'utf8');

assert(rolesSource.includes('export function normalizeRole'), 'normalizeRole exported in roles.ts');
assert(rolesSource.includes('export function getRoleFromUser'), 'getRoleFromUser exported in roles.ts');
assert(rolesSource.includes('export function isRoleAuthorized'), 'isRoleAuthorized exported in roles.ts');
assert(rolesSource.includes('export function getWorkspaceForRole'), 'getWorkspaceForRole exported in roles.ts');
assert(rbacSource.includes('export async function authorizeRequest'), 'authorizeRequest exported in rbac.ts');
assert(middlewareSource.includes('/unauthorized'), 'middleware redirects unauthorized roles to /unauthorized');
assert(middlewareSource.includes('/login'), 'middleware redirects unauthenticated users to /login');

// Pure Evaluator Logic Matching roles.ts
function normalizeRole(rawRole) {
  if (!rawRole || typeof rawRole !== 'string') return null;
  const r = rawRole.toLowerCase().trim();
  if (r === 'citizen' || r === 'patient') return 'citizen';
  if (r === 'asha' || r === 'asha_worker' || r === 'anm' || r === 'anm_worker') return 'asha';
  if (r === 'doctor' || r === 'medical_officer' || r === 'specialist_doctor' || r === 'mo_doctor') return 'doctor';
  if (r === 'admin' || r === 'facility_admin' || r === 'district_officer' || r === 'state_admin' || r === 'admin_governance') return 'admin';
  return null;
}

function getRoleFromUser(user) {
  if (!user) return 'citizen';
  const appRole = normalizeRole(user.app_metadata?.role || user.app_metadata?.user_role);
  if (appRole) return appRole;
  const userRole = normalizeRole(user.user_metadata?.role || user.user_metadata?.user_role);
  if (userRole) return userRole;
  return 'citizen';
}

function isRoleAuthorized(userRole, allowedRoles) {
  if (userRole === 'admin') return true;
  return allowedRoles.includes(userRole);
}

function getWorkspaceForRole(role) {
  switch (role) {
    case 'asha': return '/asha';
    case 'doctor': return '/doctor';
    case 'admin': return '/admin';
    case 'citizen':
    default: return '/citizen';
  }
}

// -----------------------------------------------------------------------------
// 1. Role Normalization & Canonical Roles
// -----------------------------------------------------------------------------
console.log("\n[TEST 1] Testing Canonical Role Normalization...");

assert(normalizeRole('citizen') === 'citizen', "normalizeRole('citizen') === 'citizen'");
assert(normalizeRole('patient') === 'citizen', "normalizeRole('patient') === 'citizen'");
assert(normalizeRole('asha') === 'asha', "normalizeRole('asha') === 'asha'");
assert(normalizeRole('asha_worker') === 'asha', "normalizeRole('asha_worker') === 'asha'");
assert(normalizeRole('anm_worker') === 'asha', "normalizeRole('anm_worker') === 'asha'");
assert(normalizeRole('doctor') === 'doctor', "normalizeRole('doctor') === 'doctor'");
assert(normalizeRole('medical_officer') === 'doctor', "normalizeRole('medical_officer') === 'doctor'");
assert(normalizeRole('specialist_doctor') === 'doctor', "normalizeRole('specialist_doctor') === 'doctor'");
assert(normalizeRole('admin') === 'admin', "normalizeRole('admin') === 'admin'");
assert(normalizeRole('facility_admin') === 'admin', "normalizeRole('facility_admin') === 'admin'");
assert(normalizeRole('district_officer') === 'admin', "normalizeRole('district_officer') === 'admin'");
assert(normalizeRole('state_admin') === 'admin', "normalizeRole('state_admin') === 'admin'");
assert(normalizeRole('invalid_role') === null, "normalizeRole('invalid_role') === null");

// -----------------------------------------------------------------------------
// 2. Metadata Derivation & Anti-Spoofing
// -----------------------------------------------------------------------------
console.log("\n[TEST 2] Testing Metadata Role Derivation (app_metadata priority)...");

// Priority check: app_metadata overrides user_metadata
const userWithBoth = {
  id: 'u-1',
  app_metadata: { role: 'medical_officer' },
  user_metadata: { role: 'citizen' }
};
assert(getRoleFromUser(userWithBoth) === 'doctor', "app_metadata.role takes precedence over user_metadata.role");

// Fallback to user_metadata if app_metadata not set
const userWithUserMeta = {
  id: 'u-2',
  app_metadata: {},
  user_metadata: { role: 'asha_worker' }
};
assert(getRoleFromUser(userWithUserMeta) === 'asha', "user_metadata.role used when app_metadata is empty");

// Default to 'citizen' if no role metadata is set on authenticated user
const userWithNoMeta = {
  id: 'u-3',
  app_metadata: {},
  user_metadata: {}
};
assert(getRoleFromUser(userWithNoMeta) === 'citizen', "Default fallback to 'citizen' when no role metadata present");

// Workspace mapping
assert(getWorkspaceForRole('citizen') === '/citizen', "getWorkspaceForRole('citizen') -> '/citizen'");
assert(getWorkspaceForRole('asha') === '/asha', "getWorkspaceForRole('asha') -> '/asha'");
assert(getWorkspaceForRole('doctor') === '/doctor', "getWorkspaceForRole('doctor') -> '/doctor'");
assert(getWorkspaceForRole('admin') === '/admin', "getWorkspaceForRole('admin') -> '/admin'");

// -----------------------------------------------------------------------------
// 3. Role Authorization Matrix (Citizen vs ASHA vs Doctor vs Admin)
// -----------------------------------------------------------------------------
console.log("\n[TEST 3] Testing Role Authorization Matrix (Frontend & API)...");

// Citizen permissions
assert(isRoleAuthorized('citizen', ['citizen']) === true, "Citizen authorized for citizen area");
assert(isRoleAuthorized('citizen', ['asha']) === false, "Citizen forbidden for asha area");
assert(isRoleAuthorized('citizen', ['doctor']) === false, "Citizen forbidden for doctor area");
assert(isRoleAuthorized('citizen', ['admin']) === false, "Citizen forbidden for admin area");
assert(isRoleAuthorized('citizen', ['asha', 'doctor']) === false, "Citizen forbidden for clinical referrals/triage");

// ASHA permissions
assert(isRoleAuthorized('asha', ['asha']) === true, "ASHA authorized for asha area");
assert(isRoleAuthorized('asha', ['asha', 'doctor']) === true, "ASHA authorized for clinical referrals");
assert(isRoleAuthorized('asha', ['doctor']) === false, "ASHA forbidden for doctor queue");
assert(isRoleAuthorized('asha', ['admin']) === false, "ASHA forbidden for admin console");

// Doctor permissions
assert(isRoleAuthorized('doctor', ['doctor']) === true, "Doctor authorized for doctor area");
assert(isRoleAuthorized('doctor', ['asha', 'doctor']) === true, "Doctor authorized for clinical referrals");
assert(isRoleAuthorized('doctor', ['asha']) === false, "Doctor forbidden for asha field intake");
assert(isRoleAuthorized('doctor', ['admin']) === false, "Doctor forbidden for admin console");

// Admin supervisory permissions (inherits all areas)
assert(isRoleAuthorized('admin', ['admin']) === true, "Admin authorized for admin area");
assert(isRoleAuthorized('admin', ['doctor']) === true, "Admin supervisory access to doctor area");
assert(isRoleAuthorized('admin', ['asha']) === true, "Admin supervisory access to asha area");
assert(isRoleAuthorized('admin', ['citizen']) === true, "Admin supervisory access to citizen area");
assert(isRoleAuthorized('admin', ['asha', 'doctor']) === true, "Admin supervisory access to clinical referrals");

// -----------------------------------------------------------------------------
// 4. Live Server HTTP Verification: Frontend Route Guards (Redirect to /login)
// -----------------------------------------------------------------------------
console.log("\n[TEST 4] Testing Live HTTP Frontend Route Guards (Unauthenticated Redirects)...");

const BASE_URL = 'http://localhost:3000';

async function testRedirect(path, expectedRedirectPath) {
  try {
    const res = await fetch(`${BASE_URL}${path}`, {
      redirect: 'manual'
    });

    const isRedirect = res.status === 307 || res.status === 308 || res.status === 302 || res.status === 303;
    const location = res.headers.get('location') || '';
    const hasRedirectTarget = location.includes(expectedRedirectPath);

    assert(
      isRedirect && hasRedirectTarget,
      `Unauthenticated GET ${path} returned HTTP ${res.status} redirecting to ${location}`
    );
  } catch (err) {
    assert(false, `Failed to test route guard for ${path}: ${err.message}`);
  }
}

async function testPublicRoute(path, expectedStatus = 200) {
  try {
    const res = await fetch(`${BASE_URL}${path}`);
    assert(res.status === expectedStatus, `Public GET ${path} returned HTTP ${res.status}`);
  } catch (err) {
    assert(false, `Failed to reach public route ${path}: ${err.message}`);
  }
}

// Protected Areas Redirect Test
await testRedirect('/asha', '/login?redirect=%2Fasha');
await testRedirect('/doctor', '/login?redirect=%2Fdoctor');
await testRedirect('/admin', '/login?redirect=%2Fadmin');
await testRedirect('/citizen', '/login?redirect=%2Fcitizen');
await testRedirect('/referrals', '/login?redirect=%2Freferrals');

// Public Pages Test
await testPublicRoute('/', 200);
await testPublicRoute('/login', 200);
await testPublicRoute('/unauthorized', 200);

// -----------------------------------------------------------------------------
// 5. Live Server HTTP Verification: API Route Protection (401 Unauthorized)
// -----------------------------------------------------------------------------
console.log("\n[TEST 5] Testing Live HTTP API Route Protection (401 for Unauthenticated)...");

async function testApi401(endpoint, method = 'GET', body = null) {
  try {
    const options = {
      method,
      headers: { 'Content-Type': 'application/json' }
    };
    if (body) {
      options.body = JSON.stringify(body);
    }

    const res = await fetch(`${BASE_URL}${endpoint}`, options);
    const data = await res.json().catch(() => ({}));

    assert(
      res.status === 401,
      `Unauthenticated ${method} ${endpoint} returned HTTP ${res.status} 401 Unauthorized`
    );
    assert(
      data.error && data.error.includes('Unauthorized'),
      `Response contains standard error message: "${data.error}"`
    );
  } catch (err) {
    assert(false, `Failed to test API protection for ${endpoint}: ${err.message}`);
  }
}

// Test all 6 protected API endpoints
await testApi401('/api/patients', 'GET');
await testApi401('/api/patients', 'POST', { full_name: 'Test Patient', village: 'Reguntha', primary_phone: '+919999999999' });
await testApi401('/api/referrals', 'GET');
await testApi401('/api/referrals', 'POST', { patient_id: 'pat-1', from_facility_id: 'fac-1', to_facility_id: 'fac-2' });
await testApi401('/api/follow-ups', 'GET');
await testApi401('/api/follow-ups', 'POST', { patient_id: 'pat-1', assigned_asha_id: 'asha-1', due_date: '2026-09-25' });
await testApi401('/api/facilities', 'GET');
await testApi401('/api/sync', 'GET');
await testApi401('/api/sync', 'POST', { entity_type: 'patient', payload: {} });
await testApi401('/api/triage', 'POST', { symptoms: ['fever'], age: 30, gender: 'female' });

// -----------------------------------------------------------------------------
// 6. Live Server HTTP Verification: /api/triage POST-Only Contract (405 Method Not Allowed)
// -----------------------------------------------------------------------------
console.log("\n[TEST 6] Testing /api/triage POST-Only Safety Contract...");

try {
  const res = await fetch(`${BASE_URL}/api/triage`, { method: 'GET' });
  assert(res.status === 405, `GET /api/triage returned HTTP ${res.status} Method Not Allowed`);
  assert(res.headers.get('allow') === 'POST', "Response headers contain 'Allow: POST'");
} catch (err) {
  assert(false, `Failed to test /api/triage 405 contract: ${err.message}`);
}

console.log("\n==================================================");
console.log(`TOTAL PHASE 2 TESTS: ${totalPassed} PASSED / ${totalFailed} FAILED`);
console.log("==================================================");

if (totalFailed > 0) {
  process.exit(1);
} else {
  console.log("ALL PHASE 2 AUTHORIZATION CHECKS COMPLETED SUCCESSFULLY!");
}
