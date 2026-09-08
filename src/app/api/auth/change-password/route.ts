import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { getCurrentUser } from '@/lib/auth/currentUser';
import { findUser, updatePasswordHash } from '@/lib/auth/users';

export async function POST(req: NextRequest) {
  const session = await getCurrentUser();
  if (!session) {
    return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 });
  }

  let body: { currentPassword?: string; newPassword?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request.' }, { status: 400 });
  }

  const { currentPassword, newPassword } = body;
  if (!currentPassword || !newPassword) {
    return NextResponse.json({ error: 'Current and new password are required.' }, { status: 400 });
  }
  if (newPassword.length < 8) {
    return NextResponse.json({ error: 'New password must be at least 8 characters.' }, { status: 400 });
  }

  const user = await findUser(session.username);
  if (!user || !bcrypt.compareSync(currentPassword, user.passwordHash)) {
    return NextResponse.json({ error: 'Current password is incorrect.' }, { status: 401 });
  }

  const newHash = bcrypt.hashSync(newPassword, 10);
  await updatePasswordHash(session.username, newHash);

  return NextResponse.json({ ok: true });
}
