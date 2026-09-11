import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/currentUser';
import { createPilgrim, type NewPilgrimInput } from '@/lib/data/pilgrims';
import { logActivity } from '@/lib/data/activity';

// Auto-save endpoint for the dedicated Passport Scanning page: a successful
// MRZ read is inserted immediately with no manual confirmation step, unlike
// the review-first flow in the "Add Pilgrim" modal. Contact details aren't on
// the passport, so they're optional here and left for staff to fill in later
// from the pilgrim's profile.
const REQUIRED_FIELDS: (keyof NewPilgrimInput)[] = [
  'name', 'nationalityCode', 'passportNumber', 'passportExpiry', 'dateOfBirth', 'gender', 'groupId',
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
      return NextResponse.json({ error: `Scan didn't capture "${field}" clearly enough — try again or add this pilgrim manually.` }, { status: 400 });
    }
  }
  if (body.gender !== 'M' && body.gender !== 'F') {
    return NextResponse.json({ error: 'Invalid gender.' }, { status: 400 });
  }

  const input: NewPilgrimInput = {
    name: body.name!,
    nationality: body.nationality || body.nationalityCode!,
    nationalityCode: body.nationalityCode!,
    passportNumber: body.passportNumber!,
    passportExpiry: body.passportExpiry!,
    dateOfBirth: body.dateOfBirth!,
    gender: body.gender,
    groupId: body.groupId!,
    paymentTotal: Number(body.paymentTotal) || 0,
    fromOcrScan: true,
  };

  const id = await createPilgrim(input, session.companyId);
  await logActivity('passport', `${input.name} (${id}) auto-registered by ${session.displayName} via passport scan`, 'scan', session.companyId);

  return NextResponse.json({ ok: true, id });
}
