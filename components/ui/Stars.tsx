"use client";

import { Icon } from "@/lib/icons";
import { useI18n } from "@/hooks/useI18n";
import { cn } from "@/lib/utils/cn";

export type StarsProps = {
  rating: number;
  size?: number;
  className?: string;
};

export function Stars({ rating, size = 15, className }: StarsProps) {
  const { t, fmt } = useI18n();
  const label = t("common.table.outOf5", { rating: fmt.digits(rating) });

  return (
    <span className={cn("stars", className)} aria-label={label}>
      {Array.from({ length: 5 }, (_, i) => {
        const n = i + 1;
        const fill =
          rating >= n ? "full" : rating >= n - 0.5 ? "half" : "empty";
        return (
          <span key={n} className={cn("star", `star--${fill}`)}>
            <Icon name="star" size={size} stroke={1.4} />
          </span>
        );
      })}
    </span>
  );
}
