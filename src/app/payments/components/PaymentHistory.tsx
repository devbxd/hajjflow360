'use client';

import React, { useState } from 'react';
import { History, TrendingUp } from 'lucide-react';
import type { RecentPayment } from '@/lib/data/pilgrims';
import { useCurrency } from '@/lib/currency';

const typeConfig = {
  full: { label: 'Full', color: 'text-[#16A34A] bg-[#F0FDF4]' },
  installment: { label: 'Installment', color: 'text-[#2563EB] bg-[#EFF6FF]' },
};

export default function PaymentHistory({ transactions }: { transactions: RecentPayment[] }) {
  const { format } = useCurrency();
  const [filter, setFilter] = useState<'all' | 'full' | 'installment'>('all');

  const filtered = filter === 'all' ? transactions : transactions.filter((t) => t.type === filter);
  const totalShown = filtered.reduce((s, t) => s + t.amount, 0);

  return (
    <div className="card-base p-0 overflow-hidden flex flex-col h-full">
      <div className="px-4 py-3 border-b border-border">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <History size={16} className="text-primary" />
            <h3 className="text-sm font-semibold text-foreground">Payment History</h3>
          </div>
          <div className="flex items-center gap-1 text-xs text-[#16A34A] font-medium">
            <TrendingUp size={12} />
            <span>{format(totalShown)} shown</span>
          </div>
        </div>
        <div className="flex gap-1">
          {(['all', 'full', 'installment'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-2.5 py-1 text-xs rounded-lg font-medium transition-colors capitalize ${filter === f ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-input'}`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-thin divide-y divide-border/50">
        {filtered.length === 0 && (
          <p className="px-4 py-8 text-center text-sm text-muted-foreground">No transactions recorded yet.</p>
        )}
        {filtered.map((txn) => {
          const tc = typeConfig[txn.type];
          return (
            <div key={txn.id} className="px-4 py-3 hover:bg-muted/30 transition-colors">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate leading-tight">{txn.pilgrimName}</p>
                  <p className="text-xs text-muted-foreground font-mono-data mt-0.5">{txn.pilgrimId} · {txn.reference}</p>
                  <div className="flex items-center gap-1.5 mt-1.5">
                    <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${tc.color}`}>{tc.label}</span>
                    <span className="text-xs text-muted-foreground">{txn.method}</span>
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-sm font-semibold font-mono-data text-[#16A34A]">
                    +{format(txn.amount)}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">{txn.date}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="px-4 py-3 border-t border-border bg-muted/20">
        <p className="text-xs text-muted-foreground">{filtered.length} transactions</p>
      </div>
    </div>
  );
}
