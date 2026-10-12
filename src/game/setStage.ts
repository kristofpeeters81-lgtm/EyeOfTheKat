import { StageBase } from './stageBase';
import type { GameInput, HudInfo, StageSettings } from './types';

/**
 * Etappes in sets met rust ertussen (#17: kracht = herhalingen, sprongen = golven). Een set is klaar
 * als `stepSet()` true teruggeeft. Tussen de sets: actieve rust met aftelling. Na de laatste set:
 * klaar. De opdrachten binnen een set worden met `record()` geteld (#31).
 */
export abstract class SetStage extends StageBase {
  protected set = 0;
  protected readonly restMs: number;
  /** Aantal opdrachten per set (al leeftijdsgeschaald). */
  abstract readonly perSet: number;
  abstract readonly sets: number;
  /** Teller binnen de set (voor de HUD). */
  protected doneInSet = 0;

  constructor(settings: StageSettings, restMs = 20000) {
    super(settings);
    this.restMs = restMs * (settings.durationScale ?? 1);
  }

  /** Begin van set `index` (0-gebaseerd). */
  protected abstract startSet(index: number): void;
  /** Eén stap binnen een set; true = set klaar. */
  protected abstract stepSet(input: GameInput, dt: number): boolean;
  /** Opdracht voor in de HUD tijdens een set. */
  protected abstract instruction(): string;
  /** Zin van de Geest bij het begin van een set. */
  protected setStartText(index: number): string {
    return index === 0 ? 'Daar gaan we!' : index === this.sets - 1 ? 'Laatste reeks, je kan het!' : 'Volgende reeks!';
  }

  /** Loopt er nu een set (geen intro, rust of einde)? */
  get isActiveSet(): boolean {
    return this.currentPhase === 'active';
  }

  protected taskTotal(): number {
    return this.sets * this.perSet;
  }

  protected onStart(): void {
    this.beginSet();
  }

  private beginSet(): void {
    this.doneInSet = 0;
    if (this.currentPhase !== 'active') this.setPhase('active');
    this.say(this.setStartText(this.set), true);
    this.startSet(this.set);
  }

  protected step(input: GameInput, dt: number): void {
    if (this.currentPhase === 'active') {
      if (this.stepSet(input, dt)) {
        this.set++;
        this.sfx('success');
        if (this.set >= this.sets) {
          this.say(this.finishText(), true);
          this.finish();
        } else {
          this.setPhase('rest');
          this.say(`Goed zo! Even rusten. Nog ${this.sets - this.set} ${this.sets - this.set === 1 ? 'reeks' : 'reeksen'}.`, true);
        }
      }
    } else if (this.currentPhase === 'rest') {
      const left = this.restMs - this.inPhase;
      if (left <= 3000 && left + dt > 3000) this.say('Klaar? Nog drie seconden!', true);
      if (left <= 0) this.beginSet();
    }
  }

  protected finishText(): string {
    return 'Geweldig, deze etappe is uitgespeeld!';
  }

  /** Geteld voor de huidige set (en de HUD). */
  protected count(o: 'detected' | 'auto' | 'manual'): void {
    this.record(o);
    this.doneInSet++;
    if (o === 'detected') this.sfx('hit');
    else this.sfx('stumble');
  }

  hud(): HudInfo {
    const phase = this.currentPhase;
    const total = this.taskTotal();
    const done = Math.min(total, this.outcomes.length);
    const timer = phase === 'rest' ? Math.max(0, Math.ceil((this.restMs - this.inPhase) / 1000)) : null;
    const instruction = phase === 'rest' ? 'Rust even uit…' : phase === 'finished' ? 'Uitgespeeld!' : this.instruction();
    const counter = phase === 'active' ? `${this.doneInSet}/${this.perSet} · reeks ${this.set + 1}/${this.sets}` : `Reeks ${Math.min(this.sets, this.set + 1)}/${this.sets}`;
    return this.baseHud(this.title, instruction, phase === 'finished' ? 1 : done / total, counter, timer);
  }
}
