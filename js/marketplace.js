/* ============================================================
   Kerso CRM — Marketplace (feature #19)
   An ecosystem of Extensions, Plugins, AI Agents, Templates,
   Automation Packs and Integrations. Search, filter, and
   install / uninstall. Registered as App.pages.marketplace.
   ============================================================ */
(function (App) {
  "use strict";
  const { icon, escapeHtml, fmt, qs, qsa, on } = App;
  const ui = App.ui;
  const D = App.data;
  const pageHead = App.pageHead;

  const CATS = ["All", "AI Agents", "Integrations", "Automation Packs", "Templates", "Plugins", "Extensions", "Installed"];
  const mState = App.store.get("mk:state", { cat: "All", q: "" });
  const setM = (k, v) => { mState[k] = v; App.store.set("mk:state", mState); };

  function filtered() {
    let list = D.marketplace.slice();
    if (mState.cat === "Installed") list = list.filter((m) => m.installed);
    else if (mState.cat !== "All") list = list.filter((m) => m.category === mState.cat);
    const q = (mState.q || "").toLowerCase();
    if (q) list = list.filter((m) => (m.name + m.desc + m.by + m.category).toLowerCase().includes(q));
    return list;
  }

  function stars(n) { return `<span class="mk-rating">${icon("star", { size: 13 })}${n.toFixed(1)}</span>`; }

  function itemCard(m) {
    return `<article class="mk-card" data-mk="${m.id}">
      <div class="mk-card__head">
        <span class="mk-card__icon mk-card__icon--${m.color}">${icon(App.icon.has(m.icon) ? m.icon : "puzzle", { size: 22 })}</span>
        <div class="mk-card__title-wrap"><h3 class="mk-card__name">${escapeHtml(m.name)}</h3><p class="mk-card__by">${escapeHtml(m.by)}</p></div>
        ${m.installed ? `<span class="mk-installed">${icon("check", { size: 13, stroke: 2.4 })}Installed</span>` : ""}
      </div>
      <p class="mk-card__desc">${escapeHtml(m.desc)}</p>
      <div class="mk-card__foot">
        <span class="mk-card__meta">${stars(m.rating)}<span class="mk-card__sep">·</span>${escapeHtml(m.installs)}<span class="mk-card__sep">·</span><b>${escapeHtml(m.price)}</b></span>
        <button class="btn btn--sm ${m.installed ? "btn--ghost" : "btn--primary"}" data-mk-install="${m.id}">${m.installed ? "Manage" : "Install"}</button>
      </div>
      <span class="mk-card__cat">${escapeHtml(m.category)}</span>
    </article>`;
  }

  function detail(m) {
    ui.modal({
      title: m.name, subtitle: `${m.category} · by ${m.by}`, size: "lg",
      body: `<div class="mk-detail">
          <div class="mk-detail__head"><span class="mk-card__icon mk-card__icon--${m.color}" style="width:64px;height:64px;border-radius:16px">${icon(App.icon.has(m.icon) ? m.icon : "puzzle", { size: 30 })}</span>
            <div><div class="mk-detail__meta">${stars(m.rating)} · ${escapeHtml(m.installs)} installs · <b>${escapeHtml(m.price)}</b></div><p class="mk-detail__desc">${escapeHtml(m.desc)}</p></div></div>
          <h4 class="drawer-section">What it does</h4>
          <ul class="mk-features">${["Native, one-click setup — no code required", "Works with your existing customers, deals and pipeline", "Secure: scoped permissions, revoke anytime", "Backed by " + m.by + " with regular updates"].map((f) => `<li>${icon("check-circle", { size: 16 })}<span>${escapeHtml(f)}</span></li>`).join("")}</ul>
        </div>`,
      footer: `<button class="btn btn--ghost" data-act="cancel">Close</button><button class="btn ${m.installed ? "btn--danger" : "btn--primary"}" data-act="toggle">${m.installed ? "Uninstall" : "Install " + (m.price === "Free" ? "free" : m.price)}</button>`,
      onMount(root, ctrl) {
        on(root, "click", '[data-act="cancel"]', ctrl.close);
        on(root, "click", '[data-act="toggle"]', () => { toggle(m); ctrl.close(); App.router.reload(); });
      },
    });
  }

  function toggle(m) {
    m.installed = !m.installed;
    ui.toast(m.installed ? `${m.name} installed` : `${m.name} uninstalled`, { type: m.installed ? "success" : "info", desc: m.installed ? "Configure it in Settings → Integrations" : "" });
  }

  App.pages.marketplace = {
    title: "Marketplace",
    render() {
      const installed = D.marketplace.filter((m) => m.installed).length;
      const featured = D.marketplace.find((m) => m.category === "AI Agents");
      const banner = featured ? `<div class="mk-banner">
        <div class="mk-banner__main"><span class="mk-banner__tag">${icon("sparkles", { size: 13 })}Featured AI Agent</span><h2 class="mk-banner__title">${escapeHtml(featured.name)}</h2><p class="mk-banner__desc">${escapeHtml(featured.desc)}</p><button class="btn btn--primary" data-mk-install="${featured.id}">${featured.installed ? "Manage" : "Get " + featured.price}</button></div>
        <div class="mk-banner__art">${icon("bot", { size: 64 })}</div>
      </div>` : "";
      const chips = CATS.map((c) => `<button class="mk-cat ${c === mState.cat ? "is-active" : ""}" data-mk-cat="${escapeHtml(c)}">${c === "Installed" ? icon("check-circle", { size: 14 }) : ""}${escapeHtml(c)}${c === "Installed" ? ` <span class="mk-cat__count">${installed}</span>` : ""}</button>`).join("");
      const toolbar = `<div class="filterbar"><div class="filterbar__search">${icon("search", { size: 18, class: "filterbar__searchicon" })}<input class="input" data-mk-search placeholder="Search the marketplace…" value="${escapeHtml(mState.q || "")}"/></div></div>`;
      const list = filtered();
      const grid = list.length ? `<div class="mk-grid">${list.map(itemCard).join("")}</div>` : ui.emptyState({ icon: "store", title: "Nothing here yet", desc: "Try another category or search." });
      return pageHead({ title: "Marketplace", sub: "Extend Kerso with apps, agents, templates & integrations" }) + banner + `<div class="mk-cats">${chips}</div>` + toolbar + `<div data-mk-host>${grid}</div>`;
    },
    init(root) {
      const redo = () => { qs("[data-mk-host]", root).innerHTML = (function () { const l = filtered(); return l.length ? `<div class="mk-grid">${l.map(itemCard).join("")}</div>` : ui.emptyState({ icon: "store", title: "Nothing here yet", desc: "Try another category or search." }); })(); };
      on(root, "click", "[data-mk-cat]", (e, t) => { setM("cat", t.dataset.mkCat); qsa("[data-mk-cat]", root).forEach((b) => b.classList.toggle("is-active", b === t)); redo(); });
      const search = qs("[data-mk-search]", root);
      on(search, "input", App.debounce(() => { setM("q", search.value); redo(); }, 160));
      on(root, "click", "[data-mk-install]", (e, t) => { e.stopPropagation(); toggle(D.marketplace.find((x) => x.id === t.dataset.mkInstall)); redo(); });
      on(root, "click", "[data-mk]", (e, t) => { if (e.target.closest("[data-mk-install]")) return; detail(D.marketplace.find((x) => x.id === t.dataset.mk)); });
    },
  };
})(window.App);
