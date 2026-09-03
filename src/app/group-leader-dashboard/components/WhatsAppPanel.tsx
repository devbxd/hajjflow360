'use client';

import React, { useState } from 'react';
import { MessageSquare, Send, Users, CheckCheck } from 'lucide-react';
import { toast } from 'sonner';

const templates = [
  { id: 'tpl-passport', label: 'Passport Reminder', body: 'Dear pilgrim, please submit your passport scan to the campaign office by 10/09/2027. Failure to do so may delay your visa. JazakAllah khair.' },
  { id: 'tpl-payment', label: 'Payment Due', body: 'Assalamu Alaikum. Your Hajj 2027 package has an outstanding balance. Please complete your payment before 12/09/2027. Contact us for assistance.' },
  { id: 'tpl-departure', label: 'Departure Notice', body: 'Important: Your departure is scheduled for 15/09/2027. Please arrive at the assembly point by 04:00 AM. Bring your passport, visa, and all luggage.' },
  { id: 'tpl-general', label: 'General Update', body: '' },
];

export default function WhatsAppPanel() {
  const [selectedTemplate, setSelectedTemplate] = useState('tpl-general');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [recipient, setRecipient] = useState<'all' | 'pending-visa' | 'pending-payment' | 'absent'>('all');

  const recipientCounts: Record<typeof recipient, number> = {
    all: 47,
    'pending-visa': 3,
    'pending-payment': 9,
    absent: 6,
  };

  const handleTemplateChange = (id: string) => {
    setSelectedTemplate(id);
    const tpl = templates.find((t) => t.id === id);
    if (tpl) setMessage(tpl.body);
  };

  const handleSend = () => {
    if (!message.trim()) {
      toast.error('Message cannot be empty');
      return;
    }
    setSending(true);
    // Backend integration point: POST /api/whatsapp/broadcast with { groupId, recipientFilter, message }
    setTimeout(() => {
      setSending(false);
      toast.success(`WhatsApp sent to ${recipientCounts[recipient]} pilgrims`);
      setMessage('');
    }, 1800);
  };

  return (
    <div className="card-base">
      <div className="flex items-center gap-2 mb-4">
        <div className="p-1.5 rounded-lg bg-[#F0FDF4]">
          <MessageSquare size={14} className="text-[#16A34A]" />
        </div>
        <h3 className="text-sm font-semibold text-foreground">WhatsApp Broadcast</h3>
      </div>

      {/* Recipient Filter */}
      <div className="mb-3">
        <label className="block text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1.5">
          Send To
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
          Template
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

      <button
        onClick={handleSend}
        disabled={sending}
        className="btn-primary w-full justify-center text-sm"
        style={{ opacity: sending ? 0.7 : 1 }}
      >
        {sending ? (
          <>
            <span className="animate-spin inline-block w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full" />
            Sending...
          </>
        ) : (
          <>
            <Send size={13} />
            Send to {recipientCounts[recipient]} pilgrims
          </>
        )}
      </button>

      {/* Sent History */}
      <div className="mt-4 pt-4 border-t border-border">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">Recent Broadcasts</p>
        <div className="space-y-2">
          {[
            { msg: 'Departure notice sent to all 47 pilgrims', time: '4 hr ago', delivered: 45 },
            { msg: 'Passport reminder sent to 3 pilgrims', time: '1 day ago', delivered: 3 },
            { msg: 'Payment reminder sent to 9 pilgrims', time: '2 days ago', delivered: 8 },
          ].map((item, idx) => (
            <div key={`wh-${idx}`} className="flex items-start gap-2">
              <CheckCheck size={13} className="text-[#16A34A] flex-shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <p className="text-xs text-foreground truncate">{item.msg}</p>
                <p className="text-xs text-muted-foreground">{item.time} · {item.delivered} delivered</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}