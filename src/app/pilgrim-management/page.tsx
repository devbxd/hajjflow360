import React from 'react';
import { redirect } from 'next/navigation';
import AppLayout from '@/components/AppLayout';
import { getCurrentUser } from '@/lib/auth/currentUser';
import PilgrimManagementHeader from './components/PilgrimManagementHeader';
import PilgrimTable from './components/PilgrimTable';
import { getAllPilgrims } from '@/lib/data/pilgrims';
import { getGroupLeaders } from '@/lib/data/groupLeaders';

export const dynamic = 'force-dynamic';

export default async function PilgrimManagementPage() {
  const session = await getCurrentUser();
  if (!session) redirect('/login');

  const [pilgrims, groupLeaders] = await Promise.all([getAllPilgrims(session.companyId), getGroupLeaders(session.companyId)]);

  return (
    <AppLayout>
      <PilgrimManagementHeader totalPilgrims={pilgrims.length} groupLeaders={groupLeaders} />
      <PilgrimTable initialPilgrims={pilgrims} groupLeaders={groupLeaders} />
    </AppLayout>
  );
}
