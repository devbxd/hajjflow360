import { query } from '@/lib/db';

export interface Invoice {
  id: number;
  invoiceNumber: string;
  pilgrimId: string;
  pilgrimName: string;
  description: string;
  amount: number;
  status: 'unpaid' | 'paid' | 'cancelled';
  issueDate: string;
  dueDate: string | null;
  createdAt: string;
}

function formatDate(value: unknown): string | null {
  if (value === null || value === undefined) return null;
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  return String(value);
}

export async function getInvoices(companyId: string): Promise<Invoice[]> {
  const rows = await query<{
    id: number; invoice_number: string; pilgrim_id: string; name: string; description: string;
    amount: string; status: Invoice['status']; issue_date: string; due_date: string | null; created_at: string;
  }>(
    `SELECT inv.id, inv.invoice_number, inv.pilgrim_id, p.name, inv.description, inv.amount, inv.status, inv.issue_date, inv.due_date, inv.created_at
     FROM invoices inv
     JOIN pilgrims p ON p.id = inv.pilgrim_id
     WHERE inv.company_id = $1
     ORDER BY inv.issue_date DESC, inv.id DESC`,
    [companyId]
  );
  return rows.map((r) => ({
    id: r.id,
    invoiceNumber: r.invoice_number,
    pilgrimId: r.pilgrim_id,
    pilgrimName: r.name,
    description: r.description,
    amount: Number(r.amount),
    status: r.status,
    issueDate: formatDate(r.issue_date)!,
    dueDate: formatDate(r.due_date),
    createdAt: r.created_at,
  }));
}

export interface NewInvoiceInput {
  pilgrimId: string;
  description: string;
  amount: number;
  issueDate: string;
  dueDate?: string;
}

export async function createInvoice(input: NewInvoiceInput, companyId: string): Promise<{ id: number; invoiceNumber: string }> {
  const [{ next_seq }] = await query<{ next_seq: string }>(
    'SELECT COUNT(*) + 1 AS next_seq FROM invoices WHERE company_id = $1',
    [companyId]
  );
  const invoiceNumber = `INV-${new Date().getFullYear()}-${String(next_seq).padStart(4, '0')}`;

  const [row] = await query<{ id: number }>(
    `INSERT INTO invoices (invoice_number, pilgrim_id, description, amount, status, issue_date, due_date, company_id)
     VALUES ($1, $2, $3, $4, 'unpaid', $5, $6, $7) RETURNING id`,
    [invoiceNumber, input.pilgrimId, input.description, input.amount, input.issueDate, input.dueDate ?? null, companyId]
  );
  return { id: row.id, invoiceNumber };
}

export async function updateInvoiceStatus(id: number, status: Invoice['status'], companyId: string): Promise<void> {
  await query('UPDATE invoices SET status = $2 WHERE id = $1 AND company_id = $3', [id, status, companyId]);
}

export async function deleteInvoice(id: number, companyId: string): Promise<void> {
  await query('DELETE FROM invoices WHERE id = $1 AND company_id = $2', [id, companyId]);
}
