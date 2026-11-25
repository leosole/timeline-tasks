import type { TimelineTask } from "../types";

/** A task paired with the position it occupies in the nested task tree. */
export interface TaskTreeRow {
  task: TimelineTask;
  /** Stable identity derived from the task's position ("0", "0-2", ...). */
  id: string;
  /** Nesting level, `0` for top-level tasks. */
  depth: number;
  hasChildren: boolean;
  collapsed: boolean;
}

export const getTaskChildren = (task: TimelineTask): TimelineTask[] =>
  Array.isArray(task.children) ? (task.children as TimelineTask[]) : [];

/** Depth-first list of every task, parents included, in tree order. */
export const flattenTasks = (tasks: TimelineTask[]): TimelineTask[] => {
  const result: TimelineTask[] = [];
  const walk = (list: TimelineTask[]) => {
    list.forEach((task) => {
      result.push(task);
      walk(getTaskChildren(task));
    });
  };
  walk(tasks);
  return result;
};

const forEachNode = (
  tasks: TimelineTask[],
  visit: (
    task: TimelineTask,
    id: string,
    depth: number,
    hasChildren: boolean,
  ) => void,
  parentId = "",
  depth = 0,
) => {
  tasks.forEach((task, index) => {
    const id = parentId ? `${parentId}-${index}` : String(index);
    const children = getTaskChildren(task);
    visit(task, id, depth, children.length > 0);
    forEachNode(children, visit, id, depth + 1);
  });
};

/** Ids of every task that has children, used by "collapse all". */
export const getGroupTaskIds = (tasks: TimelineTask[]): string[] => {
  const ids: string[] = [];
  forEachNode(tasks, (_task, id, _depth, hasChildren) => {
    if (hasChildren) ids.push(id);
  });
  return ids;
};

/** Ids of the groups that start collapsed (`groupCollapsed`). */
export const getInitiallyCollapsedTaskIds = (
  tasks: TimelineTask[],
): string[] => {
  const ids: string[] = [];
  forEachNode(tasks, (task, id, _depth, hasChildren) => {
    if (hasChildren && task.groupCollapsed) ids.push(id);
  });
  return ids;
};

export interface GetVisibleTaskRowsOptions {
  /** Ids whose descendants are hidden. */
  collapsedIds?: Set<string>;
  /**
   * When provided, only matching tasks are kept, plus the ancestors that lead
   * to one. Collapsed groups containing a match are shown expanded.
   */
  matches?: (task: TimelineTask) => boolean;
}

/**
 * Flattens the task tree into the rows the timeline draws, in tree order.
 *
 * Without `matches`, a group header is always included and a leaf is included
 * when it has a start date. With `matches`, a row is included when it matches
 * or when a descendant does.
 */
export const getVisibleTaskRows = (
  tasks: TimelineTask[],
  { collapsedIds = new Set<string>(), matches }: GetVisibleTaskRowsOptions = {},
): TaskTreeRow[] => {
  const build = (
    list: TimelineTask[],
    depth: number,
    parentId: string,
  ): TaskTreeRow[] => {
    const rows: TaskTreeRow[] = [];

    list.forEach((task, index) => {
      const id = parentId ? `${parentId}-${index}` : String(index);
      const children = getTaskChildren(task);
      const hasChildren = children.length > 0;
      const collapsed = hasChildren && collapsedIds.has(id);
      const childRows =
        hasChildren && (!collapsed || matches)
          ? build(children, depth + 1, id)
          : [];

      const included = matches
        ? matches(task) || childRows.length > 0
        : hasChildren || Boolean(task.start);

      if (included) {
        rows.push({
          task,
          id,
          depth,
          hasChildren,
          // A collapsed group with a matching descendant is shown expanded.
          collapsed: matches ? false : collapsed,
        });
        rows.push(...childRows);
      }
    });

    return rows;
  };

  return build(tasks, 0, "");
};
