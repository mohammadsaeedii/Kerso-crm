"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { createPortal } from "react-dom";

export type ChartFloatingTipProps = {
  visible: boolean;
  clientX: number;
  clientY: number;
  children: ReactNode;
};

/** Floating chart tooltip portal (legacy #chart-tip). */
export function ChartFloatingTip({
  visible,
  clientX,
  clientY,
  children,
}: ChartFloatingTipProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const tip = ref.current;
    if (!tip || !visible) return;
    const pad = 14;
    const rect = tip.getBoundingClientRect();
    let x = clientX + pad;
    let y = clientY + pad;
    if (x + rect.width > window.innerWidth - 8) x = clientX - rect.width - pad;
    if (y + rect.height > window.innerHeight - 8) y = clientY - rect.height - pad;
    tip.style.left = `${x}px`;
    tip.style.top = `${y}px`;
  }, [visible, clientX, clientY, children]);

  if (typeof document === "undefined") return null;

  return createPortal(
    <div
      ref={ref}
      id="chart-tip"
      className={`chart-tip${visible ? " is-on" : ""}`}
      style={{ left: clientX + 14, top: clientY + 14 }}
    >
      {children}
    </div>,
    document.body,
  );
}
