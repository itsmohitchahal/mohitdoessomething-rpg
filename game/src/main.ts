import Phaser from 'phaser';
import './game.css';
import { Boot } from './scenes/Boot';
import { World } from './scenes/World';
import { Battle } from './scenes/Battle';
import { initTitle } from './title.js';
import { state, type MapName } from './state';
import { ui } from './ui';
import { sfx } from './audio';
import './input';

const DPR = Math.min(window.devicePixelRatio || 1, 2.5);
const $ = (s: string) => document.querySelector(s) as HTMLElement;

// The canvas is rendered at device-pixel resolution and shown at CSS size, so the art stays sharp.
const game = new Phaser.Game({
  type: Phaser.AUTO,
  parent: 'game',
  width: Math.round(innerWidth * DPR),
  height: Math.round(innerHeight * DPR),
  backgroundColor: '#140d1f',
  banner: false,
  audio: { noAudio: true },
  physics: { default: 'arcade', arcade: { debug: false } },
  scale: { mode: Phaser.Scale.NONE, zoom: 1 / DPR },
  render: { antialias: true, roundPixels: false },
  scene: [Boot, World, Battle]
});

const booted = new Promise<void>(res => game.events.once('booted', res));
// lets automated play-tests reach the game while developing; not included in production builds
if (import.meta.env.DEV) (window as unknown as { __game: Phaser.Game }).__game = game;
let rT = 0;
addEventListener('resize', () => {
  clearTimeout(rT);
  rT = window.setTimeout(() => game.scale.resize(Math.round(innerWidth * DPR), Math.round(innerHeight * DPR)), 100);
});

const title = initTitle({
  onStart: async () => {
    sfx.unlock();
    if (state.has()) {
      const c = await ui.overlay('<h2>NEW GAME?</h2><p>Your saved progress will be erased.</p>',
        [{ label: 'Start over', value: 'yes', primary: true }, { label: 'Cancel', value: 'no' }], 'confirm');
      if (c === 'no') return;
    }
    state.reset();
    play('room', 'wake');
  },
  onContinue: () => {
    sfx.unlock();
    state.load();
    play(state.data.map, state.data.spawn);
  },
  hasSave: () => state.has()
});

async function play(map: MapName, spawn: string) {
  await booted;
  title.hide();
  $('#game').hidden = false;
  $('#hud').hidden = false;
  game.scale.resize(Math.round(innerWidth * DPR), Math.round(innerHeight * DPR));
  game.scene.stop('Battle');
  game.scene.start('World', { map, spawn });
}

game.events.on('to-title', () => {
  game.scene.stop('World');
  game.scene.stop('Battle');
  $('#game').hidden = true;
  $('#hud').hidden = true;
  ui.objective(null);
  sfx.ambient(null);
  title.show();
});

const mute = $('#mute');
const paintMute = () => {
  mute.innerHTML = sfx.muted
    ? '<svg viewBox="0 0 24 24"><path d="M4 9h4l5-4v14l-5-4H4z" fill="currentColor"/><path d="M16 9l5 6M21 9l-5 6" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/></svg>'
    : '<svg viewBox="0 0 24 24"><path d="M4 9h4l5-4v14l-5-4H4z" fill="currentColor"/><path d="M16 8.5q3 3.5 0 7M18.5 6q5 6 0 12" stroke="currentColor" stroke-width="2.2" fill="none" stroke-linecap="round"/></svg>';
  mute.setAttribute('aria-label', sfx.muted ? 'Sound off' : 'Sound on');
};
paintMute();
mute.addEventListener('click', () => { sfx.unlock(); sfx.setMuted(!sfx.muted); paintMute(); });
addEventListener('pointerdown', () => sfx.unlock(), { once: true });
