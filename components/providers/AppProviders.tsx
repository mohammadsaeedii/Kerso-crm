"use client";

import type { ReactNode } from "react";
import type { Locale } from "@/lib/i18n/config";
import type { Dictionary } from "@/lib/i18n/get-dictionary";
import { createFmt } from "@/lib/utils/fmt";
import type { AppData } from "@/types";
import { DataProvider } from "./DataProvider";
import { I18nProvider } from "./I18nProvider";
import { ThemeProvider } from "./ThemeProvider";
import { ToastProvider } from "./ToastProvider";

export type AppProvidersProps = {
  locale: Locale;
  dict: Dictionary;
  initialData?: AppData;
  children: ReactNode;
};

export function AppProviders({
  locale,
  dict,
  initialData,
  children,
}: AppProvidersProps) {
  const fmt = createFmt(locale);

  return (
    <I18nProvider locale={locale} dict={dict} fmt={fmt}>
      <ThemeProvider>
        <DataProvider locale={locale} initialData={initialData}>
          <ToastProvider>{children}</ToastProvider>
        </DataProvider>
      </ThemeProvider>
    </I18nProvider>
  );
}
