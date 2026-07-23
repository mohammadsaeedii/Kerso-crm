"use client";

import { useEffect, useRef, type CSSProperties, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { useI18n } from "@/hooks/useI18n";
import { IconButton } from "@/components/ui/IconButton";
import { getFocusable, lockBodyScroll, trapTab } from "@/components/ui/overlay";
import { cn } from "@/lib/utils/cn";

export type DrawerProps = {
  open: boolean;
  onClose: () => void;
  title?: ReactNode;
  head?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  width?: number;
  className?: string;
};

export function Drawer({
  open,
  onClose,
  title,
  head,
  children,
  footer,
  width,
  className,
}: DrawerProps) {
  const { t } = useI18n();
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const unlock = lockBodyScroll();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (rootRef.current) trapTab(e, rootRef.current);
    };
    document.addEventListener("keydown", onKey, true);
    const focusable = rootRef.current ? getFocusable(rootRef.current) : [];
    const timer = window.setTimeout(() => focusable[0]?.focus(), 60);
    return () => {
      unlock();
      document.removeEventListener("keydown", onKey, true);
      window.clearTimeout(timer);
    };
  }, [open, onClose]);

  if (!open || typeof document === "undefined") return null;

  const style: CSSProperties | undefined = width ? { width: `${width}px` } : undefined;

  return createPortal(
    <div
      ref={rootRef}
      className="overlay overlay--drawer is-open"
      role="dialog"
      aria-modal="true"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <aside className={cn("drawer", className)} style={style}>
        <header className="drawer__head">
          <div className="drawer__head-main">
            {head ?? (title != null ? <h2 className="drawer__title">{title}</h2> : null)}
          </div>
          <IconButton
            icon="x"
            size={20}
            sm
            className="drawer__close"
            tip={t("common.close")}
            onClick={onClose}
          />
        </header>
        <div className="drawer__body">{children}</div>
        {footer ? <footer className="drawer__foot">{footer}</footer> : null}
      </aside>
    </div>,
    document.body,
  );
}
