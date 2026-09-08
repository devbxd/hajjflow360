'use client';

import React, { useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Bus, Building2, Plane } from 'lucide-react';
import dynamic from 'next/dynamic';
import type { Pilgrim } from '@/lib/mockData';
import type { BusRow, HotelRow, FlightRow } from '@/lib/data/logistics';

const BusSeatingTab = dynamic(() => import('./BusSeatingTab'), { ssr: false });
const HotelRoomsTab = dynamic(() => import('./HotelRoomsTab'), { ssr: false });
const FlightManifestsTab = dynamic(() => import('./FlightManifestsTab'), { ssr: false });

interface AllocationTabsProps {
  buses: BusRow[];
  hotels: HotelRow[];
  flights: FlightRow[];
  pilgrims: Pilgrim[];
}

const VALID_TABS = new Set(['bus', 'hotel', 'flight']);

export default function AllocationTabs({ buses, hotels, flights, pilgrims }: AllocationTabsProps) {
  const searchParams = useSearchParams();
  const initialTab = searchParams.get('tab');
  const [activeTab, setActiveTab] = useState(
    initialTab && VALID_TABS.has(initialTab) ? initialTab : 'bus'
  );

  const TABS = [
    { id: 'bus', label: 'Bus Seating', icon: Bus, count: `${buses.length} buses` },
    { id: 'hotel', label: 'Hotel Rooms', icon: Building2, count: `${hotels.length} hotels` },
    { id: 'flight', label: 'Flight Manifests', icon: Plane, count: `${flights.length} flights` },
  ];

  return (
    <div>
      {/* Tab Bar */}
      <div className="flex gap-1 mb-6 bg-muted p-1 rounded-xl w-fit">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={`tab-${tab.id}`}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === tab.id
                  ? 'bg-card text-foreground shadow-sm border border-border'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Icon size={15} />
              {tab.label}
              <span className={`text-xs ${activeTab === tab.id ? 'text-muted-foreground' : 'text-muted-foreground/60'}`}>
                {tab.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      <div className="fade-in">
        {activeTab === 'bus' && <BusSeatingTab buses={buses} pilgrims={pilgrims} />}
        {activeTab === 'hotel' && <HotelRoomsTab hotels={hotels} pilgrims={pilgrims} />}
        {activeTab === 'flight' && <FlightManifestsTab flights={flights} pilgrims={pilgrims} />}
      </div>
    </div>
  );
}
