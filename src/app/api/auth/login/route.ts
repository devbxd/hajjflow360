import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { findUser } from '@/lib/auth/users';
import { createSessionToken, SESSION_COOKIE, SESSION_MAX_AGE } from '@/lib/auth/session';

export async function POST(req: NextRequest) {
  let body: { username?: string; password?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request.' }, { status: 400 });
  }

  const { username, password } = body;
  if (!username || !password) {
    return NextResponse.json({ error: 'Username and password are required.' }, { status: 400 });
  }

  const user = await findUser(username);
  if (!user || !bcrypt.compareSync(password, user.passwordHash)) {
    return NextResponse.json({ error: 'Incorrect username or password.' }, { status: 401 });
  }

  const token = await createSessionToken({ username: user.username, displayName: user.displayName });

  const res = NextResponse.json({ ok: true });
  res.cookies.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: SESSION_MAX_AGE,
  });
  return res;
}
