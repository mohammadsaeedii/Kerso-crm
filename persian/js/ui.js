/* ============================================================
   کرسو CRM — کتابخانهٔ مؤلفه‌ها و رفتارهای رابط کاربری (نسخهٔ فارسی)
   توابع سازنده رشتهٔ HTML برمی‌گردانند؛ کنترلرها (DataTable، modal،
   drawer، popover، toast، tooltip) رفتار زنده را مدیریت می‌کنند.
   ============================================================ */
(function (App) {
  "use strict";
  const { escapeHtml, icon, fmt, node, qs, qsa, on, faDigits } = App;

  /* ============== سازنده‌ها (رشتهٔ HTML) ============== */

  function avatar(name, color, size = 36, opts = {}) {
    const fs = Math.round(size * 0.38);
    const cls = opts.ring ? " avatar--ring" : "";
    const status = opts.online != null
      ? `<span class="avatar__status ${opts.online ? "is-online" : "is-offline"}"></span>`
      : "";
    return `<span class="avatar avatar--${color || "slate"}${cls}" style="width:${size}px;height:${size}px;font-size:${fs}px" title="${escapeHtml(name)}">${escapeHtml(fmt.initials(name))}${status}</span>`;
  }

  function avatarGroup(people, max = 4, size = 28) {
    const shown = people.slice(0, max);
    const extra = people.length - shown.length;
    return (
      `<span class="avatar-group">` +
      shown.map((p) => avatar(p.name, p.color, size)).join("") +
      (extra > 0 ? `<span class="avatar avatar--more" style="width:${size}px;height:${size}px;font-size:${Math.round(size * 0.34)}px">+${faDigits(extra)}</span>` : "") +
      `</span>`
    );
  }

  /** آواتار تصویری بازاستفاده‌شده از طرح اصلی کرسو */
  function faceAvatar(size = 40) {
    return `<span class="avatar-face" style="width:${size}px;height:${size}px"><svg viewBox="0 0 40 40" width="${size}" height="${size}">
      <circle cx="20" cy="20" r="20" fill="#FCE9DC"/>
      <path d="M20 9c-5 0-8 3.4-8 8 0 1.2.2 2.3.6 3.2-1 .2-1.6.7-1.6 1.4 0 1 1.1 1.6 2.4 1.9C15 26.6 17.3 28 20 28s5-1.4 6.6-4.5c1.3-.3 2.4-.9 2.4-1.9 0-.7-.6-1.2-1.6-1.4.4-.9.6-2 .6-3.2 0-4.6-3-8-8-8z" fill="#F0B894"/>
      <path d="M12 16c0-4.6 3-8 8-8s8 3.4 8 8c0-1-1-2.4-2.6-3-.6-1.6-2.6-2.6-5.4-2.6S15 11.4 14.4 13c-1.5.7-2.4 2-2.4 3z" fill="#5A3A2E"/>
      <path d="M12.3 16.6C11 16.9 10 18 10 19.5c0 .9.4 1.7 1 2.3-.4-1.8-.4-3.6.3-5.2zM27.7 16.6c1.3.3 2.3 1.4 2.3 2.9 0 .9-.4 1.7-1 2.3.4-1.8.4-3.6-.3-5.2z" fill="#5A3A2E"/>
      <circle cx="16.6" cy="18.4" r="1.05" fill="#3A2A22"/><circle cx="23.4" cy="18.4" r="1.05" fill="#3A2A22"/>
      <path d="M17.4 22.2c1.4 1.1 3.8 1.1 5.2 0" fill="none" stroke="#9C5A3C" stroke-width="1.3" stroke-linecap="round"/>
      <path d="M20 30c4.4 0 8 2.1 8 6v4H12v-4c0-3.9 3.6-6 8-6z" fill="#E2E8F0"/>
      <path d="M17.4 28.6c.7 1.2 4.5 1.2 5.2 0l.6 2.2c-1.6 1.4-5.4 1.4-7 0z" fill="#fff"/></svg></span>`;
  }

  const STATUS_MAP = {
    "فعال": "success", "برنده": "success", "موفق": "success", "مشتری": "success", positive: "success", "باز": "info",
    "سرنخ": "info", "بالقوه": "indigo", "شریک": "violet", neutral: "neutral",
    "ریزش‌کرده": "danger", "ازدست‌رفته": "danger", negative: "danger", "ریسک ریزش": "warning",
  };
  function badge(text, variant) {
    const v = variant || STATUS_MAP[text] || "neutral";
    return `<span class="badge-pill badge-pill--${v}"><span class="badge-pill__dot"></span>${escapeHtml(text)}</span>`;
  }
  function pill(text, variant = "neutral") {
    return `<span class="tagchip tagchip--${variant}">${escapeHtml(text)}</span>`;
  }
  function trendPill(delta, dir) {
    const up = dir ? dir === "up" : delta >= 0;
    return `<span class="trend trend--${up ? "up" : "down"}">${icon(up ? "trending-up" : "trending-down", { size: 13, stroke: 2 })}${fmt.pct(delta)}</span>`;
  }

  function stars(rating, opts = {}) {
    const size = opts.size || 15;
    let out = "";
    for (let i = 1; i <= 5; i++) {
      const fill = rating >= i ? "full" : rating >= i - 0.5 ? "half" : "empty";
      out += `<span class="star star--${fill}">${icon("star", { size, stroke: 1.4 })}</span>`;
    }
    return `<span class="stars" aria-label="${faDigits(rating)} از ۵">${out}</span>`;
  }

  function progress(pct, opts = {}) {
    const v = App.clamp(pct, 0, 100);
    const color = opts.color || (v >= 70 ? "var(--green)" : v >= 40 ? "var(--amber)" : "var(--red)");
    return `<div class="progress ${opts.small ? "progress--sm" : ""}" role="progressbar" aria-valuenow="${v}"><div class="progress__fill" style="width:${v}%;background:${color}"></div></div>`;
  }

  function iconBtn(name, opts = {}) {
    const tip = opts.tip ? ` data-tip="${escapeHtml(opts.tip)}"` : "";
    const extra = opts.class ? " " + opts.class : "";
    const attrs = opts.attrs || "";
    const badge = opts.badge ? `<span class="dot-badge"></span>` : "";
    return `<button type="button" class="icon-btn${extra}"${tip} ${attrs} aria-label="${escapeHtml(opts.tip || opts.label || name)}">${icon(name, { size: opts.size || 20 })}${badge}</button>`;
  }

  function segmented(options, active, opts = {}) {
    return (
      `<div class="segmented" role="tablist" ${opts.attrs || ""}>` +
      options
        .map(
          (o) =>
            `<button type="button" class="segmented__btn ${o.value === active ? "is-active" : ""}" data-seg="${escapeHtml(o.value)}" role="tab" aria-selected="${o.value === active}">${o.icon ? icon(o.icon, { size: 16 }) : ""}${o.label ? `<span>${escapeHtml(o.label)}</span>` : ""}</button>`
        )
        .join("") +
      `</div>`
    );
  }

  function tabs(items, active) {
    return (
      `<div class="tabs" role="tablist">` +
      items
        .map(
          (t) =>
            `<button type="button" class="tab ${t.value === active ? "is-active" : ""}" data-tab="${escapeHtml(t.value)}" role="tab" aria-selected="${t.value === active}">${escapeHtml(t.label)}${t.count != null ? `<span class="tab__count">${faDigits(t.count)}</span>` : ""}</button>`
        )
        .join("") +
      `</div>`
    );
  }

  function emptyState(opts) {
    return `<div class="empty">
      <div class="empty__icon">${icon(opts.icon || "search", { size: 28 })}</div>
      <p class="empty__title">${escapeHtml(opts.title || "هنوز چیزی اینجا نیست")}</p>
      <p class="empty__desc">${escapeHtml(opts.desc || "")}</p>
      ${opts.action ? `<div class="empty__action">${opts.action}</div>` : ""}
    </div>`;
  }

  function skeletonCard() {
    return `<div class="skeleton-card"><div class="sk sk--line" style="width:40%"></div><div class="sk sk--big"></div><div class="sk sk--line" style="width:70%"></div></div>`;
  }

  function kpiCard(k, opts = {}) {
    return `<article class="card stat" data-kpi="${k.id}">
      <div class="stat__top">
        <p class="card__label">${escapeHtml(k.label)}</p>
        ${opts.menu !== false ? `<button class="stat__menu icon-btn icon-btn--sm" data-row-menu data-kpi="${k.id}" aria-label="گزینه‌ها">${icon("more-h", { size: 18 })}</button>` : ""}
      </div>
      <p class="card__value">${escapeHtml(k.display)}</p>
      <div class="stat__foot">
        <div class="card__foot">
          ${trendPill(k.delta, k.dir)}
          <span class="card__hint">نسبت به ماه قبل</span>
        </div>
        <div class="stat__spark">${App.charts.sparkline(k.spark, { width: 96, height: 34, color: k.dir === "up" ? "#22C55E" : "#F2654E" })}</div>
      </div>
    </article>`;
  }

  /* ---------------- فرم‌ها ---------------- */
  function field(o) {
    const id = o.id || App.uid("f");
    const req = o.required ? '<span class="req">*</span>' : "";
    let control = "";
    const common = `id="${id}" name="${escapeHtml(o.name || "")}" ${o.required ? "required" : ""} ${o.attrs || ""}`;
    if (o.type === "select") {
      control = `<select class="select" ${common}>${(o.options || [])
        .map((op) => {
          const val = typeof op === "string" ? op : op.value;
          const lab = typeof op === "string" ? op : op.label;
          return `<option value="${escapeHtml(val)}" ${o.value === val ? "selected" : ""}>${escapeHtml(lab)}</option>`;
        })
        .join("")}</select>`;
    } else if (o.type === "textarea") {
      control = `<textarea class="textarea" rows="${o.rows || 3}" placeholder="${escapeHtml(o.placeholder || "")}" ${common}>${escapeHtml(o.value || "")}</textarea>`;
    } else {
      control = `<input class="input" type="${o.type || "text"}" value="${escapeHtml(o.value == null ? "" : o.value)}" placeholder="${escapeHtml(o.placeholder || "")}" ${common}/>`;
    }
    return `<div class="field ${o.wide ? "field--wide" : ""}">
      ${o.label ? `<label class="field__label" for="${id}">${escapeHtml(o.label)} ${req}</label>` : ""}
      <div class="field__control">${o.icon ? `<span class="field__icon">${icon(o.icon, { size: 18 })}</span>` : ""}${control}</div>
      ${o.hint ? `<p class="field__hint">${escapeHtml(o.hint)}</p>` : ""}
      <p class="field__error" data-error-for="${escapeHtml(o.name || "")}"></p>
    </div>`;
  }

  function toggle(name, checked, label) {
    return `<label class="switch"><input type="checkbox" name="${escapeHtml(name)}" ${checked ? "checked" : ""}/><span class="switch__track"><span class="switch__thumb"></span></span>${label ? `<span class="switch__label">${escapeHtml(label)}</span>` : ""}</label>`;
  }

  function validate(formEl) {
    let valid = true;
    const values = {};
    qsa("[name]", formEl).forEach((el) => {
      const name = el.name;
      const val = el.type === "checkbox" ? el.checked : el.value.trim();
      values[name] = val;
      const errEl = qs(`[data-error-for="${name}"]`, formEl);
      if (errEl) errEl.textContent = "";
      el.classList.remove("is-invalid");
      if (el.required && !val) {
        valid = false;
        el.classList.add("is-invalid");
        if (errEl) errEl.textContent = "این فیلد الزامی است";
      } else if (el.type === "email" && val && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(val)) {
        valid = false;
        el.classList.add("is-invalid");
        if (errEl) errEl.textContent = "یک ایمیل معتبر وارد کنید";
      }
    });
    return { valid, values };
  }

  /* ============== Popover / منو ============== */
  let openPopover = null;
  function closePopover() {
    if (openPopover) {
      const p = openPopover;
      openPopover = null;
      p.el.classList.remove("is-open");
      if (p.anchor) p.anchor.setAttribute("aria-expanded", "false");
      setTimeout(() => p.el.remove(), 140);
      document.removeEventListener("keydown", p.onKey, true);
      window.removeEventListener("resize", p.reposition);
      window.removeEventListener("scroll", p.reposition, true);
    }
  }
  function popover(anchor, html, opts = {}) {
    closePopover();
    const el = node(`<div class="popover" role="menu">${html}</div>`);
    if (opts.width) el.style.width = opts.width + "px";
    el.style.visibility = "hidden";
    document.body.appendChild(el);

    const reposition = () => {
      const r = anchor.getBoundingClientRect();
      const ew = el.offsetWidth, eh = el.offsetHeight;
      // در حالت راست‌به‌چپ، «شروع» سمت راست است
      let left = opts.align === "end" ? r.left : opts.align === "center" ? r.left + r.width / 2 - ew / 2 : r.right - ew;
      left = App.clamp(left, 8, window.innerWidth - ew - 8);
      let top = r.bottom + 8;
      if (top + eh > window.innerHeight - 8 && r.top - eh - 8 > 0) top = r.top - eh - 8;
      el.style.left = left + "px";
      el.style.top = top + "px";
    };
    reposition();
    el.style.visibility = "";
    requestAnimationFrame(() => el.classList.add("is-open"));
    anchor.setAttribute("aria-expanded", "true");

    const onKey = (e) => {
      if (e.key === "Escape") { e.stopPropagation(); closePopover(); anchor.focus && anchor.focus(); }
    };
    const onDoc = (e) => {
      if (!el.contains(e.target) && !anchor.contains(e.target)) closePopover();
    };
    setTimeout(() => document.addEventListener("click", onDoc, { once: false, capture: true }), 0);
    document.addEventListener("keydown", onKey, true);
    window.addEventListener("resize", reposition);
    window.addEventListener("scroll", reposition, true);

    const ctrl = { el, anchor, onKey, reposition, close: closePopover, _onDoc: onDoc };
    const realClose = closePopover;
    openPopover = ctrl;
    const wrappedClose = () => { document.removeEventListener("click", onDoc, true); realClose(); };
    ctrl.close = wrappedClose;

    if (opts.onSelect) {
      on(el, "click", "[data-value]", (e, t) => {
        opts.onSelect(t.dataset.value, t);
        if (opts.closeOnSelect !== false) wrappedClose();
      });
    }
    return ctrl;
  }

  function menuList(items) {
    return items
      .map((it) => {
        if (it === "divider") return `<div class="menu__divider"></div>`;
        if (it.header) return `<div class="menu__header">${escapeHtml(it.header)}</div>`;
        const danger = it.danger ? " menu__item--danger" : "";
        const active = it.active ? " is-active" : "";
        return `<button type="button" class="menu__item${danger}${active}" data-value="${escapeHtml(it.value)}" role="menuitem">${it.icon ? icon(it.icon, { size: 18 }) : ""}<span>${escapeHtml(it.label)}</span>${it.checked ? icon("check", { size: 16, stroke: 2 }) : ""}${it.meta ? `<span class="menu__meta">${escapeHtml(it.meta)}</span>` : ""}</button>`;
      })
      .join("");
  }

  /* ============== Modal ============== */
  function modal(opts) {
    const sizeCls = opts.size ? ` modal--${opts.size}` : "";
    const root = node(`<div class="overlay" role="dialog" aria-modal="true">
      <div class="modal${sizeCls}" role="document">
        <header class="modal__head">
          <div><h2 class="modal__title">${escapeHtml(opts.title || "")}</h2>${opts.subtitle ? `<p class="modal__sub">${escapeHtml(opts.subtitle)}</p>` : ""}</div>
          <button class="icon-btn icon-btn--sm modal__close" aria-label="بستن">${icon("x", { size: 20 })}</button>
        </header>
        <div class="modal__body">${opts.body || ""}</div>
        ${opts.footer ? `<footer class="modal__foot">${opts.footer}</footer>` : ""}
      </div>
    </div>`);
    document.body.appendChild(root);
    document.body.classList.add("no-scroll");
    requestAnimationFrame(() => root.classList.add("is-open"));

    const close = () => {
      root.classList.remove("is-open");
      document.body.classList.remove("no-scroll");
      document.removeEventListener("keydown", onKey, true);
      setTimeout(() => root.remove(), 200);
      opts.onClose && opts.onClose();
    };
    const onKey = (e) => {
      if (e.key === "Escape") close();
      if (e.key === "Tab") trapTab(e, root);
    };
    document.addEventListener("keydown", onKey, true);
    on(root, "click", ".modal__close", close);
    root.addEventListener("mousedown", (e) => { if (e.target === root && opts.dismissable !== false) close(); });
    const focusable = qsa('button,[href],input,select,textarea,[tabindex]:not([tabindex="-1"])', root).filter((e) => !e.disabled);
    setTimeout(() => { (opts.autofocus ? qs(opts.autofocus, root) : focusable[1] || focusable[0])?.focus(); }, 60);
    const ctrl = { el: root, close };
    opts.onMount && opts.onMount(root, ctrl);
    return ctrl;
  }

  function confirm(opts) {
    return new Promise((resolve) => {
      const footer = `<button class="btn btn--ghost" data-act="cancel">${escapeHtml(opts.cancelText || "انصراف")}</button>
        <button class="btn ${opts.danger ? "btn--danger" : "btn--primary"}" data-act="ok">${escapeHtml(opts.confirmText || "تأیید")}</button>`;
      const m = modal({
        title: opts.title || "مطمئن هستید؟",
        size: "sm",
        body: `<p class="confirm__msg">${escapeHtml(opts.message || "")}</p>`,
        footer,
        onMount(root, ctrl) {
          on(root, "click", '[data-act="cancel"]', () => { ctrl.close(); resolve(false); });
          on(root, "click", '[data-act="ok"]', () => { ctrl.close(); resolve(true); });
        },
      });
    });
  }

  function trapTab(e, root) {
    const f = qsa('button,[href],input,select,textarea,[tabindex]:not([tabindex="-1"])', root).filter((el) => !el.disabled && el.offsetParent !== null);
    if (!f.length) return;
    const first = f[0], last = f[f.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  }

  /* ============== Drawer (پنل کناری) ============== */
  function drawer(opts) {
    const root = node(`<div class="overlay overlay--drawer" role="dialog" aria-modal="true">
      <aside class="drawer" style="${opts.width ? `width:${opts.width}px` : ""}">
        <header class="drawer__head">
          <div class="drawer__head-main">${opts.head || `<h2 class="drawer__title">${escapeHtml(opts.title || "")}</h2>`}</div>
          <button class="icon-btn icon-btn--sm drawer__close" aria-label="بستن">${icon("x", { size: 20 })}</button>
        </header>
        <div class="drawer__body">${opts.body || ""}</div>
        ${opts.footer ? `<footer class="drawer__foot">${opts.footer}</footer>` : ""}
      </aside>
    </div>`);
    document.body.appendChild(root);
    document.body.classList.add("no-scroll");
    requestAnimationFrame(() => root.classList.add("is-open"));
    const close = () => {
      root.classList.remove("is-open");
      document.body.classList.remove("no-scroll");
      document.removeEventListener("keydown", onKey, true);
      setTimeout(() => root.remove(), 260);
      opts.onClose && opts.onClose();
    };
    const onKey = (e) => { if (e.key === "Escape") close(); if (e.key === "Tab") trapTab(e, root); };
    document.addEventListener("keydown", onKey, true);
    on(root, "click", ".drawer__close", close);
    root.addEventListener("mousedown", (e) => { if (e.target === root) close(); });
    const ctrl = { el: root, close };
    opts.onMount && opts.onMount(root, ctrl);
    return ctrl;
  }

  /* ============== Toast ============== */
  function toast(message, opts = {}) {
    let host = document.getElementById("toasts");
    if (!host) {
      host = node('<div id="toasts" class="toasts" aria-live="polite"></div>');
      document.body.appendChild(host);
    }
    const type = opts.type || "default";
    const icons = { success: "check-circle", error: "x-circle", info: "info", warning: "alert", default: "info" };
    const t = node(`<div class="toast toast--${type}" role="status">
      <span class="toast__icon">${icon(icons[type] || "info", { size: 20 })}</span>
      <div class="toast__body"><p class="toast__msg">${escapeHtml(message)}</p>${opts.desc ? `<p class="toast__desc">${escapeHtml(opts.desc)}</p>` : ""}</div>
      ${opts.actionLabel ? `<button class="toast__action">${escapeHtml(opts.actionLabel)}</button>` : ""}
      <button class="toast__close" aria-label="بستن">${icon("x", { size: 16 })}</button>
    </div>`);
    host.appendChild(t);
    requestAnimationFrame(() => t.classList.add("is-on"));
    const remove = () => { t.classList.remove("is-on"); setTimeout(() => t.remove(), 240); };
    const timer = setTimeout(remove, opts.duration || 3800);
    on(t, "click", ".toast__close", () => { clearTimeout(timer); remove(); });
    if (opts.actionLabel) on(t, "click", ".toast__action", () => { clearTimeout(timer); opts.onAction && opts.onAction(); remove(); });
    return { remove };
  }

  /* ============== Tooltip عمومی [data-tip] ============== */
  function initTooltips() {
    let tip;
    const ensure = () => {
      if (!tip) { tip = node('<div class="ui-tip"></div>'); document.body.appendChild(tip); }
      return tip;
    };
    let curr = null;
    document.addEventListener("mouseover", (e) => {
      const t = e.target.closest("[data-tip]");
      if (!t || t === curr) return;
      curr = t;
      const el = ensure();
      el.textContent = t.getAttribute("data-tip");
      el.classList.add("is-on");
      position(el, t);
    });
    document.addEventListener("mouseout", (e) => {
      const t = e.target.closest("[data-tip]");
      if (t && t === curr) { curr = null; if (tip) tip.classList.remove("is-on"); }
    });
    document.addEventListener("mousemove", (e) => {
      if (curr && tip && tip.classList.contains("is-on") && curr.hasAttribute("data-tip-follow")) {
        tip.style.left = e.clientX + 12 + "px";
        tip.style.top = e.clientY + 14 + "px";
      }
    });
    function position(el, anchor) {
      const r = anchor.getBoundingClientRect();
      const er = el.getBoundingClientRect();
      let left = r.left + r.width / 2 - er.width / 2;
      left = App.clamp(left, 6, window.innerWidth - er.width - 6);
      let top = r.top - er.height - 9;
      if (top < 6) top = r.bottom + 9;
      el.style.left = left + "px";
      el.style.top = top + "px";
    }
  }

  /* ============== DataTable ============== */
  class DataTable {
    constructor(container, opts) {
      this.c = typeof container === "string" ? qs(container) : container;
      this.opts = opts;
      this.columns = opts.columns;
      this.allRows = opts.rows.slice();
      this.pageSize = opts.pageSize || 8;
      this.page = 1;
      this.sortKey = opts.sortKey || null;
      this.sortDir = opts.sortDir || "asc";
      this.search = "";
      this.predicate = null;
      this.selected = new Set();
      this.render();
    }
    setRows(rows) { this.allRows = rows.slice(); this.page = 1; this.selected.clear(); this.render(); }
    filter(fn) { this.predicate = fn; this.page = 1; this.render(); }
    setSearch(q) { this.search = q.toLowerCase(); this.page = 1; this.render(); }
    getSelectedRows() { return this._processed().filter((r) => this.selected.has(this._id(r))); }
    _id(row) { return this.opts.rowId ? this.opts.rowId(row) : row.id; }
    _processed() {
      let rows = this.allRows;
      if (this.predicate) rows = rows.filter(this.predicate);
      if (this.search && this.opts.searchKeys) {
        rows = rows.filter((r) =>
          this.opts.searchKeys.some((k) => String(r[k] == null ? "" : r[k]).toLowerCase().includes(this.search))
        );
      }
      if (this.sortKey) {
        const col = this.columns.find((c) => c.key === this.sortKey);
        const dir = this.sortDir === "asc" ? 1 : -1;
        rows = rows.slice().sort((a, b) => {
          const va = col && col.sortVal ? col.sortVal(a) : a[this.sortKey];
          const vb = col && col.sortVal ? col.sortVal(b) : b[this.sortKey];
          if (va == null) return 1;
          if (vb == null) return -1;
          if (typeof va === "number") return (va - vb) * dir;
          return String(va).localeCompare(String(vb), "fa") * dir;
        });
      }
      return rows;
    }
    render() {
      const rows = this._processed();
      const total = rows.length;
      const pages = Math.max(1, Math.ceil(total / this.pageSize));
      if (this.page > pages) this.page = pages;
      const start = (this.page - 1) * this.pageSize;
      const pageRows = rows.slice(start, start + this.pageSize);
      const sel = this.opts.selectable;
      const allOnPageSelected = pageRows.length && pageRows.every((r) => this.selected.has(this._id(r)));

      const head =
        `<tr>` +
        (sel ? `<th class="td-check"><label class="checkbox"><input type="checkbox" data-check-all ${allOnPageSelected ? "checked" : ""}/><span></span></label></th>` : "") +
        this.columns
          .map((col) => {
            const sortable = col.sortable !== false && col.key;
            const isSort = this.sortKey === col.key;
            const arrow = isSort ? icon(this.sortDir === "asc" ? "chevron-up" : "chevron-down", { size: 14, stroke: 2 }) : "";
            return `<th class="${col.align ? "ta-" + col.align : ""} ${sortable ? "is-sortable" : ""}" ${sortable ? `data-sort="${col.key}"` : ""} ${col.width ? `style="width:${col.width}"` : ""}><span class="th__inner">${escapeHtml(col.label)}${arrow ? `<span class="th__arrow ${isSort ? "is-on" : ""}">${arrow}</span>` : ""}</span></th>`;
          })
          .join("") +
        (this.opts.rowActions ? `<th class="td-actions"></th>` : "") +
        `</tr>`;

      const body = pageRows.length
        ? pageRows
            .map((row) => {
              const id = this._id(row);
              const checked = this.selected.has(id);
              return (
                `<tr data-row-id="${escapeHtml(id)}" class="${checked ? "is-selected" : ""} ${this.opts.rowClick ? "is-clickable" : ""}">` +
                (sel ? `<td class="td-check"><label class="checkbox"><input type="checkbox" data-check-row ${checked ? "checked" : ""}/><span></span></label></td>` : "") +
                this.columns.map((col) => `<td class="${col.align ? "ta-" + col.align : ""}" ${col.nowrap ? 'style="white-space:nowrap"' : ""}>${col.render ? col.render(row) : escapeHtml(row[col.key])}</td>`).join("") +
                (this.opts.rowActions ? `<td class="td-actions"><button class="icon-btn icon-btn--sm" data-row-action aria-label="اقدامات ردیف">${icon("more-h", { size: 18 })}</button></td>` : "") +
                `</tr>`
              );
            })
            .join("")
        : `<tr><td class="td-empty" colspan="${this.columns.length + (sel ? 1 : 0) + (this.opts.rowActions ? 1 : 0)}">${emptyState({ icon: this.opts.emptyIcon || "search", title: this.opts.emptyTitle || "نتیجه‌ای یافت نشد", desc: this.opts.emptyDesc || "جستجو یا فیلترها را تغییر دهید." })}</td></tr>`;

      const selCount = this.selected.size;
      const bulkBar = sel && selCount
        ? `<div class="table__bulk"><span class="table__bulk-count">${faDigits(selCount)} مورد انتخاب شده</span><div class="table__bulk-actions">${(this.opts.bulkActions || [])
            .map((a, i) => `<button class="btn btn--sm ${a.variant ? "btn--" + a.variant : "btn--ghost"}" data-bulk="${i}">${a.icon ? icon(a.icon, { size: 16 }) : ""}${escapeHtml(a.label)}</button>`)
            .join("")}<button class="btn btn--sm btn--ghost" data-bulk-clear>پاک کردن</button></div></div>`
        : "";

      const showingTo = Math.min(start + this.pageSize, total);
      const pager = `<div class="table__foot">
        <span class="table__count">${total ? `نمایش <b>${faDigits(start + 1)}–${faDigits(showingTo)}</b> از <b>${faDigits(total)}</b>` : "۰ نتیجه"}</span>
        <div class="pagination">
          <button class="pg-btn" data-pg="prev" ${this.page === 1 ? "disabled" : ""} aria-label="صفحهٔ قبل">${icon("chevron-left", { size: 18 })}</button>
          ${this._pageButtons(pages)}
          <button class="pg-btn" data-pg="next" ${this.page === pages ? "disabled" : ""} aria-label="صفحهٔ بعد">${icon("chevron-right", { size: 18 })}</button>
        </div>
      </div>`;

      this.c.innerHTML = `${bulkBar}<div class="table-wrap"><table class="table"><thead>${head}</thead><tbody>${body}</tbody></table></div>${this.opts.paginate === false ? "" : pager}`;
      this._wire();
    }
    _pageButtons(pages) {
      const cur = this.page;
      const set = new Set([1, pages, cur, cur - 1, cur + 1]);
      const list = [...set].filter((p) => p >= 1 && p <= pages).sort((a, b) => a - b);
      let html = "", prev = 0;
      list.forEach((p) => {
        if (p - prev > 1) html += `<span class="pg-ellipsis">…</span>`;
        html += `<button class="pg-btn ${p === cur ? "is-active" : ""}" data-pg="${p}">${faDigits(p)}</button>`;
        prev = p;
      });
      return html;
    }
    _wire() {
      const c = this.c;
      if (this._wired) return; // یک‌بار واگذاری
      this._wired = true;
      on(c, "click", "[data-sort]", (e, t) => {
        const key = t.dataset.sort;
        if (this.sortKey === key) this.sortDir = this.sortDir === "asc" ? "desc" : "asc";
        else { this.sortKey = key; this.sortDir = "asc"; }
        this.render();
      });
      on(c, "click", "[data-pg]", (e, t) => {
        const v = t.dataset.pg;
        const pages = Math.max(1, Math.ceil(this._processed().length / this.pageSize));
        if (v === "prev") this.page = Math.max(1, this.page - 1);
        else if (v === "next") this.page = Math.min(pages, this.page + 1);
        else this.page = +v;
        this.render();
      });
      on(c, "change", "[data-check-all]", (e, t) => {
        const start = (this.page - 1) * this.pageSize;
        const pageRows = this._processed().slice(start, start + this.pageSize);
        pageRows.forEach((r) => { if (t.checked) this.selected.add(this._id(r)); else this.selected.delete(this._id(r)); });
        this.render();
      });
      on(c, "change", "[data-check-row]", (e, t) => {
        const tr = t.closest("tr");
        const id = tr.dataset.rowId;
        if (t.checked) this.selected.add(id); else this.selected.delete(id);
        this.render();
      });
      on(c, "click", "[data-bulk-clear]", () => { this.selected.clear(); this.render(); });
      on(c, "click", "[data-bulk]", (e, t) => {
        const a = (this.opts.bulkActions || [])[+t.dataset.bulk];
        if (a) a.onClick(this.getSelectedRows(), this);
      });
      on(c, "click", "[data-row-action]", (e, t) => {
        e.stopPropagation();
        const tr = t.closest("tr");
        const row = this.allRows.find((r) => String(this._id(r)) === tr.dataset.rowId);
        this.opts.rowActions(row, t, this);
      });
      if (this.opts.rowClick) {
        on(c, "click", "tr[data-row-id]", (e, t) => {
          if (e.target.closest(".td-check,.td-actions,.checkbox,button,a")) return;
          const row = this.allRows.find((r) => String(this._id(r)) === t.dataset.rowId);
          if (row) this.opts.rowClick(row, this);
        });
      }
    }
  }

  App.ui = {
    avatar, avatarGroup, faceAvatar, badge, pill, trendPill, stars, progress,
    iconBtn, segmented, tabs, emptyState, skeletonCard, kpiCard,
    field, toggle, validate,
    popover, menuList, closePopover,
    modal, confirm, drawer, toast,
    initTooltips, DataTable, STATUS_MAP,
  };
})(window.App);
