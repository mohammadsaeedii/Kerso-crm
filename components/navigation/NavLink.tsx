"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils/cn";
import { localizedPath } from "@/lib/i18n/navigation";
import type { Locale } from "@/lib/i18n/config";
import { Icon, type IconName } from "@/lib/icons";

export type NavLinkProps = {
  locale: Locale;
  href: string;
  label: string;
  icon: IconName;
  onNavigate?: () => void;
};

export function NavLink({ locale, href, label, icon, onNavigate }: NavLinkProps) {
  const pathname = usePathname();
  const full = localizedPath(locale, href);
  const active = pathname === full || pathname.startsWith(full + "/");

  return (
    <Link
      href={full}
      className={cn("nav__item", active && "nav__item--active")}
      aria-current={active ? "page" : undefined}
      data-tip={label}
      onClick={onNavigate}
    >
      <Icon name={icon} size={20} className="nav__icon" />
      <span>{label}</span>
    </Link>
  );
}
