# GitHub Actions Workflow Contract

**Workflow**: Aggregate MCP Analytics  
**File**: `.github/workflows/aggregate-analytics.yml`  
**Schedule**: Hourly (runs at minute 0 of every hour)

## Purpose

Fetch all MCP servers from the registry API, classify them by type (local/remote), count them, and store aggregated analytics snapshots.

## Workflow Definition

### Basic Structure

```yaml
name: Aggregate MCP Analytics

on:
  schedule:
    - cron: '0 * * * *'  # Every hour at minute 0
  workflow_dispatch:  # Allow manual triggering

jobs:
  aggregate:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout repository
        uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '18'
      
      - name: Aggregate analytics
        run: ./.github/scripts/aggregate-analytics.sh
      
      - name: Commit and push
        run: |
          git config --local user.email "action@github.com"
          git config --local user.name "GitHub Action"
          git add public/data/analytics-latest.json
          git commit -m "Update analytics: $(date -u +%Y-%m-%dT%H:%M:%SZ)" || exit 0
          git push
```

## Aggregation Script Contract

### Script Location

**File**: `.github/scripts/aggregate-analytics.sh`

**Language**: zsh (as specified)

**Permissions**: Executable (`chmod +x`)

### Script Interface

**Input**: None (reads from environment or API)

**Output**: `public/data/analytics-latest.json` (or updates existing file)

**Environment Variables**:
- `API_URL`: MCP Registry API endpoint (default: `https://registry.modelcontextprotocol.io/v0/servers`)

### Script Behavior

1. **Fetch All Pages**:
   - Start with initial API request (no cursor)
   - Continue paginating using `metadata.nextCursor`
   - Stop when `nextCursor` is absent

2. **Classify Servers**:
   - For each server in response:
     - If has `packages` → count as local
     - If has `remotes` → count as remote
     - If has both → count as both local and remote
     - If has neither → count as unknown

3. **Count Servers**:
   - `localCount`: Servers with `packages` (including those with both)
   - `remoteCount`: Servers with `remotes` (including those with both)
   - `bothCount`: Servers with both `packages` and `remotes`
   - `unknownCount`: Servers with neither
   - `totalCount`: `localCount + remoteCount - bothCount` (unique servers)

4. **Create Snapshot**:
   ```json
   {
     "timestamp": "2025-01-27T14:00:00Z",  // Current UTC time
     "localCount": 45,
     "remoteCount": 32,
     "totalCount": 70,
     "bothCount": 7,
     "unknownCount": 2
   }
   ```

5. **Update Data File**:
   - Read existing `analytics-latest.json` (if exists)
   - Append new snapshot to array
   - Optionally: Keep only last N snapshots (e.g., last 720 for 30 days of hourly data)
   - Write updated array to file

### Script Template

```zsh
#!/usr/bin/env zsh

set -e  # Exit on error

API_URL="${API_URL:-https://registry.modelcontextprotocol.io/v0/servers}"
DATA_DIR="public/data"
OUTPUT_FILE="${DATA_DIR}/analytics-latest.json"

# Ensure data directory exists
mkdir -p "$DATA_DIR"

# Initialize counters
local_count=0
remote_count=0
both_count=0
unknown_count=0

# Fetch all pages
cursor=""
all_servers=()

while true; do
  if [[ -n "$cursor" ]]; then
    url="${API_URL}?cursor=${cursor}"
  else
    url="${API_URL}"
  fi
  
  echo "Fetching: $url"
  response=$(curl -s "$url")
  
  # Extract servers (using jq)
  servers=$(echo "$response" | jq -r '.servers[]')
  
  # Process each server
  while IFS= read -r server_json; do
    [[ -z "$server_json" ]] && continue
    
    has_packages=$(echo "$server_json" | jq -r '.server.packages // [] | length')
    has_remotes=$(echo "$server_json" | jq -r '.server.remotes // [] | length')
    
    if [[ "$has_packages" -gt 0 ]] && [[ "$has_remotes" -gt 0 ]]; then
      ((both_count++))
      ((local_count++))
      ((remote_count++))
    elif [[ "$has_packages" -gt 0 ]]; then
      ((local_count++))
    elif [[ "$has_remotes" -gt 0 ]]; then
      ((remote_count++))
    else
      ((unknown_count++))
    fi
  done <<< "$servers"
  
  # Check for next page
  next_cursor=$(echo "$response" | jq -r '.metadata.nextCursor // empty')
  
  if [[ -z "$next_cursor" ]]; then
    break
  fi
  
  cursor="$next_cursor"
done

# Calculate total (unique servers)
total_count=$((local_count + remote_count - both_count))

# Create snapshot
timestamp=$(date -u +%Y-%m-%dT%H:%M:%SZ)
snapshot=$(jq -n \
  --arg timestamp "$timestamp" \
  --argjson local "$local_count" \
  --argjson remote "$remote_count" \
  --argjson total "$total_count" \
  --argjson both "$both_count" \
  --argjson unknown "$unknown_count" \
  '{
    timestamp: $timestamp,
    localCount: $local,
    remoteCount: $remote,
    totalCount: $total,
    bothCount: $both,
    unknownCount: $unknown
  }')

# Update analytics file
if [[ -f "$OUTPUT_FILE" ]]; then
  # Append to existing file
  jq --argjson snapshot "$snapshot" '. + [$snapshot]' "$OUTPUT_FILE" > "${OUTPUT_FILE}.tmp"
  mv "${OUTPUT_FILE}.tmp" "$OUTPUT_FILE"
else
  # Create new file
  echo "[$snapshot]" > "$OUTPUT_FILE"
fi

echo "Analytics aggregated: $total_count total servers ($local_count local, $remote_count remote, $both_count both, $unknown_count unknown)"
```

## Dependencies

### Required Tools

- **curl**: HTTP client for API requests
- **jq**: JSON processor for parsing responses
- **git**: Version control for committing results
- **zsh**: Shell interpreter

### Installation (if needed)

```yaml
- name: Install dependencies
  run: |
    sudo apt-get update
    sudo apt-get install -y jq zsh
```

## Error Handling

### API Errors

- **400 Bad Request**: Log error, skip this run
- **429 Rate Limited**: Wait and retry (with exponential backoff)
- **500 Server Error**: Log error, skip this run
- **Network Errors**: Log error, skip this run

### Script Errors

- **set -e**: Exit immediately on error
- **Error Logging**: Output errors to GitHub Actions logs
- **Failure Notification**: Optionally notify on repeated failures

## Output Validation

### Snapshot Validation

Before writing snapshot, validate:
- All counts are non-negative integers
- `totalCount` equals `localCount + remoteCount - bothCount`
- Timestamp is valid ISO 8601 format

### File Format Validation

Before committing, validate:
- File is valid JSON
- File contains array of snapshots
- All snapshots have required fields

## Performance Considerations

### API Rate Limiting

- **Frequency**: Hourly runs should not hit rate limits
- **Strategy**: If rate limited, wait and retry with exponential backoff
- **Fallback**: Skip run if rate limit persists

### Data Retention

- **Strategy**: Keep last N snapshots (e.g., last 720 for 30 days hourly)
- **Implementation**: Trim array before writing file
- **Storage**: Consider file size limits for static hosting

## Security Considerations

### API Credentials

- **None Required**: MCP Registry API is public, no authentication needed

### Repository Access

- **Permissions**: Workflow needs write access to repository
- **Token**: Use `GITHUB_TOKEN` (automatically provided)

## Monitoring

### Success Indicators

- Workflow completes successfully
- Analytics file is updated
- Changes are committed and pushed

### Failure Indicators

- Workflow fails
- No changes committed
- API errors logged

### Alerts

- Optionally: Set up notifications for workflow failures
- Monitor: API response times and error rates

## Notes

- Workflow runs in UTC timezone
- All timestamps are stored in UTC (ISO 8601 format)
- Script must be idempotent (safe to run multiple times)
- Consider adding workflow status badge to README




