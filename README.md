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
| Filtering | text search, status pills, per-field dropdowns |
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
  return (
    <div style={{ height: "100vh" }}>
      <Timeline
        tasks={tasks}
        title="Roadmap"
        updatedAt="Synced 16/11/2026 10:22"
        filterFields={["owner"]}
        popupFields={["owner"]}
        statusField="status"
      />
    </div>
  );
}
```

The timeline fills its container (`h-full`), so the parent needs an explicit
height. It manages its own scrolling.

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
| `title` | `string` | `"Timeline"` | Heading |
| `updatedAt` | `string` | — | Small line under the heading, e.g. a sync timestamp |
| `sourceUrl` | `string \| null` | — | Makes the heading a link to the data source |
| `filterFields` | `string[]` | `[]` | Fields offered as dropdown filters |
| `popupFields` | `string[]` | `[]` | Fields listed in the task popover |
| `statusField` | `string` | — | Field holding an explicit status |
| `locale` | `string` | `"pt-br"` | dayjs locale for month/weekday/date formatting |
| `labels` | `Partial<TimelineLabels>` | pt-BR | UI strings and status names |
| `statusColors` | `Record<string, string>` | `{}` | Initial colors keyed by status label |
| `onStatusColorsChange` | `(colors) => void` | — | Called when a color is picked in the legend |
| `className` | `string` | — | Extra classes on the root element |

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
the timeline cannot change yours. It has no Tailwind preflight either, so it
never resets your app's styles.

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

`locale` handles dates and weekday/month names. For the interface strings, pass
any subset of the labels:

```tsx
<Timeline
  tasks={tasks}
  locale="en"
  labels={{
    tasksHeader: "Tasks",
    filterPlaceholder: "Filter tasks...",
    empty: "No tasks found",
    today: "Today",
    granularityDay: "Day",
    granularityWeek: "Week",
    granularityMonth: "Month",
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
  parseDate,          // "01/09/2026" | "2026-09-01" | 45841 → dayjs
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

```bash
npm install
npm run dev        # demo app with hot reload → http://localhost:5173
npm run build:demo # static build of the demo (demo/dist)
npm run dev:build  # rebuild the package dist on change
npm run typecheck
npm test
npm run build      # dist/index.js, dist/index.cjs, dist/index.d.ts, dist/task-timeline.css
npm run pack:check # npm pack --dry-run, inspect what would be published
```

`npm run dev` serves the demo app in `demo/` — sample grouped tasks, filters,
the task popover, editable status colors and a dark-mode toggle — running
against `src/` directly, so component edits hot reload. The demo is not part of
the published package.

Tests cover the date helpers and bar geometry; the component itself has no DOM
test suite.

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
(`npm login && npm publish`) before wiring the workflow — semantic-release then
continues from there.

To preview what the next release would be without publishing, run
`npm run release:dry-run` locally with `GITHUB_TOKEN` set and a git remote
configured.

`prepublishOnly` still runs the typecheck, the tests and the build before every
publish, so a broken build never reaches the registry. `npm publish` also skips
anything outside `files` (`dist` plus the docs), so sources, tests and
`node_modules` are never uploaded.

## License

MIT
