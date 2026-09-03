'use client';

import React from 'react';
import { TrendingUp, Users, AlertTriangle, Clock, CheckCircle2, BarChart3 } from 'lucide-react';
import { campaignStats } from '@/lib/mockData';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import Icon from '@/components/ui/AppIcon';


const installmentData = [
  { month: 'Oct 26', collected: 1820000, target: 2000000 },
  { month: 'Dec 26', collected: 2340000, target: 2500000 },
  { month: 'Feb 27', collected: 2100000, target: 2200000 },
  { month: 'Apr 27', collected: 1980000, target: 2100000 },
  { month: 'Jun 27', collected: 1650000, target: 1800000 },
  { month: 'Aug 27', collected: 1033000, target: 1687500 },
];

export default function PaymentMetrics() {
  const collectionRate = Math.round((campaignStats.collectedRevenue / campaignStats.totalRevenue) * 100);
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
      sub: 'campaign target: 95%',
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

      {/* Installment Collection Chart */}
      <div className="card-base">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-semibold text-foreground">Installment Collection Schedule</h3>
            <p className="text-xs text-muted-foreground mt-0.5">Monthly collected vs target (SAR)</p>
          </div>
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-sm bg-primary inline-block" />
              Collected
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-sm bg-border inline-block" />
              Target
            </span>
          </div>
        </div>
        <ResponsiveContainer width="100%" height={160}>
          <BarChart data={installmentData} barGap={4} barCategoryGap="30%">
            <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#6B6560' }} axisLine={false} tickLine={false} />
            <YAxis
              tick={{ fontSize: 10, fill: '#6B6560' }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(v) => `${(v / 1_000_000).toFixed(1)}M`}
            />
            <Tooltip
              formatter={(value: number, name: string) => [
                `SAR ${(value / 1_000_000).toFixed(2)}M`,
                name === 'collected' ? 'Collected' : 'Target',
              ]}
              contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid var(--border)' }}
            />
            <Bar dataKey="target" fill="#E2DED8" radius={[4, 4, 0, 0]} />
            <Bar dataKey="collected" radius={[4, 4, 0, 0]}>
              {installmentData.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={entry.collected >= entry.target ? '#1B6B4A' : entry.collected / entry.target >= 0.85 ? '#C5A028' : '#DC2626'}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
