import { query } from '@/lib/db';
import type { Pilgrim } from '@/lib/mockData';

export interface CampaignStats {
  totalPilgrims: number;
  capacity: number;
  visaApproved: number;
  visaPending: number;
  visaProcessing: number;
  visaRejected: number;
  passportVerified: number;
  passportScanned: number;
  passportMissing: number;
  passportPending: number;
  paymentFull: number;
  paymentPartial: number;
  paymentOverdue: number;
  paymentPending: number;
  totalRevenue: number;
  collectedRevenue: number;
  busesTotal: number;
  busesAllocated: number;
  hotelsTotal: number;
  flightsTotal: number;
  roomsAllocated: number;
  roomsTotal: number;
  groupsTotal: number;
  nationalitiesCount: number;
  atRiskCount: number;
  departureDate: string;
  returnDate: string;
}

// Campaign-wide settings that aren't derived from pilgrim rows. There's no
// dedicated "campaign settings" table yet — these stay as constants until
// that's built.
const CAMPAIGN_CAPACITY = 900;
const DEPARTURE_DATE = '15/09/2027';
const RETURN_DATE = '22/10/2027';

export async function getCampaignStats(): Promise<CampaignStats> {
  const [pilgrimStats] = await query<{
    total: string; visa_approved: string; visa_pending: string; visa_processing: string; visa_rejected: string;
    passport_verified: string; passport_scanned: string; passport_missing: string; passport_pending: string;
    payment_full: string; payment_partial: string; payment_overdue: string; payment_pending: string;
    total_revenue: string; collected_revenue: string; rooms_allocated: string; at_risk: string;
  }>(`
    SELECT
      COUNT(*) AS total,
      COUNT(*) FILTER (WHERE visa_status = 'approved') AS visa_approved,
      COUNT(*) FILTER (WHERE visa_status = 'pending') AS visa_pending,
      COUNT(*) FILTER (WHERE visa_status = 'processing') AS visa_processing,
      COUNT(*) FILTER (WHERE visa_status = 'rejected') AS visa_rejected,
      COUNT(*) FILTER (WHERE passport_status = 'verified') AS passport_verified,
      COUNT(*) FILTER (WHERE passport_status = 'scanned') AS passport_scanned,
      COUNT(*) FILTER (WHERE passport_status = 'missing') AS passport_missing,
      COUNT(*) FILTER (WHERE passport_status = 'pending') AS passport_pending,
      COUNT(*) FILTER (WHERE payment_status = 'paid') AS payment_full,
      COUNT(*) FILTER (WHERE payment_status = 'partial') AS payment_partial,
      COUNT(*) FILTER (WHERE payment_status = 'overdue') AS payment_overdue,
      COUNT(*) FILTER (WHERE payment_status = 'pending') AS payment_pending,
      COALESCE(SUM(payment_total), 0) AS total_revenue,
      COALESCE(SUM(payment_paid), 0) AS collected_revenue,
      COUNT(DISTINCT room_number) FILTER (WHERE room_number IS NOT NULL) AS rooms_allocated,
      COUNT(*) FILTER (
        WHERE passport_status = 'missing'
           OR visa_status IN ('rejected', 'not-started')
           OR payment_status = 'overdue'
           OR bus_number IS NULL
           OR room_number IS NULL
      ) AS at_risk
    FROM pilgrims_with_paid
  `);

  const [{ buses_total, buses_allocated }] = await query<{ buses_total: string; buses_allocated: string }>(`
    SELECT COUNT(DISTINCT b.id) AS buses_total, COUNT(DISTINCT b.id) FILTER (WHERE p.id IS NOT NULL) AS buses_allocated
    FROM buses b LEFT JOIN pilgrims p ON p.bus_number = b.number
  `);
  const [{ hotels_total, rooms_total }] = await query<{ hotels_total: string; rooms_total: string }>(
    'SELECT COUNT(*) AS hotels_total, COALESCE(SUM(total_rooms), 0) AS rooms_total FROM hotels'
  );
  const [{ flights_total }] = await query<{ flights_total: string }>('SELECT COUNT(*) AS flights_total FROM flights');
  const [{ groups_total }] = await query<{ groups_total: string }>('SELECT COUNT(*) AS groups_total FROM group_leaders');
  const [{ nationalities_count }] = await query<{ nationalities_count: string }>(
    'SELECT COUNT(DISTINCT nationality) AS nationalities_count FROM pilgrims'
  );

  return {
    totalPilgrims: Number(pilgrimStats.total),
    capacity: CAMPAIGN_CAPACITY,
    visaApproved: Number(pilgrimStats.visa_approved),
    visaPending: Number(pilgrimStats.visa_pending),
    visaProcessing: Number(pilgrimStats.visa_processing),
    visaRejected: Number(pilgrimStats.visa_rejected),
    passportVerified: Number(pilgrimStats.passport_verified),
    passportScanned: Number(pilgrimStats.passport_scanned),
    passportMissing: Number(pilgrimStats.passport_missing),
    passportPending: Number(pilgrimStats.passport_pending),
    paymentFull: Number(pilgrimStats.payment_full),
    paymentPartial: Number(pilgrimStats.payment_partial),
    paymentOverdue: Number(pilgrimStats.payment_overdue),
    paymentPending: Number(pilgrimStats.payment_pending),
    totalRevenue: Number(pilgrimStats.total_revenue),
    collectedRevenue: Number(pilgrimStats.collected_revenue),
    busesTotal: Number(buses_total),
    busesAllocated: Number(buses_allocated),
    hotelsTotal: Number(hotels_total),
    flightsTotal: Number(flights_total),
    roomsAllocated: Number(pilgrimStats.rooms_allocated),
    roomsTotal: Number(rooms_total),
    groupsTotal: Number(groups_total),
    nationalitiesCount: Number(nationalities_count),
    atRiskCount: Number(pilgrimStats.at_risk),
    departureDate: DEPARTURE_DATE,
    returnDate: RETURN_DATE,
  };
}

export interface RegistrationMonth {
  month: string;
  count: number;
}

export async function getRegistrationTimeline(): Promise<RegistrationMonth[]> {
  const rows = await query<{ month_start: string; month: string; count: string }>(`
    SELECT
      date_trunc('month', registered_at::date) AS month_start,
      to_char(date_trunc('month', registered_at::date), 'Mon YY') AS month,
      SUM(COUNT(*)) OVER (ORDER BY date_trunc('month', registered_at::date)) AS count
    FROM pilgrims
    GROUP BY date_trunc('month', registered_at::date)
    ORDER BY month_start
  `);
  return rows.map((r) => ({ month: r.month, count: Number(r.count) }));
}

export interface MonthlyCollection {
  month: string;
  collected: number;
}

export async function getMonthlyCollections(): Promise<MonthlyCollection[]> {
  const rows = await query<{ month_start: string; month: string; collected: string }>(`
    SELECT
      date_trunc('month', paid_on) AS month_start,
      to_char(date_trunc('month', paid_on), 'Mon YY') AS month,
      SUM(amount) AS collected
    FROM payments
    WHERE status = 'cleared'
    GROUP BY date_trunc('month', paid_on)
    ORDER BY month_start
  `);
  return rows.map((r) => ({ month: r.month, collected: Number(r.collected) }));
}

export interface AtRiskEntry {
  id: string;
  name: string;
  issue: string;
  severity: 'critical' | 'high' | 'medium';
  daysToDepart: number;
}

// Computed from real pilgrim state instead of a hand-maintained list, so it
// can never point at a pilgrim that doesn't exist or go stale.
export function computeAtRisk(pilgrims: Pilgrim[], daysToDepart: number): AtRiskEntry[] {
  const entries: AtRiskEntry[] = [];

  for (const p of pilgrims) {
    const issues: string[] = [];
    let severity: AtRiskEntry['severity'] = 'medium';

    if (p.passportStatus === 'missing' && p.visaStatus === 'not-started') {
      issues.push('Passport missing + Visa not started');
      severity = 'critical';
    } else if (p.visaStatus === 'rejected') {
      issues.push('Visa rejected — appeal required');
      severity = 'critical';
    } else {
      if (p.passportStatus === 'missing') {
        issues.push('Passport missing');
        severity = 'high';
      } else if (p.passportStatus === 'scanned') {
        issues.push('Passport scanned but not verified');
      }
      if (p.paymentStatus === 'overdue') {
        const balance = p.paymentTotal - p.paymentPaid;
        issues.push(`Payment overdue — balance SAR ${balance.toLocaleString()}`);
        severity = severity === 'high' ? 'high' : 'high';
      }
      if (!p.busNumber || !p.roomNumber) {
        issues.push('No bus/room allocation assigned');
      }
    }

    if (issues.length > 0) {
      entries.push({ id: p.id, name: p.name, issue: issues.join(' · '), severity, daysToDepart });
    }
  }

  return entries.sort((a, b) => {
    const order = { critical: 0, high: 1, medium: 2 };
    return order[a.severity] - order[b.severity];
  });
}
