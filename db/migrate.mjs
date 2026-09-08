import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import path from 'path';
import pg from 'pg';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

if (!process.env.DATABASE_URL) {
  console.error('DATABASE_URL is not set. Run with: npm run db:migrate');
  process.exit(1);
}

const sql = readFileSync(path.join(__dirname, 'schema.sql'), 'utf-8');
const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });

try {
  await pool.query(sql);
  console.log('✓ Schema applied.');
} finally {
  await pool.end();
}
