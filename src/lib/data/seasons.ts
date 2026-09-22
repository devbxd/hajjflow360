import { query, pool } from '@/lib/db';

export interface SeasonStats {
  totalPilgrims: number;
  totalGroups: number;
  totalRevenue: number;
  totalExpenses: number;
  netProfit: number;
  totalInvoices: number;
}

export interface Season {
  id: number;
  name: string;
  startDate: string;
  status: 'active' | 'archived';
  archivedAt: string | null;
  createdAt: string;
  stats: SeasonStats | null;
}

function formatDate(value: unknown): string {
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  return String(value);
}

function mapSeason(row: {
  id: number; name: string; start_date: string; status: 'active' | 'archived';
  archived_at: string | null; created_at: string; stats: SeasonStats | null;
}): Season {
  return {
    id: row.id,
    name: row.name,
    startDate: formatDate(row.start_date),
    status: row.status,
    archivedAt: row.archived_at,
    createdAt: row.created_at,
    stats: row.stats,
  };
}

// Every company should always have exactly one active season; older
// deployments (before this feature existed) won't have one yet, so it's
// lazily created the first time it's asked for.
export async function getActiveSeason(companyId: string): Promise<Season> {
  const rows = await query<Parameters<typeof mapSeason>[0]>(
    `SELECT id, name, start_date, status, archived_at, created_at, stats FROM seasons WHERE company_id = $1 AND status = 'active' LIMIT 1`,
    [companyId]
  );
  if (rows.length) return mapSeason(rows[0]);

  const [created] = await query<Parameters<typeof mapSeason>[0]>(
    `INSERT INTO seasons (company_id, name, start_date, status) VALUES ($1, 'Hajj 2027', CURRENT_DATE, 'active')
     RETURNING id, name, start_date, status, archived_at, created_at, stats`,
    [companyId]
  );
  return mapSeason(created);
}

export async function getArchivedSeasons(companyId: string): Promise<Season[]> {
  const rows = await query<Parameters<typeof mapSeason>[0]>(
    `SELECT id, name, start_date, status, archived_at, created_at, stats FROM seasons WHERE company_id = $1 AND status = 'archived' ORDER BY archived_at DESC`,
    [companyId]
  );
  return rows.map(mapSeason);
}

export async function getSeasonSnapshot(id: number, companyId: string): Promise<unknown | null> {
  const rows = await query<{ snapshot: unknown }>(
    `SELECT snapshot FROM seasons WHERE id = $1 AND company_id = $2 AND status = 'archived'`,
    [id, companyId]
  );
  return rows.length ? rows[0].snapshot : null;
}

export interface NewSeasonInput {
  name: string;
  startDate: string;
}

// Archives everything currently in the operational tables into the active
// season's snapshot, wipes those tables, then opens a new active season.
// Runs as one transaction so a failure partway through never leaves the
// company with both a half-archived old season and a half-reset new one.
export async function startNewSeason(input: NewSeasonInput, companyId: string): Promise<number> {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const active = (
      await client.query<{ id: number; name: string; start_date: string }>(
        `SELECT id, name, start_date FROM seasons WHERE company_id = $1 AND status = 'active' LIMIT 1`,
        [companyId]
      )
    ).rows[0];

    const [pilgrims, groupLeaders, hotels, buses, flights, payments, expenses, invoices, activityLog] = await Promise.all([
      client.query('SELECT * FROM pilgrims WHERE company_id = $1', [companyId]),
      client.query('SELECT * FROM group_leaders WHERE company_id = $1', [companyId]),
      client.query('SELECT * FROM hotels WHERE company_id = $1', [companyId]),
      client.query('SELECT * FROM buses WHERE company_id = $1', [companyId]),
      client.query('SELECT * FROM flights WHERE company_id = $1', [companyId]),
      client.query(
        `SELECT pay.* FROM payments pay JOIN pilgrims p ON p.id = pay.pilgrim_id WHERE p.company_id = $1`,
        [companyId]
      ),
      client.query('SELECT * FROM expenses WHERE company_id = $1', [companyId]),
      client.query('SELECT * FROM invoices WHERE company_id = $1', [companyId]),
      client.query('SELECT * FROM activity_log WHERE company_id = $1 ORDER BY created_at DESC', [companyId]),
    ]);

    const totalRevenue = payments.rows
      .filter((r) => r.status === 'cleared')
      .reduce((sum, r) => sum + Number(r.amount), 0);
    const totalExpenses = expenses.rows.reduce((sum, r) => sum + Number(r.amount), 0);

    const stats: SeasonStats = {
      totalPilgrims: pilgrims.rows.length,
      totalGroups: groupLeaders.rows.length,
      totalRevenue,
      totalExpenses,
      netProfit: totalRevenue - totalExpenses,
      totalInvoices: invoices.rows.length,
    };

    const snapshot = {
      pilgrims: pilgrims.rows,
      groupLeaders: groupLeaders.rows,
      hotels: hotels.rows,
      buses: buses.rows,
      flights: flights.rows,
      payments: payments.rows,
      expenses: expenses.rows,
      invoices: invoices.rows,
      activityLog: activityLog.rows,
    };

    if (active) {
      await client.query(
        `UPDATE seasons SET status = 'archived', archived_at = now(), snapshot = $2, stats = $3 WHERE id = $1`,
        [active.id, JSON.stringify(snapshot), JSON.stringify(stats)]
      );
    }

    // Order respects foreign keys: pilgrims cascade-delete their own
    // payments and invoices, so those never need an explicit DELETE.
    await client.query('DELETE FROM pilgrims WHERE company_id = $1', [companyId]);
    await client.query('DELETE FROM buses WHERE company_id = $1', [companyId]);
    await client.query('DELETE FROM flights WHERE company_id = $1', [companyId]);
    await client.query('DELETE FROM hotels WHERE company_id = $1', [companyId]);
    await client.query('DELETE FROM group_leaders WHERE company_id = $1', [companyId]);
    await client.query('DELETE FROM expenses WHERE company_id = $1', [companyId]);
    await client.query('DELETE FROM invoices WHERE company_id = $1', [companyId]);
    await client.query('DELETE FROM activity_log WHERE company_id = $1', [companyId]);

    const [{ id: newSeasonId }] = (
      await client.query<{ id: number }>(
        `INSERT INTO seasons (company_id, name, start_date, status) VALUES ($1, $2, $3, 'active') RETURNING id`,
        [companyId, input.name, input.startDate]
      )
    ).rows;

    await client.query(
      `INSERT INTO activity_log (type, message, icon, company_id) VALUES ($1, $2, $3, $4)`,
      ['season', `New season "${input.name}" started — previous season archived with ${stats.totalPilgrims} pilgrims`, 'calendar', companyId]
    );

    await client.query('COMMIT');
    return newSeasonId;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}
