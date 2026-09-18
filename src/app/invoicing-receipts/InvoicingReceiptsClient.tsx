'use client';

import React, { useMemo, useState } from 'react';
import { Receipt, Search, Printer, FileText, PlusCircle, Loader2, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import type { RecentPayment } from '@/lib/data/pilgrims';
import type { Invoice } from '@/lib/data/invoices';
import { useCurrency } from '@/lib/currency';
import StatusBadge, { type StatusType } from '@/components/ui/StatusBadge';

function openReceipt(payment: RecentPayment) {
  const html = `<!doctype html>
<html>
<head>
<title>Receipt ${payment.id}</title>
<style>
  body { font-family: -apple-system, Segoe UI, Arial, sans-serif; color: #1F1B16; max-width: 480px; margin: 40px auto; padding: 0 20px; }
  h1 { font-size: 18px; margin-bottom: 4px; }
  .muted { color: #6B6560; font-size: 13px; }
  table { width: 100%; border-collapse: collapse; margin-top: 24px; }
  td { padding: 8px 0; font-size: 14px; border-bottom: 1px solid #E5E1DA; }
  td:last-child { text-align: right; font-weight: 600; }
  .total { font-size: 18px; font-weight: 700; color: #1B6B4A; }
</style>
</head>
<body>
  <h1>ManasikPro — Payment Receipt</h1>
  <p class="muted">Hajj 2027 Campaign</p>
  <table>
    <tr><td>Receipt #</td><td>${payment.id}</td></tr>
    <tr><td>Pilgrim</td><td>${payment.pilgrimName} (${payment.pilgrimId})</td></tr>
    <tr><td>Date</td><td>${payment.date}</td></tr>
    <tr><td>Method</td><td>${payment.method}</td></tr>
    <tr><td>Reference</td><td>${payment.reference}</td></tr>
    <tr><td>Type</td><td>${payment.type === 'full' ? 'Full payment' : 'Installment'}</td></tr>
    <tr><td>Amount</td><td class="total">SAR ${payment.amount.toLocaleString()}</td></tr>
  </table>
</body>
</html>`;
  const win = window.open('', '_blank', 'width=560,height=700');
  if (!win) return;
  win.document.write(html);
  win.document.close();
  win.focus();
  win.print();
}

function openInvoice(invoice: Invoice) {
  const html = `<!doctype html>
<html>
<head>
<title>${invoice.invoiceNumber}</title>
<style>
  body { font-family: -apple-system, Segoe UI, Arial, sans-serif; color: #1F1B16; max-width: 480px; margin: 40px auto; padding: 0 20px; }
  h1 { font-size: 18px; margin-bottom: 4px; }
  .muted { color: #6B6560; font-size: 13px; }
  table { width: 100%; border-collapse: collapse; margin-top: 24px; }
  td { padding: 8px 0; font-size: 14px; border-bottom: 1px solid #E5E1DA; }
  td:last-child { text-align: right; font-weight: 600; }
  .total { font-size: 18px; font-weight: 700; color: #1B6B4A; }
</style>
</head>
<body>
  <h1>ManasikPro — Invoice</h1>
  <p class="muted">Hajj 2027 Campaign</p>
  <table>
    <tr><td>Invoice #</td><td>${invoice.invoiceNumber}</td></tr>
    <tr><td>Pilgrim</td><td>${invoice.pilgrimName} (${invoice.pilgrimId})</td></tr>
    <tr><td>Description</td><td>${invoice.description}</td></tr>
    <tr><td>Issue date</td><td>${invoice.issueDate}</td></tr>
    <tr><td>Due date</td><td>${invoice.dueDate ?? '—'}</td></tr>
    <tr><td>Status</td><td>${invoice.status}</td></tr>
    <tr><td>Amount</td><td class="total">SAR ${invoice.amount.toLocaleString()}</td></tr>
  </table>
</body>
</html>`;
  const win = window.open('', '_blank', 'width=560,height=700');
  if (!win) return;
  win.document.write(html);
  win.document.close();
  win.focus();
  win.print();
}

const invoiceStatusMap: Record<Invoice['status'], StatusType> = {
  unpaid: 'pending',
  paid: 'paid',
  cancelled: 'rejected',
};

interface Props {
  payments: RecentPayment[];
  initialInvoices: Invoice[];
  pilgrims: { id: string; name: string }[];
}

export default function InvoicingReceiptsClient({ payments, initialInvoices, pilgrims }: Props) {
  const { format } = useCurrency();
  const [search, setSearch] = useState('');
  const [invoices, setInvoices] = useState<Invoice[]>(initialInvoices);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    pilgrimId: pilgrims[0]?.id ?? '',
    description: '',
    amount: '',
    issueDate: new Date().toISOString().slice(0, 10),
    dueDate: '',
  });

  const filtered = useMemo(() => {
    if (!search) return payments;
    const q = search.toLowerCase();
    return payments.filter(
      (p) => p.pilgrimName.toLowerCase().includes(q) || p.pilgrimId.toLowerCase().includes(q) || p.reference.toLowerCase().includes(q) || p.id.toLowerCase().includes(q)
    );
  }, [payments, search]);

  const totalAmount = filtered.reduce((sum, p) => sum + p.amount, 0);

  const handleCreateInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.pilgrimId || !form.description || !form.amount) {
      toast.error('Pilgrim, description and amount are required.');
      return;
    }
    setSaving(true);
    try {
      const res = await fetch('/api/invoices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, amount: Number(form.amount), dueDate: form.dueDate || undefined }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Failed to create invoice');
      const pilgrimName = pilgrims.find((p) => p.id === form.pilgrimId)?.name ?? form.pilgrimId;
      setInvoices((prev) => [
        {
          id: data.id,
          invoiceNumber: data.invoiceNumber,
          pilgrimId: form.pilgrimId,
          pilgrimName,
          description: form.description,
          amount: Number(form.amount),
          status: 'unpaid',
          issueDate: form.issueDate,
          dueDate: form.dueDate || null,
          createdAt: new Date().toISOString(),
        },
        ...prev,
      ]);
      setForm({ pilgrimId: pilgrims[0]?.id ?? '', description: '', amount: '', issueDate: new Date().toISOString().slice(0, 10), dueDate: '' });
      setShowForm(false);
      toast.success(`Invoice ${data.invoiceNumber} created.`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to create invoice.');
    } finally {
      setSaving(false);
    }
  };

  const handleStatusChange = async (invoice: Invoice, status: Invoice['status']) => {
    try {
      const res = await fetch(`/api/invoices/${invoice.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error();
      setInvoices((prev) => prev.map((i) => (i.id === invoice.id ? { ...i, status } : i)));
      toast.success('Invoice updated.');
    } catch {
      toast.error('Failed to update invoice.');
    }
  };

  const handleDeleteInvoice = async (id: number) => {
    try {
      const res = await fetch(`/api/invoices/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error();
      setInvoices((prev) => prev.filter((i) => i.id !== id));
      toast.success('Invoice removed.');
    } catch {
      toast.error('Failed to remove invoice.');
    }
  };

  return (
    <div>
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <Receipt size={20} className="text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold text-foreground">Invoicing &amp; Receipts</h1>
            <p className="text-sm text-muted-foreground mt-1">Create invoices and print payment receipts</p>
          </div>
        </div>
        <button onClick={() => setShowForm(true)} className="btn-primary text-sm flex items-center gap-1.5">
          <PlusCircle size={14} />
          Create Invoice
        </button>
      </div>

      <div className="card-base mb-6">
        <h3 className="text-sm font-semibold text-foreground mb-4">Invoices</h3>
        <div className="overflow-x-auto scrollbar-thin">
          <table className="w-full text-sm min-w-[800px]">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                {['Invoice #', 'Pilgrim', 'Description', 'Due', 'Amount', 'Status', ''].map((h) => (
                  <th key={h} className="text-left py-2.5 px-3 text-xs font-medium text-muted-foreground uppercase tracking-wide whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {invoices.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-sm text-muted-foreground">No invoices yet — create one to bill a pilgrim.</td>
                </tr>
              ) : (
                invoices.map((inv) => (
                  <tr key={inv.id} className="table-row-hover border-b border-border/50 last:border-0">
                    <td className="py-2.5 px-3 font-mono-data text-xs text-foreground">{inv.invoiceNumber}</td>
                    <td className="py-2.5 px-3">
                      <p className="font-medium text-foreground">{inv.pilgrimName}</p>
                      <p className="text-xs font-mono-data text-muted-foreground">{inv.pilgrimId}</p>
                    </td>
                    <td className="py-2.5 px-3 text-xs text-muted-foreground">{inv.description}</td>
                    <td className="py-2.5 px-3 text-xs text-muted-foreground whitespace-nowrap">{inv.dueDate ?? '—'}</td>
                    <td className="py-2.5 px-3 font-mono-data text-sm font-semibold text-foreground">{format(inv.amount)}</td>
                    <td className="py-2.5 px-3">
                      <select
                        value={inv.status}
                        onChange={(e) => handleStatusChange(inv, e.target.value as Invoice['status'])}
                        className="text-xs border border-border rounded-md px-1.5 py-1 bg-input text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                      >
                        <option value="unpaid">Unpaid</option>
                        <option value="paid">Paid</option>
                        <option value="cancelled">Cancelled</option>
                      </select>
                      <span className="ml-2 align-middle">
                        <StatusBadge status={invoiceStatusMap[inv.status]} size="sm" showIcon={false} />
                      </span>
                    </td>
                    <td className="py-2.5 px-3">
                      <div className="flex items-center gap-1">
                        <button onClick={() => openInvoice(inv)} className="p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-primary" title="Print invoice">
                          <FileText size={14} />
                        </button>
                        <button onClick={() => handleDeleteInvoice(inv.id)} className="p-1.5 rounded hover:bg-[#FEF2F2] text-muted-foreground hover:text-[#DC2626]" title="Remove invoice">
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-foreground">Receipts</h3>
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search receipts..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8 pr-3 py-2 text-sm bg-muted border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30 w-56"
          />
        </div>
      </div>

      <div className="card-base">
        <p className="text-xs text-muted-foreground mb-3">{filtered.length} receipts · {format(totalAmount)} total</p>
        <div className="overflow-x-auto scrollbar-thin">
          <table className="w-full text-sm min-w-[800px]">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                {['Receipt #', 'Pilgrim', 'Date', 'Method', 'Reference', 'Type', 'Amount', ''].map((h) => (
                  <th key={h} className="text-left py-2.5 px-3 text-xs font-medium text-muted-foreground uppercase tracking-wide whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-sm text-muted-foreground">No receipts yet — payments will show up here once recorded.</td>
                </tr>
              ) : (
                filtered.map((p) => (
                  <tr key={p.id} className="table-row-hover border-b border-border/50 last:border-0">
                    <td className="py-2.5 px-3 font-mono-data text-xs text-foreground">{p.id}</td>
                    <td className="py-2.5 px-3">
                      <p className="font-medium text-foreground">{p.pilgrimName}</p>
                      <p className="text-xs font-mono-data text-muted-foreground">{p.pilgrimId}</p>
                    </td>
                    <td className="py-2.5 px-3 text-xs text-muted-foreground whitespace-nowrap">{p.date}</td>
                    <td className="py-2.5 px-3 text-xs text-muted-foreground capitalize">{p.method}</td>
                    <td className="py-2.5 px-3 font-mono-data text-xs text-muted-foreground">{p.reference}</td>
                    <td className="py-2.5 px-3 text-xs text-muted-foreground capitalize">{p.type}</td>
                    <td className="py-2.5 px-3 font-mono-data text-sm font-semibold text-foreground">{format(p.amount)}</td>
                    <td className="py-2.5 px-3">
                      <button onClick={() => openReceipt(p)} className="p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-primary" title="Print receipt">
                        <Printer size={14} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/20 backdrop-blur-sm fade-in">
          <div className="bg-card rounded-xl border border-border shadow-xl p-6 w-full max-w-md mx-4 slide-up">
            <h2 className="text-base font-semibold text-foreground mb-4">Create Invoice</h2>
            <form onSubmit={handleCreateInvoice} className="space-y-4">
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
                <label className="block text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">Description</label>
                <input
                  type="text"
                  value={form.description}
                  onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
                  placeholder="e.g. Hajj package balance"
                  required
                  className="w-full text-sm border border-border rounded-lg px-3 py-2 bg-input text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">Amount (SAR)</label>
                  <input
                    type="number"
                    value={form.amount}
                    onChange={(e) => setForm((prev) => ({ ...prev, amount: e.target.value }))}
                    required
                    className="w-full text-sm border border-border rounded-lg px-3 py-2 bg-input text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">Issue date</label>
                  <input
                    type="date"
                    value={form.issueDate}
                    onChange={(e) => setForm((prev) => ({ ...prev, issueDate: e.target.value }))}
                    required
                    className="w-full text-sm border border-border rounded-lg px-3 py-2 bg-input text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">Due date (optional)</label>
                <input
                  type="date"
                  value={form.dueDate}
                  onChange={(e) => setForm((prev) => ({ ...prev, dueDate: e.target.value }))}
                  className="w-full text-sm border border-border rounded-lg px-3 py-2 bg-input text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowForm(false)} className="btn-secondary flex-1 justify-center">Cancel</button>
                <button type="submit" disabled={saving} className="btn-primary flex-1 justify-center" style={{ opacity: saving ? 0.7 : 1 }}>
                  {saving ? <Loader2 size={14} className="animate-spin" /> : 'Create Invoice'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
