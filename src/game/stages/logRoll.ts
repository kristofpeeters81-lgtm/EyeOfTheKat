import type { GameInput, HeroState, StageSettings } from '../types';
import { TimedObstacleStage } from './timed';

/**
 * Log Roll (#15, #41, #43): boomstammen rollen naar de held; springen op het juiste moment.
 * 3 golven × 8 stammen (12 jaar), steeds sneller na elkaar. Een sprong telt als hij begint tot
 * 0,65 s vóór de stam aankomt (of als je op dat moment in de lucht bent).
 */
export const LOG_ROLL = { perSet: 8, sets: 3, firstAt: 3000, gapStart: 2400, gapEnd: 1600, before: 650, after: 200, restMs: 20000 } as const;

const JUMP_MS = 520;

export class LogRoll extends TimedObstacleStage {
  readonly id = 'log-roll' as const;
  readonly kind = 'reps' as const;
  readonly title = 'Log Roll';
  private jumpAt = -Infinity;

  constructor(settings: StageSettings) {
    super(settings, LOG_ROLL);
  }

  protected introText(): string {
    return 'Boomstammen rollen naar je toe! Spring telkens op het juiste moment over de stam.';
  }

  protected instruction(): string {
    return 'Spring over de stammen!';
  }

  protected hit(input: GameInput): boolean {
    return input.events.some((e) => e.type === 'jump') || input.state.airborne;
  }

  protected stepSet(input: GameInput): boolean {
    if (input.events.some((e) => e.type === 'jump')) {
      this.jumpAt = this.clock;
      this.sfx('whoosh');
    }
    return super.stepSet(input);
  }

  hero(): HeroState {
    const since = this.clock - this.jumpAt;
    if (since >= 0 && since < JUMP_MS && this.currentPhase === 'active') {
      return { action: 'jump', runIntensity: 0.5, offsetX: 0, lift: Math.sin((since / JUMP_MS) * Math.PI) * 0.45 };
    }
    return super.hero();
  }
}
