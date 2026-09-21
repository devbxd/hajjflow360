import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/currentUser';
import { getRecentPayments, getPaymentsForPilgrim, createPayment, type NewPaymentInput } from '@/lib/data/pilgrims';
import { recalculateInvoiceStatus } from '@/lib/data/invoices';
import { logActivity } from '@/lib/data/activity';

export async function GET(req: NextRequest) {
  const session = await getCurrentUser();
  if (!session) {
    return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 });
  }
  const pilgrimId = req.nextUrl.searchParams.get('pilgrimId');
  if (pilgrimId) {
    const payments = await getPaymentsForPilgrim(pilgrimId, session.companyId);
    return NextResponse.json({ payments });
  }
  const payments = await getRecentPayments(session.companyId, 500);
  return NextResponse.json({ payments });
}

export async function POST(req: NextRequest) {
  const session = await getCurrentUser();
  if (!session) {
    return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 });
  }

  let body: Partial<NewPaymentInput>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request.' }, { status: 400 });
  }

  if (!body.pilgrimId || !body.amount || !body.method || !body.paidOn) {
    return NextResponse.json({ error: 'Missing required fields.' }, { status: 400 });
  }

  try {
    const id = await createPayment({
      pilgrimId: body.pilgrimId,
      amount: Number(body.amount),
      method: body.method,
      paidOn: body.paidOn,
      reference: body.reference,
      status: body.status,
      invoiceId: body.invoiceId,
    }, session.companyId);

    if (body.invoiceId) {
      await recalculateInvoiceStatus(body.invoiceId, session.companyId);
    }

    const label = Number(body.amount) < 0 ? 'Refund' : 'Payment';
    await logActivity('payment', `${label} of SAR ${Math.abs(Number(body.amount)).toLocaleString()} recorded for ${body.pilgrimId} by ${session.displayName}`, 'payment', session.companyId);
    return NextResponse.json({ ok: true, id });
  } catch {
    return NextResponse.json({ error: 'Pilgrim not found.' }, { status: 400 });
  }
}
