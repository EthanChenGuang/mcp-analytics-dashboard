# Tasks: MCP Analytics Dashboard

**Input**: Design documents from `/specs/001-mcp-analytics-dashboard/`  
**Prerequisites**: plan.md, spec.md, data-model.md, contracts/, research.md, quickstart.md

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic structure

- [x] T001 Verify project setup and Next.js initialization in project root
- [x] T002 Install core dependencies: recharts and date-fns via npm
- [x] T003 [P] Initialize shadcn/ui with `npx shadcn-ui@latest init` (components.json created, utils.ts added)
- [x] T004 [P] Install shadcn/ui components: button, select, card, tabs, switch (Dependencies added: clsx, tailwind-merge)
- [x] T005 Configure Next.js for static export in `next.config.js` with `output: 'export'`
- [x] T006 [P] Configure Tailwind theme colors (purple, blue, pink) in `tailwind.config.js`
- [x] T007 [P] Create project directory structure: app/, components/, lib/, public/data/, .github/workflows/, tests/

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [x] T008 Create TypeScript type definitions in `lib/types/analytics.ts` (AnalyticsSnapshot, TimeSeriesDataPoint, ServerType, FilterState, ThemePreference, Granularity)
- [x] T009 [P] Implement server classification utility in `lib/utils/server-classification.ts`
- [x] T010 [P] Implement date formatting utility in `lib/utils/date-formatting.ts`
- [x] T011 [P] Implement data aggregation utility in `lib/utils/data-aggregation.ts` (aggregateByGranularity function)
- [x] T012 [P] Implement theme management utilities in `lib/utils/theme.ts`
- [x] T013 Create API client for fetching analytics data in `lib/api/analytics.ts` with retry logic and caching
- [x] T014 Create GitHub Actions workflow file in `.github/workflows/aggregate-analytics.yml`
- [x] T015 Create aggregation script in `.github/scripts/aggregate-analytics.sh` (zsh script for pagination and server classification)
- [x] T016 Make aggregation script executable with `chmod +x .github/scripts/aggregate-analytics.sh`

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - View Analytics Dashboard (Priority: P1) 🎯 MVP

**Goal**: Display MCP server statistics in time-series charts with date on x-axis and counts on y-axis. Page loads with default settings (all servers, daily granularity, light theme).

**Independent Test**: Load the page and verify analytics data is displayed in charts with proper formatting. Charts show date on x-axis and counts on y-axis. Loading indicator appears during data fetch.

### Implementation for User Story 1

- [x] T017 [US1] Create root layout with theme provider in `app/layout.tsx`
- [x] T018 [US1] Create global styles and theme variables in `app/globals.css`
- [x] T019 [US1] Create main dashboard page component in `app/page.tsx` with data fetching logic
- [x] T020 [US1] Create chart wrapper component with loading/error states in `components/charts/chart-wrapper.tsx`
- [x] T021 [US1] Create time-series chart component using Recharts in `components/charts/time-series-chart.tsx` with date x-axis and count y-axis
- [x] T022 [US1] Implement loading indicator component in `components/charts/chart-wrapper.tsx`
- [x] T023 [US1] Implement error handling with user-friendly messages in `app/page.tsx`
- [x] T024 [US1] Integrate API client to fetch analytics data in `app/page.tsx`
- [x] T025 [US1] Apply default settings (all servers, daily granularity) in `app/page.tsx`
- [x] T026 [US1] Format chart x-axis dates according to daily granularity in `components/charts/time-series-chart.tsx`

**Checkpoint**: At this point, User Story 1 should be fully functional and testable independently. Dashboard displays analytics data in charts with proper formatting.

---

## Phase 4: User Story 2 - Filter by Server Type (Priority: P1)

**Goal**: Users can filter analytics to show only local servers, only remote servers, or both together. Filter selection persists when changing granularity.

**Independent Test**: Interact with filter controls and verify charts update to reflect only selected server types. Filter selection is preserved when changing granularity.

### Implementation for User Story 2

- [x] T027 [P] [US2] Create server type filter component in `components/filters/server-type-filter.tsx` (All/Local/Remote options)
- [x] T028 [US2] Integrate filter component into main dashboard page in `app/page.tsx`
- [x] T029 [US2] Implement filter state management in `app/page.tsx` (all/local/remote)
- [x] T030 [US2] Update chart component to accept and apply filter prop in `components/charts/time-series-chart.tsx`
- [x] T031 [US2] Filter analytics data based on selected server type in `app/page.tsx` (show localCount, remoteCount, or both)
- [x] T032 [US2] Preserve filter state when changing granularity in `app/page.tsx`
- [x] T033 [US2] Update chart to display filtered data correctly in `components/charts/time-series-chart.tsx`

**Checkpoint**: At this point, User Stories 1 AND 2 should both work independently. Users can filter by server type and see accurate counts.

---

## Phase 5: User Story 3 - Change Time Granularity (Priority: P1)

**Goal**: Users can switch between hourly, daily, weekly, and monthly views. Charts redraw with appropriate time intervals and x-axis labels update accordingly.

**Independent Test**: Switch between granularity options and verify charts redraw with appropriate time intervals. X-axis labels update to reflect new time period format.

### Implementation for User Story 3

- [x] T034 [P] [US3] Create granularity selector component in `components/filters/granularity-selector.tsx` (Hourly/Daily/Weekly/Monthly)
- [x] T035 [US3] Integrate granularity selector into main dashboard page in `app/page.tsx`
- [x] T036 [US3] Implement granularity state management in `app/page.tsx`
- [x] T037 [US3] Update data aggregation to use selected granularity in `app/page.tsx` (call aggregateByGranularity)
- [x] T038 [US3] Update chart component to handle different granularities in `components/charts/time-series-chart.tsx`
- [x] T039 [US3] Update date formatting based on granularity in `components/charts/time-series-chart.tsx` (use formatDateForAxis)
- [x] T040 [US3] Ensure filter state is preserved when changing granularity in `app/page.tsx`
- [x] T041 [US3] Show loading indicator during granularity transition in `app/page.tsx`

**Checkpoint**: At this point, User Stories 1, 2, AND 3 should all work independently. Users can switch granularity and see appropriately formatted time axes.

---

## Phase 6: User Story 4 - Toggle Theme (Priority: P2)

**Goal**: Users can toggle between dark and light themes. Theme preference persists across page refreshes. Charts render with colors appropriate for selected theme.

**Independent Test**: Toggle theme control and verify entire page updates to selected theme. Refresh page and verify theme preference is preserved. Charts render with appropriate colors.

### Implementation for User Story 4

- [x] T042 [P] [US4] Create theme provider component with React Context in `components/theme/theme-provider.tsx`
- [x] T043 [P] [US4] Create theme toggle component in `components/theme/theme-toggle.tsx`
- [x] T044 [US4] Implement localStorage persistence for theme preference in `components/theme/theme-provider.tsx`
- [x] T045 [US4] Implement system preference detection (prefers-color-scheme) in `components/theme/theme-provider.tsx`
- [x] T046 [US4] Integrate theme provider into root layout in `app/layout.tsx`
- [x] T047 [US4] Add theme toggle to navigation header in `components/layout/header.tsx`
- [x] T048 [US4] Apply theme colors (purple, blue, pink) to Tailwind config for both themes in `tailwind.config.js`
- [x] T049 [US4] Update chart colors based on theme in `components/charts/time-series-chart.tsx`
- [x] T050 [US4] Implement debounce for theme toggle (300ms) in `components/theme/theme-toggle.tsx`
- [x] T051 [US4] Add CSS transitions for smooth theme switching in `app/globals.css`
- [x] T052 [US4] Prevent flash of unstyled content on page load in `app/layout.tsx` (suppressHydrationWarning)

**Checkpoint**: At this point, User Stories 1-4 should all work independently. Theme toggle works with persistence and appropriate chart colors.

---

## Phase 7: User Story 5 - View About Page (Priority: P3)

**Goal**: Users can navigate to an About page that provides information about the dashboard, data sources, and how analytics are aggregated.

**Independent Test**: Navigate to About page and verify information about dashboard, data sources, and aggregation is displayed. Can navigate back to dashboard.

### Implementation for User Story 5

- [x] T053 [P] [US5] Create About page component in `app/about/page.tsx`
- [x] T054 [US5] Add About page content (dashboard purpose, data sources, aggregation method) in `app/about/page.tsx`
- [x] T055 [US5] Create navigation header component in `components/layout/header.tsx` with links to dashboard and about
- [x] T056 [US5] Integrate navigation header into root layout in `app/layout.tsx`
- [x] T057 [US5] Ensure About page uses same theme as dashboard in `app/about/page.tsx`
- [x] T058 [US5] Add navigation back to dashboard from About page in `app/about/page.tsx`

**Checkpoint**: At this point, all user stories should be independently functional. About page provides context and documentation.

---

## Phase 8: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [x] T059 [P] Implement empty state UI with informative message in `components/charts/chart-wrapper.tsx`
- [x] T060 [P] Implement cached data fallback with staleness indicator in `lib/api/analytics.ts`
- [x] T061 [P] Add exponential backoff retry mechanism (1s, 2s, 4s intervals, max 3 attempts) in `lib/api/analytics.ts`
- [x] T062 [P] Implement request cancellation for in-flight requests in `lib/api/analytics.ts`
- [x] T063 [P] Add data validation for API responses in `lib/api/analytics.ts`
- [x] T064 [P] Implement client-side data decimation for datasets > 1000 points in `lib/utils/data-aggregation.ts`
- [x] T065 [P] Add timezone conversion (UTC to local) for display in `lib/utils/date-formatting.ts`
- [x] T066 [P] Add timezone indicator in chart legend or axis label in `components/charts/time-series-chart.tsx`
- [x] T067 [P] Implement progressive loading message for slow responses (>3s) in `components/charts/chart-wrapper.tsx`
- [x] T068 [P] Add manual refresh button in `app/page.tsx`
- [x] T069 [P] Ensure responsive design works on mobile (320px), tablet (768px), and desktop (1920px)
- [x] T070 [P] Optimize chart rendering performance using ResponsiveContainer in `components/charts/time-series-chart.tsx`
- [x] T071 [P] Add error boundary component for React error handling in `components/layout/error-boundary.tsx`
- [x] T072 [P] Update documentation in README.md with setup and usage instructions
- [ ] T073 [P] Run quickstart.md validation to ensure all steps work correctly

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3+)**: All depend on Foundational phase completion
  - User stories can then proceed in parallel (if staffed)
  - Or sequentially in priority order (P1 → P2 → P3)
- **Polish (Final Phase)**: Depends on all desired user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational (Phase 2) - No dependencies on other stories. This is the MVP.
- **User Story 2 (P2)**: Can start after Foundational (Phase 2) - Depends on US1 for chart component integration
- **User Story 3 (P1)**: Can start after Foundational (Phase 2) - Depends on US1 for chart component, can work with US2
- **User Story 4 (P2)**: Can start after Foundational (Phase 2) - Can work independently but enhances all previous stories
- **User Story 5 (P3)**: Can start after Foundational (Phase 2) - Completely independent, only needs navigation

### Within Each User Story

- Type definitions and utilities before components
- Components before page integration
- Core implementation before error handling
- Story complete before moving to next priority

### Parallel Opportunities

- All Setup tasks marked [P] can run in parallel (T003, T004, T006, T007)
- All Foundational tasks marked [P] can run in parallel (T009-T012)
- Once Foundational phase completes:
  - US1 can start immediately (MVP)
  - US2 and US3 can start after US1 chart component is ready
  - US4 can start independently (theme system)
  - US5 can start independently (About page)
- All Polish tasks marked [P] can run in parallel
- Different user stories can be worked on in parallel by different team members after US1

---

## Parallel Example: User Story 1

```bash
# Launch foundational utilities in parallel:
Task: T009 - Implement server classification utility in lib/utils/server-classification.ts
Task: T010 - Implement date formatting utility in lib/utils/date-formatting.ts
Task: T011 - Implement data aggregation utility in lib/utils/data-aggregation.ts
Task: T012 - Implement theme management utilities in lib/utils/theme.ts

# Launch US1 components in parallel (after foundational):
Task: T020 - Create chart wrapper component in components/charts/chart-wrapper.tsx
Task: T021 - Create time-series chart component in components/charts/time-series-chart.tsx
```

---

## Parallel Example: User Story 2 & 3

```bash
# After US1 is complete, US2 and US3 can work in parallel:
Task: T027 [US2] - Create server type filter component in components/filters/server-type-filter.tsx
Task: T034 [US3] - Create granularity selector component in components/filters/granularity-selector.tsx
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (T001-T007)
2. Complete Phase 2: Foundational (T008-T016) - CRITICAL - blocks all stories
3. Complete Phase 3: User Story 1 (T017-T026)
4. **STOP and VALIDATE**: Test User Story 1 independently - dashboard displays analytics charts
5. Deploy/demo if ready

### Incremental Delivery

1. Complete Setup + Foundational → Foundation ready
2. Add User Story 1 → Test independently → Deploy/Demo (MVP!)
3. Add User Story 2 → Test independently → Deploy/Demo (Filtering works)
4. Add User Story 3 → Test independently → Deploy/Demo (Granularity works)
5. Add User Story 4 → Test independently → Deploy/Demo (Theme works)
6. Add User Story 5 → Test independently → Deploy/Demo (About page works)
7. Add Polish phase → Final improvements
8. Each story adds value without breaking previous stories

### Parallel Team Strategy

With multiple developers:

1. Team completes Setup + Foundational together
2. Once Foundational is done:
   - Developer A: User Story 1 (MVP - highest priority)
   - Developer B: User Story 4 (Theme - independent)
   - Developer C: User Story 5 (About page - independent)
3. After US1 completes:
   - Developer A: User Story 2 (Filtering)
   - Developer B: User Story 3 (Granularity)
   - Developer C: Polish tasks
4. Stories complete and integrate independently

---

## Task Summary

- **Total Tasks**: 73
- **Setup Phase**: 7 tasks (T001-T007)
- **Foundational Phase**: 9 tasks (T008-T016)
- **User Story 1 (MVP)**: 10 tasks (T017-T026)
- **User Story 2**: 7 tasks (T027-T033)
- **User Story 3**: 8 tasks (T034-T041)
- **User Story 4**: 11 tasks (T042-T052)
- **User Story 5**: 6 tasks (T053-T058)
- **Polish Phase**: 15 tasks (T059-T073)

### Parallel Opportunities

- **Setup**: 4 parallel tasks (T003, T004, T006, T007)
- **Foundational**: 4 parallel tasks (T009-T012)
- **User Stories**: US4 and US5 can start independently after foundational
- **Polish**: All 15 tasks can run in parallel

### Independent Test Criteria

- **US1**: Load page → see analytics charts with date x-axis and count y-axis
- **US2**: Select filter → charts update to show only selected server type
- **US3**: Change granularity → charts redraw with appropriate time intervals and x-axis labels
- **US4**: Toggle theme → entire page updates, preference persists on refresh
- **US5**: Navigate to About → see information, can navigate back

### Suggested MVP Scope

**MVP = User Story 1 only** (T017-T026)
- Displays analytics dashboard with charts
- Shows loading states
- Handles errors gracefully
- Uses default settings (all servers, daily granularity, light theme)

This delivers immediate value and can be deployed independently.

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- Avoid: vague tasks, same file conflicts, cross-story dependencies that break independence
- GitHub Actions workflow (T014-T016) can be set up early but needs to run after data structure is defined
- Theme system (US4) can be implemented early and enhances all other stories
- About page (US5) is completely independent and can be done anytime after foundational



