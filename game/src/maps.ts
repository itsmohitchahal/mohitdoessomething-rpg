// Chapter 1 maps and story beats. World units: one 16px tile = 48 units (art is drawn at 3x).
import Phaser from 'phaser';
import type { World } from './scenes/World';
import { state, MAX_HP, type MapName } from './state';
import { ui, hi } from './ui';
import { sfx } from './audio';
import { type Px, INK } from './px/paint';
import { ART } from './px/scale';
import { runWorkout } from './workout';
import { crawlOut } from './roamers';

type Ambient = 'wind' | 'drone' | 'gym' | 'hum' | null;
const T = 48;
const MAT = '#b5743f';

export interface Spot {
  x: number; y: number; r: number;
  label: string;
  name?: string;   // what PoiPoi gets distracted by here
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
  cart?: () => boolean;                               // Mohit is pushing the shopping trolley here
  poiSpots?: PoiSpot[];                               // things PoiPoi wanders between when he's at home
  roam?: [number, number, number, number][];         // where monsters wander once it rains: x, y, w, h
  walks?: [number, number][][];                       // routes townspeople take, from one edge of the map to another
}

export interface PoiSpot { x: number; y: number; act: 'box' | 'bat' | 'scratch' | 'piano' | 'guitar' | 'laptop' | 'nap' | 'window'; toy?: string; depth?: number }

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
  if (!f('workout')) return 'Get the perfect workout at the gym';
  if (!f('mart')) return f('mFood') && f('mToys') ? 'Check out at the till' : f('cart') ? 'Get cat food and cat toys' : 'Raid the supermarket';
  if (!f('home')) return 'Take everything home';
  if (!f('explore')) return 'Hang out with PoiPoi';
  if (!f('park')) return "Let's explore this city!";
  return 'Explore the city with PoiPoi';
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
const look = (x: number, y: number, r: number, lines: Parameters<World['say']>[0], name?: string): Spot =>
  ({ x, y, r, label: 'Look', name, run: async w => { await w.say(lines); } });

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
const gymLook = (x: number, y: number, r: number, lines: Parameters<World['say']>[0], name: string): Spot => ({
  x, y, r, label: 'Look', name,
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
  await w.wait(500);
  await w.say(['Mohit sits down on the kitchen floor next to PoiPoi.', 'It is very quiet.', 'No traffic. No group chat. Nobody asking him what his "plan" is.']);
  await w.say(M('...Wait.'));
  await w.say([M('No people in this world?'), M('AND I have a cat now?')]);
  sfx.sparkle(); w.emote(p, '!', '#ffc23c');
  await w.wait(300);
  await w.say(M('This is THE life.'));
  state.set('fed');
  w.recolor();
  await solitudeUp('Mohit seems more accepting of this new world of solitude.', 10);
  await w.say([M('You know what this means, PoiPoi?'), M('An empty gym. Nobody watching.'), M("I can finally try the weird exercises I've been too shy to do in front of people.")]);
  w.followPaused = false;
  w.trail = [{ x: s.x, y: s.y }, { x: p.x, y: p.y }];
  ui.objective(objectiveText());
  ui.toast('PoiPoi follows you around now. Mostly.', 2600);
}

async function solitudeUp(text: string, n: number) {
  state.addStat('solitude', n);
  await ui.statUp(text, n, state.stat('solitude') ?? n);
}

/* ---------- gym, round two ---------- */
async function workoutTime(w: World) {
  await w.wait(300);
  await w.say([M('An empty gym.'), M('Nobody watching. Nobody judging.')]);
  if (w.poi) w.emote(w.poi.sprite, '?', '#ffffff', 60);
  await w.say(M('PoiPoi. Today we do the weird ones.'));
  sfx.stinger(); w.shake(300, 0.008); w.flash(200);
  await ui.banner('WORKOUT TIME!', 'workout', 1300);
  await runWorkout();
  state.set('workout');
  w.recolor();
  ui.objective(objectiveText());
  await w.say([M('Okay. Now I am starving.'), M("There's a supermarket past the café. And nobody at the till.")]);
  ui.toast('The supermarket is south of the café.<small>Follow the arrow.</small>', 4200);
}

/* ---------- the supermarket ---------- */
const ITEMS = ['mSnack', 'mCoke', 'mGpu', 'mRam', 'mFood', 'mToys'];
export const cartLevel = () => { const n = ITEMS.filter(f).length; return n === 0 ? 0 : n <= 2 ? 1 : n <= 4 ? 2 : 3; };
const PFFT = `<b>"Pfft. If you're shopping here, you probably can't buy this!"</b>`;

function grab(flag: string, first: Parameters<World['say']>[0], again: Parameters<World['say']>[0], name: string, after?: (w: World) => Promise<void>): Spot {
  return {
    x: 0, y: 0, r: 0, label: 'Take', name,
    run: async w => {
      if (f(flag)) { await w.say(again); return; }
      await w.say(first);
      state.set(flag);
      sfx.rustle(); w.emote(w.player, '+1', '#7ef0a0');
      await after?.(w);
      ui.objective(objectiveText());
    }
  };
}
const at = (x: number, y: number, r: number, s: Spot): Spot => ({ ...s, x, y, r });

async function checkout(w: World) {
  if (f('mart')) { await w.say(['The till is still unattended.', 'The note is still there.']); return; }
  if (!f('mFood') || !f('mToys')) { await w.say(M("Not yet. PoiPoi's stuff first.")); return; }
  await w.say(['Nobody at the till.', 'Mohit scans everything himself anyway.', '*beep* *beep* *beep* *beep*']);
  await w.say(f('mGpu') || f('mRam') ? 'TOTAL: ₹3,48,612.' : 'TOTAL: ₹4,286.');
  await w.say(['Mohit checks his pockets.', '₹500, and a Metro card with -₹20 on it.']);
  await w.say(['He leaves the ₹500 on the counter, with a note:', '<b>"Will pay the rest later. —Mohit (44 followers)"</b>']);
  state.set('mart');
  sfx.sparkle();
  w.recolor();
  ui.objective(objectiveText());
  await w.say(M("Okay, PoiPoi. Let's go home."));
}

/* ---------- home ---------- */
const HOME_TOYS: [string, number, number, boolean][] = [
  ['gpubox', 160, 330, false], ['scratcher', 448, 280, false], ['foodstack', 384, 256, false],
  ['yarn', 270, 398, true], ['wand', 350, 344, true], ['toymouse', 118, 402, true]
];
function placeToy(w: World, key: string, x: number, y: number, floor: boolean) {
  const img = w.prop(key, x, y, false, floor);
  if (floor) img.setDepth(y - 30);
  w.extra['toy-' + key] = img;
  if (key === 'gpubox') w.extra.boxFront = w.add.image(x, y, 'pix-gpuboxFront').setOrigin(0.5, 1).setScale(ART).setDepth(y + 3);
  return img;
}

async function homeTime(w: World) {
  const poi = w.poi;
  w.followPaused = true;
  await w.wait(400);
  await w.say(['Home.', 'Mohit parks the trolley by the bed. It barely fit through the door.']);
  w.dropCart();
  await w.say(M('Okay, PoiPoi. Unboxing time.'));
  for (const [key, x, y, floor] of HOME_TOYS) {
    const img = placeToy(w, key, x, y, floor);
    img.setScale(0); w.tweens.add({ targets: [img, key === 'gpubox' ? w.extra.boxFront : img], scale: ART, duration: 260, ease: 'Back.easeOut' });
    sfx.sparkle();
    await w.wait(280);
  }
  HOME_COKES.forEach(([x, y], i) => { w.extra['coke' + i] = w.prop('coke', x, y); });
  sfx.sparkle();
  await w.say(['A scratching post. A feather wand. A ball of yarn. A toy mouse.', 'Eleven kinds of cat food. And what is left of the Coke Zero crate.']);
  await w.say(M('Go on. Pick one.'));
  if (poi) {
    const s = poi.sprite;
    await w.walk(s, 270, 392, 90);
    await w.wait(300);
    await w.walk(s, 350, 340, 90);
    await w.wait(300);
    await w.walk(s, 160, 322, 90);
    s.setDepth(332).play('p-loaf');
    poi.depth = 332;
    sfx.meow(true); w.float(s.x, s.y - 50, 'pix-heart', 1.2);
    await w.say(['PoiPoi walks past every single toy...', '...and climbs into the empty GPU box.']);
    await w.say([M('...'), M('Of course.')]);
    await w.wait(500);
    poi.depth = null;
    await w.walk(s, 262, 396, 110);
    for (let i = 0; i < 3; i++) {
      sfx.rustle();
      const yarn = w.extra['toy-yarn'] as Phaser.GameObjects.Image;
      w.tweens.add({ targets: yarn, x: yarn.x + Phaser.Math.Between(-14, 14), duration: 200, ease: 'Quad.easeOut' });
      await w.tween({ targets: s, y: s.y - 14, duration: 150, yoyo: true, ease: 'Quad.easeOut' });
    }
    s.play('p-idle');
  }
  await w.say(['A few minutes later he finds the yarn.', 'Then the feather wand. Then the yarn again.']);
  await w.say(['Mohit sits on the floor and watches him play.', 'The room feels a lot less quiet now.']);
  state.set('home');
  w.recolor();
  ui.objective(objectiveText());
  sfx.sparkle();
  await w.wait(600);
  await w.say('So far, Mohit is happy.');
  await solitudeUp('Mohit is starting to feel at home in this quiet new world.', 10);
  w.followPaused = false;
  if (poi) poi.goHome(MAPS.room.poiSpots!);
  await exploreTime(w);
}

/* ---------- next quest: the whole town ---------- */
async function exploreTime(w: World) {
  await w.wait(400);
  await w.say([M('You know what, PoiPoi?'), M('There are no people around.'), M('This whole town is ours!')]);
  state.set('explore');
  sfx.fanfare();
  await ui.banner("LET'S EXPLORE THIS CITY!", 'join', 1800);
  if (!state.bottles) {
    await w.say(['At the bottom of the trolley: five empty Coke Zero bottles.', 'Mohit drank them on the walk home. He keeps them. You never know.']);
    state.bottles = 5;
    state.save();
    ui.toast('Empty Coke Zero bottles: 5<small>Drink more Coke Zero to get more empties.</small>', 3800);
  }
  ui.objective(objectiveText());
  await w.say(M("Let's start with the park. I haven't been on a swing in years."));
}

/** A cold Coke Zero: drunk on the spot, and the empty bottle goes in Mohit's pocket. */
async function drink(w: World, lines: Parameters<World['say']>[0]) {
  await w.say(lines);
  for (let i = 0; i < 3; i++) { sfx.nom(); await w.wait(160); }
  state.bottles++;
  state.save();
  w.emote(w.player, '+1', '#7ef0a0');
  ui.toast(`Empty Coke Zero bottles: ${state.bottles}`, 2200);
}
const HOME_COKES: [number, number][] = [[140, 254], [476, 258], [262, 300]];
function homeCoke(i: number): Spot {
  const [x, y] = HOME_COKES[i];
  return {
    x, y, r: 36, label: 'Drink', name: 'the Coke Zero',
    when: () => f('home') && !f('coke' + i),
    run: async w => {
      await drink(w, ['A Coke Zero from the crate. Still a little cold.', 'Mohit drinks it in one go. *tssss*']);
      state.set('coke' + i);
      const img = w.extra['coke' + i] as Phaser.GameObjects.Image | undefined;
      img?.destroy();
    }
  };
}

/* ---------- the park swing ---------- */
const SW = { x: 950, y: 1300 };
const PIVOT = SW.y - 43 * ART, CHAIN = 26 * ART;

function swingRest(w: World) {
  w.extra.swingChain = w.add.image(SW.x, PIVOT, 'pix-swingchain').setOrigin(0.5, 0).setScale(ART).setDepth(SW.y + 2);
  w.extra.swingSeat = w.add.image(SW.x, PIVOT + CHAIN, 'pix-swingseat').setOrigin(0.5, 0.2).setScale(ART).setDepth(SW.y + 3);
}

/** Mohit on the swing. The swing moves towards and away from the camera; amp is how high it goes. */
function swingRig(w: World) {
  const chain = w.extra.swingChain as Phaser.GameObjects.Image, seat = w.extra.swingSeat as Phaser.GameObjects.Image;
  const rider = w.add.sprite(SW.x, PIVOT + CHAIN + 20, 'mohit', 'sit').setOrigin(0.5, 0.985).setScale(ART).setDepth(SW.y + 4);
  const rig = { amp: 0, t: 0, last: 0 };
  const place = (th: number) => {
    const k = 1 + 0.12 * Math.sin(th);
    const y = PIVOT + CHAIN * Math.cos(th) + CHAIN * 0.55 * Math.sin(th);
    chain.setScale(ART * k, ART * ((y - PIVOT) / CHAIN));
    seat.setPosition(SW.x, y).setScale(ART * k);
    rider.setPosition(SW.x, y + 20 * k).setScale(ART * k);
  };
  const ev = w.time.addEvent({
    delay: 16, loop: true, callback: () => {
      rig.t += 0.016;
      const s = Math.sin((rig.t * 2 * Math.PI) / 1.7), th = rig.amp * s;
      place(th);
      if (rider.frame.name !== 'sitO') rider.setFrame(s > 0.6 && rig.amp > 0.4 ? 'sitHappy' : 'sit');
      if (Math.sign(s) !== Math.sign(rig.last) && rig.amp > 0.2) sfx.whoosh();
      rig.last = s;
    }
  });
  const to = (amp: number, ms: number) => w.tween({ targets: rig, amp, duration: ms, ease: 'Sine.easeInOut' });
  const off = () => { ev.remove(); place(0); rider.destroy(); };
  return { rider, to, off };
}

async function parkSwing(w: World) {
  const p = w.player, poi = w.poi;
  if (poi?.distracted) { await w.say(M("Wait. Where's PoiPoi? He has to see this.")); return; }
  w.followPaused = true;
  await w.walk(p, SW.x, SW.y + 6);
  p.setVisible(false);
  const rig = swingRig(w);
  if (poi) { await w.walk(poi.sprite, SW.x - 90, SW.y + 40, 120); poi.sprite.setFlipX(false).play('p-loaf'); }

  if (f('park')) {
    await rig.to(0.8, 1500);
    await w.say(Phaser.Utils.Array.GetRandom([[M('Wheeeee.')], ['Back and forth. Back and forth.', "PoiPoi's head follows the swing every single time."], [M('Still got it.')]]));
    await rig.to(0, 1600);
  } else {
    await w.say(['Mohit sits on the swing.', 'It creaks.']);
    rig.to(0.45, 2200);
    await w.say(M("I haven't been on a swing since I was twelve."));
    rig.to(0.85, 2500);
    await w.say(['Higher.', 'Higher!']);
    if (poi) w.emote(poi.sprite, '?', '#ffffff', 60);
    await w.say(['PoiPoi watches the swing go back and forth. Back and forth.', 'His head follows it every single time.']);
    await w.say(M('Wheeeeeee.'));
    await w.wait(1800);
    sfx.thud(); w.shake(500, 0.01);
    w.emote({ x: SW.x + 210, y: SW.y + 40 }, '*CRUNCH*', '#ffffff', 40);
    await rig.to(0, 1400);
    rig.rider.setFrame('sitO');
    await w.say(['A sound. From under the ground.', '*crrrkk... crrrrrkkk...*']);
    await w.say(M('...What was that?'));
    const mon = w.add.sprite(SW.x + 210, SW.y + 40, 'mon-bag', 'a').setOrigin(0.5, 0.95).setScale(ART).setDepth(SW.y + 40);
    mon.play('mon-bag');
    sfx.stinger();
    await crawlOut(w, mon);
    w.emote({ x: SW.x, y: SW.y - 60 }, '!', '#ff4f8b', 40);
    await w.say(['Something crawls out of the ground.', 'It looks like a plastic bag. A plastic bag with a face.']);
    rig.off();
    p.setVisible(true).setPosition(SW.x, SW.y + 6);
    p.setFlipX(false); w.face(1, 0); p.play(w.animFor(false));
    await w.say([M('Oh no. Oh no no no.'), M('PoiPoi, stay behind me.')]);
    if (poi) {
      await w.walk(poi.sprite, SW.x + 80, SW.y + 30, 140);
      poi.sprite.play('p-idle');
      await w.say('PoiPoi does not stay behind him.');
    }
    w.tweens.add({ targets: mon, alpha: 0.7, yoyo: true, repeat: -1, duration: 400 });
    sfx.stinger(); w.shake(420, 0.012); w.flash(220);
    await ui.banner('CONFRONTATION!', 'danger', 1300);
    const r = await w.battle('bag', 'park');
    w.tweens.killTweensOf(mon);
    w.tweens.add({ targets: mon, alpha: 0, duration: 500, onComplete: () => mon.destroy() });
    await w.wait(500);
    await w.say(r === 'friend'
      ? [M('...It floated away.'), M('Did PoiPoi just make a friend? Out of THAT?')]
      : [M('...Did I just beat up a plastic bag?'), M('In a park?')]);
    await w.say([M('So the town is not completely empty.'), M('Okay. Not ALL ours.'), M('Mostly ours.')]);
    state.set('park');
    w.recolor();
    ui.objective(objectiveText());
    ui.toast("Mohit's HP carries over from fight to fight.<small>PoiPoi's grooming helps. So does a nap in bed at home.</small>", 5200);
  }
  rig.off();
  p.setVisible(true).setPosition(SW.x, SW.y + 6);
  p.play(w.animFor(false));
  if (poi) { w.trail = [{ x: poi.sprite.x, y: poi.sprite.y }, { x: p.x, y: p.y }]; poi.sprite.play('p-idle'); }
  w.followPaused = false;
}


/* ---------- city layout ---------- */
function cityTiles(): string[] {
  const rows: string[] = [];
  for (let y = 0; y < 31; y++) {
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
    cart: () => f('mart') && !f('home'),
    poiSpots: [
      { x: 160, y: 322, act: 'box', depth: 332 }, { x: 262, y: 396, act: 'bat', toy: 'yarn' }, { x: 340, y: 348, act: 'bat', toy: 'wand' },
      { x: 128, y: 404, act: 'bat', toy: 'toymouse' }, { x: 430, y: 290, act: 'scratch' }, { x: 330, y: 166, act: 'piano', depth: 200 },
      { x: 222, y: 198, act: 'guitar' }, { x: 84, y: 156, act: 'laptop', depth: 200 }, { x: 410, y: 360, act: 'nap', depth: 440 },
      { x: 56, y: 404, act: 'nap', depth: 420 }, { x: 270, y: 164, act: 'window' }, { x: 46, y: 314, act: 'nap', depth: 320 }
    ],
    setup(w) {
      if (!f('home')) return;
      for (const [key, x, y, floor] of HOME_TOYS) placeToy(w, key, x, y, floor);
      HOME_COKES.forEach(([x, y], i) => { if (!f('coke' + i)) w.extra['coke' + i] = w.prop('coke', x, y); });
    },
    spots: [
      look(64, 198, 58, ["Mohit's laptop. Instagram is still open.", '44 followers. Still 44.'], "Mohit's laptop"),
      { x: 330, y: 198, r: 60, label: 'Play', name: 'the piano keys', run: async w => { sfx.piano(); await w.wait(300); await w.say('Mohit plays a few notes. It sounds nice, actually.'); } },
      { x: 222, y: 190, r: 38, label: 'Strum', name: 'the guitar strings', run: async w => { sfx.strum(); await w.say('Mohit strums the guitar once. Slightly out of tune. Like always.'); } },
      {
        x: 390, y: 330, r: 90, label: 'Look', name: 'the bed',
        run: async w => {
          if (!f('park') || state.hp >= MAX_HP) { await w.say(['Mohit could go back to sleep...', '...but the silence is too loud.']); return; }
          await w.say(['Mohit flops onto the bed for a quick nap.', '...', 'PoiPoi naps on his face.']);
          state.hp = MAX_HP;
          state.save();
          sfx.sparkle(); w.emote(w.player, `HP ${MAX_HP}`, '#7ef0a0');
          await w.say('Mohit wakes up feeling much better. HP fully restored.');
        }
      },
      homeCoke(0), homeCoke(1), homeCoke(2),
      look(270, 160, 40, ['The street outside is completely empty.'], "a pigeon outside the window"),
      look(372, 156, 34, ['A poster of The Ink Spots. 1939.', "Mohit's favourite song is still stuck in his head."], "the poster"),
      look(46, 410, 50, ['A pile of laundry. Clean or dirty?', "It's been there long enough that nobody knows."], "the laundry pile"),
      look(46, 318, 44, ['The beanbag still has a Mohit-shaped dent in it.'], "the beanbag"),
      door(240, 424, 'city', 'apt', 'Go out')
    ],
    async enter(w) {
      if (f('woke')) {
        if (f('mart') && !f('home')) await homeTime(w);
        else if (f('home') && !f('explore')) await exploreTime(w);
        return;
      }
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
      for (let y = 2; y < 496; y += 10) if (y < 144 || y > 240) p.r(255, y, 2, 5, '#f2d36b');
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
      { key: 'barricade', x: 768, y: 70 }, { key: 'barricade', x: 768, y: 1482 },
      { key: 'mart', x: 330, y: 1390 }, { key: 'bin', x: 590, y: 1420 },
      { key: 'neem', x: 620, y: 1300 }, { key: 'neem', x: 1090, y: 1440 }, { key: 'swing', x: SW.x, y: SW.y }, { key: 'neem', x: 1430, y: 1420 }, { key: 'bush', x: 1250, y: 1290 }, { key: 'bench', x: 1290, y: 1420 }
    ],
    blocks: [[1450, 528, 86, 96], [0, 528, 86, 96], [720, 0, 96, 64], [720, 1436, 96, 52], [SW.x - 72, SW.y - 12, 36, 12], [SW.x + 36, SW.y - 12, 36, 12]],
    spawns: { apt: [336, 508], gym: [1056, 508], cafe: [336, 990], east: [1400, 576], mart: [330, 1430] },
    cart: () => f('mart') && !f('home'),
    roam: [[110, 505, 1320, 150], [684, 90, 164, 1320], [890, 740, 590, 700], [100, 690, 440, 90]],
    walks: [
      [[-40, 516], [1576, 516]], [[-40, 662], [1576, 662]],
      [[696, -40], [696, 1530]], [[842, -40], [842, 1530]],
      [[1576, 888], [842, 888], [842, 1530]], [[1176, 1530], [1176, 662], [1576, 662]]
    ],
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
      look(1420, 576, 80, ['Road closed.', 'Who even put this here?'], 'the barricade'),
      look(120, 576, 80, ['Also closed.'], "the barricade"),
      look(768, 110, 60, ['This one too. Suspicious.'], "the barricade"),
      look(768, 1426, 60, ['Closed. Every road out of town is closed.'], "the barricade"),
      door(330, 1400, 'mart', 'door', 'Enter', async w => {
        if (f('workout')) return true;
        await w.say(['BHATIA SUPER MART. Open 24 hours.', 'Mohit waves at the door sensor. Nothing happens.']);
        await w.say(M('...Gym first, apparently.'));
        return false;
      }),
      look(1250, 540, 54, ["Bus stop. The board says the next bus is 'Delayed'.", 'It always says that.'], "the bus stop bench"),
      look(470, 640, 50, ['An auto, parked with the meter still down.', 'No driver. No "Bhaiya, chaloge?" Nothing.'], "the auto's back seat"),
      look(920, 790, 56, ['The chai tapri. The kettle is still warm.', 'Ten rupees a cup, and nobody to sell it.'], "the chai tapri"),
      look(600, 780, 44, ['The milk booth. The crates are full.'], "the milk crates"),
      look(1310, 778, 40, ['Gully cricket stumps. Someone was batting.', 'They left mid-over.'], "the cricket stumps"),
      look(1384, 500, 60, ["Every shutter is down. Even Sharma ji's, and he never closes."], "Sharma ji's shutter"),
      { x: SW.x, y: SW.y + 10, r: 60, label: 'Look', name: 'the swing', when: () => !f('explore'), run: w => w.say(['A swing. Red paint, peeling.', "Mohit hasn't been on one since he was twelve."]) },
      { x: SW.x, y: SW.y + 10, r: 60, label: 'Swing', name: 'the swing', when: () => f('explore'), run: parkSwing }
    ],
    target: () => !f('cityIntro') ? null
      : !f('gymSearched') ? [1056, 400]
      : !f('cafe') ? [336, 880]
      : !f('fed') ? null
      : !f('workout') ? [1056, 400]
      : !f('mart') ? [330, 1300]
      : !f('home') ? [336, 400]
      : f('explore') && !f('park') ? [SW.x, SW.y - 150] : null,
    setup(w) {
      swingRest(w);
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
      if (f('home') && !f('explore')) { await exploreTime(w); return; }
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
      gymLook(190, 172, 80, ['A treadmill. Mohit stares at it.', 'It stares back. Neither of them moves.'], "the treadmill belt"),
      gymLook(420, 162, 56, ['Mohit lifts a dumbbell.', 'Then puts it back. Respectfully.'], "the dumbbells"),
      gymLook(40, 146, 44, ['The gym playlist is still going.', 'Honestly, kind of a banger.'], "the speaker"),
      gymLook(504, 160, 40, ['Free water. At least something still works.'], "the water cooler"),
      gymLook(420, 324, 60, ["Nobody's spotting anybody today."], "the bench"),
      door(264, 372, 'city', 'gym', 'Go out')
    ],
    async enter(w) {
      if (f('gym')) {
        if (f('fed') && !f('workout')) await workoutTime(w);
        return;
      }
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
      look(130, 212, 78, ['Fresh buns under the glass. Nobody is watching them.', 'Mohit is not that kind of person either.'], "the buns behind the glass"),
      look(300, 292, 56, ['A half-finished cup of chai.', "It's still a little warm..."], "the cup of chai"),
      look(440, 354, 56, ['Someone left a crossword half done. 7 down: "LONELY".', 'Mohit puts the pen down.'], "the crossword"),
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
      { x: 48, y: 146, r: 44, label: 'Look', name: 'the fridge', run: w => w.say(f('fed') ? 'The fridge. Mohit closes it before PoiPoi gets ideas.' : 'The fridge is open a crack. Something has been in here.') },
      look(420, 150, 54, ['Shelves of atta and dal. One sack is missing.'], "the atta sacks"),
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
  },

  mart: {
    tiles: ['VVVVVVVVVVVVV', 'VVVVVVVVVVVVV', ...Array.from({ length: 8 }, () => 'vvvvvvvvvvvvv')],
    wall: 92, indoor: true, ambient: 'hum',
    cart: () => f('cart'),
    hints: () => !f('mart'),
    target: () => !f('cart') ? null : !f('mFood') ? [312, 210] : !f('mToys') ? [474, 210] : !f('mart') ? [110, 330] : [312, 420],
    decorate(p) { p.r(92, 152, 24, 8, '#3f9a5a').box(91, 151, 26, 10, INK); },
    props: [
      { key: 'fridgeCoke', x: 60, y: 142 }, { key: 'fridgeCoke', x: 150, y: 142 }, { key: 'techcase', x: 500, y: 150 },
      { key: 'aisleSnack', x: 150, y: 290 }, { key: 'aisleCat', x: 312, y: 290 }, { key: 'aisleToys', x: 474, y: 290 },
      { key: 'checkout', x: 110, y: 420 }, { key: 'plant', x: 596, y: 430 }
    ],
    lights: [[160, 40, '#f4fbff', 150], [460, 40, '#f4fbff', 150]],
    spawns: { door: [312, 424] },
    spots: [
      at(150, 316, 56, grab('mSnack', ['Maggi. Six packets of Maggi.', 'And chips. And one more Maggi, for emergencies.'], 'The trolley has enough Maggi. (There is no such thing as enough Maggi.)', 'the chips')),
      { x: 105, y: 166, r: 70, label: 'Drink', name: 'the cold fridge', when: () => f('explore'), run: w => drink(w, Phaser.Utils.Array.GetRandom([
        ['Mohit takes a Coke Zero from the fridge.', '*tssss*', 'Gone in one go.'],
        ['Another Coke Zero.', M('Hydration.')],
        ['Mohit drinks a Coke Zero while staring at the GPU case.', 'Very relaxing.']
      ])) },
      { ...at(105, 166, 70, grab('mCoke', ['A whole fridge of Coke Zero.', M('Zero sugar. Zero people. Zero judgement.'), 'Mohit takes a crate.'], 'Still cold. Still zero.', 'the cold fridge')), when: () => !f('explore') },
      at(452, 172, 46, grab('mGpu', ['A glass case full of graphics cards.', 'The price tag says:', PFFT, M('Watch me.'), 'Mohit takes the biggest one. The box is bigger than PoiPoi.'], 'One is enough. Probably.', 'the GPU boxes')),
      at(552, 172, 46, grab('mRam', ['RAM sticks. 64 GB. With RGB lights.', 'Same price tag:', PFFT, M('Chrome is finally going to be happy.'), 'Into the trolley.'], 'The RGB is still blinking at him.', 'the blinking RAM')),
      at(312, 316, 56, grab('mFood', ['The cat food aisle.', 'Chicken. Tuna. Salmon pâté. Little pouches called "Gravy Lovers".', 'Mohit sweeps the whole shelf into the trolley.'], 'There is no cat food left on this shelf. It is all in the trolley.', 'the cat food', async w => {
        if (w.poi && !w.poi.distracted) { w.emote(w.poi.sprite, '♥', '#ff4f8b', 60); sfx.meow(true); }
      })),
      at(474, 316, 56, grab('mToys', ['Feather wands. Crinkle balls. A toy mouse. A scratching post.', M('He needs all of them.'), 'He does not need all of them.', 'Mohit takes all of them.'], 'The toy shelf is empty now.', 'the feather wands')),
      { x: 110, y: 444, r: 60, label: 'Pay', name: 'the till', run: checkout },
      door(312, 456, 'city', 'mart', 'Go out', async w => {
        if (f('mart') || !ITEMS.some(f)) return true;
        await w.say(M("I can't just walk out without paying. Even if nobody's here."));
        return false;
      })
    ],
    async enter(w) {
      if (f('cart')) return;
      await w.wait(300);
      await w.say(['The automatic doors slide open. *ding*', 'Nobody inside either.', 'The music is still on: an instrumental version of a song from 2009.']);
      await w.say(M('Okay. Trolley.'));
      state.set('cart');
      w.addCart();
      ui.objective(objectiveText());
    }
  }
};

export const mapSize = (m: MapDef) => ({ w: m.tiles[0].length * T, h: m.tiles.length * T });
