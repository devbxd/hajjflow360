import React from 'react';
import { Users, Phone, Star } from 'lucide-react';
import { groupLeaders } from '@/lib/mockData';

export default function GroupLeaderHeader() {
  const gl = groupLeaders?.[0];
  return (
    <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div className="flex items-center gap-4">
        <div className="w-14 h-14 rounded-xl bg-primary flex items-center justify-center flex-shrink-0">
          <span className="text-xl font-bold text-primary-foreground">SA</span>
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-semibold text-foreground">{gl?.name}</h1>
            <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-accent/10 text-accent text-xs font-semibold">
              <Star size={10} />
              Group Leader
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-3 mt-1">
            <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <Users size={13} />{gl?.pilgrimCount} pilgrims
            </span>
            <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <Phone size={13} />
              {gl?.phone}
            </span>
            <span className="text-sm text-muted-foreground font-mono-data">{gl?.groupId}</span>
          </div>
        </div>
      </div>
      <div className="flex items-center gap-3 flex-shrink-0">
        <button className="btn-secondary text-sm">Export Group List</button>
        <button className="btn-primary text-sm">Send Broadcast</button>
      </div>
    </div>
  );
}