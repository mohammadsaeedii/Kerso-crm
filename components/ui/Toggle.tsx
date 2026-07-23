"use client";

import type { InputHTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils/cn";

export type ToggleProps = {
  name?: string;
  checked?: boolean;
  defaultChecked?: boolean;
  onChange?: (checked: boolean) => void;
  label?: ReactNode;
  className?: string;
  disabled?: boolean;
} & Omit<
  InputHTMLAttributes<HTMLInputElement>,
  "type" | "checked" | "defaultChecked" | "onChange" | "name"
>;

export function Toggle({
  name,
  checked,
  defaultChecked,
  onChange,
  label,
  className,
  disabled,
  ...rest
}: ToggleProps) {
  return (
    <label className={cn("switch", className)}>
      <input
        type="checkbox"
        name={name}
        checked={checked}
        defaultChecked={defaultChecked}
        disabled={disabled}
        onChange={(e) => onChange?.(e.target.checked)}
        {...rest}
      />
      <span className="switch__track">
        <span className="switch__thumb" />
      </span>
      {label != null ? <span className="switch__label">{label}</span> : null}
    </label>
  );
}
