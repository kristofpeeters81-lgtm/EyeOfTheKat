import { BridgeSprint } from '../../game/stages/bridgeSprint';
import type { Stage, StageId } from '../../game/types';
import { drawHero, HeroAnimator, type View } from '../hero';
import type { HeroLook } from '../theme';
import { drawMountains, drawSky } from '../world';
import { drawBridge } from './bridge';
import { sceneLayout, type SceneLayout } from './layout';

/**
 * Tekent een etappe: lucht en bergen, de etappe-specifieke scène, en de held.
 * Zijaanzicht voor loop/spring-etappes, vooraanzicht voor de rest.
 */

export const STAGE_VIEW: Record<StageId, View> = {
  'bridge-sprint': 'side',
  'duck-beams': 'side',
  'log-roll': 'side',
  'frog-leap': 'side',
  'stone-hop': 'front',
  'shadow-wall': 'front',
  'shadow-strike': 'front',
  'wall-climb': 'front',
  'the-eye': 'side',
};

export class StageRenderer {
  readonly hero: HeroAnimator;
  private scroll = 0;

  constructor(
    readonly stageId: StageId,
    readonly look: HeroLook,
  ) {
    this.hero = new HeroAnimator(STAGE_VIEW[stageId]);
  }

  draw(ctx: CanvasRenderingContext2D, w: number, h: number, stage: Stage, t: number, dtMs: number): SceneLayout {
    const view = STAGE_VIEW[this.stageId];
    const L = sceneLayout(w, h, view);
    const hs = stage.hero();
    if (stage instanceof BridgeSprint) this.scroll = stage.distance * L.ppm;
    drawSky(ctx, w, h, t);
    drawMountains(ctx, w, h, this.scroll, t);
    if (stage instanceof BridgeSprint) drawBridge(ctx, L, stage, t);
    const pose = this.hero.update(hs.action, dtMs, hs.runIntensity);
    const x = L.heroX + hs.offsetX * L.heroSize;
    const y = L.groundY - hs.lift * L.heroSize;
    // Schaduw onder de held.
    ctx.fillStyle = 'rgba(0,0,0,0.35)';
    ctx.beginPath();
    ctx.ellipse(x, L.groundY + 2, L.heroSize * 0.22 * (1 - Math.min(0.6, hs.lift)), L.heroSize * 0.04, 0, 0, Math.PI * 2);
    ctx.fill();
    drawHero(ctx, pose, this.look, x, y, L.heroSize, view, this.hero.time);
    return L;
  }
}
