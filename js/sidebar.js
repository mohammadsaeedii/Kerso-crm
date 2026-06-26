/* ============================================================
   Kerso CRM — Enhanced sidebar (feature #3)
   Favorites · Folders · Drag & Drop · Pin items · Smart
   Collections · Nested items · Recent items · in-sidebar Search ·
   Keyboard navigation. Persists layout via App.store.
   app.js delegates the navigable area to App.sidebar.bodyHTML()
   and calls App.sidebar.wire(root) after the shell renders.
   ============================================================ */
(function (App) {
  "use strict";
  const { icon, escapeHtml, qs, qsa, on, store } = App;
  const ui = App.ui;
  const D = App.data;

  const FALLBACK = [
    { id: "dashboard", label: "Dashboard", icon: "dashboard" },
    { id: "workspace", label: "Workspace", icon: "layout" },
    { id: "explore", label: "Business Explore", icon: "explore" },
    { id: "analytics", label: "Analytics", icon: "analytics" },
    { id: "customers", label: "Customers", icon: "customers" },
    { id: "reviews", label: "Customer Reviews", icon: "reviews" },
    { id: "automations", label: "Automations", icon: "zap" },
  ];
  const mainItems = () => (App.navItems || FALLBACK);
  function pageMeta(id) { return mainItems().find((p) => p.id === id) || FALLBACK.find((p) => p.id === id) || { id, label: App.fmt.title(id), icon: "grid" }; }

  /* ---------------- persisted state ---------------- */
  const DEF_FAVS = [
    { kind: "page", id: "dashboard" },
    { kind: "page", id: "customers" },
    { kind: "view", id: "fav-churn", label: "Churn-risk customers", icon: "trending-down", page: "customers", config: { smart: "churn" } },
  ];
  const DEF_FOLDERS = [
    { id: "fold-pipeline", name: "Pipeline", icon: "briefcase", open: true, items: [
      { kind: "page", id: "analytics" },
      { kind: "view", id: "fav-ent", label: "Enterprise accounts", icon: "building", page: "explore", config: {} },
    ] },
  ];
  let favorites = store.get("sidebar:favorites", DEF_FAVS);
  let order = store.get("sidebar:order", null);
  let folders = store.get("sidebar:folders", DEF_FOLDERS);
  let collapsedSecs = store.get("sidebar:secs", {});
  let recents = store.get("sidebar:recents", []);

  const save = () => { store.set("sidebar:favorites", favorites); store.set("sidebar:order", order); store.set("sidebar:folders", folders); store.set("sidebar:secs", collapsedSecs); };
  const saveRecents = () => store.set("sidebar:recents", recents.slice(0, 12));

  function orderedMain() {
    const items = mainItems();
    if (!order) return items.slice();
    const byId = {}; items.forEach((i) => (byId[i.id] = i));
    const out = order.map((id) => byId[id]).filter(Boolean);
    items.forEach((i) => { if (!out.includes(i)) out.push(i); }); // include any new pages
    return out;
  }

  const isFav = (id) => favorites.some((f) => (f.kind === "page" && f.id === id));

  /* ---------------- descriptor → link HTML ---------------- */
  function linkHTML(desc, opts) {
    opts = opts || {};
    const cur = App.router ? App.router.current : "dashboard";
    let label, ic, href, data = "", active = false, extra = "";
    if (desc.kind === "page") {
      const m = pageMeta(desc.id); label = m.label; ic = m.icon; href = `#/${desc.id}`; active = desc.id === cur;
    } else if (desc.kind === "view") {
      label = desc.label; ic = desc.icon || "filter"; href = `#/${desc.page}`; data = ` data-view='${escapeHtml(JSON.stringify(desc.config || {}))}' data-view-page="${desc.page}"`;
    } else { // entity
      label = desc.label; ic = desc.icon || "user"; href = "#"; data = ` data-open="${desc.kind}" data-id="${escapeHtml(desc.id)}"`;
    }
    if (opts.draggable) extra += ` draggable="true"`;
    const pinBtn = opts.pinnable
      ? `<button class="side-link__act" data-pin="${desc.id}" data-tip="${isFav(desc.id) ? "Unpin" : "Pin to favorites"}" aria-label="Pin">${icon(isFav(desc.id) ? "star" : "plus", { size: 15 })}</button>`
      : opts.removable
        ? `<button class="side-link__act" data-unfav aria-label="Remove">${icon("x", { size: 14 })}</button>`
        : "";
    return `<a class="nav__item side-link ${active ? "nav__item--active" : ""}" href="${href}"${data}${extra} data-tip="${escapeHtml(label)}" ${active ? 'aria-current="page"' : ""}>
      ${icon(ic, { size: 20, class: "nav__icon" })}<span class="side-link__label">${escapeHtml(label)}</span>${pinBtn}</a>`;
  }

  function sectionHead(key, title, count, action) {
    const open = !collapsedSecs[key];
    return `<header class="side-sec__head" data-sec-toggle="${key}">
      ${icon("chevron-down", { size: 15, class: "side-sec__chev " + (open ? "" : "is-closed") })}
      <span class="side-sec__title">${escapeHtml(title)}</span>
      ${count != null ? `<span class="side-sec__count">${count}</span>` : ""}
      ${action || ""}</header>`;
  }

  /* ---------------- body ---------------- */
  function bodyHTML() {
    const open = (k) => (collapsedSecs[k] ? "is-collapsed" : "");
    const favList = favorites.map((f) => linkHTML(f, { draggable: true, removable: true })).join("");
    const mainList = orderedMain().map((p) => linkHTML({ kind: "page", id: p.id }, { draggable: true, pinnable: true })).join("");
    const folderHTML = folders.map((fo) => `<div class="side-folder ${fo.open ? "" : "is-closed"}" data-folder="${fo.id}">
        <header class="side-folder__head" data-folder-toggle="${fo.id}">${icon(fo.open ? "folder-open" : "folder", { size: 18, class: "side-folder__icon" })}<span class="side-link__label">${escapeHtml(fo.name)}</span>${icon("chevron-down", { size: 14, class: "side-folder__chev" })}</header>
        <ul class="side-list side-list--nested" data-droplist="folder:${fo.id}">${fo.items.map((it) => linkHTML(it, { draggable: true, removable: true })).join("") || `<li class="side-empty">Drop items here</li>`}</ul>
      </div>`).join("");
    const views = (D.savedViews || []).map((v) => linkHTML({ kind: "view", id: v.id, label: v.name, icon: v.icon, page: v.page, config: v.config }, {})).join("");
    const recentList = recents.length ? recents.map((r) => linkHTML(r, {})).join("") : `<li class="side-empty">Pages you visit appear here</li>`;

    return `
      <div class="side-search">${icon("search", { size: 16, class: "side-search__icon" })}<input class="side-search__input" data-side-search placeholder="Search menu…" aria-label="Search menu" /></div>
      <div class="side-scroll" data-side-scroll>
        <section class="side-sec ${open("favorites")}" data-sec="favorites">
          ${sectionHead("favorites", "Favorites", favorites.length)}
          <ul class="side-list" data-droplist="favorites" data-sec-body>${favList || `<li class="side-empty">Drag items here to pin</li>`}</ul>
        </section>
        <section class="side-sec ${open("main")}" data-sec="main">
          ${sectionHead("main", "Main")}
          <ul class="side-list" data-droplist="main" data-sec-body>${mainList}</ul>
        </section>
        <section class="side-sec ${open("folders")}" data-sec="folders">
          ${sectionHead("folders", "Folders", folders.length, `<button class="side-sec__add" data-add-folder data-tip="New folder" aria-label="New folder">${icon("plus", { size: 14 })}</button>`)}
          <div data-sec-body class="side-folders">${folderHTML}</div>
        </section>
        <section class="side-sec ${open("collections")}" data-sec="collections">
          ${sectionHead("collections", "Smart Collections", (D.savedViews || []).length)}
          <ul class="side-list" data-sec-body>${views || `<li class="side-empty">No saved views yet</li>`}</ul>
        </section>
        <section class="side-sec ${open("recent")}" data-sec="recent">
          ${sectionHead("recent", "Recent")}
          <ul class="side-list" data-sec-body>${recentList}</ul>
        </section>
      </div>`;
  }

  /* ---------------- refresh in place ----------------
     The host element persists; all handlers are delegated on it and
     bound once, so we only swap innerHTML here (no re-binding). */
  function refresh() {
    const host = qs(".sidebar__scroll");
    if (host) host.innerHTML = bodyHTML();
  }
  function markActive() {
    qsa(".side-link[href]").forEach((a) => {
      const isActive = a.getAttribute("href") === `#/${App.router.current}`;
      a.classList.toggle("nav__item--active", isActive);
      if (isActive) a.setAttribute("aria-current", "page"); else a.removeAttribute("aria-current");
    });
  }

  /* ---------------- recents ---------------- */
  function recordVisit(pageId) {
    if (!pageId) return;
    const m = pageMeta(pageId);
    recents = recents.filter((r) => !(r.kind === "page" && r.id === pageId));
    recents.unshift({ kind: "page", id: pageId, label: m.label, icon: m.icon });
    recents = recents.slice(0, 12); saveRecents();
    const sec = qs('[data-sec="recent"] [data-sec-body]');
    if (sec && App.router) { sec.innerHTML = recents.map((r) => linkHTML(r, {})).join(""); }
    markActive();
  }
  function recordEntity(kind, ref) {
    if (!ref) return;
    const label = ref.name || ref.title || "Item";
    const ic = kind === "company" ? "building" : kind === "deal" ? "briefcase" : "user";
    recents = recents.filter((r) => !(r.kind === kind && r.id === ref.id));
    recents.unshift({ kind, id: ref.id, label, icon: ic });
    recents = recents.slice(0, 12); saveRecents();
    const sec = qs('[data-sec="recent"] [data-sec-body]');
    if (sec) sec.innerHTML = recents.map((r) => linkHTML(r, {})).join("");
  }
  const getRecents = () => recents.slice();

  /* ---------------- drag & drop ---------------- */
  let drag = null; // { srcList, id, desc }
  function descFromEl(el) {
    if (el.dataset.viewPage) return { kind: "view", id: el.dataset.id || App.uid("v"), label: qs(".side-link__label", el).textContent, icon: iconNameOf(el), page: el.dataset.viewPage, config: safeJSON(el.dataset.view) };
    if (el.dataset.open) return { kind: el.dataset.open, id: el.dataset.id, label: qs(".side-link__label", el).textContent, icon: iconNameOf(el) };
    // page
    const id = (el.getAttribute("href") || "").replace("#/", "");
    return { kind: "page", id };
  }
  function iconNameOf() { return "filter"; }
  function safeJSON(s) { try { return JSON.parse(s); } catch (e) { return {}; } }

  function wireDnd(root) {
    on(root, "dragstart", ".side-link[draggable]", (e, t) => {
      const list = t.closest("[data-droplist]");
      drag = { srcKey: list ? list.dataset.droplist : null, el: t, desc: descFromEl(t) };
      t.classList.add("is-dragging");
      e.dataTransfer.effectAllowed = "move";
      try { e.dataTransfer.setData("text/plain", drag.desc.id || ""); } catch (err) {}
    });
    on(root, "dragend", ".side-link[draggable]", (e, t) => { t.classList.remove("is-dragging"); qsa(".drop-before,.drop-after,.is-drop-target", root).forEach((el) => el.classList.remove("drop-before", "drop-after", "is-drop-target")); drag = null; });
    on(root, "dragover", "[data-droplist]", (e, t) => {
      if (!drag) return;
      e.preventDefault();
      const after = e.target.closest(".side-link");
      qsa(".drop-before,.drop-after", t).forEach((el) => el.classList.remove("drop-before", "drop-after"));
      t.classList.add("is-drop-target");
      if (after && after !== drag.el) {
        const r = after.getBoundingClientRect();
        after.classList.add(e.clientY < r.top + r.height / 2 ? "drop-before" : "drop-after");
      }
    });
    on(root, "dragleave", "[data-droplist]", (e, t) => { if (!t.contains(e.relatedTarget)) t.classList.remove("is-drop-target"); });
    on(root, "drop", "[data-droplist]", (e, t) => {
      if (!drag) return;
      e.preventDefault();
      const destKey = t.dataset.droplist;
      const after = qs(".drop-before, .drop-after", t);
      const before = after && after.classList.contains("drop-before");
      const refDesc = after ? descFromEl(after) : null;
      moveItem(drag.srcKey, destKey, drag.desc, refDesc, before);
      drag = null;
      save(); refresh();
    });
  }

  function listFor(key) {
    if (key === "favorites") return favorites;
    if (key === "main") return null; // handled specially via order
    if (key && key.startsWith("folder:")) { const f = folders.find((x) => x.id === key.slice(7)); return f ? f.items : null; }
    return null;
  }
  function sameDesc(a, b) { return a && b && a.kind === b.kind && a.id === b.id && (a.page || "") === (b.page || ""); }

  function moveItem(srcKey, destKey, desc, refDesc, before) {
    // MAIN list reorder (pages)
    if (destKey === "main" && desc.kind === "page") {
      let ord = orderedMain().map((p) => p.id).filter((id) => id !== desc.id);
      const refId = refDesc && refDesc.kind === "page" ? refDesc.id : null;
      let idx = refId ? ord.indexOf(refId) : ord.length;
      if (idx < 0) idx = ord.length;
      ord.splice(before ? idx : idx + 1, 0, desc.id);
      order = ord;
      return;
    }
    // remove from source (favorites or a folder)
    const src = listFor(srcKey);
    if (src) { const i = src.findIndex((x) => sameDesc(x, desc)); if (i > -1) src.splice(i, 1); }
    // add to destination
    const dest = listFor(destKey);
    if (!dest) return;
    if (dest.some((x) => sameDesc(x, desc))) return;
    let idx = refDesc ? dest.findIndex((x) => sameDesc(x, refDesc)) : dest.length;
    if (idx < 0) idx = dest.length;
    dest.splice(before ? idx : idx + 1, 0, desc);
    if (destKey === "favorites") ui.toast("Pinned to favorites", { type: "success", desc: desc.label || pageMeta(desc.id).label });
  }

  /* ---------------- pin / unpin / folders ---------------- */
  function togglePin(id) {
    const i = favorites.findIndex((f) => f.kind === "page" && f.id === id);
    if (i > -1) favorites.splice(i, 1);
    else favorites.push({ kind: "page", id });
    save(); refresh();
  }
  function removeFav(el) {
    const desc = descFromEl(el);
    const list = el.closest("[data-droplist]");
    const arr = listFor(list ? list.dataset.droplist : "favorites");
    if (arr) { const i = arr.findIndex((x) => sameDesc(x, desc)); if (i > -1) arr.splice(i, 1); save(); refresh(); }
  }
  function addFolder() {
    ui.modal({
      title: "New folder", size: "sm",
      body: `<form data-form>${ui.field({ label: "Folder name", name: "name", required: true, placeholder: "e.g. Key accounts", wide: true })}</form>`,
      footer: `<button class="btn btn--ghost" data-act="cancel">Cancel</button><button class="btn btn--primary" data-act="save">Create</button>`,
      onMount(r, c) {
        on(r, "click", '[data-act="cancel"]', c.close);
        on(r, "click", '[data-act="save"]', () => {
          const { valid, values } = ui.validate(qs("[data-form]", r));
          if (!valid) return;
          folders.push({ id: App.uid("fold"), name: values.name, icon: "folder", open: true, items: [] });
          collapsedSecs.folders = false; save(); c.close(); refresh();
          ui.toast("Folder created", { type: "success", desc: values.name });
        });
      },
    });
  }

  /* ---------------- search filter ---------------- */
  function filterMenu(root, q) {
    q = q.trim().toLowerCase();
    qsa(".side-link", root).forEach((el) => {
      const txt = (qs(".side-link__label", el) || el).textContent.toLowerCase();
      el.style.display = !q || txt.includes(q) ? "" : "none";
    });
    qsa(".side-sec", root).forEach((sec) => {
      const anyVisible = qsa(".side-link", sec).some((el) => el.style.display !== "none");
      sec.classList.toggle("is-search-hidden", !!q && !anyVisible && sec.dataset.sec !== "main");
    });
  }

  /* ---------------- keyboard navigation ---------------- */
  function wireKeyboard(root) {
    on(root, "keydown", (e) => {
      if (!["ArrowDown", "ArrowUp"].includes(e.key)) return;
      const links = qsa(".side-link", root).filter((el) => el.offsetParent !== null);
      const idx = links.indexOf(document.activeElement);
      if (idx === -1) return;
      e.preventDefault();
      const next = e.key === "ArrowDown" ? Math.min(links.length - 1, idx + 1) : Math.max(0, idx - 1);
      links[next].focus();
    });
  }

  /* ---------------- wiring (delegated, bound once per host) ---------------- */
  function wireHost(root) {
    if (root.__sidebarWired) return;
    root.__sidebarWired = true;
    wireDnd(root);
    on(root, "click", "[data-sec-toggle]", (e, t) => {
      const k = t.dataset.secToggle; collapsedSecs[k] = !collapsedSecs[k]; save();
      const sec = t.closest(".side-sec"); sec.classList.toggle("is-collapsed", collapsedSecs[k]);
      const chev = qs(".side-sec__chev", t); if (chev) chev.classList.toggle("is-closed", collapsedSecs[k]);
    });
    on(root, "click", "[data-folder-toggle]", (e, t) => {
      const id = t.dataset.folderToggle; const fo = folders.find((x) => x.id === id);
      if (fo) { fo.open = !fo.open; save(); t.closest(".side-folder").classList.toggle("is-closed", !fo.open); }
    });
    on(root, "click", "[data-pin]", (e, t) => { e.preventDefault(); e.stopPropagation(); togglePin(t.dataset.pin); });
    on(root, "click", "[data-unfav]", (e, t) => { e.preventDefault(); e.stopPropagation(); removeFav(t.closest(".side-link")); });
    on(root, "click", "[data-add-folder]", (e) => { e.preventDefault(); e.stopPropagation(); addFolder(); });
    on(root, "click", "[data-open]", (e, t) => {
      e.preventDefault();
      const kind = t.dataset.open, id = t.dataset.id;
      if (kind === "customer") App.openCustomerDrawer(D.customers.find((x) => x.id === id));
      else if (kind === "company") App.openCompanyDrawer(D.companies.find((x) => x.id === id));
      else if (kind === "deal") App.openDealDrawer(D.deals.find((x) => x.id === id));
    });
    on(root, "click", "[data-view-page]", (e, t) => {
      App.pendingView = { page: t.dataset.viewPage, config: safeJSON(t.dataset.view) };
      // anchor href handles navigation; if already on the page, apply now
      if (App.router && App.router.current === t.dataset.viewPage) { e.preventDefault(); App.router.reload(); }
    });
    on(root, "input", "[data-side-search]", (e, t) => filterMenu(root, t.value));
    wireKeyboard(root);
  }

  let busWired = false;
  function wire() {
    const host = qs(".sidebar__scroll");
    if (host) wireHost(host);
    if (!busWired) { busWired = true; App.bus.on("views:changed", () => { if (qs('[data-sec="collections"]')) refresh(); }); }
  }

  App.sidebar = { bodyHTML, wire, refresh, markActive, recordVisit, recordEntity, getRecents };
})(window.App);
