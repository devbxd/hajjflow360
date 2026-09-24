import type { CaptionWord } from '@/lib/manasikAi/options';

// Renders the final video in the browser: stock clips are drawn onto a canvas,
// captions and branding are painted on top, and the canvas plus the narration
// are recorded in real time with MediaRecorder. No server-side video processing,
// so it runs on free hosting.

export interface RenderInput {
  canvas: HTMLCanvasElement;
  width: number;
  height: number;
  voice: ArrayBuffer;
  words: CaptionWord[];
  clipUrls: string[];
  captions: boolean;
  rtl: boolean;
  brand: string;
  music: File | null;
  musicVolume: number;
  signal: AbortSignal;
  onProgress: (stage: 'footage' | 'render', progress: number) => void;
}

export interface RenderResult {
  blob: Blob;
  mimeType: string;
  extension: 'mp4' | 'webm';
}

const FPS = 30;
const TARGET_SEGMENT = 4; // seconds each clip stays on screen
const MAX_CLIPS = 12;
const LEAD_IN = 0.4;
const TAIL = 1.0;
const GOLD = '#D9B84A';
const GREEN = 'rgba(27, 107, 74, 0.92)';
const FONT = '"Plus Jakarta Sans", "Segoe UI", Tahoma, Arial, sans-serif';

const MIME_CANDIDATES = [
  'video/mp4;codecs=avc1.42E01F,mp4a.40.2',
  'video/mp4;codecs=avc1,mp4a.40.2',
  'video/mp4',
  'video/webm;codecs=vp9,opus',
  'video/webm;codecs=vp8,opus',
  'video/webm',
];

export function pickMimeType() {
  if (typeof MediaRecorder === 'undefined') return null;
  return MIME_CANDIDATES.find((m) => MediaRecorder.isTypeSupported(m)) ?? null;
}

function abortError() {
  return new DOMException('Video creation was cancelled.', 'AbortError');
}

async function loadClip(url: string, signal: AbortSignal) {
  const res = await fetch(url, { signal });
  if (!res.ok) throw new Error(`Clip download failed (${res.status})`);
  const objectUrl = URL.createObjectURL(await res.blob());
  const video = document.createElement('video');
  video.muted = true;
  video.playsInline = true;
  video.loop = true;
  video.preload = 'auto';
  video.src = objectUrl;
  await new Promise<void>((resolve, reject) => {
    video.onloadeddata = () => resolve();
    video.onerror = () => reject(new Error('Clip could not be decoded'));
  });
  return video;
}

async function loadClips(urls: string[], wanted: number, input: RenderInput) {
  const clips: HTMLVideoElement[] = [];
  let tried = 0;
  // Three at a time: fast enough, without saturating slow connections.
  while (clips.length < wanted && tried < urls.length) {
    const batch = urls.slice(tried, tried + 3);
    tried += batch.length;
    const results = await Promise.allSettled(batch.map((u) => loadClip(u, input.signal)));
    if (input.signal.aborted) throw abortError();
    for (const r of results) if (r.status === 'fulfilled' && clips.length < wanted) clips.push(r.value);
    input.onProgress('footage', Math.min(1, clips.length / wanted));
  }
  return clips;
}

export interface Caption {
  words: CaptionWord[];
  start: number;
  end: number;
}

export function groupCaptions(words: CaptionWord[], maxWords: number, maxChars: number): Caption[] {
  const groups: Caption[] = [];
  let current: CaptionWord[] = [];
  let chars = 0;
  for (const word of words) {
    const last = current[current.length - 1];
    const pause = last ? word.start - last.end > 0.35 : false;
    if (current.length && (current.length >= maxWords || chars + word.text.length > maxChars || pause)) {
      groups.push({ words: current, start: current[0].start, end: last.end });
      current = [];
      chars = 0;
    }
    current.push(word);
    chars += word.text.length + 1;
  }
  if (current.length) groups.push({ words: current, start: current[0].start, end: current[current.length - 1].end });
  // Hold each caption until the next one starts (capped) so text does not flicker between words.
  groups.forEach((g, i) => {
    const next = groups[i + 1];
    g.end = next ? Math.min(next.start, g.end + 0.6) : g.end + 0.6;
  });
  return groups;
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function drawCover(ctx: CanvasRenderingContext2D, video: HTMLVideoElement, w: number, h: number, zoom: number) {
  const vw = video.videoWidth;
  const vh = video.videoHeight;
  if (!vw || !vh) return;
  const scale = Math.max(w / vw, h / vh) * zoom;
  const dw = vw * scale;
  const dh = vh * scale;
  ctx.drawImage(video, (w - dw) / 2, (h - dh) / 2, dw, dh);
}

function drawCaption(
  ctx: CanvasRenderingContext2D,
  caption: Caption,
  t: number,
  w: number,
  h: number,
  rtl: boolean
) {
  const portrait = h > w;
  const fontSize = Math.round(Math.min(w, h) * (portrait ? 0.072 : 0.062));
  const maxWidth = w * 0.86;
  const lineHeight = fontSize * 1.28;
  ctx.font = `800 ${fontSize}px ${FONT}`;
  ctx.direction = rtl ? 'rtl' : 'ltr';
  const space = ctx.measureText(' ').width;

  // Word-wrap into lines using measured widths.
  const lines: { words: CaptionWord[]; width: number }[] = [];
  let line: CaptionWord[] = [];
  let lineWidth = 0;
  for (const word of caption.words) {
    const ww = ctx.measureText(word.text).width;
    const extra = line.length ? space + ww : ww;
    if (line.length && lineWidth + extra > maxWidth) {
      lines.push({ words: line, width: lineWidth });
      line = [word];
      lineWidth = ww;
    } else {
      line.push(word);
      lineWidth += extra;
    }
  }
  if (line.length) lines.push({ words: line, width: lineWidth });

  const age = t - caption.start;
  const pop = 1 - Math.pow(1 - Math.min(1, Math.max(0, age) / 0.16), 3);
  const scale = 0.86 + 0.14 * pop;
  const centerY = h * (portrait ? 0.7 : 0.8);

  ctx.save();
  ctx.translate(w / 2, centerY);
  ctx.scale(scale, scale);
  ctx.globalAlpha = Math.min(1, 0.3 + pop);
  ctx.textBaseline = 'middle';
  ctx.lineJoin = 'round';
  ctx.lineWidth = fontSize * 0.2;
  ctx.strokeStyle = 'rgba(0, 0, 0, 0.85)';
  ctx.shadowColor = 'rgba(0, 0, 0, 0.45)';
  ctx.shadowBlur = fontSize * 0.25;

  const firstY = -((lines.length - 1) * lineHeight) / 2;
  lines.forEach((l, li) => {
    const y = firstY + li * lineHeight;
    // LTR walks left→right from the left edge; RTL walks right→left from the right edge.
    let x = rtl ? l.width / 2 : -l.width / 2;
    ctx.textAlign = rtl ? 'right' : 'left';
    for (const word of l.words) {
      const ww = ctx.measureText(word.text).width;
      const active = t >= word.start && t < word.end + 0.05;
      ctx.strokeText(word.text, x, y);
      ctx.fillStyle = active ? GOLD : '#FFFFFF';
      ctx.fillText(word.text, x, y);
      x += rtl ? -(ww + space) : ww + space;
    }
  });
  ctx.restore();
}

function drawBrand(ctx: CanvasRenderingContext2D, brand: string, w: number, h: number) {
  const size = Math.round(Math.min(w, h) * 0.034);
  ctx.save();
  ctx.font = `700 ${size}px ${FONT}`;
  ctx.direction = 'ltr';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  const padX = size * 0.9;
  const dot = size * 0.32;
  const textWidth = ctx.measureText(brand).width;
  const boxW = padX * 2 + dot * 2 + size * 0.5 + textWidth;
  const boxH = size * 2.1;
  const x = Math.round(Math.min(w, h) * 0.05);
  const y = x;
  ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
  ctx.shadowBlur = size * 0.6;
  ctx.fillStyle = GREEN;
  roundRect(ctx, x, y, boxW, boxH, boxH / 2);
  ctx.fill();
  ctx.shadowBlur = 0;
  ctx.fillStyle = GOLD;
  ctx.beginPath();
  ctx.arc(x + padX + dot, y + boxH / 2, dot, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#FFFFFF';
  ctx.fillText(brand, x + padX + dot * 2 + size * 0.5, y + boxH / 2 + 1);
  ctx.restore();
}

export async function renderVideo(input: RenderInput): Promise<RenderResult> {
  const { canvas, width: W, height: H, signal } = input;
  const mimeType = pickMimeType();
  if (!mimeType) throw new Error('This browser cannot record video. Please use Google Chrome or Microsoft Edge.');

  const audioCtx = new AudioContext();
  const objectUrls: string[] = [];
  let clips: HTMLVideoElement[] = [];
  let rafId = 0;

  try {
    const voiceBuffer = await audioCtx.decodeAudioData(input.voice.slice(0));
    const total = LEAD_IN + voiceBuffer.duration + TAIL;
    const segments = Math.max(1, Math.round(total / TARGET_SEGMENT));
    const segLength = total / segments;

    clips = await loadClips(input.clipUrls, Math.min(segments, MAX_CLIPS), input);
    clips.forEach((c) => objectUrls.push(c.src));
    if (!clips.length) throw new Error('None of the footage clips could be downloaded. Check your connection and try again.');

    // Per segment: which clip, and where in that clip to start, so long clips show varied moments.
    const plan = Array.from({ length: segments }, (_, i) => {
      const video = clips[i % clips.length];
      const room = video.duration - segLength - 0.2;
      return { video, offset: Number.isFinite(room) && room > 0 ? Math.random() * room : 0 };
    });

    let musicBuffer: AudioBuffer | null = null;
    if (input.music) {
      try {
        musicBuffer = await audioCtx.decodeAudioData(await input.music.arrayBuffer());
      } catch {
        musicBuffer = null; // An unreadable music file should not block the video.
      }
    }
    if (signal.aborted) throw abortError();

    canvas.width = W;
    canvas.height = H;
    const ctx = canvas.getContext('2d')!;
    // Holds the latest good video frame, so a clip that is still seeking never leaves a black flash.
    const base = document.createElement('canvas');
    base.width = W;
    base.height = H;
    const baseCtx = base.getContext('2d')!;
    baseCtx.fillStyle = '#0B1F16';
    baseCtx.fillRect(0, 0, W, H);

    const captions = input.captions
      ? groupCaptions(input.words, H > W ? 4 : 6, H > W ? 24 : 40).map((c) => ({
          ...c,
          start: c.start + LEAD_IN,
          end: c.end + LEAD_IN,
          words: c.words.map((word) => ({ ...word, start: word.start + LEAD_IN, end: word.end + LEAD_IN })),
        }))
      : [];
    const shade = ctx.createLinearGradient(0, H * 0.4, 0, H);
    shade.addColorStop(0, 'rgba(0,0,0,0)');
    shade.addColorStop(1, 'rgba(0,0,0,0.6)');
    const topShade = ctx.createLinearGradient(0, 0, 0, H * 0.18);
    topShade.addColorStop(0, 'rgba(0,0,0,0.35)');
    topShade.addColorStop(1, 'rgba(0,0,0,0)');

    const dest = audioCtx.createMediaStreamDestination();
    const voiceSource = audioCtx.createBufferSource();
    voiceSource.buffer = voiceBuffer;
    voiceSource.connect(dest);
    let musicGain: GainNode | null = null;
    let musicSource: AudioBufferSourceNode | null = null;
    if (musicBuffer) {
      musicSource = audioCtx.createBufferSource();
      musicSource.buffer = musicBuffer;
      musicSource.loop = true;
      musicGain = audioCtx.createGain();
      musicSource.connect(musicGain).connect(dest);
    }

    const stream = new MediaStream([...canvas.captureStream(FPS).getVideoTracks(), ...dest.stream.getAudioTracks()]);
    const recorder = new MediaRecorder(stream, { mimeType, videoBitsPerSecond: 6_000_000, audioBitsPerSecond: 128_000 });
    const chunks: Blob[] = [];
    recorder.ondataavailable = (e) => e.data.size && chunks.push(e.data);
    const stopped = new Promise<void>((resolve) => (recorder.onstop = () => resolve()));

    await audioCtx.resume();
    const t0 = audioCtx.currentTime + 0.15;
    voiceSource.start(t0 + LEAD_IN);
    if (musicSource && musicGain) {
      const volume = Math.max(0, Math.min(1, input.musicVolume));
      musicGain.gain.setValueAtTime(volume, t0);
      musicGain.gain.setValueAtTime(volume, t0 + total - 1.2);
      musicGain.gain.linearRampToValueAtTime(0, t0 + total);
      musicSource.start(t0);
    }
    recorder.start(1000);

    plan[0].video.currentTime = plan[0].offset;
    let activeSegment = -1;

    await new Promise<void>((resolve, reject) => {
      const frame = () => {
        if (signal.aborted) {
          reject(abortError());
          return;
        }
        const t = Math.max(0, audioCtx.currentTime - t0);
        if (t >= total) {
          resolve();
          return;
        }

        const segIndex = Math.min(segments - 1, Math.floor(t / segLength));
        if (segIndex !== activeSegment) {
          const previous = activeSegment >= 0 ? plan[activeSegment].video : null;
          const current = plan[segIndex];
          if (previous && previous !== current.video) previous.pause();
          if (previous !== current.video) current.video.currentTime = current.offset;
          current.video.play().catch(() => {});
          // Seek the next clip now so it is ready the moment its segment starts.
          const next = plan[segIndex + 1];
          if (next && next.video !== current.video) next.video.currentTime = next.offset;
          activeSegment = segIndex;
        }

        const { video } = plan[segIndex];
        const segProgress = (t - segIndex * segLength) / segLength;
        const zoom = segIndex % 2 === 0 ? 1 + 0.07 * segProgress : 1.07 - 0.07 * segProgress;
        if (video.readyState >= 2 && !video.seeking) drawCover(baseCtx, video, W, H, zoom);

        ctx.globalAlpha = 1;
        ctx.drawImage(base, 0, 0);
        ctx.fillStyle = shade;
        ctx.fillRect(0, 0, W, H);
        if (input.brand) {
          ctx.fillStyle = topShade;
          ctx.fillRect(0, 0, W, H);
          drawBrand(ctx, input.brand, W, H);
        }
        const caption = captions.find((c) => t >= c.start && t < c.end);
        if (caption) drawCaption(ctx, caption, t, W, H, input.rtl);

        // Fade in from and out to black.
        const fade = Math.max(1 - t / 0.35, (t - (total - 0.6)) / 0.6, 0);
        if (fade > 0) {
          ctx.fillStyle = `rgba(0,0,0,${Math.min(1, fade)})`;
          ctx.fillRect(0, 0, W, H);
        }

        input.onProgress('render', t / total);
        rafId = requestAnimationFrame(frame);
      };
      rafId = requestAnimationFrame(frame);
    }).finally(() => {
      cancelAnimationFrame(rafId);
      if (recorder.state !== 'inactive') recorder.stop();
      clips.forEach((c) => c.pause());
    });

    await stopped;
    stream.getTracks().forEach((track) => track.stop());
    const type = mimeType.split(';')[0];
    return { blob: new Blob(chunks, { type }), mimeType: type, extension: type === 'video/mp4' ? 'mp4' : 'webm' };
  } finally {
    cancelAnimationFrame(rafId);
    clips.forEach((c) => {
      c.pause();
      c.removeAttribute('src');
      c.load();
    });
    objectUrls.forEach((u) => URL.revokeObjectURL(u));
    audioCtx.close().catch(() => {});
  }
}
