// Larger, more detailed pixel art for the workout panels. Characters are built from posed
// shapes (circles, ellipses, tapered capsules) and shaded with light coming from the window, top left.
import { Px, INK, C, mix, dk } from './paint';

export const HW = 160, HH = 125;
const FW = 200, FH = 150;

type P = [number, number];
type Box = [number, number, number, number];
interface Shape { f: (x: number, y: number) => number; b: Box }
interface Mat { hi: string; base: string; sh: string; line: string }

const box = (x0: number, y0: number, x1: number, y1: number): Box => [Math.floor(x0) - 1, Math.floor(y0) - 1, Math.ceil(x1) + 1, Math.ceil(y1) + 1];
const circle = ([cx, cy]: P, r: number): Shape => ({ f: (x, y) => Math.hypot(x - cx, y - cy) - r, b: box(cx - r, cy - r, cx + r, cy + r) });
function ell([cx, cy]: P, rx: number, ry: number, a = 0): Shape {
  const c = Math.cos(a), s = Math.sin(a), m = Math.max(rx, ry);
  return {
    f: (x, y) => { const dx = x - cx, dy = y - cy; return (Math.hypot((dx * c + dy * s) / rx, (-dx * s + dy * c) / ry) - 1) * Math.min(rx, ry); },
    b: box(cx - m, cy - m, cx + m, cy + m)
  };
}
function cap([x0, y0]: P, [x1, y1]: P, r0: number, r1 = r0): Shape {
  const dx = x1 - x0, dy = y1 - y0, l2 = dx * dx + dy * dy || 1, m = Math.max(r0, r1);
  return {
    f: (x, y) => {
      let t = ((x - x0) * dx + (y - y0) * dy) / l2;
      t = t < 0 ? 0 : t > 1 ? 1 : t;
      return Math.hypot(x - x0 - dx * t, y - y0 - dy * t) - (r0 + (r1 - r0) * t);
    },
    b: box(Math.min(x0, x1) - m, Math.min(y0, y1) - m, Math.max(x0, x1) + m, Math.max(y0, y1) + m)
  };
}
function rbox([cx, cy]: P, hw: number, hh: number, r = 0): Shape {
  return {
    f: (x, y) => {
      const qx = Math.abs(x - cx) - hw + r, qy = Math.abs(y - cy) - hh + r;
      return Math.hypot(Math.max(qx, 0), Math.max(qy, 0)) + Math.min(Math.max(qx, qy), 0) - r;
    },
    b: box(cx - hw, cy - hh, cx + hw, cy + hh)
  };
}
function union(...s: Shape[]): Shape {
  return {
    f: (x, y) => { let d = Infinity; for (const k of s) { const v = k.f(x, y); if (v < d) d = v; } return d; },
    b: [Math.min(...s.map(k => k.b[0])), Math.min(...s.map(k => k.b[1])), Math.max(...s.map(k => k.b[2])), Math.max(...s.map(k => k.b[3]))]
  };
}
/** Wavy edge for fur. */
const fur = (s: Shape, amt = 1): Shape => ({
  f: (x, y) => s.f(x, y) + Math.sin(x * 1.9 + y * 0.7) * Math.cos(y * 1.6 - x * 0.45) * amt,
  b: [s.b[0] - 2, s.b[1] - 2, s.b[2] + 2, s.b[3] + 2]
});

const LX = -0.55, LY = -0.83;

/** Fills a shape with a lit rim, a body tone and a shadow side, plus a 1px line around it. */
function paint(px: Px, s: Shape, m: Mat, o: { rim?: number; shade?: number; line?: boolean } = {}) {
  const rim = o.rim ?? 1.6, shade = o.shade ?? 3.2, line = o.line ?? true;
  const [x0, y0, x1, y1] = s.b;
  for (let y = Math.max(0, y0); y <= Math.min(px.h - 1, y1); y++) {
    for (let x = Math.max(0, x0); x <= Math.min(px.w - 1, x1); x++) {
      const cx = x + 0.5, cy = y + 0.5, d = s.f(cx, cy);
      if (d > 0) continue;
      let col = m.base;
      if (line && d > -1) col = m.line;
      else if (d > -shade - 1) {
        const gx = s.f(cx + 0.7, cy) - s.f(cx - 0.7, cy), gy = s.f(cx, cy + 0.7) - s.f(cx, cy - 0.7);
        const n = Math.hypot(gx, gy) || 1, facing = (gx * LX + gy * LY) / n;
        if (facing > 0.45 && d > -rim - 1) col = m.hi;
        else if (facing < -0.2) col = m.sh;
      }
      px.p(x, y, col);
    }
  }
}

const M = {
  skin: { hi: '#fde4cc', base: C.skin[1], sh: C.skin[2], line: '#8a4f45' },
  hair: { hi: '#5f4a5b', base: C.hair[1], sh: C.hair[2], line: '#140d12' },
  shirt: { hi: '#615a7a', base: C.shirt[1], sh: C.shirt[2], line: '#1a1626' },
  pants: { hi: '#f6e3c2', base: C.pants[0], sh: C.pants[1], line: '#8a6f48' },
  shoe: { hi: '#6a6274', base: '#3b3240', sh: '#29222e', line: INK },
  catW: { hi: '#ffffff', base: '#fbf5ec', sh: '#e0d5c6', line: '#8c8091' },
  catG: { hi: '#9d95a8', base: '#77707f', sh: '#59536a', line: '#36303f' },
  catMask: { hi: '#e9e4ee', base: '#d9d2e0', sh: '#c4bccd', line: '#d9d2e0' },
  steel: { hi: '#f4f6f9', base: C.steel[1], sh: C.steel[2], line: '#4c505a' },
  plate: { hi: '#5c6170', base: '#3a3e4a', sh: '#272a33', line: '#16171c' },
  pad: { hi: '#e0766a', base: '#b5473f', sh: '#86302d', line: '#4a1a1c' },
  dumb: { hi: '#7a8090', base: '#4c5260', sh: '#353a45', line: '#1b1d23' }
} satisfies Record<string, Mat>;
const far = (m: Mat): Mat => ({ hi: m.base, base: mix(m.base, m.sh, 0.6), sh: dk(m.sh, 0.15), line: m.line });
const flush = (m: Mat, k: number): Mat => k <= 0 ? m : ({ hi: mix(m.hi, '#ffb0a0', k * 0.5), base: mix(m.base, '#f08a7a', k * 0.45), sh: mix(m.sh, '#c0584e', k * 0.4), line: m.line });

/* ---------------------------------- Mohit ---------------------------------- */
export type Face = 'smile' | 'strain' | 'happy' | 'laugh' | 'focus';
export interface Rig {
  hip: P; neck: P; head: P; tilt: number; dir: 1 | -1;
  arm: [P, P, P]; arm2: [P, P, P]; leg: [P, P, P]; leg2: [P, P, P];
  face: Face; red?: number; feet?: number;
}

function ik(a: P, c: P, l1: number, l2: number, bend: 1 | -1): [P, P] {
  const dx = c[0] - a[0], dy = c[1] - a[1], d = Math.min(Math.hypot(dx, dy), l1 + l2 - 0.01);
  const ang = Math.atan2(dy, dx);
  const A = Math.acos(Math.max(-1, Math.min(1, (l1 * l1 + d * d - l2 * l2) / (2 * l1 * d || 1))));
  const e: P = [a[0] + Math.cos(ang + A * bend) * l1, a[1] + Math.sin(ang + A * bend) * l1];
  const h = Math.atan2(c[1] - e[1], c[0] - e[0]);
  return [e, [e[0] + Math.cos(h) * l2, e[1] + Math.sin(h) * l2]];
}
const ARM: [number, number] = [15, 14];

function limb(px: Px, [a, b, c]: [P, P, P], upper: Mat, lower: Mat, r: [number, number, number], end: Mat, endR: number) {
  paint(px, cap(b, c, r[1], r[2]), lower);
  paint(px, circle(c, endR), end);
  paint(px, cap(a, b, r[0], r[1] + 0.3), upper);
}

function arm(px: Px, a: [P, P, P], dim: boolean) {
  const skin = dim ? far(M.skin) : M.skin, shirt = dim ? far(M.shirt) : M.shirt;
  const [, e, h] = a;
  paint(px, cap(e, h, 3.1, 2.6), skin);
  const w: P = [e[0] + (h[0] - e[0]) * 0.78, e[1] + (h[1] - e[1]) * 0.78];
  if (!dim) px.p(Math.round(w[0]), Math.round(w[1]), C.steel[0]).p(Math.round(w[0]) + 1, Math.round(w[1]), C.steel[2]);
  paint(px, circle(h, 3.3), skin);
  paint(px, cap(a[0], e, 3.9, 3.4), shirt);
  paint(px, circle(e, 3.5), shirt, { line: true });
}

function leg(px: Px, l: [P, P, P], dir: number, dim: boolean, feet: number) {
  const pants = dim ? far(M.pants) : M.pants, shoe = dim ? far(M.shoe) : M.shoe;
  const [, , f] = l;
  const toe: P = [f[0] + Math.cos(feet) * 6 * dir, f[1] + Math.sin(feet) * 6];
  paint(px, cap([f[0] - 1.5 * dir, f[1]], toe, 3.3, 2.6), shoe);
  limb(px, l, pants, pants, [5.8, 4.8, 3.9], pants, 0.1);
}

/** Maps head-local coordinates (forward = +x, up = -y) into the panel. */
function headSpace(r: Rig) {
  const c = Math.cos(r.tilt), s = Math.sin(r.tilt);
  return (lx: number, ly: number): P => { const x = lx * r.dir; return [r.head[0] + x * c - ly * s, r.head[1] + x * s + ly * c]; };
}

function head(px: Px, r: Rig) {
  const H = headSpace(r), red = r.red ?? 0;
  const skin = flush(M.skin, red);
  paint(px, union(ell(H(0, 0.5), 9.5, 10), ell(H(3.5, 5), 6.5, 5), circle(H(9.4, 1.8), 1.7)), skin);
  const hair = union(circle(H(-5, -2), 6.6), circle(H(-3, -6.6), 7), circle(H(2, -8), 6.6), circle(H(6.4, -6.4), 4.7), circle(H(-7.6, 3), 4.3),
      cap(H(3, -6), H(9.4, -1.6), 3.3, 1.5), cap(H(6, -7.4), H(10.8, -3.6), 2.2, 1), circle(H(-2, -13.2), 2.2), circle(H(3.5, -13), 1.8),
      cap(H(-9, -6), H(-12.4, -8.2), 1.8, 0.8), cap(H(-1, -12), H(-4.5, -15.2), 1.6, 0.6));
  paint(px, fur(hair, 0.55), M.hair, { rim: 1.2 });
  paint(px, ell(H(-1.4, 2), 2.3, 3), skin, { shade: 1.5 });
  const dot = (lx: number, ly: number, c: string) => { const [x, y] = H(lx, ly); px.p(Math.round(x - 0.5), Math.round(y - 0.5), c); };
  dot(4.5, 3.6, red > 0.3 ? '#e66a6a' : '#f0a0a8'); dot(5.5, 3.6, red > 0.3 ? '#e66a6a' : '#f0a0a8');
  const f = r.face;
  if (f === 'happy' || f === 'laugh') { dot(6, 0.6, INK); dot(7, -0.4, INK); dot(8, 0.6, INK); }
  else if (f === 'strain') { dot(6, -0.6, INK); dot(7, 0.4, INK); dot(6, 1.4, INK); }
  else { dot(7, -0.2, INK); dot(7, 0.8, INK); if (f === 'focus') dot(6, -2, M.hair.base); }
  if (f === 'smile' || f === 'focus') { dot(9, 4.8, '#8a4f45'); dot(8, 5.8, '#8a4f45'); dot(7, 5.8, '#8a4f45'); }
  if (f === 'happy') { dot(9, 5, '#8a4f45'); dot(8, 6, '#8a4f45'); dot(7, 5.8, '#b04a5c'); dot(6.4, 5, '#8a4f45'); }
  if (f === 'laugh') { for (const [x, y] of [[7, 5], [8, 5], [8, 6], [7, 6], [9, 5]] as P[]) dot(x, y, '#b04a5c'); dot(7, 7, '#8a4f45'); dot(8, 7, '#8a4f45'); dot(9.6, 4.6, '#8a4f45'); }
  if (f === 'strain') { for (const x of [7, 8, 9]) { dot(x, 5, '#ffffff'); dot(x, 6, '#ffffff'); } dot(7, 4, '#8a4f45'); dot(8, 4, '#8a4f45'); dot(9, 4, '#8a4f45'); dot(8, 7, '#8a4f45'); }
  for (let y = -2; y <= 2; y++) dot(10, y, '#e0b048');
  dot(9, -2, '#c9962e'); dot(9, 2, '#c9962e'); dot(8, -2, '#c9962e');
  dot(9, -1, '#d9f0ff'); dot(9, 0, '#b9dcf2');
  dot(7, -1.6, '#a8822e'); dot(6, -1.5, '#a8822e');
}

export function mohit(px: Px, r: Rig) {
  const feet = r.feet ?? 0;
  arm(px, r.arm2, true);
  leg(px, r.leg2, r.dir, true, feet);
  const u = Math.atan2(r.neck[1] - r.hip[1], r.neck[0] - r.hip[0]);
  const nb: P = [r.neck[0] + Math.cos(u) * 4, r.neck[1] + Math.sin(u) * 4];
  paint(px, cap(r.neck, nb, 3.6), M.skin);
  paint(px, circle(r.hip, 6.4), M.pants);
  const torso = cap(r.hip, r.neck, 8.6, 9.4);
  paint(px, torso, M.shirt, { shade: 4 });
  {
    const fx = -Math.sin(u) * r.dir * -1, fy = Math.cos(u) * r.dir * -1;
    const len = Math.hypot(r.neck[0] - r.hip[0], r.neck[1] - r.hip[1]);
    for (let t = 6; t < len - 2; t += 5) {
      const x = r.hip[0] + Math.cos(u) * t + fx * 6.5, y = r.hip[1] + Math.sin(u) * t + fy * 6.5;
      px.p(Math.round(x), Math.round(y), M.shirt.hi);
    }
    const cx = r.neck[0] + fx * 5, cy = r.neck[1] + fy * 5;
    px.p(Math.round(cx), Math.round(cy), '#d9d3e6').p(Math.round(cx - fx * 2), Math.round(cy - fy * 2), '#d9d3e6');
  }
  leg(px, r.leg, r.dir, false, feet);
  head(px, r);
  arm(px, r.arm, false);
}

/** Standing pose, facing dir, feet on the ground at y. */
function stand(x: number, ground: number, dir: 1 | -1, face: Face): Rig {
  const hip: P = [x, ground - 36], neck: P = [x + 1 * dir, ground - 60];
  const sho: P = [neck[0] - 1 * dir, neck[1] + 3];
  const arm: [P, P, P] = [sho, [sho[0] + 1 * dir, sho[1] + 15], [sho[0] + 3 * dir, sho[1] + 28]];
  return {
    hip, neck, head: [neck[0] + 1 * dir, neck[1] - 13], tilt: 0, dir, face,
    arm, arm2: [[sho[0] - 2 * dir, sho[1]], [sho[0] - 3 * dir, sho[1] + 15], [sho[0] - 2 * dir, sho[1] + 28]],
    leg: [hip, [hip[0] + 2 * dir, hip[1] + 18], [hip[0] + 1 * dir, ground - 3]],
    leg2: [hip, [hip[0] - 3 * dir, hip[1] + 18], [hip[0] - 5 * dir, ground - 3]]
  };
}

/* ---------------------------------- PoiPoi ---------------------------------- */
type CatEyes = 'open' | 'closed' | 'half' | 'big';

function catHead(px: Px, [hx, hy]: P, dir: number, eyes: CatEyes, o: { flip?: boolean; earsBack?: boolean } = {}) {
  const fl = o.flip ? -1 : 1;
  const Q = (lx: number, ly: number): P => [hx + lx * (o.flip ? -1 : 1), hy + ly * fl];
  const eb = o.earsBack ? 3 : 0;
  for (const s of [-1, 1]) {
    const base = Q(s * 4.4 + dir * 0.6, -4.6), tip = Q(s * (6.6 + eb) + dir * 0.6, -12 + eb);
    paint(px, cap(base, tip, 3.4, 0.6), M.catG, { shade: 2 });
    paint(px, cap(Q(s * 4.6 + dir * 0.6, -6), Q(s * (5.8 + eb * 0.8) + dir * 0.6, -9.5 + eb), 1.2, 0.4), { hi: '#f7c3cf', base: '#f2b6c4', sh: '#e39aab', line: '#f2b6c4' }, { line: false });
  }
  paint(px, fur(union(circle(Q(0, 0), 8), ell(Q(0, 3.2), 9.6, 6)), 0.5), M.catW, { shade: 2.6 });
  paint(px, ell(Q(dir * 1, 0.2), 5.6, 3.2), M.catMask, { line: false, shade: 1.2 });
  const dot = (lx: number, ly: number, c: string) => { const [x, y] = Q(lx, ly); px.p(Math.round(x - 0.5), Math.round(y - 0.5), c); };
  for (const s of [-1, 1]) {
    const ex = s * 3.2 + dir * 1.1;
    if (eyes === 'closed') { dot(ex - 1, -0.5, '#5a5366'); dot(ex, 0.3, '#5a5366'); dot(ex + 1, -0.5, '#5a5366'); }
    else if (eyes === 'half') { dot(ex - 1, 0, '#5a5366'); dot(ex, 0, '#5a5366'); dot(ex + 1, 0, '#5a5366'); dot(ex, 1, '#4f9be0'); dot(ex - 1, 1, '#3d7ec0'); }
    else {
      const big = eyes === 'big';
      for (let j = -1; j <= (big ? 2 : 1); j++) for (let i = -1; i <= (big ? 1 : 0); i++) dot(ex + i, j, j < 0 ? '#3d7ec0' : '#5aaaf0');
      dot(ex, 0, '#1f2a44'); dot(ex - 1, -1, '#ffffff'); if (big) dot(ex + 1, 1, '#ffffff');
    }
  }
  dot(dir * 1.2, 2.6, '#e9909f'); dot(dir * 1.2 + 1, 2.6, '#e9909f');
  dot(dir * 1.2 - 1, 4, '#9a8f9c'); dot(dir * 1.2 + 0.5, 4.6, '#9a8f9c'); dot(dir * 1.2 + 2, 4, '#9a8f9c');
  for (const s of [-1, 1]) { dot(s * 8.8, 2.6, '#c9c0cf'); dot(s * 10, 2.2, '#c9c0cf'); dot(s * 8.8, 4, '#c9c0cf'); dot(s * 10, 4.4, '#c9c0cf'); }
}

/** The paw with the grey-spotted toes. */
function spots(px: Px, [x, y]: P) { px.p(Math.round(x - 1), Math.round(y + 1), '#77707f').p(Math.round(x + 1), Math.round(y + 1), '#77707f'); }

export function catLoaf(px: Px, [cx, cy]: P, dir: 1 | -1, eyes: CatEyes) {
  paint(px, fur(cap([cx - 12 * dir, cy + 3], [cx + 6 * dir, cy + 8.5], 3.6, 2.6), 0.6), M.catG);
  paint(px, fur(ell([cx, cy], 15, 9.5), 0.8), M.catW, { shade: 3.6 });
  paint(px, fur(ell([cx + 10 * dir, cy + 2], 7, 7.5), 0.7), M.catW);
  paint(px, ell([cx + 12 * dir, cy + 8.5], 3.2, 2.2), M.catW, { shade: 1 });
  paint(px, ell([cx + 6 * dir, cy + 9], 3.2, 2.2), M.catW, { shade: 1 });
  spots(px, [cx + 12 * dir, cy + 8.5]);
  catHead(px, [cx + 11 * dir, cy - 9], dir, eyes);
}

export function catSit(px: Px, [cx, cy]: P, dir: 1 | -1, paw: number, eyes: CatEyes, earsBack = false) {
  paint(px, fur(cap([cx - 10 * dir, cy - 3], [cx + 7 * dir, cy - 0.5], 3.6, 2.4), 0.6), M.catG);
  paint(px, fur(ell([cx - 4 * dir, cy - 7], 9, 7.5), 0.7), M.catW, { shade: 3 });
  paint(px, cap([cx + 3 * dir, cy - 10], [cx + 4 * dir, cy - 1.5], 2.6), far(M.catW));
  paint(px, fur(ell([cx + 1 * dir, cy - 14], 7.5, 10.5), 0.7), M.catW, { shade: 3 });
  paint(px, fur(ell([cx + 4 * dir, cy - 15], 6, 7), 0.6), M.catW);
  const sh: P = [cx + 4.5 * dir, cy - 14];
  const down: P = [cx + 6 * dir, cy - 1.5], up: P = [cx + 11 * dir, cy - 21];
  const pw: P = [down[0] + (up[0] - down[0]) * paw, down[1] + (up[1] - down[1]) * paw];
  paint(px, cap(sh, pw, 2.9, 2.5), M.catW, { shade: 1.6 });
  paint(px, circle(pw, 2.8), M.catW, { shade: 1.2 });
  spots(px, pw);
  catHead(px, [cx + 3 * dir, cy - 28], dir, eyes, { earsBack });
}

/** Hugging something vertical (Mohit's shin), seen from the front. */
export function catCling(px: Px, [cx, cy]: P, eyes: CatEyes) {
  paint(px, fur(cap([cx + 1, cy + 9], [cx - 2, cy + 25], 3.4, 2.2), 0.6), M.catG);
  paint(px, cap([cx - 3.5, cy + 8], [cx - 4.5, cy + 17], 2.8, 2.4), M.catW, { shade: 1.5 });
  paint(px, cap([cx + 3.5, cy + 8], [cx + 4.5, cy + 16], 2.8, 2.4), M.catW, { shade: 1.5 });
  paint(px, fur(ell([cx, cy], 8, 12), 0.7), M.catW, { shade: 3 });
  paint(px, cap([cx - 6, cy - 6], [cx - 1.5, cy - 2], 2.8, 2.6), M.catW, { shade: 1.4 });
  paint(px, cap([cx + 6, cy - 7], [cx + 1.5, cy - 3], 2.8, 2.6), M.catW, { shade: 1.4 });
  spots(px, [cx + 1.8, cy - 3.4]);
  catHead(px, [cx, cy - 14], 0, eyes);
}

export function catBellyUp(px: Px, [cx, cy]: P, dir: 1 | -1) {
  paint(px, fur(cap([cx - 12 * dir, cy + 1], [cx - 22 * dir, cy - 4], 3.6, 2.4), 0.6), M.catG);
  paint(px, fur(ell([cx, cy], 14, 8), 0.8), M.catW, { shade: 3 });
  paint(px, ell([cx + 1, cy - 1.5], 8, 3.5), { hi: '#ffffff', base: '#fffdf8', sh: '#f1e9dc', line: '#fffdf8' }, { line: false });
  for (const [a, b] of [[-8, -6], [-3, -13], [4, -12], [9, -5]] as P[]) {
    paint(px, cap([cx + a * 0.8 * dir, cy - 4], [cx + (a + 1) * dir, cy + b], 2.6, 2.2), M.catW, { shade: 1.4 });
  }
  spots(px, [cx + 5 * dir, cy - 12]);
  catHead(px, [cx + 14 * dir, cy + 2], dir, 'closed', { flip: true });
}

/* ---------------------------------- scenery ---------------------------------- */
function lighten(px: Px, poly: P[], k: number, tint = '#fff1c9') {
  const img = px.x.getImageData(0, 0, px.w, px.h), d = img.data;
  const T = [1, 3, 5].map(i => parseInt(tint.slice(i, i + 2), 16));
  const inside = (x: number, y: number) => {
    let c = false;
    for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
      const [xi, yi] = poly[i], [xj, yj] = poly[j];
      if ((yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) c = !c;
    }
    return c;
  };
  for (let y = 0; y < px.h; y++) for (let x = 0; x < px.w; x++) {
    if (!inside(x + 0.5, y + 0.5)) continue;
    const i = (y * px.w + x) * 4;
    if (!d[i + 3]) continue;
    const kk = (x + y) % 2 ? k : k * 0.8;
    for (let c = 0; c < 3; c++) d[i + c] = Math.round(d[i + c] + (T[c] - d[i + c]) * kk);
  }
  px.x.putImageData(img, 0, 0);
}

function plant(px: Px, x: number, y: number) {
  px.r(x - 6, y - 10, 12, 10, C.plasterT[1]).r(x - 6, y - 10, 12, 2, C.plasterT[0]).r(x + 3, y - 8, 3, 8, C.plasterT[2]).box(x - 7, y - 11, 14, 12, INK);
  const leaf = { hi: C.leaf[0], base: C.leaf[1], sh: C.leaf[2], line: C.leaf[3] };
  for (const [a, l] of [[-2.3, 16], [-1.9, 20], [-1.5, 22], [-1.2, 19], [-0.8, 15]]) {
    paint(px, cap([x, y - 10], [x + Math.cos(a) * l, y - 10 + Math.sin(a) * l], 1.2, 3), leaf, { shade: 1.6 });
  }
}

function gymRoom() {
  const HW = FW, HH = FH;
  const px = new Px(HW, HH);
  px.r(0, 0, HW, 80, '#c6d0dc');
  for (let y = 4; y < 78; y += 8) for (let x = (y / 8) % 2 ? 0 : 6; x < HW; x += 12) px.p(x, y, '#bcc6d3');
  px.r(0, 72, HW, 8, '#9aa6b6').r(0, 72, HW, 1, '#d8e0ea').r(0, 79, HW, 1, '#596274');
  px.r(8, 8, 46, 50, '#fff0cf').box(7, 7, 48, 52, '#596274');
  px.r(8, 34, 46, 24, '#ffe3a8');
  px.r(30, 8, 2, 50, '#7a8698').r(8, 32, 46, 2, '#7a8698');
  px.r(12, 44, 14, 14, '#c9e3b5').r(36, 40, 18, 18, '#b9d7a4').r(14, 42, 10, 3, '#d9edc8');
  px.r(5, 58, 52, 3, '#e8edf3').r(5, 60, 52, 1, '#8a96a8');
  px.r(70, 10, 120, 54, '#b8d4ee').box(69, 9, 122, 56, '#596274');
  for (let i = 0; i < 4; i++) px.line(92 + i * 26, 10, 78 + i * 26, 63, '#d4e7f8').line(94 + i * 26, 10, 80 + i * 26, 63, '#cbe1f5');
  px.r(70, 60, 120, 4, '#a8c3dd');
  for (let i = 0; i < 6; i++) px.r(140 + i * 8, 30 - (i % 2) * 3, 2, 12 + (i % 2) * 3, '#9cb6d0');
  px.r(0, 80, HW, HH - 80, '#3d4250');
  for (const y of [92, 108, 130]) px.r(0, y, HW, 1, '#343844');
  for (let i = -8; i <= 8; i++) px.line(100 + i * 9, 80, 100 + i * 40, HH, '#373b47');
  px.speck(0, 80, HW, 70, '#4a4f5e', 0.05);
  plant(px, 186, 84);
  return px;
}

/** Sunlight from the window, laid over the whole scene. */
function sunlight(px: Px) {
  lighten(px, [[8, 8], [54, 8], [140, 150], [60, 150]], 0.12);
  lighten(px, [[30, 34], [54, 34], [120, 150], [86, 150]], 0.08);
  [[70, 40], [96, 66], [120, 30], [60, 96], [150, 52], [40, 120]].forEach(([x, y]) => px.p(x, y, '#fff6dc'));
}

const ground = 132;

function crop(src: Px, x: number, y: number) {
  const out = new Px(HW, HH);
  out.x.drawImage(src.cv, x, y, HW, HH, 0, 0, HW, HH);
  return out;
}

/* ---------------------------------- panels ---------------------------------- */
/** Bench press. b = how far the bar has come down (0 = arms locked out, 1 = as low as PoiPoi allows). */
export function benchPanel(b: number, poiEyes: CatEyes) {
  const px = gymRoom();
  const benchY = 104;
  px.r(64, benchY + 2, 4, ground - benchY - 2, C.steel[2]).box(63, benchY + 1, 6, ground - benchY, INK);
  px.r(132, benchY + 2, 4, ground - benchY - 2, C.steel[2]).box(131, benchY + 1, 6, ground - benchY, INK);
  px.r(56, ground - 2, 20, 3, C.steel[3]).r(124, ground - 2, 20, 3, C.steel[3]);
  px.shadow(100, ground + 2, 48, 3);
  for (const x of [52, 148]) px.r(x, 34, 4, ground - 34, C.steel[2]).r(x, 34, 1, ground - 34, C.steel[0]).box(x - 1, 33, 6, ground - 32, INK);
  paint(px, rbox([100, benchY], 46, 4.5, 3), M.pad);
  const sho: P = [74, benchY - 10];
  const reach = 28.5 - b * 12;
  const hand: P = [sho[0] + 3, sho[1] - reach];
  const [e, h] = ik(sho, hand, ARM[0], ARM[1], 1);
  const hip: P = [124, benchY - 9], neck: P = [70, benchY - 10];
  const r: Rig = {
    hip, neck, head: [56, benchY - 11], tilt: -Math.PI / 2, dir: 1,
    face: b > 0.6 ? 'strain' : b > 0.25 ? 'focus' : 'smile', red: Math.max(0, b - 0.4) * 1.4,
    arm: [sho, e, h], arm2: [[sho[0] - 2, sho[1] - 1], [e[0] - 2, e[1] - 1], [h[0] - 2, h[1]]],
    leg: [hip, [hip[0] + 14, hip[1] - 10], [hip[0] + 22, ground - 3]],
    leg2: [hip, [hip[0] + 12, hip[1] - 9], [hip[0] + 17, ground - 3]]
  };
  mohit(px, r);
  catLoaf(px, [106, benchY - 24], -1, poiEyes);
  const bar: P = [h[0] + 1, h[1] - 1];
  paint(px, circle(bar, 10.5), M.plate, { shade: 3 });
  paint(px, circle(bar, 6.5), { hi: '#4a4f5e', base: '#30343e', sh: '#22252d', line: '#16171c' }, { line: false });
  paint(px, circle(bar, 3), M.steel, { shade: 1 });
  paint(px, cap([h[0] - 2, h[1] + 1], [h[0] + 3, h[1] - 2], 3.3), M.skin, { shade: 1.4 });
  if (b > 0.55) {
    const t = Math.round(b * 10);
    [[44, benchY - 30 - t % 3], [40, benchY - 20 + (t % 2)], [68, benchY - 34]].forEach(([x, y]) => px.p(x, y, '#e4f6ff').p(x, y + 1, '#9fd8ff').p(x + 1, y + 1, '#9fd8ff'));
  }
  sunlight(px);
  return crop(px, 26, 22);
}

/** Bicep curls. c = Mohit's curl (0 down, 1 up), paw = PoiPoi copying him. flop = the punchline. */
export function curlPanel(c: number, paw: number, flop = false) {
  const px = gymRoom();
  for (let i = 0; i < 4; i++) {
    const x = 150 + (i % 2) * 18, y = 92 + Math.floor(i / 2) * 10;
    paint(px, cap([x - 6, y], [x + 6, y], 1.2), M.steel, { line: true, shade: 0.5 });
    paint(px, circle([x - 6, y], 3.2), M.dumb, { shade: 1 }); paint(px, circle([x + 6, y], 3.2), M.dumb, { shade: 1 });
  }
  px.r(140, 100, 40, 3, C.steel[2]).r(142, 103, 2, 16, C.steel[3]).r(176, 103, 2, 16, C.steel[3]);
  px.shadow(80, ground + 1, 18, 2);
  const r = stand(78, ground, 1, flop ? 'laugh' : c > 0.6 ? 'focus' : 'smile');
  const sho = r.arm[0], elb: P = [sho[0] + 1, sho[1] + 15];
  const a = Math.PI / 2 - c * (Math.PI * 0.82);
  const hand: P = [elb[0] + Math.cos(a) * 14, elb[1] + Math.sin(a) * 14];
  r.arm = [sho, elb, hand];
  const a2 = Math.PI / 2 - Math.max(0, c - 0.15) * (Math.PI * 0.8);
  const s2 = r.arm2[0], e2: P = [s2[0], s2[1] + 15];
  r.arm2 = [s2, e2, [e2[0] + Math.cos(a2) * 14, e2[1] + Math.sin(a2) * 14]];
  if (flop) r.tilt = 0.25;
  const dumb = (h: P, dim: boolean) => {
    paint(px, cap([h[0] - 1, h[1] - 6], [h[0] + 1, h[1] + 6], 1.3), M.steel, { shade: 0.5 });
    paint(px, rbox([h[0], h[1] - 6], 4, 2.4, 1), dim ? far(M.dumb) : M.dumb, { shade: 1 });
    paint(px, rbox([h[0], h[1] + 6], 4, 2.4, 1), dim ? far(M.dumb) : M.dumb, { shade: 1 });
  };
  dumb(r.arm2[2], true);
  mohit(px, r);
  dumb(hand, false);
  paint(px, circle(hand, 3.3), M.skin, { shade: 1.2 });
  if (flop) { px.shadow(126, ground + 1, 18, 2); catBellyUp(px, [126, ground - 8], -1); }
  else { px.shadow(124, ground + 1, 12, 2); catSit(px, [124, ground], -1, paw, paw > 0.5 ? 'big' : 'open'); }
  sunlight(px);
  return crop(px, 32, 22);
}

/** Chin-ups. u = how far up Mohit has pulled. slide = PoiPoi slipping down his legs. landed = punchline. */
export function chinPanel(u: number, slide: number, landed = false) {
  const px = gymRoom();
  const barY = 28, bx = 96;
  px.r(18, barY - 6, 4, ground - barY + 6, C.steel[2]).r(18, barY - 6, 1, ground - barY + 6, C.steel[0]).box(17, barY - 7, 6, ground - barY + 8, INK);
  px.r(20, barY - 2, 120, 3, C.steel[2]).r(20, barY - 2, 120, 1, C.steel[0]).box(19, barY - 3, 122, 5, INK);
  px.r(150, barY - 6, 4, ground - barY + 6, C.steel[1]).box(149, barY - 7, 6, ground - barY + 8, INK);
  px.r(16, ground - 2, 10, 3, C.steel[3]).r(146, ground - 2, 12, 3, C.steel[3]);
  let r: Rig;
  if (landed) {
    r = stand(bx, ground, 1, 'laugh');
    r.arm = [r.arm[0], [r.arm[0][0] + 6, r.arm[0][1] + 10], [r.arm[0][0] + 14, r.arm[0][1] + 6]];
    r.tilt = 0.3;
    px.shadow(bx, ground + 1, 18, 2);
  } else {
    const shoY = barY + 30 - u * 22;
    const sho: P = [bx - 1, shoY], hand: P = [bx + 2, barY];
    const [e, h] = ik(sho, hand, ARM[0], ARM[1], -1);
    const [e2, h2] = ik([sho[0] - 2, sho[1]], [hand[0] - 3, hand[1]], ARM[0], ARM[1], -1);
    const neck: P = [bx, shoY - 3], hip: P = [bx - 2, shoY + 21];
    r = {
      hip, neck, head: [bx + 1 + u * 2, neck[1] - 13], tilt: -u * 0.25, dir: 1, face: u > 0.6 ? 'strain' : 'focus', red: u * 0.5,
      arm: [sho, e, h], arm2: [[sho[0] - 2, sho[1]], e2, h2],
      leg: [hip, [hip[0] + 2, hip[1] + 18], [hip[0] - 3, hip[1] + 35]],
      leg2: [hip, [hip[0] - 1, hip[1] + 18], [hip[0] - 6, hip[1] + 34]], feet: 0.9
    };
    px.shadow(bx, ground + 1, 10, 2);
  }
  mohit(px, r);
  const knee = r.leg[1], foot = r.leg[2];
  const t = 0.35 + slide * 0.45;
  catCling(px, [knee[0] + (foot[0] - knee[0]) * t + 1, knee[1] + (foot[1] - knee[1]) * t], landed ? 'closed' : 'big');
  if (!landed) {
    paint(px, circle(r.arm[2], 3.3), M.skin, { shade: 1.2 });
  }
  sunlight(px);
  return crop(px, 20, 11);
}

