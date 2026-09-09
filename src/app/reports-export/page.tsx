import React from 'react';
import AppLayout from '@/components/AppLayout';
import ReportsExportClient from './ReportsExportClient';
import { getAllPilgrims, getRecentPayments } from '@/lib/data/pilgrims';
import { getCampaignStats } from '@/lib/data/campaign';
import { getExpenses } from '@/lib/data/finance';

export const dynamic = 'force-dynamic';

export default async function ReportsExportPage() {
  const [pilgrims, payments, expenses, stats] = await Promise.all([
    getAllPilgrims(),
    getRecentPayments(1000),
    getExpenses(),
    getCampaignStats(),
  ]);

  return (
    <AppLayout>
      <ReportsExportClient pilgrims={pilgrims} payments={payments} expenses={expenses} stats={stats} />
    </AppLayout>
  );
}
