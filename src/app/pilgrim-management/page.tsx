import React from 'react';
import AppLayout from '@/components/AppLayout';
import PilgrimManagementHeader from './components/PilgrimManagementHeader';
import PilgrimTable from './components/PilgrimTable';
import { getAllPilgrims } from '@/lib/data/pilgrims';
import { getGroupLeaders } from '@/lib/data/groupLeaders';

export const dynamic = 'force-dynamic';

export default async function PilgrimManagementPage() {
  const [pilgrims, groupLeaders] = await Promise.all([getAllPilgrims(), getGroupLeaders()]);

  return (
    <AppLayout>
      <PilgrimManagementHeader totalPilgrims={pilgrims.length} groupLeaders={groupLeaders} />
      <PilgrimTable initialPilgrims={pilgrims} />
    </AppLayout>
  );
}
