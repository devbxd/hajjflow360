'use client';

import React from 'react';
import { Download, CreditCard, Search } from 'lucide-react';
import type { CampaignStats } from '@/lib/data/campaign';
import type { PaymentRow } from '../paymentRows';
import { useCurrency } from '@/lib/currency';

interface PaymentHeaderProps {
  stats: CampaignStats;
  search: string;
  filterStatus: string;
  onSearchChange: (q: string) => void;
  onFilterChange: (f: string) => void;
  exportRows: PaymentRow[];
}

const STATUS_LABEL: Record<PaymentRow['paymentStatus'], string> = {
  paid: 'Paid',
  partial: 'Partial',
  overdue: 'Overdue',
  pending: 'Pending',
};

export default function PaymentHeader({ stats: campaignStats, search, filterStatus, onSearchChange, onFilterChange, exportRows }: PaymentHeaderProps) {
  const { convert, symbol, currency } = useCurrency();
  const money = (amount: number) => `${currency === 'SAR' ? 'SAR ' : symbol}${(convert(amount) / 1_000_000).toFixed(2)}M`;
  const collectionRate = campaignStats.totalRevenue > 0 ? Math.round((campaignStats.collectedRevenue / campaignStats.totalRevenue) * 100) : 0;

  const handleExport = () => {
    if (exportRows.length === 0) {
      return;
    }
    const csvRows = [
      ['Pilgrim ID', 'Name', 'Total (SAR)', 'Paid (SAR)', 'Balance (SAR)', 'Status', 'Group Leader'],
      ...exportRows.map((r) => [
        r.id,
        r.name,
        String(r.paymentTotal),
        String(r.paymentPaid),
        String(r.balance),
        STATUS_LABEL[r.paymentStatus],
        r.groupLeader,
      ]),
    ];
    const csv = csvRows.map((r) => r.map((cell) => `"${cell.replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'manasikpro_payments.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="border-b border-border bg-card px-6 py-4">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <CreditCard size={20} className="text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-foreground">Payment Management</h1>
            <p className="text-sm text-muted-foreground">
              Collection rate{' '}
              <span className="font-semibold text-primary">{collectionRate}%</span> ·{' '}
              {money(campaignStats.collectedRevenue)} collected of {money(campaignStats.totalRevenue)} total
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search pilgrim…"
              value={search}
              onChange={(e) => onSearchChange(e.target.value)}
              className="pl-8 pr-3 py-2 text-sm bg-muted border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30 w-48"
            />
          </div>
          <select
            value={filterStatus}
            onChange={(e) => onFilterChange(e.target.value)}
            className="px-3 py-2 text-sm bg-muted border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30"
          >
            <option value="all">All Statuses</option>
            <option value="paid">Paid</option>
            <option value="partial">Partial</option>
            <option value="overdue">Overdue</option>
            <option value="pending">Pending</option>
          </select>
          <button onClick={handleExport} disabled={exportRows.length === 0} className="btn-primary" style={{ opacity: exportRows.length === 0 ? 0.5 : 1 }}>
            <Download size={14} />
            Export CSV ({exportRows.length})
          </button>
        </div>
      </div>
    </div>
  );
}
