/**
 * Debuggegevens (#39): de lus schrijft per beeld, het debugpaneel leest een paar keer per seconde.
 * Geen React-state per beeld (#27).
 */

export interface DebugMasks {
  /** Masker om te tonen (silhouet of beweging), 1 = aan. */
  mask: Uint8Array | null;
  /** Tweede masker (bv. kleurbandjes), getekend in een andere kleur. */
  mask2: Uint8Array | null;
  width: number;
  height: number;
}

export interface DebugValues {
  /** Vrije sleutel/waarde-paren voor de tabel in het paneel. */
  values: Record<string, string | number>;
  /** Ninja Power 0..100 (#44), of null als er nog niets gemeten wordt. */
  power: number | null;
  zone: number;
}

class DebugStore {
  masks: DebugMasks = { mask: null, mask2: null, width: 0, height: 0 };
  data: DebugValues = { values: {}, power: null, zone: 0 };

  setMasks(mask: Uint8Array | null, width: number, height: number, mask2: Uint8Array | null = null): void {
    this.masks = { mask, mask2, width, height };
  }

  set(values: Record<string, string | number>): void {
    this.data.values = values;
  }

  setPower(power: number | null, zone: number): void {
    this.data.power = power;
    this.data.zone = zone;
  }

  clear(): void {
    this.masks = { mask: null, mask2: null, width: 0, height: 0 };
    this.data = { values: {}, power: null, zone: 0 };
  }
}

export const debugStore = new DebugStore();
