/** Clamp a number to [min, max]. */
export function clamp(n: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, n));
}

/** Inclusive integer range [0, n). */
export function range(n: number): number[] {
  return Array.from({ length: n }, (_, i) => i);
}

/** Nice axis maximum matching legacy charts.niceMax. */
export function niceMax(v: number): number {
  if (v <= 0) return 10;
  const pow = Math.pow(10, Math.floor(Math.log10(v)));
  const n = v / pow;
  const step = n <= 1 ? 1 : n <= 2 ? 2 : n <= 5 ? 5 : 10;
  return step * pow;
}

/** Polar point from center, radius, and degrees (0° at top). */
export function polar(
  cx: number,
  cy: number,
  r: number,
  deg: number,
): [number, number] {
  const a = ((deg - 90) * Math.PI) / 180;
  return [cx + r * Math.cos(a), cy + r * Math.sin(a)];
}
