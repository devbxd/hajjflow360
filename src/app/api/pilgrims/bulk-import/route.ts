import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/currentUser';
import { createPilgrim, type NewPilgrimInput } from '@/lib/data/pilgrims';
import { logActivity } from '@/lib/data/activity';

interface ImportRow extends Partial<NewPilgrimInput> {
  row?: number;
}

const REQUIRED_FIELDS: (keyof NewPilgrimInput)[] = [
  'name', 'nationality', 'nationalityCode', 'passportNumber', 'passportExpiry', 'dateOfBirth', 'gender', 'groupId',
];

export async function POST(req: NextRequest) {
  const session = await getCurrentUser();
  if (!session) {
    return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 });
  }

  let body: { rows?: ImportRow[] };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request.' }, { status: 400 });
  }

  const rows = body.rows;
  if (!Array.isArray(rows) || rows.length === 0) {
    return NextResponse.json({ error: 'No rows to import.' }, { status: 400 });
  }
  if (rows.length > 1000) {
    return NextResponse.json({ error: 'Import is limited to 1000 rows at a time.' }, { status: 400 });
  }

  const created: string[] = [];
  const errors: { row: number; name: string; error: string }[] = [];

  // Inserted one at a time (not in parallel) — pilgrim IDs are assigned by
  // scanning the current max id, so concurrent inserts could hand out the
  // same id twice.
  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const rowNumber = row.row ?? i + 2; // +2 assumes row 1 was the header

    const missing = REQUIRED_FIELDS.find((field) => !row[field]);
    if (missing) {
      errors.push({ row: rowNumber, name: row.name || '(no name)', error: `Missing "${missing}"` });
      continue;
    }
    if (row.gender !== 'M' && row.gender !== 'F') {
      errors.push({ row: rowNumber, name: row.name || '(no name)', error: 'Gender must be M or F' });
      continue;
    }

    try {
      const id = await createPilgrim({
        name: row.name!,
        nationality: row.nationality!,
        nationalityCode: row.nationalityCode!,
        passportNumber: row.passportNumber!,
        passportExpiry: row.passportExpiry!,
        dateOfBirth: row.dateOfBirth!,
        gender: row.gender,
        phone: row.phone,
        email: row.email,
        emergencyContact: row.emergencyContact,
        emergencyPhone: row.emergencyPhone,
        groupId: row.groupId!,
        paymentTotal: Number(row.paymentTotal) || 0,
        fromOcrScan: false,
      });
      created.push(id);
    } catch (err) {
      errors.push({ row: rowNumber, name: row.name || '(no name)', error: err instanceof Error ? err.message : 'Insert failed' });
    }
  }

  if (created.length > 0) {
    await logActivity('pilgrim', `${created.length} pilgrims imported from Excel by ${session.displayName}`, 'check');
  }

  return NextResponse.json({ ok: true, createdCount: created.length, createdIds: created, errors });
}
