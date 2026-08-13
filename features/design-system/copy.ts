export async function copyText(value: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(value);
    return true;
  } catch {
    return false;
  }
}

export function rgbToHex(rgb: string): string {
  const m = rgb.match(/rgba?\(\s*([\d.]+)[,\s]+([\d.]+)[,\s]+([\d.]+)/);
  if (!m) return rgb;
  const hex = [m[1], m[2], m[3]]
    .map((n) => Math.round(Number(n)).toString(16).padStart(2, "0"))
    .join("");
  return `#${hex.toUpperCase()}`;
}
