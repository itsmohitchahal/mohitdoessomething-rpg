// Chapter 1 maps and story beats.
import Phaser from 'phaser';
import type { World } from './scenes/World';
import { RES } from './art/raster';
import { state, type MapName } from './state';
import { ui, hi } from './ui';
import { sfx } from './audio';

type G = Phaser.GameObjects.Graphics;
type Ambient = 'wind' | 'drone' | 'gym' | 'hum' | null;

export interface Spot {
  x: number; y: number; r: number;
  label: string;
  when?: (w: World) => boolean;
  run: (w: World) => Promise<void>;
}
export interface MapDef {
  w: number; h: number;
  wall?: number;                        // interior back-wall height (not walkable)
  ambient: Ambient;
  draw: (g: G, w: World) => void;
  props: { key: string; x: number; y: number; wall?: boolean }[];
  blocks?: [number, number, number, number][];
  spawns: Record<string, [number, number]>;
  spots: Spot[];
  poiAllowed?: boolean;
  setup?: (w: World) => void;
  enter?: (w: World) => Promise<void>;
  update?: (w: World, dt: number) => void;
}

const f = (k: string) => state.flag(k);
const M = (text: string) => ({ who: 'MOHIT', text });
const P = (text: string) => ({ who: 'POIPOI', text });

export function objectiveText(): string | null {
  if (!f('woke')) return null;
  if (!f('cityIntro')) return 'Go outside';
  if (!f('gym') && !f('cafe')) return 'Check the gym';
  if (!f('cafe')) return 'Check the café';
  if (!f('metPoi')) return 'Check the café kitchen';
  if (!f('fed')) return 'Make the cat something to eat';
  if (!f('ch1Done')) return 'Explore the town with PoiPoi';
  return 'Keep exploring';
}

/** A door: walks you to another map, unless PoiPoi has wandered off. */
function door(x: number, y: number, to: MapName, spawn: string, label: string, check?: (w: World) => Promise<boolean>): Spot {
  return {
    x, y, r: 42, label,
    run: async w => {
      if (w.poi?.distracted) { await w.say(M("Wait. Where's PoiPoi?")); return; }
      if (check && !(await check(w))) return;
      w.goto(to, spawn);
    }
  };
}
const look = (x: number, y: number, r: number, lines: Parameters<World['say']>[0], extra?: () => void, label = 'Look'): Spot =>
  ({ x, y, r, label, run: async w => { extra?.(); await w.say(lines); } });

/* ---------- ground painters ---------- */
function planks(g: G, x: number, y: number, w: number, h: number, base: number, line: number, gap = 24) {
  g.fillStyle(base).fillRect(x, y, w, h);
  g.lineStyle(2, line, 1);
  for (let yy = y + gap, r = 0; yy < y + h; yy += gap, r++) {
    g.lineBetween(x, yy, x + w, yy);
    for (let xx = x + (r % 2 ? 40 : 90); xx < x + w; xx += 130) g.lineBetween(xx, yy - gap, xx, yy);
  }
}
function checker(g: G, x: number, y: number, w: number, h: number, a: number, b: number, s: number) {
  for (let yy = 0; yy * s < h; yy++) for (let xx = 0; xx * s < w; xx++) {
    g.fillStyle((xx + yy) % 2 ? a : b).fillRect(x + xx * s, y + yy * s, Math.min(s, w - xx * s), Math.min(s, h - yy * s));
  }
}
function backWall(g: G, w: number, h: number, color: number, trim: number) {
  g.fillStyle(color).fillRect(0, 0, w, h);
  g.fillStyle(trim).fillRect(0, h - 10, w, 10);
  g.lineStyle(3, 0x1b1325).lineBetween(0, h - 10, w, h - 10).lineBetween(0, h, w, h);
}
function mat(g: G, x: number, y: number) {
  g.fillStyle(0xc98a5a).fillRoundedRect(x - 32, y - 8, 64, 16, 4);
  g.lineStyle(2.5, 0x1b1325).strokeRoundedRect(x - 32, y - 8, 64, 16, 4);
}

/* ---------- the paper bag in the kitchen ---------- */
function kitchenBag(w: World) {
  const bag = w.add.sprite(250, 226, 'bag', 'idle').setOrigin(0.5, 0.97).setScale(1 / RES).setDepth(226);
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
  const dark = w.add.rectangle(0, 0, 480, 390, 0x140d1f, 0.32).setOrigin(0).setDepth(9000);
  w.extra.dark = dark;
}

async function confront(w: World) {
  const bag = w.extra.bag as Phaser.GameObjects.Sprite;
  w.tweens.killTweensOf(bag); bag.angle = 0; bag.setFrame('idle');
  w.emote(w.player, '!', '#ffc23c');
  await w.wait(500);
  sfx.stinger(); w.shake(420, 0.012); w.flash(220);
  await ui.banner('CONFRONTATION!', 'danger', 1300);
  await w.battle();
  // the battle ends with PoiPoi joining; back in the kitchen
  const bx = bag.x, by = bag.y;
  bag.destroy();
  const dark = w.extra.dark as Phaser.GameObjects.Rectangle;
  w.tweens.add({ targets: dark, alpha: 0, duration: 1200 });
  w.prop('bagdown', 392, 252, false).setDepth(252);
  const poi = w.addPoi(bx, by);
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
  await w.walk(p, 170, 178);
  sfx.rustle(); w.emote({ x: 160, y: 140 }, '♪', '#ffc23c', 70);
  await w.wait(700);
  await w.say(['Mohit boils some plain chicken.', `No salt. No ${hi('masala', 'spices')}. Cat-safe.`]);
  await w.walk(p, s.x + 82, s.y + 4);
  s.setFlipX(false); p.setFlipX(true);
  const bowl = w.add.image(s.x + 40, s.y + 4, 'bowl').setOrigin(0.5, 1).setScale(1 / RES).setDepth(s.y + 4);
  sfx.heart();
  s.play('p-eat');
  for (let i = 0; i < 5; i++) { sfx.nom(); w.emote({ x: s.x + 18, y: s.y }, 'nom', '#ffffff', 60); await w.wait(380); }
  s.play('p-loaf');
  w.float(s.x, s.y - 50, 'heart', undefined, 1.2); sfx.heart();
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

/* ---------- the maps ---------- */
export const MAPS: Record<MapName, MapDef> = {
  room: {
    w: 460, h: 390, wall: 118, ambient: null, poiAllowed: true,
    draw(g) {
      backWall(g, 460, 120, 0x4a3a6e, 0x3b2546);
      g.fillStyle(0x54437a);
      for (let x = 0; x < 460; x += 22) g.fillRect(x, 0, 11, 110);
      planks(g, 0, 120, 460, 270, 0x7a4f40, 0x5a3a2f);
      g.fillStyle(0xffd1e1).fillEllipse(230, 285, 210, 108);
      g.fillStyle(0xff8fb6).fillEllipse(230, 285, 190, 92);
      g.lineStyle(3, 0x1b1325).strokeEllipse(230, 285, 210, 108);
      mat(g, 230, 376);
    },
    props: [
      { key: 'window', x: 240, y: 100, wall: true },
      { key: 'desk', x: 110, y: 160 }, { key: 'chair', x: 116, y: 200 },
      { key: 'guitar', x: 236, y: 150 }, { key: 'piano', x: 340, y: 158 },
      { key: 'bed', x: 380, y: 352 }, { key: 'plant', x: 440, y: 172 }
    ],
    spawns: { wake: [292, 330], door: [230, 352] },
    spots: [
      look(90, 176, 52, ["Mohit's laptop. Instagram is still open.", '44 followers. Still 44.']),
      { x: 340, y: 176, r: 56, label: 'Play', run: async w => { sfx.piano(); await w.wait(300); await w.say('Mohit plays a few notes. It sounds nice, actually.'); } },
      { x: 236, y: 162, r: 34, label: 'Strum', run: async w => { sfx.strum(); await w.say('Mohit strums the guitar once. Slightly out of tune. Like always.'); } },
      look(372, 300, 84, ['Mohit could go back to sleep...', '...but the silence is too loud.']),
      look(240, 132, 40, ['The street outside is completely empty.']),
      door(230, 380, 'city', 'apt', 'Go out')
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
    w: 1400, h: 1100, ambient: 'wind',
    draw(g) {
      g.fillStyle(0xd8d0c6).fillRect(0, 0, 1400, 1100);
      const plaza = (x: number, y: number, w: number, h: number) => {
        g.fillStyle(0xe7e0d6).fillRect(x, y, w, h);
        g.lineStyle(1, 0xcfc6ba);
        for (let xx = x + 34; xx < x + w; xx += 34) g.lineBetween(xx, y, xx, y + h);
        for (let yy = y + 34; yy < y + h; yy += 34) g.lineBetween(x, yy, x + w, yy);
      };
      plaza(0, 0, 614, 484); plaza(786, 0, 614, 484); plaza(0, 656, 614, 444);
      // park
      g.fillStyle(0x8cc97e).fillRect(786, 656, 614, 444);
      g.fillStyle(0x76b768);
      const rng = new Phaser.Math.RandomDataGenerator(['park']);
      for (let i = 0; i < 160; i++) g.fillRect(rng.between(790, 1395), rng.between(660, 1095), 3, 7);
      g.fillStyle(0xd9c9a8).fillRect(786, 860, 614, 40).fillRect(1070, 656, 40, 444).fillCircle(1090, 880, 96);
      // roads
      g.fillStyle(0x4a4655).fillRect(0, 520, 1400, 100).fillRect(650, 0, 100, 1100);
      g.lineStyle(3, 0x1b1325);
      g.lineBetween(0, 520, 650, 520).lineBetween(750, 520, 1400, 520).lineBetween(0, 620, 650, 620).lineBetween(750, 620, 1400, 620);
      g.lineBetween(650, 0, 650, 520).lineBetween(750, 0, 750, 520).lineBetween(650, 620, 650, 1100).lineBetween(750, 620, 750, 1100);
      g.fillStyle(0xffc23c);
      for (let x = 10; x < 1400; x += 50) if (x < 610 || x > 770) g.fillRect(x, 568, 26, 4);
      for (let y = 10; y < 1100; y += 50) if (y < 480 || y > 640) g.fillRect(698, y, 4, 26);
      g.fillStyle(0xf4f1f7);
      for (let y = 528; y < 614; y += 14) { g.fillRect(608, y, 34, 7); g.fillRect(758, y, 34, 7); }
      for (let x = 658; x < 744; x += 14) { g.fillRect(x, 478, 7, 34); g.fillRect(x, 628, 7, 34); }
      g.fillStyle(0x3a3646).fillCircle(560, 600, 12).fillCircle(700, 300, 12);
    },
    props: [
      { key: 'apt', x: 300, y: 470 }, { key: 'gym', x: 1060, y: 470 }, { key: 'cafe', x: 300, y: 912 },
      { key: 'tree', x: 70, y: 400 }, { key: 'tree', x: 540, y: 400 }, { key: 'tree', x: 60, y: 230 }, { key: 'tree', x: 560, y: 220 },
      { key: 'tree', x: 850, y: 330 }, { key: 'tree', x: 1320, y: 380 }, { key: 'tree', x: 1340, y: 200 },
      { key: 'tree', x: 80, y: 830 }, { key: 'tree', x: 530, y: 830 },
      { key: 'tree', x: 870, y: 750 }, { key: 'tree', x: 1320, y: 760 }, { key: 'tree', x: 880, y: 1060 }, { key: 'tree', x: 1320, y: 1060 },
      { key: 'lamp', x: 140, y: 508 }, { key: 'lamp', x: 460, y: 508 }, { key: 'lamp', x: 960, y: 508 }, { key: 'lamp', x: 1240, y: 508 },
      { key: 'lamp', x: 140, y: 652 }, { key: 'lamp', x: 460, y: 652 }, { key: 'lamp', x: 960, y: 652 }, { key: 'lamp', x: 1240, y: 652 },
      { key: 'lamp', x: 632, y: 300 }, { key: 'lamp', x: 770, y: 840 },
      { key: 'busstop', x: 880, y: 514 }, { key: 'scooter', x: 470, y: 484 }, { key: 'bin', x: 560, y: 500 }, { key: 'bin', x: 1150, y: 500 },
      { key: 'bench', x: 160, y: 1010 }, { key: 'bench', x: 440, y: 1010 }, { key: 'plant', x: 200, y: 930 }, { key: 'plant', x: 400, y: 930 },
      { key: 'fountain', x: 1090, y: 906 }, { key: 'bench', x: 990, y: 990 }, { key: 'bench', x: 1190, y: 990 },
      { key: 'bush', x: 960, y: 720 }, { key: 'bush', x: 1220, y: 720 }, { key: 'bush', x: 1000, y: 1080 }, { key: 'bush', x: 1180, y: 1080 },
      { key: 'barricade', x: 1340, y: 560 }, { key: 'barricade', x: 1340, y: 612 },
      { key: 'barricade', x: 60, y: 560 }, { key: 'barricade', x: 60, y: 612 },
      { key: 'barricade', x: 700, y: 60 }, { key: 'barricade', x: 700, y: 1090 }
    ],
    blocks: [[1290, 520, 110, 100], [0, 520, 110, 100], [650, 0, 100, 64], [650, 1050, 100, 50]],
    spawns: { apt: [300, 502], gym: [1060, 502], cafe: [300, 944], east: [1250, 575] },
    spots: [
      door(300, 478, 'room', 'door', 'Go in'),
      door(1060, 478, 'gym', 'door', 'Enter'),
      door(300, 920, 'cafe', 'door', 'Enter'),
      { x: 1280, y: 570, r: 80, label: 'Look', run: async w => { if (f('fed')) await chapterEnd(w); else await w.say(['Road closed.', 'Who even put this here?']); } },
      look(110, 570, 80, ['Also closed.']),
      look(700, 104, 60, ['This one too. Suspicious.']),
      look(700, 1030, 60, ['Closed. Every road out of town is closed.']),
      look(880, 532, 54, ["Bus stop. The sign says the next bus is 'Delayed'.", 'It always says that.']),
      look(470, 500, 44, ["Someone's scooter. The keys are still in it.", "Mohit doesn't take it. He's not like that."]),
      look(1090, 930, 74, ['The fountain is dry. Someone left a one-rupee coin in it.']),
      look(990, 1006, 44, ['A bench. Nobody to share it with.'])
    ],
    setup(w) {
      // a plastic bag tumbles across the empty road now and then
      const bag = w.add.image(-40, 560, 'prop-plasticbag').setScale(1 / RES).setDepth(600);
      const roll = () => {
        bag.setPosition(-40, Phaser.Math.Between(540, 600));
        w.tweens.add({
          targets: bag, x: 1440, angle: 720, duration: 9000, ease: 'Linear',
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
      state.set('cityIntro');
      ui.objective(objectiveText());
    }
  },

  gym: {
    w: 520, h: 400, wall: 120, ambient: 'gym',
    draw(g) {
      backWall(g, 520, 122, 0x5f6c7e, 0x3f4a5a);
      g.fillStyle(0xbcd7f0).fillRect(130, 20, 260, 80);
      g.lineStyle(3, 0x1b1325).strokeRect(130, 20, 260, 80);
      g.lineStyle(4, 0xffffff, 0.45).lineBetween(150, 90, 190, 30).lineBetween(280, 90, 310, 44);
      g.fillStyle(0x3a3f4c).fillRect(0, 122, 520, 278);
      g.lineStyle(1, 0x454b5a);
      for (let x = 0; x < 520; x += 40) g.lineBetween(x, 122, x, 400);
      for (let y = 122; y < 400; y += 40) g.lineBetween(0, y, 520, y);
      g.fillStyle(0xff8fb6).fillRoundedRect(60, 280, 100, 40, 6);
      g.fillStyle(0x36dcae).fillRoundedRect(60, 330, 100, 40, 6);
      mat(g, 260, 386);
    },
    props: [
      { key: 'speaker', x: 40, y: 134 }, { key: 'treadmill', x: 130, y: 180 }, { key: 'treadmill', x: 245, y: 180 },
      { key: 'rack', x: 395, y: 154 }, { key: 'cooler', x: 494, y: 156 }, { key: 'benchpress', x: 400, y: 312 }
    ],
    spawns: { door: [260, 370] },
    spots: [
      look(185, 200, 76, ['A treadmill. Mohit stares at it.', 'It stares back. Neither of them moves.']),
      look(395, 172, 52, ['Mohit lifts a dumbbell.', 'Then puts it back. Respectfully.']),
      look(40, 152, 40, ['The gym playlist is still going.', 'Honestly, kind of a banger.']),
      look(494, 172, 36, ['Free water. At least something still works.']),
      look(400, 330, 56, ["Nobody's spotting anybody today."]),
      door(260, 392, 'city', 'gym', 'Go out')
    ],
    async enter(w) {
      if (f('gym')) return;
      await w.wait(300);
      await w.say(['The gym is empty.', 'The music is still playing. To nobody.']);
      state.set('gym');
      ui.objective(objectiveText());
    }
  },

  cafe: {
    w: 540, h: 420, wall: 122, ambient: 'hum',
    draw(g) {
      backWall(g, 540, 124, 0xf0dcc0, 0xc98a5a);
      g.fillStyle(0xc98a5a).fillRect(0, 84, 540, 30);
      g.lineStyle(3, 0x1b1325).lineBetween(0, 84, 540, 84);
      checker(g, 0, 124, 540, 296, 0xe9d8c0, 0xd6c0a2, 30);
      mat(g, 270, 406);
    },
    props: [
      { key: 'menuboard', x: 260, y: 78, wall: true }, { key: 'kdoor', x: 460, y: 124, wall: true },
      { key: 'counter', x: 130, y: 204 },
      { key: 'table', x: 300, y: 272 }, { key: 'table', x: 440, y: 334 }, { key: 'table', x: 170, y: 352 },
      { key: 'plant', x: 26, y: 176 }, { key: 'plant', x: 520, y: 182 }
    ],
    spawns: { door: [270, 392], kitchen: [460, 162] },
    spots: [
      look(130, 222, 74, ['Fresh buns under the glass. Nobody is watching them.', 'Mohit is not that kind of person either.']),
      look(300, 290, 54, ['A half-finished cup of chai.', "It's still a little warm..."]),
      look(440, 352, 54, ['Someone left a crossword half done. 7 down: "LONELY". Mohit puts the pen down.']),
      door(460, 146, 'kitchen', 'door', 'Open', async w => {
        if (f('cafe')) return true;
        await w.say(['STAFF ONLY.', 'Mohit is not staff.']);
        return false;
      }),
      door(270, 412, 'city', 'cafe', 'Go out')
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
    w: 480, h: 390, wall: 110, ambient: 'drone', poiAllowed: true,
    draw(g) {
      g.fillStyle(0xdfe8ef).fillRect(0, 0, 480, 112);
      g.lineStyle(1, 0xc4d0da);
      for (let x = 0; x < 480; x += 22) g.lineBetween(x, 0, x, 102);
      for (let y = 0; y < 102; y += 22) g.lineBetween(0, y, 480, y);
      g.fillStyle(0x9b98a8).fillRect(0, 102, 480, 10);
      g.lineStyle(3, 0x1b1325).lineBetween(0, 102, 480, 102).lineBetween(0, 112, 480, 112);
      checker(g, 0, 112, 480, 278, 0x5a5068, 0x3a3346, 32);
      mat(g, 240, 376);
    },
    props: [
      { key: 'fridge', x: 48, y: 152 }, { key: 'stove', x: 160, y: 142 }, { key: 'sink', x: 292, y: 142 },
      { key: 'shelf', x: 420, y: 152 }, { key: 'crates', x: 440, y: 336 }
    ],
    spawns: { door: [240, 362] },
    spots: [
      { x: 48, y: 168, r: 44, label: 'Look', run: w => w.say(f('fed') ? 'The fridge. Mohit closes it before PoiPoi gets ideas.' : 'The fridge is open a crack. Something has been in here.') },
      look(420, 170, 54, ['Shelves of atta and dal. One sack is missing.']),
      door(240, 382, 'cafe', 'kitchen', 'Go out', async w => {
        if (!f('metPoi') || f('fed')) return true;
        await w.say(M("I can't just leave him hungry."));
        return false;
      })
    ],
    setup(w) {
      if (!f('metPoi')) kitchenBag(w);
      else {
        w.prop('bagdown', 392, 252, false).setDepth(252);
        sfx.ambient('hum');
        if (!f('fed')) { const poi = w.addPoi(250, 226); w.followPaused = true; poi.sprite.play('p-loaf'); }
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
