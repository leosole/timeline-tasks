import React, { useMemo, useRef } from "react";
import { cn } from "./lib/cn";
import {
  DEFAULT_STATUS_COLORS,
  getGeneratedStatusColor,
  type DerivedStatus,
} from "./lib/status";
import type { TimelineLabels } from "./labels";

/** Order in which the derived statuses are listed in the legend. */
export const DEFAULT_STATUS_ORDER: DerivedStatus[] = [
  "in-progress",
  "done",
  "overdue",
  "not-started",
];

export interface LegendProps {
  labels: TimelineLabels;
  statusOptions?: string[];
  statusColors?: Record<string, string>;
  hasCustomStatusField?: boolean;
  onColorChange?: (label: string, color: string) => void;
}

export const Legend: React.FC<LegendProps> = React.memo(
  ({
    labels,
    statusOptions = [],
    statusColors = {},
    hasCustomStatusField = false,
    onColorChange,
  }) => {
    const colorInputRefs = useRef<Record<string, HTMLInputElement | null>>({});

    const dynamicItems = useMemo(() => {
      if (!hasCustomStatusField) {
        return DEFAULT_STATUS_ORDER.map((status) => {
          const label = labels.statuses[status];
          return {
            label,
            color: statusColors[label] || DEFAULT_STATUS_COLORS[status],
          };
        });
      }
      return statusOptions.map((label, index) => ({
        label,
        color: statusColors[label] || getGeneratedStatusColor(index),
      }));
    }, [statusOptions, statusColors, hasCustomStatusField, labels]);

    const baseItems = [
      { label: labels.legendOverdue, kind: "line" as const, color: "#ef4444" },
      {
        label: labels.legendCompletedEarly,
        kind: "swatch" as const,
        color: "oklch(0.84 0 0)",
      },
      {
        label: labels.legendToday,
        kind: "line" as const,
        color: "var(--tt-timeline-today, #4a90d9)",
      },
    ];

    return (
      <div className="sticky bottom-0 z-40 border-t border-border bg-muted/50 px-4 py-3 shadow-[0_-1px_0_rgba(0,0,0,0.04)]">
        <div className="flex flex-wrap gap-5 text-xs text-muted-foreground">
          {dynamicItems.map((item) => (
            <div key={item.label} className="flex items-center gap-2">
              <div
                className={cn(
                  "h-3 w-3 rounded",
                  hasCustomStatusField &&
                    "cursor-pointer hover:opacity-80 transition-opacity",
                )}
                style={{
                  backgroundColor: item.color,
                  border: `1px solid ${item.color}`,
                }}
                onClick={() => {
                  if (hasCustomStatusField) {
                    colorInputRefs.current[item.label]?.click();
                  }
                }}
                title={
                  hasCustomStatusField ? "Click to change color" : undefined
                }
              />
              {hasCustomStatusField && (
                <input
                  ref={(node) => {
                    if (node) colorInputRefs.current[item.label] = node;
                  }}
                  type="color"
                  aria-label={`Choose color for ${item.label}`}
                  value={item.color}
                  className="hidden"
                  onChange={(event) =>
                    onColorChange?.(item.label, event.target.value)
                  }
                />
              )}
              <span>{item.label}</span>
            </div>
          ))}
          {baseItems.map((item) => (
            <div key={item.label} className="flex items-center gap-2">
              {item.kind === "line" ? (
                <div
                  className="h-4 w-0.5"
                  style={{ backgroundColor: item.color }}
                />
              ) : (
                <div
                  className="h-3 w-3 rounded"
                  style={{
                    backgroundColor: item.color,
                    border: `1px solid ${item.color}`,
                  }}
                />
              )}
              <span>{item.label}</span>
            </div>
          ))}
        </div>
      </div>
    );
  },
);
