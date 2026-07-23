"use client";

import { Icon } from "@/lib/icons";
import { useI18n } from "@/hooks/useI18n";
import { cn } from "@/lib/utils/cn";

export type TrendPillProps = {
  delta: number;
  dir?: "up" | "down";
  className?: string;
};

export function TrendPill({ delta, dir, className }: TrendPillProps) {
  const { fmt } = useI18n();
  const up = dir ? dir === "up" : delta >= 0;

  return (
    <span className={cn("trend", `trend--${up ? "up" : "down"}`, className)}>
      <Icon
        name={up ? "trending-up" : "trending-down"}
        size={13}
        stroke={2}
      />
      {fmt.pct(delta)}
    </span>
  );
}
