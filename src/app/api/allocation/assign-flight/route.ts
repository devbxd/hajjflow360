import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/currentUser';
import { query } from '@/lib/db';
import { logActivity } from '@/lib/data/activity';

export async function POST(req: NextRequest) {
  const session = await getCurrentUser();
  if (!session) {
    return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 });
  }

  let body: { pilgrimIds?: string[]; flightNumber?: string; flightDate?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request.' }, { status: 400 });
  }

  const ids = body.pilgrimIds;
  if (!Array.isArray(ids) || ids.length === 0 || !body.flightNumber) {
    return NextResponse.json({ error: 'Missing pilgrimIds or flightNumber.' }, { status: 400 });
  }

  await query(
    `UPDATE pilgrims SET flight_number = $2, flight_date = $3, flight_status = 'confirmed' WHERE id = ANY($1) AND company_id = $4`,
    [ids, body.flightNumber, body.flightDate ?? null, session.companyId]
  );

  await logActivity('allocation', `${ids.length} pilgrims assigned to flight ${body.flightNumber} by ${session.displayName}`, 'bus', session.companyId);

  return NextResponse.json({ ok: true, count: ids.length });
}
