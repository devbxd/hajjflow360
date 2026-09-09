import React from 'react';
import AppLayout from '@/components/AppLayout';
import PassportScanningClient from './PassportScanningClient';
import { getGroupLeaders } from '@/lib/data/groupLeaders';

export const dynamic = 'force-dynamic';

export default async function PassportScanningPage() {
  const groupLeaders = await getGroupLeaders();
  return (
    <AppLayout>
      <PassportScanningClient groupLeaders={groupLeaders} />
    </AppLayout>
  );
}
