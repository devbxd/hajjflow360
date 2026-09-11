import React from 'react';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import AppLayout from '@/components/AppLayout';
import { getCurrentUser } from '@/lib/auth/currentUser';
import { getAllPilgrims } from '@/lib/data/pilgrims';
import { computeAtRisk } from '@/lib/data/campaign';
import { AlertTriangle, Phone, ExternalLink } from 'lucide-react';

export const dynamic = 'force-dynamic';

const SEVERITY_STYLE: Record<string, string> = {
  critical: 'bg-[#FEF2F2] text-[#DC2626] border-[#DC2626]/20',
  high: 'bg-[#FFFBEB] text-[#D97706] border-[#D97706]/20',
  medium: 'bg-muted text-muted-foreground border-border',
};

export default async function EmergencyListsPage() {
  const session = await getCurrentUser();
  if (!session) redirect('/login');

  const pilgrims = await getAllPilgrims(session.companyId);
  const atRisk = computeAtRisk(pilgrims, 12);
  const rows = atRisk.map((risk) => ({ risk, pilgrim: pilgrims.find((p) => p.id === risk.id) }));

  return (
    <AppLayout>
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-[#FEF2F2] flex items-center justify-center">
          <AlertTriangle size={20} className="text-[#DC2626]" />
        </div>
        <div>
          <h1 className="text-xl font-semibold text-foreground">Emergency Lists</h1>
          <p className="text-sm text-muted-foreground">{rows.length} pilgrims flagged at risk — with emergency contacts</p>
        </div>
      </div>

      <div className="card-base p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/40">
                <th className="px-4 py-2.5 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">Pilgrim</th>
                <th className="px-3 py-2.5 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">Issue</th>
                <th className="px-3 py-2.5 text-center text-xs font-semibold text-muted-foreground uppercase tracking-wide">Severity</th>
                <th className="px-3 py-2.5 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">Emergency Contact</th>
                <th className="px-3 py-2.5 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">Phone</th>
                <th className="px-3 py-2.5 text-center text-xs font-semibold text-muted-foreground uppercase tracking-wide">Action</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-sm text-muted-foreground">No pilgrims currently flagged at risk.</td>
                </tr>
              )}
              {rows.map(({ risk, pilgrim }) => (
                <tr key={risk.id} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-3">
                    <p className="font-medium text-foreground">{risk.name}</p>
                    <p className="text-xs text-muted-foreground font-mono-data">{risk.id}</p>
                  </td>
                  <td className="px-3 py-3 text-sm text-foreground max-w-xs">{risk.issue}</td>
                  <td className="px-3 py-3 text-center">
                    <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium border ${SEVERITY_STYLE[risk.severity]}`}>
                      {risk.severity}
                    </span>
                  </td>
                  <td className="px-3 py-3 text-sm text-foreground">{pilgrim?.emergencyContact ?? '—'}</td>
                  <td className="px-3 py-3 text-sm font-mono-data text-muted-foreground">{pilgrim?.emergencyPhone ?? '—'}</td>
                  <td className="px-3 py-3">
                    <div className="flex items-center justify-center gap-2">
                      {pilgrim?.emergencyPhone && (
                        <a
                          href={`tel:${pilgrim.emergencyPhone}`}
                          className="p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-[#16A34A] transition-colors"
                          title="Call emergency contact"
                        >
                          <Phone size={14} />
                        </a>
                      )}
                      <Link
                        href={`/pilgrim-profile/${risk.id}`}
                        className="p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-primary transition-colors"
                        title="View profile"
                      >
                        <ExternalLink size={14} />
                      </Link>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </AppLayout>
  );
}
