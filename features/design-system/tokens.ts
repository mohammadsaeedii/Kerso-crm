export type TokenSwatch = { token: string; label: string };

export const SURFACE_TOKENS: TokenSwatch[] = [
  { token: "--bg", label: "Background" },
  { token: "--sidebar", label: "Sidebar" },
  { token: "--surface", label: "Surface" },
  { token: "--surface-2", label: "Surface 2" },
  { token: "--hover", label: "Hover" },
  { token: "--track", label: "Track" },
];

export const TEXT_TOKENS: TokenSwatch[] = [
  { token: "--text", label: "Primary" },
  { token: "--text-2", label: "Secondary" },
  { token: "--text-3", label: "Tertiary" },
  { token: "--text-muted", label: "Muted" },
  { token: "--nav-label", label: "Nav label" },
  { token: "--nav-icon", label: "Nav icon" },
];

export const BORDER_TOKENS: TokenSwatch[] = [
  { token: "--border", label: "Border" },
  { token: "--border-soft", label: "Soft" },
  { token: "--border-strong", label: "Strong" },
  { token: "--divider", label: "Divider" },
];

export const BRAND_TOKENS: TokenSwatch[] = [
  { token: "--indigo", label: "Indigo" },
  { token: "--indigo-12", label: "Indigo 12" },
  { token: "--indigo-press", label: "Indigo press" },
  { token: "--green", label: "Green" },
  { token: "--green-bg", label: "Green bg" },
  { token: "--red", label: "Red" },
  { token: "--red-bg", label: "Red bg" },
  { token: "--amber", label: "Amber" },
  { token: "--amber-bg", label: "Amber bg" },
  { token: "--badge", label: "Badge" },
];

export const HUE_TOKENS: TokenSwatch[] = [
  { token: "--c-indigo", label: "Indigo" },
  { token: "--c-violet", label: "Violet" },
  { token: "--c-blue", label: "Blue" },
  { token: "--c-sky", label: "Sky" },
  { token: "--c-teal", label: "Teal" },
  { token: "--c-emerald", label: "Emerald" },
  { token: "--c-green", label: "Green" },
  { token: "--c-amber", label: "Amber" },
  { token: "--c-orange", label: "Orange" },
  { token: "--c-rose", label: "Rose" },
  { token: "--c-pink", label: "Pink" },
  { token: "--c-fuchsia", label: "Fuchsia" },
  { token: "--c-red", label: "Red" },
  { token: "--c-slate", label: "Slate" },
];

export const SPACING = [4, 8, 12, 16, 18, 20, 24, 28, 32] as const;

export const RADII = [
  { token: "--r-sm", label: "sm · 8px" },
  { token: "--r-btn", label: "btn · 10px" },
  { token: "--r-input", label: "input · 10px" },
  { token: "--r-card", label: "card · 14px" },
  { token: "--r-pop", label: "pop · 14px" },
] as const;

export const SHADOWS = [
  { token: "--shadow-card", label: "Card" },
  { token: "--shadow-btn", label: "Button" },
  { token: "--shadow-hover", label: "Hover" },
  { token: "--shadow-pop", label: "Popover" },
  { token: "--shadow-lg", label: "Modal" },
] as const;

export const TYPE_ROWS = [
  { className: "page-title", key: "pageTitle", meta: "29px / 800" },
  { className: "panel__title", key: "panelTitle", meta: "16px / 700" },
  { className: "card__label", key: "body", meta: "14px / 500" },
  { className: "page-sub", key: "caption", meta: "13.5px / 400" },
] as const;
