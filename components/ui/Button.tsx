import type { ButtonHTMLAttributes, ReactNode } from "react";
import { Icon, type IconName } from "@/lib/icons";
import { cn } from "@/lib/utils/cn";

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "sm" | "md";
  block?: boolean;
  icon?: IconName;
  children?: ReactNode;
};

export function Button({
  variant = "secondary",
  size = "md",
  block,
  icon,
  className,
  children,
  type = "button",
  ...rest
}: ButtonProps) {
  return (
    <button
      type={type}
      className={cn(
        "btn",
        `btn--${variant}`,
        size === "sm" && "btn--sm",
        block && "btn--block",
        className,
      )}
      {...rest}
    >
      {icon ? <Icon name={icon} size={size === "sm" ? 16 : 18} /> : null}
      {children != null && children !== false ? <span>{children}</span> : null}
    </button>
  );
}
