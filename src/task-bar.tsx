import React from "react";
import { calculateBarMetrics, type BarMetrics } from "./lib/bar-metrics";
import { cn } from "./lib/cn";
import type { Granularity, TimelineData } from "./lib/date-utils";
import type { TimelineTask } from "./types";

export interface TaskBarProps {
  task: TimelineTask;
  timelineData: TimelineData;
  granularity: Granularity;
  onSelect?: (task: TimelineTask) => void;
  statusField?: string;
  statusColors?: Record<string, string>;
  metrics?: BarMetrics | null;
}

export const TaskBar: React.FC<TaskBarProps> = React.memo(
  ({
    task,
    timelineData,
    granularity,
    onSelect,
    statusField,
    statusColors = {},
    metrics: precomputedMetrics,
  }) => {
    const metrics =
      precomputedMetrics ??
      calculateBarMetrics(
        task,
        timelineData,
        granularity,
        statusField,
        statusColors,
      );

    if (!metrics) return null;

    return (
      <div
        className="relative h-6 flex items-center z-10"
        style={{ width: `${timelineData.totalDays * timelineData.daySize}px` }}
      >
        {metrics.completedEarlyWidth !== undefined &&
          metrics.completedEarlyWidth > 0 && (
            <>
              <div
                className="absolute h-4 rounded z-20 pointer-events-none border bg-gray-200 dark:bg-gray-500 border-gray-300 dark:border-gray-400"
                style={{
                  left: `${metrics.barEndPx}px`,
                  width: `${metrics.completedEarlyWidth}px`,
                }}
              />
              <div
                className="absolute w-0.5 h-6 bg-gray-700 z-30"
                style={{ left: `${metrics.barEndPx}px` }}
              />
            </>
          )}

        {metrics.overdueStartPx !== undefined &&
          metrics.overdueWidth !== undefined &&
          metrics.overdueWidth > 0 && (
            <div
              className="absolute h-4 rounded z-20 pointer-events-none border border-red-500 bg-[repeating-linear-gradient(45deg,rgba(255,120,120,1)_0,rgba(255,120,120,0.8)_4px,transparent_4px,transparent_8px)]"
              style={{
                left: `${metrics.overdueStartPx}px`,
                width: `${metrics.overdueWidth}px`,
              }}
            />
          )}

        {metrics.delayWidth !== undefined && metrics.delayWidth > 0 && (
          <div
            className="absolute h-4 rounded z-20 pointer-events-none bg-[repeating-linear-gradient(45deg,rgba(200,200,200,1)_0,rgba(200,200,200,0.8)_4px,transparent_4px,transparent_8px)]"
            style={{
              left: `${metrics.startPx}px`,
              width: `${metrics.delayWidth}px`,
            }}
          />
        )}

        {metrics.overdueStartPx !== undefined &&
          metrics.plannedEndPx !== undefined && (
            <div
              className="absolute w-0.5 h-6 bg-red-500 z-30"
              style={{ left: `${metrics.plannedEndPx}px` }}
            />
          )}

        <button
          type="button"
          aria-label={String(task.name)}
          className={cn(
            "absolute h-4 rounded border transition-all duration-200 z-10 cursor-pointer hover:outline-1 hover:outline-foreground",
            !metrics.customColors && metrics.colors.bg,
            !metrics.customColors && metrics.colors.border,
          )}
          style={{
            left: `${metrics.startPx}px`,
            width: `${metrics.width}px`,
            backgroundColor: metrics.customColors?.bg,
            borderColor: metrics.customColors?.darkBorder,
          }}
          onClick={() => onSelect?.(task)}
        />
      </div>
    );
  },
);
