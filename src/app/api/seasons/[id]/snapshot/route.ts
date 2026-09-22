import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/currentUser';
import { getSeasonSnapshot } from '@/lib/data/seasons';

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getCurrentUser();
  if (!session) {
    return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 });
  }
  const { id } = await params;
  const numericId = Number(id);
  if (!Number.isFinite(numericId)) {
    return NextResponse.json({ error: 'Invalid season id.' }, { status: 400 });
  }
  const snapshot = await getSeasonSnapshot(numericId, session.companyId);
  if (!snapshot) {
    return NextResponse.json({ error: 'Season not found.' }, { status: 404 });
  }
  return NextResponse.json({ snapshot });
}
