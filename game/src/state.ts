// Story progress and save data (one save slot, in this browser).
export type MapName = 'room' | 'city' | 'gym' | 'cafe' | 'kitchen';

export interface SaveData {
  v: 1;
  map: MapName;
  spawn: string;
  flags: Record<string, boolean>;
  deaths: number;
}

const KEY = 'mds-save-v1';
const fresh = (): SaveData => ({ v: 1, map: 'room', spawn: 'wake', flags: {}, deaths: 0 });

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
      this.data = d;
      return true;
    } catch { return false; }
  },
  save() {
    try { localStorage.setItem(KEY, JSON.stringify(this.data)); } catch { /* storage blocked: progress lives for this session only */ }
  },
  reset() { this.data = fresh(); this.save(); },
  flag(k: string) { return !!this.data.flags[k]; },
  set(k: string, v = true) { this.data.flags[k] = v; this.save(); }
};

/**
 * How much colour the world has. The game starts very slightly desaturated and gains a little colour
 * with each milestone. It is meant to be noticed only when comparing the start and the end.
 * (Phaser's saturate(): 0 = normal colour, negative = less.)
 */
export function colorLevel(): number {
  let v = -0.26;
  if (state.flag('metPoi')) v += 0.05;
  if (state.flag('fed')) v += 0.02;
  if (state.flag('ch1Done')) v += 0.02;
  return v;
}
