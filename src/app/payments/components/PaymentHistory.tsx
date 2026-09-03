'use client';

import React, { useState } from 'react';
import { History, TrendingUp, ArrowUpRight } from 'lucide-react';

interface Transaction {
  id: string;
  pilgrimId: string;
  pilgrimName: string;
  amount: number;
  type: 'installment' | 'full' | 'deposit' | 'refund';
  date: string;
  method: 'bank' | 'cash' | 'card' | 'online';
  ref: string;
}

const transactions: Transaction[] = [
  { id: 'TXN-001', pilgrimId: 'PIL-003', pilgrimName: 'Mohammad Idris Patel', amount: 9940, type: 'installment', date: '2027-08-28', method: 'bank', ref: 'BNK-88341' },
  { id: 'TXN-002', pilgrimId: 'PIL-010', pilgrimName: 'Maryam Koné', amount: 11175, type: 'installment', date: '2027-08-25', method: 'online', ref: 'ONL-55219' },
  { id: 'TXN-003', pilgrimId: 'PIL-001', pilgrimName: 'Ahmad Yusuf Al-Rashidi', amount: 18500, type: 'full', date: '2027-08-20', method: 'bank', ref: 'BNK-77102' },
  { id: 'TXN-004', pilgrimId: 'PIL-006', pilgrimName: 'Amira Hassan Saleh', amount: 7800, type: 'installment', date: '2027-08-18', method: 'card', ref: 'CRD-44312' },
  { id: 'TXN-005', pilgrimId: 'PIL-016', pilgrimName: 'Tariq Noor Al-Din', amount: 8200, type: 'installment', date: '2027-08-15', method: 'cash', ref: 'CSH-22198' },
  { id: 'TXN-006', pilgrimId: 'PIL-012', pilgrimName: 'Sumayyah Al-Ghamdi', amount: 18500, type: 'full', date: '2027-08-12', method: 'bank', ref: 'BNK-66543' },
  { id: 'TXN-007', pilgrimId: 'PIL-005', pilgrimName: 'Khalid Mansour Al-Otaibi', amount: 5250, type: 'deposit', date: '2027-08-10', method: 'cash', ref: 'CSH-11087' },
  { id: 'TXN-008', pilgrimId: 'PIL-020', pilgrimName: 'Mustafa Al-Kurdi', amount: 6600, type: 'installment', date: '2027-08-08', method: 'online', ref: 'ONL-33421' },
  { id: 'TXN-009', pilgrimId: 'PIL-017', pilgrimName: 'Layla Al-Mansouri', amount: 19800, type: 'full', date: '2027-08-05', method: 'bank', ref: 'BNK-55891' },
  { id: 'TXN-010', pilgrimId: 'PIL-004', pilgrimName: 'Nadia Okonkwo', amount: 19200, type: 'full', date: '2027-08-01', method: 'bank', ref: 'BNK-44231' },
];

const typeConfig = {
  full: { label: 'Full', color: 'text-[#16A34A] bg-[#F0FDF4]' },
  installment: { label: 'Installment', color: 'text-[#2563EB] bg-[#EFF6FF]' },
  deposit: { label: 'Deposit', color: 'text-[#D97706] bg-[#FFFBEB]' },
  refund: { label: 'Refund', color: 'text-[#DC2626] bg-[#FEF2F2]' },
};

const methodConfig = {
  bank: { label: 'Bank Transfer', icon: '🏦' },
  cash: { label: 'Cash', icon: '💵' },
  card: { label: 'Card', icon: '💳' },
  online: { label: 'Online', icon: '🌐' },
};

export default function PaymentHistory() {
  const [filter, setFilter] = useState<'all' | 'full' | 'installment' | 'deposit'>('all');

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
            <span>SAR {(totalShown / 1000).toFixed(0)}K shown</span>
          </div>
        </div>
        <div className="flex gap-1">
          {(['all', 'full', 'installment', 'deposit'] as const).map((f) => (
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
        {filtered.map((txn) => {
          const tc = typeConfig[txn.type];
          const mc = methodConfig[txn.method];
          return (
            <div key={txn.id} className="px-4 py-3 hover:bg-muted/30 transition-colors">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate leading-tight">{txn.pilgrimName}</p>
                  <p className="text-xs text-muted-foreground font-mono-data mt-0.5">{txn.pilgrimId} · {txn.ref}</p>
                  <div className="flex items-center gap-1.5 mt-1.5">
                    <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${tc.color}`}>{tc.label}</span>
                    <span className="text-xs text-muted-foreground">{mc.icon} {mc.label}</span>
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-sm font-semibold font-mono-data text-[#16A34A]">
                    +SAR {txn.amount.toLocaleString()}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">{txn.date}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="px-4 py-3 border-t border-border bg-muted/20">
        <div className="flex items-center justify-between">
          <p className="text-xs text-muted-foreground">{filtered.length} transactions</p>
          <button className="text-xs text-primary font-medium flex items-center gap-1 hover:underline">
            View all <ArrowUpRight size={11} />
          </button>
        </div>
      </div>
    </div>
  );
}
