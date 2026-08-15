"use client";

import { Icon } from "@/lib/icons";
import { EmptyState } from "@/components/ui/EmptyState";
import { TIMELINE_ICON, timelineLabel } from "@/lib/customers/timeline";
import { useI18n } from "@/hooks/useI18n";
import type { AppData, TimelineEvent } from "@/types";

export type CustomerActivityPanelProps = {
  events: TimelineEvent[];
  data: AppData;
  compact?: boolean;
  onSelect: (event: TimelineEvent) => void;
};

export function CustomerActivityPanel({
  events,
  data,
  compact = false,
  onSelect,
}: CustomerActivityPanelProps) {
  const { dict, t, fmt } = useI18n();

  if (!events.length) {
    return (
      <EmptyState
        icon="clock"
        title={dict.customers.noActivity}
        desc={dict.customers.noActivityDesc}
      />
    );
  }

  return (
    <ul className={compact ? "act-list act-list--compact" : "act-list"}>
      {events.map((event) => (
        <li key={event.id}>
          <button
            type="button"
            className="act"
            onClick={() => onSelect(event)}
          >
            <span className="act__dot act__dot--indigo">
              <Icon name={TIMELINE_ICON[event.type]} size={13} />
            </span>
            <div className="act__body">
              <p className="act__text">{timelineLabel(event, data, dict, t)}</p>
              <span className="act__time">{fmt.relTime(event.createdAt)}</span>
            </div>
          </button>
        </li>
      ))}
    </ul>
  );
}
