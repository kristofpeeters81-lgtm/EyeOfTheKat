import { scaleCount, tempoFactor } from '../scaling';
import { SetStage } from '../setStage';
import type { GameInput, HeroState, StageSettings } from '../types';

/**
 * Obstakels die op een vast moment bij de held aankomen (Log Roll, Duck Beams). Het kind moet de
 * juiste beweging doen in een venster rond dat moment. Lukt het niet, dan "struikelt" de held en gaat
 * het obstakel toch voorbij (#31: vangnet, telt als `auto`).
 */

export interface TimedObstacle {
  /** Aankomst bij de held, in ms sinds het begin van de set. */
  at: number;
  result: 'pending' | 'detected' | 'auto' | 'manual';
}

export interface TimedConfig {
  /** Aantal per set voor 12 jaar. */
  perSet: number;
  sets: number;
  /** Eerste obstakel na zoveel ms. */
  firstAt: number;
  /** Tijd tussen obstakels aan het begin en het einde van een set (12 jaar). */
  gapStart: number;
  gapEnd: number;
  /** Venster (ms) vóór en na de aankomst waarin de beweging telt. */
  before: number;
  after: number;
  restMs: number;
}

export abstract class TimedObstacleStage extends SetStage {
  readonly perSet: number;
  readonly sets: number;
  obstacles: TimedObstacle[] = [];
  protected readonly tempo: number;
  private stumbleUntil = -1;
  protected heroEventAt = -Infinity;

  constructor(
    settings: StageSettings,
    protected readonly config: TimedConfig,
  ) {
    super(settings, config.restMs);
    this.perSet = scaleCount(config.perSet, settings.age);
    this.sets = config.sets;
    this.tempo = tempoFactor(settings.age);
  }

  /** Doet het kind nu (of deed het net) de gevraagde beweging? */
  protected abstract hit(input: GameInput): boolean;

  /** Tijd binnen de huidige set (ms). */
  get setClock(): number {
    return this.inPhase;
  }

  get isActive(): boolean {
    return this.currentPhase === 'active';
  }

  protected startSet(): void {
    const c = this.config;
    const k = this.settings.durationScale ?? 1;
    this.obstacles = [];
    let at = c.firstAt * Math.max(0.5, k);
    for (let i = 0; i < this.perSet; i++) {
      this.obstacles.push({ at, result: 'pending' });
      const f = this.perSet > 1 ? i / (this.perSet - 1) : 0;
      // Jongere kinderen: meer tijd tussen de obstakels (tempo half geschaald, #43).
      at += (c.gapStart + (c.gapEnd - c.gapStart) * f) / this.tempo;
    }
  }

  protected stepSet(input: GameInput): boolean {
    const now = this.setClock;
    const next = this.obstacles.find((o) => o.result === 'pending');
    if (next) {
      const inWindow = now >= next.at - this.config.before && now <= next.at + this.config.after;
      if (inWindow && this.hit(input)) {
        next.result = 'detected';
        this.count('detected');
      } else if (now > next.at + this.config.after) {
        next.result = 'auto';
        this.stumbleUntil = this.clock + 650;
        this.count('auto');
      }
    }
    const last = this.obstacles[this.obstacles.length - 1];
    return !!last && last.result !== 'pending' && now > last.at + 900;
  }

  manualPass(): void {
    if (!this.isActive) return;
    const next = this.obstacles.find((o) => o.result === 'pending');
    if (next && next.at - this.setClock < 1500) {
      next.result = 'manual';
      this.count('manual');
    }
  }

  protected get stumbling(): boolean {
    return this.clock < this.stumbleUntil;
  }

  /** Standaard held: lopen, struikelen bij een gemist obstakel. */
  hero(): HeroState {
    const phase = this.currentPhase;
    if (phase === 'finished') return { action: 'cheer', runIntensity: 0, offsetX: 0, lift: 0 };
    if (this.stumbling) return { action: 'stumble', runIntensity: 0.3, offsetX: 0, lift: 0 };
    if (phase === 'active' || phase === 'rest') return { action: 'run', runIntensity: phase === 'active' ? 0.55 : 0.2, offsetX: 0, lift: 0 };
    return { action: phase === 'countdown' ? 'ready' : 'idle', runIntensity: 0, offsetX: 0, lift: 0 };
  }
}
