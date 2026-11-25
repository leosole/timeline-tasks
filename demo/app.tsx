import React, { useEffect, useMemo, useState } from "react";
import dayjs from "dayjs";
import { Timeline, useTimeline, type Granularity } from "../src";

const day = (offset: number) => dayjs().add(offset, "day").format("YYYY-MM-DD");

const GRANULARITIES: Array<{ value: Granularity; label: string }> = [
  { value: "day", label: "Day" },
  { value: "week", label: "Week" },
  { value: "month", label: "Month" },
];

// A two-year project (~24 months of months from -365 to +330 days) with six
// phases and 4-6 tasks each. Every `end` is in the past so no task claims to
// be finished after today; `due` dates are free to sit in the future.
const buildTasks = () => [
  {
    name: "Phase 1 · Discovery",
    start: day(-365),
    end: day(-300),
    due: day(-300),
    status: "Done",
    children: [
      {
        name: "Kickoff",
        start: day(-365),
        end: day(-362),
        due: day(-362),
        status: "Done",
        owner: "Ana",
        notes: "Scope agreed with the team.",
      },
      {
        name: "Stakeholder interviews",
        start: day(-361),
        end: day(-342),
        due: day(-340),
        status: "Done",
        owner: "Bruno",
        notes: "Eight interviews across support, sales and operations.",
      },
      {
        name: "Market research",
        start: day(-341),
        end: day(-318),
        due: day(-315),
        status: "Done",
        owner: "Carla",
      },
      {
        name: "Requirements spec",
        start: day(-317),
        end: day(-306),
        due: day(-305),
        status: "Done",
        owner: "Ana",
        notes: "Signed off by all product leads.",
      },
      {
        name: "Architecture draft",
        start: day(-305),
        end: day(-300),
        due: day(-300),
        status: "Done",
        owner: "Bruno",
      },
    ],
  },
  {
    name: "Phase 2 · Design",
    start: day(-299),
    end: day(-215),
    due: day(-215),
    status: "Done",
    children: [
      {
        name: "Wireframes",
        start: day(-299),
        end: day(-282),
        due: day(-280),
        status: "Done",
        owner: "Ana",
      },
      {
        name: "Design system",
        start: day(-281),
        end: day(-258),
        due: day(-255),
        status: "Done",
        owner: "Carla",
        notes: "Tokens, components and the icon set.",
      },
      {
        name: "High-fidelity mockups",
        start: day(-257),
        end: day(-235),
        due: day(-232),
        status: "Done",
        owner: "Ana",
      },
      {
        name: "Clickable prototype",
        start: day(-234),
        end: day(-222),
        due: day(-220),
        status: "Done",
        owner: "Bruno",
      },
      {
        name: "Usability testing",
        start: day(-221),
        end: day(-216),
        due: day(-215),
        status: "Done",
        owner: "Carla",
        notes: "Five sessions, no blocking findings.",
      },
    ],
  },
  {
    name: "Phase 3 · Build core",
    start: day(-214),
    end: day(-120),
    due: day(-120),
    status: "Done",
    children: [
      {
        name: "Data model & API",
        start: day(-214),
        end: day(-195),
        due: day(-193),
        status: "Done",
        owner: "Bruno",
      },
      {
        name: "Auth & accounts",
        start: day(-194),
        end: day(-172),
        due: day(-170),
        status: "Done",
        owner: "Carla",
      },
      {
        name: "Core UI screens",
        start: day(-171),
        end: day(-150),
        due: day(-148),
        status: "Done",
        owner: "Ana",
      },
      {
        name: "Background jobs",
        start: day(-149),
        end: day(-138),
        due: day(-135),
        status: "Done",
        owner: "Bruno",
      },
      {
        name: "Reporting exports",
        start: day(-137),
        end: day(-123),
        due: day(-125),
        status: "Done",
        owner: "Carla",
        notes: "Shipped two days after the due date.",
      },
      {
        name: "Internal beta",
        start: day(-125),
        end: day(-121),
        due: day(-120),
        status: "Done",
        owner: "Ana",
      },
    ],
  },
  {
    name: "Phase 4 · Integrations",
    start: day(-119),
    due: day(45),
    status: "In progress",
    children: [
      {
        name: "Payments integration",
        start: day(-119),
        end: day(-96),
        due: day(-94),
        status: "Done",
        owner: "Carla",
      },
      {
        name: "Email & notifications",
        start: day(-95),
        end: day(-60),
        due: day(-58),
        status: "Done",
        owner: "Bruno",
      },
      {
        name: "Calendar sync",
        start: day(-59),
        due: day(-18),
        status: "Blocked",
        owner: "Ana",
        notes: "Waiting on the provider's sandbox credentials.",
      },
      {
        name: "Analytics events",
        start: day(-45),
        due: day(12),
        status: "In progress",
        owner: "Carla",
      },
      {
        name: "Admin dashboard",
        start: day(-30),
        due: day(45),
        status: "In progress",
        owner: "Bruno",
      },
    ],
  },
  {
    name: "Phase 5 · Scale & harden",
    start: day(46),
    due: day(190),
    status: "Planning",
    children: [
      {
        name: "Load testing",
        start: day(46),
        due: day(70),
        status: "Planning",
        owner: "Bruno",
      },
      {
        name: "Caching layer",
        start: day(71),
        due: day(100),
        status: "Planning",
        owner: "Carla",
      },
      {
        name: "Security audit",
        start: day(101),
        due: day(130),
        status: "Planning",
        owner: "Diego",
      },
      {
        name: "Accessibility pass",
        start: day(131),
        due: day(160),
        status: "Planning",
        owner: "Ana",
      },
    ],
  },
  {
    name: "Phase 6 · Launch & handover",
    start: day(191),
    due: day(330),
    status: "Planning",
    children: [
      {
        name: "Release candidate",
        start: day(191),
        due: day(215),
        status: "Planning",
        owner: "Carla",
      },
      {
        name: "Documentation",
        start: day(216),
        due: day(245),
        status: "Planning",
        owner: "Ana",
      },
      {
        name: "Migration & cutover",
        start: day(246),
        due: day(285),
        status: "Planning",
        owner: "Bruno",
      },
      {
        name: "Go-live",
        start: day(286),
        due: day(300),
        status: "Planning",
        owner: "Carla",
        notes: "Launch window agreed with support.",
      },
      {
        name: "Post-launch support",
        start: day(301),
        due: day(330),
        status: "Planning",
        owner: "Diego",
      },
    ],
  },
];

const controlClass =
  "cursor-pointer rounded-md border border-neutral-300 bg-white px-2.5 py-1 text-xs font-medium text-neutral-900 hover:bg-neutral-100 dark:border-neutral-700 dark:bg-neutral-950 dark:text-neutral-100 dark:hover:bg-neutral-800";
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
          <h1 className="text-xl font-bold">Platform rebuild · 2-year plan</h1>
          <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">
            6 phases · 30 tasks · Demo data · {new Date().toLocaleString("pt-BR")}
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
          placeholder="Filter tasks..."
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
              Today
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
