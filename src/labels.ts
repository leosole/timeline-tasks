import type { DerivedStatus } from "./lib/status";

export interface TimelinePopoverLabels {
  start: string;
  end: string;
  due: string;
  close: string;
}

export interface TimelineDetailLabels {
  finishedAfterDue: (days: number) => string;
  lateBy: (days: number) => string;
  finishedOnTime: string;
  finishedEarly: (days: number) => string;
  finishedWithoutDue: string;
  dueToday: string;
  dueInDays: (days: number) => string;
  withinDeadline: string;
}

export interface TimelineLabels {
  tasksHeader: string;
  filterPlaceholder: string;
  empty: string;
  today: string;
  expandAll: string;
  collapseAll: string;
  expandGroup: string;
  collapseGroup: string;
  granularityDay: string;
  granularityWeek: string;
  granularityMonth: string;
  /** Placed between the first and last day of a week header cell. */
  weekRangeSeparator: string;
  legendOverdue: string;
  legendCompletedEarly: string;
  legendToday: string;
  statuses: Record<DerivedStatus, string>;
  popover: TimelinePopoverLabels;
  detail: TimelineDetailLabels;
}

export const DEFAULT_LABELS: TimelineLabels = {
  tasksHeader: "Tarefas",
  filterPlaceholder: "Filtrar tarefas...",
  empty: "Nenhuma tarefa encontrada",
  today: "Hoje",
  expandAll: "Expandir tudo",
  collapseAll: "Recolher tudo",
  expandGroup: "Expandir grupo",
  collapseGroup: "Recolher grupo",
  granularityDay: "Dia",
  granularityWeek: "Semana",
  granularityMonth: "Mês",
  weekRangeSeparator: " a ",
  legendOverdue: "Previsto (atrasado)",
  legendCompletedEarly: "Concluído antes do previsto",
  legendToday: "Hoje",
  statuses: {
    "not-started": "Não iniciado",
    "in-progress": "Fazendo",
    overdue: "Atrasado",
    done: "Concluído",
  },
  popover: {
    start: "Início",
    end: "Fim",
    due: "Previsto",
    close: "Fechar",
  },
  detail: {
    finishedAfterDue: (days) => `Concluído ${days} dia(s) após o previsto`,
    lateBy: (days) => `Atrasado em ${days} dia(s)`,
    finishedOnTime: "Concluído no prazo",
    finishedEarly: (days) => `Concluído ${days} dia(s) antes do previsto`,
    finishedWithoutDue: "Concluído (sem data prevista)",
    dueToday: "Vence hoje",
    dueInDays: (days) => `Vence em ${days} dia(s)`,
    withinDeadline: "No prazo",
  },
};

export const resolveLabels = (
  overrides?: Partial<TimelineLabels>,
): TimelineLabels => ({
  ...DEFAULT_LABELS,
  ...overrides,
  statuses: { ...DEFAULT_LABELS.statuses, ...overrides?.statuses },
  popover: { ...DEFAULT_LABELS.popover, ...overrides?.popover },
  detail: { ...DEFAULT_LABELS.detail, ...overrides?.detail },
});
