import React from 'react';
import { Layers, AlertTriangle } from 'lucide-react';

export default function AllocationHeader() {
  return (
    <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div className="flex items-center gap-3">
        <div className="p-2.5 rounded-xl bg-secondary">
          <Layers size={20} className="text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Allocation Management</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Bus seating · Hotel rooms · Flight manifests — Hajj 2027</p>
        </div>
      </div>
      <div className="flex items-center gap-3 flex-shrink-0">
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#FFFBEB] border border-[#D97706]/20">
          <AlertTriangle size={13} className="text-[#D97706]" />
          <span className="text-xs font-medium text-[#D97706]">52 pilgrims unallocated</span>
        </div>
        <button className="btn-primary text-sm">Auto-Assign Remaining</button>
      </div>
    </div>
  );
}