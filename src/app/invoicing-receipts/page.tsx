import React from 'react';
import { redirect } from 'next/navigation';
import AppLayout from '@/components/AppLayout';
import { getCurrentUser } from '@/lib/auth/currentUser';
import InvoicingReceiptsClient from './InvoicingReceiptsClient';
import { getRecentPayments } from '@/lib/data/pilgrims';

export const dynamic = 'force-dynamic';

export default async function InvoicingReceiptsPage() {
  const session = await getCurrentUser();
  if (!session) redirect('/login');

  const payments = await getRecentPayments(session.companyId, 500);
  return (
    <AppLayout>
      <InvoicingReceiptsClient payments={payments} />
    </AppLayout>
  );
}
