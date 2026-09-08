import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  Users, ScanLine, MessageSquare, CreditCard, Bus,
  AlertTriangle, LayoutDashboard, ShieldCheck, Smartphone,
} from 'lucide-react';

export const dynamic = 'force-static';

const features = [
  {
    icon: LayoutDashboard,
    title: 'Real-time overview',
    desc: 'One screen to see how many pilgrims are registered, how many visas are approved, how much revenue has been collected, and who is at risk before it’s too late.',
  },
  {
    icon: Users,
    title: 'Complete pilgrim management',
    desc: 'One profile per pilgrim: passport, visa, flight, hotel, bus, payment, emergency contact. Search, filter, and export in one click.',
  },
  {
    icon: ScanLine,
    title: 'Automatic passport scanning',
    desc: 'Take a photo of the passport and the app reads the MRZ strip to pre-fill the pilgrim’s record. Staff review and confirm before saving.',
  },
  {
    icon: Bus,
    title: 'Auto-assign buses & hotel rooms',
    desc: 'One button places every unassigned pilgrim into available bus seats and hotel rooms, keeping each group together wherever possible.',
  },
  {
    icon: MessageSquare,
    title: 'Direct WhatsApp contact',
    desc: 'Opens WhatsApp with the right number and a message already drafted for each pilgrim — payment reminders, passport requests, departure notices.',
  },
  {
    icon: CreditCard,
    title: 'Payment tracking',
    desc: 'Who has paid, what’s outstanding, who’s overdue. Full transaction history, CSV export.',
  },
  {
    icon: AlertTriangle,
    title: 'Automatic alerts',
    desc: 'Missing passport, rejected visa, overdue payment, no bus assigned: the list of urgent cases builds itself from real data.',
  },
  {
    icon: ShieldCheck,
    title: 'Secure multi-user access',
    desc: 'Multiple staff members, each with their own login, passwords protected — nobody outside the team can see the data.',
  },
];

const screenshots = [
  { src: '/showcase/dashboard.png', alt: 'Campaign dashboard', label: 'Dashboard' },
  { src: '/showcase/pilgrim-management.png', alt: 'Pilgrim management', label: 'Pilgrim management' },
  { src: '/showcase/payments.png', alt: 'Payment tracking', label: 'Payments' },
  { src: '/showcase/group-leader.png', alt: 'Group leader dashboard', label: 'Group leaders' },
  { src: '/showcase/allocation.png', alt: 'Bus and hotel allocation', label: 'Buses & hotels' },
  { src: '/showcase/login.png', alt: 'Secure login page', label: 'Secure login' },
];

export default function ShowcasePage() {
  return (
    <div style={{ background: '#F7F5F2', minHeight: '100vh' }}>
      {/* Hero */}
      <section style={{ padding: '72px 24px 56px', textAlign: 'center', maxWidth: 780, margin: '0 auto' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '6px 14px', borderRadius: 999, background: '#EDE9E3', color: '#6B6560', fontSize: 13, fontWeight: 600, marginBottom: 24 }}>
          <Smartphone size={14} />
          Hajj &amp; Umrah campaign management software
        </div>
        <h1 style={{ fontSize: 40, fontWeight: 700, color: '#1F1B16', margin: '0 0 16px', lineHeight: 1.15 }}>
          ManasikPro
        </h1>
        <p style={{ fontSize: 18, color: '#4A443C', lineHeight: 1.6, margin: '0 0 32px' }}>
          Every piece of logistics for a Hajj or Umrah campaign — pilgrims, visas, passports, payments, buses,
          hotels and flights — run from a single dashboard. No more scattered spreadsheets and lost WhatsApp
          messages.
        </p>
        <Link
          href="/login"
          style={{ display: 'inline-block', padding: '12px 28px', borderRadius: 10, background: '#1B6B4A', color: 'white', fontWeight: 600, textDecoration: 'none', fontSize: 15 }}
        >
          Sign in to the dashboard
        </Link>
      </section>

      {/* Screenshots */}
      <section style={{ maxWidth: 1100, margin: '0 auto', padding: '0 24px 64px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 20 }}>
          {screenshots.map((s) => (
            <figure key={s.src} style={{ margin: 0, background: 'white', borderRadius: 14, overflow: 'hidden', border: '1px solid #E5E1DA', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
              <Image src={s.src} alt={s.alt} width={1440} height={900} style={{ width: '100%', height: 'auto', display: 'block' }} />
              <figcaption style={{ padding: '10px 14px', fontSize: 13, fontWeight: 600, color: '#4A443C' }}>{s.label}</figcaption>
            </figure>
          ))}
        </div>
      </section>

      {/* What it's for / pitch */}
      <section style={{ maxWidth: 900, margin: '0 auto', padding: '0 24px 64px' }}>
        <h2 style={{ fontSize: 26, fontWeight: 700, color: '#1F1B16', textAlign: 'center', margin: '0 0 12px' }}>
          What is it for?
        </h2>
        <p style={{ fontSize: 15, color: '#4A443C', lineHeight: 1.7, textAlign: 'center', maxWidth: 680, margin: '0 auto 40px' }}>
          Organizing a Hajj or Umrah trip for hundreds of people means tracking dozens of statuses per pilgrim at
          once — passport, visa, flight, room, bus, payment — without a single one slipping through the
          cracks. ManasikPro replaces spreadsheets, WhatsApp groups, and paper notebooks with one system the whole
          team uses at the same time, with the same up-to-date information for everyone.
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 20 }}>
          {features.map((f) => {
            const Icon = f.icon;
            return (
              <div key={f.title} style={{ background: 'white', border: '1px solid #E5E1DA', borderRadius: 14, padding: 20 }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: '#EAF3EE', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
                  <Icon size={18} color="#1B6B4A" />
                </div>
                <h3 style={{ fontSize: 15, fontWeight: 700, color: '#1F1B16', margin: '0 0 6px' }}>{f.title}</h3>
                <p style={{ fontSize: 13.5, color: '#6B6560', lineHeight: 1.55, margin: 0 }}>{f.desc}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* Footer CTA */}
      <section style={{ textAlign: 'center', padding: '0 24px 72px' }}>
        <Link
          href="/login"
          style={{ display: 'inline-block', padding: '12px 28px', borderRadius: 10, background: '#1B6B4A', color: 'white', fontWeight: 600, textDecoration: 'none', fontSize: 15 }}
        >
          Open the app
        </Link>
      </section>
    </div>
  );
}
