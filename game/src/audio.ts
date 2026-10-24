// All sound is synthesised with WebAudio: no audio files to download.
type Ambient = 'wind' | 'drone' | 'gym' | 'hum' | null;

const KEY = 'mds-muted';

class Sfx {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private noiseBuf: AudioBuffer | null = null;
  private amb: { stop: () => void } | null = null;
  private ambName: Ambient = null;
  muted: boolean;

  constructor() {
    let m = false;
    try { m = localStorage.getItem(KEY) === '1'; } catch { /* storage blocked */ }
    this.muted = m;
  }

  /** Browsers only allow audio after a user gesture, so this is called from the first tap/click. */
  unlock() {
    if (!this.ctx) {
      const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AC) return;
      this.ctx = new AC();
      this.master = this.ctx.createGain();
      this.master.gain.value = this.muted ? 0 : 0.55;
      this.master.connect(this.ctx.destination);
      const len = this.ctx.sampleRate;
      this.noiseBuf = this.ctx.createBuffer(1, len, len);
      const d = this.noiseBuf.getChannelData(0);
      for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
      if (this.ambName) { const a = this.ambName; this.ambName = null; this.ambient(a); }
      if (this.rainWanted) { this.rainWanted = false; this.rain(true); }
    }
    if (this.ctx.state === 'suspended') this.ctx.resume();
  }

  setMuted(m: boolean) {
    this.muted = m;
    try { localStorage.setItem(KEY, m ? '1' : '0'); } catch { /* ignore */ }
    if (this.master && this.ctx) this.master.gain.setTargetAtTime(m ? 0 : 0.55, this.ctx.currentTime, 0.05);
  }

  private get ok() { return !!(this.ctx && this.master); }

  private tone(freq: number, dur: number, type: OscillatorType = 'sine', vol = 0.2, when = 0, glideTo?: number) {
    if (!this.ok) return;
    const c = this.ctx!, t = c.currentTime + when;
    const o = c.createOscillator(), g = c.createGain();
    o.type = type; o.frequency.setValueAtTime(freq, t);
    if (glideTo) o.frequency.exponentialRampToValueAtTime(glideTo, t + dur);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol, t + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g).connect(this.master!);
    o.start(t); o.stop(t + dur + 0.05);
  }

  private noise(dur: number, vol = 0.2, filter: BiquadFilterType = 'bandpass', freq = 1200, q = 1, when = 0) {
    if (!this.ok) return;
    const c = this.ctx!, t = c.currentTime + when;
    const s = c.createBufferSource(); s.buffer = this.noiseBuf;
    const f = c.createBiquadFilter(); f.type = filter; f.frequency.value = freq; f.Q.value = q;
    const g = c.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol, t + 0.008);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    s.connect(f).connect(g).connect(this.master!);
    s.start(t, Math.random() * 0.5); s.stop(t + dur + 0.05);
  }

  blip() { this.tone(660 + Math.random() * 120, 0.035, 'square', 0.035); }
  select() { this.tone(880, 0.06, 'square', 0.06); this.tone(1320, 0.08, 'square', 0.05, 0.05); }
  step() { this.noise(0.05, 0.05, 'lowpass', 500, 0.7); }
  door() { this.noise(0.25, 0.12, 'lowpass', 400); this.tone(180, 0.18, 'triangle', 0.08, 0.05, 120); }
  rustle() { for (let i = 0; i < 9; i++) this.noise(0.06 + Math.random() * 0.06, 0.14, 'highpass', 2500 + Math.random() * 3000, 0.8, i * 0.07 + Math.random() * 0.04); }
  hit() { this.tone(140, 0.25, 'sine', 0.4, 0, 40); this.noise(0.18, 0.25, 'lowpass', 900); }
  thud() { this.tone(90, 0.4, 'sine', 0.5, 0, 30); this.noise(0.4, 0.35, 'lowpass', 600); }
  whoosh() { this.noise(0.3, 0.14, 'bandpass', 900, 0.6); }
  stinger() {
    [220, 233, 311, 330].forEach((f, i) => this.tone(f, 0.9, 'sawtooth', 0.06, i * 0.015));
    this.noise(0.6, 0.12, 'bandpass', 300, 0.5);
  }
  fanfare() { [523, 659, 784, 1046, 784, 1046].forEach((f, i) => this.tone(f, i > 3 ? 0.4 : 0.14, 'triangle', 0.16, i * 0.11)); }
  gameOver() { [392, 349, 311, 262].forEach((f, i) => this.tone(f, 0.45, 'triangle', 0.16, i * 0.32)); }
  heart() { this.tone(880, 0.1, 'sine', 0.12); this.tone(1175, 0.16, 'sine', 0.12, 0.08); }
  nom() { this.noise(0.05, 0.08, 'bandpass', 1800, 2); }
  piano() { [262, 330, 392, 523, 392].forEach((f, i) => { this.tone(f, 0.7, 'triangle', 0.12, i * 0.18); this.tone(f * 2, 0.4, 'sine', 0.04, i * 0.18); }); }
  strum() { [196, 247, 294, 392, 494, 659].forEach((f, i) => this.tone(f * 0.97, 0.9, 'triangle', 0.08, i * 0.03)); }
  sparkle() { [1568, 2093, 2637].forEach((f, i) => this.tone(f, 0.25, 'sine', 0.05, i * 0.06)); }

  /** A cat meow: a gliding, slightly nasal sawtooth through a formant filter. */
  meow(small = false) {
    if (!this.ok) return;
    const c = this.ctx!, t = c.currentTime;
    const base = small ? 700 : 520, dur = small ? 0.32 : 0.55;
    const o = c.createOscillator(); o.type = 'sawtooth';
    o.frequency.setValueAtTime(base, t);
    o.frequency.linearRampToValueAtTime(base * 1.55, t + dur * 0.3);
    o.frequency.linearRampToValueAtTime(base * 0.9, t + dur);
    const vib = c.createOscillator(), vg = c.createGain();
    vib.frequency.value = 7; vg.gain.value = 12; vib.connect(vg).connect(o.frequency);
    const f1 = c.createBiquadFilter(); f1.type = 'bandpass'; f1.Q.value = 3;
    f1.frequency.setValueAtTime(900, t); f1.frequency.linearRampToValueAtTime(1600, t + dur * 0.35); f1.frequency.linearRampToValueAtTime(800, t + dur);
    const g = c.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.35, t + 0.05);
    g.gain.setValueAtTime(0.3, t + dur * 0.6);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(f1).connect(g).connect(this.master!);
    o.start(t); vib.start(t); o.stop(t + dur + 0.05); vib.stop(t + dur + 0.05);
  }

  /** Looping background sound for a place. */
  private rainNode: { stop: () => void } | null = null;
  private rainWanted = false;

  /** Rain layer: steady hiss, a low rumble and scattered drips. Plays on top of the place's ambient sound. */
  rain(on: boolean) {
    if (!this.ok) { this.rainWanted = on; return; }
    if (on === !!this.rainNode) return;
    if (!on) { this.rainNode!.stop(); this.rainNode = null; return; }
    const c = this.ctx!, out = c.createGain();
    out.gain.value = 0; out.gain.setTargetAtTime(1, c.currentTime, 0.8);
    out.connect(this.master!);
    const nodes: AudioScheduledSourceNode[] = [];
    const layer = (type: BiquadFilterType, freq: number, q: number, vol: number) => {
      const s = c.createBufferSource(); s.buffer = this.noiseBuf; s.loop = true;
      const f = c.createBiquadFilter(); f.type = type; f.frequency.value = freq; f.Q.value = q;
      const g = c.createGain(); g.gain.value = vol;
      s.connect(f).connect(g).connect(out); s.start(0, Math.random()); nodes.push(s);
    };
    layer('bandpass', 2600, 0.4, 0.09);
    layer('highpass', 6000, 0.7, 0.03);
    layer('lowpass', 350, 0.7, 0.05);
    const drips = window.setInterval(() => {
      if (Math.random() < 0.55) this.noise(0.03, 0.03 + Math.random() * 0.03, 'bandpass', 1800 + Math.random() * 3500, 4);
    }, 90);
    this.rainNode = {
      stop: () => {
        clearInterval(drips);
        out.gain.setTargetAtTime(0, c.currentTime, 0.4);
        setTimeout(() => { nodes.forEach(n => { try { n.stop(); } catch { /* already stopped */ } }); out.disconnect(); }, 1600);
      }
    };
  }

  ambient(name: Ambient) {
    if (name === this.ambName) return;
    this.amb?.stop(); this.amb = null; this.ambName = name;
    if (!name || !this.ok) return;
    const c = this.ctx!, out = c.createGain();
    out.gain.value = 0; out.gain.setTargetAtTime(1, c.currentTime, 0.6);
    out.connect(this.master!);
    const nodes: AudioScheduledSourceNode[] = [];
    let timer = 0;
    const noiseLoop = (type: BiquadFilterType, freq: number, vol: number) => {
      const s = c.createBufferSource(); s.buffer = this.noiseBuf; s.loop = true;
      const f = c.createBiquadFilter(); f.type = type; f.frequency.value = freq;
      const g = c.createGain(); g.gain.value = vol;
      s.connect(f).connect(g).connect(out); s.start(); nodes.push(s);
      return { f, g };
    };
    if (name === 'wind') {
      const { g } = noiseLoop('lowpass', 420, 0.05);
      const lfo = c.createOscillator(), lg = c.createGain();
      lfo.frequency.value = 0.12; lg.gain.value = 0.035; lfo.connect(lg).connect(g.gain); lfo.start(); nodes.push(lfo);
    } else if (name === 'hum') {
      const o = c.createOscillator(); o.frequency.value = 60; const g = c.createGain(); g.gain.value = 0.025;
      o.connect(g).connect(out); o.start(); nodes.push(o);
      noiseLoop('lowpass', 200, 0.015);
    } else if (name === 'drone') {
      [55, 58.3].forEach(f => { const o = c.createOscillator(); o.type = 'sine'; o.frequency.value = f; const g = c.createGain(); g.gain.value = 0.09; o.connect(g).connect(out); o.start(); nodes.push(o); });
      noiseLoop('bandpass', 260, 0.02);
    } else if (name === 'gym') {
      // the gym music is still playing, to nobody, from a muffled speaker
      let beat = 0;
      const tick = () => {
        if (!this.ok) return;
        const t = c.currentTime;
        const k = c.createOscillator(), kg = c.createGain();
        k.frequency.setValueAtTime(120, t); k.frequency.exponentialRampToValueAtTime(45, t + 0.15);
        kg.gain.setValueAtTime(0.18, t); kg.gain.exponentialRampToValueAtTime(0.0001, t + 0.2);
        k.connect(kg).connect(out); k.start(t); k.stop(t + 0.25);
        if (beat % 2) {
          const b = c.createOscillator(), bg = c.createGain(), lp = c.createBiquadFilter();
          lp.type = 'lowpass'; lp.frequency.value = 500;
          b.type = 'sawtooth'; b.frequency.value = [55, 55, 65, 49][Math.floor(beat / 2) % 4];
          bg.gain.setValueAtTime(0.05, t); bg.gain.exponentialRampToValueAtTime(0.0001, t + 0.25);
          b.connect(lp).connect(bg).connect(out); b.start(t); b.stop(t + 0.3);
        }
        beat++;
      };
      tick(); timer = window.setInterval(tick, 260);
    }
    this.amb = {
      stop: () => {
        clearInterval(timer);
        out.gain.setTargetAtTime(0, c.currentTime, 0.2);
        setTimeout(() => { nodes.forEach(n => { try { n.stop(); } catch { /* already stopped */ } }); out.disconnect(); }, 800);
      }
    };
  }
}

export const sfx = new Sfx();
