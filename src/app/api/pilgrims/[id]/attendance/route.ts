import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/currentUser';
import { updateAttendance, getPilgrimById } from '@/lib/data/pilgrims';
import { logActivity } from '@/lib/data/activity';

const VALID_STATUSES = new Set(['present', 'absent', 'not-checked']);

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getCurrentUser();
  if (!session) {
    return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 });
  }

  const { id } = await params;
  let body: { status?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request.' }, { status: 400 });
  }

  if (!body.status || !VALID_STATUSES.has(body.status)) {
    return NextResponse.json({ error: 'Invalid status.' }, { status: 400 });
  }

  const pilgrim = await getPilgrimById(id, session.companyId);
  if (!pilgrim) {
    return NextResponse.json({ error: 'Pilgrim not found.' }, { status: 404 });
  }

  await updateAttendance(id, body.status as 'present' | 'absent' | 'not-checked', session.companyId);

  if (body.status === 'present') {
    await logActivity('checkin', `${pilgrim.name} (${id}) checked in`, 'qr', session.companyId);
  }

  return NextResponse.json({ ok: true });
}
