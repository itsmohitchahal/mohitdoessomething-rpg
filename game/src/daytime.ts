// The game clock and the colour of the light at each time of day.
import { state } from './state';

export const DAY_SECONDS = 900; // one in-game day = 15 real minutes

// minute of day, light tint (multiplied over the world), how much the lamps are on (0..1)
const KEYS: [number, string, number][] = [
  [0, '#4b4f8c', 1], [270, '#4b4f8c', 1], [330, '#b79bc7', 0.7], [390, '#ffd3b8', 0.15], [480, '#fff0e0', 0],
  [720, '#ffffff', 0], [960, '#fff3df', 0], [1060, '#ffc796', 0.15], [1130, '#cf93b0', 0.55], [1200, '#5d5d9c', 1], [1440, '#4b4f8c', 1]
];

const rgb = (h: string) => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16));

export const clock = {
  get min() { return state.data.time ?? 450; },
  set min(v: number) { state.data.time = ((v % 1440) + 1440) % 1440; },
  advance(dt: number) {
    const next = (state.data.time ?? 450) + (dt * 1440) / DAY_SECONDS;
    if (next >= 1440) state.data.day = day() + 1;
    this.min = next;
  }
};

/** Light at a minute of the day: tint as 0xRRGGBB and lamp strength. */
export function grade(min: number, indoor = false) {
  let i = 0;
  while (i < KEYS.length - 2 && KEYS[i + 1][0] <= min) i++;
  const [m0, c0, l0] = KEYS[i], [m1, c1, l1] = KEYS[i + 1];
  const t = m1 === m0 ? 0 : (min - m0) / (m1 - m0);
  const a = rgb(c0), b = rgb(c1);
  let c = a.map((v, k) => v + (b[k] - v) * t);
  // indoors the ceiling lights keep things brighter
  if (indoor) c = c.map(v => v + (255 - v) * 0.55);
  const tint = (Math.round(c[0]) << 16) | (Math.round(c[1]) << 8) | Math.round(c[2]);
  return { tint, lights: l0 + (l1 - l0) * t };
}

export function fmt(min: number) {
  // the clock face only moves in 10-minute steps, like Stardew's
  const h24 = Math.floor(min / 60), m = Math.floor((min % 60) / 10) * 10;
  const h = h24 % 12 === 0 ? 12 : h24 % 12;
  return `${h}:${String(m).padStart(2, '0')} ${h24 < 12 ? 'AM' : 'PM'}`;
}
export const isNight = (min: number) => min < 345 || min >= 1150;

export const day = () => state.data.day ?? 1;
/** It rains all day, every second day (outdoors only). Adding #rain to the URL forces it on for previewing. */
export const isRainDay = () => day() % 2 === 0 || location.hash === '#rain';
