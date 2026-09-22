import React from 'react';
import { redirect } from 'next/navigation';
import AppLayout from '@/components/AppLayout';
import { getCurrentUser } from '@/lib/auth/currentUser';
import NewSeasonClient from './NewSeasonClient';
import { getActiveSeason, getArchivedSeasons } from '@/lib/data/seasons';

export const dynamic = 'force-dynamic';

export default async function NewSeasonPage() {
  const session = await getCurrentUser();
  if (!session) redirect('/login');

  const [active, archived] = await Promise.all([
    getActiveSeason(session.companyId),
    getArchivedSeasons(session.companyId),
  ]);

  return (
    <AppLayout>
      <NewSeasonClient active={active} initialArchived={archived} />
    </AppLayout>
  );
}
