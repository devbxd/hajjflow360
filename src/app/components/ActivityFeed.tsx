import React from 'react';
import { recentActivity } from '@/lib/mockData';
import { CheckCircle2, CreditCard, ScanLine, AlertTriangle, Bus, MessageSquare, QrCode, Loader2 } from 'lucide-react';
import Icon from '@/components/ui/AppIcon';


const iconMap: Record<string, React.ElementType> = {
  check: CheckCircle2,
  payment: CreditCard,
  scan: ScanLine,
  alert: AlertTriangle,
  bus: Bus,
  message: MessageSquare,
  qr: QrCode,
  processing: Loader2,
};

const iconColorMap: Record<string, string> = {
  check: 'text-[#16A34A]',
  payment: 'text-accent',
  scan: 'text-[#2563EB]',
  alert: 'text-[#DC2626]',
  bus: 'text-primary',
  message: 'text-[#7C3AED]',
  qr: 'text-primary',
  processing: 'text-[#2563EB]',
};

const iconBgMap: Record<string, string> = {
  check: 'bg-[#F0FDF4]',
  payment: 'bg-accent/10',
  scan: 'bg-[#EFF6FF]',
  alert: 'bg-[#FEF2F2]',
  bus: 'bg-secondary',
  message: 'bg-[#F5F3FF]',
  qr: 'bg-secondary',
  processing: 'bg-[#EFF6FF]',
};

export default function ActivityFeed() {
  return (
    <div className="card-base h-full">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-foreground">Recent Activity</h3>
        <span className="text-xs text-muted-foreground">Last updated 8 min ago</span>
      </div>
      <div className="space-y-3">
        {recentActivity.map((act) => {
          const Icon = iconMap[act.icon] ?? CheckCircle2;
          return (
            <div key={`act-${act.id}`} className="flex items-start gap-3">
              <div className={`p-1.5 rounded-lg flex-shrink-0 ${iconBgMap[act.icon] ?? 'bg-muted'}`}>
                <Icon size={13} className={iconColorMap[act.icon] ?? 'text-muted-foreground'} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-foreground leading-relaxed">{act.message}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{act.time}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}