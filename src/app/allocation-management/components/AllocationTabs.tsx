'use client';

import React, { useState } from 'react';
import { Bus, Building2, Plane } from 'lucide-react';
import dynamic from 'next/dynamic';
import Icon from '@/components/ui/AppIcon';


const BusSeatingTab = dynamic(() => import('./BusSeatingTab'), { ssr: false });
const HotelRoomsTab = dynamic(() => import('./HotelRoomsTab'), { ssr: false });
const FlightManifestsTab = dynamic(() => import('./FlightManifestsTab'), { ssr: false });

const TABS = [
  { id: 'bus', label: 'Bus Seating', icon: Bus, count: '18 buses' },
  { id: 'hotel', label: 'Hotel Rooms', icon: Building2, count: '12 hotels' },
  { id: 'flight', label: 'Flight Manifests', icon: Plane, count: '6 flights' },
];

export default function AllocationTabs() {
  const [activeTab, setActiveTab] = useState('bus');

  return (
    <div>
      {/* Tab Bar */}
      <div className="flex gap-1 mb-6 bg-muted p-1 rounded-xl w-fit">
        {TABS?.map((tab) => {
          const Icon = tab?.icon;
          return (
            <button
              key={`tab-${tab?.id}`}
              onClick={() => setActiveTab(tab?.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === tab?.id
                  ? 'bg-card text-foreground shadow-sm border border-border'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Icon size={15} />
              {tab?.label}
              <span className={`text-xs ${activeTab === tab?.id ? 'text-muted-foreground' : 'text-muted-foreground/60'}`}>
                {tab?.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      <div className="fade-in">
        {activeTab === 'bus' && <BusSeatingTab />}
        {activeTab === 'hotel' && <HotelRoomsTab />}
        {activeTab === 'flight' && <FlightManifestsTab />}
      </div>
    </div>
  );
}