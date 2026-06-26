# Advanced Features — UI/UX Implementation Roadmap

A roadmap for differentiating Kerso CRM with high-end frontend features, built
specifically on the existing **dependency-free vanilla-JS SPA** (no framework,
no build step). Every proposal reuses the current architecture rather than
introducing new tooling.

## Three architectural leverage points

1. **`App.bus` / `App.makeBus` already exist but are unused for app data.**
   Today `App.data` is mutated in place and the UI is patched by hand
   (`updateBadges()`). That bus is the seam for the reactive layer every
   real-time feature needs.
2. **The builder/controller pattern fits perfectly.** Builders return HTML
   strings → `App.node()` → DOM; controllers wire behavior via `App.on()`
   delegation. `drawer`, `popover`, `modal`, `toast`, `DataTable`, `gauge`,
   `heatmap`, `sparkline`, `segmented`, `tabs`, `field`/`validate` are reusable
   as-is.
3. **The data already leans this way.** Customers carry `health`, `tags`
   (incl. `"Churn risk"`, `"Hot lead"`, `"VIP"`), `lastContact`, `rating`.
   `STATUS_MAP` already maps `"Churn risk" → warning`. `D.messages` exists and
   `msgPanel`'s "Open inbox" is a dead toast waiting for a route. The customer
   drawer already has **Notes + Activity tabs**.

---

## Phase 0 — The Foundation (build first; everything assumes it)

Every feature is "real-time + complex state." Instead of re-answering *State
Management* five times, these are the shared spine.

### A. A tiny reactive store on the existing bus (`js/state.js`)

```js
App.createStore = function (initial) {
  let s = initial; const bus = App.makeBus();
  return {
    get: () => s,
    set(patch){ s = { ...s, ...(typeof patch==="function"?patch(s):patch) }; bus.emit("change", s); },
    on: (fn) => bus.on("change", fn),
  };
};
```

- **One store per domain, not one global blob:** `inboxStore`,
  `automationStore`, `collabStore`, `enrichmentStore`, derived `scoringStore`.
- **Derive, don't store, anything computed** (scores especially) — memoized
  selectors keyed by record id + a dirty flag.
- **Persist user-authored artifacts to `App.store`** (the `kerso:` localStorage)
  exactly like `dash:widgets` already does — rules, saved views, notes, drafts
  survive reload.
- **Update strategy by frequency:** full re-render for low-frequency surfaces
  (dashboard tick); surgical DOM patches for high-frequency ones (inbox stream,
  presence dots, badges) — same style as the existing `updateBadges()`.

### B. A realtime simulator (`js/realtime.js`) — the key enabling decision

No backend and a frozen `NOW` mean every "live" behavior needs an event source.
Build one fake one that drips events off `App.now()`:

```js
App.realtime = (() => {
  const bus = App.makeBus();
  function tick(){ /* emit one of: inbound message, score drift,
                      enrichment.suggested, teammate.comment, presence.change,
                      automation trigger … then schedule next tick */ }
  return { on: bus.on, start: () => tick() };
})();
```

Single source of "live," trivially swappable for a WebSocket later.

---

## 1. Smart Predictive Dashboards (Lead Score + Churn Risk)

**Component structure** — reuse before building:
- `ScoreGauge` — wrap `charts.gauge()`; color band reuses `ui.progress()`'s
  thresholds (green ≥70 / amber 40–69 / red <40).
- `NeedsAttentionList` — ranked list (`.act-list` / `hbars` idiom); rows
  deep-link via `App.openCustomerDrawer`.
- `ScoreBreakdown` popover — click a score → `ui.popover` showing the *factors*
  as mini `progress` bars. **Never show a black-box number.**
- `RiskAlertStrip` — persistent banner ("6 accounts crossed into churn risk
  today → Review") using the `alert` icon + `--amber-bg`/`--red-bg`.
- Register `leadScore` + `churnRisk` as toggleable widgets in the existing
  `dash:widgets` store.

**Scoring** (`js/scoring.js`, derived selectors):

| Factor | Existing field | Weight |
|---|---|---|
| Recency decay | `lastContact` | high |
| Account health | `health` | high |
| Sentiment | `rating` ≤ 3 | medium |
| Explicit risk tag | `tags.includes("Churn risk")` | medium |

**User flow:** glance at gauge + list → click at-risk account → drawer opens with
breakdown **and a recommended next action** → act → score recomputes → item
animates out. See → understand → act → confirm.

**State:** `scoringStore` derives from the customers store; simulator nudges
`health`/`lastContact`/new reviews → recompute → patch. Memoize per id; debounce
reorders.

**UX best practices:** pair every score with a one-click action; explainability
on hover; color **+ icon** (colorblind-safe); top-5 then "view all" → filtered
`DataTable`; throttle reorders so the dashboard stays stable.

---

## 2. Dynamic Workflow Builder (No-Code Automation)

**Opinionated call:** **don't build a free-form 2D node canvas.** In vanilla JS,
pan/zoom/edge-routing/collision is a tar pit, bad on mobile, and CRM rules are
90% linear. Build a **vertical stacked-steps builder** (Zapier/HubSpot-style)
with shallow branch blocks.

```
┌─ When ───────────────────────────────────┐   ← Trigger card
│ 🎯  Deal stage changes to "Won"           │
└──────────────────┬───────────────────────┘
                   ⊕  ← insert step
┌─ If ─────────────────────────────────────┐   ← Condition card
│ 🚩  Deal value is greater than $10,000    │
└──────────────────┬───────────────────────┘
                   ⊕
┌─ Then ───────────────────────────────────┐   ← Action card
│ ✉️  Send email "Welcome aboard" to owner  │  [⠿ drag] [⋯]
└──────────────────────────────────────────┘
        [ Test run ]   [ ●━ Activate ]
```

**Component structure:** new route `#/automations` (add to `NAV` +
`router.routes` + `App.pages`). `AutomationList` (`DataTable` + `ui.toggle`).
`StepStack` of `StepCard`s with `⊕` connectors. `NodePalette` = `ui.popover` +
`ui.menuList`. Each step configured in a `ConfigDrawer` (reuse `ui.drawer`) whose
form is generated from a **registry of defs** (`js/automation-defs.js`): each def
declares `{ label, icon, fields[] }` reusing the `field()` schema. New action =
new def, not new UI code.

**Data** (persisted): `{ id, name, enabled, trigger, steps:[{kind, type, config}], stats }`.

**User flow:** New → pick trigger → `⊕` add condition/action → **Test run**
(dry-run, shown as a toast timeline) → **Activate**. Start from **templates**,
never a blank canvas. Reorder via the `drag` icon (vertical, not 2D).

**State:** builder edits a **draft copy**; Save commits to store + localStorage,
Cancel discards. Validate each step via its def + `ui.validate`. Wire enabled
rules into `App.realtime` so they actually fire on simulated events → toast +
activity entry + bump `stats.runs`.

**UX best practices:** linear-first, branch-rarely; collapsed steps read as
English; test-before-live mandatory; templates + teaching empty states;
guardrails (no action-before-trigger, clear enabled pill).

---

## 3. Unified Omnichannel Inbox

`msgPanel`'s dead "Open inbox" toast is the entry point. Add `#/inbox`.

```
┌─ Inbox ────────────────────────────────────────────────────────────┐
│ [All•7] [WhatsApp•3] [Telegram•2] [Email•2]        ← ui.segmented   │
├───────────────┬─────────────────────────────┬──────────────────────┤
│ Conversations │  Thread: Omar Haddad         │  Context (collapsible)│
│ ● Omar  🟢 wa │  ┌─ in ─────────────┐         │  Omar Haddad          │
│   "move call…"│  │ Sounds great…     │ wa      │  Cobalt Systems       │
│ ● Sophia  ✉️  │  └───────────────────┘         │  Churn risk  72 ▲     │
│   "thanks…"   │           ┌─ out ───────────┐  │  2 open deals         │
│   Liam   ✈️tg │           │ Thursday works  │✓ │  [ Open full profile ]│
│ …             │           └─────────────────┘  │  ── notes / feed ──   │
│               │  [ ✎ Reply via WhatsApp ▾ ]    │                       │
└───────────────┴─────────────────────────────┴──────────────────────┘
```

**Component structure:** responsive 3-pane. `ChannelFilter`
(`ui.segmented`/`ui.tabs` with unread counts). `ConversationList` reuses `.msg`
markup + `avatar({online})`. `MessageThread` = day-grouped bubbles. `Composer`
with a channel selector. **`ContextPanel` makes chat into CRM** — churn score
(Feature 1) + notes/feed (Feature 4) + "Open full profile" → `openCustomerDrawer`.

**Normalization is the heart of "omnichannel":** every channel collapses to one
shape `{ id, convId, channel, dir:"in"|"out", author, body, time, status }`.
Extend `D.messages` into `conversations` with a `channel` field. For channel
glyphs, add WhatsApp/Telegram SVGs to `icons.js`, or use colored dots
(green/sky/indigo) + existing `mail`/`message` icons (license-safe).

**User flow:** message icon → popover → "Open inbox" routes → filter or All →
pick conversation → reply (channel preselected) → optimistic send
(`sending → sent`). Convert in place: "Create deal" / "Log note" / "Open
profile". Keyboard `j/k`/`r`.

**State:** `inboxStore { conversations, activeId, filter }` — surgical patches,
not full re-render. Single source of truth feeding the topbar badge via
`updateBadges`. Optimistic outbound; simulator acks.

**UX best practices:** channel is **metadata, not a silo** — one unified stream,
channel shown as a small glyph and highlighted only when it changes mid-thread.
Triage affordances (unread filter, snooze, mark-done, assign) + "Inbox Zero"
empty state. Context panel collapsible; on mobile becomes a tab.

---

## 4. Contextual Collaboration UI (side-panel / activity feed in the profile)

The customer drawer already has Notes + Activity tabs — but **notes are
in-memory only** (`const stored = []`), so they vanish on close. Fixing that is
step one.

**Component structure:** merge the two tabs into one `CollaborationFeed` — a
single chronological stream mixing system activity, user notes, and `@mention`
comments (reuse `.act-list` / `.note`). `MentionComposer` = textarea + `@`
autocomplete via `ui.popover` reusing the search palette's keyboard-nav.
`PresenceBar` = "who's viewing this account" via `avatarGroup` with online dots
(driven by the simulator). `PinnedNote` for the one critical fact. Add a **docked
side-rail mode** (reuse the inbox `ContextPanel` layout) for deep work; drawer
for a quick peek.

**Data:** new `D.team` (teammates + presence); `collabStore` keyed by
`customerId: { feed, pinned, watchers }`, **persisted to `App.store`** (fixes the
disappearing-notes limitation).

**User flow:** open customer → feed is the anchor tab → write a note, `@`-mention
a teammate → they get a notification (reuse `D.notifications` + `updateBadges`) →
they reply in-thread. Notes from inbox/deal land on the right account's feed.
Filter: All / Notes / Mentions / System.

**State:** `collabStore` (persisted). Simulator emits teammate comments/presence
→ if the account is open, patch + toast. Only mentions/watched accounts notify.

**UX best practices:** collaboration lives *inside* the record — zero context
switch; one timeline unifies system + human activity; `@mention` is lightweight
async; presence + reactions for low-friction ack; batched, thresholded
notifications.

---

## 5. Automated Data Enrichment Visuals

The question is purely *how the UI announces "we auto-found something."*
Principle: **propose, never silently overwrite.**

**Component structure:** `EnrichmentChip` — a subtle `sparkles` marker on an
auto-filled field; hover → `ui.popover`: *"Auto-added from LinkedIn · 2h ago ·
[Keep] [Dismiss]."* `EnrichmentReviewDrawer` — old→new **diff** with per-field
Accept/Reject (reuse `ui.drawer` + `detailRow`). `AutoFillShimmer` — while
in-flight, the existing `skeletonCard`/`.sk` shimmer, then the field fills with a
brief `--indigo-12` pulse that fades. `FreshnessStamp` — "updated 2h ago / data
6mo old," stale fields get a `refresh` affordance. New notification
`type:"enrichment"` (sparkles) — extend the `typeIcon`/`typeColor` maps in
`notifPanel`.

**Data:** per-field `{ value, source, fetchedAt, status:"suggested"|"accepted" }`;
an `enrichmentStore` of pending suggestions, a **separate layer until accepted**.

**User flow:** *passive* — open a profile, see sparkles chips, trust via hover,
optionally dismiss. *Active* — "Enrich" → shimmer → fields populate → review.
*Live* — batched toast "3 accounts enriched → Review" → review drawer → bulk
accept. Notification center keeps the history.

**State:** `enrichmentStore` (persisted). Simulator emits `enrichment.suggested`
→ toast + notification + chip. Accept → merges into the customers store, clears
the suggestion, **recomputes dependent scores** (ties to Feature 1).

**UX best practices:** always show **source + timestamp**; human-in-the-loop
accept/reject protects user data; calm and batched (chips + grouped toasts);
freshness cues + manual refresh; shimmer/pulse makes automation feel magical but
controlled.

---

## Keeping it clean — avoiding feature bloat

Solved by *where* each feature lives, not by restraint inside each one:

- **One new nav item, max, per area.** Inbox and Automations earn top-level nav.
  Predictive lives *inside* Dashboard (`dash:widgets`). Collaboration lives
  *inside* the profile. Enrichment is ambient.
- **The ⌘K command palette is the pressure-release valve.** Route advanced
  actions through it instead of cluttering the chrome.
- **Progressive disclosure everywhere:** top-N + "view all"; collapsed builder
  steps; collapsible context panel; enrichment chips not modals.
- **Reuse the existing vocabulary** (drawer / popover / toast / DataTable / gauge
  / heatmap / segmented + tokens). Consistency *is* perceived simplicity.
- **Opt-in / role-gate** advanced surfaces via Settings (the "Upgrade to Pro"
  card already implies tiering).

## Suggested sequencing

| Phase | What | Why this order | New surface |
|---|---|---|---|
| **0** | `createStore` + `realtime` simulator + persistence | Unlocks all five; one fake event source | none |
| **1** | Predictive Dashboard | Highest payoff, lowest new surface; proves the store | in-page |
| **2** | Contextual Collaboration | Small; extends drawer tabs; fixes in-memory notes; adds team/presence | in-drawer |
| **3** | Omnichannel Inbox | Reuses presence/team + context panel + scoring | `#/inbox` |
| **4** | Data Enrichment | Ambient layer over profiles; reuses notifications + drawers; recomputes scores | ambient |
| **5** | Workflow Builder | Most complex; drives the simulator and ties everything together | `#/automations` |

Dependencies: Foundation → all. Team/presence (P2) → Inbox & Collab. Scoring
(P1) → Inbox context + Enrichment recompute. Simulator → every "live" behavior;
the Builder consumes it.
