import dayjs from "dayjs";
import {
  calculateDatePosition,
  formatDateToISO,
  parseDate,
  type Granularity,
  type TimelineData,
} from "./date-utils";
import {
  getStatusBarClasses,
  getStatusColorValue,
  getTaskStatuses,
  isDerivedStatus,
  pickPrimaryStatus,
  type DerivedStatus,
  type TaskStatus,
} from "./status";
import type { TimelineTask } from "../types";

export interface BarMetrics {
  startPx: number;
  width: number;
  barEndPx: number;
  plannedEndPx: number | undefined;
  overdueStartPx: number | undefined;
  overdueWidth: number | undefined;
  completedEarlyWidth: number | undefined;
  delayWidth: number | undefined;
  status: TaskStatus;
  statuses: TaskStatus[];
  colors: { bg: string; border: string };
  customColors?: { bg: string; darkBorder: string; lightBorder: string };
}

const hasExplicitStatus = (task: TimelineTask, statusField?: string) =>
  Boolean(
    statusField &&
      task[statusField] !== undefined &&
      task[statusField] !== null &&
      String(task[statusField]).trim(),
  );

export const calculateBarMetrics = (
  task: TimelineTask,
  timelineData: TimelineData,
  granularity: Granularity,
  statusField?: string,
  statusColors: Record<string, string> = {},
): BarMetrics | null => {
  if (!task.start) return null;

  const start = parseDate(task.start);
  if (!start) return null;

  const end = parseDate(task.end);
  const due = parseDate(task.due);
  const now = dayjs().startOf("day");
  const statuses = getTaskStatuses(task, statusField);
  const status = pickPrimaryStatus(statuses);
  const explicitStatus = hasExplicitStatus(task, statusField);
  const derivedPrimary: DerivedStatus = isDerivedStatus(status)
    ? status
    : "not-started";
  const colors =
    explicitStatus && statuses.includes("overdue") && !end
      ? getStatusBarClasses("in-progress")
      : getStatusBarClasses(derivedPrimary);
  const customColors = explicitStatus
    ? getStatusColorValue(String(status), statusColors)
    : undefined;

  const startISO = formatDateToISO(task.start);
  if (!startISO) return null;
  const startPx = calculateDatePosition(startISO, timelineData);
  if (startPx < 0) return null;

  // The bar ends on `end`, else on `due`, else one day after `start`.
  const barEnd = end || due || start.add(1, "day");
  const endPx = calculateDatePosition(
    barEnd.format("YYYY-MM-DD"),
    timelineData,
  );
  const endPxValue =
    endPx >= 0 ? endPx : timelineData.totalDays * timelineData.daySize;

  let width = Math.max(endPxValue - startPx, 4);

  let plannedEndPx: number | undefined;
  let overdueStartPx: number | undefined;
  let overdueWidth: number | undefined;
  let completedEarlyWidth: number | undefined;
  let delayWidth: number | undefined;

  if (due) {
    plannedEndPx = calculateDatePosition(
      due.format("YYYY-MM-DD"),
      timelineData,
    );

    if (end && end.isBefore(due)) {
      // Completed before the due date: gray extension from end to due.
      const completionPx = calculateDatePosition(
        end.format("YYYY-MM-DD"),
        timelineData,
      );
      if (completionPx >= 0 && plannedEndPx !== undefined) {
        completedEarlyWidth = Math.max(plannedEndPx - completionPx, 0);
        width = Math.max(width, plannedEndPx - startPx);
      }
    }

    // Overdue based on dates, not on the status field: the due date is in the
    // past and the task is either unfinished or finished after the due date.
    const isActuallyOverdue = due.isBefore(now) && (!end || end.isAfter(due));
    if (isActuallyOverdue && plannedEndPx !== undefined) {
      const overdueEnd = end || now;
      const overdueEndPx = overdueEnd.isAfter(due)
        ? calculateDatePosition(overdueEnd.format("YYYY-MM-DD"), timelineData)
        : -1;
      if (plannedEndPx > 0) {
        overdueStartPx = plannedEndPx;
        overdueWidth = Math.max(
          (overdueEndPx >= 0
            ? overdueEndPx
            : now.diff(dayjs(timelineData.days[0].date), "day") *
                timelineData.daySize +
              timelineData.daySize / 2) - plannedEndPx,
          0,
        );
        if (overdueEndPx > endPxValue) {
          width = Math.max(width, overdueEndPx - startPx);
        }
      }
    }
  }

  if (statuses.includes("not-started") && start && start.isBefore(now)) {
    delayWidth = now.diff(start, "day") * timelineData.daySize;
  }

  return {
    startPx,
    width,
    barEndPx: endPxValue,
    plannedEndPx,
    overdueStartPx,
    overdueWidth,
    completedEarlyWidth,
    delayWidth,
    status,
    statuses,
    colors,
    customColors,
  };
};
