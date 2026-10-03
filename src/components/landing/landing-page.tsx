'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import {
  ArrowRight, BookOpen, CalendarClock, CheckCircle2, FileSpreadsheet, Languages, Layers,
  LayoutDashboard, LogIn, Map, MessageCircle, Phone, Plane, Receipt, ScanLine, ShieldCheck,
  Siren, UserCheck, Users, Wallet,
} from 'lucide-react';
import { Reveal } from './reveal';

const CONTACT_NUMBER = '+961 70 792 505';
const WHATSAPP_URL = 'https://wa.me/96170792505';
const PHONE_URL = 'tel:+96170792505';

type Lang = 'en' | 'ar';
type ModuleCopy = { eyebrow: string; title: string; summary: string; points: string[] };

const COPY = {
  en: {
    nav: { features: 'Features', how: 'How it works', contact: 'Contact', signIn: 'Sign in', switchTo: 'العربية' },
    hero: {
      eyebrow: 'Hajj and Umrah campaign software',
      title: 'Run every pilgrim, flight, room, bus and payment from one place.',
      body: 'ManasikPro replaces scattered spreadsheets and endless WhatsApp messages with a single system your whole team works in at the same time, with the same up-to-date information for everyone.',
      whatsapp: 'Talk to us on WhatsApp',
      see: 'See what it does',
    },
    trust: [
      { title: 'Private to your team', body: 'Every staff member signs in with their own account. Pilgrim data is never visible outside your team.' },
      { title: 'Built for several staff at once', body: 'Everyone works from the same up-to-date information, so nobody is working from an old copy.' },
      { title: 'You review before anything is saved', body: 'Scanned and imported data is always checked by a person first.' },
    ],
    modulesEyebrow: 'What is inside',
    modulesTitle: 'Every part of the campaign, explained',
    modulesIntro: 'Here is what each part of ManasikPro does, in detail.',
    modules: {
      dashboard: {
        eyebrow: 'Overview',
        title: 'A live campaign dashboard',
        summary: 'Open the app and see the whole campaign at once: how many pilgrims are registered, where every visa stands, how much has been collected, and who needs attention today.',
        points: [
          'Headline numbers for pilgrims, visas, passports, payments, buses and rooms',
          'Visa status chart and registration timeline',
          'Group progress and payment progress at a glance',
          'At-risk table listing pilgrims with missing passports, rejected visas or overdue payments',
          'Recent activity feed of everything your team changed',
        ],
      },
      pilgrims: {
        eyebrow: 'Pilgrims',
        title: 'Every pilgrim, in one organized table',
        summary: 'Register pilgrims one by one, or import a whole group from a spreadsheet. Search, filter and act on many pilgrims at once instead of editing rows by hand.',
        points: [
          'Add, edit and review each pilgrim’s details, passport and contact information',
          'Bulk import from Excel with checks before anything is saved',
          'Assign a whole selection of pilgrims to a group leader in one action',
          'Bulk delete, with a confirmation step before anything is removed',
          'Filter by visa, passport, payment or group status and export the result',
        ],
      },
      scanning: {
        eyebrow: 'Passport scanning',
        title: 'Scan a passport, skip the typing',
        summary: 'Photograph a passport and ManasikPro reads the machine-readable zone to fill in the pilgrim’s record. Your staff checks every field before it is saved.',
        points: [
          'Reads the MRZ strip: name, passport number, nationality, dates and sex',
          'Nothing is saved until a staff member has reviewed and confirmed it',
          'Works from a phone camera or an existing photo',
          'Avoids the copy mistakes that come with typing names by hand',
        ],
      },
      profile: {
        eyebrow: 'Pilgrim profile',
        title: 'One complete file per pilgrim',
        summary: 'Open a pilgrim and see everything about them in one place: documents, visa progress, travel and accommodation, payments, and the history of every change.',
        points: [
          'Personal information, passport data and the MRZ line',
          'Visa tracking timeline from application to approval',
          'Flight, bus seat and hotel room assignment directly from the profile',
          'Payment history with the remaining balance',
          'Activity log for that pilgrim and a direct WhatsApp button',
        ],
      },
      groups: {
        eyebrow: 'Group leaders',
        title: 'A dashboard for every group leader',
        summary: 'Each group leader sees only their own pilgrims, their status, and what is still missing, and can message any of them on WhatsApp with one click.',
        points: [
          'Per-group view of pilgrims, documents and payments',
          'WhatsApp panel with ready-to-send messages for reminders and requests',
          'Clear list of what each pilgrim still needs to complete',
        ],
      },
      logistics: {
        eyebrow: 'Logistics',
        title: 'Flights, hotels and buses, planned in one place',
        summary: 'Build flight manifests, assign hotel rooms and place pilgrims on buses. When you are short on time, one button places every unassigned pilgrim automatically.',
        points: [
          'Flight manifests, with flights imported from an Excel file',
          'Hotel and room allocation for Makkah and Madinah, with check-in and check-out dates',
          'Bus seating with a visual seat map for each bus',
          'Auto-assign: fills remaining buses and rooms while keeping groups together where possible',
          'Every assignment is saved immediately and shows up on the pilgrim’s profile',
        ],
      },
      payments: {
        eyebrow: 'Payments',
        title: 'Know exactly who has paid and who still owes',
        summary: 'Record every payment as it arrives, see each pilgrim’s balance, and handle refunds. Nothing is lost in a spreadsheet, and every amount has its history.',
        points: [
          'Record payments with method, date and reference, in SAR, USD, EUR or GBP',
          'Balance and “remaining after this payment” calculated while you type',
          'Refunds recorded as negative amounts, shown clearly in red',
          'Full payment history for each pilgrim, and a list of recent payments',
        ],
      },
      finance: {
        eyebrow: 'Finance',
        title: 'Invoices, expenses and reports',
        summary: 'Bill pilgrims with proper invoices, track what the campaign spends, and export clean reports for your accountant.',
        points: [
          'Create invoices for a pilgrim and download them as PDF',
          'Link a payment to an invoice; the invoice becomes paid once it is fully covered',
          'Log expenses by category and compare revenue with spending month by month',
          'Export pilgrims, payments, expenses and a campaign summary as CSV for Excel',
        ],
      },
      operations: {
        eyebrow: 'Day of travel',
        title: 'Check-in, emergencies and alerts',
        summary: 'On the day, the team checks pilgrims in with a QR code, pulls emergency contacts in seconds, and gets alerts about what needs action.',
        points: [
          'QR check-in to mark pilgrims as arrived or departed',
          'Emergency lists with contact details, ready to print or export',
          'Notifications for missing documents, rejected visas, overdue payments and unassigned pilgrims',
        ],
      },
      seasons: {
        eyebrow: 'Seasons',
        title: 'Start a new season without losing the last one',
        summary: 'When a season ends, archive it in one step and start the next from a clean slate. Past seasons stay available to open, export and compare.',
        points: [
          'Archive the full current season with its pilgrims, logistics, payments and invoices',
          'Start the next season under a new name and date',
          'Export any past season as a full JSON backup, a pilgrim CSV, or a PDF summary',
        ],
      },
    } satisfies Record<string, ModuleCopy>,
    workflowEyebrow: 'How it works',
    workflowTitle: 'From first registration to departure',
    workflow: [
      { title: 'Import or scan', body: 'Bring pilgrims in from an Excel file or a passport photo.' },
      { title: 'Assign', body: 'Put pilgrims into groups, flights, hotels and buses, manually or automatically.' },
      { title: 'Collect', body: 'Record payments and invoices as money comes in and follow every balance.' },
      { title: 'Travel', body: 'Check pilgrims in on the day and keep emergency contacts one tap away.' },
    ],
    contact: {
      title: 'Interested? Talk to us directly.',
      body: 'Ask about the software, a demonstration for your team, or how it fits your campaign. We reply on WhatsApp and by phone.',
      whatsapp: 'Message on WhatsApp',
      call: 'Call',
    },
    footer: { rights: 'All rights reserved.', features: 'Features', contact: 'Contact', signIn: 'Sign in' },
    alts: {
      dashboard: 'ManasikPro campaign dashboard',
      pilgrims: 'ManasikPro pilgrim management table',
      groups: 'ManasikPro group leader dashboard',
      logistics: 'ManasikPro bus and hotel allocation',
      payments: 'ManasikPro payments overview',
    },
    whatsappMessage: 'Hello, I would like to know more about ManasikPro.',
    ariaSwitch: 'Switch to Arabic',
  },
  ar: {
    nav: { features: 'المميزات', how: 'طريقة العمل', contact: 'تواصل معنا', signIn: 'تسجيل الدخول', switchTo: 'English' },
    hero: {
      eyebrow: 'برنامج إدارة حملات الحج والعمرة',
      title: 'أدِر كل حاج ورحلة وغرفة وحافلة ودفعة من مكان واحد.',
      body: 'يحل ManasikPro محل الجداول المتفرقة ورسائل واتساب التي لا تنتهي، بنظام واحد يعمل فيه فريقك كله في الوقت نفسه، بالمعلومات المحدّثة نفسها للجميع.',
      whatsapp: 'تواصل معنا عبر واتساب',
      see: 'اكتشف المزيد',
    },
    trust: [
      { title: 'خاص بفريقك', body: 'يسجّل كل عضو في الفريق الدخول بحسابه الخاص، ولا تظهر بيانات الحجاج لأي شخص خارج فريقك.' },
      { title: 'مصمم لعدة موظفين في وقت واحد', body: 'يعمل الجميع على المعلومات المحدّثة نفسها، فلا يعتمد أحد على نسخة قديمة.' },
      { title: 'مراجعة قبل الحفظ', body: 'تُراجَع البيانات الممسوحة أو المستوردة دائمًا من شخص قبل حفظها.' },
    ],
    modulesEyebrow: 'ما يحتويه النظام',
    modulesTitle: 'كل جزء من الحملة، بالتفصيل',
    modulesIntro: 'إليك ما يقوم به كل جزء في ManasikPro، بالتفصيل.',
    modules: {
      dashboard: {
        eyebrow: 'نظرة عامة',
        title: 'لوحة تحكم حيّة للحملة',
        summary: 'افتح التطبيق وشاهد الحملة كاملة دفعة واحدة: عدد الحجاج المسجلين، وحالة كل تأشيرة، والمبالغ المحصّلة، ومن يحتاج متابعة اليوم.',
        points: [
          'أرقام رئيسية للحجاج والتأشيرات وجوازات السفر والدفعات والحافلات والغرف',
          'مخطط حالة التأشيرات والجدول الزمني للتسجيل',
          'تقدّم المجموعات والدفعات بنظرة واحدة',
          'جدول الحالات الحرجة: جوازات ناقصة، أو تأشيرات مرفوضة، أو دفعات متأخرة',
          'سجل النشاط الأخير لكل ما غيّره فريقك',
        ],
      },
      pilgrims: {
        eyebrow: 'الحجاج',
        title: 'كل حاج في جدول منظّم واحد',
        summary: 'سجّل الحجاج واحدًا تلو الآخر، أو استورد مجموعة كاملة من ملف إكسل. ابحث وصفِّ وطبّق الإجراءات على عدة حجاج معًا بدل تعديل الصفوف يدويًا.',
        points: [
          'إضافة بيانات كل حاج وجواز سفره ومعلومات التواصل معه وتعديلها ومراجعتها',
          'استيراد جماعي من إكسل مع فحوص قبل أي حفظ',
          'تعيين مجموعة كاملة من الحجاج لقائد مجموعة بإجراء واحد',
          'حذف جماعي مع خطوة تأكيد قبل أي إزالة',
          'التصفية حسب التأشيرة أو الجواز أو الدفع أو المجموعة، وتصدير النتيجة',
        ],
      },
      scanning: {
        eyebrow: 'مسح جواز السفر',
        title: 'امسح الجواز، واستغنِ عن الكتابة',
        summary: 'صوّر جواز السفر، فيقرأ ManasikPro المنطقة المقروءة آليًا ويملأ سجل الحاج. يراجع موظفك كل حقل قبل حفظه.',
        points: [
          'قراءة شريط MRZ: الاسم ورقم الجواز والجنسية والتواريخ والجنس',
          'لا يُحفظ شيء قبل أن يراجعه موظف ويؤكده',
          'يعمل من كاميرا الهاتف أو من صورة موجودة',
          'يتفادى أخطاء النسخ التي تأتي مع كتابة الأسماء يدويًا',
        ],
      },
      profile: {
        eyebrow: 'ملف الحاج',
        title: 'ملف كامل لكل حاج',
        summary: 'افتح ملف الحاج وشاهد كل ما يخصه في مكان واحد: الوثائق، وتقدّم التأشيرة، والسفر والإقامة، والدفعات، وتاريخ كل تغيير.',
        points: [
          'البيانات الشخصية وبيانات الجواز وسطر MRZ',
          'جدول متابعة التأشيرة من التقديم حتى الموافقة',
          'تعيين الرحلة ومقعد الحافلة وغرفة الفندق مباشرة من الملف',
          'سجل الدفعات مع الرصيد المتبقي',
          'سجل نشاط الحاج وزر مباشر للتواصل عبر واتساب',
        ],
      },
      groups: {
        eyebrow: 'قادة المجموعات',
        title: 'لوحة تحكم لكل قائد مجموعة',
        summary: 'يرى كل قائد مجموعة حجاجه فقط، وحالتهم، وما لا يزال ناقصًا، ويمكنه مراسلة أي منهم عبر واتساب بنقرة واحدة.',
        points: [
          'عرض لكل مجموعة: الحجاج والوثائق والدفعات',
          'لوحة واتساب فيها رسائل جاهزة للتذكير والطلبات',
          'قائمة واضحة بما يحتاجه كل حاج لإكمال ملفه',
        ],
      },
      logistics: {
        eyebrow: 'اللوجستيات',
        title: 'الرحلات والفنادق والحافلات، مخططة في مكان واحد',
        summary: 'أنشئ قوائم الرحلات، وخصّص غرف الفنادق، ووزّع الحجاج على الحافلات. وعندما يضيق الوقت، يضع زر واحد كل حاج غير مُعيَّن تلقائيًا.',
        points: [
          'قوائم الرحلات، مع استيراد الرحلات من ملف إكسل',
          'تخصيص الفنادق والغرف في مكة والمدينة، مع تواريخ الوصول والمغادرة',
          'ترتيب مقاعد الحافلات بخريطة مرئية لكل حافلة',
          'التعيين التلقائي: يملأ الحافلات والغرف المتبقية مع الحفاظ على المجموعات قدر الإمكان',
          'يُحفظ كل تعيين فورًا ويظهر في ملف الحاج',
        ],
      },
      payments: {
        eyebrow: 'المدفوعات',
        title: 'اعرف بدقة من دفع ومن ما زال عليه مبلغ',
        summary: 'سجّل كل دفعة عند وصولها، وشاهد رصيد كل حاج، وعالج المبالغ المستردة. لا شيء يضيع في جدول، ولكل مبلغ سجله.',
        points: [
          'تسجيل الدفعات مع الطريقة والتاريخ والمرجع، بالريال السعودي أو الدولار أو اليورو أو الجنيه الإسترليني',
          'الرصيد و"المتبقي بعد هذه الدفعة" يُحسبان أثناء الكتابة',
          'المبالغ المستردة تُسجَّل بقيمة سالبة وتظهر بالأحمر بوضوح',
          'سجل دفعات كامل لكل حاج، وقائمة بأحدث الدفعات',
        ],
      },
      finance: {
        eyebrow: 'المالية',
        title: 'الفواتير والمصاريف والتقارير',
        summary: 'أصدر فواتير رسمية للحجاج، وتابع مصاريف الحملة، وصدّر تقارير واضحة لمحاسبك.',
        points: [
          'إنشاء فواتير للحاج وتنزيلها بصيغة PDF',
          'ربط الدفعة بالفاتورة؛ وتصبح الفاتورة مدفوعة عند تغطيتها بالكامل',
          'تسجيل المصاريف حسب الفئة ومقارنة الإيرادات بالمصاريف شهرًا بشهر',
          'تصدير الحجاج والدفعات والمصاريف وملخص الحملة بصيغة CSV للإكسل',
        ],
      },
      operations: {
        eyebrow: 'يوم السفر',
        title: 'تسجيل الوصول والطوارئ والتنبيهات',
        summary: 'في يوم السفر، يسجّل الفريق وصول الحجاج برمز QR، ويعرض بيانات الطوارئ في ثوانٍ، ويتلقى تنبيهات بما يحتاج إجراءً.',
        points: [
          'تسجيل الوصول برمز QR لتحديد الحجاج الواصلين والمغادرين',
          'قوائم الطوارئ مع بيانات التواصل، جاهزة للطباعة أو التصدير',
          'تنبيهات للوثائق الناقصة والتأشيرات المرفوضة والدفعات المتأخرة والحجاج غير المُعيَّنين',
        ],
      },
      seasons: {
        eyebrow: 'المواسم',
        title: 'ابدأ موسمًا جديدًا دون أن تفقد السابق',
        summary: 'عند انتهاء الموسم، أرشفه بخطوة واحدة وابدأ الموسم التالي من صفحة بيضاء. تبقى المواسم السابقة متاحة للفتح والتصدير والمقارنة.',
        points: [
          'أرشفة الموسم الحالي كاملًا مع حجاجه ولوجستياته ودفعاته وفواتيره',
          'بدء الموسم التالي باسم وتاريخ جديدين',
          'تصدير أي موسم سابق كنسخة احتياطية كاملة بصيغة JSON، أو قائمة الحجاج بصيغة CSV، أو ملخص PDF',
        ],
      },
    } satisfies Record<string, ModuleCopy>,
    workflowEyebrow: 'طريقة العمل',
    workflowTitle: 'من أول تسجيل حتى المغادرة',
    workflow: [
      { title: 'استيراد أو مسح', body: 'أدخل الحجاج من ملف إكسل أو من صورة جواز السفر.' },
      { title: 'التعيين', body: 'وزّع الحجاج على المجموعات والرحلات والفنادق والحافلات، يدويًا أو تلقائيًا.' },
      { title: 'التحصيل', body: 'سجّل الدفعات والفواتير عند وصول الأموال، وتابع كل رصيد.' },
      { title: 'السفر', body: 'سجّل وصول الحجاج يوم السفر، واحتفظ ببيانات الطوارئ في متناول يدك.' },
    ],
    contact: {
      title: 'مهتم؟ تواصل معنا مباشرة.',
      body: 'اسأل عن البرنامج، أو عن عرض توضيحي لفريقك، أو عن طريقة ملاءمته لحملتك. نرد عبر واتساب وبالهاتف.',
      whatsapp: 'راسلنا عبر واتساب',
      call: 'اتصل',
    },
    footer: { rights: 'جميع الحقوق محفوظة.', features: 'المميزات', contact: 'تواصل معنا', signIn: 'تسجيل الدخول' },
    alts: {
      dashboard: 'لوحة تحكم حملة ManasikPro',
      pilgrims: 'جدول إدارة الحجاج في ManasikPro',
      groups: 'لوحة قائد المجموعة في ManasikPro',
      logistics: 'توزيع الحافلات والفنادق في ManasikPro',
      payments: 'نظرة عامة على المدفوعات في ManasikPro',
    },
    whatsappMessage: 'مرحبًا، أود معرفة المزيد عن ManasikPro.',
    ariaSwitch: 'التبديل إلى الإنجليزية',
  },
} as const;

const MODULE_META = [
  { id: 'dashboard', icon: LayoutDashboard, image: '/showcase/dashboard.png', alt: 'dashboard', reverse: false },
  { id: 'pilgrims', icon: Users, image: '/showcase/pilgrim-management.png', alt: 'pilgrims', reverse: true },
  { id: 'scanning', icon: ScanLine, image: undefined, alt: undefined, reverse: false },
  { id: 'profile', icon: UserCheck, image: undefined, alt: undefined, reverse: true },
  { id: 'groups', icon: BookOpen, image: '/showcase/group-leader.png', alt: 'groups', reverse: false },
  { id: 'logistics', icon: Plane, image: '/showcase/allocation.png', alt: 'logistics', reverse: true },
  { id: 'payments', icon: Wallet, image: '/showcase/payments.png', alt: 'payments', reverse: false },
  { id: 'finance', icon: Receipt, image: undefined, alt: undefined, reverse: true },
  { id: 'operations', icon: Siren, image: undefined, alt: undefined, reverse: false },
  { id: 'seasons', icon: CalendarClock, image: undefined, alt: undefined, reverse: true },
] as const;

const TRUST_ICONS = [ShieldCheck, Users, CheckCircle2];
const WORKFLOW_ICONS = [FileSpreadsheet, Layers, Wallet, Map];
const STORAGE_KEY = 'manasikpro_landing_lang';

export function LandingPage() {
  const [lang, setLang] = useState<Lang>('en');

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved === 'en' || saved === 'ar') setLang(saved);
    } catch {
      // Storage unavailable: stay on English.
    }
  }, []);

  const toggleLang = () => {
    const next: Lang = lang === 'en' ? 'ar' : 'en';
    setLang(next);
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // Per-viewer convenience only.
    }
  };

  const t = COPY[lang];
  const isAr = lang === 'ar';
  const whatsappHref = `${WHATSAPP_URL}?text=${encodeURIComponent(t.whatsappMessage)}`;
  const arrow = `size-4 ${isAr ? 'rotate-180' : ''}`;

  return (
    <div dir={isAr ? 'rtl' : 'ltr'} lang={lang} className="bg-background text-foreground min-h-screen pb-20 md:pb-0">
      <header className="sticky top-0 z-30 border-b border-white/10 bg-[#0F2F24] text-white">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-6 px-5 sm:px-8">
          <Link href="/" className="flex items-center gap-2.5">
            <span className="flex size-8 items-center justify-center rounded-md bg-[#C5A028] text-sm font-bold text-[#0F2F24]">M</span>
            <span className="text-lg font-semibold tracking-tight">ManasikPro</span>
          </Link>
          <nav className="hidden items-center gap-7 text-sm text-white/70 md:flex">
            <a href="#modules" className="transition-colors hover:text-[#C5A028]">{t.nav.features}</a>
            <a href="#workflow" className="transition-colors hover:text-[#C5A028]">{t.nav.how}</a>
            <a href="#contact" className="transition-colors hover:text-[#C5A028]">{t.nav.contact}</a>
          </nav>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={toggleLang}
              aria-label={isAr ? t.ariaSwitch : 'Switch to Arabic'}
              className="inline-flex items-center gap-2 rounded-lg border border-white/25 px-3 py-2 text-sm font-medium transition-colors hover:bg-white/10"
            >
              <Languages className="size-4" />
              {t.nav.switchTo}
            </button>
            <Link href="/login" className="inline-flex items-center gap-2 rounded-lg border border-white/25 px-3 py-2 text-sm font-medium transition-colors hover:bg-white/10 sm:px-4">
              <LogIn className="size-4" />
              <span>{t.nav.signIn}</span>
            </Link>
          </div>
        </div>
      </header>

      <section className="bg-[#0F2F24] text-white">
        <div className="mx-auto max-w-7xl px-5 pt-12 pb-16 sm:px-8 sm:pt-16 sm:pb-24 lg:pt-24">
          <div className="grid items-center gap-14 lg:grid-cols-[1.05fr_1fr]">
            <div>
              <p className="text-sm font-semibold tracking-wide text-[#C5A028] uppercase">{t.hero.eyebrow}</p>
              <h1 className="mt-4 text-4xl leading-[1.15] font-bold tracking-tight text-balance sm:text-5xl lg:text-6xl">{t.hero.title}</h1>
              <p className="mt-6 max-w-xl text-lg leading-relaxed text-white/75">{t.hero.body}</p>
              <div className="mt-9 flex flex-wrap items-center gap-3">
                <a href={whatsappHref} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 rounded-lg bg-[#C5A028] px-5 py-3 text-sm font-semibold text-[#0F2F24] transition-all hover:-translate-y-0.5 hover:brightness-110">
                  <MessageCircle className="size-4" />
                  {t.hero.whatsapp}
                </a>
                <a href="#modules" className="inline-flex items-center gap-2 rounded-lg border border-white/25 px-5 py-3 text-sm font-semibold transition-colors hover:bg-white/10">
                  {t.hero.see}
                  <ArrowRight className={arrow} />
                </a>
              </div>
            </div>
            <figure className="bg-card overflow-hidden rounded-xl border border-white/15 shadow-[0_30px_80px_-30px_rgba(0,0,0,0.6)] transition-transform duration-500 hover:-translate-y-1">
              <div className="border-border flex items-center gap-1.5 border-b px-4 py-2.5">
                <span className="bg-border size-2.5 rounded-full" />
                <span className="bg-border size-2.5 rounded-full" />
                <span className="bg-border size-2.5 rounded-full" />
              </div>
              <img src="/showcase/dashboard.png" alt={t.alts.dashboard} width={1440} height={900} className="block w-full" />
            </figure>
          </div>
        </div>
      </section>

      <nav aria-label="Jump to a module" className="bg-[#0F2F24] pb-6 md:hidden">
        <div className="flex gap-2 overflow-x-auto px-5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {MODULE_META.map((m) => (
            <a key={m.id} href={`#${m.id}`} className="shrink-0 rounded-full border border-white/20 px-4 py-2 text-sm text-white/85 transition-colors active:bg-[#C5A028] active:text-[#0F2F24]">
              {t.modules[m.id].eyebrow}
            </a>
          ))}
        </div>
      </nav>

      <section className="border-border bg-card border-y">
        <div className="bg-border mx-auto grid max-w-7xl gap-px sm:grid-cols-3">
          {t.trust.map((item, index) => {
            const Icon = TRUST_ICONS[index];
            return (
              <Reveal key={item.title} delay={index * 120} className="bg-card hover:bg-secondary/60 flex gap-4 px-6 py-8 transition-colors duration-300 sm:px-8">
                <Icon className="text-primary mt-0.5 size-5 shrink-0" />
                <div>
                  <p className="font-semibold">{item.title}</p>
                  <p className="text-muted-foreground mt-1.5 text-sm leading-relaxed">{item.body}</p>
                </div>
              </Reveal>
            );
          })}
        </div>
      </section>

      <section id="modules" className="mx-auto max-w-7xl px-5 py-24 sm:px-8">
        <Reveal className="max-w-2xl">
          <p className="text-accent text-sm font-semibold tracking-wide uppercase">{t.modulesEyebrow}</p>
          <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">{t.modulesTitle}</h2>
          <p className="text-muted-foreground mt-4 text-lg leading-relaxed">{t.modulesIntro}</p>
        </Reveal>

        <div className="mt-20 space-y-24">
          {MODULE_META.map((m) => {
            const copy = t.modules[m.id] as ModuleCopy;
            const Icon = m.icon;
            return (
              <Reveal key={m.id}>
                <article id={m.id} className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
                  <div className={m.reverse ? 'lg:order-2' : ''}>
                    <div className="text-primary flex items-center gap-2.5 text-sm font-semibold tracking-wide uppercase">
                      <Icon className="size-4" />
                      {copy.eyebrow}
                    </div>
                    <h3 className="mt-3 text-2xl font-bold tracking-tight sm:text-3xl">{copy.title}</h3>
                    <p className="text-muted-foreground mt-4 text-base leading-relaxed">{copy.summary}</p>
                    <ul className="mt-6 space-y-3">
                      {copy.points.map((point) => (
                        <li key={point} className="flex gap-3 text-sm leading-relaxed">
                          <CheckCircle2 className="text-primary mt-0.5 size-4 shrink-0" />
                          <span>{point}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className={m.reverse ? 'lg:order-1' : ''}>
                    {m.image && m.alt ? (
                      <figure className="border-border bg-card hover:shadow-[0_30px_60px_-24px_rgba(15,47,36,0.45)] overflow-hidden rounded-xl border shadow-[0_18px_44px_-26px_rgba(26,26,26,0.3)] transition-all duration-500 hover:-translate-y-1">
                        <img src={m.image} alt={t.alts[m.alt]} width={1440} height={900} loading="lazy" className="block w-full" />
                      </figure>
                    ) : (
                      <div className="border-border bg-secondary/60 flex aspect-[4/3] items-center justify-center rounded-xl border border-dashed">
                        <Icon className="text-primary/60 size-14" />
                      </div>
                    )}
                  </div>
                </article>
              </Reveal>
            );
          })}
        </div>
      </section>

      <section id="workflow" className="bg-card border-border border-y">
        <div className="mx-auto max-w-7xl px-5 py-24 sm:px-8">
          <Reveal className="max-w-2xl">
            <p className="text-accent text-sm font-semibold tracking-wide uppercase">{t.workflowEyebrow}</p>
            <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">{t.workflowTitle}</h2>
          </Reveal>
          <ol className="bg-border mt-14 grid gap-px overflow-hidden rounded-xl md:grid-cols-4">
            {t.workflow.map((step, index) => {
              const Icon = WORKFLOW_ICONS[index];
              return (
                <li key={step.title} className="bg-card hover:bg-secondary/60 transition-colors duration-300">
                  <Reveal delay={index * 180} className="px-6 py-8">
                    <div className="flex items-center justify-between">
                      <Icon className="text-primary size-6" />
                      <span className="text-muted-foreground text-sm font-semibold">0{index + 1}</span>
                    </div>
                    <p className="mt-6 text-lg font-semibold">{step.title}</p>
                    <p className="text-muted-foreground mt-2 text-sm leading-relaxed">{step.body}</p>
                  </Reveal>
                </li>
              );
            })}
          </ol>
        </div>
      </section>

      <section id="contact" className="mx-auto max-w-7xl px-5 py-24 sm:px-8">
        <Reveal>
          <div className="grid gap-10 rounded-2xl bg-[#0F2F24] px-8 py-14 text-white sm:px-14 lg:grid-cols-[1.2fr_1fr] lg:items-center">
            <div>
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">{t.contact.title}</h2>
              <p className="mt-4 max-w-xl leading-relaxed text-white/75">{t.contact.body}</p>
            </div>
            <div className="space-y-3">
              <a href={whatsappHref} target="_blank" rel="noopener noreferrer" className="flex items-center justify-between rounded-lg bg-[#C5A028] px-5 py-4 font-semibold text-[#0F2F24] transition-all hover:-translate-y-0.5 hover:brightness-110">
                <span className="flex items-center gap-3">
                  <MessageCircle className="size-5" />
                  {t.contact.whatsapp}
                </span>
                <ArrowRight className={arrow} />
              </a>
              <a href={PHONE_URL} className="flex items-center justify-between rounded-lg border border-white/25 px-5 py-4 font-semibold transition-colors hover:bg-white/10">
                <span className="flex items-center gap-3">
                  <Phone className="size-5" />
                  {t.contact.call} {CONTACT_NUMBER}
                </span>
                <ArrowRight className={arrow} />
              </a>
            </div>
          </div>
        </Reveal>
      </section>

      <div className="fixed inset-x-0 bottom-0 z-40 flex gap-2 border-t border-white/10 bg-[#0F2F24]/95 p-3 backdrop-blur md:hidden">
        <a href={whatsappHref} target="_blank" rel="noopener noreferrer" className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-[#C5A028] px-4 py-3 text-sm font-semibold text-[#0F2F24]">
          <MessageCircle className="size-4" />
          {t.hero.whatsapp}
        </a>
        <Link href="/login" className="flex items-center justify-center gap-2 rounded-lg border border-white/25 px-4 py-3 text-sm font-semibold text-white">
          <LogIn className="size-4" />
          {t.nav.signIn}
        </Link>
      </div>

      <footer className="bg-[#0F2F24] text-white/70">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-5 py-8 text-sm sm:flex-row sm:items-center sm:justify-between sm:px-8">
          <p>© {new Date().getFullYear()} ManasikPro. {t.footer.rights}</p>
          <div className="flex items-center gap-6">
            <a href="#modules" className="hover:text-[#C5A028]">{t.footer.features}</a>
            <a href="#contact" className="hover:text-[#C5A028]">{t.footer.contact}</a>
            <Link href="/login" className="hover:text-[#C5A028]">{t.footer.signIn}</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
