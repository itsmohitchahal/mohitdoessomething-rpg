import { ROOM_DEFS, DESK, CHAIR, pianoSVG, GUITAR } from './art/furniture.js';
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
  set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} }
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

/* ---------- fairy lights ---------- */
function buildLights() {
  const svg = $('#lights'), w = stage.clientWidth;
  const paths = [`M -20 6 Q ${w * .25} 74 ${w * .5} 14 T ${w + 20} 6`, `M -20 46 Q ${w * .18} 104 ${w * .4} 48 T ${w * .82} 46 T ${w * 1.25} 46`];
  const cols = ['#ffd77a', '#fff1c9', '#ff9ec0', '#ffd77a', '#9fe8ff'];
  let html = '';
  paths.forEach((d, pi) => {
    html += `<path class="wire" d="${d}"/>`;
  });
  svg.innerHTML = html;
  const bulbs = [];
  svg.querySelectorAll('.wire').forEach((p, pi) => {
    const len = p.getTotalLength();
    for (let s = 18 + pi * 9; s < len; s += 40) {
      const pt = p.getPointAtLength(s), c = cols[(s / 40 | 0) % 5];
      bulbs.push(`<g class="bulb" style="animation-delay:${(-Math.random() * 2.4).toFixed(2)}s"><rect x="${pt.x - 2.5}" y="${pt.y - 1}" width="5" height="5" rx="1" fill="${INK}"/>
        <circle cx="${pt.x}" cy="${pt.y + 9}" r="9" fill="${c}" opacity=".22"/><ellipse cx="${pt.x}" cy="${pt.y + 9}" rx="4.2" ry="5.4" fill="${c}" stroke="${INK}" stroke-width="1.5"/></g>`);
    }
  });
  svg.insertAdjacentHTML('beforeend', bulbs.join(''));
}

function buildRoom() {
  const R = $('#room');
  const s = clamp(Math.min(W / 560, H / 820), 0.6, 1.15);
  const rh = 160 * s;
  R.setAttribute('viewBox', `0 0 ${W} ${rh}`);
  R.style.height = rh + 'px';
  R.style.bottom = `calc(31% - ${16 * s}px)`;
  const pad = Math.max(10, W * 0.04);
  const deskX = pad, pianoX = W - pad - 152 * s;
  const gapL = deskX + 172 * s;
  // the guitar leans in the gap between desk and piano, or tucks behind the piano's end on narrow screens
  const gx = pianoX - gapL > 40 * s ? (gapL + pianoX) / 2 : pianoX + 8 * s;
  const at = (x, y, inner) => `<g transform="translate(${x} ${y}) scale(${s})">${inner}</g>`;
  R.innerHTML = ROOM_DEFS + at(gx, rh - 4 * s, GUITAR) + at(deskX, rh, DESK) + at(pianoX, rh - 2 * s, pianoSVG()) + at(deskX + 50 * s, rh + 14 * s, CHAIR);
}

/* ---------- art ---------- */
const CATS = {
  poi: { fur: '#fffaf4', shade: '#efe4da', far: '#ece2d8', ruff: '#ffffff', ear: '#6e6676', earShade: '#57505f', earIn: '#f6b3c6',
         tail: '#8b8393', tailShade: '#6e6676', eye: '#a6d8ff', eyeDark: '#4b9be8', mask: true, toes: true, soft: true },
  mao: { fur: '#666270', shade: '#4f4b59', far: '#55515f', ruff: '#7d7987', ear: '#5a5664', earShade: '#45414f', earIn: '#d58ea3',
         tail: '#5d5967', tailShade: '#45414f', eye: '#ffad33', eyeDark: '#c86a10', stripes: '#3d3947', persian: true }
};
function catSVG(o) {
  const S = `stroke="${INK}" stroke-width="3.2" stroke-linejoin="round" stroke-linecap="round"`;
  const leg = (cls, x, y, fill, extra = '') => `<g class="leg ${cls}">
    <path d="M${x} ${y} L${x + 14} ${y} L${x + 13} ${y + 20} Q${x + 13} ${y + 25} ${x + 7} ${y + 25} Q${x + 1} ${y + 25} ${x + 1} ${y + 20} Z" fill="${fill}" ${S}/>
    <path d="M${x + 5} ${y + 21} v3.5 M${x + 9} ${y + 21} v3.5" stroke="${INK}" stroke-width="1.6" stroke-linecap="round"/>${extra}</g>`;
  const toes = o.toes ? `<circle cx="109.5" cy="122" r="2" fill="#6e6676"/><circle cx="113.5" cy="123" r="2" fill="#6e6676"/><circle cx="117.5" cy="122" r="2" fill="#6e6676"/>` : '';
  const claws = `<g class="claws" fill="#fff" stroke="${INK}" stroke-width="1.2" stroke-linejoin="round"><path d="M119 116 l7 1.5 l-7 2z"/><path d="M119 120 l7 1.5 l-7 2z"/><path d="M118 124 l6 1.5 l-6 1.8z"/></g>`;
  // PoiPoi (soft) gets rounded, scalloped fluff; MaoMao keeps the spiky kitten fluff.
  const body = o.soft
    ? 'M44 96 C 40 80 52 68 72 67 Q 78 63 84 67 C 96 66 106 71 113 80 Q 120 84 115 89 Q 121 94 113 97 C 110 108 96 114 78 114 Q 72 119 67 114 C 54 113 44 108 44 96 Z'
    : 'M44 96 C 40 80 52 68 70 67 L76 62 L80 68 C 92 66 104 70 112 80 L118 84 L113 88 L119 93 L112 96 C 110 108 96 114 78 114 L72 119 L68 113 C 54 113 44 108 44 96 Z';
  const head = o.soft
    ? 'M108 24 C 130 24 144 40 143 58 Q 150 62 145 68 Q 149 74 140 76 C 133 88 121 94 108 94 C 95 94 83 88 76 76 Q 67 74 71 68 Q 66 62 73 58 C 72 40 86 24 108 24 Z'
    : 'M108 26 C 128 26 142 40 142 56 L149 62 L141 64 L147 71 L138 72 C 132 86 120 92 108 92 C 96 92 84 86 78 72 L69 71 L75 64 L67 62 L74 56 C 74 40 88 26 108 26 Z';
  const tail = o.soft
    ? 'M52 94 C 30 96 12 84 11 62 Q 5 56 13 54 Q 10 46 19 48 Q 22 40 28 47 C 31 62 36 76 54 84 Z'
    : 'M52 94 C 30 96 14 84 12 64 L7 58 L14 57 L11 49 L19 52 L20 44 L26 51 C 30 64 34 76 54 84 Z';
  const ruff = o.soft
    ? 'M99 72 Q 108 76 103 81 Q 111 85 104 90 Q 110 95 99 96 C 93 88 93 80 99 72Z'
    : 'M100 74 L106 80 L101 82 L108 88 L102 90 L107 97 L97 96 C 93 88 94 80 100 74Z';
  const ears = o.persian
    ? [`<path d="M84 42 L84 21 L101 33 Z" fill="${o.ear}" ${S}/><path d="M87 37 L87 26 L97 33 Z" fill="${o.earIn}"/><path d="M89 35 l3 -5 M92 36 l3 -4" stroke="#fff" stroke-width="1.4" stroke-linecap="round" opacity=".8"/>`,
       `<path d="M117 33 L134 21 L133 43 Z" fill="${o.ear}" ${S}/><path d="M120 33 L131 26 L130 39 Z" fill="${o.earIn}"/>`]
    : [`<path d="M80 47 Q 76 21 79 11 Q 94 18 104 31 Z" fill="${o.ear}" ${S}/><path d="M85 40 Q 83 25 85 18 Q 94 24 99 31 Z" fill="${o.earIn}"/><path d="M88 37 q2 -4 4 -6 M91 39 q3 -4 5 -5" stroke="#fff" stroke-width="1.6" fill="none" stroke-linecap="round"/>`,
       `<path d="M116 31 Q 130 17 142 13 Q 142 31 139 49 Z" fill="${o.ear}" ${S}/><path d="M121 32 Q 131 22 138 19 Q 138 31 135 43 Z" fill="${o.earIn}"/><path d="M125 35 q4 -3 6 -3 M127 39 q4 -2 6 -2" stroke="#fff" stroke-width="1.6" fill="none" stroke-linecap="round"/>`];
  const ey = o.persian ? 63 : 62, rx = o.persian ? 9.6 : 9.8, ry = o.persian ? 10.2 : 11, ex = [98, 123];
  const eye = x => `<g>
    <ellipse cx="${x}" cy="${ey}" rx="${rx}" ry="${ry}" fill="${o.eye}" stroke="${INK}" stroke-width="2.2"/>
    <path d="M${x - rx + 1} ${ey - 1} Q${x} ${ey - ry - 1} ${x + rx - 1} ${ey - 1} Q${x} ${ey - ry * .35} ${x - rx + 1} ${ey - 1}Z" fill="${o.eyeDark}" opacity="${o.soft ? .6 : .85}"/>
    <ellipse cx="${x + .6}" cy="${ey + .8}" rx="${rx * .42}" ry="${ry * (o.soft ? .66 : .72)}" fill="${INK}"/>
    <circle cx="${x - rx * .3}" cy="${ey - ry * .36}" r="${rx * (o.soft ? .4 : .36)}" fill="#fff"/><circle cx="${x + rx * .38}" cy="${ey + ry * .42}" r="${o.soft ? 2 : 1.4}" fill="#fff"/>
    ${o.soft
      ? `<path d="M${x - rx - 1} ${ey - 2} Q${x} ${ey - ry - 3.5} ${x + rx + 1} ${ey - 2}" stroke="${INK}" stroke-width="3" fill="none" stroke-linecap="round"/><path d="M${x + rx} ${ey - 3} l3 -3" stroke="${INK}" stroke-width="2.2" stroke-linecap="round"/>`
      : `<path d="M${x - rx - 1.5} ${ey - 2} Q${x} ${ey - ry - 4.5} ${x + rx + 1.5} ${ey - 3} l3.5 -2.5" stroke="${INK}" stroke-width="3.6" fill="none" stroke-linecap="round"/>`}</g>`;
  const ny = 74;
  const headShade = o.soft ? 'M76 76 C 83 88 95 94 108 94 C 96 89 88 82 86 70 L78 68 Z' : 'M78 72 C 84 86 96 92 108 92 C 96 87 88 80 86 68 L80 67 Z';
  return `<svg viewBox="0 0 160 130" aria-hidden="true">
  ${o.mask ? `<defs><radialGradient id="poiMask" cx="50%" cy="50%" r="50%"><stop offset="0" stop-color="#776f80" stop-opacity=".7"/><stop offset=".55" stop-color="#8b8393" stop-opacity=".35"/><stop offset="1" stop-color="#8b8393" stop-opacity="0"/></radialGradient></defs>` : ''}
  <g class="up"><g class="tail-g">
    <path d="${tail}" fill="${o.tail}"/>
    <path d="M52 94 C 34 95 20 86 15 70 C 24 80 36 86 54 88 Z" fill="${o.tailShade}"/>
    <path d="${tail}" fill="none" ${S}/>
  </g></g>
  ${leg('leg-fb', 50, 98, o.far)}${leg('leg-ff', 95, 98, o.far)}
  <g class="up"><g class="breath">
    <path d="${body}" fill="${o.fur}"/>
    <path d="M47 101 C 60 110 96 112 111 99 C 107 109 95 114 78 114 Q 72 119 67 114 C 56 113 49 108 47 101Z" fill="${o.shade}"/>
    ${o.stripes ? `<path d="M56 70 l3 12 M66 67 l2 13 M77 67 l1 12 M88 69 l-1 10" stroke="${o.stripes}" stroke-width="4" stroke-linecap="round"/>` : ''}
    <path d="${ruff}" fill="${o.ruff}"/>
    <path d="M60 80 l-4 3 M70 87 l-4 3 M84 80 l-4 3" stroke="${INK}" stroke-width="1.5" stroke-linecap="round" opacity="${o.soft ? .2 : .35}"/>
    <path d="M60 73 C 66 70 74 69 82 70" stroke="#fff" stroke-width="2.6" fill="none" stroke-linecap="round" opacity=".55"/>
    <path d="${body}" fill="none" ${S}/>
  </g></g>
  ${leg('leg-nb', 62, 100, o.fur)}${leg('leg-nf', 106, 100, o.fur, toes + claws)}
  <g class="up"><g class="head">
    <g class="ear ear-far">${ears[0]}</g><g class="ear ear-near">${ears[1]}</g>
    <path d="${head}" fill="${o.fur}"/>
    <path d="${headShade}" fill="${o.shade}"/>
    ${o.mask ? `<ellipse cx="109" cy="71" rx="24" ry="19" fill="url(#poiMask)"/>` : ''}
    ${o.stripes ? `<path d="M99 33 l3 9 l4 -7 l3 7 l4 -9" stroke="${o.stripes}" stroke-width="3.2" fill="none" stroke-linecap="round" stroke-linejoin="round"/><path d="M79 66 l8 2 M81 72 l7 0 M138 66 l-8 2" stroke="${o.stripes}" stroke-width="2.8" stroke-linecap="round"/>` : ''}
    ${o.soft ? '' : `<path d="M90 44 l-3 3 M128 44 l3 3" stroke="${INK}" stroke-width="1.5" stroke-linecap="round" opacity=".35"/>`}
    <path d="${head}" fill="none" ${S}/>
    <g class="eyes-open">${eye(ex[0])}${eye(ex[1])}</g>
    <g class="eyes-closed" stroke="${INK}" stroke-width="3" fill="none" stroke-linecap="round">
      ${o.soft ? `<path d="M${ex[0] - 7} ${ey} q7 6 14 0"/><path d="M${ex[1] - 7} ${ey} q7 6 14 0"/>` : `<path d="M${ex[0] - 7} ${ey + 1} l7 -6 l7 6"/><path d="M${ex[1] - 7} ${ey + 1} l7 -6 l7 6"/>`}</g>
    ${o.soft ? `<ellipse cx="${ex[0] - 9}" cy="${ey + 13}" rx="6.5" ry="3.6" fill="#ff8fab" opacity=".5"/><ellipse cx="${ex[1] + 9}" cy="${ey + 12}" rx="6.5" ry="3.6" fill="#ff8fab" opacity=".5"/>` : ''}
    <path d="M${ex[0] - 14} ${ey + 13} l3 -4 M${ex[0] - 10} ${ey + 13} l3 -4 M${ex[0] - 6} ${ey + 13} l3 -4 M${ex[1] + 5} ${ey + 12} l3 -4 M${ex[1] + 9} ${ey + 12} l3 -4 M${ex[1] + 13} ${ey + 12} l3 -4" stroke="#ff5f8a" stroke-width="${o.soft ? 1.6 : 2}" stroke-linecap="round"/>
    <path d="M${o.persian ? 108 : 107.5} ${ny - 2} l${o.persian ? 5 : 6} 0 l-${o.persian ? 2.5 : 3} 3.8 z" fill="#ff7f9e" stroke="${INK}" stroke-width="1.8" stroke-linejoin="round"/>
    <path d="M${o.persian ? 105.5 : 105} ${ny + 4} q3 3 5.5 0 q3 3 5.5 0" stroke="${INK}" stroke-width="2.2" fill="none" stroke-linecap="round"/>
    <path class="tongue" d="M108 ${ny + 6} q3 7 6 0 z" fill="#ff6a8e" stroke="${INK}" stroke-width="1.6" stroke-linejoin="round"/>
    <path d="M130 ${ny} l15 -4 M130 ${ny + 4} l15 1 M86 ${ny} l-15 -4 M86 ${ny + 4} l-15 1" stroke="${INK}" stroke-width="1.4" stroke-linecap="round" opacity=".55"/>
  </g></g>
</svg>`;
}

function mohitSVG() {
  const S = `stroke="${INK}" stroke-width="3" stroke-linejoin="round" stroke-linecap="round"`;
  const skin = '#f5cfb3', skinShade = '#e2ad8d', shirt = '#24202e', shirtLight = '#3a3449', pant = '#d9bf94', pantShade = '#bf9f72', hair = '#1f1820', hairHi = '#43354a';
  const headD = 'M30 52 C 30 30 46 16 65 16 C 84 16 100 30 100 52 C 100 70 90 84 65 86 C 40 84 30 70 30 52 Z';
  const fringe = 'M27 54 C 24 26 44 9 66 9 C 89 9 107 26 103 54 L97 43 L95 55 L89 40 L84 51 L79 38 L72 50 L68 36 L61 49 L56 37 L48 49 L45 37 L38 51 L35 42 L31 58 Z';
  return `<svg viewBox="0 0 130 190" aria-hidden="true">
  <g class="m-body">
    <path d="M40 184 Q40 176 52 176 Q63 176 64 184 Z" fill="#2a2230" ${S}/><path d="M66 184 Q67 176 78 176 Q90 176 90 184 Z" fill="#2a2230" ${S}/>
    <path d="M42 131 L64 131 L63 178 L45 178 Z" fill="${pant}" ${S}/><path d="M66 131 L88 131 L85 178 L67 178 Z" fill="${pant}" ${S}/>
    <path d="M57 134 L63 134 L62.5 176 L58 176 Z M67 134 L73 134 L72 176 L67.5 176 Z" fill="${pantShade}"/>
    <path d="M52 137 L53 174 M78 137 L77 174" stroke="${pantShade}" stroke-width="1.8" stroke-linecap="round"/>
    <path d="M38 96 Q40 88 52 86 L78 86 Q90 88 92 96 L94 132 L36 132 Z" fill="${shirt}" ${S}/>
    <path d="M80 88 Q90 90 92 98 L93.5 130 L84 130 Z" fill="${shirtLight}"/>
    <path d="M65 94 L65 129" stroke="${shirtLight}" stroke-width="2"/>
    <circle cx="65" cy="106" r="1.5" fill="#8f879c"/><circle cx="65" cy="116" r="1.5" fill="#8f879c"/><circle cx="65" cy="125" r="1.5" fill="#8f879c"/>
    <rect x="37" y="127" width="57" height="6" fill="${INK}"/><rect x="60" y="126" width="10" height="8" rx="1.5" fill="#d7dae2" stroke="${INK}" stroke-width="1.5"/>
    <path d="M58 86 L65 96 L72 86Z" fill="${skin}"/>
    <path d="M50 86 L62 97 L60 85 Z M80 86 L68 97 L70 85 Z" fill="#2f2a3c" ${S}/>
    <path d="M40 92 Q30 98 30 112 L33 128 L45 128 L43 112 Q44 104 47 98 Z" fill="${shirt}" ${S}/>
    <path d="M33 127 L45 127" stroke="${shirtLight}" stroke-width="2.5"/>
    <g class="m-arm">
      <path d="M90 92 Q100 98 100 112 L98 126 L89 126 L89 112 Q88 104 85 98 Z" fill="${shirt}" ${S}/>
      <path d="M93 98 Q99 104 99 112 L97.5 124 L93 124 Z" fill="${shirtLight}"/>
      <rect x="89" y="118" width="10" height="5" rx="1.5" fill="#d7dae2" stroke="${INK}" stroke-width="1.4"/>
      <path d="M89.5 126 Q88 135 94.5 136 Q100.5 135 98.5 126 Z" fill="${skin}" ${S}/>
    </g>
  </g>
  <g class="m-head">
    <path d="M24 60 C 18 30 40 8 66 8 C 92 8 112 28 106 62 L99 72 L97 58 L33 58 L31 72 Z" fill="${hair}" ${S}/>
    <rect x="58" y="76" width="14" height="12" fill="${skinShade}"/>
    <path d="M29 50 Q22 52 24 60 Q26 66 31 64 Z M101 50 Q108 52 106 60 Q104 66 99 64 Z" fill="${skin}" ${S}/>
    <path d="${headD}" fill="${skin}"/>
    <path d="M30 52 C 30 70 40 84 65 86 C 49 81 40 69 39 54 Z" fill="${skinShade}" opacity=".7"/>
    <path d="${headD}" fill="none" ${S}/>
    <path d="M40 73 l3 -4 M44 73 l3 -4 M48 73 l3 -4 M80 73 l3 -4 M84 73 l3 -4 M88 73 l3 -4" stroke="#ff7f9c" stroke-width="1.8" stroke-linecap="round" opacity=".8"/>
    <g class="m-eyes"><g class="m-pupils">
      <ellipse cx="52" cy="59" rx="3.7" ry="4.8" fill="${INK}"/><ellipse cx="78" cy="59" rx="3.7" ry="4.8" fill="${INK}"/>
      <circle cx="50.8" cy="57.4" r="1.4" fill="#fff"/><circle cx="76.8" cy="57.4" r="1.4" fill="#fff"/></g></g>
    <path d="M45 48 l10 -1.5 M75 46.5 l10 1.5" stroke="${INK}" stroke-width="2.8" stroke-linecap="round"/>
    <g class="m-glasses">
      <rect x="41" y="49" width="22" height="19" rx="6" fill="rgba(255,255,255,.16)" stroke="#d6a640" stroke-width="2.6"/>
      <rect x="67" y="49" width="22" height="19" rx="6" fill="rgba(255,255,255,.16)" stroke="#d6a640" stroke-width="2.6"/>
      <path d="M63 55 Q65 53 67 55 M41 55 L31 53 M89 55 L99 53" stroke="#d6a640" stroke-width="2.4" fill="none" stroke-linecap="round"/>
      <path class="glint" d="M45 54 l5 -3 M71 54 l5 -3" stroke="#fff" stroke-width="2.4" stroke-linecap="round"/>
    </g>
    <path class="m-mouth" d="M58 75 Q65 79.5 72 75" stroke="${INK}" stroke-width="2.5" fill="none" stroke-linecap="round"/>
    <path class="m-mouth-open" d="M58 74 Q65 74 72 74 Q70 82 65 82 Q60 82 58 74Z" fill="#a8364f" stroke="${INK}" stroke-width="2.2" stroke-linejoin="round"/>
    <path d="${fringe}" fill="${hair}" ${S}/>
    <path d="M42 22 L54 15 L49 27 Z M70 15 L84 18 L74 25 Z M92 26 L98 34 L90 33 Z" fill="${hairHi}"/>
    <path d="M60 13 L57 30 M77 13 L81 31 M47 20 L41 34" stroke="${hairHi}" stroke-width="1.8" stroke-linecap="round"/>
    <g class="m-fly"><path d="M58 11 Q54 1 45 3 M73 10 Q80 0 89 4 M66 9 Q66 2 70 -1" stroke="${hair}" stroke-width="3" fill="none" stroke-linecap="round"/></g>
    <path class="sweat" d="M104 36 q6 9 0 12 q-6 -3 0 -12z" fill="#9fd8ff" stroke="${INK}" stroke-width="2"/>
  </g>
</svg>`;
}
function makeSprite(kind) {
  const el = document.createElement('div');
  el.className = `sprite ${kind === 'mohit' ? 'mohit' : 'cat ' + kind} st-idle`;
  el.setAttribute('role', 'button');
  el.setAttribute('aria-label', { mohit: 'Mohit', poi: 'PoiPoi', mao: 'MaoMao' }[kind]);
  el.innerHTML = `<div class="shadow"></div><div class="flip"><div class="squash">${kind === 'mohit' ? mohitSVG() : catSVG(CATS[kind])}</div></div><div class="bubble" hidden></div>`;
  return el;
}

/* ---------- entities ---------- */
let W = 0, H = 0, u = 1;
function ent(kind, base) {
  const el = makeSprite(kind); world.appendChild(el);
  return { kind, el, flip: el.querySelector('.flip'), bub: el.querySelector('.bubble'), base,
    x: 0, y: 0, vx: 0, vy: 0, w: 0, h: 0, dir: 1, hopY: 0, z: 0, state: 'idle', tasks: [], bw: 0, burst: 1, burstAt: 0 };
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
    e.w = e.base * u; e.h = e.kind === 'mohit' ? e.w * 190 / 130 : e.w * 130 / 160;
    e.el.style.width = e.w + 'px'; e.el.style.height = e.h + 'px';
    e.foot = e.kind === 'mohit' ? 0.975 : 0.955;
    e.nose = e.kind === 'mohit' ? 0 : e.w * 0.24;
  }
  mohit.x = clamp(W * 0.75, mohit.w * 0.6, W - mohit.w * 0.6); mohit.y = H - 14 * u;
  buildLights();
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
  try { navigator.vibrate && navigator.vibrate(18); } catch {}
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
    { type: 'state', s: 'crouch', dur: rnd(600, 1050), keep: true, face: () => T.x >= c.x ? 1 : -1,
      onStart: () => { if (Math.random() < .35) say(c, '*butt wiggle*', 900); } },
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
      poi.tasks = [{ type: 'state', s: 'distracted', dur: rnd(2600, 3600), stubborn: true,
        onStart: () => say(poi, 'PoiPoi got distracted by something.', 2900, pick(DISTRACT)) }];
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
      { type: 'state', s: 'groom', dur: 3400, face: () => -side, tick: lickTick, every: 650,
        onStart: () => say(poi, 'PoiPoi is grooming MaoMao.', 2200) }];
  }],
  [2, function poiGroomsSelf() { poi.tasks = [{ type: 'state', s: 'groom', dur: 2800, tick: lickTick, every: 700 }]; }],
  [2, function poiGroomsMohit() {
    poi.tasks = [{ type: 'goto', x: mohit.x - mohit.w * 0.42, y: mohit.y + 2, speed: 160, face: () => 1 },
      { type: 'state', s: 'groom', dur: 3200, face: () => 1, tick: lickTick, every: 650,
        onStart: () => { setState(mohit, 'flustered'); say(mohit, '...thank you, PoiPoi?', 2400); },
        onEnd: () => setState(mohit, 'idle') }];
  }],
  [1, function maoLoaf() { mao.tasks = [{ type: 'state', s: 'loaf', dur: 4000 }]; }],
  [2, function wander() {
    const c = pick(cats), [x, y] = floorPt();
    c.tasks = [{ type: 'goto', x, y, speed: 110 }, { type: 'state', s: 'loaf', dur: 1800 }];
  }],
  [2, function poiSitsOnSettings() {
    const [x, y] = settingsPt();
    poi.tasks = [{ type: 'goto', x, y, speed: 140 },
      { type: 'state', s: 'loaf', dur: 7500, onStart: () => { poi.onSettings = true; say(poi, 'PoiPoi sat on Settings.', 2000); },
        onEnd: () => { poi.onSettings = false; } }];
  }],
  [1, function mohitWaves() { setState(mohit, 'wave'); say(mohit, pick(['Oh, hi.', 'Hello! Welcome in.', "You're still here?"]), 2000);
    clearTimeout(mohit.gt); mohit.gt = setTimeout(() => setState(mohit, 'idle'), 1150); }]
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
        { type: 'state', s: 'hide', dur: 2600, stubborn: true, face: () => -1,
          onStart: () => say(mao, mao.trust < 3 ? 'MaoMao is shy. He doesn\'t know you yet.' : 'MaoMao is peeking at you...', 2400),
          onEnd: () => { mao.z = 0; } }];
    } else {
      mao.tasks = [{ type: 'state', s: 'happy', dur: 2200, stubborn: true,
        onStart: () => {
          say(mao, mao.trust === 4 ? 'MaoMao trusts you now. He is a very sweet boy.' : pick(['*purrrr*', 'MaoMao loves you.', '*happy biscuits*']), 2400);
          fx(mao.x, mao.y - mao.h * 0.9, SVG_HEART(24)); setTimeout(() => fx(mao.x + 16 * u, mao.y - mao.h, SVG_HEART(18)), 220);
        } }];
    }
  } else {
    const line = MOHIT_LINES[mohitLine++ % MOHIT_LINES.length];
    setState(mohit, line.includes('glasses') ? 'glasses' : 'wave'); say(mohit, line, 2400);
    clearTimeout(mohit.gt); mohit.gt = setTimeout(() => setState(mohit, 'idle'), 1150);
  }
}
for (const e of [mohit, poi, mao]) e.el.addEventListener('pointerdown', ev => onCharTap(e, ev));

/* ---------- JRPG dialog with typewriter ---------- */
let typing = false, typeT = 0, finishType = () => {};
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
$('#bContinue').addEventListener('click', () => opts.hasSave() ? opts.onContinue() : dialog(`Continue what? You haven't even started. ${hi('Arey yaar', 'oh come on, man')}.`));
$('#bSettings').addEventListener('click', () => {
  if (poi.onSettings) { dialog('PoiPoi is sitting on <b>Settings</b>.<br>Settings belong to PoiPoi now.'); say(poi, '...', 1500); }
  else dialog(`<b>SETTINGS</b><br>Sound: tap the speaker, top right<br>Difficulty: Cat<br>Language: English, with a little ${hi('masala', 'spice')}`);
});
$('#bParty').addEventListener('click', openSheet);

/* ---------- party sheet ---------- */
const PARTY = [
  { kind: 'mohit', name: 'Mohit', role: 'THE HUMAN', color: '#ff4f8b', b1: '#ffd6e4', b2: '#ffc4d8', tilt: '-1deg',
    facts: 'Human · shirt + beige pants · gold glasses',
    about: 'Had way too much free time and made a whole game about his cats, who are clearly in charge.',
    stats: [['FREE TIME', 10], ['HAIR', 8], ['ATK', 3]],
    skills: ['Fix Glasses', 'Hair Flip', 'Coke Zero Chug', 'Post a Story'], ult: hi('Jugaad', 'a hacky, improvised fix'),
    tries: [['Idle', 'idle'], ['Wave', 'wave'], ['Fix glasses', 'glasses'], ['Getting groomed', 'flustered']] },
  { kind: 'poi', name: 'PoiPoi', role: 'DIPLOMAT', color: '#3a9cf0', b1: '#d6ecff', b2: '#c4e2ff', tilt: '1deg',
    facts: `Ragdoll · ${age(DOB.poi)} · boy`,
    about: `Physically incapable of violence. A VERY independent ${hi('billa', 'tomcat')}. Hates being picked up. Gets distracted.`,
    stats: [['FLUFF', 10], ['FOCUS', 1], ['ATK', 0]],
    skills: ['Slow Blink', 'Offer Groom', 'Loaf Nearby', 'Ignore Completely'], ult: 'Marshmallow Aura',
    tries: [['Idle', 'idle'], ['Run', 'run'], ['Boop', 'boop'], ['Groom', 'groom'], ['Distracted', 'distracted'], ['Annoyed', 'annoyed']] },
  { kind: 'mao', name: 'MaoMao', role: 'TINY MENACE', color: '#8a63f0', b1: '#e6dcff', b2: '#d8caff', tilt: '-.6deg',
    facts: `Persian · ${age(DOB.mao)} · boy · very tiny`,
    about: 'Shy with strangers. Very sharp claws. Also a very sweet, cuddly boy.',
    stats: [['CLAWS', 9], ['SHY', 8], ['SIZE', 2]],
    skills: ['Needle Claws', 'Sideways Hop', 'Ankle Ambush', 'Cuddle Heal'], ult: 'Kitten Fury',
    tries: [['Idle', 'idle'], ['Sprint', 'sprint'], ['Pounce', 'crouch'], ['Swat', 'slap'], ['Shy', 'hide'], ['Purr', 'happy'], ['Loaf', 'loaf']] }
];
function buildSheet() {
  sheet.innerHTML = `<div class="sheet-inner">
    <div class="sheet-head"><div><h2>THE PARTY</h2><p>Art test v2.1 · tap the buttons to try each animation</p></div>
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
      </article>`).join('')}</div>
    <p class="sheet-note">Everything is drawn in code, so every pose can move.</p></div>`;
  PARTY.forEach((p, i) => {
    const sp = makeSprite(p.kind);
    const w = p.kind === 'mohit' ? 120 : p.kind === 'poi' ? 186 : 140;
    sp.style.width = w + 'px'; sp.style.height = (p.kind === 'mohit' ? w * 190 / 130 : w * 130 / 160) + 'px';
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
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
const api = {
  hide() { paused = true; stage.hidden = true; T.active = false; laser.classList.remove('on'); },
  show() { paused = false; stage.hidden = false; size(); }
};
return api;
}
