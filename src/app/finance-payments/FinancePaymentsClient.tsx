'use client';

import React, { useState } from 'react';
import { CreditCard, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import type { RecentPayment } from '@/lib/data/pilgrims';
import { useCurrency, CURRENCIES, toSar, type CurrencyCode } from '@/lib/currency';

const PAYMENT_METHODS = ['Cash', 'Bank Transfer', 'Card', 'Cheque', 'Other'];

interface Props {
  pilgrims: { id: string; name: string }[];
  initialPayments: RecentPayment[];
}

export default function FinancePaymentsClient({ pilgrims, initialPayments }: Props) {
  const { format } = useCurrency();
  const [payments, setPayments] = useState<RecentPayment[]>(initialPayments);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    pilgrimId: pilgrims[0]?.id ?? '',
    amount: '',
    currency: 'SAR' as CurrencyCode,
    method: PAYMENT_METHODS[0],
    paidOn: new Date().toISOString().slice(0, 10),
    reference: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.pilgrimId || !form.amount) {
      toast.error('Pilgrim and amount are required.');
      return;
    }
    setSaving(true);
    try {
      const sarAmount = toSar(Number(form.amount), form.currency);
      const res = await fetch('/api/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pilgrimId: form.pilgrimId,
          amount: sarAmount,
          method: form.method,
          paidOn: form.paidOn,
          reference: form.reference,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Failed to record payment');
      const pilgrimName = pilgrims.find((p) => p.id === form.pilgrimId)?.name ?? form.pilgrimId;
      setPayments((prev) => [
        {
          id: `TXN-${data.id}`,
          pilgrimId: form.pilgrimId,
          pilgrimName,
          amount: sarAmount,
          type: 'installment',
          date: form.paidOn,
          method: form.method,
          reference: form.reference,
        },
        ...prev,
      ]);
      setForm({ pilgrimId: pilgrims[0]?.id ?? '', amount: '', currency: 'SAR', method: PAYMENT_METHODS[0], paidOn: new Date().toISOString().slice(0, 10), reference: '' });
      toast.success('Payment recorded.');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to record payment.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <div className="mb-6 flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
          <CreditCard size={20} className="text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Payments</h1>
          <p className="text-sm text-muted-foreground mt-1">Record a payment received from a pilgrim</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[360px_1fr] gap-6">
        <div className="card-base h-fit">
          <h3 className="text-sm font-semibold text-foreground mb-4">Record Payment</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">Pilgrim</label>
              <select
                value={form.pilgrimId}
                onChange={(e) => setForm((prev) => ({ ...prev, pilgrimId: e.target.value }))}
                required
                className="w-full text-sm border border-border rounded-lg px-3 py-2 bg-input text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              >
                {pilgrims.map((p) => (
                  <option key={p.id} value={p.id}>{p.name} ({p.id})</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">Amount</label>
              <div className="flex gap-2">
                <select
                  value={form.currency}
                  onChange={(e) => setForm((prev) => ({ ...prev, currency: e.target.value as CurrencyCode }))}
                  className="text-sm border border-border rounded-lg px-2 py-2 bg-input text-foreground focus:outline-none focus:ring-2 focus:ring-ring w-24"
                >
                  {CURRENCIES.map((c) => (
                    <option key={c.code} value={c.code}>{c.symbol} {c.code}</option>
                  ))}
                </select>
                <input
                  type="number"
                  value={form.amount}
                  onChange={(e) => setForm((prev) => ({ ...prev, amount: e.target.value }))}
                  required
                  className="flex-1 text-sm border border-border rounded-lg px-3 py-2 bg-input text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">Payment method</label>
              <select
                value={form.method}
                onChange={(e) => setForm((prev) => ({ ...prev, method: e.target.value }))}
                className="w-full text-sm border border-border rounded-lg px-3 py-2 bg-input text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              >
                {PAYMENT_METHODS.map((m) => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">Date paid</label>
              <input
                type="date"
                value={form.paidOn}
                onChange={(e) => setForm((prev) => ({ ...prev, paidOn: e.target.value }))}
                required
                className="w-full text-sm border border-border rounded-lg px-3 py-2 bg-input text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">Reference / note (optional)</label>
              <input
                type="text"
                value={form.reference}
                onChange={(e) => setForm((prev) => ({ ...prev, reference: e.target.value }))}
                placeholder="e.g. Bank ref, cheque #"
                className="w-full text-sm border border-border rounded-lg px-3 py-2 bg-input text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <button type="submit" disabled={saving} className="btn-primary w-full justify-center" style={{ opacity: saving ? 0.7 : 1 }}>
              {saving ? <Loader2 size={14} className="animate-spin" /> : 'Record Payment'}
            </button>
          </form>
        </div>

        <div className="card-base">
          <h3 className="text-sm font-semibold text-foreground mb-4">Recent Payments</h3>
          <div className="overflow-x-auto scrollbar-thin">
            <table className="w-full text-sm min-w-[600px]">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  {['Pilgrim', 'Date', 'Method', 'Reference', 'Amount'].map((h) => (
                    <th key={h} className="text-left py-2.5 px-3 text-xs font-medium text-muted-foreground uppercase tracking-wide whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {payments.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-sm text-muted-foreground">No payments recorded yet.</td>
                  </tr>
                ) : (
                  payments.map((p) => (
                    <tr key={p.id} className="table-row-hover border-b border-border/50 last:border-0">
                      <td className="py-2.5 px-3">
                        <p className="font-medium text-foreground">{p.pilgrimName}</p>
                        <p className="text-xs font-mono-data text-muted-foreground">{p.pilgrimId}</p>
                      </td>
                      <td className="py-2.5 px-3 text-xs text-muted-foreground whitespace-nowrap">{p.date}</td>
                      <td className="py-2.5 px-3 text-xs text-muted-foreground capitalize">{p.method}</td>
                      <td className="py-2.5 px-3 font-mono-data text-xs text-muted-foreground">{p.reference || '—'}</td>
                      <td className="py-2.5 px-3 font-mono-data text-sm font-semibold text-foreground">{format(p.amount)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
