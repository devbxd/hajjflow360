'use client';

import React from 'react';
import dynamic from 'next/dynamic';

const VisaStatusChart = dynamic(() => import('./charts/VisaStatusChart'), { ssr: false });
const GroupProgressChart = dynamic(() => import('./charts/GroupProgressChart'), { ssr: false });
const RegistrationTimelineChart = dynamic(() => import('./charts/RegistrationTimelineChart'), { ssr: false });

export default function DashboardCharts() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-3 gap-6 mb-6">
      <div className="card-base">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-semibold text-foreground">Visa Status Distribution</h3>
            <p className="text-xs text-muted-foreground mt-0.5">850 pilgrims total</p>
          </div>
          <span className="text-xs text-muted-foreground">As of today</span>
        </div>
        <VisaStatusChart />
      </div>
      <div className="card-base">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-semibold text-foreground">Group Compliance Rate</h3>
            <p className="text-xs text-muted-foreground mt-0.5">Visa + payment + passport</p>
          </div>
        </div>
        <GroupProgressChart />
      </div>
      <div className="card-base md:col-span-2 xl:col-span-1">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-semibold text-foreground">Registration Timeline</h3>
            <p className="text-xs text-muted-foreground mt-0.5">Cumulative pilgrim count</p>
          </div>
        </div>
        <RegistrationTimelineChart />
      </div>
    </div>
  );
}