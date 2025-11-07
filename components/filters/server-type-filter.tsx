'use client';

import { FilterState } from '@/lib/types/analytics';

interface ServerTypeFilterProps {
  value: FilterState;
  onChange: (value: FilterState) => void;
}

export function ServerTypeFilter({ value, onChange }: ServerTypeFilterProps) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
        Server Type
      </label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value as FilterState)}
        className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
      >
        <option value="all">Total Servers</option>
        <option value="show-all">Show All Types</option>
        <option value="local">Local Only</option>
        <option value="remote">Remote Only</option>
      </select>
    </div>
  );
}

