# Kerso

Customer communication + support + AI platform. Persian (`fa`) and English (`en`), RTL/LTR, built on the Kerso design system.

## Stack

- Next.js 16 (App Router) + React 19 + TypeScript
- CSS design tokens (no Tailwind) — see `DESIGN_SYSTEM.md`
- Locale routing via `proxy.ts` → `/fa/...` and `/en/...`

## Run

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) — redirected to `/fa/inbox`.

## Routes

| Path | Page |
|------|------|
| `/[locale]/inbox` | Shared inbox (primary) |
| `/[locale]/customers` | Customers |
| `/[locale]/tickets` | Tickets |
| `/[locale]/ai` | AI Agent |
| `/[locale]/knowledge` | Knowledge base |
| `/[locale]/automations` | Automations |
| `/[locale]/analytics` | Support + CRM analytics |
| `/[locale]/dashboard` | Sales overview (preserved) |
| `/[locale]/explore` | Companies (preserved) |
| `/[locale]/reviews` | Reviews (preserved) |
| `/[locale]/settings` | Settings |

## Architecture

```
app/[locale]/          # locale layouts & pages
components/            # shell, UI, charts
features/              # Inbox, Tickets, AI, KB, …
lib/data/              # seed + support-seed
messages/              # en.json, fa.json
styles/globals.css     # design system
DESIGN_SYSTEM.md       # visual language
legacy/                # original vanilla HTML/JS (reference)
```
