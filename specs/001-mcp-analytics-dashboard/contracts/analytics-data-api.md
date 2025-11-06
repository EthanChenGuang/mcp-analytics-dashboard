# Analytics Data API Contract

**API**: Aggregated Analytics Data  
**Purpose**: Client-side API for fetching pre-aggregated analytics snapshots

## Overview

The analytics data is pre-aggregated by GitHub Actions and stored as static JSON files. The client fetches these files to display time-series charts.

## Data Storage

### File Location

- **Repository**: Stored in `public/data/` directory (or committed to repository)
- **Naming**: `analytics-YYYY-MM-DD-HH.json` (hourly snapshots)
- **Alternative**: Single `analytics-latest.json` file updated hourly

### File Format

**Schema**: Array of `AnalyticsSnapshot` objects

```typescript
Array<{
  timestamp: string;        // ISO 8601 UTC timestamp
  localCount: number;
  remoteCount: number;
  totalCount: number;
  bothCount: number;
  unknownCount: number;
}>
```

### Example File

```json
[
  {
    "timestamp": "2025-01-27T00:00:00Z",
    "localCount": 42,
    "remoteCount": 28,
    "totalCount": 65,
    "bothCount": 5,
    "unknownCount": 1
  },
  {
    "timestamp": "2025-01-27T01:00:00Z",
    "localCount": 43,
    "remoteCount": 29,
    "totalCount": 67,
    "bothCount": 5,
    "unknownCount": 1
  }
]
```

## Client API

### Fetch Latest Analytics

**Endpoint**: `/data/analytics-latest.json` (or latest file by timestamp)

**Method**: `GET`

**Response**: `AnalyticsSnapshot[]`

**TypeScript Interface**:
```typescript
interface AnalyticsClient {
  fetchAnalytics(): Promise<AnalyticsSnapshot[]>;
}
```

### Implementation

```typescript
// lib/api/analytics.ts

export async function fetchAnalytics(): Promise<AnalyticsSnapshot[]> {
  const response = await fetch('/data/analytics-latest.json', {
    method: 'GET',
    headers: {
      'Accept': 'application/json',
    },
    // Timeout: 10 seconds (per SC-010)
    signal: AbortSignal.timeout(10000),
  });
  
  if (!response.ok) {
    throw new Error(`Failed to fetch analytics: ${response.statusText}`);
  }
  
  const data = await response.json();
  
  // Validate response structure
  if (!Array.isArray(data)) {
    throw new Error('Invalid analytics data format');
  }
  
  return data;
}
```

## Error Handling

### Network Errors

**Strategy**: Exponential backoff retry (1s, 2s, 4s intervals, max 3 attempts)

**Implementation**:
```typescript
async function fetchWithRetry(
  url: string,
  maxAttempts: number = 3
): Promise<AnalyticsSnapshot[]> {
  let lastError: Error | null = null;
  
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      return await fetchAnalytics();
    } catch (error) {
      lastError = error as Error;
      if (attempt < maxAttempts - 1) {
        const delay = Math.pow(2, attempt) * 1000; // 1s, 2s, 4s
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  
  throw lastError || new Error('Failed to fetch analytics after retries');
}
```

### Cached Data Fallback

**Strategy**: Store successful responses in localStorage, use as fallback

**Implementation**:
```typescript
const CACHE_KEY = 'mcp-analytics-cache';
const CACHE_TIMESTAMP_KEY = 'mcp-analytics-cache-timestamp';
const CACHE_MAX_AGE = 5 * 60 * 1000; // 5 minutes

function getCachedData(): AnalyticsSnapshot[] | null {
  const cached = localStorage.getItem(CACHE_KEY);
  const timestamp = localStorage.getItem(CACHE_TIMESTAMP_KEY);
  
  if (!cached || !timestamp) {
    return null;
  }
  
  const age = Date.now() - parseInt(timestamp, 10);
  if (age > CACHE_MAX_AGE) {
    return null; // Cache expired
  }
  
  try {
    return JSON.parse(cached);
  } catch {
    return null;
  }
}

function setCachedData(data: AnalyticsSnapshot[]): void {
  localStorage.setItem(CACHE_KEY, JSON.stringify(data));
  localStorage.setItem(CACHE_TIMESTAMP_KEY, Date.now().toString());
}
```

### Error States

**User-Facing Messages**:
- **Network Error**: "Unable to connect to analytics service. Please try again later."
- **Cached Data Available**: "Unable to fetch latest analytics. Showing cached data from [timestamp]."
- **No Cache**: "Unable to connect to analytics service. Please try again later."

## Data Validation

### Response Validation

```typescript
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
```

## Performance Considerations

### Request Timeout

- **Timeout**: 10 seconds (per SC-010)
- **Implementation**: Use `AbortSignal.timeout()` or `setTimeout` with `AbortController`

### Caching Strategy

- **Cache Duration**: 5 minutes (per SC-005: no more than 5 minutes staleness)
- **Storage**: localStorage (client-side)
- **Invalidation**: On successful fetch or manual refresh

### Request Cancellation

- **Strategy**: Cancel in-flight requests when user changes filters/granularity
- **Implementation**: Use `AbortController` to cancel previous requests

```typescript
let abortController: AbortController | null = null;

export async function fetchAnalytics(): Promise<AnalyticsSnapshot[]> {
  // Cancel previous request if still in flight
  if (abortController) {
    abortController.abort();
  }
  
  abortController = new AbortController();
  
  const response = await fetch('/data/analytics-latest.json', {
    signal: abortController.signal,
    // ... other options
  });
  
  // ... handle response
}
```

## GitHub Actions Integration

### Workflow Contract

**File**: `.github/workflows/aggregate-analytics.yml`

**Schedule**: Runs every hour (cron: `0 * * * *`)

**Steps**:
1. Fetch all pages from MCP Registry API (using pagination)
2. Classify each server (local/remote/both/unknown)
3. Count servers by type
4. Create `AnalyticsSnapshot` with current timestamp
5. Append to analytics data file (or update latest file)
6. Commit and push changes (if storing in repository)

### Output Format

**File**: `public/data/analytics-latest.json`

**Content**: Array of `AnalyticsSnapshot` objects, sorted by timestamp (ascending)

**Update Strategy**: Append new snapshot hourly, maintain last N snapshots (e.g., last 30 days for daily view)

## Notes

- All timestamps are in UTC (ISO 8601 format)
- Client converts timestamps to user's local timezone for display
- Data aggregation (hourly → daily/weekly/monthly) happens client-side
- Filtering (all/local/remote) happens client-side



