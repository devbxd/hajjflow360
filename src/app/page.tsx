import React from 'react';
import AppLayout from '@/components/AppLayout';
import CampaignHeader from './components/CampaignHeader';
import MetricsBentoGrid from './components/MetricsBentoGrid';
import DashboardCharts from './components/DashboardCharts';
import AtRiskTable from './components/AtRiskTable';
import ActivityFeed from './components/ActivityFeed';
import GroupLeaderSummary from './components/GroupLeaderSummary';

export default function CampaignDashboardPage() {
  return (
    <AppLayout>
      <CampaignHeader />
      <MetricsBentoGrid />
      <DashboardCharts />
      <div className="mt-6 grid grid-cols-1 xl:grid-cols-3 2xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2">
          <AtRiskTable />
        </div>
        <div className="xl:col-span-1">
          <ActivityFeed />
        </div>
      </div>
      <div className="mt-6">
        <GroupLeaderSummary />
      </div>
    </AppLayout>
  );
}