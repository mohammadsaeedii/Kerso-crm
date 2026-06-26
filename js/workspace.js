/* ============================================================
   Kerso CRM — Unified Workspace (feature #1, #9, #15)
   A single workspace that brings Chat, Notes, Tasks, Calendar,
   Files, Documents, Whiteboard, Knowledge Base and Bookmarks
   together — all working against existing CRM data.
   Registered as App.pages.workspace (route #/workspace).
   ============================================================ */
(function (App) {
  "use strict";
  const { icon, escapeHtml, fmt, qs, qsa, on } = App;
  const ui = App.ui;
  const D = App.data;
  const pageHead = App.pageHead;

  const state = App.store.get("ws:state", {}) || {};
  const setState = (k, v) => { state[k] = v; App.store.set("ws:state", state); };
  state.tool = state.tool || "chat";

  const panel = (title, body, o) => { o = o || {}; return `<section class="panel ${o.class || ""}">${title ? `<header class="panel__head"><div class="panel__head-main"><h3 class="panel__title">${escapeHtml(title)}</h3>${o.sub ? `<p class="panel__sub">${escapeHtml(o.sub)}</p>` : ""}</div>${o.actions ? `<div class="panel__actions">${o.actions}</div>` : ""}</header>` : ""}<div class="panel__body ${o.flush ? "panel__body--flush" : ""}">${body}</div></section>`; };
  const btn = (label, o) => { o = o || {}; return `<button type="button" class="btn ${o.variant ? "btn--" + o.variant : "btn--secondary"} ${o.size ? "btn--" + o.size : ""}" ${o.attrs || ""}>${o.icon ? icon(o.icon, { size: o.iconSize || 18 }) : ""}${label ? `<span>${escapeHtml(label)}</span>` : ""}</button>`; };

  /* ============================================================ CHAT */
  const Chat = {
    render() {
      const cid = state.chat || D.chats[0].id;
      const list = D.chats.map((c) => {
        const last = c.messages[c.messages.length - 1];
        const isCh = c.kind === "channel";
        return `<button class="chat-conv ${c.id === cid ? "is-active" : ""}" data-chat="${c.id}">
          <span class="chat-conv__icon ${isCh ? "chat-conv__icon--ch" : ""}">${isCh ? icon("hash", { size: 16 }) : ui.avatar(c.name, c.color, 34, { online: true })}</span>
          <span class="chat-conv__main"><span class="chat-conv__name">${isCh ? "#" + escapeHtml(c.name) : escapeHtml(c.name)}</span><span class="chat-conv__preview">${escapeHtml(last ? last.text : "")}</span></span>
          ${c.unread ? `<span class="chat-conv__badge">${c.unread}</span>` : `<span class="chat-conv__time">${fmt.relTime(last.time)}</span>`}
        </button>`;
      }).join("");
      return `<div class="chat">
        <aside class="chat__list"><div class="chat__list-head">${icon("message", { size: 16 })}<span>Conversations</span></div>${list}</aside>
        <section class="chat__main" data-chat-main>${this.thread(cid)}</section>
      </div>`;
    },
    thread(cid) {
      const c = D.chats.find((x) => x.id === cid) || D.chats[0];
      c.unread = 0;
      const isCh = c.kind === "channel";
      const msgs = c.messages.map((m) => {
        const mine = m.me || m.from === D.currentUser.name;
        const u = D.teammate(m.from);
        return `<div class="cmsg ${mine ? "cmsg--me" : ""}">
          ${mine ? "" : ui.avatar(m.from, u.color, 30)}
          <div class="cmsg__body"><div class="cmsg__head">${mine ? "" : `<b>${escapeHtml(m.from)}</b>`}<span class="cmsg__time">${fmt.relTime(m.time)}</span></div><div class="cmsg__bubble">${App.collab.renderText(m.text)}</div></div>
        </div>`;
      }).join("");
      return `<header class="chat__head">
          <div class="chat__head-main"><span class="chat__head-icon">${isCh ? icon("hash", { size: 18 }) : ui.avatar(c.name, c.color, 36, { online: true })}</span><div><h3 class="chat__head-name">${isCh ? "#" + escapeHtml(c.name) : escapeHtml(c.name)}</h3><p class="chat__head-sub">${isCh ? c.members + " members" : "Direct message · online"}</p></div></div>
          <div class="chat__head-actions">${App.collab.presenceBar(D.team.filter((t) => t.online).slice(0, 3), { hideLabel: true, size: 26 })}<button class="icon-btn icon-btn--sm" data-tip="Call">${icon("phone", { size: 18 })}</button><button class="icon-btn icon-btn--sm" data-tip="Video">${icon("video", { size: 18 })}</button></div>
        </header>
        <div class="chat__scroll" data-chat-scroll>${msgs}</div>
        <form class="chat__composer" data-chat-form><input class="input" data-chat-input placeholder="Message ${isCh ? "#" + c.name : c.name}…" autocomplete="off"/><button class="btn btn--primary" type="submit" aria-label="Send">${icon("send", { size: 18 })}</button></form>`;
    },
    init(root) {
      const scrollBottom = () => { const s = qs("[data-chat-scroll]", root); if (s) s.scrollTop = s.scrollHeight; };
      scrollBottom();
      on(root, "click", "[data-chat]", (e, t) => {
        state.chat = t.dataset.chat; setState("chat", state.chat);
        qs("[data-chat-main]", root).innerHTML = this.thread(state.chat);
        qsa("[data-chat]", root).forEach((b) => b.classList.toggle("is-active", b === t));
        const badge = qs(".chat-conv__badge", t); if (badge) badge.remove();
        scrollBottom();
      });
      on(root, "submit", "[data-chat-form]", (e) => {
        e.preventDefault();
        const inp = qs("[data-chat-input]", root); const v = inp.value.trim(); if (!v) return;
        const c = D.chats.find((x) => x.id === (state.chat || D.chats[0].id));
        c.messages.push({ id: App.uid("m"), from: D.currentUser.name, text: v, time: App.now(), me: true });
        inp.value = "";
        qs("[data-chat-main]", root).innerHTML = this.thread(c.id); scrollBottom();
        // simulated reply for DMs
        if (c.kind === "dm") setTimeout(() => {
          c.messages.push({ id: App.uid("m"), from: c.name, text: App.ai ? "Thanks! " + App.ai.bestTimeToContact({ id: c.id }).split(" · ")[0] + " works for me." : "Sounds good!", time: App.now() });
          if ((state.chat || D.chats[0].id) === c.id) { qs("[data-chat-main]", root).innerHTML = this.thread(c.id); scrollBottom(); }
        }, 1400);
      });
    },
  };

  /* ============================================================ NOTES */
  const Notes = {
    grid() {
      const q = (state.notesQ || "").toLowerCase();
      let list = D.notes.slice().sort((a, b) => (b.pinned - a.pinned) || (+b.updated - +a.updated));
      if (q) list = list.filter((n) => (n.title + n.body + n.tags.join(" ")).toLowerCase().includes(q));
      return list.length ? list.map((n) => `<article class="note-card note-card--${n.color}" data-note="${n.id}">
          <div class="note-card__top"><h3 class="note-card__title">${escapeHtml(n.title)}</h3><button class="note-card__pin ${n.pinned ? "is-on" : ""}" data-note-pin="${n.id}" data-tip="${n.pinned ? "Unpin" : "Pin"}" aria-label="Pin">${icon("pin", { size: 15 })}</button></div>
          <p class="note-card__body">${escapeHtml(n.body)}</p>
          <div class="note-card__foot"><div class="chips">${n.tags.map((t) => ui.pill(t, "indigo")).join("")}</div><span class="note-card__meta">${escapeHtml(n.author.split(" ")[0])} · ${fmt.relTime(n.updated)}</span></div>
        </article>`).join("") : ui.emptyState({ icon: "edit", title: "No notes found", desc: "Capture a thought — notes sync across your workspace." });
    },
    render() {
      const toolbar = `<div class="filterbar"><div class="filterbar__search">${icon("search", { size: 18, class: "filterbar__searchicon" })}<input class="input" data-notes-search placeholder="Search notes…" value="${escapeHtml(state.notesQ || "")}"/></div><div class="filterbar__controls">${btn("New note", { icon: "plus", variant: "primary", attrs: "data-note-new" })}</div></div>`;
      return toolbar + `<div class="note-grid" data-note-grid>${this.grid()}</div>`;
    },
    init(root) {
      const search = qs("[data-notes-search]", root);
      on(search, "input", App.debounce(() => { setState("notesQ", search.value); qs("[data-note-grid]", root).innerHTML = this.grid(); }, 160));
      on(root, "click", "[data-note-new]", () => this.edit(null, root));
      on(root, "click", "[data-note-pin]", (e, t) => { e.stopPropagation(); const n = D.notes.find((x) => x.id === t.dataset.notePin); if (n) { n.pinned = !n.pinned; redrawTool(root, "notes"); } });
      on(root, "click", "[data-note]", (e, t) => { if (e.target.closest("[data-note-pin]")) return; this.edit(D.notes.find((x) => x.id === t.dataset.note), root); });
    },
    edit(existing, root) {
      const e = existing || {};
      const body = `<form data-form>
        ${ui.field({ label: "Title", name: "title", value: e.title, required: true, wide: true, placeholder: "Note title" })}
        ${ui.field({ label: "Note", name: "body", type: "textarea", rows: 6, value: e.body, wide: true, placeholder: "Write your note…" })}
        ${ui.field({ label: "Tags (comma separated)", name: "tags", value: (e.tags || []).join(", "), wide: true, placeholder: "Strategy, Meeting" })}
      </form>`;
      ui.modal({
        title: existing ? "Edit note" : "New note", size: "lg", body,
        footer: `${existing ? `<button class="btn btn--danger" data-act="del">${icon("trash", { size: 16 })}Delete</button>` : ""}<button class="btn btn--ghost" data-act="cancel">Cancel</button><button class="btn btn--primary" data-act="save">${existing ? "Save" : "Add note"}</button>`,
        onMount(r, c) {
          on(r, "click", '[data-act="cancel"]', c.close);
          on(r, "click", '[data-act="del"]', () => { const i = D.notes.indexOf(existing); if (i > -1) D.notes.splice(i, 1); c.close(); redrawTool(root, "notes"); ui.toast("Note deleted", { type: "success" }); });
          on(r, "click", '[data-act="save"]', () => {
            const { valid, values } = ui.validate(qs("[data-form]", r)); if (!valid) return;
            const tags = values.tags ? values.tags.split(",").map((s) => s.trim()).filter(Boolean) : [];
            if (existing) Object.assign(existing, { title: values.title, body: values.body, tags, updated: App.now() });
            else D.notes.unshift({ id: App.uid("NT"), title: values.title, body: values.body, tags, color: D.avatarColor(), author: D.currentUser.name, pinned: false, updated: App.now() });
            c.close(); redrawTool(root, "notes"); ui.toast(existing ? "Note saved" : "Note added", { type: "success" });
          });
        },
      });
    },
  };

  /* ============================================================ TASKS (Kanban) */
  const COLS = [{ id: "todo", label: "To do" }, { id: "doing", label: "In progress" }, { id: "done", label: "Done" }];
  const Tasks = {
    render() {
      const cols = COLS.map((col) => {
        const items = D.tasks.filter((t) => (t.status || (t.done ? "done" : "todo")) === col.id);
        const cards = items.map((t) => this.card(t)).join("") || `<div class="kan__empty">No tasks</div>`;
        return `<div class="kan__col" data-col="${col.id}"><header class="kan__col-head"><span class="kan__col-title">${col.label}</span><span class="kan__col-count">${items.length}</span></header><div class="kan__drop" data-drop="${col.id}">${cards}</div><button class="kan__add" data-task-add-col="${col.id}">${icon("plus", { size: 15 })}Add task</button></div>`;
      }).join("");
      return `<div class="kan-head">${pageHeadInline("Task board", `${D.tasks.filter((t) => t.status !== "done").length} open · drag cards between columns`)}${btn("New task", { icon: "plus", variant: "primary", attrs: "data-task-new" })}</div><div class="kan">${cols}</div>`;
    },
    card(t) {
      const overdue = (t.status !== "done") && t.due < App.now();
      return `<article class="kan__card" draggable="true" data-task="${t.id}">
        <div class="kan__card-top"><span class="task__pri task__pri--${t.priority}">${fmt.title(t.priority)}</span><button class="kan__card-menu icon-btn icon-btn--sm" data-task-menu="${t.id}" aria-label="Task options">${icon("more-h", { size: 16 })}</button></div>
        <p class="kan__card-title">${escapeHtml(t.title)}</p>
        <div class="kan__card-foot"><span class="task__due ${overdue ? "is-overdue" : ""}">${icon("clock", { size: 13 })}${overdue ? "Overdue · " : ""}${fmt.relTime(t.due)}</span>${ui.avatar(t.assignee, D.teammate(t.assignee).color, 24)}</div>
      </article>`;
    },
    init(root) {
      let dragId = null;
      on(root, "dragstart", "[data-task]", (e, t) => { dragId = t.dataset.task; t.classList.add("is-dragging"); });
      on(root, "dragend", "[data-task]", (e, t) => { t.classList.remove("is-dragging"); qsa(".is-drop-target", root).forEach((el) => el.classList.remove("is-drop-target")); });
      on(root, "dragover", "[data-drop]", (e, t) => { e.preventDefault(); t.classList.add("is-drop-target"); });
      on(root, "dragleave", "[data-drop]", (e, t) => { if (!t.contains(e.relatedTarget)) t.classList.remove("is-drop-target"); });
      on(root, "drop", "[data-drop]", (e, t) => {
        e.preventDefault(); t.classList.remove("is-drop-target");
        const task = D.tasks.find((x) => x.id === dragId); if (!task) return;
        task.status = t.dataset.drop; task.done = task.status === "done";
        redrawTool(root, "tasks"); App.bus.emit("tasks:changed");
      });
      on(root, "click", "[data-task-new]", () => App.create.task());
      on(root, "click", "[data-task-add-col]", (e, t) => App.create.task());
      on(root, "click", "[data-task-menu]", (e, t) => {
        e.stopPropagation();
        const task = D.tasks.find((x) => x.id === t.dataset.taskMenu);
        ui.popover(t, ui.menuList([
          { label: "Mark complete", icon: "check-circle", value: "done" },
          { label: "Move to In progress", icon: "play", value: "doing" },
          { label: "Move to To do", icon: "list", value: "todo" },
          "divider",
          { label: "Delete", icon: "trash", value: "del", danger: true },
        ]), { align: "end", onSelect: (v) => {
          if (v === "del") { const i = D.tasks.indexOf(task); if (i > -1) D.tasks.splice(i, 1); }
          else { task.status = v; task.done = v === "done"; }
          redrawTool(root, "tasks"); App.bus.emit("tasks:changed");
        } });
      });
      App.bus.on("tasks:changed", () => { if (qs("[data-drop]", root)) redrawTool(root, "tasks"); });
    },
  };

  /* ============================================================ CALENDAR */
  const Calendar = {
    cur() { const c = state.cal; if (c) return c; const n = App.now(); return { y: n.getFullYear(), m: n.getMonth() }; },
    render() {
      const { y, m } = this.cur();
      const first = new Date(y, m, 1);
      const startDay = first.getDay();
      const daysIn = new Date(y, m + 1, 0).getDate();
      const today = App.now();
      const byDay = {};
      D.calendarEvents.forEach((e) => { const d = new Date(e.date); if (d.getFullYear() === y && d.getMonth() === m) (byDay[d.getDate()] = byDay[d.getDate()] || []).push(e); });
      const monthName = first.toLocaleDateString("en-US", { month: "long", year: "numeric" });
      const dow = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => `<div class="cal__dow">${d}</div>`).join("");
      let cells = "";
      for (let i = 0; i < startDay; i++) cells += `<div class="cal__cell cal__cell--pad"></div>`;
      for (let d = 1; d <= daysIn; d++) {
        const evs = byDay[d] || [];
        const isToday = today.getFullYear() === y && today.getMonth() === m && today.getDate() === d;
        const chips = evs.slice(0, 3).map((e) => `<span class="cal__event cal__event--${e.color}" data-event="${e.id}">${escapeHtml(e.title)}</span>`).join("");
        cells += `<div class="cal__cell ${isToday ? "is-today" : ""}" data-day="${d}"><span class="cal__num">${d}</span><div class="cal__events">${chips}${evs.length > 3 ? `<span class="cal__more">+${evs.length - 3} more</span>` : ""}</div></div>`;
      }
      const upcoming = D.calendarEvents.slice().filter((e) => new Date(e.date) >= new Date(today.getFullYear(), today.getMonth(), today.getDate())).sort((a, b) => +new Date(a.date) - +new Date(b.date)).slice(0, 5)
        .map((e) => `<li class="cal-up" data-event="${e.id}"><span class="cal-up__icon cal-up__icon--${e.color}">${icon(e.icon, { size: 15 })}</span><div class="cal-up__main"><div class="cell-strong">${escapeHtml(e.title)}</div><div class="cell-sub">${fmt.dateShort(e.date)} · ${escapeHtml(e.start)}</div></div></li>`).join("");
      return `<div class="cal-layout">
        <div class="panel cal-panel"><header class="panel__head"><div class="panel__head-main"><h3 class="panel__title">${escapeHtml(monthName)}</h3></div><div class="panel__actions"><button class="icon-btn icon-btn--sm" data-cal="prev" aria-label="Previous month">${icon("chevron-left", { size: 18 })}</button><button class="btn btn--ghost btn--sm" data-cal="today">Today</button><button class="icon-btn icon-btn--sm" data-cal="next" aria-label="Next month">${icon("chevron-right", { size: 18 })}</button>${btn("New event", { icon: "plus", variant: "primary", size: "sm", attrs: "data-event-new" })}</div></header><div class="panel__body panel__body--flush"><div class="cal"><div class="cal__grid cal__grid--dow">${dow}</div><div class="cal__grid">${cells}</div></div></div></div>
        <div class="panel cal-side">${panelHead("Upcoming")}<ul class="cal-up-list">${upcoming || `<li class="side-empty">No upcoming events</li>`}</ul></div>
      </div>`;
    },
    init(root) {
      on(root, "click", "[data-cal]", (e, t) => {
        const c = this.cur();
        if (t.dataset.cal === "prev") { c.m--; if (c.m < 0) { c.m = 11; c.y--; } }
        else if (t.dataset.cal === "next") { c.m++; if (c.m > 11) { c.m = 0; c.y++; } }
        else { const n = App.now(); c.y = n.getFullYear(); c.m = n.getMonth(); }
        setState("cal", c); redrawTool(root, "calendar");
      });
      on(root, "click", "[data-event]", (e, t) => this.open(D.calendarEvents.find((x) => x.id === t.dataset.event)));
      on(root, "click", "[data-day]", (e, t) => { if (e.target.closest("[data-event]")) return; this.create(+t.dataset.day); });
      on(root, "click", "[data-event-new]", () => this.create());
    },
    open(ev) {
      if (!ev) return;
      const sum = App.ai.meetingSummary(ev);
      ui.modal({
        title: ev.title, subtitle: `${fmt.date(ev.date)} · ${ev.start}–${ev.end}`, size: "sm",
        body: `<div class="detail-grid">
            ${detailRow("Type", ui.badge(fmt.title(ev.type)))}
            ${detailRow("When", `${fmt.date(ev.date)} · ${ev.start}`)}
            ${ev.company ? detailRow("Company", escapeHtml(ev.company)) : ""}
            ${detailRow("Attendees", App.collab.presenceBar(ev.attendees, { hideLabel: true, size: 24 }))}
          </div>
          <h4 class="drawer-section">${icon("sparkles", { size: 14 })} AI prep</h4>
          <p class="ai-inline">${escapeHtml(sum.summary)}</p>`,
        footer: `<button class="btn btn--ghost" data-act="cancel">Close</button><button class="btn btn--primary" data-act="join">${icon("video", { size: 16 })}Join</button>`,
        onMount(r, c) { on(r, "click", '[data-act="cancel"]', c.close); on(r, "click", '[data-act="join"]', () => { c.close(); ui.toast("Joining " + ev.title, { type: "info" }); }); },
      });
    },
    create(day) {
      const { y, m } = this.cur();
      const dflt = day ? new Date(y, m, day) : App.now();
      const iso = dflt.toISOString().slice(0, 10);
      ui.modal({
        title: "New event", size: "sm",
        body: `<form data-form>${ui.field({ label: "Title", name: "title", required: true, wide: true, placeholder: "Demo with…" })}<div class="form-grid">${ui.field({ label: "Date", name: "date", type: "date", value: iso })}${ui.field({ label: "Time", name: "start", value: "10:00" })}${ui.field({ label: "Type", name: "type", type: "select", options: ["meeting", "call", "reminder", "task"], wide: true })}</div></form>`,
        footer: `<button class="btn btn--ghost" data-act="cancel">Cancel</button><button class="btn btn--primary" data-act="save">Add event</button>`,
        onMount: (r, c) => {
          on(r, "click", '[data-act="cancel"]', c.close);
          on(r, "click", '[data-act="save"]', () => {
            const { valid, values } = ui.validate(qs("[data-form]", r)); if (!valid) return;
            const colors = { meeting: "indigo", call: "emerald", reminder: "amber", task: "violet" };
            const icons = { meeting: "users", call: "phone", reminder: "bell", task: "check-circle" };
            D.calendarEvents.push({ id: App.uid("EV"), title: values.title, type: values.type, color: colors[values.type], icon: icons[values.type], date: new Date(values.date), start: values.start, end: values.start, attendees: [D.teammate(D.currentUser.name)], company: null });
            c.close(); redrawTool(qs(".ws-tool"), "calendar"); ui.toast("Event added", { type: "success", desc: values.title });
          });
        },
      });
    },
  };

  /* ============================================================ FILES (#15) */
  const FILE_ICON = { pdf: "file-text", doc: "file-text", sheet: "analytics", slide: "image", image: "image", design: "image" };
  const Files = {
    render() {
      const view = state.filesView || "grid";
      const toolbar = `<div class="filterbar"><div class="filterbar__search">${icon("search", { size: 18, class: "filterbar__searchicon" })}<input class="input" data-files-search placeholder="Search files & content…"/></div><div class="filterbar__controls">${ui.segmented([{ value: "grid", icon: "grid" }, { value: "list", icon: "list" }], view, { attrs: "data-files-view" })}${btn("Upload", { icon: "upload", variant: "primary", attrs: "data-file-upload" })}</div></div>`;
      const drop = `<div class="dropzone" data-dropzone><div class="dropzone__inner">${icon("upload", { size: 22 })}<p>Drag & drop files here or <button class="link" data-file-upload>browse</button></p></div></div>`;
      return toolbar + drop + `<div data-files-host>${this.list(view)}</div>`;
    },
    list(view) {
      let files = D.files.slice();
      const q = (this._q || "").toLowerCase();
      if (q) files = files.filter((f) => (f.title + (f.company || "")).toLowerCase().includes(q));
      if (!files.length) return ui.emptyState({ icon: "folder", title: "No files", desc: "Upload a file to get started." });
      if (view === "list") {
        return panel("", `<div class="table-wrap"><table class="table"><thead><tr><th>Name</th><th>Owner</th><th>Company</th><th class="ta-right">Size</th><th>Updated</th></tr></thead><tbody>${files.map((f) => `<tr class="is-clickable" data-file="${f.id}"><td><span class="file-cell"><span class="file-ico file-ico--${f.color}">${icon(FILE_ICON[f.kind] || "file", { size: 16 })}</span><span class="cell-strong">${escapeHtml(f.name)}</span></span></td><td>${escapeHtml(f.owner.split(" ")[0])}</td><td>${escapeHtml(f.company || "—")}</td><td class="ta-right">${fileSize(f.size)}</td><td>${fmt.relTime(f.updated)}</td></tr>`).join("")}</tbody></table></div>`, { flush: true });
      }
      return `<div class="file-grid">${files.map((f) => `<article class="file-card" data-file="${f.id}">
        <div class="file-card__preview file-card__preview--${f.color}">${icon(FILE_ICON[f.kind] || "file", { size: 30 })}<span class="file-card__ext">${escapeHtml(f.ext)}</span>${f.starred ? `<span class="file-card__star">${icon("star", { size: 14 })}</span>` : ""}</div>
        <div class="file-card__body"><p class="file-card__name">${escapeHtml(f.title)}</p><p class="file-card__meta">${fileSize(f.size)} · ${fmt.relTime(f.updated)}</p></div>
      </article>`).join("")}</div>`;
    },
    init(root) {
      const redo = () => { qs("[data-files-host]", root).innerHTML = this.list(state.filesView || "grid"); };
      on(root, "click", "[data-files-view] .segmented__btn", (e, t) => { setState("filesView", t.dataset.seg); qsa("[data-files-view] .segmented__btn", root).forEach((b) => b.classList.toggle("is-active", b === t)); redo(); });
      const search = qs("[data-files-search]", root);
      on(search, "input", App.debounce(() => { this._q = search.value; redo(); }, 160));
      on(root, "click", "[data-file]", (e, t) => this.preview(D.files.find((x) => x.id === t.dataset.file)));
      on(root, "click", "[data-file-upload]", (e) => { e.preventDefault(); this.upload(root); });
      const dz = qs("[data-dropzone]", root);
      if (dz) {
        on(dz, "dragover", (e) => { e.preventDefault(); dz.classList.add("is-over"); });
        on(dz, "dragleave", () => dz.classList.remove("is-over"));
        on(dz, "drop", (e) => { e.preventDefault(); dz.classList.remove("is-over"); this.add(e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0]); redo(); });
      }
    },
    add(file) {
      const name = file ? file.name : "Uploaded file " + (D.files.length + 1) + ".pdf";
      const ext = (name.split(".").pop() || "pdf").toLowerCase();
      const kindMap = { pdf: "pdf", docx: "doc", doc: "doc", xlsx: "sheet", csv: "sheet", pptx: "slide", png: "image", jpg: "image", jpeg: "image", fig: "design" };
      const kind = kindMap[ext] || "doc";
      D.files.unshift({ id: App.uid("F"), name, title: name.replace(/\.[^.]+$/, ""), kind, ext, color: D.avatarColor(), size: file ? file.size : 480 * 1024, owner: D.currentUser.name, updated: App.now(), company: null, starred: false, ocr: kind === "pdf" || kind === "image", versions: [{ v: 1, by: D.currentUser.name, time: App.now(), note: "Initial upload" }] });
      ui.toast("File uploaded", { type: "success", desc: name });
    },
    upload(root) { this.add(null); qs("[data-files-host]", root).innerHTML = this.list(state.filesView || "grid"); },
    preview(f) {
      if (!f) return;
      const aiSummary = `This ${f.kind} (“${f.title}”) covers ${["pricing and commercial terms", "the implementation plan and timeline", "key metrics and performance", "the proposed scope of work"][App.fmt.initials(f.title).charCodeAt(0) % 4]}. ${f.ocr ? "OCR extracted ~" + (3 + (f.size % 9)) + " pages of text." : ""}`;
      const versions = f.versions.map((v) => `<li class="ver"><span class="ver__badge">v${v.v}</span><div class="ver__main"><div class="cell-strong">${escapeHtml(v.note)}</div><div class="cell-sub">${escapeHtml(v.by.split(" ")[0])} · ${fmt.relTime(v.time)}</div></div>${v.v === f.versions[0].v ? ui.badge("Current", "success") : `<button class="btn btn--ghost btn--sm" data-restore="${v.v}">Restore</button>`}</li>`).join("");
      ui.drawer({
        title: f.title, width: 520,
        body: `<div class="file-preview file-preview--${f.color}">${icon(FILE_ICON[f.kind] || "file", { size: 44 })}<div><div class="cell-strong">${escapeHtml(f.name)}</div><div class="cell-sub">${fileSize(f.size)} · ${escapeHtml(f.owner)}</div></div></div>
          <div class="ai-callout"><div class="ai-callout__head">${icon("sparkles", { size: 15 })}<b>AI summary</b></div><p>${escapeHtml(aiSummary)}</p></div>
          ${f.ocr ? `<h4 class="drawer-section">${icon("eye", { size: 14 })} Search inside</h4><div class="ocr-box"><input class="input input--sm" data-ocr placeholder="Find in document…"/><p class="ocr-box__hint">OCR enabled — text is searchable.</p></div>` : ""}
          <h4 class="drawer-section">${icon("history", { size: 14 })} Version history (${f.versions.length})</h4>
          <ul class="ver-list">${versions}</ul>`,
        footer: `<button class="btn btn--ghost" data-act="dl">${icon("download", { size: 16 })}Download</button><button class="btn btn--primary" data-act="share">${icon("link", { size: 16 })}Share</button>`,
        onMount(r, c) {
          on(r, "click", '[data-act="dl"]', () => ui.toast("Downloading " + f.name, { type: "info" }));
          on(r, "click", '[data-act="share"]', () => ui.toast("Share link copied", { type: "success" }));
          on(r, "click", "[data-restore]", (e, t) => ui.toast("Restored to v" + t.dataset.restore, { type: "success" }));
        },
      });
    },
  };

  /* ============================================================ DOCUMENTS */
  const Documents = {
    render() {
      const cards = D.documents.map((d) => `<article class="doc-card" data-doc="${d.id}">
        <span class="doc-card__icon doc-card__icon--${d.color}">${icon(d.icon, { size: 22 })}</span>
        <div class="doc-card__main"><h3 class="doc-card__title">${escapeHtml(d.title)}</h3><p class="doc-card__excerpt">${escapeHtml(d.excerpt)}</p>
          <div class="doc-card__foot"><span>${escapeHtml(d.author.split(" ")[0])} · ${fmt.relTime(d.updated)}</span><span class="doc-card__stats">${icon("message", { size: 13 })}${d.comments} · ${icon("history", { size: 13 })}v${d.versions}</span></div></div>
        <div class="doc-card__collab">${App.collab.presenceBar(d.collaborators, { hideLabel: true, size: 24 })}</div>
      </article>`).join("");
      return `<div class="kan-head">${pageHeadInline("Documents", "Collaborative docs with version history & comments")}${btn("New document", { icon: "plus", variant: "primary", attrs: "data-doc-new" })}</div><div class="doc-list">${cards}</div>`;
    },
    init(root) {
      on(root, "click", "[data-doc]", (e, t) => this.open(D.documents.find((x) => x.id === t.dataset.doc)));
      on(root, "click", "[data-doc-new]", () => ui.toast("New document", { type: "info", desc: "Blank document created" }));
    },
    open(d) {
      if (!d) return;
      const md = mdToHtml(d.body);
      ui.drawer({
        width: 640,
        head: `<div class="drawer-id"><span class="doc-card__icon doc-card__icon--${d.color}">${icon(d.icon, { size: 20 })}</span><div class="drawer-id__main"><h2 class="drawer__title">${escapeHtml(d.title)}</h2><p class="drawer-id__sub">Edited ${fmt.relTime(d.updated)} by ${escapeHtml(d.author.split(" ")[0])}</p></div></div>`,
        body: `<div class="doc-live"><span class="doc-live__dot"></span>${App.collab.presenceBar(d.collaborators, { hideLabel: true, size: 24 })}<span class="doc-live__label">${d.collaborators.length} editing now</span><button class="btn btn--ghost btn--sm" data-ai-doc>${icon("sparkles", { size: 14 })}Summarize</button></div>
          <div class="doc-body" data-doc-body>${md}</div>
          <div class="tabbed">${ui.tabs([{ value: "cm", label: "Comments", count: (D.comments[d.id] || []).length }, { value: "vh", label: "History", count: d.versions }], "cm")}
            <div class="tabpane" data-pane="cm"><div data-doc-comments></div></div>
            <div class="tabpane" data-pane="vh" hidden><ul class="ver-list">${App.range(Math.min(6, d.versions)).map((i) => `<li class="ver"><span class="ver__badge">v${d.versions - i}</span><div class="ver__main"><div class="cell-strong">${["Current", "Edited Closing section", "Added discovery notes", "Restructured", "Initial draft", "Typo fixes"][i % 6]}</div><div class="cell-sub">${D.teammate(d.author).name.split(" ")[0]} · ${fmt.relTime(new Date(App.now() - i * 86400000 * 2))}</div></div>${i === 0 ? ui.badge("Current", "success") : `<button class="btn btn--ghost btn--sm">Restore</button>`}</li>`).join("")}</ul></div>
          </div>`,
        onMount(r) {
          App.collab.mountComments(qs("[data-doc-comments]", r), { entityId: d.id });
          on(r, "click", "[data-ai-doc]", () => { const sum = "AI summary: " + d.excerpt + " Key sections include " + d.body.match(/## (.+)/g).map((s) => s.replace("## ", "")).join(", ") + "."; ui.toast("Document summarized", { type: "success" }); const box = qs("[data-doc-body]", r); box.insertAdjacentHTML("afterbegin", `<div class="ai-callout"><div class="ai-callout__head">${icon("sparkles", { size: 15 })}<b>AI summary</b></div><p>${escapeHtml(sum)}</p></div>`); });
        },
      });
    },
  };

  /* ============================================================ WHITEBOARD */
  const Whiteboard = {
    render() {
      if (state.wbBoard) return this.canvas(D.whiteboards.find((b) => b.id === state.wbBoard));
      const cards = D.whiteboards.map((b) => `<article class="wb-card" data-board="${b.id}">
        <div class="wb-card__thumb wb-card__thumb--${b.color}">${wbThumb(b.id)}</div>
        <div class="wb-card__body"><h3 class="wb-card__title">${escapeHtml(b.name)}</h3><p class="wb-card__meta">${escapeHtml(b.author.split(" ")[0])} · ${fmt.relTime(b.updated)}</p></div>
      </article>`).join("");
      return `<div class="kan-head">${pageHeadInline("Whiteboards", "Brainstorm visually with your team")}${btn("New board", { icon: "plus", variant: "primary", attrs: "data-board-new" })}</div><div class="wb-grid">${cards}</div>`;
    },
    canvas(b) {
      b = b || D.whiteboards[0];
      const colors = ["amber", "emerald", "indigo", "rose", "sky"];
      b._notes = b._notes || [
        { id: "n1", x: 40, y: 40, color: "amber", text: "Goal: 30% pipeline growth" },
        { id: "n2", x: 250, y: 90, color: "emerald", text: "Owner: RevOps" },
        { id: "n3", x: 120, y: 200, color: "indigo", text: "Risk: enterprise cycle length" },
      ];
      const notes = b._notes.map((n) => this.noteHTML(n)).join("");
      return `<div class="wb">
        <header class="wb__bar"><button class="btn btn--ghost btn--sm" data-board-back>${icon("arrow-left", { size: 16 })}Boards</button><h3 class="wb__title">${escapeHtml(b.name)}</h3>
          <div class="wb__tools"><span class="wb__hint">Double-click canvas to add a note · drag to move</span>${colors.map((c) => `<button class="wb__swatch wb__swatch--${c} ${c === "amber" ? "is-active" : ""}" data-wb-color="${c}" aria-label="${c}"></button>`).join("")}<button class="btn btn--ghost btn--sm" data-wb-clear>${icon("trash", { size: 15 })}Clear</button></div></header>
        <div class="wb__canvas" data-wb-canvas>${notes}</div>
      </div>`;
    },
    noteHTML(n) { return `<div class="wb-note wb-note--${n.color}" data-wb-note="${n.id}" style="left:${n.x}px;top:${n.y}px"><button class="wb-note__del" data-wb-del="${n.id}" aria-label="Delete">${icon("x", { size: 12 })}</button><div class="wb-note__text" contenteditable="true" data-wb-text>${escapeHtml(n.text)}</div></div>`; },
    init(root) {
      on(root, "click", "[data-board]", (e, t) => { setState("wbBoard", t.dataset.board); redrawTool(root, "whiteboard"); });
      on(root, "click", "[data-board-back]", () => { setState("wbBoard", null); redrawTool(root, "whiteboard"); });
      on(root, "click", "[data-board-new]", () => { D.whiteboards.unshift({ id: App.uid("WB"), name: "Untitled board", color: D.avatarColor(), author: D.currentUser.name, updated: App.now() }); redrawTool(root, "whiteboard"); ui.toast("Board created", { type: "success" }); });
      if (!state.wbBoard) return;
      const b = D.whiteboards.find((x) => x.id === state.wbBoard);
      let color = "amber";
      on(root, "click", "[data-wb-color]", (e, t) => { color = t.dataset.wbColor; qsa("[data-wb-color]", root).forEach((s) => s.classList.toggle("is-active", s === t)); });
      const canvas = qs("[data-wb-canvas]", root);
      on(canvas, "dblclick", (e) => {
        if (e.target !== canvas) return;
        const r = canvas.getBoundingClientRect();
        const n = { id: App.uid("n"), x: e.clientX - r.left - 70, y: e.clientY - r.top - 30, color, text: "New note" };
        b._notes.push(n); canvas.insertAdjacentHTML("beforeend", this.noteHTML(n));
      });
      on(root, "click", "[data-wb-del]", (e, t) => { e.stopPropagation(); const id = t.dataset.wbDel; b._notes = b._notes.filter((x) => x.id !== id); qs(`[data-wb-note="${id}"]`, root).remove(); });
      on(root, "input", "[data-wb-text]", (e, t) => { const note = t.closest("[data-wb-note]"); const n = b._notes.find((x) => x.id === note.dataset.wbNote); if (n) n.text = t.textContent; });
      on(root, "click", "[data-wb-clear]", () => { b._notes = []; canvas.innerHTML = ""; });
      // drag notes
      let dn = null, off = null;
      on(canvas, "pointerdown", "[data-wb-note]", (e, t) => {
        if (e.target.closest("[data-wb-text],[data-wb-del]")) return;
        dn = t; const r = t.getBoundingClientRect(); off = { x: e.clientX - r.left, y: e.clientY - r.top }; t.setPointerCapture && t.setPointerCapture(e.pointerId); t.classList.add("is-dragging");
      });
      on(canvas, "pointermove", (e) => {
        if (!dn) return;
        const r = canvas.getBoundingClientRect();
        const x = e.clientX - r.left - off.x, y = e.clientY - r.top - off.y;
        dn.style.left = Math.max(0, x) + "px"; dn.style.top = Math.max(0, y) + "px";
      });
      on(canvas, "pointerup", () => { if (dn) { const n = b._notes.find((x) => x.id === dn.dataset.wbNote); if (n) { n.x = parseInt(dn.style.left); n.y = parseInt(dn.style.top); } dn.classList.remove("is-dragging"); dn = null; } });
    },
  };

  /* ============================================================ KNOWLEDGE BASE (#9) */
  const KB = {
    render() {
      const cats = ["All", ...Array.from(new Set(D.kbArticles.map((a) => a.category)))];
      const cat = state.kbCat || "All";
      const q = (state.kbQ || "").toLowerCase();
      let list = D.kbArticles.slice();
      if (cat !== "All") list = list.filter((a) => a.category === cat);
      if (q) list = list.filter((a) => (a.title + a.body + a.tags.join(" ")).toLowerCase().includes(q));
      const aiAnswer = q ? `<div class="ai-callout ai-callout--kb"><div class="ai-callout__head">${icon("sparkles", { size: 15 })}<b>AI answer</b></div><p>${escapeHtml(kbAnswer(q, list))}</p></div>` : "";
      const cards = list.length ? list.map((a) => `<article class="kb-card" data-kb="${a.id}">
          <span class="kb-card__icon">${icon(App.icon.has(a.icon) ? a.icon : "book", { size: 20 })}</span>
          <div class="kb-card__main"><span class="kb-card__cat">${escapeHtml(a.category)}</span><h3 class="kb-card__title">${escapeHtml(a.title)}</h3><p class="kb-card__excerpt">${escapeHtml(a.body.slice(0, 120))}…</p>
            <div class="kb-card__foot">${icon("eye", { size: 13 })}${a.views} · ${icon("history", { size: 13 })}v${a.versions} · ${fmt.relTime(a.updated)}</div></div>
        </article>`).join("") : ui.emptyState({ icon: "book", title: "No articles found", desc: "Try another search or category." });
      const catChips = cats.map((c) => `<button class="kb-cat ${c === cat ? "is-active" : ""}" data-kb-cat="${escapeHtml(c)}">${escapeHtml(c)}</button>`).join("");
      return `<div class="kb-search">${icon("search", { size: 20, class: "kb-search__icon" })}<input class="kb-search__input" data-kb-search placeholder="Search the knowledge base or ask a question…" value="${escapeHtml(state.kbQ || "")}"/>${btn("New article", { icon: "plus", variant: "primary", attrs: "data-kb-new" })}</div>
        <div class="kb-cats">${catChips}</div>${aiAnswer}<div class="kb-grid">${cards}</div>`;
    },
    init(root) {
      const search = qs("[data-kb-search]", root);
      on(search, "input", App.debounce(() => { setState("kbQ", search.value); redrawTool(root, "kb"); const s = qs("[data-kb-search]", root); if (s) { s.focus(); s.setSelectionRange(s.value.length, s.value.length); } }, 220));
      on(root, "click", "[data-kb-cat]", (e, t) => { setState("kbCat", t.dataset.kbCat); redrawTool(root, "kb"); });
      on(root, "click", "[data-kb]", (e, t) => this.open(D.kbArticles.find((x) => x.id === t.dataset.kb)));
      on(root, "click", "[data-kb-new]", () => ui.toast("New article", { type: "info" }));
    },
    open(a) {
      if (!a) return;
      ui.drawer({
        width: 600,
        head: `<div class="drawer-id"><span class="kb-card__icon">${icon(App.icon.has(a.icon) ? a.icon : "book", { size: 18 })}</span><div class="drawer-id__main"><h2 class="drawer__title">${escapeHtml(a.title)}</h2><p class="drawer-id__sub">${escapeHtml(a.category)} · ${a.views} views</p></div></div>`,
        body: `<div class="kb-article"><div class="ai-callout"><div class="ai-callout__head">${icon("sparkles", { size: 15 })}<b>AI summary</b></div><p>${escapeHtml(a.body.split(".")[0])}. ${escapeHtml("In short: " + a.title.toLowerCase() + " — read on for details.")}</p></div>
          <p class="kb-article__body">${escapeHtml(a.body)}</p>
          <div class="chips kb-article__tags">${a.tags.map((t) => ui.pill("#" + t, "indigo")).join("")}</div>
          <h4 class="drawer-section">${icon("history", { size: 14 })} Version history</h4>
          <ul class="ver-list">${App.range(Math.min(4, a.versions)).map((i) => `<li class="ver"><span class="ver__badge">v${a.versions - i}</span><div class="ver__main"><div class="cell-strong">${["Current revision", "Updated for new UI", "Clarified steps", "Initial publish"][i % 4]}</div><div class="cell-sub">${a.author.split(" ")[0]} · ${fmt.relTime(new Date(App.now() - i * 86400000 * 9))}</div></div>${i === 0 ? ui.badge("Current", "success") : ""}</li>`).join("")}</ul></div>`,
        footer: `<button class="btn btn--ghost" data-act="edit">${icon("edit", { size: 16 })}Edit</button><button class="btn btn--primary" data-act="ok">Done</button>`,
        onMount(r, c) { on(r, "click", '[data-act="ok"]', c.close); on(r, "click", '[data-act="edit"]', () => ui.toast("Editing article", { type: "info" })); },
      });
    },
  };

  /* ============================================================ BOOKMARKS */
  const Bookmarks = {
    render() {
      const groups = {};
      D.bookmarks.forEach((b) => { (groups[b.tag] = groups[b.tag] || []).push(b); });
      const sections = Object.keys(groups).map((tag) => `<div class="bm-group"><h4 class="bm-group__title">${escapeHtml(tag)}</h4><div class="bm-grid">${groups[tag].map((b) => `<a class="bm-card" href="${escapeHtml(b.url)}" data-bm="${b.id}" ${b.url.startsWith("http") ? 'target="_blank" rel="noopener"' : ""}>
          <span class="bm-card__icon bm-card__icon--${b.color}">${icon(b.icon, { size: 18 })}</span>
          <span class="bm-card__main"><span class="bm-card__title">${escapeHtml(b.title)}</span><span class="bm-card__sub">${escapeHtml(b.url.replace(/^https?:\/\//, ""))}</span></span>
          <button class="bm-card__del" data-bm-del="${b.id}" aria-label="Remove">${icon("x", { size: 14 })}</button></a>`).join("")}</div></div>`).join("");
      return `<div class="kan-head">${pageHeadInline("Bookmarks", D.bookmarks.length + " saved links, views & docs")}${btn("Add bookmark", { icon: "plus", variant: "primary", attrs: "data-bm-new" })}</div>${sections || ui.emptyState({ icon: "bookmark", title: "No bookmarks", desc: "Save links, views and documents for quick access." })}`;
    },
    init(root) {
      on(root, "click", "[data-bm-del]", (e, t) => { e.preventDefault(); e.stopPropagation(); const i = D.bookmarks.findIndex((x) => x.id === t.dataset.bmDel); if (i > -1) D.bookmarks.splice(i, 1); redrawTool(root, "bookmarks"); ui.toast("Bookmark removed", { type: "info" }); });
      on(root, "click", "[data-bm]", (e, t) => { if (e.target.closest("[data-bm-del]")) { return; } const b = D.bookmarks.find((x) => x.id === t.dataset.bm); if (b && !b.url.startsWith("http")) { /* hash nav handled by anchor */ } });
      on(root, "click", "[data-bm-new]", () => {
        ui.modal({ title: "Add bookmark", size: "sm", body: `<form data-form>${ui.field({ label: "Title", name: "title", required: true, wide: true })}${ui.field({ label: "URL", name: "url", required: true, wide: true, placeholder: "https://… or #/customers" })}${ui.field({ label: "Tag", name: "tag", value: "Link", wide: true })}</form>`,
          footer: `<button class="btn btn--ghost" data-act="cancel">Cancel</button><button class="btn btn--primary" data-act="save">Save</button>`,
          onMount(r, c) { on(r, "click", '[data-act="cancel"]', c.close); on(r, "click", '[data-act="save"]', () => { const { valid, values } = ui.validate(qs("[data-form]", r)); if (!valid) return; D.bookmarks.unshift({ id: App.uid("BM"), title: values.title, url: values.url, tag: values.tag || "Link", icon: values.url.startsWith("http") ? "external-link" : "bookmark", color: D.avatarColor(), added: App.now() }); c.close(); redrawTool(root, "bookmarks"); ui.toast("Bookmark added", { type: "success" }); }); } });
      });
    },
  };

  /* ============================================================ helpers */
  const TOOLS = { chat: Chat, notes: Notes, tasks: Tasks, calendar: Calendar, files: Files, docs: Documents, whiteboard: Whiteboard, kb: KB, bookmarks: Bookmarks };
  function pageHeadInline(title, sub) { return `<div class="page-head__titles"><h2 class="ws-tool__title">${escapeHtml(title)}</h2><p class="page-sub">${escapeHtml(sub)}</p></div>`; }
  function panelHead(title) { return `<header class="panel__head"><div class="panel__head-main"><h3 class="panel__title">${escapeHtml(title)}</h3></div></header>`; }
  const detailRow = (label, val) => `<div class="detail-row"><span class="detail-row__label">${escapeHtml(label)}</span><span class="detail-row__val">${val}</span></div>`;
  function fileSize(b) { if (b > 1048576) return (b / 1048576).toFixed(1) + " MB"; return Math.max(1, Math.round(b / 1024)) + " KB"; }
  function wbThumb(id) { const h = App.fmt.initials(id).charCodeAt(0); return `<svg viewBox="0 0 120 70"><rect x="10" y="12" width="34" height="22" rx="3" fill="currentColor" opacity=".5"/><rect x="54" y="20" width="30" height="20" rx="3" fill="currentColor" opacity=".35"/><rect x="${24 + (h % 20)}" y="40" width="40" height="18" rx="3" fill="currentColor" opacity=".25"/><path d="M44 23h10M68 30l-4 12" stroke="currentColor" stroke-width="1.5" fill="none"/></svg>`; }
  function mdToHtml(md) { return md.split("\n").map((l) => l.startsWith("## ") ? `<h4>${escapeHtml(l.slice(3))}</h4>` : l.trim() ? `<p>${escapeHtml(l)}</p>` : "").join(""); }
  function kbAnswer(q, list) { if (!list.length) return `I couldn't find an article for “${q}”. Try the AI assistant for a data-backed answer.`; const a = list[0]; return `Based on “${a.title}”: ${a.body.split(".")[0]}. ${list.length > 1 ? "I found " + list.length + " related articles below." : ""}`; }

  function redrawTool(root, toolId) {
    const tool = TOOLS[toolId]; if (!tool) return;
    const host = root.closest ? (root.closest(".ws-tool") || qs(".ws-tool")) : qs(".ws-tool");
    if (!host) return;
    host.innerHTML = tool.render();
    tool.init(host);
  }

  /* ============================================================ page */
  App.pages.workspace = {
    title: "Workspace",
    render() {
      const cur = state.tool;
      const nav = D.workspaceTools.map((t) => `<button class="ws-nav__item ${t.id === cur ? "is-active" : ""}" data-ws-tool="${t.id}">${icon(t.icon, { size: 18 })}<span>${escapeHtml(t.label)}</span></button>`).join("");
      const tool = TOOLS[cur] || Chat;
      return pageHead({ title: "Workspace", sub: "Everything your team needs in one place" }) +
        `<div class="ws"><nav class="ws-nav" aria-label="Workspace tools">${nav}</nav><div class="ws-tool" data-ws-host>${tool.render()}</div></div>`;
    },
    init(root) {
      const host = qs(".ws-tool", root);
      (TOOLS[state.tool] || Chat).init(host);
      on(root, "click", "[data-ws-tool]", (e, t) => {
        const id = t.dataset.wsTool; if (id === state.tool) return;
        setState("tool", id);
        qsa("[data-ws-tool]", root).forEach((b) => b.classList.toggle("is-active", b === t));
        host.innerHTML = (TOOLS[id] || Chat).render();
        (TOOLS[id] || Chat).init(host);
      });
    },
  };
})(window.App);
