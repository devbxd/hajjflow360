import React from 'react';
import { redirect } from 'next/navigation';
import AppLayout from '@/components/AppLayout';
import { getCurrentUser } from '@/lib/auth/currentUser';
import PilgrimRegistryClient from './PilgrimRegistryClient';
import { getAllPilgrims } from '@/lib/data/pilgrims';

export const dynamic = 'force-dynamic';

export default async function PilgrimRegistryPage() {
  const session = await getCurrentUser();
  if (!session) redirect('/login');

  const pilgrims = await getAllPilgrims(session.companyId);
  return (
    <AppLayout>
      <PilgrimRegistryClient pilgrims={pilgrims} />
    </AppLayout>
  );
}
