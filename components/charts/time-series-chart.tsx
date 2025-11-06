'use client';

import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, Legend, CartesianGrid } from 'recharts';
import { TimeSeriesDataPoint, FilterState } from '@/lib/types/analytics';
import { formatDateForAxis, convertUTCToLocal } from '@/lib/utils/date-formatting';
import { useEffect, useState } from 'react';

interface TimeSeriesChartProps {
  data: TimeSeriesDataPoint[];
  filter: FilterState;
  granularity: 'hourly' | 'daily' | 'weekly' | 'monthly';
}

export function TimeSeriesChart({ data, filter, granularity }: TimeSeriesChartProps) {
  const [isDark, setIsDark] = useState(false);
  
  // Detect theme from DOM (works during SSR/static generation)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      setIsDark(document.documentElement.classList.contains('dark'));
      
      // Watch for theme changes
      const observer = new MutationObserver(() => {
        setIsDark(document.documentElement.classList.contains('dark'));
      });
      
      observer.observe(document.documentElement, {
        attributes: true,
        attributeFilter: ['class'],
      });
      
      return () => observer.disconnect();
    }
  }, []);

  // Format data for chart
  const chartData = data.map((point) => {
    const date = convertUTCToLocal(point.periodStart);
    const dateLabel = formatDateForAxis(date, granularity);

    return {
      date: dateLabel,
      localCount: point.localCount,
      remoteCount: point.remoteCount,
      totalCount: point.totalCount,
      bothCount: point.bothCount || 0,
      unknownCount: point.unknownCount || 0,
    };
  });

  const gridColor = isDark ? '#374151' : '#e5e7eb'; // gray-700 or gray-200
  const textColor = isDark ? '#f3f4f6' : '#111827'; // gray-100 or gray-900

  // Color scheme for different server types
  const colors = {
    total: isDark ? '#a855f7' : '#9333ea', // purple
    local: isDark ? '#3b82f6' : '#2563eb', // blue
    remote: isDark ? '#ec4899' : '#db2777', // pink
    both: isDark ? '#10b981' : '#059669', // green
    unknown: isDark ? '#6b7280' : '#4b5563', // gray
  };

  // Get timezone abbreviation (e.g., PST, EST, UTC)
  const timezoneAbbr = Intl.DateTimeFormat('en', { timeZoneName: 'short' }).formatToParts(new Date())
    .find(part => part.type === 'timeZoneName')?.value || 'Local';

  // Determine which lines to show based on filter
  const showAllTypes = filter === 'show-all';

  return (
    <ResponsiveContainer width="100%" height={400}>
      <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
        <XAxis 
          dataKey="date" 
          stroke={textColor}
          style={{ fontSize: '12px' }}
          label={{ 
            value: `Time (${timezoneAbbr})`, 
            position: 'insideBottom', 
            offset: -5,
            style: { textAnchor: 'middle', fill: textColor, fontSize: '11px' }
          }}
        />
        <YAxis 
          stroke={textColor}
          style={{ fontSize: '12px' }}
        />
        <Tooltip 
          contentStyle={{
            backgroundColor: isDark ? '#1f2937' : '#ffffff',
            border: `1px solid ${gridColor}`,
            borderRadius: '6px',
            color: textColor,
          }}
        />
        <Legend 
          wrapperStyle={{ color: textColor }}
        />
        {showAllTypes ? (
          <>
            <Line 
              type="monotone" 
              dataKey="totalCount" 
              stroke={colors.total}
              strokeWidth={2}
              dot={{ fill: colors.total, r: 3 }}
              name="Total Servers"
            />
            <Line 
              type="monotone" 
              dataKey="localCount" 
              stroke={colors.local}
              strokeWidth={2}
              dot={{ fill: colors.local, r: 3 }}
              name="Local Servers"
            />
            <Line 
              type="monotone" 
              dataKey="remoteCount" 
              stroke={colors.remote}
              strokeWidth={2}
              dot={{ fill: colors.remote, r: 3 }}
              name="Remote Servers"
            />
            <Line 
              type="monotone" 
              dataKey="bothCount" 
              stroke={colors.both}
              strokeWidth={2}
              dot={{ fill: colors.both, r: 3 }}
              name="Both Types"
            />
            <Line 
              type="monotone" 
              dataKey="unknownCount" 
              stroke={colors.unknown}
              strokeWidth={2}
              dot={{ fill: colors.unknown, r: 3 }}
              name="Unknown"
            />
          </>
        ) : (
          <Line 
            type="monotone" 
            dataKey={
              filter === 'local' ? 'localCount' : 
              filter === 'remote' ? 'remoteCount' : 
              'totalCount'
            }
            stroke={
              filter === 'local' ? colors.local :
              filter === 'remote' ? colors.remote :
              colors.total
            }
            strokeWidth={2}
            dot={{ 
              fill: filter === 'local' ? colors.local :
                    filter === 'remote' ? colors.remote :
                    colors.total, 
              r: 4 
            }}
            name={
              filter === 'all' ? 'Total Servers' : 
              filter === 'local' ? 'Local Servers' : 
              'Remote Servers'
            }
          />
        )}
      </LineChart>
    </ResponsiveContainer>
  );
}

