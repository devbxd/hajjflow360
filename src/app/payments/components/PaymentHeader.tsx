'use client';

import React, { useState } from 'react';
import { Download, CreditCard, Search } from 'lucide-react';
import { campaignStats } from '@/lib/mockData';

interface PaymentHeaderProps {
  onSearch?: (q: string) => void;
  onFilter?: (f: string) => void;
}

export default function PaymentHeader({ onSearch, onFilter }: PaymentHeaderProps) {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');

  const collectionRate = Math.round((campaignStats.collectedRevenue / campaignStats.totalRevenue) * 100);

  const handleExport = () => {
    const csvRows = [
      ['Pilgrim ID', 'Name', 'Total (SAR)', 'Paid (SAR)', 'Balance (SAR)', 'Status', 'Group Leader'],
      ['PIL-001', 'Ahmad Yusuf Al-Rashidi', '18500', '18500', '0', 'Paid', 'Sheikh Ahmed Al-Rashidi'],
      ['PIL-002', 'Fatima Zahra Benali', '16800', '16800', '0', 'Paid', 'Sheikh Ahmed Al-Rashidi'],
      ['PIL-003', 'Mohammad Idris Patel', '14200', '9940', '4260', 'Partial', 'Sheikh Tariq Hussain'],
      ['PIL-005', 'Khalid Mansour Al-Otaibi', '17500', '5250', '12250', 'Overdue', 'Sheikh Faisal Al-Mutairi'],
      ['PIL-006', 'Amira Hassan Saleh', '15600', '7800', '7800', 'Partial', 'Sheikh Ahmed Al-Rashidi'],
    ];
    const csv = csvRows.map((r) => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'hajj2027_payments.csv';
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
              Hajj 2027 · Collection rate{' '}
              <span className="font-semibold text-primary">{collectionRate}%</span> ·{' '}
              SAR {(campaignStats.collectedRevenue / 1_000_000).toFixed(2)}M collected of SAR{' '}
              {(campaignStats.totalRevenue / 1_000_000).toFixed(2)}M total
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
              onChange={(e) => {
                setSearch(e.target.value);
                onSearch?.(e.target.value);
              }}
              className="pl-8 pr-3 py-2 text-sm bg-muted border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30 w-48"
            />
          </div>
          <select
            value={filter}
            onChange={(e) => {
              setFilter(e.target.value);
              onFilter?.(e.target.value);
            }}
            className="px-3 py-2 text-sm bg-muted border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30"
          >
            <option value="all">All Statuses</option>
            <option value="paid">Paid</option>
            <option value="partial">Partial</option>
            <option value="overdue">Overdue</option>
            <option value="pending">Pending</option>
          </select>
          <button
            onClick={handleExport}
            className="btn-primary"
          >
            <Download size={14} />
            Export CSV
          </button>
        </div>
      </div>
    </div>
  );
}
