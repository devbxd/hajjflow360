import { query } from '@/lib/db';

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

export async function getHotels(): Promise<HotelRow[]> {
  const rows = await query<{
    id: string; name: string; city: string; stars: number; total_rooms: number;
    check_in: string; check_out: string; allocated_rooms: string; pilgrim_count: string;
  }>(`
    SELECT
      h.id, h.name, h.city, h.stars, h.total_rooms, h.check_in, h.check_out,
      COUNT(DISTINCT p.room_number) FILTER (WHERE p.room_number IS NOT NULL) AS allocated_rooms,
      COUNT(p.id) AS pilgrim_count
    FROM hotels h
    LEFT JOIN pilgrims p ON p.hotel_makkah = h.name OR p.hotel_madinah = h.name
    GROUP BY h.id, h.name, h.city, h.stars, h.total_rooms, h.check_in, h.check_out
    ORDER BY h.id
  `);
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

export async function getBuses(): Promise<BusRow[]> {
  const rows = await query<{
    id: string; number: number; capacity: number; driver: string; route: string; group_id: string | null; allocated: string;
  }>(`
    SELECT b.id, b.number, b.capacity, b.driver, b.route, b.group_id,
      COUNT(p.id) AS allocated
    FROM buses b
    LEFT JOIN pilgrims p ON p.bus_number = b.number
    GROUP BY b.id, b.number, b.capacity, b.driver, b.route, b.group_id
    ORDER BY b.number
  `);
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

export async function getFlights(): Promise<FlightRow[]> {
  const rows = await query<{
    id: string; flight_number: string; airline: string; origin: string; destination: string;
    flight_date: string; flight_time: string; status: 'confirmed' | 'pending'; passengers: string; confirmed: string;
  }>(`
    SELECT f.id, f.flight_number, f.airline, f.origin, f.destination, f.flight_date, f.flight_time, f.status,
      COUNT(p.id) AS passengers,
      COUNT(*) FILTER (WHERE p.flight_status = 'confirmed') AS confirmed
    FROM flights f
    LEFT JOIN pilgrims p ON p.flight_number = f.flight_number
    GROUP BY f.id, f.flight_number, f.airline, f.origin, f.destination, f.flight_date, f.flight_time, f.status
    ORDER BY f.id
  `);
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
