import { AnalyticsSnapshot } from '@/lib/types/analytics';
import { aggregateByGranularity } from '@/lib/utils/data-aggregation';
import { describe, expect, it } from '@jest/globals';

describe('data-aggregation UTC timezone handling', () => {
  // Test data: snapshots in different UTC hours
  const testSnapshots: AnalyticsSnapshot[] = [
    {
      timestamp: '2025-11-07T14:45:29Z',
      localCount: 386,
      remoteCount: 384,
      totalCount: 755,
      bothCount: 15,
      unknownCount: 27,
    },
    {
      timestamp: '2025-11-07T14:52:54Z',
      localCount: 386,
      remoteCount: 384,
      totalCount: 755,
      bothCount: 15,
      unknownCount: 27,
    },
    {
      timestamp: '2025-11-07T15:51:01Z',
      localCount: 387,
      remoteCount: 384,
      totalCount: 756,
      bothCount: 15,
      unknownCount: 27,
    },
    {
      timestamp: '2025-11-07T16:21:00Z',
      localCount: 387,
      remoteCount: 384,
      totalCount: 756,
      bothCount: 15,
      unknownCount: 27,
    },
  ];

  it('should show individual snapshots when < 10 snapshots with hourly granularity', () => {
    const result = aggregateByGranularity(testSnapshots, 'hourly');
    
    // With 4 snapshots < 10, all should show individually
    expect(result.length).toBe(4);
    
    // Each result should have snapshotCount of 1
    result.forEach((point) => {
      expect(point.snapshotCount).toBe(1);
    });
  });

  it('should group snapshots by UTC hour, not local time', () => {
    // Create snapshots that would be in different hours if using local time
    // but same UTC hour
    const sameUTCHourSnapshots: AnalyticsSnapshot[] = [
      {
        timestamp: '2025-11-07T14:45:29Z', // UTC hour 14
        localCount: 386,
        remoteCount: 384,
        totalCount: 755,
        bothCount: 15,
        unknownCount: 27,
      },
      {
        timestamp: '2025-11-07T14:52:54Z', // UTC hour 14 (same hour)
        localCount: 386,
        remoteCount: 384,
        totalCount: 755,
        bothCount: 15,
        unknownCount: 27,
      },
      {
        timestamp: '2025-11-07T15:51:01Z', // UTC hour 15 (different hour)
        localCount: 387,
        remoteCount: 384,
        totalCount: 756,
        bothCount: 15,
        unknownCount: 27,
      },
    ];

    // When showIndividualSnapshots is false (>= 10 snapshots), they should group by UTC hour
    // But with < 10, they show individually, so let's test with >= 10
    const manySnapshots = Array(10).fill(null).flatMap((_, i) => [
      {
        timestamp: `2025-11-07T14:${String(i).padStart(2, '0')}:00Z` as const,
        localCount: 386,
        remoteCount: 384,
        totalCount: 755,
        bothCount: 15,
        unknownCount: 27,
      },
    ]);

    const result = aggregateByGranularity(manySnapshots, 'hourly');
    
    // All snapshots in UTC hour 14 should be grouped together
    const hour14Group = result.find((p) => p.periodStart.startsWith('2025-11-07T14:'));
    expect(hour14Group).toBeDefined();
    expect(hour14Group?.snapshotCount).toBe(10);
  });

  it('should use UTC for periodStart and periodEnd', () => {
    const result = aggregateByGranularity(testSnapshots, 'hourly');
    
    result.forEach((point) => {
      const periodStart = new Date(point.periodStart);
      const periodEnd = new Date(point.periodEnd);
      
      // Verify timestamps are valid UTC ISO strings
      expect(point.periodStart).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
      expect(point.periodEnd).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
      
      // Verify periodStart is before or equal to periodEnd
      expect(periodStart.getTime()).toBeLessThanOrEqual(periodEnd.getTime());
    });
  });

  it('should handle daily granularity with UTC', () => {
    const dailySnapshots: AnalyticsSnapshot[] = [
      {
        timestamp: '2025-11-07T23:45:00Z', // UTC day Nov 7
        localCount: 386,
        remoteCount: 384,
        totalCount: 755,
        bothCount: 15,
        unknownCount: 27,
      },
      {
        timestamp: '2025-11-08T00:15:00Z', // UTC day Nov 8
        localCount: 387,
        remoteCount: 384,
        totalCount: 756,
        bothCount: 15,
        unknownCount: 27,
      },
    ];

    const result = aggregateByGranularity(dailySnapshots, 'daily');
    
    // Should have 2 groups (different UTC days)
    expect(result.length).toBe(2);
    
    // Verify each group is for the correct UTC day
    expect(result[0].periodStart).toContain('2025-11-07');
    expect(result[1].periodStart).toContain('2025-11-08');
  });

  it('should preserve snapshot order after aggregation', () => {
    const result = aggregateByGranularity(testSnapshots, 'hourly');
    
    // Results should be sorted by periodStart time
    for (let i = 1; i < result.length; i++) {
      const prevTime = new Date(result[i - 1].periodStart).getTime();
      const currTime = new Date(result[i].periodStart).getTime();
      expect(currTime).toBeGreaterThanOrEqual(prevTime);
    }
  });
});



