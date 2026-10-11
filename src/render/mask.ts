import type { Frame } from '../vision/types';

/**
 * Tekenhulpen voor het debugpaneel en de instel-preview. Ze tekenen op een klein canvas dat de
 * browser opschaalt (beeldpunten blijven zichtbaar groot: privacyvriendelijk, #10/#39).
 */

const scratch = new Map<string, ImageData>();

function imageData(ctx: CanvasRenderingContext2D, w: number, h: number): ImageData {
  const key = `${w}x${h}`;
  let img = scratch.get(key);
  if (!img) {
    img = ctx.createImageData(w, h);
    scratch.set(key, img);
  }
  return img;
}

function fit(canvas: HTMLCanvasElement, w: number, h: number): CanvasRenderingContext2D | null {
  if (canvas.width !== w || canvas.height !== h) {
    canvas.width = w;
    canvas.height = h;
  }
  return canvas.getContext('2d');
}

/** Tekent een masker (1 = aan) als effen kleur op een donkere achtergrond. */
export function drawMask(canvas: HTMLCanvasElement, mask: Uint8Array, w: number, h: number, rgb: [number, number, number], bg: [number, number, number] = [11, 16, 38]): void {
  const ctx = fit(canvas, w, h);
  if (!ctx) return;
  const img = imageData(ctx, w, h);
  const d = img.data;
  for (let i = 0, p = 0; i < w * h; i++, p += 4) {
    const on = mask[i] !== 0;
    d[p] = on ? rgb[0] : bg[0];
    d[p + 1] = on ? rgb[1] : bg[1];
    d[p + 2] = on ? rgb[2] : bg[2];
    d[p + 3] = 255;
  }
  ctx.putImageData(img, 0, 0);
}

/** Tekent het (al verkleinde) analysebeeld: enkel tijdens het instellen (#10). */
export function drawFrame(canvas: HTMLCanvasElement, frame: Frame): void {
  const ctx = fit(canvas, frame.width, frame.height);
  if (!ctx) return;
  const img = imageData(ctx, frame.width, frame.height);
  img.data.set(frame.data);
  ctx.putImageData(img, 0, 0);
}
