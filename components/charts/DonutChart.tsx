import { polar } from "@/lib/utils/math";
import { cn } from "@/lib/utils/cn";
import { CHART_PALETTE } from "./palette";

export type DonutSlice = {
  name: string;
  value: number;
  color?: string;
};

export type DonutChartProps = {
  data: DonutSlice[];
  size?: number;
  thickness?: number;
  center?: string;
  centerSub?: string;
  className?: string;
};

export function DonutChart({
  data,
  size = 200,
  thickness = 26,
  center,
  centerSub = "",
  className,
}: DonutChartProps) {
  const r = size / 2;
  const inner = r - thickness;
  const cx = r;
  const cy = r;
  const total = data.reduce((a, d) => a + d.value, 0) || 1;

  const angles = data.reduce<number[]>((acc, d) => {
    const prev = acc.length ? acc[acc.length - 1]! : 0;
    acc.push(prev + (d.value / total) * 360);
    return acc;
  }, []);

  const segs = data.map((d, i) => {
    const a0 = i === 0 ? 0 : angles[i - 1]!;
    const a1 = angles[i]!;
    const frac = d.value / total;
    const large = a1 - a0 > 180 ? 1 : 0;
    const [x0, y0] = polar(cx, cy, r - 1, a0);
    const [x1, y1] = polar(cx, cy, r - 1, a1);
    const [ix1, iy1] = polar(cx, cy, inner, a1);
    const [ix0, iy0] = polar(cx, cy, inner, a0);
    const color = d.color || CHART_PALETTE[i % CHART_PALETTE.length]!;
    const path = `M${x0.toFixed(2)} ${y0.toFixed(2)} A${r - 1} ${r - 1} 0 ${large} 1 ${x1.toFixed(2)} ${y1.toFixed(2)} L${ix1.toFixed(2)} ${iy1.toFixed(2)} A${inner} ${inner} 0 ${large} 0 ${ix0.toFixed(2)} ${iy0.toFixed(2)} Z`;
    const pct = Math.round(frac * 100);
    return (
      <path
        key={`${d.name}-${i}`}
        className="chart__seg"
        d={path}
        fill={color}
        data-tip={`${d.name} — ${pct}%`}
      >
        <title>
          {d.name}: {pct}%
        </title>
      </path>
    );
  });

  return (
    <svg
      className={cn("chart chart--donut", className)}
      viewBox={`0 0 ${size} ${size}`}
      style={{ width: size, height: size, maxWidth: "100%" }}
    >
      {segs}
      {center ? (
        <>
          <text className="chart__donut-num" x={cx} y={cy - 2} textAnchor="middle">
            {center}
          </text>
          <text className="chart__donut-sub" x={cx} y={cy + 16} textAnchor="middle">
            {centerSub}
          </text>
        </>
      ) : null}
    </svg>
  );
}
