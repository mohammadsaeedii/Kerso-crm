/* ============================================================
   کرسو CRM — لایهٔ دادهٔ نمونه (نسخهٔ فارسی)
   قطعی (بذردار) تا اپ بین بارگذاری‌ها پایدار بماند.
   ============================================================ */
(function (App) {
  "use strict";

  /* «اکنون» ثابت تا زمان‌های نسبی با بافت «آخرین ویرایش، ۲۴ ژوئن ۲۰۲۴»
     طرح هماهنگ بماند. */
  const NOW = new Date("2024-06-24T15:32:00");
  App.now = () => new Date(NOW.getTime());
  const daysAgo = (d) => new Date(NOW.getTime() - d * 86400000);
  const hoursAgo = (h) => new Date(NOW.getTime() - h * 3600000);
  const minsAgo = (m) => new Date(NOW.getTime() - m * 60000);

  /* ---------------- مولد عدد شبه‌تصادفی بذردار (mulberry32) ---------------- */
  function makeRng(seed) {
    let s = seed >>> 0;
    return function () {
      s = (s + 0x6d2b79f5) | 0;
      let t = Math.imul(s ^ (s >>> 15), 1 | s);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  const rng = makeRng(20240624);
  const pick = (arr) => arr[Math.floor(rng() * arr.length)];
  const between = (a, b) => a + Math.floor(rng() * (b - a + 1));
  const chance = (p) => rng() < p;

  /* ---------------- نویسه‌گردانی فارسی به لاتین (برای ایمیل و دامنه) ---------------- */
  const TRANSLIT = {
    "ا": "a", "آ": "a", "أ": "a", "إ": "e", "ب": "b", "پ": "p", "ت": "t", "ث": "s",
    "ج": "j", "چ": "ch", "ح": "h", "خ": "kh", "د": "d", "ذ": "z", "ر": "r", "ز": "z",
    "ژ": "zh", "س": "s", "ش": "sh", "ص": "s", "ض": "z", "ط": "t", "ظ": "z", "ع": "a",
    "غ": "gh", "ف": "f", "ق": "gh", "ک": "k", "گ": "g", "ل": "l", "م": "m", "ن": "n",
    "و": "v", "ه": "h", "ی": "i", "ي": "i", "ئ": "", "ء": "", "ة": "h",
  };
  function translit(str) {
    return String(str || "")
      .split("")
      .map((ch) => (ch in TRANSLIT ? TRANSLIT[ch] : /[a-z0-9]/i.test(ch) ? ch : ""))
      .join("")
      .toLowerCase();
  }

  /* ---------------- پالت آواتار (آواتارهای حروفی) ---------------- */
  const AVATARS = [
    "indigo", "violet", "blue", "sky", "teal", "emerald",
    "amber", "orange", "rose", "pink", "fuchsia", "slate",
  ];
  const avatarColor = () => pick(AVATARS);

  /* ---------------- مخزن نام و شرکت ---------------- */
  const FIRST = [
    "آرش", "علی", "رضا", "محمد", "حسین", "مهدی", "امیر", "سینا", "بابک", "کاوه",
    "نوید", "سامان", "پویا", "فرهاد", "رامین", "شایان", "کیان", "آرمان", "سپهر", "طاها",
    "سارا", "مریم", "زهرا", "فاطمه", "نگار", "نیلوفر", "پریسا", "شیرین", "لیلا", "مینا",
    "نازنین", "یاسمن", "کیمیا", "آیدا", "الهام", "بهاره", "رها", "ندا", "سمیرا", "ترانه",
    "حنا", "یوسف", "آرتین", "ماهان", "دلارام", "رزا", "هانیه", "سوگند",
  ];
  const LAST = [
    "محمدی", "رضایی", "حسینی", "احمدی", "کریمی", "موسوی", "جعفری", "رحیمی", "صادقی", "اکبری",
    "نوری", "قاسمی", "کاظمی", "یوسفی", "عباسی", "حیدری", "شریفی", "فرهادی", "نجفی", "سلطانی",
    "امیری", "رستمی", "بهرامی", "طاهری", "مرادی", "اسدی", "زمانی", "توکلی", "کوهستانی", "فروزان",
    "نیک‌نام", "مهدوی", "صفری", "غلامی", "بیات", "خسروی",
  ];
  const COMPANIES = [
    "نوآوران داده", "پارس‌تک", "ابر سبز", "هوش‌پرداز", "آرمان سیستم", "دیجی‌فردا",
    "سپهر داده", "فناوران نوین", "رایان‌اندیش", "پیشگامان رایان", "زرین‌افزار", "آسمان آبی",
    "کیمیا تجارت", "البرز انرژی", "مهرگان فناوری", "نقش‌آفرینان", "بهسازان صنعت", "هم‌آوا",
    "تدبیر داده", "ققنوس", "فراز سیستم", "پرتو نوین", "ماهان تجارت", "اطلس بار",
    "روشنا", "خط روشن", "آوای شهر", "کاسپین داده", "نوین‌پرداز", "آریا فناوری",
    "سامانه گستر", "ویرا سیستم",
  ];
  const INDUSTRIES = [
    "نرم‌افزار ابری", "فناوری مالی", "سلامت", "تجارت الکترونیک", "لجستیک", "رسانه",
    "انرژی", "آموزش", "املاک", "تولید", "گردشگری", "خرده‌فروشی",
  ];
  const CITIES = [
    ["تهران", "ایران"], ["اصفهان", "ایران"], ["شیراز", "ایران"],
    ["مشهد", "ایران"], ["تبریز", "ایران"], ["کرج", "ایران"],
    ["اهواز", "ایران"], ["قم", "ایران"], ["یزد", "ایران"],
    ["کرمان", "ایران"], ["رشت", "ایران"], ["بندرعباس", "ایران"],
    ["دبی", "امارات"], ["استانبول", "ترکیه"], ["مسقط", "عمان"],
  ];
  const TAGS = [
    "سازمانی", "کسب‌وکار کوچک", "سرنخ داغ", "ویژه", "تمدید", "فروش مکمل", "ریسک ریزش",
    "خبرنامه", "دمو دیده", "ارجاعی", "ورودی", "خروجی",
  ];
  const STAGES = ["سرنخ", "واجد شرایط", "پیشنهاد", "مذاکره", "برنده"];
  const STAGE_WON = "برنده";
  const CUST_STATUS = ["فعال", "سرنخ", "بالقوه", "ریزش‌کرده"];

  const fullName = () => `${pick(FIRST)} ${pick(LAST)}`;
  const emailFor = (name, company) =>
    String(name).trim().split(/\s+/).map(translit).filter(Boolean).join(".") +
    "@" +
    translit(company) +
    ".com";
  const phone = () =>
    App.faDigits(`09${between(10, 39)} ${between(100, 999)} ${String(between(0, 9999)).padStart(4, "0")}`);
  const pickTags = () => {
    const n = between(1, 3);
    const set = new Set();
    while (set.size < n) set.add(pick(TAGS));
    return [...set];
  };

  /* ---------------- کاربر فعلی ---------------- */
  const currentUser = {
    name: "آرش رضایی",
    role: "مدیر کل",
    email: "arash.rezaei@kerso.io",
    avatar: "face", // آواتار تصویری بازاستفاده‌شده از طرح اصلی
  };

  /* ---------------- شاخص‌های کلیدی داشبورد ---------------- */
  const spark = (seed, n = 16, base = 50, vol = 14) => {
    const r = makeRng(seed);
    const out = [];
    let v = base;
    for (let i = 0; i < n; i++) {
      v += (r() - 0.45) * vol;
      out.push(Math.max(6, Math.round(v)));
    }
    return out;
  };
  const kpis = [
    { id: "active-deals", label: "معاملات فعال", value: 120300, display: "۱۲۰٬۳۰۰ تومان", delta: 12.9, dir: "up", spark: spark(11, 16, 60, 12) },
    { id: "revenue-total", label: "کل درآمد", value: 234210, display: "۲۳۴٬۲۱۰ تومان", delta: -9.0, dir: "down", spark: spark(22, 16, 70, 16) },
    { id: "deals-created", label: "معاملات ایجادشده", value: 1200, display: "۱٬۲۰۰", delta: 10.9, dir: "up", spark: spark(33, 16, 45, 10) },
    { id: "deals-closing", label: "معاملات روبه‌اتمام این ماه", value: 874, display: "۸۷۴", delta: -8.3, dir: "down", spark: spark(44, 16, 55, 13) },
  ];

  /* ---------------- سری درآمد (۱۲ ماه، ۲ سال) ---------------- */
  const MONTHS = ["فروردین", "اردیبهشت", "خرداد", "تیر", "مرداد", "شهریور", "مهر", "آبان", "آذر", "دی", "بهمن", "اسفند"];
  const revenueSeries = (() => {
    const r = makeRng(909);
    let cur = 28, prev = 22;
    return MONTHS.map((m, i) => {
      cur += (r() - 0.32) * 9;
      prev += (r() - 0.4) * 6;
      cur = Math.max(14, cur);
      prev = Math.max(10, prev);
      return { label: m, current: Math.round(cur * 1000), previous: Math.round(prev * 1000) };
    });
  })();

  /* ---------------- معاملات ایجادشده (میله‌های ماهانه) ---------------- */
  const dealsCreated = (() => {
    const r = makeRng(7);
    return MONTHS.map((m) => ({ label: m, won: between(18, 60), lost: between(6, 26) }));
  })();

  /* ---------------- قیف فروش ---------------- */
  const pipeline = [
    { stage: "سرنخ", count: 142, value: 86000, color: "#818CF8" },
    { stage: "واجد شرایط", count: 98, value: 142000, color: "#6366F1" },
    { stage: "پیشنهاد", count: 64, value: 121000, color: "#4F46E5" },
    { stage: "مذاکره", count: 38, value: 98000, color: "#4338CA" },
    { stage: "برنده", count: 27, value: 120300, color: "#22C55E" },
  ];

  /* ---------------- معاملات اخیر (جدول) ---------------- */
  const deals = (() => {
    const list = [];
    const names = [
      "لایسنس سالانهٔ پلتفرم", "بستهٔ راه‌اندازی", "استقرار سازمانی",
      "یکپارچه‌سازی API", "پشتیبانی ویژه", "مهاجرت داده", "افزایش کاربر",
      "افزونهٔ امنیتی", "تحلیل سفارشی", "تمدید — حرفه‌ای", "برنامهٔ آزمایشی",
      "بستهٔ سخت‌افزاری", "کارگاه آموزشی", "قرارداد برچسب‌سفید",
    ];
    for (let i = 0; i < names.length; i++) {
      const company = pick(COMPANIES);
      const stage = pick(STAGES);
      list.push({
        id: "D-" + (1042 + i),
        title: names[i],
        company,
        owner: fullName(),
        ownerColor: avatarColor(),
        value: between(6, 90) * 1000,
        stage,
        probability: stage === STAGE_WON ? 100 : between(15, 90),
        close: daysAgo(between(-30, 20)),
        status: stage === STAGE_WON ? "موفق" : chance(0.12) ? "ازدست‌رفته" : "باز",
      });
    }
    return list;
  })();

  /* ---------------- مشتریان ---------------- */
  const customers = (() => {
    const list = [];
    for (let i = 0; i < 48; i++) {
      const name = fullName();
      const company = pick(COMPANIES);
      const [city, country] = pick(CITIES);
      const status = chance(0.5) ? "فعال" : pick(CUST_STATUS);
      list.push({
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
    // یک ردیف نخست پایدار و قابل‌تشخیص نگه می‌داریم
    list[0] = Object.assign(list[0], {
      name: "نگار محمدی", company: "نوآوران داده", status: "فعال",
      value: 184000, deals: 7, health: 92, email: "negar.mohammadi@noavarandadeh.com",
    });
    return list;
  })();

  /* ---------------- شرکت‌ها (کاوش کسب‌وکار) ---------------- */
  const companies = (() => {
    const TYPES = ["مشتری", "بالقوه", "شریک", "ریزش‌کرده"];
    const SIZES = ["۱–۱۰", "۱۱–۵۰", "۵۱–۲۰۰", "۲۰۱–۵۰۰", "۵۰۰+"];
    return COMPANIES.map((name, i) => {
      const [city, country] = pick(CITIES);
      return {
        id: "B-" + String(2000 + i),
        name,
        industry: pick(INDUSTRIES),
        size: pick(SIZES),
        city,
        country,
        revenue: between(120, 9800) * 1000,
        growth: between(-18, 64),
        status: chance(0.5) ? "مشتری" : pick(TYPES),
        contacts: between(2, 40),
        deals: between(0, 12),
        website: translit(name) + ".com",
        logo: avatarColor(),
        founded: between(2005, 2022),
        rating: (3 + rng() * 2).toFixed(1),
        description:
          "یک شرکت " +
          pick(["نوپا و روبه‌رشد", "باسابقه و جاافتاده", "سرمایه‌گذاری‌شده", "خودبنیاد", "پیشرو در بازار"]) +
          " در حوزهٔ " +
          pick(INDUSTRIES) +
          " با تمرکز بر " +
          pick(["توسعهٔ عملیات", "موفقیت مشتری", "نوآوری محصول", "گسترش جهانی", "پایداری پلتفرم"]) +
          ".",
      };
    });
  })();

  /* ---------------- نظرات ---------------- */
  const reviewTitles = {
    5: ["واقعاً عاشقش شدیم", "بهترین تصمیممان بود", "فراتر از انتظار", "یک نقطهٔ عطف", "راضی‌تر از این نمی‌شدیم"],
    4: ["محصولی واقعاً محکم", "عالی، با ایرادهای جزئی", "در کل بسیار راضی", "ارزش بالا", "پیشنهادش می‌کنم"],
    3: ["خوب اما جای رشد دارد", "تجربهٔ قابل‌قبول", "کارراه‌اندازه", "احساس دوگانه", "برای این قیمت خوب است"],
    2: ["کمتر از انتظار", "انتظار بیشتری داشتم", "چند مشکل داشت", "سخت بشود توصیه‌اش کرد", "گاهی آزاردهنده"],
    1: ["مناسب ما نبود", "ناامید شدم", "مشکلات زیادی داشت", "تمدیدش نمی‌کنم", "نیاز به کار جدی دارد"],
  };
  const reviewBodies = [
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
  ];
  const PRODUCTS = ["کرسو CRM", "تحلیل کرسو", "صندوق کرسو", "کرسو موبایل", "کرسو API"];
  const reviews = (() => {
    const list = [];
    for (let i = 0; i < 32; i++) {
      const rating = chance(0.62) ? between(4, 5) : between(1, 5);
      const name = fullName();
      const replied = chance(0.4);
      list.push({
        id: "R-" + String(3000 + i),
        author: name,
        avatar: avatarColor(),
        company: pick(COMPANIES),
        rating,
        title: pick(reviewTitles[rating]),
        body: pick(reviewBodies),
        product: pick(PRODUCTS),
        date: daysAgo(between(0, 120)),
        sentiment: rating >= 4 ? "positive" : rating === 3 ? "neutral" : "negative",
        helpful: between(0, 84),
        verified: chance(0.8),
        replied,
        reply: replied
          ? {
              author: "آرش رضایی",
              date: daysAgo(between(0, 40)),
              body: "از بازخورد ارزشمندتان بسیار سپاسگزاریم — آن را با تیم در میان گذاشتیم و چند مورد از پیشنهادهایتان همین حالا در نقشهٔ راه قرار گرفته است!",
            }
          : null,
      });
    }
    return list;
  })();

  /* ---------------- جریان فعالیت ---------------- */
  const activities = [
    { type: "deal", who: "علی کریمی", color: "blue", text: "معاملهٔ <b>استقرار سازمانی</b> را به <b>مذاکره</b> منتقل کرد", time: minsAgo(8) },
    { type: "review", who: "سارا حسینی", color: "amber", text: "یک نظر <b>۵ ستاره</b> برای کرسو CRM ثبت کرد", time: minsAgo(42) },
    { type: "customer", who: "شما", color: "indigo", text: "<b>نگار محمدی</b> را به‌عنوان مشتری جدید افزود", time: hoursAgo(2) },
    { type: "deal", who: "محمد نوری", color: "emerald", text: "معاملهٔ <b>لایسنس سالانهٔ پلتفرم</b> را بست — <b>۴۸٬۰۰۰ تومان</b>", time: hoursAgo(4) },
    { type: "task", who: "مریم جعفری", color: "violet", text: "وظیفهٔ <b>ارسال پیشنهاد فصل سوم</b> را تکمیل کرد", time: hoursAgo(7) },
    { type: "message", who: "امیر عباسی", color: "teal", text: "به پیام شما در <b>فراز سیستم</b> پاسخ داد", time: hoursAgo(20) },
    { type: "deal", who: "لیلا رستمی", color: "rose", text: "معاملهٔ <b>برنامهٔ آزمایشی</b> را از دست داد — رقیب", time: daysAgo(1) },
    { type: "customer", who: "سینا یوسفی", color: "sky", text: "اطلاعات تماس <b>پارس‌تک</b> را به‌روزرسانی کرد", time: daysAgo(2) },
  ];

  /* ---------------- وظایف ---------------- */
  const tasks = [
    { id: "T1", title: "پیگیری تمدید با نوآوران داده", due: daysAgo(-1), priority: "high", done: false, assignee: "آرش رضایی" },
    { id: "T2", title: "آماده‌سازی پیشنهاد برای دیجی‌فردا", due: daysAgo(-2), priority: "high", done: false, assignee: "علی کریمی" },
    { id: "T3", title: "بررسی حساب‌های در معرض ریزش", due: daysAgo(0), priority: "medium", done: false, assignee: "آرش رضایی" },
    { id: "T4", title: "ارسال ارائهٔ راه‌اندازی به آرمان سیستم", due: daysAgo(-3), priority: "medium", done: false, assignee: "مریم جعفری" },
    { id: "T5", title: "پاسخ به ۳ نظر جدید مشتریان", due: daysAgo(0), priority: "low", done: false, assignee: "آرش رضایی" },
    { id: "T6", title: "به‌روزرسانی پیش‌بینی فصل دوم در قیف فروش", due: daysAgo(1), priority: "medium", done: true, assignee: "محمد نوری" },
    { id: "T7", title: "هماهنگی دمو با هوش‌پرداز", due: daysAgo(-5), priority: "low", done: false, assignee: "آرش رضایی" },
  ];

  /* ---------------- اعلان‌ها ---------------- */
  const notifications = [
    { id: "N1", type: "deal", title: "معامله برنده شد", desc: "لایسنس سالانهٔ پلتفرم به مبلغ ۴۸٬۰۰۰ تومان بسته شد", time: minsAgo(12), read: false },
    { id: "N2", type: "review", title: "نظر ۵ ستارهٔ جدید", desc: "سارا حسینی برای کرسو CRM نظر ثبت کرد", time: minsAgo(54), read: false },
    { id: "N3", type: "task", title: "وظیفهٔ امروز", desc: "بررسی حساب‌های در معرض ریزش", time: hoursAgo(3), read: false },
    { id: "N4", type: "customer", title: "مشتری جدید", desc: "نگار محمدی به حساب‌های شما افزوده شد", time: hoursAgo(6), read: true },
    { id: "N5", type: "system", title: "گزارش هفتگی آماده است", desc: "خلاصهٔ فروش این هفتهٔ شما در دسترس است", time: daysAgo(1), read: true },
    { id: "N6", type: "deal", title: "معامله در معرض خطر", desc: "برنامهٔ آزمایشی ۱۴ روز است بدون فعالیت مانده", time: daysAgo(2), read: true },
  ];

  /* ---------------- پیام‌ها ---------------- */
  const messages = [
    { id: "M1", from: "امیر عباسی", color: "teal", preview: "عالیه — می‌تونیم تماس رو به پنجشنبه منتقل کنیم؟", time: minsAgo(5), unread: true, online: true },
    { id: "M2", from: "سارا حسینی", color: "amber", preview: "ممنون بابت سرعت در ارسال پیش‌فاکتور!", time: minsAgo(36), unread: true, online: true },
    { id: "M3", from: "علی کریمی", color: "blue", preview: "مرحلهٔ معامله رو به‌روز کردم، هر وقت فرصت کردی نگاهی بنداز.", time: hoursAgo(1), unread: true, online: false },
    { id: "M4", from: "آرمان سیستم", color: "violet", preview: "پیشنهاد را داخلی بررسی کردیم و…", time: hoursAgo(5), unread: false, online: false },
    { id: "M5", from: "نگار محمدی", color: "rose", preview: "عالی بود، مستندات راه‌اندازی خیلی شفاف بودند.", time: daysAgo(1), unread: false, online: true },
    { id: "M6", from: "محمد نوری", color: "emerald", preview: "اعداد پیش‌بینی الان داخل شیت مشترک هستند.", time: daysAgo(2), unread: false, online: false },
  ];

  /* ---------------- مجموعه‌دادهٔ تحلیل‌ها ---------------- */
  const analytics = {
    kpis: [
      { id: "visitors", label: "کل بازدیدکنندگان", value: 48210, display: "۴۸٬۲۱۰", delta: 14.2, dir: "up", spark: spark(101, 18, 50, 12) },
      { id: "conv", label: "نرخ تبدیل", value: 4.8, display: "۴٫۸٪", delta: 0.6, dir: "up", spark: spark(102, 18, 40, 8) },
      { id: "aov", label: "میانگین اندازهٔ معامله", value: 8650, display: "۸٬۶۵۰ تومان", delta: -2.1, dir: "down", spark: spark(103, 18, 55, 14) },
      { id: "ltv", label: "ارزش طول عمر مشتری", value: 24300, display: "۲۴٬۳۰۰ تومان", delta: 5.4, dir: "up", spark: spark(104, 18, 48, 10) },
    ],
    visitors: (() => {
      const r = makeRng(55);
      let v = 1200;
      return App.range(30).map((i) => {
        v += (r() - 0.45) * 240;
        v = Math.max(400, v);
        return { label: i + 1, value: Math.round(v) };
      });
    })(),
    funnel: [
      { stage: "بازدید سایت", value: 48210 },
      { stage: "ثبت‌نام", value: 12640 },
      { stage: "فعال‌سازی", value: 7180 },
      { stage: "فرصت", value: 2310 },
      { stage: "مشتری", value: 980 },
    ],
    sources: [
      { name: "جستجوی ارگانیک", value: 38, color: "#4F46E5" },
      { name: "مستقیم", value: 24, color: "#6366F1" },
      { name: "ارجاع", value: 18, color: "#818CF8" },
      { name: "شبکه‌های اجتماعی", value: 12, color: "#22C55E" },
      { name: "تبلیغات پولی", value: 8, color: "#F59E0B" },
    ],
    reps: [
      { name: "محمد نوری", color: "emerald", value: 184000, deals: 23 },
      { name: "مریم جعفری", color: "violet", value: 162500, deals: 19 },
      { name: "علی کریمی", color: "blue", value: 148000, deals: 21 },
      { name: "لیلا رستمی", color: "rose", value: 121000, deals: 14 },
      { name: "امیر عباسی", color: "teal", value: 98500, deals: 12 },
    ],
    regions: [
      { name: "آمریکای شمالی", value: 46 },
      { name: "اروپا", value: 31 },
      { name: "آسیا و اقیانوسیه", value: 15 },
      { name: "آمریکای لاتین", value: 5 },
      { name: "خاورمیانه و آفریقا", value: 3 },
    ],
    categories: [
      { name: "اشتراک‌ها", value: 142000 },
      { name: "خدمات", value: 86000 },
      { name: "افزونه‌ها", value: 54000 },
      { name: "سخت‌افزار", value: 28000 },
      { name: "آموزش", value: 19000 },
    ],
    devices: [
      { name: "دسکتاپ", value: 62, color: "#4F46E5" },
      { name: "موبایل", value: 31, color: "#22C55E" },
      { name: "تبلت", value: 7, color: "#F59E0B" },
    ],
    cohort: (() => {
      // نقشهٔ حرارتی ماندگاری: ردیف‌ها = ماه ثبت‌نام، ستون‌ها = ماه‌های سپری‌شده
      const r = makeRng(77);
      return App.range(6).map((row) => {
        const label = MONTHS[row];
        const vals = [];
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

  /* ---------------- تجمیع‌ها برای کاوش / نمای کلی ---------------- */
  const exploreStats = [
    { label: "شرکت‌های رصدشده", value: companies.length, sub: "در فضای کاری شما" },
    { label: "فرصت‌های فعال", value: App.sum(companies, "deals"), sub: "در همهٔ حساب‌ها" },
    { label: "کل قیف فروش", value: App.sum(pipeline, "value"), money: true, sub: "ارزش وزن‌دار" },
    { label: "میانگین سلامت حساب", value: Math.round(App.sum(customers, "health") / customers.length), suffix: "٪", sub: "پایگاه مشتریان" },
  ];

  App.data = {
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
    analytics,
    exploreStats,
    STAGES,
    CUST_STATUS,
    INDUSTRIES,
    MONTHS,
  };
})(window.App);
