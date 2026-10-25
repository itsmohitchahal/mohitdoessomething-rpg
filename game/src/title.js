import { MOHIT_FRAMES, MOHIT_FW, MOHIT_FH, catFrames, POI_LOOK, MAO_LOOK, CAT_FW, CAT_FH } from './px/sprites';
import { PIX } from './px/props';
import { Px, rng } from './px/paint';
import { paintGround } from './px/terrain';
// Title screen (approved v2 art test), now the game's front door.
export function initTitle(opts) {
  const $ = s => document.querySelector(s);
  const stage = $('#stage'), world = $('#world'), laser = $('#laser'), dlg = $('#dialog'), sheet = $('#sheet');
  const rnd = (a, b) => a + Math.random() * (b - a);
  const pick = a => a[Math.floor(Math.random() * a.length)];
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const hi = (w, en) => `<button type="button" class="hi" data-en="${en}">${w}</button>`;
  // Ages are worked out from each cat's birthday, so they stay right for as long as the site is up.
  const DOB = { poi: new Date(2026, 5, 7), mao: new Date(2026, 6, 23) };
  function age(dob, now = new Date()) {
    let months = (now.getFullYear() - dob.getFullYear()) * 12 + now.getMonth() - dob.getMonth();
    if (now.getDate() < dob.getDate()) months--;
    const mark = new Date(dob.getFullYear(), dob.getMonth() + months, dob.getDate());
    const days = Math.floor((now - mark) / 864e5);
    if (months < 1) { const w = Math.max(1, Math.floor((now - dob) / 6048e5)); return `${w} week${w > 1 ? 's' : ''}`; }
    if (months < 12) return `${months}${days >= 15 ? '½' : ''} month${months > 1 || days >= 15 ? 's' : ''}`;
    const y = Math.floor(months / 12), m = months % 12;
    return `${y} year${y > 1 ? 's' : ''}${m ? ` ${m} month${m > 1 ? 's' : ''}` : ''}`;
  }
  const store = {
    get(k, d) { try { const v = localStorage.getItem(k); return v === null ? d : JSON.parse(v); } catch { return d; } },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch { } }
  };
  const INK = '#1b1325';

  /* ---------- logo ---------- */
  const palette = ['var(--hot)', 'var(--mustard)', 'var(--mint)', 'var(--sky)', 'var(--lilac)'];
  let li = 0;
  document.querySelectorAll('.logo [data-text]').forEach(w => {
    w.innerHTML = [...w.dataset.text].map(ch => ch === ' ' ? '<span class="sp"></span>'
      : `<span class="l" style="--c:${palette[li % 5]};--i:${li};--r:${(li++ % 2 ? 2.5 : -2.5)}deg">${ch}</span>`).join('');
  });
  document.querySelector('.logo').addEventListener('pointerdown', e => {
    const l = e.target.closest('.l'); if (!l) return;
    l.classList.remove('boing'); void l.offsetWidth; l.classList.add('boing');
    setTimeout(() => l.classList.remove('boing'), 470);
  });

  /* ---------- pixel sprites ---------- */
  const bake = frames => Object.fromEntries(Object.entries(frames).map(([k, f]) => [k, f().cv]));
  const FRAMES = { mohit: bake(MOHIT_FRAMES), poi: bake(catFrames(POI_LOOK)), mao: bake(catFrames(MAO_LOOK)) };
  const DIMS = { mohit: [MOHIT_FW, MOHIT_FH], poi: [CAT_FW, CAT_FH], mao: [CAT_FW, CAT_FH] };
  const PX_SCALE = { mohit: 5, poi: 5, mao: 4 };
  // which frames each animation state cycles through, and milliseconds per frame
  const CAT_STATES = {
    idle: [['idle', 'idle2', 'idle', 'blink'], 700], walk: [['walk0', 'walk1', 'walk2', 'walk1'], 150], run: [['walk0', 'walk1', 'walk2', 'walk1'], 100],
    sprint: [['walk0', 'walk2'], 70], crouch: [['loaf'], 1000], air: [['walk2'], 1000], slap: [['walk0', 'walk2'], 60],
    boop: [['sniff', 'idle'], 300], groom: [['eat', 'eat2'], 220], loaf: [['loaf', 'loaf', 'loaf', 'loafBlink'], 600],
    distracted: [['stare'], 1000], annoyed: [['loaf'], 1000], hide: [['loaf'], 1000], happy: [['happy'], 1000], fight: [['walk0', 'walk2'], 80]
  };
  const MOHIT_STATES = { idle: [['idle', 'idle', 'idle', 'blink'], 650], wave: [['hand', 'talk'], 220], glasses: [['talk'], 1000], flustered: [['hurt'], 1000] };
  const sprites = [];
  function makeSprite(kind) {
    const el = document.createElement('div');
    el.className = `sprite ${kind === 'mohit' ? 'mohit' : 'cat ' + kind} st-idle`;
    el.setAttribute('role', 'button');
    el.setAttribute('aria-label', { mohit: 'Mohit', poi: 'PoiPoi', mao: 'MaoMao' }[kind]);
    const [fw, fh] = DIMS[kind];
    el.innerHTML = `<div class="shadow"></div><div class="flip"><div class="squash"><canvas class="pxs" width="${fw}" height="${fh}"></canvas></div></div><div class="bubble" hidden></div>`;
    sprites.push({ el, kind, x: el.querySelector('canvas').getContext('2d'), shown: '' });
    return el;
  }
  function animateSprites(now) {
    for (const s of sprites) {
      if (!s.el.isConnected) continue;
      const st = (s.el.className.match(/st-(\w+)/) || [])[1] || 'idle';
      const table = s.kind === 'mohit' ? MOHIT_STATES : CAT_STATES;
      const [list, ms] = table[st] || table.idle;
      const name = list[Math.floor(now / ms) % list.length];
      if (name === s.shown) continue;
      s.shown = name;
      s.x.clearRect(0, 0, s.x.canvas.width, s.x.canvas.height);
      s.x.drawImage(FRAMES[s.kind][name], 0, 0);
    }
  }

  /* ---------- pixel room behind the title ---------- */
  function buildRoom() {
    const k = Math.max(2, Math.round(3 * u));
    const aw = Math.ceil(W / k), ah = Math.ceil(H / k), floorY = Math.round(ah * 0.69);
    const p = new Px(aw, ah, rng(5));
    const cols = Math.ceil(aw / 16) + 1;
    p.draw(paintGround(Array.from({ length: Math.ceil(floorY / 16) + 1 }, () => 'W'.repeat(cols)), 11), 0, 0);
    p.draw(paintGround(Array.from({ length: Math.ceil((ah - floorY) / 16) + 1 }, () => 'o'.repeat(cols)), 12), 0, floorY);
    p.r(0, floorY - 5, aw, 5, '#8a532c').r(0, floorY - 5, aw, 1, '#b5743f').r(0, floorY, aw, 1, '#2b2430');
    for (let x = 0; x < aw; x++) p.p(x, 10 + Math.round(Math.abs(Math.sin((x / aw) * Math.PI * 3)) * 9), '#2b2430');
    const bulbs = ['#ffd77a', '#ff9ec0', '#9fe8ff', '#fff1c9'];
    for (let x = 4, i = 0; x < aw; x += 11, i++) {
      const y = 11 + Math.round(Math.abs(Math.sin((x / aw) * Math.PI * 3)) * 9);
      p.r(x, y, 2, 2, bulbs[i % 4]).p(x, y + 2, '#2b2430');
    }
    const put = (key, cx, base) => { const d = PIX[key], q = new Px(d.w, d.h, rng(key.length * 31)); d.draw(q); p.draw(q, Math.round(cx - d.w / 2), base - d.h); };
    const pad = Math.max(4, Math.round(aw * 0.04));
    const pianoX = aw - pad - 28;
    const gap = pianoX - 28 - (pad + 62);
    if (gap > 36) put('window', (pad + 62 + pianoX - 28) / 2, floorY - 22);
    put('posterInk', pianoX - 2, floorY - 40);
    put('desk', pad + 30, floorY + 6);
    put('piano', pianoX, floorY + 4);
    put('guitar', gap > 20 ? (pad + 62 + pianoX - 28) / 2 : pianoX - 30, floorY + 4);
    put('chair', pad + 34, floorY + 18);
    let cv = $('#pxbg');
    if (!cv) { cv = document.createElement('canvas'); cv.id = 'pxbg'; stage.prepend(cv); }
    cv.width = aw; cv.height = ah;
    const x = cv.getContext('2d');
    x.imageSmoothingEnabled = false;
    x.drawImage(p.cv, 0, 0);
  }

  /* ---------- entities ---------- */
  let W = 0, H = 0, u = 1;
  function ent(kind, base) {
    const el = makeSprite(kind); world.appendChild(el);
    return {
      kind, el, flip: el.querySelector('.flip'), bub: el.querySelector('.bubble'), base,
      x: 0, y: 0, vx: 0, vy: 0, w: 0, h: 0, dir: 1, hopY: 0, z: 0, state: 'idle', tasks: [], bw: 0, burst: 1, burstAt: 0
    };
  }
  const mohit = ent('mohit', 116), poi = ent('poi', 116), mao = ent('mao', 82);
  // max speed (px/s at u=1), acceleration cap and reaction delay: PoiPoi is floatier and slower to react, MaoMao is zippy.
  Object.assign(poi, { max: 240, accel: 820, react: [220, 480], off: 7, nextDistract: 0 });
  Object.assign(mao, { max: 320, accel: 1500, react: [60, 190], off: -3, trust: store.get('maoTrust', 0) });
  const cats = [poi, mao];

  function size() {
    W = stage.clientWidth; H = stage.clientHeight;
    u = clamp(Math.min(W, H * 0.62) / 420, 0.8, 1.35);
    for (const e of [mohit, poi, mao]) {
      const sc = Math.max(2, Math.round(PX_SCALE[e.kind] * u));
      e.w = DIMS[e.kind][0] * sc; e.h = DIMS[e.kind][1] * sc;
      e.el.style.width = e.w + 'px'; e.el.style.height = e.h + 'px';
      e.foot = e.kind === 'mohit' ? 0.985 : 0.97;
      e.nose = e.kind === 'mohit' ? 0 : e.w * 0.3;
    }
    mohit.x = clamp(W * 0.75, mohit.w * 0.6, W - mohit.w * 0.6); mohit.y = H - 14 * u;
    buildRoom();
  }
  function setState(e, s) {
    if (e.state === s) return;
    e.el.classList.remove('st-' + e.state); e.el.classList.add('st-' + s); e.state = s;
  }
  function land(e) { e.el.classList.remove('land'); void e.el.offsetWidth; e.el.classList.add('land'); }
  function place(e) {
    const nx = clamp(e.x, e.w * 0.4, W - e.w * 0.4), ny = clamp(e.y, e.h * e.foot + 6, H - 4);
    if (nx !== e.x) e.vx = 0; if (ny !== e.y) e.vy = 0;
    e.x = nx; e.y = ny;
    e.el.style.transform = `translate3d(${e.x - e.w / 2}px,${e.y - e.h * e.foot}px,0)`;
    e.el.style.zIndex = Math.round(e.y + e.z);
    e.flip.style.transform = `translateY(${e.hopY}px) scaleX(${e.dir})`;
    if (!e.bub.hidden) {
      const left = e.x - e.bw / 2, shift = clamp(left, 8, W - 8 - e.bw) - left;
      e.bub.style.transform = `translateX(calc(-50% + ${shift}px))`;
    }
  }
  function say(e, text, dur = 2400, small = '') {
    e.bub.innerHTML = text + (small ? `<small>${small}</small>` : '');
    e.bub.hidden = false; e.bub.style.animation = 'none'; void e.bub.offsetWidth; e.bub.style.animation = '';
    e.bw = e.bub.offsetWidth;
    clearTimeout(e.bt); e.bt = setTimeout(() => { e.bub.hidden = true; }, dur);
  }

  /* ---------- motion: steering with acceleration, arrival easing, sprint bursts and skids ---------- */
  function gaitFor(c) {
    const sp = Math.hypot(c.vx, c.vy) / u;
    return sp < 25 ? null : sp < 120 ? 'walk' : sp < 250 ? 'run' : 'sprint';
  }
  function steer(c, gx, gy, max, dt, now, boost = 1, slowR = 90) {
    if (boost > 1) c.burst = 1;
    else if (now > c.burstAt) { c.burst = c === mao ? rnd(.72, 1.3) : rnd(.82, 1.15); c.burstAt = now + rnd(450, 1100); }
    const dx = gx - c.x, dy = gy - c.y, d = Math.hypot(dx, dy);
    const slow = slowR * u;
    const want = d < 1 ? 0 : max * c.burst * u * Math.min(1, d / slow);
    const tvx = d ? dx / d * want : 0, tvy = d ? dy / d * want : 0;
    let ax = (tvx - c.vx) * 7, ay = (tvy - c.vy) * 7;
    const am = Math.hypot(ax, ay), cap = c.accel * boost * u;
    if (am > cap) { ax *= cap / am; ay *= cap / am; }
    const sp = Math.hypot(c.vx, c.vy);
    if (sp > max * u * 0.55 && (c.vx * tvx + c.vy * tvy) < 0 && now - (c.lastSkid || 0) > 350) { c.lastSkid = now; skid(c); }
    c.vx += ax * dt; c.vy += ay * dt;
    c.x += c.vx * dt; c.y += c.vy * dt;
    if (Math.abs(c.vx) > 16 * u) c.dir = c.vx > 0 ? 1 : -1;
    return d < 6 * u && Math.hypot(c.vx, c.vy) < 50 * u;
  }
  function brake(c, dt) {
    const k = Math.exp(-9 * dt);
    c.vx *= k; c.vy *= k; c.x += c.vx * dt; c.y += c.vy * dt;
  }
  function skid(c) {
    for (let i = 0; i < 3; i++) {
      const p = document.createElement('div'); p.className = 'dust';
      p.style.left = (c.x - c.dir * c.w * 0.2 + rnd(-6, 6)) + 'px'; p.style.top = (c.y - rnd(0, 6)) + 'px';
      p.style.setProperty('--dx', (-c.dir * rnd(8, 20)) + 'px'); p.style.zIndex = Math.round(c.y + 1);
      world.appendChild(p); setTimeout(() => p.remove(), 500);
    }
  }

  /* ---------- effects ---------- */
  const SVG_HEART = s => `<svg width="${s}" height="${s}" viewBox="0 0 24 24"><path d="M12 21 C5 15.5 1.5 12 1.5 7.5 A5 5 0 0 1 12 5.5 A5 5 0 0 1 22.5 7.5 C22.5 12 19 15.5 12 21Z" fill="#ff4f8b" stroke="${INK}" stroke-width="2"/><path d="M6 7 q1.5 -2 3.5 -1.5" stroke="#fff" stroke-width="1.8" fill="none" stroke-linecap="round"/></svg>`;
  const SVG_SCRATCH = `<svg width="50" height="50" viewBox="0 0 50 50"><g stroke-linecap="round"><path d="M11 9 L23 41 M20 7 L32 39 M29 7 L40 35" stroke="${INK}" stroke-width="7"/><path d="M11 9 L23 41 M20 7 L32 39 M29 7 L40 35" stroke="#ff4f8b" stroke-width="3.5"/></g></svg>`;
  const SVG_BURST = `<svg width="86" height="86" viewBox="0 0 100 100"><path d="M50 2 L58 30 L84 14 L70 40 L98 46 L70 58 L88 84 L58 70 L52 98 L42 70 L14 88 L30 60 L2 52 L30 42 L12 16 L40 30 Z" fill="#ffc23c" stroke="${INK}" stroke-width="4" stroke-linejoin="round"/></svg>`;
  const SVG_SPARK = `<svg width="18" height="18" viewBox="0 0 24 24"><path d="M12 1 L14.5 9.5 L23 12 L14.5 14.5 L12 23 L9.5 14.5 L1 12 L9.5 9.5Z" fill="#ffc23c" stroke="${INK}" stroke-width="1.8"/></svg>`;
  function fx(x, y, html, cls = '', dur = 900) {
    const f = document.createElement('div');
    f.className = 'fx ' + cls; f.innerHTML = html; f.style.left = x + 'px'; f.style.top = y + 'px';
    world.appendChild(f); setTimeout(() => f.remove(), dur + 400);
  }
  function swat(x, y) {
    fx(x, y - 34 * u, SVG_BURST, 'burst', 700);
    fx(x, y - 34 * u, 'SWAT!', 'burst', 700);
    fx(x, y, SVG_SCRATCH, 'stay', 1300);
    try { navigator.vibrate && navigator.vibrate(18); } catch { }
  }
  function boop(x, y) { fx(x, y - 12 * u, SVG_HEART(28)); fx(x + 26 * u, y - 30 * u, 'boop', 'tag'); }
  function fightCloud(x, y, dur) {
    const c = document.createElement('div'); c.className = 'fight';
    const s = 1.05 * u;
    c.style.left = x + 'px'; c.style.top = y + 'px'; c.style.width = 160 * s + 'px'; c.style.height = 110 * s + 'px';
    c.style.zIndex = Math.round(y + 40);
    c.innerHTML = `<svg viewBox="0 0 160 110"><path d="M20 70 L8 52 L28 44 L22 22 L48 28 L58 6 L76 24 L96 4 L104 28 L130 16 L128 42 L154 48 L136 64 L150 86 L122 84 L116 106 L94 90 L74 108 L64 88 L38 100 L40 80 Z" fill="#fff" stroke="${INK}" stroke-width="4" stroke-linejoin="round"/>
    <path d="M52 52 l10 -6 M90 40 l6 10 M104 66 l-10 4 M64 76 l8 2" stroke="${INK}" stroke-width="3" stroke-linecap="round"/>
    <path d="M30 60 L44 58 M120 52 L134 54" stroke="#ffc23c" stroke-width="5" stroke-linecap="round"/>
    <circle cx="70" cy="58" r="5" fill="#666270" stroke="${INK}" stroke-width="2"/><circle cx="92" cy="60" r="6" fill="#fff8ef" stroke="${INK}" stroke-width="2"/></svg><em>*rough play*</em>`;
    world.appendChild(c); setTimeout(() => c.remove(), dur);
  }

  /* ---------- pointer target ---------- */
  const T = { x: 0, y: 0, active: false, mouse: false, movedAt: 0, id: 0, ax: -999, ay: -999, expires: 0 };
  let lastInput = performance.now(), sheetOpen = false, hintGone = false;
  function stagePt(e) { const r = stage.getBoundingClientRect(); return [e.clientX - r.left, e.clientY - r.top]; }
  // Interrupting a task must still run its cleanup (e.g. Mohit stops looking groomed, PoiPoi gets off Settings).
  function cancelTasks(c) {
    const t = c.tasks[0];
    if (t && t.t0 && t.onEnd) t.onEnd(c);
    c.tasks = [];
  }
  function clearSoftTasks() {
    for (const c of cats) if (!c.tasks.some(t => t.stubborn || t.keep)) { cancelTasks(c); c.hopY = 0; c.z = 0; }
  }
  function setTarget(x, y, mouse) {
    const now = performance.now();
    if (!T.active || Math.hypot(x - T.ax, y - T.ay) > 26 * u) { T.id++; T.ax = x; T.ay = y; clearSoftTasks(); }
    Object.assign(T, { x, y, active: true, mouse, movedAt: now, expires: mouse ? Infinity : now + 3000 });
    lastInput = now;
    laser.style.transform = `translate3d(${x}px,${y}px,0)`; laser.style.zIndex = Math.round(y - 2);
    laser.classList.add('on');
    if (!hintGone) { hintGone = true; setTimeout(() => $('#hint').classList.add('gone'), 2500); }
  }
  stage.addEventListener('pointermove', e => {
    if (e.pointerType !== 'mouse' || sheetOpen) return;
    const [x, y] = stagePt(e); setTarget(x, y, true);
  });
  stage.addEventListener('pointerleave', e => { if (e.pointerType === 'mouse') { T.active = false; laser.classList.remove('on'); } });
  stage.addEventListener('pointerdown', e => {
    if (sheetOpen || e.target.closest('#dialog, #sheet')) return;
    if (!e.target.closest('.hi')) document.querySelectorAll('.hi.open').forEach(h => h.classList.remove('open'));
    if (e.pointerType === 'mouse') return;
    const [x, y] = stagePt(e);
    setTarget(x, y, false);
    const r = document.createElement('div'); r.className = 'ripple';
    r.style.left = x + 'px'; r.style.top = y + 'px'; r.style.zIndex = 1999; world.appendChild(r); setTimeout(() => r.remove(), 500);
  });

  /* ---------- cat brains ---------- */
  const DISTRACT = ['(a speck of dust)', '(a wall)', '(nothing. there is nothing there.)', '(his own tail)',
    '(a sound only he heard)', '(the concept of time)', '(a very interesting corner)'];
  function pounce(c) {
    const tx = T.x, ty = T.y, isMao = c === mao;
    c.tasks = [
      { type: 'state', s: 'crouch', dur: isMao ? rnd(300, 520) : rnd(550, 800) },
      { type: 'hop', dur: 240, dx: c.dir * c.nose * 0.45, dash: false },
      { type: 'state', s: isMao ? 'slap' : 'boop', dur: isMao ? 600 : 900, onStart: () => isMao ? swat(tx, ty) : boop(tx, ty) }
    ];
  }
  // Sometimes, instead of just running, a cat sits, wiggles its butt to line up, then leaps and dashes in very fast.
  function stalk(c) {
    c.tasks = [
      {
        type: 'state', s: 'crouch', dur: rnd(600, 1050), keep: true, face: () => T.x >= c.x ? 1 : -1,
        onStart: () => { if (Math.random() < .35) say(c, '*butt wiggle*', 900); }
      },
      { type: 'hop', dur: 230, dx: () => c.dir * 58 * u, height: 36, keep: true, onStart: () => skid(c) },
      { type: 'dash', keep: true }
    ];
  }
  function runTask(c, now, dt) {
    const t = c.tasks[0];
    if (!t.t0) { t.t0 = now; t.sx = c.x; if (typeof t.dx === 'function') t.dx = t.dx(); if (t.s) setState(c, t.s); if (t.onStart) t.onStart(c); }
    const el = now - t.t0;
    const done = () => { if (t.onEnd) t.onEnd(c); c.tasks.shift(); if (!c.tasks.length) setState(c, 'idle'); };
    if (t.type === 'goto') {
      const gx = typeof t.x === 'function' ? t.x() : t.x, gy = typeof t.y === 'function' ? t.y() : t.y;
      const arrived = steer(c, gx, gy, t.speed || c.max, dt, now);
      setState(c, gaitFor(c) || 'walk');
      if (arrived || el > 6000) { if (t.face) c.dir = t.face(); done(); }
    } else if (t.type === 'hop') {
      const p = Math.min(1, el / t.dur);
      c.vx = c.vy = 0;
      setState(c, 'air'); c.hopY = -Math.sin(Math.PI * p) * (t.height || 28) * u; c.x = t.sx + t.dx * p;
      if (p >= 1) { c.hopY = 0; land(c); if (t.dash !== false) { c.vx = c.dir * c.max * 1.2 * u; } done(); }
    } else if (t.type === 'dash') {
      const dirTo = T.x >= c.x ? 1 : -1;
      const gx = T.active ? T.x - dirTo * c.nose : c.x, gy = T.active ? T.y + c.off * u + 6 * u : c.y;
      const arrived = steer(c, gx, gy, c.max * 1.9, dt, now, 3, 40);
      setState(c, 'sprint');
      if (arrived || el > 2500 || !T.active) done();
    } else {
      brake(c, dt);
      if (t.face) c.dir = t.face();
      if (t.tick && now - (t.lt || 0) > (t.every || 700)) { t.lt = now; t.tick(c); }
      if (el >= t.dur) done();
    }
  }
  function think(c, now, dt) {
    if (c.tasks.length) { runTask(c, now, dt); return; }
    if (!T.active) { brake(c, dt); setState(c, gaitFor(c) || 'idle'); return; }
    const sp = Math.hypot(c.vx, c.vy);
    if (c.seenId !== T.id) { c.seenId = T.id; if (sp < 30 * u) c.reactAt = now + rnd(...c.react); }
    const dirTo = T.x >= c.x ? 1 : -1;
    if (now < (c.reactAt || 0)) { brake(c, dt); c.dir = dirTo; setState(c, 'crouch'); return; }
    const gx = T.x - dirTo * c.nose, gy = T.y + c.off * u + 6 * u;
    const d = Math.hypot(gx - c.x, gy - c.y);
    if (d > 150 * u && sp < 40 * u && now > (c.stalkCheck || 0)) {
      c.stalkCheck = now + 1600;
      if (Math.random() < (c === mao ? .5 : .3)) { stalk(c); return; }
    }
    if (d > 10 * u || sp > 60 * u) {
      steer(c, gx, gy, c.max, dt, now);
      setState(c, gaitFor(c) || 'crouch');
      if (c === poi && now > poi.nextDistract && Math.random() < dt * 0.3) {
        poi.nextDistract = now + rnd(9000, 14000);
        poi.tasks = [{
          type: 'state', s: 'distracted', dur: rnd(2600, 3600), stubborn: true,
          onStart: () => say(poi, 'PoiPoi got distracted by something.', 2900, pick(DISTRACT))
        }];
      }
    } else {
      brake(c, dt); c.dir = dirTo;
      if (now - T.movedAt < 380) setState(c, 'crouch');
      else if (c.lastPounce !== T.id) { c.lastPounce = T.id; pounce(c); }
      else setState(c, 'idle');
    }
  }

  /* idle behaviours */
  function floorPt() { return [rnd(W * 0.12, W * 0.88), rnd(H * 0.78, H - 10)]; }
  function settingsPt() {
    const r = $('#bSettings').getBoundingClientRect(), s = stage.getBoundingClientRect();
    return [r.left - s.left + r.width / 2, r.top - s.top + r.height * 0.85];
  }
  const lickTick = c => fx(c.x + c.dir * c.nose * 0.8, c.y - c.h * 0.7, Math.random() < .5 ? SVG_SPARK : pick(['lick', 'lick lick']), Math.random() < .5 ? '' : 'tag');
  const IDLE = [
    [3, function playFight() {
      const mx = clamp((poi.x + mao.x) / 2, W * 0.2, W * 0.8), my = clamp((poi.y + mao.y) / 2, H * 0.78, H - 10);
      let ready = 0;
      const go = () => { if (++ready === 2) fightCloud(mx, my, 2500); };
      poi.tasks = [{ type: 'goto', x: mx - 18 * u, y: my, face: () => 1 }, { type: 'state', s: 'fight', dur: 2600, onStart: go }];
      mao.tasks = [{ type: 'goto', x: mx + 16 * u, y: my + 2, face: () => -1 }, { type: 'state', s: 'fight', dur: 2600, onStart: go }];
    }],
    [3, function poiGroomsMao() {
      const side = poi.x < mao.x ? -1 : 1;
      mao.tasks = [{ type: 'state', s: 'loaf', dur: 900 }, { type: 'state', s: 'happy', dur: 3300 }];
      poi.tasks = [{ type: 'goto', x: () => mao.x + side * mao.w * 0.62, y: () => mao.y + 2, speed: 150 },
      {
        type: 'state', s: 'groom', dur: 3400, face: () => -side, tick: lickTick, every: 650,
        onStart: () => say(poi, 'PoiPoi is grooming MaoMao.', 2200)
      }];
    }],
    [2, function poiGroomsSelf() { poi.tasks = [{ type: 'state', s: 'groom', dur: 2800, tick: lickTick, every: 700 }]; }],
    [2, function poiGroomsMohit() {
      poi.tasks = [{ type: 'goto', x: mohit.x - mohit.w * 0.42, y: mohit.y + 2, speed: 160, face: () => 1 },
      {
        type: 'state', s: 'groom', dur: 3200, face: () => 1, tick: lickTick, every: 650,
        onStart: () => { setState(mohit, 'flustered'); say(mohit, '...thank you, PoiPoi?', 2400); },
        onEnd: () => setState(mohit, 'idle')
      }];
    }],
    [1, function maoLoaf() { mao.tasks = [{ type: 'state', s: 'loaf', dur: 4000 }]; }],
    [2, function wander() {
      const c = pick(cats), [x, y] = floorPt();
      c.tasks = [{ type: 'goto', x, y, speed: 110 }, { type: 'state', s: 'loaf', dur: 1800 }];
    }],
    [2, function poiSitsOnSettings() {
      const [x, y] = settingsPt();
      poi.tasks = [{ type: 'goto', x, y, speed: 140 },
      {
        type: 'state', s: 'loaf', dur: 7500, onStart: () => { poi.onSettings = true; say(poi, 'PoiPoi sat on Settings.', 2000); },
        onEnd: () => { poi.onSettings = false; }
      }];
    }],
    [1, function mohitWaves() {
      setState(mohit, 'wave'); say(mohit, pick(['Oh, hi.', 'Hello! Welcome in.', "You're still here?"]), 2000);
      clearTimeout(mohit.gt); mohit.gt = setTimeout(() => setState(mohit, 'idle'), 1150);
    }]
  ];
  let nextIdle = performance.now() + 6000;
  function idleBrain(now) {
    if (T.active || sheetOpen || now < nextIdle || now - lastInput < 3500) return;
    if (poi.tasks.length || mao.tasks.length) return;
    let r = Math.random() * IDLE.reduce((s, b) => s + b[0], 0);
    for (const [w, fn] of IDLE) { if ((r -= w) <= 0) { fn(); break; } }
    nextIdle = now + rnd(5000, 8500);
  }

  /* ---------- tapping characters ---------- */
  const POI_NO = ['PoiPoi does not like being touched.', 'PoiPoi is an independent cat. Please respect that.',
    'PoiPoi has left the chat.', 'No. (signed, PoiPoi)'];
  const MOHIT_LINES = ['Hi. I made a game about my cats.', 'I had a lot of free time.', 'The cats run this place. I just live here.',
    '*fixes glasses*', 'PoiPoi won\'t let me pick him up either.', 'Please follow. I have 44 followers to impress.'];
  let mohitLine = 0;
  function onCharTap(e, ev) {
    ev.stopPropagation(); lastInput = performance.now();
    if (e === poi) {
      cancelTasks(poi); poi.onSettings = false;
      const away = poi.x < W / 2 ? 1 : -1;
      poi.tasks = [{ type: 'state', s: 'annoyed', dur: 650, stubborn: true, onStart: () => say(poi, pick(POI_NO), 2200) },
      { type: 'goto', x: poi.x + away * rnd(120, 190) * u, y: clamp(poi.y + rnd(-30, 30) * u, H * 0.78, H - 10), speed: 300, stubborn: true }];
    } else if (e === mao) {
      cancelTasks(mao); mao.z = 0;
      mao.trust++; store.set('maoTrust', mao.trust);
      if (mao.trust <= 3) {
        mao.tasks = [{ type: 'goto', x: mohit.x + mohit.w * 0.18, y: mohit.y - 8 * u, speed: 420, stubborn: true, onStart: () => { mao.z = -60; } },
        {
          type: 'state', s: 'hide', dur: 2600, stubborn: true, face: () => -1,
          onStart: () => say(mao, mao.trust < 3 ? 'MaoMao is shy. He doesn\'t know you yet.' : 'MaoMao is peeking at you...', 2400),
          onEnd: () => { mao.z = 0; }
        }];
      } else {
        mao.tasks = [{
          type: 'state', s: 'happy', dur: 2200, stubborn: true,
          onStart: () => {
            say(mao, mao.trust === 4 ? 'MaoMao trusts you now. He is a very sweet boy.' : pick(['*purrrr*', 'MaoMao loves you.', '*happy biscuits*']), 2400);
            fx(mao.x, mao.y - mao.h * 0.9, SVG_HEART(24)); setTimeout(() => fx(mao.x + 16 * u, mao.y - mao.h, SVG_HEART(18)), 220);
          }
        }];
      }
    } else {
      const line = MOHIT_LINES[mohitLine++ % MOHIT_LINES.length];
      setState(mohit, line.includes('glasses') ? 'glasses' : 'wave'); say(mohit, line, 2400);
      clearTimeout(mohit.gt); mohit.gt = setTimeout(() => setState(mohit, 'idle'), 1150);
    }
  }
  for (const e of [mohit, poi, mao]) e.el.addEventListener('pointerdown', ev => onCharTap(e, ev));

  /* ---------- JRPG dialog with typewriter ---------- */
  let typing = false, typeT = 0, finishType = () => { };
  function dialog(html, tag = 'SYSTEM') {
    dlg.innerHTML = `<span class="tag">${tag}</span><div class="txt">${html}</div><span class="next">▼</span>`;
    dlg.classList.remove('done'); dlg.hidden = false;
    const nodes = [], tw = document.createTreeWalker(dlg.querySelector('.txt'), NodeFilter.SHOW_TEXT);
    while (tw.nextNode()) { nodes.push({ n: tw.currentNode, full: tw.currentNode.textContent }); tw.currentNode.textContent = ''; }
    let ni = 0, ci = 0; typing = true; clearInterval(typeT);
    finishType = () => { clearInterval(typeT); nodes.forEach(o => o.n.textContent = o.full); typing = false; dlg.classList.add('done'); };
    typeT = setInterval(() => {
      for (let k = 0; k < 2; k++) {
        if (ni >= nodes.length) { finishType(); return; }
        const o = nodes[ni]; ci++; o.n.textContent = o.full.slice(0, ci);
        if (ci >= o.full.length) { ni++; ci = 0; }
      }
    }, 26);
  }
  dlg.addEventListener('pointerdown', e => {
    if (e.target.closest('.hi')) return;
    e.stopPropagation();
    if (typing) finishType(); else dlg.hidden = true;
  });
  document.addEventListener('click', e => {
    const h = e.target.closest('.hi'); if (!h) return;
    e.stopPropagation(); h.classList.toggle('open');
  });
  document.addEventListener('keydown', e => {
    if (e.key !== 'Escape') return;
    if (!dlg.hidden) dlg.hidden = true; else if (sheetOpen) closeSheet();
  });
  $('#bStart').addEventListener('click', () => opts.onStart());
  $('#bLoad').addEventListener('click', () => opts.onLoad());
  $('#bContinue').addEventListener('click', () => opts.hasSave() ? opts.onContinue() : dialog(`Continue what? You haven't even started. ${hi('Arey yaar', 'oh come on, man')}.`));
  $('#bSettings').addEventListener('click', () => {
    if (poi.onSettings) { dialog('PoiPoi is sitting on <b>Settings</b>.<br>Settings belong to PoiPoi now.'); say(poi, '...', 1500); }
    else dialog(`<b>SETTINGS</b><br>Sound: tap the speaker, top right<br>Difficulty: Cat<br>Language: English, with a little ${hi('masala', 'spice')}`);
  });
  $('#bParty').addEventListener('click', openSheet);

  /* ---------- party sheet ---------- */
  const PARTY = [
    {
      kind: 'mohit', name: 'Mohit', role: 'THE HUMAN', color: '#ff4f8b', b1: '#ffd6e4', b2: '#ffc4d8', tilt: '-1deg',
      facts: 'Human · shirt + beige pants · gold glasses',
      about: 'Had way too much free time and made a whole game about his cats, who are clearly in charge.',
      stats: [['FREE TIME', 10], ['HAIR', 8], ['ATK', 3]],
      skills: ['Fix Glasses', 'Hair Flip', 'Coke Zero Chug', 'Post a Story'], ult: hi('Jugaad', 'a hacky, improvised fix'),
      tries: [['Idle', 'idle'], ['Wave', 'wave'], ['Fix glasses', 'glasses'], ['Getting groomed', 'flustered']]
    },
    {
      kind: 'poi', name: 'PoiPoi', role: 'DIPLOMAT', color: '#3a9cf0', b1: '#d6ecff', b2: '#c4e2ff', tilt: '1deg',
      facts: `Ragdoll · ${age(DOB.poi)} · boy`,
      about: `Physically incapable of violence. A VERY independent ${hi('billa', 'tomcat')}. Hates being picked up. Gets distracted.`,
      stats: [['FLUFF', 10], ['FOCUS', 1], ['ATK', 0]],
      skills: ['Slow Blink', 'Offer Groom', 'Loaf Nearby', 'Ignore Completely'], ult: 'Marshmallow Aura',
      tries: [['Idle', 'idle'], ['Run', 'run'], ['Boop', 'boop'], ['Groom', 'groom'], ['Distracted', 'distracted'], ['Annoyed', 'annoyed']]
    },
    {
      kind: 'mao', name: 'MaoMao', role: 'TINY MENACE', color: '#8a63f0', b1: '#e6dcff', b2: '#d8caff', tilt: '-.6deg',
      facts: `Persian · ${age(DOB.mao)} · boy · very tiny`,
      about: 'Shy with strangers. Very sharp claws. Also a very sweet, cuddly boy.',
      stats: [['CLAWS', 9], ['SHY', 8], ['SIZE', 2]],
      skills: ['Needle Claws', 'Sideways Hop', 'Ankle Ambush', 'Cuddle Heal'], ult: 'Kitten Fury',
      tries: [['Idle', 'idle'], ['Sprint', 'sprint'], ['Pounce', 'crouch'], ['Swat', 'slap'], ['Shy', 'hide'], ['Purr', 'happy'], ['Loaf', 'loaf']]
    }
  ];
  function buildSheet() {
    sheet.innerHTML = `<div class="sheet-inner">
    <div class="sheet-head"><div><h2>THE PARTY</h2><p>Tap the buttons to try each animation</p></div>
    <button class="btn close" type="button" id="bClose" aria-label="Close"><span>✕</span></button></div>
    <div class="cards">${PARTY.map((p, i) => `
      <article class="card" style="--role:${p.color};--box-1:${p.b1};--box-2:${p.b2};--tilt:${p.tilt}">
        <div class="band"><h3>${p.name}</h3><span class="role">${p.role}</span></div>
        <div class="stagebox" data-slot="${i}"></div>
        <div class="body">
          <p class="facts">${p.facts}</p>
          <p class="about">${p.about}</p>
          <div class="stats">${p.stats.map(([k, v]) => `<span>${k}</span><span class="bar">${Array.from({ length: 10 }, (_, j) => `<i class="${j < v ? 'on' : ''}"></i>`).join('')}</span><span class="n">${v}</span>`).join('')}</div>
          <div class="chips">${p.skills.map(s => `<span>${s}</span>`).join('')}<span class="ult">★ ${p.ult}</span></div>
          <div class="try"><span class="label">TRY:</span>${p.tries.map(([l, s]) => `<button type="button" data-i="${i}" data-s="${s}">${l}</button>`).join('')}</div>
        </div>
      </article>`).join('')}</div>`;
    PARTY.forEach((p, i) => {
      const sp = makeSprite(p.kind);
      const sc = p.kind === 'mohit' ? 5 : p.kind === 'poi' ? 8 : 6;
      sp.style.width = DIMS[p.kind][0] * sc + 'px'; sp.style.height = DIMS[p.kind][1] * sc + 'px';
      sp.querySelector('.bubble').remove();
      p.sprite = sp; p.state = 'idle';
      sheet.querySelector(`[data-slot="${i}"]`).appendChild(sp);
    });
    sheet.querySelector('#bClose').addEventListener('click', closeSheet);
    sheet.addEventListener('pointerdown', e => e.stopPropagation());
    sheet.addEventListener('click', e => {
      const b = e.target.closest('.try button'); if (!b) return;
      const p = PARTY[+b.dataset.i], sp = p.sprite;
      sp.classList.remove('st-' + p.state); p.state = b.dataset.s; sp.classList.add('st-' + p.state);
      clearTimeout(p.t);
      if (['boop', 'slap', 'glasses', 'crouch', 'wave'].includes(p.state))
        p.t = setTimeout(() => { sp.classList.remove('st-' + p.state); p.state = 'idle'; sp.classList.add('st-idle'); }, 1400);
    });
  }
  function openSheet() { if (!sheet.firstChild) buildSheet(); sheet.hidden = false; sheetOpen = true; T.active = false; laser.classList.remove('on'); }
  function closeSheet() { sheet.hidden = true; sheetOpen = false; }

  /* ---------- loop ---------- */
  size();
  poi.x = -70; poi.y = H - 40 * u; mao.x = -130; mao.y = H - 22 * u; poi.dir = mao.dir = 1;
  poi.tasks = [{ type: 'goto', x: W * 0.3, y: H - 46 * u, speed: 240 },
  { type: 'state', s: 'idle', dur: 200, onStart: () => say(poi, 'PoiPoi has entered the website.', 2400) }];
  mao.tasks = [{ type: 'state', s: 'idle', dur: 900 }, { type: 'goto', x: W * 0.5, y: H - 24 * u, speed: 300 },
  { type: 'state', s: 'hide', dur: 1400, onStart: () => say(mao, '...', 1400) }];
  land(mohit);
  let rT = 0;
  addEventListener('resize', () => { clearTimeout(rT); rT = setTimeout(size, 120); });

  let last = performance.now(), paused = false;
  function frame(now) {
    if (paused) { last = now; requestAnimationFrame(frame); return; }
    const dt = Math.min(0.05, (now - last) / 1000); last = now;
    if (T.active && now > T.expires) { T.active = false; laser.classList.remove('on'); }
    if (!sheetOpen) {
      idleBrain(now);
      for (const c of cats) think(c, now, dt);
    }
    for (const e of [mohit, poi, mao]) place(e);
    animateSprites(now);
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
  const api = {
    hide() { paused = true; stage.hidden = true; T.active = false; laser.classList.remove('on'); },
    show() { paused = false; stage.hidden = false; size(); }
  };
  return api;
}
