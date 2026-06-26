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
    { id: "explore", label: "Business Explore", icon: "explore" },
    { id: "analytics", label: "Analytics", icon: "analytics" },
    { id: "customers", label: "Customers", icon: "customers" },
    { id: "reviews", label: "Customer Reviews", icon: "reviews" },
  ];
  const NAV_FOOT = [
    { id: "settings", label: "Settings", icon: "gear" },
    { id: "help", label: "Help & Support", icon: "help", action: "help" },
  ];

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
      <nav class="nav" aria-label="Primary">${NAV.map(item).join("")}</nav>
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
    routes: ["dashboard", "explore", "analytics", "customers", "reviews", "settings"],
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
      requestAnimationFrame(() => content.classList.remove("is-leaving"));
      page.init && page.init(qs(".content__inner", content));
      content.scrollTop = 0;
      closeMobileNav();
    },
  };
  App.router = router;

  /* ---------------- Notifications panel ---------------- */
  function notifPanel(anchor) {
    const items = D.notifications;
    const typeIcon = { deal: "briefcase", review: "star", task: "check-circle", customer: "user", system: "info" };
    const typeColor = { deal: "emerald", review: "amber", task: "indigo", customer: "sky", system: "slate" };
    const list = items.length
      ? items.map((n) => `<button class="notif ${n.read ? "" : "is-unread"}" data-notif-id="${n.id}">
          <span class="notif__icon notif__icon--${typeColor[n.type]}">${icon(typeIcon[n.type] || "info", { size: 16 })}</span>
          <div class="notif__body"><p class="notif__title">${escapeHtml(n.title)}</p><p class="notif__desc">${escapeHtml(n.desc)}</p><span class="notif__time">${fmt.relTime(n.time)}</span></div>
          ${n.read ? "" : '<span class="notif__dot"></span>'}
        </button>`).join("")
      : ui.emptyState({ icon: "bell", title: "You're all caught up", desc: "No new notifications." });
    const html = `<div class="panel-pop">
      <header class="panel-pop__head"><h3>Notifications</h3><button class="panel-pop__link" data-mark-all>Mark all read</button></header>
      <div class="panel-pop__list">${list}</div>
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

  /* ---------------- Command palette search ---------------- */
  const Search = (() => {
    let panel = null, results = [], active = -1, anchor = null, input = null;
    function build(q) {
      q = q.trim().toLowerCase();
      const groups = [];
      const cap = (arr, n = 4) => arr.slice(0, n);
      if (!q) {
        groups.push({ label: "Pages", items: NAV.map((n) => ({ type: "page", id: n.id, label: n.label, icon: n.icon, sub: "Go to page" })) });
      } else {
        const pages = NAV.filter((n) => n.label.toLowerCase().includes(q)).map((n) => ({ type: "page", id: n.id, label: n.label, icon: n.icon, sub: "Page" }));
        if (pages.length) groups.push({ label: "Pages", items: pages });
        const cust = cap(D.customers.filter((c) => c.name.toLowerCase().includes(q) || c.company.toLowerCase().includes(q) || c.email.toLowerCase().includes(q))).map((c) => ({ type: "customer", ref: c, label: c.name, icon: "user", sub: c.company }));
        if (cust.length) groups.push({ label: "Customers", items: cust });
        const comp = cap(D.companies.filter((c) => c.name.toLowerCase().includes(q) || c.industry.toLowerCase().includes(q))).map((c) => ({ type: "company", ref: c, label: c.name, icon: "building", sub: c.industry }));
        if (comp.length) groups.push({ label: "Companies", items: comp });
        const dl = cap(D.deals.filter((d) => d.title.toLowerCase().includes(q) || d.company.toLowerCase().includes(q))).map((d) => ({ type: "deal", ref: d, label: d.title, icon: "briefcase", sub: `${d.company} · ${fmt.money(d.value)}` }));
        if (dl.length) groups.push({ label: "Deals", items: dl });
      }
      return groups;
    }
    function flat(groups) { return groups.flatMap((g) => g.items); }
    function render(groups) {
      results = flat(groups);
      active = results.length ? 0 : -1;
      let i = -1;
      const html = groups.length
        ? groups.map((g) => `<div class="search-pop__group"><div class="search-pop__label">${escapeHtml(g.label)}</div>${g.items.map((it) => { i++; return `<button class="search-pop__item ${i === active ? "is-active" : ""}" data-idx="${i}"><span class="search-pop__icon">${icon(it.icon, { size: 18 })}</span><span class="search-pop__main"><span class="search-pop__title">${escapeHtml(it.label)}</span><span class="search-pop__sub">${escapeHtml(it.sub)}</span></span>${icon("arrow-right", { size: 15, class: "search-pop__go" })}</button>`; }).join("")}</div>`).join("")
        : `<div class="search-pop__empty">${ui.emptyState({ icon: "search", title: "No results", desc: "Try a different search term." })}</div>`;
      return `<div class="search-pop">${html}<footer class="search-pop__foot"><span><kbd>↑</kbd><kbd>↓</kbd> navigate</span><span><kbd>↵</kbd> select</span><span><kbd>esc</kbd> close</span></footer></div>`;
    }
    function open() {
      anchor = qs("[data-search-anchor]");
      input = qs("[data-search-input]");
      if (panel) return;
      const groups = build(input.value);
      panel = App.node(render(groups));
      document.body.appendChild(panel);
      position();
      const justOpened = panel;
      requestAnimationFrame(() => justOpened && justOpened.classList.add("is-open"));
      window.addEventListener("resize", position);
      document.addEventListener("click", onDoc, true);
      on(panel, "click", "[data-idx]", (e, t) => choose(+t.dataset.idx));
      on(panel, "mousemove", "[data-idx]", (e, t) => setActive(+t.dataset.idx));
    }
    function position() {
      if (!panel || !anchor) return;
      const r = anchor.getBoundingClientRect();
      panel.style.left = r.left + "px";
      panel.style.top = r.bottom + 8 + "px";
      panel.style.width = r.width + "px";
    }
    function close() {
      if (!panel) return;
      panel.classList.remove("is-open");
      const p = panel; panel = null;
      setTimeout(() => p.remove(), 140);
      window.removeEventListener("resize", position);
      document.removeEventListener("click", onDoc, true);
    }
    function onDoc(e) { if (panel && !panel.contains(e.target) && !anchor.contains(e.target)) close(); }
    function refresh() { if (!panel) return; const groups = build(input.value); panel.innerHTML = App.node(render(groups)).innerHTML; on(panel, "click", "[data-idx]", (e, t) => choose(+t.dataset.idx)); on(panel, "mousemove", "[data-idx]", (e, t) => setActive(+t.dataset.idx)); }
    function setActive(i) { active = i; qsa("[data-idx]", panel).forEach((el) => el.classList.toggle("is-active", +el.dataset.idx === active)); }
    function move(d) { if (!results.length) return; active = (active + d + results.length) % results.length; setActive(active); const el = qs(`[data-idx="${active}"]`, panel); if (el && el.scrollIntoView) el.scrollIntoView({ block: "nearest" }); }
    function choose(i) {
      const it = results[i];
      if (!it) return;
      close();
      input.value = "";
      input.blur();
      if (it.type === "page") router.go(it.id);
      else if (it.type === "customer") App.openCustomerDrawer(it.ref);
      else if (it.type === "company") App.openCompanyDrawer(it.ref);
      else if (it.type === "deal") App.openDealDrawer(it.ref);
    }
    return { open, close, refresh, move, choose: () => choose(active), get isOpen() { return !!panel; } };
  })();

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

    // search
    on(document, "focus", "[data-search-input]", () => Search.open(), true);
    on(document, "click", "[data-search-input]", () => Search.open());
    on(document, "input", "[data-search-input]", () => Search.refresh());
    document.addEventListener("keydown", (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") { e.preventDefault(); const inp = qs("[data-search-input]"); inp.focus(); Search.open(); }
      if (Search.isOpen) {
        if (e.key === "ArrowDown") { e.preventDefault(); Search.move(1); }
        else if (e.key === "ArrowUp") { e.preventDefault(); Search.move(-1); }
        else if (e.key === "Enter") { e.preventDefault(); Search.choose(); }
        else if (e.key === "Escape") { Search.close(); qs("[data-search-input]").blur(); }
      }
    });

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
    router.start();
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})(window.App);
