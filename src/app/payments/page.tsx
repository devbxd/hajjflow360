import React from 'react';
import { redirect } from 'next/navigation';
import AppLayout from '@/components/AppLayout';
import { getCurrentUser } from '@/lib/auth/currentUser';
import PaymentsClient from './PaymentsClient';
import { getAllPilgrims, getRecentPayments } from '@/lib/data/pilgrims';
import { getCampaignStats, getMonthlyCollections } from '@/lib/data/campaign';

export const dynamic = 'force-dynamic';

export default async function PaymentsPage() {
  const session = await getCurrentUser();
  if (!session) redirect('/login');

  const [pilgrims, stats, monthlyCollections, recentPayments] = await Promise.all([
    getAllPilgrims(session.companyId),
    getCampaignStats(session.companyId),
    getMonthlyCollections(session.companyId),
    getRecentPayments(session.companyId, 20),
  ]);

  return (
    <AppLayout>
      <PaymentsClient pilgrims={pilgrims} stats={stats} monthlyCollections={monthlyCollections} recentPayments={recentPayments} />
    </AppLayout>
  );
}
