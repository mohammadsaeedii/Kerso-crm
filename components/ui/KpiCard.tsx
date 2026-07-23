"use client";

import type { ReactNode } from "react";
import { useI18n } from "@/hooks/useI18n";
import type { Kpi } from "@/types";
import { Sparkline } from "@/components/charts/Sparkline";
import { IconButton } from "@/components/ui/IconButton";
import { TrendPill } from "@/components/ui/TrendPill";
import { cn } from "@/lib/utils/cn";

export type KpiCardProps = {
  kpi: Kpi;
  menu?: boolean;
  onMenu?: (kpi: Kpi, anchor: HTMLElement) => void;
  className?: string;
  footerHint?: ReactNode;
};

export function KpiCard({
  kpi,
  menu = true,
  onMenu,
  className,
  footerHint,
}: KpiCardProps) {
  const { t } = useI18n();

  return (
    <article className={cn("card", "stat", className)} data-kpi={kpi.id}>
      <div className="stat__top">
        <p className="card__label">{kpi.label}</p>
        {menu ? (
          <IconButton
            icon="more-h"
            size={18}
            sm
            className="stat__menu"
            tip={t("common.options")}
            aria-label={t("common.options")}
            onClick={(e) => onMenu?.(kpi, e.currentTarget)}
          />
        ) : null}
      </div>
      <p className="card__value">{kpi.display}</p>
      <div className="stat__foot">
        <div className="card__foot">
          <TrendPill delta={kpi.delta} dir={kpi.dir} />
          <span className="card__hint">
            {footerHint ?? t("common.vsLastMonth")}
          </span>
        </div>
        <div className="stat__spark">
          <Sparkline
            values={kpi.spark}
            width={96}
            height={34}
            color={kpi.dir === "up" ? "#22C55E" : "#F2654E"}
          />
        </div>
      </div>
    </article>
  );
}
