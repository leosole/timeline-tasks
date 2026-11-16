import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import dayjs from "dayjs";
import { BiCollapseVertical, BiExpandVertical } from "react-icons/bi";
import { FaExternalLinkAlt } from "react-icons/fa";
import { PiCaretDownBold, PiClock } from "react-icons/pi";
import { cn } from "./lib/cn";
import { Controls } from "./controls";
import { Legend } from "./legend";
import { TaskBar } from "./task-bar";
import { TaskPopover } from "./task-popover";
import { TimelineHeader } from "./timeline-header";
import { resolveLabels } from "./labels";
import type { TimelineProps, TimelineTask } from "./types";
import {
  calculateDateRange,
  DEFAULT_LOCALE,
  generateTimelineData,
  getCurrentDatePosition,
  getDaySize,
  type Granularity,
} from "./lib/date-utils";
import { calculateBarMetrics, type BarMetrics } from "./lib/bar-metrics";
import { getTaskStatuses } from "./lib/status";

const ROW_HEIGHT = 40;
const SIDEBAR_WIDTH = 288;
const HEADER_HEIGHT = 64;
const CORE_FIELDS = new Set(["name", "start", "end", "due", "status"]);

export const Timeline: React.FC<TimelineProps> = ({
  tasks,
  title = "Timeline",
  updatedAt,
  sourceUrl,
  filterFields = [],
  popupFields = [],
  statusField,
  locale = DEFAULT_LOCALE,
  labels: labelOverrides,
  statusColors: initialStatusColors,
  onStatusColorsChange,
  className,
}) => {
  const labels = useMemo(() => resolveLabels(labelOverrides), [labelOverrides]);

  const [filter, setFilter] = useState("");
  const [granularity, setGranularity] = useState<Granularity>("week");
  const [showCurrentDateBtn, setShowCurrentDateBtn] = useState(false);
  const [selectedTask, setSelectedTask] = useState<TimelineTask | null>(null);
  const [statusFilter, setStatusFilter] = useState<string[]>([]);
  const [extraFieldFilters, setExtraFieldFilters] = useState<
    Record<string, string>
  >({});
  const [statusColors, setStatusColors] = useState<Record<string, string>>(
    () => ({ ...initialStatusColors }),
  );
  const [collapsedParents, setCollapsedParents] = useState<Set<number>>(
    () => new Set(),
  );

  const mouseCursorRef = useRef<HTMLDivElement>(null);
  const timelineScrollRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number>(0);

  const dateRange = useMemo(() => calculateDateRange(tasks), [tasks]);
  const timelineData = useMemo(
    () => generateTimelineData(dateRange, granularity, locale),
    [dateRange, granularity, locale],
  );
  const currentDatePx = useMemo(
    () => getCurrentDatePosition(timelineData),
    [timelineData],
  );
  const isCurrentDateVisible =
    currentDatePx >= 0 &&
    currentDatePx <= timelineData.totalDays * timelineData.daySize;
  const daySize = getDaySize(granularity);

  // Filter options from the configured fields, excluding the core ones.
  const filterOptions = useMemo(() => {
    const options: Record<string, string[]> = {};
    if (!filterFields.length) return options;
    filterFields.forEach((field) => {
      if (CORE_FIELDS.has(field.toLowerCase())) return;
      options[field] = [
        ...new Set(tasks.map((task) => String(task[field] ?? "")).filter(Boolean)),
      ].sort();
    });
    return options;
  }, [tasks, filterFields]);

  const statusOptions = useMemo(() => {
    const values = new Set<string>();
    if (statusField) {
      tasks.forEach((task) => {
        const value = task[statusField];
        if (value !== undefined && value !== null && String(value).trim()) {
          values.add(String(value).trim());
        }
      });
    }
    return Array.from(values).sort();
  }, [tasks, statusField]);

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

  const handleExtraFieldFilter = (field: string, value: string) => {
    setExtraFieldFilters((previous) => {
      const next = { ...previous };
      if (value) next[field] = value;
      else delete next[field];
      return next;
    });
  };

  const getTaskStatusMatches = useCallback(
    (task: TimelineTask): string[] => getTaskStatuses(task, statusField),
    [statusField],
  );

  const taskMatchesFilters = useCallback(
    (task: TimelineTask): boolean => {
      if (
        statusFilter.length > 0 &&
        !statusFilter.some((status) =>
          getTaskStatusMatches(task).includes(status),
        )
      ) {
        return false;
      }

      for (const [field, value] of Object.entries(extraFieldFilters)) {
        if (String(task[field] ?? "") !== value) return false;
      }

      return String(task.name ?? "")
        .toLowerCase()
        .includes(filter.toLowerCase());
    },
    [statusFilter, extraFieldFilters, filter, getTaskStatusMatches],
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

  const hasActiveFilters =
    statusFilter.length > 0 ||
    Object.keys(extraFieldFilters).length > 0 ||
    filter.trim().length > 0;

  const matchingChildParentRows = useMemo(
    () =>
      hasGroupedRows && hasActiveFilters
        ? tasks.reduce((rows: Set<number>, task) => {
            if (
              typeof task.parentRow === "number" &&
              taskMatchesFilters(task)
            ) {
              rows.add(task.parentRow);
            }
            return rows;
          }, new Set<number>())
        : new Set<number>(),
    [hasGroupedRows, hasActiveFilters, tasks, taskMatchesFilters],
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

  // Center the current day on mount and whenever the granularity changes.
  useEffect(() => {
    if (isCurrentDateVisible && timelineScrollRef.current) {
      const container = timelineScrollRef.current;
      container.scrollLeft = Math.max(
        0,
        currentDatePx - container.clientWidth / 2,
      );
    }
  }, [granularity]);

  const scrollToToday = useCallback(() => {
    if (timelineScrollRef.current && isCurrentDateVisible) {
      const container = timelineScrollRef.current;
      container.scrollTo({
        left: Math.max(0, currentDatePx - container.clientWidth / 2),
        behavior: "smooth",
      });
    }
  }, [currentDatePx, isCurrentDateVisible]);

  useEffect(() => {
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  const handleScroll = useCallback(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(() => {
      const container = timelineScrollRef.current;
      if (!container) return;
      if (isCurrentDateVisible) {
        const visibleLeft = currentDatePx - timelineData.daySize * 2;
        const visibleRight = currentDatePx + timelineData.daySize * 2;
        setShowCurrentDateBtn(
          !(
            container.scrollLeft <= visibleLeft &&
            container.scrollLeft + container.clientWidth >= visibleRight
          ),
        );
      } else {
        setShowCurrentDateBtn(false);
      }
    });
  }, [currentDatePx, isCurrentDateVisible, timelineData.daySize]);

  const handleMouseMove = useCallback(
    (event: React.MouseEvent<HTMLDivElement>) => {
      const rect = event.currentTarget.getBoundingClientRect();
      if (mouseCursorRef.current) {
        mouseCursorRef.current.style.left = `${event.clientX - rect.left}px`;
        mouseCursorRef.current.style.display = "";
      }
    },
    [],
  );

  const handleMouseLeave = useCallback(() => {
    if (mouseCursorRef.current) {
      mouseCursorRef.current.style.display = "none";
    }
  }, []);

  return (
    <div
      className={cn(
        "timeline-tasks relative flex h-full min-h-0 w-full flex-col bg-background text-foreground",
        className,
      )}
    >
      <header className="shrink-0 bg-card border-b border-border px-4 py-3 flex items-center justify-between">
        <div>
          {sourceUrl ? (
            <a
              href={sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xl font-bold hover:underline flex items-center align-middle gap-2"
            >
              {title} <FaExternalLinkAlt size={12} />
            </a>
          ) : (
            <h1 className="text-xl font-bold">{title}</h1>
          )}
          {updatedAt ? (
            <p className="text-xs text-muted-foreground mt-1 flex gap-1 items-center align-middle">
              <PiClock size={12} /> {updatedAt}
            </p>
          ) : null}
        </div>
      </header>

      <Controls
        filter={filter}
        onFilterChange={setFilter}
        granularity={granularity}
        onGranularityChange={setGranularity}
        scrollToToday={scrollToToday}
        showCurrentDateBtn={showCurrentDateBtn}
        statusFilter={statusFilter}
        onStatusFilterChange={setStatusFilter}
        extraFieldFilters={extraFieldFilters}
        onExtraFieldFilterChange={handleExtraFieldFilter}
        filterOptions={filterOptions}
        statusOptions={statusOptions}
        labels={labels}
      />

      <div
        ref={timelineScrollRef}
        className="relative min-h-0 flex-1 overflow-auto"
        onScroll={handleScroll}
      >
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
          <div
            className="sticky top-0 z-40 bg-muted border-b border-border"
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
          >
            <TimelineHeader
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
              const rowNumber =
                typeof task.row === "number" ? task.row : -1;
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
                          isCollapsed
                            ? labels.expandGroup
                            : labels.collapseGroup
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
          <div
            className="relative"
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
          >
            {displayedTasks.map((task, index) => (
              <div
                key={task.row ?? `bar-${index}`}
                className="h-10 relative hover:bg-muted/30 flex items-center border-b border-border"
              >
                <TaskBar
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

            <div
              ref={mouseCursorRef}
              className="absolute z-0 w-px bg-secondary pointer-events-none"
              style={{
                display: "none",
                top: 0,
                height: `${Math.max(displayedTasks.length * ROW_HEIGHT, 24)}px`,
              }}
            />
          </div>
        </div>
      </div>

      <div className="sticky bottom-0 z-40 bg-muted">
        <Legend
          labels={labels}
          statusOptions={statusOptions}
          statusColors={statusColors}
          hasCustomStatusField={Boolean(statusField)}
          onColorChange={handleStatusColorChange}
        />
      </div>

      {selectedTask && (
        <TaskPopover
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
