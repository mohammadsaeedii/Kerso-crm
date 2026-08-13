import { cn } from "@/lib/utils/cn";

export type ChartLegendItem = {
  name: string;
  color: string;
};

export type ChartLegendProps = {
  items: ChartLegendItem[];
  className?: string;
  hidden?: Set<string>;
  onToggle?: (name: string) => void;
};

export function ChartLegend({
  items,
  className,
  hidden,
  onToggle,
}: ChartLegendProps) {
  const toggle = !!onToggle;
  return (
    <div className={cn("legend", toggle && "legend--toggle", className)}>
      {items.map((it) => {
        const off = hidden?.has(it.name);
        if (toggle) {
          return (
            <button
              key={it.name}
              type="button"
              className={cn("legend__item", off && "is-off")}
              onClick={() => onToggle(it.name)}
            >
              <span className="legend__dot" style={{ background: it.color }} />
              {it.name}
            </button>
          );
        }
        return (
          <span key={it.name} className={cn("legend__item", off && "is-off")}>
            <span className="legend__dot" style={{ background: it.color }} />
            {it.name}
          </span>
        );
      })}
    </div>
  );
}
