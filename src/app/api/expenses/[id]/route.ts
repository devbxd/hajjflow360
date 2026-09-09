import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/currentUser';
import { deleteExpense } from '@/lib/data/finance';

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getCurrentUser();
  if (!session) {
    return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 });
  }
  const { id } = await params;
  const numericId = Number(id);
  if (!Number.isFinite(numericId)) {
    return NextResponse.json({ error: 'Invalid expense id.' }, { status: 400 });
  }
  await deleteExpense(numericId);
  return NextResponse.json({ ok: true });
}
