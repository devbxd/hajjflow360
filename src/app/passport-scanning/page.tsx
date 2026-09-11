import React from 'react';
import { redirect } from 'next/navigation';
import AppLayout from '@/components/AppLayout';
import { getCurrentUser } from '@/lib/auth/currentUser';
import PassportScanningClient from './PassportScanningClient';
import { getGroupLeaders } from '@/lib/data/groupLeaders';

export const dynamic = 'force-dynamic';

export default async function PassportScanningPage() {
  const session = await getCurrentUser();
  if (!session) redirect('/login');

  const groupLeaders = await getGroupLeaders(session.companyId);
  return (
    <AppLayout>
      <PassportScanningClient groupLeaders={groupLeaders} />
    </AppLayout>
  );
}
