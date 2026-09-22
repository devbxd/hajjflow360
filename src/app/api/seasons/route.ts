import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/currentUser';
import { getActiveSeason, getArchivedSeasons, startNewSeason, type NewSeasonInput } from '@/lib/data/seasons';

export async function GET() {
  const session = await getCurrentUser();
  if (!session) {
    return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 });
  }
  const [active, archived] = await Promise.all([
    getActiveSeason(session.companyId),
    getArchivedSeasons(session.companyId),
  ]);
  return NextResponse.json({ active, archived });
}

export async function POST(req: NextRequest) {
  const session = await getCurrentUser();
  if (!session) {
    return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 });
  }

  let body: Partial<NewSeasonInput> & { confirm?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request.' }, { status: 400 });
  }

  if (!body.name || !body.startDate) {
    return NextResponse.json({ error: 'Season name and start date are required.' }, { status: 400 });
  }
  if (body.confirm !== 'RESET') {
    return NextResponse.json({ error: 'Confirmation text does not match.' }, { status: 400 });
  }

  const id = await startNewSeason({ name: body.name, startDate: body.startDate }, session.companyId);
  return NextResponse.json({ ok: true, id });
}
