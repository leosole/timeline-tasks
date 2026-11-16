import dayjs from "dayjs";
import customParseFormat from "dayjs/plugin/customParseFormat";
import localizedFormat from "dayjs/plugin/localizedFormat";
// Registers the pt-br locale data without switching the global dayjs locale.
import "dayjs/locale/pt-br";

dayjs.extend(customParseFormat);
dayjs.extend(localizedFormat);

export type Granularity = "day" | "week" | "month";

/** Locale used for formatting when the `locale` prop is not set. */
export const DEFAULT_LOCALE = "pt-br";

export interface TimelineDay {
  date: string;
  dayLabel: string;
  weekLabel?: string;
  monthLabel?: string;
}

export interface TimelineData {
  days: TimelineDay[];
  startDate: dayjs.Dayjs;
  endDate: dayjs.Dayjs;
  daySize: number;
  totalDays: number;
  /** Precomputed index for O(1) date → dayIndex lookups. */
  dayIndex: Map<string, number>;
}

export const getDaySize = (granularity: Granularity): number => {
  switch (granularity) {
    case "day":
      return 24;
    case "week":
      return 10;
    case "month":
      return 3;
  }
};

/** First day of the week containing `date`. Weeks start on Monday. */
export const startOfWeek = (date: dayjs.Dayjs): dayjs.Dayjs =>
  date.subtract((date.day() + 6) % 7, "day").startOf("day");

/** Last day of the week containing `date`. Weeks start on Monday. */
export const endOfWeek = (date: dayjs.Dayjs): dayjs.Dayjs =>
  startOfWeek(date).add(6, "day").endOf("day");

/** Extra days of context on each side, per granularity. */
const RANGE_PADDING_DAYS: Record<Granularity, number> = {
  day: 5,
  week: 0,
  month: 0,
};

const snapToUnit = (
  date: dayjs.Dayjs,
  granularity: Granularity,
  edge: "start" | "end",
): dayjs.Dayjs => {
  switch (granularity) {
    case "month":
      return edge === "start" ? date.startOf("month") : date.endOf("month");
    case "week":
      return edge === "start" ? startOfWeek(date) : endOfWeek(date);
    default:
      return edge === "start" ? date.startOf("day") : date.endOf("day");
  }
};

/**
 * Visible range for the given tasks, snapped to whole units of `granularity`:
 * full days, whole weeks (Monday to Sunday) or whole months. Changing the
 * granularity therefore recalculates the range instead of leaving it part-way
 * through a week or month.
 */
export const calculateDateRange = (
  tasks: Array<Record<string, unknown>>,
  granularity: Granularity = "day",
) => {
  const now = dayjs();
  let minDate: dayjs.Dayjs | null = null;
  let maxDate: dayjs.Dayjs | null = null;

  for (const task of tasks) {
    const rawDates = [task.start, task.end, task.due];
    for (const raw of rawDates) {
      if (!raw) continue;
      const date = parseDate(raw as string | number);
      if (!date || !date.isValid()) continue;
      if (!minDate || date.isBefore(minDate)) minDate = date;
      if (!maxDate || date.isAfter(maxDate)) maxDate = date;
    }
  }

  if (!minDate || !maxDate) {
    return {
      start: snapToUnit(now.subtract(30, "day"), granularity, "start"),
      end: snapToUnit(now.add(30, "day"), granularity, "end"),
    };
  }

  const padding = RANGE_PADDING_DAYS[granularity];

  return {
    start: snapToUnit(minDate, granularity, "start").subtract(padding, "day"),
    end: snapToUnit(maxDate, granularity, "end").add(padding, "day"),
  };
};

export const generateTimelineData = (
  dateRange: { start: dayjs.Dayjs; end: dayjs.Dayjs },
  granularity: Granularity,
  locale: string = DEFAULT_LOCALE,
): TimelineData => {
  const daySize = getDaySize(granularity);
  const days: TimelineDay[] = [];
  let current = dateRange.start.startOf("day");

  while (
    current.isBefore(dateRange.end) ||
    current.isSame(dateRange.end, "day")
  ) {
    const date = current.format("YYYY-MM-DD");
    days.push({
      date,
      dayLabel: current.format("DD"),
      weekLabel:
        granularity === "week"
          ? current.locale(locale).format("ddd DD/MM")
          : undefined,
      monthLabel:
        granularity === "month"
          ? current.locale(locale).format("MMMM")
          : undefined,
    });
    current = current.add(1, "day");
  }

  const dayIndex = new Map<string, number>();
  for (let i = 0; i < days.length; i++) {
    dayIndex.set(days[i].date, i);
  }

  return {
    days,
    startDate: dateRange.start,
    endDate: dateRange.end,
    daySize,
    totalDays: days.length,
    dayIndex,
  };
};

export const getCurrentDatePosition = (timelineData: TimelineData): number => {
  const today = dayjs().format("YYYY-MM-DD");
  const index = timelineData.dayIndex.get(today);
  if (index === undefined) return -1;
  return index * timelineData.daySize + timelineData.daySize / 2;
};

const BR_DATE_RE = /^(\d{1,2})\/(\d{1,2})\/(\d{2,4})$/;

// Excel serial number → Date. Excel's epoch is 1899-12-30 (serial 0).
// The Sheets API's dateTimeRenderOption=SERIAL_NUMBER returns these serials
// as plain numbers, e.g. 45841 for 2025-07-03 and 45841.625 for a datetime.
// 25569 = days between the Excel epoch and the Unix epoch.
const EXCEL_EPOCH_OFFSET = 25569;
const MS_PER_DAY = 86_400_000;
const SERIAL_MIN = 2; // 1900-01-01
const SERIAL_MAX = 73_706; // 2100-01-01
// Numeric string forms serials can arrive in: "45841", "45841.625".
const SERIAL_LIKE_RE = /^\d{1,6}(\.\d+)?$/;

// Convert an Excel serial (integer or fractional) to an ISO date string
// using UTC arithmetic so the calendar day is stable in every timezone.
export const serialToISO = (serial: number): string | null => {
  if (!Number.isFinite(serial) || serial < SERIAL_MIN || serial > SERIAL_MAX) {
    return null;
  }
  const ms = (serial - EXCEL_EPOCH_OFFSET) * MS_PER_DAY;
  const date = new Date(ms);
  const year = date.getUTCFullYear();
  if (year < 1900 || year > 2100) return null;
  return date.toISOString().slice(0, 10);
};

export const parseDate = (
  date: string | number | null | undefined,
): dayjs.Dayjs | null => {
  if (date === null || date === undefined || date === "") return null;

  // 0. Excel serial number, or its numeric string form.
  if (typeof date === "number" || SERIAL_LIKE_RE.test(String(date))) {
    const iso = serialToISO(Number(date));
    if (iso) return dayjs(iso, "YYYY-MM-DD");
  }

  const trimmed = String(date).trim();

  // 1. DD/MM/YYYY (and DD/MM/YY).
  const brMatch = trimmed.match(BR_DATE_RE);
  if (brMatch) {
    let year = brMatch[3];
    if (year.length === 2) year = `20${year}`;
    return dayjs(
      `${year}-${brMatch[2].padStart(2, "0")}-${brMatch[1].padStart(2, "0")}`,
      "YYYY-MM-DD",
    );
  }

  // 2. Fallback: default parsing (ISO 8601, etc.).
  return dayjs(trimmed);
};

export const formatDateToISO = (
  date: string | number | null | undefined,
): string | null => {
  if (!date) return null;
  const parsed = parseDate(date);
  return parsed?.isValid() ? parsed.format("YYYY-MM-DD") : null;
};

export const calculateDatePosition = (
  date: string,
  timelineData: TimelineData,
): number => {
  const index = timelineData.dayIndex.get(date);
  if (index === undefined) return -1;
  return index * timelineData.daySize + timelineData.daySize / 2;
};
