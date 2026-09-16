import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/currentUser';
import { reassignRoom, type ReassignRoomInput } from '@/lib/data/logistics';
import { logActivity } from '@/lib/data/activity';

export async function POST(req: NextRequest) {
  const session = await getCurrentUser();
  if (!session) {
    return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 });
  }

  let body: Partial<ReassignRoomInput>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request.' }, { status: 400 });
  }

  if (!body.pilgrimId || !body.city || !body.hotelName || !body.roomNumber || !body.roomType) {
    return NextResponse.json({ error: 'Missing fields.' }, { status: 400 });
  }

  await reassignRoom(
    {
      pilgrimId: body.pilgrimId,
      city: body.city,
      hotelName: body.hotelName,
      roomNumber: body.roomNumber,
      roomType: body.roomType,
    },
    session.companyId
  );

  await logActivity(
    'allocation',
    `${body.pilgrimId} reassigned to ${body.hotelName} room ${body.roomNumber} by ${session.displayName}`,
    'bus',
    session.companyId
  );

  return NextResponse.json({ ok: true });
}
