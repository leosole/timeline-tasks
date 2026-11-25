import React from "react";
import { BiCollapseVertical, BiExpandVertical } from "react-icons/bi";
import type { TimelineLabels } from "./labels";

export interface TaskHeaderProps {
  labels: TimelineLabels;
  /** Shows the expand/collapse-all buttons only when rows can be grouped. */
  hasGroupedRows: boolean;
  onExpandAll: () => void;
  onCollapseAll: () => void;
}

/**
 * Frozen corner above the task list: the "Tasks" title and the expand/collapse
 * buttons. The timeline keeps the frozen positioning; this component renders
 * the content inside it.
 */
export const TaskHeader: React.FC<TaskHeaderProps> = ({
  labels,
  hasGroupedRows,
  onExpandAll,
  onCollapseAll,
}) => (
  <div className="flex h-full items-center justify-between px-4">
    <span className="font-semibold text-sm text-foreground">
      {labels.tasksHeader}
    </span>
    {hasGroupedRows ? (
      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={onExpandAll}
          className="cursor-pointer rounded-lg p-2 text-muted-foreground hover:bg-muted"
          title={labels.expandAll}
          aria-label={labels.expandAll}
        >
          <BiExpandVertical />
        </button>
        <button
          type="button"
          onClick={onCollapseAll}
          className="cursor-pointer rounded-lg p-2 text-muted-foreground hover:bg-muted"
          title={labels.collapseAll}
          aria-label={labels.collapseAll}
        >
          <BiCollapseVertical />
        </button>
      </div>
    ) : null}
  </div>
);
