"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { store } from "@/lib/utils/store";

export type ThemePref = "light" | "dark" | "system";
export type ResolvedTheme = "light" | "dark";

export const ACCENT_COLORS = [
  "#4F46E5",
  "#7C3AED",
  "#2563EB",
  "#0EA5E9",
  "#059669",
  "#E11D48",
  "#F59E0B",
] as const;

export type ThemeContextValue = {
  theme: ThemePref;
  resolved: ResolvedTheme;
  accent: string;
  setTheme: (pref: ThemePref) => void;
  setAccent: (hex: string) => void;
  toggleLightDark: () => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

function resolveTheme(pref: ThemePref): ResolvedTheme {
  if (pref !== "system") return pref;
  if (typeof window === "undefined") return "light";
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

function applyAccent(hex: string) {
  const r = document.documentElement;
  r.style.setProperty("--indigo", hex);
  r.style.setProperty("--indigo-12", hex + "1A");
  r.style.setProperty("--indigo-press", hex);
}

function applyTheme(resolved: ResolvedTheme) {
  document.documentElement.setAttribute("data-theme", resolved);
}

function readInitial(): { theme: ThemePref; accent: string; resolved: ResolvedTheme } {
  if (typeof window === "undefined") {
    return { theme: "light", accent: "#4F46E5", resolved: "light" };
  }
  const theme = store.get<ThemePref>("theme", "light");
  const accent = store.get<string>("accent", "#4F46E5");
  return { theme, accent, resolved: resolveTheme(theme) };
}

export type ThemeProviderProps = {
  children: ReactNode;
};

export function ThemeProvider({ children }: ThemeProviderProps) {
  const initial = readInitial();
  const [theme, setThemeState] = useState<ThemePref>(initial.theme);
  const [accent, setAccentState] = useState(initial.accent);
  const [resolved, setResolved] = useState<ResolvedTheme>(initial.resolved);

  useEffect(() => {
    applyTheme(resolved);
    applyAccent(accent);
  }, [resolved, accent]);

  useEffect(() => {
    const mql = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => {
      if (theme === "system") {
        const r = resolveTheme("system");
        setResolved(r);
      }
    };
    mql.addEventListener("change", onChange);
    return () => mql.removeEventListener("change", onChange);
  }, [theme]);

  const setTheme = useCallback((pref: ThemePref) => {
    setThemeState(pref);
    store.set("theme", pref);
    setResolved(resolveTheme(pref));
  }, []);

  const setAccent = useCallback((hex: string) => {
    setAccentState(hex);
    store.set("accent", hex);
  }, []);

  const toggleLightDark = useCallback(() => {
    const next: ThemePref = resolveTheme(theme) === "dark" ? "light" : "dark";
    setTheme(next);
  }, [theme, setTheme]);

  const value = useMemo<ThemeContextValue>(
    () => ({
      theme,
      resolved,
      accent,
      setTheme,
      setAccent,
      toggleLightDark,
    }),
    [theme, resolved, accent, setTheme, setAccent, toggleLightDark],
  );

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}

export function useThemeContext(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error("useTheme must be used within ThemeProvider");
  }
  return ctx;
}
