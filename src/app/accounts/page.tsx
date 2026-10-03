'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { toast } from 'sonner';

interface AccountRow {
  username: string;
  displayName: string;
  password: string | null;
  updatedAt: string | null;
}

const EMPTY_FORM = { username: '', displayName: '', password: '', companyId: 'CO-001' };

export default function AccountsPage() {
  const [rows, setRows] = useState<AccountRow[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [revealed, setRevealed] = useState<Record<string, boolean>>({});
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await fetch('/api/accounts', { cache: 'no-store' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Failed to load.');
      setRows(data.users);
      setError('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    const id = setInterval(load, 10000);
    return () => clearInterval(id);
  }, [load]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch('/api/accounts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Failed to create account.');
      toast.success(`Account ${form.username} created.`);
      setForm(EMPTY_FORM);
      load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to create account.');
    } finally {
      setSaving(false);
    }
  };

  const inputClass = 'w-full text-sm border border-border rounded-lg px-3 py-2 bg-input text-foreground focus:outline-none focus:ring-2 focus:ring-ring';

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-foreground">Gestion des comptes</h1>
          <p className="text-sm text-muted-foreground">Refreshes automatically every 10 seconds. Updates when someone changes their password.</p>
        </div>
        <button onClick={load} className="btn-secondary text-xs px-3 py-1.5">Refresh</button>
      </div>

      {error && <p className="text-sm text-[#DC2626]" role="alert">{error}</p>}

      <form onSubmit={handleCreate} className="card-base grid grid-cols-1 sm:grid-cols-5 gap-3 items-end">
        <div>
          <label className="block text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">Username</label>
          <input required value={form.username} onChange={(e) => setForm((f) => ({ ...f, username: e.target.value }))} className={inputClass} />
        </div>
        <div>
          <label className="block text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">Name</label>
          <input required value={form.displayName} onChange={(e) => setForm((f) => ({ ...f, displayName: e.target.value }))} className={inputClass} />
        </div>
        <div>
          <label className="block text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">Password</label>
          <input required value={form.password} onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))} className={inputClass} />
        </div>
        <div>
          <label className="block text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">Company ID</label>
          <input required value={form.companyId} onChange={(e) => setForm((f) => ({ ...f, companyId: e.target.value }))} className={inputClass} />
        </div>
        <button type="submit" disabled={saving} className="btn-primary text-sm justify-center" style={{ opacity: saving ? 0.7 : 1 }}>
          {saving ? 'Creating...' : 'Create Account'}
        </button>
      </form>

      <div className="card-base overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/30">
              {['Username', 'Name', 'Password', 'Last changed'].map((h) => (
                <th key={h} className="text-left py-2.5 px-3 text-xs font-medium text-muted-foreground uppercase tracking-wide whitespace-nowrap">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr><td colSpan={4} className="py-6 px-3 text-center text-muted-foreground">Loading...</td></tr>
            )}
            {rows.map((r) => (
              <tr key={r.username} className="border-b border-border/50 last:border-0">
                <td className="py-2.5 px-3 font-mono-data text-foreground">{r.username}</td>
                <td className="py-2.5 px-3 text-muted-foreground">{r.displayName}</td>
                <td className="py-2.5 px-3">
                  {r.password === null ? (
                    <span className="text-xs text-muted-foreground">Not tracked yet</span>
                  ) : (
                    <button
                      onClick={() => setRevealed((prev) => ({ ...prev, [r.username]: !prev[r.username] }))}
                      className="font-mono-data text-foreground hover:text-primary"
                      title="Click to show or hide"
                    >
                      {revealed[r.username] ? r.password : '••••••••'}
                    </button>
                  )}
                </td>
                <td className="py-2.5 px-3 text-xs text-muted-foreground">
                  {r.updatedAt ? new Date(r.updatedAt).toLocaleString() : '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
