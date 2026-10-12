import type { HoldPose } from '../../vision/moves';
import { scaleTime } from '../scaling';
import { SetStage } from '../setStage';
import type { GameInput, HeroState, StageSettings } from '../types';

/**
 * Shadow Wall (#16, #41, #43): een muur met een uitsparing in de vorm van een houding nadert. Neem de
 * houding aan en hou ze vast (statische kracht), dan glijdt de muur er netjes doorheen.
 * 4 muren: hurkzit, ster, armen omhoog, hurkzit; 15 s vasthouden (12 jaar, leeftijdsgeschaald),
 * 10 s rust ertussen. De muur komt ten laatste na vasthoudtijd + 8 s: dan breekt ze (`auto`).
 * Stilstaan is hier de bedoeling: geen intensiteitseis voor ★★★ (#45).
 */
export const SHADOW_WALL = { holdMs: 15000, graceMs: 8000, restMs: 10000, poses: ['squat', 'star', 'arms-up', 'squat'] as HoldPose[] } as const;

export const POSE_TEXT: Record<HoldPose, string> = {
  squat: 'Hurkzit: zak door je knieën, alsof je op een stoel zit',
  star: 'Ster: armen en benen wijd',
  'arms-up': 'Armen hoog boven je hoofd',
};

export class ShadowWall extends SetStage {
  readonly id = 'shadow-wall' as const;
  readonly kind = 'hold' as const;
  readonly title = 'Shadow Wall';
  readonly perSet = 1;
  readonly sets = SHADOW_WALL.poses.length;
  readonly holdMs: number;
  /** Hoe lang de huidige houding al (opgeteld) vastgehouden is. */
  held = 0;
  /** Klopt de houding nu? */
  matching = false;
  private wallStart = 0;
  private resolved: 'detected' | 'auto' | 'manual' | null = null;
  private resolvedAt = 0;

  constructor(settings: StageSettings) {
    super(settings, SHADOW_WALL.restMs);
    this.holdMs = scaleTime(SHADOW_WALL.holdMs, settings.age) * (settings.durationScale ?? 1);
  }

  get pose(): HoldPose {
    return SHADOW_WALL.poses[Math.min(this.set, SHADOW_WALL.poses.length - 1)];
  }

  /** 0..1: hoe ver de muur genaderd is (1 = bij de held). */
  get wallProgress(): number {
    if (!this.isActiveSet) return 0;
    if (this.resolved) return Math.min(1, 0.85 + (this.clock - this.resolvedAt) / 1200);
    const max = this.holdMs + SHADOW_WALL.graceMs * (this.settings.durationScale ?? 1);
    return Math.min(0.85, ((this.clock - this.wallStart) / max) * 0.85);
  }

  get holdFraction(): number {
    return Math.min(1, this.held / this.holdMs);
  }

  get outcome(): 'detected' | 'auto' | 'manual' | null {
    return this.resolved;
  }

  protected needsIntensity(): boolean {
    return false;
  }

  protected introText(): string {
    return 'Muren met een gat in de vorm van een houding! Neem dezelfde houding aan en hou ze vast tot de muur voorbij is.';
  }

  protected setStartText(): string {
    return `${POSE_TEXT[this.pose]}!`;
  }

  protected instruction(): string {
    return POSE_TEXT[this.pose];
  }

  protected finishText(): string {
    return 'Ijzersterk! Alle muren zijn voorbij.';
  }

  protected startSet(): void {
    this.held = 0;
    this.wallStart = this.clock;
    this.resolved = null;
  }

  private resolve(o: 'detected' | 'auto' | 'manual'): void {
    this.resolved = o;
    this.resolvedAt = this.clock;
    this.count(o);
  }

  protected stepSet(input: GameInput, dt: number): boolean {
    if (!this.resolved) {
      this.matching = input.state.poses[this.pose] && input.power <= 45;
      if (this.matching) this.held += dt;
      if (this.held >= this.holdMs) this.resolve('detected');
      else if (this.clock - this.wallStart > this.holdMs + SHADOW_WALL.graceMs * (this.settings.durationScale ?? 1)) this.resolve('auto');
    }
    return this.resolved !== null && this.clock - this.resolvedAt > 1300;
  }

  manualPass(): void {
    if (this.isActiveSet && !this.resolved) this.resolve('manual');
  }

  hero(): HeroState {
    const phase = this.currentPhase;
    if (phase === 'finished') return { action: 'cheer', runIntensity: 0, offsetX: 0, lift: 0 };
    if (this.isActiveSet) {
      if (this.resolved === 'auto') return { action: 'stumble', runIntensity: 0, offsetX: 0, lift: 0 };
      if (this.matching || this.resolved) return { action: this.pose === 'arms-up' ? 'armsUp' : this.pose, runIntensity: 0, offsetX: 0, lift: 0 };
      return { action: 'ready', runIntensity: 0, offsetX: 0, lift: 0 };
    }
    return { action: 'idle', runIntensity: 0, offsetX: 0, lift: 0 };
  }
}
