import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/currentUser';
import { getAllPilgrims } from '@/lib/data/pilgrims';
import { computeAtRisk } from '@/lib/data/campaign';
import { getRecentActivity } from '@/lib/data/activity';
import { getActiveSeason } from '@/lib/data/seasons';

export async function GET() {
  const session = await getCurrentUser();
  if (!session) {
    return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 });
  }

  const [pilgrims, activity, activeSeason] = await Promise.all([
    getAllPilgrims(session.companyId),
    getRecentActivity(session.companyId, 50),
    getActiveSeason(session.companyId),
  ]);
  const atRisk = computeAtRisk(pilgrims, 12);

  const paymentDue = pilgrims.filter((p) => p.paymentStatus === 'partial' || p.paymentStatus === 'overdue').length;
  const emergencyCount = atRisk.filter((a) => a.severity === 'critical').length;

  return NextResponse.json({
    pilgrimManagement: pilgrims.length,
    paymentDue,
    emergency: emergencyCount,
    notifications: activity.length,
    totalPilgrims: pilgrims.length,
    activeSeasonName: activeSeason.name,
    activeSeasonStart: activeSeason.startDate,
  });
}
