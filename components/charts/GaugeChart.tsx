import { clamp } from "@/lib/utils/math";
import { cn } from "@/lib/utils/cn";

export type GaugeChartProps = {
  value: number;
  size?: number;
  color?: string;
  label?: string;
  sub?: string;
  className?: string;
};

export function GaugeChart({
  value: raw,
  size = 160,
  color = "#4F46E5",
  label,
  sub = "",
  className,
}: GaugeChartProps) {
  const value = clamp(raw || 0, 0, 100);
  const r = size / 2 - 12;
  const cx = size / 2;
  const cy = size / 2;
  const circ = 2 * Math.PI * r;

  return (
    <svg
      className={cn("chart chart--gauge", className)}
      viewBox={`0 0 ${size} ${size}`}
      style={{ width: size, height: size, maxWidth: "100%" }}
    >
      <circle
        cx={cx}
        cy={cy}
        r={r}
        fill="none"
        stroke="var(--track)"
        strokeWidth={12}
      />
      <circle
        cx={cx}
        cy={cy}
        r={r}
        fill="none"
        stroke={color}
        strokeWidth={12}
        strokeLinecap="round"
        strokeDasharray={circ.toFixed(1)}
        strokeDashoffset={(circ * (1 - value / 100)).toFixed(1)}
        transform={`rotate(-90 ${cx} ${cy})`}
      />
      <text
        className="chart__gauge-num"
        x={cx}
        y={cy - 2}
        textAnchor="middle"
      >
        {label ?? `${value}%`}
      </text>
      <text
        className="chart__gauge-sub"
        x={cx}
        y={cy + 18}
        textAnchor="middle"
      >
        {sub}
      </text>
    </svg>
  );
}
