"use client";

import { usePathname } from "next/navigation";
import { useState, type ReactNode } from "react";
import { store } from "@/lib/utils/store";
import { Sidebar } from "./Sidebar";
import { Topbar } from "./Topbar";
import { cn } from "@/lib/utils/cn";

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const isWorkspace = /\/(inbox|calls)(\/|$)/.test(pathname);

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
    <div
      className={cn(
        "app",
        collapsed && "app--collapsed",
        navOpen && "app--nav-open",
        isWorkspace && "app--workspace",
      )}
    >
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
        <main className={cn("content", isWorkspace && "content--workspace")} tabIndex={-1}>
          <div className={cn("content__inner", isWorkspace && "content__inner--workspace")}>
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
