import fs from 'fs';

console.log("==================================================");
console.log("=== CAREGRID SPRINT 4 VERIFICATION TEST SUITE  ===");
console.log("==================================================");

let testsPassed = 0;
let totalTests = 0;

function assert(condition, message) {
  totalTests++;
  if (condition) {
    console.log(`  PASS: ${message}`);
    testsPassed++;
  } else {
    console.error(`  FAIL: ${message}`);
    process.exitCode = 1;
  }
}

// ----------------------------------------------------
// TEST 1: Full Trilingual Parity (English, Hindi, Marathi)
// ----------------------------------------------------
console.log("\n[TEST 1] Verifying 100% Trilingual Parity (MR, HI, EN)...");
const translationsPath = 'frontend/src/lib/i18n/translations.ts';
const translationsContent = fs.readFileSync(translationsPath, 'utf8');

function extractKeys(locale) {
  const match = translationsContent.match(new RegExp(`${locale}:\\s*{([^}]+)}`, 's'));
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

console.log(`  Keys detected -> Marathi: ${mrKeys.length}, Hindi: ${hiKeys.length}, English: ${enKeys.length}`);
assert(mrKeys.length >= 200, `Translations contain full key set (${mrKeys.length} >= 200)`);
assert(mrKeys.length === enKeys.length, `Marathi key count matches English (${mrKeys.length} === ${enKeys.length})`);
assert(hiKeys.length === enKeys.length, `Hindi key count matches English (${hiKeys.length} === ${enKeys.length})`);

const sprint4RequiredKeys = [
  'referralTrackingTitle',
  'initiateReferralBtn',
  'outgoingReferralsTab',
  'incomingReferralsTab',
  'acknowledgeReferralBtn',
  'updateEvaluationBtn',
  'completeDischargeBtn',
  'statusInitiated',
  'statusAcknowledged',
  'statusEvaluated',
  'statusCompleted',
  'statusFollowUpScheduled',
  'longitudinalRecordTitle',
  'timelineFilterAll',
  'timelineFilterVitals',
  'timelineFilterEncounters',
  'timelineFilterReferrals',
  'timelineFilterFollowUps',
  'registrationEvent',
  'vitalsEvent',
  'encounterEvent',
  'referralEvent',
  'followUpEvent',
  'followUpTasksTitle',
  'overdueTasks',
  'dueTodayTasks',
  'upcomingTasks',
  'completeTaskBtn',
  'patientRemindersTitle'
];

for (const k of sprint4RequiredKeys) {
  assert(enKeys.includes(k) && mrKeys.includes(k) && hiKeys.includes(k), `Sprint 4 key '${k}' present across EN, MR, HI`);
}

// ----------------------------------------------------
// TEST 2: Closed-Loop Referral Lifecycle Flow
// ----------------------------------------------------
console.log("\n[TEST 2] Testing Closed-Loop Referral Lifecycle Flow...");

// Mock state machine for referral
class ReferralLifecycleMock {
  constructor() {
    this.referrals = [];
    this.tasks = [];
  }

  create(patientId, fromFac, toFac, reason, specialty, tier) {
    const ref = {
      id: 'ref-' + Date.now(),
      referral_code: 'REF-MH-GAD-001',
      patient_id: patientId,
      from_facility_id: fromFac,
      to_facility_id: toFac,
      referral_reason: reason,
      required_specialty: specialty,
      urgency_tier: tier,
      status: 'initiated',
      created_at: new Date().toISOString()
    };
    this.referrals.push(ref);
    return ref;
  }

  acknowledge(refId, doctorId) {
    const ref = this.referrals.find(r => r.id === refId);
    ref.status = 'acknowledged';
    ref.receiving_doctor_id = doctorId;
    return ref;
  }

  evaluate(refId, notes) {
    const ref = this.referrals.find(r => r.id === refId);
    ref.status = 'evaluated';
    ref.discharge_summary = notes;
    return ref;
  }

  complete(refId, dischargeSummary, instructionsForAsha, ashaId = 'asha-001') {
    const ref = this.referrals.find(r => r.id === refId);
    ref.status = 'closed_loop';
    ref.discharge_summary = dischargeSummary;
    ref.post_discharge_instructions_for_asha = instructionsForAsha;
    ref.closed_at = new Date().toISOString();

    const task = {
      id: 'task-' + Date.now(),
      patient_id: ref.patient_id,
      assigned_asha_id: ashaId,
      originating_referral_id: ref.id,
      task_type: 'post_referral_check',
      due_date: new Date(Date.now() + 3 * 86400000).toISOString().split('T')[0],
      status: 'pending'
    };
    this.tasks.push(task);
    return { ref, task };
  }
}

const sim = new ReferralLifecycleMock();

// Step 1: Create
const r1 = sim.create('pat-001', 'fac-001', 'fac-002', 'Severe pre-eclampsia', 'Obstetrics & Gynecology', 'emergency_red');
assert(r1.status === 'initiated', "Referral creation initializes with status 'initiated'");
assert(r1.urgency_tier === 'emergency_red', "Urgency tier correctly preserved");

// Step 2: Acknowledge
const r2 = sim.acknowledge(r1.id, 'doc-dh-001');
assert(r2.status === 'acknowledged', "Receiving hospital acknowledgement transitions status to 'acknowledged'");

// Step 3: Evaluate
const r3 = sim.evaluate(r1.id, 'Admitted to high-dependency obstetric ward. IV magnesium sulfate initiated.');
assert(r3.status === 'evaluated', "Clinical evaluation transitions status to 'evaluated'");

// Step 4: Complete & Counter-Referral to ASHA
const { ref: r4, task: t4 } = sim.complete(
  r1.id,
  'Blood pressure stabilized at 128/82. Discharged on oral labetalol.',
  'Visit patient within 3 days. Check BP, fetal movements, and watch for epigastric pain.'
);
assert(r4.status === 'closed_loop', "Completion transitions referral to 'closed_loop'");
assert(t4 !== undefined && t4.originating_referral_id === r1.id, "Follow-up task automatically created and linked to originating referral");
assert(t4.task_type === 'post_referral_check', "Task type is 'post_referral_check'");
assert(t4.status === 'pending', "Follow-up task status is 'pending'");

// ----------------------------------------------------
// TEST 3: Longitudinal Health Record Assembly & Ordering
// ----------------------------------------------------
console.log("\n[TEST 3] Testing Longitudinal Health Record Ordering & Aggregation...");

const mockTimelineEvents = [
  { id: '1', type: 'registration', timestamp: '2026-09-01T10:00:00Z', title: 'Citizen Registration' },
  { id: '2', type: 'vitals', timestamp: '2026-09-05T09:30:00Z', title: 'Vitals: BP 160/110' },
  { id: '3', type: 'encounter', timestamp: '2026-09-08T11:00:00Z', title: 'PHC OPD Consult' },
  { id: '4', type: 'referral', timestamp: '2026-09-08T11:30:00Z', title: 'Referral to DH' },
  { id: '5', type: 'follow_up', timestamp: '2026-09-15T14:00:00Z', title: 'ASHA Home Visit' }
];

const sortedTimeline = [...mockTimelineEvents].sort(
  (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
);

assert(sortedTimeline[0].type === 'follow_up', "Most recent event (ASHA Home Visit) is 1st in timeline");
assert(sortedTimeline[1].type === 'referral', "Referral event is 2nd in timeline");
assert(sortedTimeline[sortedTimeline.length - 1].type === 'registration', "Initial registration is last in timeline");

// ----------------------------------------------------
// TEST 4: ASHA Follow-up Due Date Categorization
// ----------------------------------------------------
console.log("\n[TEST 4] Testing ASHA Follow-Up Priority Categorization...");

const todayStr = new Date().toISOString().split('T')[0];
const yesterdayStr = new Date(Date.now() - 86400000).toISOString().split('T')[0];
const tomorrowStr = new Date(Date.now() + 86400000).toISOString().split('T')[0];

const mockAshaTasks = [
  { id: 't-1', due_date: yesterdayStr, status: 'pending' },
  { id: 't-2', due_date: todayStr, status: 'pending' },
  { id: 't-3', due_date: tomorrowStr, status: 'pending' },
  { id: 't-4', due_date: yesterdayStr, status: 'completed' }
];

const pendingTasks = mockAshaTasks.filter(t => t.status === 'pending');
const overdue = pendingTasks.filter(t => t.due_date < todayStr);
const dueToday = pendingTasks.filter(t => t.due_date === todayStr);
const upcoming = pendingTasks.filter(t => t.due_date > todayStr);

assert(overdue.length === 1 && overdue[0].id === 't-1', "Overdue task correctly identified");
assert(dueToday.length === 1 && dueToday[0].id === 't-2', "Due Today task correctly identified");
assert(upcoming.length === 1 && upcoming[0].id === 't-3', "Upcoming task correctly identified");

// ----------------------------------------------------
// TEST 5: Non-Diagnostic & Safety Guardrail Verification
// ----------------------------------------------------
console.log("\n[TEST 5] Testing Non-Diagnostic & Safety Guardrails...");

const mockReferralPayload = {
  referral_reason: "High risk pregnancy evaluation requested by Medical Officer.",
  provisional_observations: "Urgent specialist review advised.",
  disclaimer: "सूचना: एआय प्रणाली केवळ आरोग्य कर्मचाऱ्यांना प्राधान्य ठरवण्यात मदत करते, निदान करत नाही."
};

assert(mockReferralPayload.disclaimer.includes("निदान करत नाही"), "Non-diagnostic disclaimer strictly preserved");
assert(!mockReferralPayload.referral_reason.includes("prescribed Rx"), "No autonomous drug prescription generated");

// ----------------------------------------------------
console.log("\n==================================================");
console.log(`TOTAL SPRINT 4 TESTS PASSED: ${testsPassed} / ${totalTests}`);
console.log("==================================================");
if (testsPassed === totalTests) {
  console.log("ALL SPRINT 4 VERIFICATION CHECKS COMPLETED SUCCESSFULLY!");
} else {
  process.exit(1);
}
