import React from 'react';
import AppLayout from '@/components/AppLayout';
import PilgrimRegistryClient from './PilgrimRegistryClient';
import { getAllPilgrims } from '@/lib/data/pilgrims';

export const dynamic = 'force-dynamic';

export default async function PilgrimRegistryPage() {
  const pilgrims = await getAllPilgrims();
  return (
    <AppLayout>
      <PilgrimRegistryClient pilgrims={pilgrims} />
    </AppLayout>
  );
}
