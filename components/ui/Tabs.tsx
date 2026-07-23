"use client";

import { cn } from "@/lib/utils/cn";

export type TabItem = {
  value: string;
  label: string;
  count?: number;
};

export type TabsProps = {
  items: TabItem[];
  value: string;
  onChange: (value: string) => void;
  className?: string;
};

export function Tabs({ items, value, onChange, className }: TabsProps) {
  return (
    <div className={cn("tabs", className)} role="tablist">
      {items.map((t) => {
        const active = t.value === value;
        return (
          <button
            key={t.value}
            type="button"
            className={cn("tab", active && "is-active")}
            role="tab"
            aria-selected={active}
            onClick={() => onChange(t.value)}
          >
            {t.label}
            {t.count != null ? <span className="tab__count">{t.count}</span> : null}
          </button>
        );
      })}
    </div>
  );
}
