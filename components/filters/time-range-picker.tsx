'use client';

import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { format } from 'date-fns';

interface TimeRangePickerProps {
  startDate: string | null;
  endDate: string | null;
  onStartDateChange: (date: string | null) => void;
  onEndDateChange: (date: string | null) => void;
  minDate?: string;
  maxDate?: string;
}

export function TimeRangePicker({
  startDate,
  endDate,
  onStartDateChange,
  onEndDateChange,
  minDate,
  maxDate,
}: TimeRangePickerProps) {
  // Convert string dates to Date objects for DatePicker
  const startDateObj = startDate ? new Date(startDate + 'T00:00:00') : null;
  const endDateObj = endDate ? new Date(endDate + 'T23:59:59') : null;
  const minDateObj = minDate ? new Date(minDate + 'T00:00:00') : undefined;
  const maxDateObj = maxDate ? new Date(maxDate + 'T23:59:59') : undefined;

  const handleStartDateChange = (date: Date | null) => {
    if (date) {
      const formatted = format(date, 'yyyy-MM-dd');
      onStartDateChange(formatted);
    } else {
      onStartDateChange(null);
    }
  };

  const handleEndDateChange = (date: Date | null) => {
    if (date) {
      const formatted = format(date, 'yyyy-MM-dd');
      onEndDateChange(formatted);
    } else {
      onEndDateChange(null);
    }
  };

  // Custom input component for consistent styling
  const CustomInput = ({ value, onClick }: { value?: string; onClick?: () => void }) => (
    <input
      type="text"
      value={value || ''}
      onClick={onClick}
      readOnly
      placeholder="mm/dd/yyyy"
      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-colors hover:border-purple-400 dark:hover:border-purple-500 cursor-pointer"
    />
  );

  return (
    <div className="flex flex-row items-end gap-3 sm:gap-4 flex-wrap">
      <div className="flex-shrink-0 min-w-[160px]">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Start Date
        </label>
        <DatePicker
          selected={startDateObj}
          onChange={handleStartDateChange}
          minDate={minDateObj}
          maxDate={endDateObj || maxDateObj}
          customInput={<CustomInput />}
          dateFormat="MM/dd/yyyy"
          placeholderText="mm/dd/yyyy"
          className="w-full"
          wrapperClassName="w-full"
          popperClassName="date-picker-popper"
        />
      </div>
      <div className="flex-shrink-0 min-w-[160px]">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          End Date
        </label>
        <DatePicker
          selected={endDateObj}
          onChange={handleEndDateChange}
          minDate={startDateObj || minDateObj}
          maxDate={maxDateObj}
          customInput={<CustomInput />}
          dateFormat="MM/dd/yyyy"
          placeholderText="mm/dd/yyyy"
          className="w-full"
          wrapperClassName="w-full"
          popperClassName="date-picker-popper"
        />
      </div>
      {(startDate || endDate) && (
        <div className="flex items-end flex-shrink-0">
          <button
            onClick={() => {
              onStartDateChange(null);
              onEndDateChange(null);
            }}
            className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-purple-600 dark:hover:text-purple-400 underline transition-colors"
            aria-label="Clear date range"
          >
            Clear
          </button>
        </div>
      )}
    </div>
  );
}
