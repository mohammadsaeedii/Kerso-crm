let seq = 0;

/** Unique id generator matching legacy App.uid. */
export function uid(prefix = "id"): string {
  const now =
    typeof performance !== "undefined" ? performance.now() : Date.now();
  return `${prefix}-${(++seq).toString(36)}-${Math.floor(now % 1e6).toString(36)}`;
}
