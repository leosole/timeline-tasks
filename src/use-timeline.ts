import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { RefObject } from "react";
import {
  calculateDateRange,
  DEFAULT_LOCALE,
  generateTimelineData,
  getCurrentDatePosition,
  type Granularity,
  type TimelineData,
} from "./lib/date-utils";
import {
  getFilterOptions,
  getStatusOptions,
  hasActiveFilters,
} from "./lib/filtering";
import type { TimelineTask } from "./types";

export interface UseTimelineOptions {
  tasks: TimelineTask[];
  /** Field holding an explicit status (enables status filters and colors). */
  statusField?: string;
  /** Extra task fields offered as dropdown filters. */
  filterFields?: string[];
  /** dayjs locale used for month/weekday formatting. */
  locale?: string;
  defaultGranularity?: Granularity;
  defaultFilter?: string;
  defaultStatusFilter?: string[];
  defaultExtraFieldFilters?: Record<string, string>;
  /** Centers today on mount and when the granularity changes. Defaults to true. */
  centerTodayOnMount?: boolean;
}

/**
 * State and actions for the timeline, for building your own header/controls.
 * Render `<Timeline {...timeline} />` or pass the fields you need.
 */
export interface TimelineController {
  filter: string;
  setFilter: (value: string) => void;
  granularity: Granularity;
  setGranularity: (value: Granularity) => void;
  statusFilter: string[];
  setStatusFilter: (value: string[]) => void;
  /** Adds or removes one status from the filter. */
  toggleStatus: (status: string) => void;
  clearStatusFilter: () => void;
  extraFieldFilters: Record<string, string>;
  setExtraFieldFilter: (field: string, value: string) => void;
  /** Resets the text, status and field filters. */
  clearFilters: () => void;
  hasActiveFilters: boolean;
  /** Values per filterable field, for your own dropdowns. */
  filterOptions: Record<string, string[]>;
  /** Distinct status values, for your own filter pills. */
  statusOptions: string[];
  timelineData: TimelineData;
  /** Pass to `<Timeline scrollRef={...} />`. */
  scrollRef: RefObject<HTMLDivElement>;
  /** Scrolls the timeline so today is centered. */
  scrollToToday: () => void;
  /** True while today's marker is off-screen: show your "today" button. */
  showScrollToToday: boolean;
}

export const useTimeline = ({
  tasks,
  statusField,
  filterFields = [],
  locale = DEFAULT_LOCALE,
  defaultGranularity = "week",
  defaultFilter = "",
  defaultStatusFilter = [],
  defaultExtraFieldFilters = {},
  centerTodayOnMount = true,
}: UseTimelineOptions): TimelineController => {
  const [filter, setFilter] = useState(defaultFilter);
  const [granularity, setGranularity] =
    useState<Granularity>(defaultGranularity);
  const [statusFilter, setStatusFilter] =
    useState<string[]>(defaultStatusFilter);
  const [extraFieldFilters, setExtraFieldFilters] = useState<
    Record<string, string>
  >(defaultExtraFieldFilters);
  const [showScrollToToday, setShowScrollToToday] = useState(false);

  const scrollRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number>(0);

  const timelineData = useMemo(
    () =>
      generateTimelineData(calculateDateRange(tasks), granularity, locale),
    [tasks, granularity, locale],
  );
  const currentDatePx = useMemo(
    () => getCurrentDatePosition(timelineData),
    [timelineData],
  );
  const isTodayVisible =
    currentDatePx >= 0 &&
    currentDatePx <= timelineData.totalDays * timelineData.daySize;

  const filterOptions = useMemo(
    () => getFilterOptions(tasks, filterFields),
    [tasks, filterFields],
  );
  const statusOptions = useMemo(
    () => getStatusOptions(tasks, statusField),
    [tasks, statusField],
  );

  const scrollToToday = useCallback(() => {
    const container = scrollRef.current;
    if (!container || !isTodayVisible) return;
    container.scrollTo({
      left: Math.max(0, currentDatePx - container.clientWidth / 2),
      behavior: "smooth",
    });
  }, [currentDatePx, isTodayVisible]);

  const updateScrollState = useCallback(() => {
    const container = scrollRef.current;
    if (!container || !isTodayVisible) {
      setShowScrollToToday(false);
      return;
    }
    const padding = timelineData.daySize * 2;
    setShowScrollToToday(
      !(
        container.scrollLeft <= currentDatePx - padding &&
        container.scrollLeft + container.clientWidth >= currentDatePx + padding
      ),
    );
  }, [currentDatePx, isTodayVisible, timelineData.daySize]);

  // Center today on mount and when the zoom level changes. Re-centering on
  // every task change would fight the user's scrolling, so those are omitted.
  useEffect(() => {
    if (!centerTodayOnMount) return;
    const container = scrollRef.current;
    if (!container || !isTodayVisible) return;
    container.scrollLeft = Math.max(0, currentDatePx - container.clientWidth / 2);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [granularity, centerTodayOnMount]);

  useEffect(() => {
    const container = scrollRef.current;
    if (!container) return;

    const handleScroll = () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(updateScrollState);
    };

    updateScrollState();
    container.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("resize", handleScroll);

    return () => {
      container.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", handleScroll);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [updateScrollState]);

  const toggleStatus = useCallback((status: string) => {
    setStatusFilter((previous) =>
      previous.includes(status)
        ? previous.filter((value) => value !== status)
        : [...previous, status],
    );
  }, []);

  const clearStatusFilter = useCallback(() => setStatusFilter([]), []);

  const setExtraFieldFilter = useCallback((field: string, value: string) => {
    setExtraFieldFilters((previous) => {
      const next = { ...previous };
      if (value) next[field] = value;
      else delete next[field];
      return next;
    });
  }, []);

  const clearFilters = useCallback(() => {
    setFilter("");
    setStatusFilter([]);
    setExtraFieldFilters({});
  }, []);

  return {
    filter,
    setFilter,
    granularity,
    setGranularity,
    statusFilter,
    setStatusFilter,
    toggleStatus,
    clearStatusFilter,
    extraFieldFilters,
    setExtraFieldFilter,
    clearFilters,
    hasActiveFilters: hasActiveFilters({
      filter,
      statusFilter,
      extraFieldFilters,
    }),
    filterOptions,
    statusOptions,
    timelineData,
    scrollRef,
    scrollToToday,
    showScrollToToday,
  };
};
