import React, { useCallback } from "react";
import type { Granularity } from "./lib/date-utils";
import type { TimelineLabels } from "./labels";
import { Button, Select, StatusPill, TextInput, ToggleGroup } from "./ui";

export interface ControlsProps {
  filter: string;
  onFilterChange: (value: string) => void;
  granularity: Granularity;
  onGranularityChange: (value: Granularity) => void;
  scrollToToday: () => void;
  showCurrentDateBtn: boolean;
  statusFilter: string[];
  onStatusFilterChange: (value: string[]) => void;
  extraFieldFilters: Record<string, string>;
  onExtraFieldFilterChange: (field: string, value: string) => void;
  filterOptions: Record<string, string[]>;
  statusOptions: string[];
  labels: TimelineLabels;
}

export const Controls: React.FC<ControlsProps> = React.memo(
  ({
    filter,
    onFilterChange,
    granularity,
    onGranularityChange,
    scrollToToday,
    showCurrentDateBtn,
    statusFilter,
    onStatusFilterChange,
    extraFieldFilters,
    onExtraFieldFilterChange,
    filterOptions,
    statusOptions,
    labels,
  }) => {
    const toggleStatus = useCallback(
      (status: string) => {
        if (statusFilter.includes(status)) {
          onStatusFilterChange(statusFilter.filter((value) => value !== status));
        } else {
          onStatusFilterChange([...statusFilter, status]);
        }
      },
      [statusFilter, onStatusFilterChange],
    );

    return (
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 px-4 py-2 bg-card border-b border-border">
        <TextInput
          value={filter}
          onChange={onFilterChange}
          placeholder={labels.filterPlaceholder}
          className="w-48 px-3 py-1.5"
        />

        {statusOptions.length > 0 && (
          <div className="flex gap-1.5 flex-wrap">
            {statusOptions.map((status) => (
              <StatusPill
                key={status}
                onClick={() => toggleStatus(status)}
                selected={statusFilter.includes(status)}
                showCheck={statusFilter.includes(status)}
                label={status}
              />
            ))}
          </div>
        )}

        {Object.entries(filterOptions).length > 0 && (
          <div className="flex gap-2 flex-wrap">
            {Object.entries(filterOptions).map(([field, values]) => (
              <Select
                key={field}
                value={extraFieldFilters[field] || ""}
                onChange={(value) => onExtraFieldFilterChange(field, value)}
                options={[{ value: "", label: field }, ...values]}
                className="px-2 py-1.5 text-xs"
              />
            ))}
          </div>
        )}

        <ToggleGroup
          value={granularity}
          onChange={onGranularityChange}
          options={[
            { value: "day", label: labels.granularityDay },
            { value: "week", label: labels.granularityWeek },
            { value: "month", label: labels.granularityMonth },
          ]}
        />

        {showCurrentDateBtn && (
          <Button
            onClick={scrollToToday}
            variant="primary"
            size="sm"
            className="text-xs hover:bg-primary-hover"
          >
            {labels.today}
          </Button>
        )}
      </div>
    );
  },
);
