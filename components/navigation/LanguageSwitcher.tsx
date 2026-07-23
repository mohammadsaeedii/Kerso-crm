"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { locales, localeNames, type Locale } from "@/lib/i18n/config";

export function LanguageSwitcher({ locale }: { locale: Locale }) {
  const pathname = usePathname();
  const rest = pathname.replace(/^\/(en|fa)/, "") || "/dashboard";

  return (
    <div className="lang-switch" role="group" aria-label="Language">
      {locales.map((l) => {
        const active = l === locale;
        return (
          <Link
            key={l}
            href={`/${l}${rest}`}
            className={`lang-switch__btn${active ? " is-active" : ""}`}
            hrefLang={l}
            aria-current={active ? "true" : undefined}
          >
            {localeNames[l]}
          </Link>
        );
      })}
    </div>
  );
}
