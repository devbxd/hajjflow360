import React from 'react';
import { redirect } from 'next/navigation';
import AppLayout from '@/components/AppLayout';
import { getCurrentUser } from '@/lib/auth/currentUser';
import RevenueExpensesClient from './RevenueExpensesClient';
import { getCampaignStats, getMonthlyCollections } from '@/lib/data/campaign';
import { getExpenses, getMonthlyExpenses } from '@/lib/data/finance';

export const dynamic = 'force-dynamic';

export default async function RevenueExpensesPage() {
  const session = await getCurrentUser();
  if (!session) redirect('/login');

  const [stats, monthlyCollections, expenses, monthlyExpenses] = await Promise.all([
    getCampaignStats(session.companyId),
    getMonthlyCollections(session.companyId),
    getExpenses(session.companyId),
    getMonthlyExpenses(session.companyId),
  ]);

  return (
    <AppLayout>
      <RevenueExpensesClient stats={stats} monthlyCollections={monthlyCollections} initialExpenses={expenses} monthlyExpenses={monthlyExpenses} />
    </AppLayout>
  );
}
