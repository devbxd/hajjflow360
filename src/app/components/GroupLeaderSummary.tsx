import React from 'react';
import { groupLeaders } from '@/lib/mockData';
import Link from 'next/link';

export default function GroupLeaderSummary() {
  return (
    <div className="card-base">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-foreground">Group Leader Summary</h3>
        <Link href="/group-leader-dashboard" className="text-xs text-primary font-medium hover:underline">
          Full dashboard →
        </Link>
      </div>
      <div className="overflow-x-auto scrollbar-thin">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border">
              {['Group Leader', 'Group', 'Pilgrims', 'Visa Approved', 'Passport OK', 'Payment Done', 'Attendance'].map((h) => (
                <th key={`gl-h-${h}`} className="text-left py-2 px-3 text-xs font-medium text-muted-foreground uppercase tracking-wide whitespace-nowrap">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {groupLeaders.map((gl) => {
              const visaPct = Math.round((gl.visaApproved / gl.pilgrimCount) * 100);
              const ppPct = Math.round((gl.passportVerified / gl.pilgrimCount) * 100);
              const payPct = Math.round((gl.paymentComplete / gl.pilgrimCount) * 100);
              const attPct = Math.round((gl.attendancePresent / gl.pilgrimCount) * 100);
              return (
                <tr key={`gl-${gl.id}`} className="table-row-hover border-b border-border/50 last:border-0">
                  <td className="py-2.5 px-3">
                    <p className="font-medium text-foreground text-sm">{gl.name}</p>
                  </td>
                  <td className="py-2.5 px-3">
                    <span className="font-mono-data text-xs text-muted-foreground">{gl.groupId}</span>
                  </td>
                  <td className="py-2.5 px-3">
                    <span className="font-semibold tabular-nums">{gl.pilgrimCount}</span>
                  </td>
                  <td className="py-2.5 px-3">
                    <PctBadge pct={visaPct} />
                  </td>
                  <td className="py-2.5 px-3">
                    <PctBadge pct={ppPct} />
                  </td>
                  <td className="py-2.5 px-3">
                    <PctBadge pct={payPct} />
                  </td>
                  <td className="py-2.5 px-3">
                    <PctBadge pct={attPct} />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function PctBadge({ pct }: { pct: number }) {
  const color = pct >= 90 ? 'text-[#16A34A] bg-[#F0FDF4]' : pct >= 70 ? 'text-[#D97706] bg-[#FFFBEB]' : 'text-[#DC2626] bg-[#FEF2F2]';
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold tabular-nums ${color}`}>
      {pct}%
    </span>
  );
}