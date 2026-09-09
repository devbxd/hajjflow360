'use client';

import React from 'react';
import { FileBarChart, Users, CreditCard, TrendingDown, ClipboardList, Download } from 'lucide-react';
import type { Pilgrim } from '@/lib/mockData';
import type { RecentPayment } from '@/lib/data/pilgrims';
import type { CampaignStats } from '@/lib/data/campaign';
import type { Expense } from '@/lib/data/finance';

function downloadCsv(filename: string, rows: (string | number)[][]) {
  const csv = rows.map((r) => r.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

interface Props {
  pilgrims: Pilgrim[];
  payments: RecentPayment[];
  expenses: Expense[];
  stats: CampaignStats;
}

export default function ReportsExportClient({ pilgrims, payments, expenses, stats }: Props) {
  const exportPilgrims = () =>
    downloadCsv('manasikpro_pilgrims.csv', [
      ['ID', 'Name', 'Nationality', 'Passport #', 'Visa Status', 'Flight', 'Hotel (Makkah)', 'Hotel (Madinah)', 'Bus', 'Group', 'Payment Total', 'Payment Paid', 'Payment Status'],
      ...pilgrims.map((p) => [p.id, p.name, p.nationality, p.passportNumber, p.visaStatus, p.flightNumber ?? '', p.hotelMakkah ?? '', p.hotelMadinah ?? '', p.busNumber ?? '', p.groupId, p.paymentTotal, p.paymentPaid, p.paymentStatus]),
    ]);

  const exportPayments = () =>
    downloadCsv('manasikpro_payments.csv', [
      ['Receipt #', 'Pilgrim ID', 'Pilgrim Name', 'Date', 'Method', 'Reference', 'Type', 'Amount'],
      ...payments.map((p) => [p.id, p.pilgrimId, p.pilgrimName, p.date, p.method, p.reference, p.type, p.amount]),
    ]);

  const exportExpenses = () =>
    downloadCsv('manasikpro_expenses.csv', [
      ['ID', 'Description', 'Category', 'Date', 'Amount'],
      ...expenses.map((e) => [e.id, e.description, e.category, e.spentOn, e.amount]),
    ]);

  const exportSummary = () => {
    const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
    downloadCsv('manasikpro_campaign_summary.csv', [
      ['Metric', 'Value'],
      ['Total Pilgrims', stats.totalPilgrims],
      ['Campaign Capacity', stats.capacity],
      ['Visa Approved', stats.visaApproved],
      ['Visa Pending', stats.visaPending],
      ['Passport Verified', stats.passportVerified],
      ['Payment Full', stats.paymentFull],
      ['Payment Overdue', stats.paymentOverdue],
      ['Total Revenue (SAR)', stats.totalRevenue],
      ['Collected Revenue (SAR)', stats.collectedRevenue],
      ['Total Expenses (SAR)', totalExpenses],
      ['Net Profit (SAR)', stats.collectedRevenue - totalExpenses],
      ['Buses Allocated', `${stats.busesAllocated} / ${stats.busesTotal}`],
      ['Rooms Allocated', `${stats.roomsAllocated} / ${stats.roomsTotal}`],
      ['At-Risk Pilgrims', stats.atRiskCount],
    ]);
  };

  const reports = [
    { title: 'Pilgrim Registry', desc: `${pilgrims.length} pilgrims — full record export`, icon: Users, action: exportPilgrims },
    { title: 'Payments & Receipts', desc: `${payments.length} transactions`, icon: CreditCard, action: exportPayments },
    { title: 'Expenses', desc: `${expenses.length} entries`, icon: TrendingDown, action: exportExpenses },
    { title: 'Campaign Summary', desc: 'Key metrics in one file', icon: ClipboardList, action: exportSummary },
  ];

  return (
    <div>
      <div className="mb-6 flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
          <FileBarChart size={20} className="text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Reports &amp; Export</h1>
          <p className="text-sm text-muted-foreground mt-1">Download campaign data as CSV — opens cleanly in Excel or Google Sheets</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {reports.map((r) => {
          const Icon = r.icon;
          return (
            <div key={r.title} className="card-base flex items-center justify-between gap-4">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Icon size={16} className="text-primary" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-foreground truncate">{r.title}</p>
                  <p className="text-xs text-muted-foreground truncate">{r.desc}</p>
                </div>
              </div>
              <button onClick={r.action} className="btn-secondary text-sm flex items-center gap-1.5 flex-shrink-0">
                <Download size={14} />
                Export
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
