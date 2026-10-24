// Pixel painting toolkit: everything in the game world is drawn with these at 1 art pixel = 1 canvas pixel.

export const INK = '#2b2430';

/** Colour ramps, light to dark. */
export const C = {
  ink: INK,
  white: '#fffaf2',
  plasterT: ['#eda183', '#d9764d', '#b85a3a', '#86402f'],
  plasterC: ['#f7ead0', '#ead6b0', '#cdb48a', '#957a5b'],
  teal: ['#9adbd2', '#5cb0a9', '#3c827e', '#285855'],
  marigold: ['#ffe08a', '#f4b93a', '#cc8a21', '#8e5c18'],
  pink: ['#ffa3c4', '#e04c80', '#a52a59', '#6e1c40'],
  leaf: ['#b4d67a', '#78a84a', '#4f7d38', '#31512a'],
  grass: ['#b5d681', '#8dbb5c', '#6a9a47', '#4a7238'],
  road: ['#7a7480', '#655e6c', '#514a59', '#3d3746'],
  pave: ['#e2d9c8', '#cbbfaa', '#ab9e88', '#82755f'],
  wood: ['#d79a64', '#b5743f', '#8a532c', '#5e3620'],
  brick: ['#d27052', '#ae5338', '#86402f', '#5c2c22'],
  steel: ['#eef0f3', '#c4c9d1', '#959ba6', '#666b77'],
  navy: ['#6d7fa8', '#4e5f86', '#3a4766', '#283149'],
  skin: ['#fbdcc2', '#efb994', '#cf8f6d'],
  hair: ['#5a4656', '#3a2a35', '#251a22'],
  shirt: ['#57506e', '#3d3752', '#2c273d'],
  pants: ['#ecd3a6', '#d2b27f', '#ad8d5e'],
  catW: ['#fffaf2', '#ede4d6', '#d3c6b4'],
  catG: ['#a69eb0', '#7e768a', '#5a5366'],
  maoG: ['#8f8a9a', '#6d6878', '#504c5c', '#3b3746'],
  sky: ['#fdeed8', '#f6dcbc', '#eac39d']
};

export type RNG = () => number;
export function rng(seed: number): RNG {
  let s = (Math.abs(Math.floor(seed)) % 2147483646) + 1;
  return () => ((s = (s * 16807) % 2147483647) - 1) / 2147483646;
}

const hexRgb = (h: string) => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16));
const rgbHex = (a: number[]) => '#' + a.map(v => Math.round(Math.max(0, Math.min(255, v))).toString(16).padStart(2, '0')).join('');
export const mix = (a: string, b: string, t: number) => { const A = hexRgb(a), B = hexRgb(b); return rgbHex(A.map((v, i) => v + (B[i] - v) * t)); };
/** Hue-shifted shading: darker leans to plum, lighter leans to warm cream. */
export const dk = (c: string, t = 0.3) => mix(c, '#3a2550', t);
export const lt = (c: string, t = 0.3) => mix(c, '#fff3d6', t);

const FONT: Record<string, string[]> = {
  A: ['010', '101', '111', '101', '101'], B: ['110', '101', '110', '101', '110'], C: ['011', '100', '100', '100', '011'],
  D: ['110', '101', '101', '101', '110'], E: ['111', '100', '110', '100', '111'], F: ['111', '100', '110', '100', '100'],
  G: ['011', '100', '101', '101', '011'], H: ['101', '101', '111', '101', '101'], I: ['111', '010', '010', '010', '111'],
  K: ['1001', '1010', '1100', '1010', '1001'], L: ['100', '100', '100', '100', '111'], M: ['10001', '11011', '10101', '10001', '10001'],
  N: ['1001', '1101', '1011', '1001', '1001'], O: ['111', '101', '101', '101', '111'], P: ['110', '101', '110', '100', '100'],
  R: ['110', '101', '110', '101', '101'], S: ['011', '100', '010', '001', '110'], T: ['111', '010', '010', '010', '010'],
  U: ['101', '101', '101', '101', '111'], V: ['101', '101', '101', '101', '010'], W: ['10001', '10001', '10101', '11011', '10001'],
  Y: ['101', '101', '010', '010', '010'], '&': ['0110', '1000', '0101', '1010', '0101'], '0': ['111', '101', '101', '101', '111'],
  '1': ['010', '110', '010', '010', '111'], '2': ['110', '001', '010', '100', '111'], '3': ['110', '001', '010', '001', '110'],
  '4': ['101', '101', '111', '001', '001'], '5': ['111', '100', '110', '001', '110'], '7': ['111', '001', '010', '010', '010'],
  '₹': ['111', '011', '111', '010', '001'], '.': ['0', '0', '0', '0', '1'], '-': ['00', '00', '11', '00', '00'], ' ': ['00', '00', '00', '00', '00']
};

/** A small canvas with pixel drawing helpers. */
export class Px {
  cv: HTMLCanvasElement;
  x: CanvasRenderingContext2D;
  constructor(public w: number, public h: number, public rnd: RNG = rng(1)) {
    this.cv = document.createElement('canvas');
    this.cv.width = w; this.cv.height = h;
    this.x = this.cv.getContext('2d', { willReadFrequently: true })!;
    this.x.imageSmoothingEnabled = false;
  }
  p(x: number, y: number, c: string) { this.x.fillStyle = c; this.x.fillRect(Math.floor(x), Math.floor(y), 1, 1); return this; }
  r(x: number, y: number, w: number, h: number, c: string) { this.x.fillStyle = c; this.x.fillRect(Math.floor(x), Math.floor(y), Math.floor(w), Math.floor(h)); return this; }
  box(x: number, y: number, w: number, h: number, c: string) {
    this.r(x, y, w, 1, c).r(x, y + h - 1, w, 1, c).r(x, y, 1, h, c).r(x + w - 1, y, 1, h, c); return this;
  }
  /** Filled rectangle with an ink outline, a lit top edge and a shaded bottom/right. */
  block(x: number, y: number, w: number, h: number, ramp: string[], outline = true) {
    this.r(x, y, w, h, ramp[1]).r(x, y, w, 1, ramp[0]).r(x + w - 1, y, 1, h, ramp[2]).r(x, y + h - 1, w, 1, ramp[2]);
    if (outline) this.box(x - 1, y - 1, w + 2, h + 2, INK);
    return this;
  }
  line(x0: number, y0: number, x1: number, y1: number, c: string) {
    x0 = Math.round(x0); y0 = Math.round(y0); x1 = Math.round(x1); y1 = Math.round(y1);
    const dx = Math.abs(x1 - x0), sx = x0 < x1 ? 1 : -1, dy = -Math.abs(y1 - y0), sy = y0 < y1 ? 1 : -1;
    let e = dx + dy;
    for (;;) {
      this.p(x0, y0, c);
      if (x0 === x1 && y0 === y1) break;
      const e2 = 2 * e;
      if (e2 >= dy) { e += dy; x0 += sx; }
      if (e2 <= dx) { e += dx; y0 += sy; }
    }
    return this;
  }
  /** Sagging cable between two points. */
  sag(x0: number, y0: number, x1: number, y1: number, drop: number, c = INK) {
    let lx = x0, ly = y0;
    for (let t = 0.04; t <= 1.0001; t += 0.04) {
      const nx = x0 + (x1 - x0) * t, ny = y0 + (y1 - y0) * t + Math.sin(Math.PI * t) * drop;
      this.line(lx, ly, nx, ny, c); lx = nx; ly = ny;
    }
    return this;
  }
  dith(x: number, y: number, w: number, h: number, c: string, sparse = false) {
    for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) {
      if (sparse ? (i % 2 === 0 && j % 2 === 0) : (i + j) % 2 === 0) this.p(x + i, y + j, c);
    }
    return this;
  }
  speck(x: number, y: number, w: number, h: number, c: string, d: number) {
    for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) if (this.rnd() < d) this.p(x + i, y + j, c);
    return this;
  }
  disc(cx: number, cy: number, r: number, c: string) {
    for (let j = -r; j <= r; j++) for (let i = -r; i <= r; i++) if (i * i + j * j <= r * r + r * 0.6) this.p(cx + i, cy + j, c);
    return this;
  }
  ell(cx: number, cy: number, rx: number, ry: number, c: string) {
    for (let j = -ry; j <= ry; j++) for (let i = -rx; i <= rx; i++) if ((i * i) / (rx * rx) + (j * j) / (ry * ry) <= 1.05) this.p(cx + i, cy + j, c);
    return this;
  }
  text(s: string, x: number, y: number, c: string, fade = 0) {
    let cx = x;
    for (const ch of s.toUpperCase()) {
      const g = FONT[ch] ?? FONT[' '];
      g.forEach((row, j) => [...row].forEach((b, i) => { if (b === '1' && this.rnd() >= fade) this.p(cx + i, y + j, c); }));
      cx += g[0].length + 1;
    }
    return this;
  }
  static textWidth(s: string) { return [...s.toUpperCase()].reduce((a, ch) => a + (FONT[ch] ?? FONT[' '])[0].length + 1, -1); }
  /** Paints a character grid: each char maps to a colour, '.' is transparent. */
  grid(rows: string[], pal: Record<string, string>, ox = 0, oy = 0, flip = false) {
    rows.forEach((row, j) => [...row].forEach((ch, i) => {
      const c = pal[ch];
      if (c) this.p(ox + (flip ? row.length - 1 - i : i), oy + j, c);
    }));
    return this;
  }
  /** Adds a 1px outline around everything already drawn (only into empty pixels). */
  outline(c = INK) {
    const d = this.x.getImageData(0, 0, this.w, this.h), a = d.data;
    const solid = (i: number, j: number) => i >= 0 && j >= 0 && i < this.w && j < this.h && a[(j * this.w + i) * 4 + 3] > 0;
    const pts: [number, number][] = [];
    for (let j = 0; j < this.h; j++) for (let i = 0; i < this.w; i++) {
      if (solid(i, j)) continue;
      if (solid(i - 1, j) || solid(i + 1, j) || solid(i, j - 1) || solid(i, j + 1)) pts.push([i, j]);
    }
    pts.forEach(([i, j]) => this.p(i, j, c));
    return this;
  }
  /** Soft contact shadow ellipse (dithered so it stays pixel-crisp). */
  shadow(cx: number, cy: number, rx: number, ry: number) {
    for (let j = -ry; j <= ry; j++) for (let i = -rx; i <= rx; i++) {
      const d = (i * i) / (rx * rx) + (j * j) / (ry * ry);
      if (d <= 1 && (d < 0.55 || (i + j) % 2 === 0)) {
        this.x.fillStyle = 'rgba(43,30,52,.32)'; this.x.fillRect(cx + i, cy + j, 1, 1);
      }
    }
    return this;
  }
  draw(src: Px | HTMLCanvasElement, x = 0, y = 0) { this.x.drawImage(src instanceof Px ? src.cv : src, x, y); return this; }
}
