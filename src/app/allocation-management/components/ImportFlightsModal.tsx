'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { X, FileSpreadsheet, Loader2, Download, CheckCircle2, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';

interface ImportRow {
  row: number;
  flightNumber: string;
  airline: string;
  origin: string;
  destination: string;
  date: string;
  time: string;
  status: string;
  missing: string[];
}

// Accepts a variety of real-world header spellings so a staff member's
// existing spreadsheet usually works without them renaming columns first.
const HEADER_ALIASES: Record<string, keyof Omit<ImportRow, 'row' | 'missing'>> = {
  flightnumber: 'flightNumber', flightno: 'flightNumber', flight: 'flightNumber',
  airline: 'airline', carrier: 'airline',
  origin: 'origin', from: 'origin', departure: 'origin',
  destination: 'destination', to: 'destination', arrival: 'destination',
  date: 'date', flightdate: 'date',
  time: 'time', flighttime: 'time',
  status: 'status',
};

function normalizeHeader(h: string): string {
  return h.toLowerCase().replace(/[^a-z0-9]/g, '');
}

const REQUIRED: (keyof Omit<ImportRow, 'row' | 'missing'>)[] = ['flightNumber', 'airline', 'origin', 'destination', 'date', 'time'];

interface Props {
  open: boolean;
  onClose: () => void;
}

export default function ImportFlightsModal({ open, onClose }: Props) {
  const router = useRouter();
  const [rows, setRows] = useState<ImportRow[]>([]);
  const [parsing, setParsing] = useState(false);
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<{ createdCount: number; errors: { row: number; name: string; error: string }[] } | null>(null);

  if (!open) return null;

  const reset = () => {
    setRows([]);
    setResult(null);
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const handleFile = async (file: File | null) => {
    if (!file) return;
    setParsing(true);
    setResult(null);
    try {
      const XLSX = await import('xlsx');
      const buffer = await file.arrayBuffer();
      const workbook = XLSX.read(buffer, { type: 'array' });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const raw = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: '' });

      const parsed: ImportRow[] = raw.map((record, i) => {
        const mapped: Record<string, string> = {};
        for (const [key, value] of Object.entries(record)) {
          const canonical = HEADER_ALIASES[normalizeHeader(key)];
          if (canonical) mapped[canonical] = String(value ?? '').trim();
        }

        const row: ImportRow = {
          row: i + 2,
          flightNumber: mapped.flightNumber ?? '',
          airline: mapped.airline ?? '',
          origin: mapped.origin ?? '',
          destination: mapped.destination ?? '',
          date: mapped.date ?? '',
          time: mapped.time ?? '',
          status: mapped.status?.toLowerCase() === 'confirmed' ? 'confirmed' : 'pending',
          missing: [],
        };
        row.missing = REQUIRED.filter((field) => !row[field]);
        return row;
      });

      setRows(parsed);
      if (parsed.length === 0) toast.error('No rows found in that file.');
    } catch {
      toast.error('Could not read that file. Make sure it is a valid .xlsx, .xls or .csv file.');
    } finally {
      setParsing(false);
    }
  };

  const validCount = rows.filter((r) => r.missing.length === 0).length;

  const handleImport = async () => {
    const validRows = rows.filter((r) => r.missing.length === 0);
    if (validRows.length === 0) {
      toast.error('No valid rows to import.');
      return;
    }
    setImporting(true);
    try {
      const res = await fetch('/api/flights/bulk-import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rows: validRows }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Import failed');
      setResult({ createdCount: data.createdCount, errors: data.errors });
      if (data.createdCount > 0) {
        toast.success(`${data.createdCount} flights imported.`);
        router.refresh();
      }
      if (data.errors?.length) {
        toast.error(`${data.errors.length} row(s) could not be imported.`);
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Import failed.');
    } finally {
      setImporting(false);
    }
  };

  const downloadTemplate = () => {
    const headers = ['Flight Number', 'Airline', 'Origin', 'Destination', 'Date', 'Time', 'Status'];
    const example = ['SV-881', 'Saudia', 'Beirut (BEY)', 'Jeddah (JED)', '15/09/2027', '14:30', 'pending'];
    const csv = [headers, example].map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'manasikpro_flight_import_template.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/20 backdrop-blur-sm fade-in">
      <div className="bg-card rounded-xl border border-border shadow-xl p-6 w-full max-w-2xl mx-4 slide-up max-h-[90vh] overflow-y-auto scrollbar-thin">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold text-foreground">Import Flights from Excel</h2>
          <button onClick={handleClose} className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground transition-colors">
            <X size={16} />
          </button>
        </div>

        {!result && (
          <>
            <p className="text-sm text-muted-foreground mb-3">
              Upload an .xlsx, .xls or .csv file with one row per flight, instead of adding them one by one.
            </p>
            <button onClick={downloadTemplate} className="text-xs text-primary hover:underline flex items-center gap-1 mb-4">
              <Download size={12} />
              Download a template file
            </button>

            <div
              className="border-2 border-dashed border-border rounded-xl p-6 text-center mb-4 hover:border-primary/40 transition-colors cursor-pointer bg-muted/30"
              onClick={() => document.getElementById('flight-import-file-input')?.click()}
            >
              <FileSpreadsheet size={32} className="text-muted-foreground mx-auto mb-2" />
              <p className="text-sm font-medium text-foreground">{parsing ? 'Reading file...' : 'Click to select a spreadsheet'}</p>
              <p className="text-xs text-muted-foreground mt-1">.xlsx, .xls or .csv</p>
              <input
                id="flight-import-file-input"
                type="file"
                accept=".xlsx,.xls,.csv"
                className="hidden"
                onChange={(e) => handleFile(e.target.files?.[0] ?? null)}
              />
            </div>

            {rows.length > 0 && (
              <>
                <div className="flex items-center gap-2 mb-3 text-sm">
                  <CheckCircle2 size={14} className="text-[#16A34A]" />
                  <span className="text-foreground">{validCount} ready to import</span>
                  {rows.length - validCount > 0 && (
                    <>
                      <AlertTriangle size={14} className="text-[#D97706] ml-2" />
                      <span className="text-muted-foreground">{rows.length - validCount} rows have missing fields</span>
                    </>
                  )}
                </div>
                <div className="overflow-x-auto scrollbar-thin border border-border rounded-lg mb-4 max-h-56">
                  <table className="w-full text-xs min-w-[560px]">
                    <thead className="sticky top-0 bg-muted">
                      <tr>
                        <th className="text-left py-1.5 px-2">Row</th>
                        <th className="text-left py-1.5 px-2">Flight #</th>
                        <th className="text-left py-1.5 px-2">Route</th>
                        <th className="text-left py-1.5 px-2">Date</th>
                        <th className="text-left py-1.5 px-2">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {rows.map((r) => (
                        <tr key={r.row} className="border-t border-border/50">
                          <td className="py-1.5 px-2 text-muted-foreground">{r.row}</td>
                          <td className="py-1.5 px-2 font-mono-data text-foreground">{r.flightNumber || '—'}</td>
                          <td className="py-1.5 px-2 text-muted-foreground">{r.origin && r.destination ? `${r.origin} → ${r.destination}` : '—'}</td>
                          <td className="py-1.5 px-2 text-muted-foreground">{r.date || '—'}</td>
                          <td className="py-1.5 px-2">
                            {r.missing.length === 0 ? (
                              <span className="text-[#16A34A]">Ready</span>
                            ) : (
                              <span className="text-[#D97706]" title={r.missing.join(', ')}>Missing {r.missing.length}</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}

            <div className="flex gap-3">
              <button onClick={handleClose} className="btn-secondary flex-1 justify-center">Cancel</button>
              <button
                onClick={handleImport}
                disabled={importing || validCount === 0}
                className="btn-primary flex-1 justify-center"
                style={{ opacity: importing || validCount === 0 ? 0.6 : 1 }}
              >
                {importing ? (
                  <>
                    <Loader2 size={14} className="animate-spin" />
                    Importing...
                  </>
                ) : (
                  `Import ${validCount || ''} Flights`.trim()
                )}
              </button>
            </div>
          </>
        )}

        {result && (
          <div>
            <div className="flex items-center gap-2 mb-4 text-sm">
              <CheckCircle2 size={16} className="text-[#16A34A]" />
              <span className="text-foreground font-medium">{result.createdCount} flights imported successfully.</span>
            </div>
            {result.errors.length > 0 && (
              <div className="mb-4">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">{result.errors.length} rows failed</p>
                <ul className="text-xs text-muted-foreground space-y-1 max-h-40 overflow-y-auto scrollbar-thin">
                  {result.errors.map((e, i) => (
                    <li key={i}>Row {e.row} ({e.name}): {e.error}</li>
                  ))}
                </ul>
              </div>
            )}
            <button onClick={handleClose} className="btn-primary w-full justify-center">Done</button>
          </div>
        )}
      </div>
    </div>
  );
}
