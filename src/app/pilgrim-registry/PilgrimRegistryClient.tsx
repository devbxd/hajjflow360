'use client';

import React, { useMemo, useState } from 'react';
import { BookOpen, Search, Printer, Download } from 'lucide-react';
import type { Pilgrim } from '@/lib/mockData';

export default function PilgrimRegistryClient({ pilgrims }: { pilgrims: Pilgrim[] }) {
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    if (!search) return pilgrims;
    const q = search.toLowerCase();
    return pilgrims.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.id.toLowerCase().includes(q) ||
        p.passportNumber.toLowerCase().includes(q) ||
        p.nationality.toLowerCase().includes(q) ||
        p.groupId.toLowerCase().includes(q)
    );
  }, [pilgrims, search]);

  const handlePrint = () => window.print();

  const handleExport = () => {
    const csvRows = [
      ['Pilgrim ID', 'Full Name', 'Nationality', 'Passport Number', 'Passport Expiry', 'Date of Birth', 'Gender', 'Group ID', 'Registered On'],
      ...filtered.map((p) => [p.id, p.name, p.nationality, p.passportNumber, p.passportExpiry, p.dateOfBirth, p.gender, p.groupId, p.registeredAt]),
    ];
    const csv = csvRows.map((r) => r.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'manasikpro_pilgrim_registry.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div>
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 print:hidden">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <BookOpen size={20} className="text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold text-foreground">Pilgrim Registry</h1>
            <p className="text-sm text-muted-foreground mt-1">Official register — {pilgrims.length} pilgrims recorded</p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search registry..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8 pr-3 py-2 text-sm bg-muted border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30 w-56"
            />
          </div>
          <button onClick={handleExport} className="btn-secondary text-sm flex items-center gap-1.5">
            <Download size={14} />
            Export CSV
          </button>
          <button onClick={handlePrint} className="btn-primary text-sm flex items-center gap-1.5">
            <Printer size={14} />
            Print Register
          </button>
        </div>
      </div>

      <div className="hidden print:block mb-4">
        <h1 className="text-xl font-bold">ManasikPro — Pilgrim Registry</h1>
        <p className="text-sm">Hajj 2027 · {filtered.length} pilgrims · Printed {new Date().toLocaleDateString()}</p>
      </div>

      <div className="card-base">
        <div className="overflow-x-auto scrollbar-thin">
          <table className="w-full text-sm min-w-[900px]">
            <thead>
              <tr className="border-b border-border bg-muted/30 print:bg-transparent">
                {['#', 'Pilgrim ID', 'Full Name', 'Nationality', 'Passport #', 'Date of Birth', 'Gender', 'Group', 'Registered'].map((h) => (
                  <th key={h} className="text-left py-2.5 px-3 text-xs font-medium text-muted-foreground uppercase tracking-wide whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-sm text-muted-foreground">
                    No pilgrims match this search.
                  </td>
                </tr>
              ) : (
                filtered.map((p, i) => (
                  <tr key={`reg-${p.id}`} className="table-row-hover border-b border-border/50 last:border-0">
                    <td className="py-2 px-3 text-xs text-muted-foreground">{i + 1}</td>
                    <td className="py-2 px-3 font-mono-data text-xs text-foreground">{p.id}</td>
                    <td className="py-2 px-3 font-medium text-foreground">{p.name}</td>
                    <td className="py-2 px-3 text-muted-foreground whitespace-nowrap">{p.nationality}</td>
                    <td className="py-2 px-3 font-mono-data text-xs text-foreground">{p.passportNumber}</td>
                    <td className="py-2 px-3 text-xs text-muted-foreground whitespace-nowrap">{p.dateOfBirth}</td>
                    <td className="py-2 px-3 text-xs text-muted-foreground">{p.gender}</td>
                    <td className="py-2 px-3 font-mono-data text-xs text-muted-foreground">{p.groupId}</td>
                    <td className="py-2 px-3 text-xs text-muted-foreground whitespace-nowrap">{p.registeredAt}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
