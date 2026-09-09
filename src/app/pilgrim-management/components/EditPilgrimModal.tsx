'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { X } from 'lucide-react';
import { toast } from 'sonner';
import type { GroupLeader, Pilgrim } from '@/lib/mockData';

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

function toForm(p: Pilgrim): FormState {
  return {
    name: p.name,
    nationality: p.nationality,
    nationalityCode: p.nationalityCode,
    passportNumber: p.passportNumber,
    passportExpiry: p.passportExpiry,
    dateOfBirth: p.dateOfBirth,
    gender: p.gender,
    phone: p.phone,
    email: p.email,
    emergencyContact: p.emergencyContact,
    emergencyPhone: p.emergencyPhone,
    groupId: p.groupId,
    paymentTotal: String(p.paymentTotal),
  };
}

interface Props {
  pilgrim: Pilgrim | null;
  onClose: () => void;
  groupLeaders: GroupLeader[];
}

export default function EditPilgrimModal({ pilgrim, onClose, groupLeaders }: Props) {
  const router = useRouter();
  const [form, setForm] = useState<FormState | null>(pilgrim ? toForm(pilgrim) : null);
  const [saving, setSaving] = useState(false);

  if (!pilgrim || !form) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch(`/api/pilgrims/${pilgrim.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, paymentTotal: Number(form.paymentTotal) || 0 }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Failed to update pilgrim');
      toast.success(`${form.name} updated`);
      router.refresh();
      onClose();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to update pilgrim.');
    } finally {
      setSaving(false);
    }
  };

  const field = (key: keyof FormState, label: string, type = 'text') => (
    <div>
      <label className="block text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">{label}</label>
      <input
        type={type}
        value={form[key]}
        onChange={(e) => setForm((prev) => (prev ? { ...prev, [key]: e.target.value } : prev))}
        required
        className="w-full text-sm border border-border rounded-lg px-3 py-2 bg-input text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
      />
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/20 backdrop-blur-sm fade-in">
      <div className="bg-card rounded-xl border border-border shadow-xl p-6 w-full max-w-lg mx-4 slide-up max-h-[90vh] overflow-y-auto scrollbar-thin">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold text-foreground">Edit {pilgrim.id}</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground transition-colors">
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
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
                onChange={(e) => setForm((prev) => (prev ? { ...prev, gender: e.target.value as 'M' | 'F' } : prev))}
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
                onChange={(e) => setForm((prev) => (prev ? { ...prev, groupId: e.target.value } : prev))}
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
            <button type="button" onClick={onClose} className="btn-secondary flex-1 justify-center">Cancel</button>
            <button type="submit" disabled={saving} className="btn-primary flex-1 justify-center" style={{ opacity: saving ? 0.7 : 1 }}>
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
