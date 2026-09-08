'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
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

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center mb-6">
          <h1 className="text-lg font-semibold text-foreground">ManasikPro</h1>
          <p className="text-sm text-muted-foreground">Sign in to access the dashboard</p>
        </div>

        <form onSubmit={handleSubmit} className="card-base space-y-4">
          <div>
            <label htmlFor="username" className="block text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1.5">
              Username
            </label>
            <input
              id="username"
              type="text"
              autoComplete="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full text-sm border border-border rounded-lg px-3 py-2 bg-input text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              required
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1.5">
              Password
            </label>
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full text-sm border border-border rounded-lg px-3 py-2 bg-input text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              required
            />
          </div>

          {error && (
            <p className="text-sm text-[#DC2626]" role="alert">
              {error}
            </p>
          )}

          <button type="submit" disabled={loading} className="btn-primary w-full justify-center text-sm" style={{ opacity: loading ? 0.7 : 1 }}>
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  );
}
