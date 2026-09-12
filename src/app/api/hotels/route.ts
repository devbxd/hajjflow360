import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/currentUser';
import { createHotel, type NewHotelInput } from '@/lib/data/logistics';
import { logActivity } from '@/lib/data/activity';

const REQUIRED_FIELDS: (keyof NewHotelInput)[] = ['name', 'city', 'stars', 'totalRooms', 'checkIn', 'checkOut'];

export async function POST(req: NextRequest) {
  const session = await getCurrentUser();
  if (!session) {
    return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 });
  }

  let body: Partial<NewHotelInput>;
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

  const input: NewHotelInput = {
    name: body.name!,
    city: body.city!,
    stars: Number(body.stars),
    totalRooms: Number(body.totalRooms),
    checkIn: body.checkIn!,
    checkOut: body.checkOut!,
  };

  const id = await createHotel(input, session.companyId);
  await logActivity('allocation', `Hotel ${input.name} (${input.city}) added by ${session.displayName}`, 'bus', session.companyId);

  return NextResponse.json({ ok: true, id });
}
