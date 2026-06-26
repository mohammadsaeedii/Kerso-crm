/* ============================================================
   Kerso CRM — Page views
   Each page: { title, render() -> html, init(root) -> wire }
   Shared helpers (pageHead, panel) and detail drawers live here.
   ============================================================ */
(function (App) {
  "use strict";
  const { fmt, icon, escapeHtml, qs, qsa, on } = App;
  const ui = App.ui;
  const charts = App.charts;
  const D = App.data;

  /* ---------------- Shared layout helpers ---------------- */
  function pageHead(o) {
    return `<div class="page-head">
      <div class="page-head__titles">
        <h1 class="page-title">${escapeHtml(o.title)}</h1>
        ${o.sub ? `<p class="page-sub">${o.sub}</p>` : ""}
      </div>
      ${o.actions ? `<div class="page-head__actions">${o.actions}</div>` : ""}
    </div>`;
  }
  App.pageHead = pageHead;

  function panel(title, body, o = {}) {
    return `<section class="panel ${o.class || ""}" ${o.attrs || ""}>
      <header class="panel__head">
        <div class="panel__head-main"><h3 class="panel__title">${escapeHtml(title)}</h3>${o.sub ? `<p class="panel__sub">${escapeHtml(o.sub)}</p>` : ""}</div>
        ${o.actions ? `<div class="panel__actions">${o.actions}</div>` : ""}
      </header>
      <div class="panel__body ${o.flush ? "panel__body--flush" : ""}">${body}</div>
    </section>`;
  }

  const btn = (label, o = {}) =>
    `<button type="button" class="btn ${o.variant ? "btn--" + o.variant : "btn--secondary"} ${o.size ? "btn--" + o.size : ""}" ${o.attrs || ""}>${o.icon ? icon(o.icon, { size: o.iconSize || 18 }) : ""}${label ? `<span>${escapeHtml(label)}</span>` : ""}</button>`;

  const companyLogo = (name, color, size = 38) =>
    `<span class="clogo clogo--${color}" style="width:${size}px;height:${size}px;font-size:${Math.round(size * 0.4)}px">${escapeHtml(name[0])}</span>`;

  /* ====================================================================
     DASHBOARD
     ==================================================================== */
  const dashState = { range: "12M", hidden: new Set() };

  function renderRevenue() {
    const months = D.revenueSeries;
    let labels, cur, prev;
    if (dashState.range === "6M") {
      const s = months.slice(-6);
      labels = s.map((m) => m.label); cur = s.map((m) => m.current); prev = s.map((m) => m.previous);
    } else if (dashState.range === "Quarterly") {
      labels = ["Q1", "Q2", "Q3", "Q4"];
      cur = [0, 1, 2, 3].map((q) => App.sum(months.slice(q * 3, q * 3 + 3), "current"));
      prev = [0, 1, 2, 3].map((q) => App.sum(months.slice(q * 3, q * 3 + 3), "previous"));
    } else {
      labels = months.map((m) => m.label); cur = months.map((m) => m.current); prev = months.map((m) => m.previous);
    }
    const series = [];
    if (!dashState.hidden.has("This year")) series.push({ name: "This year", color: "#4F46E5", values: cur });
    if (!dashState.hidden.has("Last year")) series.push({ name: "Last year", color: "#CBD2E0", values: prev, fill: false, dashed: true });
    return charts.areaLine({ labels, series, money: true, height: 280 });
  }

  function revenueLegend() {
    const items = [{ name: "This year", color: "#4F46E5" }, { name: "Last year", color: "#CBD2E0" }];
    return `<div class="legend legend--toggle">${items
      .map((it) => `<button type="button" class="legend__item ${dashState.hidden.has(it.name) ? "is-off" : ""}" data-legend="${it.name}"><span class="legend__dot" style="background:${it.color}"></span>${it.name}</button>`)
      .join("")}</div>`;
  }

  function pipelineCard() {
    const total = App.sum(D.pipeline, "value");
    const rows = D.pipeline
      .map((s) => {
        const pct = (s.value / total) * 100;
        return `<li class="pipe">
          <div class="pipe__top"><span class="pipe__name"><span class="pipe__dot" style="background:${s.color}"></span>${s.stage}</span><span class="pipe__count">${s.count} deals</span></div>
          <div class="pipe__bar"><div class="pipe__fill" style="width:${pct.toFixed(1)}%;background:${s.color}"></div></div>
          <div class="pipe__val">${fmt.money(s.value)} <span class="pipe__pct">${pct.toFixed(0)}%</span></div>
        </li>`;
      })
      .join("");
    return `<ul class="pipe-list">${rows}</ul>
      <div class="pipe-total"><span>Total pipeline value</span><b>${fmt.money(total)}</b></div>`;
  }

  function tasksCard() {
    const rows = D.tasks
      .map((t) => {
        const overdue = !t.done && t.due < App.now();
        return `<li class="task ${t.done ? "is-done" : ""}" data-task="${t.id}">
          <label class="checkbox checkbox--round"><input type="checkbox" data-task-check ${t.done ? "checked" : ""}/><span></span></label>
          <div class="task__main">
            <p class="task__title">${escapeHtml(t.title)}</p>
            <div class="task__meta">
              <span class="task__pri task__pri--${t.priority}">${fmt.title(t.priority)}</span>
              <span class="task__due ${overdue ? "is-overdue" : ""}">${icon("clock", { size: 13 })}${overdue ? "Overdue · " : ""}${fmt.relTime(t.due)}</span>
            </div>
          </div>
          ${ui.avatar(t.assignee, "indigo", 26)}
        </li>`;
      })
      .join("");
    return `<ul class="task-list">${rows}</ul>
      <form class="task-add" data-task-add><input class="input input--sm" placeholder="Add a task…" name="title" aria-label="New task"/><button class="btn btn--primary btn--sm" type="submit">${icon("plus", { size: 16 })}Add</button></form>`;
  }

  function activityCard() {
    const rows = D.activities
      .map((a) => `<li class="act">
        <span class="act__dot act__dot--${a.color}">${icon(actIcon(a.type), { size: 14 })}</span>
        <div class="act__body"><p class="act__text"><b>${escapeHtml(a.who)}</b> ${a.text}</p><span class="act__time">${fmt.relTime(a.time)}</span></div>
      </li>`)
      .join("");
    return `<ul class="act-list">${rows}</ul>`;
  }
  const actIcon = (t) => ({ deal: "briefcase", review: "star", customer: "user", task: "check", message: "message" }[t] || "info");

  function dealsTableCard(rootSel) {
    return `<div data-deals-table></div>`;
  }

  const dealCol = () => [
    { key: "title", label: "Deal", render: (r) => `<div class="cell-strong">${escapeHtml(r.title)}</div><div class="cell-sub">${escapeHtml(r.id)}</div>` },
    { key: "company", label: "Company" },
    { key: "owner", label: "Owner", render: (r) => `<span class="cell-user">${ui.avatar(r.owner, r.ownerColor, 26)}<span>${escapeHtml(r.owner)}</span></span>` },
    { key: "value", label: "Value", align: "right", render: (r) => `<b>${fmt.money(r.value)}</b>`, sortVal: (r) => r.value },
    { key: "stage", label: "Stage", render: (r) => ui.badge(r.stage) },
    { key: "probability", label: "Probability", width: "140px", render: (r) => `<div class="cell-prob">${ui.progress(r.probability, { small: true })}<span>${r.probability}%</span></div>`, sortVal: (r) => r.probability },
    { key: "close", label: "Close date", render: (r) => fmt.date(r.close), sortVal: (r) => +r.close, nowrap: true },
  ];

  const dashboard = {
    title: "Dashboard",
    render() {
      const widgets = App.store.get("dash:widgets", { revenue: true, pipeline: true, deals: true, activity: true, tasks: true, created: true });
      App._dashWidgets = widgets;
      const actions =
        ui.segmented([{ value: "6M", label: "6M" }, { value: "12M", label: "12M" }, { value: "Quarterly", label: "Quarterly" }], dashState.range, { attrs: 'data-range' }) +
        btn("Manage dashboard", { icon: "gear", attrs: 'data-manage' });
      const kpis = `<section class="cards" aria-label="Key metrics">${D.kpis.map((k) => ui.kpiCard(k)).join("")}</section>`;

      const grid = `<div class="dash-grid">
        ${widgets.revenue ? `<div class="dash-col-8">${panel("Revenue overview", `<div data-revenue>${renderRevenue()}</div>`, { sub: "Monthly recurring revenue vs. previous year", actions: revenueLegend() })}</div>` : ""}
        ${widgets.pipeline ? `<div class="dash-col-4">${panel("Sales pipeline", pipelineCard(), { actions: `<a class="panel__link" href="#/explore">Explore</a>` })}</div>` : ""}
        ${widgets.deals ? `<div class="dash-col-8">${panel("Recent deals", dealsTableCard(), { actions: `<a class="panel__link" href="#/customers">View all</a>`, flush: true })}</div>` : ""}
        ${widgets.activity ? `<div class="dash-col-4">${panel("Activity", activityCard(), { actions: `<button class="panel__link" data-noop>View all</button>` })}</div>` : ""}
        ${widgets.created ? `<div class="dash-col-8">${panel("Deals created", `<div class="panel__legend">${charts.legend([{ name: "Won", color: "#4F46E5" }, { name: "Lost", color: "#E2E6EE" }])}</div>${charts.bars({ labels: D.dealsCreated.map((d) => d.label), series: [{ name: "Won", color: "#4F46E5", values: D.dealsCreated.map((d) => d.won) }, { name: "Lost", color: "#E2E6EE", values: D.dealsCreated.map((d) => d.lost) }], height: 260 })}`, {})}</div>` : ""}
        ${widgets.tasks ? `<div class="dash-col-4">${panel("Tasks", tasksCard(), { sub: `${D.tasks.filter((t) => !t.done).length} open` })}</div>` : ""}
      </div>`;

      return pageHead({ title: "Dashboard", sub: "Last edited, June 24, 2024", actions }) + kpis + grid;
    },
    init(root) {
      charts.bind(root);
      // Recent deals table
      const tableHost = qs("[data-deals-table]", root);
      if (tableHost) {
        new ui.DataTable(tableHost, {
          columns: dealCol(),
          rows: D.deals,
          pageSize: 6,
          sortKey: "value",
          sortDir: "desc",
          rowClick: (row) => openDealDrawer(row),
        });
      }
      // range switch
      on(root, "click", "[data-range] .segmented__btn", (e, t) => {
        dashState.range = t.dataset.seg;
        qsa("[data-range] .segmented__btn", root).forEach((b) => b.classList.toggle("is-active", b === t));
        const host = qs("[data-revenue]", root);
        if (host) { host.innerHTML = renderRevenue(); charts.bind(host); }
      });
      // legend toggle
      on(root, "click", "[data-legend]", (e, t) => {
        const name = t.dataset.legend;
        if (dashState.hidden.has(name)) dashState.hidden.delete(name); else dashState.hidden.add(name);
        t.classList.toggle("is-off");
        const host = qs("[data-revenue]", root);
        if (host) { host.innerHTML = renderRevenue(); charts.bind(host); }
      });
      // tasks
      on(root, "change", "[data-task-check]", (e, t) => {
        const li = t.closest("[data-task]");
        const task = D.tasks.find((x) => x.id === li.dataset.task);
        if (task) { task.done = t.checked; li.classList.toggle("is-done", t.checked); }
        const open = D.tasks.filter((x) => !x.done).length;
        const sub = qs(".dash-col-4 .panel__sub", root);
      });
      on(root, "submit", "[data-task-add]", (e) => {
        e.preventDefault();
        const input = qs('input[name="title"]', e.target);
        const v = input.value.trim();
        if (!v) return;
        D.tasks.unshift({ id: App.uid("T"), title: v, due: App.now(), priority: "medium", done: false, assignee: D.currentUser.name });
        const host = qs(".dash-col-4:last-child .panel__body", root) || e.target.closest(".panel__body");
        if (host) host.innerHTML = tasksCard();
        ui.toast("Task added", { type: "success" });
      });
      // manage dashboard
      on(root, "click", "[data-manage]", () => openManageDashboard());
      on(root, "click", "[data-noop]", () => ui.toast("Showing all activity", { type: "info" }));
      // KPI menus
      on(root, "click", "[data-row-menu]", (e, t) => {
        ui.popover(t, ui.menuList([
          { label: "View details", icon: "eye", value: "view" },
          { label: "Compare period", icon: "trending-up", value: "compare" },
          "divider",
          { label: "Hide card", icon: "x", value: "hide", danger: true },
        ]), { align: "end", onSelect: (v) => ui.toast(v === "hide" ? "Card hidden" : "Opened metric", { type: "info" }) });
      });
    },
  };

  function openManageDashboard() {
    const widgets = App.store.get("dash:widgets", { revenue: true, pipeline: true, deals: true, activity: true, tasks: true, created: true });
    const labels = { revenue: "Revenue overview", pipeline: "Sales pipeline", deals: "Recent deals", created: "Deals created", activity: "Activity feed", tasks: "Tasks" };
    const body = `<p class="modal__hint">Choose which widgets appear on your dashboard.</p>
      <div class="widget-toggles">${Object.keys(labels)
        .map((k) => `<label class="widget-toggle"><span class="widget-toggle__icon">${icon("grid", { size: 18 })}</span><span class="widget-toggle__label">${labels[k]}</span>${ui.toggle(k, widgets[k])}</label>`)
        .join("")}</div>`;
    ui.modal({
      title: "Manage dashboard",
      subtitle: "Customize your workspace",
      size: "sm",
      body,
      footer: `<button class="btn btn--ghost" data-act="cancel">Cancel</button><button class="btn btn--primary" data-act="save">Save changes</button>`,
      onMount(rootEl, ctrl) {
        on(rootEl, "click", '[data-act="cancel"]', ctrl.close);
        on(rootEl, "click", '[data-act="save"]', () => {
          const next = {};
          qsa("input[type=checkbox]", rootEl).forEach((c) => (next[c.name] = c.checked));
          App.store.set("dash:widgets", next);
          ctrl.close();
          ui.toast("Dashboard updated", { type: "success" });
          App.router.reload();
        });
      },
    });
  }

  /* ====================================================================
     DEAL DRAWER
     ==================================================================== */
  function openDealDrawer(deal) {
    const head = `<div class="drawer-id">
      <div class="drawer-id__main"><h2 class="drawer__title">${escapeHtml(deal.title)}</h2><p class="drawer-id__sub">${escapeHtml(deal.company)} · ${escapeHtml(deal.id)}</p></div>
      ${ui.badge(deal.stage)}</div>`;
    const body = `<div class="deal-value">${fmt.money(deal.value)}<span>deal value</span></div>
      <div class="detail-grid">
        ${detailRow("Owner", `<span class="cell-user">${ui.avatar(deal.owner, deal.ownerColor, 24)}${escapeHtml(deal.owner)}</span>`)}
        ${detailRow("Stage", ui.badge(deal.stage))}
        ${detailRow("Probability", `<div class="cell-prob">${ui.progress(deal.probability, { small: true })}<span>${deal.probability}%</span></div>`)}
        ${detailRow("Close date", fmt.date(deal.close))}
        ${detailRow("Status", ui.badge(deal.status))}
      </div>
      <h4 class="drawer-section">Stage progress</h4>
      <ol class="stage-track">${D.STAGES.map((s, i) => {
        const reached = D.STAGES.indexOf(deal.stage) >= i;
        return `<li class="stage-track__step ${reached ? "is-done" : ""}"><span class="stage-track__dot">${reached ? icon("check", { size: 12, stroke: 2.4 }) : i + 1}</span><span>${s}</span></li>`;
      }).join("")}</ol>
      <h4 class="drawer-section">Recent activity</h4>
      <ul class="act-list act-list--compact">${D.activities.slice(0, 4).map((a) => `<li class="act"><span class="act__dot act__dot--${a.color}">${icon(actIcon(a.type), { size: 13 })}</span><div class="act__body"><p class="act__text">${a.text}</p><span class="act__time">${fmt.relTime(a.time)}</span></div></li>`).join("")}</ul>`;
    const footer = `<button class="btn btn--ghost" data-d="edit">${icon("edit", { size: 18 })}Edit</button><button class="btn btn--primary" data-d="won">${icon("check-circle", { size: 18 })}Mark as won</button>`;
    ui.drawer({
      head, body, footer, width: 460,
      onMount(rootEl, ctrl) {
        on(rootEl, "click", '[data-d="won"]', () => { ctrl.close(); ui.toast("Deal marked as won 🎉", { type: "success", desc: deal.title }); });
        on(rootEl, "click", '[data-d="edit"]', () => ui.toast("Edit deal", { type: "info" }));
      },
    });
  }
  const detailRow = (label, val) => `<div class="detail-row"><span class="detail-row__label">${escapeHtml(label)}</span><span class="detail-row__val">${val}</span></div>`;

  /* ====================================================================
     BUSINESS EXPLORE
     ==================================================================== */
  const exploreState = { view: "grid", q: "", industry: "All", status: "All", sort: "revenue" };

  function exploreFiltered() {
    let list = D.companies.slice();
    if (exploreState.q) {
      const q = exploreState.q.toLowerCase();
      list = list.filter((c) => c.name.toLowerCase().includes(q) || c.industry.toLowerCase().includes(q) || c.city.toLowerCase().includes(q));
    }
    if (exploreState.industry !== "All") list = list.filter((c) => c.industry === exploreState.industry);
    if (exploreState.status !== "All") list = list.filter((c) => c.status === exploreState.status);
    const s = exploreState.sort;
    list.sort((a, b) => (s === "name" ? a.name.localeCompare(b.name) : s === "growth" ? b.growth - a.growth : s === "deals" ? b.deals - a.deals : b.revenue - a.revenue));
    return list;
  }

  function companyCard(c) {
    return `<article class="biz-card" data-company="${c.id}" tabindex="0" role="button">
      <div class="biz-card__head">
        ${companyLogo(c.name, c.logo, 46)}
        <div class="biz-card__menu">${ui.badge(c.status)}</div>
      </div>
      <h3 class="biz-card__name">${escapeHtml(c.name)}</h3>
      <p class="biz-card__meta">${escapeHtml(c.industry)} · ${escapeHtml(c.city)}, ${escapeHtml(c.country)}</p>
      <div class="biz-card__stats">
        <div><span class="biz-stat__num">${fmt.moneyCompact(c.revenue)}</span><span class="biz-stat__lbl">Revenue</span></div>
        <div><span class="biz-stat__num ${c.growth >= 0 ? "pos" : "neg"}">${fmt.pct(c.growth)}</span><span class="biz-stat__lbl">Growth</span></div>
        <div><span class="biz-stat__num">${c.contacts}</span><span class="biz-stat__lbl">Contacts</span></div>
      </div>
      <div class="biz-card__foot">
        <span class="biz-card__rating">${icon("star", { size: 14 })}${c.rating}</span>
        <span class="biz-card__deals">${c.deals} open deals</span>
      </div>
    </article>`;
  }

  const explore = {
    title: "Business Explore",
    render() {
      const stats = `<section class="cards cards--mini">${D.exploreStats
        .map((s) => `<article class="card stat-mini"><p class="card__label">${escapeHtml(s.label)}</p><p class="stat-mini__value">${s.money ? fmt.moneyCompact(s.value) : fmt.num(s.value)}${s.suffix || ""}</p><p class="stat-mini__sub">${escapeHtml(s.sub)}</p></article>`)
        .join("")}</section>`;
      const actions = ui.segmented([{ value: "grid", icon: "grid" }, { value: "list", icon: "list" }], exploreState.view, { attrs: "data-view" }) + btn("Add company", { icon: "plus", variant: "primary", attrs: "data-add-company" });
      const toolbar = filterBar();
      return pageHead({ title: "Business Explore", sub: "Discover and manage companies across your network", actions }) + stats + toolbar + `<div data-explore-results>${renderResults()}</div>`;
    },
    init(root) {
      wireFilterBar(root, () => qs("[data-explore-results]", root), renderResults);
      on(root, "click", "[data-view] .segmented__btn", (e, t) => {
        exploreState.view = t.dataset.seg;
        qsa("[data-view] .segmented__btn", root).forEach((b) => b.classList.toggle("is-active", b === t));
        rerender(root);
      });
      on(root, "click", "[data-add-company]", () => openAddCompany(root));
      on(root, "click", "[data-company]", (e, t) => {
        if (e.target.closest("button,a")) return;
        const c = D.companies.find((x) => x.id === t.dataset.company);
        if (c) openCompanyDrawer(c);
      });
      on(root, "keydown", "[data-company]", (e, t) => {
        if (e.key === "Enter" || e.key === " ") { e.preventDefault(); const c = D.companies.find((x) => x.id === t.dataset.company); if (c) openCompanyDrawer(c); }
      });
    },
  };

  function filterBar() {
    return `<div class="filterbar">
      <div class="filterbar__search">${icon("search", { size: 18, class: "filterbar__searchicon" })}<input class="input" data-explore-search placeholder="Search companies…" value="${escapeHtml(exploreState.q)}"/></div>
      <div class="filterbar__controls">
        <label class="select-wrap"><select class="select" data-explore-industry>${["All", ...D.INDUSTRIES].map((i) => `<option ${exploreState.industry === i ? "selected" : ""}>${i}</option>`).join("")}</select></label>
        <label class="select-wrap"><select class="select" data-explore-status>${["All", "Customer", "Prospect", "Partner", "Churned"].map((i) => `<option ${exploreState.status === i ? "selected" : ""}>${i}</option>`).join("")}</select></label>
        <label class="select-wrap"><select class="select" data-explore-sort>
          <option value="revenue" ${exploreState.sort === "revenue" ? "selected" : ""}>Sort: Revenue</option>
          <option value="growth" ${exploreState.sort === "growth" ? "selected" : ""}>Sort: Growth</option>
          <option value="deals" ${exploreState.sort === "deals" ? "selected" : ""}>Sort: Open deals</option>
          <option value="name" ${exploreState.sort === "name" ? "selected" : ""}>Sort: Name</option>
        </select></label>
      </div>
    </div>`;
  }
  function wireFilterBar(root, hostFn) {
    const redo = () => { hostFn().innerHTML = renderResults(); };
    const search = qs("[data-explore-search]", root);
    if (search) on(search, "input", App.debounce(() => { exploreState.q = search.value; redo(); }, 180));
    on(root, "change", "[data-explore-industry]", (e, t) => { exploreState.industry = t.value; redo(); });
    on(root, "change", "[data-explore-status]", (e, t) => { exploreState.status = t.value; redo(); });
    on(root, "change", "[data-explore-sort]", (e, t) => { exploreState.sort = t.value; redo(); });
  }
  function renderResults() {
    const list = exploreFiltered();
    const count = `<div class="result-count">${list.length} ${list.length === 1 ? "company" : "companies"}</div>`;
    if (!list.length) return count + ui.emptyState({ icon: "building", title: "No companies found", desc: "Try a different search or clear your filters." });
    if (exploreState.view === "list") {
      return count + `<div class="panel" style="margin-top:14px"><div data-biz-list></div></div>`;
    }
    return count + `<div class="biz-grid">${list.map(companyCard).join("")}</div>`;
  }
  function rerender(root) {
    const host = qs("[data-explore-results]", root);
    host.innerHTML = renderResults();
    if (exploreState.view === "list") {
      const lh = qs("[data-biz-list]", root);
      new ui.DataTable(lh, {
        columns: [
          { key: "name", label: "Company", render: (c) => `<span class="cell-user">${companyLogo(c.name, c.logo, 30)}<span><div class="cell-strong">${escapeHtml(c.name)}</div><div class="cell-sub">${escapeHtml(c.website)}</div></span></span>` },
          { key: "industry", label: "Industry" },
          { key: "city", label: "Location", render: (c) => `${escapeHtml(c.city)}, ${escapeHtml(c.country)}` },
          { key: "status", label: "Status", render: (c) => ui.badge(c.status) },
          { key: "revenue", label: "Revenue", align: "right", render: (c) => fmt.moneyCompact(c.revenue), sortVal: (c) => c.revenue },
          { key: "growth", label: "Growth", align: "right", render: (c) => `<span class="${c.growth >= 0 ? "pos" : "neg"}">${fmt.pct(c.growth)}</span>`, sortVal: (c) => c.growth },
          { key: "deals", label: "Deals", align: "right" },
        ],
        rows: exploreFiltered(),
        pageSize: 10,
        rowClick: (c) => openCompanyDrawer(c),
      });
    }
  }
  // when list view chosen, results host needs the table mounted after innerHTML
  const _origExploreInit = explore.init;
  explore.init = function (root) {
    _origExploreInit.call(this, root);
    if (exploreState.view === "list") rerender(root);
    // re-mount table whenever results re-render in list view
    const obsHost = qs("[data-explore-results]", root);
    const remount = () => { if (exploreState.view === "list" && qs("[data-biz-list]", root) && !qs("[data-biz-list] .table", root)) rerender(root); };
    on(root, "change", "[data-explore-industry],[data-explore-status],[data-explore-sort]", remount);
    on(root, "input", "[data-explore-search]", App.debounce(remount, 200));
  };

  function openCompanyDrawer(c) {
    const head = `<div class="drawer-id">${companyLogo(c.name, c.logo, 46)}<div class="drawer-id__main"><h2 class="drawer__title">${escapeHtml(c.name)}</h2><p class="drawer-id__sub">${escapeHtml(c.industry)} · ${escapeHtml(c.city)}, ${escapeHtml(c.country)}</p></div>${ui.badge(c.status)}</div>`;
    const related = D.customers.filter((x) => x.company === c.name);
    const dealsFor = D.deals.filter((x) => x.company === c.name);
    const body = `<div class="tabbed">
      ${ui.tabs([{ value: "ov", label: "Overview" }, { value: "ct", label: "Contacts", count: related.length }, { value: "dl", label: "Deals", count: dealsFor.length }], "ov")}
      <div class="tabpane" data-pane="ov">
        <p class="drawer-desc">${escapeHtml(c.description)}</p>
        <div class="detail-grid">
          ${detailRow("Annual revenue", `<b>${fmt.money(c.revenue)}</b>`)}
          ${detailRow("Growth", `<span class="${c.growth >= 0 ? "pos" : "neg"}">${fmt.pct(c.growth)}</span>`)}
          ${detailRow("Company size", c.size + " employees")}
          ${detailRow("Founded", c.founded)}
          ${detailRow("Rating", `<span class="cell-rating">${ui.stars(+c.rating)}<span>${c.rating}</span></span>`)}
          ${detailRow("Website", `<a class="link" href="https://${c.website}" target="_blank" rel="noopener">${escapeHtml(c.website)} ${icon("external-link", { size: 14 })}</a>`)}
        </div>
      </div>
      <div class="tabpane" data-pane="ct" hidden>${related.length ? `<ul class="mini-list">${related.map((p) => `<li class="mini-list__item">${ui.avatar(p.name, p.avatar, 34)}<div class="mini-list__main"><div class="cell-strong">${escapeHtml(p.name)}</div><div class="cell-sub">${escapeHtml(p.email)}</div></div>${ui.badge(p.status)}</li>`).join("")}</ul>` : ui.emptyState({ icon: "users", title: "No contacts yet" })}</div>
      <div class="tabpane" data-pane="dl" hidden>${dealsFor.length ? `<ul class="mini-list">${dealsFor.map((d) => `<li class="mini-list__item"><span class="mini-list__icon">${icon("briefcase", { size: 16 })}</span><div class="mini-list__main"><div class="cell-strong">${escapeHtml(d.title)}</div><div class="cell-sub">${fmt.money(d.value)} · ${escapeHtml(d.stage)}</div></div>${ui.badge(d.status)}</li>`).join("")}</ul>` : ui.emptyState({ icon: "briefcase", title: "No open deals" })}</div>
    </div>`;
    const footer = `<button class="btn btn--ghost" data-c="msg">${icon("message", { size: 18 })}Message</button><button class="btn btn--primary" data-c="deal">${icon("plus", { size: 18 })}New deal</button>`;
    ui.drawer({ head, body, footer, width: 480, onMount(rootEl, ctrl) {
      on(rootEl, "click", '[data-c="deal"]', () => { ctrl.close(); ui.toast("New deal started", { type: "success", desc: c.name }); });
      on(rootEl, "click", '[data-c="msg"]', () => ui.toast("Opening conversation…", { type: "info" }));
    } });
  }

  function openAddCompany(root) {
    const body = `<form class="form-grid" data-form>
      ${ui.field({ label: "Company name", name: "name", required: true, placeholder: "Acme Inc.", wide: true })}
      ${ui.field({ label: "Industry", name: "industry", type: "select", options: D.INDUSTRIES })}
      ${ui.field({ label: "Status", name: "status", type: "select", options: ["Customer", "Prospect", "Partner"] })}
      ${ui.field({ label: "City", name: "city", placeholder: "San Francisco" })}
      ${ui.field({ label: "Country", name: "country", placeholder: "USA" })}
      ${ui.field({ label: "Website", name: "website", placeholder: "acme.com", wide: true })}
    </form>`;
    ui.modal({
      title: "Add company", subtitle: "Create a new account in your workspace", body,
      footer: `<button class="btn btn--ghost" data-act="cancel">Cancel</button><button class="btn btn--primary" data-act="save">Add company</button>`,
      onMount(rootEl, ctrl) {
        on(rootEl, "click", '[data-act="cancel"]', ctrl.close);
        on(rootEl, "click", '[data-act="save"]', () => {
          const form = qs("[data-form]", rootEl);
          const { valid, values } = ui.validate(form);
          if (!valid) return;
          D.companies.unshift({ id: App.uid("B"), name: values.name, industry: values.industry, status: values.status, city: values.city || "—", country: values.country || "—", revenue: 0, growth: 0, contacts: 0, deals: 0, website: values.website || (values.name.toLowerCase().replace(/[^a-z]+/g, "") + ".com"), logo: D.avatarColor(), founded: 2024, rating: "5.0", size: "1–10", description: "Newly added company." });
          ctrl.close();
          ui.toast("Company added", { type: "success", desc: values.name });
          App.router.reload();
        });
      },
    });
  }

  /* ====================================================================
     ANALYTICS
     ==================================================================== */
  const analyticsState = { range: "30D" };
  const analytics = {
    title: "Analytics",
    render() {
      const A = D.analytics;
      const actions = ui.segmented([{ value: "7D", label: "7D" }, { value: "30D", label: "30D" }, { value: "12M", label: "12M" }], analyticsState.range, { attrs: "data-arange" }) + btn("Export", { icon: "download", attrs: "data-export" });
      const kpis = `<section class="cards" aria-label="Analytics metrics">${A.kpis.map((k) => ui.kpiCard(k)).join("")}</section>`;
      const grid = `<div class="dash-grid">
        <div class="dash-col-8">${panel("Visitors", `<div data-visitors>${charts.areaLine({ labels: A.visitors.map((v) => v.label), series: [{ name: "Visitors", color: "#4F46E5", values: A.visitors.map((v) => v.value) }], height: 280 })}</div>`, { sub: "Unique visitors over the selected range" })}</div>
        <div class="dash-col-4">${panel("Traffic sources", `<div class="donut-wrap">${charts.donut({ data: A.sources, size: 188, center: "100%", centerSub: "traffic" })}</div>${charts.legend(A.sources.map((s) => ({ name: `${s.name} · ${s.value}%`, color: s.color })))}`, {})}</div>
        <div class="dash-col-6">${panel("Conversion funnel", charts.funnel({ data: A.funnel }), { sub: "From visit to customer" })}</div>
        <div class="dash-col-6">${panel("Top sales reps", charts.hbars({ data: A.reps.map((r) => ({ name: r.name, value: r.value })), money: true }), { actions: `<a class="panel__link" href="#/customers">Team</a>` })}</div>
        <div class="dash-col-4">${panel("Revenue by category", charts.hbars({ data: A.categories, money: true }), {})}</div>
        <div class="dash-col-4">${panel("Sales by region", charts.hbars({ data: A.regions, pct: true }), {})}</div>
        <div class="dash-col-4">${panel("Devices", `<div class="donut-wrap">${charts.donut({ data: A.devices, size: 168, center: "62%", centerSub: "desktop" })}</div>${charts.legend(A.devices.map((s) => ({ name: `${s.name} · ${s.value}%`, color: s.color })))}`, {})}</div>
        <div class="dash-col-12">${panel("Retention cohorts", charts.heatmap({ rows: A.cohort, cols: 6 }), { sub: "% of customers retained by months since signup" })}</div>
      </div>`;
      return pageHead({ title: "Analytics", sub: "Deep insights into your sales performance", actions }) + kpis + grid;
    },
    init(root) {
      charts.bind(root);
      on(root, "click", "[data-arange] .segmented__btn", (e, t) => {
        analyticsState.range = t.dataset.seg;
        qsa("[data-arange] .segmented__btn", root).forEach((b) => b.classList.toggle("is-active", b === t));
        ui.toast(`Range set to ${t.dataset.seg}`, { type: "info" });
      });
      on(root, "click", "[data-export]", () => ui.toast("Report exported", { type: "success", desc: "analytics-report.csv" }));
    },
  };

  /* ====================================================================
     CUSTOMERS
     ==================================================================== */
  const custState = { status: "All", q: "" };
  let custTable = null;

  function custColumns() {
    return [
      { key: "name", label: "Customer", render: (r) => `<span class="cell-user">${ui.avatar(r.name, r.avatar, 36)}<span><div class="cell-strong">${escapeHtml(r.name)}</div><div class="cell-sub">${escapeHtml(r.email)}</div></span></span>` },
      { key: "company", label: "Company" },
      { key: "status", label: "Status", render: (r) => ui.badge(r.status) },
      { key: "city", label: "Location", render: (r) => `<span class="cell-loc">${icon("map-pin", { size: 14 })}${escapeHtml(r.city)}</span>`, sortVal: (r) => r.city },
      { key: "value", label: "Value", align: "right", render: (r) => `<b>${fmt.money(r.value)}</b>`, sortVal: (r) => r.value },
      { key: "health", label: "Health", width: "130px", render: (r) => `<div class="cell-prob">${ui.progress(r.health, { small: true })}<span>${r.health}</span></div>`, sortVal: (r) => r.health },
      { key: "lastContact", label: "Last contact", render: (r) => fmt.relTime(r.lastContact), sortVal: (r) => +r.lastContact, nowrap: true },
    ];
  }

  function custCounts() {
    const by = (s) => D.customers.filter((c) => c.status === s).length;
    return [
      { label: "All customers", value: D.customers.length, key: "All", icon: "users" },
      { label: "Active", value: by("Active"), key: "Active", icon: "check-circle" },
      { label: "Leads", value: by("Lead"), key: "Lead", icon: "target" },
      { label: "Churned", value: by("Churned"), key: "Churned", icon: "trending-down" },
    ];
  }

  const customers = {
    title: "Customers",
    render() {
      const actions = btn("Export", { icon: "download", attrs: "data-export" }) + btn("Add customer", { icon: "plus", variant: "primary", attrs: "data-add-customer" });
      const counts = `<section class="cards cards--mini">${custCounts()
        .map((c) => `<button class="card stat-mini stat-mini--btn ${custState.status === c.key ? "is-active" : ""}" data-status-filter="${c.key}"><span class="stat-mini__icon">${icon(c.icon, { size: 18 })}</span><span class="stat-mini__body"><span class="stat-mini__value">${fmt.num(c.value)}</span><span class="card__label">${c.label}</span></span></button>`)
        .join("")}</section>`;
      const toolbar = `<div class="filterbar">
        <div class="filterbar__search">${icon("search", { size: 18, class: "filterbar__searchicon" })}<input class="input" data-cust-search placeholder="Search by name, email, company…" value="${escapeHtml(custState.q)}"/></div>
        <div class="filterbar__controls">${ui.segmented([{ value: "All", label: "All" }, { value: "Active", label: "Active" }, { value: "Lead", label: "Lead" }, { value: "Prospect", label: "Prospect" }, { value: "Churned", label: "Churned" }], custState.status, { attrs: "data-status-seg" })}</div>
      </div>`;
      return pageHead({ title: "Customers", sub: `${D.customers.length} total customers`, actions }) + counts + toolbar + `<div class="panel panel--table"><div data-cust-table></div></div>`;
    },
    init(root) {
      custTable = new ui.DataTable(qs("[data-cust-table]", root), {
        columns: custColumns(),
        rows: D.customers,
        pageSize: 9,
        selectable: true,
        searchKeys: ["name", "email", "company", "city"],
        sortKey: "value",
        sortDir: "desc",
        rowClick: (r) => openCustomerDrawer(r),
        rowActions: (row, anchor) => {
          ui.popover(anchor, ui.menuList([
            { label: "View profile", icon: "eye", value: "view" },
            { label: "Edit", icon: "edit", value: "edit" },
            { label: "Send email", icon: "mail", value: "email" },
            "divider",
            { label: "Delete", icon: "trash", value: "delete", danger: true },
          ]), { align: "end", onSelect: (v) => custRowAction(v, row) });
        },
        bulkActions: [
          { label: "Email", icon: "mail", onClick: (rows) => ui.toast(`Email drafted to ${rows.length} customers`, { type: "info" }) },
          { label: "Add tag", icon: "tag", onClick: (rows) => ui.toast(`Tagged ${rows.length} customers`, { type: "success" }) },
          { label: "Delete", icon: "trash", variant: "danger", onClick: (rows) => bulkDelete(rows) },
        ],
        emptyTitle: "No customers found",
        emptyDesc: "Try a different search or filter.",
      });
      applyCustFilter();
      // search
      const search = qs("[data-cust-search]", root);
      on(search, "input", App.debounce(() => { custState.q = search.value; custTable.setSearch(custState.q); }, 160));
      // status segmented
      on(root, "click", "[data-status-seg] .segmented__btn", (e, t) => setStatus(t.dataset.seg, root));
      on(root, "click", "[data-status-filter]", (e, t) => setStatus(t.dataset.statusFilter, root));
      on(root, "click", "[data-add-customer]", () => openCustomerForm(null, root));
      on(root, "click", "[data-export]", () => ui.toast("Customers exported", { type: "success", desc: "customers.csv" }));
    },
  };

  function setStatus(s, root) {
    custState.status = s;
    qsa("[data-status-seg] .segmented__btn", root).forEach((b) => b.classList.toggle("is-active", b.dataset.seg === s));
    qsa("[data-status-filter]", root).forEach((b) => b.classList.toggle("is-active", b.dataset.statusFilter === s));
    applyCustFilter();
  }
  function applyCustFilter() {
    if (!custTable) return;
    custTable.filter(custState.status === "All" ? null : (r) => r.status === custState.status);
  }
  function custRowAction(v, row) {
    if (v === "view") openCustomerDrawer(row);
    else if (v === "edit") openCustomerForm(row);
    else if (v === "email") ui.toast(`Email to ${row.name}`, { type: "info" });
    else if (v === "delete") deleteCustomer(row);
  }
  async function deleteCustomer(row) {
    const ok = await ui.confirm({ title: "Delete customer?", message: `${row.name} will be permanently removed. This cannot be undone.`, confirmText: "Delete", danger: true });
    if (!ok) return;
    const i = D.customers.indexOf(row);
    if (i > -1) D.customers.splice(i, 1);
    custTable.setRows(D.customers);
    applyCustFilter();
    ui.toast("Customer deleted", { type: "success", desc: row.name });
  }
  async function bulkDelete(rows) {
    const ok = await ui.confirm({ title: `Delete ${rows.length} customers?`, message: "These customers will be permanently removed.", confirmText: "Delete all", danger: true });
    if (!ok) return;
    rows.forEach((r) => { const i = D.customers.indexOf(r); if (i > -1) D.customers.splice(i, 1); });
    custTable.setRows(D.customers);
    applyCustFilter();
    ui.toast(`${rows.length} customers deleted`, { type: "success" });
  }

  function openCustomerForm(existing, root) {
    const e = existing || {};
    const body = `<form class="form-grid" data-form>
      ${ui.field({ label: "Full name", name: "name", value: e.name, required: true, wide: true, placeholder: "Jane Cooper" })}
      ${ui.field({ label: "Email", name: "email", type: "email", value: e.email, required: true, placeholder: "jane@company.com" })}
      ${ui.field({ label: "Phone", name: "phone", value: e.phone, placeholder: "+1 (555) 000-0000" })}
      ${ui.field({ label: "Company", name: "company", value: e.company, placeholder: "Acme Inc." })}
      ${ui.field({ label: "Status", name: "status", type: "select", value: e.status || "Lead", options: D.CUST_STATUS })}
      ${ui.field({ label: "City", name: "city", value: e.city, placeholder: "San Francisco" })}
      ${ui.field({ label: "Country", name: "country", value: e.country, placeholder: "USA" })}
    </form>`;
    ui.modal({
      title: existing ? "Edit customer" : "Add customer",
      subtitle: existing ? e.name : "Create a new customer record",
      body,
      footer: `<button class="btn btn--ghost" data-act="cancel">Cancel</button><button class="btn btn--primary" data-act="save">${existing ? "Save changes" : "Add customer"}</button>`,
      onMount(rootEl, ctrl) {
        on(rootEl, "click", '[data-act="cancel"]', ctrl.close);
        on(rootEl, "click", '[data-act="save"]', () => {
          const form = qs("[data-form]", rootEl);
          const { valid, values } = ui.validate(form);
          if (!valid) return;
          if (existing) {
            Object.assign(existing, values);
            ui.toast("Customer updated", { type: "success", desc: values.name });
          } else {
            D.customers.unshift({ id: App.uid("C"), name: values.name, email: values.email, phone: values.phone, company: values.company || "—", status: values.status, city: values.city || "—", country: values.country || "—", value: 0, deals: 0, health: 60, avatar: D.avatarColor(), owner: D.currentUser.name, tags: ["Inbound"], joined: App.now(), lastContact: App.now(), rating: 5 });
            ui.toast("Customer added", { type: "success", desc: values.name });
          }
          ctrl.close();
          if (custTable) { custTable.setRows(D.customers); applyCustFilter(); }
        });
      },
    });
  }

  function openCustomerDrawer(c) {
    const dealsFor = D.deals.filter((d) => d.company === c.company);
    const head = `<div class="drawer-id">${ui.avatar(c.name, c.avatar, 48)}<div class="drawer-id__main"><h2 class="drawer__title">${escapeHtml(c.name)}</h2><p class="drawer-id__sub">${escapeHtml(c.company)}</p></div>${ui.badge(c.status)}</div>`;
    const body = `<div class="drawer-quick">
        <a class="drawer-quick__btn" href="mailto:${escapeHtml(c.email)}">${icon("mail", { size: 18 })}<span>Email</span></a>
        <button class="drawer-quick__btn" data-q="call">${icon("phone", { size: 18 })}<span>Call</span></button>
        <button class="drawer-quick__btn" data-q="note">${icon("edit", { size: 18 })}<span>Note</span></button>
        <button class="drawer-quick__btn" data-q="deal">${icon("briefcase", { size: 18 })}<span>Deal</span></button>
      </div>
      <div class="tabbed">
        ${ui.tabs([{ value: "ov", label: "Overview" }, { value: "dl", label: "Deals", count: dealsFor.length }, { value: "ac", label: "Activity" }, { value: "nt", label: "Notes" }], "ov")}
        <div class="tabpane" data-pane="ov">
          <div class="detail-grid">
            ${detailRow("Email", `<a class="link" href="mailto:${escapeHtml(c.email)}">${escapeHtml(c.email)}</a>`)}
            ${detailRow("Phone", escapeHtml(c.phone))}
            ${detailRow("Location", `${escapeHtml(c.city)}, ${escapeHtml(c.country)}`)}
            ${detailRow("Owner", `<span class="cell-user">${ui.avatar(c.owner, "indigo", 22)}${escapeHtml(c.owner)}</span>`)}
            ${detailRow("Lifetime value", `<b>${fmt.money(c.value)}</b>`)}
            ${detailRow("Customer since", fmt.date(c.joined))}
          </div>
          <h4 class="drawer-section">Account health</h4>
          <div class="health-row">${App.charts.gauge({ value: c.health, label: c.health + "%", sub: "health", size: 132 })}<div class="health-tags"><span class="health-tags__label">Tags</span><div class="chips">${c.tags.map((t) => ui.pill(t, "indigo")).join("")}</div></div></div>
        </div>
        <div class="tabpane" data-pane="dl" hidden>${dealsFor.length ? `<ul class="mini-list">${dealsFor.map((d) => `<li class="mini-list__item"><span class="mini-list__icon">${icon("briefcase", { size: 16 })}</span><div class="mini-list__main"><div class="cell-strong">${escapeHtml(d.title)}</div><div class="cell-sub">${fmt.money(d.value)} · ${escapeHtml(d.stage)}</div></div>${ui.badge(d.status)}</li>`).join("")}</ul>` : ui.emptyState({ icon: "briefcase", title: "No deals yet", desc: "Start a deal with this customer." })}</div>
        <div class="tabpane" data-pane="ac" hidden><ul class="act-list">${D.activities.slice(0, 5).map((a) => `<li class="act"><span class="act__dot act__dot--${a.color}">${icon(actIcon(a.type), { size: 13 })}</span><div class="act__body"><p class="act__text"><b>${escapeHtml(a.who)}</b> ${a.text}</p><span class="act__time">${fmt.relTime(a.time)}</span></div></li>`).join("")}</ul></div>
        <div class="tabpane" data-pane="nt" hidden>
          <div class="notes" data-notes><p class="notes__empty">No notes yet.</p></div>
          <form class="note-form" data-note-form><textarea class="textarea" name="note" rows="3" placeholder="Add a note about ${escapeHtml(c.name)}…"></textarea><button class="btn btn--primary btn--sm" type="submit">Add note</button></form>
        </div>
      </div>`;
    const footer = `<button class="btn btn--ghost" data-edit>${icon("edit", { size: 18 })}Edit</button><button class="btn btn--primary" data-msg>${icon("message", { size: 18 })}Message</button>`;
    ui.drawer({ head, body, footer, width: 500, onMount(rootEl, ctrl) {
      on(rootEl, "click", "[data-edit]", () => { ctrl.close(); openCustomerForm(c); });
      on(rootEl, "click", "[data-msg]", () => ui.toast(`Message ${c.name}`, { type: "info" }));
      on(rootEl, "click", "[data-q]", (e, t) => ui.toast(fmt.title(t.dataset.q) + " — " + c.name, { type: "info" }));
      const notes = qs("[data-notes]", rootEl);
      const stored = [];
      on(rootEl, "submit", "[data-note-form]", (e) => {
        e.preventDefault();
        const ta = qs("textarea", e.target);
        const v = ta.value.trim();
        if (!v) return;
        stored.unshift({ body: v, time: App.now() });
        notes.innerHTML = stored.map((n) => `<div class="note"><div class="note__head">${ui.avatar(D.currentUser.name, "indigo", 26)}<b>${escapeHtml(D.currentUser.name)}</b><span class="note__time">just now</span></div><p class="note__body">${escapeHtml(n.body)}</p></div>`).join("");
        ta.value = "";
        ui.toast("Note added", { type: "success" });
      });
    } });
  }

  /* ====================================================================
     CUSTOMER REVIEWS
     ==================================================================== */
  const reviewState = { rating: "All", product: "All", sort: "recent", q: "" };

  function reviewsFiltered() {
    let list = D.reviews.slice();
    if (reviewState.rating !== "All") list = list.filter((r) => r.rating === +reviewState.rating);
    if (reviewState.product !== "All") list = list.filter((r) => r.product === reviewState.product);
    if (reviewState.q) { const q = reviewState.q.toLowerCase(); list = list.filter((r) => r.title.toLowerCase().includes(q) || r.body.toLowerCase().includes(q) || r.author.toLowerCase().includes(q)); }
    const s = reviewState.sort;
    list.sort((a, b) => (s === "highest" ? b.rating - a.rating : s === "lowest" ? a.rating - b.rating : s === "helpful" ? b.helpful - a.helpful : +b.date - +a.date));
    return list;
  }

  function reviewCard(r) {
    return `<article class="review" data-review="${r.id}">
      <div class="review__head">
        <div class="review__author">${ui.avatar(r.author, r.avatar, 42)}<div><div class="review__name">${escapeHtml(r.author)} ${r.verified ? `<span class="verified" data-tip="Verified customer">${icon("check-circle", { size: 14 })}</span>` : ""}</div><div class="review__sub">${escapeHtml(r.company)} · ${fmt.date(r.date)}</div></div></div>
        <div class="review__rt">${ui.stars(r.rating)}</div>
      </div>
      <h3 class="review__title">${escapeHtml(r.title)}</h3>
      <p class="review__body">${escapeHtml(r.body)}</p>
      <div class="review__foot">
        <span class="tagchip tagchip--neutral">${escapeHtml(r.product)}</span>
        <div class="review__actions">
          <button class="review__helpful" data-helpful="${r.id}">${icon("thumbs-up", { size: 16 })}<span>Helpful</span> <b data-helpful-count>${r.helpful}</b></button>
          <button class="btn btn--ghost btn--sm" data-reply="${r.id}">${icon("send", { size: 15 })}Reply</button>
        </div>
      </div>
      <div data-reply-slot>${r.reply ? replyBlock(r.reply) : ""}</div>
    </article>`;
  }
  const replyBlock = (rep) => `<div class="review__reply"><div class="review__reply-head">${ui.avatar(rep.author, "indigo", 26)}<b>${escapeHtml(rep.author)}</b><span class="review__reply-badge">Kerso team</span><span class="note__time">${fmt.relTime(rep.date)}</span></div><p>${escapeHtml(rep.body)}</p></div>`;

  function reviewsSummary() {
    const all = D.reviews;
    const avg = (App.sum(all, "rating") / all.length).toFixed(1);
    const dist = [5, 4, 3, 2, 1].map((s) => ({ star: s, count: all.filter((r) => r.rating === s).length }));
    const max = Math.max(...dist.map((d) => d.count));
    const sentiment = [
      { name: "Positive", value: all.filter((r) => r.sentiment === "positive").length, color: "#22C55E" },
      { name: "Neutral", value: all.filter((r) => r.sentiment === "neutral").length, color: "#F59E0B" },
      { name: "Negative", value: all.filter((r) => r.sentiment === "negative").length, color: "#F2654E" },
    ];
    return `<div class="rv-summary">
      <div class="rv-score">
        <div class="rv-score__num">${avg}</div>
        ${ui.stars(Math.round(avg), { size: 18 })}
        <div class="rv-score__count">${all.length} reviews</div>
      </div>
      <div class="rv-dist">${dist.map((d) => `<div class="rv-dist__row"><span class="rv-dist__star">${d.star}${icon("star", { size: 12 })}</span><div class="rv-dist__track"><div class="rv-dist__fill" style="width:${max ? (d.count / max) * 100 : 0}%"></div></div><span class="rv-dist__count">${d.count}</span></div>`).join("")}</div>
      <div class="rv-sentiment"><div class="donut-wrap donut-wrap--sm">${charts.donut({ data: sentiment, size: 132, thickness: 18, center: Math.round((sentiment[0].value / all.length) * 100) + "%", centerSub: "positive" })}</div>${charts.legend(sentiment.map((s) => ({ name: s.name, color: s.color })))}</div>
    </div>`;
  }

  const reviews = {
    title: "Customer Reviews",
    render() {
      const products = ["All", ...Array.from(new Set(D.reviews.map((r) => r.product)))];
      const actions = btn("Request reviews", { icon: "send", variant: "primary", attrs: "data-request" });
      const toolbar = `<div class="filterbar">
        <div class="filterbar__search">${icon("search", { size: 18, class: "filterbar__searchicon" })}<input class="input" data-rv-search placeholder="Search reviews…" value="${escapeHtml(reviewState.q)}"/></div>
        <div class="filterbar__controls">
          ${ui.segmented([{ value: "All", label: "All" }, { value: "5", label: "5★" }, { value: "4", label: "4★" }, { value: "3", label: "3★" }, { value: "2", label: "2★" }, { value: "1", label: "1★" }], reviewState.rating, { attrs: "data-rv-rating" })}
          <label class="select-wrap"><select class="select" data-rv-product>${products.map((p) => `<option ${reviewState.product === p ? "selected" : ""}>${escapeHtml(p)}</option>`).join("")}</select></label>
          <label class="select-wrap"><select class="select" data-rv-sort>
            <option value="recent" ${reviewState.sort === "recent" ? "selected" : ""}>Most recent</option>
            <option value="highest" ${reviewState.sort === "highest" ? "selected" : ""}>Highest rated</option>
            <option value="lowest" ${reviewState.sort === "lowest" ? "selected" : ""}>Lowest rated</option>
            <option value="helpful" ${reviewState.sort === "helpful" ? "selected" : ""}>Most helpful</option>
          </select></label>
        </div>
      </div>`;
      return pageHead({ title: "Customer Reviews", sub: "What your customers are saying", actions }) +
        panel("Overview", reviewsSummary(), { class: "panel--summary" }) +
        toolbar +
        `<div class="rv-list" data-rv-list>${reviewsFiltered().map(reviewCard).join("")}</div>`;
    },
    init(root) {
      const redo = () => { qs("[data-rv-list]", root).innerHTML = reviewsFiltered().map(reviewCard).join(""); };
      const search = qs("[data-rv-search]", root);
      on(search, "input", App.debounce(() => { reviewState.q = search.value; redo(); }, 160));
      on(root, "click", "[data-rv-rating] .segmented__btn", (e, t) => { reviewState.rating = t.dataset.seg; qsa("[data-rv-rating] .segmented__btn", root).forEach((b) => b.classList.toggle("is-active", b === t)); redo(); });
      on(root, "change", "[data-rv-product]", (e, t) => { reviewState.product = t.value; redo(); });
      on(root, "change", "[data-rv-sort]", (e, t) => { reviewState.sort = t.value; redo(); });
      on(root, "click", "[data-helpful]", (e, t) => {
        const r = D.reviews.find((x) => x.id === t.dataset.helpful);
        if (!r) return;
        if (t.classList.contains("is-on")) { r.helpful--; t.classList.remove("is-on"); } else { r.helpful++; t.classList.add("is-on"); }
        qs("[data-helpful-count]", t).textContent = r.helpful;
      });
      on(root, "click", "[data-reply]", (e, t) => openReply(t.dataset.reply, root, redo));
      on(root, "click", "[data-request]", () => ui.toast("Review request sent to 24 customers", { type: "success" }));
    },
  };

  function openReply(id, root, redo) {
    const r = D.reviews.find((x) => x.id === id);
    if (!r) return;
    ui.modal({
      title: "Reply to review", subtitle: `${r.author} · ${r.rating}★`,
      size: "sm",
      body: `<div class="reply-quote">${ui.stars(r.rating, { size: 14 })}<p>${escapeHtml(r.body)}</p></div><form data-form>${ui.field({ label: "Your reply", name: "reply", type: "textarea", rows: 4, required: true, value: r.reply ? r.reply.body : "", placeholder: "Write a thoughtful response…" })}</form>`,
      footer: `<button class="btn btn--ghost" data-act="cancel">Cancel</button><button class="btn btn--primary" data-act="send">Post reply</button>`,
      onMount(rootEl, ctrl) {
        on(rootEl, "click", '[data-act="cancel"]', ctrl.close);
        on(rootEl, "click", '[data-act="send"]', () => {
          const { valid, values } = ui.validate(qs("[data-form]", rootEl));
          if (!valid) return;
          r.reply = { author: D.currentUser.name, date: App.now(), body: values.reply };
          r.replied = true;
          ctrl.close();
          redo();
          ui.toast("Reply posted", { type: "success" });
        });
      },
    });
  }

  /* ====================================================================
     SETTINGS
     ==================================================================== */
  const settings = {
    title: "Settings",
    render() {
      const u = D.currentUser;
      const tabs = ui.tabs([
        { value: "profile", label: "Profile" }, { value: "notifications", label: "Notifications" },
        { value: "appearance", label: "Appearance" }, { value: "security", label: "Security" }, { value: "billing", label: "Billing" },
      ], "profile");
      const profile = `<div class="tabpane" data-pane="profile">${panel("Profile", `
        <div class="profile-head">${ui.faceAvatar(72)}<div class="profile-head__main"><h3>${escapeHtml(u.name)}</h3><p>${escapeHtml(u.role)} · ${escapeHtml(u.email)}</p></div><button class="btn btn--secondary btn--sm" data-avatar>${icon("upload", { size: 16 })}Change photo</button></div>
        <form class="form-grid" data-profile-form>
          ${ui.field({ label: "Full name", name: "name", value: u.name, required: true })}
          ${ui.field({ label: "Email", name: "email", type: "email", value: u.email, required: true })}
          ${ui.field({ label: "Role", name: "role", value: u.role })}
          ${ui.field({ label: "Phone", name: "phone", value: "+1 (415) 555-0132" })}
          ${ui.field({ label: "Timezone", name: "tz", type: "select", value: "Pacific (US)", options: ["Pacific (US)", "Eastern (US)", "GMT (London)", "CET (Berlin)", "JST (Tokyo)"] })}
          ${ui.field({ label: "Language", name: "lang", type: "select", options: ["English", "Spanish", "German", "French", "Japanese"] })}
        </form>`, { actions: `<button class="btn btn--primary btn--sm" data-save-profile>Save changes</button>` })}</div>`;

      const notifPrefs = [
        ["New deals", "Get notified when a deal is created or won", true],
        ["Customer reviews", "Alerts for new reviews and replies", true],
        ["Task reminders", "Reminders for tasks due today", true],
        ["Weekly summary", "A digest of your sales performance", false],
        ["Product updates", "News about Kerso features", false],
        ["Mentions", "When a teammate @mentions you", true],
      ];
      const notif = `<div class="tabpane" data-pane="notifications" hidden>${panel("Notification preferences", `<ul class="pref-list">${notifPrefs.map((p, i) => `<li class="pref"><div class="pref__main"><p class="pref__title">${p[0]}</p><p class="pref__desc">${p[1]}</p></div>${ui.toggle("notif" + i, p[2])}</li>`).join("")}</ul>`, {})}</div>`;

      const theme = App.store.get("theme", "light");
      const accent = App.store.get("accent", "#4F46E5");
      const accents = ["#4F46E5", "#7C3AED", "#2563EB", "#0EA5E9", "#059669", "#E11D48", "#F59E0B"];
      const appearance = `<div class="tabpane" data-pane="appearance" hidden>
        ${panel("Theme", `<div class="theme-pick">${[{ v: "light", l: "Light", i: "sun" }, { v: "dark", l: "Dark", i: "moon" }, { v: "system", l: "System", i: "palette" }].map((t) => `<button class="theme-opt ${theme === t.v ? "is-active" : ""}" data-theme-opt="${t.v}"><span class="theme-opt__preview theme-opt__preview--${t.v}">${icon(t.i, { size: 18 })}</span><span>${t.l}</span></button>`).join("")}</div>`, {})}
        ${panel("Accent color", `<div class="accent-pick">${accents.map((a) => `<button class="accent-dot ${accent === a ? "is-active" : ""}" data-accent="${a}" style="background:${a}" aria-label="Accent ${a}">${accent === a ? icon("check", { size: 14, stroke: 2.6 }) : ""}</button>`).join("")}</div>`, { sub: "Personalize the highlight color used across the app" })}
      </div>`;

      const security = `<div class="tabpane" data-pane="security" hidden>
        ${panel("Password", `<form class="form-grid" data-pwd-form>${ui.field({ label: "Current password", name: "cur", type: "password", placeholder: "••••••••" })}${ui.field({ label: "New password", name: "new", type: "password", placeholder: "••••••••" })}${ui.field({ label: "Confirm new password", name: "confirm", type: "password", placeholder: "••••••••", wide: true })}</form>`, { actions: `<button class="btn btn--primary btn--sm" data-save-pwd>Update password</button>` })}
        ${panel("Two-factor authentication", `<ul class="pref-list"><li class="pref"><div class="pref__main"><p class="pref__title">Authenticator app</p><p class="pref__desc">Use an app like Google Authenticator</p></div>${ui.toggle("twofa", true)}</li><li class="pref"><div class="pref__main"><p class="pref__title">SMS codes</p><p class="pref__desc">Receive codes by text message</p></div>${ui.toggle("sms", false)}</li></ul>`, {})}
        ${panel("Active sessions", `<ul class="mini-list">${[["MacBook Pro · San Francisco", "Current session", true], ["iPhone 15 · San Francisco", "2 hours ago", false], ["Chrome · New York", "Yesterday", false]].map((s) => `<li class="mini-list__item"><span class="mini-list__icon">${icon("shield", { size: 16 })}</span><div class="mini-list__main"><div class="cell-strong">${s[0]}</div><div class="cell-sub">${s[1]}</div></div>${s[2] ? ui.badge("Active", "success") : `<button class="btn btn--ghost btn--sm" data-revoke>Revoke</button>`}</li>`).join("")}</ul>`, {})}
      </div>`;

      const invoices = [["Jun 2024", "$49.00", "Paid"], ["May 2024", "$49.00", "Paid"], ["Apr 2024", "$49.00", "Paid"], ["Mar 2024", "$49.00", "Paid"]];
      const billing = `<div class="tabpane" data-pane="billing" hidden>
        ${panel("Current plan", `<div class="plan"><div class="plan__main"><span class="plan__badge">Pro</span><h3 class="plan__price">$49<span>/month</span></h3><p class="plan__desc">Unlimited contacts, advanced analytics, priority support.</p></div><div class="plan__actions">${btn("Change plan", { variant: "secondary", size: "sm" })}${btn("Cancel", { variant: "ghost", size: "sm" })}</div></div>`, {})}
        ${panel("Payment method", `<div class="paycard"><span class="paycard__icon">${icon("credit-card", { size: 22 })}</span><div class="paycard__main"><div class="cell-strong">Visa ending 4242</div><div class="cell-sub">Expires 08/27</div></div><button class="btn btn--ghost btn--sm" data-paycard>Update</button></div>`, {})}
        ${panel("Billing history", `<div class="table-wrap"><table class="table"><thead><tr><th>Period</th><th>Amount</th><th>Status</th><th class="ta-right">Invoice</th></tr></thead><tbody>${invoices.map((iv) => `<tr><td>${iv[0]}</td><td>${iv[1]}</td><td>${ui.badge(iv[2], "success")}</td><td class="ta-right"><button class="btn btn--ghost btn--sm" data-invoice>${icon("download", { size: 15 })}PDF</button></td></tr>`).join("")}</tbody></table></div>`, { flush: true })}
      </div>`;

      return pageHead({ title: "Settings", sub: "Manage your account and preferences" }) +
        `<div class="tabbed tabbed--page">${tabs}<div class="settings-panes">${profile}${notif}${appearance}${security}${billing}</div></div>`;
    },
    init(root) {
      on(root, "click", "[data-save-profile]", () => {
        const { valid, values } = ui.validate(qs("[data-profile-form]", root));
        if (!valid) return;
        D.currentUser.name = values.name; D.currentUser.email = values.email; D.currentUser.role = values.role;
        ui.toast("Profile saved", { type: "success" });
        App.renderShell && App.renderShell();
      });
      on(root, "click", "[data-save-pwd]", () => {
        const { values } = ui.validate(qs("[data-pwd-form]", root));
        if (values.new && values.new !== values.confirm) { ui.toast("Passwords do not match", { type: "error" }); return; }
        ui.toast("Password updated", { type: "success" });
      });
      on(root, "click", "[data-theme-opt]", (e, t) => {
        qsa("[data-theme-opt]", root).forEach((b) => b.classList.toggle("is-active", b === t));
        App.setTheme(t.dataset.themeOpt);
        ui.toast("Theme updated", { type: "success" });
      });
      on(root, "click", "[data-accent]", (e, t) => {
        qsa("[data-accent]", root).forEach((b) => { b.classList.toggle("is-active", b === t); b.innerHTML = b === t ? icon("check", { size: 14, stroke: 2.6 }) : ""; });
        App.setAccent(t.dataset.accent);
      });
      on(root, "change", ".pref input,[name^=notif],[name=twofa],[name=sms]", () => ui.toast("Preference saved", { type: "success" }));
      on(root, "click", "[data-revoke]", (e, t) => { t.closest(".mini-list__item").style.opacity = ".4"; t.disabled = true; t.textContent = "Revoked"; ui.toast("Session revoked", { type: "info" }); });
      on(root, "click", "[data-invoice]", () => ui.toast("Invoice downloaded", { type: "success" }));
      on(root, "click", "[data-avatar],[data-paycard]", () => ui.toast("Coming soon", { type: "info" }));
    },
  };

  App.pages = { dashboard, explore, analytics, customers, reviews, settings };
  App.openCustomerDrawer = openCustomerDrawer;
  App.openDealDrawer = openDealDrawer;
  App.openCompanyDrawer = openCompanyDrawer;
})(window.App);
