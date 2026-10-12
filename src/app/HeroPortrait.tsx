import { useEffect, useRef } from 'react';
import { fitCanvas, startLoop } from '../render/canvas';
import { drawHero, HeroAnimator, type HeroAction } from '../render/hero';
import type { HeroLook } from '../render/theme';

/** Kleine bewegende held (profielkaart, heldkeuze, kaart). */
export function HeroPortrait({ look, action = 'idle', size = 96 }: { look: HeroLook; action?: HeroAction; size?: number }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const lookRef = useRef(look);
  lookRef.current = look;
  const actionRef = useRef(action);
  actionRef.current = action;

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const anim = new HeroAnimator('front');
    return startLoop((_t, dt) => {
      const { w, h } = fitCanvas(canvas);
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      ctx.clearRect(0, 0, w, h);
      const pose = anim.update(actionRef.current, dt);
      drawHero(ctx, pose, lookRef.current, w / 2, h * 0.94, h * 0.72, 'front', anim.time);
    });
  }, []);

  return <canvas ref={ref} style={{ width: size, height: size * 1.15, display: 'block' }} aria-hidden="true" />;
}
