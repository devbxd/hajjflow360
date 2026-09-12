'use client';

import React, { useMemo, useState } from 'react';
import { TrendingUp, TrendingDown, Wallet, PlusCircle, Trash2, Loader2 } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { toast } from 'sonner';
import type { CampaignStats, MonthlyCollection } from '@/lib/data/campaign';
import type { Expense, MonthlyExpense } from '@/lib/data/finance';
import { useCurrency } from '@/lib/currency';

const EXPENSE_CATEGORIES = ['Hotels', 'Flights', 'Transport', 'Staff', 'Visas', 'Catering', 'Marketing', 'Other'];

interface Props {
  stats: CampaignStats;
  monthlyCollections: MonthlyCollection[];
  initialExpenses: Expense[];
  monthlyExpenses: MonthlyExpense[];
}

export default function RevenueExpensesClient({ stats, monthlyCollections, initialExpenses, monthlyExpenses }: Props) {
  const { format } = useCurrency();
  const [expenses, setExpenses] = useState<Expense[]>(initialExpenses);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ description: '', category: EXPENSE_CATEGORIES[0], amount: '', spentOn: new Date().toISOString().slice(0, 10) });

  const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
  const netProfit = stats.collectedRevenue - totalExpenses;

  const chartData = useMemo(() => {
    const months = new Map<string, { month: string; collected: number; spent: number }>();
    for (const m of monthlyCollections) months.set(m.month, { month: m.month, collected: m.collected, spent: 0 });
    for (const m of monthlyExpenses) {
      const existing = months.get(m.month);
      if (existing) existing.spent = m.spent;
      else months.set(m.month, { month: m.month, collected: 0, spent: m.spent });
    }
    return Array.from(months.values());
  }, [monthlyCollections, monthlyExpenses]);

  const handleAddExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.description || !form.amount) {
      toast.error('Description and amount are required.');
      return;
    }
    setSaving(true);
    try {
      const res = await fetch('/api/expenses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, amount: Number(form.amount) }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Failed to save expense');
      setExpenses((prev) => [{ id: data.id, description: form.description, category: form.category, amount: Number(form.amount), spentOn: form.spentOn, createdAt: new Date().toISOString() }, ...prev]);
      setForm({ description: '', category: EXPENSE_CATEGORIES[0], amount: '', spentOn: new Date().toISOString().slice(0, 10) });
      setShowForm(false);
      toast.success('Expense logged.');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to save expense.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      const res = await fetch(`/api/expenses/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error();
      setExpenses((prev) => prev.filter((e) => e.id !== id));
      toast.success('Expense removed.');
    } catch {
      toast.error('Failed to remove expense.');
    }
  };

  const metrics = [
    { label: 'Collected Revenue', value: format(stats.collectedRevenue), icon: TrendingUp, color: 'text-[#16A34A]', bg: 'bg-[#F0FDF4]' },
    { label: 'Total Expenses', value: format(totalExpenses), icon: TrendingDown, color: 'text-[#DC2626]', bg: 'bg-[#FEF2F2]' },
    { label: 'Net Profit', value: format(netProfit), icon: Wallet, color: netProfit >= 0 ? 'text-primary' : 'text-[#DC2626]', bg: netProfit >= 0 ? 'bg-primary/10' : 'bg-[#FEF2F2]' },
  ];

  return (
    <div>
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <TrendingUp size={20} className="text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold text-foreground">Revenue &amp; Expenses</h1>
            <p className="text-sm text-muted-foreground mt-1">Money collected from pilgrims vs. campaign running costs</p>
          </div>
        </div>
        <button onClick={() => setShowForm(true)} className="btn-primary text-sm flex items-center gap-1.5">
          <PlusCircle size={14} />
          Log Expense
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        {metrics.map((m) => {
          const Icon = m.icon;
          return (
            <div key={m.label} className="card-base flex flex-col gap-2">
              <div className={`w-8 h-8 rounded-lg ${m.bg} flex items-center justify-center`}>
                <Icon size={16} className={m.color} />
              </div>
              <p className="text-xs text-muted-foreground font-medium">{m.label}</p>
              <p className={`text-lg font-bold font-mono-data ${m.color}`}>{m.value}</p>
            </div>
          );
        })}
      </div>

      <div className="card-base mb-6">
        <h3 className="text-sm font-semibold text-foreground mb-1">Revenue vs. Expenses</h3>
        <p className="text-xs text-muted-foreground mb-4">Monthly comparison (SAR)</p>
        {chartData.length === 0 ? (
          <p className="text-sm text-muted-foreground py-8 text-center">No financial activity recorded yet.</p>
        ) : (
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={chartData} barCategoryGap="30%">
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#6B6560' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: '#6B6560' }} axisLine={false} tickLine={false} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
              <Tooltip formatter={(value: number) => format(value)} contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid var(--border)' }} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Bar dataKey="collected" name="Collected" fill="#1B6B4A" radius={[4, 4, 0, 0]} />
              <Bar dataKey="spent" name="Spent" fill="#DC2626" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      <div className="card-base">
        <h3 className="text-sm font-semibold text-foreground mb-4">Expenses</h3>
        <div className="overflow-x-auto scrollbar-thin">
          <table className="w-full text-sm min-w-[600px]">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                {['Description', 'Category', 'Date', 'Amount', ''].map((h) => (
                  <th key={h} className="text-left py-2.5 px-3 text-xs font-medium text-muted-foreground uppercase tracking-wide whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {expenses.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-sm text-muted-foreground">No expenses logged yet.</td>
                </tr>
              ) : (
                expenses.map((e) => (
                  <tr key={e.id} className="table-row-hover border-b border-border/50 last:border-0">
                    <td className="py-2.5 px-3 font-medium text-foreground">{e.description}</td>
                    <td className="py-2.5 px-3 text-xs text-muted-foreground">{e.category}</td>
                    <td className="py-2.5 px-3 text-xs text-muted-foreground whitespace-nowrap">{e.spentOn}</td>
                    <td className="py-2.5 px-3 font-mono-data text-sm font-semibold text-[#DC2626]">{format(e.amount)}</td>
                    <td className="py-2.5 px-3">
                      <button onClick={() => handleDelete(e.id)} className="p-1.5 rounded hover:bg-[#FEF2F2] text-muted-foreground hover:text-[#DC2626]" title="Remove expense">
                        <Trash2 size={13} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/20 backdrop-blur-sm fade-in">
          <div className="bg-card rounded-xl border border-border shadow-xl p-6 w-full max-w-md mx-4 slide-up">
            <h2 className="text-base font-semibold text-foreground mb-4">Log Expense</h2>
            <form onSubmit={handleAddExpense} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">Description</label>
                <input
                  type="text"
                  value={form.description}
                  onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
                  required
                  className="w-full text-sm border border-border rounded-lg px-3 py-2 bg-input text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">Category</label>
                  <select
                    value={form.category}
                    onChange={(e) => setForm((prev) => ({ ...prev, category: e.target.value }))}
                    className="w-full text-sm border border-border rounded-lg px-3 py-2 bg-input text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                  >
                    {EXPENSE_CATEGORIES.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">Amount (SAR)</label>
                  <input
                    type="number"
                    value={form.amount}
                    onChange={(e) => setForm((prev) => ({ ...prev, amount: e.target.value }))}
                    required
                    className="w-full text-sm border border-border rounded-lg px-3 py-2 bg-input text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">Date</label>
                <input
                  type="date"
                  value={form.spentOn}
                  onChange={(e) => setForm((prev) => ({ ...prev, spentOn: e.target.value }))}
                  required
                  className="w-full text-sm border border-border rounded-lg px-3 py-2 bg-input text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowForm(false)} className="btn-secondary flex-1 justify-center">Cancel</button>
                <button type="submit" disabled={saving} className="btn-primary flex-1 justify-center" style={{ opacity: saving ? 0.7 : 1 }}>
                  {saving ? <Loader2 size={14} className="animate-spin" /> : 'Save Expense'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
