import { query } from '@/lib/db';
import type { Pilgrim } from '@/lib/mockData';

interface PilgrimRow {
  id: string;
  name: string;
  name_ar: string | null;
  nationality: string;
  nationality_code: string;
  passport_number: string;
  passport_expiry: string;
  passport_status: Pilgrim['passportStatus'];
  visa_status: Pilgrim['visaStatus'];
  visa_number: string | null;
  visa_expiry: string | null;
  flight_status: Pilgrim['flightStatus'];
  flight_number: string | null;
  flight_date: string | null;
  hotel_makkah: string | null;
  hotel_madinah: string | null;
  room_number: string | null;
  room_type: Pilgrim['roomType'] | null;
  bus_number: number | null;
  seat_number: string | null;
  group_id: string;
  group_leader_name: string;
  payment_total: string;
  payment_paid: string;
  payment_status: Pilgrim['paymentStatus'];
  gender: Pilgrim['gender'];
  date_of_birth: string;
  age: number;
  phone: string;
  email: string;
  emergency_contact: string;
  emergency_phone: string;
  mahram_id: string | null;
  attendance_status: Pilgrim['attendanceStatus'];
  registered_at: string;
}

// node-postgres returns DATE columns as JS Date objects, not strings.
function formatDate(value: unknown): string {
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  return String(value);
}

function mapRow(row: PilgrimRow): Pilgrim {
  return {
    id: row.id,
    name: row.name,
    nameAr: row.name_ar ?? undefined,
    nationality: row.nationality,
    nationalityCode: row.nationality_code,
    passportNumber: row.passport_number,
    passportExpiry: row.passport_expiry,
    passportStatus: row.passport_status,
    visaStatus: row.visa_status,
    visaNumber: row.visa_number ?? undefined,
    visaExpiry: row.visa_expiry ?? undefined,
    flightStatus: row.flight_status,
    flightNumber: row.flight_number ?? undefined,
    flightDate: row.flight_date ?? undefined,
    hotelMakkah: row.hotel_makkah ?? undefined,
    hotelMadinah: row.hotel_madinah ?? undefined,
    roomNumber: row.room_number ?? undefined,
    roomType: row.room_type ?? undefined,
    busNumber: row.bus_number ?? undefined,
    seatNumber: row.seat_number ?? undefined,
    groupId: row.group_id,
    groupLeader: row.group_leader_name,
    paymentTotal: Number(row.payment_total),
    paymentPaid: Number(row.payment_paid),
    paymentStatus: row.payment_status,
    gender: row.gender,
    dateOfBirth: row.date_of_birth,
    phone: row.phone,
    email: row.email,
    emergencyContact: row.emergency_contact,
    emergencyPhone: row.emergency_phone,
    mahramId: row.mahram_id ?? undefined,
    attendanceStatus: row.attendance_status,
    registeredAt: row.registered_at,
    age: row.age,
  };
}

const BASE_SELECT = `
  SELECT pv.*, gl.name AS group_leader_name
  FROM pilgrims_with_paid pv
  JOIN group_leaders gl ON gl.group_id = pv.group_id
`;

export async function getAllPilgrims(): Promise<Pilgrim[]> {
  const rows = await query<PilgrimRow>(`${BASE_SELECT} ORDER BY pv.id`);
  return rows.map(mapRow);
}

export async function getPilgrimById(id: string): Promise<Pilgrim | null> {
  const rows = await query<PilgrimRow>(`${BASE_SELECT} WHERE pv.id = $1`, [id]);
  return rows.length ? mapRow(rows[0]) : null;
}

export async function getPilgrimsByGroup(groupId: string): Promise<Pilgrim[]> {
  const rows = await query<PilgrimRow>(`${BASE_SELECT} WHERE pv.group_id = $1 ORDER BY pv.id`, [groupId]);
  return rows.map(mapRow);
}

export interface NewPilgrimInput {
  name: string;
  nationality: string;
  nationalityCode: string;
  passportNumber: string;
  passportExpiry: string;
  dateOfBirth: string;
  gender: 'M' | 'F';
  phone?: string;
  email?: string;
  emergencyContact?: string;
  emergencyPhone?: string;
  groupId: string;
  paymentTotal: number;
  fromOcrScan: boolean;
}

function ageFromDob(dob: string): number {
  const [day, month, year] = dob.split('/').map(Number);
  if (!day || !month || !year) return 0;
  const today = new Date();
  let age = today.getFullYear() - year;
  const hadBirthdayThisYear = today.getMonth() + 1 > month || (today.getMonth() + 1 === month && today.getDate() >= day);
  if (!hadBirthdayThisYear) age--;
  return Math.max(0, age);
}

export async function createPilgrim(input: NewPilgrimInput): Promise<string> {
  const [{ next_seq }] = await query<{ next_seq: string }>(
    `SELECT COALESCE(MAX(NULLIF(regexp_replace(id, '\\D', '', 'g'), '')::int), 0) + 1 AS next_seq FROM pilgrims`
  );
  const id = `PIL-${String(next_seq).padStart(3, '0')}`;
  const registeredAt = new Date().toISOString().slice(0, 10);

  await query(
    `INSERT INTO pilgrims (
       id, name, nationality, nationality_code, passport_number, passport_expiry, passport_status,
       visa_status, flight_status, group_id, payment_total, payment_status, gender, date_of_birth, age,
       phone, email, emergency_contact, emergency_phone, attendance_status, registered_at
     ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21)`,
    [
      id,
      input.name,
      input.nationality,
      input.nationalityCode,
      input.passportNumber,
      input.passportExpiry,
      input.fromOcrScan ? 'scanned' : 'pending',
      'not-started',
      'not-assigned',
      input.groupId,
      input.paymentTotal,
      'pending',
      input.gender,
      input.dateOfBirth,
      ageFromDob(input.dateOfBirth),
      input.phone ?? '',
      input.email ?? '',
      input.emergencyContact ?? '',
      input.emergencyPhone ?? '',
      'not-checked',
      registeredAt,
    ]
  );

  return id;
}

export interface UpdatePilgrimInput {
  name: string;
  nationality: string;
  nationalityCode: string;
  passportNumber: string;
  passportExpiry: string;
  dateOfBirth: string;
  gender: 'M' | 'F';
  phone: string;
  email: string;
  emergencyContact: string;
  emergencyPhone: string;
  groupId: string;
  paymentTotal: number;
}

export async function updatePilgrim(id: string, input: UpdatePilgrimInput): Promise<void> {
  await query(
    `UPDATE pilgrims SET
       name = $2, nationality = $3, nationality_code = $4, passport_number = $5, passport_expiry = $6,
       date_of_birth = $7, age = $8, gender = $9, phone = $10, email = $11,
       emergency_contact = $12, emergency_phone = $13, group_id = $14, payment_total = $15
     WHERE id = $1`,
    [
      id,
      input.name,
      input.nationality,
      input.nationalityCode,
      input.passportNumber,
      input.passportExpiry,
      input.dateOfBirth,
      ageFromDob(input.dateOfBirth),
      input.gender,
      input.phone,
      input.email,
      input.emergencyContact,
      input.emergencyPhone,
      input.groupId,
      input.paymentTotal,
    ]
  );
}

export async function deletePilgrim(id: string): Promise<void> {
  await query('DELETE FROM pilgrims WHERE id = $1', [id]);
}

export async function deletePilgrims(ids: string[]): Promise<void> {
  if (ids.length === 0) return;
  await query('DELETE FROM pilgrims WHERE id = ANY($1)', [ids]);
}

export async function assignGroupToPilgrims(ids: string[], groupId: string): Promise<void> {
  if (ids.length === 0) return;
  await query('UPDATE pilgrims SET group_id = $2 WHERE id = ANY($1)', [ids, groupId]);
}

export async function updateAttendance(id: string, status: Pilgrim['attendanceStatus']): Promise<void> {
  await query('UPDATE pilgrims SET attendance_status = $2 WHERE id = $1', [id, status]);
}

export interface PaymentRecord {
  id: number;
  date: string;
  amount: number;
  method: string;
  reference: string;
  status: string;
}

export interface RecentPayment {
  id: string;
  pilgrimId: string;
  pilgrimName: string;
  amount: number;
  type: 'full' | 'installment';
  date: string;
  method: string;
  reference: string;
}

export async function getRecentPayments(limit = 20): Promise<RecentPayment[]> {
  const rows = await query<{
    id: number; pilgrim_id: string; name: string; amount: string; payment_total: string;
    paid_on: string; method: string; reference: string;
  }>(
    `SELECT pay.id, pay.pilgrim_id, p.name, pay.amount, p.payment_total, pay.paid_on, pay.method, pay.reference
     FROM payments pay
     JOIN pilgrims p ON p.id = pay.pilgrim_id
     WHERE pay.status = 'cleared'
     ORDER BY pay.paid_on DESC, pay.id DESC
     LIMIT $1`,
    [limit]
  );
  return rows.map((r) => ({
    id: `TXN-${r.id}`,
    pilgrimId: r.pilgrim_id,
    pilgrimName: r.name,
    amount: Number(r.amount),
    type: Number(r.amount) >= Number(r.payment_total) ? 'full' : 'installment',
    date: formatDate(r.paid_on),
    method: r.method,
    reference: r.reference,
  }));
}

export async function getPaymentsForPilgrim(pilgrimId: string): Promise<PaymentRecord[]> {
  const rows = await query<{ id: number; paid_on: string; amount: string; method: string; reference: string; status: string }>(
    'SELECT id, paid_on, amount, method, reference, status FROM payments WHERE pilgrim_id = $1 ORDER BY paid_on DESC',
    [pilgrimId]
  );
  return rows.map((r) => ({
    id: r.id,
    date: formatDate(r.paid_on),
    amount: Number(r.amount),
    method: r.method,
    reference: r.reference,
    status: r.status,
  }));
}
