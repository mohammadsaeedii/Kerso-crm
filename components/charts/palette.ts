/** Chart colors from the design-system tokens (theme-aware). */
export const CHART = {
  primary: "var(--indigo)",
  muted: "var(--text-3)",
  track: "var(--track)",
  up: "var(--green)",
  down: "var(--red)",
  warn: "var(--amber)",
  badge: "var(--badge)",
} as const;

export const CHART_PALETTE = [
  "var(--c-indigo)",
  "var(--c-green)",
  "var(--c-amber)",
  "var(--c-sky)",
  "var(--c-pink)",
  "var(--c-violet)",
] as const;
