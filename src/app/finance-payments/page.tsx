import React from 'react';
import { redirect } from 'next/navigation';
import AppLayout from '@/components/AppLayout';
import { getCurrentUser } from '@/lib/auth/currentUser';
import FinancePaymentsClient from './FinancePaymentsClient';
import { getAllPilgrims, getRecentPayments } from '@/lib/data/pilgrims';
import { getInvoices } from '@/lib/data/invoices';

export const dynamic = 'force-dynamic';

export default async function FinancePaymentsPage() {
  const session = await getCurrentUser();
  if (!session) redirect('/login');

  const [pilgrims, payments, invoices] = await Promise.all([
    getAllPilgrims(session.companyId),
    getRecentPayments(session.companyId, 200),
    getInvoices(session.companyId),
  ]);

  return (
    <AppLayout>
      <FinancePaymentsClient
        pilgrims={pilgrims.map((p) => ({
          id: p.id,
          name: p.name,
          paymentTotal: p.paymentTotal,
          paymentPaid: p.paymentPaid,
          paymentStatus: p.paymentStatus,
        }))}
        initialPayments={payments}
        invoices={invoices
          .filter((i) => i.status === 'unpaid')
          .map((i) => ({ id: i.id, invoiceNumber: i.invoiceNumber, pilgrimId: i.pilgrimId, amount: i.amount, paidAmount: i.paidAmount }))}
      />
    </AppLayout>
  );
}
