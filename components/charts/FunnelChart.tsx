"use client";

import { useI18n } from "@/hooks/useI18n";
import { cn } from "@/lib/utils/cn";
import { CHART_PALETTE } from "./palette";

export type FunnelStage = {
  stage: string;
  value: number;
};

export type FunnelChartProps = {
  data: FunnelStage[];
  className?: string;
};

export function FunnelChart({ data, className }: FunnelChartProps) {
  const { fmt, t } = useI18n();
  const max = Math.max(1, ...data.map((d) => d.value));
  const color = CHART_PALETTE[0]!;

  return (
    <div className={cn("funnel", className)}>
      {data.map((d, i) => {
        const barPct = (d.value / max) * 100;
        const conv = i === 0 ? 100 : (d.value / data[i - 1]!.value) * 100;
        return (
          <div
            key={`${d.stage}-${i}`}
            className="funnel__row"
            data-tip={`${d.stage} — ${fmt.num(d.value)}`}
          >
            <div className="funnel__label">
              <span>{d.stage}</span>
              <span className="funnel__val">{fmt.num(d.value)}</span>
            </div>
            <div className="funnel__track">
              <div
                className="funnel__fill"
                style={{
                  width: `${barPct.toFixed(1)}%`,
                  opacity: 1 - i * 0.13,
                  background: color,
                }}
              />
            </div>
            <div className="funnel__conv">
              {i === 0
                ? "—"
                : `${conv.toFixed(0)}% ${t("charts.fromPrevious")}`}
            </div>
          </div>
        );
      })}
    </div>
  );
}
