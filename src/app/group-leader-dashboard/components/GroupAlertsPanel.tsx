import React from 'react';
import { AlertTriangle, XCircle, Clock } from 'lucide-react';
import Icon from '@/components/ui/AppIcon';


const alerts = [
  { id: 'AGL-001', pilgrimId: 'PIL-017', name: 'Omar Farouq Hassan', issue: 'Passport missing — visa cannot be initiated', severity: 'critical' as const },
  { id: 'AGL-002', pilgrimId: 'PIL-015', name: 'Waleed Ibrahim Saad', issue: 'Visa pending — 6 days remaining to approval deadline', severity: 'high' as const },
  { id: 'AGL-003', pilgrimId: 'PIL-018', name: 'Layla Mustafa Aziz', issue: 'Visa still processing — follow up with MOFA portal', severity: 'medium' as const },
  { id: 'AGL-004', pilgrimId: 'PIL-006', name: 'Amira Hassan Saleh', issue: 'Payment 50% — SAR 7,800 outstanding', severity: 'high' as const },
];

const severityIcon = {
  critical: XCircle,
  high: AlertTriangle,
  medium: Clock,
};

const severityColor = {
  critical: 'text-[#DC2626]',
  high: 'text-[#D97706]',
  medium: 'text-[#2563EB]',
};

const severityBg = {
  critical: 'bg-[#FEF2F2] border-[#DC2626]/20',
  high: 'bg-[#FFFBEB] border-[#D97706]/20',
  medium: 'bg-[#EFF6FF] border-[#2563EB]/20',
};

export default function GroupAlertsPanel() {
  return (
    <div className="card-base">
      <div className="flex items-center gap-2 mb-4">
        <AlertTriangle size={14} className="text-[#DC2626]" />
        <h3 className="text-sm font-semibold text-foreground">Group Alerts</h3>
        <span className="px-2 py-0.5 rounded-full bg-[#FEE2E2] text-[#DC2626] text-xs font-semibold ml-auto">
          {alerts.length}
        </span>
      </div>
      <div className="space-y-3">
        {alerts.map((alert) => {
          const Icon = severityIcon[alert.severity];
          return (
            <div key={`alert-${alert.id}`} className={`p-3 rounded-lg border ${severityBg[alert.severity]}`}>
              <div className="flex items-start gap-2">
                <Icon size={14} className={`${severityColor[alert.severity]} flex-shrink-0 mt-0.5`} />
                <div className="min-w-0">
                  <p className="text-sm font-medium text-foreground">{alert.name}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{alert.issue}</p>
                  <p className="text-xs font-mono-data text-muted-foreground mt-0.5">{alert.pilgrimId}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}