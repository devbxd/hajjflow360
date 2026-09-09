import React from 'react';
import AppLayout from '@/components/AppLayout';
import InvoicingReceiptsClient from './InvoicingReceiptsClient';
import { getRecentPayments } from '@/lib/data/pilgrims';

export const dynamic = 'force-dynamic';

export default async function InvoicingReceiptsPage() {
  const payments = await getRecentPayments(500);
  return (
    <AppLayout>
      <InvoicingReceiptsClient payments={payments} />
    </AppLayout>
  );
}
