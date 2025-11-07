'use client';

import { Granularity } from '@/lib/types/analytics';

interface GranularitySelectorProps {
  value: Granularity;
  onChange: (value: Granularity) => void;
}

export function GranularitySelector({ value, onChange }: GranularitySelectorProps) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
        Time Granularity
      </label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value as Granularity)}
        className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
      >
        <option value="hourly">Hourly</option>
        <option value="daily">Daily</option>
        <option value="weekly">Weekly</option>
        <option value="monthly">Monthly</option>
      </select>
    </div>
  );
}


