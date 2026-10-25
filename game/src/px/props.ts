// Pixel props. Each draws into its own canvas; the bottom row is the ground line.
import { Px, C, INK, dk, lt, mix, rng } from './paint';

export interface PixProp {
  w: number; h: number;
  draw: (p: Px) => void;
  foot?: [number, number, number, number]; // collision box in art px, relative to bottom-centre
  glow?: [number, number, string][];       // light sources (x, y from top-left, colour) that switch on at night
}

const GLASS = ['#a9c4dd', '#7f9cbc', '#5a7698', '#3d5675'];
const CONCRETE = ['#c9c4bd', '#aaa59e', '#8a857f', '#68645f'];

/** Barred Delhi-style window with a sill. */
function grillWindow(p: Px, x: number, y: number, w: number, h: number, lit = false) {
  p.r(x, y, w, h, lit ? '#f6d48a' : GLASS[2]).r(x, y, w, 2, lit ? '#fbe6b4' : GLASS[1]);
  p.p(x + 1, y + h - 3, GLASS[0]).p(x + 2, y + h - 4, GLASS[0]);
  for (let i = x + 2; i < x + w; i += 3) p.r(i, y, 1, h, C.steel[3]);
  p.r(x, y + Math.floor(h / 2), w, 1, C.steel[3]);
  p.box(x - 1, y - 1, w + 2, h + 2, INK);
  p.r(x - 2, y + h + 1, w + 4, 2, C.plasterC[0]).r(x - 2, y + h + 2, w + 4, 1, C.plasterC[2]);
}
function acUnit(p: Px, x: number, y: number) {
  p.block(x, y, 9, 6, C.steel);
  for (let i = x + 1; i < x + 8; i += 2) p.r(i, y + 2, 1, 3, C.steel[3]);
  p.p(x + 4, y + 7, '#9fd8ff').p(x + 4, y + 9, '#9fd8ff');
}
function plantPot(p: Px, x: number, y: number) {
  p.r(x, y + 4, 6, 4, C.plasterT[2]).r(x, y + 4, 6, 1, C.plasterT[1]).box(x - 1, y + 3, 8, 6, INK);
  p.r(x + 1, y, 4, 4, C.leaf[1]).p(x, y + 1, C.leaf[2]).p(x + 5, y + 1, C.leaf[2]).p(x + 2, y - 1, C.leaf[0]).p(x + 3, y - 2, C.leaf[1]);
}
function stains(p: Px, x: number, y: number, w: number, h: number, c: string, n: number) {
  for (let i = 0; i < n; i++) {
    const sx = x + Math.floor(p.rnd() * w), len = 3 + Math.floor(p.rnd() * h * 0.4);
    for (let j = 0; j < len; j++) if (p.rnd() > 0.25) p.p(sx + (j > len / 2 && p.rnd() < 0.3 ? 1 : 0), y + j, c);
  }
}
function signBoard(p: Px, x: number, y: number, w: number, h: number, bg: string, text: string, fg: string) {
  p.block(x, y, w, h, [lt(bg, 0.3), bg, dk(bg, 0.3)]);
  p.text(text, x + Math.floor((w - Px.textWidth(text)) / 2), y + Math.floor((h - 5) / 2), fg);
}

/** A free-standing supermarket shelf with a header sign and three rows of goods. */
function aisle(p: Px, label: string, goods: (x: number, y: number, i: number) => void) {
  p.shadow(18, 34, 17, 2);
  p.block(1, 7, 34, 27, ['#f4f6f9', '#d9dde3', '#b4bac4', '#8a909b']);
  for (const y of [10, 18, 26]) {
    p.r(3, y, 30, 7, '#cfd4db');
    for (let i = 0; i < 7; i++) goods(4 + i * 4, y, i + y);
    p.r(3, y + 6, 30, 1, '#8a909b').r(3, y + 7, 30, 1, '#ffe08a');
  }
  p.r(2, 0, 32, 7, '#3f9a5a').box(1, 0, 34, 7, INK);
  p.text(label, 18 - Math.floor(Px.textWidth(label) / 2), 1, '#ffffff');
  p.box(0, 6, 36, 29, INK);
}

/** The shopping trolley, filling up: 0 empty .. 3 overflowing. */
export function cartFrame(n: number) {
  const p = new Px(24, 20);
  p.shadow(12, 18, 11, 2);
  p.r(3, 5, 18, 8, '#7a808c');
  if (n >= 1) p.r(5, 8, 5, 5, '#ffb347').p(7, 10, '#2b2430').r(11, 9, 4, 4, '#e04c80').r(11, 9, 4, 1, C.steel[1]);
  if (n >= 2) p.r(15, 5, 5, 8, '#2b2430').r(15, 7, 5, 1, '#7ec96b').r(4, 5, 4, 4, '#5bb6ff');
  if (n >= 3) p.r(5, 1, 5, 5, '#ffa3c4').p(6, 3, '#2b2430').r(11, 2, 4, 4, '#e04c50').line(17, 4, 20, 0, C.wood[1]).p(20, 0, '#ff7ab0').p(21, 1, '#ffe08a').r(9, 4, 6, 2, '#1f1b24');
  for (let x = 3; x <= 21; x += 3) p.r(x, 5, 1, 9, C.steel[1]);
  p.r(2, 5, 20, 1, C.steel[0]).r(3, 13, 18, 1, C.steel[2]).r(3, 9, 18, 1, mix(C.steel[1], '#7a808c', 0.4));
  p.r(1, 3, 22, 1, '#e04c50').r(1, 3, 1, 3, C.steel[2]).r(22, 3, 1, 3, C.steel[2]);
  p.r(4, 14, 16, 1, C.steel[2]);
  p.outline();
  p.r(4, 16, 2, 2, INK).r(18, 16, 2, 2, INK);
  return p;
}

export const PIX: Record<string, PixProp> = {
  /* ------------------------------ city ------------------------------ */
  apt: {
    w: 150, h: 120, foot: [-70, -24, 140, 22],
    glow: [[34, 49, '#ffd27a'], [116, 75, '#ffd27a'], [75, 102, '#ffe7a8']],
    draw(p) {
      p.shadow(75, 117, 72, 3);
      p.block(6, 14, 138, 102, C.plasterC);
      stains(p, 8, 16, 134, 30, dk(C.plasterC[1], 0.18), 14);
      p.speck(7, 15, 136, 100, dk(C.plasterC[1], 0.12), 0.03);
      p.r(4, 10, 142, 5, C.plasterC[0]).r(4, 14, 142, 1, C.plasterC[2]).box(3, 9, 144, 7, INK);
      [40, 66, 92].forEach(y => { p.r(6, y, 138, 3, C.plasterT[1]).r(6, y + 3, 138, 1, C.plasterT[3]); });
      [[18, 18], [44, 18], [92, 18], [118, 18], [18, 44], [44, 44], [92, 44], [118, 44], [18, 70], [118, 70]].forEach(([x, y], i) =>
        grillWindow(p, x, y, 14, 15, i === 6));
      [[61, 22], [61, 48]].forEach(([x, y]) => grillWindow(p, x, y, 26, 10));
      acUnit(p, 46, 35); acUnit(p, 120, 61); acUnit(p, 20, 61);
      // balcony with laundry and pots
      p.r(88, 61, 34, 2, C.plasterC[2]).box(87, 60, 36, 4, INK);
      for (let i = 89; i < 122; i += 3) p.r(i, 64, 1, 6, C.steel[3]);
      p.r(88, 69, 34, 1, INK);
      p.line(90, 54, 120, 55, INK);
      [[92, C.pink[1]], [97, C.teal[1]], [102, C.marigold[1]], [108, '#ffffff'], [113, C.navy[1]]].forEach(([x, c]) => p.r(x as number, 55, 4, 5, c as string).box((x as number) - 1, 54, 6, 7, INK));
      plantPot(p, 23, 87); plantPot(p, 33, 87);
      // roof: Sintex tank, dish, antenna
      p.r(24, 0, 14, 10, '#2b2a2e').r(26, 1, 1, 8, '#4a4850').r(23, 0, 16, 1, '#1b1a1d').box(23, -1, 16, 11, INK);
      p.ell(114, 6, 5, 3, C.steel[1]).p(112, 5, C.steel[0]).line(114, 6, 118, 9, INK).line(117, 9, 117, 10, INK);
      p.line(132, 9, 132, 1, INK).line(128, 2, 136, 2, INK).line(129, 5, 135, 5, INK);
      // entrance with grill gate and block number
      p.r(64, 94, 22, 22, '#2e2730').r(66, 96, 18, 20, '#3a3138');
      for (let i = 66; i < 84; i += 3) p.r(i, 96, 1, 20, C.steel[2]);
      p.r(66, 104, 18, 1, C.steel[2]).box(63, 93, 24, 24, INK);
      signBoard(p, 66, 85, 18, 7, C.navy[1], 'C-44', '#ffffff');
      p.r(60, 116, 30, 3, CONCRETE[1]).box(59, 115, 32, 5, INK);
      p.text('NO PARKING', 96, 104, C.plasterT[1]);
    }
  },
  gym: {
    w: 116, h: 96, foot: [-56, -22, 112, 20], glow: [[30, 52, '#cfe8ff'], [86, 52, '#cfe8ff']],
    draw(p) {
      const R = ['#9aa8c6', '#7887ab', '#5d6b8f', '#424d6c'];
      p.shadow(58, 93, 56, 3);
      p.block(4, 22, 108, 72, R);
      p.speck(5, 23, 106, 70, dk(R[1], 0.15), 0.04);
      stains(p, 6, 24, 104, 20, dk(R[1], 0.25), 8);
      p.r(2, 18, 112, 5, R[3]).box(1, 17, 114, 7, INK);
      signBoard(p, 18, 4, 80, 12, C.marigold[1], 'IRON PAW GYM', INK);
      [[10, 7], [101, 7]].forEach(([x, y]) => p.r(x, y + 2, 6, 2, INK).r(x, y, 2, 6, INK).r(x + 5, y, 2, 6, INK));
      [[10, 34], [70, 34]].forEach(([x, y]) => {
        p.r(x, y, 36, 30, GLASS[2]).r(x, y, 36, 3, GLASS[1]).box(x - 1, y - 1, 38, 32, INK);
        p.line(x + 4, y + 26, x + 18, y + 26, GLASS[3]).line(x + 18, y + 26, x + 24, y + 16, GLASS[3]).line(x + 26, y + 26, x + 32, y + 26, GLASS[3]);
        p.line(x + 3, y + 10, x + 12, y + 3, GLASS[0]).line(x + 5, y + 12, x + 14, y + 5, GLASS[0]);
      });
      p.r(49, 58, 18, 35, GLASS[3]).r(57, 58, 1, 35, INK).r(53, 70, 1, 8, C.steel[1]).r(61, 70, 1, 8, C.steel[1]).box(48, 57, 20, 37, INK);
      signBoard(p, 50, 46, 16, 7, '#e04c80', 'OPEN', '#ffffff');
      p.r(14, 70, 12, 14, '#f7ead0').box(13, 69, 14, 16, INK).text('JOIN', 15, 72, C.pink[2]).r(15, 79, 10, 1, C.teal[2]).r(15, 81, 8, 1, C.teal[2]);
      p.r(2, 92, 112, 2, CONCRETE[2]);
    }
  },
  shops: {
    w: 100, h: 78, foot: [-48, -18, 96, 16],
    draw(p) {
      p.shadow(50, 75, 48, 3);
      p.block(3, 6, 94, 70, C.plasterT);
      stains(p, 4, 8, 92, 18, dk(C.plasterT[1], 0.25), 10);
      p.speck(4, 7, 92, 68, lt(C.plasterT[1], 0.2), 0.04);
      signBoard(p, 6, 14, 42, 9, C.teal[1], 'SHARMA STORE', '#ffffff');
      signBoard(p, 52, 14, 42, 9, C.pink[1], 'MOBILE REPAIR', '#ffffff');
      [[6, 28], [52, 28]].forEach(([x, y]) => {
        p.r(x, y, 42, 46, C.steel[2]);
        for (let j = y; j < y + 46; j += 3) p.r(x, j, 42, 1, C.steel[3]).r(x, j + 1, 42, 1, C.steel[1]);
        p.box(x - 1, y - 1, 44, 48, INK).r(x + 19, y + 42, 4, 3, C.marigold[2]).box(x + 18, y + 41, 6, 5, INK);
      });
      p.r(24, 34, 10, 6, '#f7ead0').text('CALL', 25, 35, INK);
      p.r(66, 40, 14, 9, '#fff3c4').line(67, 42, 78, 42, C.navy[2]).line(67, 44, 76, 44, C.navy[2]).line(67, 46, 72, 46, C.navy[2]);
      p.r(1, 74, 98, 3, CONCRETE[1]).box(0, 73, 100, 5, INK);
    }
  },
  cafe: {
    w: 132, h: 96, foot: [-62, -20, 124, 18], glow: [[44, 70, '#ffd27a'], [66, 30, '#ffc970'], [96, 30, '#ffc970']],
    draw(p) {
      const peach = ['#f8d0b0', '#eeb48f', '#cf8f6d', '#9e6550'];
      p.shadow(66, 93, 64, 3);
      p.block(4, 16, 124, 78, peach);
      p.speck(5, 17, 122, 76, lt(peach[1], 0.25), 0.04);
      stains(p, 6, 18, 120, 14, dk(peach[1], 0.2), 7);
      p.r(2, 12, 128, 5, C.wood[2]).box(1, 11, 130, 7, INK);
      signBoard(p, 30, 1, 72, 10, '#fff3e0', 'CHAI & CRUMBS', C.pink[2]);
      for (let i = 0; i < 26; i++) p.r(5 + i * 5, 22, 5, 9, i % 2 ? '#fff3e0' : C.pink[1]);
      p.box(4, 21, 124, 11, INK);
      for (let i = 0; i < 26; i++) p.disc(7 + i * 5, 32, 2, i % 2 ? '#fff3e0' : C.pink[1]);
      p.line(6, 35, 126, 35, INK);
      for (let i = 10; i < 124; i += 8) p.p(i, 36, i % 16 ? '#ffd27a' : '#ff9ec0');
      p.r(10, 42, 64, 36, '#4d3a5c').r(10, 42, 64, 3, '#5f4a70').box(9, 41, 66, 38, INK);
      [[18, 66], [44, 66]].forEach(([x, y]) => { p.r(x, y, 14, 2, '#7d6390').r(x + 6, y + 2, 2, 8, '#7d6390').r(x - 2, y + 4, 4, 2, '#7d6390').r(x + 12, y + 4, 4, 2, '#7d6390'); });
      p.line(14, 48, 30, 44, '#7a6590').line(16, 52, 34, 47, '#7a6590');
      p.r(88, 46, 22, 46, C.teal[2]).r(88, 46, 22, 2, C.teal[1]).box(87, 45, 24, 48, INK);
      p.disc(99, 56, 5, GLASS[1]).p(97, 54, GLASS[0]).p(98, 53, GLASS[0]);
      p.r(92, 66, 14, 7, '#f7ead0').box(91, 65, 16, 9, INK).text('OPEN', 92, 67, '#2f9e5a');
      p.r(106, 70, 2, 4, C.steel[1]);
      plantPot(p, 78, 80); plantPot(p, 116, 80);
      p.r(114, 58, 12, 18, '#2f3a2f').box(113, 57, 14, 20, C.wood[2]).text('BUN', 115, 60, '#f4ead6').text('30', 116, 67, C.marigold[0]);
      p.line(114, 77, 112, 92, C.wood[2]).line(125, 77, 127, 92, C.wood[2]);
      p.r(2, 92, 128, 3, CONCRETE[1]).box(1, 91, 130, 5, INK);
    }
  },
  dairy: {
    w: 36, h: 46, foot: [-16, -10, 32, 9], glow: [[18, 14, '#fff1c9']],
    draw(p) {
      p.shadow(18, 43, 16, 2);
      p.block(3, 12, 30, 32, ['#f4f7fb', '#dbe3ee', '#b4c0d0', '#8792a6']);
      p.r(1, 6, 34, 6, C.navy[1]).box(0, 5, 36, 8, INK).text('MILK', 10, 7, '#ffffff');
      p.r(7, 18, 22, 10, '#3d4866').box(6, 17, 24, 12, INK);
      p.r(9, 20, 4, 6, '#ffffff').r(15, 20, 4, 6, '#ffffff').r(21, 20, 4, 6, '#ffe08a');
      p.r(5, 30, 26, 2, C.navy[1]);
      p.block(8, 36, 9, 6, [C.teal[0], C.teal[1], C.teal[2]]).block(20, 36, 9, 6, [C.teal[0], C.teal[1], C.teal[2]]);
    }
  },
  tapri: {
    w: 52, h: 46, foot: [-22, -10, 44, 9], glow: [[22, 12, '#ffcf7a']],
    draw(p) {
      p.shadow(26, 43, 24, 2);
      for (let i = 0; i < 46; i++) p.r(3 + i, 5 + Math.floor(i / 16), 1, 5, i % 3 ? C.steel[1] : C.steel[3]);
      p.box(2, 4, 48, 9, INK);
      p.r(5, 12, 2, 30, INK).r(45, 12, 2, 30, INK);
      p.p(22, 13, '#ffe7a8').p(22, 14, '#ffcf7a').line(22, 9, 22, 12, INK);
      p.block(5, 28, 42, 12, C.teal);
      p.line(6, 33, 45, 33, C.teal[2]).text('CHAI ₹10', 9, 31, '#f7ead0');
      p.r(5, 26, 42, 2, C.teal[3]).box(4, 25, 44, 4, INK);
      p.disc(12, 21, 3, C.steel[1]).p(11, 20, '#ffffff').r(9, 24, 7, 1, C.steel[2]).line(15, 20, 18, 18, INK).box(8, 17, 9, 8, INK);
      [[22, 21], [26, 21], [30, 21]].forEach(([x, y]) => p.r(x, y, 3, 4, C.brick[1]).r(x, y + 3, 3, 1, C.brick[3]).p(x, y, C.brick[0]));
      p.r(36, 18, 6, 7, '#f6e7c1').r(37, 21, 4, 3, '#d9a35f').box(35, 17, 8, 9, INK);
      p.p(11, 15, '#ffffff').p(12, 13, '#ffffff').p(11, 11, '#ffffff');
      p.disc(10, 42, 2, INK).disc(42, 42, 2, INK);
      p.r(30, 38, 8, 2, C.wood[1]).r(31, 40, 1, 4, C.wood[2]).r(36, 40, 1, 4, C.wood[2]);
    }
  },
  pole: {
    w: 20, h: 100, foot: [-2, -3, 5, 3], glow: [[16, 9, '#ffc56b']],
    draw(p) {
      p.shadow(8, 98, 5, 1);
      p.r(6, 6, 4, 92, CONCRETE[1]).r(6, 6, 1, 92, CONCRETE[0]).r(9, 6, 1, 92, CONCRETE[3]).box(5, 5, 6, 94, INK);
      p.r(2, 14, 12, 2, CONCRETE[2]).box(1, 13, 14, 4, INK).r(3, 20, 10, 2, CONCRETE[2]).box(2, 19, 12, 4, INK);
      p.line(10, 8, 15, 6, INK).r(13, 6, 5, 3, '#4a4850').r(14, 9, 3, 1, '#ffe7a8').box(12, 5, 7, 5, INK);
      p.r(3, 40, 10, 8, '#7f9b85').box(2, 39, 12, 10, INK).line(4, 43, 11, 43, '#5f7a66');
      p.r(4, 60, 8, 6, '#f7ead0').text('44', 5, 61, INK);
    }
  },
  busstop: {
    w: 70, h: 44, foot: [-32, -9, 64, 8],
    draw(p) {
      p.shadow(35, 42, 33, 2);
      p.r(4, 4, 62, 4, C.leaf[2]).r(4, 4, 62, 1, C.leaf[1]).box(3, 3, 64, 6, INK);
      p.r(8, 9, 54, 20, mix(GLASS[0], '#ffffff', 0.4)).box(7, 8, 56, 22, INK);
      p.r(42, 11, 16, 15, '#f7ead0').box(41, 10, 18, 17, INK).text('CHAI', 44, 13, C.pink[2]).r(44, 20, 12, 3, C.marigold[1]);
      p.r(6, 9, 2, 33, C.steel[2]).r(62, 9, 2, 33, C.steel[2]);
      p.r(12, 30, 46, 3, C.wood[1]).box(11, 29, 48, 5, INK).r(14, 34, 2, 8, INK).r(54, 34, 2, 8, INK);
      p.r(66, 2, 2, 40, C.steel[2]).disc(67, 4, 4, C.marigold[1]).text('B', 66, 2, INK);
    }
  },
  auto: {
    w: 46, h: 34, foot: [-20, -8, 40, 7],
    draw(p) {
      p.shadow(23, 32, 21, 2);
      p.block(3, 16, 40, 12, [lt('#3f8f4f', 0.25), '#3f8f4f', '#2b6b38']);
      p.r(6, 3, 34, 13, '#f2b632').r(6, 3, 34, 2, lt('#f2b632', 0.4)).r(36, 4, 4, 12, dk('#f2b632', 0.25)).box(5, 2, 36, 15, INK);
      p.r(9, 6, 10, 9, mix(GLASS[0], '#ffffff', 0.3)).box(8, 5, 12, 11, INK).line(10, 13, 16, 7, '#ffffff');
      p.r(23, 6, 14, 10, '#2e2730').box(22, 5, 16, 12, INK);
      p.r(1, 19, 4, 4, '#fff6c8').box(0, 18, 6, 6, INK);
      p.text('DL 1R', 22, 21, INK);
      p.disc(10, 29, 4, INK).disc(10, 29, 1, '#aaaaaa').disc(36, 29, 4, INK).disc(36, 29, 1, '#aaaaaa');
    }
  },
  scooter: {
    w: 28, h: 22, foot: [-12, -5, 24, 4],
    draw(p) {
      p.shadow(14, 20, 12, 1);
      p.disc(6, 17, 3, INK).disc(22, 17, 3, INK).p(6, 17, '#aaaaaa').p(22, 17, '#aaaaaa');
      p.r(4, 10, 14, 5, '#8fd3e8').r(17, 6, 4, 9, '#8fd3e8').r(4, 10, 14, 1, '#c4ecf6').r(8, 8, 8, 2, INK);
      p.line(20, 6, 23, 3, INK).line(21, 3, 25, 3, INK).p(23, 9, '#fff6c8');
      p.outline();
    }
  },
  neem: {
    w: 48, h: 60, foot: [-4, -5, 8, 5],
    draw(p) {
      p.shadow(24, 57, 18, 3);
      p.r(21, 34, 6, 24, C.wood[2]).r(21, 34, 2, 24, C.wood[1]).line(24, 44, 30, 38, C.wood[2]).line(23, 40, 17, 35, C.wood[2]);
      const blobs: [number, number, number][] = [[24, 18, 13], [12, 28, 10], [36, 27, 10], [24, 32, 11], [16, 14, 8], [33, 13, 8]];
      blobs.forEach(([x, y, r]) => p.disc(x, y, r + 1, INK));
      blobs.forEach(([x, y, r]) => p.disc(x, y, r, C.leaf[2]));
      blobs.forEach(([x, y, r]) => p.disc(x - 2, y - 2, r - 3, C.leaf[1]));
      p.speck(6, 4, 38, 38, C.leaf[0], 0.05);
      p.speck(6, 10, 38, 34, C.leaf[3], 0.06);
      for (let i = 0; i < 6; i++) p.p(8 + Math.floor(p.rnd() * 32), 6 + Math.floor(p.rnd() * 30), '#e8df7a');
    }
  },
  bush: {
    w: 22, h: 16, foot: [-9, -5, 18, 5],
    draw(p) {
      p.shadow(11, 14, 10, 1);
      [[6, 9, 5], [12, 7, 6], [17, 10, 4]].forEach(([x, y, r]) => p.disc(x, y, r, C.leaf[2]));
      [[6, 8, 3], [12, 6, 4]].forEach(([x, y, r]) => p.disc(x - 1, y - 1, r, C.leaf[1]));
      p.p(8, 6, C.pink[1]).p(14, 5, C.marigold[1]).p(16, 9, C.pink[1]).p(5, 11, C.marigold[0]);
      p.outline();
    }
  },
  bench: {
    w: 32, h: 18, foot: [-14, -6, 28, 5],
    draw(p) {
      p.shadow(16, 16, 15, 1);
      p.r(3, 2, 26, 3, C.leaf[2]).r(3, 6, 26, 3, C.leaf[2]).r(3, 2, 26, 1, C.leaf[1]).r(3, 6, 26, 1, C.leaf[1]);
      p.r(2, 10, 28, 3, CONCRETE[1]).r(2, 10, 28, 1, CONCRETE[0]);
      p.r(4, 13, 3, 4, CONCRETE[2]).r(25, 13, 3, 4, CONCRETE[2]);
      p.outline();
    }
  },
  stumps: {
    w: 20, h: 20,
    draw(p) {
      [4, 7, 10].forEach(x => p.r(x, 4, 1, 13, '#f7ead0').p(x, 16, C.wood[2]));
      p.r(4, 3, 7, 1, C.wood[1]);
      p.line(14, 18, 17, 5, C.wood[1]).line(15, 18, 18, 5, C.wood[0]).r(16, 2, 2, 4, '#3a3138');
      p.disc(7, 18, 1, '#e04c50');
      p.outline();
    }
  },
  railing: {
    w: 16, h: 12, foot: [-8, -3, 16, 3],
    draw(p) {
      p.r(0, 2, 16, 1, C.leaf[2]).r(0, 7, 16, 1, C.leaf[2]);
      for (let i = 1; i < 16; i += 3) p.r(i, 1, 1, 10, C.leaf[2]).p(i, 0, C.leaf[1]);
      p.outline();
    }
  },
  barricade: {
    w: 34, h: 22, foot: [-16, -5, 32, 5],
    draw(p) {
      p.shadow(17, 20, 15, 1);
      p.r(5, 12, 2, 8, INK).r(27, 12, 2, 8, INK);
      p.r(2, 3, 30, 8, '#f7ead0');
      for (let i = 0; i < 30; i += 6) p.line(2 + i, 10, 2 + i + 5, 3, '#e04c50').line(3 + i, 10, 3 + i + 5, 3, '#e04c50');
      p.box(1, 2, 32, 10, INK);
      p.r(6, 13, 22, 6, C.marigold[1]).box(5, 12, 24, 8, INK).text('CLOSED', 7, 14, INK);
    }
  },
  bin: {
    w: 12, h: 16, foot: [-5, -3, 10, 3],
    draw(p) {
      p.r(2, 4, 8, 11, C.teal[1]).r(2, 4, 8, 1, C.teal[0]).r(8, 5, 2, 10, C.teal[2]);
      p.r(1, 2, 10, 2, C.teal[2]);
      p.text('USE', 2, 7, '#ffffff');
      p.outline();
    }
  },
  cwall: {
    w: 34, h: 30, foot: [-17, -6, 34, 6],
    draw(p) {
      const pr = rng(31);
      p.block(1, 8, 32, 20, C.plasterT);
      p.speck(2, 9, 30, 18, dk(C.plasterT[1], 0.2), 0.06);
      for (let j = 18; j < 24; j++) for (let i = 18; i < 28; i++) {
        const mortar = j % 3 === 0 || (i + (Math.floor(j / 3) % 2) * 2) % 4 === 0;
        p.p(i, j, mortar ? '#e8b48f' : C.brick[1]);
      }
      for (let i = 0; i < 70; i++) {
        const x = 1 + pr() * 32, y = 2 + pr() * 10 + (x < 14 ? pr() * 8 : 0), r = pr();
        p.p(x, y, r < 0.45 ? C.pink[1] : r < 0.6 ? C.pink[0] : r < 0.85 ? C.leaf[1] : C.leaf[2]);
      }
    }
  },
  plasticbag: {
    w: 8, h: 8,
    draw(p) {
      p.r(1, 2, 6, 5, '#f4f1f7').p(1, 1, '#f4f1f7').p(6, 1, '#f4f1f7').r(2, 5, 4, 1, '#cfcad8');
      p.outline();
    }
  },

  /* ------------------------------ Mohit's room ------------------------------ */
  window: {
    w: 34, h: 30,
    draw(p) {
      p.r(2, 2, 30, 24, '#cfe3f2').r(2, 18, 30, 8, '#e9d2be').r(6, 12, 6, 8, '#c4b2a6').r(20, 9, 8, 11, '#c4b2a6');
      p.r(2, 2, 30, 24, 'rgba(0,0,0,0)');
      for (let i = 4; i < 32; i += 4) p.r(i, 2, 1, 24, C.steel[3]);
      p.r(17, 2, 1, 24, INK).r(2, 13, 30, 1, INK).box(1, 1, 32, 26, INK);
      p.r(0, 26, 34, 3, C.wood[1]).r(0, 26, 34, 1, C.wood[0]).box(-1, 25, 36, 5, INK);
      p.r(3, 3, 3, 22, '#e9a6b8').r(28, 3, 3, 22, '#e9a6b8');
    }
  },
  posterInk: {
    w: 22, h: 28,
    draw(p) {
      p.r(1, 1, 20, 26, '#f4ede0').box(0, 0, 22, 28, INK);
      p.r(3, 3, 16, 22, '#26314f');
      p.disc(11, 15, 6, '#141018').disc(11, 15, 2, '#c94f6d').p(11, 15, '#f4ede0');
      p.r(5, 5, 12, 1, C.marigold[1]).r(6, 7, 10, 1, C.marigold[2]);
      p.text('1939', 4, 21, '#f4ede0');
    }
  },
  wallshelf: {
    w: 28, h: 18,
    draw(p) {
      p.r(1, 13, 26, 2, C.wood[1]).r(1, 13, 26, 1, C.wood[0]);
      [[3, C.pink[1], 8], [6, C.teal[1], 10], [9, C.marigold[1], 7]].forEach(([x, c, h]) => p.r(x as number, 13 - (h as number), 3, h as number, c as string));
      plantPot(p, 18, 5);
      p.outline();
    }
  },
  desk: {
    w: 60, h: 52, foot: [-28, -10, 56, 9], glow: [[38, 14, '#9fd8ff'], [12, 24, '#bfe9ff']],
    draw(p) {
      p.shadow(30, 50, 28, 2);
      p.r(3, 31, 2, 19, '#f4f1f7').r(55, 31, 2, 19, '#f4f1f7').r(8, 31, 1, 15, '#cfcad8').r(51, 31, 1, 15, '#cfcad8');
      p.r(1, 28, 58, 3, '#ffffff').r(1, 30, 58, 1, '#d8d3e0');
      p.r(26, 4, 26, 17, '#24222d').r(28, 6, 22, 13, '#fff8ec');
      [['#fffaf4', 28, 9], ['#7e768a', 35, 9], ['#ffd1e1', 42, 9], ['#a6d8ff', 28, 14], ['#ffc23c', 35, 14], ['#fffaf4', 42, 14]].forEach(([c, x, y]) => p.r(x as number, y as number, 6, 4, c as string));
      p.r(29, 6, 4, 2, '#ff8fb6');
      p.r(37, 21, 4, 6, '#3a3946').r(34, 26, 10, 2, '#2b2a35');
      p.r(4, 18, 18, 10, '#2b2a35').r(5, 19, 16, 8, '#1d2140');
      [[7, 20, '#ff4f8b'], [7, 22, '#36dcae'], [9, 24, '#ffc23c']].forEach(([x, y, c]) => p.r(x as number, y as number, 8, 1, c as string));
      p.r(2, 27, 22, 1, '#9b98a8');
      ['#ff4f8b', '#ffc23c', '#36dcae', '#5bb6ff', '#a98bff'].forEach((c, i) => p.r(26 + i * 4, 26, 4, 2, c));
      p.r(49, 25, 3, 2, '#2b2a35');
      p.r(53, 22, 3, 5, '#e3242b').r(53, 24, 3, 1, INK);
      p.outline();
    }
  },
  chair: {
    w: 18, h: 26, foot: [-6, -4, 12, 4],
    draw(p) {
      p.shadow(9, 24, 7, 1);
      p.r(4, 2, 10, 11, C.shirt[1]).r(5, 3, 2, 8, C.shirt[0]);
      p.r(3, 14, 12, 3, C.shirt[1]).r(8, 17, 2, 4, C.steel[2]);
      p.line(9, 21, 3, 23, INK).line(9, 21, 15, 23, INK).line(9, 21, 9, 24, INK);
      p.outline();
    }
  },
  guitar: {
    w: 16, h: 44, foot: [-4, -3, 8, 3],
    draw(p) {
      p.shadow(8, 42, 6, 1);
      p.r(7, 3, 2, 20, C.wood[3]).r(6, 0, 4, 4, '#18151d').p(5, 1, C.steel[1]).p(10, 1, C.steel[1]).p(5, 3, C.steel[1]).p(10, 3, C.steel[1]);
      p.disc(8, 25, 4, '#17141c').disc(8, 33, 6, '#17141c');
      p.disc(8, 27, 2, '#000000').p(6, 26, '#cfa95a').p(10, 26, '#cfa95a');
      p.p(5, 31, '#4a4458').p(4, 33, '#4a4458').r(6, 36, 4, 1, '#3a2b22');
      p.outline();
    }
  },
  piano: {
    w: 56, h: 32, foot: [-26, -6, 52, 5],
    draw(p) {
      p.shadow(28, 30, 26, 2);
      p.line(10, 29, 20, 12, '#4a4757').line(20, 29, 10, 12, '#4a4757').line(36, 29, 46, 12, '#4a4757').line(46, 29, 36, 12, '#4a4757');
      p.r(1, 3, 54, 9, '#1f1d26').r(2, 4, 52, 1, '#34313f');
      p.p(4, 5, '#36dcae').p(6, 5, '#ff4f8b').r(9, 5, 5, 1, '#5bb6ff');
      p.r(3, 7, 50, 4, '#ffffff');
      for (let i = 4; i < 52; i += 2) if (i % 14 !== 0 && i % 14 !== 6) p.r(i, 7, 1, 2, INK);
      p.r(25, 27, 5, 2, '#1f1d26');
      p.outline();
    }
  },
  bed: {
    w: 46, h: 44, foot: [-22, -30, 44, 28],
    draw(p) {
      p.shadow(23, 42, 22, 2);
      p.r(2, 2, 42, 10, C.wood[2]).r(2, 2, 42, 2, C.wood[1]);
      p.r(3, 10, 40, 30, '#fbefe2');
      p.r(6, 12, 15, 7, '#ffffff').r(25, 12, 15, 7, '#ffffff').r(6, 18, 15, 1, '#e3d9cc').r(25, 18, 15, 1, '#e3d9cc');
      p.r(3, 21, 40, 19, '#f7d6e2').r(3, 21, 40, 1, '#ffe8ef');
      [[9, 26], [20, 31], [32, 25], [28, 35], [8, 35], [38, 33]].forEach(([x, y]) => p.p(x, y, '#e8436b').p(x + 1, y, '#e8436b').p(x, y + 1, '#e8436b').p(x + 1, y - 1, C.leaf[2]));
      p.r(3, 39, 40, 3, C.wood[2]);
      p.r(30, 21, 13, 6, '#f2c3d3');
      p.outline();
    }
  },
  rug: {
    w: 66, h: 36,
    draw(p) {
      for (let j = 4; j < 32; j += 2) { p.r(0, j, 3, 1, '#f5e6c8'); p.r(63, j, 3, 1, '#f5e6c8'); }
      p.r(3, 2, 60, 32, '#c94f6d').box(2, 1, 62, 34, INK);
      p.box(6, 5, 54, 26, '#ffd1a0').r(9, 8, 48, 20, '#e8738f');
      for (let j = -6; j <= 6; j++) { const w = 10 - Math.abs(j) * 1.5; if (w > 0) p.r(33 - w, 18 + j, w * 2, 1, '#ffd1a0'); }
      for (let j = -3; j <= 3; j++) { const w = 5 - Math.abs(j) * 1.5; if (w > 0) p.r(33 - w, 18 + j, w * 2, 1, '#c94f6d'); }
      p.speck(9, 8, 48, 20, '#d9607e', 0.05);
    }
  },
  laundry: {
    w: 22, h: 14, foot: [-9, -4, 18, 4],
    draw(p) {
      p.ell(10, 9, 9, 4, '#5b7fb8').r(5, 7, 4, 2, '#46679c');
      p.r(7, 3, 8, 5, '#ff8fb6').r(5, 3, 2, 2, '#ff8fb6').r(15, 3, 2, 2, '#ff8fb6');
      p.r(14, 8, 4, 2, '#ffffff');
      p.outline();
    }
  },
  beanbag: {
    w: 24, h: 20, foot: [-10, -6, 20, 6],
    draw(p) {
      p.shadow(12, 18, 11, 1);
      p.ell(12, 11, 10, 7, '#6a5794').ell(12, 10, 6, 3, '#584781').p(6, 6, '#8a77b5').p(7, 5, '#8a77b5').p(8, 5, '#8a77b5');
      p.outline();
    }
  },
  books: {
    w: 14, h: 12, foot: [-5, -3, 10, 3],
    draw(p) {
      p.r(2, 8, 10, 3, '#5bb6ff').r(3, 5, 9, 3, '#ff8fb6').r(1, 2, 10, 3, '#36dcae').p(9, 3, '#ffffff').p(10, 6, '#ffffff');
      p.outline();
    }
  },
  backpack: {
    w: 14, h: 16, foot: [-5, -3, 10, 3],
    draw(p) {
      p.r(2, 3, 10, 12, '#e0a83a').r(2, 3, 10, 1, '#f2c86a').r(4, 9, 6, 4, '#c98f2a').p(6, 1, INK).p(7, 1, INK).p(5, 2, INK).p(8, 2, INK);
      p.outline();
    }
  },
  slippers: {
    w: 14, h: 8,
    draw(p) {
      p.ell(4, 4, 3, 3, '#ffd1e1').ell(10, 4, 3, 3, '#ffd1e1').r(2, 2, 5, 1, '#ff8fb6').r(8, 2, 5, 1, '#ff8fb6');
      p.outline();
    }
  },
  plant: {
    w: 14, h: 22, foot: [-5, -3, 10, 3],
    draw(p) {
      p.r(3, 14, 8, 7, C.plasterT[2]).r(3, 14, 8, 1, C.plasterT[1]);
      p.line(7, 14, 3, 4, C.leaf[2]).line(7, 14, 11, 3, C.leaf[2]).line(7, 14, 7, 1, C.leaf[1]);
      p.r(2, 5, 3, 3, C.leaf[1]).r(9, 4, 3, 3, C.leaf[1]).r(6, 1, 3, 3, C.leaf[0]).r(4, 9, 3, 2, C.leaf[2]).r(8, 9, 3, 2, C.leaf[1]);
      p.outline();
    }
  },

  /* ------------------------------ gym ------------------------------ */
  treadmill: {
    w: 34, h: 28, foot: [-15, -8, 30, 7],
    draw(p) {
      p.shadow(17, 26, 15, 1);
      p.r(2, 19, 28, 4, '#2a2733').r(3, 20, 26, 1, '#4a4757');
      p.line(25, 19, 28, 4, '#3f4a5a').line(26, 19, 29, 4, '#3f4a5a');
      p.r(24, 1, 9, 4, '#2a2733').r(26, 2, 4, 2, '#36dcae');
      p.r(20, 9, 8, 1, INK);
      p.outline();
    }
  },
  rack: {
    w: 38, h: 22, foot: [-18, -6, 36, 6],
    draw(p) {
      p.shadow(19, 20, 17, 1);
      p.r(2, 6, 34, 2, '#3f4a5a').r(2, 13, 34, 2, '#3f4a5a').r(3, 6, 2, 14, '#3f4a5a').r(33, 6, 2, 14, '#3f4a5a');
      ['#ff4f8b', '#5bb6ff', '#ffc23c', '#36dcae', '#a98bff'].forEach((c, i) => { const x = 5 + i * 6; p.r(x, 2, 2, 4, c).r(x + 3, 2, 2, 4, c).r(x + 2, 3, 1, 2, INK); });
      [8, 17, 26].forEach(x => p.disc(x, 11, 2, '#2a2733'));
      p.outline();
    }
  },
  benchpress: {
    w: 38, h: 24, foot: [-16, -6, 32, 6],
    draw(p) {
      p.shadow(19, 22, 16, 1);
      p.r(10, 13, 18, 3, '#a3364a').r(10, 13, 18, 1, '#c44a60').r(18, 16, 2, 6, INK);
      p.r(8, 6, 2, 16, '#3f4a5a').r(28, 6, 2, 16, '#3f4a5a');
      p.r(1, 6, 36, 1, C.steel[1]).r(1, 3, 3, 7, '#2a2733').r(34, 3, 3, 7, '#2a2733');
      p.outline();
    }
  },
  cooler: {
    w: 12, h: 26, foot: [-5, -3, 10, 3],
    draw(p) {
      p.r(3, 1, 6, 6, '#a6d8ff').r(4, 2, 2, 3, '#d8efff');
      p.r(1, 7, 10, 18, '#f4f1f7').r(9, 8, 2, 17, '#cfcad8').p(4, 10, '#5bb6ff').p(7, 10, '#ff4f8b');
      p.outline();
    }
  },
  speaker: {
    w: 14, h: 20, foot: [-5, -3, 10, 3],
    draw(p) {
      p.r(2, 2, 10, 17, '#2a2733').disc(7, 12, 3, '#4a4757').p(7, 12, INK).disc(7, 5, 1, '#4a4757');
      p.outline();
    }
  },
  mat: {
    w: 34, h: 14,
    draw(p) {
      p.r(1, 1, 32, 5, '#ff8fb6').r(1, 7, 32, 5, '#5cb0a9').r(1, 1, 32, 1, '#ffb3cd').r(1, 7, 32, 1, '#86d0c9');
      p.outline();
    }
  },

  /* ------------------------------ café ------------------------------ */
  counter: {
    w: 70, h: 34, foot: [-34, -12, 68, 11],
    draw(p) {
      p.shadow(35, 32, 33, 2);
      p.block(2, 14, 66, 17, C.wood);
      for (let x = 12; x < 66; x += 13) p.r(x, 16, 1, 14, C.wood[2]);
      p.r(1, 11, 68, 3, '#f4ede0').r(1, 11, 68, 1, '#ffffff');
      p.r(4, 1, 14, 10, '#3f4a5a').r(6, 3, 10, 3, '#9b98a8').r(8, 8, 4, 3, '#ffffff').p(9, 0, '#ffffff').p(11, 0, '#ffffff');
      p.r(32, 3, 26, 8, mix(GLASS[0], '#ffffff', 0.5));
      [34, 39, 44, 49, 54].forEach(x => p.r(x, 7, 3, 3, '#e9b06a').p(x, 7, '#f6d39b'));
      p.r(61, 6, 5, 5, '#ffc23c');
      p.text('CHAI', 22, 20, '#f7ead0');
      p.outline();
    }
  },
  tableset: {
    w: 30, h: 24, foot: [-10, -6, 20, 6],
    draw(p) {
      p.shadow(15, 22, 13, 1);
      p.r(1, 9, 7, 3, '#ff8fb6').r(2, 12, 1, 9, '#7a4f45').r(7, 12, 1, 9, '#7a4f45');
      p.r(22, 9, 7, 3, '#ff8fb6').r(23, 12, 1, 9, '#7a4f45').r(28, 12, 1, 9, '#7a4f45');
      p.ell(15, 8, 9, 3, '#fff8ec').r(14, 10, 2, 11, INK).r(11, 21, 8, 1, INK);
      p.r(13, 4, 3, 3, '#ffffff').p(14, 4, C.wood[1]);
      p.outline();
    }
  },
  menuboard: {
    w: 30, h: 20,
    draw(p) {
      p.r(1, 1, 28, 18, '#2f3a2f').box(0, 0, 30, 20, C.wood[2]);
      p.text('MENU', 6, 2, C.marigold[1]).r(3, 9, 18, 1, '#f4ead6').r(3, 12, 14, 1, '#f4ead6').r(3, 15, 20, 1, '#f4ead6');
      p.r(24, 9, 3, 1, C.marigold[0]).r(24, 12, 3, 1, C.marigold[0]).r(24, 15, 3, 1, C.marigold[0]);
    }
  },
  kdoor: {
    w: 22, h: 34,
    draw(p) {
      p.r(2, 6, 18, 27, '#9b98a8').r(2, 6, 18, 1, '#bdbac8').box(1, 5, 20, 29, INK);
      p.disc(11, 15, 4, '#1b1325').p(10, 14, '#4a4757');
      p.r(4, 22, 14, 2, '#cfcad8');
      p.r(3, 0, 16, 6, C.marigold[1]).box(2, -1, 18, 7, INK).text('STAFF', 4, 1, INK);
    }
  },

  /* ------------------------------ kitchen ------------------------------ */
  fridge: {
    w: 22, h: 40, foot: [-10, -7, 20, 6],
    draw(p) {
      p.shadow(11, 38, 10, 1);
      p.block(2, 2, 18, 35, ['#ffffff', '#e3dfea', '#bdb8c8']);
      p.r(2, 14, 18, 1, INK).r(16, 5, 1, 6, '#9b98a8').r(16, 18, 1, 9, '#9b98a8');
      p.r(5, 5, 4, 3, '#ffc23c').p(11, 6, '#ff8fb6').r(5, 20, 5, 4, '#f7ead0');
    }
  },
  stove: {
    w: 32, h: 28, foot: [-15, -8, 30, 7],
    draw(p) {
      p.shadow(16, 26, 15, 1);
      p.block(2, 9, 28, 16, ['#e3dfea', '#c4c0cc', '#9b98a8']);
      p.r(5, 14, 22, 8, '#2a2733');
      p.r(1, 6, 30, 3, '#4a4757').ell(9, 6, 4, 1, '#1b1325').ell(23, 6, 4, 1, '#1b1325');
      p.r(18, 1, 9, 5, '#9b98a8').r(27, 2, 3, 1, INK).box(17, 0, 11, 7, INK);
    }
  },
  sink: {
    w: 42, h: 28, foot: [-20, -8, 40, 7],
    draw(p) {
      p.shadow(21, 26, 19, 1);
      p.block(2, 10, 38, 15, C.wood);
      p.r(1, 7, 40, 3, '#f4ede0').r(10, 7, 14, 2, '#9fb3c8');
      p.r(16, 1, 2, 6, '#9b98a8').r(16, 1, 5, 2, '#9b98a8');
      p.r(32, 3, 6, 4, '#ff8fb6').r(20, 13, 1, 10, C.wood[2]).r(30, 13, 1, 10, C.wood[2]);
      p.outline();
    }
  },
  shelf: {
    w: 38, h: 42, foot: [-18, -7, 36, 6],
    draw(p) {
      p.shadow(19, 40, 17, 1);
      p.r(2, 2, 2, 38, C.wood[2]).r(34, 2, 2, 38, C.wood[2]);
      [12, 24, 36].forEach(y => p.r(1, y, 36, 2, C.wood[1]));
      [['#ffd54a', 5], ['#ff8fb6', 12], ['#5bb6ff', 19], ['#36dcae', 26]].forEach(([c, x]) => p.r(x as number, 5, 5, 7, c as string));
      [[6, 16], [20, 16]].forEach(([x, y]) => p.r(x, y, 11, 8, '#f4ede0').r(x + 2, y + 3, 7, 3, '#c0392b'));
      p.r(6, 29, 9, 7, '#c98a5a').r(20, 28, 12, 8, '#c98a5a');
      p.outline();
    }
  },
  crates: {
    w: 20, h: 16, foot: [-9, -5, 18, 5],
    draw(p) {
      p.r(1, 6, 10, 9, '#c98a5a').r(1, 10, 10, 1, '#8a5a44').r(9, 3, 9, 12, '#b0784b').r(9, 9, 9, 1, '#8a5a44');
      p.disc(4, 4, 2, '#ff7a3c').disc(7, 3, 2, '#ffd54a');
      p.outline();
    }
  },
  bagdown: {
    w: 32, h: 16,
    draw(p) {
      p.shadow(16, 14, 14, 2);
      p.r(2, 6, 24, 8, '#c08a52').r(2, 6, 24, 1, '#d6a36a');
      p.r(24, 4, 6, 10, '#24160f');
      p.p(8, 9, '#8a5c2e').p(9, 10, '#8a5c2e').p(16, 11, '#8a5c2e');
      p.outline();
    }
  },
  bowl: {
    w: 12, h: 8,
    draw(p) {
      p.r(1, 3, 10, 4, '#5bb6ff').r(2, 6, 8, 1, '#3d8fd6').r(1, 2, 10, 1, '#fff3d6').p(3, 1, '#e9c08a').p(5, 1, '#e9c08a').p(7, 1, '#e9c08a');
      p.outline();
    }
  },
  flour: {
    w: 16, h: 20,
    draw(p) {
      p.r(2, 4, 12, 15, '#f4ede0').r(11, 5, 3, 14, '#e2d6c2').r(4, 1, 8, 3, '#e2d6c2').r(5, 3, 6, 1, '#c0392b');
      p.r(3, 9, 10, 5, '#c0392b').text('ATTA', 3, 9, '#ffffff');
      p.outline();
    }
  },
  /* ------------------------------ supermarket ------------------------------ */
  mart: {
    w: 140, h: 100, foot: [-66, -20, 132, 18], glow: [[70, 15, '#fff1c9'], [28, 46, '#ffe7a8'], [112, 46, '#ffe7a8']],
    draw(p) {
      const wall = ['#f4f1e8', '#e4dfd2', '#c9c2b1', '#9d9584'];
      p.shadow(70, 97, 68, 3);
      p.block(4, 18, 132, 80, wall);
      p.speck(5, 19, 130, 78, '#ece8dc', 0.05);
      stains(p, 6, 26, 128, 10, dk(wall[1], 0.12), 6);
      p.r(2, 7, 136, 15, '#3f9a5a').r(2, 7, 136, 2, '#5cb877').r(2, 20, 136, 2, '#2c7342').box(1, 6, 138, 17, INK);
      p.r(2, 23, 136, 2, '#f2a33a').r(2, 25, 136, 1, dk('#f2a33a', 0.3));
      p.disc(11, 14, 4, '#f2a33a').r(9, 13, 4, 2, '#ffffff').p(9, 16, '#ffffff').p(12, 16, '#ffffff');
      p.text('BHATIA SUPER MART', 70 - Math.floor(Px.textWidth('BHATIA SUPER MART') / 2), 12, '#ffffff');
      const win = (x: number, w: number) => {
        p.r(x, 32, w, 30, '#a9cfe0');
        for (const y of [36, 44, 52]) {
          p.r(x + 1, y + 5, w - 2, 1, '#6f8fa3');
          for (let i = x + 2; i < x + w - 3; i += 4) p.r(i, y + 1 + (i % 3 ? 1 : 0), 3, 4 - (i % 3 ? 1 : 0), ['#e04c80', '#ffb347', '#5bb6ff', '#7ec96b', '#ffe08a'][(i + y) % 5]);
        }
        p.line(x + 6, 32, x + 1, 44, '#d8edf6').line(x + 12, 32, x + 3, 50, '#d8edf6');
        p.box(x - 1, 31, w + 2, 32, INK).r(x - 2, 63, w + 4, 2, wall[2]);
      };
      win(8, 40); win(92, 40);
      p.r(11, 35, 17, 9, '#e04c50').box(10, 34, 19, 11, INK).text('SALE', 12, 37, '#ffffff');
      p.r(108, 35, 21, 14, '#ffe08a').box(107, 34, 23, 16, INK).text('CAT', 113, 37, INK).text('FOOD', 111, 43, C.pink[2]);
      p.r(52, 34, 36, 62, '#bcd8e6').box(51, 33, 38, 64, INK);
      p.r(69, 34, 2, 62, '#7f9cbc').line(56, 40, 54, 52, '#e4f2f8').line(76, 40, 74, 52, '#e4f2f8');
      p.r(60, 60, 4, 1, C.steel[1]).r(76, 60, 4, 1, C.steel[1]);
      p.r(63, 29, 14, 3, '#3b3240').p(70, 30, '#ff4f5e');
      p.r(54, 92, 32, 3, '#3f9a5a');
      for (let k = 0; k < 3; k++) {
        const x = 10 + k * 5;
        p.r(x, 74, 22, 12, k === 2 ? C.steel[1] : C.steel[2]);
        for (let i = x + 2; i < x + 22; i += 3) p.r(i, 74, 1, 12, C.steel[3]);
        p.r(x, 73, 22, 1, '#e04c50').p(x + 3, 88, INK).p(x + 18, 88, INK);
      }
      p.box(9, 72, 34, 15, INK);
      p.r(100, 70, 28, 18, '#2f3a2f').box(99, 69, 30, 20, C.wood[2]).text('OPEN', 106, 73, '#7ef0a0').text('24 HRS', 102, 80, '#ffe08a');
      p.r(2, 96, 136, 3, CONCRETE[1]).box(1, 95, 138, 5, INK);
    }
  },
  aisleSnack: { w: 36, h: 36, foot: [-17, -10, 34, 9], draw: p => aisle(p, 'SNACKS', (x, y, i) => p.r(x, y + 1, 3, 5, ['#e04c50', '#ffd23c', '#5bb6ff', '#ff8a3c', '#7ec96b'][i % 5]).p(x + 1, y + 2, '#ffffff')) },
  aisleCat: {
    w: 36, h: 36, foot: [-17, -10, 34, 9],
    draw: p => aisle(p, 'CAT FOOD', (x, y, i) => i % 2
      ? p.r(x, y + 2, 3, 4, ['#e04c80', '#5bb6ff', '#ffb347'][i % 3]).r(x, y + 2, 3, 1, C.steel[1]).p(x + 1, y + 4, '#ffffff')
      : p.r(x, y, 3, 6, ['#ffb347', '#a5d8d0', '#ffa3c4'][i % 3]).p(x + 1, y + 2, '#2b2430').p(x, y + 1, '#ffffff'))
  },
  aisleToys: {
    w: 36, h: 36, foot: [-17, -10, 34, 9],
    draw: p => aisle(p, 'TOYS', (x, y, i) => i % 3 === 0
      ? p.line(x + 1, y + 6, x + 1, y, C.wood[1]).p(x, y, '#ff7ab0').p(x + 2, y, '#ffe08a').p(x + 1, y - 1, '#ff7ab0')
      : i % 3 === 1 ? p.r(x, y + 3, 3, 3, ['#e04c50', '#5bb6ff', '#7ec96b'][i % 3]).p(x, y + 3, '#ffffff')
        : p.r(x, y + 3, 3, 2, '#a69eb0').p(x + 3, y + 4, '#f2b6c4').p(x, y + 3, '#f2b6c4'))
  },
  fridgeCoke: {
    w: 28, h: 40, foot: [-13, -8, 26, 7], glow: [[14, 20, '#d8f0ff']],
    draw(p) {
      p.shadow(14, 38, 13, 2);
      p.block(1, 1, 26, 37, ['#f4f6f9', '#d9dde3', '#b4bac4', '#8a909b']);
      p.r(1, 1, 26, 6, '#e04c50').box(0, 0, 28, 8, INK).text('COLD', 6, 2, '#ffffff');
      p.r(3, 9, 22, 26, '#cfe6f4');
      for (const y of [10, 18, 26]) {
        for (let x = 4; x < 24; x += 3) p.r(x, y + 1, 2, 6, '#1f1b24').p(x, y + 3, '#e04c50').p(x + 1, y + 3, '#e04c50').p(x, y + 1, '#5a5262');
        p.r(3, y + 7, 22, 1, '#9aaab8');
      }
      p.line(5, 9, 3, 16, '#ffffff').line(10, 9, 5, 20, '#eef7fc');
      p.box(2, 8, 24, 28, INK).r(23, 18, 1, 8, C.steel[3]);
    }
  },
  techcase: {
    w: 62, h: 32, foot: [-29, -10, 58, 9],
    draw(p) {
      p.shadow(31, 30, 30, 2);
      p.block(1, 14, 60, 16, ['#5a5262', '#3b3240', '#29222e', '#1a1520']);
      p.r(2, 6, 58, 9, '#bcd8e6').box(1, 5, 60, 11, INK);
      for (let i = 0; i < 3; i++) {
        const x = 4 + i * 9;
        p.r(x, 7, 8, 7, '#2b2430').r(x, 9, 8, 1, '#7ec96b').r(x + 1, 11, 3, 1, '#ffffff').box(x - 1, 6, 10, 9, INK);
      }
      for (let i = 0; i < 4; i++) {
        const x = 34 + i * 6;
        p.r(x, 8, 4, 6, '#2f7a3f').r(x + 1, 9, 2, 1, '#1f1b24').r(x + 1, 11, 2, 1, '#1f1b24').p(x, 8, ['#ff4f8b', '#ffe08a', '#5bb6ff', '#7ef0a0'][i]);
      }
      p.line(6, 6, 3, 14, '#e4f2f8').line(40, 6, 37, 14, '#e4f2f8');
      p.r(18, 16, 26, 10, '#ffe08a').box(17, 15, 28, 12, INK).text('PFFT', 23, 18, C.pink[2]);
      p.r(2, 0, 20, 6, '#3b3240').box(1, 0, 22, 6, INK).text('TECH', 4, 1, '#7ef0a0');
    }
  },
  checkout: {
    w: 46, h: 30, foot: [-21, -10, 42, 9],
    draw(p) {
      p.shadow(23, 28, 22, 2);
      p.block(1, 12, 44, 16, ['#f4f1e8', '#e4dfd2', '#c9c2b1', '#9d9584']);
      p.r(2, 9, 30, 4, '#2b2430');
      for (let x = 3; x < 31; x += 3) p.p(x, 10, '#4a4452');
      p.r(34, 4, 9, 8, '#3b3240').r(35, 5, 7, 4, '#7ef0a0').text('1', 37, 5, '#1f3a2a').box(33, 3, 11, 10, INK);
      p.r(26, 6, 4, 3, '#2b2430').p(27, 7, '#ff4f5e');
      p.r(6, 18, 22, 6, '#3f9a5a').text('TILL', 9, 19, '#ffffff');
      p.outline();
    }
  },
  /* ------------------------------ PoiPoi's things ------------------------------ */
  gpubox: {
    w: 26, h: 20,
    draw(p) {
      p.shadow(13, 18, 12, 2);
      p.r(4, 0, 18, 4, '#c9965a').r(4, 0, 18, 1, '#e4b878');
      p.line(1, 3, 4, 6, '#b5803f').line(24, 3, 21, 6, '#b5803f');
      p.r(3, 4, 20, 6, '#6e4a2c').r(3, 4, 20, 1, '#523620');
      p.r(2, 9, 22, 9, '#d8a868');
      p.outline();
    }
  },
  gpuboxFront: {
    w: 26, h: 20,
    draw(p) {
      p.r(2, 9, 22, 10, '#d8a868').r(2, 9, 22, 1, '#ecc48a').r(19, 10, 5, 9, '#c4914f');
      p.text('GPU', 6, 12, '#2b2430').r(2, 17, 22, 1, '#3f9a5a');
      p.box(1, 8, 24, 12, INK);
    }
  },
  scratcher: {
    w: 16, h: 30, foot: [-6, -4, 12, 3],
    draw(p) {
      p.shadow(8, 28, 7, 2);
      p.block(1, 24, 14, 4, C.wood);
      for (let y = 6; y < 24; y++) p.r(6, y, 4, 1, y % 2 ? '#d8b27a' : '#c49a5e');
      p.block(2, 2, 12, 4, ['#ffd1e1', '#ffa3c4', '#e07aa0']);
      p.line(12, 6, 12, 13, '#8a8792').disc(12, 15, 2, '#ffe08a');
      p.outline();
    }
  },
  yarn: {
    w: 12, h: 9,
    draw(p) {
      p.disc(5, 4, 4, '#e04c50').line(2, 2, 7, 7, '#ff8a8a').line(3, 1, 8, 5, '#ff8a8a').p(4, 2, '#ffb3b3');
      p.outline();
      p.line(8, 7, 11, 8, '#e04c50');
    }
  },
  wand: {
    w: 20, h: 10,
    draw(p) {
      p.line(1, 8, 13, 4, C.wood[1]);
      p.r(13, 2, 3, 3, '#ff7ab0').r(15, 1, 3, 2, '#ffe08a').r(15, 4, 3, 2, '#7ec96b').p(18, 2, '#ff7ab0');
      p.outline();
    }
  },
  toymouse: {
    w: 11, h: 7,
    draw(p) {
      p.ell(4, 4, 3, 2, '#a69eb0').p(2, 2, '#f2b6c4').p(6, 3, INK);
      p.outline();
      p.line(8, 5, 10, 6, '#f2b6c4');
    }
  },
  foodstack: {
    w: 20, h: 18, foot: [-8, -4, 16, 3],
    draw(p) {
      p.shadow(10, 16, 9, 2);
      p.r(2, 6, 7, 10, '#ffb347').p(4, 9, '#2b2430').p(6, 9, '#2b2430').p(5, 11, '#e04c80');
      for (const [x, y, c] of [[10, 12, '#e04c80'], [14, 12, '#5bb6ff'], [12, 8, '#e04c80']] as [number, number, string][]) p.r(x, y, 4, 4, c).r(x, y, 4, 1, C.steel[1]);
      p.outline();
    }
  },
  swing: {
    w: 48, h: 46,
    draw(p) {
      const red = '#c8443a', redL = '#e8665a', redD = '#8f2c28';
      p.shadow(6, 44, 6, 1).shadow(42, 44, 6, 1).shadow(24, 44, 10, 1);
      for (const x of [6, 42]) {
        p.line(x, 3, x - 5, 44, redD).line(x - 1, 3, x - 6, 44, red);
        p.line(x, 3, x + 5, 44, red).line(x + 1, 3, x + 6, 44, redD);
      }
      p.r(4, 2, 40, 3, red).r(4, 2, 40, 1, redL).r(4, 4, 40, 1, redD);
      p.r(3, 1, 4, 5, '#f2b632').r(41, 1, 4, 5, '#f2b632');
      p.outline();
    }
  },
  swingchain: {
    w: 16, h: 28,
    draw(p) {
      for (const x of [2, 13]) for (let y = 0; y < 27; y++) p.p(x, y, y % 2 ? '#8d8996' : '#cfcad8');
      p.r(2, 0, 1, 1, INK).r(13, 0, 1, 1, INK);
    }
  },
  swingseat: {
    w: 16, h: 5,
    draw(p) {
      p.r(1, 1, 14, 3, C.wood[1]).r(1, 1, 14, 1, C.wood[0]).r(1, 3, 14, 1, C.wood[2]);
      p.outline();
    }
  },
  coke: {
    w: 7, h: 13,
    draw(p) {
      p.shadow(3, 12, 3, 1);
      p.r(2, 4, 3, 8, '#3a1d12').r(3, 2, 1, 2, '#3a1d12').r(3, 1, 1, 1, '#1a1a1a');
      p.r(2, 6, 3, 3, '#1a1a1a').p(3, 7, '#e83a3a').p(2, 4, '#7a4a32');
      p.outline();
    }
  },
  bottle: {
    w: 7, h: 13,
    draw(p) {
      p.r(2, 4, 3, 8, '#cfe6f2').r(3, 2, 1, 2, '#cfe6f2').r(3, 1, 1, 1, '#1a1a1a');
      p.r(2, 6, 3, 3, '#1a1a1a').p(3, 7, '#e83a3a').p(2, 5, '#ffffff').p(2, 10, '#ffffff');
      p.outline();
    }
  },
  phone: {
    w: 6, h: 9,
    draw(p) {
      p.r(1, 1, 4, 7, '#2b2430').r(2, 2, 2, 4, '#9fe8ff').p(2, 2, '#ffffff').p(3, 7, '#5d5a66');
      p.outline();
    }
  },
  scratch: {
    w: 11, h: 11,
    draw(p) {
      for (const d of [0, 3, 6]) p.line(2 + d, 1, d - 1, 9, '#ffffff').line(3 + d, 1, d, 9, '#ff4f8b');
    }
  },
  heart: {
    w: 7, h: 7,
    draw(p) {
      p.r(1, 1, 2, 3, '#ff4f8b').r(4, 1, 2, 3, '#ff4f8b').r(1, 2, 5, 2, '#ff4f8b').r(2, 4, 3, 1, '#ff4f8b').p(3, 5, '#ff4f8b').p(2, 2, '#ffd1e1');
      p.outline();
    }
  },
  arrow: {
    w: 11, h: 9,
    draw(p) {
      p.r(1, 1, 9, 2, '#ffc23c').r(2, 3, 7, 2, '#ffc23c').r(3, 5, 5, 1, '#ffc23c').r(4, 6, 3, 1, '#ffc23c').p(5, 7, '#ffc23c').r(1, 1, 9, 1, '#ffe08a');
      p.outline();
    }
  },
  spark: {
    w: 7, h: 7,
    draw(p) {
      p.r(3, 1, 1, 5, '#ffc23c').r(1, 3, 5, 1, '#ffc23c').p(3, 3, '#fff3c4');
      p.outline();
    }
  }
};
