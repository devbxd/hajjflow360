'use client';

import React, { useEffect, useState } from 'react';
import AppLayout from '@/components/AppLayout';
import { Settings as SettingsIcon, User, Lock } from 'lucide-react';
import { toast } from 'sonner';

export default function SettingsPage() {
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
    <AppLayout>
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
          <SettingsIcon size={20} className="text-primary" />
        </div>
        <h1 className="text-xl font-semibold text-foreground">Settings</h1>
      </div>

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
    </AppLayout>
  );
}
