import React from 'react';
import AppLayout from '@/components/AppLayout';
import GroupLeaderHeader from './components/GroupLeaderHeader';
import GroupKPIRow from './components/GroupKPIRow';
import GroupPilgrimTable from './components/GroupPilgrimTable';
import WhatsAppPanel from './components/WhatsAppPanel';
import GroupAlertsPanel from './components/GroupAlertsPanel';

export default function GroupLeaderDashboardPage() {
  return (
    <AppLayout>
      <GroupLeaderHeader />
      <GroupKPIRow />
      <div className="grid grid-cols-1 xl:grid-cols-3 2xl:grid-cols-3 gap-6 mt-6">
        <div className="xl:col-span-2 space-y-6">
          <GroupPilgrimTable />
        </div>
        <div className="xl:col-span-1 space-y-6">
          <GroupAlertsPanel />
          <WhatsAppPanel />
        </div>
      </div>
    </AppLayout>
  );
}