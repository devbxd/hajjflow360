import React, { Suspense } from 'react';
import { redirect } from 'next/navigation';
import AppLayout from '@/components/AppLayout';
import { getCurrentUser } from '@/lib/auth/currentUser';
import AllocationHeader from './components/AllocationHeader';
import AllocationTabs from './components/AllocationTabs';
import { getAllPilgrims } from '@/lib/data/pilgrims';
import { getBuses, getHotels, getFlights } from '@/lib/data/logistics';

export const dynamic = 'force-dynamic';

export default async function AllocationManagementPage() {
  const session = await getCurrentUser();
  if (!session) redirect('/login');

  const [pilgrims, buses, hotels, flights] = await Promise.all([
    getAllPilgrims(session.companyId),
    getBuses(session.companyId),
    getHotels(session.companyId),
    getFlights(session.companyId),
  ]);

  const unallocatedCount = pilgrims.filter((p) => !p.busNumber || !p.roomNumber).length;

  return (
    <AppLayout>
      <AllocationHeader unallocatedCount={unallocatedCount} />
      <Suspense fallback={null}>
        <AllocationTabs buses={buses} hotels={hotels} flights={flights} pilgrims={pilgrims} />
      </Suspense>
    </AppLayout>
  );
}
