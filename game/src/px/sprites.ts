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
  '.....k.k..k.....',
  '....khkhkkhk....',
  '...khhhhhhhhk...',
  '..khhHhhhhHhhk..',
  '..khHhhhhhhhhhk.',
  '.khhhhhhhhhhhhk.',
  '.khhhhhhhhhhhhk.',
  '.khhshhhshhhshk.',
  '.khhsshsshsshhk.',
  '.khggggssgggghk.',
  '.khgskggggksghk.',
  '.khggggssgggghk.',
  '.khsbssssssbshk.',
  '.khssssmmsssshk.',
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
  '......k.k.......',
  '.....khkhkk.....',
  '....khhhhhhhk...',
  '...khhHhhhhhhk..',
  '..khhhhhhhhhhhk.',
  '..khhhhhhhhhhhk.',
  '..khhhhhhhhhhhk.',
  '..khhhhhhhshhsk.',
  '..khhhhhsshsssk.',
  '..khhhhssggggk..',
  '..khhhSssgksgsk.',
  '..khhhhssggggk..',
  '..khhhhsssssbsk.',
  '..khhhhssssssmk.',
  '...khhkSsssssk..',
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
  if (f.blink) { set(11, 4, 's'); set(11, 5, 'k'); set(11, 10, 'k'); set(11, 11, 's'); }
  if (f.mouth === 'o' || f.mouth === 'open') { set(14, 7, 'k'); set(14, 8, 'k'); set(15, 7, 'm'); set(15, 8, 'm'); }
  if (f.mouth === 'flat') { set(14, 7, 'k'); set(14, 8, 'k'); }
  if (f.worried) { set(9, 5, 'k'); set(9, 10, 'k'); }
  return h;
}

/** Builds a Mohit frame (24x32). legsLift: [left, right] in px, bob: upper body offset. */
function mohitFrame(view: 'front' | 'back' | 'side', o: Face & { lift?: [number, number]; bob?: number; legs?: 'idle' | 'a' | 'b'; arm?: 'out' | 'wave' } = {}) {
  const px = new Px(MOHIT_FW, MOHIT_FH);
  const ox = 4, bob = o.bob ?? 0;
  if (view === 'side') {
    px.grid(SIDE_LEGS[o.legs ?? 'idle'], MOHIT_PAL, ox, 24);
    const top = o.blink ? SIDE.map((r, j) => j === 11 ? r.slice(0, 10) + 's' + r.slice(11) : r) : SIDE;
    px.grid(top, MOHIT_PAL, ox, bob);
  } else {
    const head = view === 'front' ? faceFront(HEAD_FRONT, o) : HEAD_BACK;
    const body = view === 'front' ? BODY_FRONT : BODY_BACK;
    const [ll, rl] = o.lift ?? [0, 0];
    const half = (side: 0 | 1) => LEGS_FRONT.map(r => side === 0 ? r.slice(0, 8) + '........' : '........' + r.slice(8));
    // a stepping leg keeps its trouser but its shoe comes up off the ground
    ([[0, ll], [1, rl]] as const).forEach(([side, lift]) => {
      const rows = half(side);
      px.grid(rows.slice(0, 5), MOHIT_PAL, ox, 25);
      px.grid(rows.slice(5), MOHIT_PAL, ox, 30 - lift);
    });
    px.grid(body, MOHIT_PAL, ox, 16 + bob);
    px.grid(head, MOHIT_PAL, ox, bob);
    if (o.arm === 'out') {
      px.r(ox + 13, 19 + bob, 1, 4, MOHIT_PAL.t);
      px.r(ox + 14, 18 + bob, 6, 3, MOHIT_PAL.t).box(ox + 14, 17 + bob, 7, 5, INK).r(ox + 14, 18 + bob, 6, 3, MOHIT_PAL.t);
      px.r(ox + 20, 18 + bob, 2, 3, MOHIT_PAL.s).box(ox + 20, 17 + bob, 3, 5, INK).r(ox + 20, 18 + bob, 2, 3, MOHIT_PAL.s);
      px.r(ox + 13, 23 + bob, 2, 1, MOHIT_PAL.t);
    }
    if (o.sweat) { px.p(ox + 14, 4, '#9fd8ff').p(ox + 14, 5, '#9fd8ff').p(ox + 15, 5, INK); }
  }
  return px;
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

const CAT_HEAD = [
  '..........k...k..',
  '.........kgk.kgk.',
  '........kgnkkngk.',
  '.......kWWWWWWWWk',
  '......kWWWWWWWWWk',
  '......kWEkWWEkWWk',
  '......kWEkWWEkWWk',
  '......kbWGnGWbWWk',
  '.......kwWGGWwwk.'
];
const CAT_BODY: Record<string, string[]> = {
  stand: [
    '.kk....kkrryrk...',
    'kGGk..kWWWWWWWk..',
    'kGk.kWWWWWWWWWWk.',
    '.kGkWWWWWWWWWWWk.',
    '..kwwwWWWWWWwwk..',
    '..kWk.kWk.kWkTk..',
    '..kk..kk..kkkk...'
  ],
  walkA: [
    '.kk....kkrryrk...',
    'kGGk..kWWWWWWWk..',
    'kGk.kWWWWWWWWWWk.',
    '.kGkWWWWWWWWWWWk.',
    '..kwwwWWWWWWwwk..',
    '.kWk..kWkkWk.kTk.',
    '.kk...kk.kk...kk.'
  ],
  walkB: [
    '.kk....kkrryrk...',
    'kGGk..kWWWWWWWk..',
    'kGk.kWWWWWWWWWWk.',
    '.kGkWWWWWWWWWWWk.',
    '..kwwwWWWWWWwwk..',
    '...kWkWk...kTWk..',
    '...kkkk....kkkk..'
  ],
  loaf: [
    '.......kkrryrk...',
    '.kk..kkWWWWWWWk..',
    'kGGkkWWWWWWWWWWk.',
    'kGGGWWWWWWWWWWWk.',
    '.kkwwwwwwwwwwwk..',
    '...kkkkkkkkkkk...',
    '.................'
  ]
};

function catFrame(look: CatLook, body: keyof typeof CAT_BODY, f: { eyes?: 'open' | 'closed' | 'big'; head?: number; tongue?: boolean; crumbs?: boolean } = {}) {
  const px = new Px(CAT_FW, CAT_FH);
  const pal: Record<string, string> = {
    k: INK, W: look.fur[0], w: look.fur[1], G: look.point[1], g: look.point[2], n: '#f4a9bc', b: '#f3a3b4',
    E: look.eye, r: look.collar ? '#d6336c' : look.fur[1], y: look.collar ? '#f4c542' : look.fur[1], T: look.toes ? look.point[1] : look.fur[0]
  };
  const loafDrop = body === 'loaf' ? 2 : 0, headDrop = (f.head ?? 0) + loafDrop;
  px.grid(CAT_BODY[body], pal, 0, 9);
  let head = CAT_HEAD.map(r => r);
  if (f.eyes === 'closed') { head[5] = '......kWWWWWWWWWk'; head[6] = '......kWkkWWkkWWk'; }
  if (f.eyes === 'big') head[4] = '......kWEEWWEEWWk';
  px.grid(head, pal, 0, headDrop);
  if (look.stripes) { px.p(10, 3 + headDrop, look.stripes).p(12, 3 + headDrop, look.stripes).p(7, 11, look.stripes).p(9, 10, look.stripes).p(11, 11, look.stripes); }
  if (f.tongue) px.p(11, 9 + headDrop, '#e8607e');
  if (f.crumbs) { px.p(9, 9 + headDrop, '#d9a35f').p(13, 10 + headDrop, '#d9a35f').p(6, 4 + headDrop, '#d9a35f'); }
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
