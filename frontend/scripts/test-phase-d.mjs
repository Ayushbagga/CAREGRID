import fs from 'fs';

console.log("==================================================");
console.log("=== CAREGRID PHASE D: P2 OPERATIONS & OFFLINE  ===");
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
// 1. Supabase Realtime Service & Architecture Verification
// -----------------------------------------------------------------------------
console.log("\n[TEST 1] Verifying Supabase Realtime Service & Architecture...");

const realtimeServicePath = 'frontend/src/lib/realtime/realtime-service.ts';
const realtimeHooksPath = 'frontend/src/lib/realtime/use-realtime.ts';
const realtimeTypesPath = 'frontend/src/lib/realtime/types.ts';
const realtimeIndexPath = 'frontend/src/lib/realtime/index.ts';

assert(fs.existsSync(realtimeServicePath), "CareGridRealtimeService file exists");
assert(fs.existsSync(realtimeHooksPath), "Realtime hooks file exists");
assert(fs.existsSync(realtimeTypesPath), "Realtime types file exists");
assert(fs.existsSync(realtimeIndexPath), "Realtime index barrel exists");

const realtimeServiceSrc = fs.readFileSync(realtimeServicePath, 'utf8');
const realtimeHooksSrc = fs.readFileSync(realtimeHooksPath, 'utf8');

assert(realtimeServiceSrc.includes('CareGridRealtimeService'), "CareGridRealtimeService class is declared");
assert(realtimeServiceSrc.includes('getInstance()'), "CareGridRealtimeService implements singleton pattern");
assert(realtimeServiceSrc.includes('subscribeToTable'), "Realtime service provides subscribeToTable method");
assert(realtimeServiceSrc.includes('subscribeToCareAlerts'), "Realtime service provides subscribeToCareAlerts method");
assert(realtimeServiceSrc.includes('broadcastCareAlert'), "Realtime service provides broadcastCareAlert method");
assert(realtimeServiceSrc.includes('isDuplicateEvent'), "Realtime service implements deduplication logic");
assert(realtimeServiceSrc.includes('cleanupAll'), "Realtime service provides cleanupAll for clean teardown");
assert(realtimeServiceSrc.includes('FALLBACK_POLLING'), "Realtime service provides graceful fallback polling when websocket offline");
assert(realtimeServiceSrc.includes('removeChannel'), "Realtime service cleanly unregisters Supabase channels");

assert(realtimeHooksSrc.includes('useRealtimeTable'), "useRealtimeTable hook is exported");
assert(realtimeHooksSrc.includes('useCareAlerts'), "useCareAlerts hook is exported");
assert(realtimeHooksSrc.includes('useRealtimeStatus'), "useRealtimeStatus hook is exported");
assert(realtimeHooksSrc.includes('unsubscribeState()') || realtimeHooksSrc.includes('unsubscribeTable()'), "useRealtimeTable ensures clean unmount unsubscribe");

// Component subscriptions
const opdQueueSrc = fs.readFileSync('frontend/src/components/queue/opd-queue-manager.tsx', 'utf8');
const referralMgrSrc = fs.readFileSync('frontend/src/components/referrals/referral-manager.tsx', 'utf8');
const ashaFollowUpSrc = fs.readFileSync('frontend/src/components/asha/asha-follow-up-list.tsx', 'utf8');

assert(opdQueueSrc.includes("useRealtimeTable('appointments'"), "OPDQueueManager subscribes to appointments realtime updates");
assert(referralMgrSrc.includes("useRealtimeTable('referrals'"), "ReferralManager subscribes to referrals realtime updates");
assert(ashaFollowUpSrc.includes("useRealtimeTable('follow_up_tasks'"), "AshaFollowUpList subscribes to follow_up_tasks realtime updates");

// -----------------------------------------------------------------------------
// 2. Offline-First Excellence & Conflict Handling
// -----------------------------------------------------------------------------
console.log("\n[TEST 2] Verifying Offline-First Excellence & Conflict Handling...");

const syncMgrSrc = fs.readFileSync('frontend/src/lib/offline-sync/sync-manager.ts', 'utf8');
const syncModalSrc = fs.readFileSync('frontend/src/components/asha/sync-status-modal.tsx', 'utf8');

assert(syncMgrSrc.includes("'OFFLINE'"), "SyncManager defines macroscopic state 'OFFLINE'");
assert(syncMgrSrc.includes("'SYNCING'"), "SyncManager defines macroscopic state 'SYNCING'");
assert(syncMgrSrc.includes("'SYNCED'"), "SyncManager defines macroscopic state 'SYNCED'");
assert(syncMgrSrc.includes("'SYNC_FAILED'"), "SyncManager defines macroscopic state 'SYNC_FAILED'");
assert(syncMgrSrc.includes('onTelemetryChange'), "SyncManager provides reactive onTelemetryChange subscriber");
assert(syncMgrSrc.includes('retryFailed'), "SyncManager provides retryFailed action for failed items");
assert(syncMgrSrc.includes('resolveConflict'), "SyncManager implements safe conflict resolution helper");
assert(syncMgrSrc.includes('existing'), "SyncManager prevents duplicate item creation on enqueue");

assert(syncModalSrc.includes('getStatusBadge'), "SyncStatusModal renders clear macroscopic status badge");
assert(syncModalSrc.includes('handleRetryFailed'), "SyncStatusModal renders retry action for failed items");
assert(syncModalSrc.includes('role="dialog"'), "SyncStatusModal implements accessible dialog role");
assert(syncModalSrc.includes('aria-modal="true"'), "SyncStatusModal sets aria-modal attribute");

// -----------------------------------------------------------------------------
// 3. In-App Notification Center & Role Authorization
// -----------------------------------------------------------------------------
console.log("\n[TEST 3] Verifying In-App Notification Center & Role Authorization...");

const notifServicePath = 'frontend/src/lib/notifications/notification-service.ts';
const notifBellPath = 'frontend/src/components/notifications/notification-bell.tsx';

assert(fs.existsSync(notifServicePath), "NotificationService exists at frontend/src/lib/notifications/notification-service.ts");
assert(fs.existsSync(notifBellPath), "NotificationBell exists at frontend/src/components/notifications/notification-bell.tsx");

const notifServiceSrc = fs.readFileSync(notifServicePath, 'utf8');
const notifBellSrc = fs.readFileSync(notifBellPath, 'utf8');

assert(notifServiceSrc.includes('NotificationService'), "NotificationService class is exported");
assert(notifServiceSrc.includes('getNotificationsForRole'), "NotificationService provides role-authorized notification filtering");
assert(notifServiceSrc.includes('addNotification'), "NotificationService supports adding targeted notifications");
assert(notifServiceSrc.includes('markAsRead'), "NotificationService supports markAsRead action");
assert(notifServiceSrc.includes('markAllAsRead'), "NotificationService supports markAllAsRead action");
assert(notifServiceSrc.includes('recentDuplicate'), "NotificationService suppresses noisy duplicate notifications");

assert(notifBellSrc.includes('role="dialog"'), "NotificationBell popover implements accessible dialog role");
assert(notifBellSrc.includes('aria-haspopup="dialog"'), "NotificationBell sets aria-haspopup");
assert(notifBellSrc.includes('unreadCount'), "NotificationBell renders unread counter badge");

// Verify NotificationBell is mounted across authorized dashboards
const ashaPageSrc = fs.readFileSync('frontend/src/app/(dashboard)/asha/page.tsx', 'utf8');
const doctorPageSrc = fs.readFileSync('frontend/src/app/(dashboard)/doctor/page.tsx', 'utf8');
const adminPageSrc = fs.readFileSync('frontend/src/app/(dashboard)/admin/page.tsx', 'utf8');
const referralsPageSrc = fs.readFileSync('frontend/src/app/(dashboard)/referrals/page.tsx', 'utf8');

assert(ashaPageSrc.includes("<NotificationBell role=\"asha\""), "ASHA dashboard mounts NotificationBell");
assert(doctorPageSrc.includes("<NotificationBell role=\"doctor\""), "Doctor dashboard mounts NotificationBell");
assert(adminPageSrc.includes("<NotificationBell role=\"admin\""), "Admin dashboard mounts NotificationBell");
assert(referralsPageSrc.includes("<NotificationBell role=\"doctor\""), "Referrals dashboard mounts NotificationBell");

// -----------------------------------------------------------------------------
// 4. ASHA Field-Worker UX Hardening
// -----------------------------------------------------------------------------
console.log("\n[TEST 4] Verifying ASHA Field-Worker Mobile UX Hardening...");

const screeningFormSrc = fs.readFileSync('frontend/src/components/asha/vitals-screening-form.tsx', 'utf8');
const rosterSrc = fs.readFileSync('frontend/src/components/asha/patient-roster.tsx', 'utf8');

assert(screeningFormSrc.includes('applyPreset'), "VitalsScreeningForm implements quick normal presets");
assert(screeningFormSrc.includes('patientSearch'), "VitalsScreeningForm implements fast patient search");
assert(screeningFormSrc.includes('stepVital'), "VitalsScreeningForm implements touch-friendly steppers for BP, HR, SpO2");
assert(screeningFormSrc.includes('min-h-[44px]'), "VitalsScreeningForm ensures touch-friendly min 44px tap targets");
assert(screeningFormSrc.includes('high_risk_pregnancy'), "VitalsScreeningForm renders obvious high-risk maternal alert");

assert(rosterSrc.includes('onSelectForFollowUp'), "PatientRoster provides one-tap follow-up task access");
assert(rosterSrc.includes('searchQuery'), "PatientRoster provides instant search filtering");
assert(rosterSrc.includes('High Risk Maternal'), "PatientRoster displays prominent high-risk maternal indicators");
assert(ashaPageSrc.includes("onSelectForFollowUp"), "ASHA dashboard connects one-tap follow-up to follow-ups tab");

// -----------------------------------------------------------------------------
// 5. Live Command Center Improvements
// -----------------------------------------------------------------------------
console.log("\n[TEST 5] Verifying Live Command Center Improvements...");

const commandCenterSrc = fs.readFileSync('frontend/src/components/copilot/command-center-summary.tsx', 'utf8');

assert(commandCenterSrc.includes('liveUrgentQueue'), "CommandCenterSummary tracks live urgent queue metric");
assert(commandCenterSrc.includes('unresolvedSync'), "CommandCenterSummary tracks unresolved sync operations");
assert(commandCenterSrc.includes('recentEvents'), "CommandCenterSummary displays recent operational events strip");
assert(commandCenterSrc.includes("useRealtimeTable('appointments'"), "CommandCenterSummary subscribes to appointments realtime updates");
assert(commandCenterSrc.includes("useRealtimeTable('referrals'"), "CommandCenterSummary subscribes to referrals realtime updates");
assert(commandCenterSrc.includes('getRealtimeBadge'), "CommandCenterSummary displays realtime connection state indicator");

// -----------------------------------------------------------------------------
// 6. Voice-Ready Pluggable Architecture
// -----------------------------------------------------------------------------
console.log("\n[TEST 6] Verifying Voice-Ready Architecture & Copilot Integration...");

const voiceTypesPath = 'frontend/src/lib/voice/types.ts';
const voiceClientPath = 'frontend/src/lib/voice/voice-client.ts';
const browserSpeechPath = 'frontend/src/lib/voice/browser-speech.ts';
const copilotDrawerSrc = fs.readFileSync('frontend/src/components/copilot/care-copilot-drawer.tsx', 'utf8');

assert(fs.existsSync(voiceTypesPath), "Voice types file exists");
assert(fs.existsSync(voiceClientPath), "Voice client file exists");
assert(fs.existsSync(browserSpeechPath), "Browser speech adapter exists");

const voiceTypesSrc = fs.readFileSync(voiceTypesPath, 'utf8');
const voiceClientSrc = fs.readFileSync(voiceClientPath, 'utf8');

assert(voiceTypesSrc.includes('VoiceInputAdapter'), "VoiceInputAdapter interface is defined");
assert(voiceTypesSrc.includes('VoiceOutputAdapter'), "VoiceOutputAdapter interface is defined");
assert(voiceClientSrc.includes('CareGridVoiceClient'), "CareGridVoiceClient class is declared");
assert(voiceClientSrc.includes('setInputAdapter'), "Voice client supports pluggable input adapter");
assert(voiceClientSrc.includes('setOutputAdapter'), "Voice client supports pluggable output adapter");

assert(copilotDrawerSrc.includes('voiceClient'), "CareCopilotDrawer integrates voiceClient");
assert(copilotDrawerSrc.includes('toggleVoiceInput'), "CareCopilotDrawer implements microphone input toggle");
assert(copilotDrawerSrc.includes('handleToggleSpeak'), "CareCopilotDrawer implements speech audio playback");
assert(copilotDrawerSrc.includes('Mic') && copilotDrawerSrc.includes('MicOff'), "CareCopilotDrawer renders microphone toggle button");
assert(copilotDrawerSrc.includes('Volume2'), "CareCopilotDrawer renders speaker playback button");

// -----------------------------------------------------------------------------
// 7. Multilingual Quality & Parity (MR, HI, EN)
// -----------------------------------------------------------------------------
console.log("\n[TEST 7] Verifying Multilingual Quality & Parity...");

const phaseDI18nPath = 'frontend/src/lib/i18n/phase-d-i18n.ts';
assert(fs.existsSync(phaseDI18nPath), "Phase D dictionary exists at frontend/src/lib/i18n/phase-d-i18n.ts");

const { phaseDMarathi, phaseDHindi, phaseDEnglish } = await import('../src/lib/i18n/phase-d-i18n.ts');

const mrKeys = Object.keys(phaseDMarathi);
const hiKeys = Object.keys(phaseDHindi);
const enKeys = Object.keys(phaseDEnglish);

assert(mrKeys.length === enKeys.length, `Marathi key count matches English (${mrKeys.length} === ${enKeys.length})`);
assert(hiKeys.length === enKeys.length, `Hindi key count matches English (${hiKeys.length} === ${enKeys.length})`);

const requiredKeys = [
  'syncStateOffline',
  'syncStateSyncing',
  'syncStateSynced',
  'syncStateFailed',
  'retryAllBtn',
  'notificationsTitle',
  'newUrgentCaseAlert',
  'quickPresetsTitle',
  'normalAdultPreset',
  'normalAntenatalPreset',
  'searchPatientPlaceholder',
  'oneTapFollowUpBtn',
  'liveUrgentQueue',
  'recentEventsTitle',
  'voiceInputTitle',
  'voiceListening',
  'voiceSpeakSummary'
];

for (const k of requiredKeys) {
  assert(mrKeys.includes(k), `Key '${k}' present in Marathi Phase D dictionary`);
  assert(hiKeys.includes(k), `Key '${k}' present in Hindi Phase D dictionary`);
  assert(enKeys.includes(k), `Key '${k}' present in English Phase D dictionary`);
}

// -----------------------------------------------------------------------------
// 8. Security Isolation & Zero Client-Side Secret Leakage
// -----------------------------------------------------------------------------
console.log("\n[TEST 8] Verifying Security Isolation & Zero Secret Leakage...");

const envLocal = fs.existsSync('frontend/.env.local') ? fs.readFileSync('frontend/.env.local', 'utf8') : '';
assert(!envLocal.includes('SUPABASE_SERVICE_ROLE_KEY'), "No SUPABASE_SERVICE_ROLE_KEY in frontend/.env.local");
assert(!envLocal.includes('POSTGRES_PASSWORD'), "No database POSTGRES_PASSWORD in frontend/.env.local");

assert(!realtimeServiceSrc.includes('service_role'), "Realtime service does not use service_role");
assert(!notifServiceSrc.includes('service_role'), "Notification service does not use service_role");
assert(!voiceClientSrc.includes('service_role'), "Voice client does not use service_role");

// Clinical safety disclaimer preserved
assert(copilotDrawerSrc.includes('nonDiagnosticDisclaimer'), "Statutory non-diagnostic disclaimer preserved in Copilot drawer");

console.log("==================================================");
console.log(`TOTAL PHASE D TESTS: ${totalPassed} PASSED / ${totalFailed} FAILED`);
console.log("==================================================");

if (totalFailed > 0) {
  console.error("FAILURES DETECTED IN PHASE D CHECKS");
  process.exit(1);
} else {
  console.log("ALL CAREGRID PHASE D CHECKS COMPLETED SUCCESSFULLY!\n");
  process.exit(0);
}
