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
