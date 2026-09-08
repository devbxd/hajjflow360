import React from 'react';
import AppLayout from '@/components/AppLayout';
import PaymentsClient from './PaymentsClient';
import { getAllPilgrims, getRecentPayments } from '@/lib/data/pilgrims';
import { getCampaignStats, getMonthlyCollections } from '@/lib/data/campaign';

export const dynamic = 'force-dynamic';

export default async function PaymentsPage() {
  const [pilgrims, stats, monthlyCollections, recentPayments] = await Promise.all([
    getAllPilgrims(),
    getCampaignStats(),
    getMonthlyCollections(),
    getRecentPayments(20),
  ]);

  return (
    <AppLayout>
      <PaymentsClient pilgrims={pilgrims} stats={stats} monthlyCollections={monthlyCollections} recentPayments={recentPayments} />
    </AppLayout>
  );
}
