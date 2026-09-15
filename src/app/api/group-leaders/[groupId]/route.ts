import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/currentUser';
import { deleteGroupLeader } from '@/lib/data/groupLeaders';
import { logActivity } from '@/lib/data/activity';

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ groupId: string }> }) {
  const session = await getCurrentUser();
  if (!session) {
    return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 });
  }
  const { groupId } = await params;

  try {
    await deleteGroupLeader(groupId, session.companyId);
  } catch (err) {
    const code = (err as { code?: string })?.code;
    if (code === '23503') {
      return NextResponse.json(
        { error: 'This group still has pilgrims (or buses) assigned to it. Reassign them to another group first.' },
        { status: 409 }
      );
    }
    throw err;
  }

  await logActivity('pilgrim', `Group leader ${groupId} removed by ${session.displayName}`, 'alert', session.companyId);
  return NextResponse.json({ ok: true });
}
