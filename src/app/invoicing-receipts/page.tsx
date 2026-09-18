import React from 'react';
import { redirect } from 'next/navigation';
import AppLayout from '@/components/AppLayout';
import { getCurrentUser } from '@/lib/auth/currentUser';
import InvoicingReceiptsClient from './InvoicingReceiptsClient';
import { getRecentPayments, getAllPilgrims } from '@/lib/data/pilgrims';
import { getInvoices } from '@/lib/data/invoices';

export const dynamic = 'force-dynamic';

export default async function InvoicingReceiptsPage() {
  const session = await getCurrentUser();
  if (!session) redirect('/login');

  const [payments, invoices, pilgrims] = await Promise.all([
    getRecentPayments(session.companyId, 500),
    getInvoices(session.companyId),
    getAllPilgrims(session.companyId),
  ]);

  return (
    <AppLayout>
      <InvoicingReceiptsClient payments={payments} initialInvoices={invoices} pilgrims={pilgrims.map((p) => ({ id: p.id, name: p.name }))} />
    </AppLayout>
  );
}
