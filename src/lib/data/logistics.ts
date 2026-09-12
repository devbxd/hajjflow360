import { query, pool } from '@/lib/db';

export interface HotelRow {
  id: string;
  name: string;
  city: string;
  stars: number;
  totalRooms: number;
  allocatedRooms: number;
  pilgrims: number;
  checkIn: string;
  checkOut: string;
}

export async function getHotels(companyId: string): Promise<HotelRow[]> {
  const rows = await query<{
    id: string; name: string; city: string; stars: number; total_rooms: number;
    check_in: string; check_out: string; allocated_rooms: string; pilgrim_count: string;
  }>(
    `SELECT
      h.id, h.name, h.city, h.stars, h.total_rooms, h.check_in, h.check_out,
      COUNT(DISTINCT p.room_number) FILTER (WHERE p.room_number IS NOT NULL) AS allocated_rooms,
      COUNT(p.id) AS pilgrim_count
    FROM hotels h
    LEFT JOIN pilgrims p ON (p.hotel_makkah = h.name OR p.hotel_madinah = h.name) AND p.company_id = h.company_id
    WHERE h.company_id = $1
    GROUP BY h.id, h.name, h.city, h.stars, h.total_rooms, h.check_in, h.check_out
    ORDER BY h.id`,
    [companyId]
  );
  return rows.map((r) => ({
    id: r.id,
    name: r.name,
    city: r.city,
    stars: r.stars,
    totalRooms: r.total_rooms,
    allocatedRooms: Number(r.allocated_rooms),
    pilgrims: Number(r.pilgrim_count),
    checkIn: r.check_in,
    checkOut: r.check_out,
  }));
}

export interface BusRow {
  id: string;
  number: number;
  capacity: number;
  allocated: number;
  driver: string;
  route: string;
  groupId: string | null;
}

export async function getBuses(companyId: string): Promise<BusRow[]> {
  const rows = await query<{
    id: string; number: number; capacity: number; driver: string; route: string; group_id: string | null; allocated: string;
  }>(
    `SELECT b.id, b.number, b.capacity, b.driver, b.route, b.group_id,
      COUNT(p.id) AS allocated
    FROM buses b
    LEFT JOIN pilgrims p ON p.bus_number = b.number AND p.company_id = b.company_id
    WHERE b.company_id = $1
    GROUP BY b.id, b.number, b.capacity, b.driver, b.route, b.group_id
    ORDER BY b.number`,
    [companyId]
  );
  return rows.map((r) => ({
    id: r.id,
    number: r.number,
    capacity: r.capacity,
    allocated: Number(r.allocated),
    driver: r.driver,
    route: r.route,
    groupId: r.group_id,
  }));
}

export interface FlightRow {
  id: string;
  flightNumber: string;
  airline: string;
  origin: string;
  destination: string;
  date: string;
  time: string;
  passengers: number;
  confirmed: number;
  status: 'confirmed' | 'pending';
}

export async function getFlights(companyId: string): Promise<FlightRow[]> {
  const rows = await query<{
    id: string; flight_number: string; airline: string; origin: string; destination: string;
    flight_date: string; flight_time: string; status: 'confirmed' | 'pending'; passengers: string; confirmed: string;
  }>(
    `SELECT f.id, f.flight_number, f.airline, f.origin, f.destination, f.flight_date, f.flight_time, f.status,
      COUNT(p.id) AS passengers,
      COUNT(*) FILTER (WHERE p.flight_status = 'confirmed') AS confirmed
    FROM flights f
    LEFT JOIN pilgrims p ON p.flight_number = f.flight_number AND p.company_id = f.company_id
    WHERE f.company_id = $1
    GROUP BY f.id, f.flight_number, f.airline, f.origin, f.destination, f.flight_date, f.flight_time, f.status
    ORDER BY f.id`,
    [companyId]
  );
  return rows.map((r) => ({
    id: r.id,
    flightNumber: r.flight_number,
    airline: r.airline,
    origin: r.origin,
    destination: r.destination,
    date: r.flight_date,
    time: r.flight_time,
    passengers: Number(r.passengers),
    confirmed: Number(r.confirmed),
    status: r.status,
  }));
}

export interface NewFlightInput {
  flightNumber: string;
  airline: string;
  origin: string;
  destination: string;
  date: string;
  time: string;
  status: 'confirmed' | 'pending';
}

export async function createFlight(input: NewFlightInput, companyId: string): Promise<string> {
  const [{ next_seq }] = await query<{ next_seq: string }>(
    `SELECT COALESCE(MAX(NULLIF(regexp_replace(id, '\\D', '', 'g'), '')::int), 0) + 1 AS next_seq FROM flights`
  );
  const id = `FLT-${String(next_seq).padStart(3, '0')}`;

  await query(
    `INSERT INTO flights (id, flight_number, airline, origin, destination, flight_date, flight_time, status, company_id)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
    [id, input.flightNumber, input.airline, input.origin, input.destination, input.date, input.time, input.status, companyId]
  );

  return id;
}

const SEAT_ROWS = ['A', 'B', 'C', 'D', 'E'];
const SEAT_COLS = 10;

function seatLabelForIndex(index: number): string {
  const row = SEAT_ROWS[Math.floor(index / SEAT_COLS) % SEAT_ROWS.length];
  const col = (index % SEAT_COLS) + 1;
  return `${row}${col}`;
}

export interface AutoAssignResult {
  busesAssigned: number;
  roomsAssigned: number;
}

// Greedy real assignment: pilgrims missing a bus/room get placed into actual
// remaining capacity, keeping each pilgrim's group together where a single
// bus/hotel has room for the whole group. Runs as one transaction so a
// failure partway through doesn't leave a half-updated allocation. Every
// query is scoped to one company so a fleet/hotel from another agency can
// never be touched.
export async function autoAssignRemaining(companyId: string): Promise<AutoAssignResult> {
  const client = await pool.connect();
  let busesAssigned = 0;
  let roomsAssigned = 0;

  try {
    await client.query('BEGIN');

    // --- Buses ---
    const buses = (
      await client.query<{ number: number; capacity: number; allocated: string }>(
        `SELECT b.number, b.capacity, COUNT(p.id) AS allocated
        FROM buses b
        LEFT JOIN pilgrims p ON p.bus_number = b.number AND p.company_id = b.company_id
        WHERE b.company_id = $1
        GROUP BY b.number, b.capacity
        ORDER BY b.number`,
        [companyId]
      )
    ).rows.map((r) => ({ number: r.number, capacity: r.capacity, allocated: Number(r.allocated) }));

    const unassignedForBus = (
      await client.query<{ id: string; group_id: string }>(
        `SELECT id, group_id FROM pilgrims WHERE bus_number IS NULL AND company_id = $1 ORDER BY group_id, id`,
        [companyId]
      )
    ).rows;

    // Track which bus each group has already been placed on, to keep groups together.
    const groupBus = new Map<string, number>();

    for (const pilgrim of unassignedForBus) {
      let targetBus = groupBus.get(pilgrim.group_id);
      const busHasRoom = (busNumber: number | undefined) => {
        if (busNumber === undefined) return false;
        const bus = buses.find((b) => b.number === busNumber);
        return Boolean(bus && bus.allocated < bus.capacity);
      };

      if (!busHasRoom(targetBus)) {
        const candidate = buses.find((b) => b.allocated < b.capacity);
        if (!candidate) continue; // fleet is full
        targetBus = candidate.number;
        groupBus.set(pilgrim.group_id, targetBus);
      }

      const bus = buses.find((b) => b.number === targetBus)!;
      const seat = seatLabelForIndex(bus.allocated);
      bus.allocated += 1;

      await client.query('UPDATE pilgrims SET bus_number = $2, seat_number = $3 WHERE id = $1 AND company_id = $4', [
        pilgrim.id,
        targetBus,
        seat,
        companyId,
      ]);
      busesAssigned++;
    }

    // --- Hotel rooms (Makkah leg only — hotel_madinah stays a manual step) ---
    const hotels = (
      await client.query<{ name: string; total_rooms: number; allocated_rooms: string }>(
        `SELECT h.name, h.total_rooms,
          COUNT(DISTINCT p.room_number) FILTER (WHERE p.room_number IS NOT NULL) AS allocated_rooms
        FROM hotels h
        LEFT JOIN pilgrims p ON p.hotel_makkah = h.name AND p.company_id = h.company_id
        WHERE h.city = 'Makkah' AND h.company_id = $1
        GROUP BY h.name, h.total_rooms
        ORDER BY h.name`,
        [companyId]
      )
    ).rows.map((r) => ({ name: r.name, totalRooms: r.total_rooms, allocatedRooms: Number(r.allocated_rooms) }));

    const usedRoomNumbers = new Set(
      (
        await client.query<{ room_number: string }>(
          `SELECT DISTINCT room_number FROM pilgrims WHERE room_number IS NOT NULL AND company_id = $1`,
          [companyId]
        )
      ).rows.map((r) => r.room_number)
    );
    let nextRoomSeq = 901;
    function nextRoomNumber(): string {
      while (usedRoomNumbers.has(String(nextRoomSeq))) nextRoomSeq++;
      const room = String(nextRoomSeq);
      usedRoomNumbers.add(room);
      nextRoomSeq++;
      return room;
    }

    const unassignedForRoom = (
      await client.query<{ id: string; group_id: string; gender: string; hotel_makkah: string | null }>(
        `SELECT id, group_id, gender, hotel_makkah FROM pilgrims WHERE room_number IS NULL AND company_id = $1 ORDER BY group_id, id`,
        [companyId]
      )
    ).rows;

    // Bucket by (hotel, group, gender) — same-gender roommates, same group where possible.
    const buckets = new Map<string, { hotel: string; roomType: 'single' | 'double' | 'triple' | 'quad'; roomNumber: string; count: number }>();

    for (const pilgrim of unassignedForRoom) {
      let hotelName = pilgrim.hotel_makkah;
      if (!hotelName || !hotels.some((h) => h.name === hotelName)) {
        const candidate = hotels.filter((h) => h.allocatedRooms < h.totalRooms).sort((a, b) => a.allocatedRooms - b.allocatedRooms)[0];
        if (!candidate) continue; // every hotel full
        hotelName = candidate.name;
      }

      const bucketKey = `${hotelName}::${pilgrim.group_id}::${pilgrim.gender}`;
      let bucket = buckets.get(bucketKey);
      if (!bucket || bucket.count >= 4) {
        bucket = { hotel: hotelName, roomType: 'quad', roomNumber: nextRoomNumber(), count: 0 };
        buckets.set(bucketKey, bucket);
        const hotel = hotels.find((h) => h.name === hotelName);
        if (hotel) hotel.allocatedRooms += 1;
      }
      bucket.count += 1;
      bucket.roomType = bucket.count === 1 ? 'single' : bucket.count === 2 ? 'double' : bucket.count === 3 ? 'triple' : 'quad';

      await client.query('UPDATE pilgrims SET hotel_makkah = $2, room_number = $3, room_type = $4 WHERE id = $1 AND company_id = $5', [
        pilgrim.id,
        bucket.hotel,
        bucket.roomNumber,
        bucket.roomType,
        companyId,
      ]);
      roomsAssigned++;
    }

    await client.query(
      `INSERT INTO activity_log (type, message, icon, company_id) VALUES ($1, $2, $3, $4)`,
      ['allocation', `Auto-assign: ${busesAssigned} pilgrims placed on buses, ${roomsAssigned} placed in hotel rooms`, 'bus', companyId]
    );

    await client.query('COMMIT');
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }

  return { busesAssigned, roomsAssigned };
}
