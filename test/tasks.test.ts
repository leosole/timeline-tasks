import { describe, expect, it } from "vitest";
import {
  flattenTasks,
  getGroupTaskIds,
  getInitiallyCollapsedTaskIds,
  getVisibleTaskRows,
} from "../src/lib/tasks";
import type { TimelineTask } from "../src/types";

const tasks: TimelineTask[] = [
  {
    name: "Phase 1",
    children: [
      { name: "Kickoff", start: "2026-01-02" },
      {
        name: "Research",
        start: "2026-01-05",
        children: [{ name: "Interviews", start: "2026-01-06" }],
      },
    ],
  },
  { name: "Standalone", start: "2026-02-01" },
  { name: "Undated leaf" },
];

const ids = (rows: ReturnType<typeof getVisibleTaskRows>) =>
  rows.map((row) => row.id);

describe("flattenTasks", () => {
  it("walks the whole tree depth-first", () => {
    expect(flattenTasks(tasks).map((task) => task.name)).toEqual([
      "Phase 1",
      "Kickoff",
      "Research",
      "Interviews",
      "Standalone",
      "Undated leaf",
    ]);
  });
});

describe("getGroupTaskIds", () => {
  it("lists the ids of every task with children", () => {
    expect(getGroupTaskIds(tasks)).toEqual(["0", "0-1"]);
  });

  it("finds groups that start collapsed", () => {
    const collapsed: TimelineTask[] = [
      { name: "Phase", groupCollapsed: true, children: [{ name: "Task" }] },
    ];
    expect(getInitiallyCollapsedTaskIds(collapsed)).toEqual(["0"]);
    expect(getInitiallyCollapsedTaskIds(tasks)).toEqual([]);
  });
});

describe("getVisibleTaskRows", () => {
  it("keeps group headers and dated leaves, and hides undated leaves", () => {
    expect(ids(getVisibleTaskRows(tasks))).toEqual([
      "0",
      "0-0",
      "0-1",
      "0-1-0",
      "1",
    ]);
  });

  it("hides the descendants of a collapsed group", () => {
    const rows = getVisibleTaskRows(tasks, {
      collapsedIds: new Set(["0"]),
    });

    expect(ids(rows)).toEqual(["0", "1"]);
    expect(rows[0].collapsed).toBe(true);
  });

  it("collapses nested groups independently", () => {
    expect(
      ids(getVisibleTaskRows(tasks, { collapsedIds: new Set(["0-1"]) })),
    ).toEqual(["0", "0-0", "0-1", "1"]);
  });

  it("keeps matches and the ancestors leading to them", () => {
    const rows = getVisibleTaskRows(tasks, {
      collapsedIds: new Set(["0", "0-1"]),
      matches: (task) => String(task.name).toLowerCase().includes("interviews"),
    });

    expect(ids(rows)).toEqual(["0", "0-1", "0-1-0"]);
    // Collapsed groups holding a match are shown expanded.
    expect(rows.every((row) => !row.collapsed)).toBe(true);
    expect(rows[2].depth).toBe(2);
  });

  it("shows only the matching branch when a sibling does not match", () => {
    expect(
      ids(
        getVisibleTaskRows(tasks, {
          matches: (task) => task.name === "Kickoff",
        }),
      ),
    ).toEqual(["0", "0-0"]);
  });

  it("returns nothing when no task matches", () => {
    expect(
      getVisibleTaskRows(tasks, { matches: () => false }),
    ).toEqual([]);
  });
});
