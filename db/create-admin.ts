import pg from 'pg';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

// Creates the admin account (username "admin") in its own empty company, which only sees the accounts page.

if (!process.env.DATABASE_URL || !process.env.SESSION_SECRET) {
  console.error('DATABASE_URL and SESSION_SECRET must be set. Run with: npm run db:create-admin');
  process.exit(1);
}

const ADMIN_COMPANY_ID = 'CO-ADMIN';
const USERNAME = 'admin';
const PASSWORD = 'Boudhajj0119';

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });

function encrypt(plain: string) {
  const key = crypto.createHash('sha256').update(process.env.SESSION_SECRET as string).digest();
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  const data = Buffer.concat([cipher.update(plain, 'utf8'), cipher.final()]);
  return [iv, cipher.getAuthTag(), data].map((b) => b.toString('base64')).join('.');
}

async function main() {
  await pool.query(
    `INSERT INTO companies (id, name) VALUES ($1, 'Administration') ON CONFLICT (id) DO NOTHING`,
    [ADMIN_COMPANY_ID]
  );
  await pool.query(
    `INSERT INTO staff_users (username, display_name, password_hash, company_id)
     VALUES ($1, 'Admin', $2, $3)
     ON CONFLICT (username) DO UPDATE SET password_hash = EXCLUDED.password_hash, company_id = EXCLUDED.company_id`,
    [USERNAME, bcrypt.hashSync(PASSWORD, 10), ADMIN_COMPANY_ID]
  );
  await pool.query(
    `INSERT INTO staff_password_vault (username, password_enc, updated_at)
     VALUES ($1, $2, now())
     ON CONFLICT (username) DO UPDATE SET password_enc = EXCLUDED.password_enc, updated_at = now()`,
    [USERNAME, encrypt(PASSWORD)]
  );
  console.log(`Admin account ready: username "${USERNAME}".`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => pool.end());
