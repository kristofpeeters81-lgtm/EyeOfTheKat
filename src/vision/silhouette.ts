import { labelComponents } from './components';
import type { BodyCalibration, BodyPose, MaskBlob, Rect, Silhouette } from './types';

/**
 * Van voorgrondmasker naar silhouet (#5, #46).
 *
 * 1. Vlekken zoeken; de grootste is de speler.
 * 2. Vlekken die horizontaal dicht bij de speler liggen, horen er ook bij (een hand of hoofd dat
 *    door een gat in het masker los kwam te liggen). Zo blijft "bovenkant" echt het hoofd.
 * 3. Grote vlekken die ver weg liggen, zijn "anderen": mogelijk een tweede persoon (#26).
 * 4. Kenmerken berekenen op de pixels van de speler.
 */

export interface SilhouetteOptions {
  /** Minimale oppervlakte (pixels) om als speler te tellen. */
  minArea: number;
  /** Max. horizontale afstand (in hoogtes van de grootste vlek) om een vlek bij de speler te rekenen. */
  mergeGap: number;
  /** Een rij telt mee voor boven-/onderkant vanaf dit aantal pixels. */
  minRowPixels: number;
}

export const DEFAULT_SILHOUETTE_OPTIONS: SilhouetteOptions = { minArea: 60, mergeGap: 0.12, minRowPixels: 2 };

export interface SilhouetteResult {
  silhouette: Silhouette | null;
  /** 1 = pixel hoort bij de speler. */
  personMask: Uint8Array;
  /** Grote vlekken die niet bij de speler horen. */
  others: MaskBlob[];
}

function gapX(a: Rect, b: Rect): number {
  if (b.x0 >= a.x1) return b.x0 - a.x1;
  if (a.x0 >= b.x1) return a.x0 - b.x1;
  return 0;
}

export class SilhouetteExtractor {
  private labels = new Int32Array(0);
  private stack = new Int32Array(0);
  private person = new Uint8Array(0);
  private rowCount = new Int32Array(0);

  constructor(readonly options: SilhouetteOptions = DEFAULT_SILHOUETTE_OPTIONS) {}

  extract(fg: Uint8Array, w: number, h: number): SilhouetteResult {
    const n = w * h;
    if (this.labels.length !== n) {
      this.labels = new Int32Array(n);
      this.stack = new Int32Array(n);
      this.person = new Uint8Array(n);
    }
    if (this.rowCount.length !== h) this.rowCount = new Int32Array(h);
    const person = this.person;
    person.fill(0);
    const blobs = labelComponents(fg, w, h, this.labels, this.stack);
    const main = blobs[0];
    if (!main || main.area < this.options.minArea) return { silhouette: null, personMask: person, others: [] };

    // Samenvoegen: herhalen tot er niets meer bijkomt (een vlek kan via een andere dichtbij komen).
    const box: Rect = { x0: main.x0, y0: main.y0, x1: main.x1, y1: main.y1 };
    const maxGap = Math.max(2, this.options.mergeGap * (main.y1 - main.y0));
    const minPart = Math.max(4, main.area * 0.004);
    const merged = new Set<number>([main.label]);
    let grew = true;
    while (grew) {
      grew = false;
      for (const b of blobs) {
        if (merged.has(b.label) || b.area < minPart) continue;
        if (gapX(box, b) <= maxGap && b.y1 >= box.y0 - maxGap * 3 && b.y0 <= box.y1 + maxGap) {
          merged.add(b.label);
          box.x0 = Math.min(box.x0, b.x0);
          box.y0 = Math.min(box.y0, b.y0);
          box.x1 = Math.max(box.x1, b.x1);
          box.y1 = Math.max(box.y1, b.y1);
          grew = true;
        }
      }
    }
    const others = blobs.filter((b) => !merged.has(b.label) && b.area >= main.area * 0.15);

    // Kenmerken op de spelerpixels.
    const labels = this.labels;
    const rows = this.rowCount;
    rows.fill(0);
    let area = 0;
    let sx = 0;
    let sy = 0;
    let x0 = w;
    let x1 = 0;
    for (let y = box.y0; y < box.y1; y++) {
      const row = y * w;
      for (let x = box.x0; x < box.x1; x++) {
        const l = labels[row + x];
        if (l && merged.has(l)) {
          person[row + x] = 1;
          area++;
          sx += x;
          sy += y;
          rows[y]++;
          if (x < x0) x0 = x;
          if (x >= x1) x1 = x + 1;
        }
      }
    }
    const minRow = this.options.minRowPixels;
    let top = box.y0;
    while (top < box.y1 - 1 && rows[top] < minRow) top++;
    let bottom = box.y1 - 1;
    while (bottom > top && rows[bottom] < minRow) bottom--;
    const height = bottom - top + 1;

    // Zwaartepunt van het onderste 40 %: benen en heupen.
    const lowStart = bottom - Math.floor(height * 0.4);
    let lsx = 0;
    let ln = 0;
    for (let y = Math.max(lowStart, 0); y <= bottom; y++) {
      const row = y * w;
      for (let x = x0; x < x1; x++) {
        if (person[row + x]) {
          lsx += x;
          ln++;
        }
      }
    }

    const silhouette: Silhouette = {
      x0,
      y0: top,
      x1,
      y1: bottom + 1,
      area,
      cx: sx / area,
      cy: sy / area,
      cxLow: ln ? lsx / ln : sx / area,
      top,
      bottom,
      width: x1 - x0,
      height,
      touches: { left: x0 <= 0, right: x1 >= w, top: top <= 0, bottom: bottom >= h - 1 },
    };
    return { silhouette, personMask: person, others };
  }
}

/** Het silhouet tegenover de kalibratie (zie BodyPose). */
export function toPose(s: Silhouette, c: BodyCalibration): BodyPose {
  return {
    heightRatio: s.height / c.height,
    widthRatio: s.width / c.width,
    topRise: (c.top - s.top) / c.height,
    feetRise: (c.bottom - s.bottom) / c.height,
    shift: (s.cxLow - c.cxLow) / c.height,
  };
}

/** Deel (0..1) van een rechthoek dat door de speler bedekt is. */
export function coverage(person: Uint8Array, w: number, h: number, r: Rect): number {
  const x0 = Math.max(0, Math.floor(r.x0));
  const y0 = Math.max(0, Math.floor(r.y0));
  const x1 = Math.min(w, Math.ceil(r.x1));
  const y1 = Math.min(h, Math.ceil(r.y1));
  const total = (x1 - x0) * (y1 - y0);
  if (total <= 0) return 0;
  let c = 0;
  for (let y = y0; y < y1; y++) {
    const row = y * w;
    for (let x = x0; x < x1; x++) c += person[row + x];
  }
  return c / total;
}
