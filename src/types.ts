import type { ComponentType, RefObject } from "react";
import type { Granularity, TimelineData } from "./lib/date-utils";
import type { TimelineLabels } from "./labels";
import type { TaskBarProps } from "./task-bar";
import type { TaskHeaderProps } from "./task-header";
import type { TaskListItemProps } from "./task-list-item";
import type { TaskPopoverProps } from "./task-popover";
import type { LegendProps } from "./legend";
import type { TimelineHeaderProps } from "./timeline-header";

/**
 * A task row.
 *
 * `start`, `end` and `due` accept ISO (`2026-09-01`), Brazilian
 * (`01/09/2026`) or Excel serial (`45841`) values. Extra fields are kept so
 * they can be selected with `filterFields` and `popupFields`.
 *
 * Tasks nest through `children`: a task with children is a group header, and
 * its descendants can be collapsed and expanded. Group identity comes from the
 * task's position in the tree, so no row ids are needed.
 */
export interface TimelineTask {
  name: string;
  start?: string | number | null;
  end?: string | number | null;
  due?: string | number | null;
  /** Nested subtasks. A task with children acts as a group header. */
  children?: TimelineTask[];
  /** Starts the group collapsed. */
  groupCollapsed?: boolean;
  [key: string]: unknown;
}

/**
 * Components the timeline renders itself. Every entry is optional: pass your
 * own to replace that piece, or leave it out to keep the default. Custom
 * components receive exactly the same props as the default ones, so a
 * replacement can wrap the original and add to it.
 */
export interface TimelineComponents {
  /** Bar drawn for each task row. */
  TaskBar?: ComponentType<TaskBarProps>;
  /** Detail popover shown when a task is selected. */
  TaskPopover?: ComponentType<TaskPopoverProps>;
  /** Status/overlay legend below the grid. */
  Legend?: ComponentType<LegendProps>;
  /** Date header above the rows. */
  TimelineHeader?: ComponentType<TimelineHeaderProps>;
  /** Frozen corner with the "Tasks" title and expand/collapse buttons. */
  TaskHeader?: ComponentType<TaskHeaderProps>;
  /** One frozen cell of the task list, rendered per visible row. */
  TaskListItem?: ComponentType<TaskListItemProps>;
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
   * Replacements for the components the timeline renders internally. Any
   * omitted entry falls back to the default component.
   */
  components?: TimelineComponents;
  /**
   * Scroll container ref, normally `useTimeline().scrollRef`, so
   * `scrollToToday()` and the scroll tracking work.
   */
  scrollRef?: RefObject<HTMLDivElement | null>;
  className?: string;
}

export type { Granularity, TimelineData, TimelineDay } from "./lib/date-utils";
export type { TimelineLabels } from "./labels";
