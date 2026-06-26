/* ============================================================
   Kerso CRM — Command palette, NL search, AI assistant
   - App.command  : ⌘K / Ctrl+K global command palette (#11),
                    natural-language search (#4), keyboard
                    shortcuts + help (#20), quick-create (#11).
   - App.aiAssistant : conversational "Kerso AI" drawer (#2/#10).
   - App.reportView / App.searchResults : shared renderers reused
     by the assistant, analytics and the palette (#10).
   ============================================================ */
(function (App) {
  "use strict";
  const { icon, escapeHtml, fmt, qs, qsa, on, node } = App;
  const ui = App.ui;
  const ai = App.ai;
  const D = App.data;

  const isTyping = () => {
    const el = document.activeElement;
    return el && (el.tagName === "INPUT" || el.tagName === "TEXTAREA" || el.isContentEditable);
  };
  const FALLBACK_PAGES = [
    { id: "dashboard", label: "Dashboard", icon: "dashboard" },
    { id: "workspace", label: "Workspace", icon: "layout" },
    { id: "explore", label: "Business Explore", icon: "explore" },
    { id: "analytics", label: "Analytics", icon: "analytics" },
    { id: "customers", label: "Customers", icon: "customers" },
    { id: "reviews", label: "Customer Reviews", icon: "reviews" },
    { id: "automations", label: "Automations", icon: "zap" },
    { id: "marketplace", label: "Marketplace", icon: "store" },
    { id: "settings", label: "Settings", icon: "gear" },
  ];
  const pages = () => App.navItems || FALLBACK_PAGES;
  const looksLikeNL = (q) => q.split(/\s+/).filter(Boolean).length >= 2 || /\$|\d|risk|churn|top|why|haven|reply|above|under|deal|forecast/i.test(q);

  /* ============================================================
     QUICK CREATE  (App.create.{deal,task} here; customer/company
     are provided by pages.js and reused if present)
     ============================================================ */
  App.create = App.create || {};
  App.create.deal = function () {
    const body = `<form class="form-grid" data-form>
      ${ui.field({ label: "Deal name", name: "title", required: true, placeholder: "Annual platform license", wide: true })}
      ${ui.field({ label: "Company", name: "company", type: "select", options: D.companies.map((c) => c.name) })}
      ${ui.field({ label: "Value (USD)", name: "value", type: "number", placeholder: "25000" })}
      ${ui.field({ label: "Stage", name: "stage", type: "select", options: D.STAGES })}
      ${ui.field({ label: "Owner", name: "owner", type: "select", value: D.currentUser.name, options: D.team.map((t) => t.name) })}
      ${ui.field({ label: "Expected close", name: "close", type: "date" })}
    </form>`;
    ui.modal({
      title: "New deal", subtitle: "Add an opportunity to your pipeline", body,
      footer: `<button class="btn btn--ghost" data-act="cancel">Cancel</button><button class="btn btn--primary" data-act="save">Create deal</button>`,
      onMount(root, ctrl) {
        on(root, "click", '[data-act="cancel"]', ctrl.close);
        on(root, "click", '[data-act="save"]', () => {
          const { valid, values } = ui.validate(qs("[data-form]", root));
          if (!valid) return;
          const owner = D.teammate(values.owner);
          D.deals.unshift({ id: App.uid("D"), title: values.title, company: values.company, owner: values.owner, ownerColor: owner.color, value: +values.value || 0, stage: values.stage, probability: ({ Lead: 20, Qualified: 40, Proposal: 60, Negotiation: 80, Won: 100 })[values.stage] || 30, close: values.close ? new Date(values.close) : App.now(), status: values.stage === "Won" ? "won" : "open" });
          ctrl.close();
          ui.toast("Deal created", { type: "success", desc: values.title });
          if (App.router && ["dashboard", "customers"].includes(App.router.current)) App.router.reload();
        });
      },
    });
  };
  App.create.task = function () {
    const body = `<form data-form>
      ${ui.field({ label: "Task", name: "title", required: true, wide: true, placeholder: "Follow up with Lumina Labs" })}
      <div class="form-grid">
        ${ui.field({ label: "Due", name: "due", type: "date" })}
        ${ui.field({ label: "Priority", name: "priority", type: "select", value: "medium", options: [{ value: "high", label: "High" }, { value: "medium", label: "Medium" }, { value: "low", label: "Low" }] })}
        ${ui.field({ label: "Assignee", name: "assignee", type: "select", value: D.currentUser.name, options: D.team.map((t) => t.name), wide: true })}
      </div></form>`;
    ui.modal({
      title: "New task", subtitle: "Add a to-do", size: "sm", body,
      footer: `<button class="btn btn--ghost" data-act="cancel">Cancel</button><button class="btn btn--primary" data-act="save">Add task</button>`,
      onMount(root, ctrl) {
        on(root, "click", '[data-act="cancel"]', ctrl.close);
        on(root, "click", '[data-act="save"]', () => {
          const { valid, values } = ui.validate(qs("[data-form]", root));
          if (!valid) return;
          D.tasks.unshift({ id: App.uid("T"), title: values.title, due: values.due ? new Date(values.due) : App.now(), priority: values.priority, done: false, status: "todo", assignee: values.assignee, tags: [] });
          ctrl.close();
          ui.toast("Task added", { type: "success" });
          App.bus.emit("tasks:changed");
          if (App.router && ["dashboard", "workspace"].includes(App.router.current)) App.router.reload();
        });
      },
    });
  };

  /* ============================================================
     COMMAND REGISTRY
     ============================================================ */
  const registry = [];
  function register(cmd) { registry.push(cmd); }
  function defaultCommands() {
    return [
      { id: "ai-ask", group: "AI", label: "Ask Kerso AI", icon: "sparkles", keywords: "ai assistant question chat", run: () => App.aiAssistant.open() },
      { id: "ai-report", group: "AI", label: "Generate a report", icon: "analytics", keywords: "report ai insights revenue", run: () => App.aiAssistant.open("Show my top customers this month") },
      { id: "ai-insights", group: "AI", label: "Show AI insights", icon: "bot", keywords: "insights recommendations", run: () => App.aiAssistant.open("Give me a summary of how we're doing") },
      { id: "new-customer", group: "Create", label: "New customer", icon: "user", keywords: "add create customer contact", run: () => (App.create.customer ? App.create.customer() : App.router.go("customers")) },
      { id: "new-deal", group: "Create", label: "New deal", icon: "briefcase", keywords: "add create deal opportunity", run: () => App.create.deal() },
      { id: "new-task", group: "Create", label: "New task", icon: "check-circle", keywords: "add create task todo", run: () => App.create.task() },
      { id: "new-company", group: "Create", label: "New company", icon: "building", keywords: "add create company account", run: () => (App.create.company ? App.create.company() : App.router.go("explore")) },
      { id: "new-note", group: "Create", label: "New note", icon: "edit", keywords: "add create note", run: () => App.router.go("workspace") },
      { id: "toggle-theme", group: "Settings", label: "Toggle dark / light mode", icon: "moon", keywords: "theme dark light appearance", run: () => App.setTheme(document.documentElement.getAttribute("data-theme") === "dark" ? "light" : "dark") },
      { id: "shortcuts", group: "Settings", label: "Keyboard shortcuts", icon: "command", keywords: "keyboard shortcuts help keys", run: () => showShortcuts() },
    ];
  }

  /* ============================================================
     PALETTE
     ============================================================ */
  const Palette = (() => {
    let root = null, input = null, list = [], active = 0;

    function entityMatches(q) {
      const cap = (a, n = 4) => a.slice(0, n);
      const groups = [];
      const cust = cap(D.customers.filter((c) => (c.name + c.company + c.email).toLowerCase().includes(q))).map((c) => ({ type: "customer", ref: c, label: c.name, sub: c.company, icon: "user" }));
      const comp = cap(D.companies.filter((c) => (c.name + c.industry).toLowerCase().includes(q))).map((c) => ({ type: "company", ref: c, label: c.name, sub: c.industry, icon: "building" }));
      const deal = cap(D.deals.filter((d) => (d.title + d.company).toLowerCase().includes(q))).map((d) => ({ type: "deal", ref: d, label: d.title, sub: `${d.company} · ${fmt.money(d.value)}`, icon: "briefcase" }));
      if (cust.length) groups.push({ label: "Customers", items: cust });
      if (comp.length) groups.push({ label: "Companies", items: comp });
      if (deal.length) groups.push({ label: "Deals", items: deal });
      return groups;
    }

    function build(raw) {
      const q = raw.trim().toLowerCase();
      const groups = [];
      if (!q) {
        groups.push({ label: "Ask AI", items: [{ type: "command", cmd: registry.find((c) => c.id === "ai-ask"), label: "Ask Kerso AI anything", sub: "Summaries, scores, forecasts, reports", icon: "sparkles" }] });
        groups.push({ label: "Create", items: registry.filter((c) => c.group === "Create").map((c) => ({ type: "command", cmd: c, label: c.label, sub: "", icon: c.icon })) });
        groups.push({ label: "Jump to", items: pages().map((p) => ({ type: "nav", id: p.id, label: p.label, sub: "Page", icon: p.icon })) });
        const recents = App.sidebar && App.sidebar.getRecents ? App.sidebar.getRecents() : [];
        if (recents.length) groups.push({ label: "Recent", items: recents.slice(0, 4).map((r) => ({ type: "nav", id: r.id, label: r.label, sub: "Recently visited", icon: r.icon || "clock" })) });
      } else {
        // AI ask is always first when typing
        groups.push({ label: "AI", items: [{ type: "ai", q: raw.trim(), label: `Ask Kerso AI: “${raw.trim()}”`, sub: "Get an answer from your data", icon: "sparkles" }] });
        const cmds = registry.filter((c) => (c.label + " " + (c.keywords || "")).toLowerCase().includes(q));
        if (cmds.length) groups.push({ label: "Commands", items: cmds.map((c) => ({ type: "command", cmd: c, label: c.label, sub: c.group, icon: c.icon })) });
        const navs = pages().filter((p) => p.label.toLowerCase().includes(q));
        if (navs.length) groups.push({ label: "Navigate", items: navs.map((p) => ({ type: "nav", id: p.id, label: p.label, sub: "Page", icon: p.icon })) });
        entityMatches(q).forEach((g) => groups.push(g));
        if (looksLikeNL(q)) {
          const parsed = ai.parseQuery(raw.trim());
          if (parsed && parsed.rows.length) {
            groups.push({ label: `Search · ${parsed.description} (${parsed.rows.length})`, items: [{ type: "nlsearch", parsed, label: `See ${parsed.rows.length} ${parsed.entity}`, sub: parsed.description, icon: "filter" }] });
          }
        }
      }
      return groups;
    }

    function render(groups) {
      list = groups.flatMap((g) => g.items);
      active = list.length ? 0 : -1;
      let i = -1;
      const html = groups.length
        ? groups.map((g) => `<div class="cmdk__group"><div class="cmdk__label">${escapeHtml(g.label)}</div>${g.items.map((it) => { i++; return `<button class="cmdk__item ${i === active ? "is-active" : ""}" data-idx="${i}">
            <span class="cmdk__icon">${icon(it.icon || "arrow-right", { size: 18 })}</span>
            <span class="cmdk__main"><span class="cmdk__title">${escapeHtml(it.label)}</span>${it.sub ? `<span class="cmdk__sub">${escapeHtml(it.sub)}</span>` : ""}</span>
            ${icon("arrow-right", { size: 15, class: "cmdk__go" })}</button>`; }).join("")}</div>`).join("")
        : `<div class="cmdk__empty">${ui.emptyState({ icon: "search", title: "No results", desc: "Try a name, a page, or ask the AI a question." })}</div>`;
      qs(".cmdk__results", root).innerHTML = html;
    }

    function open(prefill) {
      if (root) return;
      root = node(`<div class="overlay overlay--cmdk" role="dialog" aria-modal="true" aria-label="Command palette">
        <div class="cmdk">
          <div class="cmdk__search">${icon("search", { size: 20, class: "cmdk__searchicon" })}
            <input class="cmdk__input" placeholder="Search or ask AI — type a name, page, or question…" aria-label="Command palette" />
            <kbd class="cmdk__esc">Esc</kbd>
          </div>
          <div class="cmdk__results"></div>
          <div class="cmdk__foot">
            <span><kbd>↑</kbd><kbd>↓</kbd> navigate</span><span><kbd>↵</kbd> select</span><span><kbd>esc</kbd> close</span>
            <span class="cmdk__foot-ai">${icon("sparkles", { size: 13 })} Powered by Kerso AI</span>
          </div>
        </div></div>`);
      document.body.appendChild(root);
      document.body.classList.add("no-scroll");
      input = qs(".cmdk__input", root);
      if (prefill) input.value = prefill;
      render(build(input.value));
      const justOpened = root;
      requestAnimationFrame(() => justOpened && justOpened.classList.add("is-open"));
      setTimeout(() => input && document.body.contains(input) && input.focus(), 30);

      on(input, "input", () => render(build(input.value)));
      on(root, "click", "[data-idx]", (e, t) => choose(+t.dataset.idx));
      on(root, "mousemove", "[data-idx]", (e, t) => setActive(+t.dataset.idx));
      root.addEventListener("mousedown", (e) => { if (e.target === root) close(); });
      document.addEventListener("keydown", onKey, true);
    }
    function close() {
      if (!root) return;
      root.classList.remove("is-open");
      document.removeEventListener("keydown", onKey, true);
      document.body.classList.remove("no-scroll");
      const r = root; root = null;
      setTimeout(() => r.remove(), 160);
    }
    function setActive(i) { active = i; qsa("[data-idx]", root).forEach((el) => el.classList.toggle("is-active", +el.dataset.idx === active)); }
    function move(d) { if (!list.length) return; active = (active + d + list.length) % list.length; setActive(active); const el = qs(`[data-idx="${active}"]`, root); el && el.scrollIntoView && el.scrollIntoView({ block: "nearest" }); }
    function choose(i) {
      const it = list[i]; if (!it) return;
      close();
      if (it.type === "command") it.cmd && it.cmd.run();
      else if (it.type === "nav") App.router.go(it.id);
      else if (it.type === "ai") App.aiAssistant.open(it.q);
      else if (it.type === "nlsearch") App.searchResults(it.parsed);
      else if (it.type === "customer") App.openCustomerDrawer(it.ref);
      else if (it.type === "company") App.openCompanyDrawer(it.ref);
      else if (it.type === "deal") App.openDealDrawer(it.ref);
    }
    function onKey(e) {
      if (e.key === "Escape") { e.preventDefault(); close(); }
      else if (e.key === "ArrowDown") { e.preventDefault(); move(1); }
      else if (e.key === "ArrowUp") { e.preventDefault(); move(-1); }
      else if (e.key === "Enter") { e.preventDefault(); choose(active); }
    }
    return { open, close, get isOpen() { return !!root; } };
  })();

  /* ============================================================
     SHARED REPORT VIEW (#10)
     ============================================================ */
  function reportView(rep) {
    if (!rep) return "";
    let body = "";
    if (rep.kind === "forecast" && rep.forecast) {
      const fc = rep.forecast;
      body = `<div class="report-chart">${App.charts.areaLine({ labels: fc.labels, money: true, height: 220, series: [
        { name: "Upper", color: "#A5B4FC", values: fc.high, width: 1, dashed: true, fill: false },
        { name: "Projected", color: "#4F46E5", values: fc.base },
        { name: "Lower", color: "#A5B4FC", values: fc.low, width: 1, dashed: true, fill: false },
      ] })}</div>
      <div class="report-stat"><span>Projected total</span><b>${fmt.money(fc.total)}</b><span class="report-stat__hint">${fc.confidence}% confidence</span></div>`;
    } else if (rep.kind === "analysis") {
      body = `<ul class="report-factors">${rep.rows.map((r) => `<li class="report-factor"><div class="report-factor__main"><p class="report-factor__name">${escapeHtml(r.factor)}</p><p class="report-factor__detail">${escapeHtml(r.detail)}</p></div><span class="report-factor__impact">${escapeHtml(r.impact)}</span></li>`).join("")}</ul>${rep.note ? `<p class="report-note">${icon("sparkles", { size: 14 })} ${escapeHtml(rep.note)}</p>` : ""}`;
    } else if (rep.kind === "kpi") {
      body = `<div class="report-kpis">${rep.rows.map((r) => `<div class="report-kpi"><span class="report-kpi__label">${escapeHtml(r.name)}</span><span class="report-kpi__value">${escapeHtml(r.value)}</span>${r.delta != null ? ui.trendPill(r.delta, r.dir) : ""}</div>`).join("")}</div>`;
    } else {
      // table
      const cols = rep.columns || [];
      body = `<div class="table-wrap"><table class="table"><thead><tr>${cols.map((c) => `<th class="${c.align === "right" ? "ta-right" : ""}">${escapeHtml(c.l)}</th>`).join("")}</tr></thead><tbody>${rep.rows.map((row) => `<tr>${cols.map((c) => {
        let v = row[c.k];
        if (c.money) v = fmt.money(v); else if (c.pct) v = v + "%"; else if (c.badge) return `<td>${ui.badge(v)}</td>`;
        return `<td class="${c.align === "right" ? "ta-right" : ""}">${escapeHtml(v)}</td>`;
      }).join("")}</tr>`).join("")}</tbody></table></div>`;
    }
    return `<div class="report"><div class="report__head"><h4 class="report__title">${escapeHtml(rep.title)}</h4><span class="report__badge">${icon("sparkles", { size: 13 })}AI report</span></div>${rep.summary ? `<p class="report__summary">${escapeHtml(rep.summary)}</p>` : ""}${body}</div>`;
  }

  /* ============================================================
     SEARCH RESULTS MODAL (#4)
     ============================================================ */
  function searchResults(parsed) {
    if (!parsed) return;
    const e = parsed.entity;
    let bodyInner = "";
    if (!parsed.rows.length) {
      bodyInner = ui.emptyState({ icon: "search", title: "No matches", desc: "Try rephrasing your search." });
    } else if (e === "customers") {
      bodyInner = `<ul class="mini-list">${parsed.rows.slice(0, 50).map((c) => `<li class="mini-list__item is-clickable" data-open="customer" data-id="${c.id}">${ui.avatar(c.name, c.avatar, 34)}<div class="mini-list__main"><div class="cell-strong">${escapeHtml(c.name)}</div><div class="cell-sub">${escapeHtml(c.company)} · ${escapeHtml(c.email)}</div></div><span class="nl-score">${ai.churnRisk(c) >= 55 ? ui.badge("Churn " + ai.churnRisk(c) + "%", "danger") : ui.badge("Score " + ai.leadScore(c), "indigo")}</span></li>`).join("")}</ul>`;
    } else if (e === "companies") {
      bodyInner = `<ul class="mini-list">${parsed.rows.slice(0, 50).map((c) => `<li class="mini-list__item is-clickable" data-open="company" data-id="${c.id}"><span class="mini-list__icon">${icon("building", { size: 16 })}</span><div class="mini-list__main"><div class="cell-strong">${escapeHtml(c.name)}</div><div class="cell-sub">${escapeHtml(c.industry)} · ${fmt.moneyCompact(c.revenue)}</div></div>${ui.badge(c.status)}</li>`).join("")}</ul>`;
    } else if (e === "deals") {
      bodyInner = `<ul class="mini-list">${parsed.rows.slice(0, 50).map((d) => `<li class="mini-list__item is-clickable" data-open="deal" data-id="${d.id}"><span class="mini-list__icon">${icon("briefcase", { size: 16 })}</span><div class="mini-list__main"><div class="cell-strong">${escapeHtml(d.title)}</div><div class="cell-sub">${escapeHtml(d.company)} · ${fmt.money(d.value)}</div></div>${ui.badge(d.stage)}</li>`).join("")}</ul>`;
    } else if (e === "events") {
      bodyInner = `<ul class="mini-list">${parsed.rows.slice(0, 50).map((ev) => `<li class="mini-list__item"><span class="mini-list__icon">${icon(ev.icon || "calendar", { size: 16 })}</span><div class="mini-list__main"><div class="cell-strong">${escapeHtml(ev.title)}</div><div class="cell-sub">${fmt.date(ev.date)} · ${escapeHtml(ev.start)}</div></div>${ui.badge(fmt.title(ev.type))}</li>`).join("")}</ul>`;
    }
    ui.modal({
      title: parsed.title, subtitle: `${parsed.rows.length} results · ${parsed.description}`, size: "lg",
      body: `<div class="nl-head">${icon("sparkles", { size: 15 })}<span>Natural-language search for “${escapeHtml(parsed.query)}”</span></div>${bodyInner}`,
      footer: `<button class="btn btn--ghost" data-act="close">Close</button><button class="btn btn--primary" data-act="save">${icon("bookmark", { size: 16 })}Save as view</button>`,
      onMount(root, ctrl) {
        on(root, "click", '[data-act="close"]', ctrl.close);
        on(root, "click", '[data-act="save"]', () => { D.savedViews.unshift({ id: App.uid("SV"), name: parsed.description, page: parsed.entity, icon: "filter", config: {} }); ctrl.close(); ui.toast("Saved as a view", { type: "success", desc: parsed.description }); App.bus.emit("views:changed"); });
        on(root, "click", "[data-open]", (e2, t) => {
          const kind = t.dataset.open, id = t.dataset.id;
          ctrl.close();
          if (kind === "customer") App.openCustomerDrawer(D.customers.find((x) => x.id === id));
          else if (kind === "company") App.openCompanyDrawer(D.companies.find((x) => x.id === id));
          else if (kind === "deal") App.openDealDrawer(D.deals.find((x) => x.id === id));
        });
      },
    });
  }

  /* ============================================================
     AI ASSISTANT DRAWER (#2 / #10)
     ============================================================ */
  const aiAssistant = (() => {
    let ctrl = null, scroll = null;
    const thread = [];

    function bubbleUser(text) {
      return `<div class="aimsg aimsg--user"><div class="aimsg__bubble">${escapeHtml(text)}</div>${ui.avatar(D.currentUser.name, D.teammate(D.currentUser.name).color, 28)}</div>`;
    }
    function bubbleAI(inner, idAttr) {
      return `<div class="aimsg aimsg--ai"><span class="aimsg__bot">${icon("sparkles", { size: 16 })}</span><div class="aimsg__bubble"${idAttr ? ` ${idAttr}` : ""}>${inner}</div></div>`;
    }
    function suggestionsHTML() {
      return `<div class="ai-suggest">${ai.sampleQuestions.map((q) => `<button class="ai-chip" data-ask="${escapeHtml(q)}">${escapeHtml(q)}</button>`).join("")}</div>`;
    }

    function open(prompt) {
      if (!ctrl) {
        const head = `<div class="aiasst__head"><span class="aiasst__logo">${icon("sparkles", { size: 18 })}</span><div><h2 class="drawer__title">Kerso AI</h2><p class="drawer-id__sub">Ask about your customers, deals & pipeline</p></div></div>`;
        const body = `<div class="aiasst">
          <div class="aiasst__scroll" data-ai-scroll>
            ${thread.length ? "" : `<div class="aiasst__welcome">${icon("bot", { size: 30 })}<h3>How can I help?</h3><p>I can summarize accounts, score leads, forecast revenue and build reports from plain English.</p>${suggestionsHTML()}</div>`}
          </div>
          <form class="aiasst__composer" data-ai-form>
            <input class="aiasst__input" data-ai-input placeholder="Ask anything…" autocomplete="off" />
            <button class="btn btn--primary aiasst__send" type="submit" aria-label="Send">${icon("send", { size: 18 })}</button>
          </form>
        </div>`;
        ctrl = ui.drawer({
          head, body, width: 460,
          onClose() { ctrl = null; },
          onMount(root) {
            scroll = qs("[data-ai-scroll]", root);
            // replay existing thread
            thread.forEach((m) => appendNode(m.role === "user" ? bubbleUser(m.text) : bubbleAI(m.html || escapeHtml(m.text))));
            on(root, "submit", "[data-ai-form]", (e) => { e.preventDefault(); const inp = qs("[data-ai-input]", root); const v = inp.value.trim(); if (v) { inp.value = ""; ask(v); } });
            on(root, "click", "[data-ask]", (e, t) => ask(t.dataset.ask));
            on(root, "click", "[data-open]", (e, t) => { const kind = t.dataset.open, id = t.dataset.id; if (kind === "customer") App.openCustomerDrawer(D.customers.find((x) => x.id === id)); else if (kind === "company") App.openCompanyDrawer(D.companies.find((x) => x.id === id)); else if (kind === "deal") App.openDealDrawer(D.deals.find((x) => x.id === id)); });
            setTimeout(() => qs("[data-ai-input]", root) && qs("[data-ai-input]", root).focus(), 80);
          },
        });
      }
      if (prompt) setTimeout(() => ask(prompt), 220);
    }

    function appendNode(html) {
      if (!scroll) return null;
      const welcome = qs(".aiasst__welcome", scroll);
      if (welcome) welcome.remove();
      const el = node(html);
      scroll.appendChild(el);
      scroll.scrollTop = scroll.scrollHeight;
      return el;
    }

    function ask(q) {
      thread.push({ role: "user", text: q });
      appendNode(bubbleUser(q));
      // typing indicator
      const typing = appendNode(bubbleAI(`<span class="ai-typing"><i></i><i></i><i></i></span>`));
      setTimeout(() => {
        const res = ai.answer(q);
        if (typing) typing.remove();
        const id = "aitext-" + App.uid("t");
        const aiEl = appendNode(bubbleAI(`<span class="aimsg__text" id="${id}"></span><div class="aimsg__extra" data-extra></div>`));
        const textEl = qs("#" + CSS.escape(id), aiEl);
        ai.stream(res.text, textEl, () => {
          const extra = qs("[data-extra]", aiEl);
          let extraHTML = "";
          if (res.report) extraHTML += reportView(res.report);
          if (res.insights) extraHTML += `<div class="ai-insight-list">${res.insights.map((i) => `<div class="ai-insight ai-insight--${i.tone}"><span class="ai-insight__icon">${icon(i.icon, { size: 16 })}</span><div><p class="ai-insight__title">${escapeHtml(i.title)}</p><p class="ai-insight__body">${escapeHtml(i.body)}</p></div></div>`).join("")}</div>`;
          if (res.search) extraHTML += searchInline(res.search);
          if (res.suggestions) extraHTML += suggestionsHTML();
          if (extraHTML) { extra.innerHTML = extraHTML; scroll.scrollTop = scroll.scrollHeight; }
          thread.push({ role: "ai", text: res.text, html: textEl.outerHTML + (extraHTML ? `<div class="aimsg__extra">${extraHTML}</div>` : "") });
        });
        scroll.scrollTop = scroll.scrollHeight;
      }, 520);
    }

    function searchInline(parsed) {
      const rows = parsed.rows.slice(0, 4);
      const li = rows.map((r) => {
        if (parsed.entity === "customers") return `<li class="mini-list__item is-clickable" data-open="customer" data-id="${r.id}">${ui.avatar(r.name, r.avatar, 28)}<div class="mini-list__main"><div class="cell-strong">${escapeHtml(r.name)}</div><div class="cell-sub">${escapeHtml(r.company)}</div></div></li>`;
        if (parsed.entity === "companies") return `<li class="mini-list__item is-clickable" data-open="company" data-id="${r.id}"><span class="mini-list__icon">${icon("building", { size: 15 })}</span><div class="mini-list__main"><div class="cell-strong">${escapeHtml(r.name)}</div><div class="cell-sub">${escapeHtml(r.industry)}</div></div></li>`;
        if (parsed.entity === "deals") return `<li class="mini-list__item is-clickable" data-open="deal" data-id="${r.id}"><span class="mini-list__icon">${icon("briefcase", { size: 15 })}</span><div class="mini-list__main"><div class="cell-strong">${escapeHtml(r.title)}</div><div class="cell-sub">${fmt.money(r.value)}</div></div></li>`;
        return `<li class="mini-list__item"><div class="mini-list__main"><div class="cell-strong">${escapeHtml(r.title || r.name)}</div></div></li>`;
      }).join("");
      return `<div class="ai-search-block"><ul class="mini-list">${li}</ul>${parsed.rows.length > 4 ? `<button class="btn btn--ghost btn--sm btn--block" data-seeall>See all ${parsed.rows.length}</button>` : ""}</div>`;
    }

    return { open };
  })();
  // wire "see all" inside assistant search blocks (delegated globally — assistant lives in body)
  on(document, "click", "[data-seeall]", () => { /* re-run last — handled by closing; kept simple */ });

  /* ============================================================
     KEYBOARD SHORTCUTS (#20)
     ============================================================ */
  const NAV_KEYS = { d: "dashboard", w: "workspace", e: "explore", a: "analytics", c: "customers", r: "reviews", o: "automations", m: "marketplace", s: "settings" };
  let gPending = false, gTimer = null;
  function installShortcuts() {
    document.addEventListener("keydown", (e) => {
      // ⌘K / Ctrl+K always
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") { e.preventDefault(); Palette.isOpen ? Palette.close() : Palette.open(); return; }
      if (Palette.isOpen) return;
      if (isTyping() || e.metaKey || e.ctrlKey || e.altKey) return;
      if (e.key === "/") { e.preventDefault(); Palette.open(); return; }
      if (e.key === "?") { e.preventDefault(); showShortcuts(); return; }
      if (e.key.toLowerCase() === "i") { e.preventDefault(); App.aiAssistant.open(); return; }
      if (gPending) {
        const id = NAV_KEYS[e.key.toLowerCase()];
        gPending = false; clearTimeout(gTimer);
        if (id) { e.preventDefault(); App.router.go(id); }
        return;
      }
      if (e.key.toLowerCase() === "g") { gPending = true; gTimer = setTimeout(() => (gPending = false), 1200); }
      else if (e.key.toLowerCase() === "n") { gPending = false; App.create.task(); }
    });
  }

  function showShortcuts() {
    const rows = [
      ["⌘ K  /  Ctrl K", "Open command palette"],
      ["/", "Quick search"],
      ["i", "Ask Kerso AI"],
      ["g then d", "Go to Dashboard"],
      ["g then w", "Go to Workspace"],
      ["g then c", "Go to Customers"],
      ["g then a", "Go to Analytics"],
      ["g then o", "Go to Automations"],
      ["n", "New task"],
      ["?", "Show this help"],
      ["Esc", "Close dialogs"],
    ];
    ui.modal({
      title: "Keyboard shortcuts", subtitle: "Move faster with the keyboard", size: "sm",
      body: `<ul class="kbd-list">${rows.map((r) => `<li class="kbd-row"><span class="kbd-row__label">${escapeHtml(r[1])}</span><span class="kbd-row__keys">${r[0].split(/\s+/).map((k) => /^(then|\/)$/.test(k) ? `<span class="kbd-sep">${k}</span>` : `<kbd>${escapeHtml(k)}</kbd>`).join(" ")}</span></li>`).join("")}</ul>`,
      footer: `<button class="btn btn--primary" data-act="ok">Got it</button>`,
      onMount(root, c) { on(root, "click", '[data-act="ok"]', c.close); },
    });
  }

  /* ---------------- expose ---------------- */
  defaultCommands().forEach(register);
  App.command = { open: Palette.open, close: Palette.close, register, installShortcuts, showShortcuts, get isOpen() { return Palette.isOpen; } };
  App.aiAssistant = aiAssistant;
  App.reportView = reportView;
  App.searchResults = searchResults;
})(window.App);
