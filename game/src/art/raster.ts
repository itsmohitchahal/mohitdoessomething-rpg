import Phaser from 'phaser';

// Textures are drawn at RES x their world size so they stay crisp on retina screens and when the camera zooms in.
export const RES = 3;

function viewBoxOf(svg: string): [number, number] {
  const m = svg.match(/viewBox="([-\d.]+)[ ,]+([-\d.]+)[ ,]+([\d.]+)[ ,]+([\d.]+)"/);
  if (!m) throw new Error('SVG without viewBox');
  return [parseFloat(m[3]), parseFloat(m[4])];
}

async function loadSvg(svg: string, w: number, h: number): Promise<HTMLImageElement> {
  const sized = svg.replace('<svg ', `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" `);
  const img = new Image();
  img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(sized);
  try {
    await img.decode();
  } catch {
    await new Promise<void>((res, rej) => { img.onload = () => res(); img.onerror = () => rej(new Error('SVG failed to load')); });
  }
  return img;
}

/**
 * Rasterises one or more SVG poses into a single canvas texture with one named frame per pose.
 * worldW is the on-screen width in world units; sprites using it should be scaled by 1 / RES.
 */
export async function bake(scene: Phaser.Scene, key: string, frames: Record<string, string>, worldW: number) {
  const names = Object.keys(frames);
  const [vw, vh] = viewBoxOf(frames[names[0]]);
  const fw = Math.round(worldW * RES), fh = Math.round(worldW * RES * vh / vw);
  const canvas = document.createElement('canvas');
  canvas.width = fw * names.length; canvas.height = fh;
  const ctx = canvas.getContext('2d')!;
  const imgs = await Promise.all(names.map(n => loadSvg(frames[n], fw, fh)));
  imgs.forEach((img, i) => ctx.drawImage(img, i * fw, 0, fw, fh));
  if (scene.textures.exists(key)) scene.textures.remove(key);
  const tex = scene.textures.addCanvas(key, canvas)!;
  names.forEach((n, i) => tex.add(n, 0, i * fw, 0, fw, fh));
  return { fw, fh };
}
