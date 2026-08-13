"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { Icon, type IconName } from "@/lib/icons";
import { cn } from "@/lib/utils/cn";

export type MenuItemProps = {
  icon?: IconName;
  danger?: boolean;
  onClick: () => void;
  children: ReactNode;
};

export function MenuItem({ icon, danger, onClick, children }: MenuItemProps) {
  return (
    <button
      type="button"
      className={cn("menu__item", danger && "menu__item--danger")}
      onClick={onClick}
    >
      {icon ? <Icon name={icon} size={15} /> : null}
      <span>{children}</span>
    </button>
  );
}

export type MenuProps = {
  open: boolean;
  anchor: HTMLElement | null;
  onClose: () => void;
  children: ReactNode;
  width?: number;
};

function menuPosition(anchor: HTMLElement, width: number) {
  const r = anchor.getBoundingClientRect();
  let left = r.right - width;
  left = Math.min(Math.max(8, left), window.innerWidth - width - 8);
  return { top: r.bottom + 4, left };
}

export function Menu({ open, anchor, onClose, children, width = 180 }: MenuProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const pos = open && anchor ? menuPosition(anchor, width) : { top: 0, left: 0 };

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      const t = e.target as Node;
      if (anchor?.contains(t) || rootRef.current?.contains(t)) return;
      onClose();
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [open, anchor, onClose]);

  if (!open || typeof document === "undefined") return null;

  return createPortal(
    <div
      ref={rootRef}
      className="popover is-open"
      role="menu"
      style={{
        position: "fixed",
        top: pos.top,
        left: pos.left,
        width,
        zIndex: 80,
        padding: 6,
      }}
    >
      {children}
    </div>,
    document.body,
  );
}
