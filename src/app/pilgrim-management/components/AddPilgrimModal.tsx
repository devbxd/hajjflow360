'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { X, ScanLine, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import type { GroupLeader } from '@/lib/mockData';
import { parsePassportMrz } from '@/lib/ocr/parseMrz';

interface FormState {
  name: string;
  nationality: string;
  nationalityCode: string;
  passportNumber: string;
  passportExpiry: string;
  dateOfBirth: string;
  gender: 'M' | 'F';
  phone: string;
  email: string;
  emergencyContact: string;
  emergencyPhone: string;
  groupId: string;
  paymentTotal: string;
}

const EMPTY_FORM = (defaultGroupId: string): FormState => ({
  name: '',
  nationality: '',
  nationalityCode: '',
  passportNumber: '',
  passportExpiry: '',
  dateOfBirth: '',
  gender: 'M',
  phone: '',
  email: '',
  emergencyContact: '',
  emergencyPhone: '',
  groupId: defaultGroupId,
  paymentTotal: '',
});

interface AddPilgrimModalProps {
  open: boolean;
  onClose: () => void;
  startWithScan: boolean;
  groupLeaders: GroupLeader[];
}

export default function AddPilgrimModal({ open, onClose, startWithScan, groupLeaders }: AddPilgrimModalProps) {
  const router = useRouter();
  const defaultGroupId = groupLeaders[0]?.groupId ?? '';
  const [step, setStep] = useState<'scan' | 'form'>(startWithScan ? 'scan' : 'form');
  const [ocrFile, setOcrFile] = useState<File | null>(null);
  const [ocrPreviewUrl, setOcrPreviewUrl] = useState<string | null>(null);
  const [scanning, setScanning] = useState(false);
  const [fromScan, setFromScan] = useState(false);
  const [form, setForm] = useState<FormState>(EMPTY_FORM(defaultGroupId));
  const [saving, setSaving] = useState(false);

  if (!open) return null;

  const reset = () => {
    setStep(startWithScan ? 'scan' : 'form');
    setOcrFile(null);
    setOcrPreviewUrl(null);
    setFromScan(false);
    setForm(EMPTY_FORM(defaultGroupId));
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const handleFileChange = (file: File | null) => {
    setOcrFile(file);
    setOcrPreviewUrl(file ? URL.createObjectURL(file) : null);
  };

  const handleScan = async () => {
    if (!ocrFile) {
      toast.error('Please select a passport image first');
      return;
    }
    setScanning(true);
    try {
      const { default: Tesseract } = await import('tesseract.js');
      const result = await Tesseract.recognize(ocrFile, 'eng');
      const parsed = parsePassportMrz(result.data.text);

      const fullName = [parsed.givenNames, parsed.surname].filter(Boolean).join(' ').trim();
      setForm((prev) => ({
        ...prev,
        name: fullName || prev.name,
        nationalityCode: parsed.nationalityCode ?? prev.nationalityCode,
        passportNumber: parsed.passportNumber ?? prev.passportNumber,
        passportExpiry: parsed.passportExpiry ?? prev.passportExpiry,
        dateOfBirth: parsed.dateOfBirth ?? prev.dateOfBirth,
        gender: parsed.gender ?? prev.gender,
      }));
      setFromScan(true);

      if (Object.keys(parsed).length === 0) {
        toast.error("Couldn't read the MRZ strip clearly — fill the fields in manually below.");
      } else {
        toast.success('Passport scanned — please double-check every field before saving.');
      }
      setStep('form');
    } catch {
      toast.error('Scan failed. You can still fill the form in manually.');
      setStep('form');
    } finally {
      setScanning(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch('/api/pilgrims', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, paymentTotal: Number(form.paymentTotal) || 0, fromOcrScan: fromScan }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Failed to create pilgrim');
      toast.success(`${form.name} registered as ${data.id}`);
      router.refresh();
      handleClose();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to create pilgrim.');
    } finally {
      setSaving(false);
    }
  };

  const field = (key: keyof FormState, label: string, type = 'text', required = true) => (
    <div>
      <label className="block text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">{label}</label>
      <input
        type={type}
        value={form[key]}
        onChange={(e) => setForm((prev) => ({ ...prev, [key]: e.target.value }))}
        required={required}
        className="w-full text-sm border border-border rounded-lg px-3 py-2 bg-input text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
      />
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/20 backdrop-blur-sm fade-in">
      <div className="bg-card rounded-xl border border-border shadow-xl p-6 w-full max-w-lg mx-4 slide-up max-h-[90vh] overflow-y-auto scrollbar-thin">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold text-foreground">
            {step === 'scan' ? 'Passport OCR Scanner' : 'Register Pilgrim'}
          </h2>
          <button onClick={handleClose} className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground transition-colors">
            <X size={16} />
          </button>
        </div>

        {step === 'scan' ? (
          <>
            <p className="text-sm text-muted-foreground mb-4">
              Upload a clear photo of the passport's bottom strip (the two lines of letters/numbers/&lt;). Runs
              entirely in your browser — free, no data leaves your computer.
            </p>
            <div
              className="border-2 border-dashed border-border rounded-xl p-6 text-center mb-4 hover:border-primary/40 transition-colors cursor-pointer bg-muted/30"
              onClick={() => document.getElementById('ocr-file-input')?.click()}
            >
              {ocrPreviewUrl ? (
                <img src={ocrPreviewUrl} alt="Passport preview" className="max-h-40 mx-auto rounded mb-2" />
              ) : (
                <ScanLine size={32} className="text-muted-foreground mx-auto mb-2" />
              )}
              <p className="text-sm font-medium text-foreground">{ocrFile ? ocrFile.name : 'Drop passport image here'}</p>
              <p className="text-xs text-muted-foreground mt-1">JPG or PNG — max 10MB</p>
              <input
                id="ocr-file-input"
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => handleFileChange(e.target.files?.[0] ?? null)}
              />
            </div>
            <div className="flex gap-3">
              <button onClick={() => setStep('form')} className="btn-secondary flex-1 justify-center">
                Skip — enter manually
              </button>
              <button onClick={handleScan} disabled={scanning || !ocrFile} className="btn-primary flex-1 justify-center" style={{ opacity: scanning || !ocrFile ? 0.6 : 1 }}>
                {scanning ? (
                  <>
                    <Loader2 size={14} className="animate-spin" />
                    Reading passport...
                  </>
                ) : (
                  <>
                    <ScanLine size={14} />
                    Scan Passport
                  </>
                )}
              </button>
            </div>
          </>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {fromScan && (
              <p className="text-xs text-[#D97706] bg-[#FFFBEB] border border-[#D97706]/20 rounded-lg px-3 py-2">
                Fields below came from an automatic scan — double-check every one against the actual passport before saving.
              </p>
            )}
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">{field('name', 'Full Name')}</div>
              {field('nationality', 'Nationality')}
              {field('nationalityCode', 'Country Code')}
              {field('passportNumber', 'Passport Number')}
              {field('passportExpiry', 'Passport Expiry (DD/MM/YYYY)')}
              {field('dateOfBirth', 'Date of Birth (DD/MM/YYYY)')}
              <div>
                <label className="block text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">Gender</label>
                <select
                  value={form.gender}
                  onChange={(e) => setForm((prev) => ({ ...prev, gender: e.target.value as 'M' | 'F' }))}
                  className="w-full text-sm border border-border rounded-lg px-3 py-2 bg-input text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  <option value="M">Male</option>
                  <option value="F">Female</option>
                </select>
              </div>
              {field('phone', 'Phone')}
              {field('email', 'Email', 'email')}
              {field('emergencyContact', 'Emergency Contact Name')}
              {field('emergencyPhone', 'Emergency Contact Phone')}
              <div>
                <label className="block text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">Group</label>
                <select
                  value={form.groupId}
                  onChange={(e) => setForm((prev) => ({ ...prev, groupId: e.target.value }))}
                  className="w-full text-sm border border-border rounded-lg px-3 py-2 bg-input text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  {groupLeaders.map((gl) => (
                    <option key={gl.groupId} value={gl.groupId}>{gl.groupId} — {gl.name}</option>
                  ))}
                </select>
              </div>
              {field('paymentTotal', 'Package Price (SAR)', 'number')}
            </div>
            <div className="flex gap-3 pt-2">
              <button type="button" onClick={handleClose} className="btn-secondary flex-1 justify-center">
                Cancel
              </button>
              <button type="submit" disabled={saving} className="btn-primary flex-1 justify-center" style={{ opacity: saving ? 0.7 : 1 }}>
                {saving ? 'Saving...' : 'Register Pilgrim'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
