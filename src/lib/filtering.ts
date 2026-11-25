import { getTaskStatuses } from "./status";
import { flattenTasks } from "./tasks";
import type { TimelineTask } from "../types";

const CORE_FIELDS = new Set(["name", "start", "end", "due", "status"]);

export interface TimelineFilterState {
  /** Text matched against task names. */
  filter?: string;
  /** Task is kept when it has at least one of these statuses. */
  statusFilter?: string[];
  /** Exact matches on extra task fields. */
  extraFieldFilters?: Record<string, string>;
  /** Field holding an explicit status. */
  statusField?: string;
}

/** Dropdown options for the extra fields, excluding the core task fields. */
export const getFilterOptions = (
  tasks: TimelineTask[],
  filterFields: string[] = [],
): Record<string, string[]> => {
  const options: Record<string, string[]> = {};
  if (!filterFields.length) return options;

  const allTasks = flattenTasks(tasks);
  filterFields.forEach((field) => {
    if (CORE_FIELDS.has(field.toLowerCase())) return;
    options[field] = [
      ...new Set(
        allTasks.map((task) => String(task[field] ?? "")).filter(Boolean),
      ),
    ].sort();
  });

  return options;
};

/** Distinct status values of `statusField`, sorted. */
export const getStatusOptions = (
  tasks: TimelineTask[],
  statusField?: string,
): string[] => {
  const values = new Set<string>();
  if (!statusField) return [];

  flattenTasks(tasks).forEach((task) => {
    const value = task[statusField];
    if (value !== undefined && value !== null && String(value).trim()) {
      values.add(String(value).trim());
    }
  });

  return Array.from(values).sort();
};

export const hasActiveFilters = (state: TimelineFilterState): boolean =>
  (state.statusFilter?.length ?? 0) > 0 ||
  Object.keys(state.extraFieldFilters ?? {}).length > 0 ||
  (state.filter ?? "").trim().length > 0;

export const matchesTimelineFilters = (
  task: TimelineTask,
  state: TimelineFilterState,
): boolean => {
  const statusFilter = state.statusFilter ?? [];
  if (statusFilter.length > 0) {
    const statuses = getTaskStatuses(task, state.statusField);
    if (!statusFilter.some((status) => statuses.includes(status))) return false;
  }

  for (const [field, value] of Object.entries(state.extraFieldFilters ?? {})) {
    if (String(task[field] ?? "") !== value) return false;
  }

  return String(task.name ?? "")
    .toLowerCase()
    .includes((state.filter ?? "").toLowerCase());
};
