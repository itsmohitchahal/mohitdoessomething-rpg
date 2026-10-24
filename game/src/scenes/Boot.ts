import Phaser from 'phaser';
import { Px, rng } from '../px/paint';
import { MOHIT_FRAMES, MOHIT_FW, MOHIT_FH, catFrames, POI_LOOK, CAT_FW, CAT_FH, bagFrame } from '../px/sprites';
import { PIX } from '../px/props';
import { ui } from '../ui';

const hash = (s: string) => [...s].reduce((a, c) => (a * 31 + c.charCodeAt(0)) >>> 0, 7);

/** Lays out frames side by side in one canvas texture with named frames. */
function sheet(scene: Phaser.Scene, key: string, frames: Record<string, () => Px>, fw: number, fh: number) {
  const names = Object.keys(frames);
  const cv = document.createElement('canvas');
  cv.width = fw * names.length; cv.height = fh;
  const x = cv.getContext('2d')!;
  names.forEach((n, i) => x.drawImage(frames[n]().cv, i * fw, 0));
  const tex = scene.textures.addCanvas(key, cv)!;
  names.forEach((n, i) => tex.add(n, 0, i * fw, 0, fw, fh));
}

function canvasTex(scene: Phaser.Scene, key: string, w: number, h: number, paint: (c: CanvasRenderingContext2D) => void) {
  const cv = document.createElement('canvas');
  cv.width = w; cv.height = h;
  paint(cv.getContext('2d')!);
  scene.textures.addCanvas(key, cv);
}

/** Enlarged crop of a sprite frame for the dialog portrait. */
function portrait(src: Px, sx: number, sy: number, size: number) {
  const cv = document.createElement('canvas');
  cv.width = cv.height = size * 6;
  const x = cv.getContext('2d')!;
  x.imageSmoothingEnabled = false;
  x.drawImage(src.cv, sx, sy, size, size, 0, 0, size * 6, size * 6);
  return cv.toDataURL();
}

/** Builds every sprite, prop and light texture, then registers the animations. */
export class Boot extends Phaser.Scene {
  constructor() { super('Boot'); }

  create() {
    sheet(this, 'mohit', MOHIT_FRAMES, MOHIT_FW, MOHIT_FH);
    sheet(this, 'poi', catFrames(POI_LOOK), CAT_FW, CAT_FH);
    sheet(this, 'bag', { idle: () => bagFrame(), squash: () => bagFrame({ squash: true }), eyes: () => bagFrame({ eyes: true }), eyesEar: () => bagFrame({ eyes: true, ear: true }) }, 26, 30);
    for (const [k, prop] of Object.entries(PIX)) {
      const p = new Px(prop.w, prop.h, rng(hash(k)));
      prop.draw(p);
      this.textures.addCanvas('pix-' + k, p.cv);
    }
    canvasTex(this, 'glow', 64, 64, c => {
      const g = c.createRadialGradient(32, 32, 0, 32, 32, 32);
      g.addColorStop(0, 'rgba(255,255,255,.9)'); g.addColorStop(0.4, 'rgba(255,255,255,.35)'); g.addColorStop(1, 'rgba(255,255,255,0)');
      c.fillStyle = g; c.fillRect(0, 0, 64, 64);
    });
    canvasTex(this, 'dot', 2, 2, c => { c.fillStyle = '#ffffff'; c.fillRect(0, 0, 2, 2); });
    canvasTex(this, 'raindrop', 2, 6, c => {
      c.fillStyle = 'rgba(214,232,255,.35)'; c.fillRect(1, 0, 1, 2);
      c.fillStyle = 'rgba(214,232,255,.8)'; c.fillRect(1, 2, 1, 2); c.fillRect(0, 4, 1, 2);
    });

    ui.setPortraits({
      MOHIT: portrait(MOHIT_FRAMES.talk(), 4, 0, 16),
      POIPOI: portrait(catFrames(POI_LOOK).stare(), 3, 0, 15)
    });

    const fr = (key: string, frame: string, duration?: number) => ({ key, frame, duration });
    this.anims.create({ key: 'm-idle', repeat: -1, frames: [fr('mohit', 'idle', 2600), fr('mohit', 'blink', 120), fr('mohit', 'idle', 1700), fr('mohit', 'blink', 120)] });
    this.anims.create({ key: 'm-walk', repeat: -1, frameRate: 7, frames: ['walkA', 'idle', 'walkB', 'idle'].map(f => fr('mohit', f)) });
    this.anims.create({ key: 'm-walk-up', repeat: -1, frameRate: 7, frames: ['bWalkA', 'bIdle', 'bWalkB', 'bIdle'].map(f => fr('mohit', f)) });
    this.anims.create({ key: 'm-idle-up', repeat: -1, frames: [fr('mohit', 'bIdle', 3000)] });
    this.anims.create({ key: 'm-walk-side', repeat: -1, frameRate: 7, frames: ['sWalkA', 'sIdle', 'sWalkB', 'sIdle'].map(f => fr('mohit', f)) });
    this.anims.create({ key: 'm-idle-side', repeat: -1, frames: [fr('mohit', 'sIdle', 2400), fr('mohit', 'sBlink', 120)] });
    this.anims.create({ key: 'p-idle', repeat: -1, frames: [fr('poi', 'idle', 1500), fr('poi', 'idle2', 1500), fr('poi', 'blink', 120)] });
    this.anims.create({ key: 'p-walk', repeat: -1, frameRate: 9, frames: ['walk0', 'walk1', 'walk2', 'walk1'].map(f => fr('poi', f)) });
    this.anims.create({ key: 'p-loaf', repeat: -1, frames: [fr('poi', 'loaf', 2400), fr('poi', 'loafBlink', 140)] });
    this.anims.create({ key: 'p-eat', repeat: -1, frameRate: 5, frames: [fr('poi', 'eat'), fr('poi', 'eat2')] });
    this.game.events.emit('booted');
  }
}
