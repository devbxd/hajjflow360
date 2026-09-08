'use client';

import React, { useState, useMemo } from 'react';
import type { Pilgrim } from '@/lib/mockData';
import { QrCode, CheckCircle2, Clock, XCircle, Search } from 'lucide-react';
import { toast } from 'sonner';

type Attendance = Pilgrim['attendanceStatus'];

const STATUS_STYLE: Record<Attendance, { label: string; className: string; icon: React.ElementType }> = {
  present: { label: 'Present', className: 'bg-[#F0FDF4] text-[#16A34A]', icon: CheckCircle2 },
  absent: { label: 'Absent', className: 'bg-[#FEF2F2] text-[#DC2626]', icon: XCircle },
  'not-checked': { label: 'Not checked', className: 'bg-muted text-muted-foreground', icon: Clock },
};

export default function QrCheckinClient({ pilgrims }: { pilgrims: Pilgrim[] }) {
  const [attendance, setAttendance] = useState<Record<string, Attendance>>(
    Object.fromEntries(pilgrims.map((p) => [p.id, p.attendanceStatus]))
  );
  const [search, setSearch] = useState('');
  const [scanInput, setScanInput] = useState('');

  const counts = useMemo(() => {
    const values = Object.values(attendance);
    return {
      present: values.filter((v) => v === 'present').length,
      absent: values.filter((v) => v === 'absent').length,
      notChecked: values.filter((v) => v === 'not-checked').length,
    };
  }, [attendance]);

  const filtered = pilgrims.filter(
    (p) => !search || p.name.toLowerCase().includes(search.toLowerCase()) || p.id.toLowerCase().includes(search.toLowerCase())
  );

  const setStatus = async (id: string, status: Attendance) => {
    const previous = attendance[id];
    setAttendance((prev) => ({ ...prev, [id]: status }));
    try {
      const res = await fetch(`/api/pilgrims/${id}/attendance`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error();
    } catch {
      setAttendance((prev) => ({ ...prev, [id]: previous }));
      toast.error('Failed to update attendance.');
    }
  };

  const cycleStatus = (id: string) => {
    const current = attendance[id];
    const next: Attendance = current === 'present' ? 'absent' : current === 'absent' ? 'not-checked' : 'present';
    setStatus(id, next);
  };

  const handleScan = async (e: React.FormEvent) => {
    e.preventDefault();
    const id = scanInput.trim().toUpperCase();
    const pilgrim = pilgrims.find((p) => p.id === id);
    if (!pilgrim) {
      toast.error(`No pilgrim found with ID "${scanInput}"`);
      return;
    }
    await setStatus(pilgrim.id, 'present');
    toast.success(`${pilgrim.name} checked in`);
    setScanInput('');
  };

  return (
    <>
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
          <QrCode size={20} className="text-primary" />
        </div>
        <div>
          <h1 className="text-xl font-semibold text-foreground">QR Check-in</h1>
          <p className="text-sm text-muted-foreground">
            {counts.present} present · {counts.absent} absent · {counts.notChecked} not checked
          </p>
        </div>
      </div>

      <div className="card-base mb-6">
        <form onSubmit={handleScan} className="flex items-center gap-2">
          <input
            type="text"
            value={scanInput}
            onChange={(e) => setScanInput(e.target.value)}
            placeholder="Scan or type pilgrim ID (e.g. PIL-001) and press Enter"
            className="flex-1 text-sm border border-border rounded-lg px-3 py-2 bg-input text-foreground focus:outline-none focus:ring-2 focus:ring-ring font-mono-data"
          />
          <button type="submit" className="btn-primary text-sm">Check In</button>
        </form>
        <p className="text-xs text-muted-foreground mt-2">
          A real barcode/QR scanner just needs to type the ID into this field followed by Enter — no camera integration wired up yet.
        </p>
      </div>

      <div className="card-base p-0 overflow-hidden">
        <div className="px-4 py-3 border-b border-border">
          <div className="relative max-w-xs">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search pilgrim…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8 pr-3 py-2 text-sm w-full bg-muted border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>
        </div>
        <div className="divide-y divide-border/50">
          {filtered.map((p) => {
            const status = attendance[p.id];
            const style = STATUS_STYLE[status];
            const Icon = style.icon;
            return (
              <div key={p.id} className="flex items-center justify-between gap-3 px-4 py-3">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{p.name}</p>
                  <p className="text-xs text-muted-foreground font-mono-data">{p.id} · {p.groupId}</p>
                </div>
                <button
                  onClick={() => cycleStatus(p.id)}
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium transition-all flex-shrink-0 ${style.className}`}
                  title="Click to cycle status"
                >
                  <Icon size={12} />
                  {style.label}
                </button>
              </div>
            );
          })}
          {filtered.length === 0 && (
            <p className="px-4 py-8 text-center text-sm text-muted-foreground">No pilgrims match this search.</p>
          )}
        </div>
      </div>
    </>
  );
}
