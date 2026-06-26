/* ============================================================
   Kerso CRM — AI engine (simulated, deterministic)
   A dependency-free "AI" layer that derives summaries, scores,
   predictions, recommendations, generated content, natural-language
   search and reports from the in-memory CRM data. Outputs are
   deterministic (seeded by entity id) so the app is stable.
   Powers: AI Native (#2), NL Search (#4), AI Reports (#10),
   Predictive Analytics (#14), Smart Forms (#16).
   ============================================================ */
(function (App) {
  "use strict";
  const D = App.data;
  const fmt = App.fmt;

  /* ---------------- helpers ---------------- */
  function hash(s) { s = String(s); let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }
  const clamp = (n, lo, hi) => Math.max(lo, Math.min(hi, n));
  const daysSince = (d) => Math.round((App.now() - new Date(d)) / 86400000);
  const pickBy = (arr, seed) => arr[hash(seed) % arr.length];

  /* ============================================================
     PREDICTIVE ANALYTICS (#14)
     ============================================================ */

  /** Lead/account score 0–100 — fit + engagement + recency */
  function leadScore(c) {
    let s = 40;
    s += (c.health || 50) * 0.3;
    s += clamp((c.value || 0) / 4000, 0, 24);
    s += (c.deals || 0) * 1.6;
    const recency = daysSince(c.lastContact || App.now());
    s -= clamp(recency * 0.4, 0, 20);
    if (c.status === "Active") s += 8;
    if (c.status === "Churned") s -= 26;
    if (c.status === "Lead") s += 4;
    return Math.round(clamp(s, 3, 99));
  }

  /** Opportunity / close probability for a deal 0–100 */
  function opportunityScore(deal) {
    const stageW = { Lead: 18, Qualified: 38, Proposal: 58, Negotiation: 76, Won: 100 };
    let s = stageW[deal.stage] != null ? stageW[deal.stage] : 40;
    s = s * 0.6 + (deal.probability || 50) * 0.3;
    s += clamp((deal.value || 0) / 12000, 0, 8);
    const r = hash(deal.id) % 9 - 4;
    if (deal.status === "won") s = 100;
    if (deal.status === "lost") s = 2;
    return Math.round(clamp(s + r, 2, 99));
  }

  /** Churn risk 0–100 (higher = more likely to churn) */
  function churnRisk(c) {
    let risk = 22;
    risk += clamp((70 - (c.health || 60)) * 0.7, -20, 45);
    const recency = daysSince(c.lastContact || App.now());
    risk += clamp(recency * 0.6, 0, 28);
    if (c.status === "Churned") risk = 96;
    if (c.status === "Active") risk -= 10;
    return Math.round(clamp(risk, 2, 98));
  }

  function riskBand(risk) { return risk >= 66 ? "high" : risk >= 38 ? "medium" : "low"; }
  function scoreBand(score) { return score >= 70 ? "high" : score >= 45 ? "medium" : "low"; }

  /** Best time to contact — deterministic per entity */
  function bestTimeToContact(c) {
    const days = ["Mon", "Tue", "Wed", "Thu", "Fri"];
    const slots = ["9–10 AM", "10–11 AM", "1–2 PM", "3–4 PM", "4–5 PM"];
    const h = hash(c.id || c.name || "x");
    return `${days[h % days.length]} · ${slots[(h >>> 3) % slots.length]}`;
  }

  /** Revenue forecast — projects N months from revenueSeries with a confidence band */
  function revenueForecast(months) {
    months = months || 6;
    const hist = D.revenueSeries.map((m) => m.current);
    const n = hist.length;
    const recent = hist.slice(-6);
    const avg = recent.reduce((a, b) => a + b, 0) / recent.length;
    const slope = (recent[recent.length - 1] - recent[0]) / Math.max(1, recent.length - 1);
    const out = { labels: [], base: [], low: [], high: [], lastActual: hist[n - 1] };
    const M = D.MONTHS;
    for (let i = 1; i <= months; i++) {
      const proj = Math.max(8000, avg + slope * i + (hash("f" + i) % 6000 - 3000));
      const spread = proj * (0.08 + i * 0.025);
      out.labels.push(M[(n + i - 1) % 12]);
      out.base.push(Math.round(proj));
      out.low.push(Math.round(proj - spread));
      out.high.push(Math.round(proj + spread));
    }
    out.total = out.base.reduce((a, b) => a + b, 0);
    out.confidence = 84;
    return out;
  }

  /* ============================================================
     NEXT BEST ACTION / RECOMMENDATIONS (#2)
     ============================================================ */
  function nextBestAction(c) {
    const risk = churnRisk(c);
    const recency = daysSince(c.lastContact || App.now());
    if (risk >= 66) return { icon: "alert", tone: "danger", title: "Launch a save-play", body: `${c.name} is high churn risk. Schedule an exec check-in and share an ROI summary this week.`, cta: "Schedule call" };
    if (recency > 30) return { icon: "mail", tone: "warning", title: "Re-engage now", body: `No contact in ${recency} days. Send a personalized follow-up referencing their last activity.`, cta: "Draft email" };
    if (c.status === "Lead") return { icon: "target", tone: "info", title: "Qualify this lead", body: `Score is ${leadScore(c)}/100. Book a discovery call to confirm budget and timeline.`, cta: "Book discovery" };
    if ((c.deals || 0) >= 3) return { icon: "trending-up", tone: "success", title: "Expansion opportunity", body: `${c.name} has strong adoption. Propose a seat expansion or an add-on module.`, cta: "Create deal" };
    return { icon: "sparkles", tone: "info", title: "Keep momentum", body: `Healthy account. Best time to reach ${c.name.split(" ")[0]} is ${bestTimeToContact(c)}.`, cta: "Log activity" };
  }

  function dealNextAction(deal) {
    const p = opportunityScore(deal);
    if (deal.stage === "Negotiation") return { icon: "send", title: "Send the mutual action plan", body: `${p}% to close. Lock dates with the buyer and confirm the signing authority.` };
    if (deal.stage === "Proposal") return { icon: "phone", title: "Schedule the proposal review", body: "Walk the champion through ROI before they circulate internally." };
    if (deal.stage === "Lead" || deal.stage === "Qualified") return { icon: "target", title: "Run discovery", body: "Map the decision process and confirm budget to advance the stage." };
    return { icon: "check-circle", title: "Drive to signature", body: "Remove the last blocker and propose a close date." };
  }

  /* ============================================================
     SUMMARIES (#2)
     ============================================================ */
  function summarizeCustomer(c) {
    const ls = leadScore(c), cr = churnRisk(c), recency = daysSince(c.lastContact || App.now());
    const tl = D.timelineFor ? D.timelineFor(c) : [];
    const lastMeeting = tl.find((e) => e.kind === "meeting");
    const sentiments = ["highly engaged", "steadily engaged", "warming up", "going quiet", "at risk"];
    const sent = cr >= 66 ? sentiments[4] : recency > 30 ? sentiments[3] : ls >= 70 ? sentiments[0] : sentiments[1];
    return [
      `${c.name} at ${c.company} is a ${c.status.toLowerCase()} account currently ${sent}.`,
      `Lifetime value is ${fmt.money(c.value)} across ${c.deals} ${c.deals === 1 ? "deal" : "deals"}, with a health score of ${c.health}.`,
      `Last contact was ${recency === 0 ? "today" : recency + " days ago"}${lastMeeting ? ` (last meeting: ${lastMeeting.title})` : ""}.`,
      `AI read: lead score ${ls}/100, churn risk ${cr}% (${riskBand(cr)}). ${nextBestAction(c).title}.`,
    ].join(" ");
  }

  function summarizeCompany(co) {
    const related = D.customers.filter((x) => x.company === co.name).length;
    return [
      `${co.name} is a ${co.size}-employee ${co.industry.toLowerCase()} company in ${co.city}, ${co.country}.`,
      `Annual revenue is ${fmt.money(co.revenue)} with ${co.growth >= 0 ? "+" : ""}${co.growth}% growth.`,
      `You track ${related} ${related === 1 ? "contact" : "contacts"} and ${co.deals} open ${co.deals === 1 ? "deal" : "deals"} here.`,
      `AI read: ${co.status} relationship — ${co.growth >= 20 ? "strong expansion potential" : co.growth < 0 ? "monitor for contraction" : "stable, nurture for upsell"}.`,
    ].join(" ");
  }

  function summarizeDeal(deal) {
    const p = opportunityScore(deal);
    return `${deal.title} (${deal.company}) is worth ${fmt.money(deal.value)} at the ${deal.stage} stage. AI close probability is ${p}%. ${dealNextAction(deal).body}`;
  }

  function summarize(kind, entity) {
    if (kind === "customer") return summarizeCustomer(entity);
    if (kind === "company") return summarizeCompany(entity);
    if (kind === "deal") return summarizeDeal(entity);
    return "";
  }

  /* ============================================================
     INSIGHTS & RECOMMENDATIONS (#2)
     ============================================================ */
  function insights(scope) {
    const out = [];
    const atRisk = D.customers.filter((c) => churnRisk(c) >= 66);
    const won = D.deals.filter((d) => d.status === "won");
    const revDelta = D.kpis.find((k) => k.id === "revenue-total");
    const fc = revenueForecast(3);
    out.push({ icon: "trending-up", tone: "success", title: "Pipeline momentum", body: `${won.length} deals won recently. Projected revenue next quarter is ${fmt.moneyCompact(fc.total)} (${fc.confidence}% confidence).` });
    if (atRisk.length) out.push({ icon: "alert", tone: "danger", title: `${atRisk.length} accounts at churn risk`, body: `${atRisk.slice(0, 2).map((c) => c.name).join(", ")}${atRisk.length > 2 ? " and others" : ""} show declining health. Prioritize save-plays.` });
    if (revDelta && revDelta.delta < 0) out.push({ icon: "trending-down", tone: "warning", title: "Revenue dipped", body: `Revenue is ${fmt.pct(revDelta.delta)} vs last month — driven by fewer mid-market closes. Focus reps on Proposal-stage deals.` });
    const topRep = D.analytics.reps[0];
    out.push({ icon: "users", tone: "info", title: "Top performer", body: `${topRep.name} leads with ${fmt.money(topRep.value)} across ${topRep.deals} deals. Share their Negotiation playbook with the team.` });
    const hotLeads = D.customers.filter((c) => c.status === "Lead" && leadScore(c) >= 70);
    if (hotLeads.length) out.push({ icon: "target", tone: "info", title: `${hotLeads.length} hot leads to action`, body: `These leads score 70+. Best contact window for most is mid-morning, Tue–Thu.` });
    return out;
  }

  function recommendations() {
    return [
      { icon: "mail", title: "Re-engage 6 quiet accounts", body: "No touch in 30+ days. Send a tailored check-in.", cta: "Draft emails" },
      { icon: "calendar", title: "Book 3 renewal calls", body: "Contracts renew within 30 days.", cta: "Schedule" },
      { icon: "zap", title: "Automate stalled-deal nudges", body: "12 deals idle 5+ days could use a follow-up.", cta: "Create automation" },
    ];
  }

  /* ============================================================
     CONTENT GENERATION (#2)
     ============================================================ */
  function generateEmail(opts) {
    opts = opts || {};
    const c = opts.customer || { name: "there", company: "your team" };
    const first = String(c.name).split(" ")[0];
    const purpose = opts.purpose || "follow-up";
    const me = D.currentUser.name;
    const templates = {
      "follow-up": {
        subject: `Following up — ${c.company}`,
        body: `Hi ${first},\n\nThanks again for your time. I wanted to follow up on our last conversation and see how things are tracking on your side.\n\nBased on what you shared, I think Kerso can help you ${pickBy(["consolidate reporting", "shorten your sales cycle", "improve forecast accuracy"], c.id || c.name)}. Happy to put together a short plan tailored to ${c.company}.\n\nWould ${bestTimeToContact(c).split(" · ")[0]} work for a quick call?\n\nBest,\n${me}`,
      },
      "renewal": {
        subject: `Your ${c.company} renewal — a quick summary`,
        body: `Hi ${first},\n\nAs your renewal approaches, I pulled together a short summary of the value ${c.company} has seen this year, along with a couple of options for the year ahead.\n\nI'd love to walk you through it and answer any questions. Are you free this week?\n\nBest,\n${me}`,
      },
      "intro": {
        subject: `Helping ${c.company} hit its number`,
        body: `Hi ${first},\n\nI work with teams like ${c.company} to ${pickBy(["streamline their pipeline", "automate busywork", "get cleaner forecasts"], c.company)}. Teams usually see results within the first month.\n\nWorth a 15-minute look?\n\nBest,\n${me}`,
      },
    };
    return templates[purpose] || templates["follow-up"];
  }

  function meetingSummary(event) {
    const co = (event && event.company) || pickBy(D.companies, (event && event.id) || "x").name;
    return {
      summary: `${(event && event.title) || "Meeting"} with ${co}. The team aligned on next steps and confirmed strong interest. Budget is approved pending a final security review; timeline targets end of quarter.`,
      actionItems: [
        { who: "You", text: `Send recap + pricing to ${co}` },
        { who: "Champion", text: "Loop in security stakeholder" },
        { who: "You", text: "Schedule follow-up demo for the wider team" },
      ],
      sentiment: "positive",
    };
  }

  /* ============================================================
     SMART FORMS — autofill / import (#16)
     ============================================================ */
  function autofillCompany(seed) {
    const name = (seed && seed.name) || pickBy(D.companies, (seed && seed.url) || "co").name;
    const co = D.companies.find((c) => c.name.toLowerCase() === String(name).toLowerCase()) || pickBy(D.companies, name);
    return {
      name: name,
      industry: co.industry,
      status: "Prospect",
      city: co.city,
      country: co.country,
      website: (seed && seed.url) ? String(seed.url).replace(/^https?:\/\//, "").replace(/\/.*$/, "") : co.website,
      _source: seed && seed.url ? "website" : "AI enrichment",
    };
  }

  function autofillCustomer(seed) {
    const co = pickBy(D.companies, (seed && (seed.email || seed.name)) || "c");
    const name = (seed && seed.name) || pickBy(D.customers, (seed && seed.email) || "n").name;
    const email = (seed && seed.email) || (String(name).toLowerCase().replace(/[^a-z]+/g, ".") + "@" + co.website);
    return {
      name, email,
      phone: "+1 (" + (200 + (hash(name) % 700)) + ") " + (200 + (hash(email) % 700)) + "-" + String(hash(name + email) % 10000).padStart(4, "0"),
      company: co.name,
      status: "Lead",
      city: co.city,
      country: co.country,
      _source: seed && seed.email ? "email signature" : seed && seed.card ? "business card" : "AI enrichment",
    };
  }

  /* ============================================================
     NATURAL LANGUAGE SEARCH (#4)
     Parses a plain-English query into a structured result set.
     ============================================================ */
  function parseQuery(q) {
    q = String(q || "").toLowerCase().trim();
    if (!q) return null;
    const moneyMatch = q.match(/\$?\s?(\d+(?:\.\d+)?)\s?(k|m|thousand|million)?/);
    let amount = null;
    if (moneyMatch && /\$|\bvalue\b|\bdeal|\babove|\bover|\bunder|\bbelow|\bworth|k\b|m\b/.test(q)) {
      amount = parseFloat(moneyMatch[1]);
      const unit = moneyMatch[2];
      if (unit === "k" || unit === "thousand") amount *= 1000;
      else if (unit === "m" || unit === "million") amount *= 1e6;
      else if (amount < 1000) amount *= 1000; // "deals above 20" => 20k
    }
    const dayMatch = q.match(/(\d+)\s*day/);
    const days = dayMatch ? +dayMatch[1] : (/last week/.test(q) ? 7 : /last month/.test(q) ? 30 : null);

    const result = { query: q, entity: "customers", title: "", description: "", rows: [], render: null };

    // DEALS
    if (/\bdeal/.test(q)) {
      result.entity = "deals";
      let list = D.deals.slice();
      if (amount != null) {
        if (/under|below|less than/.test(q)) { list = list.filter((d) => d.value < amount); result.description = `Deals under ${fmt.money(amount)}`; }
        else { list = list.filter((d) => d.value >= amount); result.description = `Deals above ${fmt.money(amount)}`; }
      }
      if (/won/.test(q)) { list = list.filter((d) => d.status === "won"); result.description = (result.description ? result.description + " · " : "") + "Won"; }
      if (/lost/.test(q)) { list = list.filter((d) => d.status === "lost"); }
      if (/negotiation/.test(q)) list = list.filter((d) => d.stage === "Negotiation");
      if (/closing|close/.test(q)) list = list.sort((a, b) => +a.close - +b.close);
      result.title = "Deals";
      result.description = result.description || "Matching deals";
      result.rows = list;
      return result;
    }

    // MEETINGS / CALENDAR
    if (/\bmeeting|\bcall\b|\bevents?\b|calendar/.test(q)) {
      result.entity = "events";
      let list = (D.calendarEvents || []).slice();
      if (/meeting/.test(q)) list = list.filter((e) => e.type === "meeting");
      if (/call/.test(q)) list = list.filter((e) => e.type === "call");
      if (days != null) {
        const now = App.now();
        list = list.filter((e) => Math.abs((new Date(e.date) - now) / 86400000) <= days);
      }
      result.title = "Meetings & calls";
      result.description = days ? `From the last ${days} days` : "Upcoming and recent";
      result.rows = list;
      return result;
    }

    // COMPANIES
    if (/\bcompan|\baccount|\bindustry|\bbusiness/.test(q)) {
      result.entity = "companies";
      let list = D.companies.slice();
      D.INDUSTRIES.forEach((ind) => { if (q.includes(ind.toLowerCase())) list = list.filter((c) => c.industry === ind); });
      if (/growing|growth|fast/.test(q)) list = list.filter((c) => c.growth > 20).sort((a, b) => b.growth - a.growth);
      result.title = "Companies";
      result.description = "Matching companies";
      result.rows = list;
      return result;
    }

    // CUSTOMERS (default)
    let list = D.customers.slice();
    const desc = [];
    if (/churn|risk|at[-\s]?risk/.test(q)) { list = list.filter((c) => churnRisk(c) >= 55); desc.push("Churn risk"); }
    if (/active/.test(q)) { list = list.filter((c) => c.status === "Active"); desc.push("Active"); }
    if (/lead/.test(q)) { list = list.filter((c) => c.status === "Lead"); desc.push("Leads"); }
    if (/churned/.test(q)) { list = list.filter((c) => c.status === "Churned"); desc.push("Churned"); }
    if (/hot|high[-\s]?score|top lead/.test(q)) { list = list.filter((c) => leadScore(c) >= 70); desc.push("High lead score"); }
    const mentionsNoReply = (/haven'?t|hasn'?t|\bno\b|\bnot\b/.test(q) && /repl|contact|touch|respond|hear/.test(q)) || /quiet|inactive|cold|silent|dormant/.test(q);
    if (days != null && (mentionsNoReply || /repl|contact|touch|respond/.test(q))) {
      list = list.filter((c) => daysSince(c.lastContact) >= days); desc.push(`No contact in ${days}+ days`);
    }
    if (amount != null && /value|worth|ltv|lifetime/.test(q)) { list = list.filter((c) => c.value >= amount); desc.push(`Value ≥ ${fmt.money(amount)}`); }
    result.entity = "customers";
    result.title = "Customers";
    result.description = desc.length ? desc.join(" · ") : "Matching customers";
    result.rows = list;
    return result;
  }

  /* ============================================================
     AI REPORTS (#10) — natural-language report generation
     ============================================================ */
  function generateReport(q) {
    q = String(q || "").toLowerCase().trim();
    const r = { title: "Report", summary: "", kind: "table", columns: [], rows: [], chart: null, note: "" };

    if (/top customer|best customer|biggest customer/.test(q)) {
      const rows = D.customers.slice().sort((a, b) => b.value - a.value).slice(0, 8);
      r.title = "Top customers this month";
      r.summary = `Your top 8 customers account for ${fmt.money(rows.reduce((a, c) => a + c.value, 0))} in lifetime value. ${rows[0].name} leads at ${fmt.money(rows[0].value)}.`;
      r.columns = [{ k: "name", l: "Customer" }, { k: "company", l: "Company" }, { k: "value", l: "Value", money: true, align: "right" }, { k: "health", l: "Health", align: "right" }];
      r.rows = rows;
      return r;
    }
    if (/why.*(revenue|sales).*(decrease|drop|down|dip)|revenue decrease/.test(q)) {
      r.title = "Why did revenue decrease?";
      r.kind = "analysis";
      r.summary = "Revenue declined 9.0% vs last month. The AI attributes the dip to three main factors:";
      r.rows = [
        { factor: "Fewer mid-market closes", impact: "−$14.2K", detail: "Mid-market win rate fell from 28% to 21%." },
        { factor: "2 enterprise deals slipped", impact: "−$9.6K", detail: "Apex & Northwind pushed to next month (still open)." },
        { factor: "Higher discounting", impact: "−$4.1K", detail: "Average discount rose to 12% on competitive deals." },
      ];
      r.note = "Recommended: focus reps on Proposal-stage deals and tighten discount approvals. Forecast recovers next month.";
      return r;
    }
    if (/best.*(deal|performing).*(quarter|month)|best deals/.test(q)) {
      const rows = D.deals.slice().sort((a, b) => b.value - a.value).slice(0, 8);
      r.title = "Best-performing deals this quarter";
      r.summary = `Top deals total ${fmt.money(rows.reduce((a, d) => a + d.value, 0))}. ${rows[0].title} (${rows[0].company}) is the largest at ${fmt.money(rows[0].value)}.`;
      r.columns = [{ k: "title", l: "Deal" }, { k: "company", l: "Company" }, { k: "stage", l: "Stage", badge: true }, { k: "value", l: "Value", money: true, align: "right" }];
      r.rows = rows;
      return r;
    }
    if (/pipeline|forecast|projection/.test(q)) {
      const fc = revenueForecast(6);
      r.title = "Revenue forecast — next 6 months";
      r.kind = "forecast";
      r.summary = `Projected revenue over the next 6 months is ${fmt.money(fc.total)} (${fc.confidence}% confidence). The trend is ${fc.base[fc.base.length - 1] > fc.base[0] ? "upward" : "flat"}.`;
      r.forecast = fc;
      return r;
    }
    if (/region|geograph/.test(q)) {
      r.title = "Sales by region";
      r.columns = [{ k: "name", l: "Region" }, { k: "value", l: "Share", pct: true, align: "right" }];
      r.rows = D.analytics.regions;
      r.summary = "North America and Europe drive 77% of revenue.";
      return r;
    }
    if (/rep|team|performer|leaderboard/.test(q)) {
      r.title = "Sales rep leaderboard";
      r.columns = [{ k: "name", l: "Rep" }, { k: "deals", l: "Deals", align: "right" }, { k: "value", l: "Revenue", money: true, align: "right" }];
      r.rows = D.analytics.reps;
      r.summary = `${D.analytics.reps[0].name} is your top performer this period.`;
      return r;
    }
    // generic fallback — KPI snapshot
    r.title = "Performance snapshot";
    r.kind = "kpi";
    r.summary = "Here's a snapshot of your key metrics. Try asking about top customers, best deals, revenue trends, or the forecast.";
    r.rows = D.kpis.map((k) => ({ name: k.label, value: k.display, delta: k.delta, dir: k.dir }));
    return r;
  }

  /* Suggested questions for the assistant / report builder */
  const sampleQuestions = [
    "Show my top customers this month",
    "Why did revenue decrease?",
    "Best-performing deals this quarter",
    "Customers who haven't replied in 30 days",
    "Deals above $20k",
    "Revenue forecast for next 6 months",
  ];

  /* ============================================================
     CONVERSATIONAL ANSWER (assistant)
     ============================================================ */
  function answer(q) {
    const parsed = parseQuery(q);
    const lower = String(q).toLowerCase();
    if (/forecast|predict|next quarter|next month|projection/.test(lower)) {
      const fc = revenueForecast(6);
      return { text: `I project ${fmt.money(fc.total)} in revenue over the next 6 months at ${fc.confidence}% confidence — a ${fc.base[fc.base.length - 1] > fc.lastActual ? "gradual upward" : "stable"} trend. Want me to break it down by month or rep?`, report: generateReport("forecast") };
    }
    if (/summary|summarize|how.*doing|overview|how are we/.test(lower)) {
      const ins = insights()[0];
      return { text: `Here's the headline: ${ins.body} Overall pipeline is healthy with a few accounts to watch.`, insights: insights().slice(0, 3) };
    }
    if (/report|top|best|why|leaderboard|region|rep\b/.test(lower)) {
      const rep = generateReport(q);
      return { text: rep.summary, report: rep };
    }
    if (parsed && parsed.rows.length) {
      return { text: `I found ${parsed.rows.length} ${parsed.entity} for "${q}". ${parsed.description}.`, search: parsed };
    }
    return { text: `I can help with summaries, scores, forecasts and reports. Try: "${pickBy(sampleQuestions, q)}".`, suggestions: sampleQuestions };
  }

  /* ============================================================
     TYPEWRITER STREAM (assistant feel)
     ============================================================ */
  function stream(text, el, done) {
    const reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) { el.textContent = text; done && done(); return { cancel() {} }; }
    let i = 0; el.textContent = "";
    const step = Math.max(1, Math.round(text.length / 90));
    const timer = setInterval(() => {
      i += step;
      el.textContent = text.slice(0, i);
      if (el.scrollIntoView) el.parentElement && (el.closest(".aiasst__scroll") || {}).scrollTo && el.closest(".aiasst__scroll").scrollTo(0, 9e6);
      if (i >= text.length) { clearInterval(timer); el.textContent = text; done && done(); }
    }, 16);
    return { cancel() { clearInterval(timer); el.textContent = text; } };
  }

  /* ---------------- Expose ---------------- */
  App.ai = {
    leadScore, opportunityScore, churnRisk, riskBand, scoreBand, bestTimeToContact, revenueForecast,
    nextBestAction, dealNextAction,
    summarize, summarizeCustomer, summarizeCompany, summarizeDeal,
    insights, recommendations,
    generateEmail, meetingSummary,
    autofillCompany, autofillCustomer,
    parseQuery, generateReport, sampleQuestions, answer, stream,
  };
})(window.App);
