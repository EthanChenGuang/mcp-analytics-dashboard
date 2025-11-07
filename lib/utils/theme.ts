import { ThemePreference } from '@/lib/types/analytics';

const THEME_STORAGE_KEY = 'mcp-analytics-theme';

export function getStoredTheme(): ThemePreference | null {
  if (typeof window === 'undefined') return null;
  
  const stored = localStorage.getItem(THEME_STORAGE_KEY);
  if (stored === 'light' || stored === 'dark') {
    return stored;
  }
  return null;
}

export function setStoredTheme(theme: ThemePreference): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(THEME_STORAGE_KEY, theme);
}

export function getSystemTheme(): ThemePreference {
  if (typeof window === 'undefined') return 'light';
  
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

export function getInitialTheme(): ThemePreference {
  return getStoredTheme() || getSystemTheme();
}




