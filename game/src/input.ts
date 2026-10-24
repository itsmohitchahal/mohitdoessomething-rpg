// Movement + action input: an on-screen joystick (touch), WASD/arrow keys, and an action button (A / E / Space / Enter).
import { ui } from './ui';
import { sfx } from './audio';

const $ = (s: string) => document.querySelector(s) as HTMLElement;

class Input {
  private keys = new Set<string>();
  private jx = 0;
  private jy = 0;
  private aQueued = false;
  private pointerId: number | null = null;
  private ox = 0;
  private oy = 0;
  private readonly R = 50; // joystick radius in CSS px

  constructor() {
    addEventListener('keydown', e => {
      sfx.unlock();
      const k = e.key.toLowerCase();
      if (['enter', ' ', 'e', 'z'].includes(k)) {
        if (!e.repeat) this.pressA();
        e.preventDefault();
        return;
      }
      if (['arrowup', 'arrowdown', 'arrowleft', 'arrowright', 'w', 'a', 's', 'd'].includes(k)) {
        this.keys.add(k); e.preventDefault();
      }
    });
    addEventListener('keyup', e => this.keys.delete(e.key.toLowerCase()));
    addEventListener('blur', () => this.keys.clear());

    const zone = $('#joyzone'), base = $('#joybase'), knob = $('#joyknob');
    const rest = () => {
      base.classList.remove('live');
      base.style.left = ''; base.style.top = '';
      knob.style.transform = '';
      this.jx = this.jy = 0; this.pointerId = null;
    };
    zone.addEventListener('pointerdown', e => {
      sfx.unlock();
      if (ui.isTalking) { ui.advance(); return; }
      if (this.pointerId !== null) return;
      this.pointerId = e.pointerId;
      zone.setPointerCapture(e.pointerId);
      const r = zone.getBoundingClientRect();
      this.ox = e.clientX - r.left; this.oy = e.clientY - r.top;
      base.style.left = this.ox + 'px'; base.style.top = this.oy + 'px';
      base.classList.add('live');
    });
    zone.addEventListener('pointermove', e => {
      if (e.pointerId !== this.pointerId) return;
      const r = zone.getBoundingClientRect();
      let dx = e.clientX - r.left - this.ox, dy = e.clientY - r.top - this.oy;
      const d = Math.hypot(dx, dy);
      if (d > this.R) { dx *= this.R / d; dy *= this.R / d; }
      knob.style.transform = `translate(${dx}px, ${dy}px)`;
      const m = Math.min(1, d / this.R);
      // small dead zone so a resting thumb doesn't drift
      const s = m < 0.18 ? 0 : (m - 0.18) / 0.82;
      this.jx = d ? (dx / Math.hypot(dx, dy)) * s : 0;
      this.jy = d ? (dy / Math.hypot(dx, dy)) * s : 0;
    });
    const end = (e: PointerEvent) => { if (e.pointerId === this.pointerId) rest(); };
    zone.addEventListener('pointerup', end);
    zone.addEventListener('pointercancel', end);

    $('#btnA').addEventListener('pointerdown', e => { e.preventDefault(); e.stopPropagation(); sfx.unlock(); this.pressA(); });
    $('#game').addEventListener('pointerdown', () => { sfx.unlock(); if (ui.isTalking) ui.advance(); });
  }

  private pressA() {
    if (ui.isTalking) { ui.advance(); return; }
    if (ui.busy) return;
    this.aQueued = true;
  }

  /** Movement vector, length 0..1. */
  get move() {
    const k = this.keys;
    let x = (k.has('arrowright') || k.has('d') ? 1 : 0) - (k.has('arrowleft') || k.has('a') ? 1 : 0);
    let y = (k.has('arrowdown') || k.has('s') ? 1 : 0) - (k.has('arrowup') || k.has('w') ? 1 : 0);
    if (x || y) { const d = Math.hypot(x, y); x /= d; y /= d; }
    else { x = this.jx; y = this.jy; }
    return { x, y };
  }

  consumeA() { const a = this.aQueued; this.aQueued = false; return a; }

  setAction(label: string | null) {
    const b = $('#btnA');
    if (!label) { b.hidden = true; return; }
    if (b.textContent !== label) b.textContent = label;
    b.hidden = false;
  }
}

export const input = new Input();
