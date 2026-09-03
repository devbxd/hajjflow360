'use client';

import React, { useState } from 'react';
import { pilgrims } from '@/lib/mockData';
import { Phone, AlertTriangle, Clock, CheckCircle2, MapPin } from 'lucide-react';

const p = pilgrims?.[0];

export default function PilgrimSidebar() {
  const [checkedIn, setCheckedIn] = useState(true);

  return (
    <div className="space-y-4">
      {/* QR Code */}
      <div className="card-base text-center">
        <h3 className="text-sm font-semibold text-foreground mb-3">QR Check-in Code</h3>
        <div className="w-32 h-32 mx-auto qr-pattern rounded-lg border border-border" aria-label="QR code for pilgrim check-in" />
        <p className="text-xs font-mono-data text-muted-foreground mt-2">{p?.id}</p>
        <p className="text-xs text-muted-foreground mt-1">Scan at boarding / hotel check-in</p>
        <button className="btn-secondary text-xs w-full justify-center mt-3">
          Download QR
        </button>
      </div>

      {/* Check-in Status */}
      <div className="card-base">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-foreground">Attendance Status</h3>
        </div>
        <div
          onClick={() => setCheckedIn(!checkedIn)}
          className={`p-3 rounded-lg border cursor-pointer transition-all ${
            checkedIn
              ? 'bg-[#F0FDF4] border-[#16A34A]/30'
              : 'bg-[#FFFBEB] border-[#D97706]/30'
          }`}
        >
          <div className="flex items-center gap-2">
            {checkedIn ? (
              <CheckCircle2 size={18} className="text-[#16A34A]" />
            ) : (
              <Clock size={18} className="text-[#D97706]" />
            )}
            <div>
              <p className={`text-sm font-semibold ${checkedIn ? 'text-[#16A34A]' : 'text-[#D97706]'}`}>
                {checkedIn ? 'Checked In' : 'Not Checked In'}
              </p>
              <p className="text-xs text-muted-foreground">
                {checkedIn ? 'Last scan: 03/09/2026 07:12' : 'Tap to mark present'}
              </p>
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
            <p className="text-sm font-medium text-foreground mt-0.5">{p?.emergencyContact}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium">Phone</p>
            <p className="text-sm font-mono-data text-foreground mt-0.5">{p?.emergencyPhone}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium">Relationship</p>
            <p className="text-sm text-foreground mt-0.5">Spouse (Mahram)</p>
          </div>
          <button className="btn-secondary text-xs w-full justify-center mt-1 flex items-center gap-1.5">
            <Phone size={12} />
            Call Emergency Contact
          </button>
        </div>
      </div>

      {/* Location Tracking */}
      <div className="card-base">
        <div className="flex items-center gap-2 mb-3">
          <MapPin size={14} className="text-primary" />
          <h3 className="text-sm font-semibold text-foreground">Current Location</h3>
        </div>
        <div className="p-3 rounded-lg bg-secondary">
          <p className="text-sm font-semibold text-primary">Hilton Suites Makkah</p>
          <p className="text-xs text-muted-foreground mt-0.5">Room 412 · Floor 4</p>
          <p className="text-xs text-muted-foreground">Last updated: 03/09/2026 06:45</p>
        </div>
        <div className="mt-3 space-y-2 text-xs text-muted-foreground">
          <div className="flex justify-between">
            <span>Check-in (Makkah)</span>
            <span className="font-medium text-foreground">15/09/2027</span>
          </div>
          <div className="flex justify-between">
            <span>Transfer to Madinah</span>
            <span className="font-medium text-foreground">22/09/2027</span>
          </div>
          <div className="flex justify-between">
            <span>Return Flight</span>
            <span className="font-medium text-foreground">22/10/2027</span>
          </div>
        </div>
      </div>

      {/* Activity Log */}
      <div className="card-base">
        <h3 className="text-sm font-semibold text-foreground mb-3">Activity Log</h3>
        <div className="space-y-3">
          {[
            { action: 'Visa approved by MOFA', date: '28/03/2027', type: 'visa' },
            { action: 'Flight SV-881 confirmed', date: '15/02/2027', type: 'flight' },
            { action: 'Room 412 allocated', date: '10/01/2027', type: 'hotel' },
            { action: 'Bus #3 seat B7 assigned', date: '10/01/2027', type: 'bus' },
            { action: 'Full payment cleared', date: '01/08/2026', type: 'payment' },
            { action: 'Passport scanned & verified', date: '20/03/2026', type: 'passport' },
            { action: 'Pilgrim registered', date: '15/03/2026', type: 'register' },
          ]?.map((log, idx) => (
            <div key={`log-${idx}`} className="flex items-start gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 flex-shrink-0" />
              <div>
                <p className="text-xs text-foreground">{log?.action}</p>
                <p className="text-xs text-muted-foreground">{log?.date}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}