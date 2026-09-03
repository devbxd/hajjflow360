'use client';

import React, { useState } from 'react';
import { hotels } from '@/lib/mockData';
import { Building2, Users, MapPin, Bed } from 'lucide-react';
import StatusBadge from '@/components/ui/StatusBadge';

const roomTypes = [
  { type: 'single', label: 'Single', capacity: 1, color: 'bg-[#EFF6FF] text-[#2563EB]' },
  { type: 'double', label: 'Double', capacity: 2, color: 'bg-secondary text-primary' },
  { type: 'triple', label: 'Triple', capacity: 3, color: 'bg-[#F5F3FF] text-[#7C3AED]' },
  { type: 'quad', label: 'Quad', capacity: 4, color: 'bg-accent/10 text-accent' },
];

export default function HotelRoomsTab() {
  const [selectedHotel, setSelectedHotel] = useState(hotels[0]);
  const [cityFilter, setCityFilter] = useState<'all' | 'Makkah' | 'Madinah'>('all');

  const filteredHotels = hotels.filter((h) => cityFilter === 'all' || h.city === cityFilter);

  const fillPct = Math.round((selectedHotel.allocatedRooms / selectedHotel.totalRooms) * 100);

  // Generate mock room list for selected hotel
  const roomList = Array.from({ length: Math.min(selectedHotel.totalRooms, 20) }, (_, i) => {
    const floor = Math.floor(i / 4) + 1;
    const roomNum = `${floor}${String((i % 4) + 1).padStart(2, '0')}`;
    const typeIdx = i % 4;
    const occupied = i < selectedHotel.allocatedRooms;
    return {
      id: `room-${selectedHotel.id}-${roomNum}`,
      number: roomNum,
      type: roomTypes[typeIdx].type,
      floor,
      occupied,
      pilgrimCount: occupied ? roomTypes[typeIdx].capacity : 0,
    };
  });

  return (
    <div className="grid grid-cols-1 xl:grid-cols-3 2xl:grid-cols-3 gap-6">
      {/* Hotel List */}
      <div className="xl:col-span-1 card-base">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-foreground">Hotels</h3>
          <div className="flex gap-1">
            {(['all', 'Makkah', 'Madinah'] as const).map((city) => (
              <button
                key={`city-${city}`}
                onClick={() => setCityFilter(city)}
                className={`px-2 py-1 rounded text-xs font-medium transition-all ${
                  cityFilter === city
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground hover:bg-input'
                }`}
              >
                {city === 'all' ? 'All' : city}
              </button>
            ))}
          </div>
        </div>
        <div className="space-y-2 max-h-[500px] overflow-y-auto scrollbar-thin pr-1">
          {filteredHotels.map((hotel) => {
            const hFill = Math.round((hotel.allocatedRooms / hotel.totalRooms) * 100);
            const isSelected = selectedHotel.id === hotel.id;
            return (
              <button
                key={`hotel-${hotel.id}`}
                onClick={() => setSelectedHotel(hotel)}
                className={`w-full text-left p-3 rounded-lg border transition-all ${
                  isSelected ? 'bg-secondary border-primary/30' : 'bg-muted/30 border-border hover:bg-muted'
                }`}
              >
                <div className="flex items-start justify-between gap-2 mb-1.5">
                  <div className="min-w-0">
                    <p className={`text-sm font-semibold truncate ${isSelected ? 'text-primary' : 'text-foreground'}`}>
                      {hotel.name}
                    </p>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <MapPin size={10} className="text-muted-foreground flex-shrink-0" />
                      <span className="text-xs text-muted-foreground">{hotel.city}</span>
                      <span className="text-muted-foreground">·</span>
                      <span className="text-xs text-accent">{'★'.repeat(hotel.stars)}</span>
                    </div>
                  </div>
                  <span className={`text-xs px-1.5 py-0.5 rounded font-medium flex-shrink-0 ${
                    hFill === 100 ? 'bg-[#F0FDF4] text-[#16A34A]' : 'bg-secondary text-primary'
                  }`}>
                    {hotel.allocatedRooms}/{hotel.totalRooms}
                  </span>
                </div>
                <div className="progress-bar-track mb-1">
                  <div className="progress-bar-fill" style={{ width: `${hFill}%` }} />
                </div>
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Users size={10} />
                  {hotel.pilgrims} pilgrims
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Room Detail */}
      <div className="xl:col-span-2 space-y-4">
        {/* Hotel Summary Card */}
        <div className="card-base">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <h3 className="text-base font-semibold text-foreground">{selectedHotel.name}</h3>
              <div className="flex flex-wrap items-center gap-3 mt-1 text-xs text-muted-foreground">
                <span className="flex items-center gap-1"><MapPin size={11} />{selectedHotel.city}</span>
                <span className="flex items-center gap-1"><Building2 size={11} />{selectedHotel.totalRooms} total rooms</span>
                <span className="flex items-center gap-1"><Users size={11} />{selectedHotel.pilgrims} pilgrims</span>
                <span>Check-in: {selectedHotel.checkIn}</span>
                <span>Check-out: {selectedHotel.checkOut}</span>
              </div>
            </div>
            <div className="text-right flex-shrink-0">
              <p className="text-2xl font-bold tabular-nums text-primary">{fillPct}%</p>
              <p className="text-xs text-muted-foreground">{selectedHotel.allocatedRooms}/{selectedHotel.totalRooms} rooms allocated</p>
            </div>
          </div>

          {/* Room Type Breakdown */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4">
            {roomTypes.map((rt) => {
              const count = Math.floor(selectedHotel.totalRooms / 4);
              return (
                <div key={`rt-${rt.type}`} className={`p-3 rounded-lg ${rt.color.split(' ')[0]}`}>
                  <div className="flex items-center gap-1.5 mb-1">
                    <Bed size={12} className={rt.color.split(' ')[1]} />
                    <span className={`text-xs font-medium ${rt.color.split(' ')[1]}`}>{rt.label}</span>
                  </div>
                  <p className={`text-lg font-bold tabular-nums ${rt.color.split(' ')[1]}`}>{count}</p>
                  <p className="text-xs text-muted-foreground">{rt.capacity} per room</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Room List */}
        <div className="card-base">
          <h3 className="text-sm font-semibold text-foreground mb-3">Room Assignments (showing first 20)</h3>
          <div className="overflow-x-auto scrollbar-thin">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  {['Room', 'Floor', 'Type', 'Capacity', 'Status', 'Pilgrims', ''].map((h) => (
                    <th key={`rh-${h}`} className="text-left py-2 px-3 text-xs font-medium text-muted-foreground uppercase tracking-wide">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {roomList.map((room) => {
                  const rt = roomTypes.find((r) => r.type === room.type);
                  return (
                    <tr key={room.id} className="table-row-hover border-b border-border/50 last:border-0">
                      <td className="py-2.5 px-3 font-mono-data text-sm font-semibold text-foreground">{room.number}</td>
                      <td className="py-2.5 px-3 text-sm text-muted-foreground">Floor {room.floor}</td>
                      <td className="py-2.5 px-3">
                        <span className={`status-badge text-xs ${rt?.color}`}>{rt?.label}</span>
                      </td>
                      <td className="py-2.5 px-3 text-sm text-muted-foreground tabular-nums">{rt?.capacity} pax</td>
                      <td className="py-2.5 px-3">
                        <StatusBadge status={room.occupied ? 'allocated' : 'unallocated'} size="sm" />
                      </td>
                      <td className="py-2.5 px-3 text-sm tabular-nums text-muted-foreground">
                        {room.occupied ? `${room.pilgrimCount}/${rt?.capacity}` : '0'}
                      </td>
                      <td className="py-2.5 px-3">
                        <button className="text-xs text-primary hover:underline font-medium">
                          {room.occupied ? 'View' : 'Assign'}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}