"use client";

import { useI18n } from "@/hooks/useI18n";
import { cn } from "@/lib/utils/cn";
import { CHART_PALETTE } from "./palette";

export type HBarItem = {
  name: string;
  value: number;
  color?: string;
};

export type HBarChartProps = {
  data: HBarItem[];
  money?: boolean;
  pct?: boolean;
  className?: string;
};

export function HBarChart({ data, money, pct, className }: HBarChartProps) {
  const { fmt } = useI18n();
  const max = Math.max(1, ...data.map((d) => d.value));

  return (
    <div className={cn("hbars", className)}>
      {data.map((d, i) => {
        const barPct = (d.value / max) * 100;
        const color = d.color || CHART_PALETTE[i % CHART_PALETTE.length]!;
        const val = money
          ? fmt.money(d.value)
          : pct
            ? `${d.value}%`
            : fmt.num(d.value);
        return (
          <div key={`${d.name}-${i}`} className="hbar">
            <div className="hbar__top">
              <span className="hbar__name">{d.name}</span>
              <span className="hbar__val">{val}</span>
            </div>
            <div className="hbar__track">
              <div
                className="hbar__fill"
                style={{
                  width: `${barPct.toFixed(1)}%`,
                  background: color,
                }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
