// Sonnenklar Widgets für Scriptable (12 Designs)
// Widget lange drücken, "Widget bearbeiten", bei "Parameter" eintragen:
//   Klein:  S1 Routine, S2 Nächster Schritt, S3 Top 3, S4 Serie und Wasser
//   Mittel: M1 Routine, M2 Dein Tag, M3 Essen heute, M4 Serie
//   Groß:   L1 Tagesübersicht, L2 Routine komplett, L3 Wochenplan, L4 Rezept des Tages
// Ohne Parameter: S1, M1 oder L1. Groß- und Kleinschreibung egal. Neuen Stand holst du in der App mit "Widgets aktualisieren".
const EMBED = /*DATA*/null;

const fm = FileManager.local();
const FILE = fm.joinPath(fm.documentsDirectory(), "sonnenklar-widget.json");
const qp = args.queryParameters || {};
if (qp.data) fm.writeString(FILE, qp.data);
let D = EMBED;
try { if (fm.fileExists(FILE)) { const f = JSON.parse(fm.readString(FILE)); if (!D || f.ts > D.ts) D = f; } } catch (e) {}
if (!D) D = { r: { m: [], e: [] }, top: [], week: [[], [], [], [], [], [], []], rec: {}, heat: [], eve: 15, wg: 8, kg: 2300, sm: 0, se: 0 };

/* ---------- Stand von heute ---------- */
const NOW = (typeof PREVIEW_NOW !== "undefined" && PREVIEW_NOW) ? PREVIEW_NOW : new Date();
const pad = n => String(n).padStart(2, "0");
const LD = new Date(NOW.getTime() - 4 * 36e5);
const TODAY = LD.getFullYear() + "-" + pad(LD.getMonth() + 1) + "-" + pad(LD.getDate());
const fresh = D.day === TODAY;
const HR = NOW.getHours();
const isE = HR >= (D.eve || 15) || HR < 4;
const steps = (D.r[isE ? "e" : "m"] || []).map(s => ({ t: s[0], d: fresh && !!s[1], min: s[2] || 0 }));
const done = steps.filter(s => s.d).length, total = steps.length, P = total ? done / total : 0;
const mood = P >= 1 ? "happy" : P > 0 ? "ok" : "sleepy";
const nextStep = steps.find(s => !s.d);
const top = fresh ? (D.top || []) : [];
const water = fresh ? (D.w || 0) : 0, WG = D.wg || 8;
const kcal = fresh ? (D.kcal || 0) : 0;
const WDI = (LD.getDay() + 6) % 7;
const meals = D.week[WDI] || [];
const RNAME = isE ? "Abendroutine" : "Morgenroutine";
const nf = n => Math.round(n).toLocaleString("de-DE");
const LINES = isE
  ? [["Runterfahren. Schritt für Schritt."], ["Fast im Bett. Weiter so."], ["Alles erledigt. Gute Nacht!"]]
  : [["Erst Wasser, dann Welt."], ["Stark angefangen. Dranbleiben!"], ["Morgen gewonnen. Boss-Modus an."]];
const LINE = LINES[P >= 1 ? 2 : P > 0 ? 1 : 0][0];

/* ---------- Farben ---------- */
const C = (h, a) => new Color(h, a == null ? 1 : a);
const ACC = C("#f45d2f"), INK = C("#16181c"), CREAM = C("#fafaf7"), SOFT = C("#ffe6d3"), NIGHT = C("#1d1f2a"), MOON = C("#f1eee6");
const LIGHT = { bg: CREAM, fg: INK, sub: C("#16181c", 0.55), card: C("#16181c", 0.06), acc: ACC, mark: INK, body: ACC, ring: C("#16181c", 0.1) };
const DARK = { bg: NIGHT, fg: MOON, sub: C("#f1eee6", 0.6), card: C("#ffffff", 0.08), acc: ACC, mark: INK, body: ACC, ring: C("#ffffff", 0.14) };
const SUNNY = { bg: ACC, fg: INK, sub: C("#16181c", 0.62), card: C("#16181c", 0.1), acc: INK, mark: ACC, body: SOFT, ring: C("#16181c", 0.16) };
const INKY = { bg: INK, fg: CREAM, sub: C("#fafaf7", 0.6), card: C("#ffffff", 0.08), acc: ACC, mark: INK, body: ACC, ring: C("#ffffff", 0.14) };
const BASE = isE ? DARK : LIGHT, HERO = isE ? DARK : SUNNY;

/* ---------- Zeichnen ---------- */
function canvas(w, h) { const d = new DrawContext(); d.size = new Size(w, h); d.opaque = false; d.respectScreenScale = true; return d; }
const pt = (x, y) => new Point(x, y);
function stroke(d, path, col, lw) { d.addPath(path); d.setStrokeColor(col); d.setLineWidth(lw); d.strokePath(); }
function fill(d, path, col) { d.addPath(path); d.setFillColor(col); d.fillPath(); }

function sunImg(pal, md, night, px) {
  const d = canvas(px, px), s = px / 100, P2 = (x, y) => pt(x * s, y * s);
  const dot = (x, y, r, col) => { d.setFillColor(col); d.fillEllipse(new Rect((x - r) * s, (y - r) * s, 2 * r * s, 2 * r * s)); };
  if (!night) for (let i = 0; i < 8; i++) {
    const a = i * Math.PI / 4;
    for (const r of [36, 40, 44]) dot(50 + Math.sin(a) * r, 52 - Math.cos(a) * r, 3.5, pal.body);
  }
  dot(50, 52, 29, pal.body);
  d.setFillColor(C("#ffffff", 0.28)); d.fillEllipse(new Rect(30 * s, 33 * s, 18 * s, 11 * s));
  if (night) {
    const cap = new Path(); cap.move(P2(24, 42)); cap.addQuadCurve(P2(76, 20), P2(32, 6)); cap.addQuadCurve(P2(74, 41), P2(66, 28)); cap.closeSubpath();
    fill(d, cap, C("#2b2f45"));
    const band = new Path(); band.move(P2(23.5, 42.5)); band.addQuadCurve(P2(75, 41), P2(50, 31)); stroke(d, band, MOON, 5.5 * s);
    dot(77, 19, 5.5, MOON);
  }
  const eye = new Path();
  if (md === "ok") { dot(41, 50, 3.8, INK); dot(59, 50, 3.8, INK); }
  else {
    const dy = md === "happy" ? -7 : 4.5, y = md === "happy" ? 52 : 51;
    eye.move(P2(35.5, y)); eye.addQuadCurve(P2(46.5, y), P2(41, y + dy));
    eye.move(P2(53.5, y)); eye.addQuadCurve(P2(64.5, y), P2(59, y + dy));
    stroke(d, eye, INK, 3.3 * s);
  }
  const mouth = new Path();
  if (md === "happy") { mouth.move(P2(40.5, 58.5)); mouth.addQuadCurve(P2(59.5, 58.5), P2(50, 72.5)); mouth.closeSubpath(); fill(d, mouth, INK); }
  else if (md === "ok") { mouth.move(P2(43, 60.5)); mouth.addQuadCurve(P2(57, 60.5), P2(50, 67)); stroke(d, mouth, INK, 3.2 * s); }
  else dot(50, 63.5, 2.8, INK);
  dot(33.5, 59, 4.2, C("#ffffff", 0.3)); dot(66.5, 59, 4.2, C("#ffffff", 0.3));
  return d.getImage();
}
function checkImg(on, pal, px) {
  const d = canvas(px, px), lw = Math.max(1.5, px * 0.11);
  if (on) {
    d.setFillColor(pal.acc); d.fillEllipse(new Rect(0, 0, px, px));
    const p = new Path(); p.move(pt(px * 0.28, px * 0.52)); p.addLine(pt(px * 0.44, px * 0.67)); p.addLine(pt(px * 0.73, px * 0.36));
    stroke(d, p, pal.mark, lw * 1.15);
  } else { d.setStrokeColor(pal.sub); d.setLineWidth(lw); d.strokeEllipse(new Rect(lw / 2, lw / 2, px - lw, px - lw)); }
  return d.getImage();
}
function barImg(p, w, h, pal) {
  const d = canvas(w, h), r = h / 2;
  const t = new Path(); t.addRoundedRect(new Rect(0, 0, w, h), r, r); fill(d, t, pal.ring);
  if (p > 0) { const f = new Path(); f.addRoundedRect(new Rect(0, 0, Math.max(h, w * Math.min(1, p)), h), r, r); fill(d, f, pal.acc); }
  return d.getImage();
}
function ringImg(p, px, pal, label, sub) {
  const d = canvas(px, px), lw = px * 0.11, c = px / 2, r = c - lw / 2;
  const arc = (to, col) => {
    const path = new Path(), n = 72;
    for (let i = 0; i <= n; i++) { const a = to * i / n, q = pt(c + r * Math.sin(a), c - r * Math.cos(a)); if (i) path.addLine(q); else path.move(q); }
    stroke(d, path, col, lw);
  };
  arc(Math.PI * 2, pal.ring);
  if (p > 0) arc(Math.PI * 2 * Math.min(1, p), pal.acc);
  if (label) { d.setFont(Font.heavySystemFont(px * 0.25)); d.setTextColor(pal.fg); d.setTextAlignedCenter(); d.drawTextInRect(label, new Rect(0, c - px * (sub ? 0.21 : 0.15), px, px * 0.32)); }
  if (sub) { d.setFont(Font.semiboldSystemFont(px * 0.12)); d.setTextColor(pal.sub); d.setTextAlignedCenter(); d.drawTextInRect(sub, new Rect(0, c + px * 0.07, px, px * 0.2)); }
  return d.getImage();
}
function dropsImg(n, goal, w, h, pal) {
  const d = canvas(w, h), gap = 4, gw = Math.min(14, (w - gap * (goal - 1)) / goal);
  for (let i = 0; i < goal; i++) {
    const x = i * (gw + gap), o = new Path();
    o.addRoundedRect(new Rect(x + 0.75, 0.75, gw - 1.5, h - 1.5), 4, 4); stroke(d, o, C("#f45d2f", 0.55), 1.5);
    if (i < n) { const f = new Path(); f.addRoundedRect(new Rect(x + 2.5, h * 0.28, gw - 5, h * 0.72 - 2.5), 2.5, 2.5); fill(d, f, ACC); }
  }
  return d.getImage();
}
function heatImg(cells, w, pal) {
  const gap = 4, cw = (w - gap * 6) / 7, h = cw * 2 + gap, d = canvas(w, h);
  const col = v => v === 2 ? ACC : v === 1 ? C("#f45d2f", 0.4) : pal.ring;
  for (let i = 0; i < 14; i++) {
    const x = (i % 7) * (cw + gap), y = Math.floor(i / 7) * (cw + gap), c = cells[i] || [0, 0];
    const a = new Path(); a.addRoundedRect(new Rect(x, y, cw, cw / 2 - 0.5), 3, 3); fill(d, a, col(c[0]));
    const b = new Path(); b.addRoundedRect(new Rect(x, y + cw / 2 + 0.5, cw, cw / 2 - 0.5), 3, 3); fill(d, b, col(c[1]));
  }
  return { img: d.getImage(), h };
}

/* ---------- Bausteine ---------- */
const w = new ListWidget();
function T(st, s, size, wt, color, lines) {
  const t = st.addText(String(s));
  t.font = wt === "heavy" ? Font.heavySystemFont(size) : wt === "bold" ? Font.boldSystemFont(size) : wt === "med" ? Font.mediumSystemFont(size) : wt === "reg" ? Font.systemFont(size) : Font.semiboldSystemFont(size);
  t.textColor = color; t.lineLimit = lines == null ? 1 : lines; t.minimumScaleFactor = 0.75;
  return t;
}
function I(st, img, iw, ih) { const i = st.addImage(img); i.imageSize = new Size(iw, ih == null ? iw : ih); return i; }
function H(p, gap) { const s = p.addStack(); s.layoutHorizontally(); s.centerAlignContent(); if (gap) s.spacing = gap; return s; }
function V(p, gap) { const s = p.addStack(); s.layoutVertically(); if (gap) s.spacing = gap; return s; }
function center(p, width, build) { const s = H(p); s.size = new Size(width, 0); s.addSpacer(); build(s); s.addSpacer(); return s; }
function checkRow(p, label, on, pal, size, lines) { const r = H(p, 7); I(r, checkImg(on, pal, size + 3), size + 3);T(r, label, size, "semi", on ? pal.sub : pal.fg, lines || 1); return r; }
function setup(pal, t, l) { if (l == null) l = t; w.backgroundColor = pal.bg; w.setPadding(t, l, t, l); }
const greet = HR < 11 ? "Guten Morgen" : HR < 17 ? "Hallo" : "Guten Abend";
const dish = () => {
  const order = HR < 10 ? [0, 1, 2] : HR < 14 ? [1, 2, 0] : [2, 1, 0];
  for (const k of order) { const m = meals[k]; if (m && m[2] && D.rec[m[2]]) return Object.assign({ slot: ["Frühstück", "Mittag", "Abend"][k] }, D.rec[m[2]]); }
  return null;
};

/* ---------- 12 Designs ---------- */
const DESIGNS = {
  s1() {
    const pal = HERO; setup(pal, 14);
    const h = H(w); I(h, sunImg(pal, mood, isE, 52), 48); h.addSpacer(); T(h, done + "/" + total, 22, "heavy", pal.fg);
    w.addSpacer();
    T(w, RNAME, 13, "bold", pal.fg); w.addSpacer(5);
    I(w, barImg(P, 130, 7, pal), 130, 7); w.addSpacer(6);
    T(w, P >= 1 ? (isE ? "Gute Nacht!" : "Alles geschafft!") : nextStep ? "Als Nächstes: " + nextStep.t : "Leg deine Routine an.", 11, "med", pal.sub, 2);
  },
  s2() {
    const pal = BASE; setup(pal, 14);
    T(w, P >= 1 ? "Geschafft" : "Als Nächstes", 11, "bold", ACC); w.addSpacer(4);
    if (P >= 1) { I(w, sunImg(pal, "happy", isE, 56), 56); w.addSpacer(2); T(w, isE ? "Abend erledigt." : "Morgen erledigt.", 15, "heavy", pal.fg, 2); }
    else T(w, nextStep ? nextStep.t : "Leg deine Routine an", 19, "heavy", pal.fg, 3);
    w.addSpacer();
    const r = H(w, 8); I(r, ringImg(P, 30, pal), 30);
    const v = V(r); T(v, done + " von " + total, 12, "bold", pal.fg); T(v, nextStep && nextStep.min && P < 1 ? "ca. " + nextStep.min + " Min" : RNAME, 10, "med", pal.sub);
  },
  s3() {
    const pal = BASE; setup(pal, 14);
    const h = H(w); T(h, "Top 3", 15, "heavy", pal.fg); h.addSpacer(); T(h, top.filter(t => t[1]).length + "/" + (top.length || 3), 12, "bold", pal.sub);
    w.addSpacer(8);
    if (!top.length) T(w, "Was bringt dich heute weiter? Leg es in Sonnenklar fest.", 12, "med", pal.sub, 4);
    else top.slice(0, 3).forEach(t => { checkRow(w, t[0], !!t[1], pal, 12, 2); w.addSpacer(6); });
    w.addSpacer();
  },
  s4() {
    const pal = INKY; setup(pal, 14);
    const h = H(w, 4); T(h, "🔥", 22, "reg", pal.fg); T(h, String(D.sm || 0), 34, "heavy", ACC);
    T(w, (D.sm === 1 ? "Tag" : "Tage") + " Morgenroutine", 11, "semi", pal.sub);
    w.addSpacer();
    T(w, "Wasser " + water + "/" + WG, 11, "bold", pal.fg); w.addSpacer(5);
    I(w, dropsImg(water, WG, 130, 18, pal), 130, 18);
  },
  m1() {
    const pal = HERO; setup(pal, 14, 16);
    const row = H(w, 10); row.topAlignContent();
    const left = V(row); T(left, (isE ? "🌙 " : "☀️ ") + RNAME, 15, "heavy", pal.fg); left.addSpacer(8);
    steps.slice(0, 4).forEach(s => { checkRow(left, s.t, s.d, pal, 12.5); left.addSpacer(5); });
    if (steps.length > 4) T(left, "+ " + (steps.length - 4) + " weitere", 10, "med", pal.sub);
    if (!steps.length) T(left, "Leg deine Routine in der App an.", 12, "med", pal.sub, 2);
    row.addSpacer();
    const right = V(row); right.size = new Size(84, 0);
    center(right, 84, s => I(s, sunImg(pal, mood, isE, 76), 76)); right.addSpacer(2);
    center(right, 84, s => T(s, done + "/" + total, 20, "heavy", pal.fg));
  },
  m2() {
    const pal = BASE; setup(pal, 14, 16);
    const row = H(w, 14);
    I(row, ringImg(P, 96, pal, done + "/" + total, isE ? "Abend" : "Morgen"), 96);
    const r = V(row); T(r, "Dein Tag", 15, "heavy", pal.fg); r.addSpacer(7);
    if (top.length) top.slice(0, 3).forEach(t => { checkRow(r, t[0], !!t[1], pal, 12); r.addSpacer(5); });
    else if (nextStep) { T(r, "Als Nächstes", 10, "bold", pal.sub); r.addSpacer(2); T(r, nextStep.t, 13, "semi", pal.fg, 2); r.addSpacer(5); }
    else { T(r, "Top 3 noch leer.", 12, "med", pal.sub); r.addSpacer(5); }
    r.addSpacer(2);
    T(r, "💧 " + water + "/" + WG + "   🔥 " + (D.sm || 0) + " Tage", 11, "semi", pal.sub);
    row.addSpacer();
  },
  m3() {
    const pal = BASE; setup(pal, 14, 16);
    const h = H(w); T(h, "Essen heute", 15, "heavy", pal.fg); h.addSpacer(); T(h, nf(kcal) + " / " + nf(D.kg || 2300) + " kcal", 11, "bold", pal.sub);
    w.addSpacer(8);
    const row = H(w, 8); row.topAlignContent();
    ["Frühstück", "Mittag", "Abend"].forEach((lab, i) => {
      const m = meals[i] || [];
      const c = V(row, 2); c.backgroundColor = pal.card; c.cornerRadius = 14; c.setPadding(8, 9, 8, 9); c.size = new Size(96, 94);
      T(c, m[0] || "🍽️", 22, "reg", pal.fg); T(c, lab, 9.5, "bold", pal.sub); T(c, m[1] || "Noch frei", 11, "semi", m[1] ? pal.fg : pal.sub, 2); c.addSpacer();
    });
  },
  m4() {
    const pal = INKY; setup(pal, 14, 16);
    const row = H(w, 14);
    const left = V(row); const h = H(left, 4); T(h, "🔥", 24, "reg", pal.fg); T(h, String(D.sm || 0), 40, "heavy", ACC);
    T(left, "Tage Morgenroutine", 11, "semi", pal.sub); T(left, "Abend: " + (D.se || 0) + " Tage", 11, "semi", pal.sub);
    row.addSpacer();
    const right = V(row); right.size = new Size(160, 0);
    T(right, "Letzte 14 Tage", 10, "bold", pal.sub); right.addSpacer(5);
    const hm = heatImg(D.heat || [], 160, pal); I(right, hm.img, 160, hm.h); right.addSpacer(6);
    T(right, LINE, 11, "semi", pal.fg, 2);
  },
  l1() {
    const pal = BASE; setup(pal, 16);
    const h = H(w, 10); I(h, sunImg(pal, mood, isE, 46), 46);
    const t = V(h); T(t, greet + (D.name ? ", " + D.name : ""), 17, "heavy", pal.fg);
    T(t, NOW.toLocaleDateString("de-DE", { weekday: "long", day: "numeric", month: "long" }), 11, "semi", pal.sub);
    w.addSpacer(12);
    const rh = H(w); T(rh, RNAME, 13, "bold", pal.fg); rh.addSpacer(); T(rh, done + "/" + total, 12, "bold", pal.sub);
    w.addSpacer(5); I(w, barImg(P, 306, 6, pal), 306, 6); w.addSpacer(7);
    steps.slice(0, 4).forEach(s => { checkRow(w, s.t, s.d, pal, 12); w.addSpacer(4); });
    w.addSpacer(8);
    const th = H(w); T(th, "Top 3", 13, "bold", pal.fg); th.addSpacer(); T(th, top.filter(x => x[1]).length + "/" + (top.length || 3), 12, "bold", pal.sub);
    w.addSpacer(5);
    if (top.length) top.slice(0, 3).forEach(x => { checkRow(w, x[0], !!x[1], pal, 12); w.addSpacer(4); });
    else { T(w, "Noch leer. Was bringt dich heute weiter?", 12, "med", pal.sub); w.addSpacer(4); }
    w.addSpacer(8);
    const mr = H(w, 6);
    [0, 1, 2].forEach(i => { const m = meals[i] || []; const c = H(mr, 5); c.size = new Size(98, 30); c.backgroundColor = pal.card; c.cornerRadius = 10; c.setPadding(0, 7, 0, 7); T(c, m[0] || "🍽️", 15, "reg", pal.fg); T(c, m[1] || "Noch frei", 10.5, "semi", m[1] ? pal.fg : pal.sub); c.addSpacer(); });
    w.addSpacer();
    const b = H(w, 8); I(b, dropsImg(water, WG, 150, 16, pal), 150, 16); T(b, water + "/" + WG, 11, "bold", pal.sub); b.addSpacer();
    if (D.ts) T(b, "Stand " + new Date(D.ts).toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" }), 10, "med", pal.sub);
  },
  l2() {
    const pal = HERO; setup(pal, 16);
    const h = H(w, 12); I(h, sunImg(pal, mood, isE, 62), 62);
    const t = V(h, 2); T(t, RNAME, 19, "heavy", pal.fg); T(t, done + " von " + total + " erledigt", 12, "semi", pal.sub);
    w.addSpacer(10); I(w, barImg(P, 306, 8, pal), 306, 8); w.addSpacer(12);
    steps.slice(0, 8).forEach(s => {
      const r = checkRow(w, s.t, s.d, pal, 13.5); r.addSpacer();
      if (s.min) T(r, s.min + " Min", 11, "bold", pal.sub);
      w.addSpacer(8);
    });
    if (steps.length > 8) T(w, "+ " + (steps.length - 8) + " weitere", 11, "med", pal.sub);
    w.addSpacer();
    T(w, LINE, 12, "semi", pal.fg, 2);
  },
  l3() {
    const pal = BASE; setup(pal, 16);
    const h = H(w); T(h, "Wochenplan", 17, "heavy", pal.fg); h.addSpacer(); T(h, "Früh  Mittag  Abend", 10, "bold", pal.sub);
    w.addSpacer(10);
    ["Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"].forEach((dn, i) => {
      const r = H(w, 6);
      const d = H(r); d.size = new Size(30, 28); d.cornerRadius = 9; if (i === WDI) d.backgroundColor = ACC;
      d.addSpacer(); T(d, dn, 11, "heavy", i === WDI ? INK : pal.fg); d.addSpacer();
      [0, 1, 2].forEach(k => {
        const m = (D.week[i] || [])[k] || [];
        const c = H(r, 4); c.size = new Size(86, 28); c.backgroundColor = pal.card; c.cornerRadius = 9; c.setPadding(0, 6, 0, 6);
        T(c, m[0] || "", 12, "reg", pal.fg); T(c, m[1] || "frei", 10, "semi", m[1] ? pal.fg : pal.sub); c.addSpacer();
      });
      w.addSpacer(5);
    });
    w.addSpacer();
  },
  l4() {
    const pal = BASE; setup(pal, 16);
    const R = dish();
    if (!R) { T(w, "Rezept des Tages", 17, "heavy", pal.fg); w.addSpacer(6); T(w, "Plan ein Rezept in Sonnenklar, dann steht es hier mit allen Zutaten.", 13, "med", pal.sub, 3); w.addSpacer(); return; }
    const h = H(w, 12);
    const e = H(h); e.size = new Size(74, 74); e.cornerRadius = 20; e.backgroundColor = C("#f45d2f", 0.16); e.addSpacer(); T(e, R.e, 38, "reg", pal.fg); e.addSpacer();
    const v = V(h, 2); T(v, R.slot, 11, "bold", ACC); T(v, R.t, 17, "heavy", pal.fg, 2);
    T(v, [R.min ? R.min + " Min" : "", R.kcal ? "ca. " + R.kcal + " kcal" : "", R.p ? R.p + " g Protein" : ""].filter(Boolean).join("   "), 11, "semi", pal.sub);
    w.addSpacer(14); T(w, "Zutaten", 13, "heavy", pal.fg); w.addSpacer(6);
    (R.ing || []).slice(0, 8).forEach(i => { const r = H(w, 8); const a = H(r); a.size = new Size(62, 0); T(a, i[0] || "", 12, "bold", ACC); a.addSpacer(); T(r, i[1], 12, "semi", pal.fg); w.addSpacer(4); });
    w.addSpacer();
  }
};

const fam = config.widgetFamily || "medium";
if (fam.indexOf("accessory") === 0) {
  T(w, (isE ? "Abend " : "Morgen ") + done + "/" + total, 13, "bold", Color.white());
  T(w, nextStep ? nextStep.t : "Alles erledigt", 12, "reg", Color.white(), 2);
} else {
  const param = String(args.widgetParameter || "").trim().toLowerCase();
  const def = fam === "small" ? "s1" : fam === "large" ? "l1" : "m1";
  (DESIGNS[param] || DESIGNS[def])();
}
w.refreshAfterDate = new Date(Date.now() + 15 * 60 * 1000);
if (config.runsInWidget) Script.setWidget(w);
else if (qp.data) { const a = new Alert(); a.title = "Widgets aktualisiert"; a.message = "Deine Sonnenklar-Widgets zeigen gleich den neuen Stand."; a.addAction("Super"); await a.present(); }
else await w.presentMedium();
Script.complete();
