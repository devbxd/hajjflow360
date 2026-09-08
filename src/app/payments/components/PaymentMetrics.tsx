'use client';

import React from 'react';
import { TrendingUp, Users, AlertTriangle, Clock, CheckCircle2, BarChart3 } from 'lucide-react';
import type { CampaignStats } from '@/lib/data/campaign';
import type { MonthlyCollection } from '@/lib/data/campaign';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

interface PaymentMetricsProps {
  stats: CampaignStats;
  monthlyCollections: MonthlyCollection[];
}

export default function PaymentMetrics({ stats: campaignStats, monthlyCollections }: PaymentMetricsProps) {
  const collectionRate = campaignStats.totalRevenue > 0 ? Math.round((campaignStats.collectedRevenue / campaignStats.totalRevenue) * 100) : 0;
  const outstanding = campaignStats.totalRevenue - campaignStats.collectedRevenue;

  const metrics = [
    {
      label: 'Total Revenue',
      value: `SAR ${(campaignStats.totalRevenue / 1_000_000).toFixed(2)}M`,
      sub: `${campaignStats.totalPilgrims} pilgrims`,
      icon: BarChart3,
      color: 'text-primary',
      bg: 'bg-primary/10',
    },
    {
      label: 'Collected',
      value: `SAR ${(campaignStats.collectedRevenue / 1_000_000).toFixed(2)}M`,
      sub: `${collectionRate}% collection rate`,
      icon: CheckCircle2,
      color: 'text-[#16A34A]',
      bg: 'bg-[#F0FDF4]',
    },
    {
      label: 'Outstanding',
      value: `SAR ${(outstanding / 1_000_000).toFixed(2)}M`,
      sub: `${campaignStats.paymentPartial + campaignStats.paymentOverdue} pilgrims`,
      icon: Clock,
      color: 'text-[#D97706]',
      bg: 'bg-[#FFFBEB]',
    },
    {
      label: 'Overdue',
      value: `${campaignStats.paymentOverdue}`,
      sub: 'pilgrims overdue',
      icon: AlertTriangle,
      color: 'text-[#DC2626]',
      bg: 'bg-[#FEF2F2]',
    },
    {
      label: 'Fully Paid',
      value: `${campaignStats.paymentFull}`,
      sub: `of ${campaignStats.totalPilgrims} pilgrims`,
      icon: Users,
      color: 'text-primary',
      bg: 'bg-primary/10',
    },
    {
      label: 'Collection Rate',
      value: `${collectionRate}%`,
      sub: 'of total revenue billed',
      icon: TrendingUp,
      color: collectionRate >= 90 ? 'text-[#16A34A]' : collectionRate >= 70 ? 'text-[#D97706]' : 'text-[#DC2626]',
      bg: collectionRate >= 90 ? 'bg-[#F0FDF4]' : collectionRate >= 70 ? 'bg-[#FFFBEB]' : 'bg-[#FEF2F2]',
    },
  ];

  return (
    <div className="space-y-4">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
        {metrics.map((m) => {
          const Icon = m.icon;
          return (
            <div key={m.label} className="card-base flex flex-col gap-2">
              <div className={`w-8 h-8 rounded-lg ${m.bg} flex items-center justify-center`}>
                <Icon size={16} className={m.color} />
              </div>
              <p className="text-xs text-muted-foreground font-medium">{m.label}</p>
              <p className={`text-lg font-bold font-mono-data ${m.color}`}>{m.value}</p>
              <p className="text-xs text-muted-foreground">{m.sub}</p>
            </div>
          );
        })}
      </div>

      {/* Monthly Collection Chart */}
      <div className="card-base">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-semibold text-foreground">Monthly Collections</h3>
            <p className="text-xs text-muted-foreground mt-0.5">Amount collected per month (SAR)</p>
          </div>
        </div>
        {monthlyCollections.length === 0 ? (
          <p className="text-sm text-muted-foreground py-8 text-center">No payments recorded yet.</p>
        ) : (
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={monthlyCollections} barCategoryGap="30%">
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#6B6560' }} axisLine={false} tickLine={false} />
              <YAxis
                tick={{ fontSize: 10, fill: '#6B6560' }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
              />
              <Tooltip
                formatter={(value: number) => [`SAR ${value.toLocaleString()}`, 'Collected']}
                contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid var(--border)' }}
              />
              <Bar dataKey="collected" fill="#1B6B4A" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
