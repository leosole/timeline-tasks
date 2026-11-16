import { describe, expect, it } from "vitest";
import {
  getFilterOptions,
  getStatusOptions,
  hasActiveFilters,
  matchesTimelineFilters,
} from "../src/lib/filtering";
import type { TimelineTask } from "../src/types";

const tasks: TimelineTask[] = [
  { name: "Design review", status: "Building", owner: "Ana" },
  { name: "Launch", status: "Planning", owner: "Bruno" },
  { name: "QA", status: "Building", owner: "Bruno" },
];

describe("getFilterOptions", () => {
  it("lists distinct sorted values and skips the core fields", () => {
    expect(getFilterOptions(tasks, ["owner", "status", "start"])).toEqual({
      owner: ["Ana", "Bruno"],
    });
  });

  it("returns nothing when no filter fields are configured", () => {
    expect(getFilterOptions(tasks, [])).toEqual({});
  });
});

describe("getStatusOptions", () => {
  it("returns sorted distinct statuses", () => {
    expect(getStatusOptions(tasks, "status")).toEqual(["Building", "Planning"]);
  });

  it("returns nothing without a status field", () => {
    expect(getStatusOptions(tasks, undefined)).toEqual([]);
  });
});

describe("matchesTimelineFilters", () => {
  it("matches names case-insensitively", () => {
    expect(matchesTimelineFilters(tasks[0], { filter: "design" })).toBe(true);
    expect(matchesTimelineFilters(tasks[0], { filter: "zzz" })).toBe(false);
  });

  it("keeps tasks with any of the selected statuses", () => {
    expect(
      matchesTimelineFilters(tasks[0], {
        statusFilter: ["Planning"],
        statusField: "status",
      }),
    ).toBe(false);
    expect(
      matchesTimelineFilters(tasks[0], {
        statusFilter: ["Building", "Planning"],
        statusField: "status",
      }),
    ).toBe(true);
  });

  it("requires exact matches on extra fields", () => {
    expect(
      matchesTimelineFilters(tasks[1], { extraFieldFilters: { owner: "Bruno" } }),
    ).toBe(true);
    expect(
      matchesTimelineFilters(tasks[1], { extraFieldFilters: { owner: "Ana" } }),
    ).toBe(false);
  });

  it("matches everything without filters", () => {
    expect(matchesTimelineFilters(tasks[2], {})).toBe(true);
  });
});

describe("hasActiveFilters", () => {
  it("detects each kind of filter and ignores blank text", () => {
    expect(hasActiveFilters({})).toBe(false);
    expect(hasActiveFilters({ filter: "   " })).toBe(false);
    expect(hasActiveFilters({ filter: "qa" })).toBe(true);
    expect(hasActiveFilters({ statusFilter: ["Done"] })).toBe(true);
    expect(hasActiveFilters({ extraFieldFilters: { owner: "Ana" } })).toBe(true);
  });
});
