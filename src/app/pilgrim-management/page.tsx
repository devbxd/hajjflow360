import React from 'react';
import AppLayout from '@/components/AppLayout';
import PilgrimManagementHeader from './components/PilgrimManagementHeader';
import PilgrimTable from './components/PilgrimTable';

export default function PilgrimManagementPage() {
  return (
    <AppLayout>
      <PilgrimManagementHeader />
      <PilgrimTable />
    </AppLayout>
  );
}