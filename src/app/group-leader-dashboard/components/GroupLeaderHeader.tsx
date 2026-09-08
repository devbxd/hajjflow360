'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { Users, Phone, Star, Download } from 'lucide-react';
import type { GroupLeader, Pilgrim } from '@/lib/mockData';

interface GroupLeaderHeaderProps {
  groupLeader: GroupLeader;
  allGroupLeaders: GroupLeader[];
  pilgrims: Pilgrim[];
}

export default function GroupLeaderHeader({ groupLeader: gl, allGroupLeaders, pilgrims }: GroupLeaderHeaderProps) {
  const router = useRouter();
  const initials = gl.name
    .split(' ')
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  const handleExport = () => {
    const rows = [
      ['Pilgrim ID', 'Name', 'Nationality', 'Passport', 'Visa', 'Payment Status', 'Attendance'],
      ...pilgrims.map((p) => [p.id, p.name, p.nationality, p.passportStatus, p.visaStatus, p.paymentStatus, p.attendanceStatus]),
    ];
    const csv = rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${gl.groupId}_pilgrims.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const scrollToBroadcast = () => {
    document.getElementById('whatsapp-broadcast')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div className="flex items-center gap-4">
        <div className="w-14 h-14 rounded-xl bg-primary flex items-center justify-center flex-shrink-0">
          <span className="text-xl font-bold text-primary-foreground">{initials}</span>
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-semibold text-foreground">{gl.name}</h1>
            <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-accent/10 text-accent text-xs font-semibold">
              <Star size={10} />
              Group Leader
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-3 mt-1">
            <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <Users size={13} />{gl.pilgrimCount} pilgrims
            </span>
            <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <Phone size={13} />
              {gl.phone}
            </span>
            <span className="text-sm text-muted-foreground font-mono-data">{gl.groupId}</span>
          </div>
        </div>
      </div>
      <div className="flex items-center gap-3 flex-shrink-0">
        <select
          value={gl.groupId}
          onChange={(e) => router.push(`/group-leader-dashboard?group=${e.target.value}`)}
          className="text-sm border border-border rounded-lg px-3 py-2 bg-input text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
        >
          {allGroupLeaders.map((leader) => (
            <option key={leader.groupId} value={leader.groupId}>
              {leader.groupId} — {leader.name}
            </option>
          ))}
        </select>
        <button onClick={handleExport} className="btn-secondary text-sm">
          <Download size={14} />
          Export Group List
        </button>
        <button onClick={scrollToBroadcast} className="btn-primary text-sm">Send Broadcast</button>
      </div>
    </div>
  );
}
