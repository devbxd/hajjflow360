import { NextResponse } from 'next/server';
import { getAllPilgrims } from '@/lib/data/pilgrims';
import { computeAtRisk } from '@/lib/data/campaign';
import { getRecentActivity } from '@/lib/data/activity';

export async function GET() {
  const pilgrims = await getAllPilgrims();
  const atRisk = computeAtRisk(pilgrims, 12);
  const activity = await getRecentActivity(50);

  const paymentDue = pilgrims.filter((p) => p.paymentStatus === 'partial' || p.paymentStatus === 'overdue').length;
  const emergencyCount = atRisk.filter((a) => a.severity === 'critical').length;

  return NextResponse.json({
    pilgrimManagement: pilgrims.length,
    paymentDue,
    emergency: emergencyCount,
    notifications: activity.length,
    totalPilgrims: pilgrims.length,
  });
}
