'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import { AnalyticsSnapshot, FilterState, Granularity } from '@/lib/types/analytics';
import { fetchAnalytics } from '@/lib/api/analytics';
import { aggregateByGranularity, decimateData } from '@/lib/utils/data-aggregation';
import { filterByTimeRange, filterTimeSeriesByRange } from '@/lib/utils/time-filter';
import { TimeSeriesChart } from '@/components/charts/time-series-chart';
import { ChartWrapper } from '@/components/charts/chart-wrapper';
import { ServerTypeFilter } from '@/components/filters/server-type-filter';
import { GranularitySelector } from '@/components/filters/granularity-selector';
import { TimeRangePicker } from '@/components/filters/time-range-picker';

export default function DashboardPage() {
  const [data, setData] = useState<AnalyticsSnapshot[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [staleWarning, setStaleWarning] = useState<string | null>(null);
  const [filter, setFilter] = useState<FilterState>('all');
  const [granularity, setGranularity] = useState<Granularity>('daily');
  const [startDate, setStartDate] = useState<string | null>(null);
  const [endDate, setEndDate] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    setStaleWarning(null);
    
    try {
      const analytics = await fetchAnalytics();
      setData(analytics);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load analytics data';
      
      // Don't show error for cancelled/aborted requests (these are expected during development/React Strict Mode)
      if (
        errorMessage.toLowerCase().includes('cancelled') || 
        errorMessage.toLowerCase().includes('aborted') ||
        errorMessage.includes('AbortError')
      ) {
        // Silently handle cancellation - this is normal in development
        console.log('Request cancelled (this is normal in development mode)');
        return;
      }
      
      // Check if error contains stale cached data
      const errorWithCache = err as Error & {isStale?: boolean; cachedData?: AnalyticsSnapshot[]};
      if (errorWithCache.isStale && errorWithCache.cachedData) {
        setData(errorWithCache.cachedData);
        setStaleWarning(errorMessage);
      } else {
        setError(errorMessage);
        console.error('Error fetching analytics:', err);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let isMounted = true;
    
    const loadDataSafe = async () => {
      await loadData();
      if (!isMounted) {
        // Component unmounted, don't update state
        return;
      }
    };

    loadDataSafe();

    // Cleanup: mark as unmounted
    return () => {
      isMounted = false;
    };
  }, [loadData]);

  // Calculate min/max dates from data for time range picker
  const { minDate, maxDate } = useMemo(() => {
    if (data.length === 0) {
      return { minDate: undefined, maxDate: undefined };
    }
    
    const timestamps = data.map(s => new Date(s.timestamp).getTime());
    const min = new Date(Math.min(...timestamps));
    const max = new Date(Math.max(...timestamps));
    
    // Format for date input (YYYY-MM-DD)
    const formatForInput = (date: Date) => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };
    
    return {
      minDate: formatForInput(min),
      maxDate: formatForInput(max),
    };
  }, [data]);

  // Filter raw data by time range
  const timeFilteredData = useMemo(() => {
    return filterByTimeRange(data, startDate, endDate);
  }, [data, startDate, endDate]);

  // Aggregate data based on granularity
  const aggregatedData = useMemo(() => {
    return aggregateByGranularity(timeFilteredData, granularity);
  }, [timeFilteredData, granularity]);

  // Apply data decimation for large datasets (> 1000 points)
  const decimatedData = useMemo(() => {
    return decimateData(aggregatedData, 1000);
  }, [aggregatedData]);

  // Filter data points by time range (in case aggregation created points outside range)
  const timeFilteredPoints = useMemo(() => {
    return filterTimeSeriesByRange(decimatedData, startDate, endDate);
  }, [decimatedData, startDate, endDate]);

  // Chart data - no need to modify for filter since chart handles it now
  const chartData = timeFilteredPoints;

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 transition-colors">
      <div className="container mx-auto px-2 sm:px-4 py-4 sm:py-8 max-w-7xl">
        <header className="mb-6 sm:mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 dark:text-white mb-2">
                MCP Analytics Dashboard
              </h1>
              <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">
                Model Context Protocol server statistics
              </p>
            </div>
            <button
              onClick={loadData}
              disabled={loading}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400 text-white rounded-md text-sm font-medium transition-colors flex items-center gap-2"
              aria-label="Refresh analytics data"
            >
              <svg 
                className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Refresh
            </button>
          </div>
        </header>

        {staleWarning && (
          <div className="mb-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
            <p className="text-sm text-yellow-800 dark:text-yellow-200">{staleWarning}</p>
          </div>
        )}

        <div className="mb-4 sm:mb-6">
          <div className="flex flex-col lg:flex-row flex-wrap gap-3 sm:gap-4 items-start lg:items-end">
            <ServerTypeFilter value={filter} onChange={setFilter} />
            <GranularitySelector value={granularity} onChange={setGranularity} />
            <TimeRangePicker
              startDate={startDate}
              endDate={endDate}
              onStartDateChange={setStartDate}
              onEndDateChange={setEndDate}
              minDate={minDate}
              maxDate={maxDate}
            />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-4 sm:p-6 border border-gray-200 dark:border-gray-700">
          <h2 className="text-xl sm:text-2xl font-semibold text-gray-900 dark:text-white mb-4">
            Server Count Over Time
          </h2>
          <ChartWrapper loading={loading} error={error} empty={chartData.length === 0}>
            <TimeSeriesChart 
              data={chartData} 
              filter={filter} 
              granularity={granularity}
            />
          </ChartWrapper>
        </div>

        {data.length > 0 && (
          <div className="mt-4 sm:mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4 border border-purple-200 dark:border-purple-800">
              <p className="text-sm text-purple-600 dark:text-purple-400">Total Servers</p>
              <p className="text-2xl font-bold text-purple-900 dark:text-purple-100">
                {data[data.length - 1]?.totalCount || 0}
              </p>
            </div>
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
              <p className="text-sm text-blue-600 dark:text-blue-400">Local Servers</p>
              <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">
                {data[data.length - 1]?.localCount || 0}
              </p>
            </div>
            <div className="bg-pink-50 dark:bg-pink-900/20 rounded-lg p-4 border border-pink-200 dark:border-pink-800">
              <p className="text-sm text-pink-600 dark:text-pink-400">Remote Servers</p>
              <p className="text-2xl font-bold text-pink-900 dark:text-pink-100">
                {data[data.length - 1]?.remoteCount || 0}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

