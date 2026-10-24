// Mohit's back and side (facing right) views, matching the front view in chars.ts.
import { INK, type MohitPose } from './chars';

const S = `stroke="${INK}" stroke-width="3" stroke-linejoin="round" stroke-linecap="round"`;
const skin = '#f5cfb3', skinShade = '#e2ad8d', shirt = '#24202e', shirtLight = '#3a3449', shirtDark = '#1b1824';
const pant = '#d9bf94', pantShade = '#bf9f72', hair = '#1f1820', hairHi = '#43354a', shoe = '#2a2230';

export function mohitBackSVG(p: MohitPose = {}): string {
  const bob = p.bob ?? 0;
  return `<svg viewBox="0 -6 130 196">
  <g transform="translate(0 ${-(p.legL ?? 0)})">
    <path d="M40 184 Q40 177 52 177 Q63 177 64 184 Z" fill="${shoe}" ${S}/>
    <path d="M42 131 L64 131 L63 178 L45 178 Z" fill="${pant}" ${S}/>
    <path d="M44 134 L50 134 L49 176 L45.5 176 Z" fill="${pantShade}"/>
  </g>
  <g transform="translate(0 ${-(p.legR ?? 0)})">
    <path d="M66 184 Q67 177 78 177 Q90 177 90 184 Z" fill="${shoe}" ${S}/>
    <path d="M66 131 L88 131 L85 178 L67 178 Z" fill="${pant}" ${S}/>
    <path d="M80 134 L86 134 L84 176 L80.5 176 Z" fill="${pantShade}"/>
  </g>
  <g transform="translate(0 ${bob})">
    <path d="M38 96 Q40 88 52 86 L78 86 Q90 88 92 96 L94 132 L36 132 Z" fill="${shirt}" ${S}/>
    <path d="M38 98 Q40 90 50 88 L48 130 L37 130 Z" fill="${shirtDark}"/>
    <path d="M65 90 L65 126" stroke="${shirtLight}" stroke-width="1.6" opacity=".7"/>
    <path d="M50 86 Q65 92 80 86 L78 92 Q65 97 52 92 Z" fill="#2f2a3c" ${S}/>
    <rect x="37" y="127" width="57" height="6" fill="${INK}"/>
    <g transform="rotate(${-(p.arm ?? 0) * 0.6} 40 94)">
      <path d="M40 92 Q30 98 30 112 L32 126 L41 126 L41 112 Q42 104 45 98 Z" fill="${shirt}" ${S}/>
      <path d="M31.5 126 Q30 135 36.5 136 Q42.5 135 40.5 126 Z" fill="${skin}" ${S}/>
    </g>
    <g transform="rotate(${p.arm ?? 0} 90 94)">
      <path d="M90 92 Q100 98 100 112 L98 126 L89 126 L89 112 Q88 104 85 98 Z" fill="${shirt}" ${S}/>
      <rect x="89" y="118" width="10" height="5" rx="1.5" fill="#d7dae2" stroke="${INK}" stroke-width="1.4"/>
      <path d="M89.5 126 Q88 135 94.5 136 Q100.5 135 98.5 126 Z" fill="${skin}" ${S}/>
    </g>
    <rect x="58" y="76" width="14" height="12" fill="${skinShade}"/>
    <path d="M29 50 Q22 52 24 60 Q26 66 31 64 Z M101 50 Q108 52 106 60 Q104 66 99 64 Z" fill="${skin}" ${S}/>
    <path d="M31 53 L26 52 M99 53 L104 52" stroke="#d6a640" stroke-width="2.4" stroke-linecap="round"/>
    <path d="M24 60 C 18 30 40 6 66 6 C 92 6 112 28 106 62 L102 74 L97 69 L92 80 L86 72 L80 82 L74 73 L68 84 L62 73 L56 82 L50 72 L44 80 L38 69 L33 76 L28 67 Z" fill="${hair}" ${S}/>
    <path d="M44 16 Q56 10 70 12 M40 30 Q50 22 60 26 M74 22 Q86 20 94 30 M52 44 L48 64 M66 40 L66 66 M82 44 L86 62" stroke="${hairHi}" stroke-width="2" fill="none" stroke-linecap="round"/>
    <path d="M58 9 Q54 -1 45 1 M73 8 Q80 -2 89 2" stroke="${hair}" stroke-width="3" fill="none" stroke-linecap="round"/>
  </g>
</svg>`;
}

export interface SidePose extends MohitPose { stride?: number } // leg swing in degrees

export function mohitSideSVG(p: SidePose = {}): string {
  const bob = p.bob ?? 0, st = p.stride ?? 0;
  const leg = (a: number, fill: string, sh: string) => `<g transform="rotate(${a} 64 132)">
    <path d="M55 131 L73 131 L72 178 L57 178 Z" fill="${fill}" ${S}/>
    <path d="M66 134 L72 134 L71 176 L66 176 Z" fill="${sh}"/>
    <path d="M54 185 Q53 176 64 176 Q78 176 82 185 Z" fill="${shoe}" ${S}/></g>`;
  const head = 'M38 52 C 38 30 52 16 68 16 C 86 16 98 30 98 50 C 98 55 101 57 103 61 C 101 63 99 63 98 65 C 96 76 88 85 70 86 C 50 85 38 72 38 52 Z';
  const eye = p.blink
    ? `<path d="M83 59 h8" stroke="${INK}" stroke-width="2.6" stroke-linecap="round"/>`
    : `<ellipse cx="87" cy="59" rx="3.4" ry="4.6" fill="${INK}"/><circle cx="86" cy="57.4" r="1.3" fill="#fff"/>`;
  return `<svg viewBox="0 -6 130 196">
  ${leg(-st, '#c9ae84', '#b0916a')}
  <g transform="rotate(${-st * 0.8} 62 94)">
    <path d="M58 92 Q68 94 68 104 L66 126 L58 126 L56 104 Z" fill="${shirtDark}" ${S}/>
    <path d="M57.5 126 Q56 135 62 136 Q68 135 66 126 Z" fill="${skinShade}" ${S}/>
  </g>
  ${leg(st, pant, pantShade)}
  <g transform="translate(0 ${bob})">
    <path d="M46 96 Q48 87 60 86 L72 86 Q82 89 83 99 L85 132 L44 132 Z" fill="${shirt}" ${S}/>
    <path d="M74 88 Q82 91 83 100 L84.5 130 L77 130 Z" fill="${shirtLight}"/>
    <path d="M79 96 L80 128" stroke="${shirtLight}" stroke-width="1.8"/>
    <rect x="45" y="127" width="40" height="6" fill="${INK}"/><rect x="77" y="126" width="8" height="8" rx="1.5" fill="#d7dae2" stroke="${INK}" stroke-width="1.5"/>
    <path d="M66 86 L78 96 L76 86 Z" fill="#2f2a3c" ${S}/>
    <rect x="62" y="76" width="14" height="12" fill="${skinShade}"/>
    <path d="${head}" fill="${skin}"/>
    <path d="M38 52 C 38 70 48 83 68 86 C 54 80 47 70 46 54 Z" fill="${skinShade}" opacity=".7"/>
    <path d="${head}" fill="none" ${S}/>
    <path d="M57 52 Q50 54 52 61 Q54 66 59 64 Z" fill="${skin}" ${S}/>
    <path d="M81 72 l3 -4 M85 72 l3 -4 M89 72 l3 -4" stroke="#ff7f9c" stroke-width="1.8" stroke-linecap="round" opacity=".8"/>
    ${eye}
    <path d="M80 47 l11 -1" stroke="${INK}" stroke-width="2.8" stroke-linecap="round"/>
    <rect x="77" y="49" width="20" height="19" rx="6" fill="rgba(255,255,255,.16)" stroke="#d6a640" stroke-width="2.6"/>
    <path d="M77 55 L60 53" stroke="#d6a640" stroke-width="2.4" stroke-linecap="round"/>
    ${p.mouth === 'open' || p.mouth === 'o' ? `<ellipse cx="94" cy="76" rx="2.6" ry="3.4" fill="#a8364f" stroke="${INK}" stroke-width="2"/>` : `<path d="M89 76 Q93 78 97 75" stroke="${INK}" stroke-width="2.4" fill="none" stroke-linecap="round"/>`}
    <path d="M34 62 C 26 30 46 8 70 9 C 90 10 105 24 103 45 L97 41 L98 51 L91 39 L89 48 L83 37 L81 46 L75 36 L72 45 L66 34 C 62 44 59 54 57 62 L52 74 L47 67 L42 77 L38 69 Z" fill="${hair}" ${S}/>
    <path d="M46 22 L58 15 L53 27 Z M72 14 L86 17 L76 24 Z" fill="${hairHi}"/>
    <path d="M62 13 L59 30 M44 32 L40 52 M50 40 L48 62" stroke="${hairHi}" stroke-width="1.8" stroke-linecap="round"/>
    <path d="M60 10 Q56 0 47 2 M75 9 Q82 -1 91 3" stroke="${hair}" stroke-width="3" fill="none" stroke-linecap="round"/>
    <g transform="rotate(${st * 0.8} 64 94)">
      <path d="M60 92 Q71 94 71 104 L69 126 L60 126 L58 104 Z" fill="${shirt}" ${S}/>
      <rect x="60" y="118" width="9.5" height="5" rx="1.5" fill="#d7dae2" stroke="${INK}" stroke-width="1.4"/>
      <path d="M60 126 Q58.5 135 65 136 Q71 135 69 126 Z" fill="${skin}" ${S}/>
    </g>
  </g>
</svg>`;
}

/** Head-and-shoulders portraits for the dialog box. */
export function portrait(svg: string, viewBox: string): string {
  const s = svg.replace(/viewBox="[^"]+"/, `viewBox="${viewBox}"`)
    .replace('<svg ', '<svg xmlns="http://www.w3.org/2000/svg" ');
  return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(s);
}
