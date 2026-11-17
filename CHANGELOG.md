# [1.3.0](https://github.com/leosole/timeline-tasks/compare/v1.2.0...v1.3.0) (2026-11-17)


### Features

* extend date range to include today for past and future tasks ([68f5d4d](https://github.com/leosole/timeline-tasks/commit/68f5d4d5e35f7f739e9451b8f463eee7deed25df))

# [1.2.0](https://github.com/leosole/timeline-tasks/compare/v1.1.0...v1.2.0) (2026-11-17)


### Features

* enhance legend component with generated status colors and export defaults ([51185ec](https://github.com/leosole/timeline-tasks/commit/51185ec9bddf60530aebe9e447933ad466407f8b))

# [1.1.0](https://github.com/leosole/timeline-tasks/compare/v1.0.0...v1.1.0) (2026-11-16)


### Features

* add support for custom components in the timeline ([f90770a](https://github.com/leosole/timeline-tasks/commit/f90770a69bc58c7daf60833129e6494d876aafe9))

# 1.0.0 (2026-11-16)


* feat(api)!: make the timeline headless and fix task bar rendering ([4697443](https://github.com/leosole/timeline-tasks/commit/4697443389164ca417dc35880e3f4a3fa054c4fb))


### Bug Fixes

* snap the visible range to the selected granularity ([93cd285](https://github.com/leosole/timeline-tasks/commit/93cd2851d09c477cc0183068743daf63fcc065c3))


### Features

* add demo app and scope theme colors to the component ([690afb6](https://github.com/leosole/timeline-tasks/commit/690afb6c9cbf2f3526788f4144f029c5b0d32fa6))
* extract the timeline component into a publishable package ([29379c1](https://github.com/leosole/timeline-tasks/commit/29379c11c46d81569cd9c1fef7d0cce2838f453f))


### BREAKING CHANGES

* Timeline no longer accepts title, updatedAt, sourceUrl or
filterFields and renders no toolbar. filter, granularity, statusFilter and
extraFieldFilters are passed in, normally from useTimeline().

🤖 Generated with Codebuff
Co-Authored-By: Codebuff <noreply@codebuff.com>

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

### Changed

- npm releases use [trusted publishing](https://docs.npmjs.com/trusted-publishers)
  (OIDC) instead of an `NPM_TOKEN` secret: the release job grants
  `id-token: write`, `setup-node` no longer sets a registry token, and provenance
  is generated automatically. Requires `semantic-release` 25 with
  `@semantic-release/npm` 13, `@semantic-release/changelog` 7 and
  `@semantic-release/git` 11.

- CI, release and Pages workflows run Node 24 and the current action majors
  (`checkout@v7`, `setup-node@v7`, `pnpm/action-setup@v6`,
  `configure-pages@v6`, `upload-pages-artifact@v5`, `deploy-pages@v5`).

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
