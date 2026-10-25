// Pause menu: resume, save to one of 50 slots, load a saved game, or go back to the title screen.
import { state, SLOTS, MAX_HP, type Slot, type MapName } from './state';
import { SOLITUDE_ICON } from './ui';
import { fmt } from './daytime';
import { sfx } from './audio';

const PER_PAGE = 5;
const PLACES: Record<MapName, string> = {
  room: "Mohit's room", city: 'The city', gym: 'The gym', cafe: 'Chai & Crumbs', kitchen: 'The café kitchen', mart: 'Bhatia Super Mart'
};
const TRASH = '<svg viewBox="0 0 16 16" shape-rendering="crispEdges" aria-hidden="true"><path fill="currentColor" d="M6 1h4v1h4v2H2V2h4zM3 5h10v10H3zm2 2v6h2V7zm4 0v6h2V7z"/></svg>';

type Hooks = {
  canPause: () => boolean;
  setPaused: (p: boolean) => void;
  onLoad: (s: Slot) => void;
  onTitle: () => void;
};

/** "Today, 4:12 PM", "Yesterday, 9:03 AM" or "25 Oct 2026, 4:12 PM". */
export function when(t: number) {
  if (!t) return 'Some time ago';
  const d = new Date(t), now = new Date();
  const time = d.toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit', hour12: true }).toUpperCase();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  if (t >= today) return `Today, ${time}`;
  if (t >= today - 864e5) return `Yesterday, ${time}`;
  return `${d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}, ${time}`;
}
const what = (s: Slot) => `${PLACES[s.data.map] ?? 'Somewhere'} · Day ${s.data.day ?? 1}, ${fmt(s.data.time ?? 450)}`;

class Pause {
  private el = document.querySelector('#pause') as HTMLElement;
  private btn = document.querySelector('#pausebtn') as HTMLElement;
  private hooks!: Hooks;
  private page = { save: 0, load: 0 };
  private mode: 'save' | 'load' = 'save';
  /** Where the slot list goes back to: the pause menu, or the title screen when it was opened from there. */
  private fromTitle = false;
  open = false;

  init(h: Hooks) {
    this.hooks = h;
    this.btn.addEventListener('click', () => this.toggle());
    addEventListener('keydown', e => {
      if (e.repeat) return;
      if (e.key === 'Escape' || ((e.key === 'p' || e.key === 'P') && !this.open)) {
        if (this.open || !(document.querySelector('#hud') as HTMLElement).hidden) { e.preventDefault(); this.toggle(); }
      }
    });
    this.el.addEventListener('click', e => this.click(e));
  }

  toggle() {
    if (this.open) return this.close();
    if (!this.hooks.canPause()) return;
    this.fromTitle = false;
    this.open = true;
    this.hooks.setPaused(true);
    sfx.select();
    this.menu();
    this.el.hidden = false;
  }

  close() {
    if (!this.open) return;
    this.open = false;
    this.el.hidden = true;
    this.el.innerHTML = '';
    if (!this.fromTitle) this.hooks.setPaused(false);
    sfx.select();
  }

  /** The load list on its own, for the title screen. */
  showLoad() {
    this.fromTitle = true;
    this.open = true;
    this.slots('load');
    this.el.hidden = false;
  }

  private card(html: string) {
    this.el.innerHTML = `<div class="pz-card">${html}</div>`;
    (this.el.querySelector('[data-a]') as HTMLElement | null)?.focus({ preventScroll: true });
  }

  private menu() {
    const sol = state.stat('solitude');
    const bits = [
      sol !== null ? `<span>${SOLITUDE_ICON} Solitude <b>${sol}</b></span>` : '',
      state.flag('park') ? `<span>HP <b>${state.hp}/${MAX_HP}</b></span>` : '',
      state.flag('explore') ? `<span>Empty bottles <b>×${state.bottles}</b></span>` : ''
    ].filter(Boolean).join('');
    this.card(`
      <h2>PAUSED</h2>
      ${bits ? `<p class="pz-stats">${bits}</p>` : ''}
      <div class="pz-menu">
        <button type="button" class="btn primary" data-a="resume"><span>Resume</span></button>
        <button type="button" class="btn" data-a="save"><span>Save game</span></button>
        <button type="button" class="btn" data-a="load"><span>Load saved game</span></button>
        <button type="button" class="btn" data-a="title"><span>Back to menu</span></button>
      </div>`);
  }

  private row(s: Slot | null, n: number) {
    const name = n === 0 ? 'AUTO' : String(n);
    if (!s) {
      return `<li><button type="button" class="pz-slot empty" data-a="pick" data-n="${n}"${this.mode === 'load' ? ' disabled' : ''}>
        <b>${name}</b><span class="pz-when">Empty</span></button></li>`;
    }
    return `<li><button type="button" class="pz-slot" data-a="pick" data-n="${n}">
        <b${n === 0 ? ' class="auto"' : ''}>${name}</b><span class="pz-when">${when(s.at)}</span><span class="pz-what">${what(s)}</span></button>${
      n === 0 ? '' : `<button type="button" class="pz-del" data-a="del" data-n="${n}" aria-label="Delete save ${n}">${TRASH}</button>`}</li>`;
  }

  private slots(mode: 'save' | 'load') {
    this.mode = mode;
    const pages = Math.ceil(SLOTS / PER_PAGE), p = this.page[mode];
    const first = p * PER_PAGE + 1;
    const rows = Array.from({ length: PER_PAGE }, (_, i) => this.row(state.slot(first + i), first + i)).join('');
    const auto = mode === 'load' && p === 0 ? state.autosave() : null;
    this.card(`
      <h2>${mode === 'save' ? 'SAVE GAME' : 'LOAD GAME'}</h2>
      <p class="pz-note">${mode === 'save' ? 'Pick a slot to save to.' : 'Any progress you have not saved will be lost.'}</p>
      <ol class="pz-list">${auto ? this.row(auto, 0) : ''}${rows}</ol>
      <div class="pz-pages">
        <button type="button" class="btn" data-a="prev" aria-label="Previous page"${p === 0 ? ' disabled' : ''}><span>◀</span></button>
        <span>Page ${p + 1} / ${pages}</span>
        <button type="button" class="btn" data-a="next" aria-label="Next page"${p === pages - 1 ? ' disabled' : ''}><span>▶</span></button>
      </div>
      <button type="button" class="btn pz-back" data-a="back"><span>Back</span></button>`);
  }

  /** Swaps the card for a yes/no question; resolves true on yes. */
  private ask(html: string, yes: string, danger = false) {
    return new Promise<boolean>(resolve => {
      this.card(`${html}<div class="pz-row">
        <button type="button" class="btn${danger ? ' danger' : ' primary'}" data-a="yes"><span>${yes}</span></button>
        <button type="button" class="btn" data-a="no"><span>Cancel</span></button></div>`);
      this.answer = resolve;
    });
  }
  private answer: ((v: boolean) => void) | null = null;

  private async click(e: Event) {
    const b = (e.target as HTMLElement).closest('[data-a]') as HTMLButtonElement | null;
    if (!b || b.disabled) return;
    const a = b.dataset.a!, n = Number(b.dataset.n);
    if (a === 'yes' || a === 'no') { const f = this.answer; this.answer = null; sfx.select(); f?.(a === 'yes'); return; }
    sfx.select();
    switch (a) {
      case 'resume': return this.close();
      case 'save': case 'load': return this.slots(a);
      case 'prev': this.page[this.mode]--; return this.slots(this.mode);
      case 'next': this.page[this.mode]++; return this.slots(this.mode);
      case 'back':
        if (this.fromTitle) return this.close();
        return this.menu();
      case 'title':
        if (!(await this.ask('<h2>BACK TO MENU?</h2><p>Your progress is autosaved. CONTINUE on the title screen picks up from here.</p>', 'Back to menu'))) return this.menu();
        this.close();
        state.save();
        return this.hooks.onTitle();
      case 'del': {
        const s = state.slot(n);
        if (!s) return;
        const ok = await this.ask(`<h2>DELETE SAVE ${n}?</h2><p>${when(s.at)}<br><span class="pz-what">${what(s)}</span></p><p>This can't be undone.</p>`, 'Delete', true);
        if (ok) { state.deleteSlot(n); sfx.thud(); }
        return this.slots(this.mode);
      }
      case 'pick': {
        if (this.mode === 'save') {
          const old = state.slot(n);
          if (old && !(await this.ask(`<h2>OVERWRITE SAVE ${n}?</h2><p>It was saved ${when(old.at).replace(/^(Today|Yesterday)/, m => m.toLowerCase())}.</p>`, 'Overwrite'))) return this.slots('save');
          state.save();
          const ok = state.saveSlot(n);
          sfx.sparkle();
          this.slots('save');
          this.flash(n, ok ? 'Saved!' : 'Could not save. Is storage blocked?');
          return;
        }
        const s = n === 0 ? state.autosave() : state.slot(n);
        if (!s) return;
        const label = n === 0 ? 'the autosave' : `save ${n}`;
        const warn = this.fromTitle ? '' : '<p><b>Any progress you have not saved will be lost.</b></p>';
        if (!(await this.ask(`<h2>LOAD ${n === 0 ? 'AUTOSAVE' : `SAVE ${n}`}?</h2><p>${when(s.at)}<br><span class="pz-what">${what(s)}</span></p>${warn}`, `Load ${label}`))) return this.slots('load');
        this.open = false;
        this.el.hidden = true; this.el.innerHTML = '';
        return this.hooks.onLoad(s);
      }
    }
  }

  private flash(n: number, text: string) {
    const li = this.el.querySelector(`.pz-slot[data-n="${n}"]`)?.closest('li');
    if (!li) return;
    const t = document.createElement('em');
    t.className = 'pz-flash'; t.textContent = text;
    li.appendChild(t);
    setTimeout(() => t.remove(), 1400);
  }
}

export const pause = new Pause();
