import { Pool } from 'pg';

declare global {
  // eslint-disable-next-line no-var
  var __hf360Pool: Pool | undefined;
}

function createPool() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error('DATABASE_URL is not set');
  }
  return new Pool({ connectionString });
}

// Reuse the pool across hot-reloads / server-action invocations in dev so we
// don't exhaust Neon's connection limit.
export const pool = global.__hf360Pool ?? createPool();
if (process.env.NODE_ENV !== 'production') {
  global.__hf360Pool = pool;
}

export async function query<T = unknown>(text: string, params?: unknown[]): Promise<T[]> {
  const result = await pool.query(text, params);
  return result.rows as T[];
}
