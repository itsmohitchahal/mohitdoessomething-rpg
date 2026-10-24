import Phaser from 'phaser';
import { bake } from '../art/raster';
import { mohitSVG, catSVG, bagSVG, POI, FLOUR_SVG, BOWL_SVG, HEART_SVG, type MohitPose, type CatPose, type BagPose } from '../art/chars';
import { PROPS } from '../art/props';

const map = <P,>(poses: Record<string, P>, fn: (p: P) => string) =>
  Object.fromEntries(Object.entries(poses).map(([k, p]) => [k, fn(p)]));

const MOHIT: Record<string, MohitPose> = {
  idle: {}, blink: { blink: true },
  walkA: { legL: 5, bob: 1.5, arm: 8 }, walkB: { legR: 5, bob: 1.5, arm: -8 },
  o: { mouth: 'o', worried: true }, hand: { arm: -80, mouth: 'flat' },
  hurt: { blink: true, mouth: 'o', sweat: true, worried: true }, talk: { mouth: 'open' }
};
const CAT: Record<string, CatPose> = {
  idle: { tail: -6 }, idle2: { tail: 10, head: -3 }, blink: { tail: -6, eyes: 'closed' },
  walk0: { legs: [26, -26, -26, 26], tail: 22 }, walk1: { tail: 24, headX: 1 }, walk2: { legs: [-26, 26, 26, -26], tail: 22 },
  loaf: { loaf: true, tail: -24 }, loafBlink: { loaf: true, tail: -24, eyes: 'closed' },
  stare: { loaf: true, eyes: 'big', head: -6 }, happy: { loaf: true, eyes: 'closed' },
  eat: { loaf: true, head: 24, eyes: 'closed', tongue: true }, eat2: { loaf: true, head: 16, eyes: 'closed' },
  crumbs: { eyes: 'big', crumbs: true, head: -4 }, sniff: { head: 10, headX: 6, eyes: 'half' }
};
const BAG: Record<string, BagPose> = { idle: {}, squash: { squash: 0.9 }, eyes: { eyes: true }, eyesEar: { eyes: true, ear: true } };

/** Draws every character pose and prop into textures, then registers the animations. */
export class Boot extends Phaser.Scene {
  constructor() { super('Boot'); }

  async create() {
    await Promise.all([
      bake(this, 'mohit', map(MOHIT, mohitSVG), 52),
      bake(this, 'poi', map(CAT, p => catSVG(POI, p)), 66),
      bake(this, 'bag', map(BAG, bagSVG), 84),
      bake(this, 'flour', { base: FLOUR_SVG }, 46),
      bake(this, 'bowl', { base: BOWL_SVG }, 34),
      bake(this, 'heart', { base: HEART_SVG }, 20),
      ...Object.entries(PROPS).map(([k, a]) => bake(this, 'prop-' + k, { base: a.svg }, a.w))
    ]);
    const fr = (key: string, frame: string, duration?: number) => ({ key, frame, duration });
    this.anims.create({ key: 'm-idle', repeat: -1, frames: [fr('mohit', 'idle', 2600), fr('mohit', 'blink', 120), fr('mohit', 'idle', 1700), fr('mohit', 'blink', 120)] });
    this.anims.create({ key: 'm-walk', repeat: -1, frameRate: 8, frames: ['walkA', 'idle', 'walkB', 'idle'].map(f => fr('mohit', f)) });
    this.anims.create({ key: 'p-idle', repeat: -1, frames: [fr('poi', 'idle', 1500), fr('poi', 'idle2', 1500), fr('poi', 'blink', 120)] });
    this.anims.create({ key: 'p-walk', repeat: -1, frameRate: 10, frames: ['walk0', 'walk1', 'walk2', 'walk1'].map(f => fr('poi', f)) });
    this.anims.create({ key: 'p-loaf', repeat: -1, frames: [fr('poi', 'loaf', 2400), fr('poi', 'loafBlink', 140)] });
    this.anims.create({ key: 'p-eat', repeat: -1, frameRate: 5, frames: [fr('poi', 'eat'), fr('poi', 'eat2')] });
    this.game.events.emit('booted');
  }
}
