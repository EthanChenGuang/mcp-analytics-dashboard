# MCP Registry API Contract

**API**: MCP Registry Server List  
**Endpoint**: `https://registry.modelcontextprotocol.io/v0/servers`  
**Purpose**: Fetch paginated list of MCP servers for analytics aggregation

## Request

### Endpoint

```
GET https://registry.modelcontextprotocol.io/v0/servers
GET https://registry.modelcontextprotocol.io/v0/servers?cursor=<nextCursor>
```

### Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `cursor` | string | No | Pagination cursor from previous response's `metadata.nextCursor`. Omit for first page. |

### Headers

```
Accept: application/json
```

## Response

### Success Response (200 OK)

**Content-Type**: `application/json`

**Schema**:
```typescript
{
  servers: Array<{
    server: {
      $schema: string;
      name: string;
      description?: string;
      version: string;
      repository?: {
        url: string;
        source: string;
      };
      packages?: Array<{
        registryType: string;
        identifier: string;
        version?: string;
        transport: {
          type: string;
        };
        environmentVariables?: Array<{
          name: string;
          description?: string;
          isSecret?: boolean;
          isRequired?: boolean;
          default?: string;
          format?: string;
        }>;
        runtimeHint?: string;
        registryBaseUrl?: string;
      }>;
      remotes?: Array<{
        type: string;
        url: string;
        headers?: Array<{
          name: string;
          description?: string;
          isSecret?: boolean;
        }>;
      }>;
    };
    _meta: {
      "io.modelcontextprotocol.registry/official": {
        status: string;
        publishedAt: string;  // ISO 8601 UTC timestamp
        updatedAt: string;    // ISO 8601 UTC timestamp
        isLatest: boolean;
      };
    };
  }>;
  metadata: {
    nextCursor?: string;  // Present if more pages available
    count: number;         // Number of servers in this page
  };
}
```

### Pagination

- **First Request**: Omit `cursor` parameter
- **Subsequent Requests**: Include `cursor` parameter with value from `metadata.nextCursor`
- **Last Page**: `metadata.nextCursor` is absent or null

### Server Classification

Servers are classified based on presence of properties:
- **Local**: Has `packages` property (array with length > 0)
- **Remote**: Has `remotes` property (array with length > 0)
- **Both**: Has both `packages` and `remotes` properties
- **Unknown**: Has neither `packages` nor `remotes` properties

## Error Responses

### 400 Bad Request

```json
{
  "error": "Invalid cursor parameter"
}
```

### 429 Too Many Requests

```json
{
  "error": "Rate limit exceeded",
  "retryAfter": 60
}
```

### 500 Internal Server Error

```json
{
  "error": "Internal server error"
}
```

## Usage Example

### Initial Request

```bash
curl "https://registry.modelcontextprotocol.io/v0/servers"
```

### Paginated Request

```bash
curl "https://registry.modelcontextprotocol.io/v0/servers?cursor=ai.shawndurrani/mcp-registry:0.1.2"
```

### Pagination Loop (zsh)

```zsh
#!/usr/bin/env zsh

API_URL="https://registry.modelcontextprotocol.io/v0/servers"
CURSOR=""
ALL_SERVERS=()

while true; do
  if [[ -n "$CURSOR" ]]; then
    URL="${API_URL}?cursor=${CURSOR}"
  else
    URL="${API_URL}"
  fi
  
  RESPONSE=$(curl -s "$URL")
  SERVERS=$(echo "$RESPONSE" | jq -r '.servers[]')
  ALL_SERVERS+=("$SERVERS")
  
  NEXT_CURSOR=$(echo "$RESPONSE" | jq -r '.metadata.nextCursor // empty')
  
  if [[ -z "$NEXT_CURSOR" ]]; then
    break
  fi
  
  CURSOR="$NEXT_CURSOR"
done

# Process ALL_SERVERS array
```

## Rate Limiting

- **Limit**: Not specified in requirements, assume reasonable rate
- **Strategy**: GitHub Actions runs hourly, should not hit rate limits
- **Retry**: Implement exponential backoff if rate limited

## Notes

- All timestamps are in ISO 8601 format, UTC timezone
- Server names are unique identifiers (e.g., `ai.shawndurrani/mcp-registry`)
- `isLatest` flag indicates if this is the latest version of the server
- Pagination cursor format: `<server-name>:<version>` (e.g., `ai.shawndurrani/mcp-registry:0.1.2`)




