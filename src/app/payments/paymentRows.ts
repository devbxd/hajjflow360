import { pilgrims } from '@/lib/mockData';

export interface PaymentRow {
  id: string;
  name: string;
  nationality: string;
  groupLeader: string;
  paymentTotal: number;
  paymentPaid: number;
  balance: number;
  paymentStatus: 'paid' | 'partial' | 'overdue' | 'pending';
}

// Extra synthetic rows layered on top of the 12 real mock pilgrims so the
// payments table has enough rows to demonstrate pagination.
const EXTRA_ROWS: Omit<PaymentRow, 'balance'>[] = [
  { id: 'PIL-013', name: 'Hassan Boudiaf', nationality: 'Algeria', groupLeader: 'Sheikh Tariq Hussain', paymentTotal: 15200, paymentPaid: 4560, paymentStatus: 'overdue' },
  { id: 'PIL-014', name: 'Rania Al-Sayed', nationality: 'Egypt', groupLeader: 'Sheikh Ahmed Al-Rashidi', paymentTotal: 15600, paymentPaid: 4680, paymentStatus: 'overdue' },
  { id: 'PIL-015', name: 'Bilal Osman Farah', nationality: 'Somalia', groupLeader: 'Sheikh Ibrahim Musa', paymentTotal: 13800, paymentPaid: 13800, paymentStatus: 'paid' },
  { id: 'PIL-016', name: 'Tariq Noor Al-Din', nationality: 'Jordan', groupLeader: 'Sheikh Faisal Al-Mutairi', paymentTotal: 16400, paymentPaid: 8200, paymentStatus: 'partial' },
  { id: 'PIL-017', name: 'Layla Al-Mansouri', nationality: 'UAE', groupLeader: 'Sheikh Umar Al-Faruq', paymentTotal: 19800, paymentPaid: 19800, paymentStatus: 'paid' },
  { id: 'PIL-018', name: 'Omar Farouq Diallo', nationality: 'Guinea', groupLeader: 'Sheikh Moussa Diallo', paymentTotal: 12400, paymentPaid: 0, paymentStatus: 'pending' },
  { id: 'PIL-019', name: 'Aisha Bint Umar', nationality: 'Malaysia', groupLeader: 'Sheikh Rizal Hakim', paymentTotal: 14600, paymentPaid: 14600, paymentStatus: 'paid' },
  { id: 'PIL-020', name: 'Mustafa Al-Kurdi', nationality: 'Iraq', groupLeader: 'Sheikh Noor Islam', paymentTotal: 13200, paymentPaid: 6600, paymentStatus: 'partial' },
];

export function buildPaymentRows(): PaymentRow[] {
  const fromPilgrims: PaymentRow[] = pilgrims.map((p) => ({
    id: p.id,
    name: p.name,
    nationality: p.nationality,
    groupLeader: p.groupLeader,
    paymentTotal: p.paymentTotal,
    paymentPaid: p.paymentPaid,
    balance: p.paymentTotal - p.paymentPaid,
    paymentStatus: p.paymentStatus,
  }));

  const fromExtra: PaymentRow[] = EXTRA_ROWS.map((r) => ({ ...r, balance: r.paymentTotal - r.paymentPaid }));

  return [...fromPilgrims, ...fromExtra];
}
