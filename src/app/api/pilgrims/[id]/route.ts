import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/currentUser';
import { deletePilgrim, getPilgrimById, updatePilgrim, type UpdatePilgrimInput } from '@/lib/data/pilgrims';
import { logActivity } from '@/lib/data/activity';

const REQUIRED_FIELDS: (keyof UpdatePilgrimInput)[] = [
  'name', 'nationality', 'nationalityCode', 'passportNumber', 'passportExpiry',
  'dateOfBirth', 'gender', 'phone', 'email', 'emergencyContact', 'emergencyPhone', 'groupId',
];

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getCurrentUser();
  if (!session) {
    return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 });
  }

  const { id } = await params;
  const existing = await getPilgrimById(id, session.companyId);
  if (!existing) {
    return NextResponse.json({ error: 'Pilgrim not found.' }, { status: 404 });
  }

  let body: Partial<UpdatePilgrimInput>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request.' }, { status: 400 });
  }

  for (const field of REQUIRED_FIELDS) {
    if (!body[field]) {
      return NextResponse.json({ error: `Missing field: ${field}` }, { status: 400 });
    }
  }
  if (body.gender !== 'M' && body.gender !== 'F') {
    return NextResponse.json({ error: 'Invalid gender.' }, { status: 400 });
  }

  await updatePilgrim(id, {
    name: body.name!,
    nationality: body.nationality!,
    nationalityCode: body.nationalityCode!,
    passportNumber: body.passportNumber!,
    passportExpiry: body.passportExpiry!,
    dateOfBirth: body.dateOfBirth!,
    gender: body.gender,
    phone: body.phone!,
    email: body.email!,
    emergencyContact: body.emergencyContact!,
    emergencyPhone: body.emergencyPhone!,
    groupId: body.groupId!,
    paymentTotal: Number(body.paymentTotal) || 0,
  }, session.companyId);
  await logActivity('pilgrim', `${body.name} (${id}) updated by ${session.displayName}`, 'check', session.companyId);

  return NextResponse.json({ ok: true });
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getCurrentUser();
  if (!session) {
    return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 });
  }

  const { id } = await params;
  const pilgrim = await getPilgrimById(id, session.companyId);
  if (!pilgrim) {
    return NextResponse.json({ error: 'Pilgrim not found.' }, { status: 404 });
  }

  await deletePilgrim(id, session.companyId);
  await logActivity('pilgrim', `${pilgrim.name} (${id}) removed from campaign by ${session.displayName}`, 'alert', session.companyId);

  return NextResponse.json({ ok: true });
}
