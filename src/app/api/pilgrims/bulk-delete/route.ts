import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/currentUser';
import { deletePilgrims } from '@/lib/data/pilgrims';
import { logActivity } from '@/lib/data/activity';

export async function POST(req: NextRequest) {
  const session = await getCurrentUser();
  if (!session) {
    return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 });
  }

  let body: { ids?: string[] };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request.' }, { status: 400 });
  }

  const ids = body.ids;
  if (!Array.isArray(ids) || ids.length === 0) {
    return NextResponse.json({ error: 'No ids provided.' }, { status: 400 });
  }

  await deletePilgrims(ids, session.companyId);
  await logActivity('pilgrim', `${ids.length} pilgrims removed from campaign by ${session.displayName}`, 'alert', session.companyId);

  return NextResponse.json({ ok: true, count: ids.length });
}
