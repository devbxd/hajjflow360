'use client';

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import {
  Bell, CheckCircle2, CreditCard, ScanLine, AlertTriangle, Bus, MessageSquare, QrCode, Loader2,
} from 'lucide-react';
import type { ActivityEntry } from '@/lib/data/activity';

const iconMap: Record<string, React.ElementType> = {
  check: CheckCircle2,
  payment: CreditCard,
  scan: ScanLine,
  alert: AlertTriangle,
  bus: Bus,
  message: MessageSquare,
  qr: QrCode,
  processing: Loader2,
};

export default function NotificationBell({ count }: { count: number }) {
  const [open, setOpen] = useState(false);
  const [activity, setActivity] = useState<ActivityEntry[] | null>(null);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    fetch('/api/notifications/recent')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => data && setActivity(data.activity))
      .catch(() => {});
  }, [open]);

  useEffect(() => {
    const onClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="relative p-1.5 rounded-md hover:bg-muted text-muted-foreground transition-colors flex-shrink-0"
        aria-label="Notification Center"
        title="Notification Center"
      >
        <Bell size={16} />
        {count > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[14px] h-[14px] px-0.5 rounded-full bg-accent text-white text-[9px] font-bold flex items-center justify-center">
            {count > 9 ? '9+' : count}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute left-0 top-full mt-2 w-80 bg-card border border-border rounded-xl shadow-xl z-50 slide-up overflow-hidden">
          <div className="px-4 py-3 border-b border-border flex items-center justify-between">
            <h3 className="text-sm font-semibold text-foreground">Notification Center</h3>
            <Link href="/notifications" onClick={() => setOpen(false)} className="text-xs text-primary hover:underline">
              View all
            </Link>
          </div>
          <div className="max-h-80 overflow-y-auto scrollbar-thin">
            {activity === null ? (
              <p className="px-4 py-6 text-center text-sm text-muted-foreground">Loading...</p>
            ) : activity.length === 0 ? (
              <p className="px-4 py-6 text-center text-sm text-muted-foreground">No notifications yet.</p>
            ) : (
              activity.map((act) => {
                const Icon = iconMap[act.icon] ?? CheckCircle2;
                return (
                  <div key={act.id} className="flex items-start gap-3 px-4 py-3 border-b border-border/50 last:border-0 hover:bg-muted/30">
                    <div className="p-1.5 rounded-lg bg-muted flex-shrink-0">
                      <Icon size={13} className="text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-foreground leading-relaxed">{act.message}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{act.time}</p>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
