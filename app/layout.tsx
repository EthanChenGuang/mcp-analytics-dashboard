import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { ThemeProvider } from '@/components/theme/theme-provider';
import { Header } from '@/components/layout/header';
import { ErrorBoundary } from '@/components/layout/error-boundary';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'MCP Analytics Dashboard',
  description: 'Analytics dashboard for Model Context Protocol servers',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ErrorBoundary>
          <ThemeProvider>
            <Header />
            {children}
          </ThemeProvider>
        </ErrorBoundary>
      </body>
    </html>
  );
}

