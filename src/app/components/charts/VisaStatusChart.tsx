'use client';

import React from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { visaChartData } from '@/lib/mockData';

const CustomTooltip = ({ active, payload }: { active?: boolean; payload?: Array<{ name: string; value: number }> }) => {
  if (active && payload && payload.length) {
    const d = payload[0];
    const total = visaChartData.reduce((s, x) => s + x.value, 0);
    return (
      <div className="card-base shadow-lg text-sm px-3 py-2">
        <p className="font-semibold text-foreground">{d.name}</p>
        <p className="text-muted-foreground">{d.value} pilgrims ({Math.round((d.value / total) * 100)}%)</p>
      </div>
    );
  }
  return null;
};

export default function VisaStatusChart() {
  return (
    <ResponsiveContainer width="100%" height={200}>
      <PieChart>
        <Pie
          data={visaChartData}
          cx="50%"
          cy="45%"
          innerRadius={55}
          outerRadius={80}
          paddingAngle={3}
          dataKey="value"
        >
          {visaChartData.map((entry) => (
            <Cell key={`visa-cell-${entry.name}`} fill={entry.fill} />
          ))}
        </Pie>
        <Tooltip content={<CustomTooltip />} />
        <Legend
          iconType="circle"
          iconSize={8}
          formatter={(value) => <span className="text-xs text-muted-foreground">{value}</span>}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}