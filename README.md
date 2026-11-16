# timeline-tasks

A React timeline component for project tasks: a frozen task sidebar, day/week/
month zoom levels, task bars with due dates, delay and overdue overlays, grouping
with collapsible parents, filters, a status legend with color pickers and a task
detail popover.

Extracted from a Google Sheets timeline app, but it has no knowledge of Google
Sheets — you pass plain task objects.

<!-- prettier-ignore -->
| Feature | Notes |
| --- | --- |
| Zoom levels | day, week, month |
| Bars | start → end, falls back to due date, minimum 4px |
| Overlays | overdue stripes, delay stripes, "completed before due" marker |
| Today | current-day line, day badge and scroll-to-today button |
| Grouping | mark rows as group parents, collapse/expand per group or all |
| Filtering | filter state and helpers; you render the controls |
| Colors | built-in status colors, editable in the legend, or pass your own |
| Theming | light/dark via CSS custom properties |
| i18n | `locale` prop and overridable labels (defaults in pt-BR) |

## Install

```bash
npm install timeline-tasks
```

`react` 18 or 19 is a peer dependency. `dayjs`, `react-icons`, `clsx` and
`tailwind-merge` are installed with the package.

## Quick start

```tsx
import { Timeline, type TimelineTask } from "timeline-tasks";
import "timeline-tasks/styles.css";

const tasks: TimelineTask[] = [
  {
    name: "Design review",
    start: "2026-09-01",
    end: "2026-09-05",
    due: "2026-09-04",
    owner: "Ana",
    status: "Building",
  },
  {
    name: "Launch",
    start: "2026-09-06",
    due: "2026-09-12",
    status: "Planning",
  },
];

export function Roadmap() {
  const timeline = useTimeline({
    tasks,
    statusField: "status",
    filterFields: ["owner"],
  });

  return (
    <div style={{ height: "100vh" }} className="flex flex-col">
      {/* Your own toolbar — see "Bring your own controls" below. */}
      <div className="flex gap-2 p-2">
        <input
          value={timeline.filter}
          onChange={(event) => timeline.setFilter(event.target.value)}
          placeholder="Filter tasks..."
        />
        <button onClick={() => timeline.setGranularity("month")}>Month</button>
      </div>

      <div className="min-h-0 flex-1">
        <Timeline
          tasks={tasks}
          filter={timeline.filter}
          granularity={timeline.granularity}
          statusFilter={timeline.statusFilter}
          extraFieldFilters={timeline.extraFieldFilters}
          statusField="status"
          popupFields={["owner"]}
          scrollRef={timeline.scrollRef}
        />
      </div>
    </div>
  );
}
```

The timeline renders no title bar and no toolbar: `Timeline` is the grid, the
legend and the task popover, while `useTimeline()` supplies the state and
actions for controls you build yourself.

It fills its container (`h-full`), so the parent needs an explicit height, and
it manages its own scrolling.

## Task shape

| Field | Type | Description |
| --- | --- | --- |
| `name` | `string` | Row label (required) |
| `start` | `string \| number` | Bar start. ISO (`2026-09-01`), Brazilian (`01/09/2026`) or Excel serial (`45841`) |
| `end` | `string \| number` | Completion date; draws the main bar |
| `due` | `string \| number` | Planned end; used for overdue and early-completion markers |
| `row` | `number` | Stable row id, needed for grouping |
| `parentRow` | `number` | `row` of the group this row belongs to |
| `isGroupParent` | `boolean` | Marks a group header row |
| `groupChildCount` | `number` | Number of children; a parent with 0 is not a group |
| `groupCollapsed` | `boolean` | Starts the group collapsed |

Any other field is allowed (`[key: string]: unknown`) and can be displayed with
`filterFields` / `popupFields`.

```tsx
const grouped: TimelineTask[] = [
  { name: "Phase 1", row: 2, isGroupParent: true, groupChildCount: 2 },
  { name: "Kickoff", row: 3, parentRow: 2, start: "2026-09-01", end: "2026-09-02" },
  { name: "Research", row: 4, parentRow: 2, start: "2026-09-03", due: "2026-09-10" },
];
```

## Props

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `tasks` | `TimelineTask[]` | — | Required. Rows to render |
| `filter` | `string` | `""` | Text filter matched against task names |
| `granularity` | `"day" \| "week" \| "month"` | `"week"` | Zoom level |
| `statusFilter` | `string[]` | `[]` | Keeps tasks with any of these statuses |
| `extraFieldFilters` | `Record<string, string>` | `{}` | Exact matches on extra task fields |
| `popupFields` | `string[]` | `[]` | Fields listed in the task popover |
| `statusField` | `string` | — | Field holding an explicit status |
| `locale` | `string` | `"pt-br"` | dayjs locale for month/weekday/date formatting |
| `labels` | `Partial<TimelineLabels>` | pt-BR | UI strings and status names |
| `statusColors` | `Record<string, string>` | `{}` | Initial colors keyed by status label |
| `onStatusColorsChange` | `(colors) => void` | — | Called when a color is picked in the legend |
| `scrollRef` | `RefObject<HTMLDivElement>` | — | Usually `useTimeline().scrollRef`; enables `scrollToToday()` |
| `className` | `string` | — | Extra classes on the root element |

## Bring your own controls

`Timeline` renders the grid, the legend and the task popover — nothing above it.
The title, search box, status pills, field dropdowns, zoom buttons and "today"
button are yours; `useTimeline` gives you the state and the actions behind them:

```tsx
import { Timeline, useTimeline } from "timeline-tasks";

export function Roadmap({ tasks }: { tasks: TimelineTask[] }) {
  const timeline = useTimeline({
    tasks,
    statusField: "status",
    filterFields: ["owner"],
  });

  return (
    <div style={{ height: "100vh" }} className="flex flex-col">
      <div className="flex flex-wrap items-center gap-2 p-2">
        <input
          value={timeline.filter}
          onChange={(event) => timeline.setFilter(event.target.value)}
          placeholder="Filter tasks..."
        />

        {timeline.statusOptions.map((status) => (
          <button
            key={status}
            aria-pressed={timeline.statusFilter.includes(status)}
            onClick={() => timeline.toggleStatus(status)}
          >
            {status}
          </button>
        ))}

        {Object.entries(timeline.filterOptions).map(([field, values]) => (
          <select
            key={field}
            value={timeline.extraFieldFilters[field] ?? ""}
            onChange={(event) =>
              timeline.setExtraFieldFilter(field, event.target.value)
            }
          >
            <option value="">{field}</option>
            {values.map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </select>
        ))}

        {(["day", "week", "month"] as const).map((value) => (
          <button
            key={value}
            aria-pressed={timeline.granularity === value}
            onClick={() => timeline.setGranularity(value)}
          >
            {value}
          </button>
        ))}

        {timeline.showScrollToToday && (
          <button onClick={timeline.scrollToToday}>Today</button>
        )}
      </div>

      <div className="min-h-0 flex-1">
        <Timeline
          tasks={tasks}
          filter={timeline.filter}
          granularity={timeline.granularity}
          statusFilter={timeline.statusFilter}
          extraFieldFilters={timeline.extraFieldFilters}
          statusField="status"
          scrollRef={timeline.scrollRef}
        />
      </div>
    </div>
  );
}
```

What `useTimeline` returns:

| Field | Description |
| --- | --- |
| `filter`, `setFilter` | text filter |
| `granularity`, `setGranularity` | zoom level (`day` \| `week` \| `month`) |
| `statusFilter`, `setStatusFilter`, `toggleStatus`, `clearStatusFilter` | status filtering |
| `extraFieldFilters`, `setExtraFieldFilter(field, value)` | dropdown filtering |
| `clearFilters`, `hasActiveFilters` | reset everything / detect active filters |
| `filterOptions` | `{ field: values[] }` for your dropdowns |
| `statusOptions` | distinct status values for your pills |
| `timelineData` | computed range and geometry, e.g. for your own date header |
| `scrollRef` | pass to `<Timeline scrollRef={...}>` |
| `scrollToToday`, `showScrollToToday` | center today / show a button when it is off-screen |

If you keep the state somewhere else (URL, store), skip the hook and pass
`filter`, `granularity`, `statusFilter` and `extraFieldFilters` yourself.

## Statuses

Without `statusField`, statuses are derived from the dates:

| Status | Meaning | Default color |
| --- | --- | --- |
| `not-started` | no start, or start in the future | `#9ca3af` |
| `in-progress` | started, no end date | `#facc15` |
| `overdue` | the due date passed before the task finished | `#ef4444` |
| `done` | has an end date | `#22c55e` |

With `statusField`, the field value is used verbatim (e.g. `"Blocked"`), gets a
generated color in the legend, and can be recolored there. The date-based
overdue/delay overlays still apply.

## Styling

### One import, no configuration

```ts
import "timeline-tasks/styles.css";
```

That is the whole setup. **No Tailwind installation and no token definitions
are required** — whether or not your app uses Tailwind.

The stylesheet bundles the utility classes the component uses and defines every
color it needs on the `.timeline-tasks` root element. Those variables are
namespaced with `--tt-`, so your theme cannot change the timeline's colors and
the timeline cannot change yours. It ships no Tailwind preflight, so it never
resets your app's styles; the only reset it contains is a minimal one scoped to
`.timeline-tasks` (`box-sizing`, visible borders and unstyled buttons), which
the bars need to render correctly.

### Changing colors (optional)

Override any variable on `.timeline-tasks`, in your own stylesheet:

```css
.timeline-tasks {
  --tt-primary: #6366f1;
  --tt-timeline-today: #6366f1;
  --tt-border: #e5e7eb;
}
```

| Variable | Used for | Default (light) | Default (dark) |
| --- | --- | --- | --- |
| `--tt-background` | component background, row background | `#ffffff` | `#1a1a1a` |
| `--tt-card` | title bar and controls bar | `#f8f9fa` | `#2d2d2d` |
| `--tt-foreground` | text | `#1a1a1a` | `#e5e5e5` |
| `--tt-muted-foreground` | secondary text | `#666666` | `#999999` |
| `--tt-muted` | grid headers, footer, hover | `#f0f0f0` | `#333333` |
| `--tt-border` | borders and grid lines | `#e0e0e0` | `#404040` |
| `--tt-primary` | active toggle, filter pills, today button | `#4a90d9` | `#4a90d9` |
| `--tt-primary-hover` | today button hover | `#417cbb` | `#417cbb` |
| `--tt-secondary` | hover crosshair | `#6c757d` | `#6c757d` |
| `--tt-timeline-today` | today line and day badge | `#4a90d9` | `#4a90d9` |

Status colors are not CSS variables: pass `statusColors`, or let users pick them
in the legend (`onStatusColorsChange` reports the result).

### Dark mode

Add the `dark` class to any ancestor (`<html class="dark">`) and the defaults
switch automatically. To use your own dark palette, override the `--tt-*`
variables in the dark scope:

```css
.dark .timeline-tasks {
  --tt-background: #101014;
  --tt-card: #16161c;
  --tt-timeline-today: #60a5fa;
}
```

## Localization

`locale` handles dates and weekday/month names. Strings rendered *inside* the
component (sidebar header, legend, popover, empty state) come from `labels`;
the text in your own toolbar is yours to write. Pass any subset of the labels:

```tsx
<Timeline
  tasks={tasks}
  locale="en"
  labels={{
    tasksHeader: "Tasks",
    empty: "No tasks found",
    weekRangeSeparator: " – ",
    legendOverdue: "Due (overdue)",
    legendCompletedEarly: "Completed early",
    legendToday: "Today",
    statuses: {
      "not-started": "Not started",
      "in-progress": "In progress",
      overdue: "Overdue",
      done: "Done",
    },
    popover: { start: "Start", end: "End", due: "Due", close: "Close" },
    detail: {
      finishedAfterDue: (days) => `Finished ${days} day(s) late`,
      lateBy: (days) => `${days} day(s) overdue`,
      finishedOnTime: "Finished on time",
      finishedEarly: (days) => `Finished ${days} day(s) early`,
      finishedWithoutDue: "Finished (no due date)",
      dueToday: "Due today",
      dueInDays: (days) => `Due in ${days} day(s)`,
      withinDeadline: "On schedule",
    },
  }}
/>
```

Non-pt-BR locales need their dayjs data imported once in your app, e.g.
`import "dayjs/locale/en";`. `pt-br` is bundled with the package.

## Exported helpers

Everything the component uses internally is available for reuse:

```ts
import {
  useTimeline,             // headless state + actions for your own controls
  getFilterOptions,
  getStatusOptions,
  matchesTimelineFilters,
  hasActiveFilters,
  parseDate,               // "01/09/2026" | "2026-09-01" | 45841 → dayjs
  formatDateToISO,
  serialToISO,
  calculateDateRange,
  generateTimelineData,
  calculateDatePosition,
  getCurrentDatePosition,
  getDaySize,
  calculateBarMetrics,
  getTaskStatuses,
  pickPrimaryStatus,
  DEFAULT_STATUS_COLORS,
  DEFAULT_LABELS,
  resolveLabels,
  cn,
} from "timeline-tasks";
```

## Development

This repository uses [pnpm](https://pnpm.io/); the version is pinned in
`packageManager`, so `corepack enable` makes the right `pnpm` available.

```bash
pnpm install
pnpm dev        # demo app with hot reload → http://localhost:5173
pnpm build:demo # static build of the demo (demo/dist)
pnpm dev:build  # rebuild the package dist on change
pnpm typecheck
pnpm test
pnpm build      # dist/index.js, dist/index.cjs, dist/index.d.ts, dist/task-timeline.css
pnpm pack:check # dry-run of the published tarball
```

`pnpm dev` serves the demo app in `demo/` — sample grouped tasks, a toolbar
built with `useTimeline` (search, status pills, field dropdown, zoom, today
button), the task popover, editable status colors and a dark-mode toggle —
running against `src/` directly, so component edits hot reload. The demo is not
part of the published package.

Tests cover the date helpers, bar geometry and the filtering helpers; the
component itself has no DOM test suite.

## Publishing

Releases are automated with [semantic-release](https://semantic-release.gitbook.io/).
Pushing a conventional commit to `main` makes
`.github/workflows/release.yml` run the typecheck, the tests and the build, then:

1. work out the next version from the commits since the last tag
   (`fix:` → patch, `feat:` → minor, `BREAKING CHANGE:` → major, other types → no release);
2. prepend the release notes to `CHANGELOG.md` and bump `package.json`;
3. publish to npm;
4. create the git tag and GitHub release;
5. commit the version and changelog back to `main` with `[skip ci]`.

The published name is `timeline-tasks`. Nothing is published manually, and a
commit that does not match the convention (e.g. `docs:`, `chore:`) does not
release.

### Required secrets

Add these under **Settings → Secrets and variables → Actions** in the GitHub
repository:

| Secret | Required | What it is |
| --- | --- | --- |
| `NPM_TOKEN` | Yes | npm access token that may publish `timeline-tasks` |
| `GITHUB_TOKEN` | No action needed | Provided automatically by Actions; the workflow uses it for the tag, release and comment. Only create a PAT if the org disables the default token |

Create `NPM_TOKEN` at **npmjs.com → Access Tokens → Generate New Token** as a
*Granular Access Token*:

- Packages and scopes: **Read and write** (or scope it to `timeline-tasks`);
- Organizations: none (the package is unscoped);
- **Bypass two-factor authentication** enabled, otherwise the CI publish fails
  with an OTP error.

A classic *Automation* token also works. Then add it as the `NPM_TOKEN`
repository secret — never commit it.

### First run

`main` must contain a `package.json` with the exact version you want to start
from (`0.1.0`). semantic-release publishes the *next* version derived from
commits, and commits such as `feat:` will produce `0.2.0` as the first release.
If you want `0.1.0` itself on npm, publish it locally once
(`pnpm login && pnpm publish`) before wiring the workflow — semantic-release
then continues from there.

To preview what the next release would be without publishing, run
`pnpm release:dry-run` locally with `GITHUB_TOKEN` set and a git remote
configured.

`prepublishOnly` still runs the typecheck, the tests and the build before every
publish, so a broken build never reaches the registry. Publishing also skips
anything outside `files` (`dist` plus the docs), so sources, tests and
`node_modules` are never uploaded.

## License

MIT
