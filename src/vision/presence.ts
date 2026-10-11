import type { MaskBlob, BodyCalibration, Silhouette } from './types';

/**
 * Is het kind (alleen) in beeld? (#7, #26) Met wat vertraging, zodat één slecht beeld het spel
 * niet meteen pauzeert.
 *
 * - `missing`: geen silhouet, of veel kleiner dan bij de kalibratie (uit beeld gelopen).
 * - `two`: er staat een tweede grote vlek naast de speler (tweede persoon). Ook een
 *   voorbijlopende ouder pauzeert het spel: bewuste keuze (#26).
 * - `scene`: meer dan de helft van het beeld is "anders" (camera verschoven, licht aan/uit):
 *   opnieuw kalibreren.
 */

export type Presence = 'ok' | 'missing' | 'two' | 'scene';

export interface PresenceTimings {
  /** Zo lang moet een probleem duren voor het telt (ms). */
  enterMs: number;
  /** Zo lang moet alles weer in orde zijn (ms). */
  exitMs: number;
}

export class PresenceMonitor {
  private state: Presence = 'ok';
  private candidate: Presence = 'ok';
  private since = 0;

  constructor(private readonly timings: PresenceTimings = { enterMs: 450, exitMs: 350 }) {}

  get current(): Presence {
    return this.state;
  }

  reset(): void {
    this.state = 'ok';
    this.candidate = 'ok';
    this.since = 0;
  }

  /** Wat dit ene beeld zegt, zonder vertraging. */
  static instant(s: Silhouette | null, others: MaskBlob[], fgFraction: number, calib: BodyCalibration): Presence {
    if (fgFraction > 0.55) return 'scene';
    if (!s || s.area < calib.area * 0.3 || s.height < calib.height * 0.35) return 'missing';
    if (others.some((o) => o.area >= calib.area * 0.35 && o.y1 - o.y0 >= calib.height * 0.4)) return 'two';
    return 'ok';
  }

  update(instant: Presence, t: number): Presence {
    if (instant !== this.candidate) {
      this.candidate = instant;
      this.since = t;
    }
    const wait = instant === 'ok' ? this.timings.exitMs : this.timings.enterMs;
    if (this.candidate !== this.state && t - this.since >= wait) this.state = this.candidate;
    return this.state;
  }
}
