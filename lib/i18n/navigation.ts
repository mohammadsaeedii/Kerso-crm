import type { Locale } from "./config";

/** Build a locale-prefixed path, e.g. localizedPath("fa", "/customers") → "/fa/customers". */
export function localizedPath(locale: Locale, path = "/"): string {
  const normalized = path.startsWith("/") ? path : `/${path}`;
  if (normalized === "/") return `/${locale}`;
  return `/${locale}${normalized}`;
}
