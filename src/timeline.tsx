import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import dayjs from "dayjs";
import { BiCollapseVertical, BiExpandVertical } from "react-icons/bi";
import { PiCaretDownBold } from "react-icons/pi";
import { cn } from "./lib/cn";
import { Legend } from "./legend";
import { TaskBar } from "./task-bar";
import { TaskPopover } from "./task-popover";
import { TimelineHeader } from "./timeline-header";
import { resolveLabels } from "./labels";
import { getStatusOptions, matchesTimelineFilters } from "./lib/filtering";
import type { TimelineProps, TimelineTask } from "./types";
import {
  calculateDateRange,
  DEFAULT_LOCALE,
  generateTimelineData,
  getCurrentDatePosition,
  getDaySize,
} from "./lib/date-utils";
import { calculateBarMetrics, type BarMetrics } from "./lib/bar-metrics";

const ROW_HEIGHT = 40;
const SIDEBAR_WIDTH = 288;
const HEADER_HEIGHT = 64;

export const Timeline: React.FC<TimelineProps> = ({
  tasks,
  filter = "",
  granularity = "week",
  statusFilter = [],
  extraFieldFilters = {},
  statusField,
  popupFields = [],
  locale = DEFAULT_LOCALE,
  labels: labelOverrides,
  statusColors: initialStatusColors,
  onStatusColorsChange,
  components,
  scrollRef,
  className,
}) => {
  const labels = useMemo(() => resolveLabels(labelOverrides), [labelOverrides]);

  // Any piece the caller did not replace falls back to the default component.
  const {
    TaskBar: TaskBarComponent = TaskBar,
    TaskPopover: TaskPopoverComponent = TaskPopover,
    Legend: LegendComponent = Legend,
    TimelineHeader: TimelineHeaderComponent = TimelineHeader,
  } = components ?? {};

  const [selectedTask, setSelectedTask] = useState<TimelineTask | null>(null);
  const [statusColors, setStatusColors] = useState<Record<string, string>>(
    () => ({ ...initialStatusColors }),
  );
  const [collapsedParents, setCollapsedParents] = useState<Set<number>>(
    () => new Set(),
  );

  const internalScrollRef = useRef<HTMLDivElement>(null);
  const resolvedScrollRef = scrollRef ?? internalScrollRef;

  const timelineData = useMemo(
    () =>
      generateTimelineData(
        calculateDateRange(tasks, granularity),
        granularity,
        locale,
      ),
    [tasks, granularity, locale],
  );
  const currentDatePx = useMemo(
    () => getCurrentDatePosition(timelineData),
    [timelineData],
  );
  const isCurrentDateVisible =
    currentDatePx >= 0 &&
    currentDatePx <= timelineData.totalDays * timelineData.daySize;
  const daySize = getDaySize(granularity);

  const statusOptions = useMemo(
    () => getStatusOptions(tasks, statusField),
    [tasks, statusField],
  );

  // Give custom statuses a starting color so bars are distinguishable.
  useEffect(() => {
    if (!statusField || statusOptions.length === 0) return;

    setStatusColors((previous) => {
      const next = { ...previous };
      let changed = false;
      statusOptions.forEach((option, index) => {
        if (!next[option]) {
          const hue = (index * 63 + Math.floor(Math.random() * 30)) % 360;
          next[option] = `hsl(${hue} 70% 60%)`;
          changed = true;
        }
      });
      return changed ? next : previous;
    });
  }, [statusField, statusOptions.join(",")]);

  const handleStatusColorChange = useCallback(
    (label: string, color: string) => {
      const next = { ...statusColors, [label]: color || "#808080" };
      setStatusColors(next);
      onStatusColorsChange?.(next);
    },
    [statusColors, onStatusColorsChange],
  );

  const filterState = useMemo(
    () => ({ filter, statusFilter, extraFieldFilters, statusField }),
    [filter, statusFilter, extraFieldFilters, statusField],
  );

  const taskMatchesFilters = useCallback(
    (task: TimelineTask): boolean => matchesTimelineFilters(task, filterState),
    [filterState],
  );

  const groupedParentRows = useMemo(() => {
    const parents = new Set<number>();

    tasks.forEach((task) => {
      if (typeof task.parentRow === "number") {
        parents.add(task.parentRow);
      }
      if (
        task.isGroupParent &&
        typeof task.row === "number" &&
        Number(task.groupChildCount || 0) > 0
      ) {
        parents.add(task.row);
      }
    });

    return parents;
  }, [tasks]);
  const hasGroupedRows = groupedParentRows.size > 0;

  const initialCollapsedParents = useMemo(() => {
    const rows = new Set<number>();
    tasks.forEach((task) => {
      if (
        task.isGroupParent &&
        typeof task.row === "number" &&
        task.groupCollapsed
      ) {
        rows.add(task.row);
      }
    });
    return rows;
  }, [tasks]);
  const initialCollapsedKey = Array.from(initialCollapsedParents).join(",");

  useEffect(() => {
    if (!hasGroupedRows) {
      setCollapsedParents(new Set());
      return;
    }
    setCollapsedParents(initialCollapsedParents);
  }, [hasGroupedRows, initialCollapsedKey]);

  const filtersActive =
    statusFilter.length > 0 ||
    Object.keys(extraFieldFilters).length > 0 ||
    filter.trim().length > 0;

  const matchingChildParentRows = useMemo(
    () =>
      hasGroupedRows && filtersActive
        ? tasks.reduce((rows: Set<number>, task) => {
            if (typeof task.parentRow === "number" && taskMatchesFilters(task)) {
              rows.add(task.parentRow);
            }
            return rows;
          }, new Set<number>())
        : new Set<number>(),
    [hasGroupedRows, filtersActive, tasks, taskMatchesFilters],
  );

  const effectiveCollapsedParents = useMemo(() => {
    const set = new Set<number>(collapsedParents);
    matchingChildParentRows.forEach((row) => {
      set.delete(row);
    });
    return set;
  }, [collapsedParents, matchingChildParentRows]);

  const displayedTasks = useMemo(() => {
    const hasDate = (task: TimelineTask) => Boolean(task.start);

    if (hasGroupedRows) {
      return tasks.filter((task) => {
        const rowParent =
          typeof task.parentRow === "number" ? task.parentRow : -1;

        if (rowParent >= 0) {
          if (effectiveCollapsedParents.has(rowParent)) return false;
          return taskMatchesFilters(task);
        }

        const rowNumber = typeof task.row === "number" ? task.row : -1;
        const hasChildren = rowNumber >= 0 && groupedParentRows.has(rowNumber);

        if (!hasChildren) {
          return hasDate(task) && taskMatchesFilters(task);
        }

        if (taskMatchesFilters(task)) return true;
        return rowNumber >= 0 && matchingChildParentRows.has(rowNumber);
      });
    }

    return tasks
      .filter((task) => hasDate(task) && taskMatchesFilters(task))
      .sort(
        (a, b) =>
          (a.start ? parseInt(String(a.start).replace(/\//g, "")) : 0) -
          (b.start ? parseInt(String(b.start).replace(/\//g, "")) : 0),
      );
  }, [
    tasks,
    hasGroupedRows,
    effectiveCollapsedParents,
    groupedParentRows,
    matchingChildParentRows,
    taskMatchesFilters,
  ]);

  // Pre-compute bar metrics so scrolling does not allocate dayjs objects.
  const metricsCache = useMemo(() => {
    const cache = new Map<number, BarMetrics | null>();
    displayedTasks.forEach((task, index) => {
      cache.set(
        index,
        calculateBarMetrics(
          task,
          timelineData,
          granularity,
          statusField,
          statusColors,
        ),
      );
    });
    return cache;
  }, [displayedTasks, timelineData, granularity, statusField, statusColors]);

  return (
    <div
      className={cn(
        "timeline-tasks relative flex h-full min-h-0 w-full flex-col bg-background text-foreground",
        className,
      )}
    >
      <div ref={resolvedScrollRef} className="relative min-h-0 flex-1 overflow-auto">
        {/*
          CSS Grid frozen-pane layout:
          - [0,0] Sidebar header: sticky top+left (frozen corner)
          - [0,1] Timeline header: sticky top (scrolls horizontally)
          - [1,0] Sidebar body: sticky left (scrolls vertically)
          - [1,1] Timeline body: scrolls freely in both directions
        */}
        <div
          className="grid"
          style={{
            width: `max(100%, ${SIDEBAR_WIDTH + timelineData.totalDays * daySize}px)`,
            height: `${HEADER_HEIGHT + displayedTasks.length * ROW_HEIGHT}px`,
            gridTemplateColumns: `${SIDEBAR_WIDTH}px ${timelineData.totalDays * daySize}px`,
          }}
        >
          {/* ── [0,0] Sidebar header — frozen corner ─────────────── */}
          <div className="sticky top-0 left-0 z-50 h-16 border-b border-border bg-muted flex items-center justify-between px-4">
            <span className="font-semibold text-sm text-foreground">
              {labels.tasksHeader}
            </span>
            {hasGroupedRows ? (
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setCollapsedParents(new Set())}
                  className="cursor-pointer rounded-lg p-2 text-muted-foreground hover:bg-muted"
                  title={labels.expandAll}
                  aria-label={labels.expandAll}
                >
                  <BiExpandVertical />
                </button>
                <button
                  type="button"
                  onClick={() => setCollapsedParents(new Set(groupedParentRows))}
                  className="cursor-pointer rounded-lg p-2 text-muted-foreground hover:bg-muted"
                  title={labels.collapseAll}
                  aria-label={labels.collapseAll}
                >
                  <BiCollapseVertical />
                </button>
              </div>
            ) : null}
          </div>

          {/* ── [0,1] Timeline header — sticks to top ─────────────── */}
          <div className="sticky top-0 z-40 bg-muted border-b border-border">
            <TimelineHeaderComponent
              timelineData={timelineData}
              granularity={granularity}
              daySize={daySize}
              locale={locale}
              weekRangeSeparator={labels.weekRangeSeparator}
            />
            {isCurrentDateVisible &&
              (granularity === "week" || granularity === "month") && (
                <div
                  className="absolute z-30 flex h-5 w-5 items-center justify-center rounded-full bg-timeline-today text-xs font-bold text-white pointer-events-none"
                  style={{ left: `${currentDatePx - 10}px`, top: "50px" }}
                >
                  {dayjs().date()}
                </div>
              )}
          </div>

          {/* ── [1,0] Sidebar body — sticks to left ───────────────── */}
          <div className="sticky left-0 z-30 border-r border-border bg-background overflow-hidden">
            {displayedTasks.map((task, index) => {
              const rowNumber = typeof task.row === "number" ? task.row : -1;
              const isChild = typeof task.parentRow === "number";
              const hasChildren =
                rowNumber >= 0 && groupedParentRows.has(rowNumber);
              const isCollapsed =
                rowNumber >= 0 && effectiveCollapsedParents.has(rowNumber);

              return (
                <div
                  key={task.row ?? `row-${index}`}
                  className="h-10 flex items-center px-4 text-sm hover:bg-muted/30 cursor-pointer border-b border-border"
                  onClick={() => setSelectedTask(task)}
                >
                  <div className="flex min-w-0 items-center">
                    {hasChildren ? (
                      <button
                        type="button"
                        className="mr-1 flex h-5 w-5 shrink-0 cursor-pointer items-center justify-center rounded hover:bg-muted/60"
                        onClick={(event) => {
                          event.stopPropagation();
                          setCollapsedParents((previous) => {
                            const next = new Set(previous);
                            if (next.has(rowNumber)) next.delete(rowNumber);
                            else next.add(rowNumber);
                            return next;
                          });
                        }}
                        aria-label={
                          isCollapsed ? labels.expandGroup : labels.collapseGroup
                        }
                      >
                        <PiCaretDownBold
                          className={cn(
                            "transition-transform duration-200",
                            isCollapsed ? "rotate-0" : "rotate-180",
                          )}
                        />
                      </button>
                    ) : (
                      <span className="mr-1 inline-block h-5 w-5 shrink-0" />
                    )}
                    <span className={cn("truncate", isChild && "ml-3")}>
                      {task.name}
                    </span>
                  </div>
                </div>
              );
            })}
            {displayedTasks.length === 0 && (
              <div className="p-4 text-center text-sm text-muted-foreground italic">
                {labels.empty}
              </div>
            )}
          </div>

          {/* ── [1,1] Timeline body — scrolls freely ──────────────── */}
          <div className="relative">
            {displayedTasks.map((task, index) => (
              <div
                key={task.row ?? `bar-${index}`}
                className="h-10 relative hover:bg-muted/30 flex items-center border-b border-border"
              >
                <TaskBarComponent
                  task={task}
                  timelineData={timelineData}
                  granularity={granularity}
                  onSelect={setSelectedTask}
                  statusField={statusField}
                  statusColors={statusColors}
                  metrics={metricsCache.get(index)}
                />
              </div>
            ))}

            {isCurrentDateVisible && (
              <div
                className="absolute z-0 w-0.5 bg-timeline-today pointer-events-none"
                style={{
                  left: `${currentDatePx}px`,
                  top: 0,
                  height: `${Math.max(displayedTasks.length * ROW_HEIGHT, 24)}px`,
                }}
              />
            )}
          </div>
        </div>
      </div>

      <LegendComponent
        labels={labels}
        statusOptions={statusOptions}
        statusColors={statusColors}
        hasCustomStatusField={Boolean(statusField)}
        onColorChange={handleStatusColorChange}
      />

      {selectedTask && (
        <TaskPopoverComponent
          task={selectedTask}
          popupFields={popupFields}
          onClose={() => setSelectedTask(null)}
          statusField={statusField}
          statusColors={statusColors}
          locale={locale}
          labels={labels}
        />
      )}
    </div>
  );
};
