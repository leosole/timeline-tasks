import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { calculateBarMetrics } from "../src/lib/bar-metrics";
import { getTaskStatuses, pickPrimaryStatus } from "../src/lib/status";
import { generateTimelineData, parseDate } from "../src/lib/date-utils";

const timeline = generateTimelineData(
  { start: parseDate("2026-01-01")!, end: parseDate("2026-01-31")! },
  "day",
);

describe("getTaskStatuses", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-01-20T12:00:00"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("marks future start dates as not started", () => {
    expect(getTaskStatuses({ name: "A", start: "2026-02-01" })).toEqual([
      "not-started",
    ]);
  });

  it("marks started tasks without an end date as in progress", () => {
    expect(getTaskStatuses({ name: "A", start: "2026-01-05" })).toEqual([
      "in-progress",
    ]);
  });

  it("marks tasks with an end date as done", () => {
    expect(getTaskStatuses({ name: "A", start: "2026-01-05", end: "2026-01-08" })).toEqual([
      "done",
    ]);
  });

  it("adds overdue when the due date is in the past", () => {
    expect(
      getTaskStatuses({ name: "A", start: "2026-01-05", due: "2026-01-10" }),
    ).toEqual(["in-progress", "overdue"]);
  });

  it("uses the explicit status field value when configured", () => {
    expect(
      getTaskStatuses(
        { name: "A", start: "2026-01-05", status: "Blocked" },
        "status",
      ),
    ).toEqual(["Blocked"]);
  });

  it("picks the most severe status", () => {
    // `done` outranks `overdue`, matching the app the component came from:
    // a finished-but-late task keeps its done color and gets overdue stripes.
    expect(pickPrimaryStatus(["done", "overdue"])).toBe("done");
    expect(pickPrimaryStatus(["in-progress", "overdue"])).toBe("overdue");
    expect(pickPrimaryStatus(["Blocked"])).toBe("Blocked");
    expect(pickPrimaryStatus([])).toBe("not-started");
  });
});

describe("calculateBarMetrics", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-01-20T12:00:00"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("spans the bar from start to end", () => {
    const metrics = calculateBarMetrics(
      { name: "A", start: "2026-01-05", end: "2026-01-10" },
      timeline,
      "day",
    );

    expect(metrics?.startPx).toBe(108);
    expect(metrics?.barEndPx).toBe(228);
    expect(metrics?.width).toBe(120);
    expect(metrics?.status).toBe("done");
  });

  it("returns null when the task has no usable start date", () => {
    expect(calculateBarMetrics({ name: "A" }, timeline, "day")).toBeNull();
    expect(
      calculateBarMetrics(
        { name: "A", start: "2020-01-01" },
        timeline,
        "day",
      ),
    ).toBeNull();
  });

  it("draws overdue stripes from the due date to today", () => {
    const metrics = calculateBarMetrics(
      { name: "A", start: "2026-01-05", due: "2026-01-10" },
      timeline,
      "day",
    );

    expect(metrics?.statuses).toEqual(["in-progress", "overdue"]);
    expect(metrics?.plannedEndPx).toBe(228);
    expect(metrics?.overdueStartPx).toBe(228);
    expect(metrics?.overdueWidth).toBe(240);
    expect(metrics?.width).toBe(360);
  });

  it("measures how early a task was completed", () => {
    const metrics = calculateBarMetrics(
      { name: "A", start: "2026-01-05", end: "2026-01-08", due: "2026-01-12" },
      timeline,
      "day",
    );

    expect(metrics?.completedEarlyWidth).toBe(96);
    expect(metrics?.width).toBe(168);
    expect(metrics?.overdueWidth).toBeUndefined();
  });

  it("uses explicit statuses and custom colors", () => {
    const task = {
      name: "A",
      start: "2026-01-05",
      end: "2026-01-08",
      status: "Blocked",
    };

    const plain = calculateBarMetrics(task, timeline, "day", "status");
    expect(plain?.status).toBe("Blocked");
    expect(plain?.customColors).toBeUndefined();

    const custom = calculateBarMetrics(
      task,
      timeline,
      "day",
      "status",
      { Blocked: "#123456" },
    );
    expect(custom?.customColors?.bg).toBe("#123456");
  });
});
