import type { VisionResult } from '../vision/engine';
import { reachRect, strikeRect, type MoveState, type Side, type StrikeZone } from '../vision/moves';
import type { Rect } from '../vision/types';

/**
 * Testlab-tekening (#39): het silhouet (effen vorm, geen camerabeeld) met daarover de
 * gekalibreerde lijnen en de doelvlakken van de detectoren. Een vlak licht op als het "geraakt" is.
 */

const small = document.createElement('canvas');
const smallCtx = small.getContext('2d');
const SCALE = 4;

export function drawLab(canvas: HTMLCanvasElement, r: VisionResult, state: MoveState, markers: { x: number; y: number }[] = []): void {
  const W = r.width * SCALE;
  const H = r.height * SCALE;
  if (canvas.width !== W || canvas.height !== H) {
    canvas.width = W;
    canvas.height = H;
  }
  const ctx = canvas.getContext('2d');
  if (!ctx || !smallCtx) return;
  if (small.width !== r.width || small.height !== r.height) {
    small.width = r.width;
    small.height = r.height;
  }
  const img = smallCtx.createImageData(r.width, r.height);
  const d = img.data;
  const zoneColor = state.airborne ? [255, 178, 30] : state.low ? [155, 231, 255] : [46, 230, 197];
  for (let i = 0, p = 0; i < r.width * r.height; i++, p += 4) {
    const on = r.personMask[i] !== 0;
    const moving = r.motionMask[i] !== 0;
    d[p] = on ? zoneColor[0] : moving ? 60 : 11;
    d[p + 1] = on ? zoneColor[1] : moving ? 70 : 16;
    d[p + 2] = on ? zoneColor[2] : moving ? 110 : 38;
    d[p + 3] = 255;
  }
  smallCtx.putImageData(img, 0, 0);
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(small, 0, 0, W, H);

  const c = r.calibration;
  const s = r.silhouette;
  if (!c) return;
  const rect = (q: Rect, active: boolean, color: string) => {
    ctx.save();
    ctx.strokeStyle = color;
    ctx.lineWidth = active ? 4 : 2;
    ctx.globalAlpha = active ? 1 : 0.55;
    ctx.setLineDash(active ? [] : [6, 6]);
    ctx.strokeRect(q.x0 * SCALE, q.y0 * SCALE, (q.x1 - q.x0) * SCALE, (q.y1 - q.y0) * SCALE);
    if (active) {
      ctx.globalAlpha = 0.25;
      ctx.fillStyle = color;
      ctx.fillRect(q.x0 * SCALE, q.y0 * SCALE, (q.x1 - q.x0) * SCALE, (q.y1 - q.y0) * SCALE);
    }
    ctx.restore();
  };
  // Gekalibreerde boven- en onderkant.
  ctx.save();
  ctx.strokeStyle = 'rgba(255,255,255,0.35)';
  ctx.setLineDash([4, 8]);
  ctx.beginPath();
  ctx.moveTo(0, c.top * SCALE);
  ctx.lineTo(W, c.top * SCALE);
  ctx.moveTo(0, (c.bottom + 1) * SCALE);
  ctx.lineTo(W, (c.bottom + 1) * SCALE);
  ctx.moveTo(c.cxLow * SCALE, 0);
  ctx.lineTo(c.cxLow * SCALE, H);
  ctx.stroke();
  ctx.restore();
  if (s) {
    for (const z of ['left', 'right', 'up'] as StrikeZone[]) rect(strikeRect(z, s.cxLow, c), state.zones[z], '#ff4d6d');
    for (const side of ['left', 'right'] as Side[]) rect(reachRect(side, s.cxLow, c), state.armUp[side], '#ffb21e');
  }
  for (const m of markers) {
    ctx.beginPath();
    ctx.arc(m.x * SCALE, m.y * SCALE, 9, 0, Math.PI * 2);
    ctx.fillStyle = '#ff2bd6';
    ctx.fill();
    ctx.lineWidth = 3;
    ctx.strokeStyle = '#fff';
    ctx.stroke();
  }
}
