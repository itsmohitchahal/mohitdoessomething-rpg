// Ground painting: every 16px tile is painted on its own with seeded variation, aware of its neighbours.
import { Px, C, INK, dk, lt, rng, type RNG } from './paint';

export const TILE = 16;

type Painter = (p: Px, x: number, y: number, ctx: { at: (dx: number, dy: number) => string; r: RNG; tx: number; ty: number }) => void;

const isRoad = (c: string) => c === 'r' || c === 'z' || c === 'Z';

const PAINTERS: Record<string, Painter> = {
  // asphalt with patches, cracks and the odd pothole
  r(p, x, y, { r }) {
    p.r(x, y, 16, 16, C.road[1]);
    for (let i = 0; i < 18; i++) p.p(x + r() * 16, y + r() * 16, r() < 0.5 ? C.road[0] : C.road[2]);
    if (r() < 0.12) p.r(x + 2 + r() * 6, y + 2 + r() * 6, 5 + r() * 4, 4 + r() * 3, C.road[2]);
    if (r() < 0.15) { const sx = x + r() * 12, sy = y + r() * 12; p.line(sx, sy, sx + 3, sy + 2, C.road[3]).line(sx + 3, sy + 2, sx + 5, sy + 1, C.road[3]); }
    if (r() < 0.04) { p.ell(x + 8, y + 9, 4, 2, C.road[3]).ell(x + 8, y + 9, 3, 1, '#9fb6c9').p(x + 7, y + 8, '#d8e6f0'); }
  },
  z(p, x, y, c) { PAINTERS.r(p, x, y, c); for (let j = 1; j < 16; j += 4) p.r(x + 2, y + j, 12, 2, '#e9e4ea'); },
  Z(p, x, y, c) { PAINTERS.r(p, x, y, c); for (let i = 1; i < 16; i += 4) p.r(x + i, y + 2, 2, 12, '#e9e4ea'); },
  // red-and-grey interlocking footpath with a painted kerb where it meets the road
  f(p, x, y, { at, r }) {
    for (let j = 0; j < 16; j += 4) for (let i = 0; i < 16; i += 4) {
      const red = ((i + j) / 4) % 3 === 0;
      p.r(x + i, y + j, 4, 4, red ? '#b98a7c' : C.pave[1]).p(x + i, y + j, red ? '#cfa092' : C.pave[0]).r(x + i + 3, y + j, 1, 4, C.pave[2]).r(x + i, y + j + 3, 4, 1, C.pave[2]);
    }
    if (r() < 0.2) p.p(x + r() * 16, y + r() * 16, C.pave[3]);
    if (r() < 0.06) { p.p(x + 4 + r() * 8, y + 4 + r() * 8, C.leaf[2]); }
    const kerb = (horizontal: boolean, pos: number) => {
      for (let k = 0; k < 16; k += 4) {
        const col = (Math.floor((horizontal ? x + k : y + k) / 4) % 2) ? '#2b2430' : '#f2b632';
        if (horizontal) p.r(x + k, y + pos, 4, 3, col); else p.r(x + pos, y + k, 3, 4, col);
      }
    };
    if (isRoad(at(0, 1))) kerb(true, 13);
    if (isRoad(at(0, -1))) kerb(true, 0);
    if (isRoad(at(1, 0))) kerb(false, 13);
    if (isRoad(at(-1, 0))) kerb(false, 0);
  },
  // colony lane: big concrete slabs, stains, leaves, a dropped kulhad now and then
  p(p, x, y, { r, tx, ty }) {
    p.r(x, y, 16, 16, C.pave[0]);
    p.r(x + 15, y, 1, 16, C.pave[2]).r(x, y + 15, 16, 1, C.pave[2]);
    for (let i = 0; i < 10; i++) p.p(x + r() * 15, y + r() * 15, r() < 0.6 ? C.pave[1] : lt(C.pave[0], 0.4));
    if (r() < 0.1) p.ell(x + 5 + r() * 6, y + 5 + r() * 6, 3, 2, dk(C.pave[0], 0.12));
    if (r() < 0.08) p.p(x + 3 + r() * 10, y + 3 + r() * 10, C.leaf[2]).p(x + 4 + r() * 10, y + 4 + r() * 10, C.leaf[1]);
    if ((tx * 7 + ty * 13) % 37 === 5) p.r(x + 9, y + 6, 2, 3, C.brick[1]).p(x + 9, y + 6, C.brick[0]);
  },
  // park grass with tufts and a few flowers
  g(p, x, y, { r }) {
    p.r(x, y, 16, 16, C.grass[1]);
    for (let i = 0; i < 14; i++) p.p(x + r() * 16, y + r() * 16, r() < 0.5 ? C.grass[0] : C.grass[2]);
    for (let i = 0; i < 3; i++) { const gx = x + 1 + r() * 13, gy = y + 2 + r() * 12; p.p(gx, gy, C.grass[3]).p(gx + 1, gy - 1, C.grass[2]).p(gx + 2, gy, C.grass[3]); }
    if (r() < 0.12) p.p(x + 2 + r() * 12, y + 2 + r() * 12, r() < 0.5 ? '#f4d35e' : '#ff9ec0');
    if (r() < 0.05) p.ell(x + 8, y + 8, 4, 2, '#a68a5c');
  },
  // brick path through the park
  k(p, x, y, { r }) {
    for (let j = 0; j < 16; j += 4) for (let i = -((j / 4) % 2) * 3; i < 16; i += 6) {
      p.r(x + Math.max(i, 0), y + j, Math.min(6, 16 - Math.max(i, 0)), 4, r() < 0.2 ? C.brick[2] : C.brick[1]);
      p.r(x + Math.max(i, 0), y + j + 3, Math.min(6, 16 - Math.max(i, 0)), 1, C.brick[3]);
      if (i >= 0) p.r(x + i, y + j, 1, 4, C.brick[3]);
    }
  },
  // wooden floorboards
  o(p, x, y, { r, ty }) {
    for (let j = 0; j < 16; j += 4) {
      const tone = [C.wood[1], dk(C.wood[1], 0.1), lt(C.wood[1], 0.08)][Math.floor(r() * 3)];
      p.r(x, y + j, 16, 4, tone).r(x, y + j + 3, 16, 1, C.wood[3]).r(x, y + j, 16, 1, lt(tone, 0.15));
      const seam = ((ty * 4 + j) * 7) % 16;
      p.r(x + seam, y + j, 1, 3, C.wood[3]);
      if (r() < 0.3) p.r(x + r() * 12, y + j + 1, 3, 1, dk(tone, 0.18));
    }
  },
  // gym rubber flooring
  u(p, x, y, { r }) {
    p.r(x, y, 16, 16, '#3d4150');
    for (let i = 0; i < 22; i++) p.p(x + r() * 16, y + r() * 16, r() < 0.5 ? '#525769' : '#2e3140');
    p.r(x + 15, y, 1, 16, '#2a2c38').r(x, y + 15, 16, 1, '#2a2c38');
  },
  // café floor: terracotta and cream Indian tiles
  x(p, x, y, { tx, ty }) {
    for (let j = 0; j < 2; j++) for (let i = 0; i < 2; i++) {
      const terra = (tx * 2 + i + ty * 2 + j) % 2 === 0;
      p.r(x + i * 8, y + j * 8, 8, 8, terra ? '#c97a5a' : '#f1e3c8').p(x + i * 8 + 1, y + j * 8 + 1, terra ? '#dc9476' : '#fff6e2');
      p.r(x + i * 8 + 7, y + j * 8, 1, 8, '#a8806a').r(x + i * 8, y + j * 8 + 7, 8, 1, '#a8806a');
    }
  },
  // kitchen floor: grey kota stone slabs
  y(p, x, y, { r }) {
    p.r(x, y, 16, 16, '#8a8a8f');
    for (let i = 0; i < 16; i++) p.p(x + r() * 16, y + r() * 16, r() < 0.5 ? '#9a9aa0' : '#77777c');
    p.r(x + 15, y, 1, 16, '#5f5f66').r(x, y + 15, 16, 1, '#5f5f66');
  },
  // room wallpaper (upper wall) and lower wall with skirting board
  W(p, x, y, { tx }) {
    p.r(x, y, 16, 16, '#5b4a80');
    if (tx % 2) p.r(x, y, 8, 16, '#54437a'); else p.r(x + 8, y, 8, 16, '#54437a');
    p.p(x + 4, y + 5, '#7a68a6').p(x + 3, y + 6, '#7a68a6').p(x + 5, y + 6, '#7a68a6').p(x + 4, y + 7, '#7a68a6').p(x + 4, y + 6, '#d6b45c');
    p.p(x + 12, y + 13, '#6c5a98');
  },
  w(p, x, y, c) {
    PAINTERS.W(p, x, y, c);
    p.r(x, y + 11, 16, 5, C.wood[2]).r(x, y + 11, 16, 1, C.wood[1]).r(x, y + 15, 16, 1, INK);
  },
  // gym wall: painted block with a mirror strip
  M(p, x, y) { p.r(x, y, 16, 16, '#6f7d90').r(x, y + 6, 16, 10, '#bcd7f0').r(x, y + 6, 16, 1, INK).p(x + 4, y + 12, '#ffffff').p(x + 5, y + 11, '#ffffff'); },
  m(p, x, y) { p.r(x, y, 16, 16, '#bcd7f0').r(x, y + 8, 16, 3, INK).r(x, y + 11, 16, 5, '#4a5568').p(x + 9, y + 3, '#ffffff').p(x + 10, y + 2, '#ffffff'); },
  // café wall: cream plaster above a wooden wainscot
  A(p, x, y, { r }) { p.r(x, y, 16, 16, '#f0dcc0'); if (r() < 0.3) p.p(x + r() * 16, y + r() * 16, '#e2c9a8'); },
  a(p, x, y) { p.r(x, y, 16, 16, '#f0dcc0').r(x, y + 4, 16, 12, C.wood[1]).r(x, y + 4, 16, 1, INK).r(x + 7, y + 5, 1, 10, C.wood[2]).r(x, y + 15, 16, 1, INK); },
  // kitchen wall: small glazed tiles, a few stained
  K(p, x, y, { r }) {
    for (let j = 0; j < 16; j += 8) for (let i = 0; i < 16; i += 8) {
      p.r(x + i, y + j, 8, 8, r() < 0.08 ? '#dfe3dc' : '#e8eef2').p(x + i + 1, y + j + 1, '#f6f9fb');
      p.r(x + i + 7, y + j, 1, 8, '#c4d0da').r(x + i, y + j + 7, 8, 1, '#c4d0da');
    }
  },
  q(p, x, y, c) { PAINTERS.K(p, x, y, c); p.r(x, y + 12, 16, 4, '#9b98a8').r(x, y + 12, 16, 1, INK); },
  // supermarket: white wall with the shop's green stripe, glossy floor tiles with ceiling-light reflections
  V(p, x, y, { r }) { p.r(x, y, 16, 16, '#f2f4f1').r(x, y + 9, 16, 3, '#3f9a5a').r(x, y + 12, 16, 1, '#f2a33a'); if (r() < 0.2) p.p(x + r() * 16, y + r() * 8, '#e3e7e2'); },
  v(p, x, y, { tx, ty }) {
    p.r(x, y, 16, 16, (tx + ty) % 2 ? '#e9ebe6' : '#dfe3dc');
    p.r(x + 15, y, 1, 16, '#c3c9c0').r(x, y + 15, 16, 1, '#c3c9c0');
    if (tx % 3 === 1) p.r(x + 3, y + 4, 9, 1, '#ffffff').r(x + 5, y + 6, 5, 1, '#f8faf6');
  },
  '.': (p, x, y) => { p.r(x, y, 16, 16, '#140d1f'); }
};

/** Paints a whole map's ground from rows of tile characters. */
export function paintGround(rows: string[], seed: number) {
  const h = rows.length, w = rows[0].length;
  const px = new Px(w * TILE, h * TILE);
  const at = (tx: number, ty: number) => (rows[ty] && rows[ty][tx]) || '.';
  for (let ty = 0; ty < h; ty++) for (let tx = 0; tx < w; tx++) {
    const ch = at(tx, ty), painter = PAINTERS[ch] ?? PAINTERS['.'];
    painter(px, tx * TILE, ty * TILE, { at: (dx, dy) => at(tx + dx, ty + dy), r: rng(seed * 7919 + tx * 104729 + ty * 1299709), tx, ty });
  }
  return px;
}
