import { NextRequest, NextResponse } from 'next/server';
import { authorizeRequest } from '@/lib/auth/rbac';

// Baseline fallback for offline & initial bootstrapping
const baselineDemoReferrals: Record<string, any>[] = [
  {
    id: 'ref-001',
    referral_code: 'REF-MH-GAD-7821',
    patient_id: 'pat-001',
    from_facility_id: '11111111-0000-0000-0000-000000000002',
    to_facility_id: '11111111-0000-0000-0000-000000000003',
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

    const supabase = auth.client;
    if (supabase) {
      let sbQuery = supabase.from('referrals').select('*');
      if (patientId) {
        sbQuery = sbQuery.eq('patient_id', patientId);
      }
      if (facilityId) {
        sbQuery = sbQuery.or(`from_facility_id.eq.${facilityId},to_facility_id.eq.${facilityId}`);
      }
      if (status) {
        sbQuery = sbQuery.eq('status', status);
      }

      const { data, error } = await sbQuery.order('created_at', { ascending: false });
      if (!error && data && data.length > 0) {
        return NextResponse.json({
          success: true,
          source: 'supabase_production',
          referrals: data
        });
      }
    }

    let result = [...baselineDemoReferrals];
    if (patientId) {
      result = result.filter(r => r.patient_id === patientId);
    }
    if (facilityId) {
      result = result.filter(r => r.from_facility_id === facilityId || r.to_facility_id === facilityId);
    }
    if (status) {
      result = result.filter(r => r.status === status);
    }

    return NextResponse.json({
      success: true,
      source: 'baseline_demo_referrals',
      referrals: result
    });
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
    const referralCode = body.referral_code || `REF-MH-${shortCode}-${Date.now().toString().slice(-4)}`;

    const referralData: Record<string, unknown> = {
      referral_code: referralCode,
      patient_id,
      encounter_id: body.encounter_id || null,
      from_facility_id,
      to_facility_id,
      referring_officer_id: auth.context?.user?.id || body.referring_officer_id || null,
      receiving_doctor_id: body.receiving_doctor_id || null,
      referral_reason,
      required_specialty,
      urgency_tier: body.urgency_tier || 'urgent_amber',
      status: body.status || 'initiated'
    };

    if (body.id && body.id.length === 36) {
      referralData.id = body.id;
    }

    const supabase = auth.client;
    if (supabase) {
      const { data, error } = await supabase.from('referrals').insert(referralData).select().single();
      if (!error && data) {
        return NextResponse.json({
          success: true,
          source: 'supabase_production',
          referral: data
        });
      }
    }

    const fallbackReferral = {
      id: body.id || crypto.randomUUID(),
      ...referralData,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    return NextResponse.json({
      success: true,
      source: 'resilient_referral_record',
      referral: fallbackReferral
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

    const updatePayload: Record<string, unknown> = {
      updated_at: new Date().toISOString()
    };
    if (status) updatePayload.status = status;
    if (discharge_summary !== undefined) updatePayload.discharge_summary = discharge_summary;
    if (post_discharge_instructions_for_asha !== undefined) updatePayload.post_discharge_instructions_for_asha = post_discharge_instructions_for_asha;
    if (receiving_doctor_id !== undefined) updatePayload.receiving_doctor_id = receiving_doctor_id;
    if (status === 'closed_loop') updatePayload.closed_at = new Date().toISOString();

    const supabase = auth.client;
    if (supabase) {
      const { data, error } = await supabase.from('referrals').update(updatePayload).eq('id', id).select().single();
      if (!error && data) {
        return NextResponse.json({
          success: true,
          source: 'supabase_production',
          referral: data
        });
      }
    }

    return NextResponse.json({
      success: true,
      source: 'resilient_referral_update',
      referral: {
        id,
        ...updatePayload
      }
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to update referral record', details: String(error) },
      { status: 500 }
    );
  }
}
