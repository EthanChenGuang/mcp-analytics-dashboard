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
  bothCount?: number;
  unknownCount?: number;
  snapshotCount: number;
}

export type ServerType = 'local' | 'remote' | 'both' | 'unknown';
export type FilterState = 'all' | 'local' | 'remote' | 'show-all';
export type ThemePreference = 'light' | 'dark';
export type Granularity = 'hourly' | 'daily' | 'weekly' | 'monthly';



