import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/currentUser';
import { deleteFlight } from '@/lib/data/logistics';
import { logActivity } from '@/lib/data/activity';

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getCurrentUser();
  if (!session) {
    return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 });
  }
  const { id } = await params;
  await deleteFlight(id, session.companyId);
  await logActivity('allocation', `Flight ${id} removed by ${session.displayName}`, 'bus', session.companyId);
  return NextResponse.json({ ok: true });
}
