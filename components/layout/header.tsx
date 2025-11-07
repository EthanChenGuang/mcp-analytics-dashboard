'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ThemeToggle } from '@/components/theme/theme-toggle';
import { Suspense } from 'react';

function HeaderContent() {
  const pathname = usePathname();

  return (
    <header className="border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
      <div className="container mx-auto px-4 sm:px-6 py-4">
        <nav className="flex items-center justify-between">
          <div className="flex items-center gap-4 sm:gap-6">
            <Link 
              href="/" 
              className={`text-base sm:text-lg font-semibold transition-colors ${
                pathname === '/' 
                  ? 'text-purple-600 dark:text-purple-400' 
                  : 'text-gray-700 dark:text-gray-300 hover:text-purple-600 dark:hover:text-purple-400'
              }`}
            >
              Dashboard
            </Link>
            <Link 
              href="/about" 
              className={`text-base sm:text-lg font-semibold transition-colors ${
                pathname === '/about' 
                  ? 'text-purple-600 dark:text-purple-400' 
                  : 'text-gray-700 dark:text-gray-300 hover:text-purple-600 dark:hover:text-purple-400'
              }`}
            >
              About
            </Link>
          </div>
          <div className="flex-shrink-0">
            <ThemeToggle />
          </div>
        </nav>
      </div>
    </header>
  );
}

export function Header() {
  return (
    <Suspense fallback={
      <header className="border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
        <div className="container mx-auto px-4 sm:px-6 py-4">
          <nav className="flex items-center justify-between">
            <div className="flex items-center gap-4 sm:gap-6">
              <Link href="/" className="text-base sm:text-lg font-semibold text-gray-700 dark:text-gray-300">
                Dashboard
              </Link>
              <Link href="/about" className="text-base sm:text-lg font-semibold text-gray-700 dark:text-gray-300">
                About
              </Link>
            </div>
            <div className="flex-shrink-0">
              <ThemeToggle />
            </div>
          </nav>
        </div>
      </header>
    }>
      <HeaderContent />
    </Suspense>
  );
}

