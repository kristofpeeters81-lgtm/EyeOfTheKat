import { learnColor, type ColorModel, type ColorResult } from '../vision/color';
import type { VisionResult } from '../vision/engine';
import type { Frame, Rect } from '../vision/types';

/**
 * Instelverloop van de kleurbandjes (#18, #33), zonder UI:
 *
 *   hold      kind komt dichterbij en houdt het voorwerp in het vak; de kleur moet ±0,5 s stabiel zijn
 *   check     terug in de schaduw-ninja, bandjes om de polsen: worden er 2 gevonden, en zit de kleur
 *             niet ook elders in beeld (kleren, kamer)?
 *   conflict  storende kleur: ander voorwerp kiezen
 *   done      klaar
 */

export type BandStep = 'hold' | 'check' | 'conflict' | 'done';

export interface BandEngine {
  enableMarkers(model: ColorModel, previewOnly: boolean): void;
  disableMarkers(): void;
}

export interface BandView {
  step: BandStep;
  text: string;
  /** Geleerde kleur als CSS-kleur, voor een stalen. */
  swatch: string | null;
  progress: number;
}

/** Het vak waarin het voorwerp gehouden wordt, als deel van het beeld. */
export const BAND_BOX = { x0: 0.42, y0: 0.36, x1: 0.58, y1: 0.6 };

export function boxFor(w: number, h: number): Rect {
  return { x0: BAND_BOX.x0 * w, y0: BAND_BOX.y0 * h, x1: BAND_BOX.x1 * w, y1: BAND_BOX.y1 * h };
}

const STABLE_FRAMES = 12;
const GOOD_FRAMES = 20;
const CONFLICT_FRAMES = 40;

function hueDist(a: number, b: number): number {
  const d = Math.abs(a - b) % 360;
  return d > 180 ? 360 - d : d;
}

export class BandFlow {
  private step: BandStep = 'hold';
  private text = 'Kom dichterbij en hou je gekleurde voorwerp in het vak.';
  private candidate: ColorModel | null = null;
  private stable = 0;
  private good = 0;
  private bad = 0;
  private missing = 0;
  private model: ColorModel | null = null;

  constructor(private readonly engine: BandEngine, private readonly say: (s: string) => void = () => undefined) {}

  restart(): void {
    this.engine.disableMarkers();
    this.step = 'hold';
    this.text = 'Kies een ander fel voorwerp en hou het in het vak.';
    this.candidate = null;
    this.model = null;
    this.stable = this.good = this.bad = this.missing = 0;
    this.say(this.text);
  }

  view(): BandView {
    const m = this.model ?? this.candidate;
    const progress = this.step === 'hold' ? this.stable / STABLE_FRAMES : this.step === 'check' ? this.good / GOOD_FRAMES : this.step === 'done' ? 1 : 0;
    return { step: this.step, text: this.text, swatch: m ? `hsl(${Math.round(m.hue)} 90% 55%)` : null, progress };
  }

  update(frame: Frame, r: VisionResult, color: ColorResult | null): void {
    if (this.step === 'hold') {
      const m = learnColor(frame, boxFor(frame.width, frame.height));
      if (typeof m === 'string') {
        this.stable = 0;
        this.candidate = null;
        if (m === 'mixed') this.text = 'Ik zie meerdere kleuren. Hou enkel je voorwerp in het vak.';
        return;
      }
      if (this.candidate && hueDist(this.candidate.hue, m.hue) < 12) this.stable++;
      else this.stable = 1;
      this.candidate = m;
      if (this.stable >= STABLE_FRAMES) {
        this.model = m;
        this.engine.enableMarkers(m, true);
        this.step = 'check';
        this.text = 'Kleur gevonden! Doe het om je polsen en ga terug in de schaduw-ninja staan.';
        this.say(this.text);
      }
      return;
    }
    if (this.step !== 'check' || !color) return;
    const markerArea = color.markers.reduce((a, m) => a + m.area, 0);
    const placed = r.presence === 'ok' && r.space === 'ok';
    if (placed && color.markers.length === 2 && color.stray < markerArea * 0.5) {
      this.good++;
      this.bad = 0;
      this.missing = 0;
      this.text = 'Ik zie je twee bandjes. Hou je handen even naast je.';
    } else if (placed && color.stray >= Math.max(30, markerArea)) {
      this.bad++;
      this.good = 0;
    } else if (placed) {
      this.missing++;
      this.good = Math.max(0, this.good - 1);
      if (this.missing === 90) {
        this.text = 'Ik zie niet allebei je bandjes. Hou je handen naast je lichaam, niet erachter.';
        this.say(this.text);
      }
    }
    if (this.bad >= CONFLICT_FRAMES) {
      this.step = 'conflict';
      this.text = 'Die kleur zit ook ergens anders in beeld (kleren, kamer). Kies een ander voorwerp.';
      this.say(this.text);
    } else if (this.good >= GOOD_FRAMES && this.model) {
      this.engine.enableMarkers(this.model, false);
      this.step = 'done';
      this.text = 'Bandjes-modus staat aan!';
      this.say(this.text);
    }
  }
}
