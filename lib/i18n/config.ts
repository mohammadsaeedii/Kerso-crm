export const locales = ["en", "fa"] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = "fa";
export const localeDirection: Record<Locale, "rtl" | "ltr"> = {
  fa: "rtl",
  en: "ltr",
};
export const localeNames: Record<Locale, string> = {
  fa: "فارسی",
  en: "English",
};

export function isLocale(v: string): v is Locale {
  return (locales as readonly string[]).includes(v);
}
