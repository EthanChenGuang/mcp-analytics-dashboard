'use client';

import { ReactNode, useEffect, useState } from 'react';

interface ChartWrapperProps {
  children: ReactNode;
  loading?: boolean;
  error?: string | null;
  empty?: boolean;
}

export function ChartWrapper({ children, loading, error, empty }: ChartWrapperProps) {
  const [showProgressiveMessage, setShowProgressiveMessage] = useState(false);

  useEffect(() => {
    if (loading) {
      // Show progressive loading message after 3 seconds
      const timer = setTimeout(() => {
        setShowProgressiveMessage(true);
      }, 3000);

      return () => clearTimeout(timer);
    } else {
      setShowProgressiveMessage(false);
    }
  }, [loading]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px] w-full">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto mb-3"></div>
          <p className="text-sm text-gray-600 dark:text-gray-400">Loading analytics data...</p>
          {showProgressiveMessage && (
            <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">
              Fetching analytics data... This may take a moment.
            </p>
          )}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px] w-full">
        <div className="text-center p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800 max-w-md">
          <p className="text-red-800 dark:text-red-200 font-medium mb-1">Error loading data</p>
          <p className="text-sm text-red-600 dark:text-red-300">{error}</p>
        </div>
      </div>
    );
  }

  if (empty) {
    return (
      <div className="flex items-center justify-center min-h-[400px] w-full">
        <div className="text-center p-4">
          <p className="text-gray-600 dark:text-gray-400">No analytics data available yet.</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}



