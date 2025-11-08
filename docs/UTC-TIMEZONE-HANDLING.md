# UTC Timezone Handling - Best Practices

## Issue Summary

The data aggregation logic was incorrectly using local timezone functions from `date-fns`, which caused snapshots to be grouped incorrectly when users were in different timezones. This resulted in missing or incorrectly grouped data points on the hourly chart.

## Root Cause

- `date-fns` functions like `startOfHour()`, `format()`, etc. operate in the **local timezone** of the system
- Analytics snapshots use **UTC timestamps** (ISO 8601 format with 'Z' suffix)
- When grouping snapshots by hour/day/week/month, using local timezone caused:
  - Snapshots in the same UTC hour to be grouped differently
  - Inconsistent behavior across different deployment environments
  - Missing data points on charts

## Solution Implemented

### 1. UTC-Specific Helper Functions

Created UTC-specific functions in `lib/utils/data-aggregation.ts`:

- `startOfHourUTC()` - Get start of hour in UTC
- `endOfHourUTC()` - Get end of hour in UTC
- `startOfDayUTC()` - Get start of day in UTC
- `endOfDayUTC()` - Get end of day in UTC
- `startOfWeekUTC()` - Get start of week (Monday) in UTC
- `endOfWeekUTC()` - Get end of week (Sunday) in UTC
- `startOfMonthUTC()` - Get start of month in UTC
- `endOfMonthUTC()` - Get end of month in UTC
- `formatUTC()` - Format dates in UTC timezone

### 2. Key Changes

**Before:**
```typescript
periodStart = startOfHour(date);  // Uses local timezone!
periodKey = format(periodStart, "yyyy-MM-dd'T'HH:mm:ss");  // Formats in local timezone!
```

**After:**
```typescript
periodStart = startOfHourUTC(date);  // Uses UTC
periodKey = formatUTC(periodStart, "yyyy-MM-dd'T'HH:mm:ss");  // Formats in UTC
```

## Prevention Measures

### 1. Unit Tests

Added comprehensive unit tests in `tests/lib/data-aggregation.test.ts` that verify:
- UTC timezone handling is correct
- Snapshots are grouped by UTC hour, not local time
- Period boundaries use UTC timestamps
- Results are sorted correctly

**Run tests:**
```bash
npm test
```

### 2. Data Validation Script

Created `.github/scripts/validate-analytics.sh` that checks:
- JSON validity
- Required fields present
- Timestamp format (ISO 8601 UTC)
- Counts are non-negative integers
- No duplicate timestamps
- Snapshots are sorted chronologically
- Reasonable time gaps between snapshots

**Run validation:**
```bash
./.github/scripts/validate-analytics.sh public/data/analytics-latest.json
```

### 3. GitHub Actions Workflow Integration

Updated `.github/workflows/aggregate-analytics.yml` to:
- Run validation after aggregation
- Check for missing snapshots (warns if last snapshot > 2 hours old)
- Fail the workflow if validation fails

### 4. Code Review Checklist

When working with date/time operations:

- [ ] Always use UTC for data storage and aggregation
- [ ] Use UTC-specific helper functions (`startOfHourUTC`, `formatUTC`, etc.)
- [ ] Convert to local timezone **only** for display purposes
- [ ] Test with different timezones (UTC, UTC+2, UTC-5, etc.)
- [ ] Verify timestamps are ISO 8601 format with 'Z' suffix
- [ ] Check that grouping logic uses UTC consistently

## Best Practices

### ✅ DO

1. **Always use UTC for data operations:**
   ```typescript
   const utcHour = date.getUTCHours();
   const utcDate = new Date(Date.UTC(year, month, day, hour, minute, second));
   ```

2. **Use UTC helper functions for aggregation:**
   ```typescript
   periodStart = startOfHourUTC(date);
   periodKey = formatUTC(periodStart, "yyyy-MM-dd'T'HH:mm:ss");
   ```

3. **Convert to local time only for display:**
   ```typescript
   const localDate = convertUTCToLocal(utcTimestamp);
   const displayLabel = formatDateForAxis(localDate, granularity);
   ```

4. **Validate timestamps are UTC:**
   ```typescript
   if (!timestamp.endsWith('Z')) {
     throw new Error('Timestamp must be in UTC format');
   }
   ```

### ❌ DON'T

1. **Don't use local timezone functions for data aggregation:**
   ```typescript
   // ❌ WRONG
   periodStart = startOfHour(date);  // Uses local timezone!
   periodKey = format(periodStart, "yyyy-MM-dd'T'HH:mm:ss");  // Formats in local time!
   ```

2. **Don't mix UTC and local time operations:**
   ```typescript
   // ❌ WRONG
   const utcDate = new Date(timestamp);  // OK
   const localHour = utcDate.getHours();  // ❌ Uses local timezone!
   ```

3. **Don't assume timezone context:**
   ```typescript
   // ❌ WRONG
   const hour = date.getHours();  // Which timezone? Ambiguous!
   ```

## Testing Different Timezones

To test timezone handling:

```bash
# Test in UTC
TZ=UTC npm test

# Test in UTC+2 (Central European Time)
TZ=Europe/Berlin npm test

# Test in UTC-5 (Eastern Time)
TZ=America/New_York npm test
```

## Monitoring

The GitHub Actions workflow now:
1. Validates data integrity after each aggregation
2. Warns if snapshots are missing (> 2 hour gap)
3. Fails if validation errors are found

Check workflow logs regularly to catch issues early.

## Related Files

- `lib/utils/data-aggregation.ts` - UTC helper functions
- `lib/utils/date-formatting.ts` - Display formatting (converts UTC to local)
- `tests/lib/data-aggregation.test.ts` - Unit tests
- `.github/scripts/validate-analytics.sh` - Validation script
- `.github/workflows/aggregate-analytics.yml` - CI/CD workflow

## References

- [MDN: Date.getUTC* methods](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date/getUTCHours)
- [ISO 8601 Format](https://en.wikipedia.org/wiki/ISO_8601)
- [date-fns Timezone Handling](https://date-fns.org/docs/Time-Zones)



