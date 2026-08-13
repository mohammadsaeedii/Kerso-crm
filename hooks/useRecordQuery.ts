"use client";

import { useCallback, useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";

/**
 * Read/write a single query param on the current locale path.
 * Avoids `useSearchParams()` so inbox/drawers can render without Suspense.
 */
export function useRecordQuery(key: string, initial: string | null = null) {
  const router = useRouter();
  const pathname = usePathname();
  const [value, setLocal] = useState<string | null>(initial);

  useEffect(() => {
    setLocal(initial);
  }, [initial]);

  const setValue = useCallback(
    (next: string | null) => {
      const params = new URLSearchParams(
        typeof window !== "undefined" ? window.location.search : "",
      );
      if (next) params.set(key, next);
      else params.delete(key);
      const qs = params.toString();
      setLocal(next);
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    },
    [key, pathname, router],
  );

  return [value, setValue] as const;
}
