'use client';

import React, { useEffect, useRef, useState } from 'react';
import { AlertTriangle, ArrowUp, Clapperboard, CreditCard, MessageSquare, ShieldAlert, Sparkles, SquarePen, Users } from 'lucide-react';
import type { DemoRequest, VideoRequest } from '@/lib/manasikAi/options';
import Markdown from './Markdown';
import VideoCard from './VideoCard';
import DemoCard from './DemoCard';
import { clearDemos, getDemo, registerDemo } from './demoRecorder';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  videos?: VideoRequest[];
  demoIds?: string[];
  error?: boolean;
}

// Kept outside React: a live demo navigates away from this page (unmounting the chat) and
// comes back, and the conversation should still be there.
let savedMessages: Message[] = [];
// Videos that already started once, so coming back to the chat doesn't auto-start them again.
const startedVideos = new Set<string>();

const SUGGESTIONS: { icon: React.ElementType; label: string; prompt: string }[] = [
  { icon: CreditCard, label: 'Unpaid balances', prompt: 'Which pilgrims still have an unpaid balance, and how much is outstanding in total?' },
  { icon: ShieldAlert, label: 'At-risk pilgrims', prompt: 'Who is at risk before departure and why?' },
  { icon: Users, label: 'Season overview', prompt: 'Give me a quick overview of the current season.' },
  { icon: MessageSquare, label: 'WhatsApp reminder', prompt: 'Draft a polite WhatsApp reminder in Arabic for pilgrims with overdue payments.' },
  { icon: Clapperboard, label: 'Umrah promo video', prompt: 'Make a 30-second vertical video in Arabic inviting people to book their Umrah with us.' },
  { icon: Clapperboard, label: 'Vidéo en français', prompt: 'Fais une vidéo de 30 secondes en français : 5 conseils pour bien préparer sa Omra.' },
];

let idCounter = 0;
const newId = () => `m${Date.now()}-${idCounter++}`;

// What the model sees of past turns: video cards are summarised so follow-ups like
// "make it shorter" or "now in French" have the script to work from.
function historyText(m: Message) {
  const notes = (m.videos ?? []).map((v) => `[Video created — title: "${v.title}", language: ${v.language}, format: ${v.format}. Script: ${v.script}]`);
  for (const id of m.demoIds ?? []) {
    const d = getDemo(id);
    if (d) notes.push(`[Live demo created — title: "${d.title}", language: ${d.language}. Scenes: ${d.scenes.map((s) => `${s.page}: ${s.narration}`).join(' | ')}]`);
  }
  return [m.text, ...notes].filter(Boolean).join('\n');
}

export default function ManasikChat({
  brandDefault,
  geminiReady: keyConfigured,
  pexelsReady,
  locked,
}: {
  brandDefault: string;
  geminiReady: boolean;
  pexelsReady: boolean;
  locked: boolean;
}) {
  const geminiReady = keyConfigured && !locked;
  const [messages, setMessages] = useState<Message[]>(() => savedMessages);
  const [input, setInput] = useState('');
  const [thinking, setThinking] = useState(false);
  const [renderingId, setRenderingId] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    savedMessages = messages;
  }, [messages]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, thinking]);

  useEffect(() => {
    const el = inputRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, 160)}px`;
  }, [input]);

  const send = async (text: string) => {
    const question = text.trim();
    if (!question || thinking) return;
    const next: Message[] = [...messages, { id: newId(), role: 'user', text: question }];
    setMessages(next);
    setInput('');
    setThinking(true);
    try {
      const res = await fetch('/api/manasik-ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: next.filter((m) => !m.error).map((m) => ({ role: m.role, text: historyText(m) })),
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? `Request failed (${res.status})`);
      const demos: DemoRequest[] = data.demos ?? [];
      demos.forEach((r) => registerDemo(r, brandDefault));
      setMessages((prev) => [...prev, { id: newId(), role: 'assistant', text: data.reply ?? '', videos: data.videos ?? [], demoIds: demos.map((r) => r.id) }]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        { id: newId(), role: 'assistant', text: err instanceof Error ? err.message : 'Something went wrong.', error: true },
      ]);
    } finally {
      setThinking(false);
      inputRef.current?.focus();
    }
  };

  const lastAssistantId = [...messages].reverse().find((m) => m.role === 'assistant')?.id;

  if (locked) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-3rem)]">
        <div className="card-base max-w-md w-full text-center py-10 px-6">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-primary flex items-center justify-center">
            <Sparkles size={26} className="text-accent" />
          </div>
          <h1 className="mt-4 text-xl font-semibold text-foreground">Manasik IA</h1>
          <p className="mt-2 text-sm text-muted-foreground">Needs to be set up with an AI API.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-3rem)] -my-1">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 pb-4 border-b border-border">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
            <Sparkles size={20} className="text-accent" />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-foreground">Manasik IA</h1>
            <p className="text-sm text-muted-foreground">Ask about your campaign, or ask for a video.</p>
          </div>
        </div>
        {messages.length > 0 && (
          <button type="button" onClick={() => {
              clearDemos();
              setMessages([]);
            }} disabled={thinking || renderingId !== null} className="btn-secondary text-sm disabled:opacity-50">
            <SquarePen size={15} />
            New chat
          </button>
        )}
      </div>

      {locked && (
        <div className="mt-4 rounded-lg border border-amber-300 bg-amber-50 dark:bg-amber-950/30 dark:border-amber-800 px-4 py-3 flex gap-3 text-sm">
          <AlertTriangle size={18} className="text-amber-600 flex-shrink-0 mt-0.5" />
          <p className="text-foreground">
            <strong>Setup needed.</strong> Manasik IA is not ready yet — it will be available soon.
          </p>
        </div>
      )}

      {!locked && !geminiReady && (
        <div className="mt-4 rounded-lg border border-amber-300 bg-amber-50 dark:bg-amber-950/30 dark:border-amber-800 px-4 py-3 flex gap-3 text-sm">
          <AlertTriangle size={18} className="text-amber-600 flex-shrink-0 mt-0.5" />
          <p className="text-foreground">
            <strong>Setup needed:</strong> add the free <span className="font-mono">GROQ_API_KEY</span> (console.groq.com)
            {!pexelsReady && (
              <>
                {' '}and <span className="font-mono">PEXELS_API_KEY</span> (pexels.com/api)
              </>
            )}{' '}
            to the server environment variables, then redeploy.
          </p>
        </div>
      )}

      {/* Conversation */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto scrollbar-thin py-6">
        {messages.length === 0 ? (
          <div className="max-w-2xl mx-auto text-center pt-6 fade-in">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-primary flex items-center justify-center shadow-sm">
              <Sparkles size={30} className="text-accent" />
            </div>
            <h2 className="mt-4 text-2xl font-semibold text-foreground">Assalamu alaikum 👋</h2>
            <p className="mt-2 text-sm text-muted-foreground max-w-md mx-auto">
              I know your pilgrims, groups, payments and logistics, and I can make ready-to-post videos with voice-over and captions — in Arabic, French or English.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-8 text-left">
              {SUGGESTIONS.map((s) => {
                const Icon = s.icon;
                return (
                  <button
                    key={s.label}
                    type="button"
                    onClick={() => send(s.prompt)}
                    disabled={!geminiReady}
                    className="group card-base p-3 flex gap-3 items-start text-left hover:border-primary/40 hover:bg-secondary/40 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <span className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center flex-shrink-0 group-hover:bg-primary group-hover:text-primary-foreground text-primary transition-colors">
                      <Icon size={15} />
                    </span>
                    <span className="min-w-0">
                      <span className="block text-sm font-semibold text-foreground">{s.label}</span>
                      <span className="block text-xs text-muted-foreground line-clamp-2" dir="auto">
                        {s.prompt}
                      </span>
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="max-w-3xl mx-auto space-y-5">
            {messages.map((m) =>
              m.role === 'user' ? (
                <div key={m.id} className="flex justify-end slide-up">
                  <div className="max-w-[80%] rounded-2xl rounded-br-md bg-primary text-primary-foreground px-4 py-2.5 text-sm whitespace-pre-wrap" dir="auto">
                    {m.text}
                  </div>
                </div>
              ) : (
                <div key={m.id} className="flex gap-3 slide-up">
                  <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Sparkles size={15} className="text-accent" />
                  </div>
                  <div className="min-w-0 flex-1 space-y-3">
                    {m.error ? (
                      <div className="rounded-lg bg-[var(--status-rejected-bg)] text-[var(--status-rejected)] text-sm px-3 py-2 flex gap-2 w-fit">
                        <AlertTriangle size={16} className="flex-shrink-0 mt-0.5" />
                        <span>{m.text}</span>
                      </div>
                    ) : (
                      m.text && (
                        <div className="text-foreground" dir="auto">
                          <Markdown text={m.text} />
                        </div>
                      )
                    )}
                    {m.videos?.map((v) => (
                      <VideoCard
                        key={v.id}
                        request={v}
                        brandDefault={brandDefault}
                        autoStart={m.id === lastAssistantId && renderingId === null && !startedVideos.has(v.id)}
                        pexelsReady={pexelsReady}
                        lockedByOther={renderingId !== null && renderingId !== v.id}
                        onBusyChange={(busy) => {
                          if (busy) startedVideos.add(v.id);
                          setRenderingId((current) => (busy ? v.id : current === v.id ? null : current));
                        }}
                      />
                    ))}
                    {m.demoIds?.map((id) => <DemoCard key={id} id={id} />)}
                  </div>
                </div>
              )
            )}
            {thinking && (
              <div className="flex gap-3 fade-in">
                <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center flex-shrink-0">
                  <Sparkles size={15} className="text-accent animate-pulse" />
                </div>
                <div className="flex items-center gap-1.5 px-4 py-3 rounded-2xl bg-card border border-border">
                  {[0, 150, 300].map((delay) => (
                    <span key={delay} className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce" style={{ animationDelay: `${delay}ms` }} />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Composer */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          send(input);
        }}
        className="max-w-3xl w-full mx-auto"
      >
        <div className="flex items-end gap-2 rounded-2xl border border-border bg-card p-2 shadow-sm focus-within:ring-2 focus-within:ring-ring">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
                e.preventDefault();
                send(input);
              }
            }}
            rows={1}
            dir="auto"
            disabled={!geminiReady}
            placeholder={geminiReady ? 'Ask a question or describe the video you want…' : 'Manasik IA is not ready yet'}
            className="flex-1 resize-none bg-transparent px-2 py-2 text-sm text-foreground placeholder:text-muted-foreground/70 focus:outline-none"
          />
          <button
            type="submit"
            disabled={!input.trim() || thinking || !geminiReady}
            className="w-9 h-9 rounded-xl bg-primary text-primary-foreground flex items-center justify-center flex-shrink-0 transition-opacity disabled:opacity-40"
            aria-label="Send"
          >
            <ArrowUp size={18} />
          </button>
        </div>
        <p className="text-[11px] text-muted-foreground text-center mt-2">Manasik IA reads your data but never changes it. Check important answers before acting on them.</p>
      </form>
    </div>
  );
}
