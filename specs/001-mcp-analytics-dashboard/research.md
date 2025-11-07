# Research: MCP Analytics Dashboard

**Date**: 2025-01-27  
**Feature**: 001-mcp-analytics-dashboard

## Overview

This document consolidates research findings and technology decisions for the MCP Analytics Dashboard implementation. All technical choices have been evaluated against the project constitution and functional requirements.

## Technology Decisions

### 1. Next.js Static Export Configuration

**Decision**: Use Next.js 14+ with App Router and `output: 'export'` configuration for static site generation.

**Rationale**:
- Next.js static export produces fully static HTML/CSS/JS files that can be served from any static hosting service
- App Router provides file-based routing suitable for SPA with About page
- Built-in optimizations (code splitting, image optimization) improve performance
- TypeScript support out of the box
- Meets constitution requirement for static website (Constitution I)

**Alternatives Considered**:
- **Vite + React**: Would require manual routing setup and static export configuration. Next.js provides better DX and built-in optimizations.
- **Gatsby**: Overkill for a simple SPA. Next.js is more flexible and has better TypeScript support.
- **Vanilla JS**: Would require extensive tooling for bundling, routing, and optimization. Next.js provides these out of the box.

**Implementation Notes**:
- Configure `next.config.js` with `output: 'export'`
- Use App Router (`app/` directory) for routing
- Ensure all data fetching happens client-side or at build time
- No API routes (static export doesn't support them)

### 2. Charting Library Selection

**Decision**: Use Recharts for time-series chart visualization.

**Rationale**:
- Built on D3.js and React, integrates seamlessly with React components
- Supports responsive design and mobile-friendly charts
- Provides built-in support for time-series data with date axes
- Customizable theming to match purple/blue/pink color scheme
- Active maintenance and good TypeScript support
- Lightweight compared to alternatives (Chart.js, D3.js directly)

**Alternatives Considered**:
- **Chart.js**: Requires React wrapper (react-chartjs-2), less React-native approach
- **Victory**: Good React integration but larger bundle size
- **D3.js directly**: Too low-level, would require extensive custom implementation
- **Nivo**: Good but Recharts has better time-series support

**Implementation Notes**:
- Use `ResponsiveContainer` for responsive charts
- Configure `XAxis` with `dataKey` for dates and `tickFormatter` for granularity-based formatting
- Use `Line` or `Area` chart type for time-series visualization
- Apply theme colors via `stroke` and `fill` props

### 3. UI Component Library

**Decision**: Use shadcn/ui for UI components.

**Rationale**:
- Copy-paste component model (not an npm dependency) aligns with minimal dependencies principle
- Built on Radix UI primitives for accessibility
- Tailwind CSS for styling (required dependency)
- Theme support built-in (dark/light mode)
- Modern, clean design aesthetic
- TypeScript-first approach

**Alternatives Considered**:
- **Material-UI (MUI)**: Large bundle size, opinionated design
- **Chakra UI**: Good but shadcn provides more flexibility
- **Ant Design**: Too heavy, not aligned with minimal dependencies
- **Custom components**: Would violate minimal dependencies more (accessibility, theming, responsive design)

**Implementation Notes**:
- Install shadcn/ui via CLI: `npx shadcn-ui@latest init`
- Configure Tailwind with custom color scheme (purple, blue, pink)
- Use components: Button, Select, Card, Tabs for filters and controls
- Theme toggle component will use shadcn's theme system

### 4. Data Aggregation Strategy

**Decision**: GitHub Actions workflow runs hourly, fetches paginated API data, aggregates by time period, stores as static JSON files.

**Rationale**:
- GitHub Actions provides free CI/CD for public repositories
- Hourly execution aligns with requirement for regular aggregation
- Static JSON files can be served directly or fetched by client
- Reduces API load on MCP registry endpoint
- Enables offline capability with cached data

**Alternatives Considered**:
- **Client-side aggregation only**: Would require fetching all historical data on each page load, inefficient
- **Server-side API**: Violates static website requirement
- **Third-party aggregation service**: Adds external dependency and cost

**Implementation Notes**:
- GitHub Actions workflow: `.github/workflows/aggregate-analytics.yml`
- Use zsh shell script for pagination logic (as specified)
- Store aggregated data in `public/data/` or commit to repository
- Data structure: `{ timestamp, localCount, remoteCount, totalCount }[]`
- Client fetches latest snapshot JSON file

### 5. Server Classification Logic

**Decision**: Classify servers based on presence of `packages` and `remotes` properties:
- Has `packages` only → Local
- Has `remotes` only → Remote  
- Has both → Counts as both Local and Remote
- Has neither → UNKNOWN/NOT_CONFIGURED (excluded from counts)

**Rationale**:
- Clear, deterministic classification based on API response structure
- Handles edge cases (both, neither) explicitly
- Aligns with user requirements for filtering

**Implementation Notes**:
- Implement in `lib/utils/server-classification.ts`
- Function: `classifyServer(server: Server): ServerType[]`
- Returns array to handle "both" case
- Used during data aggregation in GitHub Actions

### 6. Theme Management

**Decision**: Use localStorage for theme persistence, CSS variables for theming, system preference detection.

**Rationale**:
- localStorage provides client-side persistence (FR-009)
- CSS variables enable efficient theme switching
- System preference detection improves UX for first-time visitors
- No external dependencies required

**Alternatives Considered**:
- **Cookies**: More complex, requires server handling (not available in static export)
- **Theme provider library**: Unnecessary dependency, can implement with React Context

**Implementation Notes**:
- Create `ThemeProvider` component using React Context
- Store preference in localStorage key: `mcp-analytics-theme`
- Default to light theme, fallback to system preference
- Use Tailwind dark mode classes for theme application
- Debounce theme toggle (300ms) to prevent rapid switching

### 7. Time Granularity Aggregation

**Decision**: Client-side aggregation of hourly snapshots into daily/weekly/monthly views.

**Rationale**:
- GitHub Actions stores hourly snapshots (most granular)
- Client can aggregate on-demand based on selected granularity
- Reduces storage requirements (one snapshot format)
- Flexible for future granularity additions

**Alternatives Considered**:
- **Pre-aggregate all granularities**: Increases storage, less flexible
- **Server-side aggregation**: Violates static website requirement

**Implementation Notes**:
- Implement in `lib/utils/data-aggregation.ts`
- Functions: `aggregateByDay()`, `aggregateByWeek()`, `aggregateByMonth()`
- Use date-fns or native Date methods for date manipulation
- Preserve filter state during aggregation

### 8. Error Handling Strategy

**Decision**: Implement exponential backoff retry, cached data fallback, user-friendly error messages.

**Rationale**:
- Meets edge case requirements (Edge Case #1, #8)
- Provides graceful degradation
- Improves user experience during API outages

**Implementation Notes**:
- Retry logic: 1s, 2s, 4s intervals, max 3 attempts
- Cache successful responses in localStorage or memory
- Display error banner with retry button
- Show cached data with staleness indicator if available
- Timeout: 10 seconds (per SC-010)

## API Integration Details

### MCP Registry API

**Endpoint**: `https://registry.modelcontextprotocol.io/v0/servers`

**Pagination**:
- Initial request: No parameters
- Subsequent requests: `?cursor=<nextCursor>` where `nextCursor` comes from `metadata.nextCursor`
- Continue until `metadata.nextCursor` is absent

**Response Structure**:
```typescript
{
  servers: Array<{
    server: {
      name: string;
      packages?: Array<...>;  // Present for local servers
      remotes?: Array<...>;    // Present for remote servers
      // ... other fields
    };
    _meta: {
      "io.modelcontextprotocol.registry/official": {
        publishedAt: string;  // ISO 8601 timestamp
        updatedAt: string;     // ISO 8601 timestamp
        // ... other fields
      }
    };
  }>;
  metadata: {
    nextCursor?: string;  // Absent when no more pages
    count: number;
  }
}
```

**Server Classification**:
- Local: Has `packages` property
- Remote: Has `remotes` property
- Both: Has both properties
- Unknown: Has neither property

## Performance Considerations

### Chart Rendering Optimization

- Use data decimation for datasets > 1000 points
- Implement progressive loading for monthly views
- Default time range: last 30 days (daily), last 12 months (monthly)
- Virtualize chart rendering if needed

### Bundle Size Optimization

- Use Next.js automatic code splitting
- Lazy load chart components
- Tree-shake unused chart library features
- Optimize images (if any) with Next.js Image component

## Accessibility Considerations

- shadcn/ui components include ARIA attributes
- Chart tooltips must be keyboard accessible
- Theme toggle must be keyboard navigable
- Ensure sufficient color contrast (WCAG AA minimum)
- Screen reader announcements for chart updates

## Testing Strategy

### Unit Tests
- Server classification logic
- Data aggregation functions
- Date formatting utilities
- Theme management

### Component Tests
- Chart rendering with different data sets
- Filter interactions
- Theme toggle functionality
- Loading and error states

### E2E Tests
- Full user flows (view dashboard, change filters, switch granularity)
- Theme persistence across page refreshes
- Error handling scenarios
- Responsive design verification

## Open Questions Resolved

1. **Q**: How to handle timezone differences?  
   **A**: Store timestamps in UTC, convert to user's local timezone for display (Edge Case #4)

2. **Q**: What happens with very large datasets?  
   **A**: Client-side aggregation/sampling, progressive loading, default time ranges (Edge Case #6)

3. **Q**: How to handle API errors?  
   **A**: Exponential backoff retry, cached data fallback, user-friendly messages (Edge Case #1, #8)

4. **Q**: Static export compatibility?  
   **A**: Next.js static export fully supports this use case (Constitution I)

## References

- [Next.js Static Export Documentation](https://nextjs.org/docs/app/building-your-application/deploying/static-exports)
- [Recharts Documentation](https://recharts.org/)
- [shadcn/ui Documentation](https://ui.shadcn.com/)
- [MCP Registry API](https://registry.modelcontextprotocol.io/v0/servers)




