import type { ColorResult } from '../vision/color';
import type { Frame } from '../vision/types';
import { BAND_BOX } from '../runtime/bandFlow';

/**
 * Preview voor het instellen van de kleurbandjes (#18). Stap "hold": klein camerabeeld met het vak
 * (instellen = enige moment met camerabeeld, #10). Stap "check": enkel de gevonden kleurpixels
 * (magenta) en de twee markers, geen camerabeeld.
 */

const small = document.createElement('canvas');
const smallCtx = small.getContext('2d');

export function drawBandPreview(canvas: HTMLCanvasElement, frame: Frame, showCamera: boolean, color: ColorResult | null, swatch: string | null): void {
  const scale = 2;
  const W = frame.width * scale;
  const H = frame.height * scale;
  if (canvas.width !== W || canvas.height !== H) {
    canvas.width = W;
    canvas.height = H;
  }
  const ctx = canvas.getContext('2d');
  if (!ctx || !smallCtx) return;
  if (small.width !== frame.width || small.height !== frame.height) {
    small.width = frame.width;
    small.height = frame.height;
  }
  const img = smallCtx.createImageData(frame.width, frame.height);
  if (showCamera) {
    img.data.set(frame.data);
  } else {
    const d = img.data;
    const mask = color?.mask;
    for (let i = 0, p = 0; i < frame.width * frame.height; i++, p += 4) {
      const on = mask ? mask[i] !== 0 : false;
      d[p] = on ? 255 : 11;
      d[p + 1] = on ? 43 : 16;
      d[p + 2] = on ? 214 : 38;
      d[p + 3] = 255;
    }
  }
  smallCtx.putImageData(img, 0, 0);
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(small, 0, 0, W, H);

  if (showCamera) {
    const x = BAND_BOX.x0 * W;
    const y = BAND_BOX.y0 * H;
    const w = (BAND_BOX.x1 - BAND_BOX.x0) * W;
    const h = (BAND_BOX.y1 - BAND_BOX.y0) * H;
    ctx.save();
    ctx.lineWidth = 6;
    ctx.strokeStyle = swatch ?? '#ffffff';
    ctx.setLineDash([14, 8]);
    ctx.strokeRect(x, y, w, h);
    ctx.restore();
  }
  for (const m of color?.markers ?? []) {
    ctx.beginPath();
    ctx.arc(m.x * scale, m.y * scale, 14, 0, Math.PI * 2);
    ctx.lineWidth = 4;
    ctx.strokeStyle = '#ffffff';
    ctx.stroke();
  }
}
