/**
 * Leeftijdsschaling (#43) en sterren (#45). Voorlopige waarden, bij te stellen na de toesteltests.
 */

/** 0,6 op 6 jaar → 1,0 op 12 jaar (lineair, begrensd). */
export function ageFactor(age: number): number {
  const a = Math.min(12, Math.max(6, age));
  return 0.6 + ((a - 6) / 6) * 0.4;
}

/** Aantallen en vasthoudtijden: volledig geschaald, minstens 1. */
export function scaleCount(n: number, age: number): number {
  return Math.max(1, Math.round(n * ageFactor(age)));
}

export function scaleTime(ms: number, age: number): number {
  return ms * ageFactor(age);
}

/** Tempo (snelheid van obstakels): maar half geschaald, zodat het ook voor 6-jarigen spannend blijft. */
export function tempoFactor(age: number): number {
  return 1 - (1 - ageFactor(age)) / 2;
}

export interface StarInput {
  /** Etappes met afzonderlijke obstakels: aandeel echt gedetecteerd (0..1). */
  detectedFraction: number | null;
  /** Aandeel van de inspanningstijd in de zones hoog/piek (0..1). */
  highZoneFraction: number;
  /** Telt intensiteit mee voor ★★★? Niet bij vasthouden (Shadow Wall: stilstaan is de bedoeling). */
  needsIntensity?: boolean;
}

/**
 * ★ = uitgespeeld (altijd).
 * Obstakel-etappes: ★★ ≥ 60 % echt gedetecteerd; ★★★ ≥ 85 % en ≥ 1/3 van de tijd hoog/piek
 * (behalve bij vasthouden).
 * Sprint-etappes (geen obstakels): ★★ ≥ 40 % hoog/piek; ★★★ ≥ 65 %.
 */
export function computeStars(s: StarInput): 1 | 2 | 3 {
  if (s.detectedFraction === null) {
    if (s.highZoneFraction >= 0.65) return 3;
    if (s.highZoneFraction >= 0.4) return 2;
    return 1;
  }
  if (s.detectedFraction >= 0.85 && (s.needsIntensity === false || s.highZoneFraction >= 1 / 3)) return 3;
  if (s.detectedFraction >= 0.6) return 2;
  return 1;
}
