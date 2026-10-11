import { tempoFactor } from '../scaling';
import { StageBase } from '../stageBase';
import type { GameInput, HeroState, HudInfo, StageSettings } from '../types';

/**
 * Bridge Sprint (#15, #41, #43): ter plaatse sprinten om over een instortende hangbrug te rennen.
 *
 * - 4 sprints van 15 s (min. 10 s voor de jongsten), met 20 s actieve rust ertussen (#17: intervallen).
 * - De snelheid van de held volgt de **benen-power**. Achter de held stort de brug in met een vaste
 *   snelheid (iets trager voor jonge kinderen). Haalt de instorting de held in, dan struikelt hij
 *   even en wordt de instorting teruggezet: nooit "game over" (#31).
 * - Sprint-etappe zonder afzonderlijke obstakels: sterren op basis van tijd in hoog/piek (#45). Per
 *   seconde sprint wordt wel genoteerd of er echt gelopen werd (benen-power ≥ 30), voor de meetgegevens.
 */

export const BRIDGE = {
  rounds: 4,
  sprintMs: 15000,
  minSprintMs: 10000,
  restMs: 20000,
  /** Snelheid (m/s) bij stilstaan en bij volle kracht (benen-power ≥ fullPower). */
  minSpeed: 1.5,
  maxSpeed: 9,
  fullPower: 70,
  /** Snelheid van de instorting (m/s) voor 12 jaar; vraagt ongeveer de zone "hoog". */
  collapseSpeed: 5.8,
  /** Startafstand tussen held en instorting (m). */
  collapseGap: 6,
  /** Een seconde telt als "echt gelopen" vanaf deze benen-power. */
  runningPower: 30,
} as const;

export class BridgeSprint extends StageBase {
  readonly id = 'bridge-sprint' as const;
  readonly kind = 'interval' as const;
  readonly title = 'Bridge Sprint';

  readonly sprintMs: number;
  readonly restMs: number;
  private round = 0;
  private sprinting = false;
  /** Afgelegde afstand (m) en positie van de instorting (m). */
  distance = 0;
  collapse = -BRIDGE.collapseGap;
  private speed = 0;
  private legPower = 0;
  private stumbleUntil = -1;
  private warned = false;
  private secondStart = 0;
  private secondPowerSum = 0;
  private secondTime = 0;
  private manualThisSecond = false;
  private readonly collapseSpeed: number;

  constructor(settings: StageSettings) {
    super(settings);
    const f = tempoFactor(settings.age);
    const k = settings.durationScale ?? 1;
    this.sprintMs = Math.max(BRIDGE.minSprintMs, BRIDGE.sprintMs * f) * k;
    this.restMs = BRIDGE.restMs * k;
    this.collapseSpeed = BRIDGE.collapseSpeed * f;
  }

  /** Loopt de held nu over de brug (sprint) of over vaste grond (rust)? */
  get onBridge(): boolean {
    return this.sprinting;
  }

  get currentRound(): number {
    return this.round;
  }

  protected introText(): string {
    return 'De hangbrug stort in! Loop ter plaatse zo snel als je kan, knieën hoog. Vier sprints, met rust ertussen.';
  }

  protected taskTotal(): null {
    return null;
  }

  protected intensity(input: GameInput): number {
    return Math.max(input.power, input.legPower);
  }

  protected onStart(): void {
    this.startSprint();
  }

  manualPass(): void {
    if (this.sprinting) this.manualThisSecond = true;
  }

  private startSprint(): void {
    this.round++;
    this.sprinting = true;
    this.collapse = this.distance - BRIDGE.collapseGap;
    this.warned = false;
    this.secondStart = this.clock;
    this.secondPowerSum = 0;
    this.secondTime = 0;
    if (this.currentPhase !== 'active') this.setPhase('active');
    this.say(this.round === 1 ? 'Sprint!' : this.round === BRIDGE.rounds ? 'Laatste sprint, alles geven!' : 'Daar gaan we weer, sprint!', true);
  }

  protected step(input: GameInput, dt: number): void {
    const s = dt / 1000;
    this.legPower = input.legPower;
    if (this.sprinting) {
      const k = Math.min(1, Math.max(0, input.legPower / BRIDGE.fullPower));
      const target = BRIDGE.minSpeed + (BRIDGE.maxSpeed - BRIDGE.minSpeed) * k;
      this.speed += (target - this.speed) * Math.min(1, s * 4);
      if (this.clock < this.stumbleUntil) this.speed *= 0.5;
      this.distance += this.speed * s;
      this.collapse += this.collapseSpeed * s;
      const gap = this.distance - this.collapse;
      if (gap < 2.5 && !this.warned) {
        this.warned = true;
        this.say('Sneller! De brug zakt weg!', true);
      }
      if (gap < 0.6) {
        // Ingehaald: struikelen, maar nooit vallen.
        this.stumbleUntil = this.clock + 700;
        this.collapse = this.distance - 3;
        this.sfx('stumble');
      }
      // Per seconde: echt gelopen of niet (#31-meetgegevens).
      this.secondPowerSum += input.legPower * dt;
      this.secondTime += dt;
      if (this.clock - this.secondStart >= 1000) {
        this.closeSecond();
        // Vast raster van 1 s (geen verschuiving door stappen van 33 ms).
        this.secondStart += 1000;
      }
      if (this.inPhase >= this.sprintMs) {
        // Een laatste halve seconde telt nog mee.
        if (this.secondTime >= 500) this.closeSecond();
        this.sprinting = false;
        this.sfx('success');
        if (this.round >= BRIDGE.rounds) {
          this.say('Je bent over de brug! Sterk gelopen!', true);
          this.finish();
        } else {
          this.setPhase('rest');
          this.say(`Goed zo! Even uitblazen. Nog ${BRIDGE.rounds - this.round} ${BRIDGE.rounds - this.round === 1 ? 'sprint' : 'sprints'}.`, true);
        }
      }
    } else if (this.currentPhase === 'rest') {
      // Actieve rust: rustig verder wandelen.
      this.speed += (1.2 - this.speed) * Math.min(1, s * 2);
      this.distance += this.speed * s;
      const left = this.restMs - this.inPhase;
      if (left <= 3000 && left + dt > 3000) this.say('Klaar? Nog drie seconden!', true);
      if (left <= 0) this.startSprint();
    }
  }

  private closeSecond(): void {
    const avg = this.secondPowerSum / Math.max(1, this.secondTime);
    this.record(avg >= BRIDGE.runningPower ? 'detected' : this.manualThisSecond ? 'manual' : 'auto');
    if (avg >= BRIDGE.runningPower) this.sfx('step');
    this.secondPowerSum = 0;
    this.secondTime = 0;
    this.manualThisSecond = false;
  }

  hud(): HudInfo {
    const phase = this.currentPhase;
    const totalMs = BRIDGE.rounds * this.sprintMs;
    const doneMs = Math.max(0, this.round - (this.sprinting ? 1 : 0)) * this.sprintMs + (this.sprinting ? Math.min(this.inPhase, this.sprintMs) : 0);
    const timer = this.sprinting ? Math.max(0, Math.ceil((this.sprintMs - this.inPhase) / 1000)) : phase === 'rest' ? Math.max(0, Math.ceil((this.restMs - this.inPhase) / 1000)) : null;
    const instruction = this.sprinting ? 'SPRINT! Knieën hoog!' : phase === 'rest' ? 'Rust even uit…' : phase === 'finished' ? 'Over de brug!' : 'Loop ter plaatse zo snel je kan';
    return this.baseHud(this.title, instruction, phase === 'finished' ? 1 : doneMs / totalMs, `Sprint ${Math.max(1, this.round)}/${BRIDGE.rounds}`, timer);
  }

  hero(): HeroState {
    const phase = this.currentPhase;
    if (phase === 'finished') return { action: 'cheer', runIntensity: 0, offsetX: 0, lift: 0 };
    if (this.clock < this.stumbleUntil) return { action: 'stumble', runIntensity: 0.3, offsetX: 0, lift: 0 };
    if (this.sprinting || phase === 'rest') {
      const k = this.sprinting ? Math.min(1, Math.max(0.15, this.legPower / BRIDGE.fullPower)) : 0.2;
      return { action: 'run', runIntensity: k, offsetX: 0, lift: 0 };
    }
    return { action: phase === 'countdown' ? 'ready' : 'idle', runIntensity: 0, offsetX: 0, lift: 0 };
  }
}
