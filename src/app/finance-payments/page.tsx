import React from 'react';
import { redirect } from 'next/navigation';
import AppLayout from '@/components/AppLayout';
import { getCurrentUser } from '@/lib/auth/currentUser';
import FinancePaymentsClient from './FinancePaymentsClient';
import { getAllPilgrims, getRecentPayments } from '@/lib/data/pilgrims';

export const dynamic = 'force-dynamic';

export default async function FinancePaymentsPage() {
  const session = await getCurrentUser();
  if (!session) redirect('/login');

  const [pilgrims, payments] = await Promise.all([
    getAllPilgrims(session.companyId),
    getRecentPayments(session.companyId, 200),
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
      />
    </AppLayout>
  );
}
