'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';

export type ThemeMode = 'light' | 'dark' | 'system';

interface PreferencesContextValue {
  theme: ThemeMode;
  setTheme: (t: ThemeMode) => void;
  compactMode: boolean;
  setCompactMode: (v: boolean) => void;
  animationsEnabled: boolean;
  setAnimationsEnabled: (v: boolean) => void;
  sidebarCollapsedDefault: boolean;
  setSidebarCollapsedDefault: (v: boolean) => void;
}

const KEYS = {
  theme: 'manasikpro_theme',
  compact: 'manasikpro_compact_mode',
  animations: 'manasikpro_animations_enabled',
  sidebarDefault: 'manasikpro_sidebar_collapsed_default',
};

const PreferencesContext = createContext<PreferencesContextValue | null>(null);

function readBool(key: string, fallback: boolean): boolean {
  try {
    const v = localStorage.getItem(key);
    return v === null ? fallback : v === 'true';
  } catch {
    return fallback;
  }
}

function applyTheme(theme: ThemeMode) {
  const root = document.documentElement;
  const resolvedDark = theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
  root.classList.toggle('dark', resolvedDark);
}

export function PreferencesProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<ThemeMode>('light');
  const [compactMode, setCompactModeState] = useState(false);
  const [animationsEnabled, setAnimationsEnabledState] = useState(true);
  const [sidebarCollapsedDefault, setSidebarCollapsedDefaultState] = useState(false);

  useEffect(() => {
    try {
      const storedTheme = localStorage.getItem(KEYS.theme) as ThemeMode | null;
      const initialTheme = storedTheme ?? 'light';
      setThemeState(initialTheme);
      applyTheme(initialTheme);
    } catch {
      // Stay on the light default.
    }
    setCompactModeState(readBool(KEYS.compact, false));
    setAnimationsEnabledState(readBool(KEYS.animations, true));
    setSidebarCollapsedDefaultState(readBool(KEYS.sidebarDefault, false));
  }, []);

  useEffect(() => {
    if (theme !== 'system') return;
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const listener = () => applyTheme('system');
    mq.addEventListener('change', listener);
    return () => mq.removeEventListener('change', listener);
  }, [theme]);

  useEffect(() => {
    document.documentElement.classList.toggle('compact-mode', compactMode);
  }, [compactMode]);

  useEffect(() => {
    document.documentElement.classList.toggle('no-animations', !animationsEnabled);
  }, [animationsEnabled]);

  const setTheme = (t: ThemeMode) => {
    setThemeState(t);
    applyTheme(t);
    try {
      localStorage.setItem(KEYS.theme, t);
    } catch {
      // Per-viewer convenience only.
    }
  };

  const setCompactMode = (v: boolean) => {
    setCompactModeState(v);
    try {
      localStorage.setItem(KEYS.compact, String(v));
    } catch {
      // no-op
    }
  };

  const setAnimationsEnabled = (v: boolean) => {
    setAnimationsEnabledState(v);
    try {
      localStorage.setItem(KEYS.animations, String(v));
    } catch {
      // no-op
    }
  };

  const setSidebarCollapsedDefault = (v: boolean) => {
    setSidebarCollapsedDefaultState(v);
    try {
      localStorage.setItem(KEYS.sidebarDefault, String(v));
    } catch {
      // no-op
    }
  };

  return (
    <PreferencesContext.Provider
      value={{ theme, setTheme, compactMode, setCompactMode, animationsEnabled, setAnimationsEnabled, sidebarCollapsedDefault, setSidebarCollapsedDefault }}
    >
      {children}
    </PreferencesContext.Provider>
  );
}

export function usePreferences(): PreferencesContextValue {
  const ctx = useContext(PreferencesContext);
  if (!ctx) throw new Error('usePreferences must be used within a PreferencesProvider');
  return ctx;
}

export function readSidebarCollapsedDefault(): boolean {
  return readBool(KEYS.sidebarDefault, false);
}
