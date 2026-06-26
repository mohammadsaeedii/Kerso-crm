/* ============================================================
   Kerso CRM — Customer 360 (features #7, #8, #14)
   A rich customer drawer with Timeline, Files, Notes, Emails,
   Calls, Meetings, Deals, Tasks, AI Summary, Related Companies,
   Related Contacts and a Relationship Graph — plus predictive
   analytics (lead score, churn, health, best time to contact).
   Overrides App.openCustomerDrawer (same signature) so every
   existing entry point upgrades automatically.
   ============================================================ */
(function (App) {
  "use strict";
  const { icon, escapeHtml, fmt, qs, qsa, on } = App;
  const ui = App.ui;
  const ai = App.ai;
  const D = App.data;

  const detailRow = (label, val) => `<div class="detail-row"><span class="detail-row__label">${escapeHtml(label)}</span><span class="detail-row__val">${val}</span></div>`;

  function scoreChip(label, value, band) {
    return `<span class="score-chip score-chip--${band}"><span class="score-chip__label">${escapeHtml(label)}</span><span class="score-chip__val">${escapeHtml(String(value))}</span></span>`;
  }

  /* ---------------- relationship graph ---------------- */
  function relGraph(c) {
    const W = 540, H = 300, cx = W / 2, cy = H / 2;
    const company = D.companies.find((co) => co.name === c.company);
    const contacts = D.customers.filter((x) => x.company === c.company && x.id !== c.id).slice(0, 4);
    const deals = D.deals.filter((d) => d.company === c.company).slice(0, 3);
    const nodes = [];
    if (company) nodes.push({ kind: "company", id: company.id, label: company.name, color: "blue", icon: "building" });
    contacts.forEach((p) => nodes.push({ kind: "customer", id: p.id, label: p.name, color: p.avatar, icon: "user" }));
    deals.forEach((d) => nodes.push({ kind: "deal", id: d.id, label: d.title, color: "indigo", icon: "briefcase" }));
    const n = nodes.length || 1;
    const R = 110;
    let edges = "", circles = "";
    nodes.forEach((node, i) => {
      const ang = (i / n) * Math.PI * 2 - Math.PI / 2;
      const x = cx + R * Math.cos(ang), y = cy + R * Math.sin(ang);
      node.x = x; node.y = y;
      edges += `<line class="rg__edge" x1="${cx}" y1="${cy}" x2="${x.toFixed(1)}" y2="${y.toFixed(1)}"/>`;
    });
    nodes.forEach((node) => {
      const short = node.label.length > 16 ? node.label.slice(0, 15) + "…" : node.label;
      circles += `<g class="rg__node" data-rg="${node.kind}" data-id="${node.id}" transform="translate(${node.x.toFixed(1)},${node.y.toFixed(1)})">
        <circle class="rg__circle rg__circle--${node.color}" r="22"/>
        <text class="rg__glyph" text-anchor="middle" dy="1">${node.icon === "building" ? "🏢" : node.icon === "briefcase" ? "$" : fmt.initials(node.label)}</text>
        <text class="rg__label" text-anchor="middle" y="36">${escapeHtml(short)}</text></g>`;
    });
    const center = `<g transform="translate(${cx},${cy})"><circle class="rg__center" r="30"/><text class="rg__center-text" text-anchor="middle" dy="1">${escapeHtml(fmt.initials(c.name))}</text><text class="rg__label rg__label--center" text-anchor="middle" y="46">${escapeHtml(c.name.split(" ")[0])}</text></g>`;
    if (!nodes.length) return ui.emptyState({ icon: "network", title: "No relationships yet", desc: "Related contacts, companies and deals will appear here." });
    return `<svg class="rg" viewBox="0 0 ${W} ${H}" role="img" aria-label="Relationship graph">${edges}${center}${circles}</svg>`;
  }

  /* ---------------- comms summary tiles ---------------- */
  function commsStrip(comms) {
    const tiles = [
      { k: "emails", icon: "mail", label: "Emails", n: comms.emails.length },
      { k: "calls", icon: "phone", label: "Calls", n: comms.calls.length },
      { k: "meetings", icon: "video", label: "Meetings", n: comms.meetings.length },
      { k: "files", icon: "paperclip", label: "Files", n: comms.files.length },
    ];
    return `<div class="c360-comms">${tiles.map((t) => `<div class="c360-comm"><span class="c360-comm__icon">${icon(t.icon, { size: 16 })}</span><div><b>${t.n}</b><span>${t.label}</span></div></div>`).join("")}</div>`;
  }

  /* ---------------- predictive panel (#14) ---------------- */
  function predictive(c) {
    const ls = ai.leadScore(c), cr = ai.churnRisk(c);
    const dealsFor = D.deals.filter((d) => d.company === c.company);
    const opp = dealsFor.length ? Math.round(dealsFor.reduce((a, d) => a + ai.opportunityScore(d), 0) / dealsFor.length) : ai.leadScore(c);
    const nba = ai.nextBestAction(c);
    return `<div class="c360-predict">
      <div class="predict-grid">
        <div class="predict-cell">${App.charts.gauge({ value: ls, label: ls, sub: "lead score", size: 116, color: ls >= 70 ? "#22C55E" : ls >= 45 ? "#F59E0B" : "#F2654E" })}</div>
        <div class="predict-stats">
          ${predictRow("Churn risk", cr + "%", ai.riskBand(cr), cr)}
          ${predictRow("Opportunity score", opp + "/100", ai.scoreBand(opp), opp)}
          ${predictRow("Health", c.health + "/100", ai.scoreBand(c.health), c.health)}
          <div class="predict-best">${icon("clock", { size: 14 })}<span>Best time to contact</span><b>${ai.bestTimeToContact(c)}</b></div>
        </div>
      </div>
      <div class="nba nba--${nba.tone}"><span class="nba__icon">${icon(nba.icon, { size: 18 })}</span><div class="nba__body"><div class="nba__head"><span class="nba__tag">Next best action</span><b>${escapeHtml(nba.title)}</b></div><p>${escapeHtml(nba.body)}</p></div><button class="btn btn--primary btn--sm nba__cta" data-nba>${escapeHtml(nba.cta)}</button></div>
    </div>`;
  }
  function predictRow(label, val, band, pct) {
    return `<div class="predict-row"><div class="predict-row__top"><span>${escapeHtml(label)}</span><b class="predict-row__val predict-row__val--${band}">${escapeHtml(val)}</b></div>${ui.progress(App.clamp(pct, 0, 100), { small: true, color: band === "high" ? "var(--green)" : band === "medium" ? "var(--amber)" : "var(--red)" })}</div>`;
  }

  /* ---------------- main drawer ---------------- */
  function openCustomer360(c) {
    if (!c) return;
    const comms = D.commsFor(c);
    const timeline = D.timelineFor(c);
    const dealsFor = D.deals.filter((d) => d.company === c.company);
    const tasksFor = D.tasks.filter((t) => (t.assignee === c.owner) ).slice(0, 4);
    const company = D.companies.find((co) => co.name === c.company);
    const contacts = D.customers.filter((x) => x.company === c.company && x.id !== c.id);
    const cr = ai.churnRisk(c), ls = ai.leadScore(c);

    const head = `<div class="drawer-id c360-head">
      ${ui.avatar(c.name, c.avatar, 50)}
      <div class="drawer-id__main"><h2 class="drawer__title">${escapeHtml(c.name)}</h2><p class="drawer-id__sub">${escapeHtml(c.company)} · ${escapeHtml(c.city)}</p></div>
      <div class="c360-head__badges">${ui.badge(c.status)}</div>
    </div>
    <div class="c360-scorebar">${scoreChip("Lead", ls, ai.scoreBand(ls))}${scoreChip("Churn", cr + "%", ai.riskBand(cr) === "high" ? "danger" : ai.riskBand(cr) === "medium" ? "warning" : "success")}${scoreChip("Health", c.health, ai.scoreBand(c.health))}</div>`;

    const quick = `<div class="drawer-quick">
      <a class="drawer-quick__btn" href="mailto:${escapeHtml(c.email)}">${icon("mail", { size: 18 })}<span>Email</span></a>
      <button class="drawer-quick__btn" data-q="Call">${icon("phone", { size: 18 })}<span>Call</span></button>
      <button class="drawer-quick__btn" data-q="Meeting">${icon("video", { size: 18 })}<span>Meet</span></button>
      <button class="drawer-quick__btn" data-q="Note">${icon("edit", { size: 18 })}<span>Note</span></button>
      <button class="drawer-quick__btn" data-q="Deal">${icon("briefcase", { size: 18 })}<span>Deal</span></button>
    </div>`;

    const body = `${quick}
      <div class="ai-callout"><div class="ai-callout__head">${icon("sparkles", { size: 15 })}<b>AI summary</b><button class="ai-callout__refresh" data-ai-refresh data-tip="Regenerate" aria-label="Regenerate">${icon("refresh", { size: 14 })}</button></div><p data-ai-summary>${escapeHtml(ai.summarizeCustomer(c))}</p></div>
      ${commsStrip(comms)}
      <div class="tabbed c360-tabs">
        ${ui.tabs([{ value: "ov", label: "Overview" }, { value: "tl", label: "Timeline" }, { value: "dl", label: "Deals", count: dealsFor.length }, { value: "fl", label: "Files", count: comms.files.length }, { value: "nt", label: "Notes" }, { value: "rel", label: "Related" }], "ov")}
        <div class="tabpane" data-pane="ov">
          ${predictive(c)}
          <h4 class="drawer-section">Details</h4>
          <div class="detail-grid">
            ${detailRow("Email", `<a class="link" href="mailto:${escapeHtml(c.email)}">${escapeHtml(c.email)}</a>`)}
            ${detailRow("Phone", escapeHtml(c.phone))}
            ${detailRow("Owner", `<span class="cell-user">${ui.avatar(c.owner, D.teammate(c.owner).color, 22)}${escapeHtml(c.owner)}</span>`)}
            ${detailRow("Lifetime value", `<b>${fmt.money(c.value)}</b>`)}
            ${detailRow("Customer since", fmt.date(c.joined))}
            ${detailRow("Renewal", fmt.date(c.renewal))}
          </div>
          <h4 class="drawer-section">Tags</h4>
          <div class="chips">${c.tags.map((t) => ui.pill(t, "indigo")).join("")}</div>
        </div>
        <div class="tabpane" data-pane="tl" hidden>
          <div data-tl-filters>${App.timeline.filters(timeline, "all")}</div>
          <div data-tl-body>${App.timeline.render(timeline, { filter: "all" })}</div>
        </div>
        <div class="tabpane" data-pane="dl" hidden>${dealsFor.length ? `<ul class="mini-list">${dealsFor.map((d) => `<li class="mini-list__item is-clickable" data-open-deal="${d.id}"><span class="mini-list__icon">${icon("briefcase", { size: 16 })}</span><div class="mini-list__main"><div class="cell-strong">${escapeHtml(d.title)}</div><div class="cell-sub">${fmt.money(d.value)} · ${escapeHtml(d.stage)} · ${ai.opportunityScore(d)}% to close</div></div>${ui.badge(d.status)}</li>`).join("")}</ul>` : ui.emptyState({ icon: "briefcase", title: "No deals yet" })}</div>
        <div class="tabpane" data-pane="fl" hidden>${comms.files.length ? `<ul class="mini-list">${comms.files.map((f) => `<li class="mini-list__item"><span class="file-ico file-ico--${f.color}">${icon("file-text", { size: 16 })}</span><div class="mini-list__main"><div class="cell-strong">${escapeHtml(f.name)}</div><div class="cell-sub">${escapeHtml(f.owner.split(" ")[0])} · ${fmt.relTime(f.updated)}</div></div>${f.ocr ? ui.pill("OCR", "success") : ""}</li>`).join("")}</ul>` : ui.emptyState({ icon: "folder", title: "No files", desc: "Files shared with this account appear here." })}</div>
        <div class="tabpane" data-pane="nt" hidden><div data-c360-comments></div></div>
        <div class="tabpane" data-pane="rel" hidden>
          <h4 class="drawer-section">Relationship graph</h4>
          <div class="rg-wrap" data-rg-wrap>${relGraph(c)}</div>
          <h4 class="drawer-section">Related company</h4>
          ${company ? `<ul class="mini-list"><li class="mini-list__item is-clickable" data-open-company="${company.id}"><span class="mini-list__icon">${icon("building", { size: 16 })}</span><div class="mini-list__main"><div class="cell-strong">${escapeHtml(company.name)}</div><div class="cell-sub">${escapeHtml(company.industry)} · ${fmt.moneyCompact(company.revenue)}</div></div>${ui.badge(company.status)}</li></ul>` : `<p class="side-empty">No linked company</p>`}
          <h4 class="drawer-section">Related contacts (${contacts.length})</h4>
          ${contacts.length ? `<ul class="mini-list">${contacts.slice(0, 6).map((p) => `<li class="mini-list__item is-clickable" data-open-customer="${p.id}">${ui.avatar(p.name, p.avatar, 32)}<div class="mini-list__main"><div class="cell-strong">${escapeHtml(p.name)}</div><div class="cell-sub">${escapeHtml(p.email)}</div></div>${ui.badge(p.status)}</li>`).join("")}</ul>` : `<p class="side-empty">No other contacts at ${escapeHtml(c.company)}</p>`}
        </div>
      </div>`;

    const footer = `<button class="btn btn--ghost" data-edit>${icon("edit", { size: 18 })}Edit</button><button class="btn btn--ghost" data-ai-email>${icon("sparkles", { size: 18 })}Draft email</button><button class="btn btn--primary" data-msg>${icon("message", { size: 18 })}Message</button>`;

    ui.drawer({
      head, body, footer, width: 600,
      onMount(root, ctrl) {
        // quick actions
        on(root, "click", "[data-q]", (e, t) => ui.toast(`${t.dataset.q} — ${c.name}`, { type: "info" }));
        on(root, "click", "[data-nba]", () => ui.toast(ai.nextBestAction(c).cta, { type: "success", desc: c.name }));
        on(root, "click", "[data-edit]", () => { ctrl.close(); App.create && App.create.customer && App.create.customer(c); });
        on(root, "click", "[data-msg]", () => ui.toast(`Message ${c.name}`, { type: "info" }));
        on(root, "click", "[data-ai-refresh]", () => { const p = qs("[data-ai-summary]", root); p.style.opacity = ".4"; setTimeout(() => { p.textContent = ai.summarizeCustomer(c); p.style.opacity = ""; ui.toast("Summary regenerated", { type: "success" }); }, 400); });
        on(root, "click", "[data-ai-email]", () => openAiEmail(c));
        // timeline filters
        on(root, "click", "[data-tl-filter]", (e, t) => {
          const f = t.dataset.tlFilter;
          qsa("[data-tl-filter]", root).forEach((b) => b.classList.toggle("is-active", b === t));
          qs("[data-tl-body]", root).innerHTML = App.timeline.render(timeline, { filter: f });
        });
        // entity navigation
        on(root, "click", "[data-open-deal]", (e, t) => { ctrl.close(); App.openDealDrawer(D.deals.find((x) => x.id === t.dataset.openDeal)); });
        on(root, "click", "[data-open-company]", (e, t) => { ctrl.close(); App.openCompanyDrawer(D.companies.find((x) => x.id === t.dataset.openCompany)); });
        on(root, "click", "[data-open-customer]", (e, t) => { ctrl.close(); App.openCustomerDrawer(D.customers.find((x) => x.id === t.dataset.openCustomer)); });
        on(root, "click", "[data-rg]", (e, t) => {
          const g = t.closest("[data-rg]"); const kind = g.dataset.rg, id = g.dataset.id; ctrl.close();
          if (kind === "company") App.openCompanyDrawer(D.companies.find((x) => x.id === id));
          else if (kind === "deal") App.openDealDrawer(D.deals.find((x) => x.id === id));
          else App.openCustomerDrawer(D.customers.find((x) => x.id === id));
        });
        // comments (notes tab) — mount lazily on first open
        let cmMounted = false;
        on(root, "click", ".tab[data-tab='nt']", () => { if (!cmMounted) { cmMounted = true; App.collab.mountComments(qs("[data-c360-comments]", root), { entityId: "cust:" + c.id }); } });
      },
    });
  }

  function openAiEmail(c) {
    const email = ai.generateEmail({ customer: c, purpose: c.status === "Churned" || ai.churnRisk(c) > 60 ? "renewal" : "follow-up" });
    ui.modal({
      title: "AI-drafted email", subtitle: `To ${c.name} · ${c.email}`, size: "lg",
      body: `<div class="ai-callout ai-callout--slim"><div class="ai-callout__head">${icon("sparkles", { size: 15 })}<b>Generated by Kerso AI</b></div></div>
        <form data-form>${ui.field({ label: "Subject", name: "subject", value: email.subject, wide: true })}${ui.field({ label: "Message", name: "body", type: "textarea", rows: 11, value: email.body, wide: true })}</form>`,
      footer: `<button class="btn btn--ghost" data-act="regen">${icon("refresh", { size: 16 })}Regenerate</button><button class="btn btn--primary" data-act="send">${icon("send", { size: 16 })}Send</button>`,
      onMount(root, ctrl) {
        on(root, "click", '[data-act="regen"]', () => { const purposes = ["follow-up", "intro", "renewal"]; const e2 = ai.generateEmail({ customer: c, purpose: purposes[Math.floor(App.fmt.initials(c.name).charCodeAt(0) + Date.now()) % 3] }); qs('[name="subject"]', root).value = e2.subject; qs('[name="body"]', root).value = e2.body; });
        on(root, "click", '[data-act="send"]', () => { ctrl.close(); ui.toast("Email sent", { type: "success", desc: c.email }); });
      },
    });
  }

  // override the basic drawer everywhere
  App.openCustomerDrawer = openCustomer360;
  App.customer360 = { open: openCustomer360, relGraph, predictive };
})(window.App);
