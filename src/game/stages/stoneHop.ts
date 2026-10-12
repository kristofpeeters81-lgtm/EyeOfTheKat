import type { Lane } from '../../vision/moves';
import { scaleCount } from '../scaling';
import { SetStage } from '../setStage';
import type { GameInput, HeroState, StageSettings } from '../types';

/**
 * Stone Hop (#15, #41, #43): springstenen in een rivier, links en rechts om beurt. Het kind hopt
 * zijwaarts naar de kant van de oplichtende steen (skater-sprongen: cardio). De held volgt live de
 * zijbaan van het kind. 3 golven × 10 stenen (12 jaar). Vangnet: na 5 s hopt de held toch (`auto`).
 */
export const STONE_HOP = { perSet: 10, sets: 3, autoAfterMs: 5000, restMs: 20000, hopMs: 380, nextDelayMs: 250 } as const;

export class StoneHop extends SetStage {
  readonly id = 'stone-hop' as const;
  readonly kind = 'reps' as const;
  readonly title = 'Stone Hop';
  readonly perSet: number;
  readonly sets = STONE_HOP.sets;
  /** De steen die nu oplicht: -1 = links, 1 = rechts (zoals de kind het ziet in de spiegel). */
  target: -1 | 1 = -1;
  /** Waar de held staat (volgt het kind). */
  heroLane: Lane = 0;
  /** Aantal gehaalde stenen in totaal (voor het verschuiven van de rivier). */
  stones = 0;
  private targetSince = 0;
  private hopAt = -Infinity;
  private waitUntil = 0;
  private autoHop = false;

  constructor(settings: StageSettings) {
    super(settings, STONE_HOP.restMs);
    this.perSet = scaleCount(STONE_HOP.perSet, settings.age);
  }

  protected introText(): string {
    return 'Steek de rivier over via de springstenen! Hop naar links of rechts, naar de steen die oplicht.';
  }

  protected instruction(): string {
    return this.target < 0 ? '← Hop naar links' : 'Hop naar rechts →';
  }

  /** Wacht de volgende steen nog even (na een sprong)? */
  get waiting(): boolean {
    return this.clock < this.waitUntil;
  }

  get hopProgress(): number | null {
    const p = (this.clock - this.hopAt) / STONE_HOP.hopMs;
    return p >= 0 && p < 1 ? p : null;
  }

  protected startSet(index: number): void {
    this.target = index % 2 === 0 ? -1 : 1;
    this.targetSince = this.clock;
    this.waitUntil = 0;
  }

  private reach(o: 'detected' | 'auto' | 'manual'): void {
    this.count(o);
    this.stones++;
    this.hopAt = this.clock;
    this.autoHop = o === 'auto';
    if (o !== 'detected') this.heroLane = this.target;
    this.target = this.target < 0 ? 1 : -1;
    this.waitUntil = this.clock + STONE_HOP.nextDelayMs;
    this.targetSince = this.waitUntil;
  }

  protected stepSet(input: GameInput): boolean {
    const laneEvent = input.events.find((e) => e.type === 'lane');
    if (laneEvent && laneEvent.type === 'lane') {
      if (laneEvent.lane !== this.heroLane) this.hopAt = this.clock;
      this.heroLane = laneEvent.lane;
    }
    if (this.doneInSet < this.perSet && !this.waiting) {
      if (input.state.lane === this.target) this.reach('detected');
      else if (this.clock - this.targetSince > STONE_HOP.autoAfterMs * (this.settings.durationScale ?? 1)) this.reach('auto');
    }
    return this.doneInSet >= this.perSet && !this.waiting;
  }

  manualPass(): void {
    if (this.currentPhase === 'active' && this.doneInSet < this.perSet && !this.waiting) this.reach('manual');
  }

  hero(): HeroState {
    const phase = this.currentPhase;
    if (phase === 'finished') return { action: 'cheer', runIntensity: 0, offsetX: this.heroLane * 0.8, lift: 0 };
    const p = this.hopProgress;
    const lift = p !== null ? Math.sin(p * Math.PI) * 0.25 : 0;
    if (p !== null && this.autoHop) return { action: 'stumble', runIntensity: 0, offsetX: this.heroLane * 0.8, lift };
    const action = p !== null ? (this.heroLane < 0 ? 'hopLeft' : 'hopRight') : phase === 'active' ? 'ready' : 'idle';
    return { action, runIntensity: 0, offsetX: this.heroLane * 0.8, lift };
  }
}
