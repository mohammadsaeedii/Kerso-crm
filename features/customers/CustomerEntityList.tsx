"use client";

import { Icon, type IconName } from "@/lib/icons";
import { EmptyState } from "@/components/ui/EmptyState";
import { Badge } from "@/components/ui/Badge";

export type EntityRow = {
  id: string;
  title: string;
  sub: string;
  icon: IconName;
  badge?: { label: string; statusKey: string };
};

export type CustomerEntityListProps = {
  items: EntityRow[];
  emptyIcon: IconName;
  emptyTitle: string;
  emptyDesc: string;
  onOpen: (id: string) => void;
};

export function CustomerEntityList({
  items,
  emptyIcon,
  emptyTitle,
  emptyDesc,
  onOpen,
}: CustomerEntityListProps) {
  if (!items.length) {
    return (
      <EmptyState icon={emptyIcon} title={emptyTitle} desc={emptyDesc} />
    );
  }

  return (
    <ul className="mini-list">
      {items.map((item) => (
        <li key={item.id}>
          <button
            type="button"
            className="mini-list__item"
            onClick={() => onOpen(item.id)}
          >
            <span className="mini-list__icon">
              <Icon name={item.icon} size={16} />
            </span>
            <div className="mini-list__main">
              <div className="cell-strong">{item.title}</div>
              <div className="cell-sub">{item.sub}</div>
            </div>
            {item.badge ? (
              <Badge statusKey={item.badge.statusKey}>{item.badge.label}</Badge>
            ) : null}
          </button>
        </li>
      ))}
    </ul>
  );
}
