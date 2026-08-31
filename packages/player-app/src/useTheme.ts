import { useState, useEffect, useCallback, ReactNode, createElement, Fragment } from 'react';

export type Theme = 'dark' | 'light';

const STORAGE_KEY = 'bingo-theme';

export function getInitialTheme(): Theme {
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === 'dark' || saved === 'light') return saved as Theme;
    const attr = document.documentElement.getAttribute('data-theme');
    if (attr === 'dark' || attr === 'light') return attr as Theme;
  }
  return 'dark';
}

let currentTheme: Theme = getInitialTheme();
const listeners = new Set<(theme: Theme) => void>();

export function applyTheme(theme: Theme) {
  currentTheme = theme;
  if (typeof document !== 'undefined') {
    document.documentElement.setAttribute('data-theme', theme);
    document.body.setAttribute('data-theme', theme);
    document.documentElement.classList.remove('dark', 'light');
    document.documentElement.classList.add(theme);
    document.body.classList.remove('dark', 'light');
    document.body.classList.add(theme);
  }
  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEY, theme);
  }
  listeners.forEach((fn) => {
    try {
      fn(theme);
    } catch (e) {
      console.error('Theme listener error:', e);
    }
  });
}

// Ensure theme is applied on initial load
if (typeof document !== 'undefined') {
  applyTheme(currentTheme);
}

export function toggleTheme(): Theme {
  const next: Theme = currentTheme === 'dark' ? 'light' : 'dark';
  applyTheme(next);
  return next;
}

export function setTheme(nextTheme: Theme) {
  applyTheme(nextTheme);
}

export function useTheme() {
  const [theme, setLocalTheme] = useState<Theme>(currentTheme);

  useEffect(() => {
    setLocalTheme(currentTheme);
    const handler = (t: Theme) => setLocalTheme(t);
    listeners.add(handler);
    return () => {
      listeners.delete(handler);
    };
  }, []);

  const toggle = useCallback(() => {
    toggleTheme();
  }, []);

  return {
    theme,
    toggle,
    setTheme,
  };
}

export const ThemeProvider = ({ children }: { children: ReactNode }) => {
  return createElement(Fragment, null, children);
};
