"use client";

import type { ButtonHTMLAttributes } from "react";
import { Icon, type IconName } from "@/lib/icons";
import { cn } from "@/lib/utils/cn";

export type IconButtonProps = {
  icon: IconName;
  size?: number;
  tip?: string;
  badge?: boolean;
  sm?: boolean;
  className?: string;
} & Omit<ButtonHTMLAttributes<HTMLButtonElement>, "children">;

export function IconButton({
  icon,
  size = 20,
  tip,
  badge = false,
  sm = false,
  className,
  title,
  type = "button",
  ...rest
}: IconButtonProps) {
  const label = tip || title || icon;
  return (
    <button
      type={type}
      className={cn("icon-btn", sm && "icon-btn--sm", className)}
      title={title ?? tip}
      data-tip={tip || undefined}
      aria-label={label}
      {...rest}
    >
      <Icon name={icon} size={size} />
      {badge ? <span className="dot-badge" /> : null}
    </button>
  );
}
