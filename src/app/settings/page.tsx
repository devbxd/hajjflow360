'use client';

import React, { useEffect, useState } from 'react';
import AppLayout from '@/components/AppLayout';
import { Settings as SettingsIcon, User, Lock, Palette, Sun, Moon, Monitor } from 'lucide-react';
import { toast } from 'sonner';
import { usePreferences, type ThemeMode } from '@/lib/preferences';

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={`relative w-10 h-6 rounded-full transition-colors flex-shrink-0 ${checked ? 'bg-primary' : 'bg-muted'}`}
      aria-pressed={checked}
    >
      <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${checked ? 'translate-x-4' : ''}`} />
    </button>
  );
}

function AccountTab() {
  const [username, setUsername] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch('/api/auth/me')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.user) {
          setUsername(data.user.username);
          setDisplayName(data.user.displayName);
        }
      })
      .catch(() => {});
  }, []);

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      toast.error("Confirmation doesn't match the new password.");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || 'Unable to change the password.');
        return;
      }
      toast.success('Password updated.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch {
      toast.error('Network error. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-lg space-y-6">
      <div className="card-base">
        <div className="flex items-center gap-2 mb-4">
          <User size={14} className="text-primary" />
          <h3 className="text-sm font-semibold text-foreground">Account</h3>
        </div>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between py-1.5 border-b border-border/50">
            <span className="text-muted-foreground">Username</span>
            <span className="font-mono-data text-foreground">{username || '—'}</span>
          </div>
          <div className="flex justify-between py-1.5">
            <span className="text-muted-foreground">Display name</span>
            <span className="text-foreground">{displayName || '—'}</span>
          </div>
        </div>
      </div>

      <form onSubmit={handleChangePassword} className="card-base space-y-4">
        <div className="flex items-center gap-2">
          <Lock size={14} className="text-primary" />
          <h3 className="text-sm font-semibold text-foreground">Change Password</h3>
        </div>

        <div>
          <label className="block text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1.5">Current password</label>
          <input
            type="password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            required
            className="w-full text-sm border border-border rounded-lg px-3 py-2 bg-input text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1.5">New password</label>
          <input
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            minLength={8}
            required
            className="w-full text-sm border border-border rounded-lg px-3 py-2 bg-input text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1.5">Confirm new password</label>
          <input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            minLength={8}
            required
            className="w-full text-sm border border-border rounded-lg px-3 py-2 bg-input text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>

        <button type="submit" disabled={saving} className="btn-primary w-full justify-center text-sm" style={{ opacity: saving ? 0.7 : 1 }}>
          {saving ? 'Saving...' : 'Update password'}
        </button>
      </form>
    </div>
  );
}

function AppearanceTab() {
  const { theme, setTheme, compactMode, setCompactMode, animationsEnabled, setAnimationsEnabled, sidebarCollapsedDefault, setSidebarCollapsedDefault } = usePreferences();

  const themes: { value: ThemeMode; label: string; icon: React.ElementType }[] = [
    { value: 'light', label: 'Light', icon: Sun },
    { value: 'dark', label: 'Dark', icon: Moon },
    { value: 'system', label: 'System', icon: Monitor },
  ];

  return (
    <div className="max-w-lg space-y-6">
      <div className="card-base">
        <h3 className="text-sm font-semibold text-foreground mb-1">Theme</h3>
        <p className="text-xs text-muted-foreground mb-4">Choose your preferred color scheme</p>
        <div className="grid grid-cols-3 gap-3">
          {themes.map((t) => {
            const Icon = t.icon;
            const active = theme === t.value;
            return (
              <button
                key={t.value}
                onClick={() => setTheme(t.value)}
                className={`flex flex-col items-center gap-2 py-4 rounded-xl border transition-colors ${
                  active ? 'border-primary bg-secondary text-primary' : 'border-border text-muted-foreground hover:bg-muted'
                }`}
              >
                <Icon size={18} />
                <span className="text-sm font-medium">{t.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="card-base">
        <h3 className="text-sm font-semibold text-foreground mb-1">Display Preferences</h3>
        <p className="text-xs text-muted-foreground mb-4">Customize the interface layout</p>
        <div className="divide-y divide-border/50">
          <div className="flex items-center justify-between py-3">
            <div>
              <p className="text-sm font-medium text-foreground">Compact Mode</p>
              <p className="text-xs text-muted-foreground">Reduce spacing for denser information display</p>
            </div>
            <Toggle checked={compactMode} onChange={setCompactMode} />
          </div>
          <div className="flex items-center justify-between py-3">
            <div>
              <p className="text-sm font-medium text-foreground">Animations</p>
              <p className="text-xs text-muted-foreground">Enable UI transitions and micro-interactions</p>
            </div>
            <Toggle checked={animationsEnabled} onChange={setAnimationsEnabled} />
          </div>
          <div className="flex items-center justify-between py-3">
            <div>
              <p className="text-sm font-medium text-foreground">Sidebar Collapsed by Default</p>
              <p className="text-xs text-muted-foreground">Start with sidebar in collapsed state</p>
            </div>
            <Toggle checked={sidebarCollapsedDefault} onChange={setSidebarCollapsedDefault} />
          </div>
        </div>
      </div>
    </div>
  );
}

export default function SettingsPage() {
  const [tab, setTab] = useState<'account' | 'appearance'>('account');

  const tabs = [
    { id: 'account' as const, label: 'Account', icon: User },
    { id: 'appearance' as const, label: 'Appearance', icon: Palette },
  ];

  return (
    <AppLayout>
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
          <SettingsIcon size={20} className="text-primary" />
        </div>
        <h1 className="text-xl font-semibold text-foreground">Settings</h1>
      </div>

      <div className="flex gap-1 mb-6 bg-muted p-1 rounded-xl w-fit">
        {tabs.map((t) => {
          const Icon = t.icon;
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                tab === t.id ? 'bg-card text-foreground shadow-sm border border-border' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Icon size={15} />
              {t.label}
            </button>
          );
        })}
      </div>

      {tab === 'account' ? <AccountTab /> : <AppearanceTab />}
    </AppLayout>
  );
}
