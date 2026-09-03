import React from 'react';
import { Calendar, MapPin, Users, Clock } from 'lucide-react';

export default function CampaignHeader() {
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
            15 Sep – 22 Oct 2027
          </span>
          <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <MapPin size={14} />
            Makkah & Madinah
          </span>
          <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <Users size={14} />
            850 / 900 pilgrims
          </span>
          <span className="flex items-center gap-1.5 text-sm text-accent font-medium">
            <Clock size={14} />
            Departure in 12 days
          </span>
        </div>
      </div>
      <div className="flex items-center gap-3 flex-shrink-0">
        <button className="btn-secondary text-sm">
          Export Report
        </button>
        <button className="btn-primary text-sm">
          + Add Pilgrim
        </button>
      </div>
    </div>
  );
}