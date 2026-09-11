import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/currentUser';
import { query } from '@/lib/db';
import { logActivity } from '@/lib/data/activity';

export async function POST(req: NextRequest) {
  const session = await getCurrentUser();
  if (!session) {
    return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 });
  }

  let body: { pilgrimId?: string; busNumber?: number; seatNumber?: string; previousOccupantId?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request.' }, { status: 400 });
  }

  // Vacate-only: free up the previous occupant's seat with no new pilgrim moving in.
  if (!body.pilgrimId && body.previousOccupantId) {
    await query('UPDATE pilgrims SET bus_number = NULL, seat_number = NULL WHERE id = $1 AND company_id = $2', [body.previousOccupantId, session.companyId]);
    await logActivity('allocation', `${body.previousOccupantId} removed from their bus seat by ${session.displayName}`, 'bus', session.companyId);
    return NextResponse.json({ ok: true });
  }

  if (!body.pilgrimId || !body.busNumber || !body.seatNumber) {
    return NextResponse.json({ error: 'Missing pilgrimId, busNumber or seatNumber.' }, { status: 400 });
  }

  await query('UPDATE pilgrims SET bus_number = $2, seat_number = $3 WHERE id = $1 AND company_id = $4', [
    body.pilgrimId,
    body.busNumber,
    body.seatNumber,
    session.companyId,
  ]);

  if (body.previousOccupantId) {
    await query('UPDATE pilgrims SET bus_number = NULL, seat_number = NULL WHERE id = $1 AND company_id = $2', [body.previousOccupantId, session.companyId]);
  }

  await logActivity(
    'allocation',
    `${body.pilgrimId} assigned to Bus #${body.busNumber} seat ${body.seatNumber} by ${session.displayName}`,
    'bus',
    session.companyId
  );

  return NextResponse.json({ ok: true });
}
