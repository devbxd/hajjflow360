'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { CalendarClock, AlertTriangle, Loader2, Download, FileJson, FileSpreadsheet, FileText, Archive } from 'lucide-react';
import type { Season } from '@/lib/data/seasons';
import { useCurrency } from '@/lib/currency';
import { downloadSeasonSummaryPdf } from '@/lib/pdf';

interface PilgrimSnapshotRow {
  id: string;
  name: string;
  nationality: string;
  passport_number: string;
  visa_status: string;
  flight_number: string | null;
  hotel_makkah: string | null;
  hotel_madinah: string | null;
  bus_number: number | null;
  group_id: string;
  payment_total: string;
  payment_status: string;
}

interface Snapshot {
  pilgrims: PilgrimSnapshotRow[];
  [key: string]: unknown;
}

function downloadBlob(filename: string, content: string, type: string) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function toCsv(rows: (string | number)[][]) {
  return rows.map((r) => r.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(',')).join('\n');
}

export default function NewSeasonClient({ active, initialArchived: archived }: { active: Season; initialArchived: Season[] }) {
  const router = useRouter();
  const { format } = useCurrency();
  const [showConfirm, setShowConfirm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [exportingId, setExportingId] = useState<number | null>(null);
  const [form, setForm] = useState({
    name: '',
    startDate: new Date().toISOString().slice(0, 10),
    confirmText: '',
  });

  const handleStartNewSeason = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || form.confirmText !== 'RESET') {
      toast.error('Type RESET exactly to confirm.');
      return;
    }
    setSaving(true);
    try {
      const res = await fetch('/api/seasons', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: form.name, startDate: form.startDate, confirm: 'RESET' }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Failed to start new season');
      toast.success(`"${form.name}" started. All pilgrim, logistics, and finance data has been reset.`);
      setShowConfirm(false);
      setForm({ name: '', startDate: new Date().toISOString().slice(0, 10), confirmText: '' });
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to start new season.');
    } finally {
      setSaving(false);
    }
  };

  const fetchSnapshot = async (id: number): Promise<Snapshot | null> => {
    try {
      const res = await fetch(`/api/seasons/${id}/snapshot`);
      if (!res.ok) throw new Error();
      const data = await res.json();
      return data.snapshot as Snapshot;
    } catch {
      toast.error('Failed to load season data.');
      return null;
    }
  };

  const exportJson = async (season: Season) => {
    setExportingId(season.id);
    const snapshot = await fetchSnapshot(season.id);
    if (snapshot) downloadBlob(`${season.name.replace(/\s+/g, '-')}-backup.json`, JSON.stringify(snapshot, null, 2), 'application/json');
    setExportingId(null);
  };

  const exportCsv = async (season: Season) => {
    setExportingId(season.id);
    const snapshot = await fetchSnapshot(season.id);
    if (snapshot) {
      const rows: (string | number)[][] = [
        ['ID', 'Name', 'Nationality', 'Passport #', 'Visa Status', 'Flight', 'Hotel (Makkah)', 'Hotel (Madinah)', 'Bus', 'Group', 'Package Price', 'Payment Status'],
        ...snapshot.pilgrims.map((p) => [
          p.id, p.name, p.nationality, p.passport_number, p.visa_status, p.flight_number ?? '',
          p.hotel_makkah ?? '', p.hotel_madinah ?? '', p.bus_number ?? '', p.group_id, p.payment_total, p.payment_status,
        ]),
      ];
      downloadBlob(`${season.name.replace(/\s+/g, '-')}-pilgrims.csv`, toCsv(rows), 'text/csv');
    }
    setExportingId(null);
  };

  const exportPdf = (season: Season) => downloadSeasonSummaryPdf(season);

  return (
    <div>
      <div className="mb-6 flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
          <CalendarClock size={20} className="text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-semibold text-foreground">New Season</h1>
          <p className="text-sm text-muted-foreground mt-1">Archive the current season and start the next one from a clean slate</p>
        </div>
      </div>

      <div className="card-base mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium mb-1">Currently Active Season</p>
          <p className="text-xl font-semibold text-foreground">{active.name}</p>
          <p className="text-sm text-muted-foreground mt-0.5">Started {active.startDate}</p>
        </div>
        <button onClick={() => setShowConfirm(true)} className="btn-primary text-sm flex items-center gap-1.5 flex-shrink-0">
          <CalendarClock size={14} />
          Start New Season
        </button>
      </div>

      <div className="mb-4 flex items-center gap-2">
        <Archive size={15} className="text-muted-foreground" />
        <h3 className="text-sm font-semibold text-foreground">Past Seasons</h3>
      </div>

      {archived.length === 0 ? (
        <div className="card-base">
          <p className="text-sm text-muted-foreground text-center py-8">No past seasons yet — archived seasons will show up here once you start a new one.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {archived.map((season) => (
            <div key={season.id} className="card-base">
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                <div>
                  <p className="text-base font-semibold text-foreground">{season.name}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {season.startDate} → {season.archivedAt?.slice(0, 10) ?? '—'}
                  </p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <button
                    onClick={() => exportJson(season)}
                    disabled={exportingId === season.id}
                    className="btn-secondary text-xs flex items-center gap-1.5"
                    title="Full data backup (JSON)"
                  >
                    {exportingId === season.id ? <Loader2 size={13} className="animate-spin" /> : <FileJson size={13} />}
                    JSON
                  </button>
                  <button
                    onClick={() => exportCsv(season)}
                    disabled={exportingId === season.id}
                    className="btn-secondary text-xs flex items-center gap-1.5"
                    title="Pilgrim list (CSV — opens in Excel)"
                  >
                    {exportingId === season.id ? <Loader2 size={13} className="animate-spin" /> : <FileSpreadsheet size={13} />}
                    CSV
                  </button>
                  <button onClick={() => exportPdf(season)} className="btn-secondary text-xs flex items-center gap-1.5" title="Summary report (PDF)">
                    <FileText size={13} />
                    PDF
                  </button>
                </div>
              </div>
              {season.stats && (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mt-4 pt-4 border-t border-border">
                  {[
                    { label: 'Pilgrims', value: season.stats.totalPilgrims },
                    { label: 'Groups', value: season.stats.totalGroups },
                    { label: 'Invoices', value: season.stats.totalInvoices },
                    { label: 'Revenue', value: format(season.stats.totalRevenue) },
                    { label: 'Expenses', value: format(season.stats.totalExpenses) },
                    { label: 'Net Profit', value: format(season.stats.netProfit) },
                  ].map((m) => (
                    <div key={m.label}>
                      <p className="text-xs text-muted-foreground">{m.label}</p>
                      <p className="text-sm font-semibold font-mono-data text-foreground">{m.value}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {showConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/20 backdrop-blur-sm fade-in">
          <div className="bg-card rounded-xl border border-border shadow-xl p-6 w-full max-w-md mx-4 slide-up">
            <div className="flex items-start gap-3 mb-4 p-3 rounded-lg bg-[#FEF2F2] border border-[#DC2626]/20">
              <AlertTriangle size={18} className="text-[#DC2626] flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-[#DC2626]">This resets the entire system</p>
                <p className="text-xs text-[#DC2626]/80 mt-1">
                  All pilgrims, groups, flights, buses, hotel rooms, payments, invoices and expenses will be cleared.
                  Everything from &quot;{active.name}&quot; is saved and stays exportable below — this cannot be undone from here.
                </p>
              </div>
            </div>
            <form onSubmit={handleStartNewSeason} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">New season name</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g. Hajj 2028"
                  required
                  className="w-full text-sm border border-border rounded-lg px-3 py-2 bg-input text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">Start date</label>
                <input
                  type="date"
                  value={form.startDate}
                  onChange={(e) => setForm((prev) => ({ ...prev, startDate: e.target.value }))}
                  required
                  className="w-full text-sm border border-border rounded-lg px-3 py-2 bg-input text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">
                  Type <span className="font-mono-data font-bold">RESET</span> to confirm
                </label>
                <input
                  type="text"
                  value={form.confirmText}
                  onChange={(e) => setForm((prev) => ({ ...prev, confirmText: e.target.value }))}
                  required
                  className="w-full text-sm border border-border rounded-lg px-3 py-2 bg-input text-foreground focus:outline-none focus:ring-2 focus:ring-ring font-mono-data"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowConfirm(false)} className="btn-secondary flex-1 justify-center">Cancel</button>
                <button
                  type="submit"
                  disabled={saving || form.confirmText !== 'RESET'}
                  className="flex-1 justify-center flex items-center gap-1.5 rounded-lg py-2 text-sm font-medium bg-[#DC2626] text-white hover:bg-[#B91C1C] disabled:opacity-50"
                >
                  {saving ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
                  Reset & Start
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
