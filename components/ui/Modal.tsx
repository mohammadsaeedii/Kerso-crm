"use client";

import { useEffect, useRef, type CSSProperties, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { useI18n } from "@/hooks/useI18n";
import { IconButton } from "@/components/ui/IconButton";
import { getFocusable, lockBodyScroll, trapTab } from "@/components/ui/overlay";
import { cn } from "@/lib/utils/cn";

export type ModalProps = {
  open: boolean;
  onClose: () => void;
  title?: ReactNode;
  subtitle?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  size?: "sm" | "md" | "lg";
  dismissable?: boolean;
  className?: string;
};

export function Modal({
  open,
  onClose,
  title,
  subtitle,
  children,
  footer,
  size,
  dismissable = true,
  className,
}: ModalProps) {
  const { t } = useI18n();
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const unlock = lockBodyScroll();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && dismissable) onClose();
      if (rootRef.current) trapTab(e, rootRef.current);
    };
    document.addEventListener("keydown", onKey, true);
    const focusable = rootRef.current ? getFocusable(rootRef.current) : [];
    const timer = window.setTimeout(() => (focusable[1] || focusable[0])?.focus(), 60);
    return () => {
      unlock();
      document.removeEventListener("keydown", onKey, true);
      window.clearTimeout(timer);
    };
  }, [open, onClose, dismissable]);

  if (!open || typeof document === "undefined") return null;

  return createPortal(
    <div
      ref={rootRef}
      className="overlay is-open"
      role="dialog"
      aria-modal="true"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget && dismissable) onClose();
      }}
    >
      <div className={cn("modal", size && `modal--${size}`, className)} role="document">
        <header className="modal__head">
          <div>
            {title != null ? <h2 className="modal__title">{title}</h2> : null}
            {subtitle != null ? <p className="modal__sub">{subtitle}</p> : null}
          </div>
          <IconButton
            icon="x"
            size={20}
            sm
            className="modal__close"
            tip={t("common.close")}
            onClick={onClose}
          />
        </header>
        <div className="modal__body">{children}</div>
        {footer ? <footer className="modal__foot">{footer}</footer> : null}
      </div>
    </div>,
    document.body,
  );
}
