# Kerso Design System

Customer communication + AI support platform. Evolved from the original Kerso CRM visual language toward **Modern SaaS · Minimal · Friendly · Information-Dense · AI-First**.

Inspired by Intercom / Linear / Stripe / Vercel principles — not copies. Unique identity: calm indigo accent, soft surfaces, dense workspaces, customer context always beside conversation.

---

## Philosophy

1. **Customer context next to conversation** — never make agents hunt for who they’re talking to.
2. **Density without clutter** — information-rich panels; one job per section.
3. **Quiet AI** — professional, subtle; no neon, glow, or gimmicks.
4. **RTL-first** — logical CSS properties; Persian (Vazirmatn) and English (Inter) as peers.
5. **Interaction over decoration** — every control works; mock data mutates live.

---

## Color tokens

Defined in `styles/globals.css` `:root` / `[data-theme="dark"]`.

| Token | Light | Role |
|-------|-------|------|
| `--bg` | `#F7F8FA` | App canvas |
| `--sidebar` / `--surface` | `#FFFFFF` | Chrome & cards |
| `--surface-2` | `#F4F5F7` | Nested surfaces |
| `--border` / `--border-strong` | `#ECEEF1` / `#DCE0E6` | Dividers |
| `--text` / `--text-2` / `--text-3` | `#0C0D11` / `#555861` / `#98A0AB` | Hierarchy |
| `--indigo` | `#4F46E5` | Primary accent / focus |
| `--indigo-12` | `#EAF1FB` | Active nav, soft AI |
| `--green` / `--red` / `--amber` | Success / danger / warning |
| `--ai` | `#4338CA` (via indigo) | AI messages — same family, muted bg |

Hue palette (`--c-*`) powers avatars, badges, tags via `color-mix`.

---

## Typography

| Locale | Font |
|--------|------|
| `en` | Inter (`--font-inter`) |
| `fa` | Vazirmatn (`--font-vazirmatn`) |

| Scale | Size | Weight | Use |
|-------|------|--------|-----|
| Page title | 29px | 800 | Page heads |
| Section | 15–16px | 700 | Panel titles |
| Body | 14–14.5px | 400–500 | Lists, messages |
| Meta | 12–13px | 500–600 | Timestamps, hints |
| KPI | 24–28px | 800 | Metrics |

Letter-spacing: slight negative on LTR display; `0` in RTL.

---

## Spacing & radius

- Base rhythm: **4 / 8 / 12 / 16 / 22 / 28 / 32**
- Sidebar width: **250px** (collapsed **76px**)
- Inbox columns: filters ~**200px**, list ~**340px**, thread flex, context ~**300px**

| Token | Value |
|-------|-------|
| `--r-sm` | 8px |
| `--r-btn` / `--r-input` | 10px |
| `--r-card` / `--r-pop` | 14px |

---

## Shadows & borders

- Cards: `--shadow-card` (soft 1px lift)
- Popovers: `--shadow-pop`
- Focus: `--ring` (indigo 16% mix)
- Borders: 1px `--border`; stronger on hover `--border-strong`

---

## Components

### Buttons
`.btn` — `primary` | `secondary` | `ghost` | `danger` · sizes `sm` · `block`

### Inputs
`.field` / `.input` / `.select` / `.textarea` — 10px radius, focus ring

### Badges & tags
`.badge-pill` (status) · `.tagchip` (labels) · conversation status pills

### Cards / panels
`.card` · `.panel` — surface + border + light shadow (interaction containers only where needed)

### Tables
`.table` / DataTable — sortable, selectable, paginated

### Navigation / sidebar
`.nav__item` · active = indigo tint · collapsible · mobile drawer

### Modals / drawers
Centered modal · side drawer (logical start/end) · focus trap + scroll lock

### Conversation UI
- Customer · Agent · AI · Internal note · System event
- Composer: Reply / Note / Attach / AI suggest / Send
- Context panel: profile, tags, history, tickets, timeline

---

## Layout: application shell

```
┌─────────────┬────────────────────────────────────┐
│   Sidebar   │  Topbar                            │
│   Inbox …   │  Main workspace (full-bleed Inbox) │
└─────────────┴────────────────────────────────────┘
```

Inbox (desktop): **Filters | Conversation list | Thread | Customer context**  
Tablet: context as drawer · Mobile: single-column screens

---

## Responsive

| Breakpoint | Behavior |
|------------|----------|
| ≤1180px | Dashboard grids collapse |
| ≤900px | Sidebar drawer; inbox 1–2 columns |
| ≤760px | Compact topbar; stacked filters |
| ≤480px | Single-column cards |

---

## RTL rules

- Prefer **logical** properties (`inline-start/end`, `padding-inline`)
- Mirror directional icons (chevrons, send, pagination) in `[dir="rtl"]`
- Persian digits / Jalali via `fa-IR` formatters
- UI copy in `messages/fa.json` — code identifiers stay English

---

## Accessibility

- `:focus-visible` outline on interactive elements
- `aria-label` on icon-only controls
- Live regions for toasts
- `prefers-reduced-motion` short-circuits animations
- Sufficient contrast on text / indigo primary

---

## Product IA (target)

Inbox · Customers · Tickets · AI Agent · Knowledge · Automations · Analytics · Settings  

Legacy CRM surfaces (Dashboard, Explore, Reviews) remain reachable and mapped into the new model.
