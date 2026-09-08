'use client';

import React, { useState } from 'react';
import { MessageSquare, Users, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';
import type { Pilgrim } from '@/lib/mockData';

const templates = [
  { id: 'tpl-passport', label: 'Passport Reminder', body: 'Dear {name}, please submit your passport scan to the campaign office by 10/09/2027. Failure to do so may delay your visa. JazakAllah khair.' },
  { id: 'tpl-payment', label: 'Payment Due', body: 'Assalamu Alaikum {name}. Your Hajj 2027 package has an outstanding balance. Please complete your payment before 12/09/2027. Contact us for assistance.' },
  { id: 'tpl-departure', label: 'Departure Notice', body: 'Important {name}: Your departure is scheduled for 15/09/2027. Please arrive at the assembly point by 04:00 AM. Bring your passport, visa, and all luggage.' },
  { id: 'tpl-general', label: 'General Update', body: '' },
];

function toWhatsAppNumber(phone: string): string {
  return phone.replace(/[^\d]/g, '');
}

export default function WhatsAppPanel({ pilgrims, groupId }: { pilgrims: Pilgrim[]; groupId: string }) {
  const [selectedTemplate, setSelectedTemplate] = useState('tpl-general');
  const [message, setMessage] = useState('');
  const [recipient, setRecipient] = useState<'all' | 'pending-visa' | 'pending-payment' | 'absent'>('all');
  const [sentTo, setSentTo] = useState<Set<string>>(new Set());

  const filteredPilgrims = {
    all: pilgrims,
    'pending-visa': pilgrims.filter((p) => p.visaStatus === 'pending' || p.visaStatus === 'processing' || p.visaStatus === 'not-started'),
    'pending-payment': pilgrims.filter((p) => p.paymentStatus === 'partial' || p.paymentStatus === 'overdue' || p.paymentStatus === 'pending'),
    absent: pilgrims.filter((p) => p.attendanceStatus === 'absent'),
  };

  const recipientCounts: Record<typeof recipient, number> = {
    all: filteredPilgrims.all.length,
    'pending-visa': filteredPilgrims['pending-visa'].length,
    'pending-payment': filteredPilgrims['pending-payment'].length,
    absent: filteredPilgrims.absent.length,
  };

  const visibleList = filteredPilgrims[recipient];

  const handleTemplateChange = (id: string) => {
    setSelectedTemplate(id);
    const tpl = templates.find((t) => t.id === id);
    if (tpl) setMessage(tpl.body);
  };

  const handleOpenWhatsApp = async (pilgrim: Pilgrim) => {
    if (!message.trim()) {
      toast.error('Message cannot be empty');
      return;
    }
    const number = toWhatsAppNumber(pilgrim.phone);
    if (!number) {
      toast.error(`${pilgrim.name} has no usable phone number.`);
      return;
    }
    const personalized = message.replaceAll('{name}', pilgrim.name.split(' ')[0]);
    const url = `https://wa.me/${number}?text=${encodeURIComponent(personalized)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
    setSentTo((prev) => new Set(prev).add(pilgrim.id));

    try {
      await fetch('/api/activity', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'whatsapp',
          message: `WhatsApp opened for ${pilgrim.name} (${pilgrim.id}) — ${groupId}`,
          icon: 'message',
        }),
      });
    } catch {
      // Non-critical — the WhatsApp chat already opened regardless.
    }
  };

  return (
    <div id="whatsapp-broadcast" className="card-base">
      <div className="flex items-center gap-2 mb-4">
        <div className="p-1.5 rounded-lg bg-[#F0FDF4]">
          <MessageSquare size={14} className="text-[#16A34A]" />
        </div>
        <h3 className="text-sm font-semibold text-foreground">WhatsApp</h3>
      </div>

      <p className="text-xs text-muted-foreground mb-3">
        WhatsApp doesn't allow sending one message to many numbers at once from a website. Pick a recipient below and it opens WhatsApp (app or web) with the chat and message ready — you just hit send yourself.
      </p>

      {/* Recipient Filter */}
      <div className="mb-3">
        <label className="block text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1.5">
          Filter
        </label>
        <div className="grid grid-cols-2 gap-1.5">
          {(Object.entries(recipientCounts) as [typeof recipient, number][]).map(([key, count]) => (
            <button
              key={`rec-${key}`}
              onClick={() => setRecipient(key)}
              className={`px-2 py-1.5 rounded-lg text-xs font-medium border transition-all text-left ${
                recipient === key
                  ? 'bg-secondary border-primary/30 text-primary' :'bg-muted border-border text-muted-foreground hover:bg-input'
              }`}
            >
              <span className="flex items-center gap-1.5">
                <Users size={10} />
                {key === 'all' ? 'All Pilgrims' : key === 'pending-visa' ? 'Pending Visa' : key === 'pending-payment' ? 'Payment Due' : 'Absent Today'}
              </span>
              <span className="font-bold tabular-nums">{count}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Template Selector */}
      <div className="mb-3">
        <label className="block text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1.5">
          Template <span className="normal-case font-normal">(use {'{name}'} to personalize)</span>
        </label>
        <select
          value={selectedTemplate}
          onChange={(e) => handleTemplateChange(e.target.value)}
          className="w-full text-sm border border-border rounded-lg px-3 py-2 bg-input text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
        >
          {templates.map((t) => (
            <option key={t.id} value={t.id}>{t.label}</option>
          ))}
        </select>
      </div>

      {/* Message */}
      <div className="mb-3">
        <label className="block text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1.5">
          Message
        </label>
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          rows={4}
          placeholder="Type your message here..."
          className="w-full text-sm border border-border rounded-lg px-3 py-2 bg-input text-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none"
        />
        <p className="text-xs text-muted-foreground mt-1">{message.length} characters</p>
      </div>

      {/* Recipient list — one real WhatsApp link per pilgrim */}
      <div className="border-t border-border pt-3">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
          {visibleList.length} recipient{visibleList.length === 1 ? '' : 's'}
        </p>
        <div className="space-y-1.5 max-h-64 overflow-y-auto scrollbar-thin pr-1">
          {visibleList.length === 0 && (
            <p className="text-xs text-muted-foreground">No pilgrims match this filter.</p>
          )}
          {visibleList.map((p) => (
            <div key={p.id} className="flex items-center justify-between gap-2 p-2 rounded-lg bg-muted/40">
              <div className="min-w-0">
                <p className="text-xs font-medium text-foreground truncate">{p.name}</p>
                <p className="text-xs text-muted-foreground font-mono-data">{p.phone}</p>
              </div>
              <button
                onClick={() => handleOpenWhatsApp(p)}
                className={`flex items-center gap-1 px-2 py-1 rounded text-xs font-medium flex-shrink-0 transition-colors ${
                  sentTo.has(p.id) ? 'bg-[#F0FDF4] text-[#16A34A]' : 'bg-[#16A34A] text-white hover:bg-[#15803D]'
                }`}
              >
                <ExternalLink size={11} />
                {sentTo.has(p.id) ? 'Opened' : 'WhatsApp'}
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
