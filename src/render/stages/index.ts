import { BridgeSprint } from '../../game/stages/bridgeSprint';
import { DuckBeams } from '../../game/stages/duckBeams';
import { FrogLeap } from '../../game/stages/frogLeap';
import { LogRoll } from '../../game/stages/logRoll';
import { StoneHop } from '../../game/stages/stoneHop';
import type { Stage, StageId } from '../../game/types';
import { drawHero, HeroAnimator, type View } from '../hero';
import type { HeroLook } from '../theme';
import { drawMountains, drawSky } from '../world';
import { drawBridge } from './bridge';
import { drawDuckBeams, drawFrogLeap, drawLogRoll, drawStoneHop, scrollFor } from './setA';
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
  /** Scroll aan het begin van de huidige set (Log Roll, Duck Beams). */
  private base = 0;

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
    else if (stage instanceof LogRoll || stage instanceof DuckBeams) this.scroll = this.base + scrollFor(L, stage);
    else if (stage instanceof FrogLeap) this.scroll = stage.platform * L.heroSize * 1.25;
    // Bij een nieuwe set begint de klok opnieuw: de scroll loopt verder vanaf waar hij was.
    if (stage instanceof LogRoll || stage instanceof DuckBeams) {
      if (!stage.isActive) this.base = this.scroll;
    }
    drawSky(ctx, w, h, t);
    drawMountains(ctx, w, h, this.scroll, t);
    let groundY = L.groundY;
    if (stage instanceof BridgeSprint) drawBridge(ctx, L, stage, t);
    else if (stage instanceof LogRoll) drawLogRoll(ctx, L, stage, this.scroll, t);
    else if (stage instanceof DuckBeams) drawDuckBeams(ctx, L, stage, this.scroll, t);
    else if (stage instanceof FrogLeap) groundY = drawFrogLeap(ctx, L, stage, t).heroY;
    else if (stage instanceof StoneHop) drawStoneHop(ctx, L, stage, t);
    const pose = this.hero.update(hs.action, dtMs, hs.runIntensity);
    const x = L.heroX + hs.offsetX * L.heroSize;
    const y = groundY - hs.lift * L.heroSize;
    // Schaduw onder de held.
    ctx.fillStyle = 'rgba(0,0,0,0.35)';
    ctx.beginPath();
    ctx.ellipse(x, groundY + 2, L.heroSize * 0.22 * (1 - Math.min(0.6, hs.lift)), L.heroSize * 0.04, 0, 0, Math.PI * 2);
    ctx.fill();
    drawHero(ctx, pose, this.look, x, y, L.heroSize, view, this.hero.time);
    return L;
  }
}
