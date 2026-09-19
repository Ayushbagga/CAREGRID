import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    if (!body.full_name || !body.village || !body.primary_phone) {
      return NextResponse.json(
        { error: 'Mandatory patient attributes missing' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      patient: {
        ...body,
        id: body.id || crypto.randomUUID(),
        created_at: new Date().toISOString()
      }
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to process patient record', details: String(error) },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const query = searchParams.get('query') || '';
    const village = searchParams.get('village') || '';

    // Standard baseline demo records for API contract consistency
    const demoPatients = [
      {
        id: 'pat-001',
        care_id: 'CARE-MH-2026-A8F2',
        full_name: 'Anita Meshram',
        gender: 'female',
        estimated_age: 26,
        village: 'Reguntha',
        taluka: 'Sironcha',
        district: 'Gadchiroli',
        primary_phone: '+919823001122',
        is_pregnant: true,
        high_risk_pregnancy: true
      },
      {
        id: 'pat-002',
        care_id: 'CARE-MH-2026-B104',
        full_name: 'Bapurao Atram',
        gender: 'male',
        estimated_age: 58,
        village: 'Reguntha',
        taluka: 'Sironcha',
        district: 'Gadchiroli',
        primary_phone: '+919421889900',
        is_pregnant: false,
        high_risk_pregnancy: false
      }
    ];

    let filtered = demoPatients;
    if (query) {
      filtered = filtered.filter(p => p.full_name.toLowerCase().includes(query.toLowerCase()));
    }
    if (village) {
      filtered = filtered.filter(p => p.village.toLowerCase().includes(village.toLowerCase()));
    }

    return NextResponse.json({
      success: true,
      patients: filtered,
      count: filtered.length
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to retrieve patients', details: String(error) },
      { status: 500 }
    );
  }
}
