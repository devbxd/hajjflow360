import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/currentUser';
import { createFlight, type NewFlightInput } from '@/lib/data/logistics';
import { logActivity } from '@/lib/data/activity';

const REQUIRED_FIELDS: (keyof NewFlightInput)[] = ['flightNumber', 'airline', 'origin', 'destination', 'date', 'time'];

export async function POST(req: NextRequest) {
  const session = await getCurrentUser();
  if (!session) {
    return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 });
  }

  let body: Partial<NewFlightInput>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request.' }, { status: 400 });
  }

  for (const field of REQUIRED_FIELDS) {
    if (!body[field]) {
      return NextResponse.json({ error: `Missing field: ${field}` }, { status: 400 });
    }
  }

  const input: NewFlightInput = {
    flightNumber: body.flightNumber!,
    airline: body.airline!,
    origin: body.origin!,
    destination: body.destination!,
    date: body.date!,
    time: body.time!,
    status: body.status === 'confirmed' ? 'confirmed' : 'pending',
  };

  const id = await createFlight(input, session.companyId);
  await logActivity('allocation', `Flight ${input.flightNumber} (${input.origin} → ${input.destination}) added by ${session.displayName}`, 'bus', session.companyId);

  return NextResponse.json({ ok: true, id });
}
