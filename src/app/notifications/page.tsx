'use client';

import React, { useState } from 'react';
import AppLayout from '@/components/AppLayout';
import { recentActivity } from '@/lib/mockData';
import { CheckCircle2, CreditCard, ScanLine, AlertTriangle, Bus, MessageSquare, QrCode, Loader2, Bell } from 'lucide-react';

const ICONS: Record<string, React.ElementType> = {
  check: CheckCircle2,
  payment: CreditCard,
  scan: ScanLine,
  alert: AlertTriangle,
  bus: Bus,
  message: MessageSquare,
  qr: QrCode,
  processing: Loader2,
};

export default function NotificationsPage() {
  const [readIds, setReadIds] = useState<Set<string>>(new Set());

  const markAllRead = () => setReadIds(new Set(recentActivity.map((a) => a.id)));
  const toggleRead = (id: string) => {
    setReadIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const unreadCount = recentActivity.length - readIds.size;

  return (
    <AppLayout>
      <div className="flex items-center justify-between gap-4 flex-wrap mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <Bell size={20} className="text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-foreground">Notifications</h1>
            <p className="text-sm text-muted-foreground">{unreadCount} unread</p>
          </div>
        </div>
        <button onClick={markAllRead} className="btn-secondary text-sm">
          Mark all as read
        </button>
      </div>

      <div className="card-base p-0 divide-y divide-border">
        {recentActivity.map((activity) => {
          const Icon = ICONS[activity.icon] ?? Bell;
          const isRead = readIds.has(activity.id);
          return (
            <button
              key={activity.id}
              onClick={() => toggleRead(activity.id)}
              className={`w-full flex items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-muted/40 ${isRead ? 'opacity-60' : ''}`}
            >
              <div className={`p-2 rounded-lg flex-shrink-0 ${isRead ? 'bg-muted' : 'bg-secondary'}`}>
                <Icon size={14} className={isRead ? 'text-muted-foreground' : 'text-primary'} />
              </div>
              <div className="flex-1 min-w-0">
                <p className={`text-sm ${isRead ? 'text-muted-foreground' : 'text-foreground font-medium'}`}>{activity.message}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{activity.time}</p>
              </div>
              {!isRead && <span className="w-2 h-2 rounded-full bg-primary mt-1.5 flex-shrink-0" />}
            </button>
          );
        })}
      </div>
    </AppLayout>
  );
}
