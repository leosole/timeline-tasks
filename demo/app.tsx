import React, { useEffect, useMemo, useState } from "react";
import dayjs from "dayjs";
import { Timeline, useTimeline, type Granularity } from "../src";

const day = (offset: number) => dayjs().add(offset, "day").format("YYYY-MM-DD");

const GRANULARITIES: Array<{ value: Granularity; label: string }> = [
  { value: "day", label: "Dia" },
  { value: "week", label: "Semana" },
  { value: "month", label: "Mês" },
];

const buildTasks = () => [
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

const controlClass =
  "cursor-pointer rounded-md border border-neutral-300 px-2.5 py-1 text-xs font-medium hover:bg-neutral-100 dark:border-neutral-700 dark:hover:bg-neutral-800";
const activeControlClass =
  "cursor-pointer rounded-md border border-neutral-900 bg-neutral-900 px-2.5 py-1 text-xs font-medium text-white dark:border-neutral-100 dark:bg-neutral-100 dark:text-neutral-900";

export function DemoApp() {
  const tasks = useMemo(buildTasks, []);
  const [dark, setDark] = useState(false);
  const timeline = useTimeline({
    tasks,
    statusField: "status",
    filterFields: ["owner"],
  });

  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
  }, [dark]);

  return (
    <div className="flex h-screen flex-col bg-white text-neutral-900 dark:bg-neutral-950 dark:text-neutral-100">
      {/* This whole header/toolbar is demo code: the package exports the state
          and actions (useTimeline), not the controls. */}
      <header className="flex items-start justify-between gap-4 border-b border-neutral-200 px-4 py-3 dark:border-neutral-800">
        <div>
          <h1 className="text-xl font-bold">Q4 Roadmap</h1>
          <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">
            Demo data · {new Date().toLocaleString("pt-BR")}
          </p>
        </div>
        <button
          type="button"
          onClick={() => setDark((value) => !value)}
          className={controlClass}
        >
          {dark ? "Light mode" : "Dark mode"}
        </button>
      </header>

      <div className="flex flex-wrap items-center gap-3 border-b border-neutral-200 px-4 py-2 dark:border-neutral-800">
        <input
          value={timeline.filter}
          onChange={(event) => timeline.setFilter(event.target.value)}
          placeholder="Filtrar tarefas..."
          className="w-48 rounded-md border border-neutral-300 bg-transparent px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-neutral-400 dark:border-neutral-700"
        />

        {timeline.statusOptions.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {timeline.statusOptions.map((status) => {
              const selected = timeline.statusFilter.includes(status);
              return (
                <button
                  key={status}
                  type="button"
                  onClick={() => timeline.toggleStatus(status)}
                  className={selected ? activeControlClass : controlClass}
                >
                  {selected ? "✓ " : ""}
                  {status}
                </button>
              );
            })}
          </div>
        )}

        {Object.entries(timeline.filterOptions).map(([field, values]) => (
          <select
            key={field}
            value={timeline.extraFieldFilters[field] ?? ""}
            onChange={(event) =>
              timeline.setExtraFieldFilter(field, event.target.value)
            }
            className="cursor-pointer rounded-md border border-neutral-300 bg-transparent px-2 py-1 text-xs dark:border-neutral-700"
          >
            <option value="">{field}</option>
            {values.map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </select>
        ))}

        <div className="ml-auto flex items-center gap-1.5">
          {GRANULARITIES.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => timeline.setGranularity(option.value)}
              className={
                timeline.granularity === option.value
                  ? activeControlClass
                  : controlClass
              }
            >
              {option.label}
            </button>
          ))}

          {timeline.showScrollToToday && (
            <button
              type="button"
              onClick={timeline.scrollToToday}
              className={
                "cursor-pointer rounded-md bg-neutral-900 px-2.5 py-1 text-xs font-medium text-white hover:bg-neutral-700 dark:bg-neutral-100 dark:text-neutral-900 dark:hover:bg-neutral-300"
              }
            >
              Hoje
            </button>
          )}
        </div>
      </div>

      <div className="min-h-0 flex-1">
        <Timeline
          tasks={tasks}
          filter={timeline.filter}
          granularity={timeline.granularity}
          statusFilter={timeline.statusFilter}
          extraFieldFilters={timeline.extraFieldFilters}
          statusField="status"
          popupFields={["owner", "notes"]}
          scrollRef={timeline.scrollRef}
        />
      </div>
    </div>
  );
}
