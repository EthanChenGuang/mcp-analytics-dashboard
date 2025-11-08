import { AnalyticsSnapshot, Granularity, TimeSeriesDataPoint } from '@/lib/types/analytics';
import {
  endOfDay,
  endOfHour,
  endOfMonth,
  endOfWeek,
  format,
  startOfDay,
  startOfHour,
  startOfMonth,
  startOfWeek
} from 'date-fns';

/**
 * Get the start of an hour in UTC (for consistent grouping regardless of local timezone)
 */
function startOfHourUTC(date: Date): Date {
  const utcDate = new Date(Date.UTC(
    date.getUTCFullYear(),
    date.getUTCMonth(),
    date.getUTCDate(),
    date.getUTCHours(),
    0,
    0,
    0
  ));
  return utcDate;
}

/**
 * Get the end of an hour in UTC (for consistent grouping regardless of local timezone)
 */
function endOfHourUTC(date: Date): Date {
  const utcDate = new Date(Date.UTC(
    date.getUTCFullYear(),
    date.getUTCMonth(),
    date.getUTCDate(),
    date.getUTCHours(),
    59,
    59,
    999
  ));
  return utcDate;
}

/**
 * Get the start of a day in UTC (for consistent grouping regardless of local timezone)
 */
function startOfDayUTC(date: Date): Date {
  const utcDate = new Date(Date.UTC(
    date.getUTCFullYear(),
    date.getUTCMonth(),
    date.getUTCDate(),
    0,
    0,
    0,
    0
  ));
  return utcDate;
}

/**
 * Get the end of a day in UTC (for consistent grouping regardless of local timezone)
 */
function endOfDayUTC(date: Date): Date {
  const utcDate = new Date(Date.UTC(
    date.getUTCFullYear(),
    date.getUTCMonth(),
    date.getUTCDate(),
    23,
    59,
    59,
    999
  ));
  return utcDate;
}

/**
 * Get the start of a week in UTC (Monday, for consistent grouping regardless of local timezone)
 */
function startOfWeekUTC(date: Date): Date {
  const dayOfWeek = date.getUTCDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
  const daysToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // Convert to Monday = 0
  
  const utcDate = new Date(date);
  utcDate.setUTCDate(date.getUTCDate() - daysToMonday);
  utcDate.setUTCHours(0, 0, 0, 0);
  return utcDate;
}

/**
 * Get the end of a week in UTC (Sunday, for consistent grouping regardless of local timezone)
 */
function endOfWeekUTC(date: Date): Date {
  const dayOfWeek = date.getUTCDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
  const daysToSunday = dayOfWeek === 0 ? 0 : 7 - dayOfWeek;
  
  const utcDate = new Date(date);
  utcDate.setUTCDate(date.getUTCDate() + daysToSunday);
  utcDate.setUTCHours(23, 59, 59, 999);
  return utcDate;
}

/**
 * Get the start of a month in UTC (for consistent grouping regardless of local timezone)
 */
function startOfMonthUTC(date: Date): Date {
  const utcDate = new Date(Date.UTC(
    date.getUTCFullYear(),
    date.getUTCMonth(),
    1,
    0,
    0,
    0,
    0
  ));
  return utcDate;
}

/**
 * Get the end of a month in UTC (for consistent grouping regardless of local timezone)
 */
function endOfMonthUTC(date: Date): Date {
  const year = date.getUTCFullYear();
  const month = date.getUTCMonth();
  const lastDay = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
  
  const utcDate = new Date(Date.UTC(
    year,
    month,
    lastDay,
    23,
    59,
    59,
    999
  ));
  return utcDate;
}

/**
 * Format a date in UTC timezone (for consistent grouping regardless of local timezone)
 */
function formatUTC(date: Date, formatStr: string): string {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  const day = String(date.getUTCDate()).padStart(2, '0');
  const hours = String(date.getUTCHours()).padStart(2, '0');
  const minutes = String(date.getUTCMinutes()).padStart(2, '0');
  const seconds = String(date.getUTCSeconds()).padStart(2, '0');
  
  if (formatStr === "yyyy-MM-dd'T'HH:mm:ss") {
    return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}`;
  } else if (formatStr === 'yyyy-MM-dd') {
    return `${year}-${month}-${day}`;
  } else if (formatStr === 'yyyy-MM') {
    return `${year}-${month}`;
  }
  
  // Fallback to regular format if pattern not recognized
  return format(date, formatStr);
}

export function aggregateByGranularity(
  snapshots: AnalyticsSnapshot[],
  granularity: Granularity
): TimeSeriesDataPoint[] {
  if (snapshots.length === 0) return [];

  // For small datasets (< 10 snapshots), show individual snapshots even with hourly granularity
  // This provides better visibility when there are few data points
  const showIndividualSnapshots = snapshots.length < 10 && granularity === 'hourly';

  // Group snapshots by time period
  const grouped = new Map<string, AnalyticsSnapshot[]>();

  for (const snapshot of snapshots) {
    const date = new Date(snapshot.timestamp);
    let periodKey: string;
    let periodStart: Date;

    if (showIndividualSnapshots) {
      // Use exact timestamp as key to keep snapshots separate
      periodKey = snapshot.timestamp;
    } else {
      switch (granularity) {
        case 'hourly':
          periodStart = startOfHourUTC(date);
          // Use UTC formatting to ensure consistent grouping regardless of local timezone
          periodKey = formatUTC(periodStart, "yyyy-MM-dd'T'HH:mm:ss");
          break;
        case 'daily':
          periodStart = startOfDayUTC(date);
          // Use UTC formatting to ensure consistent grouping regardless of local timezone
          periodKey = formatUTC(periodStart, 'yyyy-MM-dd');
          break;
        case 'weekly':
          // For weekly, we need to find the Monday of the week in UTC
          periodStart = startOfWeekUTC(date);
          // Use UTC formatting to ensure consistent grouping regardless of local timezone
          periodKey = formatUTC(periodStart, 'yyyy-MM-dd');
          break;
        case 'monthly':
          periodStart = startOfMonthUTC(date);
          // Use UTC formatting to ensure consistent grouping regardless of local timezone
          periodKey = formatUTC(periodStart, 'yyyy-MM');
          break;
      }
    }

    if (!grouped.has(periodKey)) {
      grouped.set(periodKey, []);
    }
    grouped.get(periodKey)!.push(snapshot);
  }

  // Aggregate each period
  const result: TimeSeriesDataPoint[] = [];
  
  for (const [, periodSnapshots] of grouped.entries()) {
    const firstSnapshot = periodSnapshots[0];
    const date = new Date(firstSnapshot.timestamp);
    
    let periodStart: Date;
    let periodEnd: Date;

    if (showIndividualSnapshots) {
      // For individual snapshots, use the exact timestamp as both start and end
      periodStart = date;
      periodEnd = date;
    } else {
      switch (granularity) {
        case 'hourly':
          periodStart = startOfHourUTC(date);
          periodEnd = endOfHourUTC(date);
          break;
        case 'daily':
          periodStart = startOfDayUTC(date);
          periodEnd = endOfDayUTC(date);
          break;
        case 'weekly':
          periodStart = startOfWeekUTC(date);
          periodEnd = endOfWeekUTC(date);
          break;
        case 'monthly':
          periodStart = startOfMonthUTC(date);
          periodEnd = endOfMonthUTC(date);
          break;
      }
    }

    // Aggregate counts (use latest snapshot's values for the period)
    // For multiple snapshots in a period, we use the latest one
    const latestSnapshot = periodSnapshots[periodSnapshots.length - 1];

    result.push({
      periodStart: periodStart.toISOString(),
      periodEnd: periodEnd.toISOString(),
      granularity,
      localCount: latestSnapshot.localCount,
      remoteCount: latestSnapshot.remoteCount,
      totalCount: latestSnapshot.totalCount,
      bothCount: latestSnapshot.bothCount,
      unknownCount: latestSnapshot.unknownCount,
      snapshotCount: periodSnapshots.length,
    });
  }

  // Sort by period start time
  result.sort((a, b) => 
    new Date(a.periodStart).getTime() - new Date(b.periodStart).getTime()
  );

  return result;
}

export function decimateData(
  data: TimeSeriesDataPoint[],
  maxPoints: number = 1000
): TimeSeriesDataPoint[] {
  if (data.length <= maxPoints) return data;

  const step = Math.ceil(data.length / maxPoints);
  const result: TimeSeriesDataPoint[] = [];

  for (let i = 0; i < data.length; i += step) {
    result.push(data[i]);
  }

  // Always include the last point
  if (result[result.length - 1] !== data[data.length - 1]) {
    result.push(data[data.length - 1]);
  }

  return result;
}



