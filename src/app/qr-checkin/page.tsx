import React from 'react';
import { redirect } from 'next/navigation';
import AppLayout from '@/components/AppLayout';
import { getCurrentUser } from '@/lib/auth/currentUser';
import { getAllPilgrims } from '@/lib/data/pilgrims';
import QrCheckinClient from './QrCheckinClient';

export const dynamic = 'force-dynamic';

export default async function QrCheckinPage() {
  const session = await getCurrentUser();
  if (!session) redirect('/login');

  const pilgrims = await getAllPilgrims(session.companyId);

  return (
    <AppLayout>
      <QrCheckinClient pilgrims={pilgrims} />
    </AppLayout>
  );
}
