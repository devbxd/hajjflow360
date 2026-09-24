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
