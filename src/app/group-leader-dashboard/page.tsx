import React from 'react';
import { notFound } from 'next/navigation';
import AppLayout from '@/components/AppLayout';
import GroupLeaderHeader from './components/GroupLeaderHeader';
import GroupKPIRow from './components/GroupKPIRow';
import GroupPilgrimTable from './components/GroupPilgrimTable';
import WhatsAppPanel from './components/WhatsAppPanel';
import GroupAlertsPanel from './components/GroupAlertsPanel';
import { getGroupLeaders, getGroupLeaderByGroupId } from '@/lib/data/groupLeaders';
import { getPilgrimsByGroup } from '@/lib/data/pilgrims';
import { computeAtRisk } from '@/lib/data/campaign';

export default async function GroupLeaderDashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ group?: string }>;
}) {
  const { group } = await searchParams;
  const allGroupLeaders = await getGroupLeaders();
  if (allGroupLeaders.length === 0) {
    notFound();
  }

  const groupId = group && allGroupLeaders.some((gl) => gl.groupId === group) ? group : allGroupLeaders[0].groupId;
  const groupLeader = await getGroupLeaderByGroupId(groupId);
  if (!groupLeader) {
    notFound();
  }

  const pilgrims = await getPilgrimsByGroup(groupId);
  const alerts = computeAtRisk(pilgrims, 12);

  return (
    <AppLayout>
      <GroupLeaderHeader groupLeader={groupLeader} allGroupLeaders={allGroupLeaders} pilgrims={pilgrims} />
      <GroupKPIRow groupLeader={groupLeader} />
      <div className="grid grid-cols-1 xl:grid-cols-3 2xl:grid-cols-3 gap-6 mt-6">
        <div className="xl:col-span-2 space-y-6">
          <GroupPilgrimTable pilgrims={pilgrims} groupId={groupLeader.groupId} leaderName={groupLeader.name} />
        </div>
        <div className="xl:col-span-1 space-y-6">
          <GroupAlertsPanel alerts={alerts} />
          <WhatsAppPanel pilgrims={pilgrims} />
        </div>
      </div>
    </AppLayout>
  );
}
