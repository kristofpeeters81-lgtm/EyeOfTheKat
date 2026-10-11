import { useEffect, useRef } from 'react';
import { fitCanvas, startLoop } from '../render/canvas';
import { drawHero, HeroAnimator, type HeroAction } from '../render/hero';
import { ACCENT_COLORS, HEROES, PALETTE, SUIT_COLORS } from '../render/theme';
import { drawGround, drawMountains, drawSky } from '../render/world';

/**
 * Stijlvoorbeeld (#49: voorlopig, ter beoordeling door Kristof): de wereld, de vier helden in alle
 * poses en kleuren, en een lopende held in zijaanzicht.
 */

const FRONT_CYCLE: HeroAction[] = ['idle', 'ready', 'strikeLeft', 'strikeRight', 'strikeUp', 'reachLeft', 'reachRight', 'star', 'squat', 'armsUp', 'hopLeft', 'hopRight', 'cheer', 'stumble'];
const SIDE_CYCLE: HeroAction[] = ['run', 'jump', 'run', 'duck', 'frogCrouch', 'frogLeap', 'stumble', 'cheer'];

export function StylePreview({ onBack }: { onBack: () => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const front = HEROES.map(() => new HeroAnimator('front'));
    const runner = new HeroAnimator('side');
    let scroll = 0;
    return startLoop((t, dt) => {
      const { w, h } = fitCanvas(canvas);
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      const sideAction = SIDE_CYCLE[Math.floor(t / 1.4) % SIDE_CYCLE.length];
      if (sideAction === 'run') scroll += dt * 0.35;
      drawSky(ctx, w, h, t);
      drawMountains(ctx, w, h, scroll, t);
      const groundY = h * 0.8;
      drawGround(ctx, w, h, groundY, scroll, 'stone');
      // Vier helden vooraan, elk in een andere pose en kleur.
      const size = Math.min(h * 0.32, w / 6.5);
      HEROES.forEach((hero, i) => {
        const action = FRONT_CYCLE[(Math.floor(t / 1.2) + i * 3) % FRONT_CYCLE.length];
        const pose = front[i].update(action, dt);
        const x = w * (0.1 + i * 0.13);
        drawHero(ctx, pose, { id: hero.id, suit: SUIT_COLORS[i], accent: ACCENT_COLORS[i] }, x, groundY, size, 'front', front[i].time);
        ctx.fillStyle = PALETTE.text;
        ctx.font = `700 ${Math.round(size * 0.12)}px Unbounded, sans-serif`;
        ctx.textAlign = 'center';
        ctx.fillText(hero.name.toUpperCase(), x, groundY + size * 0.2);
        ctx.font = `600 ${Math.round(size * 0.09)}px Outfit, sans-serif`;
        ctx.fillStyle = 'rgba(244,241,234,0.7)';
        ctx.fillText(action, x, groundY + size * 0.33);
      });
      // Lopende held in zijaanzicht.
      const pose = runner.update(sideAction, dt, 1);
      const jumpLift = sideAction === 'jump' || sideAction === 'frogLeap' ? Math.sin(((t % 1.4) / 1.4) * Math.PI) * size * 0.4 : 0;
      drawHero(ctx, pose, { id: 'neko', suit: SUIT_COLORS[0], accent: ACCENT_COLORS[1] }, w * 0.78, groundY - jumpLift, size * 1.1, 'side', runner.time);
      ctx.fillStyle = PALETTE.text;
      ctx.font = `600 ${Math.round(size * 0.09)}px Outfit, sans-serif`;
      ctx.textAlign = 'center';
      ctx.fillText(sideAction, w * 0.78, groundY + size * 0.33);
    });
  }, []);

  return (
    <div className="screen" style={{ padding: 0 }}>
      <canvas ref={canvasRef} style={{ width: '100%', height: '100%', display: 'block' }} />
      <div style={{ position: 'absolute', top: 16, left: 16 }} className="row">
        <button className="btn secondary small" onClick={onBack}>
          ← Terug
        </button>
        <span className="panel" style={{ padding: '8px 14px' }}>
          Stijlvoorbeeld "Night Summit" (voorlopig)
        </span>
      </div>
    </div>
  );
}
