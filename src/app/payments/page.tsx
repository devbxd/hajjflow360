'use client';

import React, { useState, useCallback } from 'react';
import AppLayout from '@/components/AppLayout';
import PaymentHeader from './components/PaymentHeader';
import PaymentMetrics from './components/PaymentMetrics';
import PaymentTable from './components/PaymentTable';
import PaymentHistory from './components/PaymentHistory';
import type { PaymentRow } from './paymentRows';

export default function PaymentsPage() {
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [visibleRows, setVisibleRows] = useState<PaymentRow[]>([]);

  const handleVisibleRowsChange = useCallback((rows: PaymentRow[]) => {
    setVisibleRows(rows);
  }, []);

  return (
    <AppLayout>
      <PaymentHeader
        search={search}
        filterStatus={filterStatus}
        onSearchChange={setSearch}
        onFilterChange={setFilterStatus}
        exportRows={visibleRows}
      />
      <div className="p-6 space-y-6">
        <PaymentMetrics />
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <div className="xl:col-span-2">
            <PaymentTable search={search} filterStatus={filterStatus} onVisibleRowsChange={handleVisibleRowsChange} />
          </div>
          <div>
            <PaymentHistory />
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
