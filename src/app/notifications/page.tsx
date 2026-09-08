import React from 'react';
import AppLayout from '@/components/AppLayout';
import { getRecentActivity } from '@/lib/data/activity';
import NotificationsClient from './NotificationsClient';

export const dynamic = 'force-dynamic';

export default async function NotificationsPage() {
  const activity = await getRecentActivity(50);

  return (
    <AppLayout>
      <NotificationsClient activity={activity} />
    </AppLayout>
  );
}
