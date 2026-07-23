/* ============================================================
   Kerso CRM — SVG chart library (dependency-free)
   Renders to strings; App.charts.bind(root) wires crosshair
   tooltips for line/bar charts. Generic [data-tip] tooltips are
   handled in ui.js.
   ============================================================ */
(function (App) {
  "use strict";

  const PALETTE = ["#4F46E5", "#22C55E", "#F59E0B", "#06B6D4", "#EC4899", "#8B5CF6"];

  const niceMax = (v) => {
    if (v <= 0) return 10;
    const pow = Math.pow(10, Math.floor(Math.log10(v)));
    const n = v / pow;
    const step = n <= 1 ? 1 : n <= 2 ? 2 : n <= 5 ? 5 : 10;
    return step * pow;
  };
  const fmtAxis = (v) => App.fmt.compact(v);
  const polar = (cx, cy, r, deg) => {
    const a = ((deg - 90) * Math.PI) / 180;
    return [cx + r * Math.cos(a), cy + r * Math.sin(a)];
  };

  /* ---------------- Area / line chart ---------------- */
  function areaLine(opts) {
    const W = 760, H = opts.height || 280;
    const pad = { l: 46, r: 16, t: 16, b: 34 };
    const pw = W - pad.l - pad.r;
    const ph = H - pad.t - pad.b;
    const labels = opts.labels || [];
    const series = opts.series || [];
    const n = labels.length || (series[0] ? series[0].values.length : 0);
    const maxData = Math.max(1, ...series.flatMap((s) => s.values));
    const max = opts.max || niceMax(maxData * 1.1);
    const xAt = (i) => pad.l + (n <= 1 ? pw / 2 : (i / (n - 1)) * pw);
    const yAt = (v) => pad.t + ph - (v / max) * ph;

    const gridN = 4;
    let grid = "";
    for (let g = 0; g <= gridN; g++) {
      const v = (max / gridN) * g;
      const y = yAt(v);
      grid += `<line class="chart__grid" x1="${pad.l}" y1="${y.toFixed(1)}" x2="${(W - pad.r).toFixed(1)}" y2="${y.toFixed(1)}"/>`;
      grid += `<text class="chart__ylabel" x="${pad.l - 10}" y="${(y + 4).toFixed(1)}" text-anchor="end">${fmtAxis(v)}</text>`;
    }

    // x labels (thin out if many)
    const everyX = n > 12 ? Math.ceil(n / 8) : 1;
    let xlabels = "";
    labels.forEach((lab, i) => {
      if (i % everyX !== 0 && i !== n - 1) return;
      xlabels += `<text class="chart__xlabel" x="${xAt(i).toFixed(1)}" y="${H - 12}" text-anchor="middle">${App.escapeHtml(lab)}</text>`;
    });

    const uid = App.uid("ln");
    let defs = "", paths = "", dots = "";
    const meta = { type: "line", pad, pw, ph, x: [], labels, series: [] };
    for (let i = 0; i < n; i++) meta.x.push(+xAt(i).toFixed(1));

    series.forEach((s, si) => {
      const color = s.color || PALETTE[si % PALETTE.length];
      const pts = s.values.map((v, i) => [xAt(i), yAt(v)]);
      const linePath = pts.map((p, i) => (i ? "L" : "M") + p[0].toFixed(1) + " " + p[1].toFixed(1)).join(" ");
      if (s.fill !== false) {
        const gid = `${uid}-g${si}`;
        defs += `<linearGradient id="${gid}" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="${color}" stop-opacity="0.22"/>
          <stop offset="100%" stop-color="${color}" stop-opacity="0"/></linearGradient>`;
        const area = `M${pts[0][0].toFixed(1)} ${(pad.t + ph).toFixed(1)} ` +
          pts.map((p) => "L" + p[0].toFixed(1) + " " + p[1].toFixed(1)).join(" ") +
          ` L${pts[pts.length - 1][0].toFixed(1)} ${(pad.t + ph).toFixed(1)} Z`;
        paths += `<path d="${area}" fill="url(#${gid})"/>`;
      }
      paths += `<path d="${linePath}" fill="none" stroke="${color}" stroke-width="${s.width || 2.6}" ${s.dashed ? 'stroke-dasharray="5 5"' : ""} stroke-linejoin="round" stroke-linecap="round"/>`;
      // end dot
      const last = pts[pts.length - 1];
      dots += `<circle cx="${last[0].toFixed(1)}" cy="${last[1].toFixed(1)}" r="3.4" fill="${color}" stroke="var(--surface)" stroke-width="2"/>`;
      meta.series.push({ name: s.name, color, y: pts.map((p) => +p[1].toFixed(1)), v: s.values, money: !!opts.money });
    });

    // focus group (crosshair) — toggled by JS
    let focusDots = series.map((s, si) => `<circle r="4.5" fill="${s.color || PALETTE[si % PALETTE.length]}" stroke="var(--surface)" stroke-width="2"/>`).join("");
    const focus = `<g class="chart__focus" opacity="0">
        <line class="chart__guide" y1="${pad.t}" y2="${pad.t + ph}"/>${focusDots}</g>`;

    return `<svg class="chart chart-interactive" data-chart='${JSON.stringify(meta)}' viewBox="0 0 ${W} ${H}" preserveAspectRatio="none" style="width:100%;height:${H}px;display:block;overflow:visible">
      <defs>${defs}</defs>${grid}${paths}${dots}${focus}${xlabels}
      <rect class="chart__hit" x="${pad.l}" y="${pad.t}" width="${pw}" height="${ph}" fill="transparent"/>
    </svg>`;
  }

  /* ---------------- Grouped / stacked bars ---------------- */
  function bars(opts) {
    const W = 760, H = opts.height || 280;
    const pad = { l: 46, r: 16, t: 16, b: 34 };
    const pw = W - pad.l - pad.r;
    const ph = H - pad.t - pad.b;
    const labels = opts.labels || [];
    const series = opts.series || [];
    const n = labels.length;
    const stacked = !!opts.stacked;
    const totals = labels.map((_, i) => series.reduce((a, s) => a + s.values[i], 0));
    const maxData = stacked ? Math.max(1, ...totals) : Math.max(1, ...series.flatMap((s) => s.values));
    const max = niceMax(maxData * 1.1);
    const yAt = (v) => pad.t + ph - (v / max) * ph;
    const band = pw / n;
    const groupW = band * 0.62;
    const x0 = (i) => pad.l + band * i + (band - groupW) / 2;

    const gridN = 4;
    let grid = "";
    for (let g = 0; g <= gridN; g++) {
      const v = (max / gridN) * g;
      const y = yAt(v);
      grid += `<line class="chart__grid" x1="${pad.l}" y1="${y.toFixed(1)}" x2="${(W - pad.r).toFixed(1)}" y2="${y.toFixed(1)}"/>`;
      grid += `<text class="chart__ylabel" x="${pad.l - 10}" y="${(y + 4).toFixed(1)}" text-anchor="end">${fmtAxis(v)}</text>`;
    }

    const meta = { type: "bar", labels, groups: [] };
    let rects = "";
    const bw = stacked ? groupW : groupW / series.length;
    for (let i = 0; i < n; i++) {
      let yStack = pad.t + ph;
      const grp = { x: x0(i) + groupW / 2, label: labels[i], items: [] };
      series.forEach((s, si) => {
        const color = s.color || PALETTE[si % PALETTE.length];
        const v = s.values[i];
        const h = (v / max) * ph;
        let x, y;
        if (stacked) {
          x = x0(i);
          yStack -= h;
          y = yStack;
        } else {
          x = x0(i) + si * bw;
          y = pad.t + ph - h;
        }
        const r = Math.min(5, bw / 2);
        rects += `<rect class="chart__bar" x="${x.toFixed(1)}" y="${y.toFixed(1)}" width="${(bw - (stacked ? 0 : 3)).toFixed(1)}" height="${Math.max(0, h).toFixed(1)}" rx="${r}" fill="${color}"><title>${App.escapeHtml(s.name)}: ${opts.money ? App.fmt.money(v) : App.fmt.num(v)}</title></rect>`;
        grp.items.push({ name: s.name, color, v, money: !!opts.money });
      });
      meta.groups.push(grp);
    }

    const everyX = n > 12 ? Math.ceil(n / 8) : 1;
    let xlabels = "";
    labels.forEach((lab, i) => {
      if (i % everyX !== 0 && i !== n - 1) return;
      xlabels += `<text class="chart__xlabel" x="${(x0(i) + groupW / 2).toFixed(1)}" y="${H - 12}" text-anchor="middle">${App.escapeHtml(lab)}</text>`;
    });

    return `<svg class="chart chart-interactive" data-chart='${JSON.stringify(meta)}' viewBox="0 0 ${W} ${H}" preserveAspectRatio="none" style="width:100%;height:${H}px;display:block;overflow:visible">
      ${grid}${rects}${xlabels}</svg>`;
  }

  /* ---------------- Donut ---------------- */
  function donut(opts) {
    const size = opts.size || 200;
    const r = size / 2;
    const thick = opts.thickness || 26;
    const inner = r - thick;
    const cx = r, cy = r;
    const data = opts.data || [];
    const total = data.reduce((a, d) => a + d.value, 0) || 1;
    let angle = 0;
    let segs = "";
    data.forEach((d, i) => {
      const frac = d.value / total;
      const a0 = angle, a1 = angle + frac * 360;
      angle = a1;
      const large = a1 - a0 > 180 ? 1 : 0;
      const [x0, y0] = polar(cx, cy, r - 1, a0);
      const [x1, y1] = polar(cx, cy, r - 1, a1);
      const [ix1, iy1] = polar(cx, cy, inner, a1);
      const [ix0, iy0] = polar(cx, cy, inner, a0);
      const color = d.color || PALETTE[i % PALETTE.length];
      const path = `M${x0.toFixed(2)} ${y0.toFixed(2)} A${r - 1} ${r - 1} 0 ${large} 1 ${x1.toFixed(2)} ${y1.toFixed(2)} L${ix1.toFixed(2)} ${iy1.toFixed(2)} A${inner} ${inner} 0 ${large} 0 ${ix0.toFixed(2)} ${iy0.toFixed(2)} Z`;
      const pct = Math.round(frac * 100);
      segs += `<path class="chart__seg" d="${path}" fill="${color}" data-tip="${App.escapeHtml(d.name)} — ${pct}%"><title>${App.escapeHtml(d.name)}: ${pct}%</title></path>`;
    });
    const center = opts.center
      ? `<text class="chart__donut-num" x="${cx}" y="${cy - 2}" text-anchor="middle">${App.escapeHtml(opts.center)}</text>
         <text class="chart__donut-sub" x="${cx}" y="${cy + 16}" text-anchor="middle">${App.escapeHtml(opts.centerSub || "")}</text>`
      : "";
    return `<svg class="chart chart--donut" viewBox="0 0 ${size} ${size}" style="width:${size}px;height:${size}px;max-width:100%">${segs}${center}</svg>`;
  }

  /* ---------------- Horizontal bars (ranking) ---------------- */
  function hbars(opts) {
    const data = opts.data || [];
    const max = Math.max(1, ...data.map((d) => d.value));
    return (
      `<div class="hbars">` +
      data
        .map((d, i) => {
          const pct = (d.value / max) * 100;
          const color = d.color || PALETTE[i % PALETTE.length];
          const val = opts.money ? App.fmt.money(d.value) : opts.pct ? App.faDigits(d.value) + "٪" : App.fmt.num(d.value);
          return `<div class="hbar">
            <div class="hbar__top"><span class="hbar__name">${App.escapeHtml(d.name)}</span><span class="hbar__val">${val}</span></div>
            <div class="hbar__track"><div class="hbar__fill" style="width:${pct.toFixed(1)}%;background:${color}"></div></div>
          </div>`;
        })
        .join("") +
      `</div>`
    );
  }

  /* ---------------- Funnel ---------------- */
  function funnel(opts) {
    const data = opts.data || [];
    const max = Math.max(1, ...data.map((d) => d.value));
    return (
      `<div class="funnel">` +
      data
        .map((d, i) => {
          const pct = (d.value / max) * 100;
          const conv = i === 0 ? 100 : (d.value / data[i - 1].value) * 100;
          const color = PALETTE[0];
          return `<div class="funnel__row" data-tip="${App.escapeHtml(d.stage)} — ${App.fmt.num(d.value)}">
            <div class="funnel__label"><span>${App.escapeHtml(d.stage)}</span><span class="funnel__val">${App.fmt.num(d.value)}</span></div>
            <div class="funnel__track"><div class="funnel__fill" style="width:${pct.toFixed(1)}%;opacity:${(1 - i * 0.13).toFixed(2)};background:${color}"></div></div>
            <div class="funnel__conv">${i === 0 ? "—" : App.faDigits(conv.toFixed(0)) + "٪ نسبت به مرحلهٔ قبل"}</div>
          </div>`;
        })
        .join("") +
      `</div>`
    );
  }

  /* ---------------- Sparkline ---------------- */
  function sparkline(values, opts = {}) {
    const W = opts.width || 120, H = opts.height || 36;
    const color = opts.color || "#4F46E5";
    const max = Math.max(...values), min = Math.min(...values);
    const span = max - min || 1;
    const xAt = (i) => (i / (values.length - 1)) * W;
    const yAt = (v) => H - 3 - ((v - min) / span) * (H - 6);
    const pts = values.map((v, i) => [xAt(i), yAt(v)]);
    const line = pts.map((p, i) => (i ? "L" : "M") + p[0].toFixed(1) + " " + p[1].toFixed(1)).join(" ");
    const area = `M0 ${H} ` + pts.map((p) => "L" + p[0].toFixed(1) + " " + p[1].toFixed(1)).join(" ") + ` L${W} ${H} Z`;
    const gid = App.uid("sp");
    return `<svg class="spark" viewBox="0 0 ${W} ${H}" preserveAspectRatio="none" style="width:${opts.css ? opts.css : W + "px"};height:${H}px;display:block">
      <defs><linearGradient id="${gid}" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="${color}" stop-opacity="0.28"/><stop offset="100%" stop-color="${color}" stop-opacity="0"/></linearGradient></defs>
      <path d="${area}" fill="url(#${gid})"/>
      <path d="${line}" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>`;
  }

  /* ---------------- Radial gauge ---------------- */
  function gauge(opts) {
    const size = opts.size || 160;
    const value = App.clamp(opts.value || 0, 0, 100);
    const r = size / 2 - 12;
    const cx = size / 2, cy = size / 2;
    const circ = 2 * Math.PI * r;
    const color = opts.color || "#4F46E5";
    return `<svg class="chart chart--gauge" viewBox="0 0 ${size} ${size}" style="width:${size}px;height:${size}px;max-width:100%">
      <circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="var(--track)" stroke-width="12"/>
      <circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="${color}" stroke-width="12" stroke-linecap="round"
        stroke-dasharray="${circ.toFixed(1)}" stroke-dashoffset="${(circ * (1 - value / 100)).toFixed(1)}"
        transform="rotate(-90 ${cx} ${cy})"/>
      <text class="chart__gauge-num" x="${cx}" y="${cy - 2}" text-anchor="middle">${opts.label || value + "%"}</text>
      <text class="chart__gauge-sub" x="${cx}" y="${cy + 18}" text-anchor="middle">${App.escapeHtml(opts.sub || "")}</text>
    </svg>`;
  }

  /* ---------------- Cohort heatmap ---------------- */
  function heatmap(opts) {
    const rows = opts.rows || [];
    const cols = opts.cols || 6;
    const head = `<div class="heat__row heat__row--head"><div class="heat__rh"></div>${App.range(cols)
      .map((c) => `<div class="heat__cell heat__cell--head">ماه ${App.faDigits(c)}</div>`)
      .join("")}</div>`;
    const body = rows
      .map((row) => {
        const cells = App.range(cols)
          .map((c) => {
            const v = row.vals[c];
            if (v == null) return `<div class="heat__cell heat__cell--empty"></div>`;
            const alpha = (v / 100) * 0.92 + 0.06;
            return `<div class="heat__cell" style="background:rgba(79,70,229,${alpha.toFixed(2)});color:${v > 55 ? "#fff" : "var(--text)"}" data-tip="${row.label} · ماه ${App.faDigits(c)}: ${App.faDigits(v)}٪">${App.faDigits(v)}٪</div>`;
          })
          .join("");
        return `<div class="heat__row"><div class="heat__rh">${App.escapeHtml(row.label)}</div>${cells}</div>`;
      })
      .join("");
    return `<div class="heat">${head}${body}</div>`;
  }

  /* ---------------- Legend ---------------- */
  function legend(items) {
    return (
      `<div class="legend">` +
      items
        .map(
          (it) =>
            `<span class="legend__item"><span class="legend__dot" style="background:${it.color}"></span>${App.escapeHtml(it.name)}</span>`
        )
        .join("") +
      `</div>`
    );
  }

  /* ---------------- Crosshair tooltip binding ---------------- */
  function bind(root) {
    const tip = ensureTip();
    App.qsa(".chart-interactive", root).forEach((svg) => {
      if (svg.__bound) return;
      svg.__bound = true;
      let meta;
      try {
        meta = JSON.parse(svg.dataset.chart);
      } catch (e) {
        return;
      }
      const focus = svg.querySelector(".chart__focus");
      const guide = svg.querySelector(".chart__guide");
      const dots = focus ? Array.from(focus.querySelectorAll("circle")) : [];

      const toSvg = (evt) => {
        const pt = svg.createSVGPoint();
        pt.x = evt.clientX;
        pt.y = evt.clientY;
        const ctm = svg.getScreenCTM();
        return ctm ? pt.matrixTransform(ctm.inverse()) : { x: 0, y: 0 };
      };

      const move = (e) => {
        const p = toSvg(e);
        let idx = 0;
        if (meta.type === "line") {
          // nearest x
          let best = Infinity;
          meta.x.forEach((xx, i) => {
            const d = Math.abs(xx - p.x);
            if (d < best) { best = d; idx = i; }
          });
          if (focus) {
            focus.setAttribute("opacity", "1");
            const gx = meta.x[idx];
            guide.setAttribute("x1", gx);
            guide.setAttribute("x2", gx);
            meta.series.forEach((s, si) => {
              if (dots[si]) {
                dots[si].setAttribute("cx", gx);
                dots[si].setAttribute("cy", s.y[idx]);
              }
            });
          }
          const rows = meta.series
            .map(
              (s) =>
                `<div class="tip__row"><span class="tip__dot" style="background:${s.color}"></span><span class="tip__name">${App.escapeHtml(s.name)}</span><span class="tip__val">${s.money ? App.fmt.money(s.v[idx]) : App.fmt.num(s.v[idx])}</span></div>`
            )
            .join("");
          tip.innerHTML = `<div class="tip__title">${App.escapeHtml(meta.labels[idx] || "")}</div>${rows}`;
        } else if (meta.type === "bar") {
          let best = Infinity;
          meta.groups.forEach((g, i) => {
            const d = Math.abs(g.x - p.x);
            if (d < best) { best = d; idx = i; }
          });
          const g = meta.groups[idx];
          const rows = g.items
            .map(
              (it) =>
                `<div class="tip__row"><span class="tip__dot" style="background:${it.color}"></span><span class="tip__name">${App.escapeHtml(it.name)}</span><span class="tip__val">${it.money ? App.fmt.money(it.v) : App.fmt.num(it.v)}</span></div>`
            )
            .join("");
          tip.innerHTML = `<div class="tip__title">${App.escapeHtml(g.label)}</div>${rows}`;
        }
        showTip(tip, e);
      };
      const leave = () => {
        if (focus) focus.setAttribute("opacity", "0");
        hideTip(tip);
      };
      svg.addEventListener("mousemove", move);
      svg.addEventListener("mouseleave", leave);
    });
  }

  /* shared floating tooltip element */
  function ensureTip() {
    let tip = document.getElementById("chart-tip");
    if (!tip) {
      tip = document.createElement("div");
      tip.id = "chart-tip";
      tip.className = "chart-tip";
      document.body.appendChild(tip);
    }
    return tip;
  }
  function showTip(tip, e) {
    tip.classList.add("is-on");
    const pad = 14;
    const rect = tip.getBoundingClientRect();
    let x = e.clientX + pad;
    let y = e.clientY + pad;
    if (x + rect.width > window.innerWidth - 8) x = e.clientX - rect.width - pad;
    if (y + rect.height > window.innerHeight - 8) y = e.clientY - rect.height - pad;
    tip.style.left = x + "px";
    tip.style.top = y + "px";
  }
  function hideTip(tip) {
    tip.classList.remove("is-on");
  }

  App.charts = { areaLine, bars, donut, hbars, funnel, sparkline, gauge, heatmap, legend, bind, PALETTE };
})(window.App);
