// Character sprites as pixel grids. Mohit is 16x32 inside a 24x32 frame (room for an outstretched arm);
// the cats are 16x16.
import { Px, C, INK } from './paint';

export const MOHIT_FW = 24, MOHIT_FH = 32;
export const CAT_FW = 18, CAT_FH = 16;

const MOHIT_PAL: Record<string, string> = {
  k: INK, h: C.hair[1], H: C.hair[0], s: C.skin[0], S: C.skin[1], g: '#e0b048', b: '#f0a0a8', m: '#b04a5c', w: '#ffffff',
  t: C.shirt[1], T: C.shirt[0], d: C.shirt[2], p: C.pants[0], P: C.pants[1], o: '#3b3240', c: '#d7dbe2', y: '#d7dbe2'
};

const HEAD_FRONT = [
  '................',
  '.....k.kk.k.....',
  '...kkhkhhkhkk...',
  '..khhhhhhhhhhk..',
  '.khhHHhhhhHhhhk.',
  '.khHhhhhhhhhhhk.',
  '.khhhhhhhhhhhhk.',
  '.khhhhhhhhhhhhk.',
  '.khhhshhhhshhhk.',
  '.khsshsshsshshk.',
  '.khsggsssggsshk.',
  '.khgksgggskgshk.',
  '.khgksgsgskgshk.',
  '.khbggsssggbshk.',
  '.khssssmssssshk.',
  '...kSssssssSk...'
];
const BODY_FRONT = [
  '....kkSSSSkk....',
  '...ktttsstttk...',
  '.kttttttttttttk.',
  '.ktkttttTtttktk.',
  '.ktkttttTtttktk.',
  '.ktkttttTtttkck.',
  '.ktkttttTtttktk.',
  '.kskkkkkykkkksk.',
  '.kkppppPPppppkk.'
];
const LEGS_FRONT = [
  '...kpppPkPpppk..',
  '...kpppPkPpppk..',
  '...kpppPkPpppk..',
  '...kpppPkPpppk..',
  '...kpppPkPpppk..',
  '..kooookkooook..',
  '..kkkkk..kkkkk..'
];
const HEAD_BACK = [
  '................',
  '.....k.k..k.....',
  '....khkhkkhk....',
  '...khhhhhhhhk...',
  '..khhHhhhhHhhk..',
  '..khHhhhhhhhhhk.',
  '.khhhhhhhhhhhhk.',
  '.khhhHhhhhHhhhk.',
  '.khhhhhhhhhhhhk.',
  '.khhhhhhhhhhhhk.',
  '.kghhhhhhhhhhgk.',
  '.khhhHhhhhhhhhk.',
  '.khhhhhhhhhhhhk.',
  '.khhhhhhhhhhhhk.',
  '..khkhhhhhhkhk..',
  '...khkSSSSkhk...'
];
const BODY_BACK = [
  '....kkSSSSkk....',
  '...kttttttttk...',
  '.kttttttttttttk.',
  '.ktkttttttttktk.',
  '.ktkttdttdttktk.',
  '.kckttttttttktk.',
  '.ktkttttttttktk.',
  '.kskkkkkkkkkksk.',
  '.kkppppPPppppkk.'
];
const SIDE = [
  '................',
  '................',
  '................',
  '......kk.kk.....',
  '....kkhhkhhkk...',
  '...khhHhhhhhhk..',
  '..khhhhhhhhhhhk.',
  '..khhhhhhhhhhhk.',
  '..khhhhhhhhhhhk.',
  '..khhhhhhhhhhhk.',
  '..khhhhhgggshhk.',
  '..khhhSggkgsssk.',
  '..khhhSsgkgssSk.',
  '..khhhhssbssssk.',
  '..khhhhsssssmsk.',
  '...khhkSssssSk..',
  '.....kSSSSk.....',
  '....kttttttk....',
  '...kttttttttk...',
  '...kttktkttTk...',
  '...kttktkttTk...',
  '...kttkckttTk...',
  '...kttktkttTk...',
  '...kkkkskkkyk...'
];
const SIDE_LEGS: Record<string, string[]> = {
  idle: ['....kpppkpppk...', '....kPPPkpppk...', '....kPPPkpppk...', '....kPPPkpppk...', '....kPPPkpppk...', '....kPPPkpppk...', '....koookooooook', '....kkkk.kkkkkk.'],
  a: ['....kpppkpppk...', '....kPPkkppk....', '...kPPk.kppk....', '...kPPk..kppk...', '..kPPk...kppk...', '..kPPk....kppk..', '.koook....kooook', '.kkkk.....kkkkk.'],
  b: ['....kpppkpppk...', '....kppkkPPk....', '...kppk.kPPk....', '...kppk..kPPk...', '..kppk...kPPk...', '..kppk....kPPk..', '.koook....kooook', '.kkkk.....kkkkk.']
};

type Face = { blink?: boolean; mouth?: 'o' | 'open' | 'flat'; sweat?: boolean; worried?: boolean };

function faceFront(head: string[], f: Face): string[] {
  const h = head.map(r => r);
  const set = (row: number, col: number, ch: string) => { h[row] = h[row].slice(0, col) + ch + h[row].slice(col + 1); };
  if (f.blink) { set(11, 4, 's'); set(11, 10, 's'); }
  if (f.mouth === 'o' || f.mouth === 'open') { set(14, 7, 'k'); set(14, 8, 'k'); set(15, 7, 'm'); set(15, 8, 'm'); }
  if (f.mouth === 'o' || f.mouth === 'open' || f.mouth === 'flat') set(14, 7, 'k');
  if (f.mouth === 'flat') { set(14, 7, 'k'); set(14, 8, 'k'); }
  if (f.worried) { set(9, 4, 'k'); set(9, 10, 'k'); }
  return h;
}

export type View = 'front' | 'back' | 'side';
/** Another person built on Mohit's body: palette swaps plus accessories drawn on top. */
export interface PersonLook { pal?: Record<string, string>; extra?: (px: Px, view: View, ox: number, bob: number) => void }

/** Builds a person frame (24x32). lift: [left, right] shoe lift in px, bob: upper body offset. */
function mohitFrame(view: View, o: Face & { lift?: [number, number]; bob?: number; legs?: 'idle' | 'a' | 'b'; arm?: 'out' | 'wave'; sit?: boolean } = {}, look: PersonLook = {}) {
  const px = new Px(MOHIT_FW, MOHIT_FH);
  const ox = 4, bob = o.bob ?? 0;
  const pal = { ...MOHIT_PAL, ...(look.pal ?? {}) };
  if (view === 'side') {
    px.grid(SIDE_LEGS[o.legs ?? 'idle'], pal, ox, 24);
    const top = o.blink ? SIDE.map((r, j) => j === 11 ? r.slice(0, 9) + 's' + r.slice(10) : r) : SIDE;
    px.grid(top, pal, ox, bob);
  } else {
    const head = view === 'front' ? faceFront(HEAD_FRONT, o) : HEAD_BACK;
    const body = view === 'front' ? BODY_FRONT : BODY_BACK;
    const [ll, rl] = o.lift ?? [0, 0];
    const half = (side: 0 | 1) => LEGS_FRONT.map(r => side === 0 ? r.slice(0, 8) + '........' : '........' + r.slice(8));
    // sitting, the thighs point at the viewer, so only the shins and shoes show below the shirt
    if (o.sit) px.grid(LEGS_FRONT.slice(3), pal, ox, 27);
    // a stepping leg keeps its trouser but its shoe comes up off the ground
    else ([[0, ll], [1, rl]] as const).forEach(([side, lift]) => {
      const rows = half(side);
      px.grid(rows.slice(0, 5), pal, ox, 25);
      px.grid(rows.slice(5), pal, ox, 30 - lift);
    });
    px.grid(body, pal, ox, 16 + bob);
    px.grid(head, pal, ox, bob);
    if (o.arm === 'out') {
      px.r(ox + 13, 19 + bob, 1, 4, pal.t);
      px.r(ox + 14, 18 + bob, 6, 3, pal.t).box(ox + 14, 17 + bob, 7, 5, INK).r(ox + 14, 18 + bob, 6, 3, pal.t);
      px.r(ox + 20, 18 + bob, 2, 3, pal.s).box(ox + 20, 17 + bob, 3, 5, INK).r(ox + 20, 18 + bob, 2, 3, pal.s);
      px.r(ox + 13, 23 + bob, 2, 1, pal.t);
    }
    if (o.sweat) { px.p(ox + 14, 4, '#9fd8ff').p(ox + 14, 5, '#9fd8ff').p(ox + 15, 5, INK); }
  }
  look.extra?.(px, view, ox, bob);
  return px;
}

/** Walk cycles in all four directions for an NPC. */
export function personFrames(look: PersonLook): Record<string, () => Px> {
  return {
    idle: () => mohitFrame('front', {}, look), walkA: () => mohitFrame('front', { lift: [2, 0], bob: -1 }, look), walkB: () => mohitFrame('front', { lift: [0, 2], bob: -1 }, look),
    bIdle: () => mohitFrame('back', {}, look), bWalkA: () => mohitFrame('back', { lift: [2, 0], bob: -1 }, look), bWalkB: () => mohitFrame('back', { lift: [0, 2], bob: -1 }, look),
    sIdle: () => mohitFrame('side', {}, look), sWalkA: () => mohitFrame('side', { legs: 'a', bob: -1 }, look), sWalkB: () => mohitFrame('side', { legs: 'b', bob: -1 }, look)
  };
}

export const MOHIT_FRAMES: Record<string, () => Px> = {
  idle: () => mohitFrame('front'),
  blink: () => mohitFrame('front', { blink: true }),
  walkA: () => mohitFrame('front', { lift: [2, 0], bob: -1 }),
  walkB: () => mohitFrame('front', { lift: [0, 2], bob: -1 }),
  talk: () => mohitFrame('front', { mouth: 'open' }),
  o: () => mohitFrame('front', { mouth: 'o', worried: true }),
  hand: () => mohitFrame('front', { mouth: 'flat', arm: 'out' }),
  hurt: () => mohitFrame('front', { blink: true, mouth: 'o', sweat: true, worried: true }),
  sit: () => mohitFrame('front', { sit: true, bob: 2 }),
  sitHappy: () => mohitFrame('front', { sit: true, bob: 2, blink: true, mouth: 'open' }),
  sitO: () => mohitFrame('front', { sit: true, bob: 2, mouth: 'o', worried: true }),
  bIdle: () => mohitFrame('back'),
  bWalkA: () => mohitFrame('back', { lift: [2, 0], bob: -1 }),
  bWalkB: () => mohitFrame('back', { lift: [0, 2], bob: -1 }),
  sIdle: () => mohitFrame('side'),
  sBlink: () => mohitFrame('side', { blink: true }),
  sWalkA: () => mohitFrame('side', { legs: 'a', bob: -1 }),
  sWalkB: () => mohitFrame('side', { legs: 'b', bob: -1 })
};

/* ---------------- cats (side view faces right) ---------------- */
export interface CatLook { fur: string[]; point: string[]; eye: string; stripes?: string; collar?: boolean; toes?: boolean }
export const POI_LOOK: CatLook = { fur: C.catW, point: C.catG, eye: '#8fd0ff', collar: true, toes: true };
export const MAO_LOOK: CatLook = { fur: [C.maoG[0], C.maoG[1], C.maoG[2]], point: [C.maoG[1], C.maoG[2], C.maoG[3]], eye: '#ffad33', stripes: C.maoG[3] };
/** The neighbourhood cats that answer when PoiPoi calls the cat gods. */
export const STRAY_LOOKS: CatLook[] = [
  { fur: ['#f2a65a', '#d9853b'], point: ['#d9853b', '#b8692a', '#8f4f1f'], eye: '#7ed36a', stripes: '#b8692a' },
  { fur: ['#3d3746', '#2f2936'], point: ['#2f2936', '#24202a', '#1a1520'], eye: '#ffd23c' },
  { fur: ['#a9a6b4', '#8d8996'], point: ['#8d8996', '#6a6674', '#55525e'], eye: '#9fe07a', stripes: '#6a6674' },
  { fur: ['#f4ead6', '#e0d2b8'], point: ['#8a6446', '#5e4430', '#4a3424'], eye: '#8fd0ff' },
  { fur: ['#f6efe4', '#e4dccd'], point: ['#e08a3c', '#3d3746', '#e08a3c'], eye: '#ffad33', stripes: '#3d3746' },
  { fur: ['#c99a6b', '#a87c52'], point: ['#a87c52', '#7d5a3a', '#5e4430'], eye: '#ffd23c', stripes: '#7d5a3a' },
  { fur: ['#e8e4ee', '#cfcad8'], point: ['#3d3746', '#2f2936', '#24202a'], eye: '#7ed36a' }
];

const CAT_HEAD = [
  '..................',
  '..........k...k...',
  '.........kgk.kgk..',
  '.........kgnkngk..',
  '........kWWWWWWWk.',
  '.kk....kWWWWWWWWWk',
  'kGGk...kWWEWWWEWWk',
  'kGk....kWWEWWWEWWk',
  '.kGk...kWbWWnWWbWk',
  '..kGk...kWWkWkWWk.'
];
const CAT_BODY: Record<string, string[]> = {
  stand: [
    '...kGkkkkkWWWWWk..',
    '....kWWWWWWrrykk..',
    '...kWWWWWWWWWWWk..',
    '...kwwwWWWWWWwwk..',
    '...kWkkWk..kWkTk..',
    '...kkk.kk..kkkkk..'
  ],
  walkA: [
    '...kGkkkkkWWWWWk..',
    '....kWWWWWWrrykk..',
    '...kWWWWWWWWWWWk..',
    '...kwwwWWWWWWwwk..',
    '..kWk..kWkkWk.kTk.',
    '..kk...kk.kk..kk..'
  ],
  walkB: [
    '...kGkkkkkWWWWWk..',
    '....kWWWWWWrrykk..',
    '...kWWWWWWWWWWWk..',
    '...kwwwWWWWWWwwk..',
    '....kWkWk...kWkTk.',
    '....kkkkk...kkkk..'
  ],
  loaf: [
    '..................',
    '..................',
    '...kGkkkkkWWWWWk..',
    '..kWWWWWWWWrrykk..',
    '..kwwwwwwwwwwwwk..',
    '...kkkkkkkkkkkk...'
  ]
};

function catFrame(look: CatLook, body: keyof typeof CAT_BODY, f: { eyes?: 'open' | 'closed' | 'big'; head?: number; tongue?: boolean; crumbs?: boolean } = {}) {
  const px = new Px(CAT_FW, CAT_FH);
  const pal: Record<string, string> = {
    k: INK, W: look.fur[0], w: look.fur[1], G: look.point[1], g: look.point[2], n: '#f4a9bc', b: '#f7b8c6',
    E: '#2b2430', r: look.collar ? '#d6336c' : look.fur[1], y: look.collar ? '#f4c542' : look.fur[1], T: look.toes ? look.point[1] : look.fur[0]
  };
  const loaf = body === 'loaf';
  const headY = (f.head ?? 0) + (loaf ? 2 : 0);
  px.grid(CAT_BODY[body], pal, 0, 10);
  const head = CAT_HEAD.map(r => r);
  const set = (row: number, col: number, ch: string) => { head[row] = head[row].slice(0, col) + ch + head[row].slice(col + 1); };
  if (f.eyes === 'closed') { set(6, 10, 'W'); set(6, 14, 'W'); }
  if (f.eyes === 'big') { set(5, 10, 'E'); set(5, 14, 'E'); }
  px.grid(head, pal, 0, headY);
  if (f.eyes !== 'closed') { px.p(10, 6 + headY, look.eye).p(14, 6 + headY, look.eye); }
  if (look.stripes) { px.p(12, 4 + headY, look.stripes).p(11, 5 + headY, look.stripes).p(13, 5 + headY, look.stripes).p(6, 12, look.stripes).p(8, 12, look.stripes).p(10, 12, look.stripes); }
  if (f.tongue) px.p(12, 10 + headY, '#e8607e');
  if (f.crumbs) { px.p(10, 10 + headY, '#d9a35f').p(15, 9 + headY, '#d9a35f').p(9, 4 + headY, '#d9a35f'); }
  return px;
}

export const catFrames = (look: CatLook): Record<string, () => Px> => ({
  idle: () => catFrame(look, 'stand'),
  idle2: () => catFrame(look, 'stand', { head: 1 }),
  blink: () => catFrame(look, 'stand', { eyes: 'closed' }),
  walk0: () => catFrame(look, 'walkA'),
  walk1: () => catFrame(look, 'stand', { head: 1 }),
  walk2: () => catFrame(look, 'walkB'),
  loaf: () => catFrame(look, 'loaf'),
  loafBlink: () => catFrame(look, 'loaf', { eyes: 'closed' }),
  stare: () => catFrame(look, 'loaf', { eyes: 'big' }),
  happy: () => catFrame(look, 'loaf', { eyes: 'closed' }),
  eat: () => catFrame(look, 'loaf', { eyes: 'closed', head: 2, tongue: true }),
  eat2: () => catFrame(look, 'loaf', { eyes: 'closed', head: 1 }),
  crumbs: () => catFrame(look, 'stand', { eyes: 'big', crumbs: true }),
  sniff: () => catFrame(look, 'stand', { head: 1 })
});

/* ---------------- the paper bag ---------------- */
export function bagFrame(o: { eyes?: boolean; ear?: boolean; squash?: boolean } = {}) {
  const px = new Px(26, 30);
  const B = C.wood, top = o.squash ? 9 : 8;
  px.shadow(13, 28, 11, 2);
  px.r(4, top + 4, 18, 27 - top - 4, '#c08a52').r(17, top + 4, 5, 27 - top - 4, '#a8743f').r(4, top + 4, 18, 1, '#d6a36a');
  px.line(17, top + 5, 18, 26, '#8a5c2e');
  px.p(8, 15, '#8a5c2e').p(9, 16, '#8a5c2e').p(12, 22, '#8a5c2e').p(13, 21, '#8a5c2e').p(6, 23, '#8a5c2e');
  px.r(7, 17, 8, 5, '#ffd54a').p(10, 19, '#3fae5a').p(11, 18, '#3fae5a').p(12, 19, '#3fae5a').p(11, 20, '#3fae5a');
  px.r(4, top + 2, 18, 3, '#24160f');
  if (o.eyes) { px.p(9, top + 3, '#8fd0ff').p(10, top + 3, '#8fd0ff').p(14, top + 3, '#8fd0ff').p(15, top + 3, '#8fd0ff'); }
  if (o.ear) { px.p(15, top, '#7e768a').p(15, top + 1, '#7e768a').p(16, top + 1, '#7e768a').p(14, top + 1, '#7e768a'); }
  for (let i = 4; i < 22; i += 2) px.p(i, top + 1, '#d6a36a');
  px.line(7, top + 1, 7, top - 4, B[2]).line(7, top - 4, 10, top - 5, B[2]).line(10, top - 5, 11, top + 1, B[2]);
  px.line(14, top + 1, 14, top - 4, B[2]).line(14, top - 4, 17, top - 5, B[2]).line(17, top - 5, 18, top + 1, B[2]);
  px.outline();
  return px;
}
