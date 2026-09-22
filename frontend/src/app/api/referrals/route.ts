import { NextRequest, NextResponse } from 'next/server';
import { authorizeRequest } from '@/lib/auth/rbac';

// In-memory store for mock/server route consistency
const inMemoryReferrals: Record<string, any>[] = [
  {
    id: 'ref-001',
    referral_code: 'REF-MH-GAD-7821',
    patient_id: 'pat-001',
    from_facility_id: 'fac-001',
    to_facility_id: 'fac-002',
    referring_officer_id: 'doc-001',
    receiving_doctor_id: 'doc-dh-001',
    referral_reason: 'Severe gestational hypertension at 34 weeks gestation.',
    required_specialty: 'Obstetrics & Gynecology',
    urgency_tier: 'emergency_red',
    status: 'acknowledged',
    created_at: new Date(Date.now() - 24 * 3600 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 12 * 3600 * 1000).toISOString()
  }
];

export async function GET(req: NextRequest) {
  // Authorize request: required role is asha or doctor (admin inherits)
  const auth = await authorizeRequest(req, ['asha', 'doctor']);
  if (!auth.authorized) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const { searchParams } = new URL(req.url);
    const patientId = searchParams.get('patient_id');
    const facilityId = searchParams.get('facility_id');
    const status = searchParams.get('status');

    let result = [...inMemoryReferrals];
    if (patientId) {
      result = result.filter(r => r.patient_id === patientId);
    }
    if (facilityId) {
      result = result.filter(r => r.from_facility_id === facilityId || r.to_facility_id === facilityId);
    }
    if (status) {
      result = result.filter(r => r.status === status);
    }

    return NextResponse.json({ success: true, referrals: result });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to retrieve referrals', details: String(error) },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  // Authorize request: required role is asha or doctor (admin inherits)
  const auth = await authorizeRequest(req, ['asha', 'doctor']);
  if (!auth.authorized) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const body = await req.json();

    const { patient_id, from_facility_id, to_facility_id, referral_reason, required_specialty } = body;
    if (!patient_id || !from_facility_id || !to_facility_id || !referral_reason || !required_specialty) {
      return NextResponse.json(
        { error: 'Missing mandatory referral attributes' },
        { status: 400 }
      );
    }

    const shortCode = Math.random().toString(36).substring(2, 6).toUpperCase();
    const referralCode = `REF-MH-${shortCode}-${Date.now().toString().slice(-4)}`;

    const newReferral = {
      id: crypto.randomUUID(),
      referral_code: referralCode,
      patient_id,
      encounter_id: body.encounter_id,
      from_facility_id,
      to_facility_id,
      referring_officer_id: body.referring_officer_id || 'doc-phc-001',
      referral_reason,
      required_specialty,
      urgency_tier: body.urgency_tier || 'urgent_amber',
      status: 'initiated',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    inMemoryReferrals.push(newReferral);

    return NextResponse.json({
      success: true,
      referral: newReferral
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to create referral record', details: String(error) },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest) {
  // Authorize request: required role is asha or doctor (admin inherits)
  const auth = await authorizeRequest(req, ['asha', 'doctor']);
  if (!auth.authorized) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const body = await req.json();
    const { id, status, discharge_summary, post_discharge_instructions_for_asha, receiving_doctor_id } = body;

    if (!id) {
      return NextResponse.json({ error: 'Referral ID is required' }, { status: 400 });
    }

    const index = inMemoryReferrals.findIndex(r => r.id === id);
    if (index === -1) {
      return NextResponse.json({ error: 'Referral not found' }, { status: 404 });
    }

    const referral = inMemoryReferrals[index];
    if (status) referral.status = status;
    if (discharge_summary) referral.discharge_summary = discharge_summary;
    if (post_discharge_instructions_for_asha) referral.post_discharge_instructions_for_asha = post_discharge_instructions_for_asha;
    if (receiving_doctor_id) referral.receiving_doctor_id = receiving_doctor_id;
    if (status === 'closed_loop') referral.closed_at = new Date().toISOString();
    referral.updated_at = new Date().toISOString();

    return NextResponse.json({ success: true, referral });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to update referral record', details: String(error) },
      { status: 500 }
    );
  }
}
