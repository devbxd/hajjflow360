import { query } from '@/lib/db';

export interface OperationsAlert {
  id: string;
  severity: 'critical' | 'warning';
  message: string;
}

const PASSPORT_EXPIRY_WINDOW_DAYS = 90;

function parseDMY(date: string): Date | null {
  const [d, m, y] = date.split('/').map(Number);
  if (!d || !m || !y) return null;
  return new Date(y, m - 1, d);
}

// Straightforward threshold checks over real data — no AI/LLM involved, just
// the kind of "is anything about to go wrong" queries staff would otherwise
// have to notice by eye in a spreadsheet.
export async function getOperationsAlerts(companyId: string): Promise<OperationsAlert[]> {
  const alerts: OperationsAlert[] = [];

  const pilgrims = await query<{ id: string; passport_expiry: string }>(
    'SELECT id, passport_expiry FROM pilgrims WHERE company_id = $1',
    [companyId]
  );
  const now = new Date();
  const horizon = new Date(now.getTime() + PASSPORT_EXPIRY_WINDOW_DAYS * 86400000);
  const expiringSoon = pilgrims.filter((p) => {
    const exp = parseDMY(p.passport_expiry);
    return exp !== null && exp >= now && exp <= horizon;
  });
  if (expiringSoon.length > 0) {
    alerts.push({
      id: 'passports-expiring',
      severity: 'warning',
      message: `${expiringSoon.length} pilgrim${expiringSoon.length > 1 ? 's have' : ' has'} passports expiring within ${PASSPORT_EXPIRY_WINDOW_DAYS} days.`,
    });
  }

  const buses = await query<{ number: number; capacity: number; allocated: string }>(
    `SELECT b.number, b.capacity, COUNT(p.id) AS allocated
     FROM buses b
     LEFT JOIN pilgrims p ON p.bus_number = b.number AND p.company_id = b.company_id
     WHERE b.company_id = $1
     GROUP BY b.number, b.capacity`,
    [companyId]
  );
  for (const bus of buses) {
    const allocated = Number(bus.allocated);
    if (allocated > bus.capacity) {
      alerts.push({
        id: `bus-overbooked-${bus.number}`,
        severity: 'critical',
        message: `Bus ${bus.number} has ${allocated} pilgrims assigned but only ${bus.capacity} seats.`,
      });
    }
  }

  const hotels = await query<{ name: string; total_rooms: number; allocated_rooms: string }>(
    `SELECT h.name, h.total_rooms,
       COUNT(DISTINCT p.room_number) FILTER (WHERE p.room_number IS NOT NULL) AS allocated_rooms
     FROM hotels h
     LEFT JOIN pilgrims p ON (p.hotel_makkah = h.name OR p.hotel_madinah = h.name) AND p.company_id = h.company_id
     WHERE h.company_id = $1
     GROUP BY h.name, h.total_rooms`,
    [companyId]
  );
  for (const hotel of hotels) {
    const allocated = Number(hotel.allocated_rooms);
    if (allocated > hotel.total_rooms) {
      alerts.push({
        id: `hotel-overbooked-${hotel.name}`,
        severity: 'critical',
        message: `${hotel.name} has ${allocated} rooms assigned but only ${hotel.total_rooms} contracted.`,
      });
    }
  }

  const [{ count, total }] = await query<{ count: string; total: string }>(
    `SELECT COUNT(*) AS count, COALESCE(SUM(payment_total - payment_paid), 0) AS total
     FROM pilgrims_with_paid
     WHERE company_id = $1 AND payment_paid < payment_total`,
    [companyId]
  );
  if (Number(count) > 0) {
    alerts.push({
      id: 'outstanding-balances',
      severity: 'warning',
      message: `${count} pilgrims have outstanding balances totaling SAR ${Number(total).toLocaleString()}.`,
    });
  }

  return alerts;
}
