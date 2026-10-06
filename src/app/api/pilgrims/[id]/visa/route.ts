import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/currentUser';
import { setVisaStatus } from '@/lib/data/pilgrims';
import { logActivity } from '@/lib/data/activity';

const STATUSES = ['approved', 'pending', 'processing', 'not-started', 'rejected'] as const;

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getCurrentUser();
  if (!session) {
    return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 });
  }

  const { id } = await params;
  const body = (await req.json().catch(() => null)) as { status?: string } | null;
  if (!body?.status || !(STATUSES as readonly string[]).includes(body.status)) {
    return NextResponse.json({ error: 'Invalid visa status.' }, { status: 400 });
  }
  const status = body.status as (typeof STATUSES)[number];

  const name = await setVisaStatus(id, status, session.companyId);
  if (!name) {
    return NextResponse.json({ error: 'Pilgrim not found.' }, { status: 404 });
  }

  const message =
    status === 'approved'
      ? `Visa approved for ${name} (${id}) by ${session.displayName}`
      : `Visa status of ${name} (${id}) set to ${status} by ${session.displayName}`;
  await logActivity('pilgrim', message, 'check', session.companyId);

  return NextResponse.json({ ok: true });
}
