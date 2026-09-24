import { randomUUID } from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
import { MANASIK_AI_ENABLED, MANASIK_AI_LOCKED } from '@/lib/manasikAi/feature';
import { getCurrentUser } from '@/lib/auth/currentUser';
import { converse } from '@/lib/manasikAi/converse';
import { TOOL_DECLARATIONS, runTool } from '@/lib/manasikAi/assistantTools';
import { defaultVoice, type VideoRequest } from '@/lib/manasikAi/options';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

const MAX_HISTORY = 20;

// Handled here rather than in assistantTools: it doesn't read data, it hands a
// finished script to the browser, which produces the video in the chat.
const CREATE_VIDEO_DECLARATION = {
  name: 'create_video',
  description:
    'Produce a short social-media video (voice-over, stock footage, animated captions) from a script you write. Call this whenever the user asks for a video, reel, TikTok, short or promo. The video is then generated in the chat.',
  parameters: {
    type: 'OBJECT',
    properties: {
      title: { type: 'STRING', description: 'Short catchy title, in the video language.' },
      script: {
        type: 'STRING',
        description:
          'The exact voice-over text the narrator reads, in the video language. About 70 words for ~30 s (default), 140 for ~60 s, 210 for ~90 s. Strong hook first, useful content, short call to action to contact the agency. Plain spoken sentences only: no emojis, hashtags, headings, lists, stage directions or speaker names.',
      },
      language: { type: 'STRING', enum: ['ar', 'fr', 'en'], description: 'Video language. Default to the language the user writes in.' },
      keywords: {
        type: 'ARRAY',
        items: { type: 'STRING' },
        description: '6 to 8 short ENGLISH stock-footage search terms, concrete and visual, following the script order (e.g. "mecca", "kaaba", "people praying", "desert sunset", "airplane window").',
      },
      format: { type: 'STRING', enum: ['portrait', 'landscape', 'square'], description: 'portrait (9:16, default) for TikTok/Reels/Shorts, landscape (16:9) for YouTube, square for Instagram feed.' },
      voice_gender: { type: 'STRING', enum: ['male', 'female'] },
    },
    required: ['title', 'script', 'language', 'keywords'],
  },
};

function systemPrompt() {
  const today = new Date().toISOString().slice(0, 10);
  return `You are "Manasik IA", the AI assistant built into ManasikPro, the Hajj & Umrah campaign management system used by the agency's staff. Today is ${today}.

You do two things:
1. Answer questions about the agency's pilgrims, groups, visas, passports, flights, hotels, buses, payments, invoices and expenses by calling the data tools. Never guess or invent numbers, names or statuses — if the tools do not have the information, say so. For counts, use the totals the tools return (e.g. totalMatches), not the length of a truncated list. Money is stored in Saudi Riyal (SAR); always state the currency.
2. Make short videos for social media with create_video. Write the script yourself: warm, respectful, trustworthy, factually accurate about Hajj and Umrah; never invent religious rulings, hadith, prices, dates or promises (only use real figures from the tools if the user wants the video based on the agency's data). Do not ask for confirmation first unless the request is really unclear — just make it, then in one or two sentences tell the user the video is being produced below and that they can edit the script or options in the video card.

Always reply in the language the user wrote in (Arabic, French or English). Be concise and practical: lead with the answer, then short bullet points or a small markdown table when listing pilgrims. You can also draft messages (e.g. WhatsApp reminders). You can only read data; if asked to change something, explain where in ManasikPro the staff member can do it.`;
}

interface ChatMessage {
  role: 'user' | 'assistant';
  text: string;
}

function toVideoRequest(args: Record<string, unknown>): VideoRequest | null {
  const script = typeof args.script === 'string' ? args.script.trim() : '';
  if (!script) return null;
  const language = args.language === 'fr' || args.language === 'en' ? args.language : 'ar';
  const format = args.format === 'landscape' || args.format === 'square' ? args.format : 'portrait';
  const keywords = Array.isArray(args.keywords)
    ? args.keywords.filter((k): k is string => typeof k === 'string' && k.trim() !== '').map((k) => k.trim()).slice(0, 10)
    : [];
  return {
    id: randomUUID(),
    title: typeof args.title === 'string' ? args.title.trim().slice(0, 120) : '',
    script: script.slice(0, 3000),
    keywords: keywords.length ? keywords : ['mecca', 'kaaba', 'pilgrims'],
    language,
    format,
    voice: defaultVoice(language, args.voice_gender === 'female' ? 'female' : 'male'),
  };
}

export async function POST(req: NextRequest) {
  if (!MANASIK_AI_ENABLED) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  if (MANASIK_AI_LOCKED) return NextResponse.json({ error: 'Manasik IA needs to be set up with an AI API.' }, { status: 503 });
  const session = await getCurrentUser();
  if (!session) return NextResponse.json({ error: 'Please sign in again.' }, { status: 401 });

  const body = await req.json().catch(() => null);
  const history: ChatMessage[] = Array.isArray(body?.messages)
    ? body.messages
        .filter((m: ChatMessage) => (m?.role === 'user' || m?.role === 'assistant') && typeof m.text === 'string' && m.text.trim())
        .slice(-MAX_HISTORY)
    : [];
  if (!history.length || history[history.length - 1].role !== 'user') {
    return NextResponse.json({ error: 'Ask a question first.' }, { status: 400 });
  }

  const videos: VideoRequest[] = [];
  const execute = async (name: string, args: Record<string, unknown>) => {
    if (name === 'create_video') {
      const video = toVideoRequest(args);
      if (video && videos.length < 3) videos.push(video);
      return video
        ? { status: 'The video card is now shown in the chat and production has started in the browser.' }
        : { error: 'The script was empty — write the full voice-over text in "script".' };
    }
    try {
      return await runTool(name, args, session.companyId);
    } catch (err) {
      return { error: err instanceof Error ? err.message : 'Tool failed.' };
    }
  };

  const result = await converse(
    {
      system: systemPrompt(),
      history: history.map((m) => ({ role: m.role, text: m.text.slice(0, 4000) })),
      declarations: [...TOOL_DECLARATIONS, CREATE_VIDEO_DECLARATION],
      execute,
    },
    // The fallback run starts over, so drop anything the abandoned run queued.
    () => (videos.length = 0)
  );
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: result.status });
  return NextResponse.json({ reply: result.reply || (videos.length ? '' : "Sorry, I couldn't find an answer to that."), videos });
}
