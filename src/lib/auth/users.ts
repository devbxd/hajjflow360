import { query } from '@/lib/db';

export interface AppUser {
  username: string;
  displayName: string;
  passwordHash: string;
  companyId: string;
}

interface StaffUserRow {
  username: string;
  display_name: string;
  password_hash: string;
  company_id: string;
}

function mapRow(row: StaffUserRow): AppUser {
  return { username: row.username, displayName: row.display_name, passwordHash: row.password_hash, companyId: row.company_id };
}

export async function findUser(username: string): Promise<AppUser | undefined> {
  const rows = await query<StaffUserRow>('SELECT * FROM staff_users WHERE lower(username) = lower($1)', [username]);
  return rows.length ? mapRow(rows[0]) : undefined;
}

export async function updatePasswordHash(username: string, passwordHash: string): Promise<boolean> {
  const rows = await query('UPDATE staff_users SET password_hash = $2 WHERE lower(username) = lower($1) RETURNING username', [
    username,
    passwordHash,
  ]);
  return rows.length > 0;
}
