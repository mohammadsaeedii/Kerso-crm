import type { ReactNode } from "react";
import { cn } from "@/lib/utils/cn";

export type PanelProps = {
  title?: ReactNode;
  sub?: ReactNode;
  actions?: ReactNode;
  flush?: boolean;
  children: ReactNode;
  className?: string;
  bodyClassName?: string;
  legend?: ReactNode;
};

export function Panel({
  title,
  sub,
  actions,
  flush = false,
  children,
  className,
  bodyClassName,
  legend,
}: PanelProps) {
  const showHead = title != null || sub != null || actions != null;

  return (
    <section className={cn("panel", className)}>
      {showHead ? (
        <header className="panel__head">
          <div className="panel__head-main">
            {title != null ? <h3 className="panel__title">{title}</h3> : null}
            {sub != null && sub !== "" ? (
              <p className="panel__sub">{sub}</p>
            ) : null}
          </div>
          {actions ? <div className="panel__actions">{actions}</div> : null}
        </header>
      ) : null}
      <div
        className={cn(
          "panel__body",
          flush && "panel__body--flush",
          bodyClassName,
        )}
      >
        {legend ? <div className="panel__legend">{legend}</div> : null}
        {children}
      </div>
    </section>
  );
}
