export { Timeline } from "./timeline";
export type { TimelineProps, TimelineTask } from "./types";

export { useTimeline } from "./use-timeline";
export type { TimelineController, UseTimelineOptions } from "./use-timeline";

export {
  getFilterOptions,
  getStatusOptions,
  hasActiveFilters,
  matchesTimelineFilters,
} from "./lib/filtering";
export type { TimelineFilterState } from "./lib/filtering";

export { Legend } from "./legend";
export { TaskBar } from "./task-bar";
export { TaskPopover } from "./task-popover";
export { TimelineHeader } from "./timeline-header";

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
  DEFAULT_STATUS_COLORS,
  DERIVED_STATUSES,
  getStatusBarClasses,
  getStatusColorValue,
  getTaskStatuses,
  isDerivedStatus,
  pickPrimaryStatus,
} from "./lib/status";
export type { DerivedStatus, TaskStatus } from "./lib/status";

export { cn } from "./lib/cn";
