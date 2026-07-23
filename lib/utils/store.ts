const PREFIX = "kerso:";

function canUseStorage(): boolean {
  return typeof window !== "undefined" && typeof localStorage !== "undefined";
}

export const store = {
  get<T>(key: string, def: T): T {
    if (!canUseStorage()) return def;
    try {
      const v = localStorage.getItem(PREFIX + key);
      return v == null ? def : (JSON.parse(v) as T);
    } catch {
      return def;
    }
  },
  set(key: string, val: unknown): void {
    if (!canUseStorage()) return;
    try {
      localStorage.setItem(PREFIX + key, JSON.stringify(val));
    } catch {
      /* ignore quota / privacy mode */
    }
  },
  remove(key: string): void {
    if (!canUseStorage()) return;
    try {
      localStorage.removeItem(PREFIX + key);
    } catch {
      /* ignore */
    }
  },
};
