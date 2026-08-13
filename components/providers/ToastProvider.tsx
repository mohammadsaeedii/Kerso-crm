"use client";

import {
  createContext,
  useCallback,
  useContext,
  useState,
  type ReactNode,
} from "react";
import { Icon, type IconName } from "@/lib/icons";
import { cn } from "@/lib/utils/cn";
import { uid } from "@/lib/utils/id";

export type ToastType = "success" | "error" | "info" | "warning";

export type ToastInput = {
  title: string;
  desc?: string;
  type?: ToastType;
  duration?: number;
};

type ToastItem = ToastInput & { id: string; type: ToastType };

type ToastContextValue = {
  toast: (title: string | ToastInput, opts?: Omit<ToastInput, "title">) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

const ICONS: Record<ToastType, IconName> = {
  success: "check-circle",
  error: "x-circle",
  info: "info",
  warning: "alert",
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);

  const dismiss = useCallback((id: string) => {
    setItems((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = useCallback(
    (titleOrOpts: string | ToastInput, opts: Omit<ToastInput, "title"> = {}) => {
      const input: ToastInput =
        typeof titleOrOpts === "string"
          ? { title: titleOrOpts, ...opts }
          : titleOrOpts;
      const id = uid("toast");
      const item: ToastItem = {
        id,
        title: input.title,
        desc: input.desc,
        type: input.type ?? "info",
        duration: input.duration ?? 3200,
      };
      setItems((prev) => [...prev, item]);
      window.setTimeout(() => dismiss(id), item.duration);
    },
    [dismiss],
  );

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div className="toasts" aria-live="polite">
        {items.map((t) => (
          <div key={t.id} className={cn("toast", "is-on", `toast--${t.type}`)}>
            <span className="toast__icon">
              <Icon name={ICONS[t.type]} size={18} />
            </span>
            <div className="toast__body">
              <p className="toast__msg">{t.title}</p>
              {t.desc ? <p className="toast__desc">{t.desc}</p> : null}
            </div>
            <button
              type="button"
              className="toast__close"
              aria-label="Dismiss"
              onClick={() => dismiss(t.id)}
            >
              <Icon name="x" size={16} />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}
