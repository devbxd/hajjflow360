'use client';

import React, { useState, useMemo } from 'react';
import { ChevronDown, ChevronUp, ChevronsUpDown } from 'lucide-react';
import { pilgrims } from '@/lib/mockData';
import StatusBadge from '@/components/ui/StatusBadge';

type SortKey = 'name' | 'paymentTotal' | 'paymentPaid' | 'balance' | 'paymentStatus';
type SortDir = 'asc' | 'desc';

export default function PaymentTable() {
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [sortKey, setSortKey] = useState<SortKey>('paymentStatus');
  const [sortDir, setSortDir] = useState<SortDir>('asc');
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [page, setPage] = useState(0);
  const PAGE_SIZE = 8;

  const tableData = useMemo(() => {
    // Extend with more mock rows for a realistic table
    const extended = [
      ...pilgrims,
      { id: 'PIL-013', name: 'Hassan Boudiaf', nationality: 'Algeria', groupLeader: 'Sheikh Tariq Hussain', paymentTotal: 15200, paymentPaid: 4560, paymentStatus: 'overdue' as const },
      { id: 'PIL-014', name: 'Rania Al-Sayed', nationality: 'Egypt', groupLeader: 'Sheikh Ahmed Al-Rashidi', paymentTotal: 15600, paymentPaid: 4680, paymentStatus: 'overdue' as const },
      { id: 'PIL-015', name: 'Bilal Osman Farah', nationality: 'Somalia', groupLeader: 'Sheikh Ibrahim Musa', paymentTotal: 13800, paymentPaid: 13800, paymentStatus: 'paid' as const },
      { id: 'PIL-016', name: 'Tariq Noor Al-Din', nationality: 'Jordan', groupLeader: 'Sheikh Faisal Al-Mutairi', paymentTotal: 16400, paymentPaid: 8200, paymentStatus: 'partial' as const },
      { id: 'PIL-017', name: 'Layla Al-Mansouri', nationality: 'UAE', groupLeader: 'Sheikh Umar Al-Faruq', paymentTotal: 19800, paymentPaid: 19800, paymentStatus: 'paid' as const },
      { id: 'PIL-018', name: 'Omar Farouq Diallo', nationality: 'Guinea', groupLeader: 'Sheikh Moussa Diallo', paymentTotal: 12400, paymentPaid: 0, paymentStatus: 'pending' as const },
      { id: 'PIL-019', name: 'Aisha Bint Umar', nationality: 'Malaysia', groupLeader: 'Sheikh Rizal Hakim', paymentTotal: 14600, paymentPaid: 14600, paymentStatus: 'paid' as const },
      { id: 'PIL-020', name: 'Mustafa Al-Kurdi', nationality: 'Iraq', groupLeader: 'Sheikh Noor Islam', paymentTotal: 13200, paymentPaid: 6600, paymentStatus: 'partial' as const },
    ];

    let rows = extended.map((p) => ({
      id: p.id,
      name: p.name,
      nationality: p.nationality,
      groupLeader: p.groupLeader,
      paymentTotal: p.paymentTotal,
      paymentPaid: p.paymentPaid,
      balance: p.paymentTotal - p.paymentPaid,
      paymentStatus: p.paymentStatus,
    }));

    if (search) {
      const q = search.toLowerCase();
      rows = rows.filter((r) => r.name.toLowerCase().includes(q) || r.id.toLowerCase().includes(q));
    }
    if (filterStatus !== 'all') {
      rows = rows.filter((r) => r.paymentStatus === filterStatus);
    }

    rows.sort((a, b) => {
      let av: string | number = a[sortKey] ?? '';
      let bv: string | number = b[sortKey] ?? '';
      if (typeof av === 'string') av = av.toLowerCase();
      if (typeof bv === 'string') bv = bv.toLowerCase();
      if (av < bv) return sortDir === 'asc' ? -1 : 1;
      if (av > bv) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });

    return rows;
  }, [search, filterStatus, sortKey, sortDir]);

  const totalPages = Math.ceil(tableData.length / PAGE_SIZE);
  const pageData = tableData.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    else { setSortKey(key); setSortDir('asc'); }
  };

  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    if (selected.size === pageData.length) setSelected(new Set());
    else setSelected(new Set(pageData.map((r) => r.id)));
  };

  const SortIcon = ({ col }: { col: SortKey }) => {
    if (sortKey !== col) return <ChevronsUpDown size={12} className="text-muted-foreground/50" />;
    return sortDir === 'asc' ? <ChevronUp size={12} className="text-primary" /> : <ChevronDown size={12} className="text-primary" />;
  };

  const fmtSAR = (n: number) => `SAR ${n.toLocaleString()}`;

  return (
    <div className="card-base p-0 overflow-hidden">
      {/* Table header controls */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-semibold text-foreground">Pilgrim Payment Status</h3>
          <span className="px-2 py-0.5 rounded-full bg-muted text-xs text-muted-foreground font-medium">
            {tableData.length}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {selected.size > 0 && (
            <span className="text-xs text-primary font-medium bg-primary/10 px-2 py-1 rounded-lg">
              {selected.size} selected
            </span>
          )}
          <input
            type="text"
            placeholder="Search…"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(0); }}
            className="px-3 py-1.5 text-xs bg-muted border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30 w-36"
          />
          <select
            value={filterStatus}
            onChange={(e) => { setFilterStatus(e.target.value); setPage(0); }}
            className="px-2 py-1.5 text-xs bg-muted border border-border rounded-lg focus:outline-none"
          >
            <option value="all">All</option>
            <option value="paid">Paid</option>
            <option value="partial">Partial</option>
            <option value="overdue">Overdue</option>
            <option value="pending">Pending</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/40">
              <th className="px-4 py-2.5 text-left w-8">
                <input
                  type="checkbox"
                  checked={selected.size === pageData.length && pageData.length > 0}
                  onChange={toggleAll}
                  className="rounded accent-primary"
                />
              </th>
              <th className="px-3 py-2.5 text-left">
                <button onClick={() => toggleSort('name')} className="flex items-center gap-1 text-xs font-semibold text-muted-foreground uppercase tracking-wide hover:text-foreground">
                  Pilgrim <SortIcon col="name" />
                </button>
              </th>
              <th className="px-3 py-2.5 text-right">
                <button onClick={() => toggleSort('paymentTotal')} className="flex items-center gap-1 text-xs font-semibold text-muted-foreground uppercase tracking-wide hover:text-foreground ml-auto">
                  Total <SortIcon col="paymentTotal" />
                </button>
              </th>
              <th className="px-3 py-2.5 text-right">
                <button onClick={() => toggleSort('paymentPaid')} className="flex items-center gap-1 text-xs font-semibold text-muted-foreground uppercase tracking-wide hover:text-foreground ml-auto">
                  Paid <SortIcon col="paymentPaid" />
                </button>
              </th>
              <th className="px-3 py-2.5 text-right">
                <button onClick={() => toggleSort('balance')} className="flex items-center gap-1 text-xs font-semibold text-muted-foreground uppercase tracking-wide hover:text-foreground ml-auto">
                  Balance <SortIcon col="balance" />
                </button>
              </th>
              <th className="px-3 py-2.5 text-center">
                <button onClick={() => toggleSort('paymentStatus')} className="flex items-center gap-1 text-xs font-semibold text-muted-foreground uppercase tracking-wide hover:text-foreground mx-auto">
                  Status <SortIcon col="paymentStatus" />
                </button>
              </th>
              <th className="px-3 py-2.5 text-left hidden md:table-cell">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Group Leader</span>
              </th>
              <th className="px-3 py-2.5 text-center">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Progress</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {pageData.map((row, i) => {
              const pct = Math.round((row.paymentPaid / row.paymentTotal) * 100);
              const isSelected = selected.has(row.id);
              return (
                <tr
                  key={row.id}
                  className={`border-b border-border/50 transition-colors hover:bg-muted/30 ${isSelected ? 'bg-primary/5' : ''} ${i % 2 === 0 ? '' : 'bg-muted/10'}`}
                >
                  <td className="px-4 py-3">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleSelect(row.id)}
                      className="rounded accent-primary"
                    />
                  </td>
                  <td className="px-3 py-3">
                    <p className="font-medium text-foreground text-sm leading-tight">{row.name}</p>
                    <p className="text-xs text-muted-foreground font-mono-data">{row.id} · {row.nationality}</p>
                  </td>
                  <td className="px-3 py-3 text-right font-mono-data text-sm text-foreground">{fmtSAR(row.paymentTotal)}</td>
                  <td className="px-3 py-3 text-right font-mono-data text-sm text-[#16A34A] font-medium">{fmtSAR(row.paymentPaid)}</td>
                  <td className="px-3 py-3 text-right font-mono-data text-sm">
                    <span className={row.balance > 0 ? (row.paymentStatus === 'overdue' ? 'text-[#DC2626] font-semibold' : 'text-[#D97706]') : 'text-muted-foreground'}>
                      {row.balance > 0 ? fmtSAR(row.balance) : '—'}
                    </span>
                  </td>
                  <td className="px-3 py-3 text-center">
                    <StatusBadge status={row.paymentStatus} size="sm" />
                  </td>
                  <td className="px-3 py-3 hidden md:table-cell">
                    <p className="text-xs text-muted-foreground truncate max-w-[140px]">{row.groupLeader}</p>
                  </td>
                  <td className="px-3 py-3">
                    <div className="flex items-center gap-2 min-w-[80px]">
                      <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${pct === 100 ? 'bg-[#16A34A]' : pct >= 50 ? 'bg-[#C5A028]' : 'bg-[#DC2626]'}`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <span className="text-xs font-mono-data text-muted-foreground w-8 text-right">{pct}%</span>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between px-4 py-3 border-t border-border">
        <p className="text-xs text-muted-foreground">
          Showing {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, tableData.length)} of {tableData.length}
        </p>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            disabled={page === 0}
            className="px-2.5 py-1 text-xs rounded-lg border border-border bg-muted hover:bg-input disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Prev
          </button>
          {Array.from({ length: totalPages }, (_, i) => (
            <button
              key={i}
              onClick={() => setPage(i)}
              className={`px-2.5 py-1 text-xs rounded-lg border ${page === i ? 'bg-primary text-primary-foreground border-primary' : 'border-border bg-muted hover:bg-input'}`}
            >
              {i + 1}
            </button>
          ))}
          <button
            onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
            disabled={page === totalPages - 1}
            className="px-2.5 py-1 text-xs rounded-lg border border-border bg-muted hover:bg-input disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}
