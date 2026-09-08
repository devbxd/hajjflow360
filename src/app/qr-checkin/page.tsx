import React from 'react';
import AppLayout from '@/components/AppLayout';
import { getAllPilgrims } from '@/lib/data/pilgrims';
import QrCheckinClient from './QrCheckinClient';

export const dynamic = 'force-dynamic';

export default async function QrCheckinPage() {
  const pilgrims = await getAllPilgrims();

  return (
    <AppLayout>
      <QrCheckinClient pilgrims={pilgrims} />
    </AppLayout>
  );
}
