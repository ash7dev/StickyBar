'use client';

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';

// ── Types ───────────────────────────────────────────────────────────────────

type ThemeMode = 'light' | 'dark' | 'system';

interface ThemeContextValue {
  mode: ThemeMode;
  resolved: 'light' | 'dark';
  setMode: (mode: ThemeMode) => void;
}

const ThemeContext = createContext<ThemeContextValue>({
  mode: 'light',
  resolved: 'light',
  setMode: () => {},
});

// ── Hook public ─────────────────────────────────────────────────────────────

export function useTheme() {
  return useContext(ThemeContext);
}

// ── Provider ────────────────────────────────────────────────────────────────

interface ThemeProviderProps {
  children: ReactNode;
  defaultMode?: ThemeMode;
  storageKey?: string;
}

export function ThemeProvider({
  children,
  defaultMode = 'light',
  storageKey = 'immoloc-theme',
}: ThemeProviderProps) {
  const [mode, setModeState] = useState<ThemeMode>(defaultMode);
  const [resolved, setResolved] = useState<'light' | 'dark'>('light');

  // Lecture du mode sauvegardé au montage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(storageKey) as ThemeMode | null;
      if (stored && ['light', 'dark', 'system'].includes(stored)) {
        setModeState(stored);
      }
    } catch {
      // SSR ou localStorage indisponible
    }
  }, [storageKey]);

  // Résolution du mode effectif + application de la classe CSS
  useEffect(() => {
    const root = document.documentElement;

    function applyTheme(m: ThemeMode) {
      let effective: 'light' | 'dark';

      if (m === 'system') {
        effective = window.matchMedia('(prefers-color-scheme: dark)').matches
          ? 'dark'
          : 'light';
      } else {
        effective = m;
      }

      root.classList.remove('light', 'dark');
      root.classList.add(effective);
      root.setAttribute('data-theme', effective);
      setResolved(effective);
    }

    applyTheme(mode);

    // Écouter les changements de préférence système
    if (mode === 'system') {
      const mq = window.matchMedia('(prefers-color-scheme: dark)');
      const handler = () => applyTheme('system');
      mq.addEventListener('change', handler);
      return () => mq.removeEventListener('change', handler);
    }
  }, [mode]);

  function setMode(newMode: ThemeMode) {
    setModeState(newMode);
    try {
      localStorage.setItem(storageKey, newMode);
    } catch {
      // Ignorer
    }
  }

  return (
    <ThemeContext value={{ mode, resolved, setMode }}>
      {children}
    </ThemeContext>
  );
}
