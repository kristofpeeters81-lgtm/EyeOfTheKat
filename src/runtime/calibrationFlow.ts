import { SPACE_HINT_TEXT } from '../vision/calibration';
import type { VisionResult } from '../vision/engine';
import type { BodyCalibration } from '../vision/types';

/**
 * Het kalibratieverloop (#30) als toestandsmachine zonder UI (testbaar, overneembaar in B-world):
 *
 *   aim        toestel neerzetten (kleine camerapreview, #10) → tik "Klaar"
 *   countdown  "Stap opzij uit beeld!" 5-4-3-2-1
 *   learning   de lege kamer leren (±1 s); beweegt er iets, dan begint de motor opnieuw
 *   enter      "Kom terug en ga in de schaduw-ninja staan" → ruimte-check + stilstaan
 *   done       lichaamsmaten vastgelegd
 */

export type CalibrationStep = 'aim' | 'countdown' | 'learning' | 'enter' | 'done';

export interface CalibrationEngine {
  startLearning(): void;
  calibrateBody(): void;
}

export interface FlowView {
  step: CalibrationStep;
  /** Grote titel. */
  title: string;
  /** Uitleg / aanwijzing. */
  text: string;
  /** Resterende seconden tijdens het aftellen. */
  count: number | null;
  /** 0..1 voortgang van de huidige stap. */
  progress: number;
}

export const COUNTDOWN_S = 5;
const LEARN_TIMEOUT_MS = 9000;

export class CalibrationFlow {
  private step: CalibrationStep = 'aim';
  private stepStart = 0;
  private text = 'Zet het toestel stevig neer, op heuphoogte, met 2 à 3 meter vrije ruimte ervoor.';
  private count: number | null = null;
  private progress = 0;
  private result: BodyCalibration | null = null;
  private retries = 0;

  constructor(
    private readonly engine: CalibrationEngine,
    /** Wordt opgeroepen bij elke nieuwe zin van de Geest (voor de stem, #38). */
    private readonly say: (text: string) => void = () => undefined,
  ) {}

  get calibration(): BodyCalibration | null {
    return this.result;
  }

  get currentStep(): CalibrationStep {
    return this.step;
  }

  /** Overslaan naar de stap "enter" (achtergrond al geleerd, enkel lichaam opnieuw). */
  bodyOnly(t: number): void {
    this.go('enter', t, 'Ga in de schaduw-ninja staan en sta even stil.');
    this.engine.calibrateBody();
  }

  /** De gebruiker tikt "Klaar" (toestel staat). */
  begin(t: number): void {
    this.go('countdown', t, 'Stap opzij, helemaal uit beeld!');
  }

  view(): FlowView {
    const titles: Record<CalibrationStep, string> = {
      aim: 'Toestel klaarzetten',
      countdown: 'Stap opzij!',
      learning: 'Ik kijk naar de lege kamer…',
      enter: 'Kom terug!',
      done: 'Klaar!',
    };
    return { step: this.step, title: titles[this.step], text: this.text, count: this.count, progress: this.progress };
  }

  update(r: VisionResult, t: number): void {
    const elapsed = t - this.stepStart;
    switch (this.step) {
      case 'aim':
      case 'done':
        return;
      case 'countdown': {
        const left = Math.ceil(COUNTDOWN_S - elapsed / 1000);
        this.count = Math.max(0, left);
        this.progress = Math.min(1, elapsed / (COUNTDOWN_S * 1000));
        if (elapsed >= COUNTDOWN_S * 1000) {
          this.engine.startLearning();
          this.go('learning', t, 'Blijf uit beeld en sta stil…', false);
        }
        return;
      }
      case 'learning':
        this.progress = r.learnProgress;
        if (r.learnUnstable && this.text !== 'Er beweegt nog iets… Blijf uit beeld.') this.text = 'Er beweegt nog iets… Blijf uit beeld.';
        if (r.phase === 'running') {
          this.engine.calibrateBody();
          this.go('enter', t, 'Kom terug en ga in de schaduw-ninja staan.');
        } else if (elapsed > LEARN_TIMEOUT_MS) {
          this.retries++;
          this.go('countdown', t, 'Er bleef iets bewegen. Nog een keer: stap helemaal uit beeld!');
        }
        return;
      case 'enter': {
        this.progress = r.bodyProgress;
        const hint = r.space === 'ok' ? (r.still ? 'Perfect, blijf zo staan!' : 'Sta even helemaal stil…') : SPACE_HINT_TEXT[r.space];
        if (hint !== this.text && elapsed > 600) {
          this.text = hint;
          // Niet elke kleine wissel uitspreken: enkel echte aanwijzingen.
          if (r.space !== 'ok') this.say(hint);
          this.stepStart = t - 601;
        }
        if (r.calibration) {
          this.result = r.calibration;
          this.go('done', t, 'Ik ken je nu. Op naar het Oog van de Kat!');
        }
        return;
      }
    }
  }

  /** Aantal keer dat het leren opnieuw moest (voor de meetgegevens). */
  get retryCount(): number {
    return this.retries;
  }

  private go(step: CalibrationStep, t: number, text: string, speak = true): void {
    this.step = step;
    this.stepStart = t;
    this.text = text;
    this.count = step === 'countdown' ? COUNTDOWN_S : null;
    this.progress = 0;
    if (speak) this.say(text);
  }
}
