"use client";

import { useId } from "react";
import { cn } from "@/lib/utils/cn";

export type SparklineProps = {
  values: number[];
  width?: number;
  height?: number;
  color?: string;
  /** CSS width override (e.g. "100%"). */
  cssWidth?: string;
  className?: string;
};

export function Sparkline({
  values,
  width = 120,
  height = 36,
  color = "#4F46E5",
  cssWidth,
  className,
}: SparklineProps) {
  const gid = useId().replace(/:/g, "");
  if (!values.length) return null;

  const max = Math.max(...values);
  const min = Math.min(...values);
  const span = max - min || 1;
  const xAt = (i: number) =>
    values.length <= 1 ? width / 2 : (i / (values.length - 1)) * width;
  const yAt = (v: number) => height - 3 - ((v - min) / span) * (height - 6);
  const pts = values.map((v, i) => [xAt(i), yAt(v)] as const);
  const line = pts
    .map((p, i) => `${i ? "L" : "M"}${p[0].toFixed(1)} ${p[1].toFixed(1)}`)
    .join(" ");
  const area =
    `M0 ${height} ` +
    pts.map((p) => `L${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join(" ") +
    ` L${width} ${height} Z`;

  return (
    <svg
      className={cn("spark", className)}
      viewBox={`0 0 ${width} ${height}`}
      preserveAspectRatio="none"
      style={{
        width: cssWidth ?? `${width}px`,
        height: `${height}px`,
        display: "block",
      }}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity={0.28} />
          <stop offset="100%" stopColor={color} stopOpacity={0} />
        </linearGradient>
      </defs>
      <path d={area} fill={`url(#${gid})`} />
      <path
        d={line}
        fill="none"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
