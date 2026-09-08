'use client';

import React from 'react';
import Link from 'next/link';
import { Calendar, MapPin, Users, Clock, Download } from 'lucide-react';
import type { Pilgrim } from '@/lib/mockData';
import type { CampaignStats } from '@/lib/data/campaign';

interface CampaignHeaderProps {
  stats: CampaignStats;
  pilgrims: Pilgrim[];
}

function daysUntil(dateStr: string): number {
  const [day, month, year] = dateStr.split('/').map(Number);
  const target = new Date(year, month - 1, day);
  const diffMs = target.getTime() - Date.now();
  return Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
}

export default function CampaignHeader({ stats, pilgrims }: CampaignHeaderProps) {
  const departureIn = daysUntil(stats.departureDate);

  const handleExport = () => {
    const rows = [
      ['Pilgrim ID', 'Name', 'Nationality', 'Group', 'Visa', 'Passport', 'Payment', 'Attendance'],
      ...pilgrims.map((p) => [p.id, p.name, p.nationality, p.groupId, p.visaStatus, p.passportStatus, p.paymentStatus, p.attendanceStatus]),
    ];
    const csv = rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'hajjflow360_campaign_report.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <span className="px-2 py-0.5 rounded text-xs font-semibold bg-primary text-primary-foreground uppercase tracking-wider">
            Active
          </span>
          <span className="text-muted-foreground text-sm">Campaign ID: HJJ-2027-001</span>
        </div>
        <h1 className="text-2xl font-semibold text-foreground">Hajj 2027 Campaign</h1>
        <div className="flex flex-wrap items-center gap-4 mt-2">
          <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <Calendar size={14} />
            {stats.departureDate} – {stats.returnDate}
          </span>
          <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <MapPin size={14} />
            Makkah & Madinah
          </span>
          <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <Users size={14} />
            {stats.totalPilgrims} / {stats.capacity} pilgrims
          </span>
          <span className="flex items-center gap-1.5 text-sm text-accent font-medium">
            <Clock size={14} />
            Departure in {departureIn} days
          </span>
        </div>
      </div>
      <div className="flex items-center gap-3 flex-shrink-0">
        <button onClick={handleExport} className="btn-secondary text-sm">
          <Download size={14} />
          Export Report
        </button>
        <Link href="/pilgrim-management" className="btn-primary text-sm">
          + Add Pilgrim
        </Link>
      </div>
    </div>
  );
}
