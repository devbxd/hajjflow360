import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/currentUser';
import { assignGroupToPilgrims } from '@/lib/data/pilgrims';
import { logActivity } from '@/lib/data/activity';

export async function POST(req: NextRequest) {
  const session = await getCurrentUser();
  if (!session) {
    return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 });
  }

  let body: { ids?: string[]; groupId?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request.' }, { status: 400 });
  }

  const ids = body.ids;
  if (!Array.isArray(ids) || ids.length === 0) {
    return NextResponse.json({ error: 'No ids provided.' }, { status: 400 });
  }
  if (!body.groupId) {
    return NextResponse.json({ error: 'No group provided.' }, { status: 400 });
  }

  await assignGroupToPilgrims(ids, body.groupId);
  await logActivity('pilgrim', `${ids.length} pilgrims moved to ${body.groupId} by ${session.displayName}`, 'check');

  return NextResponse.json({ ok: true, count: ids.length });
}
