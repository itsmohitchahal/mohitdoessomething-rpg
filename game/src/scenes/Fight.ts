import Phaser from 'phaser';
import { hazeLevel } from '../state';
import { paintGround } from '../px/terrain';
import { clock, grade } from '../daytime';
import { monsterById, pickSkill, type Monster, type Skill } from '../px/monsters';
import { ui, type Line } from '../ui';
import { sfx } from '../audio';

const S = 4;
const DPR = () => Math.min(window.devicePixelRatio || 1, 2.5);
const BW = 420, BH = 600;
const MAX_HP = 20;

export type FightResult = 'win' | 'friend' | 'run';
type Menu = 'fight' | 'skill' | 'poi' | 'run';
type Sub = 'glasses' | 'coke' | 'flip' | 'blink' | 'groom' | 'loaf' | 'back';

const ATTACKS = [
  'Mohit throws a punch he saw at the gym.',
  'Mohit swings his phone at it. (3% battery.)',
  'Mohit whacks it with his Metro card.',
  'Mohit flails wildly with both arms.',
  'Mohit kicks. Mostly air, partly monster.'
];

/** A rainy-street fight against one of the monsters. PoiPoi helps, but only by being a cat. */
export class Fight extends Phaser.Scene {
  private done!: (r: FightResult) => void;
  private foe!: Monster;
  private mon!: Phaser.GameObjects.Sprite;
  private mohit!: Phaser.GameObjects.Sprite;
  private poi!: Phaser.GameObjects.Sprite;
  private drops: Phaser.GameObjects.Image[] = [];
  private ui = document.querySelector('#battleui') as HTMLElement;

  private hp = MAX_HP;
  private foeHp = 0;
  private trust = 0;
  private cokes = 2;
  private st = { stun: false, burn: 0, weaken: 0, blind: 0, calm: 0 };
  private fst = { guard: 0, evade: false, dazed: false };

  constructor() { super('Fight'); }

  init(data: { done: (r: FightResult) => void; foe: string }) {
    this.done = data.done;
    this.foe = monsterById(data.foe);
    this.hp = MAX_HP; this.foeHp = this.foe.hp; this.trust = 0; this.cokes = 2; this.drops = [];
    this.st = { stun: false, burn: 0, weaken: 0, blind: 0, calm: 0 };
    this.fst = { guard: 0, evade: false, dazed: false };
  }

  create() {
    const cam = this.cameras.main;
    cam.setBackgroundColor('#140d1f');
    if (this.renderer.type === Phaser.WEBGL) cam.postFX.addColorMatrix().saturate(-0.42 * hazeLevel());
    this.fit();
    this.scale.on('resize', this.fit, this);
    this.events.once('shutdown', () => this.scale.off('resize', this.fit, this));

    if (!this.textures.exists('fight-bg')) {
      const rows = Array.from({ length: 16 }, (_, j) => (j < 3 ? 'p' : j === 3 ? 'f' : j < 9 ? 'r' : j === 9 ? 'f' : 'p').repeat(34));
      this.textures.addCanvas('fight-bg', paintGround(rows, 717).cv);
    }
    this.add.image(BW / 2, -40, 'fight-bg').setOrigin(0.5, 0).setScale(S);
    this.add.image(60, 150, 'pix-pole').setOrigin(0.5, 1).setScale(S * 0.75).setAlpha(0.9);
    this.add.image(380, 160, 'pix-neem').setOrigin(0.5, 1).setScale(S * 0.7).setAlpha(0.9);
    const shade = this.add.graphics();
    shade.fillStyle(0x140d1f, 0.35).fillEllipse(300, 318, 170, 30).fillEllipse(150, 528, 220, 34);

    const g = grade(clock.min, false);
    this.add.rectangle(-900, -600, BW + 1800, BH + 1200, g.tint).setOrigin(0).setBlendMode(Phaser.BlendModes.MULTIPLY).setDepth(90);
    this.add.rectangle(-900, -600, BW + 1800, BH + 1200, 0xaeb8d4, 0.85).setOrigin(0).setBlendMode(Phaser.BlendModes.MULTIPLY).setDepth(91);
    this.add.rectangle(-900, -600, BW + 1800, BH + 1200, 0x140d1f, 0.15).setOrigin(0).setDepth(92);

    this.mon = this.add.sprite(300, 320, 'mon-' + this.foe.id, 'a').setOrigin(0.5, 0.95).setScale(S + 1).setDepth(10);
    this.mon.play('mon-' + this.foe.id);
    this.tweens.add({ targets: this.mon, y: 314, duration: 900, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    this.mohit = this.add.sprite(110, 530, 'mohit', 'bIdle').setOrigin(0.5, 0.985).setScale(S).setDepth(10);
    this.poi = this.add.sprite(210, 540, 'poi', 'idle').setOrigin(0.5, 0.94).setScale(S).setDepth(11);
    this.poi.play('p-idle');

    for (let i = 0; i < 90; i++) {
      this.drops.push(this.add.image(Math.random() * (BW + 400) - 200, Math.random() * BH - 100, 'raindrop').setScale(S).setDepth(95).setAlpha(0.6));
    }

    this.renderUI();
    this.run();
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
    $('#bhp').classList.toggle('low', this.hp <= 6);
    $('#bhpn').textContent = `${this.hp} / ${MAX_HP}`;
    const tags = [this.st.burn && 'BURN', this.st.weaken && 'SOAKED', this.st.blind && 'BLIND', this.st.calm && 'CALM'].filter(Boolean);
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
        await this.hurtMohit(2, 'The chai burn stings.');
        if (this.hp <= 0) return this.lose();
      }
      let acted = true;
      if (this.st.stun) {
        this.st.stun = false;
        await this.say("Mohit can't move this turn!");
      } else {
        const r = await this.turn();
        if (r === 'end') return;
        acted = r === 'acted';
      }
      if (!acted) continue;
      if (this.foeHp <= 0) return this.win();
      if (this.st.weaken) this.st.weaken--;
      if (this.st.blind) this.st.blind--;
      this.refresh();
      await this.foeTurn();
      if (this.hp <= 0) return this.lose();
      if (this.foeHp <= 0) return this.win();
    }
  }

  /** Mohit's turn. 'back' means he backed out of a sub-menu and picks again. */
  private async turn(): Promise<'acted' | 'back' | 'end'> {
    const c = await ui.choose<Menu>([
      { label: 'FIGHT', value: 'fight' }, { label: 'POIPOI', value: 'poi' },
      { label: 'SKILL', value: 'skill' }, { label: 'RUN', value: 'run' }
    ], 'battle');
    if (c === 'fight') { await this.attack(); return 'acted'; }
    if (c === 'run') {
      await this.say('Mohit tries to run...');
      if (Math.random() < this.foe.runChance) {
        sfx.whoosh();
        this.tween({ targets: [this.mohit, this.poi], x: '-=220', duration: 500 });
        await this.say('...and gets away!');
        this.finish('run');
        return 'end';
      }
      await this.say("...but it cuts him off!");
      return 'acted';
    }
    if (c === 'skill') {
      const s = await ui.choose<Sub>([
        { label: 'FIX GLASSES', value: 'glasses' }, { label: `COKE ZERO ×${this.cokes}`, value: 'coke' },
        { label: 'HAIR FLIP', value: 'flip' }, { label: 'BACK', value: 'back' }
      ], 'battle');
      if (s === 'back') return 'back';
      if (s === 'coke' && !this.cokes) { await this.say('No Coke Zero left. Tragic.'); return 'back'; }
      await this.skill(s);
      return 'acted';
    }
    const s = await ui.choose<Sub>([
      { label: 'SLOW BLINK', value: 'blink' }, { label: 'OFFER GROOM', value: 'groom' },
      { label: 'LOAF NEARBY', value: 'loaf' }, { label: 'BACK', value: 'back' }
    ], 'battle');
    if (s === 'back') return 'back';
    const r = await this.poiMove(s);
    return r ? 'end' : 'acted';
  }

  private async attack() {
    const m = this.mohit, mon = this.mon;
    await this.say(Phaser.Utils.Array.GetRandom(ATTACKS));
    m.play('m-walk-up');
    sfx.whoosh();
    await this.tween({ targets: m, x: 250, y: 380, duration: 260, ease: 'Quad.easeIn' });
    const miss = this.fst.evade || Math.random() < 0.1 + (this.st.blind ? 0.35 : 0);
    if (miss) {
      this.tween({ targets: mon, x: mon.x + 40, duration: 140, yoyo: true });
      this.pop(mon.x, mon.y - 130, 'MISS');
    } else {
      const crit = Math.random() < 0.12;
      let d = Phaser.Math.Between(3, 5) * (crit ? 2 : 1);
      if (this.st.weaken) d = Math.ceil(d / 2);
      if (this.fst.guard) d = Math.ceil(d / 2);
      this.foeHp = Math.max(0, this.foeHp - d);
      sfx.hit(); this.cameras.main.shake(160, 0.01);
      mon.setTintFill(0xffffff); this.time.delayedCall(90, () => mon.clearTint());
      this.pop(mon.x, mon.y - 130, crit ? `CRIT ${d}` : `${d}`, crit ? '#ffc23c' : '#ffffff', crit ? 36 : 30);
    }
    this.fst.evade = false;
    if (this.fst.guard) this.fst.guard--;
    m.play('m-walk');
    await this.tween({ targets: m, x: 110, y: 530, duration: 300 });
    m.stop(); m.setFrame('bIdle');
    this.refresh();
    if (miss) await this.say('It missed!');
  }

  private async skill(s: Sub) {
    const m = this.mohit;
    if (s === 'glasses') {
      m.setFrame('idle');
      await this.say('Mohit pushes his glasses back up his nose. Everything is clear again.');
      this.st.blind = 0; this.st.weaken = 0;
      sfx.sparkle();
      this.heal(2);
    } else if (s === 'coke') {
      this.cokes--;
      await this.say('Mohit cracks open a Coke Zero. *tssss*');
      sfx.nom();
      this.heal(7);
    } else {
      m.setFrame('sIdle');
      await this.say('Mohit flips his hair, dramatically.');
      sfx.sparkle();
      if (Math.random() < 0.5) {
        this.fst.dazed = true;
        this.pop(this.mon.x, this.mon.y - 130, 'DAZZLED', '#ffc23c', 26);
        await this.say(`The ${this.foe.name} is stunned by the volume.`);
      } else await this.say(`The ${this.foe.name} is not impressed.`);
    }
    m.setFrame('bIdle');
    this.refresh();
  }

  /** PoiPoi can't hurt anyone. He makes friends instead. Returns true when the fight is over. */
  private async poiMove(s: Sub) {
    const p = this.poi, mon = this.mon;
    if (s === 'loaf') {
      p.play('p-loaf');
      await this.say('PoiPoi loafs down right next to Mohit. Very calming.');
      this.st.calm = 2; this.trust += 0.1;
      this.pop(p.x, p.y - 80, '♥', '#ff4f8b', 30); sfx.heart();
      this.refresh();
      return false;
    }
    if (s === 'groom') {
      p.play('p-walk'); p.setFlipX(false);
      await this.tween({ targets: p, x: mon.x - 70, y: mon.y + 30, duration: 600 });
      p.stop(); p.setFrame('eat');
      await this.say(`PoiPoi gives the ${this.foe.name} a few careful licks.`);
      this.trust += 0.2;
      this.pop(mon.x, mon.y - 130, '♥', '#ff4f8b', 30); sfx.heart();
      p.play('p-walk'); p.setFlipX(true);
      await this.tween({ targets: p, x: 210, y: 540, duration: 600 });
      p.setFlipX(false); p.play('p-idle');
      await this.say("It doesn't know what to do with that.");
      return false;
    }
    p.stop(); p.setFrame('blink');
    await this.say(`PoiPoi gives the ${this.foe.name} a long, slow blink...`);
    await this.wait(400);
    p.play('p-idle');
    const chance = Math.min(0.95, this.foe.befriend + this.trust + (1 - this.foeHp / this.foe.hp) * 0.25);
    if (Math.random() < chance) {
      this.pop(mon.x, mon.y - 130, '♥', '#ff4f8b', 38); sfx.heart();
      await this.say('...and it blinks back!');
      sfx.fanfare();
      this.tweens.killTweensOf(mon);
      await this.tween({ targets: mon, alpha: 0, y: mon.y - 40, duration: 900 });
      await this.say(this.foe.friend);
      this.finish('friend');
      return true;
    }
    this.trust += 0.1;
    await this.say("It stares back. Doesn't get it. Yet.");
    return false;
  }

  private async foeTurn() {
    if (this.fst.dazed) { this.fst.dazed = false; await this.say(`The ${this.foe.name} is still dazzled and does nothing.`); return; }
    const k = pickSkill(this.foe);
    await this.say(`${this.foe.name} uses <b>${k.name}</b>!`);
    await this.apply(k);
    if (this.st.calm) this.st.calm--;
    this.refresh();
  }

  private async apply(k: Skill) {
    const fx = k.fx, mon = this.mon;
    if (fx.dmg) {
      sfx.whoosh();
      await this.tween({ targets: mon, x: 200, y: 420, duration: 200, yoyo: true, ease: 'Quad.easeIn' });
      let d = this.rand(fx.dmg);
      if (this.st.calm) d = Math.ceil(d / 2);
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

  private heal(n: number) {
    this.hp = Math.min(MAX_HP, this.hp + n);
    this.pop(this.mohit.x, this.mohit.y - 150, `+${n}`, '#7ef0a0');
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
    await ui.overlay(
      `<h2>GAME OVER</h2><p>Mohit was defeated by a ${this.foe.name}.</p><p class="small">PoiPoi sits next to him in the rain until he gets up.</p>`,
      [{ label: 'Try again', value: 'retry', primary: true }], 'gameover');
    this.scene.restart({ done: this.done, foe: this.foe.id });
  }

  private finish(r: FightResult) {
    this.ui.hidden = true; this.ui.innerHTML = '';
    this.scene.stop();
    this.done(r);
  }
}
