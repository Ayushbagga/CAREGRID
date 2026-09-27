import fs from 'fs';
import path from 'path';

console.log("==================================================");
console.log("=== CAREGRID AUTH UX VERIFICATION TEST SUITE   ===");
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

// ----------------------------------------------------
// 1. Trilingual Translation Parity Verification
// ----------------------------------------------------
console.log("\n[TEST 1] Verifying Trilingual Parity (303 keys in MR, HI, EN)...");
const translationsFile = fs.readFileSync('frontend/src/lib/i18n/translations.ts', 'utf8');

function extractKeys(locale) {
  const regex = new RegExp(`${locale}:\\s*{([^}]+)}`, 's');
  const match = translationsFile.match(regex);
  if (!match) return [];
  return match[1]
    .split('\n')
    .map(line => line.trim())
    .filter(line => line && !line.startsWith('//') && line.includes(':'))
    .map(line => line.split(':')[0].trim());
}

const mrKeys = extractKeys('mr');
const hiKeys = extractKeys('hi');
const enKeys = extractKeys('en');

assert(mrKeys.length === 303, `Marathi key count is 303 (${mrKeys.length} === 303)`);
assert(hiKeys.length === 303, `Hindi key count is 303 (${hiKeys.length} === 303)`);
assert(enKeys.length === 303, `English key count is 303 (${enKeys.length} === 303)`);
assert(mrKeys.length === enKeys.length, `Marathi key count matches English (${mrKeys.length} === ${enKeys.length})`);
assert(hiKeys.length === enKeys.length, `Hindi key count matches English (${hiKeys.length} === ${enKeys.length})`);

const requiredNewAuthKeys = [
  'continueWithGoogle',
  'orDivider',
  'signInAccessPortal',
  'myWorkspace',
  'backToCareGrid',
  'loginErrorOAuth'
];

requiredNewAuthKeys.forEach(key => {
  assert(enKeys.includes(key), `Key '${key}' present in English dictionary`);
  assert(mrKeys.includes(key), `Key '${key}' present in Marathi dictionary`);
  assert(hiKeys.includes(key), `Key '${key}' present in Hindi dictionary`);
});

// ----------------------------------------------------
// 2. Landing Page UX & Navigation
// ----------------------------------------------------
console.log("\n[TEST 2] Verifying Landing Page UX & Portal Actions (/)...");
const landingPagePath = 'frontend/src/app/page.tsx';
assert(fs.existsSync(landingPagePath), 'frontend/src/app/page.tsx exists');

const landingCode = fs.readFileSync(landingPagePath, 'utf8');
assert(landingCode.includes('signInAccessPortal'), 'Landing page contains primary Sign In / Access Portal action');
assert(landingCode.includes('myWorkspace'), 'Landing page contains My Workspace action for authenticated users');
assert(landingCode.includes('getPortalHref'), 'Landing page contains getPortalHref redirect preserving helper');
assert(landingCode.includes("redirect=${encodeURIComponent(portalPath)}"), 'Unauthenticated portal clicks redirect to /login with target preserved');
assert(landingCode.includes('getWorkspaceForRole'), 'Landing page imports and uses getWorkspaceForRole');
assert(landingCode.includes('/asha'), 'Portal card links to /asha');
assert(landingCode.includes('/doctor'), 'Portal card links to /doctor');
assert(landingCode.includes('/referrals'), 'Portal card links to /referrals');
assert(landingCode.includes('/citizen'), 'Portal card links to /citizen');
assert(landingCode.includes('/admin'), 'Portal card links to /admin');
assert(landingCode.includes('LanguageSwitcher'), 'Landing page includes LanguageSwitcher');

// ----------------------------------------------------
// 3. Login Screen UX & Authentication Modes
// ----------------------------------------------------
console.log("\n[TEST 3] Verifying Login Interface (/login)...");
const loginPagePath = 'frontend/src/app/(auth)/login/page.tsx';
assert(fs.existsSync(loginPagePath), 'frontend/src/app/(auth)/login/page.tsx exists');

const loginCode = fs.readFileSync(loginPagePath, 'utf8');
assert(loginCode.includes('continueWithGoogle'), 'Login page includes "Continue with Google"');
assert(loginCode.includes('signInWithOAuth'), 'Login page implements Supabase signInWithOAuth');
assert(loginCode.includes("provider: 'google'"), 'Login page configures Google OAuth provider');
assert(loginCode.includes('/auth/callback'), 'OAuth redirect points to /auth/callback');
assert(loginCode.includes('GoogleIcon'), 'Official Google SVG icon rendered in Google login button');
assert(loginCode.includes('orDivider'), 'Login page includes clean visual divider between OAuth and Email');
assert(loginCode.includes('signInWithOtp'), 'Login page implements Email OTP request');
assert(loginCode.includes('verifyOtp'), 'Login page implements Email OTP verification');
assert(loginCode.includes('signInWithPassword'), 'Login page implements Password fallback login');
assert(loginCode.includes('oauth_exchange_failed'), 'Login page handles oauth_exchange_failed query param');
assert(loginCode.includes('LanguageSwitcher'), 'Login page includes LanguageSwitcher');
assert(loginCode.includes('backToCareGrid'), 'Login page includes Back to CAREGRID link');
assert(loginCode.includes('CareGridSymbol'), 'Login page includes CAREGRID brand symbol');
assert(!loginCode.includes('localStorage'), 'No tokens or credentials stored in localStorage');
assert(!loginCode.includes('admin123') && !loginCode.includes('demo123'), 'Zero hardcoded demo credentials in login page');

// ----------------------------------------------------
// 4. OAuth Callback SSR Route Handler
// ----------------------------------------------------
console.log("\n[TEST 4] Verifying OAuth Callback SSR Route Handler (/auth/callback)...");
const callbackPath = 'frontend/src/app/auth/callback/route.ts';
assert(fs.existsSync(callbackPath), 'frontend/src/app/auth/callback/route.ts exists');

const callbackCode = fs.readFileSync(callbackPath, 'utf8');
assert(callbackCode.includes('exchangeCodeForSession'), 'Callback handler exchanges auth code for session');
assert(callbackCode.includes('createServerClient') || callbackCode.includes('createClient'), 'Callback handler uses SSR server client with cookie persistence');
assert(callbackCode.includes('getRoleFromUser'), 'Callback handler inspects user metadata for role derivation');
assert(callbackCode.includes('getWorkspaceForRole'), 'Callback handler routes user to canonical role workspace');
assert(callbackCode.includes("next.startsWith('/')"), 'Callback handler validates next parameter against open-redirects');
assert(callbackCode.includes("!next.startsWith('//')"), 'Callback handler guards against scheme-relative redirects');
assert(callbackCode.includes('oauth_exchange_failed'), 'Callback handler returns to login with error parameter on failure');

// ----------------------------------------------------
// 5. Auth Context & Roles Integration
// ----------------------------------------------------
console.log("\n[TEST 5] Verifying Auth Context & Roles Integration...");
const clientAuthPath = 'frontend/src/lib/auth/client.ts';
const indexAuthPath = 'frontend/src/lib/auth/index.ts';

const clientAuthCode = fs.readFileSync(clientAuthPath, 'utf8');
const indexAuthCode = fs.readFileSync(indexAuthPath, 'utf8');

assert(clientAuthCode.includes('getRoleFromUser'), 'client.ts uses getRoleFromUser');
assert(clientAuthCode.includes('role,'), 'useAuth hook exposes role to client components');
assert(indexAuthCode.includes("export * from './roles'"), 'index.ts re-exports role utilities');

console.log("\n==================================================");
console.log(`TOTAL AUTH UX TESTS: ${totalPassed} PASSED / ${totalFailed} FAILED`);
console.log("==================================================");

if (totalFailed > 0) {
  process.exit(1);
} else {
  console.log("ALL CAREGRID AUTH UX VERIFICATION CHECKS COMPLETED SUCCESSFULLY!");
}
