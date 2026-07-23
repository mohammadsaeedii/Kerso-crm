import type { ReactNode } from "react";
import { Inter, Vazirmatn } from "next/font/google";
import { notFound } from "next/navigation";
import { AppProviders } from "@/components/providers/AppProviders";
import { AppShell } from "@/components/layout/AppShell";
import { isLocale, localeDirection, locales, type Locale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/get-dictionary";
import "@/styles/globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const vazirmatn = Vazirmatn({
  subsets: ["arabic"],
  variable: "--font-vazirmatn",
  display: "swap",
});

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: raw } = await params;
  const locale = (isLocale(raw) ? raw : "fa") as Locale;
  const dict = await getDictionary(locale);
  const template = dict.meta.titleTemplate.includes("{page}")
    ? dict.meta.titleTemplate.replace("{page}", "%s")
    : `%s — ${dict.meta.brand}`;
  return {
    title: {
      default: `${dict.meta.brand} — CRM`,
      template,
    },
    description: dict.meta.description,
  };
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale: raw } = await params;
  if (!isLocale(raw)) notFound();
  const locale = raw;
  const dict = await getDictionary(locale);
  const dir = localeDirection[locale];
  const fontClass = locale === "fa" ? vazirmatn.variable : inter.variable;

  return (
    <html lang={locale} dir={dir} data-theme="light" className={fontClass} suppressHydrationWarning>
      <body style={{ fontFamily: "var(--font-sans)" }}>
        <AppProviders locale={locale} dict={dict}>
          <AppShell>{children}</AppShell>
        </AppProviders>
      </body>
    </html>
  );
}
