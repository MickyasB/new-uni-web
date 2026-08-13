import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

export type Theme = 'dark' | 'light';

const STORAGE_KEY = 'bingo-admin-theme';

interface ThemeContextType {
  theme: Theme;
  toggle: () => void;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

function applyTheme(theme: Theme) {
  if (typeof document !== 'undefined') {
    document.documentElement.setAttribute('data-theme', theme);
  }
}

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setThemeState] = useState<Theme>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(STORAGE_KEY) as Theme | null;
      if (saved === 'dark' || saved === 'light') return saved;
    }
    return 'dark';
  });

  useEffect(() => {
    applyTheme(theme);
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, theme);
    }
  }, [theme]);

  const toggle = useCallback(() => {
    setThemeState(t => (t === 'dark' ? 'light' : 'dark'));
  }, []);

  const setTheme = useCallback((newTheme: Theme) => {
    setThemeState(newTheme);
  }, []);

  return React.createElement(ThemeContext.Provider, { value: { theme, toggle, setTheme } }, children);
};

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    const [theme, setThemeState] = useState<Theme>(() => {
      if (typeof window !== 'undefined') {
        const saved = localStorage.getItem(STORAGE_KEY) as Theme | null;
        return saved ?? 'dark';
      }
      return 'dark';
    });
    useEffect(() => {
      applyTheme(theme);
    }, [theme]);
    const toggle = () => setThemeState(t => (t === 'dark' ? 'light' : 'dark'));
    return { theme, toggle, setTheme: setThemeState };
  }
  return context;
}
