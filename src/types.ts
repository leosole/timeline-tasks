import type { RefObject } from "react";
import type { Granularity, TimelineData } from "./lib/date-utils";
import type { TimelineLabels } from "./labels";

/**
 * A task row.
 *
 * `start`, `end` and `due` accept ISO (`2026-09-01`), Brazilian
 * (`01/09/2026`) or Excel serial (`45841`) values. Extra fields are kept so
 * they can be selected with `filterFields` and `popupFields`.
 */
export interface TimelineTask {
  name: string;
  start?: string | number | null;
  end?: string | number | null;
  due?: string | number | null;
  /** Stable row identifier, required for grouping. */
  row?: number;
  /** `row` of the group this task belongs to. */
  parentRow?: number;
  /** Marks this row as a group parent. */
  isGroupParent?: boolean;
  /** Number of children, used to decide whether a row is a group. */
  groupChildCount?: number;
  /** Starts the group collapsed. */
  groupCollapsed?: boolean;
  [key: string]: unknown;
}

/**
 * The timeline itself. It renders no toolbar — feed it the state from
 * `useTimeline` (or your own) and build the header/controls yourself.
 */
export interface TimelineProps {
  tasks: TimelineTask[];
  /** Text filter matched against task names. */
  filter?: string;
  granularity?: Granularity;
  /** Task is kept when it has at least one of these statuses. */
  statusFilter?: string[];
  /** Exact matches on extra task fields. */
  extraFieldFilters?: Record<string, string>;
  /** Task field holding an explicit status. Omit to derive statuses from dates. */
  statusField?: string;
  /** Extra task fields listed in the task popover. */
  popupFields?: string[];
  /** dayjs locale used for month, weekday and date formatting. */
  locale?: string;
  /** Overrides for UI strings and status names. */
  labels?: Partial<TimelineLabels>;
  /**
   * Initial status colors, keyed by status label. The legend's color pickers
   * add to this map and report changes through `onStatusColorsChange`.
   */
  statusColors?: Record<string, string>;
  onStatusColorsChange?: (colors: Record<string, string>) => void;
  /**
   * Scroll container ref, normally `useTimeline().scrollRef`, so
   * `scrollToToday()` and the scroll tracking work.
   */
  scrollRef?: RefObject<HTMLDivElement>;
  className?: string;
}

export type { Granularity, TimelineData, TimelineDay } from "./lib/date-utils";
export type { TimelineLabels } from "./labels";
