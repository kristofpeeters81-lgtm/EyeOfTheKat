import type { StrikeZone } from '../../vision/moves';
import { scaleCount, tempoFactor } from '../scaling';
import { SetStage } from '../setStage';
import type { GameInput, HeroState, StageSettings } from '../types';

/**
 * Shadow Strike (#15, #40, #41, #43): schaduwdoelen lichten op links, rechts of boven; sla ze zo
 * snel mogelijk (cardio in intervallen). 4 rondes × 9 doelen (12 jaar) met 20 s rust. Een doel
 * blijft 1,5 s staan (langer voor jonge kinderen); te laat = het verdwijnt (`auto`).
 * In de kleurbandjes-modus moet de hand zelf in het doelvlak (#40, via de MoveTracker).
 */
export const SHADOW_STRIKE = { perSet: 9, sets: 4, targetMs: 1500, gapMs: 300, restMs: 20000 } as const;

const ORDER: StrikeZone[] = ['left', 'right', 'up', 'right', 'left', 'up', 'left', 'left', 'right', 'up', 'right', 'left'];

export class ShadowStrike extends SetStage {
  readonly id = 'shadow-strike' as const;
  readonly kind = 'interval' as const;
  readonly title = 'Shadow Strike';
  readonly perSet: number;
  readonly sets = SHADOW_STRIKE.sets;
  readonly targetMs: number;
  /** Huidig doel, of null tussen twee doelen. */
  target: StrikeZone | null = null;
  targetSince = 0;
  /** Laatste slag van de held (voor de animatie). */
  lastStrike: { zone: StrikeZone; at: number; hit: boolean } | null = null;
  private nextAt = 0;
  private spawned = 0;

  constructor(settings: StageSettings) {
    super(settings, SHADOW_STRIKE.restMs);
    this.perSet = scaleCount(SHADOW_STRIKE.perSet, settings.age);
    this.targetMs = SHADOW_STRIKE.targetMs / tempoFactor(settings.age);
  }

  protected introText(): string {
    return 'Schaduwdoelen! Sla ze zo snel als je kan: links, rechts of boven je hoofd.';
  }

  protected instruction(): string {
    if (!this.target) return 'Klaar…';
    return this.target === 'up' ? 'Sla OMHOOG!' : this.target === 'left' ? '← Sla LINKS' : 'Sla RECHTS →';
  }

  /** 0..1 hoeveel tijd het doel nog heeft. */
  get targetLeft(): number {
    return this.target ? Math.max(0, 1 - (this.clock - this.targetSince) / this.targetMs) : 0;
  }

  protected startSet(): void {
    this.target = null;
    this.nextAt = this.clock + 600;
  }

  private resolve(o: 'detected' | 'auto' | 'manual'): void {
    this.count(o);
    this.target = null;
    this.nextAt = this.clock + SHADOW_STRIKE.gapMs;
  }

  protected stepSet(input: GameInput): boolean {
    for (const e of input.events) {
      if (e.type === 'strike') {
        const hit = this.target === e.zone;
        this.lastStrike = { zone: e.zone, at: this.clock, hit };
        if (hit) this.resolve('detected');
      }
    }
    if (this.target && this.clock - this.targetSince > this.targetMs) this.resolve('auto');
    if (!this.target && this.doneInSet < this.perSet && this.clock >= this.nextAt) {
      this.target = ORDER[this.spawned % ORDER.length];
      this.targetSince = this.clock;
      this.spawned++;
    }
    return this.doneInSet >= this.perSet && !this.target;
  }

  manualPass(): void {
    if (this.isActiveSet && this.target) this.resolve('manual');
  }

  hero(): HeroState {
    const phase = this.currentPhase;
    if (phase === 'finished') return { action: 'cheer', runIntensity: 0, offsetX: 0, lift: 0 };
    const s = this.lastStrike;
    if (s && this.clock - s.at < 350) {
      const action = s.zone === 'up' ? 'strikeUp' : s.zone === 'left' ? 'strikeLeft' : 'strikeRight';
      return { action, runIntensity: 0, offsetX: 0, lift: 0 };
    }
    return { action: phase === 'active' || phase === 'countdown' ? 'ready' : 'idle', runIntensity: 0, offsetX: 0, lift: 0 };
  }
}
