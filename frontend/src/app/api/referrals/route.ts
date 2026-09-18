import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // Validate required referral fields
    const { patient_id, from_facility_id, to_facility_id, referral_reason, required_specialty } = body;
    if (!patient_id || !from_facility_id || !to_facility_id || !referral_reason || !required_specialty) {
      return NextResponse.json(
        { error: 'Missing mandatory referral attributes' },
        { status: 400 }
      );
    }

    const referralCode = `REF-${Date.now().toString(36).toUpperCase()}`;

    return NextResponse.json({
      success: true,
      referral: {
        id: crypto.randomUUID(),
        referral_code: referralCode,
        patient_id,
        from_facility_id,
        to_facility_id,
        referral_reason,
        required_specialty,
        urgency_tier: body.urgency_tier || 'urgent_amber',
        status: 'initiated',
        created_at: new Date().toISOString()
      }
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to create referral record', details: String(error) },
      { status: 500 }
    );
  }
}
