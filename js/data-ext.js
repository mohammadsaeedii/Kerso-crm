/* ============================================================
   Kerso CRM — Extended data layer (Advanced features)
   Adds workspace, collaboration, automation, marketplace and
   timeline datasets onto App.data. Deterministic (seeded) so the
   app stays stable across reloads. Loaded right after data.js so
   it can build on customers/companies/deals already in memory.
   ============================================================ */
(function (App) {
  "use strict";
  const D = App.data;
  const NOW = App.now();
  const daysAgo = (d) => new Date(NOW.getTime() - d * 86400000);
  const hoursAgo = (h) => new Date(NOW.getTime() - h * 3600000);
  const minsAgo = (m) => new Date(NOW.getTime() - m * 60000);
  const daysAhead = (d) => new Date(NOW.getTime() + d * 86400000);

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
  const rng = makeRng(424242);
  const pick = (arr) => arr[Math.floor(rng() * arr.length)];
  const between = (a, b) => a + Math.floor(rng() * (b - a + 1));
  const chance = (p) => rng() < p;
  const some = (arr, n) => { const c = arr.slice(); const out = []; while (out.length < n && c.length) out.push(c.splice(Math.floor(rng() * c.length), 1)[0]); return out; };

  /* ---------------- Team (for presence / mentions / assignees) ---------------- */
  const TEAM_BASE = [
    { name: "Arya Pams", role: "Superadmin", color: "indigo", online: true },
    { name: "Liam Carter", role: "Account Exec", color: "blue", online: true },
    { name: "Noah Patel", role: "Sales Lead", color: "emerald", online: true },
    { name: "Ava Garcia", role: "Account Exec", color: "violet", online: false },
    { name: "Ella Rossi", role: "SDR", color: "rose", online: true },
    { name: "Omar Haddad", role: "Customer Success", color: "teal", online: false },
    { name: "Sophia Kim", role: "Marketing", color: "amber", online: false },
    { name: "Maya Andersson", role: "Solutions", color: "sky", online: true },
  ];
  const team = TEAM_BASE.map((t, i) => ({ id: "U" + (i + 1), ...t, handle: t.name.toLowerCase().split(" ")[0], email: t.name.toLowerCase().replace(/[^a-z]+/g, ".") + "@kerso.io" }));
  const teammate = (name) => team.find((t) => t.name === name) || { id: "U?", name, color: "slate", role: "Member", online: false, handle: (name || "?").toLowerCase().split(" ")[0] };

  /* ---------------- Workspace: Chat ---------------- */
  const chats = [
    { id: "CH1", kind: "channel", name: "sales-team", color: "indigo", members: 8, unread: 2,
      messages: [
        { id: "m1", from: "Noah Patel", text: "Morning team — pipeline review at 11. Bring your top 3 at-risk deals.", time: hoursAgo(3) },
        { id: "m2", from: "Ava Garcia", text: "Apex Digital just bumped to Negotiation 🎉", time: hoursAgo(2) },
        { id: "m3", from: "Liam Carter", text: "Nice! I'll prep the proposal deck for Lumina.", time: minsAgo(46) },
        { id: "m4", from: "Arya Pams", text: "@Noah Patel can you pull the Q2 forecast before the call?", time: minsAgo(12) },
      ] },
    { id: "CH2", kind: "channel", name: "deals-won", color: "emerald", members: 12, unread: 0,
      messages: [
        { id: "m1", from: "Noah Patel", text: "Closed Annual platform license — $48,000 💰", time: hoursAgo(5) },
        { id: "m2", from: "Sophia Kim", text: "Huge. That's the third this week.", time: hoursAgo(4) },
      ] },
    { id: "CH3", kind: "dm", name: "Omar Haddad", color: "teal", members: 2, unread: 1,
      messages: [
        { id: "m1", from: "Omar Haddad", text: "Sounds great — can we move the call to Thursday?", time: minsAgo(5) },
        { id: "m2", from: "Arya Pams", text: "Thursday 2pm works. I'll send an invite.", time: minsAgo(2), me: true },
      ] },
    { id: "CH4", kind: "dm", name: "Sophia Kim", color: "amber", members: 2, unread: 0,
      messages: [
        { id: "m1", from: "Sophia Kim", text: "Thanks for the quick turnaround on the quote!", time: minsAgo(36) },
      ] },
  ];

  /* ---------------- Workspace: Notes ---------------- */
  const noteBodies = [
    "Key takeaways from the QBR: expansion into EU is the priority for H2. Budget approved for 2 new seats.",
    "Discovery call notes — pain point is manual reporting. Decision maker is the VP of RevOps. Timeline ~6 weeks.",
    "Product feedback: customers want deeper export options and a Slack integration. Logged with product.",
    "Renewal strategy for top 10 accounts: lead with usage data + ROI story. Offer annual prepay discount.",
    "Competitive notes: losing some deals on price at the low end. Mid-market is our sweet spot.",
  ];
  const notes = noteBodies.map((b, i) => ({
    id: "NT" + (i + 1),
    title: ["EU expansion — QBR", "Discovery: Cobalt Systems", "Product feedback log", "Renewal playbook", "Win/loss review"][i],
    body: b,
    tags: some(["Strategy", "Discovery", "Product", "Renewal", "Competitive", "Meeting"], between(1, 2)),
    color: pick(["indigo", "amber", "emerald", "violet", "sky"]),
    author: pick(team).name,
    pinned: i < 2,
    updated: hoursAgo(between(1, 90)),
  }));

  /* ---------------- Workspace: Files ---------------- */
  const FILE_TYPES = [
    { ext: "pdf", kind: "pdf", color: "rose" }, { ext: "docx", kind: "doc", color: "blue" },
    { ext: "xlsx", kind: "sheet", color: "emerald" }, { ext: "pptx", kind: "slide", color: "amber" },
    { ext: "png", kind: "image", color: "violet" }, { ext: "fig", kind: "design", color: "fuchsia" },
  ];
  const fileNames = [
    "Lumina Labs — Proposal", "Q2 Sales Forecast", "Enterprise rollout SOW", "Onboarding deck",
    "Master Services Agreement", "Apex Digital — Pricing", "Security questionnaire", "Brand guidelines",
    "Customer logos pack", "Pipeline export June", "ROI calculator", "Renewal contract — Northwind",
  ];
  const files = fileNames.map((n, i) => {
    const t = FILE_TYPES[i % FILE_TYPES.length];
    const owner = pick(team).name;
    const vN = between(1, 5);
    return {
      id: "F" + (i + 1),
      name: n + "." + t.ext,
      title: n,
      kind: t.kind, ext: t.ext, color: t.color,
      size: between(48, 9800) * 1024,
      owner,
      updated: daysAgo(between(0, 40)),
      company: chance(0.6) ? pick(D.companies).name : null,
      starred: i < 3,
      ocr: t.kind === "pdf" || t.kind === "image",
      versions: App.range(vN).map((v) => ({ v: vN - v, by: pick(team).name, time: daysAgo(between(0, 60)), note: ["Initial upload", "Updated pricing", "Legal review", "Final", "Minor fixes"][v % 5] })),
    };
  });

  /* ---------------- Workspace: Documents (collaborative) ---------------- */
  const documents = [
    { id: "DOC1", title: "Sales Playbook 2024", icon: "book", color: "indigo",
      excerpt: "How we qualify, pitch, and close at Kerso — the canonical guide for the revenue team.",
      body: "## Qualification\nUse the MEDDIC framework on every opportunity over $10k.\n\n## Discovery\nLead with problems, not features. Map the customer's current workflow before proposing.\n\n## Closing\nAlways propose a mutual action plan with dates. Silence is not a no.",
      author: "Noah Patel", updated: daysAgo(2), collaborators: some(team, 3), comments: 4, versions: 9 },
    { id: "DOC2", title: "Enterprise Onboarding Runbook", icon: "file-text", color: "emerald",
      excerpt: "Step-by-step onboarding for accounts above 200 seats.",
      body: "## Week 1\nKickoff call, data migration plan, success criteria.\n\n## Week 2-3\nIntegrations, admin training, pilot team rollout.\n\n## Week 4\nGo-live, exec review, expansion roadmap.",
      author: "Omar Haddad", updated: daysAgo(6), collaborators: some(team, 2), comments: 2, versions: 5 },
    { id: "DOC3", title: "Pricing & Packaging FAQ", icon: "file-text", color: "amber",
      excerpt: "Answers to the most common pricing objections.",
      body: "## Discounting\nMax 15% without approval. Annual prepay unlocks an extra 10%.\n\n## Add-ons\nSecurity, Analytics, and API are priced per-seat.",
      author: "Ava Garcia", updated: daysAgo(11), collaborators: some(team, 4), comments: 7, versions: 12 },
  ];

  /* ---------------- Workspace: Whiteboards ---------------- */
  const whiteboards = [
    { id: "WB1", name: "Q3 Go-to-market", color: "indigo", author: "Sophia Kim", updated: daysAgo(1) },
    { id: "WB2", name: "Deal desk flow", color: "violet", author: "Noah Patel", updated: daysAgo(4) },
    { id: "WB3", name: "Customer journey map", color: "teal", author: "Omar Haddad", updated: daysAgo(9) },
    { id: "WB4", name: "Org & territories", color: "amber", author: "Arya Pams", updated: daysAgo(15) },
  ];

  /* ---------------- Knowledge Base ---------------- */
  const kbArticles = [
    { id: "KB1", title: "Getting started with Kerso CRM", category: "Onboarding", icon: "rocket",
      body: "Welcome to Kerso! This guide walks you through setting up your pipeline, importing contacts, and inviting your team. Most teams are fully live within a day.",
      tags: ["basics", "setup"], author: "Arya Pams", updated: daysAgo(3), views: between(120, 900), versions: 4 },
    { id: "KB2", title: "How lead scoring works", category: "AI & Analytics", icon: "sparkles",
      body: "Kerso scores every lead 0–100 using engagement, fit, and recency signals. Scores update in real time as activity changes. A score above 75 is a strong buying signal.",
      tags: ["ai", "scoring"], author: "Maya Andersson", updated: daysAgo(8), views: between(120, 900), versions: 6 },
    { id: "KB3", title: "Building your first automation", category: "Automation", icon: "zap",
      body: "Automations follow a When → If → Then structure. Start with a trigger (e.g. a deal stalls), add conditions, then choose actions like sending a follow-up or creating a task.",
      tags: ["automation", "workflow"], author: "Liam Carter", updated: daysAgo(12), views: between(120, 900), versions: 3 },
    { id: "KB4", title: "Renewal best practices", category: "Playbooks", icon: "refresh",
      body: "Reach out 90 days before renewal. Lead with adoption metrics and ROI. Flag at-risk accounts early using the Customer Health score and churn prediction.",
      tags: ["renewal", "retention"], author: "Omar Haddad", updated: daysAgo(20), views: between(120, 900), versions: 5 },
    { id: "KB5", title: "Configuring SSO & security", category: "Admin", icon: "shield",
      body: "Kerso supports SAML SSO, SCIM provisioning, and granular roles. Enforce 2FA from Settings → Security. Audit logs are retained for 12 months.",
      tags: ["security", "admin"], author: "Arya Pams", updated: daysAgo(26), views: between(120, 900), versions: 2 },
    { id: "KB6", title: "Reporting & exports", category: "AI & Analytics", icon: "analytics",
      body: "Build reports from natural language or templates. Schedule exports to CSV/PDF, or ask the AI assistant questions like 'show my top customers this month'.",
      tags: ["reports", "export"], author: "Sophia Kim", updated: daysAgo(30), views: between(120, 900), versions: 7 },
  ];

  /* ---------------- Bookmarks ---------------- */
  const bookmarks = [
    { id: "BM1", title: "Pipeline — Negotiation stage", url: "#/customers", tag: "View", icon: "briefcase", color: "indigo", added: daysAgo(2) },
    { id: "BM2", title: "Churn-risk customers", url: "#/customers", tag: "Smart view", icon: "trending-down", color: "rose", added: daysAgo(5) },
    { id: "BM3", title: "Q2 board report", url: "#/analytics", tag: "Report", icon: "analytics", color: "emerald", added: daysAgo(7) },
    { id: "BM4", title: "Sales Playbook 2024", url: "#/workspace", tag: "Doc", icon: "book", color: "violet", added: daysAgo(9) },
    { id: "BM5", title: "Competitor pricing sheet", url: "https://example.com", tag: "Link", icon: "external-link", color: "amber", added: daysAgo(14) },
  ];

  /* ---------------- Calendar events ---------------- */
  const EVENT_TYPES = [
    { type: "meeting", color: "indigo", icon: "users" },
    { type: "call", color: "emerald", icon: "phone" },
    { type: "reminder", color: "amber", icon: "bell" },
    { type: "task", color: "violet", icon: "check-circle" },
  ];
  const calendarEvents = (() => {
    const list = [];
    const titles = ["Demo with Vertex AI", "Renewal call — Lumina Labs", "Pipeline review", "Onboarding — Drift Studio",
      "QBR — Apex Digital", "Discovery — Cobalt Systems", "Contract review", "Team standup", "Proposal walkthrough",
      "Check-in — Northwind", "Security review call", "Forecast sync"];
    titles.forEach((t, i) => {
      const et = EVENT_TYPES[i % EVENT_TYPES.length];
      const offset = between(-6, 16);
      const hr = between(8, 16);
      list.push({
        id: "EV" + (i + 1), title: t, type: et.type, color: et.color, icon: et.icon,
        date: daysAhead(offset),
        start: hr + ":00", end: (hr + 1) + ":00",
        attendees: some(team, between(1, 3)),
        company: chance(0.7) ? pick(D.companies).name : null,
      });
    });
    return list;
  })();

  /* ---------------- Task board statuses (extend existing tasks) ---------------- */
  D.tasks.forEach((t, i) => { t.status = t.done ? "done" : i % 3 === 0 ? "doing" : "todo"; t.tags = t.tags || some(["Follow-up", "Proposal", "Admin", "Outreach"], 1); });
  // a couple extra so each column is populated
  D.tasks.push(
    { id: "T8", title: "Draft EU expansion one-pager", due: daysAhead(2), priority: "medium", done: false, status: "doing", assignee: "Sophia Kim", tags: ["Strategy"] },
    { id: "T9", title: "QBR deck for Apex Digital", due: daysAhead(4), priority: "high", done: false, status: "todo", assignee: "Ava Garcia", tags: ["Proposal"] }
  );

  /* ---------------- Automations ---------------- */
  const automations = [
    { id: "AU1", name: "Stalled deal follow-up", enabled: true, color: "indigo",
      trigger: { type: "deal_idle", label: "When a deal is idle for 5 days" },
      conditions: [{ label: "Deal value is above $10,000" }],
      actions: [{ icon: "mail", label: "Send follow-up email" }, { icon: "check-circle", label: "Create task for owner" }],
      runs: 142, lastRun: hoursAgo(3), created: daysAgo(120) },
    { id: "AU2", name: "New lead welcome", enabled: true, color: "emerald",
      trigger: { type: "customer_created", label: "When a customer is created" },
      conditions: [{ label: "Status is Lead" }],
      actions: [{ icon: "mail", label: "Send welcome email" }, { icon: "user", label: "Assign to round-robin owner" }],
      runs: 318, lastRun: hoursAgo(6), created: daysAgo(160) },
    { id: "AU3", name: "Churn-risk alert", enabled: true, color: "rose",
      trigger: { type: "health_drop", label: "When customer health drops below 40" },
      conditions: [],
      actions: [{ icon: "bell", label: "Notify Customer Success" }, { icon: "briefcase", label: "Create save-play task" }],
      runs: 27, lastRun: daysAgo(1), created: daysAgo(90) },
    { id: "AU4", name: "Won deal celebration", enabled: false, color: "amber",
      trigger: { type: "deal_won", label: "When a deal is marked Won" },
      conditions: [{ label: "Deal value is above $25,000" }],
      actions: [{ icon: "message", label: "Post to #deals-won channel" }],
      runs: 64, lastRun: daysAgo(2), created: daysAgo(70) },
    { id: "AU5", name: "Contract renewal reminder", enabled: true, color: "violet",
      trigger: { type: "renewal_near", label: "When a contract renews in 30 days" },
      conditions: [],
      actions: [{ icon: "calendar", label: "Schedule renewal call" }, { icon: "mail", label: "Send renewal summary" }],
      runs: 51, lastRun: daysAgo(3), created: daysAgo(110) },
  ];
  const automationRuns = (() => {
    const list = [];
    const out = ["Sent follow-up to Lumina Labs", "Created task for Liam Carter", "Welcome email → 3 new leads",
      "Notified Customer Success about Northwind", "Posted win to #deals-won", "Scheduled renewal call — Apex"];
    for (let i = 0; i < 8; i++) list.push({ id: "RUN" + i, automation: pick(automations).name, result: pick(out), status: chance(0.9) ? "success" : "skipped", time: hoursAgo(between(1, 70)) });
    return list.sort((a, b) => +b.time - +a.time);
  })();

  /* ---------------- Marketplace ---------------- */
  const marketplace = [
    { id: "MK1", name: "Slack", category: "Integrations", by: "Slack", icon: "message", color: "violet", desc: "Push deal alerts and @mentions straight into your Slack channels.", rating: 4.8, installs: "12k", installed: true, price: "Free" },
    { id: "MK2", name: "Gmail Sync", category: "Integrations", by: "Kerso", icon: "mail", color: "rose", desc: "Two-way email sync with automatic activity logging.", rating: 4.7, installs: "9.4k", installed: true, price: "Free" },
    { id: "MK3", name: "Calendar Pro", category: "Integrations", by: "Kerso", icon: "calendar", color: "indigo", desc: "Schedule meetings and sync events across the team.", rating: 4.6, installs: "7.1k", installed: false, price: "Free" },
    { id: "MK4", name: "Forecast AI", category: "AI Agents", by: "Kerso Labs", icon: "bot", color: "emerald", desc: "An autonomous agent that updates forecasts and flags risk nightly.", rating: 4.9, installs: "3.2k", installed: false, price: "$29/mo" },
    { id: "MK5", name: "SDR Copilot", category: "AI Agents", by: "Kerso Labs", icon: "sparkles", color: "amber", desc: "Drafts outreach, books meetings, and qualifies inbound leads.", rating: 4.5, installs: "2.8k", installed: false, price: "$49/mo" },
    { id: "MK6", name: "Pipeline Hygiene", category: "Automation Packs", by: "Community", icon: "zap", color: "sky", desc: "10 ready-made automations to keep your pipeline clean.", rating: 4.4, installs: "5.6k", installed: false, price: "Free" },
    { id: "MK7", name: "Renewal Pack", category: "Automation Packs", by: "Community", icon: "refresh", color: "teal", desc: "Automate renewal reminders, summaries, and save-plays.", rating: 4.6, installs: "4.1k", installed: true, price: "Free" },
    { id: "MK8", name: "Board Report Template", category: "Templates", by: "Kerso", icon: "analytics", color: "blue", desc: "A polished monthly board-ready revenue report.", rating: 4.7, installs: "6.3k", installed: false, price: "Free" },
    { id: "MK9", name: "SaaS Sales Dashboard", category: "Templates", by: "Community", icon: "dashboard", color: "fuchsia", desc: "KPI dashboard tuned for SaaS sales teams.", rating: 4.3, installs: "3.9k", installed: false, price: "Free" },
    { id: "MK10", name: "Lead Enrichment", category: "Plugins", by: "Clearbit", icon: "user", color: "orange", desc: "Auto-enrich new contacts with firmographic data.", rating: 4.5, installs: "8.2k", installed: false, price: "$19/mo" },
    { id: "MK11", name: "DocuSign", category: "Plugins", by: "DocuSign", icon: "edit", color: "amber", desc: "Send and track contracts for e-signature in-app.", rating: 4.6, installs: "7.7k", installed: false, price: "Free" },
    { id: "MK12", name: "Zapier", category: "Extensions", by: "Zapier", icon: "puzzle", color: "orange", desc: "Connect Kerso to 6,000+ apps with no code.", rating: 4.8, installs: "11k", installed: true, price: "Free" },
    { id: "MK13", name: "Dark Reader Theme", category: "Extensions", by: "Community", icon: "moon", color: "slate", desc: "Extra polished dark themes and accent packs.", rating: 4.2, installs: "2.1k", installed: false, price: "Free" },
  ];

  /* ---------------- Saved views (personalization) ---------------- */
  const savedViews = [
    { id: "SV1", name: "Hot leads", page: "customers", icon: "target", config: { status: "Lead" } },
    { id: "SV2", name: "Enterprise accounts", page: "explore", icon: "building", config: { industry: "All" } },
    { id: "SV3", name: "At-risk renewals", page: "customers", icon: "alert", config: { status: "All" } },
  ];

  /* ---------------- Dashboards (multiple + layouts) ---------------- */
  const dashboards = [
    { id: "personal", name: "My dashboard", kind: "personal", icon: "user" },
    { id: "team", name: "Team dashboard", kind: "team", icon: "users" },
  ];

  /* ---------------- Renewals / contracts (for smart notifications) ---------------- */
  D.customers.forEach((c, i) => {
    c.renewal = daysAhead(between(-20, 180));
    c.lastReply = c.lastContact;
    c.score = null; // filled lazily by ai
  });

  /* ---------------- Per-customer timeline events ---------------- */
  const TL_KINDS = ["email", "call", "meeting", "note", "deal", "status", "automation", "comment", "file"];
  function buildTimeline(c) {
    const r = makeRng(hashStr(c.id));
    const p = (a) => a[Math.floor(r() * a.length)];
    const bt = (a, b) => a + Math.floor(r() * (b - a + 1));
    const n = bt(7, 12);
    const owner = c.owner || "Arya Pams";
    const out = [];
    const tmpl = {
      email: () => ({ title: p(["Sent proposal follow-up", "Replied to pricing question", "Shared onboarding docs", "Quarterly check-in email"]), who: owner, meta: p(["Opened", "Replied", "Delivered"]) }),
      call: () => ({ title: p(["Discovery call", "Renewal discussion", "Support escalation", "Pricing negotiation"]), who: owner, meta: bt(8, 42) + " min" }),
      meeting: () => ({ title: p(["Product demo", "QBR", "Kickoff meeting", "Exec alignment"]), who: owner, meta: bt(2, 5) + " attendees" }),
      note: () => ({ title: p(["Added a note", "Logged meeting notes", "Updated account plan"]), who: p(team).name, meta: "" }),
      deal: () => ({ title: p(["Deal moved to Proposal", "New deal created", "Deal value updated"]), who: owner, meta: "$" + bt(8, 90) + "k" }),
      status: () => ({ title: "Status changed to " + p(["Active", "Prospect", "Lead"]), who: "System", meta: "" }),
      automation: () => ({ title: p(["Automation: follow-up sent", "Automation: task created", "Automation: health alert"]), who: "Automation", meta: "" }),
      comment: () => ({ title: p(["@Noah commented on this account", "Left a comment", "Mentioned you in a note"]), who: p(team).name, meta: "" }),
      file: () => ({ title: p(["Uploaded contract.pdf", "Shared pricing.xlsx", "Attached proposal.docx"]), who: owner, meta: "" }),
    };
    for (let i = 0; i < n; i++) {
      const kind = p(TL_KINDS);
      const base = tmpl[kind]();
      out.push({ id: c.id + "-tl" + i, kind, ...base, time: new Date(NOW.getTime() - bt(0, 60) * 86400000 - bt(0, 23) * 3600000) });
    }
    return out.sort((a, b) => +b.time - +a.time);
  }
  function hashStr(s) { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }

  const _timelineCache = {};
  D.timelineFor = function (c) {
    const id = c.id;
    if (!_timelineCache[id]) _timelineCache[id] = buildTimeline(c);
    return _timelineCache[id];
  };

  /* counts derived for Customer 360 tabs */
  D.commsFor = function (c) {
    const tl = D.timelineFor(c);
    return {
      emails: tl.filter((e) => e.kind === "email"),
      calls: tl.filter((e) => e.kind === "call"),
      meetings: tl.filter((e) => e.kind === "meeting"),
      notes: tl.filter((e) => e.kind === "note" || e.kind === "comment"),
      files: files.filter((f) => f.company === c.company),
    };
  };

  /* ---------------- Comments store (generic, per entity) ---------------- */
  const comments = {
    "DOC1": [
      { id: "c1", author: "Ava Garcia", text: "Can we add a section on multi-threading?", time: hoursAgo(20) },
      { id: "c2", author: "Noah Patel", text: "Good call — @Ava Garcia want to draft it?", time: hoursAgo(18) },
    ],
  };

  /* ---------------- Expose ---------------- */
  Object.assign(D, {
    team, teammate,
    chats, notes, files, documents, whiteboards, kbArticles, bookmarks,
    calendarEvents, automations, automationRuns, marketplace, savedViews, dashboards, comments,
    workspaceTools: [
      { id: "chat", label: "Chat", icon: "message" },
      { id: "notes", label: "Notes", icon: "edit" },
      { id: "tasks", label: "Tasks", icon: "check-circle" },
      { id: "calendar", label: "Calendar", icon: "calendar" },
      { id: "files", label: "Files", icon: "folder" },
      { id: "docs", label: "Documents", icon: "file-text" },
      { id: "whiteboard", label: "Whiteboard", icon: "whiteboard" },
      { id: "kb", label: "Knowledge Base", icon: "book" },
      { id: "bookmarks", label: "Bookmarks", icon: "bookmark" },
    ],
    _rngExt: rng,
  });
})(window.App);
