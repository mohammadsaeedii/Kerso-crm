"use client";

import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { Icon } from "@/lib/icons";
import { formatDuration } from "@/lib/calls/duration";
import { cn } from "@/lib/utils/cn";
import { useI18n } from "@/hooks/useI18n";
import type { CallRecording, Customer } from "@/types";

export type CallFilter = "all" | "inbound" | "outbound" | "missed";

export type CallListProps = {
  calls: CallRecording[];
  customers: Customer[];
  selectedId: string | null;
  query: string;
  filter: CallFilter;
  onQuery: (value: string) => void;
  onFilter: (value: CallFilter) => void;
  onSelect: (id: string) => void;
};

const FILTERS: CallFilter[] = ["all", "inbound", "outbound", "missed"];

const STATUS_VARIANT = {
  completed: "success",
  missed: "danger",
  voicemail: "warning",
} as const;

function customerFor(customers: Customer[], id: string): Customer | undefined {
  return customers.find((c) => c.id === id);
}

export function CallList({
  calls,
  customers,
  selectedId,
  query,
  filter,
  onQuery,
  onFilter,
  onSelect,
}: CallListProps) {
  const { fmt, dict, t } = useI18n();

  return (
    <section className="calls__list" aria-label={dict.callsPage.title}>
      <div className="inbox__list-head">
        <div className="inbox-search">
          <Icon name="search" size={16} className="inbox-search__icon" />
          <input
            className="inbox-search__input"
            value={query}
            onChange={(e) => onQuery(e.target.value)}
            placeholder={dict.callsPage.search}
          />
        </div>
        <div className="calls-filters" role="tablist" aria-label={dict.callsPage.title}>
          {FILTERS.map((key) => (
            <button
              key={key}
              type="button"
              role="tab"
              aria-selected={filter === key}
              className={cn("calls-filters__btn", filter === key && "is-active")}
              onClick={() => onFilter(key)}
            >
              {dict.callsPage.filters[key]}
            </button>
          ))}
        </div>
      </div>
      <div className="inbox__list-body">
        {calls.length === 0 ? (
          <EmptyState
            icon="phone-call"
            title={dict.callsPage.empty}
            desc={dict.callsPage.emptyDesc}
          />
        ) : (
          calls.map((call) => {
            const customer = customerFor(customers, call.customerId);
            const name = customer?.name ?? call.customerId;
            return (
              <button
                key={call.id}
                type="button"
                className={cn("conv-row", selectedId === call.id && "is-active")}
                onClick={() => onSelect(call.id)}
              >
                <Avatar name={name} color={customer?.avatar} size={36} />
                <span className="conv-row__main">
                  <span className="conv-row__top">
                    <span className="conv-row__name">{name}</span>
                    <span className="conv-row__time">{fmt.relTime(call.startedAt)}</span>
                  </span>
                  <p className="conv-row__subject">{call.subject}</p>
                  <span className="conv-row__meta">
                    <Icon
                      name={
                        call.direction === "inbound"
                          ? "phone-incoming"
                          : "phone-outgoing"
                      }
                      size={14}
                    />
                    <span className="conv-row__channel">
                      {dict.callsPage.direction[call.direction]}
                    </span>
                    {call.durationSec > 0 ? (
                      <span className="conv-row__channel">
                        {fmt.digits(formatDuration(call.durationSec))}
                      </span>
                    ) : null}
                    <Badge variant={STATUS_VARIANT[call.status]}>
                      {dict.callsPage.status[call.status]}
                    </Badge>
                  </span>
                </span>
              </button>
            );
          })
        )}
      </div>
      <p className="calls__count">{t("callsPage.count", { count: calls.length })}</p>
    </section>
  );
}
