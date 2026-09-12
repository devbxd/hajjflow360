'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import type { FlightRow } from '@/lib/data/logistics';
import type { Pilgrim } from '@/lib/mockData';
import StatusBadge from '@/components/ui/StatusBadge';
import { Plane, Users, Clock, CheckCircle2, Download, Search, PlusCircle } from 'lucide-react';

interface FlightManifestsTabProps {
  flights: FlightRow[];
  pilgrims: Pilgrim[];
}

const EMPTY_FLIGHT_FORM = {
  flightNumber: '',
  airline: '',
  origin: '',
  destination: '',
  date: '',
  time: '',
  status: 'pending' as 'confirmed' | 'pending',
};

export default function FlightManifestsTab({ flights, pilgrims }: FlightManifestsTabProps) {
  const router = useRouter();
  const [selectedFlight, setSelectedFlight] = useState(flights[0]);
  const [manifestSearch, setManifestSearch] = useState('');
  const [assignOpen, setAssignOpen] = useState(false);
  const [selectedForFlight, setSelectedForFlight] = useState<Set<string>>(new Set());
  const [saving, setSaving] = useState(false);
  const [addFlightOpen, setAddFlightOpen] = useState(false);
  const [flightForm, setFlightForm] = useState(EMPTY_FLIGHT_FORM);
  const [savingFlight, setSavingFlight] = useState(false);

  const handleAddFlight = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingFlight(true);
    try {
      const res = await fetch('/api/flights', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(flightForm),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Failed to add flight');
      toast.success(`Flight ${flightForm.flightNumber} added.`);
      setAddFlightOpen(false);
      setFlightForm(EMPTY_FLIGHT_FORM);
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to add flight.');
    } finally {
      setSavingFlight(false);
    }
  };

  const addFlightModal = addFlightOpen && (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/20 backdrop-blur-sm fade-in">
      <div className="bg-card rounded-xl border border-border shadow-xl p-6 w-full max-w-md mx-4 slide-up">
        <h2 className="text-base font-semibold text-foreground mb-1">Add Flight</h2>
        <p className="text-sm text-muted-foreground mb-4">Creates a new flight so pilgrims can be assigned to it.</p>
        <form onSubmit={handleAddFlight} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">Flight Number</label>
              <input required value={flightForm.flightNumber} onChange={(e) => setFlightForm((f) => ({ ...f, flightNumber: e.target.value }))} placeholder="SV-881" className="w-full text-sm border border-border rounded-lg px-3 py-2 bg-input text-foreground focus:outline-none focus:ring-2 focus:ring-ring" />
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">Airline</label>
              <input required value={flightForm.airline} onChange={(e) => setFlightForm((f) => ({ ...f, airline: e.target.value }))} placeholder="Saudia" className="w-full text-sm border border-border rounded-lg px-3 py-2 bg-input text-foreground focus:outline-none focus:ring-2 focus:ring-ring" />
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">Origin</label>
              <input required value={flightForm.origin} onChange={(e) => setFlightForm((f) => ({ ...f, origin: e.target.value }))} placeholder="Beirut (BEY)" className="w-full text-sm border border-border rounded-lg px-3 py-2 bg-input text-foreground focus:outline-none focus:ring-2 focus:ring-ring" />
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">Destination</label>
              <input required value={flightForm.destination} onChange={(e) => setFlightForm((f) => ({ ...f, destination: e.target.value }))} placeholder="Jeddah (JED)" className="w-full text-sm border border-border rounded-lg px-3 py-2 bg-input text-foreground focus:outline-none focus:ring-2 focus:ring-ring" />
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">Date (DD/MM/YYYY)</label>
              <input required value={flightForm.date} onChange={(e) => setFlightForm((f) => ({ ...f, date: e.target.value }))} placeholder="15/09/2027" className="w-full text-sm border border-border rounded-lg px-3 py-2 bg-input text-foreground focus:outline-none focus:ring-2 focus:ring-ring" />
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">Time</label>
              <input required value={flightForm.time} onChange={(e) => setFlightForm((f) => ({ ...f, time: e.target.value }))} placeholder="14:30" className="w-full text-sm border border-border rounded-lg px-3 py-2 bg-input text-foreground focus:outline-none focus:ring-2 focus:ring-ring" />
            </div>
            <div className="col-span-2">
              <label className="block text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">Status</label>
              <select value={flightForm.status} onChange={(e) => setFlightForm((f) => ({ ...f, status: e.target.value as 'confirmed' | 'pending' }))} className="w-full text-sm border border-border rounded-lg px-3 py-2 bg-input text-foreground focus:outline-none focus:ring-2 focus:ring-ring">
                <option value="pending">Pending</option>
                <option value="confirmed">Confirmed</option>
              </select>
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={() => setAddFlightOpen(false)} className="btn-secondary flex-1 justify-center">Cancel</button>
            <button type="submit" disabled={savingFlight} className="btn-primary flex-1 justify-center" style={{ opacity: savingFlight ? 0.7 : 1 }}>
              {savingFlight ? 'Adding...' : 'Add Flight'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );

  if (!selectedFlight) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-foreground">Flights</h3>
          <button onClick={() => setAddFlightOpen(true)} className="btn-primary text-xs px-3 py-1.5 flex items-center gap-1.5">
            <PlusCircle size={13} />
            Add Flight
          </button>
        </div>
        <div className="card-base text-sm text-muted-foreground">No flights configured yet. Add one to start assigning pilgrims.</div>
        {addFlightModal}
      </div>
    );
  }

  const manifestPilgrims = pilgrims
    .filter((p) => p.flightNumber === selectedFlight.flightNumber)
    .filter((p) =>
      manifestSearch === '' ||
      p.name.toLowerCase().includes(manifestSearch.toLowerCase()) ||
      p.passportNumber.toLowerCase().includes(manifestSearch.toLowerCase())
    );

  const handleExport = () => {
    const rows = [
      ['Pilgrim ID', 'Name', 'Nationality', 'Passport #', 'Seat', 'Visa', 'Gender'],
      ...manifestPilgrims.map((p) => [p.id, p.name, p.nationality, p.passportNumber, p.seatNumber ?? '', p.visaStatus, p.gender]),
    ];
    const csv = rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${selectedFlight.flightNumber}_manifest.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const confirmedCount = selectedFlight.confirmed;
  const pendingCount = selectedFlight.passengers - selectedFlight.confirmed;
  const unassignedPilgrims = pilgrims.filter((p) => !p.flightNumber);

  const toggleForFlight = (id: string) => {
    setSelectedForFlight((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const handleAssignToFlight = async () => {
    const ids = Array.from(selectedForFlight);
    if (ids.length === 0) {
      toast.error('Select at least one pilgrim.');
      return;
    }
    setSaving(true);
    try {
      const res = await fetch('/api/allocation/assign-flight', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pilgrimIds: ids, flightNumber: selectedFlight.flightNumber, flightDate: selectedFlight.date }),
      });
      if (!res.ok) throw new Error();
      toast.success(`${ids.length} pilgrims assigned to ${selectedFlight.flightNumber}`);
      setAssignOpen(false);
      setSelectedForFlight(new Set());
      router.refresh();
    } catch {
      toast.error('Failed to assign pilgrims to flight.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Flight Cards */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-foreground">Flights</h3>
        <button onClick={() => setAddFlightOpen(true)} className="btn-primary text-xs px-3 py-1.5 flex items-center gap-1.5">
          <PlusCircle size={13} />
          Add Flight
        </button>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 2xl:grid-cols-6 gap-4">
        {flights.map((flight) => {
          const isSelected = selectedFlight.id === flight.id;
          const confPct = flight.passengers > 0 ? Math.round((flight.confirmed / flight.passengers) * 100) : 0;
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
            <button onClick={handleExport} className="btn-secondary text-xs px-3 py-1.5 flex items-center gap-1.5">
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
              {manifestPilgrims.length === 0 && (
                <tr>
                  <td colSpan={9} className="py-6 px-3 text-center text-sm text-muted-foreground">No pilgrims match.</td>
                </tr>
              )}
              {manifestPilgrims
                .map((p, idx) => {
                  const visaStatus = p.visaStatus === 'approved' ? 'approved' : 'pending';
                  const gender = p.gender;
                  const seat = p.seatNumber;
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
            <button onClick={() => setAssignOpen(true)} className="btn-primary text-sm mt-3">Assign Pilgrims to Flight</button>
          </div>
        )}
      </div>

      {assignOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/20 backdrop-blur-sm fade-in">
          <div className="bg-card rounded-xl border border-border shadow-xl p-6 w-full max-w-md mx-4 slide-up max-h-[80vh] overflow-y-auto scrollbar-thin">
            <h2 className="text-base font-semibold text-foreground mb-1">Assign Pilgrims to {selectedFlight.flightNumber}</h2>
            <p className="text-sm text-muted-foreground mb-4">Pilgrims with no flight assigned yet.</p>
            {unassignedPilgrims.length === 0 ? (
              <p className="text-sm text-muted-foreground">Every pilgrim already has a flight assigned.</p>
            ) : (
              <div className="space-y-1 mb-4">
                {unassignedPilgrims.map((p) => (
                  <label key={p.id} className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-muted cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedForFlight.has(p.id)}
                      onChange={() => toggleForFlight(p.id)}
                      className="rounded border-border"
                    />
                    <span className="text-sm text-foreground">{p.name}</span>
                    <span className="text-xs font-mono-data text-muted-foreground ml-auto">{p.id}</span>
                  </label>
                ))}
              </div>
            )}
            <div className="flex gap-3">
              <button onClick={() => { setAssignOpen(false); setSelectedForFlight(new Set()); }} className="btn-secondary flex-1 justify-center">Cancel</button>
              <button
                onClick={handleAssignToFlight}
                disabled={saving || selectedForFlight.size === 0}
                className="btn-primary flex-1 justify-center"
                style={{ opacity: saving || selectedForFlight.size === 0 ? 0.6 : 1 }}
              >
                Assign {selectedForFlight.size || ''}
              </button>
            </div>
          </div>
        </div>
      )}

      {addFlightModal}
    </div>
  );
}