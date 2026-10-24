import Phaser from 'phaser';
import { RES } from '../art/raster';
import { state, colorLevel } from '../state';
import { ui, type Line } from '../ui';
import { sfx } from '../audio';

const DPR = () => Math.min(window.devicePixelRatio || 1, 2.5);
// The battle is laid out in a fixed 420 x 600 box that is scaled to fit the screen.
const BW = 420, BH = 600;

type Choice = 'fight' | 'hand' | 'items' | 'run';

export class Battle extends Phaser.Scene {
  private done!: (r: string) => void;
  private bag!: Phaser.GameObjects.Sprite;
  private mohit!: Phaser.GameObjects.Sprite;
  private wobble?: Phaser.Time.TimerEvent;
  private ui = document.querySelector('#battleui') as HTMLElement;

  constructor() { super('Battle'); }

  init(data: { done: (r: string) => void }) { this.done = data.done; }

  create() {
    const cam = this.cameras.main;
    cam.setBackgroundColor('#140d1f');
    if (this.renderer.type === Phaser.WEBGL) cam.postFX.addColorMatrix().saturate(colorLevel());
    this.fit();
    this.scale.on('resize', this.fit, this);
    this.events.once('shutdown', () => this.scale.off('resize', this.fit, this));

    // kitchen backdrop, drawn wider than the box so wide screens are covered
    const g = this.add.graphics();
    g.fillStyle(0xcfd8e0).fillRect(-700, -400, BW + 1400, 640);
    g.lineStyle(1, 0xb5c2cc);
    for (let x = -700; x < BW + 700; x += 26) g.lineBetween(x, -400, x, 230);
    for (let y = -400; y < 230; y += 26) g.lineBetween(-700, y, BW + 700, y);
    g.fillStyle(0x9b98a8).fillRect(-700, 226, BW + 1400, 14);
    g.lineStyle(3, 0x1b1325).lineBetween(-700, 226, BW + 700, 226).lineBetween(-700, 240, BW + 700, 240);
    for (let y = 240, r = 0; y < BH + 400; y += 40, r++) for (let x = -720, c = 0; x < BW + 720; x += 40, c++) {
      g.fillStyle((r + c) % 2 ? 0x5a5068 : 0x3a3346).fillRect(x, y, 40, 40);
    }
    g.fillStyle(0x1b1325, 0.35).fillEllipse(300, 318, 200, 46);
    g.fillStyle(0x1b1325, 0.35).fillEllipse(120, 528, 190, 44);
    this.add.image(330, 236, 'prop-shelf').setOrigin(0.5, 1).setScale(1.25 / RES);
    this.add.image(70, 236, 'prop-fridge').setOrigin(0.5, 1).setScale(1.1 / RES);
    this.add.rectangle(-700, -400, BW + 1400, BH + 800, 0x140d1f, 0.28).setOrigin(0);

    this.bag = this.add.sprite(300, 318, 'bag', 'idle').setOrigin(0.5, 0.97).setScale(1.6 / RES);
    this.mohit = this.add.sprite(120, 530, 'mohit', 'idle').setOrigin(0.5, 0.97).setScale(1.55 / RES);
    this.mohit.play('m-idle');
    this.startWobble();

    this.renderUI();
    this.run();
  }

  private fit() {
    const cam = this.cameras.main, dpr = DPR();
    const cssW = this.scale.width / dpr, cssH = this.scale.height / dpr;
    // keep the bottom ~180px free for the dialog box and the battle menu
    const z = Math.min(cssW / BW, (cssH - 180) / BH);
    cam.setZoom(z * dpr);
    cam.centerOn(BW / 2, BH / 2 + 90 / z);
  }

  private startWobble() {
    this.wobble?.remove();
    this.wobble = this.time.addEvent({
      delay: 1300, loop: true, callback: () => {
        if (!this.bag.active) return;
        this.bag.setFrame('squash');
        sfx.rustle();
        this.tweens.add({ targets: this.bag, angle: { from: -5, to: 5 }, duration: 100, yoyo: true, repeat: 3,
          onComplete: () => { this.bag.angle = 0; this.bag.setFrame('idle'); } });
      }
    });
  }

  private renderUI() {
    this.ui.innerHTML = `
      <div class="b-box b-enemy"><b>??? PAPER BAG</b><div class="hp"><i style="width:100%"></i></div><span>HP ???</span></div>
      <div class="b-box b-player"><b>MOHIT</b><div class="hp"><i id="bhp" style="width:100%"></i></div><span id="bhpn">20 / 20</span></div>`;
    this.ui.hidden = false;
  }

  private setHp(v: number) {
    const bar = document.querySelector('#bhp') as HTMLElement, n = document.querySelector('#bhpn') as HTMLElement;
    bar.style.width = (v / 20) * 100 + '%';
    bar.classList.toggle('low', v <= 6);
    n.textContent = `${v} / 20`;
  }

  private say(l: Line[] | Line) { return ui.say(l); }
  private wait(ms: number) { return new Promise<void>(r => this.time.delayedCall(ms, r)); }
  private tween(cfg: Phaser.Types.Tweens.TweenBuilderConfig) { return new Promise<void>(r => this.tweens.add({ ...cfg, onComplete: () => r() })); }
  private pop(x: number, y: number, text: string, color = '#ffffff', size = 30) {
    const t = this.add.text(x, y, text, { fontFamily: 'Lilita One', fontSize: size + 'px', color, stroke: '#1b1325', strokeThickness: 7, resolution: 3 })
      .setOrigin(0.5).setDepth(100).setScale(0.3);
    this.tweens.add({ targets: t, scale: 1, duration: 200, ease: 'Back.easeOut' });
    this.tweens.add({ targets: t, alpha: 0, y: y - 20, delay: 900, duration: 400, onComplete: () => t.destroy() });
  }

  private async run() {
    const tries = state.data.deaths;
    await this.wait(300);
    await this.say(tries === 0
      ? ['A large brown paper bag blocks the way.', "It's moving. On its own."]
      : [tries === 1 ? 'The bag is still here.' : `Attempt ${tries + 1}. The bag is still here.`, 'It looks... smug?']);
    for (;;) {
      const c = await ui.choose<Choice>([
        { label: 'FIGHT', value: 'fight' },
        { label: 'EXTEND YOUR HAND', value: 'hand' },
        { label: 'ITEMS', value: 'items' },
        { label: 'RUN', value: 'run' }
      ], 'battle');
      if (c === 'items') await this.say(['Mohit checks his pockets.', '1 phone (3% battery). 1 hair tie.', 'Neither seems useful against a haunted bag.']);
      else if (c === 'run') await this.say(['Mohit tries to run.', 'The kitchen door is stuck.', "(Also, he's kind of curious.)"]);
      else if (c === 'fight') return this.fight();
      else return this.befriend();
    }
  }

  /** Fighting is never the answer here: PoiPoi can't hurt anyone, but the shelf behind him can. */
  private async fight() {
    const m = this.mohit, bag = this.bag;
    this.wobble?.remove();
    await this.say('Mohit charges at the bag!');
    m.play('m-walk'); m.anims.timeScale = 2;
    sfx.whoosh();
    this.tweens.add({ targets: bag, y: bag.y - 90, duration: 220, yoyo: true, ease: 'Quad.easeOut', onStart: () => bag.setFrame('squash') });
    await this.tween({ targets: m, x: 300, y: 300, duration: 380, ease: 'Quad.easeIn' });
    this.pop(bag.x, bag.y - 140, 'MISS', '#ffffff');
    await this.tween({ targets: m, x: 330, y: 252, duration: 160 });
    sfx.thud(); this.cameras.main.shake(300, 0.014);
    m.stop(); m.setFrame('o');
    const shelfHit = this.add.text(330, 120, '*CRASH*', { fontFamily: 'Lilita One', fontSize: '26px', color: '#ffc23c', stroke: '#1b1325', strokeThickness: 7, resolution: 3 }).setOrigin(0.5);
    this.tweens.add({ targets: shelfHit, alpha: 0, delay: 600, duration: 300 });
    await this.wait(500);
    const sack = this.add.image(330, -80, 'flour').setOrigin(0.5, 1).setScale(1.4 / RES).setDepth(50);
    sfx.whoosh();
    await this.tween({ targets: sack, y: 200, duration: 420, ease: 'Quad.easeIn' });
    sfx.thud(); sfx.hit();
    this.cameras.main.flash(160, 255, 255, 255); this.cameras.main.shake(260, 0.02);
    this.pop(330, 150, 'BONK', '#ff4f8b', 38);
    m.setFrame('hurt');
    this.tween({ targets: m, angle: 84, y: 266, duration: 300, ease: 'Bounce.easeOut' });
    this.tween({ targets: sack, x: 360, y: 262, angle: 24, duration: 300, ease: 'Bounce.easeOut' });
    for (let hp = 20; hp >= 0; hp -= 2) { this.setHp(hp); await this.wait(45); }
    bag.setFrame('idle');
    await this.say(['A sack of atta fell on Mohit.', 'Mohit was defeated by a sack of flour.']);
    state.data.deaths++; state.save();
    sfx.gameOver();
    this.ui.hidden = true;
    await ui.overlay(
      `<h2>GAME OVER</h2><p>Mohit was defeated by a sack of flour.</p>
       <p class="small">${state.data.deaths === 1 ? 'The bag remains undefeated.' : `The bag is now ${state.data.deaths}–0 up.`}</p>`,
      [{ label: 'Try again', value: 'retry', primary: true }], 'gameover');
    this.scene.restart({ done: this.done });
  }

  private async befriend() {
    const m = this.mohit, bag = this.bag;
    this.wobble?.remove();
    await this.say('Mohit slowly extends his hand toward the mysterious, haunted, moving paper bag...');
    m.stop(); m.setFrame('hand');
    await this.wait(700);
    await this.say('...');
    bag.setFrame('eyes'); sfx.heart();
    await this.wait(500);
    await this.say('Two big blue eyes blink at him from inside the bag.');
    bag.setFrame('eyesEar');
    for (let i = 0; i < 3; i++) { sfx.rustle(); await this.tween({ targets: bag, angle: { from: -6, to: 6 }, duration: 90, yoyo: true }); }
    // the bag tips over and out comes...
    sfx.whoosh();
    const poi = this.add.sprite(bag.x, bag.y, 'poi', 'crumbs').setOrigin(0.5, 0.94).setScale(1.5 / RES).setFlipX(true).setDepth(5);
    this.tween({ targets: bag, angle: 92, x: bag.x + 86, y: bag.y + 8, duration: 520, ease: 'Back.easeIn' });
    bag.setFrame('idle').setDepth(6);
    await this.tween({ targets: poi, y: poi.y - 24, duration: 200, yoyo: true, ease: 'Quad.easeOut' });
    for (let i = 0; i < 10; i++) {
      const c = this.add.circle(poi.x + Phaser.Math.Between(-20, 20), poi.y - 50, Phaser.Math.Between(2, 4), 0xd9a35f).setStrokeStyle(1.5, 0x1b1325).setDepth(7);
      this.tweens.add({ targets: c, x: c.x + Phaser.Math.Between(-60, 60), y: poi.y + Phaser.Math.Between(-6, 10), duration: 500, ease: 'Quad.easeIn', onComplete: () => this.tweens.add({ targets: c, alpha: 0, delay: 900, duration: 400 }) });
    }
    await this.say(["It's a cat.", 'A very fluffy cat. Covered in crumbs.', 'He was raiding the kitchen.']);
    poi.play('p-walk');
    await this.tween({ targets: poi, x: 215, y: 470, duration: 900 });
    poi.stop(); poi.setFrame('sniff');
    sfx.meow(true);
    await this.say("He sniffs Mohit's hand...");
    poi.setFrame('happy');
    this.pop(poi.x, poi.y - 90, '♥', '#ff4f8b', 34); sfx.heart();
    await this.say(['...and slow-blinks.', "In cat, that means: you're my friend now."]);
    m.setFrame('idle');
    await this.say('His collar tag says: <b>PoiPoi</b>.');
    state.set('metPoi');
    sfx.fanfare();
    await ui.banner('PoiPoi joined the party!', 'join', 2000);
    this.ui.hidden = true; this.ui.innerHTML = '';
    this.scene.stop();
    this.done('friend');
  }
}
