/* ============================================================
   کرسو CRM — ابزارها (نسخهٔ فارسی)
   قالب‌بندی فارسی (ارقام فارسی، تومان، تقویم جلالی)، کمک‌کننده‌های DOM،
   ذخیره‌سازی محلی، گذرگاه رویداد و موارد متفرقه.
   روی فضای نام سراسری App قرار می‌گیرد (اسکریپت کلاسیک، بدون build).
   ============================================================ */
window.App = window.App || {};

(function (App) {
  "use strict";

  /* ---------------- ارقام فارسی ---------------- */
  const FA_DIGITS = "۰۱۲۳۴۵۶۷۸۹";
  /** تبدیل ارقام لاتین به فارسی + جداکنندهٔ اعشار فارسی */
  const faDigits = (s) =>
    String(s == null ? "" : s)
      .replace(/[0-9]/g, (d) => FA_DIGITS[d])
      .replace(/\./g, "٫");
  App.faDigits = faDigits;

  /* ---------------- قالب‌بندی ---------------- */
  const fmt = {
    /** ۱٬۲۳۴ تومان — مبلغ کامل، بدون اعشار به‌صورت پیش‌فرض */
    money(n, opts = {}) {
      const { decimals = 0, sign = false } = opts;
      const v = Number(n) || 0;
      const s = Math.abs(v).toLocaleString("fa-IR", {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
      }) + " تومان";
      if (sign) return (v < 0 ? "−" : "+") + s;
      return (v < 0 ? "−" : "") + s;
    },
    /** ۱٫۲M تومان / ۳۴۰K تومان — مبلغ فشرده */
    moneyCompact(n) {
      const v = Number(n) || 0;
      return fmt._compact(v) + " تومان";
    },
    /** ۱٬۲۳۴ */
    num(n) {
      return (Number(n) || 0).toLocaleString("fa-IR");
    },
    /** ۱٫۲K / ۳٫۴M */
    compact(n) {
      return fmt._compact(Number(n) || 0);
    },
    _compact(v) {
      const abs = Math.abs(v);
      const sgn = v < 0 ? "−" : "";
      let out;
      if (abs >= 1e9) out = (abs / 1e9).toFixed(abs % 1e9 ? 1 : 0) + "B";
      else if (abs >= 1e6) out = (abs / 1e6).toFixed(abs % 1e6 ? 1 : 0) + "M";
      else if (abs >= 1e3) out = (abs / 1e3).toFixed(abs % 1e3 ? 1 : 0) + "K";
      else out = String(abs);
      return sgn + faDigits(out);
    },
    /** ‎+۱۲٫۹٪ / −۹٫۰٪ */
    pct(n, withSign = true) {
      const v = Number(n) || 0;
      const sgn = withSign ? (v > 0 ? "+" : v < 0 ? "−" : "") : "";
      return sgn + faDigits(Math.abs(v).toFixed(1)) + "٪";
    },
    /** ۴ تیر ۱۴۰۳ — تقویم جلالی */
    date(d) {
      const dt = d instanceof Date ? d : new Date(d);
      if (isNaN(dt)) return "—";
      return dt.toLocaleDateString("fa-IR", { month: "long", day: "numeric", year: "numeric" });
    },
    /** ۴ تیر */
    dateShort(d) {
      const dt = d instanceof Date ? d : new Date(d);
      if (isNaN(dt)) return "—";
      return dt.toLocaleDateString("fa-IR", { month: "long", day: "numeric" });
    },
    /** ۲ ساعت پیش / هم‌اکنون / ۳ روز پیش — نسبت به «اکنونِ» اپ */
    relTime(d) {
      const dt = d instanceof Date ? d : new Date(d);
      const now = App.now ? App.now() : new Date();
      let s = Math.round((now - dt) / 1000);
      const future = s < 0;
      s = Math.abs(s);
      const units = [
        [60, "ثانیه", 1],
        [3600, "دقیقه", 60],
        [86400, "ساعت", 3600],
        [604800, "روز", 86400],
        [2629800, "هفته", 604800],
        [31557600, "ماه", 2629800],
        [Infinity, "سال", 31557600],
      ];
      if (s < 45) return future ? "به‌زودی" : "هم‌اکنون";
      for (const [limit, label, div] of units) {
        if (s < limit) {
          const val = faDigits(Math.round(s / div));
          return future ? `${val} ${label} دیگر` : `${val} ${label} پیش`;
        }
      }
      return fmt.date(dt);
    },
    /** حروف اول از نام کامل: «مایا اندرسون» → «ما» */
    initials(name) {
      if (!name) return "؟";
      const parts = String(name).trim().split(/\s+/).filter(Boolean);
      if (parts.length === 1) return parts[0].slice(0, 2);
      return parts[0][0] + parts[parts.length - 1][0];
    },
    /** بدون تغییر برای فارسی (در فارسی حروف بزرگ/کوچک نداریم) */
    title(s) {
      return String(s || "");
    },
  };

  /* ---------------- کمک‌کننده‌های DOM ---------------- */
  const escapeHtml = (s) =>
    String(s == null ? "" : s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");

  /** ساخت یک عنصر از رشتهٔ HTML */
  function node(html) {
    const t = document.createElement("template");
    t.innerHTML = String(html).trim();
    return t.content.firstElementChild;
  }
  const qs = (sel, root = document) => root.querySelector(sel);
  const qsa = (sel, root = document) => Array.from(root.querySelectorAll(sel));

  /** واگذاری رویداد: on(root, 'click', '.sel', handler) */
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

  /* ---------------- ذخیره‌سازی محلی (تنظیمات) ---------------- */
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
        /* نادیده گرفتن محدودیت فضا / حالت حریم خصوصی */
      }
    },
    remove(key) {
      try {
        localStorage.removeItem(PREFIX + key);
      } catch (e) {}
    },
  };

  /* ---------------- گذرگاه رویداد کوچک ---------------- */
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

  /* ---------------- متفرقه ---------------- */
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
