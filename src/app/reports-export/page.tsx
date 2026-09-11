import React from 'react';
import { redirect } from 'next/navigation';
import AppLayout from '@/components/AppLayout';
import { getCurrentUser } from '@/lib/auth/currentUser';
import ReportsExportClient from './ReportsExportClient';
import { getAllPilgrims, getRecentPayments } from '@/lib/data/pilgrims';
import { getCampaignStats } from '@/lib/data/campaign';
import { getExpenses } from '@/lib/data/finance';

export const dynamic = 'force-dynamic';

export default async function ReportsExportPage() {
  const session = await getCurrentUser();
  if (!session) redirect('/login');

  const [pilgrims, payments, expenses, stats] = await Promise.all([
    getAllPilgrims(session.companyId),
    getRecentPayments(session.companyId, 1000),
    getExpenses(session.companyId),
    getCampaignStats(session.companyId),
  ]);

  return (
    <AppLayout>
      <ReportsExportClient pilgrims={pilgrims} payments={payments} expenses={expenses} stats={stats} />
    </AppLayout>
  );
}
