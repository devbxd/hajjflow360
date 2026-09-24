import { NextRequest, NextResponse } from 'next/server';
import { MANASIK_AI_ENABLED, MANASIK_AI_LOCKED } from '@/lib/manasikAi/feature';
import type { FootageClip } from '@/lib/manasikAi/options';

export const runtime = 'nodejs';
export const maxDuration = 30;

interface PexelsVideoFile {
  link: string;
  width: number | null;
  height: number | null;
  file_type: string;
}

interface PexelsVideo {
  id: number;
  duration: number;
  user?: { name?: string };
  video_files: PexelsVideoFile[];
}

// The renderer draws at ~720p, so the rendition whose short side is closest to 720
// looks sharp without making the browser download 4K files.
function pickFile(files: PexelsVideoFile[]) {
  const usable = files.filter(
    (f) => f.file_type === 'video/mp4' && f.width && f.height && Math.min(f.width, f.height) >= 480 && /^https:\/\/videos\.pexels\.com\//.test(f.link)
  );
  usable.sort((a, b) => Math.abs(Math.min(a.width!, a.height!) - 720) - Math.abs(Math.min(b.width!, b.height!) - 720));
  return usable[0];
}

export async function POST(req: NextRequest) {
  if (!MANASIK_AI_ENABLED) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  if (MANASIK_AI_LOCKED) return NextResponse.json({ error: 'Manasik AI needs to be set up with an AI API.' }, { status: 503 });
  const apiKey = process.env.PEXELS_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: 'PEXELS_API_KEY is not configured on the server.' }, { status: 503 });
  }

  const body = await req.json().catch(() => null);
  const keywords: string[] = Array.isArray(body?.keywords)
    ? body.keywords.filter((k: unknown): k is string => typeof k === 'string' && k.trim() !== '').map((k: string) => k.trim().slice(0, 60)).slice(0, 10)
    : [];
  const orientation = ['portrait', 'landscape', 'square'].includes(body?.orientation) ? body.orientation : 'portrait';
  const count = Math.min(Math.max(Number(body?.count) || 8, 1), 24);
  if (!keywords.length) return NextResponse.json({ error: 'Add at least one footage keyword.' }, { status: 400 });

  const perKeyword = await Promise.all(
    keywords.map(async (keyword) => {
      const url = `https://api.pexels.com/videos/search?${new URLSearchParams({ query: keyword, orientation, per_page: '8' })}`;
      const res = await fetch(url, { headers: { Authorization: apiKey } }).catch(() => null);
      if (!res) return { keyword, status: 0, videos: [] as PexelsVideo[] };
      if (!res.ok) return { keyword, status: res.status, videos: [] as PexelsVideo[] };
      const data = await res.json();
      return { keyword, status: 200, videos: (data.videos ?? []) as PexelsVideo[] };
    })
  );

  if (perKeyword.some((r) => r.status === 401 || r.status === 403)) {
    return NextResponse.json({ error: 'The Pexels API key was rejected. Check PEXELS_API_KEY.' }, { status: 502 });
  }
  if (perKeyword.every((r) => r.status === 429)) {
    return NextResponse.json({ error: 'Pexels rate limit reached. Try again in a little while.' }, { status: 429 });
  }

  // Round-robin across keywords so the video follows the script order instead of
  // showing every clip for the first keyword back to back.
  const seen = new Set<number>();
  const clips: FootageClip[] = [];
  for (let round = 0; round < 8 && clips.length < count * 2; round++) {
    for (const { keyword, videos } of perKeyword) {
      const video = videos[round];
      if (!video || seen.has(video.id) || video.duration < 3) continue;
      const file = pickFile(video.video_files);
      if (!file) continue;
      seen.add(video.id);
      clips.push({
        url: file.link,
        width: file.width!,
        height: file.height!,
        duration: video.duration,
        keyword,
        author: video.user?.name ?? 'Pexels',
      });
    }
  }

  if (!clips.length) {
    return NextResponse.json({ error: 'No footage found for these keywords. Try simpler English keywords.' }, { status: 404 });
  }
  return NextResponse.json({ clips });
}
