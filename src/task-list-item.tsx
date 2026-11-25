import React from "react";
import { PiCaretDownBold } from "react-icons/pi";
import { cn } from "./lib/cn";
import type { TimelineLabels } from "./labels";
import type { TaskTreeRow } from "./lib/tasks";
import type { TimelineTask } from "./types";

export interface TaskListItemProps {
  /** The row to render: task, position id, depth and collapse state. */
  row: TaskTreeRow;
  labels: TimelineLabels;
  onSelect?: (task: TimelineTask) => void;
  onToggleGroup?: (id: string) => void;
}

/**
 * One cell of the frozen task list: the task name, its indentation and, for a
 * group, the caret that collapses or expands it. The timeline keeps the frozen
 * positioning and renders one item per visible row.
 */
export const TaskListItem: React.FC<TaskListItemProps> = ({
  row,
  labels,
  onSelect,
  onToggleGroup,
}) => {
  const { task, id, depth, hasChildren, collapsed } = row;

  return (
    <div
      className="h-10 flex items-center pr-4 text-sm hover:bg-muted/30 cursor-pointer border-b border-border"
      style={{ paddingLeft: 16 + depth * 12 }}
      onClick={() => onSelect?.(task)}
    >
      <div className="flex min-w-0 items-center">
        {hasChildren ? (
          <button
            type="button"
            className="mr-1 flex h-5 w-5 shrink-0 cursor-pointer items-center justify-center rounded hover:bg-muted/60"
            onClick={(event) => {
              event.stopPropagation();
              onToggleGroup?.(id);
            }}
            aria-label={collapsed ? labels.expandGroup : labels.collapseGroup}
          >
            <PiCaretDownBold
              className={cn(
                "transition-transform duration-200",
                collapsed ? "rotate-0" : "rotate-180",
              )}
            />
          </button>
        ) : (
          <span className="mr-1 inline-block h-5 w-5 shrink-0" />
        )}
        <span className="truncate">{task.name}</span>
      </div>
    </div>
  );
};
