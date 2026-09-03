'use client';

import React, { useState } from 'react';
import { flights, pilgrims } from '@/lib/mockData';
import StatusBadge from '@/components/ui/StatusBadge';
import { Plane, Users, Clock, CheckCircle2, Download, Search } from 'lucide-react';

export default function FlightManifestsTab() {
  const [selectedFlight, setSelectedFlight] = useState(flights[0]);
  const [manifestSearch, setManifestSearch] = useState('');

  // Generate manifest entries for selected flight
  const manifestPilgrims = pilgrims
    .filter((p) => p.flightNumber === selectedFlight.flightNumber || (!p.flightNumber && selectedFlight.id === 'FLT-004'))
    .filter((p) =>
      manifestSearch === '' ||
      p.name.toLowerCase().includes(manifestSearch.toLowerCase()) ||
      p.passportNumber.toLowerCase().includes(manifestSearch.toLowerCase())
    );

  // Supplement with mock entries to show volume
  const supplementManifest = [
    { id: 'PIL-020', name: 'Karim Bensouda', passportNumber: 'MA5521987', nationality: 'Morocco', seatNumber: '14C', visaStatus: 'approved', gender: 'M' },
    { id: 'PIL-021', name: 'Aisha Diallo Traore', passportNumber: 'SN3312098', nationality: 'Senegal', seatNumber: '15A', visaStatus: 'approved', gender: 'F' },
    { id: 'PIL-022', name: 'Mahmoud Al-Masri', passportNumber: 'EG7723456', nationality: 'Egypt', seatNumber: '16B', visaStatus: 'approved', gender: 'M' },
    { id: 'PIL-023', name: 'Hassan Boudiaf', passportNumber: 'DZ8812345', nationality: 'Algeria', seatNumber: '17D', visaStatus: 'pending', gender: 'M' },
    { id: 'PIL-024', name: 'Khadija Osman Nur', passportNumber: 'SO2234567', nationality: 'Somalia', seatNumber: '18A', visaStatus: 'approved', gender: 'F' },
  ];

  const confirmedCount = selectedFlight.confirmed;
  const pendingCount = selectedFlight.passengers - selectedFlight.confirmed;

  return (
    <div className="space-y-6">
      {/* Flight Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 2xl:grid-cols-6 gap-4">
        {flights.map((flight) => {
          const isSelected = selectedFlight.id === flight.id;
          const confPct = Math.round((flight.confirmed / flight.passengers) * 100);
          return (
            <button
              key={`flt-${flight.id}`}
              onClick={() => setSelectedFlight(flight)}
              className={`text-left p-4 rounded-xl border transition-all ${
                isSelected
                  ? 'bg-secondary border-primary/30 shadow-sm'
                  : 'bg-card border-border hover:bg-muted'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Plane size={14} className={isSelected ? 'text-primary' : 'text-muted-foreground'} />
                  <span className={`text-sm font-bold font-mono-data ${isSelected ? 'text-primary' : 'text-foreground'}`}>
                    {flight.flightNumber}
                  </span>
                </div>
                <StatusBadge status={flight.status === 'confirmed' ? 'approved' : 'pending'} size="sm" />
              </div>
              <p className="text-xs text-muted-foreground truncate">{flight.airline}</p>
              <p className="text-xs text-muted-foreground mt-0.5 truncate">{flight.origin} → {flight.destination}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{flight.date} · {flight.time}</p>
              <div className="mt-2 progress-bar-track">
                <div className="progress-bar-fill" style={{ width: `${confPct}%` }} />
              </div>
              <p className="text-xs text-muted-foreground mt-1 tabular-nums">
                {flight.confirmed}/{flight.passengers} confirmed
              </p>
            </button>
          );
        })}
      </div>

      {/* Manifest Detail */}
      <div className="card-base">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
          <div>
            <div className="flex items-center gap-3">
              <h3 className="text-sm font-semibold text-foreground">
                Flight {selectedFlight.flightNumber} — Manifest
              </h3>
              <span className="text-xs text-muted-foreground">
                {selectedFlight.airline} · {selectedFlight.origin} → {selectedFlight.destination}
              </span>
            </div>
            <div className="flex items-center gap-4 mt-1 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <Clock size={11} />
                {selectedFlight.date} at {selectedFlight.time}
              </span>
              <span className="flex items-center gap-1">
                <CheckCircle2 size={11} className="text-[#16A34A]" />
                {confirmedCount} confirmed
              </span>
              <span className="flex items-center gap-1">
                <Clock size={11} className="text-[#D97706]" />
                {pendingCount} pending
              </span>
              <span className="flex items-center gap-1">
                <Users size={11} />
                {selectedFlight.passengers} total
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <div className="relative">
              <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search manifest..."
                value={manifestSearch}
                onChange={(e) => setManifestSearch(e.target.value)}
                className="pl-8 pr-3 py-1.5 text-xs border border-border rounded-lg bg-input text-foreground focus:outline-none focus:ring-2 focus:ring-ring w-44"
              />
            </div>
            <button className="btn-secondary text-xs px-3 py-1.5 flex items-center gap-1.5">
              <Download size={12} />
              Export Manifest
            </button>
          </div>
        </div>

        <div className="overflow-x-auto scrollbar-thin">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                {['#', 'Pilgrim ID', 'Name', 'Nationality', 'Passport #', 'Seat', 'Visa', 'Gender', 'Status'].map((h) => (
                  <th key={`mh-${h}`} className="text-left py-2.5 px-3 text-xs font-medium text-muted-foreground uppercase tracking-wide whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[...manifestPilgrims, ...supplementManifest]
                .filter((p) =>
                  manifestSearch === '' ||
                  p.name.toLowerCase().includes(manifestSearch.toLowerCase()) ||
                  p.passportNumber.toLowerCase().includes(manifestSearch.toLowerCase())
                )
                .map((p, idx) => {
                  const isFullPilgrim = 'visaStatus' in p && typeof (p as { flightNumber?: string }).flightNumber !== 'undefined';
                  const visaStatus = (p as { visaStatus: string }).visaStatus as 'approved' | 'pending';
                  const gender = (p as { gender: string }).gender;
                  const seat = (p as { seatNumber?: string }).seatNumber;
                  return (
                    <tr key={`manifest-${p.id}`} className="table-row-hover border-b border-border/50 last:border-0">
                      <td className="py-2.5 px-3 text-xs text-muted-foreground tabular-nums">{idx + 1}</td>
                      <td className="py-2.5 px-3 font-mono-data text-xs text-muted-foreground">{p.id}</td>
                      <td className="py-2.5 px-3 font-medium text-foreground text-sm">{p.name}</td>
                      <td className="py-2.5 px-3 text-sm text-muted-foreground">{p.nationality}</td>
                      <td className="py-2.5 px-3 font-mono-data text-xs text-foreground">{p.passportNumber}</td>
                      <td className="py-2.5 px-3">
                        {seat ? (
                          <span className="font-mono-data text-xs text-foreground">{seat}</span>
                        ) : (
                          <span className="text-xs text-[#D97706]">Unassigned</span>
                        )}
                      </td>
                      <td className="py-2.5 px-3">
                        <StatusBadge status={visaStatus === 'approved' ? 'approved' : 'pending'} size="sm" />
                      </td>
                      <td className="py-2.5 px-3 text-sm text-muted-foreground">{gender === 'M' ? 'Male' : 'Female'}</td>
                      <td className="py-2.5 px-3">
                        <StatusBadge
                          status={visaStatus === 'approved' ? 'approved' : 'pending'}
                          size="sm"
                        />
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>

        {manifestPilgrims.length === 0 && manifestSearch === '' && (
          <div className="py-8 text-center">
            <Plane size={32} className="text-muted-foreground mx-auto mb-2" />
            <p className="text-sm font-medium text-foreground">No pilgrims assigned to this flight yet</p>
            <p className="text-xs text-muted-foreground mt-1">Use the Auto-Assign tool or manually assign pilgrims to {selectedFlight.flightNumber}</p>
            <button className="btn-primary text-sm mt-3">Assign Pilgrims to Flight</button>
          </div>
        )}
      </div>
    </div>
  );
}