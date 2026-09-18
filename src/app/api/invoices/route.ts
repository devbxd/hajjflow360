import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/currentUser';
import { getInvoices, createInvoice, type NewInvoiceInput } from '@/lib/data/invoices';
import { logActivity } from '@/lib/data/activity';

export async function GET() {
  const session = await getCurrentUser();
  if (!session) {
    return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 });
  }
  const invoices = await getInvoices(session.companyId);
  return NextResponse.json({ invoices });
}

export async function POST(req: NextRequest) {
  const session = await getCurrentUser();
  if (!session) {
    return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 });
  }

  let body: Partial<NewInvoiceInput>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request.' }, { status: 400 });
  }

  if (!body.pilgrimId || !body.description || !body.amount || !body.issueDate) {
    return NextResponse.json({ error: 'Missing required fields.' }, { status: 400 });
  }

  try {
    const { id, invoiceNumber } = await createInvoice({
      pilgrimId: body.pilgrimId,
      description: body.description,
      amount: Number(body.amount),
      issueDate: body.issueDate,
      dueDate: body.dueDate,
    }, session.companyId);
    await logActivity('finance', `Invoice ${invoiceNumber} (SAR ${Number(body.amount).toLocaleString()}) created by ${session.displayName}`, 'receipt', session.companyId);
    return NextResponse.json({ ok: true, id, invoiceNumber });
  } catch {
    return NextResponse.json({ error: 'Failed to create invoice.' }, { status: 400 });
  }
}
