'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { ScanLine, Loader2, CheckCircle2, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';
import type { GroupLeader } from '@/lib/mockData';
import { parsePassportMrz } from '@/lib/ocr/parseMrz';

interface ScannedEntry {
  id: string;
  name: string;
  passportNumber: string;
}

export default function PassportScanningClient({ groupLeaders }: { groupLeaders: GroupLeader[] }) {
  const [groupId, setGroupId] = useState(groupLeaders[0]?.groupId ?? '');
  const [ocrFile, setOcrFile] = useState<File | null>(null);
  const [ocrPreviewUrl, setOcrPreviewUrl] = useState<string | null>(null);
  const [scanning, setScanning] = useState(false);
  const [recent, setRecent] = useState<ScannedEntry[]>([]);

  const handleFileChange = (file: File | null) => {
    setOcrFile(file);
    setOcrPreviewUrl(file ? URL.createObjectURL(file) : null);
  };

  const resetFile = () => {
    setOcrFile(null);
    setOcrPreviewUrl(null);
  };

  const handleScan = async () => {
    if (!ocrFile) {
      toast.error('Select a passport photo first.');
      return;
    }
    if (!groupId) {
      toast.error('No group available — create a group leader first.');
      return;
    }
    setScanning(true);
    try {
      const { default: Tesseract } = await import('tesseract.js');
      const result = await Tesseract.recognize(ocrFile, 'eng');
      const parsed = parsePassportMrz(result.data.text);
      const fullName = [parsed.givenNames, parsed.surname].filter(Boolean).join(' ').trim();

      if (!fullName || !parsed.passportNumber) {
        toast.error("Couldn't read the MRZ strip clearly. Try a sharper photo, or add this pilgrim manually from Pilgrim Management.");
        return;
      }

      const res = await fetch('/api/pilgrims/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: fullName,
          nationalityCode: parsed.nationalityCode,
          passportNumber: parsed.passportNumber,
          passportExpiry: parsed.passportExpiry,
          dateOfBirth: parsed.dateOfBirth,
          gender: parsed.gender ?? 'M',
          groupId,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Failed to save pilgrim');

      toast.success(`${fullName} auto-registered as ${data.id}. Add phone/email from their profile when you get a chance.`);
      setRecent((prev) => [{ id: data.id, name: fullName, passportNumber: parsed.passportNumber! }, ...prev]);
      resetFile();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Scan failed.');
    } finally {
      setScanning(false);
    }
  };

  return (
    <div>
      <div className="mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <ScanLine size={20} className="text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold text-foreground">Passport Scanning</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Scan a passport and the pilgrim is registered automatically — no extra clicks. Fill in contact details later.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 card-base">
          <label className="block text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">Group</label>
          <select
            value={groupId}
            onChange={(e) => setGroupId(e.target.value)}
            className="w-full text-sm border border-border rounded-lg px-3 py-2 bg-input text-foreground focus:outline-none focus:ring-2 focus:ring-ring mb-4"
          >
            {groupLeaders.map((gl) => (
              <option key={gl.groupId} value={gl.groupId}>{gl.groupId} — {gl.name}</option>
            ))}
          </select>

          <div
            className="border-2 border-dashed border-border rounded-xl p-8 text-center hover:border-primary/40 transition-colors cursor-pointer bg-muted/30"
            onClick={() => document.getElementById('scan-file-input')?.click()}
          >
            {ocrPreviewUrl ? (
              <img src={ocrPreviewUrl} alt="Passport preview" className="max-h-48 mx-auto rounded mb-2" />
            ) : (
              <ScanLine size={36} className="text-muted-foreground mx-auto mb-2" />
            )}
            <p className="text-sm font-medium text-foreground">{ocrFile ? ocrFile.name : 'Drop passport image here or click to browse'}</p>
            <p className="text-xs text-muted-foreground mt-1">JPG or PNG — max 10MB · runs entirely in your browser</p>
            <input
              id="scan-file-input"
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => handleFileChange(e.target.files?.[0] ?? null)}
            />
          </div>

          <button
            onClick={handleScan}
            disabled={scanning || !ocrFile || !groupId}
            className="btn-primary w-full justify-center mt-4"
            style={{ opacity: scanning || !ocrFile || !groupId ? 0.6 : 1 }}
          >
            {scanning ? (
              <>
                <Loader2 size={14} className="animate-spin" />
                Reading &amp; saving...
              </>
            ) : (
              <>
                <ScanLine size={14} />
                Scan &amp; Register Automatically
              </>
            )}
          </button>
        </div>

        <div className="card-base">
          <h3 className="text-sm font-semibold text-foreground mb-3">Just scanned</h3>
          {recent.length === 0 ? (
            <p className="text-xs text-muted-foreground">Scanned pilgrims from this session will appear here.</p>
          ) : (
            <ul className="space-y-2">
              {recent.map((r) => (
                <li key={r.id} className="flex items-center justify-between gap-2 px-3 py-2 rounded-lg bg-muted/30 border border-border">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground truncate flex items-center gap-1.5">
                      <CheckCircle2 size={13} className="text-[#16A34A] flex-shrink-0" />
                      {r.name}
                    </p>
                    <p className="text-xs font-mono-data text-muted-foreground">{r.id} · {r.passportNumber}</p>
                  </div>
                  <Link href={`/pilgrim-profile/${r.id}`} className="p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-primary flex-shrink-0" title="Complete profile">
                    <ExternalLink size={14} />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
