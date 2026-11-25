import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  calculateDatePosition,
  calculateDateRange,
  formatDateToISO,
  generateTimelineData,
  getCurrentDatePosition,
  getDaySize,
  parseDate,
  serialToISO,
} from "../src/lib/date-utils";

const iso = (value: ReturnType<typeof parseDate>) =>
  value ? value.format("YYYY-MM-DD") : null;

describe("parseDate", () => {
  it("parses ISO dates", () => {
    expect(iso(parseDate("2026-09-01"))).toBe("2026-09-01");
  });

  it("parses Brazilian slash dates", () => {
    expect(iso(parseDate("01/09/2026"))).toBe("2026-09-01");
    expect(iso(parseDate("1/9/2026"))).toBe("2026-09-01");
  });

  it("parses two-digit years", () => {
    expect(iso(parseDate("01/09/26"))).toBe("2026-09-01");
  });

  it("parses Excel serial numbers", () => {
    expect(iso(parseDate(45841))).toBe("2025-07-03");
    expect(iso(parseDate("45841"))).toBe("2025-07-03");
    expect(iso(parseDate("45841.625"))).toBe("2025-07-03");
  });

  it("returns null for missing values", () => {
    expect(parseDate("")).toBeNull();
    expect(parseDate(null)).toBeNull();
    expect(parseDate(undefined)).toBeNull();
  });
});

describe("serialToISO", () => {
  it("rejects serials outside the supported range", () => {
    expect(serialToISO(0)).toBeNull();
    expect(serialToISO(-10)).toBeNull();
    expect(serialToISO(Number.NaN)).toBeNull();
  });
});

describe("formatDateToISO", () => {
  it("normalizes every supported input to ISO", () => {
    expect(formatDateToISO("01/09/2026")).toBe("2026-09-01");
    expect(formatDateToISO("2026-09-01")).toBe("2026-09-01");
    expect(formatDateToISO("")).toBeNull();
  });
});

describe("calculateDateRange", () => {
  const tasks = [
    { name: "A", start: "2026-01-10" },
    { name: "B", end: "2026-01-20" },
  ];

  // Today sits inside the task window unless a test moves it.
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-01-15T12:00:00"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("pads the day range by five days on each side", () => {
    const range = calculateDateRange(tasks);

    expect(range.start.format("YYYY-MM-DD")).toBe("2026-01-05");
    expect(range.end.format("YYYY-MM-DD")).toBe("2026-01-25");
  });

  it("snaps the week range to whole Monday-to-Sunday weeks", () => {
    const range = calculateDateRange(tasks, "week");

    expect(range.start.format("YYYY-MM-DD")).toBe("2026-01-05");
    expect(range.start.day()).toBe(1); // Monday
    expect(range.end.format("YYYY-MM-DD")).toBe("2026-01-25");
    expect(range.end.day()).toBe(0); // Sunday
  });

  it("snaps the month range to whole months", () => {
    const range = calculateDateRange(tasks, "month");

    expect(range.start.format("YYYY-MM-DD")).toBe("2026-01-01");
    expect(range.end.format("YYYY-MM-DD")).toBe("2026-01-31");
  });

  it("includes the dates of nested children", () => {
    const range = calculateDateRange([
      { name: "Phase", start: "2026-01-10", children: [
        { name: "Child", end: "2026-01-20" },
      ] },
    ]);

    expect(range.start.format("YYYY-MM-DD")).toBe("2026-01-05");
    expect(range.end.format("YYYY-MM-DD")).toBe("2026-01-25");
  });

  it("spans every touched month when tasks cross a month boundary", () => {
    const range = calculateDateRange(
      [
        { name: "A", start: "2026-01-31" },
        { name: "B", end: "2026-02-01" },
      ],
      "month",
    );

    expect(range.start.format("YYYY-MM-DD")).toBe("2026-01-01");
    expect(range.end.format("YYYY-MM-DD")).toBe("2026-02-28");
  });

  it("turns a month range into full months of days", () => {
    const data = generateTimelineData(
      calculateDateRange(tasks, "month"),
      "month",
    );

    expect(data.totalDays).toBe(31);
    expect(data.days[0].date).toBe("2026-01-01");
    expect(data.days[data.days.length - 1].date).toBe("2026-01-31");
  });

  it("falls back to a symmetric range around today", () => {
    vi.setSystemTime(new Date("2026-03-15T12:00:00"));
    const range = calculateDateRange([]);

    expect(range.start.format("YYYY-MM-DD")).toBe("2026-02-13");
    expect(range.end.format("YYYY-MM-DD")).toBe("2026-04-14");
  });

  it("extends the range to today when every task is in the past", () => {
    vi.setSystemTime(new Date("2026-03-15T12:00:00"));
    const range = calculateDateRange(tasks);

    expect(range.start.format("YYYY-MM-DD")).toBe("2026-01-05");
    expect(range.end.format("YYYY-MM-DD")).toBe("2026-03-20");
  });

  it("extends the range back to today when every task is in the future", () => {
    vi.setSystemTime(new Date("2025-12-15T12:00:00"));
    const range = calculateDateRange(tasks);

    expect(range.start.format("YYYY-MM-DD")).toBe("2025-12-10");
    expect(range.end.format("YYYY-MM-DD")).toBe("2026-01-25");
  });

  it("keeps whole granularity units when extending toward today", () => {
    vi.setSystemTime(new Date("2026-03-15T12:00:00"));

    const week = calculateDateRange(tasks, "week");
    expect(week.start.format("YYYY-MM-DD")).toBe("2026-01-05"); // Monday
    expect(week.end.format("YYYY-MM-DD")).toBe("2026-03-15"); // Sunday

    const month = calculateDateRange(tasks, "month");
    expect(month.start.format("YYYY-MM-DD")).toBe("2026-01-01");
    expect(month.end.format("YYYY-MM-DD")).toBe("2026-03-31");
  });
});

describe("generateTimelineData", () => {
  const range = {
    start: parseDate("2026-01-01")!,
    end: parseDate("2026-01-10")!,
  };

  it("includes both range ends", () => {
    const data = generateTimelineData(range, "day");

    expect(data.totalDays).toBe(10);
    expect(data.days[0].date).toBe("2026-01-01");
    expect(data.days[9].date).toBe("2026-01-10");
    expect(data.dayIndex.get("2026-01-05")).toBe(4);
  });

  it("uses a day size per granularity", () => {
    expect(getDaySize("day")).toBe(24);
    expect(getDaySize("week")).toBe(10);
    expect(getDaySize("month")).toBe(3);
    expect(generateTimelineData(range, "week").daySize).toBe(10);
  });

  it("adds week and month labels for the coarser granularities", () => {
    const week = generateTimelineData(range, "week");
    const month = generateTimelineData(range, "month");

    expect(week.days[0].weekLabel).toBeTruthy();
    expect(month.days[0].monthLabel).toBe("janeiro");
  });

  it("maps dates to positions, and unknown dates to -1", () => {
    const data = generateTimelineData(range, "day");

    expect(calculateDatePosition("2026-01-05", data)).toBe(108);
    expect(calculateDatePosition("2025-12-25", data)).toBe(-1);
  });
});

describe("getCurrentDatePosition", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-01-05T12:00:00"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("returns the center of today's day cell", () => {
    const data = generateTimelineData(
      { start: parseDate("2026-01-01")!, end: parseDate("2026-01-10")! },
      "day",
    );

    expect(getCurrentDatePosition(data)).toBe(108);
  });

  it("returns -1 when today is outside the range", () => {
    const data = generateTimelineData(
      { start: parseDate("2026-01-01")!, end: parseDate("2026-01-03")! },
      "day",
    );

    expect(getCurrentDatePosition(data)).toBe(-1);
  });
});
