'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Layers, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';

export default function AllocationHeader({ unallocatedCount }: { unallocatedCount: number }) {
  const router = useRouter();
  const [running, setRunning] = useState(false);

  const handleAutoAssign = async () => {
    if (unallocatedCount === 0) {
      toast.info('Everyone already has a bus and a room.');
      return;
    }
    setRunning(true);
    try {
      const res = await fetch('/api/allocations/auto-assign', { method: 'POST' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Auto-assign failed');
      toast.success(`Assigned ${data.busesAssigned} pilgrims to buses and ${data.roomsAssigned} to hotel rooms.`);
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Auto-assign failed.');
    } finally {
      setRunning(false);
    }
  };

  return (
    <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div className="flex items-center gap-3">
        <div className="p-2.5 rounded-xl bg-secondary">
          <Layers size={20} className="text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Allocation Management</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Bus seating · Hotel rooms · Flight manifests</p>
        </div>
      </div>
      <div className="flex items-center gap-3 flex-shrink-0">
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#FFFBEB] border border-[#D97706]/20">
          <AlertTriangle size={13} className="text-[#D97706]" />
          <span className="text-xs font-medium text-[#D97706]">{unallocatedCount} pilgrims unallocated</span>
        </div>
        <button onClick={handleAutoAssign} disabled={running} className="btn-primary text-sm" style={{ opacity: running ? 0.7 : 1 }}>
          {running ? 'Assigning...' : 'Auto-Assign Remaining'}
        </button>
      </div>
    </div>
  );
}
