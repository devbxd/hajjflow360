import React from 'react';
import type { AtRiskEntry } from '@/lib/data/campaign';
import { AlertTriangle, ExternalLink } from 'lucide-react';
import Link from 'next/link';

const severityConfig = {
  critical: { label: 'Critical', className: 'status-rejected' },
  high: { label: 'High', className: 'status-pending' },
  medium: { label: 'Medium', className: 'status-processing' },
};

export default function AtRiskTable({ data }: { data: AtRiskEntry[] }) {
  return (
    <div className="card-base">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <AlertTriangle size={16} className="text-[#DC2626]" />
          <h3 className="text-sm font-semibold text-foreground">At-Risk Pilgrims</h3>
          <span className="px-2 py-0.5 rounded-full bg-[#FEE2E2] text-[#DC2626] text-xs font-semibold">
            {data.length} require action
          </span>
        </div>
        <Link href="/emergency-lists" className="text-xs text-primary font-medium hover:underline">
          View all
        </Link>
      </div>
      <div className="overflow-x-auto scrollbar-thin">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left py-2 px-3 text-xs font-medium text-muted-foreground uppercase tracking-wide">Pilgrim</th>
              <th className="text-left py-2 px-3 text-xs font-medium text-muted-foreground uppercase tracking-wide">Issue</th>
              <th className="text-left py-2 px-3 text-xs font-medium text-muted-foreground uppercase tracking-wide">Severity</th>
              <th className="text-left py-2 px-3 text-xs font-medium text-muted-foreground uppercase tracking-wide">Days Left</th>
              <th className="py-2 px-3" />
            </tr>
          </thead>
          <tbody>
            {data.length === 0 && (
              <tr>
                <td colSpan={5} className="py-6 px-3 text-center text-sm text-muted-foreground">
                  No pilgrims currently flagged at risk.
                </td>
              </tr>
            )}
            {data.map((p) => {
              const sev = severityConfig[p.severity];
              return (
                <tr key={`risk-${p.id}`} className="table-row-hover border-b border-border/50 last:border-0">
                  <td className="py-2.5 px-3">
                    <div>
                      <p className="font-medium text-foreground text-sm">{p.name}</p>
                      <p className="text-xs text-muted-foreground font-mono-data">{p.id}</p>
                    </div>
                  </td>
                  <td className="py-2.5 px-3">
                    <p className="text-sm text-foreground">{p.issue}</p>
                  </td>
                  <td className="py-2.5 px-3">
                    <span className={`status-badge ${sev.className}`}>{sev.label}</span>
                  </td>
                  <td className="py-2.5 px-3">
                    <span className={`font-semibold tabular-nums text-sm ${p.daysToDepart <= 12 ? 'text-[#DC2626]' : 'text-[#D97706]'}`}>
                      {p.daysToDepart}d
                    </span>
                  </td>
                  <td className="py-2.5 px-3">
                    <Link href={`/pilgrim-profile/${p.id}`} className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-primary transition-colors inline-flex">
                      <ExternalLink size={14} />
                    </Link>
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
