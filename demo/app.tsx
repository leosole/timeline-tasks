import React, { useEffect, useMemo, useState } from "react";
import dayjs from "dayjs";
import { Timeline, type TimelineTask } from "../src";

const day = (offset: number) => dayjs().add(offset, "day").format("YYYY-MM-DD");

const buildTasks = (): TimelineTask[] => [
  {
    name: "Phase 1 · Discovery",
    row: 2,
    isGroupParent: true,
    groupChildCount: 3,
  },
  {
    name: "Kickoff",
    row: 3,
    parentRow: 2,
    start: day(-26),
    end: day(-24),
    due: day(-24),
    status: "Done",
    owner: "Ana",
    notes: "Scope agreed with the team.",
  },
  {
    name: "User research",
    row: 4,
    parentRow: 2,
    start: day(-23),
    due: day(-6),
    status: "Blocked",
    owner: "Bruno",
    notes: "Waiting on interviews from the support team.",
  },
  {
    name: "Prototype",
    row: 5,
    parentRow: 2,
    start: day(-12),
    end: day(-3),
    due: day(-2),
    status: "Done",
    owner: "Ana",
    notes: "Finished a day early.",
  },
  {
    name: "Phase 2 · Delivery",
    row: 6,
    isGroupParent: true,
    groupChildCount: 2,
  },
  {
    name: "Implementation",
    row: 7,
    parentRow: 6,
    start: day(-2),
    due: day(9),
    status: "In progress",
    owner: "Carla",
    notes: "Ship behind a flag first.",
  },
  {
    name: "QA",
    row: 8,
    parentRow: 6,
    start: day(4),
    due: day(14),
    status: "Planning",
    owner: "Bruno",
  },
  {
    name: "Launch",
    row: 9,
    start: day(15),
    due: day(24),
    end: day(23),
    status: "Planning",
    owner: "Carla",
    notes: "Announcement on the 24th.",
  },
];

export function DemoApp() {
  const tasks = useMemo(buildTasks, []);
  const [dark, setDark] = useState(false);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
  }, [dark]);

  return (
    <div className="flex h-screen flex-col bg-white text-neutral-900 dark:bg-neutral-950 dark:text-neutral-100">
      <div className="flex items-center justify-between gap-4 border-b border-neutral-200 px-4 py-2 dark:border-neutral-800">
        <div className="text-sm">
          <span className="font-semibold">timeline-tasks</span>
          <span className="text-neutral-500 dark:text-neutral-400">
            {" · demo — click a bar for details, edit status colors in the legend"}
          </span>
        </div>
        <button
          type="button"
          onClick={() => setDark((value) => !value)}
          className="cursor-pointer rounded-md border border-neutral-300 px-3 py-1 text-xs font-medium hover:bg-neutral-100 dark:border-neutral-700 dark:hover:bg-neutral-800"
        >
          {dark ? "Light mode" : "Dark mode"}
        </button>
      </div>

      <div className="min-h-0 flex-1">
        <Timeline
          tasks={tasks}
          title="Q4 Roadmap"
          updatedAt={`Demo data · ${new Date().toLocaleString("pt-BR")}`}
          filterFields={["owner", "status"]}
          popupFields={["owner", "notes"]}
          statusField="status"
        />
      </div>
    </div>
  );
}
