import { NextRequest, NextResponse } from 'next/server';
import { MANASIK_AI_ENABLED, MANASIK_AI_LOCKED } from '@/lib/manasikAi/feature';
import { MsEdgeTTS, OUTPUT_FORMAT } from 'msedge-tts';
import { ALL_VOICE_IDS, type CaptionWord } from '@/lib/manasikAi/options';

export const runtime = 'nodejs';
export const maxDuration = 60;

const MAX_CHARS = 3000;
// Edge TTS reports offsets and durations in 100-nanosecond ticks.
const TICKS_PER_SECOND = 10_000_000;

function escapeXml(text: string) {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function synthesize(text: string, voice: string, rate: string) {
  return new Promise<{ audio: Buffer; words: CaptionWord[] }>(async (resolve, reject) => {
    const tts = new MsEdgeTTS();
    const timer = setTimeout(() => {
      tts.close();
      reject(new Error('The voice service timed out.'));
    }, 50_000);
    try {
      await tts.setMetadata(voice, OUTPUT_FORMAT.AUDIO_24KHZ_48KBITRATE_MONO_MP3, { wordBoundaryEnabled: true });
      const { audioStream, metadataStream } = tts.toStream(escapeXml(text), { rate });
      const chunks: Buffer[] = [];
      const words: CaptionWord[] = [];

      metadataStream?.on('data', (raw: Buffer) => {
        try {
          for (const item of JSON.parse(raw.toString()).Metadata ?? []) {
            if (item.Type !== 'WordBoundary') continue;
            const start = item.Data.Offset / TICKS_PER_SECOND;
            words.push({ text: item.Data.text.Text, start, end: start + item.Data.Duration / TICKS_PER_SECOND });
          }
        } catch {
          // A malformed metadata frame only costs us one caption word.
        }
      });
      audioStream.on('data', (chunk: Buffer) => chunks.push(chunk));
      audioStream.on('error', (err: Error) => {
        clearTimeout(timer);
        tts.close();
        reject(err);
      });
      audioStream.on('end', () => {
        clearTimeout(timer);
        tts.close();
        resolve({ audio: Buffer.concat(chunks), words: words.sort((a, b) => a.start - b.start) });
      });
    } catch (err) {
      clearTimeout(timer);
      tts.close();
      reject(err);
    }
  });
}

export async function POST(req: NextRequest) {
  if (!MANASIK_AI_ENABLED) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  if (MANASIK_AI_LOCKED) return NextResponse.json({ error: 'Manasik IA is not set up yet.' }, { status: 503 });
  const body = await req.json().catch(() => null);
  const text = typeof body?.text === 'string' ? body.text.trim() : '';
  const voice = typeof body?.voice === 'string' ? body.voice : '';
  const speed = Number(body?.speed);
  const percent = Number.isFinite(speed) && speed >= 0.7 && speed <= 1.3 ? Math.round((speed - 1) * 100) : 0;
  const rate = `${percent >= 0 ? '+' : ''}${percent}%`;

  if (!text) return NextResponse.json({ error: 'The script is empty.' }, { status: 400 });
  if (text.length > MAX_CHARS) {
    return NextResponse.json({ error: `The script is too long (max ${MAX_CHARS} characters).` }, { status: 400 });
  }
  if (!ALL_VOICE_IDS.has(voice)) return NextResponse.json({ error: 'Unknown voice.' }, { status: 400 });

  try {
    const { audio, words } = await synthesize(text, voice, rate);
    if (audio.length === 0) throw new Error('The voice service returned no audio.');
    return NextResponse.json({ audio: audio.toString('base64'), mimeType: 'audio/mpeg', words });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Voice generation failed.';
    return NextResponse.json({ error: `Voice generation failed: ${message}` }, { status: 502 });
  }
}
