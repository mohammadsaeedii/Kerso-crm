"use client";

import { forwardRef, type ButtonHTMLAttributes } from "react";
import { Icon, type IconName } from "@/lib/icons";
import { cn } from "@/lib/utils/cn";

export type IconButtonProps = {
  icon: IconName;
  size?: number;
  tip?: string;
  badge?: boolean;
  count?: number;
  countLabel?: string;
  countTone?: "default" | "coral";
  sm?: boolean;
  className?: string;
} & Omit<ButtonHTMLAttributes<HTMLButtonElement>, "children">;

export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(
  function IconButton(
    {
      icon,
      size = 20,
      tip,
      badge = false,
      count,
      countLabel,
      countTone = "default",
      sm = false,
      className,
      title,
      type = "button",
      ...rest
    },
    ref,
  ) {
    const label = tip || title || icon;
    const showCount = count != null && count > 0;
    return (
      <button
        ref={ref}
        type={type}
        className={cn("icon-btn", sm && "icon-btn--sm", className)}
        title={title ?? tip}
        data-tip={tip || undefined}
        aria-label={label}
        {...rest}
      >
        <Icon name={icon} size={size} />
        {showCount ? (
          <span className={cn("badge", countTone === "coral" && "badge--coral")}>
            {countLabel ?? count}
          </span>
        ) : badge ? (
          <span className="dot-badge" />
        ) : null}
      </button>
    );
  },
);
