"use client";

import { useState, type ReactNode } from "react";
import { store } from "@/lib/utils/store";
import { Sidebar } from "./Sidebar";
import { Topbar } from "./Topbar";
import { cn } from "@/lib/utils/cn";

export function AppShell({ children }: { children: ReactNode }) {
  const [collapsed, setCollapsed] = useState(() =>
    typeof window === "undefined" ? false : store.get("sidebar:collapsed", false),
  );
  const [navOpen, setNavOpen] = useState(false);

  const toggleCollapse = () => {
    setCollapsed((c) => {
      const next = !c;
      store.set("sidebar:collapsed", next);
      return next;
    });
  };

  return (
    <div className={cn("app", collapsed && "app--collapsed", navOpen && "app--nav-open")}>
      <div
        className="nav-backdrop"
        data-nav-backdrop
        onClick={() => setNavOpen(false)}
        aria-hidden
      />
      <Sidebar
        collapsed={collapsed}
        onToggleCollapse={toggleCollapse}
        onNavigate={() => setNavOpen(false)}
      />
      <div className="main">
        <Topbar onOpenNav={() => setNavOpen(true)} />
        <main className="content" tabIndex={-1}>
          <div className="content__inner">{children}</div>
        </main>
      </div>
    </div>
  );
}
