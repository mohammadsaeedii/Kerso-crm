"use client";

import type { ReactNode } from "react";
import { Icon, type IconName } from "@/lib/icons";
import { useI18n } from "@/hooks/useI18n";
import { cn } from "@/lib/utils/cn";

export type EmptyStateProps = {
  icon?: IconName;
  title?: string;
  desc?: string;
  action?: ReactNode;
  className?: string;
};

export function EmptyState({
  icon = "search",
  title,
  desc,
  action,
  className,
}: EmptyStateProps) {
  const { t } = useI18n();

  return (
    <div className={cn("empty", className)}>
      <div className="empty__icon">
        <Icon name={icon} size={28} />
      </div>
      <p className="empty__title">{title ?? t("common.nothingHere")}</p>
      {desc ? <p className="empty__desc">{desc}</p> : null}
      {action ? <div className="empty__action">{action}</div> : null}
    </div>
  );
}
