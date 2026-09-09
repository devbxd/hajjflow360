import React from 'react';
import AppLayout from '@/components/AppLayout';
import RevenueExpensesClient from './RevenueExpensesClient';
import { getCampaignStats, getMonthlyCollections } from '@/lib/data/campaign';
import { getExpenses, getMonthlyExpenses } from '@/lib/data/finance';

export const dynamic = 'force-dynamic';

export default async function RevenueExpensesPage() {
  const [stats, monthlyCollections, expenses, monthlyExpenses] = await Promise.all([
    getCampaignStats(),
    getMonthlyCollections(),
    getExpenses(),
    getMonthlyExpenses(),
  ]);

  return (
    <AppLayout>
      <RevenueExpensesClient stats={stats} monthlyCollections={monthlyCollections} initialExpenses={expenses} monthlyExpenses={monthlyExpenses} />
    </AppLayout>
  );
}
