'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Users, Phone, Star, Download, PlusCircle, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import type { GroupLeader, Pilgrim } from '@/lib/mockData';

interface GroupLeaderHeaderProps {
  groupLeader: GroupLeader;
  allGroupLeaders: GroupLeader[];
  pilgrims: Pilgrim[];
}

export default function GroupLeaderHeader({ groupLeader: gl, allGroupLeaders, pilgrims }: GroupLeaderHeaderProps) {
  const router = useRouter();
  const [addOpen, setAddOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [form, setForm] = useState({ name: '', phone: '' });
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const otherGroups = allGroupLeaders.filter((g) => g.groupId !== gl.groupId);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch('/api/group-leaders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Failed to add group leader');
      toast.success(`${form.name} added as ${data.groupId}.`);
      setAddOpen(false);
      setForm({ name: '', phone: '' });
      router.push(`/group-leader-dashboard?group=${data.groupId}`);
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to add group leader.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      const res = await fetch(`/api/group-leaders/${gl.groupId}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Failed to remove group leader');
      toast.success(
        data.movedPilgrims > 0
          ? `${gl.groupId} removed — ${data.movedPilgrims} pilgrims moved to ${data.movedTo}.`
          : `${gl.groupId} removed.`
      );
      setDeleteOpen(false);
      if (otherGroups.length > 0) {
        router.push(`/group-leader-dashboard?group=${otherGroups[0].groupId}`);
      } else {
        router.push('/group-leader-dashboard');
      }
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to remove group leader.');
    } finally {
      setDeleting(false);
    }
  };

  const initials = gl.name
    .split(' ')
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  const handleExport = () => {
    const rows = [
      ['Pilgrim ID', 'Name', 'Nationality', 'Passport', 'Visa', 'Payment Status', 'Attendance'],
      ...pilgrims.map((p) => [p.id, p.name, p.nationality, p.passportStatus, p.visaStatus, p.paymentStatus, p.attendanceStatus]),
    ];
    const csv = rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${gl.groupId}_pilgrims.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const scrollToBroadcast = () => {
    document.getElementById('whatsapp-broadcast')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div className="flex items-center gap-4">
        <div className="w-14 h-14 rounded-xl bg-primary flex items-center justify-center flex-shrink-0">
          <span className="text-xl font-bold text-primary-foreground">{initials}</span>
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-semibold text-foreground">{gl.name}</h1>
            <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-accent/10 text-accent text-xs font-semibold">
              <Star size={10} />
              Group Leader
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-3 mt-1">
            <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <Users size={13} />{gl.pilgrimCount} pilgrims
            </span>
            <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <Phone size={13} />
              {gl.phone}
            </span>
            <span className="text-sm text-muted-foreground font-mono-data">{gl.groupId}</span>
          </div>
        </div>
      </div>
      <div className="flex items-center gap-3 flex-shrink-0">
        <select
          value={gl.groupId}
          onChange={(e) => router.push(`/group-leader-dashboard?group=${e.target.value}`)}
          className="text-sm border border-border rounded-lg px-3 py-2 bg-input text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
        >
          {allGroupLeaders.map((leader) => (
            <option key={leader.groupId} value={leader.groupId}>
              {leader.groupId} — {leader.name}
            </option>
          ))}
        </select>
        <button onClick={handleExport} className="btn-secondary text-sm">
          <Download size={14} />
          Export Group List
        </button>
        <button onClick={() => setAddOpen(true)} className="btn-secondary text-sm">
          <PlusCircle size={14} />
          Add Group Leader
        </button>
        <button
          onClick={() => setDeleteOpen(true)}
          className="px-3 py-2 rounded-lg text-sm font-medium flex items-center gap-1.5 bg-[#FEF2F2] text-[#DC2626] border border-[#DC2626]/20 hover:bg-[#FEE2E2] transition-colors"
          title="Remove this group leader"
        >
          <Trash2 size={14} />
          Delete Group
        </button>
        <button onClick={scrollToBroadcast} className="btn-primary text-sm">Send Broadcast</button>
      </div>

      {addOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/20 backdrop-blur-sm fade-in">
          <div className="bg-card rounded-xl border border-border shadow-xl p-6 w-full max-w-sm mx-4 slide-up">
            <h2 className="text-base font-semibold text-foreground mb-1">Add Group Leader</h2>
            <p className="text-sm text-muted-foreground mb-4">Creates a new group with this person as its leader.</p>
            <form onSubmit={handleAdd} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">Name</label>
                <input required value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="Sheikh Ahmed Al-Rashidi" className="w-full text-sm border border-border rounded-lg px-3 py-2 bg-input text-foreground focus:outline-none focus:ring-2 focus:ring-ring" />
              </div>
              <div>
                <label className="block text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">Phone</label>
                <input required value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} placeholder="+966-50-111-2222" className="w-full text-sm border border-border rounded-lg px-3 py-2 bg-input text-foreground focus:outline-none focus:ring-2 focus:ring-ring" />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setAddOpen(false)} className="btn-secondary flex-1 justify-center">Cancel</button>
                <button type="submit" disabled={saving} className="btn-primary flex-1 justify-center" style={{ opacity: saving ? 0.7 : 1 }}>
                  {saving ? 'Adding...' : 'Add Group Leader'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {deleteOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/20 backdrop-blur-sm fade-in">
          <div className="bg-card rounded-xl border border-border shadow-xl p-6 w-full max-w-sm mx-4 slide-up">
            <h2 className="text-base font-semibold text-foreground mb-2">Remove Group Leader</h2>
            <p className="text-sm text-muted-foreground mb-4">
              Removes {gl.name} ({gl.groupId}).
              {gl.pilgrimCount > 0 && ` Its ${gl.pilgrimCount} pilgrim${gl.pilgrimCount > 1 ? 's' : ''} will be moved to another group automatically.`}
            </p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteOpen(false)} className="btn-secondary flex-1 justify-center">Cancel</button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="flex-1 justify-center px-4 py-2 bg-[#DC2626] text-white rounded-lg text-sm font-medium hover:bg-[#B91C1C] transition-colors"
                style={{ opacity: deleting ? 0.7 : 1 }}
              >
                {deleting ? 'Removing...' : 'Remove'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
