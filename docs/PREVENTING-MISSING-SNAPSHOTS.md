# Preventing Missing Snapshots

## Issue Summary

GitHub Actions workflow runs successfully but snapshots weren't being saved to the data file. This can happen due to:
- Workflow failures that aren't caught
- Git commit/push failures
- Data validation errors
- Network issues during API calls

## Prevention Measures

### 1. Validation Script

The `.github/scripts/validate-analytics.sh` script checks:
- ✅ JSON validity
- ✅ Required fields present
- ✅ Timestamp format (ISO 8601 UTC)
- ✅ Counts are valid (non-negative integers)
- ✅ No duplicate timestamps
- ✅ Snapshots are sorted chronologically
- ⚠️ Warns if time gap > 2 hours (indicates missing snapshots)

### 2. Workflow Improvements

The GitHub Actions workflow now includes:

1. **Validation Step** - Runs after aggregation to catch data issues
2. **Missing Snapshot Check** - Warns if last snapshot is > 2 hours old
3. **Error Handling** - Workflow fails if validation fails

### 3. Monitoring Checklist

Regular checks to perform:

- [ ] Review GitHub Actions workflow runs (check for failures)
- [ ] Verify latest snapshot timestamp is recent (< 2 hours old)
- [ ] Check commit history for analytics file updates
- [ ] Monitor workflow logs for warnings
- [ ] Compare snapshot count with expected number

### 4. Manual Verification

To check if snapshots are being saved:

```bash
# Check latest snapshot timestamp
jq -r '.[-1].timestamp' public/data/analytics-latest.json

# Count total snapshots
jq '. | length' public/data/analytics-latest.json

# Check for gaps > 2 hours
./.github/scripts/validate-analytics.sh public/data/analytics-latest.json

# View recent commits
git log --oneline -10 -- public/data/analytics-latest.json
```

### 5. Alerting

Consider setting up:
- GitHub Actions workflow failure notifications
- Monitoring dashboard for snapshot freshness
- Automated alerts if last snapshot > 2 hours old

## Troubleshooting

### Workflow Runs But No New Snapshot

1. Check workflow logs for errors
2. Verify git permissions (contents: write)
3. Check if validation script failed
4. Verify API is responding correctly

### Snapshots Missing

1. Check workflow run history
2. Verify cron schedule is correct (`0 * * * *` = hourly)
3. Check for failed workflow runs
4. Manually trigger workflow to test

### Data File Not Updating

1. Check git commit/push step in workflow
2. Verify branch is correct (main/master)
3. Check for merge conflicts
4. Verify file permissions

## Best Practices

1. **Always validate** data after aggregation
2. **Monitor workflow runs** regularly
3. **Set up alerts** for workflow failures
4. **Document** any manual fixes needed
5. **Test workflow** manually before relying on cron

## Related Files

- `.github/workflows/aggregate-analytics.yml` - Workflow definition
- `.github/scripts/aggregate-analytics.sh` - Aggregation script
- `.github/scripts/validate-analytics.sh` - Validation script
- `public/data/analytics-latest.json` - Data file



