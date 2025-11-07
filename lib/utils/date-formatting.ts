import { Granularity } from '@/lib/types/analytics';
import { format } from 'date-fns';

export function formatDateForAxis(date: Date, granularity: Granularity): string {
  switch (granularity) {
    case 'hourly':
      return format(date, 'HH:mm');
    case 'daily':
      return format(date, 'MMM d');
    case 'weekly':
      return format(date, 'MMM d');
    case 'monthly':
      return format(date, 'MMM yyyy');
  }
}

export function convertUTCToLocal(utcTimestamp: string): Date {
  return new Date(utcTimestamp);
}




