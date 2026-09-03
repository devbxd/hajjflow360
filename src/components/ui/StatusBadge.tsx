import React from 'react';
import { CheckCircle2, Clock, XCircle, Loader2, Send, AlertTriangle } from 'lucide-react';
import Icon from '@/components/ui/AppIcon';


export type StatusType =
  | 'approved' |'pending' |'rejected' |'processing' |'departed' |'arrived' |'completed' |'not-started' |'paid' |'partial' |'overdue' |'allocated' |'unallocated' |'verified' |'scanned' |'missing';

const statusConfig: Record<StatusType, { label: string; className: string; icon: React.ElementType }> = {
  approved: { label: 'Approved', className: 'status-approved', icon: CheckCircle2 },
  paid: { label: 'Paid', className: 'status-approved', icon: CheckCircle2 },
  allocated: { label: 'Allocated', className: 'status-approved', icon: CheckCircle2 },
  verified: { label: 'Verified', className: 'status-approved', icon: CheckCircle2 },
  scanned: { label: 'Scanned', className: 'status-approved', icon: CheckCircle2 },
  completed: { label: 'Completed', className: 'status-approved', icon: CheckCircle2 },
  arrived: { label: 'Arrived', className: 'status-approved', icon: CheckCircle2 },
  pending: { label: 'Pending', className: 'status-pending', icon: Clock },
  partial: { label: 'Partial', className: 'status-pending', icon: Clock },
  processing: { label: 'Processing', className: 'status-processing', icon: Loader2 },
  departed: { label: 'Departed', className: 'status-departed', icon: Send },
  rejected: { label: 'Rejected', className: 'status-rejected', icon: XCircle },
  overdue: { label: 'Overdue', className: 'status-rejected', icon: AlertTriangle },
  missing: { label: 'Missing', className: 'status-rejected', icon: AlertTriangle },
  'not-started': { label: 'Not Started', className: 'status-pending', icon: Clock },
  unallocated: { label: 'Unallocated', className: 'status-pending', icon: Clock },
};

interface StatusBadgeProps {
  status: StatusType;
  size?: 'sm' | 'md';
  showIcon?: boolean;
}

export default function StatusBadge({ status, size = 'md', showIcon = true }: StatusBadgeProps) {
  const config = statusConfig[status] ?? statusConfig.pending;
  const Icon = config.icon;
  return (
    <span
      className={`status-badge ${config.className} ${size === 'sm' ? 'text-xs px-2 py-0.5' : ''}`}
    >
      {showIcon && <Icon size={10} />}
      {config.label}
    </span>
  );
}