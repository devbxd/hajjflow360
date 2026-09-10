'use client';

import React, { useEffect, useState } from 'react';
import { toast } from 'sonner';
import type { Pilgrim } from '@/lib/mockData';
import type { ActivityEntry } from '@/lib/data/activity';
import { Phone, AlertTriangle, Clock, CheckCircle2, MapPin, Circle } from 'lucide-react';

export default function PilgrimSidebar({ pilgrim: p, activity }: { pilgrim: Pilgrim; activity: ActivityEntry[] }) {
  const [attendance, setAttendance] = useState(p.attendanceStatus);
  const [updating, setUpdating] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    import('qrcode').then((QRCode) => {
      QRCode.toDataURL(p.id, { width: 256, margin: 1 }).then((url) => {
        if (!cancelled) setQrDataUrl(url);
      });
    });
    return () => {
      cancelled = true;
    };
  }, [p.id]);

  const handleToggleAttendance = async () => {
    const next: Pilgrim['attendanceStatus'] = attendance === 'present' ? 'not-checked' : 'present';
    setUpdating(true);
    try {
      const res = await fetch(`/api/pilgrims/${p.id}/attendance`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: next }),
      });
      if (!res.ok) throw new Error();
      setAttendance(next);
      toast.success(next === 'present' ? `${p.name} marked as checked in` : `${p.name} marked as not checked in`);
    } catch {
      toast.error('Failed to update attendance.');
    } finally {
      setUpdating(false);
    }
  };

  const handleDownloadQr = () => {
    if (!qrDataUrl) return;
    const a = document.createElement('a');
    a.href = qrDataUrl;
    a.download = `${p.id}_qr.png`;
    a.click();
  };

  const checkedIn = attendance === 'present';

  return (
    <div className="space-y-4">
      {/* QR Code */}
      <div className="card-base text-center">
        <h3 className="text-sm font-semibold text-foreground mb-3">QR Check-in Code</h3>
        {qrDataUrl ? (
          <img src={qrDataUrl} alt={`QR code for ${p.id}`} className="w-32 h-32 mx-auto rounded-lg border border-border" />
        ) : (
          <div className="w-32 h-32 mx-auto rounded-lg border border-border bg-muted animate-pulse" />
        )}
        <p className="text-xs font-mono-data text-muted-foreground mt-2">{p?.id}</p>
        <p className="text-xs text-muted-foreground mt-1">Scan at boarding / hotel check-in</p>
        <button onClick={handleDownloadQr} disabled={!qrDataUrl} className="btn-secondary text-xs w-full justify-center mt-3">
          Download QR
        </button>
      </div>

      {/* Check-in Status */}
      <div className="card-base">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-foreground">Attendance Status</h3>
        </div>
        <div
          onClick={updating ? undefined : handleToggleAttendance}
          className={`p-3 rounded-lg border transition-all ${updating ? 'opacity-60' : 'cursor-pointer'} ${
            checkedIn
              ? 'bg-[#F0FDF4] border-[#16A34A]/30'
              : attendance === 'absent'
              ? 'bg-[#FEF2F2] border-[#DC2626]/30'
              : 'bg-[#FFFBEB] border-[#D97706]/30'
          }`}
        >
          <div className="flex items-center gap-2">
            {checkedIn ? (
              <CheckCircle2 size={18} className="text-[#16A34A]" />
            ) : attendance === 'absent' ? (
              <AlertTriangle size={18} className="text-[#DC2626]" />
            ) : (
              <Clock size={18} className="text-[#D97706]" />
            )}
            <div>
              <p className={`text-sm font-semibold ${checkedIn ? 'text-[#16A34A]' : attendance === 'absent' ? 'text-[#DC2626]' : 'text-[#D97706]'}`}>
                {checkedIn ? 'Checked In' : attendance === 'absent' ? 'Absent' : 'Not Checked In'}
              </p>
              <p className="text-xs text-muted-foreground">Tap to {checkedIn ? 'mark not checked in' : 'mark present'}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Emergency Contact */}
      <div className="card-base">
        <div className="flex items-center gap-2 mb-3">
          <AlertTriangle size={14} className="text-[#D97706]" />
          <h3 className="text-sm font-semibold text-foreground">Emergency Contact</h3>
        </div>
        <div className="space-y-2">
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium">Name</p>
            <p className="text-sm font-medium text-foreground mt-0.5">{p?.emergencyContact || '—'}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium">Phone</p>
            <p className="text-sm font-mono-data text-foreground mt-0.5">{p?.emergencyPhone || '—'}</p>
          </div>
          <a
            href={p.emergencyPhone ? `tel:${p.emergencyPhone.replace(/[^\d+]/g, '')}` : undefined}
            aria-disabled={!p.emergencyPhone}
            className="btn-secondary text-xs w-full justify-center mt-1 flex items-center gap-1.5"
            style={{ opacity: p.emergencyPhone ? 1 : 0.5, pointerEvents: p.emergencyPhone ? 'auto' : 'none' }}
          >
            <Phone size={12} />
            Call Emergency Contact
          </a>
        </div>
      </div>

      {/* Room & Hotel Assignment */}
      <div className="card-base">
        <div className="flex items-center gap-2 mb-3">
          <MapPin size={14} className="text-primary" />
          <h3 className="text-sm font-semibold text-foreground">Room &amp; Hotel Assignment</h3>
        </div>
        {p.hotelMakkah ? (
          <div className="p-3 rounded-lg bg-secondary">
            <p className="text-sm font-semibold text-primary">{p.hotelMakkah}</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {p.roomNumber ? `Room ${p.roomNumber} · ${p.roomType}` : 'Room not assigned yet'}
            </p>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">No hotel assigned yet.</p>
        )}
        {p.hotelMadinah && (
          <div className="p-3 rounded-lg bg-secondary mt-2">
            <p className="text-sm font-semibold text-primary">{p.hotelMadinah}</p>
            <p className="text-xs text-muted-foreground mt-0.5">Madinah leg</p>
          </div>
        )}
      </div>

      {/* Activity Log */}
      <div className="card-base">
        <h3 className="text-sm font-semibold text-foreground mb-3">Activity Log</h3>
        {activity.length === 0 ? (
          <p className="text-xs text-muted-foreground">No recorded activity for this pilgrim yet.</p>
        ) : (
          <div className="space-y-3">
            {activity.map((entry) => (
              <div key={entry.id} className="flex items-start gap-2">
                <Circle size={6} className="text-primary mt-1.5 flex-shrink-0 fill-current" />
                <div>
                  <p className="text-xs text-foreground">{entry.message}</p>
                  <p className="text-xs text-muted-foreground">{entry.time}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
