import { NextRequest, NextResponse } from 'next/server';
import { authorizeRequest } from '@/lib/auth/rbac';

const AI_SERVICE_URL = process.env.NEXT_PUBLIC_AI_SERVICE_URL || 'http://localhost:8000';
const AI_SERVICE_API_KEY = process.env.AI_SERVICE_API_KEY || 'caregrid-internal-dev-key-change-in-prod';

/**
 * /api/triage is strictly POST-only per API specification and clinical safety contract.
 */
export async function GET() {
  return NextResponse.json(
    { error: 'Method Not Allowed. /api/triage supports POST only.' },
    { status: 405, headers: { Allow: 'POST' } }
  );
}

export async function POST(req: NextRequest) {
  // Authorize request: required role is asha or doctor (admin inherits)
  const auth = await authorizeRequest(req, ['asha', 'doctor']);
  if (!auth.authorized) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

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
