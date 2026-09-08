'use client';

import React, { useState } from 'react';
import type { Pilgrim } from '@/lib/mockData';
import StatusBadge from '@/components/ui/StatusBadge';
import { CheckCircle2, Clock, ExternalLink, MessageSquare } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';

interface GroupPilgrimTableProps {
  pilgrims: Pilgrim[];
  groupId: string;
  leaderName: string;
}

export default function GroupPilgrimTable({ pilgrims, groupId, leaderName }: GroupPilgrimTableProps) {
  const [attendance, setAttendance] = useState<Record<string, Pilgrim['attendanceStatus']>>(() =>
    Object.fromEntries(pilgrims.map((p) => [p.id, p.attendanceStatus]))
  );

  const toggleAttendance = async (id: string) => {
    const current = attendance[id];
    const next: Pilgrim['attendanceStatus'] = current === 'present' ? 'absent' : current === 'absent' ? 'not-checked' : 'present';
    setAttendance((prev) => ({ ...prev, [id]: next }));
    try {
      const res = await fetch(`/api/pilgrims/${id}/attendance`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: next }),
      });
      if (!res.ok) throw new Error();
    } catch {
      setAttendance((prev) => ({ ...prev, [id]: current }));
      toast.error('Failed to update attendance.');
    }
  };

  return (
    <div className="card-base">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-semibold text-foreground">Group Pilgrims</h3>
          <p className="text-xs text-muted-foreground mt-0.5">{pilgrims.length} pilgrims in {groupId} — {leaderName}</p>
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span className="flex items-center gap-1"><CheckCircle2 size={11} className="text-[#16A34A]" /> = Present</span>
          <span className="flex items-center gap-1"><Clock size={11} className="text-[#D97706]" /> = Not checked</span>
        </div>
      </div>
      <div className="overflow-x-auto scrollbar-thin">
        <table className="w-full text-sm min-w-[800px]">
          <thead>
            <tr className="border-b border-border bg-muted/30">
              {['#', 'Pilgrim', 'Nationality', 'Passport', 'Visa', 'Bus / Seat', 'Room', 'Payment', 'Attendance', ''].map((h) => (
                <th key={`gpt-h-${h}`} className="text-left py-2 px-3 text-xs font-medium text-muted-foreground uppercase tracking-wide whitespace-nowrap">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {pilgrims.length === 0 && (
              <tr>
                <td colSpan={10} className="py-6 px-3 text-center text-sm text-muted-foreground">No pilgrims in this group yet.</td>
              </tr>
            )}
            {pilgrims.map((p, idx) => {
              const att = attendance[p.id] ?? 'not-checked';
              const payPct = p.paymentTotal > 0 ? Math.round((p.paymentPaid / p.paymentTotal) * 100) : 0;
              return (
                <tr key={`gp-${p.id}`} className="table-row-hover border-b border-border/50 last:border-0">
                  <td className="py-2.5 px-3 text-xs text-muted-foreground tabular-nums">{idx + 1}</td>
                  <td className="py-2.5 px-3">
                    <p className="font-medium text-foreground text-sm">{p.name}</p>
                    <p className="text-xs font-mono-data text-muted-foreground">{p.id}</p>
                  </td>
                  <td className="py-2.5 px-3 text-sm text-muted-foreground whitespace-nowrap">{p.nationality}</td>
                  <td className="py-2.5 px-3">
                    <StatusBadge status={p.passportStatus} size="sm" />
                  </td>
                  <td className="py-2.5 px-3">
                    <StatusBadge status={p.visaStatus} size="sm" />
                  </td>
                  <td className="py-2.5 px-3">
                    {p.busNumber ? (
                      <span className="font-mono-data text-xs text-foreground">
                        Bus #{p.busNumber} · {p.seatNumber}
                      </span>
                    ) : (
                      <span className="text-xs text-[#DC2626]">Unassigned</span>
                    )}
                  </td>
                  <td className="py-2.5 px-3">
                    {p.roomNumber ? (
                      <span className="font-mono-data text-xs text-foreground">{p.roomNumber}</span>
                    ) : (
                      <span className="text-xs text-[#DC2626]">—</span>
                    )}
                  </td>
                  <td className="py-2.5 px-3">
                    <div className="flex items-center gap-2">
                      <div className="progress-bar-track w-16">
                        <div className="progress-bar-fill" style={{ width: `${payPct}%` }} />
                      </div>
                      <span className="text-xs tabular-nums text-muted-foreground">{payPct}%</span>
                    </div>
                  </td>
                  <td className="py-2.5 px-3">
                    <button
                      onClick={() => toggleAttendance(p.id)}
                      className={`flex items-center gap-1.5 px-2 py-1 rounded text-xs font-medium transition-all ${
                        att === 'present' ? 'bg-[#F0FDF4] text-[#16A34A]'
                          : att === 'absent' ? 'bg-[#FEF2F2] text-[#DC2626]' : 'bg-muted text-muted-foreground'
                      }`}
                    >
                      {att === 'present' ? <CheckCircle2 size={11} /> : <Clock size={11} />}
                      {att === 'present' ? 'Present' : att === 'absent' ? 'Absent' : 'Mark'}
                    </button>
                  </td>
                  <td className="py-2.5 px-3">
                    <div className="flex items-center gap-1">
                      <Link href={`/pilgrim-profile/${p.id}`} className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-primary transition-colors">
                        <ExternalLink size={13} />
                      </Link>
                      <button className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-[#16A34A] transition-colors">
                        <MessageSquare size={13} />
                      </button>
                    </div>
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
