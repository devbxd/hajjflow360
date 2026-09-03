'use client';

import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { groupProgressData } from '@/lib/mockData';

const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: Array<{ name: string; value: number; color: string }>; label?: string }) => {
  if (active && payload && payload.length) {
    return (
      <div className="card-base shadow-lg text-xs px-3 py-2 min-w-[140px]">
        <p className="font-semibold text-foreground mb-1">{label}</p>
        {payload.map((p) => (
          <p key={`tooltip-${p.name}`} style={{ color: p.color }} className="font-medium">
            {p.name}: {p.value.toFixed(1)}%
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export default function GroupProgressChart() {
  return (
    <ResponsiveContainer width="100%" height={200}>
      <BarChart data={groupProgressData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
        <XAxis dataKey="group" tick={{ fontSize: 10, fill: 'var(--muted-foreground)' }} />
        <YAxis domain={[0, 100]} tick={{ fontSize: 10, fill: 'var(--muted-foreground)' }} unit="%" />
        <Tooltip content={<CustomTooltip />} />
        <Legend
          iconSize={8}
          formatter={(value) => <span className="text-xs text-muted-foreground">{value}</span>}
        />
        <Bar dataKey="visa" name="Visa" fill="var(--primary)" radius={[2, 2, 0, 0]} maxBarSize={8} />
        <Bar dataKey="payment" name="Payment" fill="var(--accent)" radius={[2, 2, 0, 0]} maxBarSize={8} />
        <Bar dataKey="passport" name="Passport" fill="#2563EB" radius={[2, 2, 0, 0]} maxBarSize={8} />
      </BarChart>
    </ResponsiveContainer>
  );
}