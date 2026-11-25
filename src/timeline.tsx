import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import dayjs from "dayjs";
import { cn } from "./lib/cn";
import { Legend } from "./legend";
import { TaskBar } from "./task-bar";
import { TaskHeader } from "./task-header";
import { TaskListItem } from "./task-list-item";
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
import {
  getGroupTaskIds,
  getInitiallyCollapsedTaskIds,
  getVisibleTaskRows,
} from "./lib/tasks";

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
    TaskHeader: TaskHeaderComponent = TaskHeader,
    TaskListItem: TaskListItemComponent = TaskListItem,
  } = components ?? {};

  const [selectedTask, setSelectedTask] = useState<TimelineTask | null>(null);
  const [statusColors, setStatusColors] = useState<Record<string, string>>(
    () => ({ ...initialStatusColors }),
  );
  const [collapsedIds, setCollapsedIds] = useState<Set<string>>(
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

  const toggleGroup = useCallback((id: string) => {
    setCollapsedIds((previous) => {
      const next = new Set(previous);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

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

  const allGroupIds = useMemo(() => getGroupTaskIds(tasks), [tasks]);
  const hasGroupedRows = allGroupIds.length > 0;

  const initialCollapsedIds = useMemo(
    () => getInitiallyCollapsedTaskIds(tasks),
    [tasks],
  );
  const initialCollapsedKey = useMemo(
    () => Array.from(new Set(initialCollapsedIds)).sort().join(","),
    [initialCollapsedIds],
  );

  useEffect(() => {
    if (!hasGroupedRows) {
      setCollapsedIds(new Set());
      return;
    }
    setCollapsedIds(new Set(initialCollapsedIds));
  }, [hasGroupedRows, initialCollapsedKey]);

  const filtersActive =
    statusFilter.length > 0 ||
    Object.keys(extraFieldFilters).length > 0 ||
    filter.trim().length > 0;

  // Groups holding a matching task are shown expanded while filtering.
  const visibleRows = useMemo(
    () =>
      getVisibleTaskRows(tasks, {
        collapsedIds,
        matches: filtersActive ? taskMatchesFilters : undefined,
      }),
    [tasks, collapsedIds, filtersActive, taskMatchesFilters],
  );

  // Pre-compute bar metrics so scrolling does not allocate dayjs objects.
  const metricsCache = useMemo(() => {
    const cache = new Map<number, BarMetrics | null>();
    visibleRows.forEach((row, index) => {
      cache.set(
        index,
        calculateBarMetrics(
          row.task,
          timelineData,
          granularity,
          statusField,
          statusColors,
        ),
      );
    });
    return cache;
  }, [visibleRows, timelineData, granularity, statusField, statusColors]);

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
            height: `${HEADER_HEIGHT + visibleRows.length * ROW_HEIGHT}px`,
            gridTemplateColumns: `${SIDEBAR_WIDTH}px ${timelineData.totalDays * daySize}px`,
          }}
        >
          {/* ── [0,0] Sidebar header — frozen corner ─────────────── */}
          <div className="sticky top-0 left-0 z-50 h-16 border-b border-border bg-muted">
            <TaskHeaderComponent
              labels={labels}
              hasGroupedRows={hasGroupedRows}
              onExpandAll={() => setCollapsedIds(new Set())}
              onCollapseAll={() => setCollapsedIds(new Set(allGroupIds))}
            />
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
            {visibleRows.map((row) => (
              <TaskListItemComponent
                key={row.id}
                row={row}
                labels={labels}
                onSelect={setSelectedTask}
                onToggleGroup={toggleGroup}
              />
            ))}
            {visibleRows.length === 0 && (
              <div className="p-4 text-center text-sm text-muted-foreground italic">
                {labels.empty}
              </div>
            )}
          </div>

          {/* ── [1,1] Timeline body — scrolls freely ──────────────── */}
          <div className="relative">
            {visibleRows.map((row, index) => (
              <div
                key={row.id}
                className="h-10 relative hover:bg-muted/30 flex items-center border-b border-border"
              >
                <TaskBarComponent
                  task={row.task}
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
                  height: `${Math.max(visibleRows.length * ROW_HEIGHT, 24)}px`,
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
