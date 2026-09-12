'use client';

import React, { useMemo, useState } from 'react';
import { Receipt, Search, Printer } from 'lucide-react';
import type { RecentPayment } from '@/lib/data/pilgrims';
import { useCurrency } from '@/lib/currency';

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

export default function InvoicingReceiptsClient({ payments }: { payments: RecentPayment[] }) {
  const { format } = useCurrency();
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    if (!search) return payments;
    const q = search.toLowerCase();
    return payments.filter(
      (p) => p.pilgrimName.toLowerCase().includes(q) || p.pilgrimId.toLowerCase().includes(q) || p.reference.toLowerCase().includes(q) || p.id.toLowerCase().includes(q)
    );
  }, [payments, search]);

  const totalAmount = filtered.reduce((sum, p) => sum + p.amount, 0);

  return (
    <div>
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <Receipt size={20} className="text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold text-foreground">Invoicing &amp; Receipts</h1>
            <p className="text-sm text-muted-foreground mt-1">{filtered.length} receipts · {format(totalAmount)} total</p>
          </div>
        </div>
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
    </div>
  );
}
