import Phaser from 'phaser';
import { ART } from '../px/scale';
import { PIX } from '../px/props';
import { Px } from '../px/paint';
import { paintGround } from '../px/terrain';
import { MAPS, objectiveText, mapSize, type MapDef, type Spot } from '../maps';
import { state, hazeLevel, type MapName } from '../state';
import { clock, grade, fmt, isNight } from '../daytime';
import { input } from '../input';
import { ui, type Line } from '../ui';
import { sfx } from '../audio';

const DPR = () => Math.min(window.devicePixelRatio || 1, 2.5);
// walking speed, rising to a jog after ~0.7s of continuous movement
const WALK = 165, JOG = 240;
const HAZE = 0xf2dcc6;
// chance that PoiPoi stays behind at something Mohit just interacted with
const POI_DISTRACT_CHANCE = 0.35;

type Sprite = Phaser.GameObjects.Sprite;
type Light = { img: Phaser.GameObjects.Image; kind: 'night' | 'indoor'; base: number };

/** PoiPoi following Mohit along his footsteps, sometimes wandering off. */
class Follower {
  sprite: Sprite;
  distracted = false;
  private nextDistract: number;
  private hint?: Phaser.GameObjects.Image;

  constructor(private w: World, x: number, y: number) {
    this.sprite = w.add.sprite(x, y, 'poi', 'idle').setOrigin(0.5, 0.94).setScale(ART);
    this.sprite.play('p-idle');
    this.nextDistract = w.time.now + 14000;
  }

  update(dt: number, partyMoving: boolean) {
    const s = this.sprite;
    s.setDepth(s.y);
    if (this.distracted) {
      this.hint?.setPosition(s.x, s.y - 54 + Math.sin(this.w.time.now / 160) * 3);
      return;
    }
    if (this.w.followPaused) return;
    const trail = this.w.trail;
    let tx = s.x, ty = s.y, acc = 0;
    for (let i = trail.length - 1; i > 0; i--) {
      acc += Phaser.Math.Distance.Between(trail[i].x, trail[i].y, trail[i - 1].x, trail[i - 1].y);
      if (acc >= 46) { tx = trail[i - 1].x; ty = trail[i - 1].y; break; }
    }
    const dx = tx - s.x, dy = ty - s.y, d = Math.hypot(dx, dy);
    const step = Math.min(d, (JOG + 30) * dt);
    if (d > 1.5) {
      s.x += dx / d * step; s.y += dy / d * step;
      if (Math.abs(dx) > 0.5) s.setFlipX(dx < 0);
      if (s.anims.currentAnim?.key !== 'p-walk') s.play('p-walk');
    } else if (s.anims.currentAnim?.key === 'p-walk') s.play('p-idle');
    if (partyMoving && state.flag('fed') && !this.w.locked && this.w.time.now > this.nextDistract && Math.random() < dt * 0.25) this.wander();
  }

  wander() {
    this.distracted = true;
    this.sprite.play('p-loaf');
    this.hint = this.w.add.image(this.sprite.x, this.sprite.y - 54, 'pix-spark').setScale(ART).setDepth(26000);
    const what = Phaser.Utils.Array.GetRandom(['a speck of dust', 'a leaf', 'nothing. there is nothing there.', 'his own tail', 'a very interesting crack in the road']);
    ui.toast(`PoiPoi got distracted by something.<small>(${what}) Go back and call him.</small>`, 3600);
    sfx.meow(true);
  }

  /** Stays behind at something Mohit just looked at. */
  distractBy(x: number, y: number, name: string) {
    this.distracted = true;
    const s = this.sprite, tx = x + Phaser.Math.Between(-22, 22), ty = y + 10;
    s.setFlipX(tx < s.x).play('p-walk');
    this.w.tweens.add({
      targets: s, x: tx, y: ty, duration: Math.max(200, Phaser.Math.Distance.Between(s.x, s.y, tx, ty) * 5),
      onComplete: () => { if (this.distracted) s.play('p-loaf'); }
    });
    this.hint = this.w.add.image(tx, ty - 54, 'pix-spark').setScale(ART).setDepth(26000);
    ui.toast(`PoiPoi got distracted by ${name}.<small>Go back and call him when you're ready.</small>`, 3400);
    sfx.meow(true);
  }

  rejoin() {
    this.distracted = false;
    this.w.tweens.killTweensOf(this.sprite);
    this.hint?.destroy(); this.hint = undefined;
    this.nextDistract = this.w.time.now + Phaser.Math.Between(16000, 26000);
    this.w.trail = [{ x: this.sprite.x, y: this.sprite.y }, { x: this.w.player.x, y: this.w.player.y }];
    this.sprite.play('p-idle');
    ui.toast('PoiPoi rejoined the party.', 1600);
    sfx.meow(true);
  }
}

export class World extends Phaser.Scene {
  mapName: MapName = 'room';
  spawn = 'wake';
  def!: MapDef;
  player!: Phaser.Physics.Arcade.Sprite;
  poi: Follower | null = null;
  walls!: Phaser.Physics.Arcade.StaticGroup;
  trail: { x: number; y: number }[] = [];
  locked = false;
  followPaused = false;
  leaving = false;
  extra: Record<string, unknown> = {};
  facing: 'down' | 'up' | 'side' = 'down';
  private gen = 0;
  private cm: Phaser.FX.ColorMatrix | null = null;
  private haze = hazeLevel();
  private stepT = 0;
  private moveT = 0;
  private saveT = 0;
  private lead = { x: 0, y: 0, tx: 0, ty: 0 };
  private marker!: Phaser.GameObjects.Text;
  private arrow!: Phaser.GameObjects.Image;
  private pointer = document.querySelector('#pointer') as HTMLElement;
  private clockEl = document.querySelector('#clock') as HTMLElement;
  private hintObjs: Phaser.GameObjects.Image[] = [];
  private tintRect!: Phaser.GameObjects.Rectangle;
  private hazeRect!: Phaser.GameObjects.Rectangle;
  private lamps: Light[] = [];

  constructor() { super('World'); }

  init(data: { map: MapName; spawn: string }) {
    this.mapName = data.map; this.spawn = data.spawn; this.gen++;
    this.poi = null; this.trail = []; this.locked = false; this.followPaused = false; this.leaving = false; this.extra = {};
    this.hintObjs = []; this.lamps = []; this.facing = 'down'; this.moveT = 0; this.lead = { x: 0, y: 0, tx: 0, ty: 0 };
  }

  create() {
    const m = this.def = MAPS[this.mapName];
    const { w: mw, h: mh } = mapSize(m);
    this.physics.world.setBounds(0, 0, mw, mh);
    this.cameras.main.setBackgroundColor('#140d1f');

    const gkey = 'ground-' + this.mapName;
    if (!this.textures.exists(gkey)) {
      const g = paintGround(m.tiles, this.mapName.length * 97 + 13);
      m.decorate?.(g);
      this.textures.addCanvas(gkey, g.cv);
    }
    this.add.image(0, 0, gkey).setOrigin(0).setScale(ART).setDepth(-10000);
    if (m.wires) {
      const wkey = 'wires-' + this.mapName;
      if (!this.textures.exists(wkey)) {
        const p = new Px(mw / ART, mh / ART);
        m.wires.forEach(([x0, y0, x1, y1, drop]) => p.sag(x0, y0, x1, y1, drop, '#2b2430'));
        this.textures.addCanvas(wkey, p.cv);
      }
      this.add.image(0, 0, wkey).setOrigin(0).setScale(ART).setDepth(25000).setAlpha(0.9);
    }

    this.walls = this.physics.add.staticGroup();
    if (m.wall) this.block(0, 0, mw, m.wall + 8);
    for (const p of m.props) this.prop(p.key, p.x, p.y, p.wall, p.floor);
    for (const b of m.blocks ?? []) this.block(...b);
    for (const [x, y, c, r] of m.lights ?? []) this.addLight(x, y, c, r, 'indoor');

    const [sx, sy] = m.spawns[this.spawn] ?? Object.values(m.spawns)[0];
    this.player = this.physics.add.sprite(sx, sy, 'mohit', 'idle').setOrigin(0.5, 0.985).setScale(ART);
    (this.player.body as Phaser.Physics.Arcade.Body).setSize(8, 4).setOffset(8, 27);
    this.player.setCollideWorldBounds(true);
    this.physics.add.collider(this.player, this.walls);
    this.player.play('m-idle');
    this.trail = [{ x: sx, y: sy }];

    if (state.flag('fed') && m.poiAllowed !== false) this.addPoi(sx - 34, sy + 2);

    this.marker = this.add.text(0, 0, '!', {
      fontFamily: '"Pixelify Sans", monospace', fontSize: '24px', color: '#ffffff', stroke: '#2b2430', strokeThickness: 6
    }).setOrigin(0.5).setDepth(26001).setVisible(false);
    this.arrow = this.add.image(0, 0, 'pix-arrow').setOrigin(0.5, 1).setScale(ART).setDepth(26003).setVisible(false);
    this.events.once('shutdown', () => { this.pointer.hidden = true; });

    this.tintRect = this.add.rectangle(0, 0, 10, 10, 0xffffff).setOrigin(0).setDepth(30000).setBlendMode(Phaser.BlendModes.MULTIPLY);
    this.hazeRect = this.add.rectangle(0, 0, 10, 10, HAZE, 0).setOrigin(0).setDepth(30001);

    const cam = this.cameras.main;
    cam.startFollow(this.player, true, 0.14, 0.14, 0, 20);
    if (this.renderer.type === Phaser.WEBGL) {
      this.cm = cam.postFX.addColorMatrix();
      this.applyHaze(this.haze = hazeLevel());
    }
    this.fit();
    this.scale.on('resize', this.fit, this);
    this.events.once('shutdown', () => this.scale.off('resize', this.fit, this));
    cam.fadeIn(350, 20, 13, 31);

    sfx.ambient(m.ambient);
    ui.objective(objectiveText());
    state.data.map = this.mapName; state.data.spawn = this.spawn; state.save();

    m.setup?.(this);
    if (m.hints?.()) this.showHints();
    this.updateLight();
    if (m.enter) this.cutscene(() => m.enter!(this));
  }

  /** Camera zoom/bounds for the current screen; small rooms are centred instead of pinned to a corner. */
  fit() {
    const cam = this.cameras.main, dpr = DPR();
    const cssW = this.scale.width / dpr, cssH = this.scale.height / dpr;
    const { w: mw, h: mh } = mapSize(this.def);
    const roomFill = this.def.indoor ? (cssH * 0.6) / mh : 0;
    const z = Phaser.Math.Clamp(Math.max(Math.min(cssW, cssH) / 440, roomFill), 1, 1.6);
    cam.setZoom(z * dpr);
    const vw = cssW / z, vh = cssH / z;
    const bx = vw > mw ? (mw - vw) / 2 : 0, by = vh > mh ? (mh - vh) / 2 : 0;
    cam.setBounds(bx, by, Math.max(mw, vw), Math.max(mh, vh));
  }

  /** Haze desaturates a little and lays a soft peach veil over everything. */
  applyHaze(v: number) {
    if (this.cm) { this.cm.reset(); this.cm.saturate(-0.42 * v); }
    this.hazeRect?.setFillStyle(HAZE, (this.def.indoor ? 0.08 : 0.2) * v);
  }

  /** Slowly lifts a little of the haze. */
  recolor() {
    const to = hazeLevel(), obj = { v: this.haze };
    this.tweens.add({ targets: obj, v: to, duration: 3500, ease: 'Sine.easeInOut', onUpdate: () => this.applyHaze(obj.v) });
    this.haze = to;
  }

  addLight(x: number, y: number, color: string, radius: number, kind: 'night' | 'indoor') {
    const img = this.add.image(x, y, 'glow').setTint(Phaser.Display.Color.HexStringToColor(color).color)
      .setBlendMode(Phaser.BlendModes.ADD).setDisplaySize(radius * 2, radius * 2).setDepth(31000).setAlpha(0);
    this.lamps.push({ img, kind, base: kind === 'indoor' ? 0.32 : 0.75 });
  }

  /** Time-of-day tint, lamps and the HUD clock. */
  private updateLight() {
    const cam = this.cameras.main, v = cam.worldView;
    const g = grade(clock.min, this.def.indoor);
    this.tintRect.setPosition(v.x - 4, v.y - 4).setSize(v.width + 8, v.height + 8).setFillStyle(g.tint);
    this.hazeRect.setPosition(v.x - 4, v.y - 4).setSize(v.width + 8, v.height + 8);
    for (const l of this.lamps) l.img.setAlpha(l.kind === 'indoor' ? l.base + g.lights * 0.35 : l.base * g.lights);
    const night = isNight(clock.min);
    this.clockEl.innerHTML = `<i class="${night ? 'moon' : 'sun'}"></i>${fmt(clock.min)}`;
  }

  block(x: number, y: number, w: number, h: number) {
    const z = this.add.zone(x + w / 2, y + h / 2, w, h);
    this.physics.add.existing(z, true);
    this.walls.add(z);
    return z;
  }

  prop(key: string, x: number, y: number, wall = false, floor = false) {
    const art = PIX[key];
    const img = this.add.image(x, y, 'pix-' + key).setOrigin(0.5, 1).setScale(ART).setDepth(floor ? -9000 : wall ? -5000 + y : y);
    if (art.foot && !wall && !floor) this.block(x + art.foot[0] * ART, y + art.foot[1] * ART, art.foot[2] * ART, art.foot[3] * ART);
    for (const [gx, gy, c] of art.glow ?? []) {
      this.addLight(x - (art.w * ART) / 2 + gx * ART, y - art.h * ART + gy * ART, c, this.def.indoor ? 60 : 70, 'night');
    }
    return img;
  }

  addPoi(x: number, y: number) {
    this.poi = new Follower(this, x, y);
    return this.poi;
  }

  update(_t: number, deltaMs: number) {
    const dt = Math.min(deltaMs, 50) / 1000;
    const p = this.player;
    const body = p.body as Phaser.Physics.Arcade.Body;
    let moving = false;
    const free = !this.locked && !ui.busy && !this.leaving;
    if (free) {
      const mv = input.move, mag = Math.hypot(mv.x, mv.y);
      moving = mag > 0.05;
      if (moving) {
        this.moveT += dt;
        const jog = mag > 0.8 ? Phaser.Math.Clamp((this.moveT - 0.7) / 0.5, 0, 1) : 0;
        const speed = WALK + (JOG - WALK) * jog;
        body.setVelocity(mv.x * speed, mv.y * speed);
        this.face(mv.x, mv.y);
        const key = this.animFor(true);
        if (p.anims.currentAnim?.key !== key) p.play(key);
        p.anims.timeScale = (0.8 + 0.4 * mag) * (1 + jog * 0.45);
        this.stepT -= dt * (1 + jog * 0.5);
        if (this.stepT <= 0) { sfx.step(); this.stepT = 0.3; if (jog > 0.5) this.puff(p.x, p.y); }
        this.lead.tx = mv.x * 46; this.lead.ty = mv.y * 34;
      } else this.stop();
      clock.advance(dt);
      if ((this.saveT += dt) > 10) { this.saveT = 0; state.save(); }
    } else if (!this.locked) this.stop();
    p.setDepth(p.y);
    const k = Math.min(1, dt * 2.2);
    this.lead.x += (this.lead.tx - this.lead.x) * k; this.lead.y += (this.lead.ty - this.lead.y) * k;
    this.cameras.main.setFollowOffset(-this.lead.x, 20 - this.lead.y);

    const last = this.trail[this.trail.length - 1];
    if (!last || Phaser.Math.Distance.Between(last.x, last.y, p.x, p.y) > 2) {
      this.trail.push({ x: p.x, y: p.y });
      if (this.trail.length > 240) this.trail.shift();
    }
    this.poi?.update(dt, moving);
    this.def.update?.(this, dt);
    this.updateTarget();
    this.updateLight();

    const near = free ? this.nearest() : null;
    input.setAction(near ? near.label : null);
    if (near) {
      this.marker.setVisible(true).setPosition(p.x, p.y - 112);
      if (input.consumeA()) this.cutscene(async () => {
        await near.run(this);
        const poi = this.poi;
        if (!near.door && poi && !poi.distracted && !this.followPaused && !this.leaving && state.flag('fed') && Math.random() < POI_DISTRACT_CHANCE) {
          poi.distractBy(near.x, near.y, near.name ?? 'something');
        }
      });
    } else {
      this.marker.setVisible(false);
      input.consumeA();
    }
  }

  private stop() {
    const p = this.player;
    (p.body as Phaser.Physics.Arcade.Body).setVelocity(0, 0);
    this.moveT = 0; this.lead.tx = 0; this.lead.ty = 0;
    if (p.anims.currentAnim?.key.startsWith('m-walk')) p.play(this.animFor(false));
  }

  /** Picks the front, back or side view from the direction of movement. */
  face(x: number, y: number) {
    if (Math.abs(x) > Math.abs(y) * 0.9) { this.facing = 'side'; this.player.setFlipX(x < 0); }
    else { this.facing = y < 0 ? 'up' : 'down'; this.player.setFlipX(false); }
  }
  animFor(walking: boolean) {
    const f = this.facing;
    if (walking) return f === 'up' ? 'm-walk-up' : f === 'side' ? 'm-walk-side' : 'm-walk';
    return f === 'up' ? 'm-idle-up' : f === 'side' ? 'm-idle-side' : 'm-idle';
  }

  private puff(x: number, y: number) {
    for (let i = 0; i < 2; i++) {
      const c = this.add.image(x + Phaser.Math.Between(-9, 9), y - 3, 'dot').setScale(ART).setAlpha(0.7).setDepth(y - 1);
      this.tweens.add({ targets: c, y: y - 12, alpha: 0, duration: 420, onComplete: () => c.destroy() });
    }
  }

  /** Sparkles over everything you can look at (used to nudge the player). */
  showHints() {
    for (const s of this.def.spots) {
      if (s.door) continue;
      const t = this.add.image(s.x, s.y - 54, 'pix-spark').setScale(ART).setDepth(26000);
      this.tweens.add({ targets: t, y: t.y - 7, alpha: 0.55, yoyo: true, repeat: -1, duration: 620, delay: Phaser.Math.Between(0, 400) });
      this.hintObjs.push(t);
    }
  }
  clearHints() { this.hintObjs.forEach(h => h.destroy()); this.hintObjs = []; }

  /** Bouncing arrow over the next place to go, plus an edge-of-screen pointer when it's off camera. */
  private updateTarget() {
    const t = this.locked || ui.busy ? null : this.def.target?.() ?? null;
    if (!t) { this.arrow.setVisible(false); this.pointer.hidden = true; return; }
    this.arrow.setVisible(true).setPosition(t[0], t[1] + Math.round(Math.sin(this.time.now / 180) * 2) * ART);
    const cam = this.cameras.main, v = cam.worldView;
    if (t[0] > v.x + 20 && t[0] < v.right - 20 && t[1] > v.y + 30 && t[1] < v.bottom - 20) { this.pointer.hidden = true; return; }
    const dpr = DPR(), z = cam.zoom / dpr, cssW = this.scale.width / dpr, cssH = this.scale.height / dpr;
    const dx = (t[0] - cam.midPoint.x) * z, dy = (t[1] - cam.midPoint.y) * z;
    const kx = (cssW / 2 - 40) / Math.max(Math.abs(dx), 1e-3), ky = (cssH / 2 - 80) / Math.max(Math.abs(dy), 1e-3);
    const s = Math.min(kx, ky, 1);
    this.pointer.hidden = false;
    this.pointer.style.transform = `translate(${cssW / 2 + dx * s}px, ${cssH / 2 + dy * s}px) rotate(${Math.atan2(dy, dx)}rad)`;
  }

  private nearest(): Spot | null {
    const p = this.player;
    let best: Spot | null = null, bd = Infinity;
    // a distracted PoiPoi only comes back when you call him
    const poi = this.poi;
    if (poi?.distracted) {
      const d = Phaser.Math.Distance.Between(p.x, p.y, poi.sprite.x, poi.sprite.y);
      if (d < 64) { best = { x: poi.sprite.x, y: poi.sprite.y, r: 64, label: 'Call', door: true, run: async () => poi.rejoin() }; bd = d; }
    }
    for (const s of this.def.spots) {
      if (s.when && !s.when(this)) continue;
      const d = Phaser.Math.Distance.Between(p.x, p.y, s.x, s.y);
      if (d < s.r && d < bd) { best = s; bd = d; }
    }
    return best;
  }

  /* ---------- helpers used by the story ---------- */
  async cutscene(fn: () => Promise<void> | void) {
    if (this.locked) return;
    const gen = this.gen;
    this.locked = true;
    (this.player.body as Phaser.Physics.Arcade.Body).setVelocity(0, 0);
    if (this.player.anims.currentAnim?.key.startsWith('m-walk')) this.player.play(this.animFor(false));
    this.moveT = 0; this.lead.tx = this.lead.ty = 0;
    input.setAction(null); this.marker.setVisible(false);
    // a cutscene that changed map finishes after the restart; it must not unlock the new map's cutscene
    try { await fn(); } finally { if (gen === this.gen) this.locked = false; }
  }

  say(lines: Line[] | Line) { return ui.say(lines); }
  wait(ms: number) { return new Promise<void>(r => this.time.delayedCall(ms, r)); }

  walk(s: Sprite, x: number, y: number, speed = 130, walkAnim?: string, idleAnim?: string) {
    const d = Phaser.Math.Distance.Between(s.x, s.y, x, y);
    if (d < 1) return Promise.resolve();
    const isPoi = s.texture.key === 'poi', isMohit = s === this.player;
    if (isMohit) this.face(x - s.x, y - s.y);
    else if (Math.abs(x - s.x) > 1) s.setFlipX(x < s.x);
    s.play(walkAnim ?? (isPoi ? 'p-walk' : isMohit ? this.animFor(true) : 'm-walk'));
    return new Promise<void>(r => this.tweens.add({
      targets: s, x, y, duration: (d / speed) * 1000,
      onUpdate: () => s.setDepth(s.y),
      onComplete: () => { s.play(idleAnim ?? (isPoi ? 'p-idle' : isMohit ? this.animFor(false) : 'm-idle')); r(); }
    }));
  }

  emote(s: Phaser.GameObjects.Sprite | { x: number; y: number }, text: string, color = '#ffffff', dy = 116) {
    const t = this.add.text(s.x, s.y - dy, text, {
      fontFamily: '"Pixelify Sans", monospace', fontSize: '26px', color, stroke: '#2b2430', strokeThickness: 6
    }).setOrigin(0.5).setDepth(26002).setScale(0.3);
    this.tweens.add({ targets: t, scale: 1, duration: 220, ease: 'Back.easeOut' });
    this.tweens.add({ targets: t, alpha: 0, y: t.y - 14, delay: 1100, duration: 400, onComplete: () => t.destroy() });
  }

  float(x: number, y: number, key: string, scale = 1) {
    const i = this.add.image(x, y, key).setScale(ART * scale).setDepth(26002);
    this.tweens.add({ targets: i, y: y - 30, alpha: 0, duration: 1100, ease: 'Sine.easeOut', onComplete: () => i.destroy() });
  }

  shake(ms = 260, k = 0.008) { this.cameras.main.shake(ms, k); }
  flash(ms = 180) { this.cameras.main.flash(ms, 255, 255, 255); }

  goto(map: MapName, spawn: string) {
    if (this.leaving) return;
    this.leaving = true;
    input.setAction(null);
    sfx.door();
    state.save();
    this.cameras.main.fadeOut(260, 20, 13, 31);
    this.cameras.main.once('camerafadeoutcomplete', () => this.scene.restart({ map, spawn }));
  }

  /** Runs the battle scene on top of this one and waits for its result. */
  battle(): Promise<string> {
    return new Promise(resolve => {
      const hud = document.querySelector('#hud') as HTMLElement;
      hud.hidden = true;
      this.scene.pause();
      this.scene.launch('Battle', {
        done: (r: string) => { hud.hidden = false; this.scene.resume(); resolve(r); }
      });
    });
  }
}
