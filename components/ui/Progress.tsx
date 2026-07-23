import { cn } from "@/lib/utils/cn";
import { clamp } from "@/lib/utils/math";

export type ProgressProps = {
  value: number;
  small?: boolean;
  color?: string;
  className?: string;
};

export function Progress({ value, small, color, className }: ProgressProps) {
  const v = clamp(value, 0, 100);
  const bg =
    color ||
    (v >= 70 ? "var(--green)" : v >= 40 ? "var(--amber)" : "var(--red)");

  return (
    <div
      className={cn("progress", small && "progress--sm", className)}
      role="progressbar"
      aria-valuenow={v}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <div
        className="progress__fill"
        style={{ width: `${v}%`, background: bg }}
      />
    </div>
  );
}
