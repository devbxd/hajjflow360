// Shared between the Manasik IA page and its API routes, so the server only
// accepts the voices and formats the UI actually offers.

export interface VoiceOption {
  id: string;
  label: string;
}

export interface LanguageOption {
  code: 'ar' | 'fr' | 'en';
  label: string;
  promptName: string;
  rtl: boolean;
  voices: VoiceOption[];
}

export const LANGUAGES: LanguageOption[] = [
  {
    code: 'ar',
    label: 'العربية — Arabic',
    promptName: 'Modern Standard Arabic',
    rtl: true,
    voices: [
      { id: 'ar-SA-HamedNeural', label: 'Hamed — Saudi, male' },
      { id: 'ar-SA-ZariyahNeural', label: 'Zariyah — Saudi, female' },
      { id: 'ar-LB-RamiNeural', label: 'Rami — Lebanese, male' },
      { id: 'ar-LB-LaylaNeural', label: 'Layla — Lebanese, female' },
    ],
  },
  {
    code: 'fr',
    label: 'Français — French',
    promptName: 'French',
    rtl: false,
    voices: [
      { id: 'fr-FR-HenriNeural', label: 'Henri — male' },
      { id: 'fr-FR-DeniseNeural', label: 'Denise — female' },
    ],
  },
  {
    code: 'en',
    label: 'English',
    promptName: 'English',
    rtl: false,
    voices: [
      { id: 'en-US-GuyNeural', label: 'Guy — US, male' },
      { id: 'en-US-JennyNeural', label: 'Jenny — US, female' },
      { id: 'en-GB-RyanNeural', label: 'Ryan — UK, male' },
    ],
  },
];

// First voice of each language is male, second female.
export function defaultVoice(language: LanguageOption['code'], gender: 'male' | 'female' = 'male') {
  const voices = LANGUAGES.find((l) => l.code === language)!.voices;
  return voices[gender === 'female' ? 1 : 0].id;
}

export const ALL_VOICE_IDS = new Set(LANGUAGES.flatMap((l) => l.voices.map((v) => v.id)));

export type VideoFormat = 'portrait' | 'landscape' | 'square';

export const FORMATS: { id: VideoFormat; label: string; hint: string; width: number; height: number }[] = [
  { id: 'portrait', label: '9:16', hint: 'TikTok · Reels · Shorts', width: 720, height: 1280 },
  { id: 'landscape', label: '16:9', hint: 'YouTube · Facebook', width: 1280, height: 720 },
  { id: 'square', label: '1:1', hint: 'Instagram feed', width: 960, height: 960 },
];

export interface CaptionWord {
  text: string;
  start: number;
  end: number;
}

export interface FootageClip {
  url: string;
  width: number;
  height: number;
  duration: number;
  keyword: string;
  author: string;
}

// A video the assistant decided to make; produced in the browser by the chat's video card.
export interface VideoRequest {
  id: string;
  title: string;
  script: string;
  keywords: string[];
  language: LanguageOption['code'];
  format: VideoFormat;
  voice: string;
}

// Pages a live demo can visit, with what each one shows (the AI writes the narration from
// this). Settings and New Season are left out on purpose: they change account configuration.
export const DEMO_PAGES: Record<string, { path: string; label: string; what: string }> = {
  dashboard: { path: '/', label: 'Campaign Dashboard', what: 'campaign overview: pilgrim totals, visa, passport and payment progress, charts, at-risk pilgrims, operations alerts' },
  'pilgrim-management': { path: '/pilgrim-management', label: 'Pilgrim Management', what: 'every pilgrim with status, search and filters, add, import and bulk actions' },
  'pilgrim-registry': { path: '/pilgrim-registry', label: 'Pilgrim Registry', what: 'the full registry of pilgrims with their documents' },
  'group-leaders': { path: '/group-leader-dashboard', label: 'Group Leaders', what: 'each group leader with their pilgrims, progress and WhatsApp messages' },
  'passport-scanning': { path: '/passport-scanning', label: 'Passport Scanning', what: 'scan a passport with the camera; the MRZ is read automatically to fill the pilgrim record' },
  allocation: { path: '/allocation-management', label: 'Allocation Management', what: 'assign flights, hotel rooms and bus seats, with auto-assign' },
  payments: { path: '/payments', label: 'Payments', what: 'payment status per pilgrim, installments, overdue balances and payment history' },
  'qr-checkin': { path: '/qr-checkin', label: 'QR Check-in', what: 'check pilgrims in by scanning their QR code at the bus, hotel or airport' },
  'emergency-lists': { path: '/emergency-lists', label: 'Emergency Lists', what: 'emergency contacts and at-risk pilgrims, ready to print' },
  notifications: { path: '/notifications', label: 'Notifications', what: 'the activity feed of everything happening in the campaign' },
  invoicing: { path: '/invoicing-receipts', label: 'Invoicing & Receipts', what: 'invoices and receipts with PDF download, linked to payments' },
  'revenue-expenses': { path: '/revenue-expenses', label: 'Revenue & Expenses', what: 'income against expenses, with charts and net result' },
  reports: { path: '/reports-export', label: 'Reports & Export', what: 'reports and exports to Excel and PDF' },
};

// A live demo the assistant planned; recorded in the browser by the chat's demo card.
export interface DemoRequest {
  id: string;
  title: string;
  language: LanguageOption['code'];
  voice: string;
  scenes: { page: string; narration: string }[];
}
