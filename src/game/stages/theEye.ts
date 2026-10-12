import { scaleTime, tempoFactor } from '../scaling';
import { StageBase } from '../stageBase';
import type { GameInput, HeroState, HudInfo, StageSettings } from '../types';

/**
 * The Eye (#17, #35, #41): de finale, één doorlopende klim naar het Oog van de Kat. Alles komt
 * terug, steeds sneller (#17: finale = continu):
 *
 *   sprint 15 s → 5 stammen → 5 balken → sprint 15 s → 8 gemengd → sprint 12 s → 12 gemengd (sneller)
 *   → "Reik naar het Oog": armen omhoog vasthouden (4 s) → het Oog opent.
 *
 * Sprint-seconden tellen zoals bij Bridge Sprint, obstakels zoals bij Log Roll / Duck Beams.
 */

export type EyeKind = 'log' | 'beam';

export interface EyeObstacle {
  kind: EyeKind;
  at: number;
  result: 'pending' | 'detected' | 'auto' | 'manual';
}

interface Span {
  from: number;
  to: number;
}

export const THE_EYE = {
  sprintMs: [15000, 15000, 12000],
  firstLogs: 5,
  firstBeams: 5,
  mixed1: 8,
  mixed2: 12,
  gapStart: 2400,
  gapEnd: 1500,
  holdMs: 4000,
  holdAutoMs: 12000,
  jump: { before: 650, after: 200 },
  duck: { before: 350, after: 300 },
  runningPower: 30,
} as const;

const JUMP_MS = 520;

export class TheEye extends StageBase {
  readonly id = 'the-eye' as const;
  readonly kind = 'continuous' as const;
  readonly title = 'The Eye';
  readonly obstacles: EyeObstacle[] = [];
  readonly sprints: Span[] = [];
  /** Begin van het slot ("reik naar het Oog"), in ms actieve tijd. */
  readonly finalAt: number;
  readonly holdMs: number;
  /** Actieve speeltijd (ms sinds de start van de klim). */
  run = 0;
  held = 0;
  eyeOpen = 0;
  private jumpAt = -Infinity;
  private stumbleUntil = -Infinity;
  private low = false;
  private secondStart = 0;
  private secondSum = 0;
  private secondTime = 0;
  private finalDone: 'detected' | 'auto' | 'manual' | null = null;
  private finalDoneAt = 0;
  private sprintIdx = -1;
  private legPower = 0;

  constructor(settings: StageSettings) {
    super(settings);
    const k = settings.durationScale ?? 1;
    const tempo = tempoFactor(settings.age);
    let t = 0;
    const sprint = (ms: number) => {
      this.sprints.push({ from: t, to: t + ms * k });
      t += ms * k + 1500;
    };
    const block = (kinds: EyeKind[], speedUp: number) => {
      t += 1200;
      kinds.forEach((kind, i) => {
        this.obstacles.push({ kind, at: t, result: 'pending' });
        const f = kinds.length > 1 ? i / (kinds.length - 1) : 0;
        t += ((THE_EYE.gapStart + (THE_EYE.gapEnd - THE_EYE.gapStart) * f) * speedUp) / tempo;
      });
      t += 800;
    };
    const mixed = (n: number) => Array.from({ length: n }, (_, i): EyeKind => (i % 3 === 1 ? 'beam' : i % 2 ? 'log' : 'beam'));
    sprint(THE_EYE.sprintMs[0]);
    block(Array<EyeKind>(THE_EYE.firstLogs).fill('log'), 1);
    block(Array<EyeKind>(THE_EYE.firstBeams).fill('beam'), 1);
    sprint(THE_EYE.sprintMs[1]);
    block(mixed(THE_EYE.mixed1), 0.95);
    sprint(THE_EYE.sprintMs[2]);
    block(mixed(THE_EYE.mixed2), 0.85);
    this.finalAt = t;
    this.holdMs = scaleTime(THE_EYE.holdMs, settings.age) * k;
  }

  protected introText(): string {
    return 'Dit is het: de laatste klim naar het Oog van de Kat! Sprinten, springen en duiken door elkaar. Geef alles!';
  }

  /** Sprintseconden + obstakels + het slot. */
  protected taskTotal(): number {
    const seconds = this.sprints.reduce((a, s) => a + Math.floor((s.to - s.from) / 1000), 0);
    return seconds + this.obstacles.length + 1;
  }

  protected intensity(input: GameInput): number {
    return this.inSprint ? Math.max(input.power, input.legPower) : input.power;
  }

  protected onStart(): void {
    this.run = 0;
  }

  get inSprint(): boolean {
    return this.sprints.some((s) => this.run >= s.from && this.run < s.to);
  }

  get inFinal(): boolean {
    return this.run >= this.finalAt;
  }

  get finalResult(): 'detected' | 'auto' | 'manual' | null {
    return this.finalDone;
  }

  protected step(input: GameInput, dt: number): void {
    this.run += dt;
    this.low = input.state.low;
    this.legPower = input.legPower;
    if (input.events.some((e) => e.type === 'jump')) {
      this.jumpAt = this.clock;
      this.sfx('whoosh');
    }

    // Sprint-seconden.
    const idx = this.sprints.findIndex((s) => this.run >= s.from && this.run < s.to);
    if (idx >= 0) {
      if (idx !== this.sprintIdx) {
        this.sprintIdx = idx;
        this.secondStart = this.sprints[idx].from;
        this.secondSum = 0;
        this.secondTime = 0;
        this.say(idx === 0 ? 'Sprint de berg op!' : idx === this.sprints.length - 1 ? 'Laatste sprint!' : 'Sprinten!', true);
      }
      this.secondSum += input.legPower * dt;
      this.secondTime += dt;
      if (this.run - this.secondStart >= 1000) {
        this.closeSecond();
        this.secondStart += 1000;
      }
    } else if (this.secondTime > 0) {
      // Einde van een sprint: een laatste halve seconde telt nog mee.
      if (this.secondTime >= 500) this.closeSecond();
      this.secondSum = 0;
      this.secondTime = 0;
    }

    // Obstakels.
    const next = this.obstacles.find((o) => o.result === 'pending');
    if (next) {
      if (next === this.obstacles[0] || this.obstacles[this.obstacles.indexOf(next) - 1].kind !== next.kind) {
        if (this.run >= next.at - 2600 && this.run < next.at - 2600 + dt) this.say(next.kind === 'log' ? 'Stammen! Springen!' : 'Balken! Hurken!');
      }
      const w = next.kind === 'log' ? THE_EYE.jump : THE_EYE.duck;
      const hit = next.kind === 'log' ? input.events.some((e) => e.type === 'jump') || input.state.airborne : input.state.low;
      if (this.run >= next.at - w.before && this.run <= next.at + w.after && hit) {
        next.result = 'detected';
        this.record('detected');
        this.sfx('hit');
      } else if (this.run > next.at + w.after) {
        next.result = 'auto';
        this.record('auto');
        this.sfx('stumble');
        this.stumbleUntil = this.clock + 650;
      }
    }

    // Slot: reik naar het Oog.
    if (this.inFinal && !this.finalDone) {
      if (this.run - dt < this.finalAt) this.say('Het Oog van de Kat! Steek je armen hoog en hou vast!', true);
      if (input.state.poses['arms-up']) this.held += dt;
      if (this.held >= this.holdMs) this.endFinal('detected');
      else if (this.run - this.finalAt > THE_EYE.holdAutoMs * (this.settings.durationScale ?? 1)) this.endFinal('auto');
    }
    if (this.finalDone) {
      this.eyeOpen = Math.min(1, (this.clock - this.finalDoneAt) / 1500);
      if (this.clock - this.finalDoneAt > 2500) this.finish();
    }
  }

  private closeSecond(): void {
    const avg = this.secondSum / Math.max(1, this.secondTime);
    this.record(avg >= THE_EYE.runningPower ? 'detected' : 'auto');
    this.secondSum = 0;
    this.secondTime = 0;
  }

  private endFinal(o: 'detected' | 'auto' | 'manual'): void {
    this.finalDone = o;
    this.finalDoneAt = this.clock;
    this.record(o);
    this.sfx('star');
    this.say('Je hebt het Oog van de Kat bereikt! Jij bent een echte ninja!', true);
  }

  manualPass(): void {
    if (this.currentPhase !== 'active') return;
    if (this.inFinal && !this.finalDone) {
      this.endFinal('manual');
      return;
    }
    const next = this.obstacles.find((o) => o.result === 'pending');
    if (next && next.at - this.run < 1500) {
      next.result = 'manual';
      this.record('manual');
    }
  }

  hud(): HudInfo {
    const phase = this.currentPhase;
    const instruction = phase === 'finished'
      ? 'Het Oog is van jou!'
      : this.inFinal
        ? 'Armen hoog: reik naar het Oog!'
        : this.inSprint
          ? 'SPRINT!'
          : (this.obstacles.find((o) => o.result === 'pending')?.kind ?? 'log') === 'log'
            ? 'Spring over de stammen!'
            : 'Hurk onder de balken!';
    const progress = phase === 'finished' ? 1 : Math.min(0.97, this.run / (this.finalAt + this.holdMs));
    const timer = this.inFinal && !this.finalDone ? Math.max(0, Math.ceil((this.holdMs - this.held) / 1000)) : null;
    return this.baseHud(this.title, instruction, progress, `${Math.round(progress * 100)}% van de klim`, timer);
  }

  hero(): HeroState {
    const phase = this.currentPhase;
    if (phase === 'finished' || this.finalDone) return { action: 'cheer', runIntensity: 0, offsetX: 0, lift: 0 };
    if (this.clock < this.stumbleUntil) return { action: 'stumble', runIntensity: 0.3, offsetX: 0, lift: 0 };
    const since = this.clock - this.jumpAt;
    if (phase === 'active' && since >= 0 && since < JUMP_MS) return { action: 'jump', runIntensity: 0.6, offsetX: 0, lift: Math.sin((since / JUMP_MS) * Math.PI) * 0.45 };
    if (phase === 'active' && this.inFinal) return { action: 'armsUp', runIntensity: 0, offsetX: 0, lift: 0 };
    if (phase === 'active' && this.low) return { action: 'duck', runIntensity: 0.3, offsetX: 0, lift: 0 };
    if (phase === 'active') return { action: 'run', runIntensity: this.inSprint ? Math.min(1, Math.max(0.3, this.legPower / 70)) : 0.55, offsetX: 0, lift: 0 };
    return { action: phase === 'countdown' ? 'ready' : 'idle', runIntensity: 0, offsetX: 0, lift: 0 };
  }
}
