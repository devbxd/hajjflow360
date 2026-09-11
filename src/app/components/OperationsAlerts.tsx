import React from 'react';
import { AlertTriangle, AlertOctagon, ShieldCheck } from 'lucide-react';
import type { OperationsAlert } from '@/lib/data/alerts';

export default function OperationsAlerts({ alerts }: { alerts: OperationsAlert[] }) {
  if (alerts.length === 0) {
    return (
      <div className="card-base flex items-center gap-3 mb-6">
        <div className="w-8 h-8 rounded-lg bg-[#F0FDF4] flex items-center justify-center flex-shrink-0">
          <ShieldCheck size={16} className="text-[#16A34A]" />
        </div>
        <div>
          <p className="text-sm font-semibold text-foreground">Operations Alerts</p>
          <p className="text-xs text-muted-foreground">No operational issues detected — everything checks out.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="card-base mb-6">
      <div className="flex items-center gap-2 mb-3">
        <AlertTriangle size={16} className="text-[#D97706]" />
        <h3 className="text-sm font-semibold text-foreground">Operations Alerts</h3>
        <span className="ml-auto text-xs text-muted-foreground">{alerts.length} flagged</span>
      </div>
      <div className="space-y-2">
        {alerts.map((alert) => (
          <div
            key={alert.id}
            className={`flex items-start gap-2 px-3 py-2 rounded-lg border text-sm ${
              alert.severity === 'critical'
                ? 'bg-[#FEF2F2] border-[#DC2626]/20 text-[#DC2626]'
                : 'bg-[#FFFBEB] border-[#D97706]/20 text-[#D97706]'
            }`}
          >
            {alert.severity === 'critical' ? (
              <AlertOctagon size={14} className="flex-shrink-0 mt-0.5" />
            ) : (
              <AlertTriangle size={14} className="flex-shrink-0 mt-0.5" />
            )}
            <span>{alert.message}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
