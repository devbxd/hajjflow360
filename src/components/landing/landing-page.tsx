import Link from 'next/link';
import {
  ArrowRight, CalendarClock, CheckCircle2, FileSpreadsheet, LayoutDashboard, LogIn, Map,
  MessageCircle, Phone, Plane, ScanLine, ShieldCheck, Siren, Users, Wallet, Receipt,
  Layers, UserCheck, BookOpen,
} from 'lucide-react';

const CONTACT_NUMBER = '+961 70 792 505';
const WHATSAPP_URL = 'https://wa.me/96170792505?text=' + encodeURIComponent('Hello, I would like to know more about ManasikPro.');
const PHONE_URL = 'tel:+96170792505';

type Module = {
  id: string;
  eyebrow: string;
  title: string;
  summary: string;
  points: string[];
  image?: { src: string; alt: string };
  icon: React.ElementType;
  reverse?: boolean;
};

const MODULES: Module[] = [
  {
    id: 'dashboard',
    eyebrow: 'Overview',
    title: 'A live campaign dashboard',
    summary:
      'Open the app and see the whole campaign at once: how many pilgrims are registered, where every visa stands, how much has been collected, and who needs attention today.',
    points: [
      'Headline numbers for pilgrims, visas, passports, payments, buses and rooms',
      'Visa status chart and registration timeline',
      'Group progress and payment progress at a glance',
      'At-risk table listing pilgrims with missing passports, rejected visas or overdue payments',
      'Recent activity feed of everything your team changed',
    ],
    image: { src: '/showcase/dashboard.png', alt: 'ManasikPro campaign dashboard' },
    icon: LayoutDashboard,
  },
  {
    id: 'pilgrims',
    eyebrow: 'Pilgrims',
    title: 'Every pilgrim, in one organized table',
    summary:
      'Register pilgrims one by one, or import a whole group from a spreadsheet. Search, filter and act on many pilgrims at once instead of editing rows by hand.',
    points: [
      'Add, edit and review each pilgrim’s details, passport and contact information',
      'Bulk import from Excel with checks before anything is saved',
      'Assign a whole selection of pilgrims to a group leader in one action',
      'Bulk delete, with a confirmation step before anything is removed',
      'Filter by visa, passport, payment or group status and export the result',
    ],
    image: { src: '/showcase/pilgrim-management.png', alt: 'ManasikPro pilgrim management table' },
    icon: Users,
    reverse: true,
  },
  {
    id: 'scanning',
    eyebrow: 'Passport scanning',
    title: 'Scan a passport, skip the typing',
    summary:
      'Photograph a passport and ManasikPro reads the machine-readable zone to fill in the pilgrim’s record. Your staff checks every field before it is saved.',
    points: [
      'Reads the MRZ strip: name, passport number, nationality, dates and sex',
      'Nothing is saved until a staff member has reviewed and confirmed it',
      'Works from a phone camera or an existing photo',
      'Avoids the copy mistakes that come with typing names by hand',
    ],
    icon: ScanLine,
  },
  {
    id: 'profile',
    eyebrow: 'Pilgrim profile',
    title: 'One complete file per pilgrim',
    summary:
      'Open a pilgrim and see everything about them in one place: documents, visa progress, travel and accommodation, payments, and the history of every change.',
    points: [
      'Personal information, passport data and the MRZ line',
      'Visa tracking timeline from application to approval',
      'Flight, bus seat and hotel room assignment directly from the profile',
      'Payment history with the remaining balance',
      'Activity log for that pilgrim and a direct WhatsApp button',
    ],
    icon: UserCheck,
    reverse: true,
  },
  {
    id: 'groups',
    eyebrow: 'Group leaders',
    title: 'A dashboard for every group leader',
    summary:
      'Each group leader sees only their own pilgrims, their status, and what is still missing, and can message any of them on WhatsApp with one click.',
    points: [
      'Per-group view of pilgrims, documents and payments',
      'WhatsApp panel with ready-to-send messages for reminders and requests',
      'Clear list of what each pilgrim still needs to complete',
    ],
    image: { src: '/showcase/group-leader.png', alt: 'ManasikPro group leader dashboard' },
    icon: BookOpen,
  },
  {
    id: 'logistics',
    eyebrow: 'Logistics',
    title: 'Flights, hotels and buses, planned in one place',
    summary:
      'Build flight manifests, assign hotel rooms and place pilgrims on buses. When you are short on time, one button places every unassigned pilgrim automatically.',
    points: [
      'Flight manifests, with flights imported from an Excel file',
      'Hotel and room allocation for Makkah and Madinah, with check-in and check-out dates',
      'Bus seating with a visual seat map for each bus',
      'Auto-assign: fills remaining buses and rooms while keeping groups together where possible',
      'Every assignment is saved immediately and shows up on the pilgrim’s profile',
    ],
    image: { src: '/showcase/allocation.png', alt: 'ManasikPro bus and hotel allocation' },
    icon: Plane,
    reverse: true,
  },
  {
    id: 'payments',
    eyebrow: 'Payments',
    title: 'Know exactly who has paid and who still owes',
    summary:
      'Record every payment as it arrives, see each pilgrim’s balance, and handle refunds. Nothing is lost in a spreadsheet, and every amount has its history.',
    points: [
      'Record payments with method, date and reference, in SAR, USD, EUR or GBP',
      'Balance and “remaining after this payment” calculated while you type',
      'Refunds recorded as negative amounts, shown clearly in red',
      'Full payment history for each pilgrim, and a list of recent payments',
    ],
    image: { src: '/showcase/payments.png', alt: 'ManasikPro payments overview' },
    icon: Wallet,
  },
  {
    id: 'finance',
    eyebrow: 'Finance',
    title: 'Invoices, expenses and reports',
    summary:
      'Bill pilgrims with proper invoices, track what the campaign spends, and export clean reports for your accountant.',
    points: [
      'Create invoices for a pilgrim and download them as PDF',
      'Link a payment to an invoice; the invoice becomes paid once it is fully covered',
      'Log expenses by category and compare revenue with spending month by month',
      'Export pilgrims, payments, expenses and a campaign summary as CSV for Excel',
    ],
    icon: Receipt,
    reverse: true,
  },
  {
    id: 'operations',
    eyebrow: 'Day of travel',
    title: 'Check-in, emergencies and alerts',
    summary:
      'On the day, the team checks pilgrims in with a QR code, pulls emergency contacts in seconds, and gets alerts about what needs action.',
    points: [
      'QR check-in to mark pilgrims as arrived or departed',
      'Emergency lists with contact details, ready to print or export',
      'Notifications for missing documents, rejected visas, overdue payments and unassigned pilgrims',
    ],
    icon: Siren,
  },
  {
    id: 'seasons',
    eyebrow: 'Seasons',
    title: 'Start a new season without losing the last one',
    summary:
      'When a season ends, archive it in one step and start the next from a clean slate. Past seasons stay available to open, export and compare.',
    points: [
      'Archive the full current season with its pilgrims, logistics, payments and invoices',
      'Start the next season under a new name and date',
      'Export any past season as a full JSON backup, a pilgrim CSV, or a PDF summary',
    ],
    icon: CalendarClock,
    reverse: true,
  },
];

const WORKFLOW = [
  { icon: FileSpreadsheet, title: 'Import or scan', body: 'Bring pilgrims in from an Excel file or a passport photo.' },
  { icon: Layers, title: 'Assign', body: 'Put pilgrims into groups, flights, hotels and buses, manually or automatically.' },
  { icon: Wallet, title: 'Collect', body: 'Record payments and invoices as money comes in and follow every balance.' },
  { icon: Map, title: 'Travel', body: 'Check pilgrims in on the day and keep emergency contacts one tap away.' },
];

const TRUST = [
  { icon: ShieldCheck, title: 'Private to your team', body: 'Every staff member signs in with their own account. Pilgrim data is never visible outside your team.' },
  { icon: Users, title: 'Built for several staff at once', body: 'Everyone works from the same up-to-date information, so nobody is working from an old copy.' },
  { icon: CheckCircle2, title: 'You review before anything is saved', body: 'Scanned and imported data is always checked by a person first.' },
];

export function LandingPage() {
  return (
    <div className="bg-background text-foreground min-h-screen">
      <header className="border-border bg-background/90 sticky top-0 z-30 border-b backdrop-blur">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-6 px-5 sm:px-8">
          <Link href="/" className="flex items-center gap-2.5">
            <span className="bg-primary text-primary-foreground flex size-8 items-center justify-center rounded-md text-sm font-bold">M</span>
            <span className="text-lg font-semibold tracking-tight">ManasikPro</span>
          </Link>
          <nav className="text-muted-foreground hidden items-center gap-7 text-sm md:flex">
            <a href="#modules" className="hover:text-foreground transition-colors">Features</a>
            <a href="#workflow" className="hover:text-foreground transition-colors">How it works</a>
            <a href="#contact" className="hover:text-foreground transition-colors">Contact</a>
          </nav>
          <div className="flex items-center gap-2">
            <Link href="/login" className="border-border hover:bg-muted inline-flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium transition-colors">
              <LogIn className="size-4" />
              Sign in
            </Link>
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-7xl px-5 pt-16 pb-20 sm:px-8 lg:pt-24">
        <div className="grid items-center gap-14 lg:grid-cols-[1.05fr_1fr]">
          <div>
            <p className="text-accent text-sm font-semibold tracking-wide uppercase">Hajj and Umrah campaign software</p>
            <h1 className="mt-4 text-4xl leading-[1.1] font-bold tracking-tight text-balance sm:text-5xl lg:text-6xl">
              Run every pilgrim, flight, room, bus and payment from one place.
            </h1>
            <p className="text-muted-foreground mt-6 max-w-xl text-lg leading-relaxed">
              ManasikPro replaces scattered spreadsheets and endless WhatsApp messages with a single system your whole team
              works in at the same time, with the same up-to-date information for everyone.
            </p>
            <div className="mt-9 flex flex-wrap items-center gap-3">
              <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer" className="bg-primary text-primary-foreground hover:opacity-90 inline-flex items-center gap-2 rounded-lg px-5 py-3 text-sm font-semibold transition-opacity">
                <MessageCircle className="size-4" />
                Talk to us on WhatsApp
              </a>
              <a href="#modules" className="border-border hover:bg-muted inline-flex items-center gap-2 rounded-lg border px-5 py-3 text-sm font-semibold transition-colors">
                See what it does
                <ArrowRight className="size-4" />
              </a>
            </div>
          </div>
          <figure className="border-border bg-card overflow-hidden rounded-xl border shadow-[0_24px_60px_-28px_rgba(26,26,26,0.35)]">
            <div className="border-border flex items-center gap-1.5 border-b px-4 py-2.5">
              <span className="bg-border size-2.5 rounded-full" />
              <span className="bg-border size-2.5 rounded-full" />
              <span className="bg-border size-2.5 rounded-full" />
            </div>
            <img src="/showcase/dashboard.png" alt="ManasikPro campaign dashboard" width={1440} height={900} className="block w-full" />
          </figure>
        </div>
      </section>

      <section className="border-border bg-card border-y">
        <div className="mx-auto grid max-w-7xl gap-px bg-border sm:grid-cols-3">
          {TRUST.map((item) => (
            <div key={item.title} className="bg-card flex gap-4 px-6 py-8 sm:px-8">
              <item.icon className="text-primary mt-0.5 size-5 shrink-0" />
              <div>
                <p className="font-semibold">{item.title}</p>
                <p className="text-muted-foreground mt-1.5 text-sm leading-relaxed">{item.body}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section id="modules" className="mx-auto max-w-7xl px-5 py-24 sm:px-8">
        <div className="max-w-2xl">
          <p className="text-accent text-sm font-semibold tracking-wide uppercase">What is inside</p>
          <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">Every part of the campaign, explained</h2>
          <p className="text-muted-foreground mt-4 text-lg leading-relaxed">
            Here is what each part of ManasikPro does, in detail.
          </p>
        </div>

        <div className="mt-20 space-y-24">
          {MODULES.map((m) => (
            <article key={m.id} id={m.id} className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
              <div className={m.reverse ? 'lg:order-2' : ''}>
                <div className="text-primary flex items-center gap-2.5 text-sm font-semibold tracking-wide uppercase">
                  <m.icon className="size-4" />
                  {m.eyebrow}
                </div>
                <h3 className="mt-3 text-2xl font-bold tracking-tight sm:text-3xl">{m.title}</h3>
                <p className="text-muted-foreground mt-4 text-base leading-relaxed">{m.summary}</p>
                <ul className="mt-6 space-y-3">
                  {m.points.map((point) => (
                    <li key={point} className="flex gap-3 text-sm leading-relaxed">
                      <CheckCircle2 className="text-primary mt-0.5 size-4 shrink-0" />
                      <span>{point}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className={m.reverse ? 'lg:order-1' : ''}>
                {m.image ? (
                  <figure className="border-border bg-card overflow-hidden rounded-xl border shadow-[0_18px_44px_-26px_rgba(26,26,26,0.3)]">
                    <img src={m.image.src} alt={m.image.alt} width={1440} height={900} loading="lazy" className="block w-full" />
                  </figure>
                ) : (
                  <div className="border-border bg-secondary/60 flex aspect-[4/3] items-center justify-center rounded-xl border border-dashed">
                    <m.icon className="text-primary/60 size-14" />
                  </div>
                )}
              </div>
            </article>
          ))}
        </div>
      </section>

      <section id="workflow" className="bg-card border-border border-y">
        <div className="mx-auto max-w-7xl px-5 py-24 sm:px-8">
          <div className="max-w-2xl">
            <p className="text-accent text-sm font-semibold tracking-wide uppercase">How it works</p>
            <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">From first registration to departure</h2>
          </div>
          <ol className="mt-14 grid gap-px overflow-hidden rounded-xl bg-border md:grid-cols-4">
            {WORKFLOW.map((step, index) => (
              <li key={step.title} className="bg-card px-6 py-8">
                <div className="flex items-center justify-between">
                  <step.icon className="text-primary size-6" />
                  <span className="text-muted-foreground text-sm font-semibold">0{index + 1}</span>
                </div>
                <p className="mt-6 text-lg font-semibold">{step.title}</p>
                <p className="text-muted-foreground mt-2 text-sm leading-relaxed">{step.body}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section id="contact" className="mx-auto max-w-7xl px-5 py-24 sm:px-8">
        <div className="bg-primary text-primary-foreground grid gap-10 rounded-2xl px-8 py-14 sm:px-14 lg:grid-cols-[1.2fr_1fr] lg:items-center">
          <div>
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">Interested? Talk to us directly.</h2>
            <p className="mt-4 max-w-xl leading-relaxed opacity-90">
              Ask about the software, a demonstration for your team, or how it fits your campaign. We reply on WhatsApp and by phone.
            </p>
          </div>
          <div className="space-y-3">
            <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer" className="bg-card text-foreground hover:opacity-95 flex items-center justify-between rounded-lg px-5 py-4 font-semibold transition-opacity">
              <span className="flex items-center gap-3">
                <MessageCircle className="text-primary size-5" />
                Message on WhatsApp
              </span>
              <ArrowRight className="size-4" />
            </a>
            <a href={PHONE_URL} className="border-primary-foreground/30 hover:bg-primary-foreground/10 flex items-center justify-between rounded-lg border px-5 py-4 font-semibold transition-colors">
              <span className="flex items-center gap-3">
                <Phone className="size-5" />
                Call {CONTACT_NUMBER}
              </span>
              <ArrowRight className="size-4" />
            </a>
          </div>
        </div>
      </section>

      <footer className="border-border border-t">
        <div className="text-muted-foreground mx-auto flex max-w-7xl flex-col gap-4 px-5 py-8 text-sm sm:flex-row sm:items-center sm:justify-between sm:px-8">
          <p>© {new Date().getFullYear()} ManasikPro. All rights reserved.</p>
          <div className="flex items-center gap-6">
            <a href="#modules" className="hover:text-foreground">Features</a>
            <a href="#contact" className="hover:text-foreground">Contact</a>
            <Link href="/login" className="hover:text-foreground">Sign in</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
