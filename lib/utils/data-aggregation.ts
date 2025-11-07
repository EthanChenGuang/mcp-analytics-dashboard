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
          periodStart = startOfHour(date);
          periodKey = format(periodStart, "yyyy-MM-dd'T'HH:mm:ss");
          break;
        case 'daily':
          periodStart = startOfDay(date);
          periodKey = format(periodStart, 'yyyy-MM-dd');
          break;
        case 'weekly':
          periodStart = startOfWeek(date, { weekStartsOn: 1 }); // Monday
          periodKey = format(periodStart, 'yyyy-MM-dd');
          break;
        case 'monthly':
          periodStart = startOfMonth(date);
          periodKey = format(periodStart, 'yyyy-MM');
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
          periodStart = startOfHour(date);
          periodEnd = endOfHour(date);
          break;
        case 'daily':
          periodStart = startOfDay(date);
          periodEnd = endOfDay(date);
          break;
        case 'weekly':
          periodStart = startOfWeek(date, { weekStartsOn: 1 });
          periodEnd = endOfWeek(date, { weekStartsOn: 1 });
          break;
        case 'monthly':
          periodStart = startOfMonth(date);
          periodEnd = endOfMonth(date);
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



