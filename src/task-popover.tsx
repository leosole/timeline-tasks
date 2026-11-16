import React, { useEffect, useRef } from "react";
import dayjs from "dayjs";
import { parseDate } from "./lib/date-utils";
import {
  getTaskStatuses,
  isDerivedStatus,
  STATUS_BORDER,
  STATUS_ICON,
  STATUS_TONE,
} from "./lib/status";
import { cn } from "./lib/cn";
import type { TimelineLabels } from "./labels";
import type { TimelineTask } from "./types";

export interface TaskPopoverProps {
  task: TimelineTask;
  popupFields?: string[];
  onClose: () => void;
  statusField?: string;
  statusColors?: Record<string, string>;
  locale: string;
  labels: TimelineLabels;
}

export const TaskPopover: React.FC<TaskPopoverProps> = ({
  task,
  popupFields = [],
  onClose,
  statusField,
  statusColors = {},
  locale,
  labels,
}) => {
  const ref = useRef<HTMLDivElement>(null);
  const statuses = getTaskStatuses(task, statusField);
  const isCustomStatus = Boolean(statusField && task[statusField]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        onClose();
      }
    };
    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEsc);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEsc);
    };
  }, [onClose]);

  const formatDate = (date: string | number | null | undefined) => {
    if (date === null || date === undefined || date === "") return "—";
    const parsed = parseDate(date);
    return parsed ? parsed.locale(locale).format("L") : String(date);
  };

  const now = dayjs().startOf("day");
  const end = parseDate(task.end);
  const due = parseDate(task.due);

  const detailLines: string[] = [];
  const { detail } = labels;

  if (end && due) {
    const endDiff = end.diff(due, "day");
    if (endDiff > 0) detailLines.push(detail.finishedAfterDue(endDiff));
  } else if (!end && due) {
    const diff = now.diff(due, "day");
    if (diff > 0) detailLines.push(detail.lateBy(diff));
  }

  if (end && due) {
    const diff = end.diff(due, "day");
    if (diff <= 0) {
      detailLines.push(
        diff === 0 ? detail.finishedOnTime : detail.finishedEarly(-diff),
      );
    }
  } else if (end && !due) {
    detailLines.push(detail.finishedWithoutDue);
  }

  if (due && !end) {
    const remaining = due.diff(now, "day");
    if (remaining === 0) detailLines.push(detail.dueToday);
    else if (remaining >= 1) detailLines.push(detail.dueInDays(remaining));
    else detailLines.push(detail.withinDeadline);
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: "rgba(0,0,0,0.15)" }}
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        ref={ref}
        className="bg-card border border-border rounded-lg shadow-lg w-80 max-h-[80vh] overflow-y-auto"
      >
        <div className="px-4 py-3 border-b border-border flex items-center justify-between">
          <h3 className="font-bold text-base truncate pr-2">{task.name}</h3>
          <button
            onClick={onClose}
            aria-label={labels.popover.close}
            className="text-muted-foreground hover:text-foreground text-lg leading-none p-0 border-0 bg-transparent cursor-pointer"
          >
            ✕
          </button>
        </div>

        <div className="p-4 space-y-3">
          <div className="flex flex-wrap gap-1.5">
            {statuses.map((status) => {
              const derived = isDerivedStatus(status) ? status : null;
              const customColor = isCustomStatus
                ? statusColors[status]
                : undefined;
              const tone = customColor
                ? "text-white"
                : derived
                  ? STATUS_TONE[derived]
                  : "text-slate-600 dark:text-slate-300";
              const border = customColor
                ? "border-slate-300 dark:border-slate-600"
                : derived
                  ? STATUS_BORDER[derived]
                  : "border-slate-300 dark:border-slate-600";
              const icon = customColor ? "●" : derived ? STATUS_ICON[derived] : "●";
              const label = isCustomStatus
                ? String(status)
                : derived
                  ? labels.statuses[derived]
                  : String(status);

              return (
                <div
                  key={String(status)}
                  className={cn(
                    "inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border bg-transparent",
                    border,
                    tone,
                  )}
                  style={
                    customColor
                      ? {
                          backgroundColor: customColor,
                          color: "white",
                          borderColor: customColor,
                        }
                      : undefined
                  }
                >
                  <span>{icon}</span>
                  <span>{label}</span>
                </div>
              );
            })}
          </div>

          {detailLines.length > 0 && (
            <div className="text-xs text-muted-foreground space-y-0.5">
              {detailLines.map((line, index) => (
                <div key={index}>{line}</div>
              ))}
            </div>
          )}

          <div className="border-t border-border pt-2 space-y-1.5 text-xs">
            {task.start && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">
                  {labels.popover.start}:
                </span>
                <span className="font-medium">{formatDate(task.start)}</span>
              </div>
            )}
            {task.end && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">
                  {labels.popover.end}:
                </span>
                <span className="font-medium">{formatDate(task.end)}</span>
              </div>
            )}
            {task.due && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">
                  {labels.popover.due}:
                </span>
                <span className="font-medium">{formatDate(task.due)}</span>
              </div>
            )}
          </div>

          {popupFields.length > 0 && (
            <div className="border-t border-border pt-2 space-y-1.5 text-xs">
              {popupFields.map((field) => {
                const value = task[field];
                if (value === undefined || value === null || value === "") {
                  return null;
                }
                return (
                  <div key={field} className="flex justify-between">
                    <span className="text-muted-foreground">{field}:</span>
                    <span className="font-medium text-right max-w-[60%]">
                      {String(value)}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
