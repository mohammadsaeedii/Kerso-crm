# Kerso — CRM

A complete, production-grade CRM front-end built as a **dependency-free vanilla-JS single-page app**. No build step, no framework — open `index.html` in a browser (or serve the folder) and it runs.

It began as a faithful rebuild of the visible top portion of the original "Kerso" dashboard design and is now extended into the full application: every nav page, section, component and interactive element.

## Run

```bash
# just open it
open index.html
# …or serve (recommended, so hash routing & fonts behave like production)
python3 -m http.server 8000   # then visit http://localhost:8000
```

## Pages (hash routing)

| Route | Page | Highlights |
|-------|------|-----------|
| `#/dashboard` | **Dashboard** | KPI cards w/ sparklines, revenue area chart (range + legend toggles), sales pipeline, recent-deals table, deals-created bars, activity feed, tasks, **Manage dashboard** (toggle widgets) |
| `#/explore` | **Business Explore** | Company directory, grid/list views, live search + industry/status/sort filters, company detail drawer, add company |
| `#/analytics` | **Analytics** | Visitors chart, traffic-source & device donuts, conversion funnel, rep/category/region rankings, retention cohort heatmap, range switch, export |
| `#/customers` | **Customers** | Full data table — sort, search, status filters, row selection + bulk actions, pagination, row actions menu, customer detail drawer (tabs + notes), add/edit (validated), delete (confirm) |
| `#/reviews` | **Customer Reviews** | Rating summary + distribution + sentiment donut, filter by rating/product/sort, helpful toggle, reply |
| `#/settings` | **Settings** | Profile, notifications, appearance (theme + accent), security, billing |

## Interaction layer

Command-palette search (**⌘K** / focus) with grouped live results & keyboard nav · notifications / messages / user dropdowns with live unread badges · light / dark / system theme + accent color (persisted) · collapsible sidebar (persisted) + mobile drawer · modals, side drawers, toasts, tooltips · sortable/filterable/paginated tables · hover-tooltip SVG charts. Every control is wired — nothing is a dead link.

## Architecture

```
index.html        # shell mount + script tags
styles.css        # design system (tokens, dark theme, every component, responsive)
js/
  util.js         # formatting, DOM helpers, local store, event bus
  data.js         # seeded mock data (customers, companies, deals, reviews, analytics…)
  icons.js        # SVG icon set
  charts.js       # SVG charts (area/line, bars, donut, funnel, heatmap, gauge, sparkline)
  ui.js           # components: DataTable, modal, drawer, popover, toast, forms, badges…
  pages.js        # the six page views (render + init)
  app.js          # shell, hash router, dropdowns, search palette, theme, boot
```

All data is in-memory and mutates live (add/edit/delete persist for the session); preferences persist to `localStorage`.

## Persian (RTL) version

A fully localized **Persian / فارسی** build lives in [`persian/`](persian/) — `dir="rtl"`, the **Vazirmatn** web font, Persian digits & currency (تومان), and the **Jalali (Shamsi) calendar** via the `fa-IR` `Intl` locale. It mirrors the English app exactly (same six pages, components and interactions) with a self-contained `persian/index.html`, `persian/styles.css` (original design system + an RTL override layer) and a translated `persian/js/` set.

```bash
python3 -m http.server 8000   # then visit http://localhost:8000/persian/
```
