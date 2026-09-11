import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/currentUser';
import { createPilgrim, type NewPilgrimInput } from '@/lib/data/pilgrims';
import { logActivity } from '@/lib/data/activity';

const REQUIRED_FIELDS: (keyof NewPilgrimInput)[] = [
  'name', 'nationality', 'nationalityCode', 'passportNumber', 'passportExpiry',
  'dateOfBirth', 'gender', 'phone', 'email', 'emergencyContact', 'emergencyPhone', 'groupId',
];

export async function POST(req: NextRequest) {
  const session = await getCurrentUser();
  if (!session) {
    return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 });
  }

  let body: Partial<NewPilgrimInput>;
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

  const input: NewPilgrimInput = {
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
    fromOcrScan: Boolean(body.fromOcrScan),
  };

  const id = await createPilgrim(input, session.companyId);
  await logActivity('passport', `${input.name} (${id}) registered by ${session.displayName}${input.fromOcrScan ? ' via passport scan' : ''}`, input.fromOcrScan ? 'scan' : 'check', session.companyId);

  return NextResponse.json({ ok: true, id });
}
