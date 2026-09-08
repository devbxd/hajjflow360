import React from 'react';
import { notFound } from 'next/navigation';
import AppLayout from '@/components/AppLayout';
import { pilgrims } from '@/lib/mockData';
import PilgrimProfileHeader from './components/PilgrimProfileHeader';
import PilgrimInfoPanels from './components/PilgrimInfoPanels';
import PilgrimSidebar from './components/PilgrimSidebar';

export default async function PilgrimProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const pilgrim = pilgrims.find((p) => p.id === id);

  if (!pilgrim) {
    notFound();
  }

  return (
    <AppLayout>
      <PilgrimProfileHeader pilgrim={pilgrim} />
      <div className="grid grid-cols-1 xl:grid-cols-3 2xl:grid-cols-3 gap-6 mt-6">
        <div className="xl:col-span-2 space-y-6">
          <PilgrimInfoPanels pilgrim={pilgrim} />
        </div>
        <div className="xl:col-span-1 space-y-6">
          <PilgrimSidebar pilgrim={pilgrim} />
        </div>
      </div>
    </AppLayout>
  );
}
