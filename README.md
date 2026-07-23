# Kerso CRM

Production-ready Next.js (App Router) CRM with Persian (`fa`) and English (`en`) locales, RTL/LTR support, and the original Kerso design system.

## Stack

- Next.js 16 (App Router) + React 19 + TypeScript
- CSS design tokens (no Tailwind)
- Locale routing via `proxy.ts` → `/fa/...` and `/en/...`
- ESLint + Prettier

## Run

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) — you will be redirected to `/fa/dashboard` (default locale).

```bash
npm run build   # production build
npm run start   # serve production build
npm run lint
npm run typecheck
```

## Routes

| Path | Page |
|------|------|
| `/[locale]/dashboard` | Dashboard — KPIs, revenue, pipeline, deals, tasks |
| `/[locale]/explore` | Business Explore — company directory |
| `/[locale]/analytics` | Analytics — charts & cohorts |
| `/[locale]/customers` | Customers — table, drawers, CRUD |
| `/[locale]/reviews` | Customer Reviews |
| `/[locale]/settings` | Settings — profile, theme, billing |

Language switcher preserves the current path (`/fa/customers` ↔ `/en/customers`).

## Architecture

```
app/[locale]/          # locale layouts & pages
components/
  layout/              # AppShell, Sidebar, Topbar, search
  navigation/          # NavLink, LanguageSwitcher
  ui/                  # Button, Modal, Drawer, DataTable, …
  charts/              # Area, bars, donut, funnel, heatmap, …
  providers/           # i18n, theme, data, toast
features/              # page compositions
lib/i18n/              # locale config, dictionaries, paths
lib/data/              # seeded mock data + labels
messages/              # en.json, fa.json
styles/globals.css     # design system (logical CSS + RTL)
legacy/                # original vanilla HTML/JS (reference)
```

## i18n & direction

- Persian: `dir="rtl"`, Vazirmatn, `fa-IR` formatting (تومان, Jalali dates)
- English: `dir="ltr"`, Inter, `en-US` formatting (USD)
- UI copy lives in `messages/*.json` — not hardcoded in components

## Notes

- Mock data is in-memory for the session; theme, accent, and sidebar prefs use `localStorage` (`kerso:` prefix).
- The original vanilla app is preserved under `legacy/` for reference.
