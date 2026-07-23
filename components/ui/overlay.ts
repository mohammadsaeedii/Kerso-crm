/** Shared overlay helpers for Modal / Drawer. */

export function getFocusable(root: HTMLElement): HTMLElement[] {
  return Array.from(
    root.querySelectorAll<HTMLElement>(
      'button,[href],input,select,textarea,[tabindex]:not([tabindex="-1"])',
    ),
  ).filter((el) => {
    if ("disabled" in el && (el as HTMLButtonElement).disabled) return false;
    return el.offsetParent !== null;
  });
}

export function trapTab(e: KeyboardEvent, root: HTMLElement): void {
  if (e.key !== "Tab") return;
  const f = getFocusable(root);
  if (!f.length) return;
  const first = f[0]!;
  const last = f[f.length - 1]!;
  if (e.shiftKey && document.activeElement === first) {
    e.preventDefault();
    last.focus();
  } else if (!e.shiftKey && document.activeElement === last) {
    e.preventDefault();
    first.focus();
  }
}

export function lockBodyScroll(): () => void {
  document.body.classList.add("no-scroll");
  return () => {
    document.body.classList.remove("no-scroll");
  };
}
