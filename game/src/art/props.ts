// World props in the approved ink & cel style. viewBox units are roughly world pixels.
import { INK } from './chars';
import { ROOM_DEFS, DESK, CHAIR, pianoSVG, GUITAR } from './furniture.js';

const S = (w = 3) => `stroke="${INK}" stroke-width="${w}" stroke-linejoin="round" stroke-linecap="round"`;
const shadow = (cx: number, cy: number, rx: number, ry = 6) => `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="rgba(20,12,30,.28)"/>`;
const label = (x: number, y: number, size: number, fill: string, txt: string) =>
  `<text x="${x}" y="${y}" font-family="Arial Black, Arial, sans-serif" font-weight="900" font-size="${size}" fill="${fill}" text-anchor="middle">${txt}</text>`;

export interface PropArt {
  svg: string;
  w: number;                                // world display width (height follows the viewBox ratio)
  foot?: [number, number, number, number];  // collision box relative to the bottom-centre: [x, y, w, h], y negative = up
}

function windowGrid(x0: number, y0: number, cols: number, rows: number, w: number, h: number, gx: number, gy: number, glass: string) {
  let s = '';
  for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
    const x = x0 + c * gx, y = y0 + r * gy;
    s += `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="3" fill="${glass}" ${S(2.5)}/>
      <path d="M${x + 5} ${y + h - 6} l${w * .35} ${-h * .5}" stroke="#ffffff" stroke-width="2.4" opacity=".35" stroke-linecap="round"/>
      <rect x="${x - 3}" y="${y + h}" width="${w + 6}" height="4" fill="#efe6f2" ${S(1.6)}/>`;
  }
  return s;
}

export const PROPS: Record<string, PropArt> = {
  /* ---------------- city ---------------- */
  apt: { w: 240, foot: [-112, -70, 224, 66], svg: `<svg viewBox="0 0 240 252">
    ${shadow(120, 248, 118, 6)}
    <rect x="10" y="30" width="220" height="216" fill="#c9b8d8" ${S()}/>
    <rect x="200" y="32" width="28" height="212" fill="#b09ec3"/>
    <rect x="4" y="18" width="232" height="16" rx="2" fill="#8f7aa6" ${S()}/>
    ${windowGrid(26, 50, 4, 3, 34, 32, 48, 46, '#5e6f9a')}
    <rect x="172" y="68" width="18" height="12" fill="#c97b5a" ${S(2)}/><path d="M174 68 q-4 -10 4 -12 q2 -8 8 -2 q8 -2 4 10" fill="#6dbb6a" ${S(2)}/>
    <path d="M86 184 L154 184 L160 196 L80 196 Z" fill="#ff8fb6" ${S(2.5)}/>
    <path d="M92 186 v8 M104 186 v8 M116 186 v8 M128 186 v8 M140 186 v8" stroke="#ffd1e1" stroke-width="3"/>
    <rect x="100" y="196" width="40" height="50" fill="#7a4f45" ${S()}/>
    <rect x="106" y="202" width="12" height="16" rx="2" fill="#a6d8ff" ${S(1.8)}/><rect x="122" y="202" width="12" height="16" rx="2" fill="#a6d8ff" ${S(1.8)}/>
    <circle cx="134" cy="226" r="2.4" fill="#ffc23c" stroke="${INK}" stroke-width="1"/>
    <rect x="150" y="204" width="22" height="16" rx="3" fill="#fff8ec" ${S(2)}/>${label(161, 216, 11, INK, '44')}
    <rect x="92" y="244" width="56" height="6" fill="#9b98a8" ${S(2)}/>
  </svg>` },
  gym: { w: 270, foot: [-127, -60, 254, 56], svg: `<svg viewBox="0 0 270 210">
    ${shadow(135, 206, 132, 6)}
    <rect x="8" y="40" width="254" height="166" fill="#6f7d90" ${S()}/>
    <rect x="234" y="42" width="26" height="162" fill="#5f6c7e"/>
    <rect x="2" y="28" width="266" height="16" fill="#3f4a5a" ${S()}/>
    <rect x="58" y="4" width="154" height="30" rx="4" fill="#ffc23c" ${S()}/>${label(135, 25, 15, INK, 'IRON PAW GYM')}
    <g fill="${INK}"><rect x="34" y="12" width="16" height="4" rx="2"/><rect x="31" y="8" width="5" height="12" rx="1.5"/><rect x="48" y="8" width="5" height="12" rx="1.5"/>
      <rect x="220" y="12" width="16" height="4" rx="2"/><rect x="217" y="8" width="5" height="12" rx="1.5"/><rect x="234" y="8" width="5" height="12" rx="1.5"/></g>
    <rect x="20" y="62" width="90" height="84" rx="3" fill="#2f3a52" ${S()}/><rect x="160" y="62" width="90" height="84" rx="3" fill="#2f3a52" ${S()}/>
    <path d="M30 128 h40 l10 -18 M175 128 h20 M185 128 v-30 M175 98 h20 M215 110 h22 M226 104 v12" stroke="#5b6b8f" stroke-width="5" stroke-linecap="round" fill="none"/>
    <path d="M28 78 l26 -12 M168 78 l26 -12" stroke="#fff" stroke-width="3" opacity=".3" stroke-linecap="round"/>
    <rect x="115" y="122" width="40" height="84" fill="#38476a" ${S()}/>
    <path d="M135 122 v84 M127 150 v18 M143 150 v18" stroke="${INK}" stroke-width="2.4"/>
    <rect x="8" y="192" width="254" height="14" fill="#5a6678" ${S(2)}/>
  </svg>` },
  cafe: { w: 250, foot: [-117, -58, 234, 54], svg: `<svg viewBox="0 0 250 212">
    ${shadow(125, 208, 122, 6)}
    <rect x="8" y="44" width="234" height="164" fill="#f0c49b" ${S()}/>
    <rect x="214" y="46" width="26" height="160" fill="#e0ad80"/>
    <rect x="2" y="32" width="246" height="16" fill="#8b5a44" ${S()}/>
    <rect x="50" y="4" width="150" height="32" rx="16" fill="#fff8ec" ${S()}/>${label(125, 25, 13, '#a3364a', 'CHAI &amp; CRUMBS')}
    <path d="M12 58 L238 58 L244 84 L6 84 Z" fill="#fff8ec" ${S(2.5)}/>
    ${Array.from({ length: 10 }, (_, i) => `<path d="M${16 + i * 23} 59 L${27 + i * 23} 59 L${28 + i * 23.6} 83 L${15 + i * 23.6} 83 Z" fill="#ff8fb6"/>`).join('')}
    <path d="M12 58 L238 58 L244 84 L6 84 Z" fill="none" ${S(2.5)}/>
    ${Array.from({ length: 12 }, (_, i) => `<circle cx="${12 + i * 20.5}" cy="86" r="5" fill="${i % 2 ? '#fff8ec' : '#ff8fb6'}" ${S(1.8)}/>`).join('')}
    <rect x="20" y="98" width="122" height="72" rx="3" fill="#4d3a5c" ${S()}/>
    <path d="M36 160 h22 M47 160 v-16 M38 144 h18 M92 160 h22 M103 160 v-16 M94 144 h18" stroke="#7d6390" stroke-width="5" stroke-linecap="round"/>
    <path d="M28 112 l30 -10" stroke="#fff" stroke-width="3" opacity=".3" stroke-linecap="round"/>
    <rect x="158" y="120" width="46" height="88" fill="#7a4f45" ${S()}/>
    <circle cx="181" cy="146" r="11" fill="#a6d8ff" ${S(2)}/>
    <rect x="166" y="166" width="30" height="14" rx="2" fill="#fff8ec" ${S(1.6)}/>${label(181, 177, 9, '#2f9e5a', 'OPEN')}
    <rect x="18" y="182" width="22" height="22" fill="#c97b5a" ${S(2)}/><circle cx="29" cy="174" r="12" fill="#6dbb6a" ${S(2)}/>
    <rect x="214" y="182" width="22" height="22" fill="#c97b5a" ${S(2)}/><circle cx="225" cy="174" r="12" fill="#6dbb6a" ${S(2)}/>
  </svg>` },
  tree: { w: 80, foot: [-8, -10, 16, 10], svg: `<svg viewBox="0 0 80 104">
    ${shadow(40, 100, 26, 5)}
    <path d="M35 100 L37 60 L43 60 L45 100 Z" fill="#8a5a44" ${S(2.6)}/>
    ${[[40, 34, 26], [22, 52, 18], [58, 52, 18], [40, 58, 20]].map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r}" fill="#6dbb6a" ${S(2.8)}/>`).join('')}
    ${[[40, 34, 26], [22, 52, 18], [58, 52, 18], [40, 58, 20]].map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r - 1.6}" fill="#6dbb6a"/>`).join('')}
    <path d="M30 22 q8 -8 18 -4 M14 50 q4 -6 10 -6" stroke="#a6e39b" stroke-width="3" fill="none" stroke-linecap="round"/>
    <path d="M44 66 q10 2 16 -6 M26 66 q6 4 12 2" stroke="#4f9a55" stroke-width="3" fill="none" stroke-linecap="round"/>
  </svg>` },
  lamp: { w: 30, foot: [-4, -6, 8, 6], svg: `<svg viewBox="0 0 30 104">
    ${shadow(15, 101, 9, 3)}
    <rect x="12" y="20" width="6" height="80" fill="#3f4a5a" ${S(2.4)}/>
    <rect x="8" y="94" width="14" height="7" rx="2" fill="#3f4a5a" ${S(2)}/>
    <path d="M6 14 Q15 2 24 14 L22 22 L8 22 Z" fill="#3f4a5a" ${S(2.4)}/>
    <ellipse cx="15" cy="22" rx="6" ry="3" fill="#ffe9a8" stroke="${INK}" stroke-width="1.6"/>
  </svg>` },
  bench: { w: 76, foot: [-36, -18, 72, 16], svg: `<svg viewBox="0 0 76 48">
    ${shadow(38, 45, 34, 4)}
    <path d="M10 28 v16 M66 28 v16" stroke="${INK}" stroke-width="5" stroke-linecap="round"/>
    <rect x="4" y="6" width="68" height="8" rx="2" fill="#c98a5a" ${S(2.2)}/>
    <rect x="4" y="16" width="68" height="8" rx="2" fill="#c98a5a" ${S(2.2)}/>
    <rect x="2" y="26" width="72" height="7" rx="2" fill="#b0784b" ${S(2.2)}/>
  </svg>` },
  scooter: { w: 70, foot: [-30, -12, 60, 12], svg: `<svg viewBox="0 0 70 52">
    ${shadow(35, 49, 30, 4)}
    <circle cx="14" cy="40" r="8" fill="#2a2733" ${S(2.4)}/><circle cx="56" cy="40" r="8" fill="#2a2733" ${S(2.4)}/>
    <circle cx="14" cy="40" r="3" fill="#cfcad8"/><circle cx="56" cy="40" r="3" fill="#cfcad8"/>
    <path d="M8 36 Q8 22 24 22 L44 22 L50 12 L56 12 L58 30 Q62 36 64 38 L48 38 Q40 30 24 34 L20 38 Z" fill="#8fd3e8" ${S(2.4)}/>
    <path d="M22 22 Q22 16 30 16 L42 16 Q44 22 40 22 Z" fill="#2a2733" ${S(2)}/>
    <path d="M52 12 l-6 -6 M50 6 h8" stroke="${INK}" stroke-width="2.6" stroke-linecap="round"/>
    <circle cx="61" cy="26" r="3" fill="#ffe9a8" stroke="${INK}" stroke-width="1.4"/>
  </svg>` },
  busstop: { w: 130, foot: [-62, -24, 124, 22], svg: `<svg viewBox="0 0 130 98">
    ${shadow(65, 95, 62, 5)}
    <rect x="14" y="20" width="98" height="56" fill="#a6d8ff" opacity=".45" ${S(2.4)}/>
    <path d="M14 20 v74 M112 20 v74" stroke="#3f4a5a" stroke-width="5" stroke-linecap="round"/>
    <path d="M6 20 Q63 4 120 20 Z" fill="#3fae5a" ${S(2.6)}/>
    <rect x="24" y="66" width="78" height="8" rx="2" fill="#c98a5a" ${S(2)}/><path d="M30 74 v18 M96 74 v18" stroke="${INK}" stroke-width="4"/>
    <path d="M124 94 V26" stroke="#3f4a5a" stroke-width="4"/>
    <circle cx="124" cy="22" r="10" fill="#ffc23c" ${S(2.4)}/>${label(124, 26, 8, INK, 'BUS')}
  </svg>` },
  barricade: { w: 120, foot: [-58, -14, 116, 14], svg: `<svg viewBox="0 0 120 58">
    ${shadow(60, 55, 56, 4)}
    <path d="M14 30 v24 M106 30 v24" stroke="${INK}" stroke-width="5" stroke-linecap="round"/>
    <rect x="4" y="8" width="112" height="24" rx="3" fill="#fff8ec" ${S(2.6)}/>
    ${Array.from({ length: 6 }, (_, i) => `<path d="M${8 + i * 20} 30 L${20 + i * 20} 10 L${28 + i * 20} 10 L${16 + i * 20} 30 Z" fill="#ff4f6b"/>`).join('')}
    <rect x="4" y="8" width="112" height="24" rx="3" fill="none" ${S(2.6)}/>
    <rect x="18" y="34" width="84" height="15" rx="2" fill="#ffc23c" ${S(2)}/>${label(60, 45.5, 8, INK, 'ROAD CLOSED')}
  </svg>` },
  bin: { w: 28, foot: [-12, -8, 24, 8], svg: `<svg viewBox="0 0 28 40">
    ${shadow(14, 38, 12, 3)}
    <path d="M4 10 L24 10 L22 37 L6 37 Z" fill="#3fae5a" ${S(2.4)}/>
    <rect x="2" y="5" width="24" height="6" rx="2" fill="#2f8a47" ${S(2.2)}/>
    <path d="M10 16 v16 M18 16 v16" stroke="#2f8a47" stroke-width="2"/>
  </svg>` },
  fountain: { w: 124, foot: [-56, -30, 112, 28], svg: `<svg viewBox="0 0 124 80">
    ${shadow(62, 74, 60, 6)}
    <ellipse cx="62" cy="54" rx="58" ry="20" fill="#cfcad8" ${S(2.8)}/>
    <ellipse cx="62" cy="50" rx="48" ry="14" fill="#9fb3c8" ${S(2.2)}/>
    <ellipse cx="62" cy="52" rx="38" ry="9" fill="#b9c6d6" opacity=".6"/>
    <rect x="56" y="16" width="12" height="36" fill="#cfcad8" ${S(2.4)}/>
    <ellipse cx="62" cy="16" rx="18" ry="6" fill="#cfcad8" ${S(2.4)}/>
  </svg>` },
  bush: { w: 56, foot: [-24, -12, 48, 12], svg: `<svg viewBox="0 0 56 42">
    ${shadow(28, 39, 24, 3)}
    ${[[16, 26, 13], [30, 20, 15], [42, 27, 12]].map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r}" fill="#5fae62" ${S(2.6)}/>`).join('')}
    ${[[16, 26, 13], [30, 20, 15], [42, 27, 12]].map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r - 1.5}" fill="#5fae62"/>`).join('')}
    <circle cx="22" cy="18" r="2.4" fill="#ff8fb6"/><circle cx="38" cy="22" r="2.4" fill="#ffc23c"/>
  </svg>` },
  plasticbag: { w: 26, svg: `<svg viewBox="0 0 26 26">
    <path d="M6 8 Q4 2 9 3 L10 8 L16 8 L17 3 Q22 2 20 8 Q24 20 13 23 Q2 20 6 8 Z" fill="#f4f1f7" ${S(1.8)}/>
    <path d="M9 14 q4 3 8 0" stroke="#cfcad8" stroke-width="1.6" fill="none"/>
  </svg>` },

  /* ---------------- Mohit's room ---------------- */
  desk: { w: 180, foot: [-88, -30, 176, 24], svg: `<svg viewBox="-4 -158 180 162">${ROOM_DEFS}${DESK}</svg>` },
  chair: { w: 54, foot: [-18, -10, 36, 10], svg: `<svg viewBox="-6 -86 56 90">${CHAIR}</svg>` },
  piano: { w: 156, foot: [-76, -22, 152, 20], svg: `<svg viewBox="-2 -84 156 88">${pianoSVG()}</svg>` },
  guitar: { w: 46, foot: [-12, -8, 24, 8], svg: `<svg viewBox="-24 -140 48 144">${GUITAR}</svg>` },
  bed: { w: 130, foot: [-62, -66, 124, 62], svg: `<svg viewBox="0 0 130 104">
    ${shadow(65, 100, 62, 5)}
    <rect x="4" y="4" width="122" height="30" rx="6" fill="#8a5a44" ${S()}/>
    <rect x="8" y="26" width="114" height="70" rx="5" fill="#fbefe2" ${S()}/>
    <rect x="18" y="32" width="40" height="18" rx="7" fill="#ffffff" ${S(2.4)}/><rect x="70" y="32" width="40" height="18" rx="7" fill="#ffffff" ${S(2.4)}/>
    <path d="M8 56 L122 56 L122 92 Q122 96 118 96 L12 96 Q8 96 8 92 Z" fill="#f7d6e2" ${S(2.6)}/>
    <g fill="#e8436b" stroke="${INK}" stroke-width="1">${[[30, 70], [62, 80], [96, 68], [84, 88], [22, 88]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="3.4"/><circle cx="${x + 5}" cy="${y + 2}" r="3.4"/><circle cx="${x + 2}" cy="${y + 6}" r="3.4"/>`).join('')}</g>
    <path d="M8 60 Q65 66 122 60" stroke="#e3a9bf" stroke-width="2.4" fill="none"/>
    <rect x="4" y="94" width="122" height="8" rx="2" fill="#8a5a44" ${S(2.4)}/>
  </svg>` },
  window: { w: 96, svg: `<svg viewBox="0 0 96 76">
    <rect x="4" y="4" width="88" height="66" rx="3" fill="#cfe6ff" ${S()}/>
    <path d="M4 52 Q30 40 50 50 Q72 60 92 46 L92 70 L4 70 Z" fill="#b9c6d6"/>
    <rect x="18" y="38" width="14" height="24" fill="#9fb3c8"/><rect x="58" y="30" width="18" height="34" fill="#9fb3c8"/>
    <path d="M48 4 V70 M4 37 H92" stroke="${INK}" stroke-width="3"/>
    <rect x="4" y="4" width="88" height="66" rx="3" fill="none" ${S()}/>
    <rect x="0" y="68" width="96" height="7" rx="2" fill="#fff8ec" ${S(2.2)}/>
  </svg>` },
  plant: { w: 36, foot: [-12, -10, 24, 10], svg: `<svg viewBox="0 0 36 60">
    ${shadow(18, 57, 13, 3)}
    <path d="M18 36 Q6 24 6 10 Q14 18 18 30 Q20 12 30 6 Q28 22 20 36" fill="#5fae62" ${S(2.2)}/>
    <path d="M18 36 Q10 30 2 30 Q10 24 18 32" fill="#6dbb6a" ${S(2)}/>
    <path d="M8 36 L28 36 L25 56 L11 56 Z" fill="#c97b5a" ${S(2.4)}/>
  </svg>` },

  /* ---------------- gym ---------------- */
  treadmill: { w: 100, foot: [-46, -26, 92, 24], svg: `<svg viewBox="0 0 100 84">
    ${shadow(50, 80, 46, 4)}
    <path d="M70 66 L80 14 L88 14 L80 66" fill="#3f4a5a" ${S(2.4)}/>
    <rect x="72" y="6" width="24" height="12" rx="3" fill="#2a2733" ${S(2.2)}/><rect x="76" y="9" width="10" height="5" fill="#36dcae"/>
    <path d="M4 62 L84 62 L88 74 L8 76 Z" fill="#2a2733" ${S(2.4)}/>
    <path d="M10 68 L84 66" stroke="#4a4757" stroke-width="3"/>
    <path d="M64 30 L84 30" stroke="${INK}" stroke-width="3" stroke-linecap="round"/>
  </svg>` },
  rack: { w: 116, foot: [-56, -22, 112, 20], svg: `<svg viewBox="0 0 116 64">
    ${shadow(58, 61, 54, 4)}
    <path d="M8 60 L14 18 M108 60 L102 18" stroke="#3f4a5a" stroke-width="5" stroke-linecap="round"/>
    <rect x="10" y="22" width="96" height="6" fill="#3f4a5a" ${S(2)}/><rect x="10" y="42" width="96" height="6" fill="#3f4a5a" ${S(2)}/>
    ${[18, 38, 58, 78, 96].map((x, i) => `<g><rect x="${x - 6}" y="12" width="5" height="12" rx="1.5" fill="${['#ff4f8b', '#5bb6ff', '#ffc23c', '#36dcae', '#a98bff'][i]}" ${S(1.6)}/><rect x="${x + 3}" y="12" width="5" height="12" rx="1.5" fill="${['#ff4f8b', '#5bb6ff', '#ffc23c', '#36dcae', '#a98bff'][i]}" ${S(1.6)}/><rect x="${x - 2}" y="16" width="6" height="3" fill="${INK}"/></g>`).join('')}
    ${[24, 52, 80].map(x => `<circle cx="${x}" cy="38" r="7" fill="#2a2733" ${S(2)}/><circle cx="${x}" cy="38" r="2" fill="#9b98a8"/>`).join('')}
  </svg>` },
  benchpress: { w: 110, foot: [-50, -22, 100, 20], svg: `<svg viewBox="0 0 110 72">
    ${shadow(55, 69, 50, 4)}
    <path d="M24 66 L28 30 M86 66 L82 30" stroke="#3f4a5a" stroke-width="5" stroke-linecap="round"/>
    <rect x="30" y="44" width="56" height="10" rx="4" fill="#a3364a" ${S(2.4)}/>
    <path d="M50 54 v14" stroke="${INK}" stroke-width="5"/>
    <path d="M6 22 H104" stroke="#9b98a8" stroke-width="4" stroke-linecap="round"/>
    <rect x="6" y="8" width="10" height="28" rx="3" fill="#2a2733" ${S(2)}/><rect x="94" y="8" width="10" height="28" rx="3" fill="#2a2733" ${S(2)}/>
  </svg>` },
  cooler: { w: 34, foot: [-14, -10, 28, 10], svg: `<svg viewBox="0 0 34 74">
    ${shadow(17, 71, 14, 3)}
    <path d="M8 4 Q17 -2 26 4 L26 24 L8 24 Z" fill="#a6d8ff" ${S(2.2)}/>
    <rect x="5" y="24" width="24" height="46" rx="3" fill="#f4f1f7" ${S(2.4)}/>
    <rect x="11" y="34" width="5" height="6" fill="#5bb6ff"/><rect x="19" y="34" width="5" height="6" fill="#ff4f8b"/>
  </svg>` },
  speaker: { w: 38, foot: [-14, -8, 28, 8], svg: `<svg viewBox="0 0 38 56">
    ${shadow(19, 53, 15, 3)}
    <rect x="4" y="4" width="30" height="48" rx="4" fill="#2a2733" ${S(2.4)}/>
    <circle cx="19" cy="34" r="10" fill="#4a4757" ${S(2)}/><circle cx="19" cy="34" r="4" fill="#1b1325"/>
    <circle cx="19" cy="14" r="5" fill="#4a4757" ${S(1.8)}/>
  </svg>` },

  /* ---------------- café ---------------- */
  counter: { w: 210, foot: [-102, -34, 204, 30], svg: `<svg viewBox="0 0 210 100">
    ${shadow(105, 96, 100, 5)}
    <rect x="4" y="44" width="202" height="52" rx="3" fill="#c98a5a" ${S()}/>
    <rect x="4" y="38" width="202" height="10" rx="2" fill="#f4ede0" ${S(2.6)}/>
    <path d="M30 52 v40 M80 52 v40 M130 52 v40 M180 52 v40" stroke="#b0784b" stroke-width="3"/>
    <rect x="14" y="6" width="40" height="34" rx="4" fill="#3f4a5a" ${S(2.4)}/><rect x="20" y="12" width="28" height="8" fill="#9b98a8"/>
    <path d="M26 30 v6 M42 30 v6" stroke="${INK}" stroke-width="3"/><rect x="28" y="32" width="10" height="7" rx="1.5" fill="#fff" ${S(1.4)}/>
    <path d="M30 4 q-3 -4 0 -6 M36 4 q-3 -4 0 -6" stroke="#fff" stroke-width="1.6" fill="none" opacity=".8"/>
    <rect x="96" y="10" width="76" height="30" rx="4" fill="#cfe6ff" opacity=".7" ${S(2.4)}/>
    ${[[108, 28], [124, 30], [140, 28], [158, 30]].map(([x, y]) => `<ellipse cx="${x}" cy="${y}" rx="7" ry="5" fill="#e9b06a" ${S(1.6)}/>`).join('')}
    <rect x="184" y="24" width="14" height="16" rx="2" fill="#ffc23c" ${S(1.8)}/>
  </svg>` },
  table: { w: 86, foot: [-30, -18, 60, 16], svg: `<svg viewBox="0 0 86 70">
    ${shadow(43, 67, 40, 4)}
    <path d="M10 62 L14 40 L26 40 L26 62 M76 62 L72 40 L60 40 L60 62" stroke="#7a4f45" stroke-width="4" fill="none" stroke-linecap="round"/>
    <rect x="2" y="30" width="24" height="10" rx="3" fill="#ff8fb6" ${S(2)}/><rect x="60" y="30" width="24" height="10" rx="3" fill="#ff8fb6" ${S(2)}/>
    <path d="M43 30 V64 M34 64 H52" stroke="${INK}" stroke-width="4" stroke-linecap="round"/>
    <ellipse cx="43" cy="28" rx="26" ry="8" fill="#fff8ec" ${S(2.6)}/>
    <rect x="38" y="16" width="9" height="10" rx="2" fill="#fff" ${S(1.6)}/><path d="M47 19 q4 1 0 5" stroke="${INK}" stroke-width="1.6" fill="none"/>
    <ellipse cx="42.5" cy="17" rx="3.5" ry="1.2" fill="#c98a5a"/>
  </svg>` },
  menuboard: { w: 84, svg: `<svg viewBox="0 0 84 58">
    <rect x="3" y="3" width="78" height="52" rx="4" fill="#2f3a2f" stroke="#8a5a44" stroke-width="5"/>
    <rect x="3" y="3" width="78" height="52" rx="4" fill="none" ${S(2)}/>
    ${label(42, 17, 9, '#ffc23c', 'MENU')}
    <g font-family="Arial, sans-serif" font-size="7" font-weight="700" fill="#f4ede0"><text x="10" y="29">Chai ........ 20</text><text x="10" y="39">Coffee ...... 40</text><text x="10" y="49">Bun maska ... 30</text></g>
  </svg>` },
  kdoor: { w: 58, svg: `<svg viewBox="0 0 58 90">
    <rect x="4" y="10" width="50" height="78" fill="#9b98a8" ${S()}/>
    <circle cx="29" cy="36" r="10" fill="#1b1325" ${S(2.4)}/>
    <rect x="12" y="0" width="34" height="12" rx="2" fill="#ffc23c" ${S(2)}/>${label(29, 9, 7, INK, 'KITCHEN')}
    <rect x="10" y="56" width="38" height="5" rx="2" fill="#cfcad8" ${S(1.6)}/>
  </svg>` },

  /* ---------------- kitchen ---------------- */
  fridge: { w: 64, foot: [-30, -20, 60, 18], svg: `<svg viewBox="0 0 64 112">
    ${shadow(32, 109, 30, 3)}
    <rect x="4" y="4" width="56" height="104" rx="6" fill="#e3dfea" ${S()}/>
    <path d="M4 44 H60" stroke="${INK}" stroke-width="3"/>
    <rect x="48" y="16" width="4" height="18" rx="2" fill="#9b98a8" ${S(1.4)}/><rect x="48" y="54" width="4" height="26" rx="2" fill="#9b98a8" ${S(1.4)}/>
    <rect x="12" y="14" width="12" height="9" fill="#ffc23c" ${S(1.4)}/><circle cx="28" cy="20" r="4" fill="#ff8fb6" ${S(1.4)}/>
  </svg>` },
  stove: { w: 92, foot: [-44, -24, 88, 22], svg: `<svg viewBox="0 0 92 82">
    ${shadow(46, 79, 44, 3)}
    <rect x="4" y="26" width="84" height="54" rx="3" fill="#cfcad8" ${S()}/>
    <rect x="14" y="42" width="64" height="30" rx="3" fill="#2a2733" ${S(2.4)}/>
    <rect x="2" y="18" width="88" height="10" rx="2" fill="#4a4757" ${S(2.4)}/>
    <ellipse cx="28" cy="18" rx="12" ry="3" fill="#1b1325"/><ellipse cx="64" cy="18" rx="12" ry="3" fill="#1b1325"/>
    <path d="M52 16 L52 4 L78 4 L78 16" fill="#9b98a8" ${S(2.2)}/><path d="M78 8 h8" stroke="${INK}" stroke-width="3" stroke-linecap="round"/>
  </svg>` },
  sink: { w: 124, foot: [-60, -24, 120, 22], svg: `<svg viewBox="0 0 124 78">
    ${shadow(62, 75, 58, 3)}
    <rect x="4" y="26" width="116" height="50" rx="3" fill="#c98a5a" ${S()}/>
    <rect x="2" y="18" width="120" height="10" rx="2" fill="#f4ede0" ${S(2.4)}/>
    <rect x="30" y="20" width="44" height="6" rx="2" fill="#9fb3c8" ${S(1.6)}/>
    <path d="M52 20 V6 H62" stroke="#9b98a8" stroke-width="4" fill="none" stroke-linecap="round"/>
    <path d="M60 40 v30 M90 40 v30" stroke="#b0784b" stroke-width="3"/>
    <rect x="92" y="6" width="20" height="13" rx="2" fill="#ff8fb6" ${S(1.8)}/>
  </svg>` },
  shelf: { w: 112, foot: [-54, -22, 108, 20], svg: `<svg viewBox="0 0 112 124">
    ${shadow(56, 121, 52, 3)}
    <path d="M8 120 V6 M104 120 V6" stroke="#8a5a44" stroke-width="6" stroke-linecap="round"/>
    ${[36, 72, 108].map(y => `<rect x="4" y="${y}" width="104" height="6" fill="#b0784b" ${S(2)}/>`).join('')}
    <g ${S(2)}><rect x="14" y="14" width="18" height="22" rx="3" fill="#ffd54a"/><rect x="36" y="18" width="16" height="18" rx="3" fill="#ff8fb6"/><rect x="58" y="12" width="20" height="24" rx="3" fill="#5bb6ff"/><rect x="82" y="20" width="16" height="16" rx="3" fill="#36dcae"/></g>
    <g ${S(2)}><path d="M14 72 Q14 48 30 48 Q46 48 46 72 Z" fill="#f4ede0"/><path d="M52 72 Q52 50 68 50 Q84 50 84 72 Z" fill="#f4ede0"/></g>
    <g ${S(2)}><rect x="16" y="88" width="26" height="20" rx="3" fill="#c98a5a"/><rect x="60" y="86" width="34" height="22" rx="3" fill="#c98a5a"/></g>
  </svg>` },
  crates: { w: 56, foot: [-26, -18, 52, 16], svg: `<svg viewBox="0 0 56 48">
    ${shadow(28, 45, 26, 3)}
    <rect x="4" y="18" width="30" height="26" fill="#c98a5a" ${S(2.4)}/><path d="M4 31 H34 M19 18 V44" stroke="#8a5a44" stroke-width="2"/>
    <rect x="26" y="8" width="26" height="36" fill="#b0784b" ${S(2.4)}/><path d="M26 26 H52" stroke="#8a5a44" stroke-width="2"/>
    <circle cx="14" cy="14" r="5" fill="#ff7a3c" ${S(1.6)}/><circle cx="22" cy="12" r="5" fill="#ffd54a" ${S(1.6)}/>
  </svg>` },
  bagdown: { w: 90, svg: `<svg viewBox="0 0 140 70">
    ${shadow(70, 64, 64, 5)}
    <path d="M10 22 L104 14 L126 60 Q70 70 18 62 Z" fill="#c08a52" ${S(3)}/>
    <path d="M104 14 Q122 22 126 60 Q118 34 104 14 Z" fill="#24160f" ${S(2.4)}/>
    <path d="M30 34 l10 6 M60 48 l12 -6" stroke="#8a5c2e" stroke-width="1.8" stroke-linecap="round"/>
  </svg>` }
};
