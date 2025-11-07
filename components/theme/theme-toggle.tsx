'use client';

import { useState, useCallback, useEffect } from 'react';

export function ThemeToggle() {
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (typeof window !== 'undefined') {
      const isDark = document.documentElement.classList.contains('dark');
      setTheme(isDark ? 'dark' : 'light');
    }
  }, []);

  const toggleTheme = useCallback(() => {
    if (typeof window === 'undefined') return;
    
    const root = document.documentElement;
    const newTheme = root.classList.contains('dark') ? 'light' : 'dark';
    
    root.classList.remove('light', 'dark');
    root.classList.add(newTheme);
    
    localStorage.setItem('mcp-analytics-theme', newTheme);
    setTheme(newTheme);
  }, []);

  const handleToggle = useCallback(() => {
    if (isTransitioning || !mounted) return;
    
    setIsTransitioning(true);
    toggleTheme();
    
    // Debounce: 300ms
    setTimeout(() => {
      setIsTransitioning(false);
    }, 300);
  }, [toggleTheme, isTransitioning, mounted]);

  if (!mounted) {
    return (
      <button
        className="px-4 py-2 rounded-md bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200"
        aria-label="Toggle theme"
      >
        ☀️ Light
      </button>
    );
  }

  return (
    <button
      onClick={handleToggle}
      disabled={isTransitioning}
      className="px-4 py-2 rounded-md bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors disabled:opacity-50"
      aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
    >
      {theme === 'light' ? '🌙' : '☀️'} {theme === 'light' ? 'Dark' : 'Light'}
    </button>
  );
}

