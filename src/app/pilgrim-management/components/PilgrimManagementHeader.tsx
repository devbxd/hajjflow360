'use client';

import React, { useState } from 'react';
import { ScanLine, UserPlus } from 'lucide-react';
import type { GroupLeader } from '@/lib/mockData';
import AddPilgrimModal from './AddPilgrimModal';

export default function PilgrimManagementHeader({ totalPilgrims, groupLeaders }: { totalPilgrims: number; groupLeaders: GroupLeader[] }) {
  const [modalOpen, setModalOpen] = useState(false);
  const [startWithScan, setStartWithScan] = useState(false);

  const openScan = () => {
    setStartWithScan(true);
    setModalOpen(true);
  };
  const openBlank = () => {
    setStartWithScan(false);
    setModalOpen(true);
  };

  return (
    <>
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Pilgrim Management</h1>
          <p className="text-sm text-muted-foreground mt-1">{totalPilgrims} pilgrims registered</p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0 flex-wrap">
          <button onClick={openScan} className="btn-secondary text-sm flex items-center gap-1.5">
            <ScanLine size={14} />
            Passport OCR
          </button>
          <button onClick={openBlank} className="btn-primary text-sm flex items-center gap-1.5">
            <UserPlus size={14} />
            Add Pilgrim
          </button>
        </div>
      </div>

      <AddPilgrimModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        startWithScan={startWithScan}
        groupLeaders={groupLeaders}
      />
    </>
  );
}
