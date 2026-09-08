'use client';

import React, { useState } from 'react';
import type { BusRow } from '@/lib/data/logistics';
import type { Pilgrim } from '@/lib/mockData';
import { Users, MapPin, User } from 'lucide-react';

// Lays real pilgrims assigned to this bus into the visual 5x10 grid, in
// order. The grid position doesn't necessarily match each pilgrim's stored
// seatNumber label (that's free-text and not constrained to this layout) —
// what's real is which pilgrims are on this bus and the actual fill count.
function buildSeats(busNumber: number, occupants: Pilgrim[]) {
  const seats: { id: string; row: string; col: number; occupied: boolean; pilgrim?: Pilgrim }[] = [];
  const rows = ['A', 'B', 'C', 'D', 'E'];
  let idx = 0;
  for (let r = 0; r < rows.length; r++) {
    for (let c = 1; c <= 10; c++) {
      const pilgrim = occupants[idx];
      seats.push({
        id: `bus${busNumber}-${rows[r]}${c}`,
        row: rows[r],
        col: c,
        occupied: Boolean(pilgrim),
        pilgrim,
      });
      idx++;
    }
  }
  return seats;
}

export default function BusSeatingTab({ buses, pilgrims }: { buses: BusRow[]; pilgrims: Pilgrim[] }) {
  const [selectedBus, setSelectedBus] = useState(buses[0]);
  const [selectedSeat, setSelectedSeat] = useState<string | null>(null);
  const occupants = pilgrims.filter((p) => p.busNumber === selectedBus?.number);
  const seats = selectedBus ? buildSeats(selectedBus.number, occupants) : [];
  const rows = ['A', 'B', 'C', 'D', 'E'];

  if (!selectedBus) {
    return <div className="card-base text-sm text-muted-foreground">No buses configured yet.</div>;
  }

  return (
    <div className="grid grid-cols-1 xl:grid-cols-3 2xl:grid-cols-3 gap-6">
      {/* Bus List */}
      <div className="xl:col-span-1 card-base">
        <h3 className="text-sm font-semibold text-foreground mb-3">Fleet Overview</h3>
        <div className="space-y-1.5 max-h-[500px] overflow-y-auto scrollbar-thin pr-1">
          {buses.map((bus) => {
            const fillPct = Math.round((bus.allocated / bus.capacity) * 100);
            const isSelected = selectedBus.id === bus.id;
            return (
              <button
                key={`bus-${bus.id}`}
                onClick={() => { setSelectedBus(bus); setSelectedSeat(null); }}
                className={`w-full text-left p-3 rounded-lg border transition-all ${
                  isSelected
                    ? 'bg-secondary border-primary/30' :'bg-muted/30 border-border hover:bg-muted'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <span className={`text-sm font-semibold ${isSelected ? 'text-primary' : 'text-foreground'}`}>
                      Bus #{bus.number}
                    </span>
                    <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${
                      fillPct === 100
                        ? 'bg-[#F0FDF4] text-[#16A34A]'
                        : fillPct >= 80
                        ? 'bg-secondary text-primary' :'bg-[#FFFBEB] text-[#D97706]'
                    }`}>
                      {bus.allocated}/{bus.capacity}
                    </span>
                  </div>
                  <span className="text-xs tabular-nums text-muted-foreground">{fillPct}%</span>
                </div>
                <div className="progress-bar-track mb-1.5">
                  <div className="progress-bar-fill" style={{ width: `${fillPct}%` }} />
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <User size={10} />
                  <span className="truncate">{bus.driver}</span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Seat Grid */}
      <div className="xl:col-span-2 card-base">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-semibold text-foreground">Bus #{selectedBus.number} — Seat Map</h3>
            <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <Users size={11} />
                {selectedBus.allocated}/{selectedBus.capacity} seats filled
              </span>
              <span className="flex items-center gap-1.5">
                <MapPin size={11} />
                {selectedBus.route}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <span className="w-4 h-4 rounded seat-occupied inline-block" />
              Occupied
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-4 h-4 rounded seat-empty inline-block" />
              Empty
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-4 h-4 rounded seat-selected inline-block" />
              Selected
            </span>
          </div>
        </div>

        {/* Driver area */}
        <div className="flex justify-start mb-4">
          <div className="px-4 py-2 rounded-lg bg-muted border border-border text-xs font-medium text-muted-foreground flex items-center gap-2">
            <User size={12} />
            Driver: {selectedBus.driver}
          </div>
        </div>

        {/* Seat Grid */}
        <div className="overflow-x-auto scrollbar-thin">
          <div className="min-w-[380px]">
            {/* Column headers */}
            <div className="flex gap-1 mb-1 pl-8">
              {Array.from({ length: 10 }, (_, i) => (
                <div key={`col-${i + 1}`} className="w-9 text-center text-xs text-muted-foreground font-medium">
                  {i + 1}
                </div>
              ))}
            </div>
            {rows.map((row) => (
              <div key={`seat-row-${row}`} className="flex items-center gap-1 mb-1">
                <span className="w-7 text-xs font-semibold text-muted-foreground text-right pr-1">{row}</span>
                {Array.from({ length: 10 }, (_, i) => {
                  const seat = seats.find((s) => s.row === row && s.col === i + 1);
                  if (!seat) return null;
                  const isSelected = selectedSeat === seat.id;
                  return (
                    <button
                      key={seat.id}
                      onClick={() => setSelectedSeat(isSelected ? null : seat.id)}
                      title={seat.occupied ? `${seat.pilgrim?.name} (${seat.pilgrim?.id}) — ${row}${i + 1}` : `Empty — ${row}${i + 1}`}
                      className={`w-9 h-9 rounded text-xs font-medium transition-all ${
                        isSelected
                          ? 'seat-selected scale-110 shadow-md'
                          : seat.occupied
                          ? 'seat-occupied hover:opacity-80' :'seat-empty hover:bg-input hover:border-primary/30'
                      }`}
                    >
                      {row}{i + 1}
                    </button>
                  );
                })}
                {/* Aisle gap after col 5 */}
              </div>
            ))}
          </div>
        </div>

        {/* Selected Seat Info */}
        {selectedSeat && (
          <div className="mt-4 pt-4 border-t border-border slide-up">
            {(() => {
              const seat = seats.find((s) => s.id === selectedSeat);
              if (!seat) return null;
              return (
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      Seat {seat.row}{seat.col} — {seat.occupied ? 'Occupied' : 'Available'}
                    </p>
                    {seat.occupied && seat.pilgrim && (
                      <p className="text-xs font-mono-data text-muted-foreground mt-0.5">{seat.pilgrim.name} · {seat.pilgrim.id}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {seat.occupied ? (
                      <button className="btn-secondary text-xs px-3 py-1.5">Reassign Seat</button>
                    ) : (
                      <button className="btn-primary text-xs px-3 py-1.5">Assign Pilgrim</button>
                    )}
                  </div>
                </div>
              );
            })()}
          </div>
        )}
      </div>
    </div>
  );
}