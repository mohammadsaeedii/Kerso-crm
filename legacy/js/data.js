/* ============================================================
   Kerso CRM — Mock data layer
   Deterministic (seeded) so the app is stable across reloads.
   ============================================================ */
(function (App) {
  "use strict";

  /* Fixed reference "now" so relative times stay coherent with the
     design's "Last edited, June 24 2024" context. */
  const NOW = new Date("2024-06-24T15:32:00");
  App.now = () => new Date(NOW.getTime());
  const daysAgo = (d) => new Date(NOW.getTime() - d * 86400000);
  const hoursAgo = (h) => new Date(NOW.getTime() - h * 3600000);
  const minsAgo = (m) => new Date(NOW.getTime() - m * 60000);

  /* ---------------- Seeded PRNG (mulberry32) ---------------- */
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

  /* ---------------- Avatar palette (initials avatars) ---------------- */
  const AVATARS = [
    "indigo", "violet", "blue", "sky", "teal", "emerald",
    "amber", "orange", "rose", "pink", "fuchsia", "slate",
  ];
  const avatarColor = () => pick(AVATARS);

  /* ---------------- Name & company pools ---------------- */
  const FIRST = [
    "Arya", "Liam", "Noah", "Olivia", "Emma", "Ava", "Sophia", "Mia", "Lucas",
    "Mason", "Ethan", "Aiden", "Harper", "Ella", "Amelia", "Aria", "Riley",
    "Maya", "Zoe", "Leo", "Hana", "Yusuf", "Ibrahim", "Layla", "Omar",
    "Priya", "Arjun", "Mei", "Chen", "Sofia", "Mateo", "Diego", "Camila",
    "Nina", "Felix", "Greta", "Tariq", "Aisha", "Kofi", "Ada", "Nikolai",
    "Elena", "Marco", "Yara", "Dante", "Ines", "Theo", "Lena",
  ];
  const LAST = [
    "Pams", "Carter", "Nguyen", "Patel", "Kim", "Garcia", "Rossi", "Müller",
    "Okafor", "Silva", "Haddad", "Novak", "Schmidt", "Andersson", "Ferreira",
    "Yamamoto", "Costa", "Khan", "Reyes", "Walsh", "Bauer", "Dubois",
    "Lindqvist", "Marsh", "Volkov", "Sharma", "Mendoza", "Brooks", "Hale",
    "Fontaine", "Castillo", "Bianchi", "Larsen", "Adeyemi", "Petrov",
  ];
  const COMPANIES = [
    "Lumina Labs", "Northwind", "Apex Digital", "Cobalt Systems", "Vertex AI",
    "Meridian Co", "Drift Studio", "Helios Energy", "Pinecone", "Solstice",
    "Forma", "Beacon Health", "Quanta", "Riverbank", "Auralink", "Novacrest",
    "Bytewise", "Cedar & Co", "Hatchworks", "Glide", "Tessellate", "Polaris",
    "Maplebrook", "Orbital", "Kindred Goods", "Stratus", "Verdant", "Fathom",
    "Wavelength", "Atlas Freight", "Lantern", "Brightline",
  ];
  const INDUSTRIES = [
    "SaaS", "Fintech", "Healthcare", "E-commerce", "Logistics", "Media",
    "Energy", "Education", "Real Estate", "Manufacturing", "Travel", "Retail",
  ];
  const CITIES = [
    ["San Francisco", "USA"], ["New York", "USA"], ["Austin", "USA"],
    ["London", "UK"], ["Berlin", "Germany"], ["Paris", "France"],
    ["Toronto", "Canada"], ["Amsterdam", "Netherlands"], ["Singapore", "Singapore"],
    ["Sydney", "Australia"], ["Dubai", "UAE"], ["São Paulo", "Brazil"],
    ["Tokyo", "Japan"], ["Stockholm", "Sweden"], ["Bengaluru", "India"],
  ];
  const TAGS = [
    "Enterprise", "SMB", "Hot lead", "VIP", "Renewal", "Upsell", "Churn risk",
    "Newsletter", "Demo'd", "Referral", "Inbound", "Outbound",
  ];
  const STAGES = ["Lead", "Qualified", "Proposal", "Negotiation", "Won"];
  const CUST_STATUS = ["Active", "Lead", "Prospect", "Churned"];

  const fullName = () => `${pick(FIRST)} ${pick(LAST)}`;
  const emailFor = (name, company) =>
    name.toLowerCase().replace(/[^a-z]+/g, ".") +
    "@" +
    company.toLowerCase().replace(/[^a-z]+/g, "") +
    ".com";
  const phone = () => `+1 (${between(200, 989)}) ${between(200, 989)}-${String(between(0, 9999)).padStart(4, "0")}`;
  const pickTags = () => {
    const n = between(1, 3);
    const set = new Set();
    while (set.size < n) set.add(pick(TAGS));
    return [...set];
  };

  /* ---------------- Current user ---------------- */
  const currentUser = {
    name: "Arya Pams",
    role: "Superadmin",
    email: "arya.pams@kerso.io",
    avatar: "face", // illustrated avatar reused from the original design
  };

  /* ---------------- Dashboard KPIs (exact design values) ---------------- */
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
    { id: "active-deals", label: "Active deals", value: 120300, display: "$120,300", delta: 12.9, dir: "up", spark: spark(11, 16, 60, 12) },
    { id: "revenue-total", label: "Revenue total", value: 234210, display: "$234,210", delta: -9.0, dir: "down", spark: spark(22, 16, 70, 16) },
    { id: "deals-created", label: "Deals created", value: 1200, display: "1,200", delta: 10.9, dir: "up", spark: spark(33, 16, 45, 10) },
    { id: "deals-closing", label: "Deals closing this month", value: 874, display: "874", delta: -8.3, dir: "down", spark: spark(44, 16, 55, 13) },
  ];

  /* ---------------- Revenue series (12 months, 2 years) ---------------- */
  const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
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

  /* ---------------- Deals created (weekly bars) ---------------- */
  const dealsCreated = (() => {
    const r = makeRng(7);
    return MONTHS.map((m) => ({ label: m, won: between(18, 60), lost: between(6, 26) }));
  })();

  /* ---------------- Pipeline ---------------- */
  const pipeline = [
    { stage: "Lead", count: 142, value: 86000, color: "#818CF8" },
    { stage: "Qualified", count: 98, value: 142000, color: "#6366F1" },
    { stage: "Proposal", count: 64, value: 121000, color: "#4F46E5" },
    { stage: "Negotiation", count: 38, value: 98000, color: "#4338CA" },
    { stage: "Won", count: 27, value: 120300, color: "#22C55E" },
  ];

  /* ---------------- Recent deals (table) ---------------- */
  const deals = (() => {
    const list = [];
    const names = [
      "Annual platform license", "Onboarding package", "Enterprise rollout",
      "API integration", "Premium support", "Data migration", "Seat expansion",
      "Security add-on", "Custom analytics", "Renewal — Pro", "Pilot program",
      "Hardware bundle", "Training workshop", "White-label deal",
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
        probability: stage === "Won" ? 100 : between(15, 90),
        close: daysAgo(between(-30, 20)),
        status: stage === "Won" ? "won" : chance(0.12) ? "lost" : "open",
      });
    }
    return list;
  })();

  /* ---------------- Customers ---------------- */
  const customers = (() => {
    const list = [];
    for (let i = 0; i < 48; i++) {
      const name = fullName();
      const company = pick(COMPANIES);
      const [city, country] = pick(CITIES);
      const status = chance(0.5) ? "Active" : pick(CUST_STATUS);
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
    // keep a stable, recognisable first row
    list[0] = Object.assign(list[0], {
      name: "Maya Andersson", company: "Lumina Labs", status: "Active",
      value: 184000, deals: 7, health: 92, email: "maya.andersson@luminalabs.com",
    });
    return list;
  })();

  /* ---------------- Companies (Business Explore) ---------------- */
  const companies = (() => {
    const TYPES = ["Customer", "Prospect", "Partner", "Churned"];
    const SIZES = ["1–10", "11–50", "51–200", "201–500", "500+"];
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
        status: chance(0.5) ? "Customer" : pick(TYPES),
        contacts: between(2, 40),
        deals: between(0, 12),
        website: name.toLowerCase().replace(/[^a-z]+/g, "") + ".com",
        logo: avatarColor(),
        founded: between(2005, 2022),
        rating: (3 + rng() * 2).toFixed(1),
        description:
          "A " +
          pick(["fast-growing", "well-established", "venture-backed", "bootstrapped", "market-leading"]) +
          " " +
          pick(INDUSTRIES).toLowerCase() +
          " company focused on " +
          pick(["scaling operations", "customer success", "product innovation", "global expansion", "platform reliability"]) +
          ".",
      };
    });
  })();

  /* ---------------- Reviews ---------------- */
  const reviewTitles = {
    5: ["Absolutely love it", "Best decision we made", "Exceeded expectations", "A game changer", "Couldn't be happier"],
    4: ["Really solid product", "Great, with minor nits", "Very happy overall", "Strong value", "Recommend it"],
    3: ["Good but room to grow", "Decent experience", "It does the job", "Mixed feelings", "Okay for the price"],
    2: ["Underwhelming", "Expected more", "Several issues", "Hard to recommend", "Frustrating at times"],
    1: ["Not for us", "Disappointed", "Lots of problems", "Would not renew", "Needs serious work"],
  };
  const reviewBodies = [
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
  ];
  const PRODUCTS = ["Kerso CRM", "Kerso Analytics", "Kerso Inbox", "Kerso Mobile", "Kerso API"];
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
              author: "Arya Pams",
              date: daysAgo(between(0, 40)),
              body: "Thank you so much for the thoughtful feedback — we've shared this with the team and a few of your suggestions are already on the roadmap!",
            }
          : null,
      });
    }
    return list;
  })();

  /* ---------------- Activity feed ---------------- */
  const activities = [
    { type: "deal", who: "Liam Carter", color: "blue", text: "moved <b>Enterprise rollout</b> to <b>Negotiation</b>", time: minsAgo(8) },
    { type: "review", who: "Sophia Kim", color: "amber", text: "left a <b>5-star</b> review on Kerso CRM", time: minsAgo(42) },
    { type: "customer", who: "You", color: "indigo", text: "added <b>Maya Andersson</b> as a new customer", time: hoursAgo(2) },
    { type: "deal", who: "Noah Patel", color: "emerald", text: "closed <b>Annual platform license</b> — <b>$48,000</b>", time: hoursAgo(4) },
    { type: "task", who: "Ava Garcia", color: "violet", text: "completed task <b>Send Q3 proposal</b>", time: hoursAgo(7) },
    { type: "message", who: "Omar Haddad", color: "teal", text: "replied to your message in <b>Cobalt Systems</b>", time: hoursAgo(20) },
    { type: "deal", who: "Ella Rossi", color: "rose", text: "lost <b>Pilot program</b> — competitor", time: daysAgo(1) },
    { type: "customer", who: "Lucas Nguyen", color: "sky", text: "updated contact details for <b>Northwind</b>", time: daysAgo(2) },
  ];

  /* ---------------- Tasks ---------------- */
  const tasks = [
    { id: "T1", title: "Follow up with Lumina Labs on renewal", due: daysAgo(-1), priority: "high", done: false, assignee: "Arya Pams" },
    { id: "T2", title: "Prepare proposal for Apex Digital", due: daysAgo(-2), priority: "high", done: false, assignee: "Liam Carter" },
    { id: "T3", title: "Review churn-risk accounts", due: daysAgo(0), priority: "medium", done: false, assignee: "Arya Pams" },
    { id: "T4", title: "Send onboarding deck to Drift Studio", due: daysAgo(-3), priority: "medium", done: false, assignee: "Ava Garcia" },
    { id: "T5", title: "Reply to 3 new customer reviews", due: daysAgo(0), priority: "low", done: false, assignee: "Arya Pams" },
    { id: "T6", title: "Update Q2 forecast in pipeline", due: daysAgo(1), priority: "medium", done: true, assignee: "Noah Patel" },
    { id: "T7", title: "Schedule demo with Vertex AI", due: daysAgo(-5), priority: "low", done: false, assignee: "Arya Pams" },
  ];

  /* ---------------- Notifications ---------------- */
  const notifications = [
    { id: "N1", type: "deal", title: "Deal won", desc: "Annual platform license closed for $48,000", time: minsAgo(12), read: false },
    { id: "N2", type: "review", title: "New 5-star review", desc: "Sophia Kim reviewed Kerso CRM", time: minsAgo(54), read: false },
    { id: "N3", type: "task", title: "Task due today", desc: "Review churn-risk accounts", time: hoursAgo(3), read: false },
    { id: "N4", type: "customer", title: "New customer", desc: "Maya Andersson was added to your accounts", time: hoursAgo(6), read: true },
    { id: "N5", type: "system", title: "Weekly report ready", desc: "Your sales summary for this week is available", time: daysAgo(1), read: true },
    { id: "N6", type: "deal", title: "Deal at risk", desc: "Pilot program has been idle for 14 days", time: daysAgo(2), read: true },
  ];

  /* ---------------- Messages ---------------- */
  const messages = [
    { id: "M1", from: "Omar Haddad", color: "teal", preview: "Sounds great — can we move the call to Thursday?", time: minsAgo(5), unread: true, online: true },
    { id: "M2", from: "Sophia Kim", color: "amber", preview: "Thanks for the quick turnaround on the quote!", time: minsAgo(36), unread: true, online: true },
    { id: "M3", from: "Liam Carter", color: "blue", preview: "I updated the deal stage, take a look when free.", time: hoursAgo(1), unread: true, online: false },
    { id: "M4", from: "Drift Studio", color: "violet", preview: "We reviewed the proposal internally and…", time: hoursAgo(5), unread: false, online: false },
    { id: "M5", from: "Maya Andersson", color: "rose", preview: "Perfect, the onboarding docs were super clear.", time: daysAgo(1), unread: false, online: true },
    { id: "M6", from: "Noah Patel", color: "emerald", preview: "Forecast numbers are in the shared sheet now.", time: daysAgo(2), unread: false, online: false },
  ];

  /* ---------------- Analytics datasets ---------------- */
  const analytics = {
    kpis: [
      { id: "visitors", label: "Total visitors", value: 48210, display: "48,210", delta: 14.2, dir: "up", spark: spark(101, 18, 50, 12) },
      { id: "conv", label: "Conversion rate", value: 4.8, display: "4.8%", delta: 0.6, dir: "up", spark: spark(102, 18, 40, 8) },
      { id: "aov", label: "Avg. deal size", value: 8650, display: "$8,650", delta: -2.1, dir: "down", spark: spark(103, 18, 55, 14) },
      { id: "ltv", label: "Customer LTV", value: 24300, display: "$24,300", delta: 5.4, dir: "up", spark: spark(104, 18, 48, 10) },
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
      { stage: "Visited site", value: 48210 },
      { stage: "Signed up", value: 12640 },
      { stage: "Activated", value: 7180 },
      { stage: "Opportunity", value: 2310 },
      { stage: "Customer", value: 980 },
    ],
    sources: [
      { name: "Organic search", value: 38, color: "#4F46E5" },
      { name: "Direct", value: 24, color: "#6366F1" },
      { name: "Referral", value: 18, color: "#818CF8" },
      { name: "Social", value: 12, color: "#22C55E" },
      { name: "Paid ads", value: 8, color: "#F59E0B" },
    ],
    reps: [
      { name: "Noah Patel", color: "emerald", value: 184000, deals: 23 },
      { name: "Ava Garcia", color: "violet", value: 162500, deals: 19 },
      { name: "Liam Carter", color: "blue", value: 148000, deals: 21 },
      { name: "Ella Rossi", color: "rose", value: 121000, deals: 14 },
      { name: "Omar Haddad", color: "teal", value: 98500, deals: 12 },
    ],
    regions: [
      { name: "North America", value: 46 },
      { name: "Europe", value: 31 },
      { name: "Asia Pacific", value: 15 },
      { name: "Latin America", value: 5 },
      { name: "Middle East & Africa", value: 3 },
    ],
    categories: [
      { name: "Subscriptions", value: 142000 },
      { name: "Services", value: 86000 },
      { name: "Add-ons", value: 54000 },
      { name: "Hardware", value: 28000 },
      { name: "Training", value: 19000 },
    ],
    devices: [
      { name: "Desktop", value: 62, color: "#4F46E5" },
      { name: "Mobile", value: 31, color: "#22C55E" },
      { name: "Tablet", value: 7, color: "#F59E0B" },
    ],
    cohort: (() => {
      // retention heatmap: rows = signup month, cols = months since
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

  /* ---------------- Aggregates for explore / overview ---------------- */
  const exploreStats = [
    { label: "Companies tracked", value: companies.length, sub: "in your workspace" },
    { label: "Active opportunities", value: App.sum(companies, "deals"), sub: "across all accounts" },
    { label: "Total pipeline", value: App.sum(pipeline, "value"), money: true, sub: "weighted value" },
    { label: "Avg. account health", value: Math.round(App.sum(customers, "health") / customers.length), suffix: "%", sub: "customer base" },
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
