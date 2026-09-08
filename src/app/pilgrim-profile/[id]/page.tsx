import React from 'react';
import { notFound } from 'next/navigation';
import AppLayout from '@/components/AppLayout';
import { getPilgrimById, getPaymentsForPilgrim } from '@/lib/data/pilgrims';
import PilgrimProfileHeader from './components/PilgrimProfileHeader';
import PilgrimInfoPanels from './components/PilgrimInfoPanels';
import PilgrimSidebar from './components/PilgrimSidebar';

export default async function PilgrimProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const pilgrim = await getPilgrimById(id);

  if (!pilgrim) {
    notFound();
  }

  const paymentHistory = await getPaymentsForPilgrim(id);

  return (
    <AppLayout>
      <PilgrimProfileHeader pilgrim={pilgrim} />
      <div className="grid grid-cols-1 xl:grid-cols-3 2xl:grid-cols-3 gap-6 mt-6">
        <div className="xl:col-span-2 space-y-6">
          <PilgrimInfoPanels pilgrim={pilgrim} paymentHistory={paymentHistory} />
        </div>
        <div className="xl:col-span-1 space-y-6">
          <PilgrimSidebar pilgrim={pilgrim} />
        </div>
      </div>
    </AppLayout>
  );
}
