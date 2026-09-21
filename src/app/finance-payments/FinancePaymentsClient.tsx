'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { CreditCard, Loader2, History } from 'lucide-react';
import { toast } from 'sonner';
import type { RecentPayment, PaymentRecord } from '@/lib/data/pilgrims';
import { useCurrency, CURRENCIES, RATES, toSar, type CurrencyCode } from '@/lib/currency';

const PAYMENT_METHODS = ['Cash', 'Bank Transfer', 'Card', 'Cheque', 'Other'];

interface PilgrimOption {
  id: string;
  name: string;
  paymentTotal: number;
  paymentPaid: number;
  paymentStatus: string;
}

interface InvoiceOption {
  id: number;
  invoiceNumber: string;
  pilgrimId: string;
  amount: number;
  paidAmount: number;
}

interface Props {
  pilgrims: PilgrimOption[];
  initialPayments: RecentPayment[];
  invoices: InvoiceOption[];
}

export default function FinancePaymentsClient({ pilgrims: initialPilgrims, initialPayments, invoices }: Props) {
  const { format, currency: displayCurrency } = useCurrency();
  const [pilgrims, setPilgrims] = useState<PilgrimOption[]>(initialPilgrims);
  const [payments, setPayments] = useState<RecentPayment[]>(initialPayments);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    pilgrimId: initialPilgrims[0]?.id ?? '',
    type: 'payment' as 'payment' | 'refund',
    amount: '',
    currency: displayCurrency,
    method: PAYMENT_METHODS[0],
    paidOn: new Date().toISOString().slice(0, 10),
    reference: '',
    invoiceId: '',
  });

  const [history, setHistory] = useState<PaymentRecord[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  const selectedPilgrim = useMemo(() => pilgrims.find((p) => p.id === form.pilgrimId), [pilgrims, form.pilgrimId]);
  const remaining = selectedPilgrim ? Math.max(0, selectedPilgrim.paymentTotal - selectedPilgrim.paymentPaid) : 0;
  const enteredSar = form.amount ? toSar(Number(form.amount), form.currency) : 0;
  const remainingAfter = form.type === 'refund' ? remaining + enteredSar : Math.max(0, remaining - enteredSar);
  const pilgrimInvoices = useMemo(() => invoices.filter((i) => i.pilgrimId === form.pilgrimId), [invoices, form.pilgrimId]);

  useEffect(() => {
    if (!form.pilgrimId) return;
    setHistoryLoading(true);
    fetch(`/api/payments?pilgrimId=${encodeURIComponent(form.pilgrimId)}`)
      .then((res) => (res.ok ? res.json() : { payments: [] }))
      .then((data) => setHistory(data.payments ?? []))
      .catch(() => setHistory([]))
      .finally(() => setHistoryLoading(false));
  }, [form.pilgrimId]);

  const handleUseRemaining = () => {
    if (!selectedPilgrim) return;
    const amountInCurrency = Math.round(remaining * RATES[form.currency] * 100) / 100;
    setForm((prev) => ({ ...prev, amount: String(amountInCurrency) }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.pilgrimId || !form.amount) {
      toast.error('Pilgrim and amount are required.');
      return;
    }
    setSaving(true);
    try {
      const magnitude = toSar(Number(form.amount), form.currency);
      const sarAmount = form.type === 'refund' ? -magnitude : magnitude;
      const res = await fetch('/api/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pilgrimId: form.pilgrimId,
          amount: sarAmount,
          method: form.method,
          paidOn: form.paidOn,
          reference: form.reference,
          invoiceId: form.invoiceId ? Number(form.invoiceId) : undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Failed to record payment');
      const pilgrimName = pilgrims.find((p) => p.id === form.pilgrimId)?.name ?? form.pilgrimId;
      const invoiceNumber = form.invoiceId ? invoices.find((i) => i.id === Number(form.invoiceId))?.invoiceNumber ?? null : null;
      setPayments((prev) => [
        {
          id: `TXN-${data.id}`,
          pilgrimId: form.pilgrimId,
          pilgrimName,
          amount: sarAmount,
          type: form.type === 'refund' ? 'refund' : 'installment',
          date: form.paidOn,
          method: form.method,
          reference: form.reference,
          invoiceNumber,
        },
        ...prev,
      ]);
      setPilgrims((prev) => prev.map((p) => (p.id === form.pilgrimId ? { ...p, paymentPaid: p.paymentPaid + sarAmount } : p)));
      setHistory((prev) => [
        { id: data.id, date: form.paidOn, amount: sarAmount, method: form.method, reference: form.reference, status: 'cleared', invoiceId: form.invoiceId ? Number(form.invoiceId) : null, invoiceNumber },
        ...prev,
      ]);
      setForm((prev) => ({ ...prev, amount: '', reference: '', invoiceId: '' }));
      toast.success(form.type === 'refund' ? 'Refund recorded.' : 'Payment recorded.');
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
          <p className="text-sm text-muted-foreground mt-1">Record a payment or refund for a pilgrim</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[360px_1fr] gap-6">
        <div className="card-base h-fit">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-foreground">Record {form.type === 'refund' ? 'Refund' : 'Payment'}</h3>
            <div className="flex rounded-lg border border-border overflow-hidden text-xs">
              <button
                type="button"
                onClick={() => setForm((prev) => ({ ...prev, type: 'payment' }))}
                className={`px-2.5 py-1 ${form.type === 'payment' ? 'bg-primary text-primary-foreground' : 'bg-input text-muted-foreground'}`}
              >
                Payment
              </button>
              <button
                type="button"
                onClick={() => setForm((prev) => ({ ...prev, type: 'refund' }))}
                className={`px-2.5 py-1 ${form.type === 'refund' ? 'bg-[#DC2626] text-white' : 'bg-input text-muted-foreground'}`}
              >
                Refund
              </button>
            </div>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">Pilgrim</label>
              <select
                value={form.pilgrimId}
                onChange={(e) => setForm((prev) => ({ ...prev, pilgrimId: e.target.value, invoiceId: '' }))}
                required
                className="w-full text-sm border border-border rounded-lg px-3 py-2 bg-input text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              >
                {pilgrims.map((p) => {
                  const due = Math.max(0, p.paymentTotal - p.paymentPaid);
                  return (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.id}){p.paymentTotal > 0 ? ` — ${due > 0 ? `${format(due)} due` : 'fully paid'}` : ''}
                    </option>
                  );
                })}
              </select>
            </div>

            {selectedPilgrim && selectedPilgrim.paymentTotal > 0 && (
              <div className="rounded-lg border border-border bg-muted/30 p-3 space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Package price</span>
                  <span className="font-mono-data font-medium text-foreground">{format(selectedPilgrim.paymentTotal)}</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Already paid</span>
                  <span className="font-mono-data font-medium text-[#16A34A]">{format(selectedPilgrim.paymentPaid)}</span>
                </div>
                <div className="flex items-center justify-between text-xs pt-1.5 border-t border-border">
                  <span className="text-muted-foreground font-medium">Remaining</span>
                  <span className="font-mono-data font-semibold text-[#DC2626]">{format(remaining)}</span>
                </div>
                {remaining > 0 && form.type === 'payment' && (
                  <button type="button" onClick={handleUseRemaining} className="text-xs text-primary hover:underline pt-0.5">
                    Fill remaining balance
                  </button>
                )}
              </div>
            )}

            {pilgrimInvoices.length > 0 && (
              <div>
                <label className="block text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">Link to invoice (optional)</label>
                <select
                  value={form.invoiceId}
                  onChange={(e) => setForm((prev) => ({ ...prev, invoiceId: e.target.value }))}
                  className="w-full text-sm border border-border rounded-lg px-3 py-2 bg-input text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  <option value="">No invoice</option>
                  {pilgrimInvoices.map((inv) => (
                    <option key={inv.id} value={inv.id}>
                      {inv.invoiceNumber} — {format(Math.max(0, inv.amount - inv.paidAmount))} unpaid
                    </option>
                  ))}
                </select>
              </div>
            )}

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
                  min="0"
                  value={form.amount}
                  onChange={(e) => setForm((prev) => ({ ...prev, amount: e.target.value }))}
                  required
                  className="flex-1 text-sm border border-border rounded-lg px-3 py-2 bg-input text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
              {selectedPilgrim && selectedPilgrim.paymentTotal > 0 && form.amount && (
                <p className="text-xs text-muted-foreground mt-1.5">
                  Remaining {form.type === 'refund' ? 'after this refund' : 'after this payment'}: <span className="font-mono-data font-medium text-foreground">{format(remainingAfter)}</span>
                </p>
              )}
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
              <label className="block text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">Date {form.type === 'refund' ? 'refunded' : 'paid'}</label>
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
            <button
              type="submit"
              disabled={saving}
              className={`w-full justify-center flex items-center gap-1.5 rounded-lg py-2 text-sm font-medium ${form.type === 'refund' ? 'bg-[#DC2626] text-white hover:bg-[#B91C1C]' : 'btn-primary'}`}
              style={{ opacity: saving ? 0.7 : 1 }}
            >
              {saving ? <Loader2 size={14} className="animate-spin" /> : form.type === 'refund' ? 'Record Refund' : 'Record Payment'}
            </button>
          </form>
        </div>

        <div className="flex flex-col gap-6">
          {selectedPilgrim && (
            <div className="card-base">
              <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
                <History size={15} className="text-muted-foreground" />
                Payment History — {selectedPilgrim.name}
              </h3>
              <div className="overflow-x-auto scrollbar-thin">
                <table className="w-full text-sm min-w-[500px]">
                  <thead>
                    <tr className="border-b border-border bg-muted/30">
                      {['Date', 'Method', 'Reference', 'Invoice', 'Amount'].map((h) => (
                        <th key={h} className="text-left py-2 px-3 text-xs font-medium text-muted-foreground uppercase tracking-wide whitespace-nowrap">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {historyLoading ? (
                      <tr><td colSpan={5} className="py-8 text-center text-sm text-muted-foreground">Loading…</td></tr>
                    ) : history.length === 0 ? (
                      <tr><td colSpan={5} className="py-8 text-center text-sm text-muted-foreground">No payments recorded for this pilgrim yet.</td></tr>
                    ) : (
                      history.map((h) => (
                        <tr key={h.id} className="table-row-hover border-b border-border/50 last:border-0">
                          <td className="py-2 px-3 text-xs text-muted-foreground whitespace-nowrap">{h.date}</td>
                          <td className="py-2 px-3 text-xs text-muted-foreground capitalize">{h.method}</td>
                          <td className="py-2 px-3 font-mono-data text-xs text-muted-foreground">{h.reference || '—'}</td>
                          <td className="py-2 px-3 font-mono-data text-xs text-muted-foreground">{h.invoiceNumber ?? '—'}</td>
                          <td className={`py-2 px-3 font-mono-data text-sm font-semibold ${h.amount < 0 ? 'text-[#DC2626]' : 'text-foreground'}`}>
                            {h.amount < 0 ? `(${format(Math.abs(h.amount))})` : format(h.amount)}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

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
                        <td className={`py-2.5 px-3 font-mono-data text-sm font-semibold ${p.amount < 0 ? 'text-[#DC2626]' : 'text-foreground'}`}>
                          {p.amount < 0 ? `(${format(Math.abs(p.amount))})` : format(p.amount)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
