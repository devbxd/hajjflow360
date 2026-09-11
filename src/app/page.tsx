import React from 'react';
import { redirect } from 'next/navigation';
import AppLayout from '@/components/AppLayout';
import { getCurrentUser } from '@/lib/auth/currentUser';
import CampaignHeader from './components/CampaignHeader';
import MetricsBentoGrid from './components/MetricsBentoGrid';
import OperationsAlerts from './components/OperationsAlerts';
import DashboardCharts from './components/DashboardCharts';
import AtRiskTable from './components/AtRiskTable';
import ActivityFeed from './components/ActivityFeed';
import GroupLeaderSummary from './components/GroupLeaderSummary';
import { getAllPilgrims } from '@/lib/data/pilgrims';
import { getGroupLeaders } from '@/lib/data/groupLeaders';
import { getCampaignStats, computeAtRisk, getRegistrationTimeline } from '@/lib/data/campaign';
import { getRecentActivity } from '@/lib/data/activity';
import { getOperationsAlerts } from '@/lib/data/alerts';
import type { VisaChartDatum } from './components/charts/VisaStatusChart';
import type { GroupProgressDatum } from './components/charts/GroupProgressChart';

// Reads live data on every request instead of being frozen at build time.
export const dynamic = 'force-dynamic';

const VISA_COLORS: Record<string, string> = {
  Approved: '#16A34A',
  Pending: '#D97706',
  Processing: '#2563EB',
  Rejected: '#DC2626',
};

export default async function CampaignDashboardPage() {
  const session = await getCurrentUser();
  if (!session) redirect('/login');

  const [pilgrims, groupLeaders, stats, registrationData, activity, operationsAlerts] = await Promise.all([
    getAllPilgrims(session.companyId),
    getGroupLeaders(session.companyId),
    getCampaignStats(session.companyId),
    getRegistrationTimeline(session.companyId),
    getRecentActivity(session.companyId, 8),
    getOperationsAlerts(session.companyId),
  ]);

  const atRisk = computeAtRisk(pilgrims, Math.max(1, Math.ceil((new Date(2027, 8, 15).getTime() - Date.now()) / 86400000)));

  const visaData: VisaChartDatum[] = [
    { name: 'Approved', value: stats.visaApproved, fill: VISA_COLORS.Approved },
    { name: 'Pending', value: stats.visaPending, fill: VISA_COLORS.Pending },
    { name: 'Processing', value: stats.visaProcessing, fill: VISA_COLORS.Processing },
    { name: 'Rejected', value: stats.visaRejected, fill: VISA_COLORS.Rejected },
  ];

  const groupProgressData: GroupProgressDatum[] = groupLeaders.map((gl) => {
    const total = gl.pilgrimCount || 1;
    return {
      group: gl.groupId,
      leader: gl.name.split(' ').slice(0, 2).join(' '),
      pilgrims: gl.pilgrimCount,
      visa: Math.round((gl.visaApproved / total) * 1000) / 10,
      payment: Math.round((gl.paymentComplete / total) * 1000) / 10,
      passport: Math.round((gl.passportVerified / total) * 1000) / 10,
    };
  });

  return (
    <AppLayout>
      <CampaignHeader stats={stats} pilgrims={pilgrims} />
      <OperationsAlerts alerts={operationsAlerts} />
      <MetricsBentoGrid stats={stats} />
      <DashboardCharts
        totalPilgrims={stats.totalPilgrims}
        visaData={visaData}
        groupProgressData={groupProgressData}
        registrationData={registrationData}
      />
      <div className="mt-6 grid grid-cols-1 xl:grid-cols-3 2xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2">
          <AtRiskTable data={atRisk} />
        </div>
        <div className="xl:col-span-1">
          <ActivityFeed activity={activity} />
        </div>
      </div>
      <div className="mt-6">
        <GroupLeaderSummary groupLeaders={groupLeaders} />
      </div>
    </AppLayout>
  );
}
