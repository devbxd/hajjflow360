import React from 'react';
import AppLayout from '@/components/AppLayout';
import PilgrimProfileHeader from './components/PilgrimProfileHeader';
import PilgrimInfoPanels from './components/PilgrimInfoPanels';
import PilgrimSidebar from './components/PilgrimSidebar';

export default function PilgrimProfilePage() {
  return (
    <AppLayout>
      <PilgrimProfileHeader />
      <div className="grid grid-cols-1 xl:grid-cols-3 2xl:grid-cols-3 gap-6 mt-6">
        <div className="xl:col-span-2 space-y-6">
          <PilgrimInfoPanels />
        </div>
        <div className="xl:col-span-1 space-y-6">
          <PilgrimSidebar />
        </div>
      </div>
    </AppLayout>
  );
}