"use client";

import { useI18n } from "@/hooks/useI18n";
import { range } from "@/lib/utils/math";
import { cn } from "@/lib/utils/cn";

export type HeatmapRow = {
  label: string;
  vals: Array<number | null | undefined>;
};

export type HeatmapProps = {
  rows: HeatmapRow[];
  cols?: number;
  className?: string;
};

export function Heatmap({ rows, cols = 6, className }: HeatmapProps) {
  const { fmt, t } = useI18n();
  const month = t("charts.monthLabel");
  const monthHead = (c: number) => `${month.charAt(0)}${fmt.digits(c)}`;

  return (
    <div className={cn("heat", className)}>
      <div className="heat__row heat__row--head">
        <div className="heat__rh" />
        {range(cols).map((c) => (
          <div key={c} className="heat__cell heat__cell--head">
            {monthHead(c)}
          </div>
        ))}
      </div>
      {rows.map((row) => (
        <div key={row.label} className="heat__row">
          <div className="heat__rh">{row.label}</div>
          {range(cols).map((c) => {
            const v = row.vals[c];
            if (v == null) {
              return (
                <div key={c} className="heat__cell heat__cell--empty" />
              );
            }
            const alpha = (v / 100) * 0.92 + 0.06;
            return (
              <div
                key={c}
                className="heat__cell"
                style={{
                  background: `rgba(79,70,229,${alpha.toFixed(2)})`,
                  color: v > 55 ? "#fff" : "var(--text)",
                }}
                data-tip={`${row.label} · ${month} ${fmt.digits(c)}: ${fmt.digits(v)}%`}
              >
                {fmt.digits(v)}%
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}
