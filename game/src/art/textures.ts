// Surface textures and lighting sprites, painted on canvas at load time (no image files).
import Phaser from 'phaser';

function canvasTex(scene: Phaser.Scene, key: string, w: number, h: number, paint: (c: CanvasRenderingContext2D) => void) {
  const cv = document.createElement('canvas');
  cv.width = w; cv.height = h;
  paint(cv.getContext('2d')!);
  if (scene.textures.exists(key)) scene.textures.remove(key);
  scene.textures.addCanvas(key, cv);
}

/** Deterministic noise so the textures look the same every load. */
function rng(seed: number) {
  return () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646;
}

export function makeTextures(scene: Phaser.Scene) {
  // Warm wooden floorboards: 256px tile = 128 world px (drawn at 2x), varied plank tones, grain and knots.
  canvasTex(scene, 'tex-wood', 256, 256, c => {
    const r = rng(7), tones = ['#7c5142', '#76503f', '#82574a', '#7a4f40', '#714a3b'];
    const ph = 48;
    for (let row = 0; row * ph < 256; row++) {
      const off = row % 2 ? 0 : 120;
      for (let x = -off; x < 256; x += 240) {
        c.fillStyle = tones[Math.floor(r() * tones.length)];
        c.fillRect(x, row * ph, 240, ph);
        c.strokeStyle = 'rgba(60,34,26,.35)'; c.lineWidth = 2;
        for (let g = 0; g < 4; g++) {
          const gy = row * ph + 8 + r() * (ph - 16);
          c.beginPath(); c.moveTo(x + 6, gy);
          c.bezierCurveTo(x + 70, gy + (r() - .5) * 8, x + 150, gy + (r() - .5) * 8, x + 234, gy + (r() - .5) * 4);
          c.stroke();
        }
        if (r() < .5) { c.fillStyle = 'rgba(60,34,26,.45)'; c.beginPath(); c.ellipse(x + 40 + r() * 150, row * ph + ph / 2, 6, 3, 0, 0, Math.PI * 2); c.fill(); }
        c.fillStyle = 'rgba(255,220,180,.07)'; c.fillRect(x, row * ph, 240, 4);
        c.fillStyle = '#4a2c22'; c.fillRect(x + 238, row * ph, 3, ph);
      }
      c.fillStyle = '#4a2c22'; c.fillRect(0, row * ph + ph - 3, 256, 3);
    }
  });
  // Wallpaper: muted plum with a small repeating flower-and-dot motif.
  canvasTex(scene, 'tex-wallpaper', 96, 96, c => {
    c.fillStyle = '#4b3b6f'; c.fillRect(0, 0, 96, 96);
    c.fillStyle = '#54437a'; c.fillRect(0, 0, 48, 96);
    const flower = (x: number, y: number) => {
      c.fillStyle = '#6a5794';
      for (let i = 0; i < 4; i++) { const a = i * Math.PI / 2; c.beginPath(); c.ellipse(x + Math.cos(a) * 5, y + Math.sin(a) * 5, 4, 2.6, a, 0, Math.PI * 2); c.fill(); }
      c.fillStyle = '#c9a85a'; c.beginPath(); c.arc(x, y, 2.2, 0, Math.PI * 2); c.fill();
    };
    flower(24, 24); flower(72, 72);
    c.fillStyle = '#5f4d87'; [[72, 24], [24, 72]].forEach(([x, y]) => { c.beginPath(); c.arc(x, y, 2, 0, Math.PI * 2); c.fill(); });
  });
  // A soft beam of daylight (top bright, fading down and out).
  canvasTex(scene, 'light-beam', 256, 512, c => {
    const g = c.createLinearGradient(0, 0, 0, 512);
    g.addColorStop(0, 'rgba(255,244,214,.9)'); g.addColorStop(1, 'rgba(255,244,214,0)');
    c.fillStyle = g;
    c.beginPath(); c.moveTo(70, 0); c.lineTo(186, 0); c.lineTo(256, 512); c.lineTo(0, 512); c.closePath(); c.fill();
    c.globalCompositeOperation = 'destination-in';
    const s = c.createLinearGradient(0, 0, 256, 0);
    s.addColorStop(0, 'rgba(0,0,0,0)'); s.addColorStop(.25, '#000'); s.addColorStop(.75, '#000'); s.addColorStop(1, 'rgba(0,0,0,0)');
    c.fillStyle = s; c.fillRect(0, 0, 256, 512);
  });
  // Round glow for lamps, screens and fairy lights (tinted per use).
  canvasTex(scene, 'glow', 128, 128, c => {
    const g = c.createRadialGradient(64, 64, 0, 64, 64, 64);
    g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(.35, 'rgba(255,255,255,.45)'); g.addColorStop(1, 'rgba(255,255,255,0)');
    c.fillStyle = g; c.fillRect(0, 0, 128, 128);
  });
  canvasTex(scene, 'dust', 16, 16, c => {
    const g = c.createRadialGradient(8, 8, 0, 8, 8, 8);
    g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(1, 'rgba(255,255,255,0)');
    c.fillStyle = g; c.fillRect(0, 0, 16, 16);
  });
  // Soft darkening towards the edges of a room.
  canvasTex(scene, 'vignette', 256, 256, c => {
    const g = c.createRadialGradient(128, 128, 60, 128, 128, 182);
    g.addColorStop(0, 'rgba(20,10,30,0)'); g.addColorStop(1, 'rgba(20,10,30,.75)');
    c.fillStyle = g; c.fillRect(0, 0, 256, 256);
  });
  // Contact shadow along the base of a wall.
  canvasTex(scene, 'wall-shade', 8, 64, c => {
    const g = c.createLinearGradient(0, 0, 0, 64);
    g.addColorStop(0, 'rgba(20,10,30,.45)'); g.addColorStop(1, 'rgba(20,10,30,0)');
    c.fillStyle = g; c.fillRect(0, 0, 8, 64);
  });
}
