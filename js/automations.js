/* ============================================================
   Kerso CRM — Automation Builder (feature #5)
   A workflow automation system with a visual When → If → Then
   builder, plus AI that generates a workflow from plain English.
   Registered as App.pages.automations (route #/automations).
   ============================================================ */
(function (App) {
  "use strict";
  const { icon, escapeHtml, fmt, qs, qsa, on } = App;
  const ui = App.ui;
  const D = App.data;
  const pageHead = App.pageHead;

  const TRIGGERS = [
    { type: "deal_idle", label: "A deal is idle for {n} days", icon: "briefcase", n: 5 },
    { type: "no_reply", label: "A customer hasn't replied in {n} days", icon: "mail", n: 5 },
    { type: "customer_created", label: "A customer is created", icon: "user" },
    { type: "deal_won", label: "A deal is won", icon: "check-circle" },
    { type: "health_drop", label: "Customer health drops below {n}", icon: "trending-down", n: 40 },
    { type: "renewal_near", label: "A contract renews within {n} days", icon: "refresh", n: 30 },
    { type: "review_received", label: "A new review is received", icon: "star" },
  ];
  const ACTIONS = [
    { type: "send_email", icon: "mail", label: "Send an email" },
    { type: "create_task", icon: "check-circle", label: "Create a task" },
    { type: "notify", icon: "bell", label: "Send a notification" },
    { type: "assign", icon: "user", label: "Assign an owner" },
    { type: "slack", icon: "message", label: "Post to a channel" },
    { type: "schedule", icon: "calendar", label: "Schedule a meeting" },
    { type: "add_tag", icon: "tag", label: "Add a tag" },
  ];
  const COND_FIELDS = ["Deal value", "Customer status", "Industry", "Health score", "Owner", "Tag"];
  const COND_OPS = ["is above", "is below", "is", "is not", "contains"];

  const triggerLabel = (t) => { const def = TRIGGERS.find((x) => x.type === (t.type || t)); let l = (t.label || (def && def.label) || t.type); return l.replace("{n}", t.n != null ? t.n : (def && def.n) || 5); };
  const actionMeta = (a) => ACTIONS.find((x) => x.type === a.type) || { icon: a.icon || "zap", label: a.label || a.type };

  /* ---------------- AI: plain English → workflow ---------------- */
  function aiGenerateWorkflow(text) {
    const q = String(text).toLowerCase();
    const numMatch = q.match(/(\d+)\s*day/);
    const n = numMatch ? +numMatch[1] : 5;
    let trigger;
    if (/repl|respond|hear back/.test(q)) trigger = { type: "no_reply", label: TRIGGERS[1].label, n };
    else if (/idle|stall|stuck|no activity/.test(q)) trigger = { type: "deal_idle", label: TRIGGERS[0].label, n };
    else if (/won|closed won/.test(q)) trigger = { type: "deal_won", label: TRIGGERS[3].label };
    else if (/health/.test(q)) trigger = { type: "health_drop", label: TRIGGERS[4].label, n: numMatch ? n : 40 };
    else if (/renew/.test(q)) trigger = { type: "renewal_near", label: TRIGGERS[5].label, n: numMatch ? n : 30 };
    else if (/new (lead|customer|contact)|created|signs? ?up/.test(q)) trigger = { type: "customer_created", label: TRIGGERS[2].label };
    else if (/review/.test(q)) trigger = { type: "review_received", label: TRIGGERS[6].label };
    else trigger = { type: "deal_idle", label: TRIGGERS[0].label, n };

    const actions = [];
    if (/follow.?up|email|send|reach out|message them/.test(q)) actions.push({ type: "send_email", label: "Send a follow-up email" });
    if (/task|to.?do|remind/.test(q)) actions.push({ type: "create_task", label: "Create a task for the owner" });
    if (/notify|alert|flag/.test(q)) actions.push({ type: "notify", label: "Notify the account owner" });
    if (/slack|channel|post/.test(q)) actions.push({ type: "slack", label: "Post to a channel" });
    if (/assign/.test(q)) actions.push({ type: "assign", label: "Assign an owner" });
    if (/schedule|meeting|call/.test(q)) actions.push({ type: "schedule", label: "Schedule a meeting" });
    if (/tag/.test(q)) actions.push({ type: "add_tag", label: "Add a tag" });
    if (!actions.length) actions.push({ type: "send_email", label: "Send a follow-up email" });

    const conditions = [];
    const amt = q.match(/\$?\s?(\d+)\s?k?/);
    if (/above|over|more than|greater/.test(q) && amt) conditions.push({ label: `Deal value is above $${(+amt[1] >= 1000 ? +amt[1] : +amt[1] * 1000).toLocaleString()}` });
    if (/enterprise/.test(q)) conditions.push({ label: "Customer is Enterprise" });
    if (/active/.test(q)) conditions.push({ label: "Status is Active" });

    const nameMap = { no_reply: "Re-engage quiet customers", deal_idle: "Stalled deal follow-up", deal_won: "Won deal celebration", health_drop: "Churn-risk alert", renewal_near: "Renewal reminder", customer_created: "New customer welcome", review_received: "Review response" };
    return { id: App.uid("AU"), name: nameMap[trigger.type] || "New automation", enabled: true, color: D.avatarColor(), trigger, conditions, actions, runs: 0, lastRun: null, created: App.now() };
  }

  /* ---------------- automation card ---------------- */
  function card(a) {
    return `<article class="auto-card ${a.enabled ? "" : "is-off"}" data-auto="${a.id}">
      <div class="auto-card__head">
        <span class="auto-card__icon auto-card__icon--${a.color}">${icon("zap", { size: 18 })}</span>
        <div class="auto-card__title-wrap"><h3 class="auto-card__title">${escapeHtml(a.name)}</h3><p class="auto-card__sub">${a.runs} runs${a.lastRun ? " · last " + fmt.relTime(a.lastRun) : ""}</p></div>
        <label class="switch" data-stop><input type="checkbox" data-auto-toggle="${a.id}" ${a.enabled ? "checked" : ""}/><span class="switch__track"><span class="switch__thumb"></span></span></label>
      </div>
      <div class="auto-flow">
        <div class="auto-step auto-step--when"><span class="auto-step__tag">When</span><span class="auto-step__text">${icon((TRIGGERS.find((t) => t.type === a.trigger.type) || {}).icon || "zap", { size: 15 })}${escapeHtml(triggerLabel(a.trigger))}</span></div>
        ${a.conditions && a.conditions.length ? `<div class="auto-step auto-step--if"><span class="auto-step__tag">If</span><span class="auto-step__text">${a.conditions.map((c) => escapeHtml(c.label)).join(" · ")}</span></div>` : ""}
        <div class="auto-step auto-step--then"><span class="auto-step__tag">Then</span><span class="auto-step__chips">${a.actions.map((ac) => `<span class="auto-action">${icon(actionMeta(ac).icon, { size: 14 })}${escapeHtml(ac.label || actionMeta(ac).label)}</span>`).join("")}</span></div>
      </div>
    </article>`;
  }

  /* ---------------- builder modal ---------------- */
  function builder(existing) {
    const a = existing ? JSON.parse(JSON.stringify(existing)) : { name: "", trigger: { type: "deal_idle", n: 5 }, conditions: [], actions: [{ type: "send_email" }] };
    // dates don't survive JSON for existing; not needed in builder
    const triggerOpts = TRIGGERS.map((t) => `<option value="${t.type}" ${a.trigger.type === t.type ? "selected" : ""}>${escapeHtml(t.label.replace("{n}", "N"))}</option>`).join("");
    const needN = () => { const def = TRIGGERS.find((t) => t.type === a.trigger.type); return def && def.label.includes("{n}"); };
    function condRow(c, i) {
      return `<div class="builder-row" data-cond-row="${i}">
        <select class="select" data-cond-field>${COND_FIELDS.map((f) => `<option ${c.field === f ? "selected" : ""}>${f}</option>`).join("")}</select>
        <select class="select" data-cond-op>${COND_OPS.map((o) => `<option ${c.op === o ? "selected" : ""}>${o}</option>`).join("")}</select>
        <input class="input" data-cond-val value="${escapeHtml(c.val || "")}" placeholder="value"/>
        <button class="icon-btn icon-btn--sm" data-cond-del="${i}" aria-label="Remove">${icon("x", { size: 16 })}</button>
      </div>`;
    }
    function actionRow(ac, i) {
      return `<div class="builder-row builder-row--action" data-act-row="${i}">
        <span class="builder-row__icon">${icon(actionMeta(ac).icon, { size: 16 })}</span>
        <select class="select" data-act-type>${ACTIONS.map((o) => `<option value="${o.type}" ${ac.type === o.type ? "selected" : ""}>${o.label}</option>`).join("")}</select>
        <button class="icon-btn icon-btn--sm" data-act-del="${i}" aria-label="Remove">${icon("x", { size: 16 })}</button>
      </div>`;
    }
    const body = `<form data-form class="builder">
      ${ui.field({ label: "Automation name", name: "name", value: a.name, required: true, placeholder: "e.g. Stalled deal follow-up", wide: true })}
      <div class="builder-block builder-block--when">
        <div class="builder-block__head"><span class="builder-tag builder-tag--when">When</span><span>Trigger</span></div>
        <div class="builder-row"><select class="select" data-trigger>${triggerOpts}</select><input class="input builder-n" data-trigger-n type="number" value="${a.trigger.n || 5}" style="${needN() ? "" : "display:none"}" aria-label="threshold"/></div>
      </div>
      <div class="builder-block builder-block--if">
        <div class="builder-block__head"><span class="builder-tag builder-tag--if">If</span><span>Conditions <small>(optional)</small></span></div>
        <div data-cond-list>${(a.conditions || []).filter((c) => c.field).map(condRow).join("")}</div>
        <button type="button" class="btn btn--ghost btn--sm" data-add-cond>${icon("plus", { size: 15 })}Add condition</button>
      </div>
      <div class="builder-block builder-block--then">
        <div class="builder-block__head"><span class="builder-tag builder-tag--then">Then</span><span>Actions</span></div>
        <div data-act-list>${a.actions.map(actionRow).join("")}</div>
        <button type="button" class="btn btn--ghost btn--sm" data-add-act>${icon("plus", { size: 15 })}Add action</button>
      </div>
    </form>`;
    ui.modal({
      title: existing ? "Edit automation" : "New automation", subtitle: "When → If → Then", size: "lg", body,
      footer: `<button class="btn btn--ghost" data-act="cancel">Cancel</button><button class="btn btn--primary" data-act="save">${existing ? "Save automation" : "Create automation"}</button>`,
      onMount(root, ctrl) {
        const condList = qs("[data-cond-list]", root), actList = qs("[data-act-list]", root);
        let conds = (a.conditions || []).filter((c) => c.field).slice();
        let acts = a.actions.slice();
        const reCond = () => (condList.innerHTML = conds.map(condRow).join(""));
        const reAct = () => (actList.innerHTML = acts.map(actionRow).join(""));
        on(root, "change", "[data-trigger]", (e, t) => { a.trigger.type = t.value; const def = TRIGGERS.find((x) => x.type === t.value); qs("[data-trigger-n]", root).style.display = def && def.label.includes("{n}") ? "" : "none"; });
        on(root, "click", "[data-add-cond]", () => { conds.push({ field: COND_FIELDS[0], op: COND_OPS[0], val: "" }); reCond(); });
        on(root, "click", "[data-cond-del]", (e, t) => { conds.splice(+t.dataset.condDel, 1); reCond(); });
        on(root, "click", "[data-add-act]", () => { acts.push({ type: "create_task" }); reAct(); });
        on(root, "click", "[data-act-del]", (e, t) => { if (acts.length > 1) { acts.splice(+t.dataset.actDel, 1); reAct(); } else ui.toast("Keep at least one action", { type: "warning" }); });
        on(root, "change", "[data-act-type]", (e, t) => { const row = t.closest("[data-act-row]"); acts[+row.dataset.actRow] = { type: t.value }; reAct(); });
        on(root, "click", '[data-act="cancel"]', ctrl.close);
        on(root, "click", '[data-act="save"]', () => {
          const { valid, values } = ui.validate(qs("[data-form]", root));
          if (!valid) return;
          // collect conditions
          conds = qsa("[data-cond-row]", root).map((row) => { const f = qs("[data-cond-field]", row).value, op = qs("[data-cond-op]", row).value, val = qs("[data-cond-val]", row).value; return { field: f, op, val, label: `${f} ${op} ${val}` }; }).filter((c) => c.val !== "");
          const trig = { type: qs("[data-trigger]", root).value, n: +qs("[data-trigger-n]", root).value || undefined };
          const finalActs = qsa("[data-act-row]", root).map((row) => ({ type: qs("[data-act-type]", row).value }));
          const obj = { name: values.name, trigger: trig, conditions: conds, actions: finalActs, color: a.color || D.avatarColor(), enabled: existing ? existing.enabled : true };
          if (existing) Object.assign(existing, obj);
          else D.automations.unshift(Object.assign({ id: App.uid("AU"), runs: 0, lastRun: null, created: App.now() }, obj));
          ctrl.close(); App.router.reload(); ui.toast(existing ? "Automation saved" : "Automation created", { type: "success", desc: values.name });
        });
      },
    });
  }

  /* ---------------- AI generator modal ---------------- */
  function aiBuilder() {
    const examples = ["When a customer doesn't reply after 5 days, send a follow-up email.", "When a deal is won above $25k, post to the deals channel.", "When customer health drops below 40, notify success and create a save task."];
    ui.modal({
      title: "Describe your automation", subtitle: "AI will build the workflow for you", size: "lg",
      body: `<div class="ai-callout ai-callout--slim"><div class="ai-callout__head">${icon("sparkles", { size: 15 })}<b>Plain-English automation</b></div></div>
        <form data-form>${ui.field({ label: "What should happen?", name: "desc", type: "textarea", rows: 3, required: true, wide: true, value: examples[0] })}</form>
        <div class="ai-examples">${examples.map((e) => `<button class="ai-chip" data-ex="${escapeHtml(e)}">${escapeHtml(e)}</button>`).join("")}</div>
        <div data-ai-preview></div>`,
      footer: `<button class="btn btn--ghost" data-act="cancel">Cancel</button><button class="btn btn--secondary" data-act="gen">${icon("sparkles", { size: 16 })}Generate</button><button class="btn btn--primary" data-act="create" disabled>Create automation</button>`,
      onMount(root, ctrl) {
        let generated = null;
        const preview = qs("[data-ai-preview]", root);
        const gen = () => {
          const text = qs('[name="desc"]', root).value.trim(); if (!text) return;
          generated = aiGenerateWorkflow(text);
          preview.innerHTML = `<div class="auto-preview">${card(generated)}</div>`;
          qs('[data-act="create"]', root).disabled = false;
        };
        on(root, "click", "[data-ex]", (e, t) => { qs('[name="desc"]', root).value = t.dataset.ex; gen(); });
        on(root, "click", '[data-act="gen"]', gen);
        on(root, "click", '[data-act="cancel"]', ctrl.close);
        on(root, "click", '[data-act="create"]', () => { if (!generated) return; D.automations.unshift(generated); ctrl.close(); App.router.reload(); ui.toast("Automation created by AI", { type: "success", desc: generated.name }); });
      },
    });
  }

  /* ---------------- page ---------------- */
  App.pages.automations = {
    title: "Automations",
    render() {
      const active = D.automations.filter((a) => a.enabled).length;
      const totalRuns = D.automations.reduce((a, x) => a + x.runs, 0);
      const stats = `<section class="cards cards--mini">
        ${miniStat("Active automations", active, "zap")}
        ${miniStat("Runs this month", fmt.num(totalRuns), "activity")}
        ${miniStat("Est. time saved", Math.round(totalRuns * 4 / 60) + "h", "clock")}
        ${miniStat("Total workflows", D.automations.length, "branch")}
      </section>`;
      const actions = `<button class="btn btn--secondary" data-ai-build>${icon("sparkles", { size: 18 })}<span>Build with AI</span></button>` + `<button class="btn btn--primary" data-new>${icon("plus", { size: 18 })}<span>New automation</span></button>`;
      const cards = D.automations.map(card).join("");
      const runs = D.automationRuns.map((r) => `<li class="runlog"><span class="runlog__icon runlog__icon--${r.status}">${icon(r.status === "success" ? "check-circle" : "minus", { size: 14 })}</span><div class="runlog__main"><div class="cell-strong">${escapeHtml(r.result)}</div><div class="cell-sub">${escapeHtml(r.automation)}</div></div><span class="runlog__time">${fmt.relTime(r.time)}</span></li>`).join("");
      const grid = `<div class="dash-grid">
        <div class="dash-col-8"><div class="auto-list">${cards}</div></div>
        <div class="dash-col-4">${panel("Run log", `<ul class="runlog-list">${runs}</ul>`, { sub: "Recent automation activity" })}</div>
      </div>`;
      return pageHead({ title: "Automations", sub: "Put your busywork on autopilot", actions }) + stats + grid;
    },
    init(root) {
      on(root, "click", "[data-new]", () => builder(null));
      on(root, "click", "[data-ai-build]", () => aiBuilder());
      on(root, "click", "[data-auto-toggle]", (e, t) => { e.stopPropagation(); const a = D.automations.find((x) => x.id === t.dataset.autoToggle); if (a) { a.enabled = t.checked; t.closest(".auto-card").classList.toggle("is-off", !a.enabled); ui.toast(`${a.name} ${a.enabled ? "enabled" : "paused"}`, { type: a.enabled ? "success" : "info" }); } });
      on(root, "click", "[data-stop]", (e) => e.stopPropagation());
      on(root, "click", "[data-auto]", (e, t) => { if (e.target.closest(".switch")) return; builder(D.automations.find((x) => x.id === t.dataset.auto)); });
    },
  };

  function miniStat(label, value, ic) { return `<article class="card stat-mini stat-mini--btn" style="cursor:default"><span class="stat-mini__icon">${icon(ic, { size: 18 })}</span><span class="stat-mini__body"><span class="stat-mini__value">${value}</span><span class="card__label">${escapeHtml(label)}</span></span></article>`; }
  function panel(title, body, o) { o = o || {}; return `<section class="panel"><header class="panel__head"><div class="panel__head-main"><h3 class="panel__title">${escapeHtml(title)}</h3>${o.sub ? `<p class="panel__sub">${escapeHtml(o.sub)}</p>` : ""}</div></header><div class="panel__body">${body}</div></section>`; }
})(window.App);
