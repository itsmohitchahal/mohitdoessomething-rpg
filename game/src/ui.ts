// DOM interface on top of the game canvas: dialog, choices, objective, toasts, banners and full-screen overlays.
import { sfx } from './audio';

export type Line = string | { who: string; text: string };

const $ = <T extends HTMLElement = HTMLElement>(s: string) => document.querySelector(s) as T;

export const hi = (word: string, en: string) => `<button type="button" class="hi" data-en="${en}">${word}</button>`;

class UI {
  private dlg = $('#gdialog');
  private choicesEl = $('#choices');
  private advanceFn: (() => void) | null = null;
  private talking = 0;
  private faces: Record<string, string> = {};
  private modal = 0;

  constructor() {
    this.dlg.addEventListener('pointerdown', e => {
      if ((e.target as HTMLElement).closest('.hi')) return;
      e.stopPropagation();
      this.advance();
    });
  }

  setPortraits(p: Record<string, string>) { this.faces = p; }

  get busy() { return this.talking > 0 || this.modal > 0; }
  get isTalking() { return this.talking > 0 && !!this.advanceFn; }

  advance() { const f = this.advanceFn; if (f) f(); }

  /** Shows lines one by one with a typewriter effect; resolves after the last one is dismissed. */
  async say(lines: Line[] | Line) {
    const list = Array.isArray(lines) ? lines : [lines];
    this.talking++;
    try {
      for (const l of list) await this.line(typeof l === 'string' ? { who: '', text: l } : l);
    } finally {
      this.talking--;
      if (!this.talking) this.dlg.hidden = true;
    }
  }

  private line({ who, text }: { who: string; text: string }) {
    return new Promise<void>(resolve => {
      const face = who && this.faces[who];
      this.dlg.innerHTML = `${who ? `<span class="tag">${who}</span>` : ''}${face ? `<img class="face" alt="" src="${face}">` : ''}<div class="txt">${text}</div><span class="next">▼</span>`;
      this.dlg.classList.toggle('narration', !who);
      this.dlg.classList.toggle('has-face', !!face);
      this.dlg.classList.remove('done');
      this.dlg.hidden = false;
      const nodes: { n: Text; full: string }[] = [];
      const tw = document.createTreeWalker(this.dlg.querySelector('.txt')!, NodeFilter.SHOW_TEXT);
      while (tw.nextNode()) { const n = tw.currentNode as Text; nodes.push({ n, full: n.textContent || '' }); n.textContent = ''; }
      let ni = 0, ci = 0, typing = true, count = 0;
      const finish = () => { clearInterval(timer); nodes.forEach(o => (o.n.textContent = o.full)); typing = false; this.dlg.classList.add('done'); };
      const timer = window.setInterval(() => {
        for (let k = 0; k < 2; k++) {
          if (ni >= nodes.length) { finish(); return; }
          const o = nodes[ni]; ci++; o.n.textContent = o.full.slice(0, ci);
          if (++count % 3 === 0) sfx.blip();
          if (ci >= o.full.length) { ni++; ci = 0; }
        }
      }, 28);
      this.advanceFn = () => {
        if (typing) { finish(); return; }
        this.advanceFn = null;
        sfx.select();
        resolve();
      };
    });
  }

  /** Shows a vertical list of choices above the dialog box. */
  choose<T extends string>(options: { label: string; value: T }[], cls = ''): Promise<T> {
    this.modal++;
    return new Promise<T>(resolve => {
      const el = this.choicesEl;
      el.className = cls;
      el.innerHTML = options.map((o, i) => `<button type="button" data-i="${i}"><span>${o.label}</span></button>`).join('');
      el.hidden = false;
      const btns = [...el.querySelectorAll('button')] as HTMLButtonElement[];
      let sel = 0;
      const focus = () => btns.forEach((b, i) => b.classList.toggle('sel', i === sel));
      focus();
      const done = (i: number) => {
        el.hidden = true; el.innerHTML = '';
        document.removeEventListener('keydown', onKey, true);
        this.modal--;
        sfx.select();
        resolve(options[i].value);
      };
      const onKey = (e: KeyboardEvent) => {
        if (['ArrowDown', 's', 'S', 'ArrowRight', 'd', 'D'].includes(e.key)) { sel = (sel + 1) % btns.length; focus(); sfx.blip(); }
        else if (['ArrowUp', 'w', 'W', 'ArrowLeft', 'a', 'A'].includes(e.key)) { sel = (sel - 1 + btns.length) % btns.length; focus(); sfx.blip(); }
        else if (['Enter', ' ', 'e', 'E', 'z', 'Z'].includes(e.key)) { if (!e.repeat) done(sel); }
        else return;
        e.preventDefault(); e.stopPropagation();
      };
      document.addEventListener('keydown', onKey, true);
      btns.forEach((b, i) => b.addEventListener('click', e => { e.stopPropagation(); done(i); }));
    });
  }

  objective(text: string | null) {
    const el = $('#objective');
    if (!text) { el.hidden = true; return; }
    el.innerHTML = `<span>GOAL</span> ${text}`;
    el.hidden = false;
    el.classList.remove('pop'); void el.offsetWidth; el.classList.add('pop');
  }

  toast(text: string, ms = 2400) {
    const el = $('#toast');
    el.innerHTML = text; el.hidden = false;
    el.classList.remove('pop'); void el.offsetWidth; el.classList.add('pop');
    clearTimeout((el as unknown as { t: number }).t);
    (el as unknown as { t: number }).t = window.setTimeout(() => { el.hidden = true; }, ms);
  }

  banner(text: string, cls = '', ms = 1700) {
    const el = $('#banner');
    el.className = cls; el.innerHTML = `<span>${text}</span>`; el.hidden = false;
    return new Promise<void>(r => setTimeout(() => { el.hidden = true; r(); }, ms));
  }

  /** Full-screen card (game over, end of chapter) with buttons. */
  overlay<T extends string>(html: string, buttons: { label: string; value: T; primary?: boolean }[], cls = ''): Promise<T> {
    const el = $('#overlay');
    this.modal++;
    el.className = cls;
    el.innerHTML = `<div class="ocard">${html}<div class="row">${buttons.map((b, i) =>
      `<button type="button" class="btn${b.primary ? ' primary' : ''}" data-i="${i}"><span>${b.label}</span></button>`).join('')}</div></div>`;
    el.hidden = false;
    return new Promise<T>(resolve => {
      const pick = (i: number) => {
        document.removeEventListener('keydown', onKey, true);
        el.hidden = true; el.innerHTML = ''; this.modal--;
        sfx.select();
        resolve(buttons[i].value);
      };
      const onKey = (e: KeyboardEvent) => { if (e.key === 'Enter' && !e.repeat) { e.preventDefault(); pick(0); } };
      document.addEventListener('keydown', onKey, true);
      el.querySelectorAll('button.btn').forEach(b => b.addEventListener('click', () => pick(+(b as HTMLElement).dataset.i!)));
    });
  }
}

export const ui = new UI();

// Hinglish words: tap (or hover) to see the English meaning.
document.addEventListener('click', e => {
  const h = (e.target as HTMLElement).closest('#gdialog .hi, #overlay .hi, #workout .hi');
  if (!h) return;
  e.stopPropagation();
  h.classList.toggle('open');
}, true);
