import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/currentUser';
import { createGroupLeader, type NewGroupLeaderInput } from '@/lib/data/groupLeaders';
import { logActivity } from '@/lib/data/activity';

export async function POST(req: NextRequest) {
  const session = await getCurrentUser();
  if (!session) {
    return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 });
  }

  let body: Partial<NewGroupLeaderInput>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request.' }, { status: 400 });
  }

  if (!body.name || !body.phone) {
    return NextResponse.json({ error: 'Name and phone are required.' }, { status: 400 });
  }

  const { id, groupId } = await createGroupLeader({ name: body.name, phone: body.phone }, session.companyId);
  await logActivity('pilgrim', `Group leader ${body.name} (${groupId}) added by ${session.displayName}`, 'check', session.companyId);

  return NextResponse.json({ ok: true, id, groupId });
}
