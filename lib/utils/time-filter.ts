import { AnalyticsSnapshot, TimeSeriesDataPoint } from '@/lib/types/analytics';

/**
 * Filter snapshots by time range
 * Dates are in YYYY-MM-DD format, comparison is done at day level
 */
export function filterByTimeRange(
  snapshots: AnalyticsSnapshot[],
  startDate: string | null,
  endDate: string | null
): AnalyticsSnapshot[] {
  if (!startDate && !endDate) {
    return snapshots;
  }

  return snapshots.filter((snapshot) => {
    const snapshotDate = new Date(snapshot.timestamp);
    // Compare at day level (set time to start of day)
    const snapshotDay = new Date(snapshotDate.getFullYear(), snapshotDate.getMonth(), snapshotDate.getDate()).getTime();
    
    if (startDate) {
      const startDay = new Date(startDate + 'T00:00:00').getTime();
      if (snapshotDay < startDay) {
        return false;
      }
    }
    
    if (endDate) {
      // End date should include the entire day, so compare with end of day
      const endDay = new Date(endDate + 'T23:59:59').getTime();
      if (snapshotDay > endDay) {
        return false;
      }
    }
    
    return true;
  });
}

/**
 * Filter time series data points by time range
 * Dates are in YYYY-MM-DD format, comparison is done at day level
 */
export function filterTimeSeriesByRange(
  dataPoints: TimeSeriesDataPoint[],
  startDate: string | null,
  endDate: string | null
): TimeSeriesDataPoint[] {
  if (!startDate && !endDate) {
    return dataPoints;
  }

  return dataPoints.filter((point) => {
    const pointStart = new Date(point.periodStart);
    const pointEnd = new Date(point.periodEnd);
    
    // Compare at day level
    const pointStartDay = new Date(pointStart.getFullYear(), pointStart.getMonth(), pointStart.getDate()).getTime();
    const pointEndDay = new Date(pointEnd.getFullYear(), pointEnd.getMonth(), pointEnd.getDate()).getTime();
    
    if (startDate) {
      const startDay = new Date(startDate + 'T00:00:00').getTime();
      if (pointEndDay < startDay) {
        return false;
      }
    }
    
    if (endDate) {
      // End date should include the entire day
      const endDay = new Date(endDate + 'T23:59:59').getTime();
      if (pointStartDay > endDay) {
        return false;
      }
    }
    
    return true;
  });
}

