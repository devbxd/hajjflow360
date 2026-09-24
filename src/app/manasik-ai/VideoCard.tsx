'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { AlertTriangle, Check, Clapperboard, Download, Film, Image as ImageIcon, ImagePlus, Loader2, Mic, Music, Plus, RefreshCw, SlidersHorizontal, X } from 'lucide-react';
import { FORMATS, LANGUAGES, type CaptionWord, type FootageClip, type VideoFormat, type VideoRequest } from '@/lib/manasikAi/options';
import { pickMimeType, renderVideo } from './renderVideo';

type StepKey = 'voice' | 'footage' | 'render';
type StepState = 'pending' | 'active' | 'done';

interface VideoResult {
  url: string;
  extension: 'mp4' | 'webm';
  sizeMb: string;
  credits: string[];
}

const inputClass =
  'w-full text-sm border border-border rounded-lg px-3 py-2 bg-input text-foreground focus:outline-none focus:ring-2 focus:ring-ring';

async function postJson<T>(url: string, body: unknown, signal: AbortSignal): Promise<T> {
  const res = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body), signal });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error ?? `Request failed (${res.status})`);
  return data as T;
}

function base64ToArrayBuffer(base64: string) {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes.buffer;
}

function fileName(title: string, extension: string) {
  const slug = title
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[^\p{L}\p{N}]+/gu, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 50);
  return `${slug || 'manasik-video'}.${extension}`;
}

const STEPS: [StepKey, string, React.ElementType][] = [
  ['voice', 'Voice-over', Mic],
  ['footage', 'Footage', Film],
  ['render', 'Editing', Clapperboard],
];

const MAX_PHOTOS = 20;

export default function VideoCard({
  request,
  photos: initialPhotos,
  brandDefault,
  autoStart,
  pexelsReady,
  lockedByOther,
  onBusyChange,
}: {
  request: VideoRequest;
  /** The user's own photos, used instead of stock footage. */
  photos?: File[];
  brandDefault: string;
  autoStart: boolean;
  pexelsReady: boolean;
  lockedByOther: boolean;
  onBusyChange: (busy: boolean) => void;
}) {
  const [title, setTitle] = useState(request.title);
  const [script, setScript] = useState(request.script);
  const [keywords, setKeywords] = useState(request.keywords);
  const [keywordDraft, setKeywordDraft] = useState('');
  const [languageCode, setLanguageCode] = useState(request.language);
  const [voice, setVoice] = useState(request.voice);
  const [format, setFormat] = useState<VideoFormat>(request.format);
  const [brand, setBrand] = useState(brandDefault);
  const [captions, setCaptions] = useState(true);
  const [music, setMusic] = useState<File | null>(null);
  const [musicVolume, setMusicVolume] = useState(0.15);
  const [photos, setPhotos] = useState<File[]>(initialPhotos ?? []);
  const [showOptions, setShowOptions] = useState(false);
  const thumbs = useMemo(() => photos.map((f) => URL.createObjectURL(f)), [photos]);
  useEffect(() => () => thumbs.forEach((u) => URL.revokeObjectURL(u)), [thumbs]);
  const hasPhotos = photos.length > 0;

  const [working, setWorking] = useState(false);
  const [steps, setSteps] = useState<Record<StepKey, StepState>>({ voice: 'pending', footage: 'pending', render: 'pending' });
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<VideoResult | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const optionsRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (showOptions) optionsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }, [showOptions]);

  const language = LANGUAGES.find((l) => l.code === languageCode)!;
  const formatInfo = FORMATS.find((f) => f.id === format)!;
  const supported = typeof window === 'undefined' || pickMimeType() !== null;
  const canCreate = (pexelsReady || hasPhotos) && supported && !working && !lockedByOther && script.trim() !== '' && (hasPhotos || keywords.length > 0);

  const create = async () => {
    if (!canCreate) return;
    const controller = new AbortController();
    abortRef.current = controller;
    setWorking(true);
    onBusyChange(true);
    setShowOptions(false);
    setError(null);
    setResult((prev) => {
      if (prev) URL.revokeObjectURL(prev.url);
      return null;
    });
    setProgress(0);
    setSteps({ voice: 'active', footage: 'pending', render: 'pending' });

    try {
      const voiceData = await postJson<{ audio: string; words: CaptionWord[] }>('/api/manasik-ai/voice', { text: script, voice }, controller.signal);
      setSteps({ voice: 'done', footage: 'active', render: 'pending' });

      const words = script.trim().split(/\s+/).length;
      const clipCount = Math.min(12, Math.max(3, Math.ceil(words / 2.4 / 4) + 1));
      // With the user's photos there is nothing to fetch: they are edited straight from this browser.
      const footage = hasPhotos
        ? { clips: [] as FootageClip[] }
        : await postJson<{ clips: FootageClip[] }>('/api/manasik-ai/footage', { keywords, orientation: format, count: clipCount }, controller.signal);

      const rendered = await renderVideo({
        canvas: canvasRef.current!,
        width: formatInfo.width,
        height: formatInfo.height,
        voice: base64ToArrayBuffer(voiceData.audio),
        words: voiceData.words,
        clipUrls: footage.clips.map((c) => c.url),
        photos,
        captions,
        rtl: language.rtl,
        brand: brand.trim(),
        music,
        musicVolume,
        signal: controller.signal,
        onProgress: (stage, p) => {
          if (stage === 'render') setSteps({ voice: 'done', footage: 'done', render: 'active' });
          setProgress(p);
        },
      });

      setSteps({ voice: 'done', footage: 'done', render: 'done' });
      setResult({
        url: URL.createObjectURL(rendered.blob),
        extension: rendered.extension,
        sizeMb: (rendered.blob.size / 1024 / 1024).toFixed(1),
        credits: Array.from(new Set(footage.clips.map((c) => c.author))).slice(0, 6),
      });
    } catch (err) {
      setSteps({ voice: 'pending', footage: 'pending', render: 'pending' });
      if (!(err instanceof DOMException && err.name === 'AbortError')) {
        setError(err instanceof Error ? err.message : 'Something went wrong.');
      }
    } finally {
      abortRef.current = null;
      setWorking(false);
      onBusyChange(false);
    }
  };

  // Deferred so React StrictMode's mount → unmount → mount in development starts it only once.
  useEffect(() => {
    if (!autoStart) return;
    const timer = setTimeout(() => void create(), 0);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(
    () => () => {
      abortRef.current?.abort();
    },
    []
  );

  useEffect(
    () => () => {
      if (result) URL.revokeObjectURL(result.url);
    },
    [result]
  );

  const changeLanguage = (code: VideoRequest['language']) => {
    setLanguageCode(code);
    setVoice(LANGUAGES.find((l) => l.code === code)!.voices[0].id);
  };

  const addKeyword = () => {
    const k = keywordDraft.trim();
    if (k && !keywords.includes(k) && keywords.length < 10) setKeywords([...keywords, k]);
    setKeywordDraft('');
  };

  const overall = Math.round(
    (((steps.voice === 'done' ? 1 : 0) + (steps.footage === 'done' ? 1 : steps.footage === 'active' ? progress : 0) + (steps.render === 'active' ? progress : 0)) / 3) * 100
  );
  const portrait = format === 'portrait';

  return (
    <div className="card-base p-0 overflow-hidden w-full max-w-2xl">
      <div className="flex items-center gap-2 px-4 py-3 border-b border-border bg-secondary/60">
        <Clapperboard size={16} className="text-primary flex-shrink-0" />
        <p className="text-sm font-semibold text-foreground truncate" dir="auto">
          {title || 'Video'}
        </p>
        <span className="ml-auto flex-shrink-0 text-[11px] font-medium text-muted-foreground">
          {formatInfo.label} · {language.label.split(' — ').pop()}
        </span>
      </div>

      <div className={`p-4 gap-4 ${portrait ? 'grid sm:grid-cols-[220px_minmax(0,1fr)]' : 'flex flex-col'}`}>
        <div
          className="relative rounded-xl overflow-hidden bg-[#0B1F16] mx-auto w-full"
          style={{ aspectRatio: `${formatInfo.width} / ${formatInfo.height}`, maxWidth: portrait ? 220 : undefined }}
        >
          <canvas ref={canvasRef} className={`absolute inset-0 w-full h-full ${working ? '' : 'hidden'}`} />
          {result && !working && (
            <video
              src={result.url}
              controls
              playsInline
              // The video opens with a fade from black; show a real frame as the thumbnail instead.
              onLoadedData={(e) => {
                if (e.currentTarget.currentTime === 0) e.currentTarget.currentTime = 0.8;
              }}
              className="absolute inset-0 w-full h-full object-contain bg-black"
            />
          )}
          {!result && !working && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-center px-4">
              <Film size={22} className="text-accent" />
              <p className="text-xs text-white/70">{error ? 'Not created' : 'Ready to create'}</p>
            </div>
          )}
        </div>

        <div className="min-w-0 flex flex-col gap-3">
          {working && (
            <div className="space-y-2.5">
              {STEPS.map(([key, label, Icon]) => (
                <div key={key} className="flex items-center gap-2.5 text-sm">
                  <span
                    className={`w-6 h-6 rounded-full flex items-center justify-center ${
                      steps[key] === 'done' ? 'bg-primary text-primary-foreground' : steps[key] === 'active' ? 'bg-secondary text-primary' : 'bg-muted text-muted-foreground'
                    }`}
                  >
                    {steps[key] === 'done' ? <Check size={12} /> : steps[key] === 'active' ? <Loader2 size={12} className="animate-spin" /> : <Icon size={12} />}
                  </span>
                  <span className={steps[key] === 'pending' ? 'text-muted-foreground' : 'text-foreground'}>{key === 'footage' && hasPhotos ? 'Photos' : label}</span>
                </div>
              ))}
              <div className="progress-bar-track">
                <div className="progress-bar-fill" style={{ width: `${overall}%` }} />
              </div>
              <p className="text-xs text-muted-foreground">Editing happens live in this tab — keep it open and visible until it finishes.</p>
              <button type="button" onClick={() => abortRef.current?.abort()} className="btn-secondary text-xs w-fit">
                Cancel
              </button>
            </div>
          )}

          {!working && (
            <p className="text-sm text-muted-foreground leading-relaxed line-clamp-6 whitespace-pre-line" dir="auto">
              {script}
            </p>
          )}

          {error && !working && (
            <div className="rounded-lg bg-[var(--status-rejected-bg)] text-[var(--status-rejected)] text-xs px-3 py-2 flex gap-2">
              <AlertTriangle size={14} className="flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}
          {!pexelsReady && !hasPhotos && (
            <p className="text-xs text-amber-600">PEXELS_API_KEY is not configured on the server — add your own photos in &quot;Edit script &amp; options&quot; to create this video.</p>
          )}
          {hasPhotos && !working && (
            <p className="text-xs text-muted-foreground flex items-center gap-1.5">
              <ImageIcon size={13} /> Made with your {photos.length} photo{photos.length > 1 ? 's' : ''}.
            </p>
          )}
          {!supported && <p className="text-xs text-amber-600">This browser can&apos;t record video — open ManasikPro in Chrome or Edge on a computer.</p>}

          {!working && (
            <div className="flex flex-wrap gap-2 mt-auto">
              {result ? (
                <a href={result.url} download={fileName(title, result.extension)} className="btn-primary text-xs">
                  <Download size={14} />
                  Download {result.extension.toUpperCase()} · {result.sizeMb} MB
                </a>
              ) : (
                <button type="button" onClick={create} disabled={!canCreate} className="btn-primary text-xs disabled:opacity-50 disabled:cursor-not-allowed">
                  <Clapperboard size={14} />
                  {error ? 'Try again' : 'Create video'}
                </button>
              )}
              {result && (
                <button type="button" onClick={create} disabled={!canCreate} className="btn-secondary text-xs disabled:opacity-50">
                  <RefreshCw size={14} />
                  {hasPhotos ? 'Create again' : 'New footage'}
                </button>
              )}
              <button type="button" onClick={() => setShowOptions((v) => !v)} className="btn-secondary text-xs">
                <SlidersHorizontal size={14} />
                Edit script & options
              </button>
            </div>
          )}
          {result && !working && result.credits.length > 0 && (
            <p className="text-[11px] text-muted-foreground">Footage: {result.credits.join(', ')} via Pexels (free for commercial use).</p>
          )}
          {lockedByOther && !working && !result && <p className="text-[11px] text-muted-foreground">Another video is being edited — this one can start when it finishes.</p>}
        </div>
      </div>

      {showOptions && !working && (
        <div ref={optionsRef} className="border-t border-border p-4 space-y-4 bg-muted/30 slide-up">
          <label className="block">
            <span className="text-xs font-medium text-muted-foreground">Title (file name)</span>
            <input value={title} onChange={(e) => setTitle(e.target.value)} dir="auto" className={`${inputClass} mt-1`} />
          </label>
          <label className="block">
            <span className="text-xs font-medium text-muted-foreground">Voice-over text — the narrator reads exactly this</span>
            <textarea value={script} onChange={(e) => setScript(e.target.value)} rows={6} dir="auto" className={`${inputClass} mt-1 leading-relaxed`} />
          </label>

          <div>
            <span className="text-xs font-medium text-muted-foreground">
              Your photos {hasPhotos ? `(${photos.length}) — used instead of stock footage` : '— optional, replaces stock footage'}
            </span>
            <div className="flex flex-wrap gap-2 mt-2 mb-4">
              {photos.map((f, i) => (
                <div key={i} className="relative w-16 h-16 rounded-lg overflow-hidden border border-border bg-muted">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={thumbs[i]} alt="" className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => setPhotos(photos.filter((_, j) => j !== i))}
                    className="absolute top-0.5 right-0.5 w-5 h-5 rounded-full bg-black/70 text-white flex items-center justify-center"
                    aria-label="Remove photo"
                  >
                    <X size={11} />
                  </button>
                </div>
              ))}
              {photos.length < MAX_PHOTOS && (
                <label className="w-16 h-16 rounded-lg border-2 border-dashed border-border flex flex-col items-center justify-center gap-0.5 text-[10px] font-medium text-muted-foreground cursor-pointer hover:border-primary hover:text-primary">
                  <ImagePlus size={17} />
                  Add
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={(e) => {
                      const added = Array.from(e.target.files ?? []).filter((f) => f.type.startsWith('image/'));
                      setPhotos([...photos, ...added].slice(0, MAX_PHOTOS));
                      e.target.value = '';
                    }}
                  />
                </label>
              )}
            </div>
            <span className="text-xs font-medium text-muted-foreground">Footage keywords (English works best){hasPhotos ? ' — only used without photos' : ''}</span>
            <div className="flex flex-wrap gap-2 mt-2">
              {keywords.map((k) => (
                <span key={k} className="inline-flex items-center gap-1 pl-2.5 pr-1 py-1 rounded-full bg-secondary text-secondary-foreground text-xs font-medium">
                  {k}
                  <button type="button" onClick={() => setKeywords(keywords.filter((x) => x !== k))} className="p-0.5 rounded-full hover:bg-primary/10" aria-label={`Remove ${k}`}>
                    <X size={12} />
                  </button>
                </span>
              ))}
              <span className="inline-flex items-center gap-1">
                <input
                  value={keywordDraft}
                  onChange={(e) => setKeywordDraft(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addKeyword();
                    }
                  }}
                  disabled={keywords.length >= 10}
                  placeholder="add keyword"
                  className="w-32 text-xs border border-border rounded-full px-2.5 py-1 bg-input text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                />
                <button type="button" onClick={addKeyword} className="p-1 rounded-full hover:bg-muted text-muted-foreground" aria-label="Add keyword">
                  <Plus size={14} />
                </button>
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <label className="block">
              <span className="text-xs font-medium text-muted-foreground">Language</span>
              <select value={languageCode} onChange={(e) => changeLanguage(e.target.value as VideoRequest['language'])} className={`${inputClass} mt-1`}>
                {LANGUAGES.map((l) => (
                  <option key={l.code} value={l.code}>
                    {l.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="text-xs font-medium text-muted-foreground">Narrator voice</span>
              <select value={voice} onChange={(e) => setVoice(e.target.value)} className={`${inputClass} mt-1`}>
                {language.voices.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.label}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div>
            <span className="text-xs font-medium text-muted-foreground">Format</span>
            <div className="grid grid-cols-3 gap-2 mt-1">
              {FORMATS.map((f) => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setFormat(f.id)}
                  className={`rounded-lg border px-2 py-2 text-left transition-colors ${
                    format === f.id ? 'border-primary bg-secondary text-primary' : 'border-border bg-card hover:bg-muted text-foreground'
                  }`}
                >
                  <span className="block text-sm font-semibold">{f.label}</span>
                  <span className="block text-[11px] text-muted-foreground truncate">{f.hint}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-end">
            <label className="block">
              <span className="text-xs font-medium text-muted-foreground">Brand name on the video (empty = hidden)</span>
              <input value={brand} onChange={(e) => setBrand(e.target.value.slice(0, 40))} className={`${inputClass} mt-1`} />
            </label>
            <label className="flex items-center gap-2 text-sm text-foreground cursor-pointer pb-2">
              <input type="checkbox" checked={captions} onChange={(e) => setCaptions(e.target.checked)} className="rounded border-border text-primary focus:ring-ring" />
              Animated captions
            </label>
          </div>

          <div className="rounded-lg border border-dashed border-border p-3 flex flex-wrap items-center gap-3 bg-card">
            <Music size={16} className="text-muted-foreground" />
            <div className="flex-1 min-w-[160px]">
              <p className="text-sm text-foreground truncate">{music ? music.name : 'Background music (optional)'}</p>
              <p className="text-[11px] text-muted-foreground">MP3/WAV you have the rights to, e.g. a nasheed without instruments.</p>
            </div>
            {music && (
              <input
                type="range"
                min={0.05}
                max={0.5}
                step={0.05}
                value={musicVolume}
                onChange={(e) => setMusicVolume(Number(e.target.value))}
                className="w-24 accent-[var(--primary)]"
                aria-label="Music volume"
              />
            )}
            <label className="btn-secondary text-xs cursor-pointer">
              {music ? 'Change' : 'Choose file'}
              <input type="file" accept="audio/*" className="hidden" onChange={(e) => setMusic(e.target.files?.[0] ?? null)} />
            </label>
            {music && (
              <button type="button" onClick={() => setMusic(null)} className="p-1 rounded hover:bg-muted text-muted-foreground" aria-label="Remove music">
                <X size={14} />
              </button>
            )}
          </div>

          <button type="button" onClick={create} disabled={!canCreate} className="btn-primary text-sm disabled:opacity-50 disabled:cursor-not-allowed">
            <Clapperboard size={16} />
            {result ? 'Create again with these settings' : 'Create video'}
          </button>
        </div>
      )}
    </div>
  );
}
