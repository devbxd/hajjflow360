import React from 'react';
import { notFound, redirect } from 'next/navigation';
import AppLayout from '@/components/AppLayout';
import { getCurrentUser } from '@/lib/auth/currentUser';
import { query } from '@/lib/db';
import { MANASIK_AI_ENABLED, MANASIK_AI_LOCKED } from '@/lib/manasikAi/feature';
import ManasikChat from './ManasikChat';

export const dynamic = 'force-dynamic';

export default async function ManasikAiPage() {
  if (!MANASIK_AI_ENABLED) notFound();
  const session = await getCurrentUser();
  if (!session) redirect('/login');

  const [company] = await query<{ name: string }>('SELECT name FROM companies WHERE id = $1', [session.companyId]).catch(() => []);

  return (
    <AppLayout>
      <ManasikChat
        locked={MANASIK_AI_LOCKED}
        brandDefault={company?.name ?? 'ManasikPro'}
        geminiReady={Boolean(process.env.GEMINI_API_KEY)}
        pexelsReady={Boolean(process.env.PEXELS_API_KEY)}
      />
    </AppLayout>
  );
}
