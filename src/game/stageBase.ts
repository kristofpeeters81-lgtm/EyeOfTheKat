import { computeStars } from './scaling';
import type { GameInput, HeroState, HudInfo, Outcome, SfxName, Stage, StageEvent, StageId, StageKind, StagePhase, StageResult, StageSettings } from './types';

/**
 * Gemeenschappelijk verloop van elke etappe:
 *
 *   intro (uitleg van de Geest) → aftellen 3-2-1 → actief (⇄ rust) → klaar
 *
 * - **Pauze** (#26): als het kind uit beeld is of er een tweede persoon in beeld staat, stopt de
 *   spelklok. Er gaat dan niets verloren, en het spel gaat verder zodra alles weer in orde is.
 * - **Meetgegevens** (#28, #29): actieve tijd, tijd in de zones hoog/piek, gemiddelde en piek-Power,
 *   en per obstakel hoe het gehaald werd (#31).
 *
 * Een etappe zelf implementeert enkel `step()` (het spel) en de teksten.
 */

export const INTRO_MS = 4000;
export const COUNTDOWN_MS = 3000;

const PAUSE_TEXT = {
  missing: 'Kom terug in beeld, ninja!',
  two: 'Er staat iemand anders in beeld. Eén ninja tegelijk!',
  scene: 'Het beeld is veranderd. Vraag een begeleider om opnieuw te kalibreren.',
} as const;

export abstract class StageBase implements Stage {
  abstract readonly id: StageId;
  abstract readonly kind: StageKind;
  abstract readonly title: string;

  protected phase: StagePhase = 'intro';
  /** Spelklok in ms: loopt niet tijdens een pauze. */
  protected clock = 0;
  /** Spelklok bij het begin van de huidige fase. */
  protected phaseStart = 0;
  protected readonly outcomes: Outcome[] = [];
  private out: StageEvent[] = [];
  private started = false;
  private paused = false;
  private pauseReason: string | null = null;
  private pauses = 0;
  private lastTick = -1;
  private activeMs = 0;
  private highZoneMs = 0;
  private powerSum = 0;
  private powerTime = 0;
  private peakPower = 0;
  private endClock = 0;
  private markerMode = false;

  constructor(protected readonly settings: StageSettings) {}

  get finished(): boolean {
    return this.phase === 'finished';
  }

  /** Uitleg van de Geest bij de start (#38). */
  protected abstract introText(): string;
  /** Het eigenlijke spel, enkel in de fasen 'active' en 'rest'. `dt` = spelklok-stap. */
  protected abstract step(input: GameInput, dt: number): void;
  /** Wordt opgeroepen bij het einde van het aftellen. */
  protected abstract onStart(): void;
  /** Totaal aantal obstakels/opdrachten (voor de sterren), of null bij een sprint-etappe. */
  protected abstract taskTotal(): number | null;
  abstract hud(): HudInfo;
  abstract hero(): HeroState;

  /** Intensiteit die meetelt voor de statistieken (standaard de Ninja Power). */
  protected intensity(input: GameInput): number {
    return input.power;
  }

  /** Telt de intensiteit mee voor ★★★? (Shadow Wall: neen.) */
  protected needsIntensity(): boolean {
    return true;
  }

  update(input: GameInput): StageEvent[] {
    this.out = [];
    if (this.phase === 'finished') return this.out;
    if (input.markerMode) this.markerMode = true;
    if (!this.started) {
      this.started = true;
      this.say(this.introText(), true);
      this.emit({ type: 'phase', phase: 'intro' });
    }

    // Pauze bij uit beeld / tweede persoon (niet tijdens de intro: dan mag je nog wegstappen).
    if (this.phase !== 'intro' && input.presence !== 'ok') {
      if (!this.paused) {
        this.paused = true;
        this.pauses++;
        this.pauseReason = PAUSE_TEXT[input.presence];
        this.say(this.pauseReason, true);
        this.sfx('pause');
      }
      return this.out;
    }
    if (this.paused) {
      this.paused = false;
      this.pauseReason = null;
      this.sfx('go');
    }

    const dt = Math.min(100, Math.max(0, input.dt));
    this.clock += dt;
    const inPhase = this.clock - this.phaseStart;

    if (this.phase === 'intro') {
      if (inPhase >= INTRO_MS) this.setPhase('countdown');
      return this.out;
    }
    if (this.phase === 'countdown') {
      const left = Math.ceil((COUNTDOWN_MS - inPhase) / 1000);
      if (left !== this.lastTick && left > 0) {
        this.lastTick = left;
        this.sfx('tick');
      }
      if (inPhase >= COUNTDOWN_MS) {
        this.setPhase('active');
        this.sfx('go');
        this.onStart();
      }
      return this.out;
    }

    if (this.phase === 'active') {
      const p = this.intensity(input);
      this.activeMs += dt;
      this.powerSum += p * dt;
      this.powerTime += dt;
      if (input.zone >= 2 || p >= 45) this.highZoneMs += dt;
      if (p > this.peakPower) this.peakPower = p;
    }
    this.step(input, dt);
    return this.out;
  }

  manualPass(): void {
    // Standaard: niets. Etappes met obstakels overschrijven dit.
  }

  result(): StageResult {
    const total = this.taskTotal();
    const detected = this.outcomes.filter((o) => o === 'detected').length;
    const auto = this.outcomes.filter((o) => o === 'auto').length;
    const manual = this.outcomes.filter((o) => o === 'manual').length;
    const highFraction = this.activeMs > 0 ? this.highZoneMs / this.activeMs : 0;
    const detectedFraction = total === null ? null : total > 0 ? detected / total : 0;
    const stars = this.finished ? computeStars({ detectedFraction, highZoneFraction: highFraction, needsIntensity: this.needsIntensity() }) : 0;
    const avgPower = this.powerTime > 0 ? this.powerSum / this.powerTime : 0;
    // Score: punten per echt gehaald obstakel + bonus voor intensiteit.
    const score = Math.round(detected * 100 + manual * 25 + auto * 10 + (this.highZoneMs / 1000) * 10 + avgPower * 5);
    return {
      stageId: this.id,
      stars,
      score,
      total: total ?? this.outcomes.length,
      detected,
      auto,
      manual,
      activeMs: Math.round(this.activeMs),
      highZoneMs: Math.round(this.highZoneMs),
      avgPower: Math.round(avgPower),
      peakPower: Math.round(this.peakPower),
      durationMs: Math.round(this.finished ? this.endClock : this.clock),
      pauses: this.pauses,
      markerMode: this.markerMode,
      age: this.settings.age,
    };
  }

  // --- hulpfuncties voor de etappes ---

  /** Spelklok (ms), voor tekeningen. */
  get clockMs(): number {
    return this.clock;
  }

  protected get isPaused(): boolean {
    return this.paused;
  }

  protected get pauseText(): string | null {
    return this.pauseReason;
  }

  protected get currentPhase(): StagePhase {
    return this.phase;
  }

  /** Tijd sinds het begin van de huidige fase (spelklok, ms). */
  protected get inPhase(): number {
    return this.clock - this.phaseStart;
  }

  protected setPhase(p: StagePhase): void {
    this.phase = p;
    this.phaseStart = this.clock;
    this.emit({ type: 'phase', phase: p });
  }

  protected finish(): void {
    if (this.phase === 'finished') return;
    this.endClock = this.clock;
    this.setPhase('finished');
    this.sfx('win');
    this.emit({ type: 'done' });
  }

  protected record(o: Outcome): void {
    this.outcomes.push(o);
  }

  protected say(text: string, high = false): void {
    this.emit({ type: 'say', text, priority: high ? 'high' : undefined });
  }

  protected sfx(name: SfxName): void {
    this.emit({ type: 'sfx', name });
  }

  protected emit(e: StageEvent): void {
    this.out.push(e);
  }

  /** Standaard HUD-velden voor intro/aftellen/pauze; etappes vullen de rest in. */
  protected baseHud(title: string, instruction: string, progress: number, counter: string, timer: number | null): HudInfo {
    const left = Math.ceil((COUNTDOWN_MS - this.inPhase) / 1000);
    return {
      title,
      instruction: this.phase === 'intro' ? instruction : this.phase === 'countdown' ? `${Math.max(1, left)}…` : instruction,
      progress,
      counter,
      timer: this.phase === 'countdown' ? Math.max(1, left) : timer,
      phase: this.phase,
      paused: this.paused,
      pauseReason: this.pauseReason,
    };
  }
}
