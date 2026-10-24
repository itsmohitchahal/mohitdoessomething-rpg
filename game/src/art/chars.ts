// Posable versions of the approved v2 characters. Each pose becomes one animation frame.
export const INK = '#1b1325';

export type Eyes = 'open' | 'closed' | 'big' | 'half';
export interface CatPose {
  legs?: [number, number, number, number]; // far-back, far-front, near-back, near-front (degrees)
  tail?: number;
  head?: number;
  headX?: number;
  loaf?: boolean;
  eyes?: Eyes;
  tongue?: boolean;
  ears?: number; // flatten angle
  crumbs?: boolean;
}

interface CatLook {
  fur: string; shade: string; far: string; ruff: string; ear: string; earIn: string;
  tail: string; tailShade: string; eye: string; eyeDark: string;
  mask?: boolean; toes?: boolean; soft?: boolean; persian?: boolean; stripes?: string; collar?: boolean;
}

export const POI: CatLook = {
  fur: '#fffaf4', shade: '#efe4da', far: '#ece2d8', ruff: '#ffffff', ear: '#6e6676', earIn: '#f6b3c6',
  tail: '#8b8393', tailShade: '#6e6676', eye: '#a6d8ff', eyeDark: '#4b9be8', mask: true, toes: true, soft: true, collar: true
};
export const MAO: CatLook = {
  fur: '#666270', shade: '#4f4b59', far: '#55515f', ruff: '#7d7987', ear: '#5a5664', earIn: '#d58ea3',
  tail: '#5d5967', tailShade: '#45414f', eye: '#ffad33', eyeDark: '#c86a10', stripes: '#3d3947', persian: true
};

export function catSVG(o: CatLook, p: CatPose = {}): string {
  const S = `stroke="${INK}" stroke-width="3.2" stroke-linejoin="round" stroke-linecap="round"`;
  const legs = p.legs ?? [0, 0, 0, 0];
  const up = p.loaf ? 10 : 0;
  const leg = (x: number, y: number, fill: string, a: number, extra = '') => {
    const squash = p.loaf ? ` translate(0 ${y}) scale(1 .28) translate(0 ${-y})` : '';
    return `<g transform="rotate(${a} ${x + 7} ${y + 2})${squash}">
    <path d="M${x} ${y} L${x + 14} ${y} L${x + 13} ${y + 20} Q${x + 13} ${y + 25} ${x + 7} ${y + 25} Q${x + 1} ${y + 25} ${x + 1} ${y + 20} Z" fill="${fill}" ${S}/>
    <path d="M${x + 5} ${y + 21} v3.5 M${x + 9} ${y + 21} v3.5" stroke="${INK}" stroke-width="1.6" stroke-linecap="round"/>${extra}</g>`;
  };
  const toes = o.toes ? `<circle cx="109.5" cy="122" r="2" fill="#6e6676"/><circle cx="113.5" cy="123" r="2" fill="#6e6676"/><circle cx="117.5" cy="122" r="2" fill="#6e6676"/>` : '';
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
  const ea = p.ears ?? 0;
  const ears = o.persian
    ? [`<path d="M84 42 L84 21 L101 33 Z" fill="${o.ear}" ${S}/><path d="M87 37 L87 26 L97 33 Z" fill="${o.earIn}"/>`,
       `<path d="M117 33 L134 21 L133 43 Z" fill="${o.ear}" ${S}/><path d="M120 33 L131 26 L130 39 Z" fill="${o.earIn}"/>`]
    : [`<path d="M80 47 Q 76 21 79 11 Q 94 18 104 31 Z" fill="${o.ear}" ${S}/><path d="M85 40 Q 83 25 85 18 Q 94 24 99 31 Z" fill="${o.earIn}"/><path d="M88 37 q2 -4 4 -6 M91 39 q3 -4 5 -5" stroke="#fff" stroke-width="1.6" fill="none" stroke-linecap="round"/>`,
       `<path d="M116 31 Q 130 17 142 13 Q 142 31 139 49 Z" fill="${o.ear}" ${S}/><path d="M121 32 Q 131 22 138 19 Q 138 31 135 43 Z" fill="${o.earIn}"/><path d="M125 35 q4 -3 6 -3 M127 39 q4 -2 6 -2" stroke="#fff" stroke-width="1.6" fill="none" stroke-linecap="round"/>`];
  const ey = o.persian ? 63 : 62, rx = o.persian ? 9.6 : 9.8, ry = o.persian ? 10.2 : 11, ex = [98, 123];
  const eye = (x: number) => `<g>
    <ellipse cx="${x}" cy="${ey}" rx="${rx}" ry="${ry}" fill="${o.eye}" stroke="${INK}" stroke-width="2.2"/>
    <path d="M${x - rx + 1} ${ey - 1} Q${x} ${ey - ry - 1} ${x + rx - 1} ${ey - 1} Q${x} ${ey - ry * .35} ${x - rx + 1} ${ey - 1}Z" fill="${o.eyeDark}" opacity="${o.soft ? .6 : .85}"/>
    <ellipse cx="${x + .6}" cy="${ey + .8}" rx="${rx * .42}" ry="${ry * .68}" fill="${INK}"/>
    <circle cx="${x - rx * .3}" cy="${ey - ry * .36}" r="${rx * .4}" fill="#fff"/><circle cx="${x + rx * .38}" cy="${ey + ry * .42}" r="2" fill="#fff"/>
    <path d="M${x - rx - 1} ${ey - 2} Q${x} ${ey - ry - 3.5} ${x + rx + 1} ${ey - 2}" stroke="${INK}" stroke-width="3" fill="none" stroke-linecap="round"/></g>`;
  const eyesMode = p.eyes ?? 'open';
  let eyes: string;
  if (eyesMode === 'closed') {
    eyes = `<g stroke="${INK}" stroke-width="3" fill="none" stroke-linecap="round"><path d="M${ex[0] - 7} ${ey} q7 6 14 0"/><path d="M${ex[1] - 7} ${ey} q7 6 14 0"/></g>`;
  } else {
    const tf = eyesMode === 'half' ? ` transform="translate(0 ${ey}) scale(1 .45) translate(0 ${-ey})"`
      : eyesMode === 'big' ? ` transform="translate(110.5 ${ey}) scale(1.16) translate(-110.5 ${-ey})"` : '';
    eyes = `<g${tf}>${eye(ex[0])}${eye(ex[1])}</g>`;
  }
  const ny = 74;
  const headShade = o.soft ? 'M76 76 C 83 88 95 94 108 94 C 96 89 88 82 86 70 L78 68 Z' : 'M78 72 C 84 86 96 92 108 92 C 96 87 88 80 86 68 L80 67 Z';
  const crumbs = p.crumbs ? `<g fill="#d9a35f" stroke="${INK}" stroke-width="1"><circle cx="96" cy="86" r="2.2"/><circle cx="118" cy="88" r="1.8"/><circle cx="104" cy="92" r="1.6"/><circle cx="84" cy="70" r="1.6"/></g>` : '';
  return `<svg viewBox="0 0 160 130">
  ${o.mask ? `<defs><radialGradient id="poiMask" cx="50%" cy="50%" r="50%"><stop offset="0" stop-color="#776f80" stop-opacity=".7"/><stop offset=".55" stop-color="#8b8393" stop-opacity=".35"/><stop offset="1" stop-color="#8b8393" stop-opacity="0"/></radialGradient></defs>` : ''}
  <g transform="translate(0 ${up}) rotate(${p.tail ?? 0} 50 90)">
    <path d="${tail}" fill="${o.tail}"/>
    <path d="M52 94 C 34 95 20 86 15 70 C 24 80 36 86 54 88 Z" fill="${o.tailShade}"/>
    <path d="${tail}" fill="none" ${S}/>
  </g>
  ${leg(50, 98, o.far, legs[0])}${leg(95, 98, o.far, legs[1])}
  <g transform="translate(0 ${up})">
    <path d="${body}" fill="${o.fur}"/>
    <path d="M47 101 C 60 110 96 112 111 99 C 107 109 95 114 78 114 Q 72 119 67 114 C 56 113 49 108 47 101Z" fill="${o.shade}"/>
    ${o.stripes ? `<path d="M56 70 l3 12 M66 67 l2 13 M77 67 l1 12 M88 69 l-1 10" stroke="${o.stripes}" stroke-width="4" stroke-linecap="round"/>` : ''}
    <path d="${ruff}" fill="${o.ruff}"/>
    <path d="M60 73 C 66 70 74 69 82 70" stroke="#fff" stroke-width="2.6" fill="none" stroke-linecap="round" opacity=".55"/>
    <path d="${body}" fill="none" ${S}/>
  </g>
  ${leg(62, 100, o.fur, legs[2])}${leg(106, 100, o.fur, legs[3], toes)}
  ${o.collar ? `<path transform="translate(0 ${up})" d="M95 92 Q106 99 118 91" stroke="#e8436b" stroke-width="4.5" fill="none" stroke-linecap="round"/>` : ''}
  <g transform="translate(${p.headX ?? 0} ${up}) rotate(${p.head ?? 0} 108 92)">
    <g transform="rotate(${-ea} 92 42)">${ears[0]}</g><g transform="rotate(${ea} 126 44)">${ears[1]}</g>
    <path d="${head}" fill="${o.fur}"/>
    <path d="${headShade}" fill="${o.shade}"/>
    ${o.mask ? `<ellipse cx="109" cy="71" rx="24" ry="19" fill="url(#poiMask)"/>` : ''}
    ${o.stripes ? `<path d="M99 33 l3 9 l4 -7 l3 7 l4 -9" stroke="${o.stripes}" stroke-width="3.2" fill="none" stroke-linecap="round" stroke-linejoin="round"/>` : ''}
    <path d="${head}" fill="none" ${S}/>
    ${eyes}
    <ellipse cx="${ex[0] - 9}" cy="${ey + 13}" rx="6.5" ry="3.6" fill="#ff8fab" opacity=".5"/><ellipse cx="${ex[1] + 9}" cy="${ey + 12}" rx="6.5" ry="3.6" fill="#ff8fab" opacity=".5"/>
    <path d="M107.5 ${ny - 2} l6 0 l-3 3.8 z" fill="#ff7f9e" stroke="${INK}" stroke-width="1.8" stroke-linejoin="round"/>
    <path d="M105 ${ny + 4} q3 3 5.5 0 q3 3 5.5 0" stroke="${INK}" stroke-width="2.2" fill="none" stroke-linecap="round"/>
    ${p.tongue ? `<path d="M108 ${ny + 6} q3 7 6 0 z" fill="#ff6a8e" stroke="${INK}" stroke-width="1.6" stroke-linejoin="round"/>` : ''}
    <path d="M130 ${ny} l15 -4 M130 ${ny + 4} l15 1 M86 ${ny} l-15 -4 M86 ${ny + 4} l-15 1" stroke="${INK}" stroke-width="1.4" stroke-linecap="round" opacity=".55"/>
    ${crumbs}
  </g>
  ${o.collar ? `<g transform="translate(0 ${up})"><circle cx="106" cy="100" r="3.8" fill="#ffc23c" stroke="${INK}" stroke-width="1.6"/></g>` : ''}
</svg>`;
}

export interface MohitPose {
  legL?: number; legR?: number; // lift in px
  arm?: number;                  // right-arm rotation (negative raises it)
  bob?: number;
  blink?: boolean;
  mouth?: 'smile' | 'open' | 'flat' | 'o';
  sweat?: boolean;
  worried?: boolean;
}

export function mohitSVG(p: MohitPose = {}): string {
  const S = `stroke="${INK}" stroke-width="3" stroke-linejoin="round" stroke-linecap="round"`;
  const skin = '#f5cfb3', skinShade = '#e2ad8d', shirt = '#24202e', shirtLight = '#3a3449', pant = '#d9bf94', pantShade = '#bf9f72', hair = '#1f1820', hairHi = '#43354a';
  const headD = 'M30 52 C 30 30 46 16 65 16 C 84 16 100 30 100 52 C 100 70 90 84 65 86 C 40 84 30 70 30 52 Z';
  const fringe = 'M27 54 C 24 26 44 9 66 9 C 89 9 107 26 103 54 L97 43 L95 55 L89 40 L84 51 L79 38 L72 50 L68 36 L61 49 L56 37 L48 49 L45 37 L38 51 L35 42 L31 58 Z';
  const bob = p.bob ?? 0;
  const mouths = {
    smile: `<path d="M58 75 Q65 79.5 72 75" stroke="${INK}" stroke-width="2.5" fill="none" stroke-linecap="round"/>`,
    flat: `<path d="M59 77 Q65 76 71 77" stroke="${INK}" stroke-width="2.5" fill="none" stroke-linecap="round"/>`,
    open: `<path d="M58 74 Q65 74 72 74 Q70 82 65 82 Q60 82 58 74Z" fill="#a8364f" stroke="${INK}" stroke-width="2.2" stroke-linejoin="round"/>`,
    o: `<ellipse cx="65" cy="77" rx="3.6" ry="4.4" fill="#a8364f" stroke="${INK}" stroke-width="2.2"/>`
  };
  const eyes = p.blink
    ? `<path d="M48 59 h8 M74 59 h8" stroke="${INK}" stroke-width="2.6" stroke-linecap="round"/>`
    : `<ellipse cx="52" cy="59" rx="3.7" ry="4.8" fill="${INK}"/><ellipse cx="78" cy="59" rx="3.7" ry="4.8" fill="${INK}"/>
       <circle cx="50.8" cy="57.4" r="1.4" fill="#fff"/><circle cx="76.8" cy="57.4" r="1.4" fill="#fff"/>`;
  const brows = p.worried ? `<path d="M45 46 l10 2 M75 48 l10 -2" stroke="${INK}" stroke-width="2.8" stroke-linecap="round"/>`
    : `<path d="M45 48 l10 -1.5 M75 46.5 l10 1.5" stroke="${INK}" stroke-width="2.8" stroke-linecap="round"/>`;
  return `<svg viewBox="0 -6 130 196">
  <g transform="translate(0 ${-(p.legL ?? 0)})">
    <path d="M40 184 Q40 176 52 176 Q63 176 64 184 Z" fill="#2a2230" ${S}/>
    <path d="M42 131 L64 131 L63 178 L45 178 Z" fill="${pant}" ${S}/>
    <path d="M57 134 L63 134 L62.5 176 L58 176 Z" fill="${pantShade}"/><path d="M52 137 L53 174" stroke="${pantShade}" stroke-width="1.8" stroke-linecap="round"/>
  </g>
  <g transform="translate(0 ${-(p.legR ?? 0)})">
    <path d="M66 184 Q67 176 78 176 Q90 176 90 184 Z" fill="#2a2230" ${S}/>
    <path d="M66 131 L88 131 L85 178 L67 178 Z" fill="${pant}" ${S}/>
    <path d="M67 134 L73 134 L72 176 L67.5 176 Z" fill="${pantShade}"/><path d="M78 137 L77 174" stroke="${pantShade}" stroke-width="1.8" stroke-linecap="round"/>
  </g>
  <g transform="translate(0 ${bob})">
    <path d="M38 96 Q40 88 52 86 L78 86 Q90 88 92 96 L94 132 L36 132 Z" fill="${shirt}" ${S}/>
    <path d="M80 88 Q90 90 92 98 L93.5 130 L84 130 Z" fill="${shirtLight}"/>
    <path d="M65 94 L65 129" stroke="${shirtLight}" stroke-width="2"/>
    <circle cx="65" cy="106" r="1.5" fill="#8f879c"/><circle cx="65" cy="116" r="1.5" fill="#8f879c"/><circle cx="65" cy="125" r="1.5" fill="#8f879c"/>
    <rect x="37" y="127" width="57" height="6" fill="${INK}"/><rect x="60" y="126" width="10" height="8" rx="1.5" fill="#d7dae2" stroke="${INK}" stroke-width="1.5"/>
    <path d="M58 86 L65 96 L72 86Z" fill="${skin}"/>
    <path d="M50 86 L62 97 L60 85 Z M80 86 L68 97 L70 85 Z" fill="#2f2a3c" ${S}/>
    <path d="M40 92 Q30 98 30 112 L33 128 L45 128 L43 112 Q44 104 47 98 Z" fill="${shirt}" ${S}/>
    <path d="M33 127 L45 127" stroke="${shirtLight}" stroke-width="2.5"/>
    <g transform="rotate(${p.arm ?? 0} 90 94)">
      <path d="M90 92 Q100 98 100 112 L98 126 L89 126 L89 112 Q88 104 85 98 Z" fill="${shirt}" ${S}/>
      <path d="M93 98 Q99 104 99 112 L97.5 124 L93 124 Z" fill="${shirtLight}"/>
      <rect x="89" y="118" width="10" height="5" rx="1.5" fill="#d7dae2" stroke="${INK}" stroke-width="1.4"/>
      <path d="M89.5 126 Q88 135 94.5 136 Q100.5 135 98.5 126 Z" fill="${skin}" ${S}/>
    </g>
    <path d="M24 60 C 18 30 40 8 66 8 C 92 8 112 28 106 62 L99 72 L97 58 L33 58 L31 72 Z" fill="${hair}" ${S}/>
    <rect x="58" y="76" width="14" height="12" fill="${skinShade}"/>
    <path d="M29 50 Q22 52 24 60 Q26 66 31 64 Z M101 50 Q108 52 106 60 Q104 66 99 64 Z" fill="${skin}" ${S}/>
    <path d="${headD}" fill="${skin}"/>
    <path d="M30 52 C 30 70 40 84 65 86 C 49 81 40 69 39 54 Z" fill="${skinShade}" opacity=".7"/>
    <path d="${headD}" fill="none" ${S}/>
    <path d="M40 73 l3 -4 M44 73 l3 -4 M48 73 l3 -4 M80 73 l3 -4 M84 73 l3 -4 M88 73 l3 -4" stroke="#ff7f9c" stroke-width="1.8" stroke-linecap="round" opacity=".8"/>
    ${eyes}${brows}
    <rect x="41" y="49" width="22" height="19" rx="6" fill="rgba(255,255,255,.16)" stroke="#d6a640" stroke-width="2.6"/>
    <rect x="67" y="49" width="22" height="19" rx="6" fill="rgba(255,255,255,.16)" stroke="#d6a640" stroke-width="2.6"/>
    <path d="M63 55 Q65 53 67 55 M41 55 L31 53 M89 55 L99 53" stroke="#d6a640" stroke-width="2.4" fill="none" stroke-linecap="round"/>
    ${mouths[p.mouth ?? 'smile']}
    <path d="${fringe}" fill="${hair}" ${S}/>
    <path d="M42 22 L54 15 L49 27 Z M70 15 L84 18 L74 25 Z M92 26 L98 34 L90 33 Z" fill="${hairHi}"/>
    <path d="M60 13 L57 30 M77 13 L81 31 M47 20 L41 34" stroke="${hairHi}" stroke-width="1.8" stroke-linecap="round"/>
    <path d="M58 11 Q54 1 45 3 M73 10 Q80 0 89 4 M66 9 Q66 2 70 -1" stroke="${hair}" stroke-width="3" fill="none" stroke-linecap="round"/>
    ${p.sweat ? `<path d="M104 36 q6 9 0 12 q-6 -3 0 -12z" fill="#9fd8ff" stroke="${INK}" stroke-width="2"/>` : ''}
  </g>
</svg>`;
}

export interface BagPose { eyes?: boolean; ear?: boolean; squash?: number }
// A big brown paper grocery bag that is definitely not a cat.
export function bagSVG(p: BagPose = {}): string {
  const sq = p.squash ?? 1;
  const teeth = Array.from({ length: 14 }, (_, i) => `l3 ${i % 2 ? 4 : -4}`).join(' ');
  return `<svg viewBox="0 0 120 140">
  <g transform="translate(60 136) scale(${2 - sq} ${sq}) translate(-60 -136)">
    <path d="M18 40 L102 40 L108 132 Q60 138 12 132 Z" fill="#c08a52" stroke="${INK}" stroke-width="3.2" stroke-linejoin="round"/>
    <path d="M84 41 L101 41 L107 131 Q98 134 89 134 Z" fill="#a8743f"/>
    <path d="M84 41 L88 133" stroke="#8a5c2e" stroke-width="2"/>
    <path d="M30 70 l10 6 l-6 8 M62 98 l12 -6 M38 114 l8 4 M70 58 l6 8 M26 96 l7 -3" stroke="#8a5c2e" stroke-width="1.8" fill="none" stroke-linecap="round" opacity=".75"/>
    <path d="M18 40 L102 40 L108 132 Q60 138 12 132 Z" fill="none" stroke="${INK}" stroke-width="3.2" stroke-linejoin="round"/>
    <rect x="34" y="74" width="40" height="26" rx="4" fill="#ffd54a" stroke="${INK}" stroke-width="2" transform="rotate(-5 54 87)"/>
    <path d="M46 92 Q48 78 62 80 Q60 94 46 92 Z M46 92 L58 82" fill="#3fae5a" stroke="${INK}" stroke-width="1.6" stroke-linejoin="round"/>
    <path d="M36 40 C 33 12 57 10 54 40" stroke="${INK}" stroke-width="7" fill="none" stroke-linecap="round"/>
    <path d="M36 40 C 33 12 57 10 54 40" stroke="#a8743f" stroke-width="4" fill="none" stroke-linecap="round"/>
    <path d="M66 40 C 63 12 87 10 84 40" stroke="${INK}" stroke-width="7" fill="none" stroke-linecap="round"/>
    <path d="M66 40 C 63 12 87 10 84 40" stroke="#a8743f" stroke-width="4" fill="none" stroke-linecap="round"/>
    <path d="M18 40 Q60 26 102 40 Q60 52 18 40 Z" fill="#24160f" stroke="${INK}" stroke-width="3" stroke-linejoin="round"/>
    ${p.ear ? `<path d="M70 38 L77 22 L84 37 Z" fill="#6e6676" stroke="${INK}" stroke-width="2.4" stroke-linejoin="round"/><path d="M74 36 L77 28 L80 36 Z" fill="#f6b3c6"/>` : ''}
    ${p.eyes ? `<circle cx="50" cy="40" r="7" fill="#a6d8ff" opacity=".25"/><circle cx="70" cy="40" r="7" fill="#a6d8ff" opacity=".25"/>
      <ellipse cx="50" cy="40" rx="4.2" ry="3.4" fill="#a6d8ff"/><ellipse cx="70" cy="40" rx="4.2" ry="3.4" fill="#a6d8ff"/>
      <ellipse cx="50.5" cy="40" rx="1.4" ry="2.8" fill="${INK}"/><ellipse cx="70.5" cy="40" rx="1.4" ry="2.8" fill="${INK}"/>` : ''}
    <path d="M18 40 ${teeth}" stroke="${INK}" stroke-width="1.6" fill="none" stroke-linejoin="round" opacity=".6"/>
  </g>
</svg>`;
}

export const FLOUR_SVG = `<svg viewBox="0 0 70 84">
  <path d="M14 20 Q35 10 56 20 L62 74 Q35 84 8 74 Z" fill="#f4ede0" stroke="${INK}" stroke-width="3" stroke-linejoin="round"/>
  <path d="M48 20 L56 20 L62 74 Q56 77 50 78 Z" fill="#e2d6c2"/>
  <path d="M22 18 Q35 4 48 18 L44 22 Q35 16 26 22 Z" fill="#e2d6c2" stroke="${INK}" stroke-width="2.4" stroke-linejoin="round"/>
  <path d="M26 21 Q35 25 44 21" stroke="#c0392b" stroke-width="3" fill="none"/>
  <rect x="16" y="38" width="38" height="20" rx="3" fill="#c0392b" stroke="${INK}" stroke-width="2"/>
  <text x="35" y="53" font-family="Arial Black, Arial, sans-serif" font-size="12" font-weight="900" fill="#fff" text-anchor="middle">ATTA</text>
  <path d="M14 20 Q35 10 56 20 L62 74 Q35 84 8 74 Z" fill="none" stroke="${INK}" stroke-width="3" stroke-linejoin="round"/>
</svg>`;

export const BOWL_SVG = `<svg viewBox="0 0 64 40">
  <path d="M22 8 q-4 -4 0 -7 M32 8 q-4 -4 0 -7 M42 8 q-4 -4 0 -7" stroke="#ffffff" stroke-width="2" fill="none" stroke-linecap="round" opacity=".8"/>
  <ellipse cx="32" cy="16" rx="26" ry="7" fill="#fff3d6" stroke="${INK}" stroke-width="2.4"/>
  <g fill="#e9c08a" stroke="${INK}" stroke-width="1.6"><ellipse cx="24" cy="14" rx="6" ry="3.5"/><ellipse cx="36" cy="13" rx="7" ry="3.6"/><ellipse cx="42" cy="17" rx="5" ry="3"/></g>
  <path d="M6 16 Q8 36 32 37 Q56 36 58 16 Q32 26 6 16 Z" fill="#5bb6ff" stroke="${INK}" stroke-width="2.4" stroke-linejoin="round"/>
  <path d="M14 26 q4 4 10 5" stroke="#fff" stroke-width="2" fill="none" stroke-linecap="round" opacity=".7"/>
</svg>`;

export const HEART_SVG = `<svg viewBox="0 0 24 24"><path d="M12 21 C5 15.5 1.5 12 1.5 7.5 A5 5 0 0 1 12 5.5 A5 5 0 0 1 22.5 7.5 C22.5 12 19 15.5 12 21Z" fill="#ff4f8b" stroke="${INK}" stroke-width="2"/><path d="M6 7 q1.5 -2 3.5 -1.5" stroke="#fff" stroke-width="1.8" fill="none" stroke-linecap="round"/></svg>`;
