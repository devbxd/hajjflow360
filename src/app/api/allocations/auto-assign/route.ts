import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/currentUser';
import { autoAssignRemaining } from '@/lib/data/logistics';

export async function POST() {
  const session = await getCurrentUser();
  if (!session) {
    return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 });
  }

  const result = await autoAssignRemaining();
  return NextResponse.json(result);
}
