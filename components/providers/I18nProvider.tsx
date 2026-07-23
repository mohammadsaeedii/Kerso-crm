"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  type ReactNode,
} from "react";
import type { Locale } from "@/lib/i18n/config";
import { localeDirection } from "@/lib/i18n/config";
import { t as tPath, type Dictionary } from "@/lib/i18n/get-dictionary";
import type { Fmt } from "@/lib/utils/fmt";

export type I18nContextValue = {
  locale: Locale;
  dict: Dictionary;
  fmt: Fmt;
  dir: "rtl" | "ltr";
  t: (path: string, vars?: Record<string, string | number>) => string;
};

const I18nContext = createContext<I18nContextValue | null>(null);

export type I18nProviderProps = {
  locale: Locale;
  dict: Dictionary;
  fmt: Fmt;
  children: ReactNode;
};

export function I18nProvider({ locale, dict, fmt, children }: I18nProviderProps) {
  const t = useCallback(
    (path: string, vars?: Record<string, string | number>) =>
      tPath(dict, path, vars),
    [dict],
  );

  const value = useMemo<I18nContextValue>(
    () => ({
      locale,
      dict,
      fmt,
      dir: localeDirection[locale],
      t,
    }),
    [locale, dict, fmt, t],
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18nContext(): I18nContextValue {
  const ctx = useContext(I18nContext);
  if (!ctx) {
    throw new Error("useI18n must be used within I18nProvider");
  }
  return ctx;
}
