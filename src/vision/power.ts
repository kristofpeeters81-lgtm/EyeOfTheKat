/**
 * Ninja Power (#44): hoe hard het kind beweegt, 0..100, in 4 zones.
 *
 * Basis: het aantal pixels binnen het spelerkader dat veranderde sinds het vorige beeld, gedeeld
 * door de gekalibreerde silhouetoppervlakte (afstand en lengte tellen zo niet mee), en omgerekend
 * naar "per 1/30 s" (een trager toestel ziet per beeld meer verandering).
 * Afgevlakt over ~0,6 s, zodat het getal leesbaar blijft.
 */

/** Bewegingsenergie (per 1/30 s, als deel van de lichaamsoppervlakte) die 100 Power geeft. */
export const POWER_REFERENCE = 0.5;
/** Zonegrenzen: rust < 20 ≤ matig < 45 ≤ hoog < 70 ≤ piek. */
export const ZONE_LIMITS = [20, 45, 70] as const;
export const ZONE_NAMES = ['rust', 'matig', 'hoog', 'piek'] as const;
export type Zone = 0 | 1 | 2 | 3;

export function zoneOf(power: number): Zone {
  if (power >= ZONE_LIMITS[2]) return 3;
  if (power >= ZONE_LIMITS[1]) return 2;
  if (power >= ZONE_LIMITS[0]) return 1;
  return 0;
}

/** Ruwe energie van één beeld → Power 0..100 (nog niet afgevlakt). */
export function instantPower(changedPixels: number, bodyArea: number, dtMs: number): number {
  if (bodyArea <= 0) return 0;
  const dt = Math.min(100, Math.max(16, dtMs));
  const perFrame30 = (changedPixels / bodyArea) * (33.3 / dt);
  return Math.min(100, (100 * perFrame30) / POWER_REFERENCE);
}

/** Exponentiële afvlakking met een tijdconstante, onafhankelijk van de fps. */
export class Smoother {
  private v: number | null = null;

  constructor(private readonly tauMs: number) {}

  get value(): number {
    return this.v ?? 0;
  }

  reset(value: number | null = null): void {
    this.v = value;
  }

  update(x: number, dtMs: number): number {
    if (this.v === null) this.v = x;
    else this.v += (1 - Math.exp(-Math.max(0, dtMs) / this.tauMs)) * (x - this.v);
    return this.v;
  }
}
