import { cn } from "@/lib/utils/cn";

export type ChartLegendItem = {
  name: string;
  color: string;
};

export type ChartLegendProps = {
  items: ChartLegendItem[];
  className?: string;
};

export function ChartLegend({ items, className }: ChartLegendProps) {
  return (
    <div className={cn("legend", className)}>
      {items.map((it) => (
        <span key={it.name} className="legend__item">
          <span className="legend__dot" style={{ background: it.color }} />
          {it.name}
        </span>
      ))}
    </div>
  );
}
