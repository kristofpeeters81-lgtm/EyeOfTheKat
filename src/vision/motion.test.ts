import { describe, expect, it } from 'vitest';
import { countInRect, MotionMeter, toLuma } from './motion';
import type { Frame } from './types';

function solid(w: number, h: number, rgb: [number, number, number]): Frame {
  const data = new Uint8ClampedArray(w * h * 4);
  for (let i = 0; i < w * h; i++) data.set([...rgb, 255], i * 4);
  return { data, width: w, height: h };
}

describe('MotionMeter', () => {
  it('ziet geen beweging in het eerste beeld en bij een stilstaand beeld', () => {
    const m = new MotionMeter();
    expect(m.update(solid(8, 6, [100, 100, 100])).total).toBe(0);
    expect(m.update(solid(8, 6, [100, 100, 100])).total).toBe(0);
  });

  it('telt enkel de pixels die echt veranderen', () => {
    const m = new MotionMeter();
    m.update(solid(8, 6, [100, 100, 100]));
    const f = solid(8, 6, [100, 100, 100]);
    // Een vierkant van 2×2 wordt fel wit.
    for (const [x, y] of [[2, 2], [3, 2], [2, 3], [3, 3]]) f.data.set([255, 255, 255, 255], (y * 8 + x) * 4);
    const r = m.update(f);
    expect(r.total).toBe(4);
    expect(countInRect(r.mask, 8, 6, { x0: 0, y0: 0, x1: 3, y1: 3 })).toBe(1);
  });

  it('negeert ruis onder de drempel', () => {
    const m = new MotionMeter(22);
    m.update(solid(4, 4, [100, 100, 100]));
    expect(m.update(solid(4, 4, [110, 110, 110])).total).toBe(0);
  });
});

describe('toLuma', () => {
  it('geeft wit 255 en zwart 0', () => {
    expect(toLuma(solid(1, 1, [255, 255, 255]))[0]).toBe(255);
    expect(toLuma(solid(1, 1, [0, 0, 0]))[0]).toBe(0);
  });
});
