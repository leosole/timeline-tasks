import type { DerivedStatus } from "./lib/status";

export interface TimelinePopoverLabels {
  start: string;
  end: string;
  due: string;
  close: string;
}

export interface TimelineDetailLabels {
  finishedAfterDue: (days: number) => string;
  lateBy: (days: number) => string;
  finishedOnTime: string;
  finishedEarly: (days: number) => string;
  finishedWithoutDue: string;
  dueToday: string;
  dueInDays: (days: number) => string;
  withinDeadline: string;
}

export interface TimelineLabels {
  tasksHeader: string;
  empty: string;
  expandAll: string;
  collapseAll: string;
  expandGroup: string;
  collapseGroup: string;
  /** Placed between the first and last day of a week header cell. */
  weekRangeSeparator: string;
  legendOverdue: string;
  legendCompletedEarly: string;
  legendToday: string;
  statuses: Record<DerivedStatus, string>;
  popover: TimelinePopoverLabels;
  detail: TimelineDetailLabels;
}

export const DEFAULT_LABELS: TimelineLabels = {
  tasksHeader: "Tasks",
  empty: "No tasks to display",
  expandAll: "Expand all",
  collapseAll: "Collapse all",
  expandGroup: "Expand group",
  collapseGroup: "Collapse group",
  weekRangeSeparator: " to ",
  legendOverdue: "Due (late)",
  legendCompletedEarly: "Done early",
  legendToday: "Today",
  statuses: {
    "not-started": "Not started",
    "in-progress": "Doing",
    overdue: "Late",
    done: "Done",
  },
  popover: {
    start: "Start",
    end: "End",
    due: "Due",
    close: "Close",
  },
  detail: {
    finishedAfterDue: (days) => `Done ${days} days after due date`,
    lateBy: (days) => `${days} days late`,
    finishedOnTime: "Done on time",
    finishedEarly: (days) => `Done ${days} days before due date`,
    finishedWithoutDue: "Done without due date",
    dueToday: "Due today",
    dueInDays: (days) => `Due in ${days} days`,
    withinDeadline: "On time",
  },
};

export const resolveLabels = (
  overrides?: Partial<TimelineLabels>,
): TimelineLabels => ({
  ...DEFAULT_LABELS,
  ...overrides,
  statuses: { ...DEFAULT_LABELS.statuses, ...overrides?.statuses },
  popover: { ...DEFAULT_LABELS.popover, ...overrides?.popover },
  detail: { ...DEFAULT_LABELS.detail, ...overrides?.detail },
});
