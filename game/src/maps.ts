// Chapter 1 maps and story beats. World units: one 16px tile = 48 units (art is drawn at 3x).
import Phaser from 'phaser';
import type { World } from './scenes/World';
import { state, type MapName } from './state';
import { ui, hi } from './ui';
import { sfx } from './audio';
import { type Px, INK } from './px/paint';
import { ART } from './px/scale';

type Ambient = 'wind' | 'drone' | 'gym' | 'hum' | null;
const T = 48;
const MAT = '#b5743f';

export interface Spot {
  x: number; y: number; r: number;
  label: string;
  door?: boolean;
  when?: (w: World) => boolean;
  run: (w: World) => Promise<void>;
}
export interface MapDef {
  tiles: string[];
  wall?: number;                                      // height of the back wall in world units (not walkable)
  indoor?: boolean;
  ambient: Ambient;
  decorate?: (p: Px) => void;                         // extra ground details in art pixels
  wires?: [number, number, number, number, number][]; // overhead cables: x0, y0, x1, y1, sag (art px)
  props: { key: string; x: number; y: number; wall?: boolean; floor?: boolean }[];
  blocks?: [number, number, number, number][];
  lights?: [number, number, string, number][];        // indoor light pools: x, y, colour, radius
  spawns: Record<string, [number, number]>;
  spots: Spot[];
  poiAllowed?: boolean;
  setup?: (w: World) => void;
  enter?: (w: World) => Promise<void>;
  update?: (w: World, dt: number) => void;
  hints?: () => boolean;
  target?: () => [number, number] | null;
}

const f = (k: string) => state.flag(k);
const M = (text: string) => ({ who: 'MOHIT', text });
const P = (text: string) => ({ who: 'POIPOI', text });

export function objectiveText(): string | null {
  if (!f('woke')) return null;
  if (!f('cityIntro')) return 'Go outside';
  if (!f('gym')) return 'Check the gym across the road';
  if (!f('gymSearched')) return 'Look around the gym';
  if (!f('cafe')) return 'Open the café with the keys';
  if (!f('metPoi')) return 'Check the café kitchen';
  if (!f('fed')) return 'Make the cat something to eat';
  if (!f('ch1Done')) return 'Explore the town with PoiPoi';
  return 'Keep exploring';
}

/** A door: walks you to another map, unless PoiPoi has wandered off. */
function door(x: number, y: number, to: MapName, spawn: string, label: string, check?: (w: World) => Promise<boolean>): Spot {
  return {
    x, y, r: 44, label, door: true,
    run: async w => {
      if (w.poi?.distracted) { await w.say(M("Wait. Where's PoiPoi?")); return; }
      if (check && !(await check(w))) return;
      w.goto(to, spawn);
    }
  };
}
const look = (x: number, y: number, r: number, lines: Parameters<World['say']>[0], label = 'Look'): Spot =>
  ({ x, y, r, label, run: async w => { await w.say(lines); } });

/* ---------- gym: looking at anything turns up the café keys ---------- */
async function foundKeys(w: World) {
  sfx.sparkle(); w.emote(w.player, '!', '#ffc23c');
  await w.wait(400);
  await w.say(["Wait. There's something here.", 'A keyring shaped like a tiny teacup.', 'The tag says: <b>CHAI &amp; CRUMBS</b>.']);
  await w.say(M('The café keys? Someone from the café was here...'));
  state.set('gymSearched');
  w.clearHints();
  ui.objective(objectiveText());
  ui.toast('You can open the café now.<small>It is across the road, on the south side.</small>', 4600);
}
const gymLook = (x: number, y: number, r: number, lines: Parameters<World['say']>[0]): Spot => ({
  x, y, r, label: 'Look',
  run: async w => { await w.say(lines); if (!f('gymSearched')) await foundKeys(w); }
});

/* ---------- the paper bag in the kitchen ---------- */
const BAG_X = 250, BAG_Y = 250;
function kitchenBag(w: World) {
  const bag = w.add.sprite(BAG_X, BAG_Y, 'bag', 'idle').setOrigin(0.5, 0.95).setScale(ART).setDepth(BAG_Y);
  w.extra.bag = bag;
  const wobble = () => {
    if (!bag.active) return;
    w.tweens.add({
      targets: bag, angle: { from: -4, to: 4 }, duration: 110, yoyo: true, repeat: Phaser.Math.Between(2, 5),
      onStart: () => { bag.setFrame('squash'); sfx.rustle(); },
      onComplete: () => { if (bag.active) { bag.setFrame('idle'); bag.angle = 0; w.time.delayedCall(Phaser.Math.Between(900, 2200), wobble); } }
    });
  };
  w.time.delayedCall(600, wobble);
  w.extra.dark = w.add.rectangle(0, 0, 480, 384, 0x140d1f, 0.34).setOrigin(0).setDepth(9000);
}

async function confront(w: World) {
  const bag = w.extra.bag as Phaser.GameObjects.Sprite;
  w.tweens.killTweensOf(bag); bag.angle = 0; bag.setFrame('idle');
  w.emote(w.player, '!', '#ffc23c');
  await w.wait(500);
  sfx.stinger(); w.shake(420, 0.012); w.flash(220);
  await ui.banner('CONFRONTATION!', 'danger', 1300);
  await w.battle();
  bag.destroy();
  w.tweens.add({ targets: w.extra.dark as Phaser.GameObjects.Rectangle, alpha: 0, duration: 1200 });
  w.prop('bagdown', 392, 262, false, true);
  const poi = w.addPoi(BAG_X, BAG_Y);
  w.followPaused = true;
  poi.sprite.setFlipX(w.player.x < poi.sprite.x).play('p-loaf');
  sfx.ambient('hum');
  w.recolor();
  ui.objective(objectiveText());
  await feed(w);
}

async function feed(w: World) {
  const s = w.poi!.sprite, p = w.player;
  w.followPaused = true;
  if (Math.abs(p.x - s.x) < 60) await w.walk(p, s.x + 80, s.y + 6);
  s.setFlipX(p.x < s.x);
  p.setFlipX(p.x > s.x);
  await w.say([M('You seem hungry.'), M("I'll make you something to eat.")]);
  await w.walk(p, 160, 168);
  sfx.rustle(); w.emote({ x: 160, y: 120 }, '♪', '#ffc23c', 30);
  await w.wait(700);
  await w.say(['Mohit boils some plain chicken.', `No salt. No ${hi('masala', 'spices')}. Cat-safe.`]);
  await w.walk(p, s.x + 82, s.y + 4);
  s.setFlipX(false); p.setFlipX(true);
  const bowl = w.add.image(s.x + 36, s.y + 4, 'pix-bowl').setOrigin(0.5, 1).setScale(ART).setDepth(s.y + 4);
  sfx.heart();
  s.play('p-eat');
  for (let i = 0; i < 5; i++) { sfx.nom(); w.emote({ x: s.x + 18, y: s.y }, 'nom', '#ffffff', 50); await w.wait(380); }
  s.play('p-loaf');
  w.float(s.x, s.y - 50, 'pix-heart', 1.4); sfx.heart();
  w.tweens.add({ targets: bowl, alpha: 0, delay: 600, duration: 500, onComplete: () => bowl.destroy() });
  await w.wait(500);
  await w.say(M('Hey... do you know why everyone disappeared?'));
  s.stop(); s.setFrame('stare');
  await w.wait(900);
  await w.say(P('...'));
  sfx.meow();
  await w.say(P('Meow.'));
  await w.say(M("...Right. Cats can't talk."));
  s.play('p-loaf');
  await w.say(M("Okay. Let's go find out what happened. Together."));
  sfx.sparkle();
  state.set('fed');
  w.recolor();
  w.followPaused = false;
  w.trail = [{ x: s.x, y: s.y }, { x: p.x, y: p.y }];
  ui.objective('Explore the town with PoiPoi');
  ui.toast('PoiPoi follows you around now. Mostly.', 2600);
}

async function chapterEnd(w: World) {
  await w.say(['The road out of town is blocked.']);
  await w.say(M("Huh. Guess we're not leaving the easy way."));
  if (w.poi) w.emote(w.poi.sprite, '?', '#ffc23c', 60);
  await w.say(['PoiPoi is looking at a leaf.']);
  await w.say(M("...We'll figure it out. Together."));
  state.set('ch1Done');
  w.recolor();
  sfx.fanfare();
  const c = await ui.overlay(
    `<p class="kicker">END OF</p><h2>CHAPTER 1</h2>
     <p>Mohit and PoiPoi set out to find where everyone went.</p>
     <p class="small">Chapter 2 is on its way. Follow <a href="https://www.instagram.com/mohitdoessomething/" target="_blank" rel="noopener">@mohitdoessomething</a> so you don't miss it.</p>`,
    [{ label: 'Keep exploring', value: 'stay', primary: true }, { label: 'Back to title', value: 'title' }], 'end');
  ui.objective(objectiveText());
  if (c === 'title') w.game.events.emit('to-title');
}

/* ---------- city layout ---------- */
function cityTiles(): string[] {
  const rows: string[] = [];
  for (let y = 0; y < 24; y++) {
    let row = '';
    for (let x = 0; x < 32; x++) {
      let c = 'p';
      const hRoad = y === 11 || y === 12, vRoad = x === 15 || x === 16;
      if (hRoad || vRoad) c = 'r';
      else if (y === 10 || y === 13 || x === 14 || x === 17) c = 'f';
      else if (x >= 18 && y >= 14) c = (y === 18 || x === 24) ? 'k' : 'g';
      if (hRoad && (x === 13 || x === 18)) c = 'Z';
      if (vRoad && (y === 9 || y === 14)) c = 'z';
      row += c;
    }
    rows.push(row);
  }
  return rows;
}
const POLES: [number, number][] = [[168, 500], [600, 500], [930, 500], [1310, 500], [260, 650], [1010, 650]];
const poleTop = ([x, y]: [number, number]): [number, number] => [Math.round(x / ART) + 2, Math.round((y - 258) / ART)];

function cityWires(): [number, number, number, number, number][] {
  const top = POLES.slice(0, 4).map(poleTop), bot = POLES.slice(4).map(poleTop);
  const out: [number, number, number, number, number][] = [];
  for (let i = 0; i < top.length - 1; i++) {
    const [a, b] = [top[i], top[i + 1]];
    out.push([a[0], a[1], b[0], b[1], 10], [a[0], a[1] + 2, b[0], b[1] + 3, 16], [a[0] - 1, a[1] + 4, b[0], b[1] + 1, 22]);
  }
  out.push([top[1][0], top[1][1], bot[0][0], bot[0][1], 8], [top[2][0], top[2][1] + 2, bot[1][0], bot[1][1], 10]);
  out.push([0, 70, top[0][0], top[0][1], 12], [top[3][0], top[3][1], 512, 60, 14], [top[3][0], top[3][1] + 3, 512, 90, 9]);
  out.push([top[1][0], top[1][1] + 1, 150, 46, 6], [top[0][0], top[0][1] + 2, 110, 50, 5]);
  return out;
}

/* ---------- the maps ---------- */
export const MAPS: Record<MapName, MapDef> = {
  room: {
    tiles: ['WWWWWWWWWW', 'WWWWWWWWWW', 'wwwwwwwwww', 'oooooooooo', 'oooooooooo', 'oooooooooo', 'oooooooooo', 'oooooooooo', 'oooooooooo'],
    wall: 136, indoor: true, ambient: null,
    decorate(p) {
      p.r(68, 136, 24, 8, MAT).box(67, 135, 26, 10, INK).r(70, 138, 20, 1, '#d79a64');
      p.line(0, 6, 160, 6, '#3a2550');
      for (let x = 4; x < 160; x += 9) p.p(x, 7 + (x % 3), '#3a2550').p(x, 8 + (x % 3), ['#ffd77a', '#ff9ec0', '#9fe8ff', '#fff1c9'][x % 4]);
    },
    props: [
      { key: 'rug', x: 228, y: 372, floor: true }, { key: 'slippers', x: 300, y: 428, floor: true },
      { key: 'window', x: 270, y: 126, wall: true }, { key: 'posterInk', x: 372, y: 108, wall: true }, { key: 'wallshelf', x: 446, y: 72, wall: true },
      { key: 'desk', x: 96, y: 178 }, { key: 'chair', x: 110, y: 224 },
      { key: 'guitar', x: 222, y: 172 }, { key: 'piano', x: 330, y: 172 }, { key: 'plant', x: 456, y: 176 },
      { key: 'bed', x: 396, y: 424 }, { key: 'beanbag', x: 46, y: 300 }, { key: 'laundry', x: 46, y: 412 },
      { key: 'books', x: 190, y: 252 }, { key: 'backpack', x: 300, y: 246 }
    ],
    lights: [[270, 150, '#fff1c9', 110], [130, 80, '#9fd8ff', 70]],
    spawns: { wake: [300, 380], door: [240, 404] },
    spots: [
      look(64, 198, 58, ["Mohit's laptop. Instagram is still open.", '44 followers. Still 44.']),
      { x: 330, y: 198, r: 60, label: 'Play', run: async w => { sfx.piano(); await w.wait(300); await w.say('Mohit plays a few notes. It sounds nice, actually.'); } },
      { x: 222, y: 190, r: 38, label: 'Strum', run: async w => { sfx.strum(); await w.say('Mohit strums the guitar once. Slightly out of tune. Like always.'); } },
      look(390, 330, 90, ['Mohit could go back to sleep...', '...but the silence is too loud.']),
      look(270, 160, 40, ['The street outside is completely empty.']),
      look(372, 156, 34, ['A poster of The Ink Spots. 1939.', "Mohit's favourite song is still stuck in his head."]),
      look(46, 410, 50, ['A pile of laundry. Clean or dirty?', "It's been there long enough that nobody knows."]),
      look(46, 318, 44, ['The beanbag still has a Mohit-shaped dent in it.']),
      door(240, 424, 'city', 'apt', 'Go out')
    ],
    async enter(w) {
      if (f('woke')) return;
      const p = w.player;
      p.stop(); p.setFrame('blink');
      w.cameras.main.fadeIn(1400, 0, 0, 0);
      await w.wait(1500);
      await w.say(['...', 'Mohit wakes up.']);
      p.setFrame('idle');
      await w.wait(400);
      await w.say(["It's quiet. Weirdly quiet.", 'No horns. No pressure cooker whistles. No neighbours arguing about parking.']);
      p.setFrame('o');
      await w.say(M('...Hello?'));
      await w.wait(600);
      p.play('m-idle');
      await w.say(['Nobody answers.', 'Mohit checks his phone.', '0 new notifications. Even the group chat is silent.']);
      state.set('woke');
      ui.objective(objectiveText());
      ui.toast(matchMedia('(pointer: coarse)').matches
        ? 'Drag on the left side to move.<small>Tap the pink button to look at things.</small>'
        : 'Move with WASD or the arrow keys.<small>Press E or Space to look at things.</small>', 5200);
    }
  },

  city: {
    tiles: cityTiles(), ambient: 'wind',
    decorate(p) {
      for (let x = 2; x < 512; x += 10) if (x < 208 || x > 304) p.r(x, 191, 5, 2, '#f2d36b');
      for (let y = 2; y < 384; y += 10) if (y < 144 || y > 240) p.r(255, y, 2, 5, '#f2d36b');
      [[96, 196], [200, 340], [420, 186]].forEach(([x, y]) => p.disc(x, y, 4, '#4a4452').disc(x, y, 3, '#5a5462').line(x - 2, y, x + 2, y, '#3d3746'));
    },
    wires: cityWires(),
    props: [
      { key: 'apt', x: 336, y: 476 }, { key: 'gym', x: 1056, y: 476 }, { key: 'shops', x: 1384, y: 476 },
      { key: 'cwall', x: 52, y: 476 }, { key: 'cwall', x: 620, y: 476 },
      { key: 'cafe', x: 336, y: 958 }, { key: 'dairy', x: 600, y: 760 },
      { key: 'tapri', x: 920, y: 770 },
      ...POLES.map(([x, y]) => ({ key: 'pole', x, y })),
      { key: 'busstop', x: 1250, y: 522 }, { key: 'auto', x: 470, y: 616 }, { key: 'scooter', x: 560, y: 522 },
      { key: 'neem', x: 64, y: 330 }, { key: 'neem', x: 640, y: 300 }, { key: 'neem', x: 90, y: 760 }, { key: 'neem', x: 610, y: 1080 },
      { key: 'neem', x: 1000, y: 1060 }, { key: 'neem', x: 1440, y: 790 }, { key: 'neem', x: 1460, y: 1100 }, { key: 'neem', x: 1310, y: 1110 },
      { key: 'bench', x: 1060, y: 980 }, { key: 'bench', x: 1320, y: 980 },
      { key: 'stumps', x: 1310, y: 760 },
      { key: 'bush', x: 1080, y: 760 }, { key: 'bush', x: 1480, y: 950 }, { key: 'bush', x: 1100, y: 1120 },
      { key: 'bin', x: 600, y: 520 }, { key: 'bin', x: 1196, y: 700 },
      ...Array.from({ length: 13 }, (_, i) => 888 + i * 48).filter(x => x < 1140 || x > 1212).map(x => ({ key: 'railing', x, y: 700 })),
      { key: 'barricade', x: 1500, y: 566 }, { key: 'barricade', x: 1500, y: 618 },
      { key: 'barricade', x: 40, y: 566 }, { key: 'barricade', x: 40, y: 618 },
      { key: 'barricade', x: 768, y: 70 }, { key: 'barricade', x: 768, y: 1146 }
    ],
    blocks: [[1450, 528, 86, 96], [0, 528, 86, 96], [720, 0, 96, 64], [720, 1100, 96, 52]],
    spawns: { apt: [336, 508], gym: [1056, 508], cafe: [336, 990], east: [1400, 576] },
    spots: [
      door(336, 484, 'room', 'door', 'Go in'),
      door(1056, 484, 'gym', 'door', 'Enter'),
      door(336, 966, 'cafe', 'door', 'Enter', async w => {
        if (f('gymSearched')) return true;
        await w.say(['The café door is locked.', 'There is a note taped to it:', '"Gone to the gym. Back in 5 min."']);
        await w.say(M('...The gym, then.'));
        state.set('sawNote');
        return false;
      }),
      { x: 1420, y: 576, r: 80, label: 'Look', run: async w => { if (f('fed')) await chapterEnd(w); else await w.say(['Road closed.', 'Who even put this here?']); } },
      look(120, 576, 80, ['Also closed.']),
      look(768, 110, 60, ['This one too. Suspicious.']),
      look(768, 1090, 60, ['Closed. Every road out of town is closed.']),
      look(1250, 540, 54, ["Bus stop. The board says the next bus is 'Delayed'.", 'It always says that.']),
      look(470, 640, 50, ['An auto, parked with the meter still down.', 'No driver. No "Bhaiya, chaloge?" Nothing.']),
      look(920, 790, 56, ['The chai tapri. The kettle is still warm.', 'Ten rupees a cup, and nobody to sell it.']),
      look(600, 780, 44, ['The milk booth. The crates are full.']),
      look(1310, 778, 40, ['Gully cricket stumps. Someone was batting.', 'They left mid-over.']),
      look(1384, 500, 60, ["Every shutter is down. Even Sharma ji's, and he never closes."])
    ],
    target: () => !f('cityIntro') ? null
      : !f('gymSearched') ? [1056, 400]
      : !f('cafe') ? [336, 880]
      : f('fed') && !f('ch1Done') ? [1440, 520] : null,
    setup(w) {
      const bag = w.add.image(-40, 560, 'pix-plasticbag').setScale(ART).setDepth(600);
      const roll = () => {
        bag.setPosition(-40, Phaser.Math.Between(545, 605));
        w.tweens.add({
          targets: bag, x: 1580, angle: 720, duration: 9500, ease: 'Linear',
          onUpdate: () => { bag.y += Math.sin(bag.x / 40) * 0.6; },
          onComplete: () => w.time.delayedCall(Phaser.Math.Between(6000, 14000), roll)
        });
      };
      w.time.delayedCall(2500, roll);
    },
    async enter(w) {
      if (f('cityIntro')) return;
      await w.wait(400);
      await w.say(['Mohit steps outside.', 'Nobody. Not a single person. Not even a stray dog.']);
      await w.say(M('...Where did everyone go?'));
      await w.say(M('The gym across the road is always packed. Someone has to be there.'));
      state.set('cityIntro');
      ui.objective(objectiveText());
    }
  },

  gym: {
    tiles: ['MMMMMMMMMMM', 'mmmmmmmmmmm', 'uuuuuuuuuuu', 'uuuuuuuuuuu', 'uuuuuuuuuuu', 'uuuuuuuuuuu', 'uuuuuuuuuuu', 'uuuuuuuuuuu'],
    wall: 92, indoor: true, ambient: 'gym',
    hints: () => !f('gymSearched'),
    decorate(p) { p.r(76, 120, 24, 8, '#3a3f4c').box(75, 119, 26, 10, INK); },
    props: [
      { key: 'mat', x: 132, y: 330, floor: true },
      { key: 'speaker', x: 40, y: 126 }, { key: 'treadmill', x: 130, y: 150 }, { key: 'treadmill', x: 250, y: 150 },
      { key: 'rack', x: 420, y: 140 }, { key: 'cooler', x: 504, y: 140 }, { key: 'benchpress', x: 420, y: 304 }
    ],
    lights: [[264, 60, '#dbeeff', 160]],
    spawns: { door: [264, 350] },
    spots: [
      gymLook(190, 172, 80, ['A treadmill. Mohit stares at it.', 'It stares back. Neither of them moves.']),
      gymLook(420, 162, 56, ['Mohit lifts a dumbbell.', 'Then puts it back. Respectfully.']),
      gymLook(40, 146, 44, ['The gym playlist is still going.', 'Honestly, kind of a banger.']),
      gymLook(504, 160, 40, ['Free water. At least something still works.']),
      gymLook(420, 324, 60, ["Nobody's spotting anybody today."]),
      door(264, 372, 'city', 'gym', 'Go out')
    ],
    async enter(w) {
      if (f('gym')) return;
      await w.wait(300);
      await w.say(['The gym is empty.', 'The music is still playing. To nobody.']);
      await w.say(M('Hm. Maybe someone left something behind.'));
      state.set('gym');
      ui.objective(objectiveText());
    }
  },

  cafe: {
    tiles: ['AAAAAAAAAAA', 'aaaaaaaaaaa', 'xxxxxxxxxxx', 'xxxxxxxxxxx', 'xxxxxxxxxxx', 'xxxxxxxxxxx', 'xxxxxxxxxxx', 'xxxxxxxxxxx', 'xxxxxxxxxxx'],
    wall: 92, indoor: true, ambient: 'hum',
    target: () => f('cafe') && !f('metPoi') ? [460, 0] : null,
    decorate(p) {
      p.r(76, 136, 24, 8, MAT).box(75, 135, 26, 10, INK);
      for (let x = 6; x < 176; x += 10) p.p(x, 3 + (x % 4 ? 1 : 0), x % 20 ? '#ffd27a' : '#ff9ec0');
    },
    props: [
      { key: 'menuboard', x: 264, y: 66, wall: true }, { key: 'kdoor', x: 460, y: 96, wall: true },
      { key: 'counter', x: 130, y: 190 },
      { key: 'tableset', x: 300, y: 272 }, { key: 'tableset', x: 440, y: 334 }, { key: 'tableset', x: 170, y: 356 },
      { key: 'plant', x: 24, y: 150 }, { key: 'plant', x: 512, y: 150 }
    ],
    lights: [[264, 40, '#ffd27a', 150], [130, 120, '#ffcf7a', 80]],
    spawns: { door: [264, 398], kitchen: [460, 140] },
    spots: [
      look(130, 212, 78, ['Fresh buns under the glass. Nobody is watching them.', 'Mohit is not that kind of person either.']),
      look(300, 292, 56, ['A half-finished cup of chai.', "It's still a little warm..."]),
      look(440, 354, 56, ['Someone left a crossword half done. 7 down: "LONELY".', 'Mohit puts the pen down.']),
      door(460, 120, 'kitchen', 'door', 'Open', async w => {
        if (f('cafe')) return true;
        await w.say(['STAFF ONLY.', 'Mohit is not staff.']);
        return false;
      }),
      door(264, 420, 'city', 'cafe', 'Go out')
    ],
    async enter(w) {
      if (f('cafe')) return;
      await w.wait(300);
      await w.say(['The café is empty too.', 'The coffee machine is still humming.']);
      await w.wait(900);
      sfx.rustle(); w.shake(300, 0.004);
      await w.wait(300);
      await w.say(['*crinkle...*', '*crinkle crinkle...*']);
      w.emote(w.player, '!', '#ffc23c');
      await w.wait(500);
      await w.say(['Something rustled. In the kitchen.']);
      state.set('cafe');
      ui.objective(objectiveText());
    }
  },

  kitchen: {
    tiles: ['KKKKKKKKKK', 'qqqqqqqqqq', 'yyyyyyyyyy', 'yyyyyyyyyy', 'yyyyyyyyyy', 'yyyyyyyyyy', 'yyyyyyyyyy', 'yyyyyyyyyy'],
    wall: 92, indoor: true, ambient: 'drone', poiAllowed: true,
    decorate(p) { p.r(68, 120, 24, 8, MAT).box(67, 119, 26, 10, INK); },
    props: [
      { key: 'fridge', x: 48, y: 128 }, { key: 'stove', x: 160, y: 122 }, { key: 'sink', x: 300, y: 122 },
      { key: 'shelf', x: 420, y: 128 }, { key: 'crates', x: 440, y: 330 }
    ],
    lights: [[240, 40, '#fff1c9', 120]],
    spawns: { door: [240, 360] },
    spots: [
      { x: 48, y: 146, r: 44, label: 'Look', run: w => w.say(f('fed') ? 'The fridge. Mohit closes it before PoiPoi gets ideas.' : 'The fridge is open a crack. Something has been in here.') },
      look(420, 150, 54, ['Shelves of atta and dal. One sack is missing.']),
      door(240, 380, 'cafe', 'kitchen', 'Go out', async w => {
        if (!f('metPoi') || f('fed')) return true;
        await w.say(M("I can't just leave him hungry."));
        return false;
      })
    ],
    setup(w) {
      if (!f('metPoi')) kitchenBag(w);
      else {
        w.prop('bagdown', 392, 262, false, true);
        sfx.ambient('hum');
        if (!f('fed')) { const poi = w.addPoi(BAG_X, BAG_Y); w.followPaused = true; poi.sprite.play('p-loaf'); }
      }
    },
    async enter(w) {
      if (!f('metPoi')) {
        await w.wait(300);
        await w.say(['The kitchen is dark.', 'Something is moving between the shelves.']);
        ui.objective('???');
      } else if (!f('fed')) {
        await feed(w);
      }
    },
    update(w) {
      const bag = w.extra.bag as Phaser.GameObjects.Sprite | undefined;
      if (!bag?.active || w.extra.triggered || w.locked) return;
      if (Phaser.Math.Distance.Between(w.player.x, w.player.y, bag.x, bag.y) < 84) {
        w.extra.triggered = true;
        w.cutscene(() => confront(w));
      }
    }
  }
};

export const mapSize = (m: MapDef) => ({ w: m.tiles[0].length * T, h: m.tiles.length * T });
