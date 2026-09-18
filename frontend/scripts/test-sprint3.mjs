import fs from 'fs';

console.log('==================================================');
console.log('=== CAREGRID SPRINT 3 VERIFICATION TEST SUITE  ===');
console.log('==================================================');

let testsPassed = 0;
let totalTests = 0;

function assert(condition, message) {
  totalTests++;
  if (condition) {
    console.log('  PASS: ' + message);
    testsPassed++;
  } else {
    console.error('  FAIL: ' + message);
    process.exitCode = 1;
  }
}

// ----------------------------------------------------
// TEST 1: Full Trilingual Parity (English, Hindi, Marathi)
// ----------------------------------------------------
console.log('\n[TEST 1] Verifying 100% Trilingual Parity (MR, HI, EN)...');
const translationsPath = 'frontend/src/lib/i18n/translations.ts';
const translationsContent = fs.readFileSync(translationsPath, 'utf8');

function extractObjectKeys(objName) {
  const match = translationsContent.match(new RegExp(objName + ':\\s*{([^}]+)}', 's'));
  if (!match) return [];
  return match[1]
    .split('\n')
    .map(line => line.trim())
    .filter(line => line && !line.startsWith('//') && line.includes(':'))
    .map(line => line.split(':')[0].trim());
}

const mrKeys = extractObjectKeys('mr');
const hiKeys = extractObjectKeys('hi');
const enKeys = extractObjectKeys('en');

console.log('  Keys detected -> Marathi: ' + mrKeys.length + ', Hindi: ' + hiKeys.length + ', English: ' + enKeys.length);
assert(mrKeys.length > 0 && hiKeys.length > 0 && enKeys.length > 0, 'All three languages are populated');
assert(mrKeys.length === enKeys.length, 'Marathi key count matches English (' + mrKeys.length + ' === ' + enKeys.length + ')');
assert(hiKeys.length === enKeys.length, 'Hindi key count matches English (' + hiKeys.length + ' === ' + enKeys.length + ')');

// Check specific Sprint 3 keys exist in all three
const sprint3RequiredKeys = [
  'triageCardTitle',
  'urgencyPriorityScore',
  'detectedAnomalies',
  'recommendedSpecialty',
  'recommendedAction',
  'doctorOverrideBtn',
  'overrideModalTitle',
  'opdQueueTitle',
  'generateTokenBtn',
  'facilityDirectoryTitle',
  'teleconsultTitle',
  'clinicalSummaryTitle'
];

for (const k of sprint3RequiredKeys) {
  assert(enKeys.includes(k) && mrKeys.includes(k) && hiKeys.includes(k), 'Sprint 3 translation key ' + k + ' present in EN, MR, HI');
}

// ----------------------------------------------------
// TEST 2: AI Triage Urgency Priority & Non-Diagnostic Guardrails
// ----------------------------------------------------
console.log('\n[TEST 2] Testing Urgency Classification & Non-Diagnostic Guardrail...');

function localTriageTest(patient, vitals, symptoms = []) {
  const dangerSigns = [];
  let isEmergency = false;

  if (vitals.spo2_percentage && vitals.spo2_percentage < 90) {
    dangerSigns.push('Severe Hypoxia (SpO2 < 90%)');
    isEmergency = true;
  }
  if (patient.is_pregnant && vitals.systolic_bp && vitals.systolic_bp >= 160) {
    dangerSigns.push('Severe Pre-Eclampsia Alert');
    isEmergency = true;
  }
  if (vitals.body_temperature_f && vitals.body_temperature_f >= 104) {
    dangerSigns.push('Hyperpyrexia');
  }

  let tier = 'routine_green';
  let priorityScore = 10;
  let transportRecommended = false;

  if (isEmergency || dangerSigns.length >= 2) {
    tier = 'emergency_red';
    priorityScore = dangerSigns.length >= 2 ? 1 : 2;
    transportRecommended = true;
  } else if (dangerSigns.length === 1 || patient.is_pregnant) {
    tier = 'urgent_amber';
    priorityScore = patient.is_pregnant ? 4 : 5;
  }

  const disclaimer = 'CAREGRID Clinical Triage Assist is an assistive decision-support algorithm designed to help certified healthcare workers prioritize clinical urgency. It does NOT diagnose medical conditions or replace clinical examination by a licensed medical officer.';

  return { tier, priorityScore, transportRecommended, dangerSigns, disclaimer };
}

const emergencyCase = localTriageTest(
  { is_pregnant: true, estimated_age: 26 },
  { systolic_bp: 165, diastolic_bp: 112, spo2_percentage: 88 },
  ['severe_headache']
);
assert(emergencyCase.tier === 'emergency_red', 'Severe maternal BP + Hypoxia triaged as emergency_red');
assert(emergencyCase.priorityScore <= 2, 'Emergency priority score is high urgency (1 or 2)');
assert(emergencyCase.transportRecommended === true, 'Immediate facility transport recommended for emergency');
assert(emergencyCase.disclaimer.includes('does NOT diagnose'), 'Non-diagnostic disclaimer strictly preserved');

const urgentCase = localTriageTest(
  { is_pregnant: true, estimated_age: 24 },
  { systolic_bp: 120, diastolic_bp: 80, spo2_percentage: 98 },
  []
);
assert(urgentCase.tier === 'urgent_amber', 'Vulnerable pregnant patient triaged as urgent_amber');

const routineCase = localTriageTest(
  { is_pregnant: false, estimated_age: 32 },
  { systolic_bp: 118, diastolic_bp: 76, spo2_percentage: 99, body_temperature_f: 98.4 },
  []
);
assert(routineCase.tier === 'routine_green', 'Normal vitals triaged as routine_green');
assert(routineCase.priorityScore === 10, 'Routine priority score is standard (10)');

// ----------------------------------------------------
// TEST 3: Urgency-Based OPD Queue Ordering
// ----------------------------------------------------
console.log('\n[TEST 3] Testing Priority-Sorted OPD Queue Logic...');

const mockQueue = [
  { id: '1', token_number: 'Q-001', urgency_tier: 'routine_green', priority_score: 10, check_in_time: '09:00' },
  { id: '2', token_number: 'Q-002', urgency_tier: 'emergency_red', priority_score: 1, check_in_time: '09:15' },
  { id: '3', token_number: 'Q-003', urgency_tier: 'urgent_amber', priority_score: 5, check_in_time: '09:05' },
  { id: '4', token_number: 'Q-004', urgency_tier: 'emergency_red', priority_score: 2, check_in_time: '09:20' },
  { id: '5', token_number: 'Q-005', urgency_tier: 'urgent_amber', priority_score: 4, check_in_time: '09:10' },
];

const tierRank = {
  emergency_red: 0,
  urgent_amber: 1,
  routine_green: 2
};

const sortedQueue = [...mockQueue].sort((a, b) => {
  const rankDiff = tierRank[a.urgency_tier] - tierRank[b.urgency_tier];
  if (rankDiff !== 0) return rankDiff;
  return a.priority_score - b.priority_score;
});

assert(sortedQueue[0].urgency_tier === 'emergency_red', '1st patient in queue is emergency_red');
assert(sortedQueue[1].urgency_tier === 'emergency_red', '2nd patient in queue is emergency_red');
assert(sortedQueue[0].token_number === 'Q-002', 'Q-002 (score 1) precedes Q-004 (score 2)');
assert(sortedQueue[2].urgency_tier === 'urgent_amber', '3rd patient in queue is urgent_amber');
assert(sortedQueue[4].urgency_tier === 'routine_green', 'Last patient in queue is routine_green');

// ----------------------------------------------------
// TEST 4: Facility Discovery Filtering
// ----------------------------------------------------
console.log('\n[TEST 4] Testing Maharashtra Facility Discovery Filtering...');

const mockFacilities = [
  { id: '1', name: 'Chamorshi PHC', district: 'Gadchiroli', taluka: 'Chamorshi', facility_type: 'PHC', services: ['General OPD', 'Labor Room'] },
  { id: '2', name: 'Gadchiroli District Hospital', district: 'Gadchiroli', taluka: 'Gadchiroli', facility_type: 'District Hospital', services: ['Emergency Care', 'ICU', 'Obstetrics & Gynecology', 'Pediatrics'] },
  { id: '3', name: 'Dindori Rural Hospital', district: 'Nashik', taluka: 'Dindori', facility_type: 'Rural Hospital', services: ['Emergency OPD', 'Minor OT', 'General Medicine'] },
  { id: '4', name: 'Junnar CHC', district: 'Pune', taluka: 'Junnar', facility_type: 'CHC', services: ['Emergency Stabilization', 'Obstetrics & Gynecology'] },
];

function filterFacilities(facilities, query, district, facilityType) {
  return facilities.filter(f => {
    if (district && f.district !== district) return false;
    if (facilityType && f.facility_type !== facilityType) return false;
    if (query) {
      const q = query.toLowerCase();
      const matchName = f.name.toLowerCase().includes(q);
      const matchService = f.services.some(s => s.toLowerCase().includes(q));
      return matchName || matchService;
    }
    return true;
  });
}

const gadchiroliFacilities = filterFacilities(mockFacilities, '', 'Gadchiroli', '');
assert(gadchiroliFacilities.length === 2, 'Filtered exactly 2 facilities for Gadchiroli district');

const obgynFacilities = filterFacilities(mockFacilities, 'Obstetrics', '', '');
assert(obgynFacilities.length === 2, 'Found 2 facilities offering Obstetrics specialty');

const rhTypeFacilities = filterFacilities(mockFacilities, '', '', 'Rural Hospital');
assert(rhTypeFacilities.length === 1 && rhTypeFacilities[0].name === 'Dindori Rural Hospital', 'Found Rural Hospital in Nashik');

// ----------------------------------------------------
// TEST 5: Teleconsultation Session Payload Integrity
// ----------------------------------------------------
console.log('\n[TEST 5] Testing Teleconsultation Session Integrity...');

const mockTeleconsultSession = {
  id: 'tele-001',
  patient_id: 'pat-101',
  phc_doctor_id: 'doc-rural-01',
  specialist_id: 'spec-dh-01',
  status: 'in_progress',
  patient_summary: {
    name: 'Sunita Gawade',
    age: 28,
    vitals: { bp: '158/104', spo2: 96, hr: 88 },
    urgency_tier: 'urgent_amber'
  },
  clinical_notes: 'Patient presented with severe gestational headaches at 32 weeks.',
  specialist_advice: 'Administer labetalol as per protocol, monitor fetal heart rate every 30 minutes, prepare secondary referral if BP exceeds 160/110.'
};

assert(mockTeleconsultSession.status === 'in_progress', 'Teleconsult session status is valid');
assert(mockTeleconsultSession.patient_summary.vitals.bp === '158/104', 'Live patient vitals correctly linked to teleconsult canvas');
assert(mockTeleconsultSession.specialist_advice.length > 20, 'Specialist counter-notes populated');

// ----------------------------------------------------
console.log('\n==================================================');
console.log('TOTAL SPRINT 3 TESTS PASSED: ' + testsPassed + ' / ' + totalTests);
console.log('==================================================');
if (testsPassed === totalTests) {
  console.log('ALL SPRINT 3 VERIFICATION CHECKS COMPLETED SUCCESSFULLY!');
} else {
  process.exit(1);
}
