'use client';

import React, { useState, useMemo } from 'react';
import type { Pilgrim } from '@/lib/mockData';
import StatusBadge, { type StatusType } from '@/components/ui/StatusBadge';
import {
  Search,
  ChevronUp,
  ChevronDown,
  ChevronsUpDown,
  Edit2,
  Trash2,
  ExternalLink,
  MessageSquare,
  CheckSquare,
  Square,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';
import type { GroupLeader } from '@/lib/mockData';
import EditPilgrimModal from './EditPilgrimModal';

type SortField = keyof Pilgrim | null;
type SortDir = 'asc' | 'desc';

const PAGE_SIZE_OPTIONS = [10, 20, 50];

export default function PilgrimTable({ initialPilgrims, groupLeaders }: { initialPilgrims: Pilgrim[]; groupLeaders: GroupLeader[] }) {
  const [pilgrimsData, setPilgrimsData] = useState<Pilgrim[]>(initialPilgrims);
  const [search, setSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');
  const [sortField, setSortField] = useState<SortField>(null);
  const [sortDir, setSortDir] = useState<SortDir>('asc');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [editingPilgrim, setEditingPilgrim] = useState<Pilgrim | null>(null);

  const filterTabs = useMemo(() => {
    const visaPending = pilgrimsData.filter((p) => p.visaStatus === 'pending' || p.visaStatus === 'processing' || p.visaStatus === 'not-started').length;
    const unallocated = pilgrimsData.filter((p) => !p.busNumber || !p.roomNumber).length;
    const paymentDue = pilgrimsData.filter((p) => p.paymentStatus === 'partial' || p.paymentStatus === 'overdue').length;
    const missingPassport = pilgrimsData.filter((p) => p.passportStatus === 'missing' || p.passportStatus === 'pending').length;
    return [
      { id: 'all', label: 'All Pilgrims', count: pilgrimsData.length },
      { id: 'visa-pending', label: 'Visa Pending', count: visaPending },
      { id: 'unallocated', label: 'Unallocated', count: unallocated },
      { id: 'payment-due', label: 'Payment Due', count: paymentDue },
      { id: 'missing-passport', label: 'Missing Passport', count: missingPassport },
    ];
  }, [pilgrimsData]);

  const filtered = useMemo(() => {
    let data = [...pilgrimsData];
    if (search) {
      const q = search.toLowerCase();
      data = data.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.passportNumber.toLowerCase().includes(q) ||
          p.id.toLowerCase().includes(q) ||
          p.nationality.toLowerCase().includes(q)
      );
    }
    if (activeFilter === 'visa-pending') {
      data = data.filter((p) => p.visaStatus === 'pending' || p.visaStatus === 'processing' || p.visaStatus === 'not-started');
    } else if (activeFilter === 'unallocated') {
      data = data.filter((p) => !p.busNumber || !p.roomNumber);
    } else if (activeFilter === 'payment-due') {
      data = data.filter((p) => p.paymentStatus === 'partial' || p.paymentStatus === 'overdue');
    } else if (activeFilter === 'missing-passport') {
      data = data.filter((p) => p.passportStatus === 'missing' || p.passportStatus === 'pending');
    }
    if (sortField) {
      data.sort((a, b) => {
        const av = a[sortField] ?? '';
        const bv = b[sortField] ?? '';
        const cmp = String(av).localeCompare(String(bv));
        return sortDir === 'asc' ? cmp : -cmp;
      });
    }
    return data;
  }, [pilgrimsData, search, activeFilter, sortField, sortDir]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const paginated = filtered.slice((page - 1) * pageSize, page * pageSize);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDir('asc');
    }
    setPage(1);
  };

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    if (selectedIds.size === paginated.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(paginated.map((p) => p.id)));
    }
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return <ChevronsUpDown size={12} className="text-muted-foreground/50" />;
    return sortDir === 'asc' ? <ChevronUp size={12} className="text-primary" /> : <ChevronDown size={12} className="text-primary" />;
  };

  const handleBulkDelete = async () => {
    const ids = Array.from(selectedIds);
    try {
      const res = await fetch('/api/pilgrims/bulk-delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids }),
      });
      if (!res.ok) throw new Error();
      setPilgrimsData((prev) => prev.filter((p) => !selectedIds.has(p.id)));
      toast.success(`${ids.length} pilgrims removed from campaign`);
      setSelectedIds(new Set());
    } catch {
      toast.error('Failed to remove pilgrims. Please try again.');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/pilgrims/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error();
      setPilgrimsData((prev) => prev.filter((p) => p.id !== id));
      toast.success(`Pilgrim ${id} removed`);
    } catch {
      toast.error('Failed to remove pilgrim. Please try again.');
    } finally {
      setDeleteConfirm(null);
    }
  };

  return (
    <>
      <div className="card-base">
        {/* Search + Filters */}
        <div className="flex flex-col gap-4 mb-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search by name, passport #, or pilgrim ID..."
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                className="w-full pl-9 pr-4 py-2 text-sm border border-border rounded-lg bg-input text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
          </div>

          {/* Filter Chips */}
          <div className="flex flex-wrap gap-2">
            {filterTabs.map((tab) => (
              <button
                key={`filter-${tab.id}`}
                onClick={() => { setActiveFilter(tab.id); setPage(1); }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                  activeFilter === tab.id
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'bg-muted text-muted-foreground border-border hover:bg-input'
                }`}
              >
                {tab.label}
                <span
                  className={`px-1.5 py-0.5 rounded-full text-xs font-semibold ${
                    activeFilter === tab.id ? 'bg-white/20 text-white' : 'bg-border text-muted-foreground'
                  }`}
                >
                  {tab.count}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Bulk Action Bar */}
        {selectedIds.size > 0 && (
          <div className="mb-4 flex items-center gap-3 px-4 py-2.5 bg-primary/5 border border-primary/20 rounded-lg slide-up">
            <span className="text-sm font-medium text-primary">{selectedIds.size} selected</span>
            <div className="flex items-center gap-2 ml-2">
              <button
                onClick={() => toast.success(`Assigning group to ${selectedIds.size} pilgrims...`)}
                className="btn-secondary text-xs px-3 py-1.5"
              >
                Assign Group
              </button>
              <button
                onClick={() => toast.success(`Sending WhatsApp to ${selectedIds.size} pilgrims...`)}
                className="btn-secondary text-xs px-3 py-1.5"
              >
                Send WhatsApp
              </button>
              <button
                onClick={() => toast.success(`Exporting ${selectedIds.size} pilgrims...`)}
                className="btn-secondary text-xs px-3 py-1.5"
              >
                Export Selected
              </button>
              <button
                onClick={handleBulkDelete}
                className="px-3 py-1.5 text-xs font-medium bg-[#FEF2F2] text-[#DC2626] border border-[#DC2626]/20 rounded-lg hover:bg-[#FEE2E2] transition-colors"
              >
                Delete Selected
              </button>
            </div>
            <button
              onClick={() => setSelectedIds(new Set())}
              className="ml-auto p-1 rounded hover:bg-muted text-muted-foreground"
            >
              <Search size={13} />
            </button>
          </div>
        )}

        {/* Table */}
        <div className="overflow-x-auto scrollbar-thin">
          <table className="w-full text-sm min-w-[1100px]">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="py-2.5 px-3 w-10">
                  <button onClick={toggleAll} className="text-muted-foreground hover:text-foreground">
                    {selectedIds.size === paginated.length && paginated.length > 0 ? (
                      <CheckSquare size={15} className="text-primary" />
                    ) : (
                      <Square size={15} />
                    )}
                  </button>
                </th>
                {[
                  { label: 'Pilgrim', field: 'name' as SortField },
                  { label: 'Nationality', field: 'nationality' as SortField },
                  { label: 'Passport #', field: 'passportNumber' as SortField },
                  { label: 'Passport', field: 'passportStatus' as SortField },
                  { label: 'Visa', field: 'visaStatus' as SortField },
                  { label: 'Flight', field: 'flightNumber' as SortField },
                  { label: 'Hotel', field: 'hotelMakkah' as SortField },
                  { label: 'Bus / Seat', field: 'busNumber' as SortField },
                  { label: 'Group', field: 'groupId' as SortField },
                  { label: 'Payment', field: 'paymentStatus' as SortField },
                  { label: '', field: null },
                ].map((col) => (
                  <th
                    key={`th-${col.label || 'actions'}`}
                    className="text-left py-2.5 px-3 text-xs font-medium text-muted-foreground uppercase tracking-wide whitespace-nowrap"
                  >
                    {col.field ? (
                      <button
                        onClick={() => handleSort(col.field)}
                        className="flex items-center gap-1 hover:text-foreground transition-colors"
                      >
                        {col.label}
                        <SortIcon field={col.field} />
                      </button>
                    ) : (
                      col.label
                    )}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {paginated.length === 0 ? (
                <tr>
                  <td colSpan={12} className="py-12 text-center">
                    <p className="text-sm font-medium text-foreground">No pilgrims match this filter</p>
                    <p className="text-xs text-muted-foreground mt-1">Try adjusting your search or filter criteria</p>
                  </td>
                </tr>
              ) : (
                paginated.map((p) => {
                  const payPct = Math.round((p.paymentPaid / p.paymentTotal) * 100);
                  const isSelected = selectedIds.has(p.id);
                  return (
                    <tr
                      key={`pm-${p.id}`}
                      className={`table-row-hover border-b border-border/50 last:border-0 transition-colors ${isSelected ? 'bg-secondary' : ''}`}
                    >
                      <td className="py-2.5 px-3">
                        <button onClick={() => toggleSelect(p.id)} className="text-muted-foreground hover:text-foreground">
                          {isSelected ? (
                            <CheckSquare size={15} className="text-primary" />
                          ) : (
                            <Square size={15} />
                          )}
                        </button>
                      </td>
                      <td className="py-2.5 px-3">
                        <div>
                          <p className="font-medium text-foreground text-sm">{p.name}</p>
                          <p className="text-xs font-mono-data text-muted-foreground">{p.id}</p>
                        </div>
                      </td>
                      <td className="py-2.5 px-3 text-sm text-muted-foreground whitespace-nowrap">{p.nationality}</td>
                      <td className="py-2.5 px-3">
                        <span className="font-mono-data text-xs text-foreground">{p.passportNumber}</span>
                      </td>
                      <td className="py-2.5 px-3">
                        <StatusBadge status={p.passportStatus as StatusType} size="sm" />
                      </td>
                      <td className="py-2.5 px-3">
                        <StatusBadge status={p.visaStatus as StatusType} size="sm" />
                      </td>
                      <td className="py-2.5 px-3">
                        {p.flightNumber ? (
                          <span className="font-mono-data text-xs text-foreground">{p.flightNumber}</span>
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </td>
                      <td className="py-2.5 px-3">
                        <span className="text-xs text-foreground truncate max-w-[120px] block">
                          {p.hotelMakkah ?? <span className="text-muted-foreground">—</span>}
                        </span>
                      </td>
                      <td className="py-2.5 px-3">
                        {p.busNumber ? (
                          <span className="font-mono-data text-xs text-foreground">
                            #{p.busNumber} · {p.seatNumber}
                          </span>
                        ) : (
                          <span className="status-badge status-pending text-xs">Unassigned</span>
                        )}
                      </td>
                      <td className="py-2.5 px-3">
                        <span className="font-mono-data text-xs text-muted-foreground">{p.groupId}</span>
                      </td>
                      <td className="py-2.5 px-3">
                        <div className="flex items-center gap-2">
                          <div className="progress-bar-track w-14">
                            <div className="progress-bar-fill" style={{ width: `${payPct}%` }} />
                          </div>
                          <span className="text-xs tabular-nums text-muted-foreground">{payPct}%</span>
                        </div>
                      </td>
                      <td className="py-2.5 px-3">
                        <div className="flex items-center gap-1">
                          <Link
                            href={`/pilgrim-profile/${p.id}`}
                            className="p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-primary transition-colors"
                            title="View profile"
                          >
                            <ExternalLink size={13} />
                          </Link>
                          <button
                            onClick={() => setEditingPilgrim(p)}
                            className="p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                            title="Edit pilgrim"
                          >
                            <Edit2 size={13} />
                          </button>
                          <a
                            href={`https://wa.me/${p.phone.replace(/[^\d]/g, '')}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-[#16A34A] transition-colors"
                            title="Open WhatsApp"
                          >
                            <MessageSquare size={13} />
                          </a>
                          <button
                            onClick={() => setDeleteConfirm(p.id)}
                            className="p-1.5 rounded hover:bg-[#FEF2F2] text-muted-foreground hover:text-[#DC2626] transition-colors"
                            title="Remove pilgrim — this cannot be undone"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mt-4 pt-4 border-t border-border">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>Rows per page:</span>
            <select
              value={pageSize}
              onChange={(e) => { setPageSize(Number(e.target.value)); setPage(1); }}
              className="border border-border rounded px-2 py-1 text-sm bg-input text-foreground focus:outline-none"
            >
              {PAGE_SIZE_OPTIONS.map((s) => (
                <option key={`ps-${s}`} value={s}>{s}</option>
              ))}
            </select>
            <span>
              Showing {Math.min((page - 1) * pageSize + 1, filtered.length)}–{Math.min(page * pageSize, filtered.length)} of {filtered.length} pilgrims
            </span>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setPage(Math.max(1, page - 1))}
              disabled={page === 1}
              className="p-1.5 rounded hover:bg-muted disabled:opacity-40 transition-colors text-muted-foreground"
            >
              <ChevronLeft size={16} />
            </button>
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              const pg = i + 1;
              return (
                <button
                  key={`page-${pg}`}
                  onClick={() => setPage(pg)}
                  className={`w-8 h-8 rounded text-sm font-medium transition-colors ${
                    page === pg ? 'bg-primary text-primary-foreground' : 'hover:bg-muted text-muted-foreground'
                  }`}
                >
                  {pg}
                </button>
              );
            })}
            {totalPages > 5 && <span className="text-muted-foreground text-sm px-1">...</span>}
            <button
              onClick={() => setPage(Math.min(totalPages, page + 1))}
              disabled={page === totalPages}
              className="p-1.5 rounded hover:bg-muted disabled:opacity-40 transition-colors text-muted-foreground"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* Delete Confirm Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/20 backdrop-blur-sm fade-in">
          <div className="bg-card rounded-xl border border-border shadow-xl p-6 w-full max-w-sm mx-4 slide-up">
            <h2 className="text-base font-semibold text-foreground mb-2">Remove Pilgrim</h2>
            <p className="text-sm text-muted-foreground mb-4">
              Are you sure you want to remove <strong>{deleteConfirm}</strong> from the campaign? This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteConfirm(null)} className="btn-secondary flex-1 justify-center">
                Cancel
              </button>
              <button
                onClick={() => handleDelete(deleteConfirm)}
                className="flex-1 justify-center px-4 py-2 bg-[#DC2626] text-white rounded-lg text-sm font-medium hover:bg-[#B91C1C] transition-colors"
              >
                Remove Pilgrim
              </button>
            </div>
          </div>
        </div>
      )}

      <EditPilgrimModal pilgrim={editingPilgrim} onClose={() => setEditingPilgrim(null)} groupLeaders={groupLeaders} />
    </>
  );
}