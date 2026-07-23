/* ============================================================
   Kerso CRM — Utilities
   Formatting, DOM helpers, local store, event bus, misc.
   Exposed on the global App namespace (classic script, no build).
   ============================================================ */
window.App = window.App || {};

(function (App) {
  "use strict";

  /* ---------------- Formatting ---------------- */
  const fmt = {
    /** $1,234 — full currency, no decimals by default */
    money(n, opts = {}) {
      const { decimals = 0, sign = false } = opts;
      const v = Number(n) || 0;
      const s = "$" + Math.abs(v).toLocaleString("en-US", {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
      });
      if (sign) return (v < 0 ? "−" : "+") + s;
      return (v < 0 ? "−" : "") + s;
    },
    /** $1.2M / $340K — compact currency */
    moneyCompact(n) {
      const v = Number(n) || 0;
      return "$" + fmt._compact(v);
    },
    /** 1,234 */
    num(n) {
      return (Number(n) || 0).toLocaleString("en-US");
    },
    /** 1.2K / 3.4M */
    compact(n) {
      return fmt._compact(Number(n) || 0);
    },
    _compact(v) {
      const abs = Math.abs(v);
      const sgn = v < 0 ? "-" : "";
      if (abs >= 1e9) return sgn + (abs / 1e9).toFixed(abs % 1e9 ? 1 : 0) + "B";
      if (abs >= 1e6) return sgn + (abs / 1e6).toFixed(abs % 1e6 ? 1 : 0) + "M";
      if (abs >= 1e3) return sgn + (abs / 1e3).toFixed(abs % 1e3 ? 1 : 0) + "K";
      return sgn + String(abs);
    },
    /** +12.9% / −9.0% */
    pct(n, withSign = true) {
      const v = Number(n) || 0;
      const sgn = withSign ? (v > 0 ? "+" : v < 0 ? "−" : "") : "";
      return sgn + Math.abs(v).toFixed(1) + "%";
    },
    /** Jun 24, 2024 */
    date(d) {
      const dt = d instanceof Date ? d : new Date(d);
      if (isNaN(dt)) return "—";
      return dt.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
    },
    /** Jun 24 */
    dateShort(d) {
      const dt = d instanceof Date ? d : new Date(d);
      if (isNaN(dt)) return "—";
      return dt.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    },
    /** 2h ago / Just now / 3d ago — relative to App's "now" */
    relTime(d) {
      const dt = d instanceof Date ? d : new Date(d);
      const now = App.now ? App.now() : new Date();
      let s = Math.round((now - dt) / 1000);
      const future = s < 0;
      s = Math.abs(s);
      const units = [
        [60, "s", 1],
        [3600, "m", 60],
        [86400, "h", 3600],
        [604800, "d", 86400],
        [2629800, "w", 604800],
        [31557600, "mo", 2629800],
        [Infinity, "y", 31557600],
      ];
      if (s < 45) return future ? "soon" : "just now";
      for (const [limit, label, div] of units) {
        if (s < limit) {
          const val = Math.round(s / div);
          return future ? `in ${val}${label}` : `${val}${label} ago`;
        }
      }
      return fmt.date(dt);
    },
    /** Initials from a full name: "Arya Pams" -> "AP" */
    initials(name) {
      if (!name) return "?";
      const parts = String(name).trim().split(/\s+/).filter(Boolean);
      if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    },
    /** "active" -> "Active" */
    title(s) {
      return String(s || "").replace(/\b\w/g, (c) => c.toUpperCase());
    },
  };

  /* ---------------- DOM helpers ---------------- */
  const escapeHtml = (s) =>
    String(s == null ? "" : s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");

  /** Build a single element from an HTML string */
  function node(html) {
    const t = document.createElement("template");
    t.innerHTML = String(html).trim();
    return t.content.firstElementChild;
  }
  const qs = (sel, root = document) => root.querySelector(sel);
  const qsa = (sel, root = document) => Array.from(root.querySelectorAll(sel));

  /** Event delegation: on(root, 'click', '.sel', handler) */
  function on(root, type, selector, handler, opts) {
    if (typeof selector === "function") {
      root.addEventListener(type, selector, handler);
      return () => root.removeEventListener(type, selector, handler);
    }
    const listener = (e) => {
      const target = e.target.closest(selector);
      if (target && root.contains(target)) handler(e, target);
    };
    root.addEventListener(type, listener, opts);
    return () => root.removeEventListener(type, listener, opts);
  }

  /* ---------------- Local store (prefs) ---------------- */
  const PREFIX = "kerso:";
  const store = {
    get(key, def) {
      try {
        const v = localStorage.getItem(PREFIX + key);
        return v == null ? def : JSON.parse(v);
      } catch (e) {
        return def;
      }
    },
    set(key, val) {
      try {
        localStorage.setItem(PREFIX + key, JSON.stringify(val));
      } catch (e) {
        /* ignore quota / privacy mode */
      }
    },
    remove(key) {
      try {
        localStorage.removeItem(PREFIX + key);
      } catch (e) {}
    },
  };

  /* ---------------- Tiny event bus ---------------- */
  function bus() {
    const map = {};
    return {
      on(type, fn) {
        (map[type] = map[type] || []).push(fn);
        return () => this.off(type, fn);
      },
      off(type, fn) {
        if (map[type]) map[type] = map[type].filter((f) => f !== fn);
      },
      emit(type, payload) {
        (map[type] || []).forEach((fn) => fn(payload));
      },
    };
  }

  /* ---------------- Misc ---------------- */
  function debounce(fn, wait = 200) {
    let t;
    const d = function (...args) {
      clearTimeout(t);
      t = setTimeout(() => fn.apply(this, args), wait);
    };
    d.cancel = () => clearTimeout(t);
    return d;
  }
  const clamp = (n, lo, hi) => Math.max(lo, Math.min(hi, n));
  const range = (n) => Array.from({ length: n }, (_, i) => i);
  const sum = (arr, key) => arr.reduce((a, x) => a + (key ? x[key] : x), 0);
  const uid = (() => {
    let i = 0;
    return (p = "id") => `${p}-${(++i).toString(36)}-${Math.floor(performance.now() % 1e6).toString(36)}`;
  })();

  App.fmt = fmt;
  App.escapeHtml = escapeHtml;
  App.node = node;
  App.qs = qs;
  App.qsa = qsa;
  App.on = on;
  App.store = store;
  App.bus = bus();
  App.makeBus = bus;
  App.debounce = debounce;
  App.clamp = clamp;
  App.range = range;
  App.sum = sum;
  App.uid = uid;
})(window.App);
