'use client';

import React, { useState } from 'react';
import type { GroupLeader, Pilgrim } from '@/lib/mockData';
import StatusBadge from '@/components/ui/StatusBadge';
import { ChevronLeft, Edit2, Printer, MessageSquare } from 'lucide-react';
import Link from 'next/link';
import EditPilgrimModal from '@/app/pilgrim-management/components/EditPilgrimModal';

export default function PilgrimProfileHeader({ pilgrim: p, groupLeaders }: { pilgrim: Pilgrim; groupLeaders: GroupLeader[] }) {
  const paymentPct = Math.round((p.paymentPaid / p.paymentTotal) * 100);
  const [editing, setEditing] = useState(false);

  return (
    <div>
      <div className="flex items-center gap-2 mb-4">
        <Link href="/pilgrim-management" className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors">
          <ChevronLeft size={16} />
          Pilgrim Management
        </Link>
        <span className="text-muted-foreground">/</span>
        <span className="text-sm text-foreground font-medium">{p.name}</span>
      </div>

      <div className="card-base">
        <div className="flex flex-col sm:flex-row sm:items-start gap-5">
          {/* Avatar */}
          <div className="w-20 h-20 rounded-xl bg-secondary border-2 border-primary/20 flex items-center justify-center flex-shrink-0">
            <span className="text-2xl font-bold text-primary">
              {p.name.split(' ').map((n) => n[0]).slice(0, 2).join('')}
            </span>
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-start gap-3 justify-between">
              <div>
                <h1 className="text-xl font-semibold text-foreground">{p.name}</h1>
                <div className="flex flex-wrap items-center gap-3 mt-1">
                  <span className="text-sm text-muted-foreground font-mono-data">{p.id}</span>
                  <span className="text-muted-foreground">·</span>
                  <span className="text-sm text-muted-foreground">{p.nationality}</span>
                  <span className="text-muted-foreground">·</span>
                  <span className="text-sm text-muted-foreground">{p.gender === 'M' ? 'Male' : 'Female'}, {p.age} yrs</span>
                </div>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <a
                  href={`https://wa.me/${p.phone.replace(/[^\d]/g, '')}?text=${encodeURIComponent(`Assalamu Alaikum ${p.name.split(' ')[0]}, `)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-secondary text-xs px-3 py-1.5 flex items-center gap-1.5"
                >
                  <MessageSquare size={13} />
                  WhatsApp
                </a>
                <button className="btn-secondary text-xs px-3 py-1.5 flex items-center gap-1.5">
                  <Printer size={13} />
                  Print
                </button>
                <button onClick={() => setEditing(true)} className="btn-primary text-xs px-3 py-1.5 flex items-center gap-1.5">
                  <Edit2 size={13} />
                  Edit Profile
                </button>
              </div>
            </div>

            {/* Status badges row */}
            <div className="flex flex-wrap gap-2 mt-3">
              <div className="flex items-center gap-1.5">
                <span className="text-xs text-muted-foreground">Visa:</span>
                <StatusBadge status={p.visaStatus as 'approved'} size="sm" />
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-xs text-muted-foreground">Passport:</span>
                <StatusBadge status={p.passportStatus as 'verified'} size="sm" />
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-xs text-muted-foreground">Flight:</span>
                <StatusBadge status="approved" size="sm" />
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-xs text-muted-foreground">Payment:</span>
                <StatusBadge status={p.paymentStatus as 'paid'} size="sm" />
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-xs text-muted-foreground">Group:</span>
                <span className="status-badge status-processing text-xs">{p.groupId}</span>
              </div>
            </div>

            {/* Payment progress */}
            <div className="mt-3 flex items-center gap-3">
              <div className="flex-1 progress-bar-track">
                <div className="progress-bar-fill" style={{ width: `${paymentPct}%` }} />
              </div>
              <span className="text-xs font-semibold tabular-nums text-foreground whitespace-nowrap">
                SAR {p.paymentPaid.toLocaleString()} / {p.paymentTotal.toLocaleString()} ({paymentPct}%)
              </span>
            </div>
          </div>
        </div>

        {/* Group leader notice */}
        <div className="mt-4 pt-4 border-t border-border flex items-center gap-2">
          <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center">
            <span className="text-xs text-primary-foreground font-semibold">GL</span>
          </div>
          <span className="text-sm text-muted-foreground">Group Leader:</span>
          <span className="text-sm font-semibold text-foreground">{p.groupLeader}</span>
          <span className="text-muted-foreground">·</span>
          <span className="text-sm text-muted-foreground">{p.groupId}</span>
        </div>
      </div>

      {editing && (
        <EditPilgrimModal pilgrim={p} onClose={() => setEditing(false)} groupLeaders={groupLeaders} />
      )}
    </div>
  );
}