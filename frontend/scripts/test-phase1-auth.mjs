import fs from 'fs';
import path from 'path';

console.log("==================================================");
console.log("=== CAREGRID PHASE 1: AUTH FOUNDATION TESTS    ===");
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

// 1. Trilingual Translation Parity Check for Auth Keys
console.log("\n[TEST 1] Verifying 100% Trilingual Parity for Auth Keys...");
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

assert(mrKeys.length === enKeys.length, `Marathi key count matches English (${mrKeys.length} === ${enKeys.length})`);
assert(hiKeys.length === enKeys.length, `Hindi key count matches English (${hiKeys.length} === ${enKeys.length})`);

const expectedAuthKeys = [
  'loginTitle',
  'loginSubtitle',
  'loginEmailLabel',
  'loginEmailPlaceholder',
  'loginPasswordLabel',
  'loginPasswordPlaceholder',
  'loginOtpTab',
  'loginPasswordTab',
  'sendOtpBtn',
  'verifyOtpBtn',
  'enterOtpLabel',
  'enterOtpPlaceholder',
  'resendOtpBtn',
  'changeEmailBtn',
  'otpSentNotice',
  'loginSuccessNotice',
  'loginErrorInvalidOtp',
  'loginErrorInvalidCredentials',
  'loginLoading',
  'logoutBtn',
  'loginBtn',
  'loggedInAs',
  'backToHome',
  'sessionActive'
];

expectedAuthKeys.forEach(key => {
  assert(enKeys.includes(key), `Key '${key}' present in English`);
  assert(mrKeys.includes(key), `Key '${key}' present in Marathi`);
  assert(hiKeys.includes(key), `Key '${key}' present in Hindi`);
});

// 2. Auth Helper Module Verification
console.log("\n[TEST 2] Verifying Reusable Auth Helper Modules...");
const clientAuthPath = 'frontend/src/lib/auth/client.ts';
const serverAuthPath = 'frontend/src/lib/auth/server.ts';
const indexAuthPath = 'frontend/src/lib/auth/index.ts';

assert(fs.existsSync(clientAuthPath), 'frontend/src/lib/auth/client.ts exists');
assert(fs.existsSync(serverAuthPath), 'frontend/src/lib/auth/server.ts exists');
assert(fs.existsSync(indexAuthPath), 'frontend/src/lib/auth/index.ts exists');

const clientCode = fs.readFileSync(clientAuthPath, 'utf8');
const serverCode = fs.readFileSync(serverAuthPath, 'utf8');

assert(clientCode.includes('export async function getCurrentUser'), 'getCurrentUser exported from client.ts');
assert(clientCode.includes('export async function getCurrentSession'), 'getCurrentSession exported from client.ts');
assert(clientCode.includes('export async function signOut'), 'signOut exported from client.ts');
assert(clientCode.includes('export function useAuth'), 'useAuth hook exported from client.ts');
assert(clientCode.includes('supabase.auth.onAuthStateChange'), 'useAuth reacts to auth state changes');
assert(serverCode.includes('export async function getServerUser'), 'getServerUser exported from server.ts');
assert(serverCode.includes('export async function getServerSession'), 'getServerSession exported from server.ts');

// 3. Login Interface Verification
console.log("\n[TEST 3] Verifying Login Interface (/login)...");
const loginPagePath = 'frontend/src/app/(auth)/login/page.tsx';
assert(fs.existsSync(loginPagePath), 'frontend/src/app/(auth)/login/page.tsx exists');

const loginCode = fs.readFileSync(loginPagePath, 'utf8');
assert(loginCode.includes('signInWithOtp'), 'Login page implements Supabase Email OTP');
assert(loginCode.includes('verifyOtp'), 'Login page implements Supabase OTP verification');
assert(loginCode.includes('signInWithPassword'), 'Login page implements Supabase Password authentication');
assert(loginCode.includes('useLanguage'), 'Login page supports trilingual localization');
assert(loginCode.includes('Suspense'), 'Login page wrapped in Suspense for searchParams');

// 4. Security Guardrails Verification
console.log("\n[TEST 4] Verifying Security Guardrails...");
assert(!loginCode.includes('localStorage.setItem'), 'No credentials or tokens saved to localStorage in login component');
assert(!clientCode.includes('localStorage'), 'No tokens saved to localStorage in client auth helper');
assert(!loginCode.includes('admin123') && !loginCode.includes('demo123'), 'No hardcoded credentials or demo passwords in login code');

// 5. Environment & Git Ignore Verification
console.log("\n[TEST 5] Verifying Environment & Secrets Isolation...");
const gitignorePath = fs.existsSync('.gitignore') ? '.gitignore' : 'frontend/.gitignore';
const gitignoreContent = fs.readFileSync(gitignorePath, 'utf8');
assert(gitignoreContent.includes('.env*.local') || gitignoreContent.includes('.env.local'), '.env.local is ignored in .gitignore');

if (fs.existsSync('frontend/.env.local')) {
  const envContent = fs.readFileSync('frontend/.env.local', 'utf8');
  assert(!envContent.includes('service_role'), 'No service_role secret key present in frontend/.env.local');
}

console.log("\n==================================================");
console.log(`TOTAL PHASE 1 AUTH TESTS: ${totalPassed} PASSED / ${totalFailed} FAILED`);
console.log("==================================================");

if (totalFailed > 0) {
  process.exit(1);
} else {
  console.log("ALL PHASE 1 AUTH VERIFICATION CHECKS COMPLETED SUCCESSFULLY!");
}
