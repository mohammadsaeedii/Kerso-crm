import type { Locale } from "@/lib/i18n/config";
import { defaultLocale, isLocale } from "@/lib/i18n/config";
import en from "@/messages/en.json";
import fa from "@/messages/fa.json";

const dictionaries = {
  en,
  fa,
} as const;

export type Dictionary = typeof en;

export async function getDictionary(locale: Locale): Promise<Dictionary> {
  const key = isLocale(locale) ? locale : defaultLocale;
  return dictionaries[key] as Dictionary;
}

export function getDictionarySync(locale: Locale): Dictionary {
  const key = isLocale(locale) ? locale : defaultLocale;
  return dictionaries[key] as Dictionary;
}

type DictValue = string | number | boolean | DictValue[] | { [key: string]: DictValue };

/** Dot-path accessor with optional `{name}` interpolation. */
export function t(
  dict: Dictionary,
  path: string,
  vars?: Record<string, string | number>,
): string {
  const parts = path.split(".");
  let cur: DictValue = dict as unknown as DictValue;
  for (const p of parts) {
    if (cur == null || typeof cur !== "object" || Array.isArray(cur)) return path;
    cur = (cur as Record<string, DictValue>)[p]!;
  }
  if (typeof cur !== "string") return path;
  if (!vars) return cur;
  return cur.replace(/\{(\w+)\}/g, (_, key: string) =>
    vars[key] != null ? String(vars[key]) : `{${key}}`,
  );
}
