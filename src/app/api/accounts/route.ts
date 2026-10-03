import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { getCurrentUser } from '@/lib/auth/currentUser';
import { ADMIN_COMPANY_ID } from '@/lib/auth/adminCompany';
import { decryptPassword, listPasswordRecords, savePasswordRecord } from '@/lib/auth/passwordVault';
import { query } from '@/lib/db';

export async function GET() {
  const session = await getCurrentUser();
  if (!session) {
    return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 });
  }
  if (session.companyId !== ADMIN_COMPANY_ID) {
    return NextResponse.json({ error: 'Forbidden.' }, { status: 403 });
  }

  const rows = await listPasswordRecords();
  return NextResponse.json({
    users: rows.map((r) => ({
      username: r.username,
      displayName: r.display_name,
      password: r.password_enc ? decryptPassword(r.password_enc) : null,
      updatedAt: r.updated_at,
    })),
  });
}

export async function POST(req: NextRequest) {
  const session = await getCurrentUser();
  if (!session) {
    return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 });
  }
  if (session.companyId !== ADMIN_COMPANY_ID) {
    return NextResponse.json({ error: 'Forbidden.' }, { status: 403 });
  }

  let body: { username?: string; displayName?: string; password?: string; companyId?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request.' }, { status: 400 });
  }

  const username = body.username?.trim();
  const displayName = body.displayName?.trim();
  const password = body.password ?? '';
  const companyId = body.companyId?.trim();
  if (!username || !displayName || !password || !companyId) {
    return NextResponse.json({ error: 'All fields are required.' }, { status: 400 });
  }
  if (password.length < 4) {
    return NextResponse.json({ error: 'Password must be at least 4 characters.' }, { status: 400 });
  }

  const company = await query<{ id: string }>('SELECT id FROM companies WHERE id = $1', [companyId]);
  if (company.length === 0) {
    return NextResponse.json({ error: `Company ${companyId} does not exist.` }, { status: 400 });
  }

  const existing = await query('SELECT 1 FROM staff_users WHERE lower(username) = lower($1)', [username]);
  if (existing.length > 0) {
    return NextResponse.json({ error: 'That username already exists.' }, { status: 409 });
  }

  await query(
    'INSERT INTO staff_users (username, display_name, password_hash, company_id) VALUES ($1, $2, $3, $4)',
    [username, displayName, bcrypt.hashSync(password, 10), companyId]
  );
  await savePasswordRecord(username, password);

  return NextResponse.json({ ok: true });
}
