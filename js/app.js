/* ============================================================
   Kerso CRM — App shell, router & global interactions
   ============================================================ */
(function (App) {
  "use strict";
  const { icon, escapeHtml, qs, qsa, on, fmt } = App;
  const ui = App.ui;
  const D = App.data;

  /* ---------------- Theme & accent ---------------- */
  let themePref = App.store.get("theme", "light");
  const mql = window.matchMedia ? window.matchMedia("(prefers-color-scheme: dark)") : null;
  function resolveTheme(pref) {
    return pref === "system" ? (mql && mql.matches ? "dark" : "light") : pref;
  }
  App.setTheme = function (pref) {
    themePref = pref;
    App.store.set("theme", pref);
    document.documentElement.setAttribute("data-theme", resolveTheme(pref));
    updateThemeButtons();
  };
  function updateThemeButtons() {
    const resolved = resolveTheme(themePref);
    qsa("[data-theme-now]").forEach((el) => (el.textContent = resolved === "dark" ? "Light mode" : "Dark mode"));
  }
  if (mql && mql.addEventListener) mql.addEventListener("change", () => { if (themePref === "system") App.setTheme("system"); });

  App.setAccent = function (hex) {
    App.store.set("accent", hex);
    const r = document.documentElement;
    r.style.setProperty("--indigo", hex);
    r.style.setProperty("--indigo-12", hex + "1A");
    r.style.setProperty("--indigo-press", hex);
    ui.toast("Accent color updated", { type: "success" });
  };

  /* ---------------- Brand mark ---------------- */
  const BRAND_MARK = `<svg viewBox="0 0 32 32" width="30" height="30" fill="none">
    <circle cx="16" cy="7" r="2.4" fill="#4F46E5"/><circle cx="9" cy="11" r="2.1" fill="#6366F1"/>
    <circle cx="23" cy="11" r="2.1" fill="#6366F1"/><circle cx="16" cy="15" r="2.6" fill="#4338CA"/>
    <circle cx="8" cy="19" r="1.8" fill="#818CF8"/><circle cx="24" cy="19" r="1.8" fill="#818CF8"/>
    <circle cx="16" cy="23" r="2.1" fill="#6366F1"/><circle cx="11" cy="25" r="1.5" fill="#A5B4FC"/>
    <circle cx="21" cy="25" r="1.5" fill="#A5B4FC"/></svg>`;

  const NAV = [
    { id: "dashboard", label: "Dashboard", icon: "dashboard" },
    { id: "workspace", label: "Workspace", icon: "layout" },
    { id: "explore", label: "Business Explore", icon: "explore" },
    { id: "analytics", label: "Analytics", icon: "analytics" },
    { id: "customers", label: "Customers", icon: "customers" },
    { id: "reviews", label: "Customer Reviews", icon: "reviews" },
    { id: "automations", label: "Automations", icon: "zap" },
  ];
  const NAV_FOOT = [
    { id: "marketplace", label: "Marketplace", icon: "store" },
    { id: "settings", label: "Settings", icon: "gear" },
    { id: "help", label: "Help & Support", icon: "help", action: "help" },
  ];
  // expose the navigable pages so the enhanced sidebar & command palette stay in sync
  App.navItems = NAV.slice();

  /* ---------------- Shell render ---------------- */
  function sidebarHTML() {
    const cur = App.router ? App.router.current : "dashboard";
    const item = (n) => {
      const active = n.id === cur;
      const href = n.action ? "#" : `#/${n.id}`;
      return `<a class="nav__item ${active ? "nav__item--active" : ""}" href="${href}" ${n.action ? `data-nav-action="${n.action}"` : ""} data-tip="${escapeHtml(n.label)}" ${active ? 'aria-current="page"' : ""}>
        ${icon(n.icon, { size: 20, class: "nav__icon" })}<span>${escapeHtml(n.label)}</span></a>`;
    };
    return `<div class="brand">
        <span class="brand__mark" aria-hidden="true">${BRAND_MARK}</span>
        <span class="brand__name">Kerso</span>
        <button class="brand__collapse" data-collapse aria-label="${App.store.get("sidebar:collapsed", false) ? "Expand sidebar" : "Collapse sidebar"}" data-tip="Toggle sidebar">${icon("sidebar", { size: 20 })}</button>
      </div>
      <div class="sidebar__scroll">${App.sidebar ? App.sidebar.bodyHTML() : `<nav class="nav" aria-label="Primary">${NAV.map(item).join("")}</nav>`}</div>
      <div class="nav nav--foot">${NAV_FOOT.map(item).join("")}</div>
      <div class="sidebar__card">
        <span class="sidebar__card-icon">${icon("sparkles", { size: 18 })}</span>
        <p class="sidebar__card-title">Upgrade to Pro</p>
        <p class="sidebar__card-desc">Unlock advanced analytics & automations.</p>
        <button class="btn btn--primary btn--sm btn--block" data-upgrade>Upgrade</button>
      </div>`;
  }

  function topbarHTML() {
    const u = D.currentUser;
    const unreadN = D.notifications.filter((n) => !n.read).length;
    const unreadM = D.messages.filter((m) => m.unread).length;
    return `<button class="hamburger icon-btn" data-burger aria-label="Open menu">${icon("list", { size: 22 })}</button>
      <div class="search" data-search-anchor>
        ${icon("search", { size: 20, class: "search__icon" })}
        <input type="text" class="search__input" data-search-input placeholder="Search lead, contact, and more…" aria-label="Search" />
        <kbd class="search__kbd">⌘K</kbd>
      </div>
      <div class="topbar__actions">
        <button class="icon-btn icon-btn--ai" data-ai-assistant aria-label="Ask Kerso AI" data-tip="Ask Kerso AI">${icon("sparkles", { size: 22 })}</button>
        <button class="icon-btn ${unreadN ? "icon-btn--badge" : ""}" data-notif aria-label="Notifications">${icon("bell", { size: 22 })}${unreadN ? `<span class="badge badge--coral">${unreadN}</span>` : ""}</button>
        <button class="icon-btn ${unreadM ? "icon-btn--badge" : ""}" data-msgs aria-label="Messages">${icon("message", { size: 22 })}${unreadM ? `<span class="badge">${unreadM}</span>` : ""}</button>
        <span class="topbar__divider" aria-hidden="true"></span>
        <button class="user" data-user aria-label="Account menu">
          <span class="user__avatar">${u.avatar === "face" ? ui.faceAvatar(40) : ui.avatar(u.name, "indigo", 40)}</span>
          <span class="user__meta"><span class="user__name">${escapeHtml(u.name)}</span><span class="user__role">${escapeHtml(u.role)}</span></span>
          ${icon("chevron-down", { size: 16, class: "user__caret" })}
        </button>
      </div>`;
  }

  App.renderShell = function () {
    qs(".sidebar").innerHTML = sidebarHTML();
    qs(".topbar").innerHTML = topbarHTML();
    if (App.sidebar) App.sidebar.wire();
  };

  function updateActiveNav() {
    qsa(".nav__item").forEach((a) => {
      const isActive = a.getAttribute("href") === `#/${App.router.current}`;
      a.classList.toggle("nav__item--active", isActive);
      if (isActive) a.setAttribute("aria-current", "page"); else a.removeAttribute("aria-current");
    });
  }

  /* ---------------- Router ---------------- */
  const router = {
    current: "dashboard",
    routes: ["dashboard", "workspace", "explore", "analytics", "customers", "reviews", "automations", "marketplace", "settings"],
    start() {
      window.addEventListener("hashchange", () => this.resolve());
      this.resolve();
    },
    go(id) { location.hash = "#/" + id; },
    reload() { this.render(); },
    resolve() {
      const hash = (location.hash || "").replace(/^#\/?/, "");
      const id = this.routes.includes(hash) ? hash : "dashboard";
      this.current = id;
      this.render();
    },
    render() {
      ui.closePopover();
      const page = App.pages[this.current];
      const content = qs(".content");
      content.classList.add("is-leaving");
      const u = D.currentUser;
      document.title = `${page.title} — Kerso`;
      // render
      content.innerHTML = `<div class="content__inner">${page.render()}</div>`;
      updateActiveNav();
      if (App.sidebar) App.sidebar.recordVisit(this.current);
      requestAnimationFrame(() => content.classList.remove("is-leaving"));
      page.init && page.init(qs(".content__inner", content));
      content.scrollTop = 0;
      closeMobileNav();
    },
  };
  App.router = router;

  /* ---------------- Smart notifications (#13) ---------------- */
  function smartNotifications() {
    const ai = App.ai, out = [];
    if (!ai) return out;
    const days = (d) => Math.round((App.now() - new Date(d)) / 86400000);
    const risk = D.deals.filter((d) => d.status === "open" && ai.opportunityScore(d) < 35).sort((a, b) => ai.opportunityScore(a) - ai.opportunityScore(b))[0];
    if (risk) out.push({ type: "deal", nav: "customers", title: "Deal at risk", desc: `${risk.title} (${risk.company}) — ${ai.opportunityScore(risk)}% to close` });
    const renew = D.customers.filter((c) => { const d = (new Date(c.renewal) - App.now()) / 86400000; return d > 0 && d <= 21; }).sort((a, b) => new Date(a.renewal) - new Date(b.renewal))[0];
    if (renew) out.push({ type: "system", nav: "customers", title: "Contract renewing soon", desc: `${renew.name} (${renew.company}) renews ${fmt.relTime(renew.renewal)}` });
    const cold = D.customers.filter((c) => days(c.lastContact) > 30 && c.status !== "Churned").sort((a, b) => new Date(a.lastContact) - new Date(b.lastContact))[0];
    if (cold) out.push({ type: "customer", nav: "customers", title: "Customer inactivity", desc: `No contact with ${cold.name} in ${days(cold.lastContact)} days` });
    const rec = ai.recommendations()[0];
    if (rec) out.push({ type: "system", nav: "automations", title: "AI recommendation", desc: `${rec.title} — ${rec.body}` });
    const ev = (D.calendarEvents || []).filter((e) => new Date(e.date) >= new Date(App.now().getFullYear(), App.now().getMonth(), App.now().getDate())).sort((a, b) => new Date(a.date) - new Date(b.date))[0];
    if (ev) out.push({ type: "task", nav: "workspace", title: "Upcoming: " + ev.title, desc: `${fmt.dateShort(ev.date)} · ${ev.start}` });
    return out;
  }

  /* ---------------- Notifications panel ---------------- */
  function notifPanel(anchor) {
    const items = D.notifications;
    const typeIcon = { deal: "briefcase", review: "star", task: "check-circle", customer: "user", system: "info" };
    const typeColor = { deal: "emerald", review: "amber", task: "indigo", customer: "sky", system: "slate" };
    const smart = smartNotifications();
    const smartHTML = smart.length
      ? `<div class="notif-smart"><div class="notif-smart__label">${icon("sparkles", { size: 13 })} Smart · AI</div>${smart.map((n) => `<button class="notif notif--smart" data-smart-go="${n.nav}"><span class="notif__icon notif__icon--${typeColor[n.type] || "indigo"}">${icon(typeIcon[n.type] || "info", { size: 16 })}</span><div class="notif__body"><p class="notif__title">${escapeHtml(n.title)}</p><p class="notif__desc">${escapeHtml(n.desc)}</p></div></button>`).join("")}</div>`
      : "";
    const list = items.length
      ? items.map((n) => `<button class="notif ${n.read ? "" : "is-unread"}" data-notif-id="${n.id}">
          <span class="notif__icon notif__icon--${typeColor[n.type]}">${icon(typeIcon[n.type] || "info", { size: 16 })}</span>
          <div class="notif__body"><p class="notif__title">${escapeHtml(n.title)}</p><p class="notif__desc">${escapeHtml(n.desc)}</p><span class="notif__time">${fmt.relTime(n.time)}</span></div>
          ${n.read ? "" : '<span class="notif__dot"></span>'}
        </button>`).join("")
      : ui.emptyState({ icon: "bell", title: "You're all caught up", desc: "No new notifications." });
    const html = `<div class="panel-pop">
      <header class="panel-pop__head"><h3>Notifications</h3><button class="panel-pop__link" data-mark-all>Mark all read</button></header>
      <div class="panel-pop__list">${smartHTML}${list}</div>
      <footer class="panel-pop__foot"><button class="panel-pop__all" data-all-notif>View all notifications</button></footer>
    </div>`;
    const pop = ui.popover(anchor, html, { align: "end", width: 360, closeOnSelect: false });
    on(pop.el, "click", "[data-notif-id]", (e, t) => {
      const n = D.notifications.find((x) => x.id === t.dataset.notifId);
      if (n) { n.read = true; t.classList.remove("is-unread"); const dot = qs(".notif__dot", t); if (dot) dot.remove(); }
      updateBadges();
    });
    on(pop.el, "click", "[data-mark-all]", () => {
      D.notifications.forEach((n) => (n.read = true));
      qsa(".notif", pop.el).forEach((el) => { el.classList.remove("is-unread"); const d = qs(".notif__dot", el); if (d) d.remove(); });
      updateBadges();
      ui.toast("All notifications marked as read", { type: "success" });
    });
    on(pop.el, "click", "[data-all-notif]", () => { pop.close(); ui.toast("Notification center", { type: "info" }); });
    on(pop.el, "click", "[data-smart-go]", (e, t) => { pop.close(); App.router.go(t.dataset.smartGo); });
  }

  function msgPanel(anchor) {
    const items = D.messages;
    const list = items.map((m) => `<button class="msg ${m.unread ? "is-unread" : ""}" data-msg-id="${m.id}">
        ${ui.avatar(m.from, m.color, 40, { online: m.online })}
        <div class="msg__body"><div class="msg__top"><span class="msg__name">${escapeHtml(m.from)}</span><span class="msg__time">${fmt.relTime(m.time)}</span></div><p class="msg__preview">${escapeHtml(m.preview)}</p></div>
        ${m.unread ? '<span class="notif__dot"></span>' : ""}
      </button>`).join("");
    const html = `<div class="panel-pop">
      <header class="panel-pop__head"><h3>Messages</h3><button class="panel-pop__link" data-mark-msgs>Mark all read</button></header>
      <div class="panel-pop__list">${list}</div>
      <footer class="panel-pop__foot"><button class="panel-pop__all" data-open-inbox>Open inbox</button></footer>
    </div>`;
    const pop = ui.popover(anchor, html, { align: "end", width: 360, closeOnSelect: false });
    on(pop.el, "click", "[data-msg-id]", (e, t) => {
      const m = D.messages.find((x) => x.id === t.dataset.msgId);
      if (m) { m.unread = false; t.classList.remove("is-unread"); const d = qs(".notif__dot", t); if (d) d.remove(); }
      updateBadges();
    });
    on(pop.el, "click", "[data-mark-msgs]", () => { D.messages.forEach((m) => (m.unread = false)); qsa(".msg", pop.el).forEach((el) => { el.classList.remove("is-unread"); const d = qs(".notif__dot", el); if (d) d.remove(); }); updateBadges(); });
    on(pop.el, "click", "[data-open-inbox]", () => { pop.close(); ui.toast("Inbox", { type: "info" }); });
  }

  function userMenu(anchor) {
    const u = D.currentUser;
    const html = `<div class="usermenu">
      <div class="usermenu__head">${u.avatar === "face" ? ui.faceAvatar(40) : ui.avatar(u.name, "indigo", 40)}<div><p class="usermenu__name">${escapeHtml(u.name)}</p><p class="usermenu__mail">${escapeHtml(u.email)}</p></div></div>
      <div class="menu__divider"></div>
      <button class="menu__item" data-value="profile">${icon("user", { size: 18 })}<span>Your profile</span></button>
      <button class="menu__item" data-value="settings">${icon("gear", { size: 18 })}<span>Settings</span></button>
      <button class="menu__item" data-value="theme">${icon("moon", { size: 18 })}<span data-theme-now>Dark mode</span></button>
      <button class="menu__item" data-value="help">${icon("help", { size: 18 })}<span>Help & support</span></button>
      <div class="menu__divider"></div>
      <button class="menu__item menu__item--danger" data-value="logout">${icon("logout", { size: 18 })}<span>Log out</span></button>
    </div>`;
    const pop = ui.popover(anchor, html, { align: "end", width: 248, onSelect: (v) => {
      if (v === "profile" || v === "settings") router.go("settings");
      else if (v === "theme") { App.setTheme(resolveTheme(themePref) === "dark" ? "light" : "dark"); }
      else if (v === "help") ui.toast("Help & support", { type: "info" });
      else if (v === "logout") ui.toast("Logged out", { type: "info" });
    } });
    updateThemeButtons();
  }

  function updateBadges() {
    const unreadN = D.notifications.filter((n) => !n.read).length;
    const unreadM = D.messages.filter((m) => m.unread).length;
    const bell = qs("[data-notif]"), msg = qs("[data-msgs]");
    if (bell) { let b = qs(".badge", bell); if (unreadN) { if (!b) { b = App.node('<span class="badge badge--coral"></span>'); bell.appendChild(b); } b.textContent = unreadN; bell.classList.add("icon-btn--badge"); } else if (b) { b.remove(); bell.classList.remove("icon-btn--badge"); } }
    if (msg) { let b = qs(".badge", msg); if (unreadM) { if (!b) { b = App.node('<span class="badge"></span>'); msg.appendChild(b); } b.textContent = unreadM; msg.classList.add("icon-btn--badge"); } else if (b) { b.remove(); msg.classList.remove("icon-btn--badge"); } }
  }

  /* ---------------- Mobile nav ---------------- */
  function openMobileNav() { document.querySelector(".app").classList.add("app--nav-open"); }
  function closeMobileNav() { const a = document.querySelector(".app"); if (a) a.classList.remove("app--nav-open"); }

  /* ---------------- Global wiring ---------------- */
  function wireGlobal() {
    const app = qs(".app");
    // sidebar collapse
    on(document, "click", "[data-collapse]", (e, t) => {
      const collapsed = app.classList.toggle("app--collapsed");
      App.store.set("sidebar:collapsed", collapsed);
      t.setAttribute("aria-label", collapsed ? "Expand sidebar" : "Collapse sidebar");
      window.dispatchEvent(new Event("resize"));
    });
    on(document, "click", "[data-burger]", openMobileNav);
    on(document, "click", "[data-nav-backdrop]", closeMobileNav);
    on(document, "click", ".nav__item", (e, t) => {
      if (t.dataset.navAction === "help") { e.preventDefault(); ui.toast("Help & support", { type: "info" }); return; }
      closeMobileNav();
    });
    on(document, "click", "[data-upgrade]", () => ui.toast("Upgrade to Pro", { type: "info", desc: "Redirecting to billing…" }));

    // topbar popovers
    on(document, "click", "[data-notif]", (e, t) => notifPanel(t.closest("button")));
    on(document, "click", "[data-msgs]", (e, t) => msgPanel(t.closest("button")));
    on(document, "click", "[data-user]", (e, t) => userMenu(t.closest("button")));
    on(document, "click", "[data-ai-assistant]", () => App.aiAssistant.open());

    // topbar search opens the global command palette (search + commands + AI + NL search)
    on(document, "focus", "[data-search-input]", (e, t) => { t.blur(); App.command.open(); }, true);
    on(document, "click", "[data-search-input]", () => App.command.open());

    // global tabs (.tabbed > .tabs > .tab + .tabpane)
    on(document, "click", ".tab[data-tab]", (e, t) => {
      const tabsEl = t.closest(".tabs");
      const tabbed = t.closest(".tabbed");
      if (!tabbed) return;
      qsa(".tab", tabsEl).forEach((b) => { b.classList.toggle("is-active", b === t); b.setAttribute("aria-selected", b === t); });
      const name = t.dataset.tab;
      qsa(".tabpane", tabbed).forEach((p) => { if (p.closest(".tabbed") === tabbed) p.hidden = p.dataset.pane !== name; });
    });
  }

  /* ---------------- Boot ---------------- */
  function boot() {
    // apply prefs
    document.documentElement.setAttribute("data-theme", resolveTheme(themePref));
    const accent = App.store.get("accent", null);
    if (accent) { const r = document.documentElement; r.style.setProperty("--indigo", accent); r.style.setProperty("--indigo-12", accent + "1A"); }

    const collapsed = App.store.get("sidebar:collapsed", false);
    qs("#app").innerHTML = `<div class="app ${collapsed ? "app--collapsed" : ""}">
      <div class="nav-backdrop" data-nav-backdrop></div>
      <aside class="sidebar"></aside>
      <div class="main"><header class="topbar"></header><main class="content" tabindex="-1"></main></div>
    </div>`;
    App.renderShell();
    ui.initTooltips();
    wireGlobal();
    // global keyboard shortcuts + ⌘K palette
    if (App.command) App.command.installShortcuts();
    // record entity opens into "Recent items" (centralized, so every entry point benefits)
    ["openCustomerDrawer", "openCompanyDrawer", "openDealDrawer"].forEach((k) => {
      const orig = App[k];
      if (typeof orig !== "function") return;
      const kind = k === "openCompanyDrawer" ? "company" : k === "openDealDrawer" ? "deal" : "customer";
      App[k] = function (ref) { App.sidebar && App.sidebar.recordEntity(kind, ref); return orig.apply(this, arguments); };
    });
    router.start();
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})(window.App);
