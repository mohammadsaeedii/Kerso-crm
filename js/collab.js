/* ============================================================
   Kerso CRM — Collaboration & Timeline (reusable)
   App.timeline — a unified activity timeline component
     (calls, emails, meetings, comments, documents, status
      changes, automation events, AI summaries) — feature #8.
   App.collab — comments + @mentions, presence avatars and an
     activity feed — feature #12.
   Builders return HTML strings; wire(root) attaches behaviour,
   matching the rest of the app's conventions.
   ============================================================ */
(function (App) {
  "use strict";
  const { icon, escapeHtml, fmt, qs, qsa, on, node } = App;
  const ui = App.ui;
  const D = App.data;

  /* ---------------- Timeline ---------------- */
  const KIND = {
    email:      { icon: "mail",        color: "sky",     label: "Email" },
    call:       { icon: "phone",       color: "emerald", label: "Call" },
    meeting:    { icon: "video",       color: "indigo",  label: "Meeting" },
    note:       { icon: "edit",        color: "violet",  label: "Note" },
    comment:    { icon: "message",     color: "amber",   label: "Comment" },
    document:   { icon: "file-text",   color: "blue",    label: "Document" },
    file:       { icon: "paperclip",   color: "blue",    label: "Document" },
    status:     { icon: "flag",        color: "slate",   label: "Status change" },
    deal:       { icon: "briefcase",   color: "indigo",  label: "Deal" },
    automation: { icon: "zap",         color: "amber",   label: "Automation" },
    ai:         { icon: "sparkles",    color: "indigo",  label: "AI summary" },
  };

  function timelineItem(e) {
    const k = KIND[e.kind] || KIND.note;
    const meta = e.meta ? `<span class="tl__meta">${escapeHtml(e.meta)}</span>` : "";
    return `<li class="tl__item tl__item--${e.kind}" data-tl-kind="${e.kind}">
      <span class="tl__dot tl__dot--${k.color}">${icon(k.icon, { size: 14 })}</span>
      <div class="tl__body">
        <p class="tl__title">${App.collab.renderText(e.title)}</p>
        <div class="tl__sub">
          <span class="tl__who">${escapeHtml(e.who || "System")}</span>
          ${meta}
          <span class="tl__time">${fmt.relTime(e.time)}</span>
        </div>
      </div>
    </li>`;
  }

  /** render(events, { filter, compact, limit }) */
  function renderTimeline(events, opts) {
    opts = opts || {};
    let list = events.slice();
    if (opts.filter && opts.filter !== "all") {
      const grp = opts.filter;
      list = list.filter((e) => e.kind === grp || (grp === "document" && (e.kind === "file" || e.kind === "document")));
    }
    if (opts.limit) list = list.slice(0, opts.limit);
    if (!list.length) return ui.emptyState({ icon: "activity", title: "Nothing here yet", desc: "Activity will appear on this timeline." });
    return `<ul class="tl ${opts.compact ? "tl--compact" : ""}">${list.map(timelineItem).join("")}</ul>`;
  }

  /** Filter chips for a timeline; counts derived from events */
  function timelineFilters(events, active) {
    active = active || "all";
    const present = Array.from(new Set(events.map((e) => (e.kind === "file" ? "document" : e.kind))));
    const order = ["all", "email", "call", "meeting", "note", "comment", "document", "status", "automation", "ai"];
    const chips = ["all"].concat(order.filter((k) => k !== "all" && present.includes(k)));
    return `<div class="tl-filters" role="tablist">${chips.map((k) => {
      const label = k === "all" ? "All" : (KIND[k] || { label: k }).label;
      return `<button class="tl-filter ${k === active ? "is-active" : ""}" data-tl-filter="${k}" role="tab">${label}</button>`;
    }).join("")}</div>`;
  }

  /* ---------------- @mention rendering ---------------- */
  function renderText(text) {
    let out = escapeHtml(text);
    // highlight @Mentions of known team members (longest-first to match full names)
    const names = (D.team || []).map((t) => t.name).sort((a, b) => b.length - a.length);
    names.forEach((n) => {
      const re = new RegExp("@" + n.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "g");
      out = out.replace(re, `<span class="mention">@${escapeHtml(n.split(" ")[0])}</span>`);
    });
    // also catch @firstname
    (D.team || []).forEach((t) => {
      const fn = t.name.split(" ")[0];
      const re = new RegExp("@" + fn + "\\b(?![^<]*</span>)", "g");
      out = out.replace(re, `<span class="mention">@${escapeHtml(fn)}</span>`);
    });
    return out;
  }

  /* ---------------- Presence ---------------- */
  function presenceBar(users, opts) {
    opts = opts || {};
    users = users || (D.team || []).filter((t) => t.online).slice(0, 4);
    const label = opts.label || (users.length + " " + (opts.verb || "online"));
    return `<div class="presence" data-tip="${escapeHtml(users.map((u) => u.name).join(", "))}">
      <span class="presence__avatars">${users.slice(0, 4).map((u) => ui.avatar(u.name, u.color, opts.size || 26, { online: opts.dots ? u.online : null })).join("")}</span>
      ${opts.hideLabel ? "" : `<span class="presence__label">${escapeHtml(label)}</span>`}
    </div>`;
  }

  /* ---------------- Comments + @mentions ---------------- */
  /** mount(container, { entityId, seed }) — renders thread + composer with @mention autocomplete */
  function mountComments(container, opts) {
    opts = opts || {};
    const id = opts.entityId || "global";
    D.comments[id] = D.comments[id] || (opts.seed || []);
    const me = D.currentUser.name;

    const list = () => D.comments[id];
    function commentHTML(c) {
      const u = D.teammate(c.author);
      return `<li class="cmt">
        ${ui.avatar(c.author, u.color, 30)}
        <div class="cmt__body">
          <div class="cmt__head"><b>${escapeHtml(c.author)}</b><span class="cmt__time">${fmt.relTime(c.time)}</span></div>
          <p class="cmt__text">${renderText(c.text)}</p>
        </div>
      </li>`;
    }
    function draw() {
      const items = list();
      qs("[data-cmt-list]", container).innerHTML = items.length
        ? `<ul class="cmt-list">${items.map(commentHTML).join("")}</ul>`
        : `<p class="cmt-empty">No comments yet. Start the conversation — use <b>@</b> to mention a teammate.</p>`;
    }

    container.innerHTML = `
      <div class="cmt-wrap">
        <div data-cmt-list></div>
        <form class="cmt-form" data-cmt-form>
          <div class="cmt-input-wrap">
            ${ui.avatar(me, D.teammate(me).color, 30)}
            <div class="cmt-field">
              <textarea class="textarea cmt-input" data-cmt-input rows="1" placeholder="Write a comment… @ to mention"></textarea>
              <div class="mention-menu" data-mention-menu hidden></div>
            </div>
          </div>
          <div class="cmt-actions"><button class="btn btn--primary btn--sm" type="submit">${icon("send", { size: 15 })}Comment</button></div>
        </form>
      </div>`;
    draw();

    const input = qs("[data-cmt-input]", container);
    const menu = qs("[data-mention-menu]", container);
    let mentionActive = false, mentionStart = -1, mentionIdx = 0, matches = [];

    function autosize() { input.style.height = "auto"; input.style.height = Math.min(140, input.scrollHeight) + "px"; }
    function closeMenu() { menu.hidden = true; mentionActive = false; }
    function openMenu(q) {
      matches = (D.team || []).filter((t) => t.name.toLowerCase().includes(q) || t.handle.includes(q)).slice(0, 5);
      if (!matches.length) return closeMenu();
      mentionIdx = 0;
      menu.innerHTML = matches.map((m, i) => `<button type="button" class="mention-opt ${i === 0 ? "is-active" : ""}" data-mention="${escapeHtml(m.name)}">${ui.avatar(m.name, m.color, 24)}<span class="mention-opt__name">${escapeHtml(m.name)}</span><span class="mention-opt__role">${escapeHtml(m.role)}</span></button>`).join("");
      menu.hidden = false; mentionActive = true;
    }
    function detectMention() {
      const val = input.value, pos = input.selectionStart;
      const upto = val.slice(0, pos);
      const m = upto.match(/@([\w]*)$/);
      if (m) { mentionStart = pos - m[0].length; openMenu(m[1].toLowerCase()); }
      else closeMenu();
    }
    function insertMention(name) {
      const val = input.value, pos = input.selectionStart;
      input.value = val.slice(0, mentionStart) + "@" + name + " " + val.slice(pos);
      closeMenu(); input.focus(); autosize();
    }

    on(input, "input", () => { autosize(); detectMention(); });
    on(input, "keydown", (e) => {
      if (mentionActive) {
        if (e.key === "ArrowDown") { e.preventDefault(); mentionIdx = (mentionIdx + 1) % matches.length; }
        else if (e.key === "ArrowUp") { e.preventDefault(); mentionIdx = (mentionIdx - 1 + matches.length) % matches.length; }
        else if (e.key === "Enter" || e.key === "Tab") { e.preventDefault(); insertMention(matches[mentionIdx].name); return; }
        else if (e.key === "Escape") { closeMenu(); return; }
        else return;
        qsa(".mention-opt", menu).forEach((el, i) => el.classList.toggle("is-active", i === mentionIdx));
        return;
      }
      if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) { e.preventDefault(); qs("[data-cmt-form]", container).requestSubmit(); }
    });
    on(menu, "click", "[data-mention]", (e, t) => insertMention(t.dataset.mention));
    on(qs("[data-cmt-form]", container), "submit", (e) => {
      e.preventDefault();
      const text = input.value.trim();
      if (!text) return;
      list().push({ id: App.uid("c"), author: me, text, time: App.now() });
      input.value = ""; autosize(); draw();
      opts.onAdd && opts.onAdd(text);
      // notify mentioned teammates
      const mentioned = (D.team || []).filter((u) => new RegExp("@" + u.name.split(" ")[0], "i").test(text));
      if (mentioned.length) ui.toast(`Notified ${mentioned.map((m) => m.name.split(" ")[0]).join(", ")}`, { type: "info" });
    });
    return { redraw: draw, count: () => list().length };
  }

  /* ---------------- Activity feed (shared) ---------------- */
  function activityFeed(items, opts) {
    opts = opts || {};
    items = items || D.activities;
    const actIcon = (t) => ({ deal: "briefcase", review: "star", customer: "user", task: "check", message: "message", file: "paperclip", automation: "zap" }[t] || "info");
    const rows = items.map((a) => `<li class="act">
      <span class="act__dot act__dot--${a.color}">${icon(actIcon(a.type), { size: 14 })}</span>
      <div class="act__body"><p class="act__text"><b>${escapeHtml(a.who)}</b> ${App.collab.renderText ? a.text : escapeHtml(a.text)}</p><span class="act__time">${fmt.relTime(a.time)}</span></div>
    </li>`).join("");
    return `<ul class="act-list ${opts.compact ? "act-list--compact" : ""}">${rows}</ul>`;
  }

  App.timeline = { render: renderTimeline, filters: timelineFilters, KIND, item: timelineItem };
  App.collab = { renderText, presenceBar, mountComments, activityFeed };
})(window.App);
