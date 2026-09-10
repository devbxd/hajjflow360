import React from 'react';
import { notFound } from 'next/navigation';
import AppLayout from '@/components/AppLayout';
import { getPilgrimById, getPaymentsForPilgrim } from '@/lib/data/pilgrims';
import { getGroupLeaders } from '@/lib/data/groupLeaders';
import { getHotels } from '@/lib/data/logistics';
import { getActivityForPilgrim } from '@/lib/data/activity';
import PilgrimProfileHeader from './components/PilgrimProfileHeader';
import PilgrimInfoPanels from './components/PilgrimInfoPanels';
import PilgrimSidebar from './components/PilgrimSidebar';

export default async function PilgrimProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const pilgrim = await getPilgrimById(id);

  if (!pilgrim) {
    notFound();
  }

  const [paymentHistory, groupLeaders, hotels, activity] = await Promise.all([
    getPaymentsForPilgrim(id),
    getGroupLeaders(),
    getHotels(),
    getActivityForPilgrim(id),
  ]);

  const makkahHotel = hotels.find((h) => h.name === pilgrim.hotelMakkah);
  const madinahHotel = hotels.find((h) => h.name === pilgrim.hotelMadinah);

  return (
    <AppLayout>
      <PilgrimProfileHeader pilgrim={pilgrim} groupLeaders={groupLeaders} />
      <div className="grid grid-cols-1 xl:grid-cols-3 2xl:grid-cols-3 gap-6 mt-6">
        <div className="xl:col-span-2 space-y-6">
          <PilgrimInfoPanels
            pilgrim={pilgrim}
            paymentHistory={paymentHistory}
            makkahHotel={makkahHotel ? { checkIn: makkahHotel.checkIn, checkOut: makkahHotel.checkOut } : null}
            madinahHotel={madinahHotel ? { checkIn: madinahHotel.checkIn, checkOut: madinahHotel.checkOut } : null}
          />
        </div>
        <div className="xl:col-span-1 space-y-6">
          <PilgrimSidebar pilgrim={pilgrim} activity={activity} />
        </div>
      </div>
    </AppLayout>
  );
}
