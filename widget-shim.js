/* Nachbau der Scriptable-API im Browser, damit die Galerie genau das echte Widget-Skript rendert.
   Deckt nur ab, was widget-scriptable.js benutzt. Maße in iOS-Punkten. */
(() => {
'use strict';
const FONT = '-apple-system, "SF Pro Text", "Segoe UI", system-ui, sans-serif';

class Color {
  constructor(hex, a = 1) { this.hex = String(hex).replace('#', ''); this.alpha = a; }
  static white() { return new Color('ffffff'); }
  static black() { return new Color('000000'); }
  css() { const h = this.hex, n = i => parseInt(h.slice(i, i + 2), 16); return `rgba(${n(0)},${n(2)},${n(4)},${this.alpha})`; }
}
class Font {
  constructor(w, s) { this.w = w; this.s = s; }
  static systemFont(s) { return new Font(400, s); }
  static mediumSystemFont(s) { return new Font(500, s); }
  static semiboldSystemFont(s) { return new Font(600, s); }
  static boldSystemFont(s) { return new Font(700, s); }
  static heavySystemFont(s) { return new Font(800, s); }
  css() { return `${this.w} ${this.s}px ${FONT}`; }
}
class Size { constructor(w, h) { this.width = w; this.height = h; } }
class Point { constructor(x, y) { this.x = x; this.y = y; } }
class Rect { constructor(x, y, w, h) { this.x = x; this.y = y; this.width = w; this.height = h; } }
class Path {
  constructor() { this.ops = []; }
  move(p) { this.ops.push(c => c.moveTo(p.x, p.y)); }
  addLine(p) { this.ops.push(c => c.lineTo(p.x, p.y)); }
  addQuadCurve(p, k) { this.ops.push(c => c.quadraticCurveTo(k.x, k.y, p.x, p.y)); }
  addCurve(p, k1, k2) { this.ops.push(c => c.bezierCurveTo(k1.x, k1.y, k2.x, k2.y, p.x, p.y)); }
  closeSubpath() { this.ops.push(c => c.closePath()); }
  addRect(r) { this.ops.push(c => c.rect(r.x, r.y, r.width, r.height)); }
  addRoundedRect(r, cw) { this.ops.push(c => c.roundRect(r.x, r.y, r.width, r.height, Math.min(cw, r.width / 2, r.height / 2))); }
  addEllipse(r) { this.ops.push(c => c.ellipse(r.x + r.width / 2, r.y + r.height / 2, r.width / 2, r.height / 2, 0, 0, Math.PI * 2)); }
}
class DrawContext {
  constructor() { this.size = new Size(100, 100); this.opaque = true; this.respectScreenScale = false; this._fill = '#000'; this._stroke = '#000'; this._lw = 1; this._font = Font.systemFont(12); this._tc = '#000'; this._al = 'left'; }
  get c() {
    if (!this._c) { const s = 3, cv = document.createElement('canvas'); cv.width = Math.ceil(this.size.width * s); cv.height = Math.ceil(this.size.height * s); this._cv = cv; this._c = cv.getContext('2d'); this._c.scale(s, s); this._c.lineCap = 'butt'; this._c.lineJoin = 'miter'; }
    return this._c;
  }
  setFillColor(col) { this._fill = col.css(); }
  setStrokeColor(col) { this._stroke = col.css(); }
  setLineWidth(w) { this._lw = w; }
  fillRect(r) { this.c.fillStyle = this._fill; this.c.fillRect(r.x, r.y, r.width, r.height); }
  fillEllipse(r) { const c = this.c; c.beginPath(); c.ellipse(r.x + r.width / 2, r.y + r.height / 2, r.width / 2, r.height / 2, 0, 0, Math.PI * 2); c.fillStyle = this._fill; c.fill(); }
  strokeEllipse(r) { const c = this.c; c.beginPath(); c.ellipse(r.x + r.width / 2, r.y + r.height / 2, r.width / 2, r.height / 2, 0, 0, Math.PI * 2); c.strokeStyle = this._stroke; c.lineWidth = this._lw; c.stroke(); }
  addPath(p) { this._path = p; }
  _trace() { const c = this.c; c.beginPath(); (this._path ? this._path.ops : []).forEach(op => op(c)); return c; }
  fillPath() { const c = this._trace(); c.fillStyle = this._fill; c.fill(); }
  strokePath() { const c = this._trace(); c.strokeStyle = this._stroke; c.lineWidth = this._lw; c.stroke(); }
  setFont(f) { this._font = f; }
  setTextColor(col) { this._tc = col.css(); }
  setTextAlignedLeft() { this._al = 'left'; }
  setTextAlignedCenter() { this._al = 'center'; }
  setTextAlignedRight() { this._al = 'right'; }
  drawTextInRect(t, r) { const c = this.c; c.font = this._font.css(); c.fillStyle = this._tc; c.textAlign = this._al; c.textBaseline = 'top'; c.fillText(t, this._al === 'center' ? r.x + r.width / 2 : this._al === 'right' ? r.x + r.width : r.x, r.y); }
  getImage() { this.c; return { src: this._cv.toDataURL(), size: new Size(this.size.width, this.size.height) }; }
}

class WText {
  constructor(s) { this.kind = 'text'; this.text = s; this.font = Font.systemFont(17); this.textColor = new Color('000000'); this.lineLimit = 0; this.textOpacity = 1; this.al = 'left'; }
  leftAlignText() { this.al = 'left'; } centerAlignText() { this.al = 'center'; } rightAlignText() { this.al = 'right'; }
}
class WImage { constructor(img) { this.kind = 'image'; this.image = img; this.imageSize = null; this.cornerRadius = 0; } }
class WStack {
  constructor(kind) { this.kind = kind; this.children = []; this.vertical = kind === 'list'; this.align = 'center'; this.spacing = 0; this.backgroundColor = null; this.cornerRadius = 0; this.pad = kind === 'list' ? [16, 16, 16, 16] : [0, 0, 0, 0]; this.size = null; }
  addText(s) { const t = new WText(s); this.children.push(t); return t; }
  addImage(img) { const i = new WImage(img); this.children.push(i); return i; }
  addStack() { const s = new WStack('stack'); this.children.push(s); return s; }
  addSpacer(n) { this.children.push({ kind: 'spacer', n: n == null ? null : n }); }
  layoutVertically() { this.vertical = true; } layoutHorizontally() { this.vertical = false; }
  topAlignContent() { this.align = 'flex-start'; } centerAlignContent() { this.align = 'center'; } bottomAlignContent() { this.align = 'flex-end'; }
  setPadding(t, l, b, r) { this.pad = [t, l, b, r]; }
}
class ListWidget extends WStack {
  constructor() { super('list'); }
  presentSmall() {} presentMedium() {} presentLarge() {}
}

function toDom(node, parentVertical) {
  if (node.kind === 'spacer') {
    const s = document.createElement('div');
    s.style.flex = node.n == null ? '1 1 0' : `0 0 ${node.n}px`;
    s.style[parentVertical ? 'minHeight' : 'minWidth'] = '0';
    return s;
  }
  if (node.kind === 'text') {
    const t = document.createElement('div');
    t.textContent = node.text;
    Object.assign(t.style, { font: node.font.css(), color: node.textColor.css(), lineHeight: '1.2', textAlign: node.al, minWidth: '0', overflow: 'hidden', flex: '0 1 auto', overflowWrap: 'anywhere' });
    if (node.lineLimit === 1) Object.assign(t.style, { whiteSpace: 'nowrap', textOverflow: 'ellipsis' });
    else if (node.lineLimit > 1) Object.assign(t.style, { display: '-webkit-box', webkitBoxOrient: 'vertical', webkitLineClamp: String(node.lineLimit) });
    return t;
  }
  if (node.kind === 'image') {
    const i = document.createElement('img');
    i.src = node.image.src;
    const sz = node.imageSize || node.image.size;
    Object.assign(i.style, { width: sz.width + 'px', height: sz.height + 'px', flex: '0 0 auto', borderRadius: node.cornerRadius + 'px', display: 'block' });
    return i;
  }
  const d = document.createElement('div');
  const [pt, pl, pb, pr] = node.pad;
  Object.assign(d.style, {
    display: 'flex', flexDirection: node.vertical ? 'column' : 'row', gap: node.spacing + 'px',
    alignItems: node.vertical ? 'flex-start' : node.align, padding: `${pt}px ${pr}px ${pb}px ${pl}px`,
    minWidth: '0', minHeight: '0', boxSizing: 'border-box', overflow: 'hidden', flex: '0 1 auto'
  });
  if (node.backgroundColor) d.style.background = node.backgroundColor.css();
  if (node.cornerRadius) d.style.borderRadius = node.cornerRadius + 'px';
  if (node.size) {
    if (node.size.width > 0) { d.style.width = node.size.width + 'px'; d.style.flex = '0 0 auto'; }
    if (node.size.height > 0) d.style.height = node.size.height + 'px';
  }
  // Stacks ohne feste Breite füllen in vertikalen Eltern die Breite nur, wenn sie Spacer enthalten (wie in WidgetKit)
  if (parentVertical && !(node.size && node.size.width > 0) && !node.vertical && node.children.some(c => c.kind === 'spacer' && c.n == null)) d.style.alignSelf = 'stretch';
  if (!parentVertical && node.vertical && node.children.some(c => c.kind === 'spacer' && c.n == null)) d.style.alignSelf = 'stretch';
  node.children.forEach(ch => d.appendChild(toDom(ch, node.vertical)));
  return d;
}

const DIM = { small: [158, 158], medium: [338, 158], large: [338, 354] };
// Führt das Skript mit Familie und Parameter aus und liefert das fertige Widget-Element
async function renderWidget(code, family, param, now) {
  let out = null;
  const env = {
    ListWidget, Color, Font, Size, Point, Rect, Path, DrawContext,
    config: { widgetFamily: family, runsInWidget: true, runsInApp: false },
    args: { widgetParameter: param, queryParameters: {} },
    Script: { setWidget(w) { out = w; }, complete() {} },
    FileManager: { local: () => ({ documentsDirectory: () => '/docs', joinPath: (a, b) => a + '/' + b, fileExists: () => false, readString: () => '', writeString() {} }) },
    Alert: class { addAction() {} present() { return Promise.resolve(0); } },
    PREVIEW_NOW: now
  };
  const AsyncFn = Object.getPrototypeOf(async function () {}).constructor;
  await new AsyncFn(...Object.keys(env), code)(...Object.values(env));
  const el = toDom(out, true);
  const [w, h] = DIM[family];
  Object.assign(el.style, { width: w + 'px', height: h + 'px', borderRadius: '22px', flex: 'none' });
  if (out.backgroundColor) el.style.background = out.backgroundColor.css();
  return el;
}
window.renderWidget = renderWidget;
})();
