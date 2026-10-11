/**
 * Hulp voor schermvullende canvassen: scherpe weergave op hoge-resolutieschermen (max. 2× om
 * oude tablets te sparen) en een tekenlus met requestAnimationFrame.
 */

export interface CanvasSize {
  /** Breedte en hoogte in CSS-pixels (tekenen gebeurt in deze eenheden). */
  w: number;
  h: number;
  dpr: number;
}

export function fitCanvas(canvas: HTMLCanvasElement, maxDpr = 2): CanvasSize {
  const dpr = Math.min(maxDpr, window.devicePixelRatio || 1);
  const rect = canvas.getBoundingClientRect();
  const w = Math.max(1, Math.round(rect.width));
  const h = Math.max(1, Math.round(rect.height));
  if (canvas.width !== Math.round(w * dpr) || canvas.height !== Math.round(h * dpr)) {
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
  }
  const ctx = canvas.getContext('2d');
  ctx?.setTransform(dpr, 0, 0, dpr, 0, 0);
  return { w, h, dpr };
}

/** Start een tekenlus; geeft een stopfunctie terug. `draw` krijgt de tijd in seconden en dt in ms. */
export function startLoop(draw: (t: number, dtMs: number) => void): () => void {
  let id = 0;
  let last = performance.now();
  const start = last;
  const frame = (now: number) => {
    const dt = Math.min(100, now - last);
    last = now;
    draw((now - start) / 1000, dt);
    id = requestAnimationFrame(frame);
  };
  id = requestAnimationFrame(frame);
  return () => cancelAnimationFrame(id);
}
