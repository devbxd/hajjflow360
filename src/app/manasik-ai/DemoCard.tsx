'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AlertTriangle, Download, Loader2, Monitor, Plus, RefreshCw, SlidersHorizontal, Trash2, Video } from 'lucide-react';
import { DEMO_PAGES, LANGUAGES, type DemoRequest } from '@/lib/manasikAi/options';
import { pickMimeType } from './renderVideo';
import { recordDemo, updateDemo, useDemo, useRecordingId } from './demoRecorder';

const inputClass =
  'w-full text-sm border border-border rounded-lg px-3 py-2 bg-input text-foreground focus:outline-none focus:ring-2 focus:ring-ring';

function fileName(title: string, extension: string) {
  const slug = title.toLowerCase().normalize('NFKD').replace(/[^\p{L}\p{N}]+/gu, '-').replace(/^-+|-+$/g, '').slice(0, 50);
  return `${slug || 'manasik-demo'}.${extension}`;
}

export default function DemoCard({ id }: { id: string }) {
  const d = useDemo(id);
  const recordingId = useRecordingId();
  const router = useRouter();
  const [showOptions, setShowOptions] = useState(false);
  const [supported, setSupported] = useState(true);

  useEffect(() => setSupported(Boolean(navigator.mediaDevices?.getDisplayMedia) && pickMimeType() !== null), []);

  if (!d) return null;
  const language = LANGUAGES.find((l) => l.code === d.language) ?? LANGUAGES[0];
  const busy = d.phase === 'preparing' || d.phase === 'recording';
  const lockedByOther = recordingId !== null && recordingId !== id;
  const canRecord = supported && !busy && !lockedByOther && d.scenes.some((s) => s.narration.trim());
  const setScenes = (scenes: DemoRequest['scenes']) => updateDemo(id, { scenes });

  return (
    <div className="card-base p-0 overflow-hidden w-full max-w-2xl">
      <div className="flex items-center gap-2 px-4 py-3 border-b border-border bg-secondary/60">
        <Monitor size={16} className="text-primary flex-shrink-0" />
        <p className="text-sm font-semibold text-foreground truncate" dir="auto">{d.title || 'Live demo'}</p>
        <span className="ml-auto flex-shrink-0 text-[11px] font-medium text-muted-foreground">
          Live demo · {d.scenes.length} scenes · {language.label.split(' — ').pop()}
        </span>
      </div>

      <div className="p-4 flex flex-col gap-4">
        {d.result ? (
          <div className="relative rounded-xl overflow-hidden bg-black" style={{ aspectRatio: `${d.result.width} / ${d.result.height}` }}>
            <video
              src={d.result.url}
              controls
              playsInline
              onLoadedData={(e) => {
                if (e.currentTarget.currentTime === 0) e.currentTarget.currentTime = 1;
              }}
              className="absolute inset-0 w-full h-full object-contain"
            />
          </div>
        ) : (
          <ol className="space-y-2 max-h-80 overflow-y-auto scrollbar-thin">
            {d.scenes.map((s, i) => (
              <li key={i} className="flex gap-3 items-start rounded-lg border border-border bg-muted/40 px-3 py-2">
                <span className="w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-semibold flex items-center justify-center flex-shrink-0">{i + 1}</span>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-foreground">{DEMO_PAGES[s.page]?.label ?? s.page}</p>
                  <p className="text-xs text-muted-foreground leading-relaxed" dir="auto">{s.narration}</p>
                </div>
              </li>
            ))}
          </ol>
        )}

        {busy ? (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm text-foreground">
              <Loader2 size={14} className="animate-spin text-primary" />
              {d.phase === 'preparing' ? 'Preparing the narration…' : 'Recording the demo…'}
            </div>
            <div className="progress-bar-track">
              <div className="progress-bar-fill" style={{ width: `${Math.round(d.progress * 100)}%` }} />
            </div>
            <p className="text-xs text-muted-foreground">Don&apos;t touch the mouse or keyboard until it finishes. Press Esc to cancel.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {d.error && (
              <div className="rounded-lg bg-[var(--status-rejected-bg)] text-[var(--status-rejected)] text-xs px-3 py-2 flex gap-2">
                <AlertTriangle size={14} className="flex-shrink-0 mt-0.5" />
                <span>{d.error}</span>
              </div>
            )}
            {!d.result && (
              <p className="text-xs text-muted-foreground">
                When you press <strong>Record demo</strong>, Chrome asks what to share: choose <strong>this tab</strong>. The app then tours its pages by itself while
                the narrator explains them — don&apos;t touch anything until it&apos;s done.
              </p>
            )}
            {!supported && <p className="text-xs text-amber-600">This browser can&apos;t record the screen — use Chrome or Edge on a computer.</p>}
            <label className="flex items-center gap-2 text-sm text-foreground cursor-pointer w-fit">
              <input type="checkbox" checked={d.blur} onChange={(e) => updateDemo(id, { blur: e.target.checked })} className="rounded border-border text-primary focus:ring-ring" />
              Hide pilgrim data (blur names, numbers and tables)
            </label>
            <div className="flex flex-wrap gap-2">
              {d.result ? (
                <>
                  <a href={d.result.url} download={fileName(d.title || 'demo', d.result.extension)} className="btn-primary text-xs">
                    <Download size={14} />
                    Download {d.result.extension.toUpperCase()} · {d.result.sizeMb} MB
                  </a>
                  <button type="button" onClick={() => recordDemo(id, (path) => router.push(path))} disabled={!canRecord} className="btn-secondary text-xs disabled:opacity-50">
                    <RefreshCw size={14} />
                    Record again
                  </button>
                </>
              ) : (
                <button type="button" onClick={() => recordDemo(id, (path) => router.push(path))} disabled={!canRecord} className="btn-primary text-xs disabled:opacity-50 disabled:cursor-not-allowed">
                  <Video size={14} />
                  Record demo
                </button>
              )}
              <button type="button" onClick={() => setShowOptions((v) => !v)} className="btn-secondary text-xs">
                <SlidersHorizontal size={14} />
                Edit scenes &amp; voice
              </button>
            </div>
            {lockedByOther && <p className="text-[11px] text-muted-foreground">Another demo is being recorded — this one can start when it finishes.</p>}
          </div>
        )}
      </div>

      {showOptions && !busy && (
        <div className="border-t border-border p-4 space-y-3 bg-muted/30">
          <label className="block">
            <span className="text-xs font-medium text-muted-foreground">Title</span>
            <input value={d.title} onChange={(e) => updateDemo(id, { title: e.target.value })} dir="auto" className={`${inputClass} mt-1`} />
          </label>
          {d.scenes.map((s, i) => (
            <div key={i} className="rounded-lg border border-border bg-card p-2 space-y-2">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-semibold flex items-center justify-center flex-shrink-0">{i + 1}</span>
                <select
                  value={s.page}
                  onChange={(e) => setScenes(d.scenes.map((x, j) => (j === i ? { ...x, page: e.target.value } : x)))}
                  className={inputClass}
                >
                  {Object.entries(DEMO_PAGES).map(([key, p]) => (
                    <option key={key} value={key}>
                      {p.label}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={() => setScenes(d.scenes.filter((_, j) => j !== i))}
                  disabled={d.scenes.length <= 1}
                  className="p-2 rounded-lg hover:bg-muted text-muted-foreground disabled:opacity-40"
                  aria-label="Remove scene"
                >
                  <Trash2 size={14} />
                </button>
              </div>
              <textarea
                value={s.narration}
                onChange={(e) => setScenes(d.scenes.map((x, j) => (j === i ? { ...x, narration: e.target.value } : x)))}
                rows={2}
                dir="auto"
                className={inputClass}
              />
            </div>
          ))}
          {d.scenes.length < 10 && (
            <button type="button" onClick={() => setScenes([...d.scenes, { page: 'dashboard', narration: '' }])} className="btn-secondary text-xs">
              <Plus size={14} />
              Add scene
            </button>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <label className="block">
              <span className="text-xs font-medium text-muted-foreground">Language</span>
              <select
                value={d.language}
                onChange={(e) => {
                  const code = e.target.value as DemoRequest['language'];
                  updateDemo(id, { language: code, voice: LANGUAGES.find((l) => l.code === code)!.voices[0].id });
                }}
                className={`${inputClass} mt-1`}
              >
                {LANGUAGES.map((l) => (
                  <option key={l.code} value={l.code}>
                    {l.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="text-xs font-medium text-muted-foreground">Narrator voice</span>
              <select value={d.voice} onChange={(e) => updateDemo(id, { voice: e.target.value })} className={`${inputClass} mt-1`}>
                {language.voices.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.label}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <label className="block">
            <span className="text-xs font-medium text-muted-foreground">Brand name on the video (empty = hidden)</span>
            <input value={d.brand} onChange={(e) => updateDemo(id, { brand: e.target.value.slice(0, 40) })} className={`${inputClass} mt-1`} />
          </label>
        </div>
      )}
    </div>
  );
}
