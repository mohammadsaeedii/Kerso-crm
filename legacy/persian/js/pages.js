/* ============================================================
   کرسو CRM — نماهای صفحه (نسخهٔ فارسی)
   هر صفحه: { title, render() -> html, init(root) -> wire }
   کمک‌کننده‌های مشترک (pageHead، panel) و کشوهای جزئیات اینجا هستند.
   ============================================================ */
(function (App) {
  "use strict";
  const { fmt, icon, escapeHtml, qs, qsa, on, faDigits } = App;
  const ui = App.ui;
  const charts = App.charts;
  const D = App.data;

  /* نگاشت اولویت (کلید CSS انگلیسی می‌ماند، نمایش فارسی) */
  const PRIORITY = { high: "بالا", medium: "متوسط", low: "پایین" };
  /* نگاشت اقدام سریع کشوی مشتری */
  const QUICK = { call: "تماس", note: "یادداشت", deal: "معامله" };

  /* ---------------- کمک‌کننده‌های چیدمان مشترک ---------------- */
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
     داشبورد
     ==================================================================== */
  const dashState = { range: "12M", hidden: new Set() };

  function renderRevenue() {
    const months = D.revenueSeries;
    let labels, cur, prev;
    if (dashState.range === "6M") {
      const s = months.slice(-6);
      labels = s.map((m) => m.label); cur = s.map((m) => m.current); prev = s.map((m) => m.previous);
    } else if (dashState.range === "Quarterly") {
      labels = ["بهار", "تابستان", "پاییز", "زمستان"];
      cur = [0, 1, 2, 3].map((q) => App.sum(months.slice(q * 3, q * 3 + 3), "current"));
      prev = [0, 1, 2, 3].map((q) => App.sum(months.slice(q * 3, q * 3 + 3), "previous"));
    } else {
      labels = months.map((m) => m.label); cur = months.map((m) => m.current); prev = months.map((m) => m.previous);
    }
    const series = [];
    if (!dashState.hidden.has("امسال")) series.push({ name: "امسال", color: "#4F46E5", values: cur });
    if (!dashState.hidden.has("پارسال")) series.push({ name: "پارسال", color: "#CBD2E0", values: prev, fill: false, dashed: true });
    return charts.areaLine({ labels, series, money: true, height: 280 });
  }

  function revenueLegend() {
    const items = [{ name: "امسال", color: "#4F46E5" }, { name: "پارسال", color: "#CBD2E0" }];
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
          <div class="pipe__top"><span class="pipe__name"><span class="pipe__dot" style="background:${s.color}"></span>${s.stage}</span><span class="pipe__count">${faDigits(s.count)} معامله</span></div>
          <div class="pipe__bar"><div class="pipe__fill" style="width:${pct.toFixed(1)}%;background:${s.color}"></div></div>
          <div class="pipe__val">${fmt.money(s.value)} <span class="pipe__pct">${faDigits(pct.toFixed(0))}٪</span></div>
        </li>`;
      })
      .join("");
    return `<ul class="pipe-list">${rows}</ul>
      <div class="pipe-total"><span>ارزش کل قیف فروش</span><b>${fmt.money(total)}</b></div>`;
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
              <span class="task__pri task__pri--${t.priority}">${PRIORITY[t.priority] || t.priority}</span>
              <span class="task__due ${overdue ? "is-overdue" : ""}">${icon("clock", { size: 13 })}${overdue ? "سررسید گذشته · " : ""}${fmt.relTime(t.due)}</span>
            </div>
          </div>
          ${ui.avatar(t.assignee, "indigo", 26)}
        </li>`;
      })
      .join("");
    return `<ul class="task-list">${rows}</ul>
      <form class="task-add" data-task-add><input class="input input--sm" placeholder="افزودن وظیفه…" name="title" aria-label="وظیفهٔ جدید"/><button class="btn btn--primary btn--sm" type="submit">${icon("plus", { size: 16 })}افزودن</button></form>`;
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
    { key: "title", label: "معامله", render: (r) => `<div class="cell-strong">${escapeHtml(r.title)}</div><div class="cell-sub">${escapeHtml(r.id)}</div>` },
    { key: "company", label: "شرکت" },
    { key: "owner", label: "مسئول", render: (r) => `<span class="cell-user">${ui.avatar(r.owner, r.ownerColor, 26)}<span>${escapeHtml(r.owner)}</span></span>` },
    { key: "value", label: "ارزش", align: "right", render: (r) => `<b>${fmt.money(r.value)}</b>`, sortVal: (r) => r.value },
    { key: "stage", label: "مرحله", render: (r) => ui.badge(r.stage) },
    { key: "probability", label: "احتمال", width: "140px", render: (r) => `<div class="cell-prob">${ui.progress(r.probability, { small: true })}<span>${faDigits(r.probability)}٪</span></div>`, sortVal: (r) => r.probability },
    { key: "close", label: "تاریخ بسته‌شدن", render: (r) => fmt.date(r.close), sortVal: (r) => +r.close, nowrap: true },
  ];

  const dashboard = {
    title: "داشبورد",
    render() {
      const widgets = App.store.get("dash:widgets", { revenue: true, pipeline: true, deals: true, activity: true, tasks: true, created: true });
      App._dashWidgets = widgets;
      const actions =
        ui.segmented([{ value: "6M", label: "۶ ماه" }, { value: "12M", label: "۱۲ ماه" }, { value: "Quarterly", label: "فصلی" }], dashState.range, { attrs: 'data-range' }) +
        btn("مدیریت داشبورد", { icon: "gear", attrs: 'data-manage' });
      const kpis = `<section class="cards" aria-label="شاخص‌های کلیدی">${D.kpis.map((k) => ui.kpiCard(k)).join("")}</section>`;

      const grid = `<div class="dash-grid">
        ${widgets.revenue ? `<div class="dash-col-8">${panel("نمای کلی درآمد", `<div data-revenue>${renderRevenue()}</div>`, { sub: "درآمد ماهانهٔ تکرارشونده در مقایسه با سال قبل", actions: revenueLegend() })}</div>` : ""}
        ${widgets.pipeline ? `<div class="dash-col-4">${panel("قیف فروش", pipelineCard(), { actions: `<a class="panel__link" href="#/explore">کاوش</a>` })}</div>` : ""}
        ${widgets.deals ? `<div class="dash-col-8">${panel("معاملات اخیر", dealsTableCard(), { actions: `<a class="panel__link" href="#/customers">مشاهدهٔ همه</a>`, flush: true })}</div>` : ""}
        ${widgets.activity ? `<div class="dash-col-4">${panel("فعالیت", activityCard(), { actions: `<button class="panel__link" data-noop>مشاهدهٔ همه</button>` })}</div>` : ""}
        ${widgets.created ? `<div class="dash-col-8">${panel("معاملات ایجادشده", `<div class="panel__legend">${charts.legend([{ name: "برنده‌شده", color: "#4F46E5" }, { name: "ازدست‌رفته", color: "#E2E6EE" }])}</div>${charts.bars({ labels: D.dealsCreated.map((d) => d.label), series: [{ name: "برنده‌شده", color: "#4F46E5", values: D.dealsCreated.map((d) => d.won) }, { name: "ازدست‌رفته", color: "#E2E6EE", values: D.dealsCreated.map((d) => d.lost) }], height: 260 })}`, {})}</div>` : ""}
        ${widgets.tasks ? `<div class="dash-col-4">${panel("وظایف", tasksCard(), { sub: `${faDigits(D.tasks.filter((t) => !t.done).length)} باز` })}</div>` : ""}
      </div>`;

      return pageHead({ title: "داشبورد", sub: "آخرین ویرایش، ۴ تیر ۱۴۰۳", actions }) + kpis + grid;
    },
    init(root) {
      charts.bind(root);
      // جدول معاملات اخیر
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
      // تغییر بازه
      on(root, "click", "[data-range] .segmented__btn", (e, t) => {
        dashState.range = t.dataset.seg;
        qsa("[data-range] .segmented__btn", root).forEach((b) => b.classList.toggle("is-active", b === t));
        const host = qs("[data-revenue]", root);
        if (host) { host.innerHTML = renderRevenue(); charts.bind(host); }
      });
      // تغییر وضعیت راهنما
      on(root, "click", "[data-legend]", (e, t) => {
        const name = t.dataset.legend;
        if (dashState.hidden.has(name)) dashState.hidden.delete(name); else dashState.hidden.add(name);
        t.classList.toggle("is-off");
        const host = qs("[data-revenue]", root);
        if (host) { host.innerHTML = renderRevenue(); charts.bind(host); }
      });
      // وظایف
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
        ui.toast("وظیفه افزوده شد", { type: "success" });
      });
      // مدیریت داشبورد
      on(root, "click", "[data-manage]", () => openManageDashboard());
      on(root, "click", "[data-noop]", () => ui.toast("نمایش همهٔ فعالیت‌ها", { type: "info" }));
      // منوهای شاخص کلیدی
      on(root, "click", "[data-row-menu]", (e, t) => {
        ui.popover(t, ui.menuList([
          { label: "مشاهدهٔ جزئیات", icon: "eye", value: "view" },
          { label: "مقایسهٔ بازه", icon: "trending-up", value: "compare" },
          "divider",
          { label: "پنهان کردن کارت", icon: "x", value: "hide", danger: true },
        ]), { align: "end", onSelect: (v) => ui.toast(v === "hide" ? "کارت پنهان شد" : "شاخص باز شد", { type: "info" }) });
      });
    },
  };

  function openManageDashboard() {
    const widgets = App.store.get("dash:widgets", { revenue: true, pipeline: true, deals: true, activity: true, tasks: true, created: true });
    const labels = { revenue: "نمای کلی درآمد", pipeline: "قیف فروش", deals: "معاملات اخیر", created: "معاملات ایجادشده", activity: "جریان فعالیت", tasks: "وظایف" };
    const body = `<p class="modal__hint">انتخاب کنید کدام ابزارک‌ها در داشبورد شما نمایش داده شوند.</p>
      <div class="widget-toggles">${Object.keys(labels)
        .map((k) => `<label class="widget-toggle"><span class="widget-toggle__icon">${icon("grid", { size: 18 })}</span><span class="widget-toggle__label">${labels[k]}</span>${ui.toggle(k, widgets[k])}</label>`)
        .join("")}</div>`;
    ui.modal({
      title: "مدیریت داشبورد",
      subtitle: "شخصی‌سازی فضای کاری",
      size: "sm",
      body,
      footer: `<button class="btn btn--ghost" data-act="cancel">انصراف</button><button class="btn btn--primary" data-act="save">ذخیره تغییرات</button>`,
      onMount(rootEl, ctrl) {
        on(rootEl, "click", '[data-act="cancel"]', ctrl.close);
        on(rootEl, "click", '[data-act="save"]', () => {
          const next = {};
          qsa("input[type=checkbox]", rootEl).forEach((c) => (next[c.name] = c.checked));
          App.store.set("dash:widgets", next);
          ctrl.close();
          ui.toast("داشبورد به‌روزرسانی شد", { type: "success" });
          App.router.reload();
        });
      },
    });
  }

  /* ====================================================================
     کشوی معامله
     ==================================================================== */
  function openDealDrawer(deal) {
    const head = `<div class="drawer-id">
      <div class="drawer-id__main"><h2 class="drawer__title">${escapeHtml(deal.title)}</h2><p class="drawer-id__sub">${escapeHtml(deal.company)} · ${escapeHtml(deal.id)}</p></div>
      ${ui.badge(deal.stage)}</div>`;
    const body = `<div class="deal-value">${fmt.money(deal.value)}<span>ارزش معامله</span></div>
      <div class="detail-grid">
        ${detailRow("مسئول", `<span class="cell-user">${ui.avatar(deal.owner, deal.ownerColor, 24)}${escapeHtml(deal.owner)}</span>`)}
        ${detailRow("مرحله", ui.badge(deal.stage))}
        ${detailRow("احتمال", `<div class="cell-prob">${ui.progress(deal.probability, { small: true })}<span>${faDigits(deal.probability)}٪</span></div>`)}
        ${detailRow("تاریخ بسته‌شدن", fmt.date(deal.close))}
        ${detailRow("وضعیت", ui.badge(deal.status))}
      </div>
      <h4 class="drawer-section">پیشرفت مراحل</h4>
      <ol class="stage-track">${D.STAGES.map((s, i) => {
        const reached = D.STAGES.indexOf(deal.stage) >= i;
        return `<li class="stage-track__step ${reached ? "is-done" : ""}"><span class="stage-track__dot">${reached ? icon("check", { size: 12, stroke: 2.4 }) : faDigits(i + 1)}</span><span>${s}</span></li>`;
      }).join("")}</ol>
      <h4 class="drawer-section">فعالیت اخیر</h4>
      <ul class="act-list act-list--compact">${D.activities.slice(0, 4).map((a) => `<li class="act"><span class="act__dot act__dot--${a.color}">${icon(actIcon(a.type), { size: 13 })}</span><div class="act__body"><p class="act__text">${a.text}</p><span class="act__time">${fmt.relTime(a.time)}</span></div></li>`).join("")}</ul>`;
    const footer = `<button class="btn btn--ghost" data-d="edit">${icon("edit", { size: 18 })}ویرایش</button><button class="btn btn--primary" data-d="won">${icon("check-circle", { size: 18 })}ثبت به‌عنوان برنده</button>`;
    ui.drawer({
      head, body, footer, width: 460,
      onMount(rootEl, ctrl) {
        on(rootEl, "click", '[data-d="won"]', () => { ctrl.close(); ui.toast("معامله به‌عنوان برنده ثبت شد 🎉", { type: "success", desc: deal.title }); });
        on(rootEl, "click", '[data-d="edit"]', () => ui.toast("ویرایش معامله", { type: "info" }));
      },
    });
  }
  const detailRow = (label, val) => `<div class="detail-row"><span class="detail-row__label">${escapeHtml(label)}</span><span class="detail-row__val">${val}</span></div>`;

  /* ====================================================================
     کاوش کسب‌وکار
     ==================================================================== */
  const exploreState = { view: "grid", q: "", industry: "همه", status: "همه", sort: "revenue" };

  function exploreFiltered() {
    let list = D.companies.slice();
    if (exploreState.q) {
      const q = exploreState.q.toLowerCase();
      list = list.filter((c) => c.name.toLowerCase().includes(q) || c.industry.toLowerCase().includes(q) || c.city.toLowerCase().includes(q));
    }
    if (exploreState.industry !== "همه") list = list.filter((c) => c.industry === exploreState.industry);
    if (exploreState.status !== "همه") list = list.filter((c) => c.status === exploreState.status);
    const s = exploreState.sort;
    list.sort((a, b) => (s === "name" ? a.name.localeCompare(b.name, "fa") : s === "growth" ? b.growth - a.growth : s === "deals" ? b.deals - a.deals : b.revenue - a.revenue));
    return list;
  }

  function companyCard(c) {
    return `<article class="biz-card" data-company="${c.id}" tabindex="0" role="button">
      <div class="biz-card__head">
        ${companyLogo(c.name, c.logo, 46)}
        <div class="biz-card__menu">${ui.badge(c.status)}</div>
      </div>
      <h3 class="biz-card__name">${escapeHtml(c.name)}</h3>
      <p class="biz-card__meta">${escapeHtml(c.industry)} · ${escapeHtml(c.city)}، ${escapeHtml(c.country)}</p>
      <div class="biz-card__stats">
        <div><span class="biz-stat__num">${fmt.moneyCompact(c.revenue)}</span><span class="biz-stat__lbl">درآمد</span></div>
        <div><span class="biz-stat__num ${c.growth >= 0 ? "pos" : "neg"}">${fmt.pct(c.growth)}</span><span class="biz-stat__lbl">رشد</span></div>
        <div><span class="biz-stat__num">${faDigits(c.contacts)}</span><span class="biz-stat__lbl">مخاطبین</span></div>
      </div>
      <div class="biz-card__foot">
        <span class="biz-card__rating">${icon("star", { size: 14 })}${faDigits(c.rating)}</span>
        <span class="biz-card__deals">${faDigits(c.deals)} معاملهٔ باز</span>
      </div>
    </article>`;
  }

  const explore = {
    title: "کاوش کسب‌وکار",
    render() {
      const stats = `<section class="cards cards--mini">${D.exploreStats
        .map((s) => `<article class="card stat-mini"><p class="card__label">${escapeHtml(s.label)}</p><p class="stat-mini__value">${s.money ? fmt.moneyCompact(s.value) : fmt.num(s.value)}${s.suffix || ""}</p><p class="stat-mini__sub">${escapeHtml(s.sub)}</p></article>`)
        .join("")}</section>`;
      const actions = ui.segmented([{ value: "grid", icon: "grid" }, { value: "list", icon: "list" }], exploreState.view, { attrs: "data-view" }) + btn("افزودن شرکت", { icon: "plus", variant: "primary", attrs: "data-add-company" });
      const toolbar = filterBar();
      return pageHead({ title: "کاوش کسب‌وکار", sub: "کشف و مدیریت شرکت‌ها در سراسر شبکهٔ شما", actions }) + stats + toolbar + `<div data-explore-results>${renderResults()}</div>`;
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
      <div class="filterbar__search">${icon("search", { size: 18, class: "filterbar__searchicon" })}<input class="input" data-explore-search placeholder="جستجوی شرکت‌ها…" value="${escapeHtml(exploreState.q)}"/></div>
      <div class="filterbar__controls">
        <label class="select-wrap"><select class="select" data-explore-industry>${["همه", ...D.INDUSTRIES].map((i) => `<option ${exploreState.industry === i ? "selected" : ""}>${i}</option>`).join("")}</select></label>
        <label class="select-wrap"><select class="select" data-explore-status>${["همه", "مشتری", "بالقوه", "شریک", "ریزش‌کرده"].map((i) => `<option ${exploreState.status === i ? "selected" : ""}>${i}</option>`).join("")}</select></label>
        <label class="select-wrap"><select class="select" data-explore-sort>
          <option value="revenue" ${exploreState.sort === "revenue" ? "selected" : ""}>مرتب‌سازی: درآمد</option>
          <option value="growth" ${exploreState.sort === "growth" ? "selected" : ""}>مرتب‌سازی: رشد</option>
          <option value="deals" ${exploreState.sort === "deals" ? "selected" : ""}>مرتب‌سازی: معاملات باز</option>
          <option value="name" ${exploreState.sort === "name" ? "selected" : ""}>مرتب‌سازی: نام</option>
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
    const count = `<div class="result-count">${faDigits(list.length)} شرکت</div>`;
    if (!list.length) return count + ui.emptyState({ icon: "building", title: "شرکتی یافت نشد", desc: "جستجوی دیگری را امتحان کنید یا فیلترها را پاک کنید." });
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
          { key: "name", label: "شرکت", render: (c) => `<span class="cell-user">${companyLogo(c.name, c.logo, 30)}<span><div class="cell-strong">${escapeHtml(c.name)}</div><div class="cell-sub">${escapeHtml(c.website)}</div></span></span>` },
          { key: "industry", label: "صنعت" },
          { key: "city", label: "موقعیت", render: (c) => `${escapeHtml(c.city)}، ${escapeHtml(c.country)}` },
          { key: "status", label: "وضعیت", render: (c) => ui.badge(c.status) },
          { key: "revenue", label: "درآمد", align: "right", render: (c) => fmt.moneyCompact(c.revenue), sortVal: (c) => c.revenue },
          { key: "growth", label: "رشد", align: "right", render: (c) => `<span class="${c.growth >= 0 ? "pos" : "neg"}">${fmt.pct(c.growth)}</span>`, sortVal: (c) => c.growth },
          { key: "deals", label: "معاملات", align: "right", render: (c) => faDigits(c.deals) },
        ],
        rows: exploreFiltered(),
        pageSize: 10,
        rowClick: (c) => openCompanyDrawer(c),
      });
    }
  }
  // وقتی نمای فهرستی انتخاب شد، میزبان نتایج باید پس از innerHTML جدول را سوار کند
  const _origExploreInit = explore.init;
  explore.init = function (root) {
    _origExploreInit.call(this, root);
    if (exploreState.view === "list") rerender(root);
    // هر بار که نتایج در نمای فهرستی دوباره رندر می‌شوند جدول دوباره سوار شود
    const obsHost = qs("[data-explore-results]", root);
    const remount = () => { if (exploreState.view === "list" && qs("[data-biz-list]", root) && !qs("[data-biz-list] .table", root)) rerender(root); };
    on(root, "change", "[data-explore-industry],[data-explore-status],[data-explore-sort]", remount);
    on(root, "input", "[data-explore-search]", App.debounce(remount, 200));
  };

  function openCompanyDrawer(c) {
    const head = `<div class="drawer-id">${companyLogo(c.name, c.logo, 46)}<div class="drawer-id__main"><h2 class="drawer__title">${escapeHtml(c.name)}</h2><p class="drawer-id__sub">${escapeHtml(c.industry)} · ${escapeHtml(c.city)}، ${escapeHtml(c.country)}</p></div>${ui.badge(c.status)}</div>`;
    const related = D.customers.filter((x) => x.company === c.name);
    const dealsFor = D.deals.filter((x) => x.company === c.name);
    const body = `<div class="tabbed">
      ${ui.tabs([{ value: "ov", label: "نمای کلی" }, { value: "ct", label: "مخاطبین", count: related.length }, { value: "dl", label: "معاملات", count: dealsFor.length }], "ov")}
      <div class="tabpane" data-pane="ov">
        <p class="drawer-desc">${escapeHtml(c.description)}</p>
        <div class="detail-grid">
          ${detailRow("درآمد سالانه", `<b>${fmt.money(c.revenue)}</b>`)}
          ${detailRow("رشد", `<span class="${c.growth >= 0 ? "pos" : "neg"}">${fmt.pct(c.growth)}</span>`)}
          ${detailRow("اندازهٔ شرکت", c.size + " نفر")}
          ${detailRow("سال تأسیس", faDigits(c.founded))}
          ${detailRow("امتیاز", `<span class="cell-rating">${ui.stars(+c.rating)}<span>${faDigits(c.rating)}</span></span>`)}
          ${detailRow("وب‌سایت", `<a class="link" href="https://${c.website}" target="_blank" rel="noopener">${escapeHtml(c.website)} ${icon("external-link", { size: 14 })}</a>`)}
        </div>
      </div>
      <div class="tabpane" data-pane="ct" hidden>${related.length ? `<ul class="mini-list">${related.map((p) => `<li class="mini-list__item">${ui.avatar(p.name, p.avatar, 34)}<div class="mini-list__main"><div class="cell-strong">${escapeHtml(p.name)}</div><div class="cell-sub">${escapeHtml(p.email)}</div></div>${ui.badge(p.status)}</li>`).join("")}</ul>` : ui.emptyState({ icon: "users", title: "هنوز مخاطبی نیست" })}</div>
      <div class="tabpane" data-pane="dl" hidden>${dealsFor.length ? `<ul class="mini-list">${dealsFor.map((d) => `<li class="mini-list__item"><span class="mini-list__icon">${icon("briefcase", { size: 16 })}</span><div class="mini-list__main"><div class="cell-strong">${escapeHtml(d.title)}</div><div class="cell-sub">${fmt.money(d.value)} · ${escapeHtml(d.stage)}</div></div>${ui.badge(d.status)}</li>`).join("")}</ul>` : ui.emptyState({ icon: "briefcase", title: "معاملهٔ بازی نیست" })}</div>
    </div>`;
    const footer = `<button class="btn btn--ghost" data-c="msg">${icon("message", { size: 18 })}پیام</button><button class="btn btn--primary" data-c="deal">${icon("plus", { size: 18 })}معاملهٔ جدید</button>`;
    ui.drawer({ head, body, footer, width: 480, onMount(rootEl, ctrl) {
      on(rootEl, "click", '[data-c="deal"]', () => { ctrl.close(); ui.toast("معاملهٔ جدید آغاز شد", { type: "success", desc: c.name }); });
      on(rootEl, "click", '[data-c="msg"]', () => ui.toast("در حال باز کردن گفتگو…", { type: "info" }));
    } });
  }

  function openAddCompany(root) {
    const body = `<form class="form-grid" data-form>
      ${ui.field({ label: "نام شرکت", name: "name", required: true, placeholder: "مثلاً شرکت نمونه", wide: true })}
      ${ui.field({ label: "صنعت", name: "industry", type: "select", options: D.INDUSTRIES })}
      ${ui.field({ label: "وضعیت", name: "status", type: "select", options: ["مشتری", "بالقوه", "شریک"] })}
      ${ui.field({ label: "شهر", name: "city", placeholder: "تهران" })}
      ${ui.field({ label: "کشور", name: "country", placeholder: "ایران" })}
      ${ui.field({ label: "وب‌سایت", name: "website", placeholder: "example.com", wide: true })}
    </form>`;
    ui.modal({
      title: "افزودن شرکت", subtitle: "ایجاد حساب جدید در فضای کاری", body,
      footer: `<button class="btn btn--ghost" data-act="cancel">انصراف</button><button class="btn btn--primary" data-act="save">افزودن شرکت</button>`,
      onMount(rootEl, ctrl) {
        on(rootEl, "click", '[data-act="cancel"]', ctrl.close);
        on(rootEl, "click", '[data-act="save"]', () => {
          const form = qs("[data-form]", rootEl);
          const { valid, values } = ui.validate(form);
          if (!valid) return;
          D.companies.unshift({ id: App.uid("B"), name: values.name, industry: values.industry, status: values.status, city: values.city || "—", country: values.country || "—", revenue: 0, growth: 0, contacts: 0, deals: 0, website: values.website || "example.com", logo: D.avatarColor(), founded: 2024, rating: "5.0", size: "۱–۱۰", description: "شرکت تازه‌افزوده‌شده." });
          ctrl.close();
          ui.toast("شرکت افزوده شد", { type: "success", desc: values.name });
          App.router.reload();
        });
      },
    });
  }

  /* ====================================================================
     تحلیل‌ها
     ==================================================================== */
  const analyticsState = { range: "30D" };
  const analytics = {
    title: "تحلیل‌ها",
    render() {
      const A = D.analytics;
      const actions = ui.segmented([{ value: "7D", label: "۷ روز" }, { value: "30D", label: "۳۰ روز" }, { value: "12M", label: "۱۲ ماه" }], analyticsState.range, { attrs: "data-arange" }) + btn("خروجی", { icon: "download", attrs: "data-export" });
      const kpis = `<section class="cards" aria-label="شاخص‌های تحلیلی">${A.kpis.map((k) => ui.kpiCard(k)).join("")}</section>`;
      const grid = `<div class="dash-grid">
        <div class="dash-col-8">${panel("بازدیدکنندگان", `<div data-visitors>${charts.areaLine({ labels: A.visitors.map((v) => v.label), series: [{ name: "بازدیدکنندگان", color: "#4F46E5", values: A.visitors.map((v) => v.value) }], height: 280 })}</div>`, { sub: "بازدیدکنندگان یکتا در بازهٔ انتخاب‌شده" })}</div>
        <div class="dash-col-4">${panel("منابع ترافیک", `<div class="donut-wrap">${charts.donut({ data: A.sources, size: 188, center: "۱۰۰٪", centerSub: "ترافیک" })}</div>${charts.legend(A.sources.map((s) => ({ name: `${s.name} · ${faDigits(s.value)}٪`, color: s.color })))}`, {})}</div>
        <div class="dash-col-6">${panel("قیف تبدیل", charts.funnel({ data: A.funnel }), { sub: "از بازدید تا مشتری" })}</div>
        <div class="dash-col-6">${panel("برترین فروشندگان", charts.hbars({ data: A.reps.map((r) => ({ name: r.name, value: r.value })), money: true }), { actions: `<a class="panel__link" href="#/customers">تیم</a>` })}</div>
        <div class="dash-col-4">${panel("درآمد بر اساس دسته", charts.hbars({ data: A.categories, money: true }), {})}</div>
        <div class="dash-col-4">${panel("فروش بر اساس منطقه", charts.hbars({ data: A.regions, pct: true }), {})}</div>
        <div class="dash-col-4">${panel("دستگاه‌ها", `<div class="donut-wrap">${charts.donut({ data: A.devices, size: 168, center: "۶۲٪", centerSub: "دسکتاپ" })}</div>${charts.legend(A.devices.map((s) => ({ name: `${s.name} · ${faDigits(s.value)}٪`, color: s.color })))}`, {})}</div>
        <div class="dash-col-12">${panel("کوهورت‌های ماندگاری", charts.heatmap({ rows: A.cohort, cols: 6 }), { sub: "درصد مشتریان حفظ‌شده بر اساس ماه‌های پس از ثبت‌نام" })}</div>
      </div>`;
      return pageHead({ title: "تحلیل‌ها", sub: "بینش عمیق دربارهٔ عملکرد فروش شما", actions }) + kpis + grid;
    },
    init(root) {
      charts.bind(root);
      on(root, "click", "[data-arange] .segmented__btn", (e, t) => {
        analyticsState.range = t.dataset.seg;
        qsa("[data-arange] .segmented__btn", root).forEach((b) => b.classList.toggle("is-active", b === t));
        ui.toast("بازهٔ زمانی به‌روزرسانی شد", { type: "info" });
      });
      on(root, "click", "[data-export]", () => ui.toast("گزارش خروجی گرفته شد", { type: "success", desc: "analytics-report.csv" }));
    },
  };

  /* ====================================================================
     مشتریان
     ==================================================================== */
  const custState = { status: "همه", q: "" };
  let custTable = null;

  function custColumns() {
    return [
      { key: "name", label: "مشتری", render: (r) => `<span class="cell-user">${ui.avatar(r.name, r.avatar, 36)}<span><div class="cell-strong">${escapeHtml(r.name)}</div><div class="cell-sub">${escapeHtml(r.email)}</div></span></span>` },
      { key: "company", label: "شرکت" },
      { key: "status", label: "وضعیت", render: (r) => ui.badge(r.status) },
      { key: "city", label: "موقعیت", render: (r) => `<span class="cell-loc">${icon("map-pin", { size: 14 })}${escapeHtml(r.city)}</span>`, sortVal: (r) => r.city },
      { key: "value", label: "ارزش", align: "right", render: (r) => `<b>${fmt.money(r.value)}</b>`, sortVal: (r) => r.value },
      { key: "health", label: "سلامت", width: "130px", render: (r) => `<div class="cell-prob">${ui.progress(r.health, { small: true })}<span>${faDigits(r.health)}</span></div>`, sortVal: (r) => r.health },
      { key: "lastContact", label: "آخرین تماس", render: (r) => fmt.relTime(r.lastContact), sortVal: (r) => +r.lastContact, nowrap: true },
    ];
  }

  function custCounts() {
    const by = (s) => D.customers.filter((c) => c.status === s).length;
    return [
      { label: "همهٔ مشتریان", value: D.customers.length, key: "همه", icon: "users" },
      { label: "فعال", value: by("فعال"), key: "فعال", icon: "check-circle" },
      { label: "سرنخ‌ها", value: by("سرنخ"), key: "سرنخ", icon: "target" },
      { label: "ریزش‌کرده", value: by("ریزش‌کرده"), key: "ریزش‌کرده", icon: "trending-down" },
    ];
  }

  const customers = {
    title: "مشتریان",
    render() {
      const actions = btn("خروجی", { icon: "download", attrs: "data-export" }) + btn("افزودن مشتری", { icon: "plus", variant: "primary", attrs: "data-add-customer" });
      const counts = `<section class="cards cards--mini">${custCounts()
        .map((c) => `<button class="card stat-mini stat-mini--btn ${custState.status === c.key ? "is-active" : ""}" data-status-filter="${c.key}"><span class="stat-mini__icon">${icon(c.icon, { size: 18 })}</span><span class="stat-mini__body"><span class="stat-mini__value">${fmt.num(c.value)}</span><span class="card__label">${c.label}</span></span></button>`)
        .join("")}</section>`;
      const toolbar = `<div class="filterbar">
        <div class="filterbar__search">${icon("search", { size: 18, class: "filterbar__searchicon" })}<input class="input" data-cust-search placeholder="جستجو بر اساس نام، ایمیل، شرکت…" value="${escapeHtml(custState.q)}"/></div>
        <div class="filterbar__controls">${ui.segmented([{ value: "همه", label: "همه" }, { value: "فعال", label: "فعال" }, { value: "سرنخ", label: "سرنخ" }, { value: "بالقوه", label: "بالقوه" }, { value: "ریزش‌کرده", label: "ریزش‌کرده" }], custState.status, { attrs: "data-status-seg" })}</div>
      </div>`;
      return pageHead({ title: "مشتریان", sub: `${faDigits(D.customers.length)} مشتری در مجموع`, actions }) + counts + toolbar + `<div class="panel panel--table"><div data-cust-table></div></div>`;
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
            { label: "مشاهدهٔ پروفایل", icon: "eye", value: "view" },
            { label: "ویرایش", icon: "edit", value: "edit" },
            { label: "ارسال ایمیل", icon: "mail", value: "email" },
            "divider",
            { label: "حذف", icon: "trash", value: "delete", danger: true },
          ]), { align: "end", onSelect: (v) => custRowAction(v, row) });
        },
        bulkActions: [
          { label: "ایمیل", icon: "mail", onClick: (rows) => ui.toast(`پیش‌نویس ایمیل برای ${faDigits(rows.length)} مشتری`, { type: "info" }) },
          { label: "افزودن برچسب", icon: "tag", onClick: (rows) => ui.toast(`${faDigits(rows.length)} مشتری برچسب‌گذاری شد`, { type: "success" }) },
          { label: "حذف", icon: "trash", variant: "danger", onClick: (rows) => bulkDelete(rows) },
        ],
        emptyTitle: "مشتری‌ای یافت نشد",
        emptyDesc: "جستجو یا فیلتر دیگری را امتحان کنید.",
      });
      applyCustFilter();
      // جستجو
      const search = qs("[data-cust-search]", root);
      on(search, "input", App.debounce(() => { custState.q = search.value; custTable.setSearch(custState.q); }, 160));
      // فیلتر وضعیت
      on(root, "click", "[data-status-seg] .segmented__btn", (e, t) => setStatus(t.dataset.seg, root));
      on(root, "click", "[data-status-filter]", (e, t) => setStatus(t.dataset.statusFilter, root));
      on(root, "click", "[data-add-customer]", () => openCustomerForm(null, root));
      on(root, "click", "[data-export]", () => ui.toast("مشتریان خروجی گرفته شدند", { type: "success", desc: "customers.csv" }));
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
    custTable.filter(custState.status === "همه" ? null : (r) => r.status === custState.status);
  }
  function custRowAction(v, row) {
    if (v === "view") openCustomerDrawer(row);
    else if (v === "edit") openCustomerForm(row);
    else if (v === "email") ui.toast(`ایمیل به ${row.name}`, { type: "info" });
    else if (v === "delete") deleteCustomer(row);
  }
  async function deleteCustomer(row) {
    const ok = await ui.confirm({ title: "حذف مشتری؟", message: `${row.name} برای همیشه حذف می‌شود. این عمل قابل بازگشت نیست.`, confirmText: "حذف", danger: true });
    if (!ok) return;
    const i = D.customers.indexOf(row);
    if (i > -1) D.customers.splice(i, 1);
    custTable.setRows(D.customers);
    applyCustFilter();
    ui.toast("مشتری حذف شد", { type: "success", desc: row.name });
  }
  async function bulkDelete(rows) {
    const ok = await ui.confirm({ title: `حذف ${faDigits(rows.length)} مشتری؟`, message: "این مشتریان برای همیشه حذف می‌شوند.", confirmText: "حذف همه", danger: true });
    if (!ok) return;
    rows.forEach((r) => { const i = D.customers.indexOf(r); if (i > -1) D.customers.splice(i, 1); });
    custTable.setRows(D.customers);
    applyCustFilter();
    ui.toast(`${faDigits(rows.length)} مشتری حذف شد`, { type: "success" });
  }

  function openCustomerForm(existing, root) {
    const e = existing || {};
    const body = `<form class="form-grid" data-form>
      ${ui.field({ label: "نام کامل", name: "name", value: e.name, required: true, wide: true, placeholder: "مثلاً سارا محمدی" })}
      ${ui.field({ label: "ایمیل", name: "email", type: "email", value: e.email, required: true, placeholder: "jane@company.com" })}
      ${ui.field({ label: "تلفن", name: "phone", value: e.phone, placeholder: "۰۹۱۲ ۰۰۰ ۰۰۰۰" })}
      ${ui.field({ label: "شرکت", name: "company", value: e.company, placeholder: "مثلاً شرکت نمونه" })}
      ${ui.field({ label: "وضعیت", name: "status", type: "select", value: e.status || "سرنخ", options: D.CUST_STATUS })}
      ${ui.field({ label: "شهر", name: "city", value: e.city, placeholder: "تهران" })}
      ${ui.field({ label: "کشور", name: "country", value: e.country, placeholder: "ایران" })}
    </form>`;
    ui.modal({
      title: existing ? "ویرایش مشتری" : "افزودن مشتری",
      subtitle: existing ? e.name : "ایجاد رکورد مشتری جدید",
      body,
      footer: `<button class="btn btn--ghost" data-act="cancel">انصراف</button><button class="btn btn--primary" data-act="save">${existing ? "ذخیره تغییرات" : "افزودن مشتری"}</button>`,
      onMount(rootEl, ctrl) {
        on(rootEl, "click", '[data-act="cancel"]', ctrl.close);
        on(rootEl, "click", '[data-act="save"]', () => {
          const form = qs("[data-form]", rootEl);
          const { valid, values } = ui.validate(form);
          if (!valid) return;
          if (existing) {
            Object.assign(existing, values);
            ui.toast("مشتری به‌روزرسانی شد", { type: "success", desc: values.name });
          } else {
            D.customers.unshift({ id: App.uid("C"), name: values.name, email: values.email, phone: values.phone, company: values.company || "—", status: values.status, city: values.city || "—", country: values.country || "—", value: 0, deals: 0, health: 60, avatar: D.avatarColor(), owner: D.currentUser.name, tags: ["ورودی"], joined: App.now(), lastContact: App.now(), rating: 5 });
            ui.toast("مشتری افزوده شد", { type: "success", desc: values.name });
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
        <a class="drawer-quick__btn" href="mailto:${escapeHtml(c.email)}">${icon("mail", { size: 18 })}<span>ایمیل</span></a>
        <button class="drawer-quick__btn" data-q="call">${icon("phone", { size: 18 })}<span>تماس</span></button>
        <button class="drawer-quick__btn" data-q="note">${icon("edit", { size: 18 })}<span>یادداشت</span></button>
        <button class="drawer-quick__btn" data-q="deal">${icon("briefcase", { size: 18 })}<span>معامله</span></button>
      </div>
      <div class="tabbed">
        ${ui.tabs([{ value: "ov", label: "نمای کلی" }, { value: "dl", label: "معاملات", count: dealsFor.length }, { value: "ac", label: "فعالیت" }, { value: "nt", label: "یادداشت‌ها" }], "ov")}
        <div class="tabpane" data-pane="ov">
          <div class="detail-grid">
            ${detailRow("ایمیل", `<a class="link" href="mailto:${escapeHtml(c.email)}">${escapeHtml(c.email)}</a>`)}
            ${detailRow("تلفن", escapeHtml(c.phone))}
            ${detailRow("موقعیت", `${escapeHtml(c.city)}، ${escapeHtml(c.country)}`)}
            ${detailRow("مسئول", `<span class="cell-user">${ui.avatar(c.owner, "indigo", 22)}${escapeHtml(c.owner)}</span>`)}
            ${detailRow("ارزش طول عمر", `<b>${fmt.money(c.value)}</b>`)}
            ${detailRow("مشتری از", fmt.date(c.joined))}
          </div>
          <h4 class="drawer-section">سلامت حساب</h4>
          <div class="health-row">${App.charts.gauge({ value: c.health, label: faDigits(c.health) + "٪", sub: "سلامت", size: 132 })}<div class="health-tags"><span class="health-tags__label">برچسب‌ها</span><div class="chips">${c.tags.map((t) => ui.pill(t, "indigo")).join("")}</div></div></div>
        </div>
        <div class="tabpane" data-pane="dl" hidden>${dealsFor.length ? `<ul class="mini-list">${dealsFor.map((d) => `<li class="mini-list__item"><span class="mini-list__icon">${icon("briefcase", { size: 16 })}</span><div class="mini-list__main"><div class="cell-strong">${escapeHtml(d.title)}</div><div class="cell-sub">${fmt.money(d.value)} · ${escapeHtml(d.stage)}</div></div>${ui.badge(d.status)}</li>`).join("")}</ul>` : ui.emptyState({ icon: "briefcase", title: "هنوز معامله‌ای نیست", desc: "با این مشتری معامله‌ای را آغاز کنید." })}</div>
        <div class="tabpane" data-pane="ac" hidden><ul class="act-list">${D.activities.slice(0, 5).map((a) => `<li class="act"><span class="act__dot act__dot--${a.color}">${icon(actIcon(a.type), { size: 13 })}</span><div class="act__body"><p class="act__text"><b>${escapeHtml(a.who)}</b> ${a.text}</p><span class="act__time">${fmt.relTime(a.time)}</span></div></li>`).join("")}</ul></div>
        <div class="tabpane" data-pane="nt" hidden>
          <div class="notes" data-notes><p class="notes__empty">هنوز یادداشتی نیست.</p></div>
          <form class="note-form" data-note-form><textarea class="textarea" name="note" rows="3" placeholder="یادداشتی دربارهٔ ${escapeHtml(c.name)} بنویسید…"></textarea><button class="btn btn--primary btn--sm" type="submit">افزودن یادداشت</button></form>
        </div>
      </div>`;
    const footer = `<button class="btn btn--ghost" data-edit>${icon("edit", { size: 18 })}ویرایش</button><button class="btn btn--primary" data-msg>${icon("message", { size: 18 })}پیام</button>`;
    ui.drawer({ head, body, footer, width: 500, onMount(rootEl, ctrl) {
      on(rootEl, "click", "[data-edit]", () => { ctrl.close(); openCustomerForm(c); });
      on(rootEl, "click", "[data-msg]", () => ui.toast(`پیام به ${c.name}`, { type: "info" }));
      on(rootEl, "click", "[data-q]", (e, t) => ui.toast((QUICK[t.dataset.q] || t.dataset.q) + " — " + c.name, { type: "info" }));
      const notes = qs("[data-notes]", rootEl);
      const stored = [];
      on(rootEl, "submit", "[data-note-form]", (e) => {
        e.preventDefault();
        const ta = qs("textarea", e.target);
        const v = ta.value.trim();
        if (!v) return;
        stored.unshift({ body: v, time: App.now() });
        notes.innerHTML = stored.map((n) => `<div class="note"><div class="note__head">${ui.avatar(D.currentUser.name, "indigo", 26)}<b>${escapeHtml(D.currentUser.name)}</b><span class="note__time">هم‌اکنون</span></div><p class="note__body">${escapeHtml(n.body)}</p></div>`).join("");
        ta.value = "";
        ui.toast("یادداشت افزوده شد", { type: "success" });
      });
    } });
  }

  /* ====================================================================
     نظرات مشتریان
     ==================================================================== */
  const reviewState = { rating: "همه", product: "همه", sort: "recent", q: "" };

  function reviewsFiltered() {
    let list = D.reviews.slice();
    if (reviewState.rating !== "همه") list = list.filter((r) => r.rating === +reviewState.rating);
    if (reviewState.product !== "همه") list = list.filter((r) => r.product === reviewState.product);
    if (reviewState.q) { const q = reviewState.q.toLowerCase(); list = list.filter((r) => r.title.toLowerCase().includes(q) || r.body.toLowerCase().includes(q) || r.author.toLowerCase().includes(q)); }
    const s = reviewState.sort;
    list.sort((a, b) => (s === "highest" ? b.rating - a.rating : s === "lowest" ? a.rating - b.rating : s === "helpful" ? b.helpful - a.helpful : +b.date - +a.date));
    return list;
  }

  function reviewCard(r) {
    return `<article class="review" data-review="${r.id}">
      <div class="review__head">
        <div class="review__author">${ui.avatar(r.author, r.avatar, 42)}<div><div class="review__name">${escapeHtml(r.author)} ${r.verified ? `<span class="verified" data-tip="مشتری تأییدشده">${icon("check-circle", { size: 14 })}</span>` : ""}</div><div class="review__sub">${escapeHtml(r.company)} · ${fmt.date(r.date)}</div></div></div>
        <div class="review__rt">${ui.stars(r.rating)}</div>
      </div>
      <h3 class="review__title">${escapeHtml(r.title)}</h3>
      <p class="review__body">${escapeHtml(r.body)}</p>
      <div class="review__foot">
        <span class="tagchip tagchip--neutral">${escapeHtml(r.product)}</span>
        <div class="review__actions">
          <button class="review__helpful" data-helpful="${r.id}">${icon("thumbs-up", { size: 16 })}<span>مفید</span> <b data-helpful-count>${faDigits(r.helpful)}</b></button>
          <button class="btn btn--ghost btn--sm" data-reply="${r.id}">${icon("send", { size: 15 })}پاسخ</button>
        </div>
      </div>
      <div data-reply-slot>${r.reply ? replyBlock(r.reply) : ""}</div>
    </article>`;
  }
  const replyBlock = (rep) => `<div class="review__reply"><div class="review__reply-head">${ui.avatar(rep.author, "indigo", 26)}<b>${escapeHtml(rep.author)}</b><span class="review__reply-badge">تیم کرسو</span><span class="note__time">${fmt.relTime(rep.date)}</span></div><p>${escapeHtml(rep.body)}</p></div>`;

  function reviewsSummary() {
    const all = D.reviews;
    const avg = (App.sum(all, "rating") / all.length).toFixed(1);
    const dist = [5, 4, 3, 2, 1].map((s) => ({ star: s, count: all.filter((r) => r.rating === s).length }));
    const max = Math.max(...dist.map((d) => d.count));
    const sentiment = [
      { name: "مثبت", value: all.filter((r) => r.sentiment === "positive").length, color: "#22C55E" },
      { name: "خنثی", value: all.filter((r) => r.sentiment === "neutral").length, color: "#F59E0B" },
      { name: "منفی", value: all.filter((r) => r.sentiment === "negative").length, color: "#F2654E" },
    ];
    return `<div class="rv-summary">
      <div class="rv-score">
        <div class="rv-score__num">${faDigits(avg)}</div>
        ${ui.stars(Math.round(avg), { size: 18 })}
        <div class="rv-score__count">${faDigits(all.length)} نظر</div>
      </div>
      <div class="rv-dist">${dist.map((d) => `<div class="rv-dist__row"><span class="rv-dist__star">${faDigits(d.star)}${icon("star", { size: 12 })}</span><div class="rv-dist__track"><div class="rv-dist__fill" style="width:${max ? (d.count / max) * 100 : 0}%"></div></div><span class="rv-dist__count">${faDigits(d.count)}</span></div>`).join("")}</div>
      <div class="rv-sentiment"><div class="donut-wrap donut-wrap--sm">${charts.donut({ data: sentiment, size: 132, thickness: 18, center: faDigits(Math.round((sentiment[0].value / all.length) * 100)) + "٪", centerSub: "مثبت" })}</div>${charts.legend(sentiment.map((s) => ({ name: s.name, color: s.color })))}</div>
    </div>`;
  }

  const reviews = {
    title: "نظرات مشتریان",
    render() {
      const products = ["همه", ...Array.from(new Set(D.reviews.map((r) => r.product)))];
      const actions = btn("درخواست نظر", { icon: "send", variant: "primary", attrs: "data-request" });
      const toolbar = `<div class="filterbar">
        <div class="filterbar__search">${icon("search", { size: 18, class: "filterbar__searchicon" })}<input class="input" data-rv-search placeholder="جستجوی نظرات…" value="${escapeHtml(reviewState.q)}"/></div>
        <div class="filterbar__controls">
          ${ui.segmented([{ value: "همه", label: "همه" }, { value: "5", label: "۵★" }, { value: "4", label: "۴★" }, { value: "3", label: "۳★" }, { value: "2", label: "۲★" }, { value: "1", label: "۱★" }], reviewState.rating, { attrs: "data-rv-rating" })}
          <label class="select-wrap"><select class="select" data-rv-product>${products.map((p) => `<option ${reviewState.product === p ? "selected" : ""}>${escapeHtml(p)}</option>`).join("")}</select></label>
          <label class="select-wrap"><select class="select" data-rv-sort>
            <option value="recent" ${reviewState.sort === "recent" ? "selected" : ""}>جدیدترین</option>
            <option value="highest" ${reviewState.sort === "highest" ? "selected" : ""}>بالاترین امتیاز</option>
            <option value="lowest" ${reviewState.sort === "lowest" ? "selected" : ""}>پایین‌ترین امتیاز</option>
            <option value="helpful" ${reviewState.sort === "helpful" ? "selected" : ""}>مفیدترین</option>
          </select></label>
        </div>
      </div>`;
      return pageHead({ title: "نظرات مشتریان", sub: "مشتریان شما چه می‌گویند", actions }) +
        panel("نمای کلی", reviewsSummary(), { class: "panel--summary" }) +
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
        qs("[data-helpful-count]", t).textContent = faDigits(r.helpful);
      });
      on(root, "click", "[data-reply]", (e, t) => openReply(t.dataset.reply, root, redo));
      on(root, "click", "[data-request]", () => ui.toast("درخواست نظر برای ۲۴ مشتری ارسال شد", { type: "success" }));
    },
  };

  function openReply(id, root, redo) {
    const r = D.reviews.find((x) => x.id === id);
    if (!r) return;
    ui.modal({
      title: "پاسخ به نظر", subtitle: `${r.author} · ${faDigits(r.rating)}★`,
      size: "sm",
      body: `<div class="reply-quote">${ui.stars(r.rating, { size: 14 })}<p>${escapeHtml(r.body)}</p></div><form data-form>${ui.field({ label: "پاسخ شما", name: "reply", type: "textarea", rows: 4, required: true, value: r.reply ? r.reply.body : "", placeholder: "یک پاسخ سنجیده بنویسید…" })}</form>`,
      footer: `<button class="btn btn--ghost" data-act="cancel">انصراف</button><button class="btn btn--primary" data-act="send">ارسال پاسخ</button>`,
      onMount(rootEl, ctrl) {
        on(rootEl, "click", '[data-act="cancel"]', ctrl.close);
        on(rootEl, "click", '[data-act="send"]', () => {
          const { valid, values } = ui.validate(qs("[data-form]", rootEl));
          if (!valid) return;
          r.reply = { author: D.currentUser.name, date: App.now(), body: values.reply };
          r.replied = true;
          ctrl.close();
          redo();
          ui.toast("پاسخ ارسال شد", { type: "success" });
        });
      },
    });
  }

  /* ====================================================================
     تنظیمات
     ==================================================================== */
  const settings = {
    title: "تنظیمات",
    render() {
      const u = D.currentUser;
      const tabs = ui.tabs([
        { value: "profile", label: "پروفایل" }, { value: "notifications", label: "اعلان‌ها" },
        { value: "appearance", label: "ظاهر" }, { value: "security", label: "امنیت" }, { value: "billing", label: "صورت‌حساب" },
      ], "profile");
      const profile = `<div class="tabpane" data-pane="profile">${panel("پروفایل", `
        <div class="profile-head">${ui.faceAvatar(72)}<div class="profile-head__main"><h3>${escapeHtml(u.name)}</h3><p>${escapeHtml(u.role)} · ${escapeHtml(u.email)}</p></div><button class="btn btn--secondary btn--sm" data-avatar>${icon("upload", { size: 16 })}تغییر عکس</button></div>
        <form class="form-grid" data-profile-form>
          ${ui.field({ label: "نام کامل", name: "name", value: u.name, required: true })}
          ${ui.field({ label: "ایمیل", name: "email", type: "email", value: u.email, required: true })}
          ${ui.field({ label: "نقش", name: "role", value: u.role })}
          ${ui.field({ label: "تلفن", name: "phone", value: "۰۹۱۲ ۵۵۵ ۰۱۳۲" })}
          ${ui.field({ label: "منطقهٔ زمانی", name: "tz", value: "تهران (ایران)", type: "select", options: ["تهران (ایران)", "دبی (امارات)", "استانبول (ترکیه)", "لندن (GMT)", "برلین (CET)"] })}
          ${ui.field({ label: "زبان", name: "lang", type: "select", options: ["فارسی", "انگلیسی", "عربی", "ترکی", "آلمانی"] })}
        </form>`, { actions: `<button class="btn btn--primary btn--sm" data-save-profile>ذخیره تغییرات</button>` })}</div>`;

      const notifPrefs = [
        ["معاملات جدید", "هنگام ایجاد یا برنده شدن یک معامله مطلع شوید", true],
        ["نظرات مشتریان", "هشدار برای نظرات و پاسخ‌های جدید", true],
        ["یادآوری وظایف", "یادآوری برای وظایف امروز", true],
        ["خلاصهٔ هفتگی", "خلاصه‌ای از عملکرد فروش شما", false],
        ["به‌روزرسانی محصول", "اخبار قابلیت‌های کرسو", false],
        ["منشن‌ها", "وقتی هم‌تیمی شما را @منشن می‌کند", true],
      ];
      const notif = `<div class="tabpane" data-pane="notifications" hidden>${panel("تنظیمات اعلان", `<ul class="pref-list">${notifPrefs.map((p, i) => `<li class="pref"><div class="pref__main"><p class="pref__title">${p[0]}</p><p class="pref__desc">${p[1]}</p></div>${ui.toggle("notif" + i, p[2])}</li>`).join("")}</ul>`, {})}</div>`;

      const theme = App.store.get("theme", "light");
      const accent = App.store.get("accent", "#4F46E5");
      const accents = ["#4F46E5", "#7C3AED", "#2563EB", "#0EA5E9", "#059669", "#E11D48", "#F59E0B"];
      const appearance = `<div class="tabpane" data-pane="appearance" hidden>
        ${panel("حالت نمایش", `<div class="theme-pick">${[{ v: "light", l: "روشن", i: "sun" }, { v: "dark", l: "تاریک", i: "moon" }, { v: "system", l: "سیستم", i: "palette" }].map((t) => `<button class="theme-opt ${theme === t.v ? "is-active" : ""}" data-theme-opt="${t.v}"><span class="theme-opt__preview theme-opt__preview--${t.v}">${icon(t.i, { size: 18 })}</span><span>${t.l}</span></button>`).join("")}</div>`, {})}
        ${panel("رنگ تأکید", `<div class="accent-pick">${accents.map((a) => `<button class="accent-dot ${accent === a ? "is-active" : ""}" data-accent="${a}" style="background:${a}" aria-label="رنگ ${a}">${accent === a ? icon("check", { size: 14, stroke: 2.6 }) : ""}</button>`).join("")}</div>`, { sub: "رنگ برجستهٔ استفاده‌شده در سراسر اپ را شخصی‌سازی کنید" })}
      </div>`;

      const security = `<div class="tabpane" data-pane="security" hidden>
        ${panel("گذرواژه", `<form class="form-grid" data-pwd-form>${ui.field({ label: "گذرواژهٔ فعلی", name: "cur", type: "password", placeholder: "••••••••" })}${ui.field({ label: "گذرواژهٔ جدید", name: "new", type: "password", placeholder: "••••••••" })}${ui.field({ label: "تکرار گذرواژهٔ جدید", name: "confirm", type: "password", placeholder: "••••••••", wide: true })}</form>`, { actions: `<button class="btn btn--primary btn--sm" data-save-pwd>به‌روزرسانی گذرواژه</button>` })}
        ${panel("احراز هویت دومرحله‌ای", `<ul class="pref-list"><li class="pref"><div class="pref__main"><p class="pref__title">اپ احرازکننده</p><p class="pref__desc">از اپی مانند Google Authenticator استفاده کنید</p></div>${ui.toggle("twofa", true)}</li><li class="pref"><div class="pref__main"><p class="pref__title">کد پیامکی</p><p class="pref__desc">دریافت کد از طریق پیامک</p></div>${ui.toggle("sms", false)}</li></ul>`, {})}
        ${panel("نشست‌های فعال", `<ul class="mini-list">${[["مک‌بوک پرو · تهران", "نشست فعلی", true], ["آیفون ۱۵ · تهران", "۲ ساعت پیش", false], ["کروم · مشهد", "دیروز", false]].map((s) => `<li class="mini-list__item"><span class="mini-list__icon">${icon("shield", { size: 16 })}</span><div class="mini-list__main"><div class="cell-strong">${s[0]}</div><div class="cell-sub">${s[1]}</div></div>${s[2] ? ui.badge("فعال", "success") : `<button class="btn btn--ghost btn--sm" data-revoke>لغو</button>`}</li>`).join("")}</ul>`, {})}
      </div>`;

      const invoices = [["تیر ۱۴۰۳", "۴۹٬۰۰۰ تومان", "پرداخت‌شده"], ["خرداد ۱۴۰۳", "۴۹٬۰۰۰ تومان", "پرداخت‌شده"], ["اردیبهشت ۱۴۰۳", "۴۹٬۰۰۰ تومان", "پرداخت‌شده"], ["فروردین ۱۴۰۳", "۴۹٬۰۰۰ تومان", "پرداخت‌شده"]];
      const billing = `<div class="tabpane" data-pane="billing" hidden>
        ${panel("طرح فعلی", `<div class="plan"><div class="plan__main"><span class="plan__badge">حرفه‌ای</span><h3 class="plan__price">۴۹٬۰۰۰<span> تومان / ماه</span></h3><p class="plan__desc">مخاطبین نامحدود، تحلیل‌های پیشرفته، پشتیبانی اولویت‌دار.</p></div><div class="plan__actions">${btn("تغییر طرح", { variant: "secondary", size: "sm" })}${btn("لغو", { variant: "ghost", size: "sm" })}</div></div>`, {})}
        ${panel("روش پرداخت", `<div class="paycard"><span class="paycard__icon">${icon("credit-card", { size: 22 })}</span><div class="paycard__main"><div class="cell-strong">ویزا با پایان ۴۲۴۲</div><div class="cell-sub">انقضا ۰۸/۲۷</div></div><button class="btn btn--ghost btn--sm" data-paycard>به‌روزرسانی</button></div>`, {})}
        ${panel("تاریخچهٔ صورت‌حساب", `<div class="table-wrap"><table class="table"><thead><tr><th>دوره</th><th>مبلغ</th><th>وضعیت</th><th class="ta-right">فاکتور</th></tr></thead><tbody>${invoices.map((iv) => `<tr><td>${iv[0]}</td><td>${iv[1]}</td><td>${ui.badge(iv[2], "success")}</td><td class="ta-right"><button class="btn btn--ghost btn--sm" data-invoice>${icon("download", { size: 15 })}PDF</button></td></tr>`).join("")}</tbody></table></div>`, { flush: true })}
      </div>`;

      return pageHead({ title: "تنظیمات", sub: "مدیریت حساب و ترجیحات شما" }) +
        `<div class="tabbed tabbed--page">${tabs}<div class="settings-panes">${profile}${notif}${appearance}${security}${billing}</div></div>`;
    },
    init(root) {
      on(root, "click", "[data-save-profile]", () => {
        const { valid, values } = ui.validate(qs("[data-profile-form]", root));
        if (!valid) return;
        D.currentUser.name = values.name; D.currentUser.email = values.email; D.currentUser.role = values.role;
        ui.toast("پروفایل ذخیره شد", { type: "success" });
        App.renderShell && App.renderShell();
      });
      on(root, "click", "[data-save-pwd]", () => {
        const { values } = ui.validate(qs("[data-pwd-form]", root));
        if (values.new && values.new !== values.confirm) { ui.toast("گذرواژه‌ها مطابقت ندارند", { type: "error" }); return; }
        ui.toast("گذرواژه به‌روزرسانی شد", { type: "success" });
      });
      on(root, "click", "[data-theme-opt]", (e, t) => {
        qsa("[data-theme-opt]", root).forEach((b) => b.classList.toggle("is-active", b === t));
        App.setTheme(t.dataset.themeOpt);
        ui.toast("پوسته به‌روزرسانی شد", { type: "success" });
      });
      on(root, "click", "[data-accent]", (e, t) => {
        qsa("[data-accent]", root).forEach((b) => { b.classList.toggle("is-active", b === t); b.innerHTML = b === t ? icon("check", { size: 14, stroke: 2.6 }) : ""; });
        App.setAccent(t.dataset.accent);
      });
      on(root, "change", ".pref input,[name^=notif],[name=twofa],[name=sms]", () => ui.toast("ترجیح ذخیره شد", { type: "success" }));
      on(root, "click", "[data-revoke]", (e, t) => { t.closest(".mini-list__item").style.opacity = ".4"; t.disabled = true; t.textContent = "لغو شد"; ui.toast("نشست لغو شد", { type: "info" }); });
      on(root, "click", "[data-invoice]", () => ui.toast("فاکتور دانلود شد", { type: "success" }));
      on(root, "click", "[data-avatar],[data-paycard]", () => ui.toast("به‌زودی", { type: "info" }));
    },
  };

  App.pages = { dashboard, explore, analytics, customers, reviews, settings };
  App.openCustomerDrawer = openCustomerDrawer;
  App.openDealDrawer = openDealDrawer;
  App.openCompanyDrawer = openCompanyDrawer;
})(window.App);
