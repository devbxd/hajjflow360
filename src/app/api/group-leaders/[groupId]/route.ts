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

  let result;
  try {
    result = await deleteGroupLeader(groupId, session.companyId);
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Failed to remove group leader.' }, { status: 409 });
  }

  const parts = [];
  if (result.movedPilgrims > 0) parts.push(`${result.movedPilgrims} pilgrims`);
  if (result.movedBuses > 0) parts.push(`${result.movedBuses} buses`);
  const suffix = parts.length > 0 ? ` (${parts.join(' and ')} moved to ${result.movedTo})` : '';
  await logActivity('pilgrim', `Group leader ${groupId} removed by ${session.displayName}${suffix}`, 'alert', session.companyId);
  return NextResponse.json({ ok: true, movedPilgrims: result.movedPilgrims, movedBuses: result.movedBuses, movedTo: result.movedTo });
}
