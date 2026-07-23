import type { ReactNode } from "react";

/**
 * Root layout passes through; html/body live in app/[locale]/layout.tsx
 * so lang/dir are set per locale.
 */
export default function RootLayout({ children }: { children: ReactNode }) {
  return children;
}
