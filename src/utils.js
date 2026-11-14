export const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
export const lerp = (a, b, t) => a + (b - a) * t;
export const rand = (min, max) => min + Math.random() * (max - min);
export const pick = (arr) => arr[(Math.random() * arr.length) | 0];

export const easeIn = (a, b, t) => a + (b - a) * Math.pow(t, 2);
export const easeOut = (a, b, t) => a + (b - a) * (1 - Math.pow(1 - t, 2));
export const easeInOut = (a, b, t) => a + (b - a) * (-Math.cos(t * Math.PI) / 2 + 0.5);

/** BDT-style money, e.g. 1,25,000 */
export function money(n) {
  const v = Math.max(0, Math.round(n || 0));
  try {
    return '৳ ' + v.toLocaleString('en-IN');
  } catch {
    return '৳ ' + v;
  }
}

export function signedDelta(a, b, trackLength) {
  let d = a - b;
  const half = trackLength / 2;
  if (d > half) d -= trackLength;
  if (d < -half) d += trackLength;
  return d;
}

// ---- colour helpers (cached hex mixing for night fog) ----
const hexCache = new Map();
function parse(hex) {
  let v = hexCache.get(hex);
  if (v) return v;
  const h = hex.replace('#', '');
  v = [
    parseInt(h.substring(0, 2), 16),
    parseInt(h.substring(2, 4), 16),
    parseInt(h.substring(4, 6), 16),
  ];
  hexCache.set(hex, v);
  return v;
}

const mixCache = new Map();

/** Mix hex colour `a` toward `b` by t (0..1), cached on a 1/32 grid. */
export function mix(a, b, t) {
  const q = Math.round(clamp(t, 0, 1) * 32) / 32;
  if (q === 0) return a;
  if (q === 1) return b;
  const key = a + b + q;
  let out = mixCache.get(key);
  if (out) return out;
  const ca = parse(a);
  const cb = parse(b);
  const r = Math.round(ca[0] + (cb[0] - ca[0]) * q);
  const g = Math.round(ca[1] + (cb[1] - ca[1]) * q);
  const bl = Math.round(ca[2] + (cb[2] - ca[2]) * q);
  out = `rgb(${r},${g},${bl})`;
  mixCache.set(key, out);
  return out;
}

export function rgba(hex, alpha) {
  const c = parse(hex);
  return `rgba(${c[0]},${c[1]},${c[2]},${alpha})`;
}

export function roundRectPath(ctx, x, y, w, h, r) {
  const rr = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + rr, y);
  ctx.lineTo(x + w - rr, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + rr);
  ctx.lineTo(x + w, y + h - rr);
  ctx.quadraticCurveTo(x + w, y + h, x + w - rr, y + h);
  ctx.lineTo(x + rr, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - rr);
  ctx.lineTo(x, y + rr);
  ctx.quadraticCurveTo(x, y, x + rr, y);
  ctx.closePath();
}

export function poly(ctx, x1, y1, x2, y2, x3, y3, x4, y4, color) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.lineTo(x3, y3);
  if (x4 !== undefined) ctx.lineTo(x4, y4);
  ctx.closePath();
  ctx.fill();
}
