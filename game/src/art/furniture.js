// Mohit's real room furniture (desk setup, chair, digital piano, guitar), shared by the title screen and the game.
const INK = '#1b1325';
/* ---------- room furniture ---------- */
export const ROOM_DEFS = `<defs><linearGradient id="rgbG" gradientUnits="userSpaceOnUse" x1="64" y1="0" x2="128" y2="0">
  <stop offset="0" stop-color="#ff4f8b"/><stop offset=".25" stop-color="#ffc23c"/><stop offset=".5" stop-color="#36dcae"/>
  <stop offset=".75" stop-color="#5bb6ff"/><stop offset="1" stop-color="#a98bff"/></linearGradient></defs>`;
// White desk (172 wide): laptop, RGB keyboard + mouse, second monitor showing a tiny Insta grid, and a Coke Zero.
export const DESK = `
  <ellipse cx="86" cy="0" rx="84" ry="5" fill="rgba(0,0,0,.28)"/>
  <rect x="16" y="-74" width="4.5" height="66" fill="#cfcad8" stroke="${INK}" stroke-width="2"/>
  <rect x="151" y="-74" width="4.5" height="66" fill="#cfcad8" stroke="${INK}" stroke-width="2"/>
  <rect x="5" y="-74" width="5" height="74" fill="#f4f1f7" stroke="${INK}" stroke-width="2.4"/>
  <rect x="162" y="-74" width="5" height="74" fill="#f4f1f7" stroke="${INK}" stroke-width="2.4"/>
  <path d="M58 -84 C 66 -62 104 -60 126 -83" fill="none" stroke="#14111a" stroke-width="1.6"/>
  <path d="M4 -80 L168 -80 L172 -76 L0 -76 Z" fill="#ffffff" stroke="${INK}" stroke-width="2.4" stroke-linejoin="round"/>
  <rect x="0" y="-76" width="172" height="5" fill="#e3dfea" stroke="${INK}" stroke-width="2.4"/>
  <ellipse cx="126" cy="-128" rx="46" ry="32" fill="#5bb6ff" opacity=".16"/>
  <path d="M118 -80 L134 -80 L131 -83 L121 -83Z" fill="#2b2a35" stroke="${INK}" stroke-width="2" stroke-linejoin="round"/>
  <rect x="123.5" y="-106" width="5" height="24" fill="#3a3946" stroke="${INK}" stroke-width="2"/>
  <rect x="92" y="-152" width="68" height="46" rx="3" fill="#24222d" stroke="${INK}" stroke-width="2.4"/>
  <rect x="95.5" y="-148.5" width="61" height="37" rx="1.5" fill="#fff8ec"/>
  <circle cx="102" cy="-142" r="3.6" fill="#ff8fb6" stroke="${INK}" stroke-width="1"/>
  <rect x="108" y="-143.5" width="24" height="3" rx="1.5" fill="${INK}" opacity=".55"/>
  ${['#fffaf4', '#666270', '#ffd1e1', '#a6d8ff', '#ffc23c', '#fffaf4'].map((c, i) =>
    `<rect x="${98.5 + (i % 3) * 18.6}" y="${-135 + Math.floor(i / 3) * 11.4}" width="17" height="10" fill="${c}" stroke="${INK}" stroke-width=".8"/>`).join('')}
  <path d="M8 -80 L60 -80 L57 -84 L11 -84Z" fill="#9b98a8" stroke="${INK}" stroke-width="2" stroke-linejoin="round"/>
  <path d="M12 -84 L56 -84 L54 -117 L14 -117 Z" fill="#2b2a35" stroke="${INK}" stroke-width="2" stroke-linejoin="round"/>
  <path d="M16 -87.5 L52 -87.5 L50.6 -113.5 L17.4 -113.5Z" fill="#1d2140"/>
  <g stroke-width="2" stroke-linecap="round"><path d="M21 -108 h12" stroke="#ff4f8b"/><path d="M24 -104 h17" stroke="#36dcae"/>
    <path d="M24 -100 h9" stroke="#ffc23c"/><path d="M21 -96 h15" stroke="#a98bff"/><path d="M24 -92 h7" stroke="#5bb6ff"/></g>
  <rect class="caret" x="33" y="-94.5" width="2" height="4.5" fill="#fff"/>
  <g class="rgb">
    <ellipse cx="96" cy="-79" rx="36" ry="3.5" fill="url(#rgbG)" opacity=".55"/>
    <path d="M64 -80 L124 -80 L127 -84.5 L67 -84.5 Z" fill="#1d1b24" stroke="${INK}" stroke-width="2" stroke-linejoin="round"/>
    <path d="M70 -83.3 H123.5 M68 -81.5 H124.5" stroke="url(#rgbG)" stroke-width="1.4" stroke-dasharray="2.2 1"/>
    <ellipse cx="137" cy="-80.6" rx="5" ry="1.3" fill="url(#rgbG)" opacity=".8"/>
  </g>
  <ellipse cx="137" cy="-82" rx="4" ry="2.4" fill="#1d1b24" stroke="${INK}" stroke-width="1.5"/>
  <rect x="150" y="-92" width="7.5" height="12" rx="1.5" fill="#e3242b" stroke="${INK}" stroke-width="1.6"/>
  <rect x="150" y="-88.5" width="7.5" height="3" fill="${INK}"/>`;
// Work chair, seen from behind (it faces the desk).
export const CHAIR = `
  <ellipse cx="22" cy="0" rx="25" ry="4" fill="rgba(0,0,0,.3)"/>
  <path d="M22 -10 L4 -2 M22 -10 L40 -2 M22 -10 L22 -1 M22 -10 L12 -4 M22 -10 L32 -4" stroke="#2a2733" stroke-width="3.4" stroke-linecap="round"/>
  <circle cx="4" cy="-1" r="2.4" fill="${INK}"/><circle cx="40" cy="-1" r="2.4" fill="${INK}"/><circle cx="22" cy="0" r="2.4" fill="${INK}"/>
  <rect x="19.8" y="-28" width="4.5" height="18" fill="#9b98a8" stroke="${INK}" stroke-width="1.6"/>
  <path d="M3 -44 V-33 M41 -44 V-33 M-1 -44 H8 M36 -44 H45" stroke="#2a2733" stroke-width="3.4" stroke-linecap="round"/>
  <path d="M2 -30 Q2 -36 8 -36 L36 -36 Q42 -36 42 -30 L42 -27 Q42 -25 40 -25 L4 -25 Q2 -25 2 -27Z" fill="#2f2b3a" stroke="${INK}" stroke-width="2.2" stroke-linejoin="round"/>
  <rect x="19" y="-41" width="6" height="6" fill="#2a2733"/>
  <path d="M6 -40 Q4 -80 22 -82 Q40 -80 38 -40 Z" fill="#2f2b3a" stroke="${INK}" stroke-width="2.4" stroke-linejoin="round"/>
  <path d="M12 -46 Q11 -71 22 -74" stroke="#4a4458" stroke-width="2.6" fill="none" stroke-linecap="round"/>`;
// Digital piano on an X-stand, with a sustain pedal.
export function pianoSVG() {
  const kw = 140 / 33;
  let keys = '';
  for (let i = 0; i < 33; i++) {
    if (i) keys += `<path d="M${6 + i * kw} -73 V-64.5" stroke="${INK}" stroke-width=".7"/>`;
    if ([0, 1, 3, 4, 5].includes(i % 7) && i < 32) keys += `<rect x="${6 + (i + 1) * kw - 1.25}" y="-73" width="2.5" height="5.2" fill="${INK}"/>`;
  }
  return `
  <ellipse cx="76" cy="0" rx="66" ry="4.5" fill="rgba(0,0,0,.28)"/>
  <rect x="66" y="-4" width="12" height="4" rx="1.5" fill="#1f1d26" stroke="${INK}" stroke-width="1.6"/>
  <path d="M72 -4 C 70 -30 60 -48 64 -62" stroke="#14111a" stroke-width="1.4" fill="none"/>
  <g stroke-linecap="round">
    <path d="M26 -2 L58 -62 M58 -2 L26 -62 M94 -2 L126 -62 M126 -2 L94 -62 M20 -62 H64 M88 -62 H132" stroke="${INK}" stroke-width="6.5"/>
    <path d="M26 -2 L58 -62 M58 -2 L26 -62 M94 -2 L126 -62 M126 -2 L94 -62 M20 -62 H64 M88 -62 H132" stroke="#4a4757" stroke-width="3.6"/>
  </g>
  <circle cx="42" cy="-32" r="2.2" fill="#cfcad8" stroke="${INK}" stroke-width="1"/><circle cx="110" cy="-32" r="2.2" fill="#cfcad8" stroke="${INK}" stroke-width="1"/>
  <rect x="0" y="-80" width="152" height="18" rx="2.5" fill="#1f1d26" stroke="${INK}" stroke-width="2.4"/>
  <rect x="3" y="-78.5" width="146" height="3" fill="#34313f"/>
  <circle cx="10" cy="-77" r="1.3" fill="#36dcae"/><circle cx="15" cy="-77" r="1.3" fill="#ff4f8b"/>
  <rect x="22" y="-78.4" width="14" height="3" rx=".8" fill="#5bb6ff" opacity=".85"/>
  <rect x="6" y="-73" width="140" height="8.5" fill="#fff" stroke="${INK}" stroke-width="1.4"/>${keys}`;
}
// Black acoustic guitar leaning against the wall.
export const GUITAR = `<g transform="rotate(-7)">
  <ellipse cx="0" cy="0" rx="15" ry="3" fill="rgba(0,0,0,.3)"/>
  <rect x="-3.2" y="-121" width="6.4" height="68" fill="#2a1f1b" stroke="${INK}" stroke-width="2"/>
  ${[0, 1, 2, 3, 4, 5, 6, 7].map(i => `<path d="M-3 ${-113 + i * 7} h6" stroke="#cfcad8" stroke-width=".9"/>`).join('')}
  <path d="M-5 -135 L5 -135 L4 -120 L-4 -120 Z" fill="#18151d" stroke="${INK}" stroke-width="2" stroke-linejoin="round"/>
  <circle cx="-6.5" cy="-131" r="1.6" fill="#cfcad8"/><circle cx="-6.5" cy="-125" r="1.6" fill="#cfcad8"/>
  <circle cx="6.5" cy="-131" r="1.6" fill="#cfcad8"/><circle cx="6.5" cy="-125" r="1.6" fill="#cfcad8"/>
  <circle cx="0" cy="-20" r="18" fill="#17141c" stroke="${INK}" stroke-width="2.6"/>
  <circle cx="0" cy="-46" r="13" fill="#17141c" stroke="${INK}" stroke-width="2.6"/>
  <circle cx="0" cy="-20" r="18" fill="#17141c"/><circle cx="0" cy="-46" r="13" fill="#17141c"/>
  <path d="M-14.5 -24 A17 17 0 0 1 -6 -35" stroke="#4a4458" stroke-width="2" fill="none" stroke-linecap="round"/>
  <path d="M-10 -52 A11 11 0 0 1 -2 -57" stroke="#4a4458" stroke-width="1.8" fill="none" stroke-linecap="round"/>
  <circle cx="0" cy="-40" r="6.6" fill="none" stroke="#cfa95a" stroke-width="1.2"/><circle cx="0" cy="-40" r="5.2" fill="#000"/>
  <rect x="-6" y="-21.5" width="12" height="3" rx="1" fill="#3a2b22"/>
  <path d="M-1.6 -20 V-120 M0 -20 V-120 M1.6 -20 V-120" stroke="#d8d4de" stroke-width=".5" opacity=".85"/></g>`;
