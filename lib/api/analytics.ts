import { AnalyticsSnapshot } from '@/lib/types/analytics';

const CACHE_KEY = 'mcp-analytics-cache';
const CACHE_TIMESTAMP_KEY = 'mcp-analytics-cache-timestamp';
const CACHE_MAX_AGE = 5 * 60 * 1000; // 5 minutes
const API_TIMEOUT = 10000; // 10 seconds
const MAX_RETRIES = 3;
const RETRY_DELAYS = [1000, 2000, 4000]; // 1s, 2s, 4s

let currentAbortController: AbortController | null = null;

// Removed unused getCachedData function - use getStaleCachedData and getCacheTimestamp instead

function getStaleCachedData(): AnalyticsSnapshot[] | null {
  if (typeof window === 'undefined') return null;
  
  const cached = localStorage.getItem(CACHE_KEY);
  if (!cached) {
    return null;
  }
  
  try {
    return JSON.parse(cached);
  } catch {
    return null;
  }
}

function setCachedData(data: AnalyticsSnapshot[]): void {
  if (typeof window === 'undefined') return;
  
  localStorage.setItem(CACHE_KEY, JSON.stringify(data));
  localStorage.setItem(CACHE_TIMESTAMP_KEY, Date.now().toString());
}

function getCacheTimestamp(): number | null {
  if (typeof window === 'undefined') return null;
  
  const timestamp = localStorage.getItem(CACHE_TIMESTAMP_KEY);
  return timestamp ? parseInt(timestamp, 10) : null;
}

function validateAnalyticsData(data: unknown): data is AnalyticsSnapshot[] {
  if (!Array.isArray(data)) {
    return false;
  }
  
  return data.every(snapshot => {
    return (
      typeof snapshot === 'object' &&
      snapshot !== null &&
      typeof snapshot.timestamp === 'string' &&
      typeof snapshot.localCount === 'number' &&
      snapshot.localCount >= 0 &&
      typeof snapshot.remoteCount === 'number' &&
      snapshot.remoteCount >= 0 &&
      typeof snapshot.totalCount === 'number' &&
      snapshot.totalCount >= 0 &&
      typeof snapshot.bothCount === 'number' &&
      snapshot.bothCount >= 0 &&
      typeof snapshot.unknownCount === 'number' &&
      snapshot.unknownCount >= 0
    );
  });
}

async function fetchWithTimeout(
  url: string,
  timeout: number,
  signal: AbortSignal
): Promise<Response> {
  // Check if already aborted
  if (signal.aborted) {
    throw new Error('Request was cancelled');
  }
  
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);
  
  // Listen to the provided signal and abort our controller if it aborts
  const abortHandler = () => {
    if (!controller.signal.aborted) {
      controller.abort();
    }
  };
  
  // Only add listener if signal is not already aborted
  if (!signal.aborted) {
    signal.addEventListener('abort', abortHandler, { once: true });
  }
  
  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        'Accept': 'application/json',
      },
    });
    clearTimeout(timeoutId);
    if (!signal.aborted) {
      signal.removeEventListener('abort', abortHandler);
    }
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    if (!signal.aborted) {
      signal.removeEventListener('abort', abortHandler);
    }
    
    // If the signal was aborted, throw a more descriptive error
    if (signal.aborted || (error instanceof Error && error.name === 'AbortError')) {
      throw new Error('Request was cancelled');
    }
    
    throw error;
  }
}

export async function fetchAnalytics(abortSignal?: AbortSignal): Promise<AnalyticsSnapshot[]> {
  // Create abort controller if not provided
  let controller: AbortController;
  let signal: AbortSignal;
  
  if (abortSignal) {
    signal = abortSignal;
    // Don't use global controller if custom signal provided
  } else {
    // Cancel previous request if still in flight
    if (currentAbortController && !currentAbortController.signal.aborted) {
      currentAbortController.abort();
    }
    controller = new AbortController();
    signal = controller.signal;
    currentAbortController = controller;
  }
  
  let lastError: Error | null = null;
  
  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    // Check if request was aborted before retrying
    if (signal.aborted) {
      throw new Error('Request was cancelled');
    }
    
    try {
      const response = await fetchWithTimeout(
        '/data/analytics-latest.json',
        API_TIMEOUT,
        signal
      );
      
      if (!response.ok) {
        throw new Error(`Failed to fetch analytics: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      // Validate response structure
      if (!validateAnalyticsData(data)) {
        throw new Error('Invalid analytics data format');
      }
      
      // Cache successful response
      setCachedData(data);
      
      return data;
    } catch (error) {
      lastError = error as Error;
      
      // Don't retry if aborted or cancelled
      if (
        error instanceof Error && 
        (error.name === 'AbortError' || error.message === 'Request was cancelled')
      ) {
        throw error;
      }
      
      // Don't retry on last attempt
      if (attempt < MAX_RETRIES - 1) {
        const delay = RETRY_DELAYS[attempt];
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  
  // If all retries failed, try to return stale cached data with indicator
  const staleCached = getStaleCachedData();
  if (staleCached) {
    const cacheTimestamp = getCacheTimestamp();
    const staleError = new Error(`Unable to fetch latest analytics. Showing cached data from ${cacheTimestamp ? new Date(cacheTimestamp).toLocaleString() : 'unknown time'}.`) as Error & {cachedData: AnalyticsSnapshot[]; isStale: boolean};
    // Attach cached data to error so UI can display it
    staleError.cachedData = staleCached;
    staleError.isStale = true;
    throw staleError;
  }
  
  throw lastError || new Error('Unable to connect to analytics service. Please try again later.');
}

export function getCacheStalenessInfo(): { timestamp: number | null; isStale: boolean } | null {
  const timestamp = getCacheTimestamp();
  if (!timestamp) return null;
  
  const age = Date.now() - timestamp;
  return {
    timestamp,
    isStale: age > CACHE_MAX_AGE,
  };
}

export function cancelFetch(): void {
  if (currentAbortController && !currentAbortController.signal.aborted) {
    currentAbortController.abort();
    currentAbortController = null;
  }
}

