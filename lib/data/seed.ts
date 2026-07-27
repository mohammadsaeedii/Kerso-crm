import type { Locale } from "@/lib/i18n/config";
import { getDictionarySync } from "@/lib/i18n/get-dictionary";
import { createFmt, faDigits } from "@/lib/utils/fmt";
import { daysAgo, hoursAgo, minsAgo } from "@/lib/utils/time";
import {
  COMPANY_SIZES,
  CUST_STATUSES,
  DEAL_STAGES,
  INDUSTRIES,
  TAGS,
  monthLabel,
} from "@/lib/data/labels";
import { createSupportSeed } from "@/lib/data/support-seed";
import type {
  Activity,
  AppData,
  AvatarColor,
  Company,
  CompanySizeKey,
  CompanyStatus,
  Customer,
  CustomerStatus,
  Deal,
  Kpi,
  Message,
  Notification,
  Review,
  TagKey,
  Task,
} from "@/types";

const AVATARS = [
  "indigo",
  "violet",
  "blue",
  "sky",
  "teal",
  "emerald",
  "amber",
  "orange",
  "rose",
  "pink",
  "fuchsia",
  "slate",
] as const satisfies readonly AvatarColor[];

const TRANSLIT: Record<string, string> = {
  ا: "a",
  آ: "a",
  أ: "a",
  إ: "e",
  ب: "b",
  پ: "p",
  ت: "t",
  ث: "s",
  ج: "j",
  چ: "ch",
  ح: "h",
  خ: "kh",
  د: "d",
  ذ: "z",
  ر: "r",
  ز: "z",
  ژ: "zh",
  س: "s",
  ش: "sh",
  ص: "s",
  ض: "z",
  ط: "t",
  ظ: "z",
  ع: "a",
  غ: "gh",
  ف: "f",
  ق: "gh",
  ک: "k",
  گ: "g",
  ل: "l",
  م: "m",
  ن: "n",
  و: "v",
  ه: "h",
  ی: "i",
  ي: "i",
  ئ: "",
  ء: "",
  ة: "h",
};

function translit(str: string): string {
  return String(str || "")
    .split("")
    .map((ch) =>
      ch in TRANSLIT ? TRANSLIT[ch]! : /[a-z0-9]/i.test(ch) ? ch : "",
    )
    .join("")
    .toLowerCase();
}

function makeRng(seed: number): () => number {
  let s = seed >>> 0;
  return function () {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function range(n: number): number[] {
  return Array.from({ length: n }, (_, i) => i);
}

function sumBy<T>(arr: T[], key: keyof T): number {
  return arr.reduce((a, x) => a + (Number(x[key]) || 0), 0);
}

type Pools = {
  first: string[];
  last: string[];
  companies: string[];
  cities: Array<[string, string]>;
  dealNames: string[];
  reviewTitles: Record<number, string[]>;
  reviewBodies: string[];
  products: string[];
  growthAdj: string[];
  focus: string[];
  currentUser: { name: string; role: string; email: string };
  firstCustomer: {
    name: string;
    company: string;
    email: string;
  };
  activities: Array<Omit<Activity, "time"> & { time: Date }>;
  tasks: Task[];
  notifications: Notification[];
  messages: Message[];
  reps: Array<{ name: string; color: AvatarColor; value: number; deals: number }>;
  replyBody: string;
};

const EN_POOLS: Omit<
  Pools,
  "activities" | "tasks" | "notifications" | "messages" | "reps" | "replyBody"
> & {
  replyBody: string;
} = {
  first: [
    "Arya", "Liam", "Noah", "Olivia", "Emma", "Ava", "Sophia", "Mia", "Lucas",
    "Mason", "Ethan", "Aiden", "Harper", "Ella", "Amelia", "Aria", "Riley",
    "Maya", "Zoe", "Leo", "Hana", "Yusuf", "Ibrahim", "Layla", "Omar",
    "Priya", "Arjun", "Mei", "Chen", "Sofia", "Mateo", "Diego", "Camila",
    "Nina", "Felix", "Greta", "Tariq", "Aisha", "Kofi", "Ada", "Nikolai",
    "Elena", "Marco", "Yara", "Dante", "Ines", "Theo", "Lena",
  ],
  last: [
    "Pams", "Carter", "Nguyen", "Patel", "Kim", "Garcia", "Rossi", "Müller",
    "Okafor", "Silva", "Haddad", "Novak", "Schmidt", "Andersson", "Ferreira",
    "Yamamoto", "Costa", "Khan", "Reyes", "Walsh", "Bauer", "Dubois",
    "Lindqvist", "Marsh", "Volkov", "Sharma", "Mendoza", "Brooks", "Hale",
    "Fontaine", "Castillo", "Bianchi", "Larsen", "Adeyemi", "Petrov",
  ],
  companies: [
    "Lumina Labs", "Northwind", "Apex Digital", "Cobalt Systems", "Vertex AI",
    "Meridian Co", "Drift Studio", "Helios Energy", "Pinecone", "Solstice",
    "Forma", "Beacon Health", "Quanta", "Riverbank", "Auralink", "Novacrest",
    "Bytewise", "Cedar & Co", "Hatchworks", "Glide", "Tessellate", "Polaris",
    "Maplebrook", "Orbital", "Kindred Goods", "Stratus", "Verdant", "Fathom",
    "Wavelength", "Atlas Freight", "Lantern", "Brightline",
  ],
  cities: [
    ["San Francisco", "USA"], ["New York", "USA"], ["Austin", "USA"],
    ["London", "UK"], ["Berlin", "Germany"], ["Paris", "France"],
    ["Toronto", "Canada"], ["Amsterdam", "Netherlands"], ["Singapore", "Singapore"],
    ["Sydney", "Australia"], ["Dubai", "UAE"], ["São Paulo", "Brazil"],
    ["Tokyo", "Japan"], ["Stockholm", "Sweden"], ["Bengaluru", "India"],
  ],
  dealNames: [
    "Annual platform license", "Onboarding package", "Enterprise rollout",
    "API integration", "Premium support", "Data migration", "Seat expansion",
    "Security add-on", "Custom analytics", "Renewal — Pro", "Pilot program",
    "Hardware bundle", "Training workshop", "White-label deal",
  ],
  reviewTitles: {
    5: ["Absolutely love it", "Best decision we made", "Exceeded expectations", "A game changer", "Couldn't be happier"],
    4: ["Really solid product", "Great, with minor nits", "Very happy overall", "Strong value", "Recommend it"],
    3: ["Good but room to grow", "Decent experience", "It does the job", "Mixed feelings", "Okay for the price"],
    2: ["Underwhelming", "Expected more", "Several issues", "Hard to recommend", "Frustrating at times"],
    1: ["Not for us", "Disappointed", "Lots of problems", "Would not renew", "Needs serious work"],
  },
  reviewBodies: [
    "The onboarding was smooth and the support team responded within minutes. Pipeline reporting alone paid for the subscription.",
    "We migrated 12k contacts without a hitch. The automation builder is intuitive once you get the hang of it.",
    "Dashboards are gorgeous and fast. I'd love deeper export options, but day-to-day it's excellent.",
    "Solid CRM. The mobile experience could be better, and a few filters are buried, but the core is strong.",
    "Setup took longer than expected and the docs lagged behind the UI. Once configured it's been reliable.",
    "Customer reviews and sentiment tracking in one place saved us a separate tool. Highly recommend for SMBs.",
    "The team loves the kanban pipeline. Closing deals feels effortless and forecasting is finally accurate.",
    "A few sync hiccups with our calendar, but the roadmap looks promising and updates ship often.",
    "Pricing crept up at renewal which stung, but the value is undeniable for a growing sales org.",
    "Beautiful interface that our whole team adopted in a week. The analytics convinced our CFO.",
  ],
  products: ["Kerso CRM", "Kerso Analytics", "Kerso Inbox", "Kerso Mobile", "Kerso API"],
  growthAdj: ["fast-growing", "well-established", "venture-backed", "bootstrapped", "market-leading"],
  focus: ["scaling operations", "customer success", "product innovation", "global expansion", "platform reliability"],
  currentUser: {
    name: "Arya Pams",
    role: "Superadmin",
    email: "arya.pams@kerso.io",
  },
  firstCustomer: {
    name: "Maya Andersson",
    company: "Lumina Labs",
    email: "maya.andersson@luminalabs.com",
  },
  replyBody:
    "Thank you so much for the thoughtful feedback — we've shared this with the team and a few of your suggestions are already on the roadmap!",
};

const FA_POOLS: typeof EN_POOLS = {
  first: [
    "آرش", "علی", "رضا", "محمد", "حسین", "مهدی", "امیر", "سینا", "بابک", "کاوه",
    "نوید", "سامان", "پویا", "فرهاد", "رامین", "شایان", "کیان", "آرمان", "سپهر", "طاها",
    "سارا", "مریم", "زهرا", "فاطمه", "نگار", "نیلوفر", "پریسا", "شیرین", "لیلا", "مینا",
    "نازنین", "یاسمن", "کیمیا", "آیدا", "الهام", "بهاره", "رها", "ندا", "سمیرا", "ترانه",
    "حنا", "یوسف", "آرتین", "ماهان", "دلارام", "رزا", "هانیه", "سوگند",
  ],
  last: [
    "محمدی", "رضایی", "حسینی", "احمدی", "کریمی", "موسوی", "جعفری", "رحیمی", "صادقی", "اکبری",
    "نوری", "قاسمی", "کاظمی", "یوسفی", "عباسی", "حیدری", "شریفی", "فرهادی", "نجفی", "سلطانی",
    "امیری", "رستمی", "بهرامی", "طاهری", "مرادی", "اسدی", "زمانی", "توکلی", "کوهستانی", "فروزان",
    "نیک‌نام", "مهدوی", "صفری", "غلامی", "بیات", "خسروی",
  ],
  companies: [
    "نوآوران داده", "پارس‌تک", "ابر سبز", "هوش‌پرداز", "آرمان سیستم", "دیجی‌فردا",
    "سپهر داده", "فناوران نوین", "رایان‌اندیش", "پیشگامان رایان", "زرین‌افزار", "آسمان آبی",
    "کیمیا تجارت", "البرز انرژی", "مهرگان فناوری", "نقش‌آفرینان", "بهسازان صنعت", "هم‌آوا",
    "تدبیر داده", "ققنوس", "فراز سیستم", "پرتو نوین", "ماهان تجارت", "اطلس بار",
    "روشنا", "خط روشن", "آوای شهر", "کاسپین داده", "نوین‌پرداز", "آریا فناوری",
    "سامانه گستر", "ویرا سیستم",
  ],
  cities: [
    ["تهران", "ایران"], ["اصفهان", "ایران"], ["شیراز", "ایران"],
    ["مشهد", "ایران"], ["تبریز", "ایران"], ["کرج", "ایران"],
    ["اهواز", "ایران"], ["قم", "ایران"], ["یزد", "ایران"],
    ["کرمان", "ایران"], ["رشت", "ایران"], ["بندرعباس", "ایران"],
    ["دبی", "امارات"], ["استانبول", "ترکیه"], ["مسقط", "عمان"],
  ],
  dealNames: [
    "لایسنس سالانهٔ پلتفرم", "بستهٔ راه‌اندازی", "استقرار سازمانی",
    "یکپارچه‌سازی API", "پشتیبانی ویژه", "مهاجرت داده", "افزایش کاربر",
    "افزونهٔ امنیتی", "تحلیل سفارشی", "تمدید — حرفه‌ای", "برنامهٔ آزمایشی",
    "بستهٔ سخت‌افزاری", "کارگاه آموزشی", "قرارداد برچسب‌سفید",
  ],
  reviewTitles: {
    5: ["واقعاً عاشقش شدیم", "بهترین تصمیممان بود", "فراتر از انتظار", "یک نقطهٔ عطف", "راضی‌تر از این نمی‌شدیم"],
    4: ["محصولی واقعاً محکم", "عالی، با ایرادهای جزئی", "در کل بسیار راضی", "ارزش بالا", "پیشنهادش می‌کنم"],
    3: ["خوب اما جای رشد دارد", "تجربهٔ قابل‌قبول", "کارراه‌اندازه", "احساس دوگانه", "برای این قیمت خوب است"],
    2: ["کمتر از انتظار", "انتظار بیشتری داشتم", "چند مشکل داشت", "سخت بشود توصیه‌اش کرد", "گاهی آزاردهنده"],
    1: ["مناسب ما نبود", "ناامید شدم", "مشکلات زیادی داشت", "تمدیدش نمی‌کنم", "نیاز به کار جدی دارد"],
  },
  reviewBodies: [
    "راه‌اندازی روان بود و تیم پشتیبانی ظرف چند دقیقه پاسخ داد. فقط گزارش‌گیری قیف فروش، هزینهٔ اشتراک را جبران کرد.",
    "۱۲ هزار مخاطب را بدون هیچ مشکلی مهاجرت دادیم. سازندهٔ اتوماسیون پس از کمی تمرین کاملاً سرراست است.",
    "داشبوردها زیبا و سریع‌اند. گزینه‌های خروجی عمیق‌تری می‌خواستم، اما برای کار روزمره عالی است.",
    "CRM محکمی است. تجربهٔ موبایل می‌توانست بهتر باشد و چند فیلتر دور از دسترس‌اند، اما هستهٔ آن قوی است.",
    "راه‌اندازی بیشتر از انتظار طول کشید و مستندات از رابط کاربری عقب بودند. پس از تنظیم، پایدار بوده است.",
    "نظرات مشتریان و رصد احساسات در یک‌جا، ما را از یک ابزار جداگانه بی‌نیاز کرد. برای کسب‌وکارهای کوچک به‌شدت توصیه می‌شود.",
    "تیم عاشق قیف کانبان شده است. بستن معاملات بی‌دردسر شده و پیش‌بینی بالاخره دقیق است.",
    "چند بار همگام‌سازی با تقویممان لنگید، اما نقشهٔ راه امیدوارکننده است و به‌روزرسانی‌ها مرتب می‌رسند.",
    "هزینه هنگام تمدید کمی بالا رفت که ناخوشایند بود، اما ارزش آن برای یک تیم فروش روبه‌رشد انکارناپذیر است.",
    "رابط زیبایی که کل تیم ظرف یک هفته پذیرفت. تحلیل‌ها مدیر مالی‌مان را قانع کرد.",
  ],
  products: ["کرسو CRM", "تحلیل کرسو", "صندوق کرسو", "کرسو موبایل", "کرسو API"],
  growthAdj: ["نوپا و روبه‌رشد", "باسابقه و جاافتاده", "سرمایه‌گذاری‌شده", "خودبنیاد", "پیشرو در بازار"],
  focus: ["توسعهٔ عملیات", "موفقیت مشتری", "نوآوری محصول", "گسترش جهانی", "پایداری پلتفرم"],
  currentUser: {
    name: "آرش رضایی",
    role: "مدیر کل",
    email: "arash.rezaei@kerso.io",
  },
  firstCustomer: {
    name: "نگار محمدی",
    company: "نوآوران داده",
    email: "negar.mohammadi@noavarandadeh.com",
  },
  replyBody:
    "از بازخورد ارزشمندتان بسیار سپاسگزاریم — آن را با تیم در میان گذاشتیم و چند مورد از پیشنهادهایتان همین حالا در نقشهٔ راه قرار گرفته است!",
};

function spark(seed: number, n = 16, base = 50, vol = 14): number[] {
  const r = makeRng(seed);
  const out: number[] = [];
  let v = base;
  for (let i = 0; i < n; i++) {
    v += (r() - 0.45) * vol;
    out.push(Math.max(6, Math.round(v)));
  }
  return out;
}

/** Deterministic mock data for a locale (seed 20240624). */
export function createSeedData(locale: Locale): AppData {
  const dict = getDictionarySync(locale);
  const fmt = createFmt(locale);
  const pools = locale === "fa" ? FA_POOLS : EN_POOLS;
  const rng = makeRng(20240624);
  const pick = <T,>(arr: readonly T[]): T =>
    arr[Math.floor(rng() * arr.length)]!;
  const between = (a: number, b: number) =>
    a + Math.floor(rng() * (b - a + 1));
  const chance = (p: number) => rng() < p;
  const avatarColor = (): AvatarColor => pick(AVATARS);

  const fullName = () => `${pick(pools.first)} ${pick(pools.last)}`;
  const emailFor = (name: string, company: string) => {
    if (locale === "fa") {
      return (
        String(name)
          .trim()
          .split(/\s+/)
          .map(translit)
          .filter(Boolean)
          .join(".") +
        "@" +
        translit(company) +
        ".com"
      );
    }
    return (
      name.toLowerCase().replace(/[^a-z]+/g, ".") +
      "@" +
      company.toLowerCase().replace(/[^a-z]+/g, "") +
      ".com"
    );
  };
  const phone = () => {
    if (locale === "fa") {
      return faDigits(
        `09${between(10, 39)} ${between(100, 999)} ${String(between(0, 9999)).padStart(4, "0")}`,
      );
    }
    return `+1 (${between(200, 989)}) ${between(200, 989)}-${String(between(0, 9999)).padStart(4, "0")}`;
  };
  const pickTags = (): TagKey[] => {
    const n = between(1, 3);
    const set = new Set<TagKey>();
    while (set.size < n) set.add(pick(TAGS));
    return [...set];
  };

  const months = range(12).map((i) => monthLabel(dict, i));

  const currentUser = {
    ...pools.currentUser,
    avatar: "face" as const,
  };

  const kpis: Kpi[] = [
    {
      id: "active-deals",
      label: dict.dashboard.kpi["active-deals"],
      value: 120300,
      display: fmt.money(120300),
      delta: 12.9,
      dir: "up",
      spark: spark(11, 16, 60, 12),
    },
    {
      id: "revenue-total",
      label: dict.dashboard.kpi["revenue-total"],
      value: 234210,
      display: fmt.money(234210),
      delta: -9.0,
      dir: "down",
      spark: spark(22, 16, 70, 16),
    },
    {
      id: "deals-created",
      label: dict.dashboard.kpi["deals-created"],
      value: 1200,
      display: fmt.num(1200),
      delta: 10.9,
      dir: "up",
      spark: spark(33, 16, 45, 10),
    },
    {
      id: "deals-closing",
      label: dict.dashboard.kpi["deals-closing"],
      value: 874,
      display: fmt.num(874),
      delta: -8.3,
      dir: "down",
      spark: spark(44, 16, 55, 13),
    },
  ];

  const revenueSeries = (() => {
    const r = makeRng(909);
    let cur = 28;
    let prev = 22;
    return months.map((m) => {
      cur += (r() - 0.32) * 9;
      prev += (r() - 0.4) * 6;
      cur = Math.max(14, cur);
      prev = Math.max(10, prev);
      return {
        label: m,
        current: Math.round(cur * 1000),
        previous: Math.round(prev * 1000),
      };
    });
  })();

  const dealsCreated = months.map((m) => ({
    label: m,
    won: between(18, 60),
    lost: between(6, 26),
  }));

  const pipeline = [
    { stage: "lead" as const, count: 142, value: 86000, color: "#818CF8" },
    { stage: "qualified" as const, count: 98, value: 142000, color: "#6366F1" },
    { stage: "proposal" as const, count: 64, value: 121000, color: "#4F46E5" },
    {
      stage: "negotiation" as const,
      count: 38,
      value: 98000,
      color: "#4338CA",
    },
    { stage: "won" as const, count: 27, value: 120300, color: "#22C55E" },
  ];

  const deals: Deal[] = pools.dealNames.map((title, i) => {
    const company = pick(pools.companies);
    const stage = pick(DEAL_STAGES);
    return {
      id: "D-" + (1042 + i),
      title,
      company,
      owner: fullName(),
      ownerColor: avatarColor(),
      value: between(6, 90) * 1000,
      stage,
      probability: stage === "won" ? 100 : between(15, 90),
      close: daysAgo(between(-30, 20)),
      status: stage === "won" ? "won" : chance(0.12) ? "lost" : "open",
    };
  });

  const customers: Customer[] = [];
  for (let i = 0; i < 48; i++) {
    const name = fullName();
    const company = pick(pools.companies);
    const [city, country] = pick(pools.cities);
    const status: CustomerStatus = chance(0.5)
      ? "active"
      : pick(CUST_STATUSES);
    customers.push({
      id: "C-" + String(1000 + i),
      name,
      company,
      email: emailFor(name, company),
      phone: phone(),
      city,
      country,
      status,
      value: between(2, 240) * 1000,
      deals: between(1, 9),
      health: between(28, 99),
      avatar: avatarColor(),
      owner: fullName(),
      tags: pickTags(),
      joined: daysAgo(between(20, 900)),
      lastContact: daysAgo(between(0, 60)),
      rating: between(3, 5),
    });
  }
  Object.assign(customers[0]!, {
    name: pools.firstCustomer.name,
    company: pools.firstCustomer.company,
    status: "active" as const,
    value: 184000,
    deals: 7,
    health: 92,
    email: pools.firstCustomer.email,
  });

  const companies: Company[] = pools.companies.map((name, i) => {
    const [city, country] = pick(pools.cities);
    const industry = pick(INDUSTRIES);
    const status: CompanyStatus = chance(0.5)
      ? "customer"
      : pick(["customer", "prospect", "partner", "churned"] as const);
    const size = pick(COMPANY_SIZES) as CompanySizeKey;
    const website =
      locale === "fa"
        ? translit(name) + ".com"
        : name.toLowerCase().replace(/[^a-z]+/g, "") + ".com";
    const description =
      locale === "fa"
        ? `یک شرکت ${pick(pools.growthAdj)} در حوزهٔ ${dict.common.industry[industry]} با تمرکز بر ${pick(pools.focus)}.`
        : `A ${pick(pools.growthAdj)} ${dict.common.industry[industry].toLowerCase()} company focused on ${pick(pools.focus)}.`;
    return {
      id: "B-" + String(2000 + i),
      name,
      industry,
      size,
      city,
      country,
      revenue: between(120, 9800) * 1000,
      growth: between(-18, 64),
      status,
      contacts: between(2, 40),
      deals: between(0, 12),
      website,
      logo: avatarColor(),
      founded: between(2005, 2022),
      rating: (3 + rng() * 2).toFixed(1),
      description,
    };
  });

  const reviews: Review[] = [];
  for (let i = 0; i < 32; i++) {
    const rating = chance(0.62) ? between(4, 5) : between(1, 5);
    const name = fullName();
    const replied = chance(0.4);
    reviews.push({
      id: "R-" + String(3000 + i),
      author: name,
      avatar: avatarColor(),
      company: pick(pools.companies),
      rating,
      title: pick(pools.reviewTitles[rating]!),
      body: pick(pools.reviewBodies),
      product: pick(pools.products),
      date: daysAgo(between(0, 120)),
      sentiment:
        rating >= 4 ? "positive" : rating === 3 ? "neutral" : "negative",
      helpful: between(0, 84),
      verified: chance(0.8),
      replied,
      reply: replied
        ? {
            author: pools.currentUser.name,
            date: daysAgo(between(0, 40)),
            body: pools.replyBody,
          }
        : null,
    });
  }

  const activities: Activity[] =
    locale === "fa"
      ? [
          {
            type: "deal",
            who: "علی کریمی",
            color: "blue",
            text: "معاملهٔ <b>استقرار سازمانی</b> را به <b>مذاکره</b> منتقل کرد",
            time: minsAgo(8),
          },
          {
            type: "review",
            who: "سارا حسینی",
            color: "amber",
            text: "یک نظر <b>۵ ستاره</b> برای کرسو CRM ثبت کرد",
            time: minsAgo(42),
          },
          {
            type: "customer",
            who: "شما",
            color: "indigo",
            text: "<b>نگار محمدی</b> را به‌عنوان مشتری جدید افزود",
            time: hoursAgo(2),
          },
          {
            type: "deal",
            who: "محمد نوری",
            color: "emerald",
            text: "معاملهٔ <b>لایسنس سالانهٔ پلتفرم</b> را بست — <b>۴۸٬۰۰۰ تومان</b>",
            time: hoursAgo(4),
          },
          {
            type: "task",
            who: "مریم جعفری",
            color: "violet",
            text: "وظیفهٔ <b>ارسال پیشنهاد فصل سوم</b> را تکمیل کرد",
            time: hoursAgo(7),
          },
          {
            type: "message",
            who: "امیر عباسی",
            color: "teal",
            text: "به پیام شما در <b>فراز سیستم</b> پاسخ داد",
            time: hoursAgo(20),
          },
          {
            type: "deal",
            who: "لیلا رستمی",
            color: "rose",
            text: "معاملهٔ <b>برنامهٔ آزمایشی</b> را از دست داد — رقیب",
            time: daysAgo(1),
          },
          {
            type: "customer",
            who: "سینا یوسفی",
            color: "sky",
            text: "اطلاعات تماس <b>پارس‌تک</b> را به‌روزرسانی کرد",
            time: daysAgo(2),
          },
        ]
      : [
          {
            type: "deal",
            who: "Liam Carter",
            color: "blue",
            text: "moved <b>Enterprise rollout</b> to <b>Negotiation</b>",
            time: minsAgo(8),
          },
          {
            type: "review",
            who: "Sophia Kim",
            color: "amber",
            text: "left a <b>5-star</b> review on Kerso CRM",
            time: minsAgo(42),
          },
          {
            type: "customer",
            who: "You",
            color: "indigo",
            text: "added <b>Maya Andersson</b> as a new customer",
            time: hoursAgo(2),
          },
          {
            type: "deal",
            who: "Noah Patel",
            color: "emerald",
            text: "closed <b>Annual platform license</b> — <b>$48,000</b>",
            time: hoursAgo(4),
          },
          {
            type: "task",
            who: "Ava Garcia",
            color: "violet",
            text: "completed task <b>Send Q3 proposal</b>",
            time: hoursAgo(7),
          },
          {
            type: "message",
            who: "Omar Haddad",
            color: "teal",
            text: "replied to your message in <b>Cobalt Systems</b>",
            time: hoursAgo(20),
          },
          {
            type: "deal",
            who: "Ella Rossi",
            color: "rose",
            text: "lost <b>Pilot program</b> — competitor",
            time: daysAgo(1),
          },
          {
            type: "customer",
            who: "Lucas Nguyen",
            color: "sky",
            text: "updated contact details for <b>Northwind</b>",
            time: daysAgo(2),
          },
        ];

  const tasks: Task[] =
    locale === "fa"
      ? [
          { id: "T1", title: "پیگیری تمدید با نوآوران داده", due: daysAgo(-1), priority: "high", done: false, assignee: "آرش رضایی" },
          { id: "T2", title: "آماده‌سازی پیشنهاد برای دیجی‌فردا", due: daysAgo(-2), priority: "high", done: false, assignee: "علی کریمی" },
          { id: "T3", title: "بررسی حساب‌های در معرض ریزش", due: daysAgo(0), priority: "medium", done: false, assignee: "آرش رضایی" },
          { id: "T4", title: "ارسال ارائهٔ راه‌اندازی به آرمان سیستم", due: daysAgo(-3), priority: "medium", done: false, assignee: "مریم جعفری" },
          { id: "T5", title: "پاسخ به ۳ نظر جدید مشتریان", due: daysAgo(0), priority: "low", done: false, assignee: "آرش رضایی" },
          { id: "T6", title: "به‌روزرسانی پیش‌بینی فصل دوم در قیف فروش", due: daysAgo(1), priority: "medium", done: true, assignee: "محمد نوری" },
          { id: "T7", title: "هماهنگی دمو با هوش‌پرداز", due: daysAgo(-5), priority: "low", done: false, assignee: "آرش رضایی" },
        ]
      : [
          { id: "T1", title: "Follow up with Lumina Labs on renewal", due: daysAgo(-1), priority: "high", done: false, assignee: "Arya Pams" },
          { id: "T2", title: "Prepare proposal for Apex Digital", due: daysAgo(-2), priority: "high", done: false, assignee: "Liam Carter" },
          { id: "T3", title: "Review churn-risk accounts", due: daysAgo(0), priority: "medium", done: false, assignee: "Arya Pams" },
          { id: "T4", title: "Send onboarding deck to Drift Studio", due: daysAgo(-3), priority: "medium", done: false, assignee: "Ava Garcia" },
          { id: "T5", title: "Reply to 3 new customer reviews", due: daysAgo(0), priority: "low", done: false, assignee: "Arya Pams" },
          { id: "T6", title: "Update Q2 forecast in pipeline", due: daysAgo(1), priority: "medium", done: true, assignee: "Noah Patel" },
          { id: "T7", title: "Schedule demo with Vertex AI", due: daysAgo(-5), priority: "low", done: false, assignee: "Arya Pams" },
        ];

  const notifications: Notification[] =
    locale === "fa"
      ? [
          { id: "N1", type: "deal", title: "معامله برنده شد", desc: "لایسنس سالانهٔ پلتفرم به مبلغ ۴۸٬۰۰۰ تومان بسته شد", time: minsAgo(12), read: false },
          { id: "N2", type: "review", title: "نظر ۵ ستارهٔ جدید", desc: "سارا حسینی برای کرسو CRM نظر ثبت کرد", time: minsAgo(54), read: false },
          { id: "N3", type: "task", title: "وظیفهٔ امروز", desc: "بررسی حساب‌های در معرض ریزش", time: hoursAgo(3), read: false },
          { id: "N4", type: "customer", title: "مشتری جدید", desc: "نگار محمدی به حساب‌های شما افزوده شد", time: hoursAgo(6), read: true },
          { id: "N5", type: "system", title: "گزارش هفتگی آماده است", desc: "خلاصهٔ فروش این هفتهٔ شما در دسترس است", time: daysAgo(1), read: true },
          { id: "N6", type: "deal", title: "معامله در معرض خطر", desc: "برنامهٔ آزمایشی ۱۴ روز است بدون فعالیت مانده", time: daysAgo(2), read: true },
        ]
      : [
          { id: "N1", type: "deal", title: "Deal won", desc: "Annual platform license closed for $48,000", time: minsAgo(12), read: false },
          { id: "N2", type: "review", title: "New 5-star review", desc: "Sophia Kim reviewed Kerso CRM", time: minsAgo(54), read: false },
          { id: "N3", type: "task", title: "Task due today", desc: "Review churn-risk accounts", time: hoursAgo(3), read: false },
          { id: "N4", type: "customer", title: "New customer", desc: "Maya Andersson was added to your accounts", time: hoursAgo(6), read: true },
          { id: "N5", type: "system", title: "Weekly report ready", desc: "Your sales summary for this week is available", time: daysAgo(1), read: true },
          { id: "N6", type: "deal", title: "Deal at risk", desc: "Pilot program has been idle for 14 days", time: daysAgo(2), read: true },
        ];

  const messages: Message[] =
    locale === "fa"
      ? [
          { id: "M1", from: "امیر عباسی", color: "teal", preview: "عالیه — می‌تونیم تماس رو به پنجشنبه منتقل کنیم؟", time: minsAgo(5), unread: true, online: true },
          { id: "M2", from: "سارا حسینی", color: "amber", preview: "ممنون بابت سرعت در ارسال پیش‌فاکتور!", time: minsAgo(36), unread: true, online: true },
          { id: "M3", from: "علی کریمی", color: "blue", preview: "مرحلهٔ معامله رو به‌روز کردم، هر وقت فرصت کردی نگاهی بنداز.", time: hoursAgo(1), unread: true, online: false },
          { id: "M4", from: "آرمان سیستم", color: "violet", preview: "پیشنهاد را داخلی بررسی کردیم و…", time: hoursAgo(5), unread: false, online: false },
          { id: "M5", from: "نگار محمدی", color: "rose", preview: "عالی بود، مستندات راه‌اندازی خیلی شفاف بودند.", time: daysAgo(1), unread: false, online: true },
          { id: "M6", from: "محمد نوری", color: "emerald", preview: "اعداد پیش‌بینی الان داخل شیت مشترک هستند.", time: daysAgo(2), unread: false, online: false },
        ]
      : [
          { id: "M1", from: "Omar Haddad", color: "teal", preview: "Sounds great — can we move the call to Thursday?", time: minsAgo(5), unread: true, online: true },
          { id: "M2", from: "Sophia Kim", color: "amber", preview: "Thanks for the quick turnaround on the quote!", time: minsAgo(36), unread: true, online: true },
          { id: "M3", from: "Liam Carter", color: "blue", preview: "I updated the deal stage, take a look when free.", time: hoursAgo(1), unread: true, online: false },
          { id: "M4", from: "Drift Studio", color: "violet", preview: "We reviewed the proposal internally and…", time: hoursAgo(5), unread: false, online: false },
          { id: "M5", from: "Maya Andersson", color: "rose", preview: "Perfect, the onboarding docs were super clear.", time: daysAgo(1), unread: false, online: true },
          { id: "M6", from: "Noah Patel", color: "emerald", preview: "Forecast numbers are in the shared sheet now.", time: daysAgo(2), unread: false, online: false },
        ];

  const analytics = {
    kpis: [
      {
        id: "visitors",
        label: dict.analytics.kpi.visitors,
        value: 48210,
        display: fmt.num(48210),
        delta: 14.2,
        dir: "up" as const,
        spark: spark(101, 18, 50, 12),
      },
      {
        id: "conv",
        label: dict.analytics.kpi.conv,
        value: 4.8,
        display: fmt.pct(4.8, false),
        delta: 0.6,
        dir: "up" as const,
        spark: spark(102, 18, 40, 8),
      },
      {
        id: "aov",
        label: dict.analytics.kpi.aov,
        value: 8650,
        display: fmt.money(8650),
        delta: -2.1,
        dir: "down" as const,
        spark: spark(103, 18, 55, 14),
      },
      {
        id: "ltv",
        label: dict.analytics.kpi.ltv,
        value: 24300,
        display: fmt.money(24300),
        delta: 5.4,
        dir: "up" as const,
        spark: spark(104, 18, 48, 10),
      },
    ],
    visitors: (() => {
      const r = makeRng(55);
      let v = 1200;
      return range(30).map((i) => {
        v += (r() - 0.45) * 240;
        v = Math.max(400, v);
        return { label: i + 1, value: Math.round(v) };
      });
    })(),
    funnel: [
      { stage: dict.analytics.funnel.visited, value: 48210 },
      { stage: dict.analytics.funnel.signedUp, value: 12640 },
      { stage: dict.analytics.funnel.activated, value: 7180 },
      { stage: dict.analytics.funnel.opportunity, value: 2310 },
      { stage: dict.analytics.funnel.customer, value: 980 },
    ],
    sources: [
      { name: dict.analytics.sources.organic, value: 38, color: "#4F46E5" },
      { name: dict.analytics.sources.direct, value: 24, color: "#6366F1" },
      { name: dict.analytics.sources.referral, value: 18, color: "#818CF8" },
      { name: dict.analytics.sources.social, value: 12, color: "#22C55E" },
      { name: dict.analytics.sources.paid, value: 8, color: "#F59E0B" },
    ],
    reps:
      locale === "fa"
        ? [
            { name: "محمد نوری", color: "emerald" as const, value: 184000, deals: 23 },
            { name: "مریم جعفری", color: "violet" as const, value: 162500, deals: 19 },
            { name: "علی کریمی", color: "blue" as const, value: 148000, deals: 21 },
            { name: "لیلا رستمی", color: "rose" as const, value: 121000, deals: 14 },
            { name: "امیر عباسی", color: "teal" as const, value: 98500, deals: 12 },
          ]
        : [
            { name: "Noah Patel", color: "emerald" as const, value: 184000, deals: 23 },
            { name: "Ava Garcia", color: "violet" as const, value: 162500, deals: 19 },
            { name: "Liam Carter", color: "blue" as const, value: 148000, deals: 21 },
            { name: "Ella Rossi", color: "rose" as const, value: 121000, deals: 14 },
            { name: "Omar Haddad", color: "teal" as const, value: 98500, deals: 12 },
          ],
    regions: [
      { name: dict.analytics.regions.na, value: 46 },
      { name: dict.analytics.regions.eu, value: 31 },
      { name: dict.analytics.regions.apac, value: 15 },
      { name: dict.analytics.regions.latam, value: 5 },
      { name: dict.analytics.regions.mea, value: 3 },
    ],
    categories: [
      { name: dict.analytics.categories.subscriptions, value: 142000 },
      { name: dict.analytics.categories.services, value: 86000 },
      { name: dict.analytics.categories.addons, value: 54000 },
      { name: dict.analytics.categories.hardware, value: 28000 },
      { name: dict.analytics.categories.training, value: 19000 },
    ],
    devices: [
      { name: dict.analytics.devicesMap.desktop, value: 62, color: "#4F46E5" },
      { name: dict.analytics.devicesMap.mobile, value: 31, color: "#22C55E" },
      { name: dict.analytics.devicesMap.tablet, value: 7, color: "#F59E0B" },
    ],
    cohort: (() => {
      const r = makeRng(77);
      return range(6).map((row) => {
        const label = months[row]!;
        const vals: number[] = [];
        let base = 100;
        for (let c = 0; c <= 5 - row; c++) {
          if (c === 0) vals.push(100);
          else {
            base = base * (0.6 + r() * 0.28);
            vals.push(Math.round(base));
          }
        }
        return { label, vals };
      });
    })(),
  };

  const exploreStats = [
    {
      label: dict.explore.stats.companiesTracked,
      value: companies.length,
      sub: dict.explore.stats.companiesTrackedSub,
    },
    {
      label: dict.explore.stats.activeOpportunities,
      value: sumBy(companies, "deals"),
      sub: dict.explore.stats.activeOpportunitiesSub,
    },
    {
      label: dict.explore.stats.totalPipeline,
      value: sumBy(pipeline, "value"),
      money: true,
      sub: dict.explore.stats.totalPipelineSub,
    },
    {
      label: dict.explore.stats.avgHealth,
      value: Math.round(sumBy(customers, "health") / customers.length),
      suffix: locale === "fa" ? "٪" : "%",
      sub: dict.explore.stats.avgHealthSub,
    },
  ];

  const support = createSupportSeed(locale, customers, currentUser.name);

  return {
    currentUser,
    AVATARS,
    avatarColor,
    kpis,
    revenueSeries,
    dealsCreated,
    pipeline,
    deals,
    customers,
    companies,
    reviews,
    activities,
    tasks,
    notifications,
    messages,
    conversations: support.conversations,
    tickets: support.tickets,
    kbArticles: support.kbArticles,
    automations: support.automations,
    aiAgent: support.aiAgent,
    supportAnalytics: support.supportAnalytics,
    analytics,
    exploreStats,
    STAGES: DEAL_STAGES,
    CUST_STATUS: CUST_STATUSES,
    INDUSTRIES,
    MONTHS: months,
  };
}

export { AVATARS };
