import type { Locale } from "@/lib/i18n/config";
import { getAppNow } from "@/lib/utils/time";

const FA_DIGITS = "۰۱۲۳۴۵۶۷۸۹";

export function faDigits(s: string | number | null | undefined): string {
  return String(s == null ? "" : s)
    .replace(/[0-9]/g, (d) => FA_DIGITS[Number(d)]!)
    .replace(/\./g, "٫");
}

export type Fmt = {
  money: (n: number, opts?: { decimals?: number; sign?: boolean }) => string;
  moneyCompact: (n: number) => string;
  num: (n: number) => string;
  compact: (n: number) => string;
  pct: (n: number, withSign?: boolean) => string;
  date: (d: Date | string | number) => string;
  dateShort: (d: Date | string | number) => string;
  relTime: (d: Date | string | number) => string;
  initials: (name: string | null | undefined) => string;
  title: (s: string | null | undefined) => string;
  digits: (s: string | number | null | undefined) => string;
};

function compactEn(v: number): string {
  const abs = Math.abs(v);
  const sgn = v < 0 ? "-" : "";
  if (abs >= 1e9) return sgn + (abs / 1e9).toFixed(abs % 1e9 ? 1 : 0) + "B";
  if (abs >= 1e6) return sgn + (abs / 1e6).toFixed(abs % 1e6 ? 1 : 0) + "M";
  if (abs >= 1e3) return sgn + (abs / 1e3).toFixed(abs % 1e3 ? 1 : 0) + "K";
  return sgn + String(abs);
}

function compactFa(v: number): string {
  const abs = Math.abs(v);
  const sgn = v < 0 ? "−" : "";
  let out: string;
  if (abs >= 1e9) out = (abs / 1e9).toFixed(abs % 1e9 ? 1 : 0) + "B";
  else if (abs >= 1e6) out = (abs / 1e6).toFixed(abs % 1e6 ? 1 : 0) + "M";
  else if (abs >= 1e3) out = (abs / 1e3).toFixed(abs % 1e3 ? 1 : 0) + "K";
  else out = String(abs);
  return sgn + faDigits(out);
}

export function createFmt(locale: Locale): Fmt {
  if (locale === "fa") {
    return {
      money(n, opts = {}) {
        const { decimals = 0, sign = false } = opts;
        const v = Number(n) || 0;
        const s =
          Math.abs(v).toLocaleString("fa-IR", {
            minimumFractionDigits: decimals,
            maximumFractionDigits: decimals,
          }) + " تومان";
        if (sign) return (v < 0 ? "−" : "+") + s;
        return (v < 0 ? "−" : "") + s;
      },
      moneyCompact(n) {
        const v = Number(n) || 0;
        return compactFa(v) + " تومان";
      },
      num(n) {
        return (Number(n) || 0).toLocaleString("fa-IR");
      },
      compact(n) {
        return compactFa(Number(n) || 0);
      },
      pct(n, withSign = true) {
        const v = Number(n) || 0;
        const sgn = withSign ? (v > 0 ? "+" : v < 0 ? "−" : "") : "";
        return sgn + faDigits(Math.abs(v).toFixed(1)) + "٪";
      },
      date(d) {
        const dt = d instanceof Date ? d : new Date(d);
        if (Number.isNaN(dt.getTime())) return "—";
        return dt.toLocaleDateString("fa-IR", {
          month: "long",
          day: "numeric",
          year: "numeric",
        });
      },
      dateShort(d) {
        const dt = d instanceof Date ? d : new Date(d);
        if (Number.isNaN(dt.getTime())) return "—";
        return dt.toLocaleDateString("fa-IR", {
          month: "long",
          day: "numeric",
        });
      },
      relTime(d) {
        const dt = d instanceof Date ? d : new Date(d);
        const now = getAppNow();
        let s = Math.round((now.getTime() - dt.getTime()) / 1000);
        const future = s < 0;
        s = Math.abs(s);
        const units: Array<[number, string, number]> = [
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
        return this.date(dt);
      },
      initials(name) {
        if (!name) return "؟";
        const parts = String(name).trim().split(/\s+/).filter(Boolean);
        if (parts.length === 1) return parts[0]!.slice(0, 2);
        return parts[0]![0]! + parts[parts.length - 1]![0]!;
      },
      title(s) {
        return String(s || "");
      },
      digits: faDigits,
    };
  }

  return {
    money(n, opts = {}) {
      const { decimals = 0, sign = false } = opts;
      const v = Number(n) || 0;
      const s =
        "$" +
        Math.abs(v).toLocaleString("en-US", {
          minimumFractionDigits: decimals,
          maximumFractionDigits: decimals,
        });
      if (sign) return (v < 0 ? "−" : "+") + s;
      return (v < 0 ? "−" : "") + s;
    },
    moneyCompact(n) {
      const v = Number(n) || 0;
      return "$" + compactEn(v);
    },
    num(n) {
      return (Number(n) || 0).toLocaleString("en-US");
    },
    compact(n) {
      return compactEn(Number(n) || 0);
    },
    pct(n, withSign = true) {
      const v = Number(n) || 0;
      const sgn = withSign ? (v > 0 ? "+" : v < 0 ? "−" : "") : "";
      return sgn + Math.abs(v).toFixed(1) + "%";
    },
    date(d) {
      const dt = d instanceof Date ? d : new Date(d);
      if (Number.isNaN(dt.getTime())) return "—";
      return dt.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
    },
    dateShort(d) {
      const dt = d instanceof Date ? d : new Date(d);
      if (Number.isNaN(dt.getTime())) return "—";
      return dt.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      });
    },
    relTime(d) {
      const dt = d instanceof Date ? d : new Date(d);
      const now = getAppNow();
      let s = Math.round((now.getTime() - dt.getTime()) / 1000);
      const future = s < 0;
      s = Math.abs(s);
      const units: Array<[number, string, number]> = [
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
      return this.date(dt);
    },
    initials(name) {
      if (!name) return "?";
      const parts = String(name).trim().split(/\s+/).filter(Boolean);
      if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase();
      return (parts[0]![0]! + parts[parts.length - 1]![0]!).toUpperCase();
    },
    title(s) {
      return String(s || "").replace(/\b\w/g, (c) => c.toUpperCase());
    },
    digits(s) {
      return String(s == null ? "" : s);
    },
  };
}
