#!/usr/bin/env bash

# Validation script to check analytics data integrity
# This script should be run after aggregation to ensure data is valid

set -e
set -o pipefail

DATA_FILE="${1:-public/data/analytics-latest.json}"

if [[ ! -f "$DATA_FILE" ]]; then
  echo "Error: Analytics file not found: $DATA_FILE" >&2
  exit 1
fi

echo "Validating analytics data file: $DATA_FILE" >&2

# Check if file is valid JSON
if ! jq empty < "$DATA_FILE" 2>/dev/null; then
  echo "Error: Invalid JSON in $DATA_FILE" >&2
  exit 1
fi

# Check if it's an array
if ! jq -e 'type == "array"' < "$DATA_FILE" > /dev/null; then
  echo "Error: Analytics file must be a JSON array" >&2
  exit 1
fi

# Get snapshot count
SNAPSHOT_COUNT=$(jq '. | length' < "$DATA_FILE")

if [[ "$SNAPSHOT_COUNT" -eq 0 ]]; then
  echo "Warning: Analytics file is empty" >&2
  exit 1
fi

echo "Found $SNAPSHOT_COUNT snapshots" >&2

# Validate each snapshot has required fields
REQUIRED_FIELDS=("timestamp" "localCount" "remoteCount" "totalCount" "bothCount" "unknownCount")

for i in $(seq 0 $((SNAPSHOT_COUNT - 1))); do
  SNAPSHOT=$(jq ".[$i]" < "$DATA_FILE")
  
  for field in "${REQUIRED_FIELDS[@]}"; do
    if ! echo "$SNAPSHOT" | jq -e ".$field != null" > /dev/null; then
      echo "Error: Snapshot $i missing required field: $field" >&2
      exit 1
    fi
  done
  
  # Validate timestamp format (ISO 8601 UTC)
  TIMESTAMP=$(echo "$SNAPSHOT" | jq -r '.timestamp')
  if ! echo "$TIMESTAMP" | grep -qE '^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}Z$'; then
    echo "Error: Snapshot $i has invalid timestamp format: $TIMESTAMP" >&2
    echo "Expected format: YYYY-MM-DDTHH:MM:SSZ (ISO 8601 UTC)" >&2
    exit 1
  fi
  
  # Validate counts are non-negative integers
  for count_field in localCount remoteCount totalCount bothCount unknownCount; do
    COUNT=$(echo "$SNAPSHOT" | jq -r ".$count_field")
    if ! [[ "$COUNT" =~ ^[0-9]+$ ]]; then
      echo "Error: Snapshot $i has invalid $count_field: $COUNT" >&2
      exit 1
    fi
    if [[ "$COUNT" -lt 0 ]]; then
      echo "Error: Snapshot $i has negative $count_field: $COUNT" >&2
      exit 1
    fi
  done
done

# Check for duplicate timestamps
DUPLICATE_COUNT=$(jq -r '[.[].timestamp] | group_by(.) | map(select(length > 1)) | length' < "$DATA_FILE")
if [[ "$DUPLICATE_COUNT" -gt 0 ]]; then
  echo "Warning: Found duplicate timestamps in analytics file" >&2
  jq -r '[.[].timestamp] | group_by(.) | map(select(length > 1)) | .[] | .[0]' < "$DATA_FILE" >&2
fi

# Check if snapshots are sorted by timestamp
TIMESTAMPS=$(jq -r '[.[].timestamp] | .[]' < "$DATA_FILE")
PREV_TIMESTAMP=""
for timestamp in $TIMESTAMPS; do
  if [[ -n "$PREV_TIMESTAMP" ]]; then
    if [[ "$timestamp" < "$PREV_TIMESTAMP" ]]; then
      echo "Warning: Snapshots are not sorted by timestamp" >&2
      echo "  Previous: $PREV_TIMESTAMP" >&2
      echo "  Current:  $timestamp" >&2
      # Don't exit with error, just warn
    fi
  fi
  PREV_TIMESTAMP="$timestamp"
done

# Check for reasonable time gaps (warn if > 2 hours between snapshots)
if [[ "$SNAPSHOT_COUNT" -gt 1 ]]; then
  LAST_TIMESTAMP=$(jq -r '.[-1].timestamp' < "$DATA_FILE")
  SECOND_LAST_TIMESTAMP=$(jq -r '.[-2].timestamp' < "$DATA_FILE")
  
  # Convert to epoch seconds for comparison
  LAST_EPOCH=$(date -u -d "$LAST_TIMESTAMP" +%s 2>/dev/null || date -u -j -f "%Y-%m-%dT%H:%M:%SZ" "$LAST_TIMESTAMP" +%s 2>/dev/null || echo "0")
  SECOND_LAST_EPOCH=$(date -u -d "$SECOND_LAST_TIMESTAMP" +%s 2>/dev/null || date -u -j -f "%Y-%m-%dT%H:%M:%SZ" "$SECOND_LAST_TIMESTAMP" +%s 2>/dev/null || echo "0")
  
  if [[ "$LAST_EPOCH" -gt 0 ]] && [[ "$SECOND_LAST_EPOCH" -gt 0 ]]; then
    GAP_SECONDS=$((LAST_EPOCH - SECOND_LAST_EPOCH))
    GAP_HOURS=$((GAP_SECONDS / 3600))
    
    if [[ "$GAP_HOURS" -gt 2 ]]; then
      echo "Warning: Large time gap detected between last two snapshots: ${GAP_HOURS} hours" >&2
      echo "  This might indicate missing snapshots" >&2
    fi
  fi
fi

echo "Validation passed: $SNAPSHOT_COUNT snapshots" >&2
exit 0

