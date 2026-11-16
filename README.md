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

### Precompiled stylesheet (default)

```ts
import "timeline-tasks/styles.css";
```

This ships every utility class the component needs plus the theme tokens. It
contains **no Tailwind preflight**, so it will not reset your app's styles, but
the utility class names (`flex`, `border-border`, ...) live in the global
namespace. Do not also load a second Tailwind build that could conflict.

### Tailwind v4 apps

If you already run Tailwind v4, you can skip the stylesheet and define the
tokens yourself:

```css
@import "tailwindcss";

@custom-variant dark (&:where(.dark, .dark *));

@theme {
  --color-background: #ffffff;
  --color-card: #f8f9fa;
  --color-foreground: #1a1a1a;
  --color-muted-foreground: #666666;
  --color-muted: #f0f0f0;
  --color-border: #e0e0e0;
  --color-primary: #4a90d9;
  --color-primary-hover: #417cbb;
  --color-accent: #c0deff;
  --color-secondary: #6c757d;
  --color-timeline-doing: #eab308;
  --color-timeline-done: #22c55e;
  --color-timeline-overdue: #ef4444;
  --color-timeline-not-started: #9ca3af;
  --color-timeline-today: #4a90d9;
}
```

Then add the package to your Tailwind content sources, e.g.
`@source "../node_modules/timeline-tasks/dist";`.

### Dark mode

Add the `dark` class to any ancestor (`<html class="dark">`) and the shipped
stylesheet switches the token values. Override the tokens to match your theme:

```css
.dark {
  --color-background: #101014;
  --color-card: #16161c;
  --color-timeline-today: #60a5fa;
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
npm run dev        # rebuild JS on change and the stylesheet after each build
npm run typecheck
npm test
npm run build      # dist/index.js, dist/index.cjs, dist/index.d.ts, dist/task-timeline.css
npm run pack:check # npm pack --dry-run, inspect what would be published
```

Tests cover the date helpers and bar geometry; the component itself has no DOM
test suite.

## Publishing

The published name is `timeline-tasks`. First time:

```bash
npm login
npm publish --dry-run   # optional: inspect the tarball
npm publish
```

After the repository exists and a remote is configured:

```bash
git remote add origin git@github.com:<you>/timeline-tasks.git
git push -u origin main
```

For later releases, use the bump scripts, which tag the commit, push it and
publish:

```bash
npm run release:patch
npm run release:minor
npm run release:major
```

`prepublishOnly` runs the typecheck, the tests and the build before every
publish, so a broken build never reaches the registry. `npm publish` also skips
anything outside `files` (`dist` plus the docs), so sources, tests and
`node_modules` are never uploaded.

## License

MIT
