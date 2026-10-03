'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Eye, EyeOff, Loader2, Lock, ShieldCheck, User } from 'lucide-react';

const HIGHLIGHTS = [
  'Every pilgrim, visa, flight, room and payment in one place',
  'Live dashboard that flags who needs attention today',
  'Each staff member signs in with their own account',
];

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Unable to sign in.');
        setLoading(false);
        return;
      }
      router.replace('/');
      router.refresh();
    } catch {
      setError('Network error. Please try again.');
      setLoading(false);
    }
  };

  const inputClass =
    'w-full rounded-xl border border-border bg-input py-3 pr-4 pl-11 text-sm text-foreground transition-all placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/15';

  return (
    <div className="bg-background grid min-h-screen lg:grid-cols-[1.1fr_1fr]">
      <aside className="relative hidden overflow-hidden bg-[#0F2F24] text-white lg:flex lg:flex-col lg:justify-between lg:p-14">
        <div
          aria-hidden
          className="absolute inset-0 opacity-[0.35] mix-blend-screen"
          style={{ backgroundImage: 'url(/showcase/dashboard.png)', backgroundSize: 'cover', backgroundPosition: 'center top', filter: 'blur(2px) saturate(0.8)' }}
        />
        <div aria-hidden className="absolute inset-0 bg-gradient-to-br from-[#0F2F24] via-[#0F2F24]/92 to-[#0F2F24]/70" />

        <Link href="/" className="relative flex items-center gap-2.5 text-white/90 transition-colors hover:text-[#C5A028]">
          <ArrowLeft className="size-4" />
          <span className="text-sm">Back to the website</span>
        </Link>

        <div className="relative">
          <div className="flex size-14 items-center justify-center rounded-2xl bg-[#C5A028] text-2xl font-bold text-[#0F2F24]">M</div>
          <h2 className="mt-8 text-4xl leading-tight font-bold tracking-tight text-balance">
            Welcome back to your campaign.
          </h2>
          <ul className="mt-10 space-y-5">
            {HIGHLIGHTS.map((item, index) => (
              <li key={item} className="flex items-start gap-4" style={{ animation: `fadeUp 0.6s ease-out ${index * 0.12 + 0.2}s both` }}>
                <span className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full bg-[#C5A028]/20 text-[#C5A028] text-sm font-bold">
                  {index + 1}
                </span>
                <span className="text-white/80 leading-relaxed">{item}</span>
              </li>
            ))}
          </ul>
        </div>

        <p className="relative flex items-center gap-2 text-sm text-white/60">
          <ShieldCheck className="size-4 text-[#C5A028]" />
          Access is limited to your team.
        </p>
      </aside>

      <main className="flex items-center justify-center px-5 py-12 sm:px-10">
        <div className="w-full max-w-md" style={{ animation: 'fadeUp 0.5s ease-out both' }}>
          <Link href="/" className="text-muted-foreground hover:text-foreground mb-10 inline-flex items-center gap-2 text-sm lg:hidden">
            <ArrowLeft className="size-4" />
            Back to the website
          </Link>

          <div className="mb-8 flex items-center gap-3 lg:hidden">
            <span className="bg-primary text-primary-foreground flex size-11 items-center justify-center rounded-xl text-lg font-bold">M</span>
            <span className="text-xl font-semibold">ManasikPro</span>
          </div>

          <h1 className="text-3xl font-bold tracking-tight">Sign in</h1>
          <p className="text-muted-foreground mt-2 text-sm">Use the username and password your administrator gave you.</p>

          <form onSubmit={handleSubmit} className="border-border bg-card mt-8 space-y-5 rounded-2xl border p-7 shadow-[0_24px_60px_-34px_rgba(15,47,36,0.35)]">
            <div>
              <label htmlFor="username" className="text-muted-foreground mb-2 block text-xs font-semibold tracking-wide uppercase">
                Username
              </label>
              <div className="relative">
                <User className="text-muted-foreground pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2" />
                <input
                  id="username"
                  type="text"
                  autoComplete="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className={inputClass}
                  required
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="text-muted-foreground mb-2 block text-xs font-semibold tracking-wide uppercase">
                Password
              </label>
              <div className="relative">
                <Lock className="text-muted-foreground pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2" />
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={`${inputClass} pr-12`}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  className="text-muted-foreground hover:text-foreground absolute top-1/2 right-3 -translate-y-1/2 rounded-md p-1.5 transition-colors"
                >
                  {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
            </div>

            {error && (
              <p className="rounded-lg bg-[#FEF2F2] px-3 py-2.5 text-sm text-[#DC2626]" role="alert">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="bg-primary text-primary-foreground hover:brightness-110 flex w-full items-center justify-center gap-2 rounded-xl py-3 text-sm font-semibold transition-all disabled:opacity-70"
            >
              {loading && <Loader2 className="size-4 animate-spin" />}
              {loading ? 'Signing in…' : 'Sign in'}
            </button>
          </form>


        </div>
      </main>

      <style>{`@keyframes fadeUp { from { opacity: 0; transform: translateY(14px); } to { opacity: 1; transform: translateY(0); } }`}</style>
    </div>
  );
}
