import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/currentUser';
import { createFlight, type NewFlightInput } from '@/lib/data/logistics';
import { logActivity } from '@/lib/data/activity';

interface ImportRow extends Partial<NewFlightInput> {
  row?: number;
}

const REQUIRED_FIELDS: (keyof NewFlightInput)[] = ['flightNumber', 'airline', 'origin', 'destination', 'date', 'time'];

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

  // Inserted one at a time — flight IDs are assigned by scanning the current
  // max id, so concurrent inserts could hand out the same id twice.
  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const rowNumber = row.row ?? i + 2;

    const missing = REQUIRED_FIELDS.find((field) => !row[field]);
    if (missing) {
      errors.push({ row: rowNumber, name: row.flightNumber || '(no flight #)', error: `Missing "${missing}"` });
      continue;
    }

    try {
      const id = await createFlight(
        {
          flightNumber: row.flightNumber!,
          airline: row.airline!,
          origin: row.origin!,
          destination: row.destination!,
          date: row.date!,
          time: row.time!,
          status: row.status === 'confirmed' ? 'confirmed' : 'pending',
        },
        session.companyId
      );
      created.push(id);
    } catch (err) {
      errors.push({ row: rowNumber, name: row.flightNumber || '(no flight #)', error: err instanceof Error ? err.message : 'Insert failed' });
    }
  }

  if (created.length > 0) {
    await logActivity('allocation', `${created.length} flights imported from Excel by ${session.displayName}`, 'bus', session.companyId);
  }

  return NextResponse.json({ ok: true, createdCount: created.length, createdIds: created, errors });
}
