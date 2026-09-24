'use client';

import { useSyncExternalStore } from 'react';
import { DEMO_PAGES, LANGUAGES, type CaptionWord, type DemoRequest } from '@/lib/manasikAi/options';
import { groupCaptions, pickMimeType, type Caption } from './renderVideo';

// Live demo: records ManasikPro touring its own pages. The browser records the current tab
// (getDisplayMedia — Chrome asks the user to share it), the app navigates to each scene's
// page, highlights it and scrolls through it while the narration plays, and captions,
// branding and title/end cards are drawn as a DOM overlay so they land in the recording.
//
// The tour navigates away from the chat, which unmounts it, so demo state lives in this
// module-level store rather than in React state.

export interface DemoResult {
  url: string;
  extension: 'mp4' | 'webm';
  sizeMb: string;
  width: number;
  height: number;
}

export interface DemoState extends DemoRequest {
  brand: string;
  blur: boolean;
  phase: 'idle' | 'preparing' | 'recording' | 'done';
  progress: number;
  error: string | null;
  result: DemoResult | null;
}

const demos = new Map<string, DemoState>();
const listeners = new Set<() => void>();
let recordingId: string | null = null;

function emit() {
  listeners.forEach((l) => l());
}
function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function registerDemo(req: DemoRequest, brand: string) {
  if (!demos.has(req.id)) demos.set(req.id, { ...req, brand, blur: true, phase: 'idle', progress: 0, error: null, result: null });
  emit();
}
export function updateDemo(id: string, patch: Partial<DemoState>) {
  const d = demos.get(id);
  if (!d) return;
  demos.set(id, { ...d, ...patch });
  emit();
}
export function getDemo(id: string) {
  return demos.get(id);
}
export function clearDemos() {
  demos.forEach((d) => d.result && URL.revokeObjectURL(d.result.url));
  demos.clear();
  emit();
}
export function useDemo(id: string) {
  return useSyncExternalStore(subscribe, () => demos.get(id), () => undefined);
}
export function useRecordingId() {
  return useSyncExternalStore(subscribe, () => recordingId, () => null);
}

const END_TEXT = { ar: 'شكراً لمشاهدتكم', en: 'Thanks for watching' };
const TAG_TEXT = { ar: 'عرض مباشر', en: 'Live demo' };

const STYLE_ID = 'manasik-demo-style';
const STYLES = `
.mdemo-layer{position:fixed;inset:0;z-index:100000;pointer-events:auto;cursor:none;font-family:var(--font-plus-jakarta-sans),'Segoe UI',Tahoma,sans-serif}
.mdemo-card{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:12px;text-align:center;padding:2rem;background:radial-gradient(circle at 50% 35%,#2E9C6C,#0E3B28 70%);color:#fff;opacity:0;transition:opacity .45s ease}
.mdemo-card.on{opacity:1}
.mdemo-card h1{font-size:clamp(28px,4vw,48px);font-weight:800;letter-spacing:-.02em;max-width:80%}
.mdemo-card p{font-size:clamp(14px,1.6vw,20px);color:#E8C95A;font-weight:600;letter-spacing:.04em;text-transform:uppercase}
.mdemo-logo{width:72px;height:72px;border-radius:20px;background:rgba(255,255,255,.1);border:1px solid rgba(255,255,255,.2);display:flex;align-items:center;justify-content:center;font-size:34px;color:#E8C95A}
.mdemo-brand{position:absolute;bottom:22px;right:22px;display:flex;align-items:center;gap:8px;background:rgba(27,107,74,.94);color:#fff;border-radius:99px;padding:8px 16px;font-size:14px;font-weight:700;box-shadow:0 6px 18px rgba(0,0,0,.25)}
.mdemo-brand i{width:9px;height:9px;border-radius:50%;background:#D9B84A}
.mdemo-brand small{font-size:11px;font-weight:600;color:#E8C95A;border-left:1px solid rgba(255,255,255,.3);padding-left:8px;text-transform:uppercase;letter-spacing:.05em}
.mdemo-cap{position:absolute;left:50%;bottom:6%;transform:translate(-50%,12px);max-width:min(900px,70vw);background:rgba(14,59,40,.92);color:#fff;border-radius:14px;padding:12px 22px;font-size:clamp(17px,1.7vw,24px);font-weight:700;line-height:1.45;text-align:center;box-shadow:0 10px 30px rgba(0,0,0,.3);opacity:0;transition:opacity .2s ease,transform .2s ease}
.mdemo-cap.on{opacity:1;transform:translate(-50%,0)}
.mdemo-cap span.now{color:#E8C95A}
.mdemo-on aside a.mdemo-spot{background:rgba(197,160,40,.18)!important;color:var(--primary)!important;box-shadow:inset 3px 0 0 #C5A028}
.mdemo-private main td,.mdemo-private main input,.mdemo-private main .text-2xl,.mdemo-private main .text-3xl,.mdemo-private main .font-mono{filter:blur(6px)}
`;

function abortError() {
  return new DOMException('Recording stopped.', 'AbortError');
}
function sleep(ms: number, signal: AbortSignal) {
  return new Promise<void>((resolve, reject) => {
    if (signal.aborted) return reject(abortError());
    const t = setTimeout(resolve, ms);
    signal.addEventListener('abort', () => { clearTimeout(t); reject(abortError()); }, { once: true });
  });
}
const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

function b64ToBuffer(b64: string) {
  const bin = atob(b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes.buffer;
}

async function postJson<T>(url: string, body: unknown, signal: AbortSignal): Promise<T> {
  const res = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body), signal });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error ?? `Request failed (${res.status})`);
  return data as T;
}

function createLayer(d: DemoState) {
  if (!document.getElementById(STYLE_ID)) {
    const style = document.createElement('style');
    style.id = STYLE_ID;
    style.textContent = STYLES;
    document.head.appendChild(style);
  }
  const rtl = !!LANGUAGES.find((l) => l.code === d.language)?.rtl;
  const root = document.createElement('div');
  root.className = 'mdemo-layer';
  root.innerHTML = `
    <div class="mdemo-card"></div>
    ${d.brand ? `<div class="mdemo-brand"><i></i>${esc(d.brand)}<small>${esc(TAG_TEXT[d.language])}</small></div>` : ''}
    <div class="mdemo-cap" dir="${rtl ? 'rtl' : 'ltr'}"></div>`;
  document.body.appendChild(root);
  const card = root.querySelector('.mdemo-card') as HTMLElement;
  const cap = root.querySelector('.mdemo-cap') as HTMLElement;
  let capKey: number | null = null;
  return {
    async card(title: string, sub: string, ms: number, signal: AbortSignal) {
      card.innerHTML = `<div class="mdemo-logo">✦</div><h1 dir="auto">${esc(title)}</h1>${sub ? `<p>${esc(sub)}</p>` : ''}`;
      card.classList.add('on');
      await sleep(ms, signal);
      card.classList.remove('on');
      await sleep(450, signal);
    },
    caption(group: Caption | null, t: number) {
      if (!group) {
        if (capKey !== null) { cap.classList.remove('on'); capKey = null; }
        return;
      }
      if (capKey !== group.start) {
        capKey = group.start;
        cap.innerHTML = group.words.map((w) => `<span>${esc(w.text)}</span>`).join(' ');
        cap.classList.add('on');
      }
      group.words.forEach((w, i) => cap.children[i]?.classList.toggle('now', t >= w.start && t < w.end + 0.05));
    },
    spot(path: string) {
      document.querySelectorAll('.mdemo-spot').forEach((n) => n.classList.remove('mdemo-spot'));
      const link = document.querySelector(`aside a[href="${path}"]`);
      if (link) { link.classList.add('mdemo-spot'); link.scrollIntoView({ block: 'nearest' }); }
    },
    remove() {
      document.querySelectorAll('.mdemo-spot').forEach((n) => n.classList.remove('mdemo-spot'));
      root.remove();
    },
  };
}

type Navigate = (path: string) => void;

async function goTo(path: string, navigate: Navigate, signal: AbortSignal) {
  if (window.location.pathname !== path) navigate(path);
  const start = Date.now();
  while (window.location.pathname !== path && Date.now() - start < 8000) await sleep(100, signal);
  // Give the server-rendered page time to stream in and settle.
  await sleep(1200, signal);
  while (document.querySelector('main .animate-pulse') && Date.now() - start < 8000) await sleep(150, signal);
  document.querySelector('main')?.scrollTo(0, 0);
  await sleep(300, signal);
}

// Must be called straight from a click: Chrome only allows screen capture right after a user gesture.
export async function recordDemo(id: string, navigate: Navigate) {
  const d = demos.get(id);
  if (!d || recordingId || d.phase === 'preparing' || d.phase === 'recording') return;
  const scenes = d.scenes.filter((s) => DEMO_PAGES[s.page] && s.narration.trim());
  if (!scenes.length) return updateDemo(id, { error: 'Add at least one scene with narration.' });
  if (!navigator.mediaDevices?.getDisplayMedia) return updateDemo(id, { error: "This browser can't record the screen — use Chrome or Edge on a computer." });

  let stream: MediaStream;
  try {
    stream = await navigator.mediaDevices.getDisplayMedia({
      video: { frameRate: 30, displaySurface: 'browser' },
      audio: false,
      preferCurrentTab: true,
      selfBrowserSurface: 'include',
      surfaceSwitching: 'exclude',
      monitorTypeSurfaces: 'exclude',
    } as DisplayMediaStreamOptions);
  } catch {
    return updateDemo(id, { error: 'Recording was not started. Press "Record demo" again and choose this tab.' });
  }

  const track = stream.getVideoTracks()[0];
  const controller = new AbortController();
  const signal = controller.signal;
  const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') controller.abort(); };
  track.addEventListener('ended', () => controller.abort()); // "Stop sharing" was clicked
  document.addEventListener('keydown', onKey);
  if (d.result) URL.revokeObjectURL(d.result.url);
  recordingId = id;
  updateDemo(id, { phase: 'preparing', progress: 0, error: null, result: null });

  let audioCtx: AudioContext | null = null;
  let layer: ReturnType<typeof createLayer> | null = null;
  let recorder: MediaRecorder | null = null;
  try {
    // 1. Narration for every scene, before recording, so nothing waits on the network on camera.
    const voices: { audio: string; words: CaptionWord[] }[] = [];
    for (let i = 0; i < scenes.length; i++) {
      voices.push(await postJson('/api/manasik-ai/voice', { text: scenes[i].narration, voice: d.voice }, signal));
      updateDemo(id, { progress: (i + 1) / scenes.length });
    }
    audioCtx = new AudioContext();
    const ctx = audioCtx;
    const buffers = await Promise.all(voices.map((v) => ctx.decodeAudioData(b64ToBuffer(v.audio))));
    const dest = ctx.createMediaStreamDestination();

    // 2. Recorder: the tab's picture + the narration.
    const mimeType = pickMimeType();
    if (!mimeType) throw new Error("This browser can't record video. Please use Chrome or Edge.");
    recorder = new MediaRecorder(new MediaStream([track, ...dest.stream.getAudioTracks()]), { mimeType, videoBitsPerSecond: 8_000_000, audioBitsPerSecond: 128_000 });
    const chunks: Blob[] = [];
    recorder.ondataavailable = (e) => { if (e.data.size) chunks.push(e.data); };
    const stopped = new Promise<void>((resolve) => { if (recorder) recorder.onstop = () => resolve(); });

    layer = createLayer(d);
    document.body.classList.add('mdemo-on');
    document.body.classList.toggle('mdemo-private', d.blur);
    await ctx.resume();
    updateDemo(id, { phase: 'recording' });

    // Open the first page behind the title card so the tour starts on real content.
    await goTo(DEMO_PAGES[scenes[0].page].path, navigate, signal);
    recorder.start(1000);
    await layer.card(d.title || d.brand || 'Demo', d.brand, 2300, signal);

    for (let i = 0; i < scenes.length; i++) {
      const path = DEMO_PAGES[scenes[i].page].path;
      if (i > 0) await goTo(path, navigate, signal);
      layer.spot(path);
      const buf = buffers[i];
      const groups = groupCaptions(voices[i].words ?? [], 9, 64);
      const src = ctx.createBufferSource();
      src.buffer = buf;
      src.connect(dest);
      const t0 = ctx.currentTime + 0.15;
      src.start(t0);
      const scroller = document.querySelector('main');
      const maxScroll = scroller ? Math.max(0, scroller.scrollHeight - scroller.clientHeight) : 0;
      const current = layer;
      await new Promise<void>((resolve, reject) => {
        const frame = () => {
          if (signal.aborted) { src.stop(); reject(abortError()); return; }
          const t = ctx.currentTime - t0;
          if (t >= buf.duration + 0.5) { current.caption(null, t); resolve(); return; }
          current.caption(groups.find((g) => t >= g.start && t < g.end) ?? null, t);
          if (scroller && maxScroll > 40) {
            // Hold the top of the page for a quarter of the scene, then glide down.
            const p = Math.min(1, Math.max(0, (t - buf.duration * 0.25) / (buf.duration * 0.65)));
            const eased = p < 0.5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2;
            scroller.scrollTo(0, Math.round(maxScroll * 0.85 * eased));
          }
          requestAnimationFrame(frame);
        };
        requestAnimationFrame(frame);
      });
    }

    document.querySelector('main')?.scrollTo(0, 0);
    await layer.card(END_TEXT[d.language], d.brand, 2000, signal);
    recorder.stop();
    await stopped;
    const type = mimeType.split(';')[0];
    const blob = new Blob(chunks, { type });
    const settings = track.getSettings();
    updateDemo(id, {
      phase: 'done',
      result: {
        url: URL.createObjectURL(blob),
        extension: type === 'video/mp4' ? 'mp4' : 'webm',
        sizeMb: (blob.size / 1024 / 1024).toFixed(1),
        width: settings.width ?? window.innerWidth,
        height: settings.height ?? window.innerHeight,
      },
    });
  } catch (e) {
    updateDemo(id, {
      phase: 'idle',
      error: e instanceof DOMException && e.name === 'AbortError' ? 'Recording stopped before the end.' : e instanceof Error ? e.message : 'Something went wrong.',
    });
  } finally {
    if (recorder && recorder.state !== 'inactive') recorder.stop();
    stream.getTracks().forEach((t) => t.stop());
    document.removeEventListener('keydown', onKey);
    layer?.remove();
    document.body.classList.remove('mdemo-on', 'mdemo-private');
    audioCtx?.close().catch(() => {});
    recordingId = null;
    emit();
    navigate('/manasik-ai');
  }
}
