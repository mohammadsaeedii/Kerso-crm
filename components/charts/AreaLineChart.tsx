"use client";

import { useCallback, useMemo, useRef, useState, type MouseEvent } from "react";
import { useI18n } from "@/hooks/useI18n";
import { uid } from "@/lib/utils/id";
import { niceMax } from "@/lib/utils/math";
import { cn } from "@/lib/utils/cn";
import { ChartFloatingTip } from "./ChartFloatingTip";
import { CHART_PALETTE } from "./palette";

export type AreaLineSeries = {
  name: string;
  values: number[];
  color?: string;
  fill?: boolean;
  width?: number;
  dashed?: boolean;
};

export type AreaLineChartProps = {
  labels?: string[];
  series: AreaLineSeries[];
  height?: number;
  max?: number;
  money?: boolean;
  className?: string;
};

type TipState = {
  idx: number;
  clientX: number;
  clientY: number;
};

export function AreaLineChart({
  labels = [],
  series,
  height = 280,
  max: maxOpt,
  money,
  className,
}: AreaLineChartProps) {
  const { fmt } = useI18n();
  const svgRef = useRef<SVGSVGElement>(null);
  const [tip, setTip] = useState<TipState | null>(null);
  const gid = useMemo(() => uid("ln"), []);

  const W = 760;
  const H = height;
  const pad = { l: 46, r: 16, t: 16, b: 34 };
  const pw = W - pad.l - pad.r;
  const ph = H - pad.t - pad.b;
  const n = labels.length || (series[0] ? series[0].values.length : 0);
  const maxData = Math.max(1, ...series.flatMap((s) => s.values));
  const max = maxOpt || niceMax(maxData * 1.1);
  const xAt = (i: number) =>
    pad.l + (n <= 1 ? pw / 2 : (i / (n - 1)) * pw);
  const yAt = (v: number) => pad.t + ph - (v / max) * ph;

  const metaX = Array.from({ length: n }, (_, i) => +xAt(i).toFixed(1));

  const resolved = series.map((s, si) => {
    const color = s.color || CHART_PALETTE[si % CHART_PALETTE.length]!;
    const pts = s.values.map((v, i) => [xAt(i), yAt(v)] as const);
    return { ...s, color, pts };
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
    metaX.forEach((xx, i) => {
      const d = Math.abs(xx - p.x);
      if (d < best) {
        best = d;
        idx = i;
      }
    });
    setTip({ idx, clientX: e.clientX, clientY: e.clientY });
  };

  const onLeave = () => setTip(null);

  const gridN = 4;
  const everyX = n > 12 ? Math.ceil(n / 8) : 1;
  const focusIdx = tip?.idx ?? null;
  const gx = focusIdx != null ? metaX[focusIdx] : 0;

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
        onMouseLeave={onLeave}
      >
        <defs>
          {resolved.map((s, si) =>
            s.fill !== false ? (
              <linearGradient
                key={si}
                id={`${gid}-g${si}`}
                x1="0"
                y1="0"
                x2="0"
                y2="1"
              >
                <stop offset="0%" stopColor={s.color} stopOpacity={0.22} />
                <stop offset="100%" stopColor={s.color} stopOpacity={0} />
              </linearGradient>
            ) : null,
          )}
        </defs>

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

        {resolved.map((s, si) => {
          const pts = s.pts;
          if (!pts.length) return null;
          const linePath = pts
            .map(
              (p, i) =>
                `${i ? "L" : "M"}${p[0].toFixed(1)} ${p[1].toFixed(1)}`,
            )
            .join(" ");
          const area =
            `M${pts[0]![0].toFixed(1)} ${(pad.t + ph).toFixed(1)} ` +
            pts
              .map((p) => `L${p[0].toFixed(1)} ${p[1].toFixed(1)}`)
              .join(" ") +
            ` L${pts[pts.length - 1]![0].toFixed(1)} ${(pad.t + ph).toFixed(1)} Z`;
          const last = pts[pts.length - 1]!;
          return (
            <g key={si}>
              {s.fill !== false ? (
                <path d={area} fill={`url(#${gid}-g${si})`} />
              ) : null}
              <path
                d={linePath}
                fill="none"
                stroke={s.color}
                strokeWidth={s.width || 2.6}
                strokeDasharray={s.dashed ? "5 5" : undefined}
                strokeLinejoin="round"
                strokeLinecap="round"
              />
              <circle
                cx={last[0].toFixed(1)}
                cy={last[1].toFixed(1)}
                r={3.4}
                fill={s.color}
                stroke="var(--surface)"
                strokeWidth={2}
              />
            </g>
          );
        })}

        <g className="chart__focus" opacity={focusIdx != null ? 1 : 0}>
          <line
            className="chart__guide"
            y1={pad.t}
            y2={pad.t + ph}
            x1={gx}
            x2={gx}
          />
          {resolved.map((s, si) => {
            const cy =
              focusIdx != null
                ? +s.pts[focusIdx]![1].toFixed(1)
                : 0;
            return (
              <circle
                key={si}
                r={4.5}
                fill={s.color}
                stroke="var(--surface)"
                strokeWidth={2}
                cx={gx}
                cy={cy}
              />
            );
          })}
        </g>

        {labels.map((lab, i) => {
          if (i % everyX !== 0 && i !== n - 1) return null;
          return (
            <text
              key={i}
              className="chart__xlabel"
              x={xAt(i).toFixed(1)}
              y={H - 12}
              textAnchor="middle"
            >
              {lab}
            </text>
          );
        })}

        <rect
          className="chart__hit"
          x={pad.l}
          y={pad.t}
          width={pw}
          height={ph}
          fill="transparent"
        />
      </svg>

      <ChartFloatingTip
        visible={tip != null}
        clientX={tip?.clientX ?? 0}
        clientY={tip?.clientY ?? 0}
      >
        {tip ? (
          <>
            <div className="tip__title">{labels[tip.idx] || ""}</div>
            {resolved.map((s) => (
              <div key={s.name} className="tip__row">
                <span
                  className="tip__dot"
                  style={{ background: s.color }}
                />
                <span className="tip__name">{s.name}</span>
                <span className="tip__val">
                  {money
                    ? fmt.money(s.values[tip.idx] ?? 0)
                    : fmt.num(s.values[tip.idx] ?? 0)}
                </span>
              </div>
            ))}
          </>
        ) : null}
      </ChartFloatingTip>
    </>
  );
}
