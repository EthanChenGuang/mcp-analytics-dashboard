# Quick Start Guide: MCP Analytics Dashboard

**Feature**: 001-mcp-analytics-dashboard  
**Date**: 2025-01-27

## Overview

This guide provides step-by-step instructions for setting up and implementing the MCP Analytics Dashboard. Follow these steps to get started with development.

## Prerequisites

- Node.js 18+ installed
- npm or yarn package manager
- Git installed
- GitHub account (for Actions workflow)

## Step 1: Verify Project Setup

Ensure you're in the `mcp-registry-ui` directory and verify Next.js is set up:

```bash
# Verify you're in the correct directory
pwd  # Should show: .../mcp-registry-ui

# Check if Next.js is already initialized
ls -la  # Should show next.config.js, package.json, app/, etc.

# If Next.js is not initialized, run from this directory:
npx create-next-app@latest . --typescript --tailwind --app --no-src-dir
```

**Note**: This guide assumes you're already in the `mcp-registry-ui` project directory. If the project is already initialized, you can proceed to Step 2.

## Step 2: Install Dependencies

```bash
# Install core dependencies
npm install recharts date-fns

# Install shadcn/ui (follow prompts)
npx shadcn-ui@latest init

# Install shadcn components needed
npx shadcn-ui@latest add button
npx shadcn-ui@latest add select
npx shadcn-ui@latest add card
npx shadcn-ui@latest add tabs
npx shadcn-ui@latest add switch  # For theme toggle
```

## Step 3: Configure Next.js for Static Export

Update `next.config.js`:

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',  // Enable static export
  images: {
    unoptimized: true,  // Required for static export
  },
};

module.exports = nextConfig;
```

## Step 4: Set Up Project Structure

Create the following directory structure:

```bash
mkdir -p app/about
mkdir -p components/{ui,charts,filters,theme,layout}
mkdir -p lib/{api,utils,types}
mkdir -p public/data
mkdir -p .github/{workflows,scripts}
mkdir -p tests/{components,lib,e2e}
```

## Step 5: Configure Tailwind Theme Colors

Update `tailwind.config.js` to include purple, blue, and pink color scheme:

```javascript
module.exports = {
  theme: {
    extend: {
      colors: {
        // Modern color scheme
        purple: {
          50: '#faf5ff',
          100: '#f3e8ff',
          500: '#a855f7',
          600: '#9333ea',
          700: '#7e22ce',
        },
        blue: {
          50: '#eff6ff',
          100: '#dbeafe',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
        },
        pink: {
          50: '#fdf2f8',
          100: '#fce7f3',
          500: '#ec4899',
          600: '#db2777',
          700: '#be185d',
        },
      },
    },
  },
};
```

## Step 6: Create Type Definitions

Create `lib/types/analytics.ts`:

```typescript
export interface AnalyticsSnapshot {
  timestamp: string;
  localCount: number;
  remoteCount: number;
  totalCount: number;
  bothCount: number;
  unknownCount: number;
}

export interface TimeSeriesDataPoint {
  periodStart: string;
  periodEnd: string;
  granularity: 'hourly' | 'daily' | 'weekly' | 'monthly';
  localCount: number;
  remoteCount: number;
  totalCount: number;
  snapshotCount: number;
}

export type ServerType = 'local' | 'remote' | 'both' | 'unknown';
export type FilterState = 'all' | 'local' | 'remote';
export type ThemePreference = 'light' | 'dark';
export type Granularity = 'hourly' | 'daily' | 'weekly' | 'monthly';
```

## Step 7: Implement Core Utilities

### Server Classification

Create `lib/utils/server-classification.ts`:

```typescript
import { ServerType } from '@/lib/types/analytics';

interface Server {
  packages?: unknown[];
  remotes?: unknown[];
}

export function classifyServer(server: Server): ServerType {
  const hasPackages = server.packages && server.packages.length > 0;
  const hasRemotes = server.remotes && server.remotes.length > 0;
  
  if (hasPackages && hasRemotes) return 'both';
  if (hasPackages) return 'local';
  if (hasRemotes) return 'remote';
  return 'unknown';
}
```

### Data Aggregation

Create `lib/utils/data-aggregation.ts`:

```typescript
import { AnalyticsSnapshot, TimeSeriesDataPoint, Granularity } from '@/lib/types/analytics';
import { startOfHour, startOfDay, startOfWeek, startOfMonth, endOfHour, endOfDay, endOfWeek, endOfMonth } from 'date-fns';

export function aggregateByGranularity(
  snapshots: AnalyticsSnapshot[],
  granularity: Granularity
): TimeSeriesDataPoint[] {
  // Implementation: Group snapshots by time period and aggregate counts
  // See data-model.md for aggregation logic
}
```

### Date Formatting

Create `lib/utils/date-formatting.ts`:

```typescript
import { format } from 'date-fns';
import { Granularity } from '@/lib/types/analytics';

export function formatDateForAxis(date: Date, granularity: Granularity): string {
  switch (granularity) {
    case 'hourly':
      return format(date, 'HH:mm');
    case 'daily':
      return format(date, 'MMM d');
    case 'weekly':
      return format(date, 'MMM d');
    case 'monthly':
      return format(date, 'MMM yyyy');
  }
}
```

## Step 8: Create API Client

Create `lib/api/analytics.ts`:

```typescript
import { AnalyticsSnapshot } from '@/lib/types/analytics';

const CACHE_KEY = 'mcp-analytics-cache';
const CACHE_TIMESTAMP_KEY = 'mcp-analytics-cache-timestamp';
const CACHE_MAX_AGE = 5 * 60 * 1000; // 5 minutes

export async function fetchAnalytics(): Promise<AnalyticsSnapshot[]> {
  // Implementation with retry logic and caching
  // See contracts/analytics-data-api.md for details
}
```

## Step 9: Create GitHub Actions Workflow

Create `.github/workflows/aggregate-analytics.yml`:

```yaml
name: Aggregate MCP Analytics

on:
  schedule:
    - cron: '0 * * * *'
  workflow_dispatch:

jobs:
  aggregate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Aggregate analytics
        run: ./.github/scripts/aggregate-analytics.sh
      - name: Commit and push
        run: |
          git config --local user.email "action@github.com"
          git config --local user.name "GitHub Action"
          git add public/data/analytics-latest.json
          git commit -m "Update analytics: $(date -u +%Y-%m-%dT%H:%M:%SZ)" || exit 0
          git push
```

## Step 10: Create Aggregation Script

Create `.github/scripts/aggregate-analytics.sh`:

```zsh
#!/usr/bin/env zsh
# Implementation: See contracts/github-actions-workflow.md
```

Make it executable:

```bash
chmod +x .github/scripts/aggregate-analytics.sh
```

## Step 11: Create Theme Provider

Create `components/theme/theme-provider.tsx`:

```typescript
'use client';

import { createContext, useContext, useEffect, useState } from 'react';

type Theme = 'light' | 'dark';

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  // Implementation with localStorage persistence
  // See research.md for details
}
```

## Step 12: Create Main Dashboard Page

Create `app/page.tsx`:

```typescript
'use client';

import { useEffect, useState } from 'react';
import { AnalyticsSnapshot } from '@/lib/types/analytics';
import { fetchAnalytics } from '@/lib/api/analytics';
import { TimeSeriesChart } from '@/components/charts/time-series-chart';
import { ServerTypeFilter } from '@/components/filters/server-type-filter';
import { GranularitySelector } from '@/components/filters/granularity-selector';

export default function DashboardPage() {
  const [data, setData] = useState<AnalyticsSnapshot[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Implementation: Fetch data, handle filters, render charts
}
```

## Step 13: Create Chart Component

Create `components/charts/time-series-chart.tsx`:

```typescript
'use client';

import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, Legend } from 'recharts';
import { TimeSeriesDataPoint } from '@/lib/types/analytics';

interface TimeSeriesChartProps {
  data: TimeSeriesDataPoint[];
  filter: 'all' | 'local' | 'remote';
}

export function TimeSeriesChart({ data, filter }: TimeSeriesChartProps) {
  // Implementation: Render Recharts component with theme colors
}
```

## Step 14: Create About Page

Create `app/about/page.tsx`:

```typescript
export default function AboutPage() {
  return (
    <div>
      <h1>About MCP Analytics Dashboard</h1>
      {/* Implementation: Add content about dashboard, data sources, etc. */}
    </div>
  );
}
```

## Step 15: Set Up Testing

Install testing dependencies:

```bash
npm install -D jest @testing-library/react @testing-library/jest-dom @testing-library/user-event
npm install -D @playwright/test
```

Create `jest.config.js`:

```javascript
module.exports = {
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
};
```

## Step 16: Build and Test

```bash
# Run development server
npm run dev

# Build for production
npm run build

# Export static files
npm run export  # If using next export, or build already exports

# Run tests
npm test

# Run E2E tests
npx playwright test
```

## Next Steps

1. **Implement Components**: Build out all UI components (filters, charts, theme toggle)
2. **Add Error Handling**: Implement retry logic, caching, error states
3. **Style Components**: Apply purple/blue/pink color scheme
4. **Test Thoroughly**: Write unit tests, component tests, E2E tests
5. **Deploy**: Set up static hosting (Vercel, Netlify, GitHub Pages)

## Common Issues

### Static Export Issues

- **Problem**: API routes not available in static export
- **Solution**: Use client-side fetching only, no API routes

### Theme Flash

- **Problem**: Flash of unstyled content on page load
- **Solution**: Use `suppressHydrationWarning` and load theme before render

### Chart Responsiveness

- **Problem**: Charts not responsive on mobile
- **Solution**: Use `ResponsiveContainer` from Recharts, set proper breakpoints

## Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [Recharts Documentation](https://recharts.org/)
- [shadcn/ui Documentation](https://ui.shadcn.com/)
- [Feature Specification](./spec.md)
- [Data Model](./data-model.md)
- [API Contracts](./contracts/)

## Support

For questions or issues, refer to:

- Feature specification: `specs/001-mcp-analytics-dashboard/spec.md`
- Implementation plan: `specs/001-mcp-analytics-dashboard/plan.md`
- Research findings: `specs/001-mcp-analytics-dashboard/research.md`
