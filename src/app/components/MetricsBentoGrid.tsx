import React from 'react';
import type { CampaignStats } from '@/lib/data/campaign';
import { Users, CreditCard, Bus, Building2, Plane, AlertTriangle } from 'lucide-react';
import Icon from '@/components/ui/AppIcon';


function MetricCard({
  label,
  value,
  sub,
  subColor,
  icon: Icon,
  iconBg,
  iconColor,
  accent,
  colSpan,
}: {
  label: string;
  value: string;
  sub?: string;
  subColor?: string;
  icon: React.ElementType;
  iconBg: string;
  iconColor: string;
  accent?: boolean;
  colSpan?: string;
}) {
  return (
    <div
      className={`card-base flex flex-col gap-3 ${colSpan ?? ''} ${
        accent ? 'border-l-4 border-l-accent' : ''
      }`}
    >
      <div className="flex items-start justify-between">
        <p className="text-xs font-500 uppercase tracking-wide text-muted-foreground">{label}</p>
        <div className={`p-2 rounded-lg ${iconBg}`}>
          <Icon size={16} className={iconColor} />
        </div>
      </div>
      <div>
        <p className="text-3xl font-bold tabular-nums text-foreground">{value}</p>
        {sub && (
          <p className={`text-xs mt-1 font-medium ${subColor ?? 'text-muted-foreground'}`}>{sub}</p>
        )}
      </div>
    </div>
  );
}

function ProgressCard({
  label,
  total,
  approved,
  pending,
  rejected,
  processing,
}: {
  label: string;
  total: number;
  approved: number;
  pending: number;
  rejected: number;
  processing?: number;
}) {
  const approvedPct = total > 0 ? Math.round((approved / total) * 100) : 0;
  const pendingPct = total > 0 ? Math.round((pending / total) * 100) : 0;
  const rejectedPct = total > 0 ? Math.round((rejected / total) * 100) : 0;
  const processingPct = processing && total > 0 ? Math.round((processing / total) * 100) : 0;

  return (
    <div className="card-base flex flex-col gap-3">
      <p className="text-xs font-500 uppercase tracking-wide text-muted-foreground">{label}</p>
      <div className="flex items-end gap-2">
        <p className="text-3xl font-bold tabular-nums text-foreground">{approvedPct}%</p>
        <p className="text-sm text-muted-foreground pb-1">approved</p>
      </div>
      <div className="flex h-2 rounded-full overflow-hidden gap-0.5">
        <div className="bg-[#16A34A] rounded-l-full" style={{ width: `${approvedPct}%` }} />
        {processing && processingPct > 0 && (
          <div className="bg-[#2563EB]" style={{ width: `${processingPct}%` }} />
        )}
        <div className="bg-[#D97706]" style={{ width: `${pendingPct}%` }} />
        <div className="bg-[#DC2626] rounded-r-full" style={{ width: `${rejectedPct}%` }} />
      </div>
      <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-[#16A34A] inline-block" />
          {approved} approved
        </span>
        {processing && (
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-[#2563EB] inline-block" />
            {processing} processing
          </span>
        )}
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-[#D97706] inline-block" />
          {pending} pending
        </span>
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-[#DC2626] inline-block" />
          {rejected} rejected
        </span>
      </div>
    </div>
  );
}

export default function MetricsBentoGrid({ stats }: { stats: CampaignStats }) {
  const s = stats;
  const collectionPct = s.totalRevenue > 0 ? Math.round((s.collectedRevenue / s.totalRevenue) * 100) : 0;

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-4 2xl:grid-cols-4 gap-4 mb-6">
      {/* Hero — Total Pilgrims spans 2 cols */}
      <div className="col-span-2 card-base flex flex-col gap-3 border-l-4 border-l-primary">
        <div className="flex items-start justify-between">
          <p className="text-xs font-500 uppercase tracking-wide text-muted-foreground">Total Pilgrims Registered</p>
          <div className="p-2 rounded-lg bg-secondary">
            <Users size={16} className="text-primary" />
          </div>
        </div>
        <div className="flex items-end gap-4">
          <div>
            <p className="text-4xl font-bold tabular-nums text-primary">{s.totalPilgrims.toLocaleString()}</p>
            <p className="text-sm text-muted-foreground mt-1">of {s.capacity} capacity — {Math.round((s.totalPilgrims / s.capacity) * 100)}% filled</p>
          </div>
          <div className="flex-1 pb-1">
            <div className="progress-bar-track">
              <div className="progress-bar-fill" style={{ width: `${Math.round((s.totalPilgrims / s.capacity) * 100)}%` }} />
            </div>
          </div>
        </div>
        <div className="flex gap-4 text-xs text-muted-foreground">
          <span>{s.groupsTotal} groups</span>
          <span>·</span>
          <span>{s.groupsTotal} group leaders</span>
          <span>·</span>
          <span>{s.nationalitiesCount} nationalities</span>
        </div>
      </div>

      {/* At-Risk — alert state */}
      <div className="card-base flex flex-col gap-3 border border-[#DC2626]/30 bg-[#FEF2F2]">
        <div className="flex items-start justify-between">
          <p className="text-xs font-500 uppercase tracking-wide text-[#DC2626]">At-Risk Pilgrims</p>
          <div className="p-2 rounded-lg bg-[#FEE2E2]">
            <AlertTriangle size={16} className="text-[#DC2626]" />
          </div>
        </div>
        <p className="text-3xl font-bold tabular-nums text-[#DC2626]">{s.atRiskCount}</p>
        <p className="text-xs text-[#DC2626]/80 font-medium">Require immediate action</p>
      </div>

      {/* Revenue */}
      <MetricCard
        label="Revenue Collected"
        value={`${collectionPct}%`}
        sub={`SAR ${(s.collectedRevenue / 1000000).toFixed(2)}M of ${(s.totalRevenue / 1000000).toFixed(2)}M`}
        icon={CreditCard}
        iconBg="bg-accent/10"
        iconColor="text-accent"
        accent
      />

      {/* Visa Progress */}
      <ProgressCard
        label="Visa Status"
        total={s.totalPilgrims}
        approved={s.visaApproved}
        pending={s.visaPending}
        rejected={s.visaRejected}
        processing={s.visaProcessing}
      />

      {/* Passport Progress */}
      <ProgressCard
        label="Passport Verification"
        total={s.totalPilgrims}
        approved={s.passportVerified}
        pending={s.passportPending}
        rejected={s.passportMissing}
      />

      {/* Buses */}
      <MetricCard
        label="Buses Allocated"
        value={`${s.busesAllocated}/${s.busesTotal}`}
        sub={`${Math.round((s.busesAllocated / s.busesTotal) * 100)}% operational`}
        icon={Bus}
        iconBg="bg-secondary"
        iconColor="text-primary"
      />

      {/* Hotels */}
      <MetricCard
        label="Hotels / Rooms"
        value={`${s.hotelsTotal}`}
        sub={`${s.roomsAllocated}/${s.roomsTotal} rooms assigned`}
        icon={Building2}
        iconBg="bg-secondary"
        iconColor="text-primary"
      />

      {/* Flights */}
      <MetricCard
        label="Flights Scheduled"
        value={`${s.flightsTotal}`}
        sub="6 departure flights confirmed"
        icon={Plane}
        iconBg="bg-secondary"
        iconColor="text-primary"
      />
    </div>
  );
}