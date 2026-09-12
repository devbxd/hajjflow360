import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/currentUser';
import { getRecentActivity } from '@/lib/data/activity';

export async function GET() {
  const session = await getCurrentUser();
  if (!session) {
    return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 });
  }
  const activity = await getRecentActivity(session.companyId, 6);
  return NextResponse.json({ activity });
}
