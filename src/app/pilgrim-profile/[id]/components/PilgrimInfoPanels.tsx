'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import type { Pilgrim } from '@/lib/mockData';
import type { PaymentRecord } from '@/lib/data/pilgrims';
import type { StatusType } from '@/components/ui/StatusBadge';
import { ChevronDown, ChevronUp, User, FileText, Globe, MapPin, CreditCard } from 'lucide-react';
import StatusBadge from '@/components/ui/StatusBadge';
import Icon from '@/components/ui/AppIcon';
import { useCurrency } from '@/lib/currency';

function Panel({
  title,
  icon: Icon,
  children,
  defaultOpen = true,
}: {
  title: string;
  icon: React.ElementType;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="card-base">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center justify-between w-full text-left"
      >
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-secondary">
            <Icon size={14} className="text-primary" />
          </div>
          <h3 className="text-sm font-semibold text-foreground">{title}</h3>
        </div>
        {open ? <ChevronUp size={16} className="text-muted-foreground" /> : <ChevronDown size={16} className="text-muted-foreground" />}
      </button>
      {open && <div className="mt-4 pt-4 border-t border-border">{children}</div>}
    </div>
  );
}

function InfoRow({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex items-start justify-between py-2 border-b border-border/50 last:border-0">
      <span className="text-xs text-muted-foreground font-medium uppercase tracking-wide w-36 flex-shrink-0">{label}</span>
      <span className={`text-sm text-foreground text-right ${mono ? 'font-mono-data' : ''}`}>{value}</span>
    </div>
  );
}

interface HotelDates {
  checkIn: string;
  checkOut: string;
}

export default function PilgrimInfoPanels({
  pilgrim: p,
  paymentHistory,
  makkahHotel,
  madinahHotel,
}: {
  pilgrim: Pilgrim;
  paymentHistory: PaymentRecord[];
  makkahHotel: HotelDates | null;
  madinahHotel: HotelDates | null;
}) {
  const { format } = useCurrency();
  const flightBadge: StatusType = p.flightStatus === 'confirmed' ? 'approved' : p.flightStatus === 'pending' ? 'pending' : 'unallocated';
  const busBadge: StatusType = p.busNumber ? 'allocated' : 'unallocated';
  const hotelBadge: StatusType = p.hotelMakkah ? 'allocated' : 'unallocated';

  const visaSteps: { step: string; done: boolean }[] =
    p.visaStatus === 'rejected'
      ? [
          { step: 'Application Submitted', done: true },
          { step: 'Documents Verified', done: true },
          { step: 'MOFA Processing', done: true },
          { step: 'Visa Rejected', done: true },
        ]
      : [
          { step: 'Application Submitted', done: p.visaStatus !== 'not-started' },
          { step: 'Documents Verified', done: p.visaStatus === 'processing' || p.visaStatus === 'approved' },
          { step: 'MOFA Processing', done: p.visaStatus === 'processing' || p.visaStatus === 'approved' },
          { step: 'Visa Approved', done: p.visaStatus === 'approved' },
        ];

  return (
    <div className="space-y-4">
      {/* Personal Details */}
      <Panel title="Personal Information" icon={User}>
        <div>
          <InfoRow label="Full Name" value={p.name} />
          <InfoRow label="Date of Birth" value={p.dateOfBirth} />
          <InfoRow label="Age" value={`${p.age} years`} />
          <InfoRow label="Gender" value={p.gender === 'M' ? 'Male' : 'Female'} />
          <InfoRow label="Nationality" value={p.nationality} />
          <InfoRow label="Phone" value={p.phone} mono />
          <InfoRow label="Email" value={p.email} mono />
          <InfoRow label="Registered" value={p.registeredAt} />
          {p.mahramId && <InfoRow label="Mahram ID" value={p.mahramId} mono />}
        </div>
      </Panel>

      {/* Passport */}
      <Panel title="Passport & MRZ Data" icon={FileText}>
        <div>
          <InfoRow label="Passport No." value={p.passportNumber} mono />
          <InfoRow label="Expiry Date" value={p.passportExpiry} />
          <InfoRow label="Scan Status" value={p.passportStatus} />
          <InfoRow label="Nationality Code" value={p.nationalityCode} mono />
        </div>
        <div className="mt-4 p-3 rounded-lg bg-muted/60 border border-border">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">MRZ Line 1</p>
          <p className="font-mono-data text-xs text-foreground tracking-widest break-all">
            P{`<`}{p.nationalityCode}{p.name.replace(/\s/g, '<').toUpperCase()}{'<'.repeat(Math.max(0, 44 - p.name.length - p.nationalityCode.length - 1))}
          </p>
          <p className="font-mono-data text-xs text-foreground tracking-widest mt-1 break-all">
            {p.passportNumber}{'<'.repeat(Math.max(0, 9 - p.passportNumber.length))}{p.nationalityCode}9012125M{p.passportExpiry.replace(/\//g, '').slice(-6)}{'<'.repeat(14)}6
          </p>
        </div>
        <div className="mt-3">
          <Link href="/passport-scanning" className="btn-secondary text-xs w-full justify-center">
            Re-scan Passport (OCR)
          </Link>
        </div>
      </Panel>

      {/* Visa */}
      <Panel title="Visa Tracking" icon={Globe}>
        <div>
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs text-muted-foreground uppercase tracking-wide font-medium">Current Status</span>
            <StatusBadge status={p.visaStatus as 'approved'} />
          </div>
          <InfoRow label="Visa Number" value={p.visaNumber ?? '—'} mono />
          <InfoRow label="Visa Expiry" value={p.visaExpiry ?? '—'} />
          <InfoRow label="Visa Type" value="Hajj Visa" />
          <InfoRow label="Entry Type" value="Single Entry" />
        </div>
        <div className="mt-4 pt-4 border-t border-border">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">Status Timeline</p>
          <div className="space-y-2">
            {visaSteps.map((step, idx) => (
              <div key={`vstep-${idx}`} className="flex items-center gap-3">
                <div className={`w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0 ${step.done ? 'bg-[#16A34A]' : 'bg-muted border-2 border-border'}`}>
                  {step.done && <span className="text-white text-xs">✓</span>}
                </div>
                <span className={`text-sm flex-1 ${step.done ? 'text-foreground' : 'text-muted-foreground'}`}>{step.step}</span>
              </div>
            ))}
          </div>
        </div>
      </Panel>

      {/* Logistics */}
      <Panel title="Logistics Assignment" icon={MapPin}>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-3 rounded-lg bg-secondary border border-primary/10">
            <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium mb-2">Flight</p>
            <p className="text-sm font-semibold text-foreground">{p.flightNumber ?? 'Not assigned'}</p>
            <p className="text-xs text-muted-foreground mt-1">{p.flightDate ?? '—'}</p>
            <StatusBadge status={flightBadge} size="sm" />
          </div>
          <div className="p-3 rounded-lg bg-secondary border border-primary/10">
            <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium mb-2">Bus & Seat</p>
            <p className="text-sm font-semibold text-foreground">{p.busNumber ? `Bus #${p.busNumber}` : 'Not assigned'}</p>
            <p className="text-xs text-muted-foreground mt-1">{p.seatNumber ? `Seat ${p.seatNumber}` : '—'}</p>
            <StatusBadge status={busBadge} size="sm" />
          </div>
          <div className="p-3 rounded-lg bg-secondary border border-primary/10">
            <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium mb-2">Hotel & Room</p>
            <p className="text-sm font-semibold text-foreground truncate">{p.hotelMakkah ?? 'Not assigned'}</p>
            <p className="text-xs text-muted-foreground mt-1">{p.roomNumber ? `Room ${p.roomNumber} · ${p.roomType}` : '—'}</p>
            <StatusBadge status={hotelBadge} size="sm" />
          </div>
        </div>
        <div className="mt-4">
          <InfoRow label="Madinah Hotel" value={p.hotelMadinah ?? 'Not assigned'} />
          <InfoRow label="Check-in (Makkah)" value={makkahHotel?.checkIn ?? '—'} />
          <InfoRow label="Check-out (Makkah)" value={makkahHotel?.checkOut ?? '—'} />
          <InfoRow label="Check-in (Madinah)" value={madinahHotel?.checkIn ?? '—'} />
          <InfoRow label="Check-out (Madinah)" value={madinahHotel?.checkOut ?? '—'} />
        </div>
      </Panel>

      {/* Payment */}
      <Panel title="Payment History" icon={CreditCard}>
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-muted-foreground">Total Paid</span>
            <span className="text-sm font-bold text-foreground tabular-nums">
              {format(p.paymentPaid)} / {format(p.paymentTotal)}
            </span>
          </div>
          <div className="progress-bar-track">
            <div className="progress-bar-fill" style={{ width: `${Math.round((p.paymentPaid / p.paymentTotal) * 100)}%` }} />
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            {Math.round((p.paymentPaid / p.paymentTotal) * 100)}% — {p.paymentStatus}
          </p>
        </div>
        <div className="overflow-x-auto scrollbar-thin">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-2 text-xs font-medium text-muted-foreground uppercase tracking-wide">Date</th>
                <th className="text-left py-2 text-xs font-medium text-muted-foreground uppercase tracking-wide">Amount</th>
                <th className="text-left py-2 text-xs font-medium text-muted-foreground uppercase tracking-wide">Method</th>
                <th className="text-left py-2 text-xs font-medium text-muted-foreground uppercase tracking-wide">Ref</th>
                <th className="text-left py-2 text-xs font-medium text-muted-foreground uppercase tracking-wide">Status</th>
              </tr>
            </thead>
            <tbody>
              {paymentHistory.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-4 text-center text-sm text-muted-foreground">No payments recorded yet.</td>
                </tr>
              )}
              {paymentHistory.map((pay) => (
                <tr key={`pay-${pay.id}`} className="table-row-hover border-b border-border/50 last:border-0">
                  <td className="py-2 text-sm">{pay.date}</td>
                  <td className="py-2 text-sm font-semibold tabular-nums text-[#16A34A]">{format(pay.amount)}</td>
                  <td className="py-2 text-sm text-muted-foreground">{pay.method}</td>
                  <td className="py-2 text-xs font-mono-data text-muted-foreground">{pay.reference}</td>
                  <td className="py-2">
                    <StatusBadge status={pay.status === 'cleared' ? 'approved' : 'pending'} size="sm" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>
    </div>
  );
}