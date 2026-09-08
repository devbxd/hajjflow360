'use client';

import React, { useState } from 'react';
import { pilgrims } from '@/lib/mockData';
import StatusBadge from '@/components/ui/StatusBadge';
import { CheckCircle2, Clock, ExternalLink, MessageSquare } from 'lucide-react';
import Link from 'next/link';

// Filter to GRP-001 pilgrims for this group leader view
const groupPilgrims = pilgrims.filter((p) => p.groupId === 'GRP-001');

// Supplement with additional mock pilgrims to show volume
const supplemental = [
  { id: 'PIL-013', name: 'Tariq Al-Ghamdi', nationality: 'Saudi Arabia', passportStatus: 'verified', visaStatus: 'approved', paymentStatus: 'paid', paymentPaid: 18500, paymentTotal: 18500, attendanceStatus: 'present', busNumber: 1, seatNumber: 'A4', roomNumber: '415' },
  { id: 'PIL-014', name: 'Hana Khalil Nasser', nationality: 'Jordan', passportStatus: 'verified', visaStatus: 'approved', paymentStatus: 'paid', paymentPaid: 17200, paymentTotal: 17200, attendanceStatus: 'present', busNumber: 1, seatNumber: 'A5', roomNumber: '416' },
  { id: 'PIL-015', name: 'Waleed Ibrahim Saad', nationality: 'Egypt', passportStatus: 'scanned', visaStatus: 'pending', paymentStatus: 'partial', paymentPaid: 9100, paymentTotal: 15600, attendanceStatus: 'not-checked', busNumber: 2, seatNumber: 'D6', roomNumber: '502' },
  { id: 'PIL-016', name: 'Reem Bint Khalid', nationality: 'Saudi Arabia', passportStatus: 'verified', visaStatus: 'approved', paymentStatus: 'paid', paymentPaid: 18500, paymentTotal: 18500, attendanceStatus: 'present', busNumber: 1, seatNumber: 'A6', roomNumber: '417' },
  { id: 'PIL-017', name: 'Omar Farouq Hassan', nationality: 'Sudan', passportStatus: 'missing', visaStatus: 'not-started', paymentStatus: 'overdue', paymentPaid: 4000, paymentTotal: 14800, attendanceStatus: 'absent', busNumber: undefined, seatNumber: undefined, roomNumber: undefined },
  { id: 'PIL-018', name: 'Layla Mustafa Aziz', nationality: 'Iraq', passportStatus: 'verified', visaStatus: 'processing', paymentStatus: 'partial', paymentPaid: 11000, paymentTotal: 16500, attendanceStatus: 'not-checked', busNumber: 3, seatNumber: 'B9', roomNumber: '503' },
  { id: 'PIL-019', name: 'Nour Al-Deen Qasim', nationality: 'Syria', passportStatus: 'verified', visaStatus: 'approved', paymentStatus: 'paid', paymentPaid: 15200, paymentTotal: 15200, attendanceStatus: 'present', busNumber: 3, seatNumber: 'B10', roomNumber: '418' },
];

type AttendanceStatus = 'present' | 'absent' | 'not-checked';

export default function GroupPilgrimTable() {
  const [attendance, setAttendance] = useState<Record<string, AttendanceStatus>>(() => {
    const init: Record<string, AttendanceStatus> = {};
    [...groupPilgrims, ...supplemental].forEach((p) => {
      init[p.id] = (p.attendanceStatus ?? 'not-checked') as AttendanceStatus;
    });
    return init;
  });

  const allPilgrims = [...groupPilgrims, ...supplemental];

  const toggleAttendance = (id: string) => {
    setAttendance((prev) => {
      const cur = prev[id];
      const next: AttendanceStatus = cur === 'present' ? 'absent' : cur === 'absent' ? 'not-checked' : 'present';
      return { ...prev, [id]: next };
    });
  };

  return (
    <div className="card-base">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-semibold text-foreground">Group Pilgrims</h3>
          <p className="text-xs text-muted-foreground mt-0.5">{allPilgrims.length} pilgrims in GRP-001 — Sheikh Ahmed Al-Rashidi</p>
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
            {allPilgrims.map((p, idx) => {
              const att = attendance[p.id] ?? 'not-checked';
              const payPct = Math.round(((p as { paymentPaid: number }).paymentPaid / (p as { paymentTotal: number }).paymentTotal) * 100);
              return (
                <tr key={`gp-${p.id}`} className="table-row-hover border-b border-border/50 last:border-0">
                  <td className="py-2.5 px-3 text-xs text-muted-foreground tabular-nums">{idx + 1}</td>
                  <td className="py-2.5 px-3">
                    <p className="font-medium text-foreground text-sm">{p.name}</p>
                    <p className="text-xs font-mono-data text-muted-foreground">{p.id}</p>
                  </td>
                  <td className="py-2.5 px-3 text-sm text-muted-foreground whitespace-nowrap">{p.nationality}</td>
                  <td className="py-2.5 px-3">
                    <StatusBadge status={p.passportStatus as 'verified'} size="sm" />
                  </td>
                  <td className="py-2.5 px-3">
                    <StatusBadge status={p.visaStatus as 'approved'} size="sm" />
                  </td>
                  <td className="py-2.5 px-3">
                    {(p as { busNumber?: number }).busNumber ? (
                      <span className="font-mono-data text-xs text-foreground">
                        Bus #{(p as { busNumber?: number }).busNumber} · {(p as { seatNumber?: string }).seatNumber}
                      </span>
                    ) : (
                      <span className="text-xs text-[#DC2626]">Unassigned</span>
                    )}
                  </td>
                  <td className="py-2.5 px-3">
                    {(p as { roomNumber?: string }).roomNumber ? (
                      <span className="font-mono-data text-xs text-foreground">{(p as { roomNumber?: string }).roomNumber}</span>
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
                        att === 'present' ?'bg-[#F0FDF4] text-[#16A34A]'
                          : att === 'absent' ?'bg-[#FEF2F2] text-[#DC2626]' :'bg-muted text-muted-foreground'
                      }`}
                    >
                      {att === 'present' ? <CheckCircle2 size={11} /> : <Clock size={11} />}
                      {att === 'present' ? 'Present' : att === 'absent' ? 'Absent' : 'Mark'}
                    </button>
                  </td>
                  <td className="py-2.5 px-3">
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100">
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