import { query } from '@/lib/db';

export interface AppUser {
  username: string;
  displayName: string;
  passwordHash: string;
}

interface StaffUserRow {
  username: string;
  display_name: string;
  password_hash: string;
}

function mapRow(row: StaffUserRow): AppUser {
  return { username: row.username, displayName: row.display_name, passwordHash: row.password_hash };
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
