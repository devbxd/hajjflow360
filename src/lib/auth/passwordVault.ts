import crypto from 'crypto';
import { query } from '@/lib/db';


function encryptionKey() {
  const secret = process.env.SESSION_SECRET;
  if (!secret) throw new Error('SESSION_SECRET is not set');
  return crypto.createHash('sha256').update(secret).digest();
}

export function encryptPassword(plain: string): string {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', encryptionKey(), iv);
  const data = Buffer.concat([cipher.update(plain, 'utf8'), cipher.final()]);
  return [iv, cipher.getAuthTag(), data].map((b) => b.toString('base64')).join('.');
}

export function decryptPassword(stored: string): string {
  const [iv, tag, data] = stored.split('.').map((s) => Buffer.from(s, 'base64'));
  const decipher = crypto.createDecipheriv('aes-256-gcm', encryptionKey(), iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(data), decipher.final()]).toString('utf8');
}

export async function savePasswordRecord(username: string, plain: string): Promise<void> {
  await query(
    `INSERT INTO staff_password_vault (username, password_enc, updated_at)
     VALUES ($1, $2, now())
     ON CONFLICT (username) DO UPDATE SET password_enc = EXCLUDED.password_enc, updated_at = now()`,
    [username, encryptPassword(plain)]
  );
}

export interface PasswordRecordRow {
  username: string;
  display_name: string;
  password_enc: string | null;
  updated_at: Date | null;
}

export async function listPasswordRecords(): Promise<PasswordRecordRow[]> {
  return query<PasswordRecordRow>(
    `SELECT u.username, u.display_name, v.password_enc, v.updated_at
     FROM staff_users u
     LEFT JOIN staff_password_vault v ON v.username = u.username
     ORDER BY u.username`
  );
}
