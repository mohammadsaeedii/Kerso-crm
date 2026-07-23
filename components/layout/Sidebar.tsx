"use client";

import { useI18n } from "@/hooks/useI18n";
import { useToast } from "@/hooks/useToast";
import { Icon } from "@/lib/icons";
import { BrandMark } from "./BrandMark";
import { NavLink } from "@/components/navigation/NavLink";

export type SidebarProps = {
  collapsed: boolean;
  onToggleCollapse: () => void;
  onNavigate?: () => void;
};

export function Sidebar({ collapsed, onToggleCollapse, onNavigate }: SidebarProps) {
  const { locale, t, dict } = useI18n();
  const { toast } = useToast();

  const primary = [
    { id: "dashboard", href: "/dashboard", icon: "dashboard" as const, label: dict.nav.dashboard },
    { id: "explore", href: "/explore", icon: "explore" as const, label: dict.nav.explore },
    { id: "analytics", href: "/analytics", icon: "analytics" as const, label: dict.nav.analytics },
    { id: "customers", href: "/customers", icon: "customers" as const, label: dict.nav.customers },
    { id: "reviews", href: "/reviews", icon: "reviews" as const, label: dict.nav.reviews },
  ];

  return (
    <aside className="sidebar">
      <div className="brand">
        <span className="brand__mark" aria-hidden="true">
          <BrandMark />
        </span>
        <span className="brand__name">{dict.meta.brand}</span>
        <button
          type="button"
          className="brand__collapse"
          onClick={onToggleCollapse}
          aria-label={collapsed ? t("shell.expandSidebar") : t("shell.collapseSidebar")}
          data-tip={t("shell.toggleSidebar")}
        >
          <Icon name="sidebar" size={20} />
        </button>
      </div>

      <nav className="nav" aria-label={dict.nav.primary}>
        {primary.map((item) => (
          <NavLink
            key={item.id}
            locale={locale}
            href={item.href}
            label={item.label}
            icon={item.icon}
            onNavigate={onNavigate}
          />
        ))}
      </nav>

      <div className="nav nav--foot">
        <NavLink
          locale={locale}
          href="/settings"
          label={dict.nav.settings}
          icon="gear"
          onNavigate={onNavigate}
        />
        <button
          type="button"
          className="nav__item"
          data-tip={dict.nav.help}
          aria-label={dict.nav.help}
          onClick={() => {
            onNavigate?.();
            toast(dict.nav.help, { type: "info" });
          }}
        >
          <Icon name="help" size={20} className="nav__icon" />
          <span>{dict.nav.help}</span>
        </button>
      </div>

      <div className="sidebar__card">
        <span className="sidebar__card-icon">
          <Icon name="sparkles" size={18} />
        </span>
        <p className="sidebar__card-title">{t("shell.upgradeTitle")}</p>
        <p className="sidebar__card-desc">{t("shell.upgradeDesc")}</p>
        <button
          type="button"
          className="btn btn--primary btn--sm btn--block"
          onClick={() =>
            toast(t("shell.upgrade"), {
              type: "info",
              desc: t("shell.upgradeToastDesc"),
            })
          }
        >
          {t("shell.upgrade")}
        </button>
      </div>
    </aside>
  );
}
