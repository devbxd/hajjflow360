'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { X, FileSpreadsheet, Loader2, Download, CheckCircle2, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import type { GroupLeader } from '@/lib/mockData';

interface ImportRow {
  row: number;
  name: string;
  nationality: string;
  nationalityCode: string;
  passportNumber: string;
  passportExpiry: string;
  dateOfBirth: string;
  gender: 'M' | 'F' | '';
  phone: string;
  email: string;
  emergencyContact: string;
  emergencyPhone: string;
  groupId: string;
  paymentTotal: string;
  missing: string[];
}

// Accepts a variety of real-world header spellings so a staff member's
// existing spreadsheet usually works without them renaming columns first.
const HEADER_ALIASES: Record<string, keyof Omit<ImportRow, 'row' | 'missing'>> = {
  name: 'name', fullname: 'name', pilgrimname: 'name',
  nationality: 'nationality', country: 'nationality',
  nationalitycode: 'nationalityCode', countrycode: 'nationalityCode',
  passportnumber: 'passportNumber', passportno: 'passportNumber', passport: 'passportNumber',
  passportexpiry: 'passportExpiry', expiry: 'passportExpiry',
  dateofbirth: 'dateOfBirth', dob: 'dateOfBirth', birthdate: 'dateOfBirth',
  gender: 'gender', sex: 'gender',
  phone: 'phone', phonenumber: 'phone', mobile: 'phone',
  email: 'email',
  emergencycontact: 'emergencyContact', emergencycontactname: 'emergencyContact',
  emergencyphone: 'emergencyPhone', emergencycontactphone: 'emergencyPhone',
  groupid: 'groupId', group: 'groupId',
  paymenttotal: 'paymentTotal', price: 'paymentTotal', packageprice: 'paymentTotal', amount: 'paymentTotal',
};

function normalizeHeader(h: string): string {
  return h.toLowerCase().replace(/[^a-z0-9]/g, '');
}

const REQUIRED: (keyof Omit<ImportRow, 'row' | 'missing'>)[] = [
  'name', 'nationality', 'nationalityCode', 'passportNumber', 'passportExpiry', 'dateOfBirth', 'gender',
];

interface Props {
  open: boolean;
  onClose: () => void;
  groupLeaders: GroupLeader[];
}

export default function ImportPilgrimsModal({ open, onClose, groupLeaders }: Props) {
  const router = useRouter();
  const [rows, setRows] = useState<ImportRow[]>([]);
  const [parsing, setParsing] = useState(false);
  const [importing, setImporting] = useState(false);
  const [fallbackGroupId, setFallbackGroupId] = useState(groupLeaders[0]?.groupId ?? '');
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
        const genderRaw = mapped.gender?.toUpperCase().slice(0, 1);
        const gender: ImportRow['gender'] = genderRaw === 'M' || genderRaw === 'F' ? genderRaw : '';

        const row: ImportRow = {
          row: i + 2,
          name: mapped.name ?? '',
          nationality: mapped.nationality ?? '',
          nationalityCode: mapped.nationalityCode ?? '',
          passportNumber: mapped.passportNumber ?? '',
          passportExpiry: mapped.passportExpiry ?? '',
          dateOfBirth: mapped.dateOfBirth ?? '',
          gender,
          phone: mapped.phone ?? '',
          email: mapped.email ?? '',
          emergencyContact: mapped.emergencyContact ?? '',
          emergencyPhone: mapped.emergencyPhone ?? '',
          groupId: mapped.groupId || fallbackGroupId,
          paymentTotal: mapped.paymentTotal ?? '0',
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
      const res = await fetch('/api/pilgrims/bulk-import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rows: validRows.map((r) => ({ ...r, paymentTotal: Number(r.paymentTotal) || 0, fromOcrScan: false })),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Import failed');
      setResult({ createdCount: data.createdCount, errors: data.errors });
      if (data.createdCount > 0) {
        toast.success(`${data.createdCount} pilgrims imported.`);
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
    const headers = ['Name', 'Nationality', 'Nationality Code', 'Passport Number', 'Passport Expiry', 'Date of Birth', 'Gender', 'Phone', 'Email', 'Emergency Contact', 'Emergency Phone', 'Group ID', 'Payment Total'];
    const example = ['Ahmed Al-Farsi', 'Saudi Arabia', 'SAU', 'A1234567', '15/03/2030', '01/06/1985', 'M', '+966501234567', 'ahmed@example.com', 'Fatima Al-Farsi', '+966501234999', groupLeaders[0]?.groupId ?? 'GRP-01', '8500'];
    const csv = [headers, example].map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'manasikpro_pilgrim_import_template.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/20 backdrop-blur-sm fade-in">
      <div className="bg-card rounded-xl border border-border shadow-xl p-6 w-full max-w-2xl mx-4 slide-up max-h-[90vh] overflow-y-auto scrollbar-thin">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold text-foreground">Import Pilgrims from Excel</h2>
          <button onClick={handleClose} className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground transition-colors">
            <X size={16} />
          </button>
        </div>

        {!result && (
          <>
            <p className="text-sm text-muted-foreground mb-3">
              Upload an .xlsx, .xls or .csv file with one row per pilgrim, instead of adding them one by one.
            </p>
            <button onClick={downloadTemplate} className="text-xs text-primary hover:underline flex items-center gap-1 mb-4">
              <Download size={12} />
              Download a template file
            </button>

            {rows.length === 0 && groupLeaders.length > 0 && (
              <div className="mb-4">
                <label className="block text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">
                  Default group (used for rows without a Group ID column)
                </label>
                <select
                  value={fallbackGroupId}
                  onChange={(e) => setFallbackGroupId(e.target.value)}
                  className="w-full text-sm border border-border rounded-lg px-3 py-2 bg-input text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  {groupLeaders.map((gl) => (
                    <option key={gl.groupId} value={gl.groupId}>{gl.groupId} — {gl.name}</option>
                  ))}
                </select>
              </div>
            )}

            <div
              className="border-2 border-dashed border-border rounded-xl p-6 text-center mb-4 hover:border-primary/40 transition-colors cursor-pointer bg-muted/30"
              onClick={() => document.getElementById('import-file-input')?.click()}
            >
              <FileSpreadsheet size={32} className="text-muted-foreground mx-auto mb-2" />
              <p className="text-sm font-medium text-foreground">{parsing ? 'Reading file...' : 'Click to select a spreadsheet'}</p>
              <p className="text-xs text-muted-foreground mt-1">.xlsx, .xls or .csv</p>
              <input
                id="import-file-input"
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
                        <th className="text-left py-1.5 px-2">Name</th>
                        <th className="text-left py-1.5 px-2">Passport #</th>
                        <th className="text-left py-1.5 px-2">Group</th>
                        <th className="text-left py-1.5 px-2">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {rows.map((r) => (
                        <tr key={r.row} className="border-t border-border/50">
                          <td className="py-1.5 px-2 text-muted-foreground">{r.row}</td>
                          <td className="py-1.5 px-2 text-foreground">{r.name || '—'}</td>
                          <td className="py-1.5 px-2 font-mono-data text-foreground">{r.passportNumber || '—'}</td>
                          <td className="py-1.5 px-2 font-mono-data text-muted-foreground">{r.groupId || '—'}</td>
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
                  `Import ${validCount || ''} Pilgrims`.trim()
                )}
              </button>
            </div>
          </>
        )}

        {result && (
          <div>
            <div className="flex items-center gap-2 mb-4 text-sm">
              <CheckCircle2 size={16} className="text-[#16A34A]" />
              <span className="text-foreground font-medium">{result.createdCount} pilgrims imported successfully.</span>
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
