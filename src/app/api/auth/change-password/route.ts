import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { getCurrentUser } from '@/lib/auth/currentUser';
import { findUser, updatePasswordHash } from '@/lib/auth/users';

export async function POST(req: NextRequest) {
  const session = await getCurrentUser();
  if (!session) {
    return NextResponse.json({ error: 'Non authentifié.' }, { status: 401 });
  }

  let body: { currentPassword?: string; newPassword?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Requête invalide.' }, { status: 400 });
  }

  const { currentPassword, newPassword } = body;
  if (!currentPassword || !newPassword) {
    return NextResponse.json({ error: 'Mot de passe actuel et nouveau requis.' }, { status: 400 });
  }
  if (newPassword.length < 8) {
    return NextResponse.json({ error: 'Le nouveau mot de passe doit faire au moins 8 caractères.' }, { status: 400 });
  }

  const user = findUser(session.username);
  if (!user || !bcrypt.compareSync(currentPassword, user.passwordHash)) {
    return NextResponse.json({ error: 'Mot de passe actuel incorrect.' }, { status: 401 });
  }

  const newHash = bcrypt.hashSync(newPassword, 10);
  updatePasswordHash(session.username, newHash);

  return NextResponse.json({ ok: true });
}
