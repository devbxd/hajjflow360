import { query } from '@/lib/db';

export interface ActivityEntry {
  id: string;
  type: string;
  message: string;
  icon: string;
  time: string;
}

function timeAgo(date: Date): string {
  const diffMs = Date.now() - date.getTime();
  const minutes = Math.round(diffMs / 60000);
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours} hr ago`;
  const days = Math.round(hours / 24);
  return `${days}d ago`;
}

export async function getRecentActivity(companyId: string, limit = 20): Promise<ActivityEntry[]> {
  const rows = await query<{ id: number; type: string; message: string; icon: string; created_at: string }>(
    'SELECT id, type, message, icon, created_at FROM activity_log WHERE company_id = $1 ORDER BY created_at DESC LIMIT $2',
    [companyId, limit]
  );
  return rows.map((r) => ({
    id: `ACT-${r.id}`,
    type: r.type,
    message: r.message,
    icon: r.icon,
    time: timeAgo(new Date(r.created_at)),
  }));
}

export async function logActivity(type: string, message: string, icon: string, companyId: string): Promise<void> {
  await query('INSERT INTO activity_log (type, message, icon, company_id) VALUES ($1, $2, $3, $4)', [type, message, icon, companyId]);
}

// activity_log is a free-text log, not linked to a pilgrim_id, but every
// entry that involves a pilgrim consistently mentions their id in the
// message (e.g. "... (PIL-001) ..."), so matching on that substring gives a
// real per-pilgrim history without a schema change.
export async function getActivityForPilgrim(pilgrimId: string, companyId: string, limit = 20): Promise<ActivityEntry[]> {
  const rows = await query<{ id: number; type: string; message: string; icon: string; created_at: string }>(
    `SELECT id, type, message, icon, created_at FROM activity_log WHERE message ILIKE $1 AND company_id = $2 ORDER BY created_at DESC LIMIT $3`,
    [`%${pilgrimId}%`, companyId, limit]
  );
  return rows.map((r) => ({
    id: `ACT-${r.id}`,
    type: r.type,
    message: r.message,
    icon: r.icon,
    time: timeAgo(new Date(r.created_at)),
  }));
}
