import React from 'react';
import AppLayout from '@/components/AppLayout';
import PilgrimManagementHeader from './components/PilgrimManagementHeader';
import PilgrimTable from './components/PilgrimTable';
import { getAllPilgrims } from '@/lib/data/pilgrims';

export const dynamic = 'force-dynamic';

export default async function PilgrimManagementPage() {
  const pilgrims = await getAllPilgrims();

  return (
    <AppLayout>
      <PilgrimManagementHeader />
      <PilgrimTable initialPilgrims={pilgrims} />
    </AppLayout>
  );
}
