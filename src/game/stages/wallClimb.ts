import type { Side } from '../../vision/moves';
import { scaleCount } from '../scaling';
import { SetStage } from '../setStage';
import type { GameInput, HeroState, StageSettings } from '../types';

/**
 * Wall Climb (#16, #40, #41, #43): klim een rotswand op door om beurt je linker- en rechterarm hoog
 * boven je hoofd te steken (en je knie op te trekken). 3 klimmen × 12 grepen (12 jaar).
 * Telt enkel de juiste kant (afwisselen = echt klimmen). Vangnet: na 8 s klimt de held toch (`auto`).
 * In de kleurbandjes-modus moet de hand zelf boven het hoofd in het reikvlak (#40).
 */
export const WALL_CLIMB = { perSet: 12, sets: 3, autoAfterMs: 8000, restMs: 20000, gripMs: 300 } as const;

export class WallClimb extends SetStage {
  readonly id = 'wall-climb' as const;
  readonly kind = 'reps' as const;
  readonly title = 'Wall Climb';
  readonly perSet: number;
  readonly sets = WALL_CLIMB.sets;
  /** De kant die nu moet grijpen. */
  next: Side = 'left';
  /** Totaal aantal grepen (hoogte op de wand). */
  grips = 0;
  gripAt = -Infinity;
  private lastGrip = 0;
  private lastSide: Side = 'right';
  private autoGrip = false;

  constructor(settings: StageSettings) {
    super(settings, WALL_CLIMB.restMs);
    this.perSet = scaleCount(WALL_CLIMB.perSet, settings.age);
  }

  protected introText(): string {
    return 'Klim de rotswand op! Steek om beurt je linker- en je rechterarm hoog, en trek je knie mee op.';
  }

  protected instruction(): string {
    return this.next === 'left' ? '← Linkerarm omhoog' : 'Rechterarm omhoog →';
  }

  protected setStartText(index: number): string {
    return index === 0 ? 'Klimmen maar!' : index === this.sets - 1 ? 'Laatste stuk naar boven!' : 'Volgende wand!';
  }

  /** 0..1 tijdens het optrekken na een greep. */
  get gripProgress(): number | null {
    const p = (this.clock - this.gripAt) / WALL_CLIMB.gripMs;
    return p >= 0 && p < 1 ? p : null;
  }

  protected startSet(): void {
    this.lastGrip = this.clock;
  }

  private grip(o: 'detected' | 'auto' | 'manual'): void {
    this.count(o);
    this.grips++;
    this.gripAt = this.clock;
    this.lastSide = this.next;
    this.autoGrip = o === 'auto';
    this.next = this.next === 'left' ? 'right' : 'left';
    this.lastGrip = this.clock;
  }

  protected stepSet(input: GameInput): boolean {
    if (this.doneInSet < this.perSet) {
      if (input.events.some((e) => e.type === 'reach' && e.side === this.next)) this.grip('detected');
      else if (this.clock - this.lastGrip > WALL_CLIMB.autoAfterMs * (this.settings.durationScale ?? 1)) this.grip('auto');
    }
    return this.doneInSet >= this.perSet && this.gripProgress === null;
  }

  manualPass(): void {
    if (this.isActiveSet && this.doneInSet < this.perSet) this.grip('manual');
  }

  hero(): HeroState {
    const phase = this.currentPhase;
    if (phase === 'finished') return { action: 'cheer', runIntensity: 0, offsetX: 0, lift: 0 };
    if (this.isActiveSet) {
      if (this.autoGrip && this.gripProgress !== null) return { action: 'stumble', runIntensity: 0, offsetX: 0, lift: 0 };
      return { action: this.lastSide === 'left' ? 'reachLeft' : 'reachRight', runIntensity: 0, offsetX: 0, lift: 0 };
    }
    return { action: 'idle', runIntensity: 0, offsetX: 0, lift: 0 };
  }
}
