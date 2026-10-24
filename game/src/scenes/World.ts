import Phaser from 'phaser';
import { RES } from '../art/raster';
import { PROPS } from '../art/props';
import { MAPS, objectiveText, type MapDef, type Spot } from '../maps';
import { state, colorLevel, type MapName } from '../state';
import { input } from '../input';
import { ui, type Line } from '../ui';
import { sfx } from '../audio';

const DPR = () => Math.min(window.devicePixelRatio || 1, 2.5);
const SPEED = 140;

type Sprite = Phaser.GameObjects.Sprite;

/** PoiPoi following Mohit along his footsteps, sometimes wandering off. */
class Follower {
  sprite: Sprite;
  distracted = false;
  private nextDistract: number;
  private hint?: Phaser.GameObjects.Text;

  constructor(private w: World, x: number, y: number) {
    this.sprite = w.add.sprite(x, y, 'poi', 'idle').setOrigin(0.5, 0.94).setScale(1 / RES);
    this.sprite.play('p-idle');
    this.nextDistract = w.time.now + 14000;
  }

  update(dt: number, partyMoving: boolean) {
    const s = this.sprite, p = this.w.player;
    s.setDepth(s.y);
    if (this.distracted) {
      this.hint?.setPosition(s.x, s.y - 58);
      if (Phaser.Math.Distance.Between(p.x, p.y, s.x, s.y) < 48) this.rejoin();
      return;
    }
    if (this.w.followPaused) return;
    // follow the breadcrumb trail ~46px behind Mohit
    const trail = this.w.trail;
    let tx = s.x, ty = s.y, acc = 0;
    for (let i = trail.length - 1; i > 0; i--) {
      acc += Phaser.Math.Distance.Between(trail[i].x, trail[i].y, trail[i - 1].x, trail[i - 1].y);
      if (acc >= 46) { tx = trail[i - 1].x; ty = trail[i - 1].y; break; }
    }
    const dx = tx - s.x, dy = ty - s.y, d = Math.hypot(dx, dy);
    const step = Math.min(d, (SPEED + 30) * dt);
    if (d > 1.5) {
      s.x += dx / d * step; s.y += dy / d * step;
      if (Math.abs(dx) > 0.5) s.setFlipX(dx < 0);
      if (s.anims.currentAnim?.key !== 'p-walk') s.play('p-walk');
    } else if (s.anims.currentAnim?.key === 'p-walk') s.play('p-idle');

    // very independent: every so often he stops to inspect something and has to be collected
    if (partyMoving && state.flag('fed') && !this.w.locked && this.w.time.now > this.nextDistract && Math.random() < dt * 0.25) this.wander();
  }

  wander() {
    this.distracted = true;
    this.sprite.play('p-loaf');
    this.hint = this.w.add.text(this.sprite.x, this.sprite.y - 58, '?', {
      fontFamily: 'Lilita One', fontSize: '26px', color: '#ffc23c', stroke: '#1b1325', strokeThickness: 6, resolution: 3
    }).setOrigin(0.5).setDepth(10000);
    this.w.tweens.add({ targets: this.hint, y: '-=6', yoyo: true, repeat: -1, duration: 420 });
    const what = Phaser.Utils.Array.GetRandom(['a speck of dust', 'a leaf', 'nothing. there is nothing there.', 'his own tail', 'a very interesting crack in the road']);
    ui.toast(`PoiPoi got distracted by something.<small>(${what}) Go back and get him.</small>`, 3600);
    sfx.meow(true);
  }

  rejoin() {
    this.distracted = false;
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
  private gen = 0;
  extra: Record<string, unknown> = {};
  private cm: Phaser.FX.ColorMatrix | null = null;
  private sat = colorLevel();
  private stepT = 0;
  private marker!: Phaser.GameObjects.Text;

  constructor() { super('World'); }

  init(data: { map: MapName; spawn: string }) {
    this.mapName = data.map; this.spawn = data.spawn; this.gen++;
    this.poi = null; this.trail = []; this.locked = false; this.followPaused = false; this.leaving = false; this.extra = {};
  }

  create() {
    const m = this.def = MAPS[this.mapName];
    this.physics.world.setBounds(0, 0, m.w, m.h);
    this.cameras.main.setBackgroundColor('#140d1f');
    const g = this.add.graphics().setDepth(-10000);
    m.draw(g, this);

    this.walls = this.physics.add.staticGroup();
    if (m.wall) this.block(0, 0, m.w, m.wall + 8);
    for (const p of m.props) this.prop(p.key, p.x, p.y, p.wall);
    for (const b of m.blocks ?? []) this.block(...b);

    const [sx, sy] = m.spawns[this.spawn] ?? Object.values(m.spawns)[0];
    this.player = this.physics.add.sprite(sx, sy, 'mohit', 'idle').setOrigin(0.5, 0.97).setScale(1 / RES);
    const fw = this.player.frame.width, fh = this.player.frame.height;
    this.player.body!.setSize(22 * RES, 9 * RES);
    (this.player.body as Phaser.Physics.Arcade.Body).setOffset((fw - 22 * RES) / 2, fh * 0.97 - 10 * RES);
    this.player.setCollideWorldBounds(true);
    this.physics.add.collider(this.player, this.walls);
    this.player.play('m-idle');
    this.trail = [{ x: sx, y: sy }];

    if (state.flag('fed') && m.poiAllowed !== false) this.addPoi(sx - 34, sy + 2);

    this.marker = this.add.text(0, 0, '!', {
      fontFamily: 'Lilita One', fontSize: '22px', color: '#ffffff', stroke: '#1b1325', strokeThickness: 6, resolution: 3
    }).setOrigin(0.5).setDepth(10001).setVisible(false);
    this.tweens.add({ targets: this.marker, scale: 1.2, yoyo: true, repeat: -1, duration: 380 });

    const cam = this.cameras.main;
    cam.startFollow(this.player, true, 0.14, 0.14, 0, 20);
    if (this.renderer.type === Phaser.WEBGL) {
      this.cm = cam.postFX.addColorMatrix();
      this.applySat(this.sat = colorLevel());
    }
    this.fit();
    this.scale.on('resize', this.fit, this);
    this.events.once('shutdown', () => this.scale.off('resize', this.fit, this));
    cam.fadeIn(350, 20, 13, 31);

    sfx.ambient(m.ambient);
    ui.objective(objectiveText());
    state.data.map = this.mapName; state.data.spawn = this.spawn; state.save();

    m.setup?.(this);
    if (m.enter) this.cutscene(() => m.enter!(this));
  }

  /** Camera zoom/bounds for the current screen; small rooms are centred instead of pinned to a corner. */
  fit() {
    const cam = this.cameras.main, dpr = DPR();
    const cssW = this.scale.width / dpr, cssH = this.scale.height / dpr;
    // indoors on a tall phone, zoom in so the room fills more of the screen (the camera scrolls sideways)
    const m0 = this.def;
    const roomFill = m0.wall ? (cssH * 0.6) / m0.h : 0;
    const z = Phaser.Math.Clamp(Math.max(Math.min(cssW, cssH) / 440, roomFill), 1, 1.6);
    cam.setZoom(z * dpr);
    const vw = cssW / z, vh = cssH / z, m = this.def;
    const bx = vw > m.w ? (m.w - vw) / 2 : 0, by = vh > m.h ? (m.h - vh) / 2 : 0;
    cam.setBounds(bx, by, Math.max(m.w, vw), Math.max(m.h, vh));
  }

  applySat(v: number) { if (this.cm) { this.cm.reset(); this.cm.saturate(v); } }

  /** Slowly brings a little more colour into the world. */
  recolor() {
    const to = colorLevel(), obj = { v: this.sat };
    this.tweens.add({ targets: obj, v: to, duration: 3500, ease: 'Sine.easeInOut', onUpdate: () => this.applySat(obj.v) });
    this.sat = to;
  }

  block(x: number, y: number, w: number, h: number) {
    const z = this.add.zone(x + w / 2, y + h / 2, w, h);
    this.physics.add.existing(z, true);
    this.walls.add(z);
    return z;
  }

  prop(key: string, x: number, y: number, wall = false) {
    const art = PROPS[key];
    const img = this.add.image(x, y, 'prop-' + key).setOrigin(0.5, 1).setScale(1 / RES).setDepth(wall ? -5000 + y : y);
    if (art.foot && !wall) this.block(x + art.foot[0], y + art.foot[1], art.foot[2], art.foot[3]);
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
    if (!this.locked && !ui.busy && !this.leaving) {
      const mv = input.move;
      body.setVelocity(mv.x * SPEED, mv.y * SPEED);
      moving = Math.hypot(mv.x, mv.y) > 0.05;
      if (moving) {
        if (Math.abs(mv.x) > 0.1) p.setFlipX(mv.x < 0);
        if (p.anims.currentAnim?.key !== 'm-walk') p.play('m-walk');
        p.anims.timeScale = 0.6 + Math.hypot(mv.x, mv.y) * 0.5;
        this.stepT -= dt;
        if (this.stepT <= 0) { sfx.step(); this.stepT = 0.32; }
      } else if (p.anims.currentAnim?.key === 'm-walk') p.play('m-idle');
    } else if (!this.locked) {
      body.setVelocity(0, 0);
      if (p.anims.currentAnim?.key === 'm-walk') p.play('m-idle');
    }
    p.setDepth(p.y);

    const last = this.trail[this.trail.length - 1];
    if (!last || Phaser.Math.Distance.Between(last.x, last.y, p.x, p.y) > 2) {
      this.trail.push({ x: p.x, y: p.y });
      if (this.trail.length > 240) this.trail.shift();
    }
    this.poi?.update(dt, moving);
    this.def.update?.(this, dt);

    // nearest thing to interact with
    const near = (!this.locked && !ui.busy && !this.leaving) ? this.nearest() : null;
    input.setAction(near ? near.label : null);
    if (near) {
      this.marker.setVisible(true).setPosition(p.x, p.y - 88);
      if (input.consumeA()) this.cutscene(() => near.run(this));
    } else {
      this.marker.setVisible(false);
      input.consumeA();
    }
  }

  private nearest(): Spot | null {
    const p = this.player;
    let best: Spot | null = null, bd = Infinity;
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
    if (this.player.anims.currentAnim?.key === 'm-walk') this.player.play('m-idle');
    input.setAction(null); this.marker.setVisible(false);
    // a cutscene that changed map finishes after the restart; it must not unlock the new map's cutscene
    try { await fn(); } finally { if (gen === this.gen) this.locked = false; }
  }

  say(lines: Line[] | Line) { return ui.say(lines); }
  wait(ms: number) { return new Promise<void>(r => this.time.delayedCall(ms, r)); }

  walk(s: Sprite, x: number, y: number, speed = 90, walkAnim?: string, idleAnim?: string) {
    const d = Phaser.Math.Distance.Between(s.x, s.y, x, y);
    if (d < 1) return Promise.resolve();
    const isPoi = s.texture.key === 'poi';
    if (Math.abs(x - s.x) > 1) s.setFlipX(x < s.x);
    s.play(walkAnim ?? (isPoi ? 'p-walk' : 'm-walk'));
    return new Promise<void>(r => this.tweens.add({
      targets: s, x, y, duration: (d / speed) * 1000,
      onUpdate: () => s.setDepth(s.y),
      onComplete: () => { s.play(idleAnim ?? (isPoi ? 'p-idle' : 'm-idle')); r(); }
    }));
  }

  emote(s: Phaser.GameObjects.Sprite | { x: number; y: number }, text: string, color = '#ffffff', dy = 84) {
    const t = this.add.text(s.x, s.y - dy, text, {
      fontFamily: 'Lilita One', fontSize: '28px', color, stroke: '#1b1325', strokeThickness: 7, resolution: 3
    }).setOrigin(0.5).setDepth(10002).setScale(0.3);
    this.tweens.add({ targets: t, scale: 1, duration: 220, ease: 'Back.easeOut' });
    this.tweens.add({ targets: t, alpha: 0, y: t.y - 14, delay: 1100, duration: 400, onComplete: () => t.destroy() });
  }

  float(x: number, y: number, key: string, frame?: string, scale = 1) {
    const i = this.add.image(x, y, key, frame).setScale(scale / RES).setDepth(10002);
    this.tweens.add({ targets: i, y: y - 30, alpha: 0, duration: 1100, ease: 'Sine.easeOut', onComplete: () => i.destroy() });
  }

  shake(ms = 260, k = 0.008) { this.cameras.main.shake(ms, k); }
  flash(ms = 180) { this.cameras.main.flash(ms, 255, 255, 255); }

  goto(map: MapName, spawn: string) {
    if (this.leaving) return;
    this.leaving = true;
    input.setAction(null);
    sfx.door();
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
