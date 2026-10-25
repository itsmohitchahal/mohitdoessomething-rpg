// WORKOUT TIME! Three exercises shown as big panels: tap (or press A) to do the reps, while PoiPoi does
// whatever PoiPoi wants. Ends with a short narration card.
import { benchPanel, curlPanel, chinPanel, HW, HH } from './px/hd';
import type { Px } from './px/paint';
import { ui, hi } from './ui';
import { sfx } from './audio';

const A_KEYS = new Set(['Enter', ' ', 'e', 'E', 'z', 'Z']);
const REPS = 5;
const M = (text: string) => ({ who: 'MOHIT', text });
const P = (text: string) => ({ who: 'POIPOI', text });
const q = (v: number, steps: number) => Math.round(Math.max(0, Math.min(1, v)) * steps) / steps;

class Stage {
  el = document.createElement('div');
  private cv = document.createElement('canvas');
  private onTap: (() => void) | null = null;
  private cache = new Map<string, Px>();

  constructor() {
    this.el.id = 'workout';
    this.el.innerHTML = `
      <div class="wk-top"><b>WORKOUT TIME!</b><span class="wk-step"></span></div>
      <div class="wk-name"></div>
      <div class="wk-frame"></div>
      <div class="wk-meter"><div class="wk-bar"><i></i></div><span class="wk-count"></span></div>
      <div class="wk-hint"></div>
      <div class="wk-narr" hidden><p></p><span>▼</span></div>`;
    this.cv.width = HW; this.cv.height = HH;
    this.$('.wk-frame').appendChild(this.cv);
    this.el.addEventListener('pointerdown', e => {
      if ((e.target as HTMLElement).closest('.hi')) return;
      e.preventDefault();
      sfx.unlock();
      if (ui.isTalking) ui.advance(); else this.onTap?.();
    });
    addEventListener('keydown', this.key);
    document.body.appendChild(this.el);
    requestAnimationFrame(() => this.el.classList.add('on'));
  }

  private $(s: string) { return this.el.querySelector(s) as HTMLElement; }
  private key = (e: KeyboardEvent) => {
    if (!A_KEYS.has(e.key) || e.repeat || ui.isTalking || !this.onTap) return;
    this.onTap();
  };

  /** Draws a frame, building it the first time it's needed. */
  show(key: string, make: () => Px) {
    let f = this.cache.get(key);
    if (!f) { f = make(); this.cache.set(key, f); }
    const x = this.cv.getContext('2d')!;
    x.clearRect(0, 0, HW, HH);
    x.drawImage(f.cv, 0, 0);
  }
  exercise(step: number, name: string) {
    this.$('.wk-step').textContent = `${step} / 3`;
    this.$('.wk-name').textContent = name;
    this.cache.clear();
    this.reps(-1);
    this.hint('');
  }
  reps(n: number) {
    const m = this.$('.wk-meter');
    m.hidden = n < 0;
    (this.$('.wk-bar i')).style.width = `${(Math.max(0, n) / REPS) * 100}%`;
    this.$('.wk-count').textContent = `${Math.max(0, n)} / ${REPS} reps`;
  }
  hint(s: string) { this.$('.wk-hint').textContent = s; }
  listen(fn: (() => void) | null) { this.onTap = fn; }
  tap() { return new Promise<void>(r => this.listen(() => { this.listen(null); r(); })); }

  async narrate(html: string) {
    this.$('.wk-top b').textContent = 'AFTERWARDS...';
    this.$('.wk-step').textContent = '';
    this.$('.wk-name').textContent = '';
    this.reps(-1); this.hint('');
    this.$('.wk-frame').hidden = true;
    const n = this.$('.wk-narr');
    n.querySelector('p')!.innerHTML = html;
    n.hidden = false;
    await wait(600);
    await this.tap();
    sfx.select();
  }

  async close() {
    this.listen(null);
    removeEventListener('keydown', this.key);
    this.el.classList.remove('on');
    await wait(350);
    this.el.remove();
  }
}

const wait = (ms: number) => new Promise<void>(r => setTimeout(r, ms));
const frames = (fn: (dt: number) => boolean) => new Promise<void>(done => {
  let last = performance.now();
  const tick = (now: number) => {
    const dt = Math.min(0.05, (now - last) / 1000); last = now;
    if (fn(dt)) done(); else requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
});

/** The bar sinks on its own; tapping pushes it back up. It can never reach PoiPoi. */
async function bench(s: Stage) {
  s.exercise(1, 'BENCH PRESS');
  const draw = (b: number, eyes: 'half' | 'closed' | 'open') => { const k = q(b, 6); s.show(`b${k}${eyes}`, () => benchPanel(k, eyes)); };
  draw(0, 'open');
  await wait(500);
  await ui.say(['Exercise 1: <b>bench press</b>.', 'Mohit lies down on the bench and grips the bar.']);
  sfx.meow(true);
  draw(0, 'half');
  await ui.say(['PoiPoi hops up onto his chest.', 'And loafs.']);
  await ui.say([M('...'), M(`Okay. New rule. Half reps only. The bar does NOT touch the ${hi('billa', 'cat (a boy cat)')}.`)]);
  s.reps(0);
  s.hint('Tap fast to push the bar back up!');
  let b = 0, up = false, reps = 0, blink = 3;
  s.listen(() => { if (up) { b = Math.max(0, b - 0.16); sfx.step(); } });
  await frames(dt => {
    if (!up) { b += dt * 0.8; if (b >= 1) { b = 1; up = true; } }
    else {
      b = Math.min(1, b + dt * 0.42);
      if (b <= 0.02) { b = 0; up = false; reps++; s.reps(reps); sfx.select(); }
    }
    blink -= dt;
    if (blink < -0.25) blink = 2 + Math.random() * 2.5;
    draw(b, blink < 0 ? 'closed' : 'half');
    return reps >= REPS;
  });
  s.listen(null); s.hint('');
  draw(0, 'closed');
  await ui.say(['Five reps. Zero billas squished.', 'PoiPoi did not open his eyes once.']);
  await ui.say(M('Best spotter I ever had.'));
}

/** Every tap is one curl. PoiPoi copies with his paw, a beat late. */
async function curls(s: Stage) {
  s.exercise(2, 'BICEP CURLS');
  const draw = (c: number, paw: number) => { const a = q(c, 4), b = q(paw, 4); s.show(`c${a}-${b}`, () => curlPanel(a, b)); };
  draw(0, 0);
  await wait(400);
  await ui.say(['Exercise 2: <b>bicep curls</b>.', 'PoiPoi sits down right next to Mohit.', 'He is watching very closely.']);
  s.reps(0);
  s.hint('Tap to curl!');
  let reps = 0, t = -1;
  s.listen(() => { if (t < 0) { t = 0; sfx.whoosh(); } });
  await frames(dt => {
    if (t >= 0) {
      t += dt / 0.8;
      const c = Math.sin(Math.PI * Math.min(1, t));
      const paw = Math.sin(Math.PI * Math.max(0, Math.min(1, (t - 0.15) / 0.85)));
      draw(c, paw);
      if (t >= 1) { t = -1; reps++; s.reps(reps); sfx.select(); if (reps === 3) sfx.meow(true); }
    }
    return reps >= REPS && t < 0;
  });
  s.listen(null); s.hint('');
  await ui.say(['PoiPoi copied every single rep.', 'Perfect form.']);
  sfx.thud();
  s.show('flop', () => curlPanel(0.15, 0, true));
  await ui.say(['Then he fell over.', 'And stayed there. Belly up.', 'Workout complete, apparently.']);
  await ui.say(M('Same, buddy. Same.'));
}

/** Each tap pulls Mohit up once. PoiPoi treats his legs like a tree trunk. */
async function chinups(s: Stage) {
  s.exercise(3, 'CHIN-UPS');
  const slides = [0, 0.3, 0.6, 0.15, 0.45, 0.7];
  const draw = (u: number, slide: number) => { const a = q(u, 4); s.show(`u${a}-${slide}`, () => chinPanel(a, slide)); };
  draw(0, 0);
  await wait(400);
  await ui.say(['Exercise 3: <b>chin-ups</b>.', 'Mohit jumps up and grabs the bar.', 'Something grabs Mohit.']);
  await ui.say([M('PoiPoi.'), M('I am not a tree.')]);
  sfx.meow();
  await ui.say(P('Mrrp.'));
  s.reps(0);
  s.hint('Tap to pull up!');
  let reps = 0, t = -1;
  s.listen(() => { if (t < 0) { t = 0; sfx.whoosh(); } });
  await frames(dt => {
    if (t >= 0) {
      t += dt;
      const u = t < 0.35 ? t / 0.35 : t < 0.45 ? 1 : 1 - (t - 0.45) / 0.45;
      draw(u, slides[reps]);
      if (t >= 0.9) { t = -1; reps++; s.reps(reps); sfx.select(); draw(0, slides[reps]); }
    }
    return reps >= REPS && t < 0;
  });
  s.listen(null); s.hint('');
  sfx.thud();
  s.show('landed', () => chinPanel(0, 0.4, true));
  await ui.say(['Mohit drops back down.', 'PoiPoi does not let go.']);
  await ui.say([M('...I have a cat on my leg now.'), M('This is fine. This is great, actually.')]);
}

export async function runWorkout() {
  const s = new Stage();
  await bench(s);
  await curls(s);
  await chinups(s);
  sfx.fanfare();
  await ui.banner('PERFECT WORKOUT!', 'join', 1800);
  await s.narrate(`Mohit takes a long, hot shower, smiling the whole time.<br>PoiPoi watches from a safe, dry distance, deeply concerned.<br><i>Why is this big ${hi('billa', 'cat (a boy cat)')} smiling while he gets drenched in the rain?</i>`);
  await s.close();
}
