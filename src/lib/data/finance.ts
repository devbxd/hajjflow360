import { query } from '@/lib/db';

export interface Expense {
  id: number;
  description: string;
  category: string;
  amount: number;
  spentOn: string;
  createdAt: string;
}

function formatDate(value: unknown): string {
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  return String(value);
}

export async function getExpenses(): Promise<Expense[]> {
  const rows = await query<{
    id: number; description: string; category: string; amount: string; spent_on: string; created_at: string;
  }>('SELECT id, description, category, amount, spent_on, created_at FROM expenses ORDER BY spent_on DESC, id DESC');
  return rows.map((r) => ({
    id: r.id,
    description: r.description,
    category: r.category,
    amount: Number(r.amount),
    spentOn: formatDate(r.spent_on),
    createdAt: r.created_at,
  }));
}

export interface NewExpenseInput {
  description: string;
  category: string;
  amount: number;
  spentOn: string;
}

export async function createExpense(input: NewExpenseInput): Promise<number> {
  const [row] = await query<{ id: number }>(
    'INSERT INTO expenses (description, category, amount, spent_on) VALUES ($1, $2, $3, $4) RETURNING id',
    [input.description, input.category, input.amount, input.spentOn]
  );
  return row.id;
}

export async function deleteExpense(id: number): Promise<void> {
  await query('DELETE FROM expenses WHERE id = $1', [id]);
}

export async function getTotalExpenses(): Promise<number> {
  const [{ total }] = await query<{ total: string }>('SELECT COALESCE(SUM(amount), 0) AS total FROM expenses');
  return Number(total);
}

export interface MonthlyExpense {
  month: string;
  spent: number;
}

export async function getMonthlyExpenses(): Promise<MonthlyExpense[]> {
  const rows = await query<{ month_start: string; month: string; spent: string }>(`
    SELECT
      date_trunc('month', spent_on) AS month_start,
      to_char(date_trunc('month', spent_on), 'Mon YY') AS month,
      SUM(amount) AS spent
    FROM expenses
    GROUP BY date_trunc('month', spent_on)
    ORDER BY month_start
  `);
  return rows.map((r) => ({ month: r.month, spent: Number(r.spent) }));
}
