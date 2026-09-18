import { NextRequest, NextResponse } from 'next/server';

const AI_SERVICE_URL = process.env.NEXT_PUBLIC_AI_SERVICE_URL || 'http://localhost:8000';
const AI_SERVICE_API_KEY = process.env.AI_SERVICE_API_KEY || 'caregrid-internal-dev-key-change-in-prod';

export async function POST(req: NextRequest) {
  try {
    const payload = await req.json();

    const response = await fetch(`${AI_SERVICE_URL}/api/v1/triage/assess`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': AI_SERVICE_API_KEY
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const errorText = await response.text();
      return NextResponse.json(
        { error: 'AI microservice evaluation failed', details: errorText },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json(
      { error: 'Unable to reach AI decision assist service', details: String(error) },
      { status: 503 }
    );
  }
}
