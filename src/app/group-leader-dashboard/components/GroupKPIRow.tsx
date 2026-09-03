import React from 'react';
import { groupLeaders } from '@/lib/mockData';
import { CheckCircle2, AlertTriangle, CreditCard, Users } from 'lucide-react';
import Icon from '@/components/ui/AppIcon';


export default function GroupKPIRow() {
  const gl = groupLeaders?.[0];
  const visaPct = Math.round((gl?.visaApproved / gl?.pilgrimCount) * 100);
  const ppPct = Math.round((gl?.passportVerified / gl?.pilgrimCount) * 100);
  const payPct = Math.round((gl?.paymentComplete / gl?.pilgrimCount) * 100);
  const attPct = Math.round((gl?.attendancePresent / gl?.pilgrimCount) * 100);
  const missingDocs = gl?.pilgrimCount - gl?.passportVerified;

  const cards = [
    {
      label: 'Total Pilgrims',
      value: String(gl?.pilgrimCount),
      sub: `${gl?.groupId} — Hajj 2027`,
      icon: Users,
      iconBg: 'bg-secondary',
      iconColor: 'text-primary',
      highlight: false,
    },
    {
      label: 'Visa Approved',
      value: `${visaPct}%`,
      sub: `${gl?.visaApproved} of ${gl?.pilgrimCount} pilgrims`,
      icon: CheckCircle2,
      iconBg: 'bg-[#F0FDF4]',
      iconColor: 'text-[#16A34A]',
      highlight: false,
    },
    {
      label: 'Attendance Present',
      value: `${attPct}%`,
      sub: `${gl?.attendancePresent} checked in today`,
      icon: Users,
      iconBg: 'bg-secondary',
      iconColor: 'text-primary',
      highlight: false,
    },
    {
      label: 'Missing Documents',
      value: String(missingDocs),
      sub: 'Passports not yet verified',
      icon: AlertTriangle,
      iconBg: missingDocs > 0 ? 'bg-[#FEF2F2]' : 'bg-[#F0FDF4]',
      iconColor: missingDocs > 0 ? 'text-[#DC2626]' : 'text-[#16A34A]',
      highlight: missingDocs > 0,
    },
    {
      label: 'Payment Complete',
      value: `${payPct}%`,
      sub: `${gl?.paymentComplete} fully paid`,
      icon: CreditCard,
      iconBg: 'bg-accent/10',
      iconColor: 'text-accent',
      highlight: false,
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 xl:grid-cols-5 2xl:grid-cols-5 gap-4">
      {cards?.map((c) => {
        const Icon = c?.icon;
        return (
          <div
            key={`gkpi-${c?.label}`}
            className={`card-base flex flex-col gap-3 ${c?.highlight ? 'border-[#DC2626]/30 bg-[#FEF2F2]' : ''}`}
          >
            <div className="flex items-start justify-between">
              <p className="text-xs font-500 uppercase tracking-wide text-muted-foreground leading-tight">{c?.label}</p>
              <div className={`p-1.5 rounded-lg ${c?.iconBg}`}>
                <Icon size={14} className={c?.iconColor} />
              </div>
            </div>
            <p className={`text-2xl font-bold tabular-nums ${c?.highlight ? 'text-[#DC2626]' : 'text-foreground'}`}>{c?.value}</p>
            <p className="text-xs text-muted-foreground">{c?.sub}</p>
          </div>
        );
      })}
    </div>
  );
}