#!/usr/bin/env bash

set -e  # Exit on error
set -o pipefail  # Exit on pipe failures

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

# Use temporary file to store all server data for processing
all_servers_file=$(mktemp)
trap "rm -f $all_servers_file" EXIT

# Fetch all pages and collect server data
cursor=""

while true; do
  if [[ -n "$cursor" ]]; then
    url="${API_URL}?cursor=${cursor}"
  else
    url="${API_URL}"
  fi
  
  echo "Fetching: $url"
  
  # Fetch response and handle errors
  response_file=$(mktemp)
  if ! curl -s -f "$url" > "$response_file"; then
    echo "Error: Failed to fetch $url" >&2
    rm -f "$response_file"
    exit 1
  fi
  
  # Validate JSON response
  if ! jq empty < "$response_file" 2>/dev/null; then
    echo "Error: Invalid JSON response from $url" >&2
    echo "Response preview (first 500 chars):" >&2
    head -c 500 < "$response_file" >&2
    echo "" >&2
    rm -f "$response_file"
    exit 1
  fi
  
  # Extract and store all latest server entries as compact JSON lines (properly escaped)
  jq -c '.servers[] | select(._meta."io.modelcontextprotocol.registry/official".isLatest == true)' < "$response_file" >> "$all_servers_file"
  
  # Check for next page
  next_cursor=$(jq -r '.metadata.nextCursor // empty' < "$response_file")
  
  rm -f "$response_file"
  
  if [[ -z "$next_cursor" ]]; then
    break
  fi
  
  cursor="$next_cursor"
done

# Check if we collected any data
if [[ ! -s "$all_servers_file" ]]; then
  echo "Error: No server data collected" >&2
  exit 1
fi

echo "Collected $(wc -l < "$all_servers_file") server entries" >&2

# Process unique servers by name
declare -A seen_servers

echo "Processing server data..." >&2
line_count=0
while IFS= read -r server_json || [[ -n "$server_json" ]]; do
  line_count=$((line_count + 1))
  [[ -z "$server_json" ]] && continue
  
  # Validate JSON before processing
  if ! echo "$server_json" | jq empty 2>/dev/null; then
    echo "Warning: Skipping invalid JSON line $line_count" >&2
    continue
  fi
  
  # Get unique server name (without version)
  if ! server_name=$(echo "$server_json" | jq -r '.server.name // empty' 2>/dev/null); then
    echo "Warning: Failed to extract server name from line $line_count" >&2
    continue
  fi
  [[ -z "$server_name" ]] && continue
  
  # Skip if we've already processed this server
  if [[ -n "${seen_servers[$server_name]}" ]]; then
    continue
  fi
  
  # Mark as seen
  seen_servers[$server_name]=1
  
  if ! has_packages=$(echo "$server_json" | jq -r '.server.packages // [] | length' 2>/dev/null); then
    echo "Warning: Failed to extract packages from line $line_count" >&2
    continue
  fi
  if ! has_remotes=$(echo "$server_json" | jq -r '.server.remotes // [] | length' 2>/dev/null); then
    echo "Warning: Failed to extract remotes from line $line_count" >&2
    continue
  fi
  
  if [[ "$has_packages" -gt 0 ]] && [[ "$has_remotes" -gt 0 ]]; then
    both_count=$((both_count + 1))
    local_count=$((local_count + 1))
    remote_count=$((remote_count + 1))
  elif [[ "$has_packages" -gt 0 ]]; then
    local_count=$((local_count + 1))
  elif [[ "$has_remotes" -gt 0 ]]; then
    remote_count=$((remote_count + 1))
  else
    unknown_count=$((unknown_count + 1))
  fi
done < "$all_servers_file"

# Calculate total (unique servers)
# Total = unique local + unique remote - unique both
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
