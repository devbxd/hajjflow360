import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/currentUser';
import { deletePilgrim, getPilgrimById } from '@/lib/data/pilgrims';
import { logActivity } from '@/lib/data/activity';

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getCurrentUser();
  if (!session) {
    return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 });
  }

  const { id } = await params;
  const pilgrim = await getPilgrimById(id);
  if (!pilgrim) {
    return NextResponse.json({ error: 'Pilgrim not found.' }, { status: 404 });
  }

  await deletePilgrim(id);
  await logActivity('pilgrim', `${pilgrim.name} (${id}) removed from campaign by ${session.displayName}`, 'alert');

  return NextResponse.json({ ok: true });
}
