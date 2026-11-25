export { Timeline } from "./timeline";
export type { TimelineComponents, TimelineProps, TimelineTask } from "./types";

export { useTimeline } from "./use-timeline";
export type { TimelineController, UseTimelineOptions } from "./use-timeline";

export {
  getFilterOptions,
  getStatusOptions,
  hasActiveFilters,
  matchesTimelineFilters,
} from "./lib/filtering";
export type { TimelineFilterState } from "./lib/filtering";

export { DEFAULT_STATUS_ORDER, Legend } from "./legend";
export type { LegendProps } from "./legend";
export { TaskBar } from "./task-bar";
export type { TaskBarProps } from "./task-bar";
export { TaskHeader } from "./task-header";
export type { TaskHeaderProps } from "./task-header";
export { TaskListItem } from "./task-list-item";
export type { TaskListItemProps } from "./task-list-item";
export { TaskPopover } from "./task-popover";
export type { TaskPopoverProps } from "./task-popover";
export { TimelineHeader } from "./timeline-header";
export type { TimelineHeaderProps } from "./timeline-header";

export { DEFAULT_LABELS, resolveLabels } from "./labels";
export type {
  TimelineDetailLabels,
  TimelineLabels,
  TimelinePopoverLabels,
} from "./labels";

export {
  DEFAULT_LOCALE,
  calculateDatePosition,
  calculateDateRange,
  formatDateToISO,
  endOfWeek,
  generateTimelineData,
  getCurrentDatePosition,
  getDaySize,
  parseDate,
  serialToISO,
  startOfWeek,
} from "./lib/date-utils";
export type {
  Granularity,
  TimelineData,
  TimelineDay,
} from "./lib/date-utils";

export { calculateBarMetrics } from "./lib/bar-metrics";
export type { BarMetrics } from "./lib/bar-metrics";

export {
  flattenTasks,
  getGroupTaskIds,
  getInitiallyCollapsedTaskIds,
  getTaskChildren,
  getVisibleTaskRows,
} from "./lib/tasks";
export type { GetVisibleTaskRowsOptions, TaskTreeRow } from "./lib/tasks";

export {
  DEFAULT_STATUS_COLORS,
  DERIVED_STATUSES,
  getStatusBarClasses,
  getGeneratedStatusColor,
  getStatusColorValue,
  getTaskStatuses,
  isDerivedStatus,
  pickPrimaryStatus,
  STATUS_BORDER,
  STATUS_ICON,
  STATUS_TONE,
} from "./lib/status";
export type {
  DerivedStatus,
  StatusBarClasses,
  TaskStatus,
} from "./lib/status";

// The same dayjs instance the components use, with its plugins and the pt-br
// locale registered, for custom components that need date math or formatting.
export { default as dayjs } from "dayjs";

export { cn } from "./lib/cn";
