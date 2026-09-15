import { query, pool } from '@/lib/db';
import type { GroupLeader } from '@/lib/mockData';

interface GroupLeaderRow {
  id: string;
  name: string;
  phone: string;
  group_id: string;
  pilgrim_count: string;
  visa_approved: string;
  passport_verified: string;
  payment_complete: string;
  attendance_present: string;
}

function mapRow(row: GroupLeaderRow): GroupLeader {
  return {
    id: row.id,
    name: row.name,
    phone: row.phone,
    groupId: row.group_id,
    pilgrimCount: Number(row.pilgrim_count),
    visaApproved: Number(row.visa_approved),
    passportVerified: Number(row.passport_verified),
    paymentComplete: Number(row.payment_complete),
    attendancePresent: Number(row.attendance_present),
  };
}

function statsQuery(extraWhere: string) {
  return `
    SELECT
      gl.id, gl.name, gl.phone, gl.group_id,
      COUNT(pv.id) AS pilgrim_count,
      COUNT(*) FILTER (WHERE pv.visa_status = 'approved') AS visa_approved,
      COUNT(*) FILTER (WHERE pv.passport_status = 'verified') AS passport_verified,
      COUNT(*) FILTER (WHERE pv.payment_paid >= pv.payment_total) AS payment_complete,
      COUNT(*) FILTER (WHERE pv.attendance_status = 'present') AS attendance_present
    FROM group_leaders gl
    LEFT JOIN pilgrims_with_paid pv ON pv.group_id = gl.group_id AND pv.company_id = gl.company_id
    WHERE gl.company_id = $1 ${extraWhere}
    GROUP BY gl.id, gl.name, gl.phone, gl.group_id
  `;
}

export async function getGroupLeaders(companyId: string): Promise<GroupLeader[]> {
  const rows = await query<GroupLeaderRow>(`${statsQuery('')} ORDER BY gl.id`, [companyId]);
  return rows.map(mapRow);
}

export async function getGroupLeaderByGroupId(groupId: string, companyId: string): Promise<GroupLeader | null> {
  const rows = await query<GroupLeaderRow>(statsQuery('AND gl.group_id = $2'), [companyId, groupId]);
  return rows.length ? mapRow(rows[0]) : null;
}

export interface NewGroupLeaderInput {
  name: string;
  phone: string;
}

export async function createGroupLeader(input: NewGroupLeaderInput, companyId: string): Promise<{ id: string; groupId: string }> {
  const [{ next_seq }] = await query<{ next_seq: string }>(
    `SELECT COALESCE(MAX(NULLIF(regexp_replace(id, '\\D', '', 'g'), '')::int), 0) + 1 AS next_seq FROM group_leaders`
  );
  const seq = String(next_seq).padStart(3, '0');
  const id = `GL-${seq}`;
  const groupId = `GRP-${seq}`;

  await query(
    'INSERT INTO group_leaders (id, name, phone, group_id, company_id) VALUES ($1, $2, $3, $4, $5)',
    [id, input.name, input.phone, groupId, companyId]
  );

  return { id, groupId };
}

export interface DeleteGroupLeaderResult {
  movedPilgrims: number;
  movedTo: string | null;
}

// Pilgrims (and buses) reference this group via a NOT NULL foreign key, so
// the group can't simply be deleted out from under them. Rather than make
// staff go reassign everyone by hand first, this moves them onto another of
// the company's groups automatically, then deletes — one confirmation, done.
// Only fails if this is the company's only group (nowhere to move them to).
export async function deleteGroupLeader(groupId: string, companyId: string): Promise<DeleteGroupLeaderResult> {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const [{ count }] = (
      await client.query<{ count: string }>(
        'SELECT COUNT(*) AS count FROM pilgrims WHERE group_id = $1 AND company_id = $2',
        [groupId, companyId]
      )
    ).rows;
    const pilgrimCount = Number(count);

    let movedTo: string | null = null;
    if (pilgrimCount > 0) {
      const fallback = (
        await client.query<{ group_id: string }>(
          'SELECT group_id FROM group_leaders WHERE company_id = $1 AND group_id != $2 ORDER BY id LIMIT 1',
          [companyId, groupId]
        )
      ).rows[0];

      if (!fallback) {
        throw new Error(
          `This is the only group and it still has ${pilgrimCount} pilgrim${pilgrimCount > 1 ? 's' : ''}. Add another group first.`
        );
      }
      movedTo = fallback.group_id;

      await client.query('UPDATE pilgrims SET group_id = $1 WHERE group_id = $2 AND company_id = $3', [movedTo, groupId, companyId]);
      await client.query('UPDATE buses SET group_id = $1 WHERE group_id = $2 AND company_id = $3', [movedTo, groupId, companyId]);
    }

    await client.query('DELETE FROM group_leaders WHERE group_id = $1 AND company_id = $2', [groupId, companyId]);

    await client.query('COMMIT');
    return { movedPilgrims: pilgrimCount, movedTo };
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}
