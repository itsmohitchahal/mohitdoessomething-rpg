// Things that move around outdoors once PoiPoi has joined: monsters that crawl out of the ground in the rain,
// and townspeople walking through. The two never notice each other.
import Phaser from 'phaser';
import type { World } from './scenes/World';
import { ART } from './px/scale';
import { MONSTERS, type Monster } from './px/monsters';
import { NPCS, type Npc } from './px/people';
import { state } from './state';
import { sfx } from './audio';

type Rect = [number, number, number, number];
type Pt = [number, number];

const MAX_MONSTERS = 6;
const MAX_PEOPLE = 5;
const ENCOUNTER = 54;   // closer than this and it's a fight
const NOTICE = 140;     // closer than this and it creeps towards Mohit
const EYE: Record<string, number> = { puddle: 0x7ef0ff, wire: 0xff4f5e, kulhad: 0xffb347, auto: 0xfff3a0, bag: 0xeceaf2, smog: 0xe6e05a };

interface Mon { def: Monster; s: Phaser.GameObjects.Sprite; glow: Phaser.GameObjects.Image; zone: Rect; tx: number; ty: number; wait: number; calm: number; up: boolean }
interface Walker { def: Npc; s: Phaser.GameObjects.Sprite; path: Pt[]; i: number; speed: number }

const inside = ([x, y, w, h]: Rect, px: number, py: number) => px >= x && px <= x + w && py >= y && py <= y + h;
const randIn = ([x, y, w, h]: Rect): Pt => [x + Math.random() * w, y + Math.random() * h];

/** The ground opens up and a monster sprite pushes its way out of it. */
export function crawlOut(w: World, s: Phaser.GameObjects.Sprite) {
  const x = s.x;
  s.setScale(ART, 0).setAlpha(0.6);
  const hole = w.add.ellipse(s.x, s.y - 2, 10, 4, 0x1b1622, 0.85).setDepth(s.y - 1);
  w.tweens.add({ targets: hole, width: 70, height: 20, duration: 500, ease: 'Quad.easeOut' });
  sfx.thud();
  for (let i = 0; i < 9; i++) {
    const c = w.add.image(s.x + Phaser.Math.Between(-20, 20), s.y - 4, 'dot').setScale(ART).setTint(0x5a4a3e).setDepth(s.y + 1);
    w.tweens.add({ targets: c, x: c.x + Phaser.Math.Between(-40, 40), y: c.y - Phaser.Math.Between(20, 50), duration: 380, yoyo: true, ease: 'Quad.easeOut', delay: 300 + i * 40, onComplete: () => c.destroy() });
  }
  return new Promise<void>(done => w.tweens.add({
    targets: s, scaleY: ART, alpha: 1, duration: 1400, delay: 450, ease: 'Back.easeOut',
    onUpdate: () => { s.x = x + Math.sin(w.time.now / 30) * 1.5; },
    onComplete: () => { s.x = x; w.tweens.add({ targets: hole, alpha: 0, duration: 1200, onComplete: () => hole.destroy() }); done(); }
  }));
}

export class Roamers {
  private mons: Mon[] = [];
  private people: Walker[] = [];
  private nextMon = 0;
  private nextPerson = 0;
  private grace: number;

  constructor(private w: World, private zones: Rect[], private paths: Pt[][]) {
    this.grace = w.time.now + 2500;
    // a few are already out when you arrive; the rest crawl up while you watch
    const first = state.flag('monsters') ? 4 : 0;
    for (let i = 0; i < first; i++) this.spawnMonster(false);
    for (let i = 0; i < 2; i++) this.spawnPerson(Math.random());
    this.nextMon = w.time.now + 2000;
    this.nextPerson = w.time.now + 3000;
    if (!state.flag('monsters')) w.time.delayedCall(900, () => this.intro());
  }

  /** First rain after PoiPoi joins: the ground opens up right in front of Mohit. */
  private intro() {
    const w = this.w;
    w.cutscene(async () => {
      await w.say(['It started raining.', 'The ground is... moving?']);
      const p = w.player;
      const zone = this.zones.find(z => inside(z, p.x + 150, p.y)) ?? this.zones[0];
      const x = Phaser.Math.Clamp(p.x + 150, zone[0], zone[0] + zone[2]), y = Phaser.Math.Clamp(p.y, zone[1], zone[1] + zone[3]);
      const m = this.spawnMonster(true, [x, y], MONSTERS[0]);
      await w.wait(1500);
      w.emote(w.player, '!', '#ff4f8b');
      await w.say([{ who: 'MOHIT', text: 'Nope. Nope nope nope.' }]);
      await w.say(['Things are crawling out of the ground all over town.', 'Get too close to one and it will fight you.']);
      if (w.poi && !w.poi.distracted) w.emote(w.poi.sprite, '?', '#ffffff', 70);
      await w.say(['PoiPoi does not seem scared at all.', 'He thinks they want to be friends.']);
      state.set('monsters');
      m.calm = w.time.now + 2500;
      this.grace = w.time.now + 1500;
    });
  }

  private spawnMonster(emerge: boolean, at?: Pt, def?: Monster): Mon {
    const w = this.w, p = w.player;
    let pt: Pt = at ?? [0, 0], zone = this.zones[0];
    if (!at) {
      for (let tries = 0; tries < 30; tries++) {
        zone = Phaser.Utils.Array.GetRandom(this.zones);
        pt = randIn(zone);
        const d = Phaser.Math.Distance.Between(p.x, p.y, pt[0], pt[1]);
        // crawl out close enough to be seen, but never on top of Mohit
        if (d > 230 && (!emerge || d < 520)) break;
      }
    } else zone = this.zones.find(z => inside(z, pt[0], pt[1])) ?? zone;
    const m = def ?? Phaser.Utils.Array.GetRandom(MONSTERS);
    const s = w.add.sprite(pt[0], pt[1], 'mon-' + m.id, 'a').setOrigin(0.5, 0.95).setScale(ART).setDepth(pt[1]);
    s.play({ key: 'mon-' + m.id, startFrame: Phaser.Math.Between(0, 1) });
    const glow = w.add.image(pt[0], pt[1] - 36, 'glow').setTint(EYE[m.id] ?? 0xffffff).setBlendMode(Phaser.BlendModes.ADD)
      .setDisplaySize(90, 90).setDepth(31000).setAlpha(0);
    const mon: Mon = { def: m, s, glow, zone, tx: pt[0], ty: pt[1], wait: w.time.now + 1500, calm: 0, up: !emerge };
    this.mons.push(mon);
    if (emerge) this.emerge(mon);
    else glow.setAlpha(0.18);
    return mon;
  }

  private emerge(m: Mon) {
    crawlOut(this.w, m.s).then(() => { m.up = true; });
    this.w.tweens.add({ targets: m.glow, alpha: 0.18, duration: 1400, delay: 450 });
  }

  private spawnPerson(progress = 0) {
    const used = new Set(this.people.map(p => p.def.id));
    const pool = NPCS.filter(n => !used.has(n.id));
    if (!pool.length) return;
    const def = Phaser.Utils.Array.GetRandom(pool);
    let path = Phaser.Utils.Array.GetRandom(this.paths).map(p => [...p] as Pt);
    if (Math.random() < 0.5) path = path.reverse();
    // people already partway along when you arrive, so the street isn't empty for the first few seconds
    let [x, y] = path[0];
    if (progress) { x += (path[1][0] - x) * progress * 0.8; y += (path[1][1] - y) * progress * 0.8; }
    const s = this.w.add.sprite(x, y, 'npc-' + def.id, 'idle').setOrigin(0.5, 0.985).setScale(ART).setDepth(y);
    const speed = def.id === 'jogger' ? 115 : Phaser.Math.Between(55, 75);
    this.people.push({ def, s, path, i: 1, speed });
  }

  update(dt: number, free: boolean) {
    const w = this.w, now = w.time.now, p = w.player;
    if (now > this.nextMon && this.mons.length < MAX_MONSTERS && state.flag('monsters')) {
      this.spawnMonster(true);
      this.nextMon = now + Phaser.Math.Between(5000, 9000);
    }
    if (now > this.nextPerson && this.people.length < MAX_PEOPLE) {
      this.spawnPerson();
      this.nextPerson = now + Phaser.Math.Between(3500, 8000);
    }

    for (const m of this.mons) {
      const s = m.s;
      if (!m.up) continue;
      const d = Phaser.Math.Distance.Between(s.x, s.y, p.x, p.y);
      const hunting = free && now > m.calm && now > this.grace && d < NOTICE;
      let tx = m.tx, ty = m.ty, speed = 26;
      if (hunting) { tx = p.x; ty = p.y; speed = 48; }
      else if (now < m.wait) { m.glow.setPosition(s.x, s.y - 36); continue; }
      const dx = tx - s.x, dy = ty - s.y, dist = Math.hypot(dx, dy);
      if (dist < 3 && !hunting) {
        [m.tx, m.ty] = randIn(m.zone);
        m.wait = now + Phaser.Math.Between(900, 3200);
      } else if (dist > 0) {
        const step = Math.min(dist, speed * dt);
        s.x += dx / dist * step; s.y += dy / dist * step;
        if (Math.abs(dx) > 1) s.setFlipX(dx > 0);
      }
      s.setDepth(s.y).setAlpha(0.88 + Math.sin(now / 240 + s.x) * 0.1);
      m.glow.setPosition(s.x, s.y - 36);
      if (hunting && d < ENCOUNTER && !w.locked) { this.encounter(m); break; }
    }

    for (let i = this.people.length - 1; i >= 0; i--) {
      const n = this.people[i], s = n.s;
      const [tx, ty] = n.path[n.i];
      const dx = tx - s.x, dy = ty - s.y, dist = Math.hypot(dx, dy);
      const step = Math.min(dist, n.speed * dt);
      if (dist > 0) { s.x += dx / dist * step; s.y += dy / dist * step; }
      const dir = Math.abs(dx) > Math.abs(dy) ? 'side' : dy < 0 ? 'up' : 'down';
      const key = `npc-${n.def.id}-${dir}`;
      if (s.anims.currentAnim?.key !== key) s.play(key);
      s.anims.timeScale = n.speed / 65;
      s.setFlipX(dir === 'side' && dx < 0).setDepth(s.y);
      if (dist <= step + 0.5 && ++n.i >= n.path.length) { s.destroy(); this.people.splice(i, 1); }
    }
  }

  private encounter(m: Mon) {
    const w = this.w;
    w.cutscene(async () => {
      sfx.stinger();
      w.emote(m.s, '!', '#ff4f8b', 90);
      w.flash(200);
      w.shake(240, 0.01);
      await w.wait(450);
      const r = await w.battle(m.def.id);
      // give Mohit a moment before anything else nearby has a go
      for (const o of this.mons) if (Phaser.Math.Distance.Between(o.s.x, o.s.y, w.player.x, w.player.y) < 220) o.calm = w.time.now + 3500;
      if (r === 'run') {
        m.calm = w.time.now + 4000;
        this.grace = w.time.now + 1500;
        return;
      }
      this.mons = this.mons.filter(x => x !== m);
      m.glow.destroy();
      w.tweens.add({ targets: m.s, alpha: 0, scaleY: 0, duration: 500, onComplete: () => m.s.destroy() });
      this.grace = w.time.now + 1500;
      this.nextMon = Math.max(this.nextMon, w.time.now + 6000);
    });
  }
}
