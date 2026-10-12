import type { GameInput, HeroState, StageSettings } from '../types';
import { TimedObstacleStage } from './timed';

/**
 * Duck Beams (#16, #41, #43): balken op hoofdhoogte komen eraan; hurken (squat) om eronder door te
 * gaan. 3 reeksen × 8 balken (12 jaar), 20 s rust. Telt als je laag bent in een venster van
 * 0,35 s vóór tot 0,3 s na de aankomst: zo moet je echt door de knieën, en ook weer recht om de
 * volgende te halen (krachttraining in herhalingen, #17).
 */
export const DUCK_BEAMS = { perSet: 8, sets: 3, firstAt: 3000, gapStart: 2600, gapEnd: 2100, before: 350, after: 300, restMs: 20000 } as const;

export class DuckBeams extends TimedObstacleStage {
  readonly id = 'duck-beams' as const;
  readonly kind = 'reps' as const;
  readonly title = 'Duck Beams';
  private low = false;

  constructor(settings: StageSettings) {
    super(settings, DUCK_BEAMS);
  }

  protected introText(): string {
    return 'Zwaaiende balken op hoofdhoogte! Hurk diep als er een balk aankomt, en kom daarna weer recht.';
  }

  protected instruction(): string {
    return 'Hurk onder de balken!';
  }

  protected hit(input: GameInput): boolean {
    return input.state.low;
  }

  protected stepSet(input: GameInput): boolean {
    this.low = input.state.low;
    return super.stepSet(input);
  }

  hero(): HeroState {
    if (this.currentPhase === 'active' && this.low && !this.stumbling) return { action: 'duck', runIntensity: 0.3, offsetX: 0, lift: 0 };
    return super.hero();
  }
}
