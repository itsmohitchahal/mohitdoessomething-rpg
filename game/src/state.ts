// Story progress and save data: an autosave plus 50 numbered save slots, all in this browser.
export type MapName = 'room' | 'city' | 'gym' | 'cafe' | 'kitchen' | 'mart';

export interface SaveData {
  v: 1;
  map: MapName;
  spawn: string;
  flags: Record<string, boolean>;
  deaths: number;
  time?: number;    // minute of the in-game day
  day?: number;     // in-game day, starting at 1
  stats?: { solitude?: number };
  hp?: number;      // Mohit's HP, carried from fight to fight
  bottles?: number; // empty Coke Zero bottles, for throwing
}

export interface Slot { n: number; at: number; data: SaveData }

const KEY = 'mds-save-v1';
const SLOT_KEY = (n: number) => `mds-slot-${n}`;
export const SLOTS = 50;
export const MAX_HP = 100;
const fresh = (): SaveData => ({ v: 1, map: 'room', spawn: 'wake', flags: {}, deaths: 0, time: 450, day: 1 });
const copy = <T>(d: T): T => JSON.parse(JSON.stringify(d));

/** Saves from before stats existed get the Solitude they would have earned by now. */
function upgrade(d: SaveData): SaveData {
  if (!d.stats && d.flags.fed) d.stats = { solitude: d.flags.home ? 20 : 10 };
  return d;
}

export const state = {
  data: fresh(),
  has(): boolean {
    try { return !!localStorage.getItem(KEY); } catch { return false; }
  },
  load(): boolean {
    try {
      const raw = localStorage.getItem(KEY);
      if (!raw) return false;
      const d = JSON.parse(raw) as SaveData;
      if (d.v !== 1) return false;
      this.data = upgrade(d);
      return true;
    } catch { return false; }
  },
  save() {
    // the time it was written is kept alongside, for the load list
    try { localStorage.setItem(KEY, JSON.stringify({ ...this.data, at: Date.now() })); } catch { /* storage blocked: progress lives for this session only */ }
  },
  reset() { this.data = fresh(); this.save(); },
  flag(k: string) { return !!this.data.flags[k]; },
  set(k: string, v = true) { this.data.flags[k] = v; this.save(); },

  stat(k: 'solitude'): number | null { return this.data.stats?.[k] ?? null; },
  addStat(k: 'solitude', n: number) {
    this.data.stats = { ...this.data.stats, [k]: (this.data.stats?.[k] ?? 0) + n };
    this.save();
  },
  get hp() { return this.data.hp ?? MAX_HP; },
  set hp(v: number) { this.data.hp = Math.max(0, Math.min(MAX_HP, v)); },
  get bottles() { return this.data.bottles ?? 0; },
  set bottles(v: number) { this.data.bottles = Math.max(0, v); },

  /** The autosave, shown as its own row in the load list. */
  autosave(): Slot | null {
    try {
      const raw = localStorage.getItem(KEY);
      if (!raw) return null;
      const d = JSON.parse(raw) as SaveData & { at?: number };
      return d.v === 1 ? { n: 0, at: d.at ?? 0, data: d } : null;
    } catch { return null; }
  },
  slot(n: number): Slot | null {
    try {
      const raw = localStorage.getItem(SLOT_KEY(n));
      if (!raw) return null;
      const s = JSON.parse(raw) as Slot;
      return s.data?.v === 1 ? { ...s, n } : null;
    } catch { return null; }
  },
  saveSlot(n: number): boolean {
    try { localStorage.setItem(SLOT_KEY(n), JSON.stringify({ n, at: Date.now(), data: this.data })); return true; } catch { return false; }
  },
  deleteSlot(n: number) {
    try { localStorage.removeItem(SLOT_KEY(n)); } catch { /* storage blocked */ }
  },
  /** Makes a saved game the current game (and the autosave). */
  use(s: Slot) {
    this.data = upgrade(copy(s.data));
    this.save();
  }
};

/**
 * How hazy the world is (1 = thick winter haze, 0 = clear Delhi afternoon). The game starts hazy and
 * the haze lifts a little with each milestone. It is meant to be noticed only when comparing the start and the end.
 */
export function hazeLevel(): number {
  let v = 1;
  if (state.flag('metPoi')) v -= 0.08;
  if (state.flag('fed')) v -= 0.06;
  if (state.flag('workout')) v -= 0.1;
  if (state.flag('mart')) v -= 0.1;
  if (state.flag('home')) v -= 0.12;
  if (state.flag('park')) v -= 0.08;
  return v;
}
