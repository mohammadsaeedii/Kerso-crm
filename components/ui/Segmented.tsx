"use client";

import { Icon, type IconName } from "@/lib/icons";
import { cn } from "@/lib/utils/cn";

export type SegmentOption = {
  value: string;
  label?: string;
  icon?: IconName;
};

export type SegmentedProps = {
  options: SegmentOption[];
  value: string;
  onChange: (value: string) => void;
  className?: string;
};

export function Segmented({
  options,
  value,
  onChange,
  className,
}: SegmentedProps) {
  return (
    <div className={cn("segmented", className)} role="tablist">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          role="tab"
          aria-selected={o.value === value}
          className={cn("segmented__btn", o.value === value && "is-active")}
          onClick={() => onChange(o.value)}
        >
          {o.icon ? <Icon name={o.icon} size={16} /> : null}
          {o.label ? <span>{o.label}</span> : null}
        </button>
      ))}
    </div>
  );
}
