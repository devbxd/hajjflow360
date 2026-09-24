import type { Pilgrim } from '@/lib/mockData';
import { getActiveSeason } from '@/lib/data/seasons';
import { getCampaignStats, computeAtRisk, getMonthlyCollections } from '@/lib/data/campaign';
import { getOperationsAlerts } from '@/lib/data/alerts';
import { getAllPilgrims, getPilgrimById, getPaymentsForPilgrim, getRecentPayments } from '@/lib/data/pilgrims';
import { getGroupLeaders } from '@/lib/data/groupLeaders';
import { getHotels, getBuses, getFlights } from '@/lib/data/logistics';
import { getInvoices } from '@/lib/data/invoices';
import { getTotalExpenses, getMonthlyExpenses, getExpenses } from '@/lib/data/finance';
import { getRecentActivity } from '@/lib/data/activity';

// Read-only tools the Manasik AI assistant can call. Every executor is scoped to
// the signed-in company, so the model can never see another agency's data, and
// none of them write anything.

const STRING = { type: 'STRING' };

// Tools without arguments omit `parameters`: Gemini rejects an OBJECT with no properties.
export const TOOL_DECLARATIONS = [
  {
    name: 'get_campaign_overview',
    description:
      'Headline numbers for the active season: pilgrim totals, visa/passport/payment status counts, revenue collected vs expected, rooms/buses/flights allocation, departure and return dates, plus current operations alerts.',
  },
  {
    name: 'find_pilgrims',
    description:
      'Search and filter pilgrims. Returns the total number of matches and up to `limit` pilgrims with their key details (status, group, flight, hotel, room, bus, payment balance, phone). Use for counts and lists such as "who has not paid", "pilgrims in group G2", "rejected visas".',
    parameters: {
      type: 'OBJECT',
      properties: {
        search: { ...STRING, description: 'Part of a name (Latin or Arabic), pilgrim ID or passport number.' },
        visa_status: { ...STRING, enum: ['approved', 'pending', 'rejected', 'processing', 'not-started'] },
        passport_status: { ...STRING, enum: ['scanned', 'verified', 'missing', 'pending'] },
        payment_status: { ...STRING, enum: ['paid', 'partial', 'overdue', 'pending'] },
        flight_status: { ...STRING, enum: ['confirmed', 'pending', 'not-assigned'] },
        attendance_status: { ...STRING, enum: ['present', 'absent', 'not-checked'] },
        gender: { ...STRING, enum: ['M', 'F'] },
        group_id: { ...STRING, description: 'Group ID, e.g. "GRP-009".' },
        nationality: STRING,
        hotel: { ...STRING, description: 'Part of a Makkah or Madinah hotel name.' },
        flight_number: STRING,
        bus_number: { type: 'INTEGER' },
        has_room: { type: 'BOOLEAN', description: 'true = has a hotel room assigned, false = no room yet.' },
        has_bus_seat: { type: 'BOOLEAN', description: 'true = has a bus seat, false = no seat yet.' },
        limit: { type: 'INTEGER', description: 'Max pilgrims to return (default 10, max 50). The total count is always returned.' },
      },
    },
  },
  {
    name: 'get_pilgrim_details',
    description: 'Full profile of one pilgrim, including passport, visa, logistics, emergency contact and payment history.',
    parameters: { type: 'OBJECT', properties: { pilgrim_id: STRING }, required: ['pilgrim_id'] },
  },
  {
    name: 'get_at_risk_pilgrims',
    description: 'Pilgrims with blocking problems before departure (missing passport, rejected visa, unpaid balance, etc.), ranked by severity.',
  },
  {
    name: 'get_groups',
    description: 'All groups with their group leader name and phone and per-group progress counts.',
  },
  {
    name: 'get_logistics',
    description: 'Hotels (rooms and occupancy), buses (capacity, driver, route) or flights (date, time, passengers).',
    parameters: {
      type: 'OBJECT',
      properties: { kind: { ...STRING, enum: ['hotels', 'buses', 'flights'] } },
      required: ['kind'],
    },
  },
  {
    name: 'get_finance',
    description:
      'Finance summary: invoices (unpaid and outstanding amounts), expenses by category, monthly collections and expenses, and the most recent payments.',
  },
  {
    name: 'get_recent_activity',
    description: 'The latest actions recorded in the system (registrations, payments, scans, check-ins...).',
    parameters: { type: 'OBJECT', properties: { limit: { type: 'INTEGER' } } },
  },
];

function compactPilgrim(p: Pilgrim) {
  return {
    id: p.id,
    name: p.name,
    nameAr: p.nameAr,
    gender: p.gender,
    age: p.age,
    nationality: p.nationality,
    group: p.groupId,
    groupLeader: p.groupLeader,
    passport: p.passportStatus,
    passportExpiry: p.passportExpiry,
    visa: p.visaStatus,
    flight: p.flightNumber ? `${p.flightNumber} ${p.flightDate ?? ''}`.trim() : null,
    flightStatus: p.flightStatus,
    hotelMakkah: p.hotelMakkah ?? null,
    hotelMadinah: p.hotelMadinah ?? null,
    room: p.roomNumber ?? null,
    bus: p.busNumber ?? null,
    seat: p.seatNumber ?? null,
    paymentStatus: p.paymentStatus,
    totalSar: p.paymentTotal,
    paidSar: p.paymentPaid,
    balanceSar: p.paymentTotal - p.paymentPaid,
    phone: p.phone,
    attendance: p.attendanceStatus,
  };
}

type Args = Record<string, unknown>;

const str = (v: unknown) => (typeof v === 'string' && v.trim() ? v.trim().toLowerCase() : null);

async function findPilgrims(args: Args, companyId: string) {
  const all = await getAllPilgrims(companyId);
  const search = str(args.search);
  const nationality = str(args.nationality);
  const hotel = str(args.hotel);
  const group = str(args.group_id);
  const flight = str(args.flight_number);
  const matches = all.filter((p) => {
    if (search && ![p.name, p.nameAr, p.id, p.passportNumber].some((f) => f?.toLowerCase().includes(search))) return false;
    if (args.visa_status && p.visaStatus !== args.visa_status) return false;
    if (args.passport_status && p.passportStatus !== args.passport_status) return false;
    if (args.payment_status && p.paymentStatus !== args.payment_status) return false;
    if (args.flight_status && p.flightStatus !== args.flight_status) return false;
    if (args.attendance_status && p.attendanceStatus !== args.attendance_status) return false;
    if (args.gender && p.gender !== args.gender) return false;
    if (group && p.groupId.toLowerCase() !== group) return false;
    if (nationality && !p.nationality.toLowerCase().includes(nationality)) return false;
    if (hotel && ![p.hotelMakkah, p.hotelMadinah].some((h) => h?.toLowerCase().includes(hotel))) return false;
    if (flight && p.flightNumber?.toLowerCase() !== flight) return false;
    if (typeof args.bus_number === 'number' && p.busNumber !== args.bus_number) return false;
    if (args.has_room === true && !p.roomNumber) return false;
    if (args.has_room === false && p.roomNumber) return false;
    if (args.has_bus_seat === true && !p.seatNumber) return false;
    if (args.has_bus_seat === false && p.seatNumber) return false;
    return true;
  });
  const limit = Math.min(Math.max(Number(args.limit) || 10, 1), 50);
  return {
    totalMatches: matches.length,
    totalPilgrimsInSeason: all.length,
    returned: Math.min(limit, matches.length),
    totalBalanceSarOfMatches: matches.reduce((sum, p) => sum + (p.paymentTotal - p.paymentPaid), 0),
    pilgrims: matches.slice(0, limit).map(compactPilgrim),
  };
}

async function getFinance(companyId: string) {
  const [invoices, totalExpenses, expenses, monthlyCollections, monthlyExpenses, recentPayments] = await Promise.all([
    getInvoices(companyId),
    getTotalExpenses(companyId),
    getExpenses(companyId),
    getMonthlyCollections(companyId),
    getMonthlyExpenses(companyId),
    getRecentPayments(companyId, 10),
  ]);
  const unpaid = invoices.filter((i) => i.status === 'unpaid');
  const byCategory: Record<string, number> = {};
  for (const e of expenses) byCategory[e.category] = (byCategory[e.category] ?? 0) + e.amount;
  return {
    currency: 'SAR',
    invoices: {
      total: invoices.length,
      unpaid: unpaid.length,
      outstandingSar: unpaid.reduce((s, i) => s + (i.amount - i.paidAmount), 0),
      unpaidList: unpaid.slice(0, 20).map((i) => ({
        number: i.invoiceNumber,
        pilgrim: i.pilgrimName,
        amount: i.amount,
        paid: i.paidAmount,
        dueDate: i.dueDate,
      })),
    },
    expenses: { totalSar: totalExpenses, byCategory },
    monthlyCollections,
    monthlyExpenses,
    recentPayments,
  };
}

export async function runTool(name: string, args: Args, companyId: string): Promise<unknown> {
  switch (name) {
    case 'get_campaign_overview': {
      const [season, stats, alerts] = await Promise.all([
        getActiveSeason(companyId),
        getCampaignStats(companyId),
        getOperationsAlerts(companyId),
      ]);
      return { currency: 'SAR', season: { name: season.name, startDate: season.startDate }, stats, alerts };
    }
    case 'find_pilgrims':
      return findPilgrims(args, companyId);
    case 'get_pilgrim_details': {
      const id = String(args.pilgrim_id ?? '');
      const pilgrim = await getPilgrimById(id, companyId);
      if (!pilgrim) return { error: `No pilgrim with ID "${id}". Use find_pilgrims to look up the ID by name.` };
      return { pilgrim, payments: await getPaymentsForPilgrim(id, companyId), currency: 'SAR' };
    }
    case 'get_at_risk_pilgrims': {
      const pilgrims = await getAllPilgrims(companyId);
      const atRisk = computeAtRisk(pilgrims, 12);
      return { total: atRisk.length, pilgrims: atRisk.slice(0, 60) };
    }
    case 'get_groups':
      return { groups: await getGroupLeaders(companyId) };
    case 'get_logistics': {
      if (args.kind === 'hotels') return { hotels: await getHotels(companyId) };
      if (args.kind === 'buses') return { buses: await getBuses(companyId) };
      return { flights: await getFlights(companyId) };
    }
    case 'get_finance':
      return getFinance(companyId);
    case 'get_recent_activity':
      return { activity: await getRecentActivity(companyId, Math.min(Math.max(Number(args.limit) || 15, 1), 50)) };
    default:
      return { error: `Unknown tool "${name}".` };
  }
}
