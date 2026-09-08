import type { Pilgrim } from '@/lib/mockData';

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

export function buildPaymentRows(pilgrims: Pilgrim[]): PaymentRow[] {
  return pilgrims.map((p) => ({
    id: p.id,
    name: p.name,
    nationality: p.nationality,
    groupLeader: p.groupLeader,
    paymentTotal: p.paymentTotal,
    paymentPaid: p.paymentPaid,
    balance: p.paymentTotal - p.paymentPaid,
    paymentStatus: p.paymentStatus,
  }));
}
