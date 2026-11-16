# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/)
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- GitHub Pages deployment of the demo (`pnpm build:pages` +
  `.github/workflows/pages.yml`).

- `useTimeline()` hook exporting the timeline state and actions (`filter`,
  `granularity`, status and field filters, `scrollToToday`, scroll visibility,
  `timelineData`), plus `getFilterOptions`, `getStatusOptions`,
  `matchesTimelineFilters` and `hasActiveFilters`.

- semantic-release: pushes to `main` are versioned, changelogged and published
  to npm from `.github/workflows/release.yml`.

### Fixed

- The visible range now snaps to the selected granularity: whole weeks
  (Monday–Sunday) for `week`, whole months for `month`, so changing the zoom
  level recalculates the range instead of keeping edges in the middle of a week
  or month.

- Task bars rendered as a smaller colored block inside the browser's native
  button chrome (UA padding/border, and borders were invisible without
  Tailwind's preflight). The bar is now a single element; a minimal reset
  scoped to `.timeline-tasks` restores `box-sizing`, solid borders and bare
  buttons.

### Removed

- The component's title bar, search box, filter pills, zoom toggle and "today"
  button (`Controls` and the internal `ui/` primitives, and the `title`,
  `updatedAt`, `sourceUrl`, `filterFields` props). Build these with
  `useTimeline()`; `Labels` no longer carries toolbar strings.

- `demo/` app served by `npm run dev`, exercising grouping, filters, the task
  popover, editable status colors and dark mode.

### Changed

- The shipped stylesheet now defines its colors as `--tt-*` variables scoped to
  the `.timeline-tasks` root element instead of global `--color-*` tokens, so
  consumers need no Tailwind theme setup and the package cannot clash with an
  app's theme.

## [0.1.0] - 2026-11-16

### Added

- `Timeline` component extracted from the gsheets-timeline app: frozen sidebar
  and header, day/week/month granularity, task bars, overdue and delay
  overlays, "completed before the due date" markers, current-day line and
  scroll-to-today, grouping with collapsible parents, text and field filters,
  legend with status color pickers, and a task detail popover.
- Precompiled `timeline-tasks/styles.css` (Tailwind v4 theme tokens and
  utilities, no preflight) so consumers do not need Tailwind.
- `locale` prop plus overridable `labels` for UI strings and status names.
- Public `TimelineTask` type, typed props, and exported date/status helpers
  (`parseDate`, `calculateDateRange`, `calculateBarMetrics`, ...).
- Build, typecheck and test scripts, ESM + CJS + type declarations output, and
  publishing scripts (`release:patch`, `release:minor`, `release:major`).

### Changed from the original app component

- Sheets-specific internals renamed: `__sheetRow` → `row`,
  `__groupParentRow` → `parentRow`, `__isGroupParent` → `isGroupParent`,
  `__groupChildCount` → `groupChildCount`, `__groupCollapsed` → `groupCollapsed`.
- `sheetUrl` → `sourceUrl`, `generatedAt` → `updatedAt`.
- Derived statuses use stable identifiers (`not-started`, `in-progress`,
  `overdue`, `done`) instead of Portuguese literals; display names come from
  `labels`.
- Status color changes flow through props/callbacks instead of the global
  `timeline:status-color-change` window event.
- No global `dayjs.locale()` call: the `locale` prop drives formatting.

[Unreleased]: https://github.com/leosole/timeline-tasks/compare/v0.1.0...HEAD
[0.1.0]: https://github.com/leosole/timeline-tasks/releases/tag/v0.1.0
