'use client';

import React, { useState, useCallback } from 'react';
import PaymentHeader from './components/PaymentHeader';
import PaymentMetrics from './components/PaymentMetrics';
import PaymentTable from './components/PaymentTable';
import PaymentHistory from './components/PaymentHistory';
import type { PaymentRow } from './paymentRows';
import type { Pilgrim } from '@/lib/mockData';
import type { CampaignStats, MonthlyCollection } from '@/lib/data/campaign';
import type { RecentPayment } from '@/lib/data/pilgrims';

interface PaymentsClientProps {
  pilgrims: Pilgrim[];
  stats: CampaignStats;
  monthlyCollections: MonthlyCollection[];
  recentPayments: RecentPayment[];
}

export default function PaymentsClient({ pilgrims, stats, monthlyCollections, recentPayments }: PaymentsClientProps) {
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [visibleRows, setVisibleRows] = useState<PaymentRow[]>([]);

  const handleVisibleRowsChange = useCallback((rows: PaymentRow[]) => {
    setVisibleRows(rows);
  }, []);

  return (
    <>
      <PaymentHeader
        stats={stats}
        search={search}
        filterStatus={filterStatus}
        onSearchChange={setSearch}
        onFilterChange={setFilterStatus}
        exportRows={visibleRows}
      />
      <div className="p-6 space-y-6">
        <PaymentMetrics stats={stats} monthlyCollections={monthlyCollections} />
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <div className="xl:col-span-2">
            <PaymentTable pilgrims={pilgrims} search={search} filterStatus={filterStatus} onVisibleRowsChange={handleVisibleRowsChange} />
          </div>
          <div>
            <PaymentHistory transactions={recentPayments} />
          </div>
        </div>
      </div>
    </>
  );
}
