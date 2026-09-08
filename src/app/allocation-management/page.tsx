import React, { Suspense } from 'react';
import AppLayout from '@/components/AppLayout';
import AllocationHeader from './components/AllocationHeader';
import AllocationTabs from './components/AllocationTabs';

export default function AllocationManagementPage() {
  return (
    <AppLayout>
      <AllocationHeader />
      <Suspense fallback={null}>
        <AllocationTabs />
      </Suspense>
    </AppLayout>
  );
}