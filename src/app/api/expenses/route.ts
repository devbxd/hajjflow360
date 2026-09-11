import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/currentUser';
import { getExpenses, createExpense, type NewExpenseInput } from '@/lib/data/finance';
import { logActivity } from '@/lib/data/activity';

export async function GET() {
  const session = await getCurrentUser();
  if (!session) {
    return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 });
  }
  const expenses = await getExpenses(session.companyId);
  return NextResponse.json({ expenses });
}

export async function POST(req: NextRequest) {
  const session = await getCurrentUser();
  if (!session) {
    return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 });
  }

  let body: Partial<NewExpenseInput>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request.' }, { status: 400 });
  }

  if (!body.description || !body.category || !body.spentOn || !body.amount) {
    return NextResponse.json({ error: 'Missing required fields.' }, { status: 400 });
  }

  const id = await createExpense({
    description: body.description,
    category: body.category,
    amount: Number(body.amount),
    spentOn: body.spentOn,
  }, session.companyId);
  await logActivity('finance', `Expense "${body.description}" (SAR ${Number(body.amount).toLocaleString()}) logged by ${session.displayName}`, 'payment', session.companyId);

  return NextResponse.json({ ok: true, id });
}
