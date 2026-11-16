import dayjs from "dayjs";
import { parseDate } from "./date-utils";
import type { TimelineTask } from "../types";

/**
 * Statuses derived from a task's dates (when no `statusField` is configured).
 *
 * - `not-started`: no start date, or the start date is in the future
 * - `in-progress`: started and not finished
 * - `overdue`: the due date passed before the task finished
 * - `done`: the task has an end date
 */
export type DerivedStatus = "not-started" | "in-progress" | "overdue" | "done";

/** A derived status, or any custom value coming from `statusField`. */
export type TaskStatus = DerivedStatus | (string & {});

export const DERIVED_STATUSES: DerivedStatus[] = [
  "not-started",
  "in-progress",
  "overdue",
  "done",
];

export const isDerivedStatus = (value: string): value is DerivedStatus =>
  (DERIVED_STATUSES as string[]).includes(value);

/** Default status colors, also used by the legend. */
export const DEFAULT_STATUS_COLORS: Record<DerivedStatus, string> = {
  "in-progress": "#facc15",
  done: "#22c55e",
  overdue: "#ef4444",
  "not-started": "#9ca3af",
};

export interface StatusBarClasses {
  bg: string;
  border: string;
}

/** Utility classes for the default status bar colors. */
export const getStatusBarClasses = (status: DerivedStatus): StatusBarClasses => {
  switch (status) {
    case "in-progress":
      return {
        bg: "bg-yellow-200 dark:bg-yellow-600",
        border: "border-yellow-300 dark:border-yellow-500",
      };
    case "done":
      return {
        bg: "bg-green-200 dark:bg-green-500",
        border: "border-green-300 dark:border-green-400",
      };
    case "overdue":
      return {
        bg: "bg-red-200 dark:bg-red-500",
        border: "border-red-300 dark:border-red-400",
      };
    default:
      return {
        bg: "bg-gray-200 dark:bg-gray-500",
        border: "border-gray-300 dark:border-gray-400",
      };
  }
};

/** Text utility classes for status badges in the task popover. */
export const STATUS_TONE: Record<DerivedStatus, string> = {
  "in-progress": "text-yellow-600 dark:text-yellow-400",
  done: "text-green-600 dark:text-green-400",
  overdue: "text-red-600 dark:text-red-400",
  "not-started": "text-gray-500 dark:text-gray-400",
};

export const STATUS_BORDER: Record<DerivedStatus, string> = {
  "in-progress": "border-yellow-400 dark:border-yellow-600",
  done: "border-green-400 dark:border-green-600",
  overdue: "border-red-400 dark:border-red-600",
  "not-started": "border-gray-400 dark:border-gray-500",
};

export const STATUS_ICON: Record<DerivedStatus, string> = {
  "in-progress": "●",
  done: "✓",
  overdue: "●",
  "not-started": "○",
};

const STATUS_SEVERITY: Record<string, number> = {
  done: 3,
  overdue: 2,
  "in-progress": 1,
  "not-started": 0,
};

const hasStatusValue = (task: TimelineTask, statusField?: string): boolean =>
  Boolean(
    statusField &&
      task[statusField] !== undefined &&
      task[statusField] !== null &&
      String(task[statusField]).trim(),
  );

/**
 * Statuses for a task: the explicit `statusField` value when configured,
 * otherwise statuses derived from its start/end/due dates.
 */
export const getTaskStatuses = (
  task: TimelineTask,
  statusField?: string,
): TaskStatus[] => {
  if (hasStatusValue(task, statusField)) {
    return [String(task[statusField as string]).trim()];
  }

  const now = dayjs().startOf("day");
  const start = parseDate(task.start);
  const end = parseDate(task.end);
  const due = parseDate(task.due);
  const statuses: TaskStatus[] = [];

  if (!start || start.isAfter(now)) {
    statuses.push("not-started");
    return statuses;
  }

  if (end) {
    statuses.push("done");
    if (due && end.isAfter(due)) statuses.push("overdue");
    return statuses;
  }

  statuses.push("in-progress");
  if (due && due.isBefore(now)) statuses.push("overdue");
  return statuses;
};

/** Picks the most severe status, used for the bar color. */
export const pickPrimaryStatus = (statuses: TaskStatus[]): TaskStatus =>
  [...statuses].sort(
    (a, b) => (STATUS_SEVERITY[b] ?? 0) - (STATUS_SEVERITY[a] ?? 0),
  )[0] ?? "not-started";

export const getStatusColorValue = (
  status: string,
  customColors: Record<string, string> = {},
): { bg: string; darkBorder: string; lightBorder: string } | undefined => {
  const custom = customColors[status];
  if (!custom) return undefined;

  return {
    bg: custom,
    darkBorder: `color-mix(in oklab, ${custom} 80%, black 20%);`,
    lightBorder: `color-mix(in oklab, ${custom} 80%, white 20%);`,
  };
};
