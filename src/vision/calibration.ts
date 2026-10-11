import type { BodyCalibration, Silhouette } from './types';

/**
 * Ruimte-check en lichaamskalibratie (#26, #30).
 *
 * Ruimte-check: staat het kind volledig in beeld, met genoeg ruimte boven het hoofd (springen)
 * en opzij (Stone Hop)? Zo niet: één duidelijke aanwijzing tegelijk.
 * Kalibratie: zodra de ruimte-check in orde is en het kind even stilstaat, worden de lichaamsmaten
 * vastgelegd (mediaan over een reeks beelden). Daartegen worden alle bewegingen gemeten.
 */

export type SpaceHint = 'ok' | 'nobody' | 'too-close' | 'feet' | 'head' | 'too-far' | 'go-left' | 'go-right';

export interface SpaceLimits {
  /** Max. lichaamshoogte als deel van de beeldhoogte (ruimte om te springen). */
  maxHeight: number;
  minHeight: number;
  /** Min. vrije ruimte boven het hoofd, als deel van de beeldhoogte. */
  headroom: number;
  /** Max. afwijking van het midden, als deel van de beeldbreedte. */
  maxOffCenter: number;
}

export const SPACE_LIMITS: SpaceLimits = { maxHeight: 0.8, minHeight: 0.35, headroom: 0.08, maxOffCenter: 0.14 };

export function spaceCheck(s: Silhouette | null, w: number, h: number, limits: SpaceLimits = SPACE_LIMITS): SpaceHint {
  if (!s) return 'nobody';
  if (s.touches.bottom) return 'feet';
  if (s.height > limits.maxHeight * h) return 'too-close';
  if (s.top < limits.headroom * h) return 'head';
  if (s.height < limits.minHeight * h) return 'too-far';
  const off = (s.cxLow - w / 2) / w;
  // Gespiegeld beeld: staat het kind rechts op het scherm, dan moet het naar links (#11).
  if (off > limits.maxOffCenter) return 'go-left';
  if (off < -limits.maxOffCenter) return 'go-right';
  return 'ok';
}

/** Wat de Geest zegt bij elke aanwijzing (kort: 6-jarigen, #2 van de stijl). */
export const SPACE_HINT_TEXT: Record<SpaceHint, string> = {
  ok: 'Perfect, blijf zo staan!',
  nobody: 'Ik zie je niet. Kom voor de camera staan.',
  'too-close': 'Te dichtbij! Stap een paar stappen achteruit.',
  feet: 'Ik zie je voeten niet. Stap achteruit.',
  head: 'Je hoofd is te hoog. Stap achteruit.',
  'too-far': 'Te ver weg! Kom een stapje dichter.',
  'go-left': 'Schuif een stukje naar links.',
  'go-right': 'Schuif een stukje naar rechts.',
};

function median(values: number[]): number {
  const v = [...values].sort((a, b) => a - b);
  const m = v.length >> 1;
  return v.length % 2 ? v[m] : (v[m - 1] + v[m]) / 2;
}

/** Verzamelt beelden van een stilstaand, goed geplaatst kind en maakt er de kalibratie van. */
export class BodyCalibrator {
  private samples: Silhouette[] = [];

  constructor(readonly needed = 20) {}

  reset(): void {
    this.samples = [];
  }

  get progress(): number {
    return this.samples.length / this.needed;
  }

  /** Geeft de kalibratie zodra er genoeg goede beelden zijn, anders null. */
  add(s: Silhouette | null, ok: boolean, still: boolean, w: number, h: number): BodyCalibration | null {
    if (!s || !ok || !still) {
      // Even bewegen mag: enkel bij een echte fout opnieuw beginnen.
      if (!ok) this.samples = [];
      return null;
    }
    this.samples.push(s);
    if (this.samples.length < this.needed) return null;
    const pick = (f: (x: Silhouette) => number) => median(this.samples.map(f));
    const top = pick((x) => x.top);
    const bottom = pick((x) => x.bottom);
    const result: BodyCalibration = {
      top,
      bottom,
      height: bottom - top + 1,
      width: pick((x) => x.width),
      cx: pick((x) => x.cx),
      cxLow: pick((x) => x.cxLow),
      area: pick((x) => x.area),
      frameWidth: w,
      frameHeight: h,
    };
    this.samples = [];
    return result;
  }
}
