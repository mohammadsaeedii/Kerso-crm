"use client";

import { useI18n } from "@/hooks/useI18n";
import { useToast } from "@/hooks/useToast";
import { Icon, type IconName } from "@/lib/icons";
import { BrandMark } from "./BrandMark";
import { NavLink } from "@/components/navigation/NavLink";
import { Button } from "@/components/ui/Button";

export type SidebarProps = {
  collapsed: boolean;
  onToggleCollapse: () => void;
  onNavigate?: () => void;
};

type NavItem = {
  id: string;
  href: string;
  icon: IconName;
  label: string;
};

export function Sidebar({ collapsed, onToggleCollapse, onNavigate }: SidebarProps) {
  const { locale, t, dict } = useI18n();
  const { toast } = useToast();

  const primary: NavItem[] = [
    { id: "inbox", href: "/inbox", icon: "inbox", label: dict.nav.inbox },
    { id: "customers", href: "/customers", icon: "customers", label: dict.nav.customers },
    { id: "calls", href: "/calls", icon: "phone-call", label: dict.nav.calls },
    { id: "tickets", href: "/tickets", icon: "ticket", label: dict.nav.tickets },
    { id: "ai", href: "/ai", icon: "bot", label: dict.nav.ai },
    { id: "knowledge", href: "/knowledge", icon: "book", label: dict.nav.knowledge },
    { id: "automations", href: "/automations", icon: "zap", label: dict.nav.automations },
    { id: "analytics", href: "/analytics", icon: "analytics", label: dict.nav.analytics },
  ];

  const secondary: NavItem[] = [
    { id: "dashboard", href: "/dashboard", icon: "dashboard", label: dict.nav.dashboard },
    { id: "explore", href: "/explore", icon: "explore", label: dict.nav.explore },
    { id: "reviews", href: "/reviews", icon: "reviews", label: dict.nav.reviews },
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

      {!collapsed && (
        <p className="nav__section-label">{dict.nav.workspace}</p>
      )}
      <nav className="nav nav--compact" aria-label={dict.nav.workspace}>
        {secondary.map((item) => (
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
          href="/design-system"
          label={dict.nav.designSystem}
          icon="palette"
          onNavigate={onNavigate}
        />
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
        <Button
          variant="primary"
          size="sm"
          block
          onClick={() =>
            toast(t("shell.upgrade"), {
              type: "info",
              desc: t("shell.upgradeToastDesc"),
            })
          }
        >
          {t("shell.upgrade")}
        </Button>
      </div>
    </aside>
  );
}
