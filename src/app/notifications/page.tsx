import React from 'react';
import { redirect } from 'next/navigation';
import AppLayout from '@/components/AppLayout';
import { getCurrentUser } from '@/lib/auth/currentUser';
import { getRecentActivity } from '@/lib/data/activity';
import NotificationsClient from './NotificationsClient';

export const dynamic = 'force-dynamic';

export default async function NotificationsPage() {
  const session = await getCurrentUser();
  if (!session) redirect('/login');

  const activity = await getRecentActivity(session.companyId, 50);

  return (
    <AppLayout>
      <NotificationsClient activity={activity} />
    </AppLayout>
  );
}
