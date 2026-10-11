import type { Frame } from './types';

/**
 * Achtergrondmodel (#5, #46): de app leert hoe de lege kamer eruitziet, en alles wat daarna
 * duidelijk anders is, is "voorgrond" (het kind). Klassieke beeldverwerking, geen model (#2).
 *
 * Per pixel bewaren we de gemiddelde kleur en hoeveel die tijdens het leren schommelde (ruis).
 * Een pixel is voorgrond als hij meer afwijkt dan de drempel, behalve als het verschil eruitziet als:
 * - **schaduw**: dezelfde kleurverhouding, maar donkerder (het kind werpt een schaduw op muur/vloer);
 * - **meer licht**: dezelfde kleurverhouding, iets lichter.
 * De camera regelt zelf de belichting bij als er iemand in beeld komt. Dat vangen we op met een
 * globale "gain" die we schatten op de pixels die vorige keer achtergrond waren.
 */

export interface BackgroundOptions {
  /** Minimale afwijking (som van |R|+|G|+|B|, schaal 0..765) om voorgrond te zijn. */
  minThreshold: number;
  /** Drempel = max(minThreshold, noiseFactor × ruis van die pixel). */
  noiseFactor: number;
  /** Schaduw: helderheid tussen deze factor en 1 tegenover de achtergrond. */
  shadowLow: number;
  /** Meer licht: helderheid tot deze factor tegenover de achtergrond. */
  highlightHigh: number;
  /** Toegelaten kleurafwijking bij schaduw/licht, als deel van de achtergrondhelderheid. */
  chromaTolerance: number;
}

export const DEFAULT_BACKGROUND_OPTIONS: BackgroundOptions = {
  minThreshold: 48,
  noiseFactor: 4,
  shadowLow: 0.55,
  highlightHigh: 1.3,
  chromaTolerance: 0.1,
};

export class BackgroundModel {
  width = 0;
  height = 0;
  ready = false;
  /** Geschatte belichtingsfactor van de camera tegenover het moment van leren. */
  gain = 1;
  private mean = new Float32Array(0);
  private noise = new Float32Array(0);
  private accRgb = new Float64Array(0);
  private accSum = new Float64Array(0);
  private accSq = new Float64Array(0);
  private samples = 0;
  /** Classificatie van het vorige beeld (voor de gain-schatting). */
  private prevFg = new Uint8Array(0);

  constructor(readonly options: BackgroundOptions = DEFAULT_BACKGROUND_OPTIONS) {}

  get sampleCount(): number {
    return this.samples;
  }

  /** Start (opnieuw) met leren. */
  beginLearning(width: number, height: number): void {
    const n = width * height;
    this.width = width;
    this.height = height;
    this.ready = false;
    this.gain = 1;
    this.samples = 0;
    this.accRgb = new Float64Array(n * 3);
    this.accSum = new Float64Array(n);
    this.accSq = new Float64Array(n);
    this.prevFg = new Uint8Array(n);
  }

  addSample(frame: Frame): void {
    if (frame.width !== this.width || frame.height !== this.height) this.beginLearning(frame.width, frame.height);
    const d = frame.data;
    const n = this.width * this.height;
    for (let i = 0, p = 0; i < n; i++, p += 4) {
      const r = d[p];
      const g = d[p + 1];
      const b = d[p + 2];
      this.accRgb[i * 3] += r;
      this.accRgb[i * 3 + 1] += g;
      this.accRgb[i * 3 + 2] += b;
      const s = r + g + b;
      this.accSum[i] += s;
      this.accSq[i] += s * s;
    }
    this.samples++;
  }

  /** Rondt het leren af. Geeft false als er geen beelden waren. */
  finishLearning(): boolean {
    if (this.samples === 0) return false;
    const n = this.width * this.height;
    this.mean = new Float32Array(n * 3);
    this.noise = new Float32Array(n);
    const k = this.samples;
    for (let i = 0; i < n; i++) {
      this.mean[i * 3] = this.accRgb[i * 3] / k;
      this.mean[i * 3 + 1] = this.accRgb[i * 3 + 1] / k;
      this.mean[i * 3 + 2] = this.accRgb[i * 3 + 2] / k;
      const m = this.accSum[i] / k;
      this.noise[i] = Math.sqrt(Math.max(0, this.accSq[i] / k - m * m));
    }
    this.accRgb = new Float64Array(0);
    this.accSum = new Float64Array(0);
    this.accSq = new Float64Array(0);
    this.prevFg.fill(0);
    this.gain = 1;
    this.ready = true;
    return true;
  }

  /**
   * Vult `out` met 1 (voorgrond) of 0 (achtergrond) en geeft het aantal voorgrondpixels terug.
   */
  classify(frame: Frame, out: Uint8Array): number {
    if (!this.ready || frame.width !== this.width || frame.height !== this.height) {
      out.fill(0);
      return 0;
    }
    const d = frame.data;
    const n = this.width * this.height;
    const mean = this.mean;
    this.updateGain(d, n);
    const gain = this.gain;
    const { minThreshold, noiseFactor, shadowLow, highlightHigh, chromaTolerance } = this.options;
    let count = 0;
    for (let i = 0, p = 0; i < n; i++, p += 4) {
      const r = d[p];
      const g = d[p + 1];
      const b = d[p + 2];
      const br = mean[i * 3] * gain;
      const bg = mean[i * 3 + 1] * gain;
      const bb = mean[i * 3 + 2] * gain;
      const dist = Math.abs(r - br) + Math.abs(g - bg) + Math.abs(b - bb);
      const thr = Math.max(minThreshold, noiseFactor * this.noise[i]);
      let fg = 0;
      if (dist > thr) {
        fg = 1;
        const bNorm2 = br * br + bg * bg + bb * bb;
        if (bNorm2 > 900) {
          // Helderheidsfactor: hoeveel keer de achtergrondkleur past in deze pixel.
          const alpha = (r * br + g * bg + b * bb) / bNorm2;
          if (alpha >= shadowLow && alpha <= highlightHigh) {
            const er = r - alpha * br;
            const eg = g - alpha * bg;
            const eb = b - alpha * bb;
            const chroma = Math.sqrt(er * er + eg * eg + eb * eb);
            if (chroma < chromaTolerance * Math.sqrt(bNorm2) + 6) fg = 0;
          }
        }
      }
      out[i] = fg;
      count += fg;
    }
    this.prevFg.set(out);
    return count;
  }

  /**
   * Past de achtergrond langzaam aan (bv. het daglicht verandert), nooit waar de speler staat.
   * - `keepOut` = 1: niet bijwerken (silhouet + marge).
   * - Gewone achtergrond: snelheid `rateBg`.
   * - Voorgrond die niet de speler is (een verschoven stoel): trager, `rateFg`. Zo verdwijnt die
   *   na een tijdje uit het masker.
   */
  adapt(frame: Frame, fg: Uint8Array, keepOut: Uint8Array, rateBg: number, rateFg: number): void {
    if (!this.ready) return;
    const d = frame.data;
    const n = this.width * this.height;
    const mean = this.mean;
    const inv = 1 / this.gain;
    for (let i = 0, p = 0; i < n; i++, p += 4) {
      if (keepOut[i]) continue;
      const rate = fg[i] ? rateFg : rateBg;
      // Ruwe pixel terugrekenen naar "belichting bij het leren".
      mean[i * 3] += rate * (d[p] * inv - mean[i * 3]);
      mean[i * 3 + 1] += rate * (d[p + 1] * inv - mean[i * 3 + 1]);
      mean[i * 3 + 2] += rate * (d[p + 2] * inv - mean[i * 3 + 2]);
    }
  }

  /** Gain schatten op elke 3e pixel die vorige keer achtergrond was. */
  private updateGain(d: Uint8ClampedArray, n: number): void {
    let sumI = 0;
    let sumB = 0;
    const mean = this.mean;
    for (let i = 0; i < n; i += 3) {
      if (this.prevFg[i]) continue;
      const p = i * 4;
      sumI += d[p] + d[p + 1] + d[p + 2];
      sumB += mean[i * 3] + mean[i * 3 + 1] + mean[i * 3 + 2];
    }
    if (sumB < 1000) return;
    const raw = Math.min(2, Math.max(0.5, sumI / sumB));
    this.gain += 0.35 * (raw - this.gain);
  }
}
