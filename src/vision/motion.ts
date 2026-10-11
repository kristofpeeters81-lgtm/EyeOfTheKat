import type { Frame, Rect } from './types';

/**
 * Bewegingsmeting (#5): het verschil tussen twee opeenvolgende beelden. Een pixel "beweegt" als
 * zijn helderheid meer dan `threshold` veranderde. Geen model, enkel aftrekken en tellen.
 */

/** Helderheid (0..255) per pixel, met de gangbare weging van rood/groen/blauw. */
export function toLuma(frame: Frame, out?: Uint8Array): Uint8Array {
  const n = frame.width * frame.height;
  const luma = out && out.length === n ? out : new Uint8Array(n);
  const d = frame.data;
  for (let i = 0, p = 0; i < n; i++, p += 4) luma[i] = (d[p] * 77 + d[p + 1] * 150 + d[p + 2] * 29) >> 8;
  return luma;
}

export interface MotionResult {
  /** 1 = deze pixel bewoog sinds het vorige beeld. */
  mask: Uint8Array;
  /** Aantal bewegende pixels in het hele beeld. */
  total: number;
}

export class MotionMeter {
  private prev: Uint8Array | null = null;
  private cur: Uint8Array | null = null;
  private mask: Uint8Array | null = null;

  constructor(private readonly threshold = 22) {}

  reset(): void {
    this.prev = null;
  }

  update(frame: Frame): MotionResult {
    const n = frame.width * frame.height;
    if (!this.mask || this.mask.length !== n) {
      this.mask = new Uint8Array(n);
      this.prev = null;
      this.cur = null;
    }
    // Twee buffers afwisselen: geen nieuw geheugen per beeld.
    const cur = toLuma(frame, this.cur ?? undefined);
    const mask = this.mask;
    let total = 0;
    if (this.prev) {
      const prev = this.prev;
      const t = this.threshold;
      for (let i = 0; i < n; i++) {
        const m = Math.abs(cur[i] - prev[i]) > t ? 1 : 0;
        mask[i] = m;
        total += m;
      }
    } else {
      mask.fill(0);
    }
    this.cur = this.prev;
    this.prev = cur;
    return { mask, total };
  }
}

/** Aantal pixels met waarde 1 in een rechthoek van een masker. */
export function countInRect(mask: Uint8Array, width: number, height: number, r: Rect): number {
  const x0 = Math.max(0, Math.floor(r.x0));
  const y0 = Math.max(0, Math.floor(r.y0));
  const x1 = Math.min(width, Math.ceil(r.x1));
  const y1 = Math.min(height, Math.ceil(r.y1));
  let c = 0;
  for (let y = y0; y < y1; y++) {
    const row = y * width;
    for (let x = x0; x < x1; x++) c += mask[row + x];
  }
  return c;
}
