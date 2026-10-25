// The things that crawl out of the ground once it starts raining. Sprites are 24x24, two frames each.
import { Px, INK, C, dk, lt } from './paint';

export const MON_W = 24, MON_H = 24;

export type Effect = {
  dmg?: [number, number];   // damage to Mohit
  stun?: boolean;           // Mohit loses his next turn
  burn?: number;            // Mohit takes 10 damage for this many turns
  weaken?: number;          // Mohit's attacks do half damage for this many turns
  blind?: number;           // Mohit's attacks miss more for this many turns
  guard?: number;           // monster takes half damage for this many turns
  evade?: boolean;          // monster dodges Mohit's next attack
  heal?: number;            // monster heals itself
  self?: number;            // monster hurts itself
  drain?: boolean;          // monster heals by the damage it deals
};
export interface Skill { name: string; weight: number; text: string; fx: Effect }
export interface Monster {
  id: string; name: string; hp: number; befriend: number; runChance: number;
  intro: string; win: string; friend: string;
  skills: Skill[];
  draw: (p: Px, frame: 0 | 1) => void;
}

function eyes(p: Px, x: number, y: number, gap: number, c: string) {
  p.r(x, y, 2, 2, c).r(x + gap, y, 2, 2, c).p(x, y, '#ffffff').p(x + gap, y, '#ffffff');
}

export const MONSTERS: Monster[] = [
  {
    id: 'puddle', name: 'Puddle Shade', hp: 35, befriend: 0.45, runChance: 0.7,
    intro: 'A puddle stands up. It has eyes now.', win: 'The Puddle Shade splashes flat and soaks back into the road.',
    friend: 'The Puddle Shade ripples happily and drains away into a gutter.',
    skills: [
      { name: 'Splash', weight: 45, text: 'It slaps a wave of cold gutter water at Mohit!', fx: { dmg: [10, 20] } },
      { name: 'Soak', weight: 30, text: 'Mohit is soaked through. His arms feel heavy.', fx: { weaken: 2 } },
      { name: 'Drip Drop', weight: 25, text: 'It soaks up the rain and grows a little.', fx: { heal: 8 } }
    ],
    draw(p, f) {
      const w = f ? 9 : 10, h = f ? 9 : 8;
      p.shadow(12, 22, 11, 2);
      p.ell(12, 21 - h / 2, w, h, '#25344a').ell(12, 21 - h / 2 - 1, w - 2, h - 2, '#30445e');
      p.ell(12, 22, 11, 2, '#1b2536');
      p.p(6, 13, '#6f8fb8').p(7, 12, '#6f8fb8').p(17, 15, '#5a7aa3');
      p.p(4, 19, '#30445e').p(20, 18 + f, '#30445e').p(20, 19 + f, '#30445e');
      eyes(p, 8, 15 - (f ? 1 : 0), 6, '#7ef0ff');
      p.outline();
    }
  },
  {
    id: 'wire', name: 'Wire Wraith', hp: 40, befriend: 0.25, runChance: 0.6,
    intro: 'The overhead wires knot themselves into a body.', win: 'The Wire Wraith fizzles, sparks once, and goes dark.',
    friend: 'The Wire Wraith hums a happy little 50 Hz hum and climbs back up a pole.',
    skills: [
      { name: 'Zap', weight: 40, text: 'ZZZT! A jolt runs up Mohit\'s arm.', fx: { dmg: [15, 25] } },
      { name: 'Entangle', weight: 25, text: 'Wires wrap around Mohit\'s ankles. He can\'t move!', fx: { stun: true } },
      { name: 'Short Circuit', weight: 15, text: 'It overloads! Sparks everywhere, including on itself.', fx: { dmg: [25, 35], self: 5 } },
      { name: 'Hum', weight: 20, text: 'It just... hums. Ominously.', fx: {} }
    ],
    draw(p, f) {
      p.shadow(12, 22, 9, 2);
      const loops: [number, number, number, number][] = [[12, 9, 7, 6], [10, 14, 6, 6], [14, 15, 6, 5], [12, 19, 5, 3]];
      loops.forEach(([x, y, rx, ry]) => {
        for (let a = 0; a < Math.PI * 2; a += 0.12) p.p(Math.round(x + Math.cos(a) * rx), Math.round(y + Math.sin(a) * ry), INK);
      });
      p.line(5, 21, 8, 16, INK).line(19, 21, 16, 17, INK).line(12, 3, 12, 1, INK).line(12, 1, 16, 0, INK);
      p.r(9, 8, 2, 2, '#ff4f5e').r(14, 8, 2, 2, '#ff4f5e');
      const sp = f ? [[4, 7], [20, 12], [9, 17]] : [[19, 5], [3, 13], [16, 19]];
      sp.forEach(([x, y]) => p.p(x, y, '#ffe56b').p(x + 1, y + 1, '#ffffff'));
    }
  },
  {
    id: 'kulhad', name: 'Kulhad Golem', hp: 50, befriend: 0.35, runChance: 0.75,
    intro: 'Broken chai cups scrape together into something tall.', win: 'The Kulhad Golem crumbles into a heap of clay shards.',
    friend: 'The Kulhad Golem pours out a little tea for PoiPoi and shuffles off.',
    skills: [
      { name: 'Clay Toss', weight: 50, text: 'It hurls a chipped kulhad at Mohit!', fx: { dmg: [10, 20] } },
      { name: 'Crumble Guard', weight: 30, text: 'It hunches its cups together. Harder to hurt now.', fx: { guard: 2 } },
      { name: 'Chai Spill', weight: 20, text: 'Scalding chai splashes on Mohit! It keeps burning.', fx: { dmg: [5, 10], burn: 2 } }
    ],
    draw(p, f) {
      p.shadow(12, 22, 9, 2);
      const cup = (x: number, y: number, w: number, h: number) => {
        p.r(x, y, w, h, C.brick[1]).r(x, y, w, 1, C.brick[0]).r(x + w - 2, y + 1, 2, h - 1, C.brick[2]).r(x, y + h - 1, w, 1, C.brick[3]);
      };
      cup(8, 2, 8, 7); cup(7, 9, 10, 7); cup(9, 16, 6, 4);
      p.r(3, 10, 4, 3, C.brick[1]).r(17, 10 + f, 4, 3, C.brick[1]);
      p.r(9 - f, 20, 3, 3, C.brick[2]).r(12 + f, 20, 3, 3, C.brick[2]);
      p.line(10, 11, 12, 14, C.brick[3]).line(14, 4, 13, 7, C.brick[3]);
      p.r(9, 3, 6, 2, '#3a1f12');
      eyes(p, 9, 5, 4, '#ffb347');
      p.outline();
    }
  },
  {
    id: 'auto', name: 'Bhoot Auto', hp: 55, befriend: 0.2, runChance: 0.3,
    intro: 'An empty auto rolls up by itself. Its one headlight blinks at Mohit.', win: 'The Bhoot Auto sputters, coughs black smoke and rolls away into nothing.',
    friend: 'The Bhoot Auto lets out a soft little beep and drives off to find a passenger.',
    skills: [
      { name: 'Ram', weight: 35, text: 'It revs and rams straight into Mohit!', fx: { dmg: [20, 30] } },
      { name: 'HONK', weight: 30, text: 'HOOOONK! Mohit freezes in place.', fx: { stun: true } },
      { name: 'Meter Down', weight: 20, text: 'The meter starts running... on Mohit.', fx: { dmg: [10, 15], drain: true } },
      { name: 'Reverse', weight: 15, text: 'It reverses suddenly, out of reach.', fx: { evade: true } }
    ],
    draw(p, f) {
      const y = f;
      p.shadow(12, 22, 11, 2);
      p.r(2, 12 + y, 20, 7, dk('#3f8f4f', 0.35)).r(2, 12 + y, 20, 1, '#3f8f4f');
      p.r(4, 4 + y, 16, 8, dk('#f2b632', 0.35)).r(4, 4 + y, 16, 1, dk('#f2b632', 0.1));
      p.r(6, 6 + y, 5, 5, '#1a1a24').r(13, 6 + y, 6, 6, '#120f18');
      p.r(1, 14 + y, 3, 3, '#ffffff').r(0, 13 + y, 2, 5, '#fff3a0');
      p.disc(6, 20, 2, INK).disc(18, 20, 2, INK);
      p.p(15, 8 + y, '#ff4f5e').p(17, 8 + y, '#ff4f5e');
      p.speck(1, 1, 22, 4, '#8a8792', 0.06);
      p.outline();
    }
  },
  {
    id: 'bag', name: 'Plastic Phantom', hp: 30, befriend: 0.1, runChance: 0.85,
    intro: 'A plastic bag drifts up out of the ground. It does not drift back down.', win: 'The Plastic Phantom deflates with a sad crinkle.',
    friend: 'The Plastic Phantom floats up and away on the wind. Free at last.',
    skills: [
      { name: 'Smother', weight: 45, text: 'It wraps itself around Mohit\'s face!', fx: { dmg: [12, 18] } },
      { name: 'Static Cling', weight: 20, text: 'It sticks to Mohit\'s arm and will not let go. *zap*', fx: { dmg: [6, 10] } },
      { name: 'Float Away', weight: 20, text: 'A gust lifts it just out of reach.', fx: { evade: true } },
      { name: 'Crinkle', weight: 15, text: '*crinkle crinkle*. Deeply annoying, but harmless.', fx: {} }
    ],
    draw(p, f) {
      const s = f ? 1 : 0;
      p.shadow(12, 22, 7, 1);
      p.r(6 + s, 6, 12, 11, '#eceaf2').r(6 + s, 6, 12, 1, '#ffffff').r(15 + s, 7, 3, 10, '#cfcad8');
      p.r(6 + s, 2, 3, 4, '#eceaf2').r(15 + s, 2, 3, 4, '#eceaf2').p(7 + s, 2, '#ffffff');
      for (let i = 0; i < 12; i += 3) p.r(6 + s + i, 17, 2, 2 + ((i / 3 + f) % 2), '#eceaf2');
      p.r(9 + s, 9, 2, 3, INK).r(13 + s, 9, 2, 3, INK).r(11 + s, 13, 2, 2, INK);
      p.outline();
    }
  },
  {
    id: 'smog', name: 'Smog Wisp', hp: 38, befriend: 0.3, runChance: 0.7,
    intro: 'The haze thickens into a lump. The lump looks at Mohit.', win: 'The Smog Wisp thins out and blows away.',
    friend: 'The Smog Wisp lightens to a pale, harmless mist and drifts off.',
    skills: [
      { name: 'Choke', weight: 35, text: 'It pours itself into Mohit\'s lungs. *cough cough*', fx: { dmg: [15, 20] } },
      { name: 'Cough Cloud', weight: 40, text: 'Mohit can barely see through the smog.', fx: { dmg: [5, 10], blind: 2 } },
      { name: 'Haze', weight: 25, text: 'It soaks up the city air and thickens.', fx: { heal: 8 } }
    ],
    draw(p, f) {
      p.shadow(12, 22, 9, 2);
      const blobs: [number, number, number][] = f ? [[8, 12, 6], [15, 11, 6], [12, 7, 5], [12, 15, 6]] : [[7, 13, 6], [16, 12, 5], [11, 8, 5], [12, 16, 6]];
      blobs.forEach(([x, y, r]) => p.disc(x, y, r, '#8d8996'));
      blobs.forEach(([x, y, r]) => p.disc(x - 1, y - 1, r - 2, '#a5a1ae'));
      p.dith(4, 4, 16, 16, lt('#8d8996', 0.15), true);
      eyes(p, 8, 11, 6, '#e6e05a');
      p.line(10, 16, 14, 16, INK).p(9, 17, INK).p(15, 17, INK);
      p.outline();
    }
  }
];

export const monsterById = (id: string) => MONSTERS.find(m => m.id === id)!;

export function pickSkill(m: Monster) {
  let r = Math.random() * m.skills.reduce((s, k) => s + k.weight, 0);
  for (const k of m.skills) if ((r -= k.weight) <= 0) return k;
  return m.skills[0];
}
