import type { Frame } from '../vision/types';

/**
 * De instel-preview (#10, #30): klein camerabeeld (enkel tijdens "toestel klaarzetten") of het
 * silhouet als effen vorm, met daarover de "schaduw-ninja": de plek waar het kind moet staan.
 */

const small = document.createElement('canvas');
const smallCtx = small.getContext('2d');

function toSmall(w: number, h: number): ImageData | null {
  if (!smallCtx) return null;
  if (small.width !== w || small.height !== h) {
    small.width = w;
    small.height = h;
  }
  return smallCtx.createImageData(w, h);
}

export interface PreviewOptions {
  /** Toon het camerabeeld (anders het silhouetmasker). */
  frame?: Frame | null;
  mask?: Uint8Array | null;
  width: number;
  height: number;
  ghost?: boolean;
  /** 0..1 voortgang (rand rond de schaduw-ninja wordt voller). */
  progress?: number;
  ok?: boolean;
}

/** Waar de schaduw-ninja staat, als deel van de beeldmaten (zie SPACE_LIMITS). */
export const GHOST = { top: 0.2, bottom: 0.88, cx: 0.5 };

function ghostPath(ctx: CanvasRenderingContext2D, W: number, H: number): void {
  const top = GHOST.top * H;
  const bottom = GHOST.bottom * H;
  const h = bottom - top;
  const cx = GHOST.cx * W;
  const r = h * 0.075;
  ctx.beginPath();
  ctx.arc(cx, top + r, r, 0, Math.PI * 2);
  ctx.moveTo(cx - h * 0.13, top + h * 0.17);
  ctx.lineTo(cx + h * 0.13, top + h * 0.17);
  ctx.lineTo(cx + h * 0.17, top + h * 0.5);
  ctx.lineTo(cx + h * 0.09, top + h * 0.5);
  ctx.lineTo(cx + h * 0.12, bottom);
  ctx.lineTo(cx + h * 0.02, bottom);
  ctx.lineTo(cx, top + h * 0.6);
  ctx.lineTo(cx - h * 0.02, bottom);
  ctx.lineTo(cx - h * 0.12, bottom);
  ctx.lineTo(cx - h * 0.09, top + h * 0.5);
  ctx.lineTo(cx - h * 0.17, top + h * 0.5);
  ctx.closePath();
}

export function drawPreview(canvas: HTMLCanvasElement, o: PreviewOptions): void {
  const scale = 4;
  const W = o.width * scale;
  const H = o.height * scale;
  if (canvas.width !== W || canvas.height !== H) {
    canvas.width = W;
    canvas.height = H;
  }
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  ctx.fillStyle = '#0b1026';
  ctx.fillRect(0, 0, W, H);

  const img = toSmall(o.width, o.height);
  if (img && smallCtx) {
    if (o.frame) {
      img.data.set(o.frame.data);
    } else if (o.mask) {
      const d = img.data;
      for (let i = 0, p = 0; i < o.width * o.height; i++, p += 4) {
        const on = o.mask[i] !== 0;
        d[p] = on ? 46 : 11;
        d[p + 1] = on ? 230 : 16;
        d[p + 2] = on ? 197 : 38;
        d[p + 3] = 255;
      }
    }
    smallCtx.putImageData(img, 0, 0);
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(small, 0, 0, W, H);
  }

  if (o.ghost) {
    ghostPath(ctx, W, H);
    ctx.save();
    ctx.setLineDash([10, 8]);
    ctx.lineWidth = 4;
    ctx.strokeStyle = o.ok ? '#2ee6c5' : '#9be7ff';
    ctx.globalAlpha = 0.9;
    ctx.stroke();
    ctx.restore();
    if (o.progress && o.progress > 0) {
      ctx.save();
      ghostPath(ctx, W, H);
      ctx.clip();
      ctx.fillStyle = 'rgba(255, 178, 30, 0.45)';
      const fillTop = H * (GHOST.bottom - (GHOST.bottom - GHOST.top) * Math.min(1, o.progress));
      ctx.fillRect(0, fillTop, W, H - fillTop);
      ctx.restore();
    }
  }
}
