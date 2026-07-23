"use client";

import { useCallback, useRef, useState, type MouseEvent } from "react";
import { useI18n } from "@/hooks/useI18n";
import { niceMax } from "@/lib/utils/math";
import { cn } from "@/lib/utils/cn";
import { ChartFloatingTip } from "./ChartFloatingTip";
import { CHART_PALETTE } from "./palette";

export type BarSeries = {
  name: string;
  values: number[];
  color?: string;
};

export type BarChartProps = {
  labels: string[];
  series: BarSeries[];
  height?: number;
  stacked?: boolean;
  money?: boolean;
  className?: string;
};

type TipState = {
  idx: number;
  clientX: number;
  clientY: number;
};

export function BarChart({
  labels,
  series,
  height = 280,
  stacked = false,
  money,
  className,
}: BarChartProps) {
  const { fmt } = useI18n();
  const svgRef = useRef<SVGSVGElement>(null);
  const [tip, setTip] = useState<TipState | null>(null);

  const W = 760;
  const H = height;
  const pad = { l: 46, r: 16, t: 16, b: 34 };
  const pw = W - pad.l - pad.r;
  const ph = H - pad.t - pad.b;
  const n = labels.length;
  const totals = labels.map((_, i) =>
    series.reduce((a, s) => a + (s.values[i] ?? 0), 0),
  );
  const maxData = stacked
    ? Math.max(1, ...totals)
    : Math.max(1, ...series.flatMap((s) => s.values));
  const max = niceMax(maxData * 1.1);
  const yAt = (v: number) => pad.t + ph - (v / max) * ph;
  const band = pw / Math.max(n, 1);
  const groupW = band * 0.62;
  const x0 = (i: number) => pad.l + band * i + (band - groupW) / 2;
  const bw = stacked ? groupW : groupW / Math.max(series.length, 1);

  const groups = labels.map((label, i) => {
    const items = series.map((s, si) => ({
      name: s.name,
      color: s.color || CHART_PALETTE[si % CHART_PALETTE.length]!,
      v: s.values[i] ?? 0,
    }));
    return { x: x0(i) + groupW / 2, label, items };
  });

  const toSvg = useCallback((evt: MouseEvent<SVGSVGElement>) => {
    const svg = svgRef.current;
    if (!svg) return { x: 0, y: 0 };
    const pt = svg.createSVGPoint();
    pt.x = evt.clientX;
    pt.y = evt.clientY;
    const ctm = svg.getScreenCTM();
    if (!ctm) return { x: 0, y: 0 };
    const p = pt.matrixTransform(ctm.inverse());
    return { x: p.x, y: p.y };
  }, []);

  const onMove = (e: MouseEvent<SVGSVGElement>) => {
    const p = toSvg(e);
    let idx = 0;
    let best = Infinity;
    groups.forEach((g, i) => {
      const d = Math.abs(g.x - p.x);
      if (d < best) {
        best = d;
        idx = i;
      }
    });
    setTip({ idx, clientX: e.clientX, clientY: e.clientY });
  };

  const gridN = 4;
  const everyX = n > 12 ? Math.ceil(n / 8) : 1;
  const active = tip ? groups[tip.idx] : null;

  return (
    <>
      <svg
        ref={svgRef}
        className={cn("chart chart-interactive", className)}
        viewBox={`0 0 ${W} ${H}`}
        preserveAspectRatio="none"
        style={{
          width: "100%",
          height: `${H}px`,
          display: "block",
          overflow: "visible",
        }}
        onMouseMove={onMove}
        onMouseLeave={() => setTip(null)}
      >
        {Array.from({ length: gridN + 1 }, (_, g) => {
          const v = (max / gridN) * g;
          const y = yAt(v);
          return (
            <g key={g}>
              <line
                className="chart__grid"
                x1={pad.l}
                y1={+y.toFixed(1)}
                x2={+(W - pad.r).toFixed(1)}
                y2={+y.toFixed(1)}
              />
              <text
                className="chart__ylabel"
                x={pad.l - 10}
                y={+(y + 4).toFixed(1)}
                textAnchor="end"
              >
                {fmt.compact(v)}
              </text>
            </g>
          );
        })}

        {labels.map((_, i) => {
          let yStack = pad.t + ph;
          return series.map((s, si) => {
            const color = s.color || CHART_PALETTE[si % CHART_PALETTE.length]!;
            const v = s.values[i] ?? 0;
            const h = (v / max) * ph;
            let x: number;
            let y: number;
            if (stacked) {
              x = x0(i);
              yStack -= h;
              y = yStack;
            } else {
              x = x0(i) + si * bw;
              y = pad.t + ph - h;
            }
            const r = Math.min(5, bw / 2);
            const titleVal = money ? fmt.money(v) : fmt.num(v);
            return (
              <rect
                key={`${i}-${si}`}
                className="chart__bar"
                x={+x.toFixed(1)}
                y={+y.toFixed(1)}
                width={+(bw - (stacked ? 0 : 3)).toFixed(1)}
                height={+Math.max(0, h).toFixed(1)}
                rx={r}
                fill={color}
              >
                <title>
                  {s.name}: {titleVal}
                </title>
              </rect>
            );
          });
        })}

        {labels.map((lab, i) => {
          if (i % everyX !== 0 && i !== n - 1) return null;
          return (
            <text
              key={i}
              className="chart__xlabel"
              x={(x0(i) + groupW / 2).toFixed(1)}
              y={H - 12}
              textAnchor="middle"
            >
              {lab}
            </text>
          );
        })}
      </svg>

      <ChartFloatingTip
        visible={tip != null && active != null}
        clientX={tip?.clientX ?? 0}
        clientY={tip?.clientY ?? 0}
      >
        {active ? (
          <>
            <div className="tip__title">{active.label}</div>
            {active.items.map((it) => (
              <div key={it.name} className="tip__row">
                <span
                  className="tip__dot"
                  style={{ background: it.color }}
                />
                <span className="tip__name">{it.name}</span>
                <span className="tip__val">
                  {money ? fmt.money(it.v) : fmt.num(it.v)}
                </span>
              </div>
            ))}
          </>
        ) : null}
      </ChartFloatingTip>
    </>
  );
}
