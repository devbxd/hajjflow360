import React from 'react';
import AppLayout from '@/components/AppLayout';
import PaymentHeader from './components/PaymentHeader';
import PaymentMetrics from './components/PaymentMetrics';
import PaymentTable from './components/PaymentTable';
import PaymentHistory from './components/PaymentHistory';

export default function PaymentsPage() {
  return (
    <AppLayout>
      <PaymentHeader />
      <div className="p-6 space-y-6">
        <PaymentMetrics />
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <div className="xl:col-span-2">
            <PaymentTable />
          </div>
          <div>
            <PaymentHistory />
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
