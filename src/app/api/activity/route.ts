import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/currentUser';
import { logActivity } from '@/lib/data/activity';

const ALLOWED_TYPES = new Set(['whatsapp', 'checkin', 'passport', 'visa', 'payment', 'allocation']);

export async function POST(req: NextRequest) {
  const session = await getCurrentUser();
  if (!session) {
    return NextResponse.json({ error: 'Non authentifié.' }, { status: 401 });
  }

  let body: { type?: string; message?: string; icon?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Requête invalide.' }, { status: 400 });
  }

  if (!body.type || !ALLOWED_TYPES.has(body.type) || !body.message) {
    return NextResponse.json({ error: 'Champs invalides.' }, { status: 400 });
  }

  await logActivity(body.type, body.message, body.icon ?? 'message');
  return NextResponse.json({ ok: true });
}
