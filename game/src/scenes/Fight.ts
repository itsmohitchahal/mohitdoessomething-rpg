import Phaser from 'phaser';
import { hazeLevel, state, MAX_HP } from '../state';
import { paintGround } from '../px/terrain';
import { clock, grade, isRainDay } from '../daytime';
import { monsterById, pickSkill, type Monster, type Skill } from '../px/monsters';
import { STRAY_LOOKS } from '../px/sprites';
import { ui, type Line } from '../ui';
import { sfx } from '../audio';

const S = 4;
const DPR = () => Math.min(window.devicePixelRatio || 1, 2.5);
const BW = 420, BH = 600;
const THROW = 3, PUNCH = 5, GROOM = 30;
const MOHIT_AT = { x: 110, y: 530 }, POI_AT = { x: 210, y: 540 };

export type FightResult = 'win' | 'friend' | 'run';
export type Place = 'street' | 'park';
type Start = { hp: number; bottles: number };
type FightData = { done: (r: FightResult) => void; foe: string; place?: Place; losses?: number; start?: Start; skip?: boolean };

const P = (text: string) => ({ who: 'POIPOI', text });
const GROOMS = [
  "PoiPoi grooms Mohit's hair. Thoroughly. Against the grain.",
  "PoiPoi licks Mohit's hand until it is very clean and slightly sore.",
  'PoiPoi climbs onto Mohit and grooms his eyebrow. Just the one.',
  "PoiPoi gives Mohit's ear a long, wet, serious lick."
];
const MISSES = ["It stares back. It doesn't get it.", 'It blinks... no, that was just the wind.', 'It does not want to be friends. Yet.', 'PoiPoi is not offended. PoiPoi is never offended.'];

/** A fight against one of the monsters. Mohit throws things and punches (badly); PoiPoi befriends and grooms. */
export class Fight extends Phaser.Scene {
  private done!: (r: FightResult) => void;
  private foe!: Monster;
  private place: Place = 'street';
  private losses = 0;
  private start: Start = { hp: MAX_HP, bottles: 0 };
  private skip = false;
  private mon!: Phaser.GameObjects.Sprite;
  private mohit!: Phaser.GameObjects.Sprite;
  private poi!: Phaser.GameObjects.Sprite;
  private drops: Phaser.GameObjects.Image[] = [];
  private ui = document.querySelector('#battleui') as HTMLElement;

  private hp = MAX_HP;
  private foeHp = 0;
  private bottles = 0;
  private punches = 0;  // punches in a row
  private sore = 0;     // moves until Mohit's knuckles are ready to punch again
  private st = { stun: false, burn: 0, weaken: 0, blind: 0 };
  private fst = { guard: 0, evade: false };

  constructor() { super('Fight'); }

  init(data: FightData) {
    this.done = data.done;
    this.foe = monsterById(data.foe);
    this.place = data.place ?? 'street';
    this.losses = data.losses ?? 0;
    this.start = data.start ?? { hp: Math.max(1, state.hp), bottles: state.bottles };
    this.skip = !!data.skip;
    this.hp = this.start.hp; this.bottles = this.start.bottles;
    this.foeHp = this.foe.hp; this.punches = 0; this.sore = 0; this.drops = [];
    this.st = { stun: false, burn: 0, weaken: 0, blind: 0 };
    this.fst = { guard: 0, evade: false };
  }

  create() {
    const cam = this.cameras.main;
    cam.setBackgroundColor('#140d1f');
    if (this.renderer.type === Phaser.WEBGL) cam.postFX.addColorMatrix().saturate(-0.42 * hazeLevel());
    this.fit();
    this.scale.on('resize', this.fit, this);
    this.events.once('shutdown', () => this.scale.off('resize', this.fit, this));

    const bg = 'fight-bg-' + this.place;
    if (!this.textures.exists(bg)) {
      const rows = this.place === 'park'
        ? Array.from({ length: 16 }, () => 'g'.repeat(34))
        : Array.from({ length: 16 }, (_, j) => (j < 3 ? 'p' : j === 3 ? 'f' : j < 9 ? 'r' : j === 9 ? 'f' : 'p').repeat(34));
      this.textures.addCanvas(bg, paintGround(rows, 717).cv);
    }
    this.add.image(BW / 2, -40, bg).setOrigin(0.5, 0).setScale(S);
    if (this.place === 'park') {
      this.add.image(380, 170, 'pix-neem').setOrigin(0.5, 1).setScale(S * 0.75).setAlpha(0.9);
      this.add.image(90, 262, 'pix-swing').setOrigin(0.5, 1).setScale(S * 0.7).setAlpha(0.9);
      this.add.image(200, 200, 'pix-bench').setOrigin(0.5, 1).setScale(S * 0.7).setAlpha(0.9);
    } else {
      this.add.image(60, 150, 'pix-pole').setOrigin(0.5, 1).setScale(S * 0.75).setAlpha(0.9);
      this.add.image(380, 160, 'pix-neem').setOrigin(0.5, 1).setScale(S * 0.7).setAlpha(0.9);
    }
    const shade = this.add.graphics();
    shade.fillStyle(0x140d1f, 0.35).fillEllipse(300, 318, 170, 30).fillEllipse(150, 528, 220, 34);

    const rain = isRainDay();
    const g = grade(clock.min, false);
    this.add.rectangle(-900, -600, BW + 1800, BH + 1200, g.tint).setOrigin(0).setBlendMode(Phaser.BlendModes.MULTIPLY).setDepth(90);
    if (rain) this.add.rectangle(-900, -600, BW + 1800, BH + 1200, 0xaeb8d4, 0.85).setOrigin(0).setBlendMode(Phaser.BlendModes.MULTIPLY).setDepth(91);
    this.add.rectangle(-900, -600, BW + 1800, BH + 1200, 0x140d1f, 0.15).setOrigin(0).setDepth(92);

    this.mon = this.add.sprite(300, 320, 'mon-' + this.foe.id, 'a').setOrigin(0.5, 0.95).setScale(S + 1).setDepth(10);
    this.mon.play('mon-' + this.foe.id);
    this.tweens.add({ targets: this.mon, y: 314, duration: 900, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    this.mohit = this.add.sprite(MOHIT_AT.x, MOHIT_AT.y, 'mohit', 'bIdle').setOrigin(0.5, 0.985).setScale(S).setDepth(10);
    this.poi = this.add.sprite(POI_AT.x, POI_AT.y, 'poi', 'idle').setOrigin(0.5, 0.94).setScale(S).setDepth(11);
    this.poi.play('p-idle');

    if (rain) for (let i = 0; i < 90; i++) {
      this.drops.push(this.add.image(Math.random() * (BW + 400) - 200, Math.random() * BH - 100, 'raindrop').setScale(S).setDepth(95).setAlpha(0.6));
    }

    this.renderUI();
    if (this.skip) this.catGods(); else this.run();
  }

  update(_t: number, dms: number) {
    const dt = Math.min(dms, 50) / 1000;
    for (const d of this.drops) {
      d.x -= 160 * dt; d.y += 900 * dt;
      if (d.y > BH + 120) { d.y = -140 - Math.random() * 60; d.x = Math.random() * (BW + 400) - 160; }
    }
  }

  private fit() {
    const cam = this.cameras.main, dpr = DPR();
    const cssW = this.scale.width / dpr, cssH = this.scale.height / dpr;
    const z = Math.min(cssW / BW, (cssH - 180) / BH);
    cam.setZoom(z * dpr);
    cam.centerOn(BW / 2, BH / 2 + 90 / z);
  }

  private renderUI() {
    this.ui.innerHTML = `
      <div class="b-box b-enemy"><b>${this.foe.name.toUpperCase()}</b><div class="hp"><i id="fhp" style="width:100%"></i></div><span id="fhpn"></span></div>
      <div class="b-box b-player"><b>MOHIT</b><div class="hp"><i id="bhp" style="width:100%"></i></div><span id="bhpn"></span><em id="bst"></em></div>`;
    this.ui.hidden = false;
    this.refresh();
  }

  private refresh() {
    const $ = (s: string) => document.querySelector(s) as HTMLElement;
    $('#fhp').style.width = (this.foeHp / this.foe.hp) * 100 + '%';
    $('#fhpn').textContent = `HP ${this.foeHp} / ${this.foe.hp}`;
    $('#bhp').style.width = (this.hp / MAX_HP) * 100 + '%';
    $('#bhp').classList.toggle('low', this.hp <= 30);
    $('#bhpn').textContent = `${this.hp} / ${MAX_HP}`;
    const tags = [this.sore && 'SORE KNUCKLES', this.st.burn && 'BURN', this.st.weaken && 'SOAKED', this.st.blind && 'BLIND'].filter(Boolean);
    $('#bst').textContent = tags.join(' · ');
  }

  private say(l: Line[] | Line) { return ui.say(l); }
  private wait(ms: number) { return new Promise<void>(r => this.time.delayedCall(ms, r)); }
  private tween(cfg: Phaser.Types.Tweens.TweenBuilderConfig) { return new Promise<void>(r => this.tweens.add({ ...cfg, onComplete: () => r() })); }
  private pop(x: number, y: number, text: string, color = '#ffffff', size = 30) {
    const t = this.add.text(x, y, text, { fontFamily: '"Pixelify Sans", monospace', fontSize: size + 'px', color, stroke: '#2b2430', strokeThickness: 7 })
      .setOrigin(0.5).setDepth(100).setScale(0.3);
    this.tweens.add({ targets: t, scale: 1, duration: 200, ease: 'Back.easeOut' });
    this.tweens.add({ targets: t, alpha: 0, y: y - 20, delay: 900, duration: 400, onComplete: () => t.destroy() });
  }
  private rand([a, b]: [number, number]) { return Phaser.Math.Between(a, b); }

  private async run() {
    await this.wait(300);
    sfx.stinger();
    await this.say([this.foe.intro, `A ${this.foe.name} blocks the way!`]);
    for (;;) {
      if (this.st.burn) {
        this.st.burn--;
        await this.hurtMohit(10, 'The chai burn stings.');
        if (this.hp <= 0) return this.lose();
      }
      if (this.st.stun) {
        this.st.stun = false;
        await this.say("Mohit can't move this turn!");
        this.rest();
      } else await this.mohitTurn();
      if (this.foeHp <= 0) return this.win();
      if (await this.poiTurn()) return;
      if (this.st.weaken) this.st.weaken--;
      if (this.st.blind) this.st.blind--;
      this.refresh();
      await this.foeTurn();
      if (this.hp <= 0) return this.lose();
      if (this.foeHp <= 0) return this.win();
    }
  }

  /** A move that wasn't a punch: the punch streak resets and sore knuckles recover a little. */
  private rest() {
    this.punches = 0;
    if (this.sore) this.sore--;
  }

  private async mohitTurn() {
    for (;;) {
      const b = this.bottles, sore = this.sore;
      const c = await ui.choose<'throw' | 'punch' | 'shake'>(b === 0 && sore
        ? [{ label: 'SHAKE OUT KNUCKLES', value: 'shake' }]
        : [{ label: `THROW BOTTLE ×${b}`, value: 'throw' }, { label: sore ? `PUNCH (SORE ${sore})` : 'PUNCH', value: 'punch' }],
      'battle', "MOHIT'S MOVE");
      if (c === 'throw' && !b) { await this.say(['No empty bottles left.', 'Mohit pats his pockets anyway. Nothing.']); continue; }
      if (c === 'punch' && sore) {
        await this.say([`Mohit's knuckles still hurt. ${sore === 1 ? 'One more move' : 'Two more moves'} before he can punch again.`, 'These knuckles are that of a pacifist.']);
        continue;
      }
      if (c === 'shake') {
        await this.say(['No bottles. No knuckles.', 'Mohit shakes out his hand and blows on it. Very intimidating.']);
        this.rest();
      } else if (c === 'throw') {
        this.bottles--;
        await this.throwBottle();
        this.rest();
      } else {
        await this.punch();
        if (++this.punches >= 2) {
          this.punches = 0; this.sore = 2;
          this.refresh();
          await this.say(['Ow. OW.', "Mohit's knuckles start to hurt.", '<b>These knuckles are that of a pacifist.</b>', "He can't punch for the next 2 moves."]);
        }
      }
      this.refresh();
      return;
    }
  }

  /** Damage from one of Mohit's attacks, or 0 for a miss. */
  private landed(base: number) {
    const miss = this.fst.evade || Math.random() < 0.1 + (this.st.blind ? 0.35 : 0);
    this.fst.evade = false;
    if (miss) return 0;
    let d = base;
    if (this.st.weaken) d = Math.ceil(d / 2);
    if (this.fst.guard) { d = Math.ceil(d / 2); this.fst.guard--; }
    return d;
  }
  private async hitFoe(d: number) {
    const mon = this.mon;
    if (!d) {
      this.tween({ targets: mon, x: mon.x + 40, duration: 140, yoyo: true });
      this.pop(mon.x, mon.y - 130, 'MISS');
      return;
    }
    this.foeHp = Math.max(0, this.foeHp - d);
    sfx.hit(); this.cameras.main.shake(160, 0.01);
    mon.setTintFill(0xffffff); this.time.delayedCall(90, () => mon.clearTint());
    this.pop(mon.x, mon.y - 130, `${d}`);
    this.refresh();
  }

  private async throwBottle() {
    const m = this.mohit, mon = this.mon;
    await this.say(Phaser.Utils.Array.GetRandom([
      'Mohit throws an empty Coke Zero bottle!', 'Mohit lobs an empty Coke Zero bottle. Recycling, sort of.', 'Mohit hurls an empty bottle with his whole chest.'
    ]));
    this.tween({ targets: m, y: m.y - 14, duration: 120, yoyo: true, ease: 'Quad.easeOut' });
    sfx.whoosh();
    const b = this.add.image(m.x + 20, m.y - 90, 'pix-bottle').setScale(S).setDepth(20);
    const d = this.landed(THROW);
    const tx = d ? mon.x : mon.x + 90, ty = d ? mon.y - 60 : mon.y - 20;
    const arc = { t: 0 };
    await this.tween({
      targets: arc, t: 1, duration: 520, ease: 'Sine.easeIn',
      onUpdate: () => { const t = arc.t; b.setPosition(m.x + 20 + (tx - m.x - 20) * t, m.y - 90 + (ty - m.y + 90) * t - Math.sin(Math.PI * t) * 120); b.angle = t * 720; }
    });
    if (d) {
      sfx.blip();
      this.tween({ targets: b, y: b.y + 140, x: b.x - 30, angle: b.angle + 300, alpha: 0, duration: 500, onComplete: () => b.destroy() });
    } else this.tween({ targets: b, alpha: 0, duration: 300, onComplete: () => b.destroy() });
    await this.hitFoe(d);
    if (!d) await this.say('It missed!');
  }

  private async punch() {
    const m = this.mohit;
    await this.say(Phaser.Utils.Array.GetRandom(['Mohit throws a punch he saw at the gym.', 'Mohit punches! With his eyes closed.', 'Mohit winds up a punch. It takes a while.']));
    m.play('m-walk-up');
    sfx.whoosh();
    await this.tween({ targets: m, x: 250, y: 380, duration: 260, ease: 'Quad.easeIn' });
    const d = this.landed(PUNCH);
    await this.hitFoe(d);
    m.play('m-walk');
    await this.tween({ targets: m, x: MOHIT_AT.x, y: MOHIT_AT.y, duration: 300 });
    m.stop(); m.setFrame('bIdle');
    if (!d) await this.say('It missed!');
  }

  /** PoiPoi can't hurt anyone. He makes friends and grooms instead. Returns true when the fight is over. */
  private async poiTurn(): Promise<boolean> {
    for (;;) {
      const c = await ui.choose<'befriend' | 'groom'>([
        { label: 'BEFRIEND', value: 'befriend' }, { label: 'GROOM', value: 'groom' }
      ], 'battle', "POIPOI'S MOVE");
      if (c === 'groom') {
        const who = await ui.choose<'mohit' | 'back'>([{ label: 'MOHIT', value: 'mohit' }, { label: 'BACK', value: 'back' }], 'battle', 'GROOM WHO?');
        if (who === 'back') continue;
        await this.groom();
        return false;
      }
      return this.befriend();
    }
  }

  private async groom() {
    const p = this.poi, m = this.mohit;
    p.play('p-walk'); p.setFlipX(true);
    await this.tween({ targets: p, x: m.x + 46, y: m.y + 4, duration: 400 });
    p.stop(); p.setFrame('eat');
    for (let i = 0; i < 3; i++) { sfx.nom(); this.pop(m.x + 10, m.y - 120 - i * 6, 'lick', '#ffffff', 20); await this.wait(260); }
    await this.say(Phaser.Utils.Array.GetRandom(GROOMS));
    const before = this.hp;
    this.hp = Math.min(MAX_HP, this.hp + GROOM);
    this.pop(m.x, m.y - 150, `+${this.hp - before}`, '#7ef0a0'); sfx.heart();
    this.refresh();
    p.play('p-walk'); p.setFlipX(false);
    await this.tween({ targets: p, x: POI_AT.x, y: POI_AT.y, duration: 400 });
    p.play('p-idle');
    await this.say(this.hp - before < GROOM ? 'Mohit is fully groomed. HP is full.' : `Mohit feels better. +${GROOM} HP.`);
  }

  private async befriend() {
    const p = this.poi, mon = this.mon;
    p.stop(); p.setFrame('blink');
    await this.say(`PoiPoi gives the ${this.foe.name} a long, slow blink...`);
    await this.wait(400);
    p.play('p-idle');
    if (Math.random() < this.foe.befriend) {
      this.pop(mon.x, mon.y - 130, '♥', '#ff4f8b', 38); sfx.heart();
      await this.say('...and it blinks back!');
      sfx.fanfare();
      this.tweens.killTweensOf(mon);
      await this.tween({ targets: mon, alpha: 0, y: mon.y - 40, duration: 900 });
      await this.say(this.foe.friend);
      this.finish('friend');
      return true;
    }
    await this.say(Phaser.Utils.Array.GetRandom(MISSES));
    return false;
  }

  private async foeTurn() {
    const k = pickSkill(this.foe);
    await this.say(`${this.foe.name} uses <b>${k.name}</b>!`);
    await this.apply(k);
    this.refresh();
  }

  private async apply(k: Skill) {
    const fx = k.fx, mon = this.mon;
    if (fx.dmg) {
      sfx.whoosh();
      await this.tween({ targets: mon, x: 200, y: 420, duration: 200, yoyo: true, ease: 'Quad.easeIn' });
      const d = this.rand(fx.dmg);
      await this.hurtMohit(d, k.text);
      if (fx.drain) { this.foeHp = Math.min(this.foe.hp, this.foeHp + d); this.pop(mon.x, mon.y - 130, `+${d}`, '#7ef0a0'); }
    } else await this.say(k.text);
    if (fx.stun) this.st.stun = true;
    if (fx.burn) this.st.burn = fx.burn;
    if (fx.weaken) this.st.weaken = fx.weaken;
    if (fx.blind) this.st.blind = fx.blind;
    if (fx.guard) { this.fst.guard = fx.guard; this.pop(mon.x, mon.y - 130, 'GUARD', '#9fd0ff', 26); }
    if (fx.evade) this.fst.evade = true;
    if (fx.heal) { this.foeHp = Math.min(this.foe.hp, this.foeHp + fx.heal); this.pop(mon.x, mon.y - 130, `+${fx.heal}`, '#7ef0a0'); sfx.sparkle(); }
    if (fx.self) {
      this.foeHp = Math.max(0, this.foeHp - fx.self);
      mon.setTintFill(0xffe56b); this.time.delayedCall(120, () => mon.clearTint());
      this.pop(mon.x, mon.y - 130, `${fx.self}`, '#ffe56b');
    }
  }

  private async hurtMohit(d: number, text: string) {
    const m = this.mohit;
    this.hp = Math.max(0, this.hp - d);
    sfx.hit(); this.cameras.main.shake(220, 0.014);
    m.setFrame('hurt');
    this.pop(m.x, m.y - 150, `-${d}`, '#ff4f8b', 32);
    this.refresh();
    await this.say(text);
    m.setFrame('bIdle');
  }

  private async win() {
    const mon = this.mon;
    this.tweens.killTweensOf(mon);
    sfx.thud();
    await this.tween({ targets: mon, scaleY: 0, alpha: 0, duration: 600, ease: 'Quad.easeIn' });
    await this.say(this.foe.win);
    sfx.fanfare();
    this.finish('win');
  }

  private async lose() {
    const m = this.mohit;
    m.setFrame('hurt');
    await this.tween({ targets: m, angle: -84, duration: 300, ease: 'Bounce.easeOut' });
    await this.say(`Mohit was defeated by a ${this.foe.name}.`);
    sfx.gameOver();
    this.ui.hidden = true;
    const losses = this.losses + 1;
    const buttons: { label: string; value: 'retry' | 'skip'; primary?: boolean }[] = [{ label: 'Try again', value: 'retry', primary: true }];
    if (losses >= 2) buttons.push({ label: 'Skip this fight<small>PoiPoi will call onto the cat gods to save you from this</small>', value: 'skip' });
    const c = await ui.overlay(
      `<h2>GAME OVER</h2><p>Mohit was defeated by a ${this.foe.name}.</p><p class="small">PoiPoi sits next to him until he gets up. The fight starts over, with the HP and bottles Mohit had at the start.</p>`,
      buttons, 'gameover');
    this.scene.restart({ done: this.done, foe: this.foe.id, place: this.place, losses, start: this.start, skip: c === 'skip' } satisfies FightData);
  }

  /** PoiPoi makes a phone call. The neighbourhood cats answer. */
  private async catGods() {
    const p = this.poi, mon = this.mon;
    await this.wait(400);
    await this.say(['The monster is back.', 'PoiPoi has had enough of this.']);
    p.stop(); p.setFrame('idle'); p.setFlipX(false);
    const phone = this.add.image(p.x + 30, p.y - 26, 'pix-phone').setScale(S).setDepth(12).setAlpha(0);
    await this.tween({ targets: phone, alpha: 1, y: phone.y - 8, duration: 300, ease: 'Back.easeOut' });
    await this.say(['PoiPoi pulls out a phone.', 'Mohit has never seen this phone before.']);
    for (let i = 0; i < 3; i++) { sfx.blip(); this.time.delayedCall(120, () => sfx.blip()); this.pop(phone.x + 20, phone.y - 40, '♪', '#ffc23c', 22); await this.wait(600); }
    for (const t of ['meow?', 'meow meow.', 'MEOW.', 'mrrp. meow.']) {
      sfx.meow(true);
      this.pop(p.x, p.y - 90, t, '#ffffff', 22);
      await this.wait(750);
    }
    await this.say(P('Meow meow. Meow? ...Meow.'));
    await this.tween({ targets: phone, alpha: 0, y: phone.y + 8, duration: 250 });
    phone.destroy();
    p.setFrame('blink');
    await this.say('PoiPoi hangs up, puts the phone away, and slow-blinks at Mohit like nothing happened.');
    p.play('p-idle');
    await this.wait(500);
    sfx.thud(); this.cameras.main.shake(500, 0.006);
    await this.say('Something is coming. A lot of somethings.');

    const ring = STRAY_LOOKS.map((_, i) => {
      const a = (i / STRAY_LOOKS.length) * Math.PI * 2;
      return { x: mon.x + Math.cos(a) * 78, y: mon.y + 10 + Math.sin(a) * 34 };
    });
    const cats = STRAY_LOOKS.map((_, i) => {
      const fromLeft = i % 2 === 0;
      const c = this.add.sprite(fromLeft ? -60 : BW + 60, 260 + Math.random() * 300, 'stray' + i, 'walk0').setOrigin(0.5, 0.94).setScale(S).setDepth(15 + i);
      c.setFlipX(!fromLeft).play(`stray${i}-walk`);
      return c;
    });
    await Promise.all(cats.map((c, i) => this.tween({ targets: c, x: ring[i].x, y: ring[i].y, duration: 700 + i * 90, ease: 'Quad.easeOut' })));
    cats.forEach((c, i) => { c.stop(); c.setFrame('idle'); c.setFlipX(ring[i].x > mon.x); });
    this.tweens.killTweensOf(mon);
    const start = this.foeHp;
    for (let k = 0; k < 14; k++) {
      const c = cats[k % cats.length];
      this.tween({ targets: c, x: c.x + (c.flipX ? -14 : 14), duration: 70, yoyo: true });
      const s = this.add.image(mon.x + Phaser.Math.Between(-40, 40), mon.y - Phaser.Math.Between(30, 110), 'pix-scratch').setScale(S).setDepth(30).setAngle(Phaser.Math.Between(-30, 30));
      this.tweens.add({ targets: s, alpha: 0, duration: 380, delay: 120, onComplete: () => s.destroy() });
      if (k % 3 === 0) this.pop(mon.x + Phaser.Math.Between(-60, 60), mon.y - 150, Phaser.Utils.Array.GetRandom(['scratch', 'SCRATCH', 'scritch']), '#ffffff', 22);
      sfx.rustle(); if (k % 2) sfx.hit();
      mon.setTintFill(0xffffff); this.time.delayedCall(60, () => mon.clearTint());
      this.foeHp = Math.round(start * (1 - (k + 1) / 14));
      this.refresh();
      await this.wait(130);
    }
    sfx.thud();
    await this.tween({ targets: mon, scaleY: 0, alpha: 0, duration: 500, ease: 'Quad.easeIn' });
    await this.say(['Scratch-scratch.', `The ${this.foe.name} is gone.`]);
    cats.forEach((c, i) => {
      c.setFlipX(false).play(`stray${i}-walk`);
      this.tweens.add({ targets: c, x: BW + 120 + i * 30, y: 120 + i * 12, scale: S * 0.45, duration: 1300 + i * 120, delay: i * 70, ease: 'Quad.easeIn' });
    });
    sfx.meow(true);
    await this.wait(1700);
    cats.forEach(c => c.destroy());
    await this.say(['The cats run off into the distance.', 'Nobody will ever speak of this.']);
    this.finish('win');
  }

  private finish(r: FightResult) {
    // a skipped fight leaves Mohit exactly as he was before it
    state.hp = this.skip ? this.start.hp : Math.max(1, this.hp);
    state.bottles = this.skip ? this.start.bottles : this.bottles;
    state.save();
    this.ui.hidden = true; this.ui.innerHTML = '';
    this.scene.stop();
    this.done(r);
  }
}
