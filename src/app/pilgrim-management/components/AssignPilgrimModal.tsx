'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Building2, Plane, X } from 'lucide-react';
import type { Pilgrim } from '@/lib/mockData';
import type { HotelRow, FlightRow } from '@/lib/data/logistics';

interface AssignPilgrimModalProps {
  pilgrim: Pilgrim;
  hotels: HotelRow[];
  flights: FlightRow[];
  onClose: () => void;
}

type Mode = 'choose' | 'hotel' | 'flight';

const inputClass = 'w-full text-sm border border-border rounded-lg px-3 py-2 bg-input text-foreground focus:outline-none focus:ring-2 focus:ring-ring';

export default function AssignPilgrimModal({ pilgrim, hotels, flights, onClose }: AssignPilgrimModalProps) {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>('choose');
  const [saving, setSaving] = useState(false);
  const [hotelId, setHotelId] = useState('');
  const [roomNumber, setRoomNumber] = useState('');
  const [roomType, setRoomType] = useState<'single' | 'double' | 'triple' | 'quad'>('double');
  const [flightNumber, setFlightNumber] = useState('');

  const selectedHotel = hotels.find((h) => h.id === hotelId);
  const selectedFlight = flights.find((f) => f.flightNumber === flightNumber);

  const submit = async (fn: () => Promise<Response>, success: string) => {
    setSaving(true);
    try {
      const res = await fn();
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? 'Failed to assign.');
      }
      toast.success(success);
      router.refresh();
      onClose();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to assign.');
    } finally {
      setSaving(false);
    }
  };

  const handleHotel = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedHotel) return;
    submit(
      () =>
        fetch('/api/allocation/assign-room', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            pilgrimId: pilgrim.id,
            city: selectedHotel.city,
            hotelName: selectedHotel.name,
            roomNumber,
            roomType,
          }),
        }),
      `${pilgrim.name} assigned to ${selectedHotel.name}, room ${roomNumber}.`
    );
  };

  const handleFlight = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFlight) return;
    submit(
      () =>
        fetch('/api/allocation/assign-flight', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ pilgrimIds: [pilgrim.id], flightNumber: selectedFlight.flightNumber, flightDate: selectedFlight.date }),
        }),
      `${pilgrim.name} assigned to flight ${selectedFlight.flightNumber}.`
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/20 backdrop-blur-sm fade-in">
      <div className="bg-card rounded-xl border border-border shadow-xl p-6 w-full max-w-md mx-4 slide-up">
        <div className="flex items-start justify-between mb-1">
          <h2 className="text-base font-semibold text-foreground">Assign {pilgrim.name}</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground"><X size={16} /></button>
        </div>
        <p className="text-sm text-muted-foreground mb-4 font-mono-data">{pilgrim.id}</p>

        {mode === 'choose' && (
          <div className="grid grid-cols-2 gap-3">
            <button onClick={() => setMode('hotel')} className="btn-secondary justify-center py-3 flex items-center gap-2">
              <Building2 size={14} /> Assign Hotel
            </button>
            <button onClick={() => setMode('flight')} className="btn-secondary justify-center py-3 flex items-center gap-2">
              <Plane size={14} /> Assign Flight
            </button>
          </div>
        )}

        {mode === 'hotel' && (
          <form onSubmit={handleHotel} className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">Hotel</label>
              <select required value={hotelId} onChange={(e) => setHotelId(e.target.value)} className={inputClass}>
                <option value="">Choose a hotel...</option>
                {hotels.map((h) => (
                  <option key={h.id} value={h.id}>{h.name} — {h.city} ({h.allocatedRooms}/{h.totalRooms})</option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">Room Number</label>
                <input required value={roomNumber} onChange={(e) => setRoomNumber(e.target.value)} className={inputClass} />
              </div>
              <div>
                <label className="block text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">Room Type</label>
                <select value={roomType} onChange={(e) => setRoomType(e.target.value as typeof roomType)} className={inputClass}>
                  <option value="single">Single</option>
                  <option value="double">Double</option>
                  <option value="triple">Triple</option>
                  <option value="quad">Quad</option>
                </select>
              </div>
            </div>
            <div className="flex gap-3 pt-2">
              <button type="button" onClick={() => setMode('choose')} className="btn-secondary flex-1 justify-center">Back</button>
              <button type="submit" disabled={saving || !selectedHotel} className="btn-primary flex-1 justify-center" style={{ opacity: saving ? 0.7 : 1 }}>
                {saving ? 'Saving...' : 'Assign Hotel'}
              </button>
            </div>
          </form>
        )}

        {mode === 'flight' && (
          <form onSubmit={handleFlight} className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">Flight</label>
              <select required value={flightNumber} onChange={(e) => setFlightNumber(e.target.value)} className={inputClass}>
                <option value="">Choose a flight...</option>
                {flights.map((f) => (
                  <option key={f.id} value={f.flightNumber}>{f.flightNumber} — {f.origin} → {f.destination} ({f.date})</option>
                ))}
              </select>
            </div>
            <div className="flex gap-3 pt-2">
              <button type="button" onClick={() => setMode('choose')} className="btn-secondary flex-1 justify-center">Back</button>
              <button type="submit" disabled={saving || !selectedFlight} className="btn-primary flex-1 justify-center" style={{ opacity: saving ? 0.7 : 1 }}>
                {saving ? 'Saving...' : 'Assign Flight'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
