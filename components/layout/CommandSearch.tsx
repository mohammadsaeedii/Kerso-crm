"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
} from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { Icon, type IconName } from "@/lib/icons";
import { useData } from "@/hooks/useData";
import { useI18n } from "@/hooks/useI18n";
import { localizedPath } from "@/lib/i18n/navigation";
import { companyName } from "@/lib/data/relations";
import { cn } from "@/lib/utils/cn";

type SearchItem = {
  type: "page" | "customer" | "company" | "deal";
  id: string;
  label: string;
  icon: IconName;
  sub: string;
};

const PAGES: { id: string; icon: IconName; labelKey: string }[] = [
  { id: "inbox", icon: "inbox", labelKey: "nav.inbox" },
  { id: "customers", icon: "customers", labelKey: "nav.customers" },
  { id: "customers/new", icon: "plus", labelKey: "customers.addCustomer" },
  { id: "calls", icon: "phone-call", labelKey: "nav.calls" },
  { id: "tickets", icon: "ticket", labelKey: "nav.tickets" },
  { id: "ai", icon: "bot", labelKey: "nav.ai" },
  { id: "knowledge", icon: "book", labelKey: "nav.knowledge" },
  { id: "automations", icon: "zap", labelKey: "nav.automations" },
  { id: "analytics", icon: "analytics", labelKey: "nav.analytics" },
  { id: "dashboard", icon: "dashboard", labelKey: "nav.dashboard" },
  { id: "explore", icon: "explore", labelKey: "nav.explore" },
  { id: "reviews", icon: "reviews", labelKey: "nav.reviews" },
  { id: "settings", icon: "gear", labelKey: "nav.settings" },
  { id: "design-system", icon: "palette", labelKey: "nav.designSystem" },
];

export function CommandSearch() {
  const { locale, t, fmt, dict } = useI18n();
  const { data } = useData();
  const router = useRouter();
  const anchorRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const [pos, setPos] = useState({ left: 0, top: 0, width: 320 });

  const groups = useMemo(() => {
    const q = query.trim().toLowerCase();
    const out: { label: string; items: SearchItem[] }[] = [];
    const pageItems = PAGES.filter(
      (p) => !q || t(p.labelKey).toLowerCase().includes(q),
    ).map((p) => ({
      type: "page" as const,
      id: p.id,
      label: t(p.labelKey),
      icon: p.icon,
      sub: q ? t("shell.commandPage") : t("shell.commandGoToPage"),
    }));
    if (pageItems.length) out.push({ label: t("shell.commandPages"), items: pageItems });

    if (q) {
      const cust = data.customers
        .filter((c) => {
          const company = companyName(data.companies, c.companyId, "");
          return (
            c.name.toLowerCase().includes(q) ||
            company.toLowerCase().includes(q) ||
            c.email.toLowerCase().includes(q)
          );
        })
        .slice(0, 4)
        .map((c) => ({
          type: "customer" as const,
          id: c.id,
          label: c.name,
          icon: "user" as const,
          sub: companyName(data.companies, c.companyId),
        }));
      if (cust.length) out.push({ label: t("shell.commandCustomers"), items: cust });

      const comp = data.companies
        .filter(
          (c) =>
            c.name.toLowerCase().includes(q) ||
            dict.common.industry[c.industry].toLowerCase().includes(q),
        )
        .slice(0, 4)
        .map((c) => ({
          type: "company" as const,
          id: c.id,
          label: c.name,
          icon: "building" as const,
          sub: dict.common.industry[c.industry],
        }));
      if (comp.length) out.push({ label: t("shell.commandCompanies"), items: comp });

      const deals = data.deals
        .filter((d) => {
          const company = companyName(data.companies, d.companyId, "");
          return (
            d.title.toLowerCase().includes(q) ||
            company.toLowerCase().includes(q)
          );
        })
        .slice(0, 4)
        .map((d) => ({
          type: "deal" as const,
          id: d.id,
          label: d.title,
          icon: "briefcase" as const,
          sub: `${companyName(data.companies, d.companyId)} · ${fmt.money(d.value)}`,
        }));
      if (deals.length) out.push({ label: t("shell.commandDeals"), items: deals });
    }

    return out;
  }, [query, data, t, fmt, dict]);

  const flat = useMemo(() => groups.flatMap((g) => g.items), [groups]);

  const reposition = useCallback(() => {
    const el = anchorRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    setPos({ left: r.left, top: r.bottom + 8, width: r.width });
  }, []);

  useEffect(() => {
    if (!open) return;
    reposition();
    window.addEventListener("resize", reposition);
    return () => window.removeEventListener("resize", reposition);
  }, [open, reposition]);

  useEffect(() => {
    const onKey = (e: globalThis.KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        inputRef.current?.focus();
        setOpen(true);
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  const choose = (item: SearchItem) => {
    setOpen(false);
    setQuery("");
    setActive(0);
    inputRef.current?.blur();
    if (item.type === "page") {
      router.push(localizedPath(locale, `/${item.id}`));
    } else if (item.type === "customer") {
      router.push(localizedPath(locale, `/customers?customer=${item.id}`));
    } else if (item.type === "company") {
      router.push(localizedPath(locale, `/explore?company=${item.id}`));
    } else {
      router.push(localizedPath(locale, `/dashboard?deal=${item.id}`));
    }
  };

  const onInputKey = (e: KeyboardEvent<HTMLInputElement>) => {
    if (!open) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((i) => (flat.length ? (i + 1) % flat.length : 0));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((i) => (flat.length ? (i - 1 + flat.length) % flat.length : 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (flat[active]) choose(flat[active]);
    } else if (e.key === "Escape") {
      setOpen(false);
      inputRef.current?.blur();
    }
  };

  const indexedGroups = groups.reduce<
    { label: string; items: { it: SearchItem; index: number }[] }[]
  >((acc, g) => {
    const start = acc.reduce((n, x) => n + x.items.length, 0);
    acc.push({
      label: g.label,
      items: g.items.map((it, i) => ({ it, index: start + i })),
    });
    return acc;
  }, []);

  return (
    <>
      <div className="search" data-search-anchor ref={anchorRef}>
        <Icon name="search" size={20} className="search__icon" />
        <input
          ref={inputRef}
          type="text"
          className="search__input"
          placeholder={t("shell.searchPlaceholder")}
          aria-label={t("shell.searchAria")}
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setActive(0);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={onInputKey}
        />
        <kbd className="search__kbd">⌘K</kbd>
      </div>

      {open &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            className={cn("search-pop", "is-open")}
            style={{
              position: "fixed",
              left: pos.left,
              top: pos.top,
              width: pos.width,
              zIndex: 80,
            }}
            onMouseDown={(e) => e.preventDefault()}
          >
            {indexedGroups.length ? (
              indexedGroups.map((g) => (
                <div key={g.label} className="search-pop__group">
                  <div className="search-pop__label">{g.label}</div>
                  {g.items.map(({ it, index }) => (
                      <button
                        key={`${it.type}-${it.id}`}
                        type="button"
                        className={cn(
                          "search-pop__item",
                          index === active && "is-active",
                        )}
                        onMouseEnter={() => setActive(index)}
                        onClick={() => choose(it)}
                      >
                        <span className="search-pop__icon">
                          <Icon name={it.icon} size={18} />
                        </span>
                        <span className="search-pop__main">
                          <span className="search-pop__title">{it.label}</span>
                          <span className="search-pop__sub">{it.sub}</span>
                        </span>
                        <Icon name="arrow-right" size={15} className="search-pop__go" />
                      </button>
                  ))}
                </div>
              ))
            ) : (
              <div className="search-pop__empty">
                <div className="empty">
                  <div className="empty__icon">
                    <Icon name="search" size={28} />
                  </div>
                  <p className="empty__title">{t("shell.noResults")}</p>
                  <p className="empty__desc">{t("shell.noResultsDesc")}</p>
                </div>
              </div>
            )}
            <footer className="search-pop__foot">
              <span>
                <kbd>↑</kbd>
                <kbd>↓</kbd> {t("shell.navigate")}
              </span>
              <span>
                <kbd>↵</kbd> {t("shell.select")}
              </span>
              <span>
                <kbd>esc</kbd> {t("shell.close")}
              </span>
            </footer>
          </div>,
          document.body,
        )}

      {open &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            style={{ position: "fixed", inset: 0, zIndex: 70 }}
            onMouseDown={() => setOpen(false)}
            aria-hidden
          />,
          document.body,
        )}
    </>
  );
}
