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
  response=$(curl -s "$url")
  
  # Extract and store all latest server entries as JSON lines
  echo "$response" | jq -r '.servers[] | select(._meta."io.modelcontextprotocol.registry/official".isLatest == true)' >> "$all_servers_file"
  
  # Check for next page
  next_cursor=$(echo "$response" | jq -r '.metadata.nextCursor // empty')
  
  if [[ -z "$next_cursor" ]]; then
    break
  fi
  
  cursor="$next_cursor"
done

# Process unique servers by name
declare -A seen_servers

while IFS= read -r server_json; do
  [[ -z "$server_json" ]] && continue
  
  # Get unique server name (without version)
  server_name=$(echo "$server_json" | jq -r '.server.name')
  
  # Skip if we've already processed this server
  if [[ -n "${seen_servers[$server_name]}" ]]; then
    continue
  fi
  
  # Mark as seen
  seen_servers[$server_name]=1
  
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
