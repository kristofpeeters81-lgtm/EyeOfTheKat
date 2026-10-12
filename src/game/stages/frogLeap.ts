import { scaleCount } from '../scaling';
import { SetStage } from '../setStage';
import type { GameInput, HeroState, StageSettings } from '../types';

/**
 * Frog Leap (#16, #41, #43): van platform naar platform met kikkersprongen: diep hurken en dan
 * explosief omhoog springen (kracht + explosief). In eigen tempo: 3 reeksen × 6 (12 jaar).
 * Vangnet: na 8 s zonder kikkersprong springt de held toch (telt als `auto`).
 */
export const FROG_LEAP = { perSet: 6, sets: 3, autoAfterMs: 8000, restMs: 20000, leapMs: 650 } as const;

export class FrogLeap extends SetStage {
  readonly id = 'frog-leap' as const;
  readonly kind = 'reps' as const;
  readonly title = 'Frog Leap';
  readonly perSet: number;
  readonly sets = FROG_LEAP.sets;
  /** Aantal platformen vooruit (voor de tekening). */
  platform = 0;
  /** Spelklok bij het begin van de laatste sprong. */
  leapAt = -Infinity;
  private lastRepAt = 0;
  private low = false;
  private autoLeap = false;

  constructor(settings: StageSettings) {
    super(settings, FROG_LEAP.restMs);
    this.perSet = scaleCount(FROG_LEAP.perSet, settings.age);
  }

  protected introText(): string {
    return 'Spring als een kikker van platform naar platform! Hurk diep, en spring dan zo hoog als je kan.';
  }

  protected instruction(): string {
    return 'Diep hurken… en SPRING!';
  }

  /** 0..1 tijdens een sprong, anders null. */
  get leapProgress(): number | null {
    const p = (this.clock - this.leapAt) / FROG_LEAP.leapMs;
    return p >= 0 && p < 1 ? p : null;
  }

  protected startSet(): void {
    this.lastRepAt = this.clock;
  }

  private leap(o: 'detected' | 'auto' | 'manual'): void {
    this.count(o);
    this.platform++;
    this.leapAt = this.clock;
    this.autoLeap = o !== 'detected';
    this.lastRepAt = this.clock;
  }

  protected stepSet(input: GameInput): boolean {
    this.low = input.state.low;
    const busy = this.leapProgress !== null;
    if (!busy && this.doneInSet < this.perSet) {
      if (input.events.some((e) => e.type === 'frogleap')) this.leap('detected');
      else if (this.clock - this.lastRepAt > FROG_LEAP.autoAfterMs * (this.settings.durationScale ?? 1)) this.leap('auto');
    }
    return this.doneInSet >= this.perSet && this.leapProgress === null;
  }

  manualPass(): void {
    if (this.currentPhase === 'active' && this.leapProgress === null && this.doneInSet < this.perSet) this.leap('manual');
  }

  hero(): HeroState {
    const phase = this.currentPhase;
    if (phase === 'finished') return { action: 'cheer', runIntensity: 0, offsetX: 0, lift: 0 };
    const p = this.leapProgress;
    if (p !== null) return { action: this.autoLeap ? 'stumble' : 'frogLeap', runIntensity: 0, offsetX: 0, lift: Math.sin(p * Math.PI) * 0.7 };
    if (phase === 'active' && this.low) return { action: 'frogCrouch', runIntensity: 0, offsetX: 0, lift: 0 };
    return { action: phase === 'countdown' || phase === 'active' ? 'ready' : 'idle', runIntensity: 0, offsetX: 0, lift: 0 };
  }
}
