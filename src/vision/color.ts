import { labelComponents } from './components';
import { Morphology } from './morph';
import type { Frame, Rect } from './types';

/**
 * Kleurbandjes (#18, #33, #40): een fel gekleurd voorwerp om elke pols, gevolgd op kleur.
 * Geen model: de app leert bij de start welke tint (en hoe fel) het voorwerp is, en zoekt daarna
 * in elk beeld de pixels met die kleur. De twee grootste vlekken zijn de handen.
 *
 * Werkt op het grotere analysebeeld (320 px), omdat een sok om een pols op 2,5 m klein is.
 */

export interface ColorModel {
  /** Tint in graden (0..360). */
  hue: number;
  /** Toegelaten afwijking van de tint (graden). */
  hueTolerance: number;
  satMin: number;
  valMin: number;
}

export interface Marker {
  /** Middelpunt in pixels van het beeld waarop gezocht werd. */
  x: number;
  y: number;
  area: number;
}

export type ColorLearnError = 'not-colorful' | 'mixed';

/** RGB (0..255) → tint (0..360), verzadiging en helderheid (0..1). */
export function rgbToHsv(r: number, g: number, b: number): [number, number, number] {
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const d = max - min;
  const v = max / 255;
  const s = max === 0 ? 0 : d / max;
  if (d === 0) return [0, s, v];
  let h: number;
  if (max === r) h = ((g - b) / d) % 6;
  else if (max === g) h = (b - r) / d + 2;
  else h = (r - g) / d + 4;
  h *= 60;
  if (h < 0) h += 360;
  return [h, s, v];
}

function hueDistance(a: number, b: number): number {
  const d = Math.abs(a - b) % 360;
  return d > 180 ? 360 - d : d;
}

function percentile(values: number[], p: number): number {
  const v = [...values].sort((a, b) => a - b);
  return v[Math.min(v.length - 1, Math.max(0, Math.floor(p * v.length)))];
}

/**
 * Leert de kleur uit een vak in het beeld (waar het kind het voorwerp voorhoudt).
 * Neemt de meest voorkomende felle tint (histogram met 36 vakjes van 10°).
 */
export function learnColor(frame: Frame, box: Rect): ColorModel | ColorLearnError {
  const hues: number[] = [];
  const sats: number[] = [];
  const vals: number[] = [];
  let total = 0;
  const d = frame.data;
  for (let y = Math.max(0, Math.floor(box.y0)); y < Math.min(frame.height, Math.ceil(box.y1)); y++) {
    for (let x = Math.max(0, Math.floor(box.x0)); x < Math.min(frame.width, Math.ceil(box.x1)); x++) {
      const p = (y * frame.width + x) * 4;
      const [h, s, v] = rgbToHsv(d[p], d[p + 1], d[p + 2]);
      total++;
      if (s >= 0.35 && v >= 0.25) {
        hues.push(h);
        sats.push(s);
        vals.push(v);
      }
    }
  }
  if (total === 0 || hues.length < total * 0.25) return 'not-colorful';
  const bins = new Array<number>(36).fill(0);
  for (const h of hues) bins[Math.floor(h / 10) % 36]++;
  let best = 0;
  for (let i = 1; i < 36; i++) if (bins[i] > bins[best]) best = i;
  // Het piekvakje + de buren moeten het grootste deel van de felle pixels bevatten.
  const near = bins[best] + bins[(best + 35) % 36] + bins[(best + 1) % 36];
  if (near < hues.length * 0.5) return 'mixed';
  // Gemiddelde tint (circulair) van de pixels rond de piek.
  let sx = 0;
  let sy = 0;
  const center = best * 10 + 5;
  const keepS: number[] = [];
  const keepV: number[] = [];
  hues.forEach((h, i) => {
    if (hueDistance(h, center) <= 18) {
      sx += Math.cos((h * Math.PI) / 180);
      sy += Math.sin((h * Math.PI) / 180);
      keepS.push(sats[i]);
      keepV.push(vals[i]);
    }
  });
  let hue = (Math.atan2(sy, sx) * 180) / Math.PI;
  if (hue < 0) hue += 360;
  return {
    hue,
    hueTolerance: 16,
    satMin: Math.max(0.3, percentile(keepS, 0.15) * 0.75),
    valMin: Math.max(0.18, percentile(keepV, 0.15) * 0.6),
  };
}

export interface ColorResult {
  mask: Uint8Array;
  /** Hoogstens 2 markers, grootste eerst. */
  markers: Marker[];
  /** Aantal kleurpixels dat niet in de 2 markers zit (storende kleur in de kamer/kleren). */
  stray: number;
  matched: number;
}

export class ColorTracker {
  private mask = new Uint8Array(0);
  private labels = new Int32Array(0);
  private stack = new Int32Array(0);
  private readonly morph = new Morphology();
  /**
   * Grootste vlek die nog een polsbandje kan zijn (pixels). Groter = storende kleur (een trui in
   * dezelfde kleur). Zet de runtime op basis van de lichaamslengte, zie `maxMarkerArea`.
   */
  maxArea = Infinity;

  constructor(
    public model: ColorModel,
    /** Kleinste vlek (pixels op het grote beeld) die als marker telt. */
    readonly minArea = 6,
  ) {}

  find(frame: Frame): ColorResult {
    const w = frame.width;
    const h = frame.height;
    const n = w * h;
    if (this.mask.length !== n) {
      this.mask = new Uint8Array(n);
      this.labels = new Int32Array(n);
      this.stack = new Int32Array(n);
    }
    const { hue, hueTolerance, satMin, valMin } = this.model;
    const d = frame.data;
    const mask = this.mask;
    let matched = 0;
    for (let i = 0, p = 0; i < n; i++, p += 4) {
      const r = d[p];
      const g = d[p + 1];
      const b = d[p + 2];
      const max = r > g ? (r > b ? r : b) : g > b ? g : b;
      const min = r < g ? (r < b ? r : b) : g < b ? g : b;
      // Snelle uitsluiting: te donker of te grijs.
      if (max < valMin * 255 || max - min < satMin * max) {
        mask[i] = 0;
        continue;
      }
      const [hh] = rgbToHsv(r, g, b);
      const m = hueDistance(hh, hue) <= hueTolerance ? 1 : 0;
      mask[i] = m;
      matched += m;
    }
    this.morph.open(mask, w, h);
    const blobs = labelComponents(mask, w, h, this.labels, this.stack).filter((b) => b.area >= this.minArea);
    const markers = blobs
      .filter((b) => b.area <= this.maxArea)
      .slice(0, 2)
      .map((b) => ({ x: b.cx + 0.5, y: b.cy + 0.5, area: b.area }));
    const inMarkers = markers.reduce((a, m) => a + m.area, 0);
    const blobTotal = blobs.reduce((a, b) => a + b.area, 0);
    return { mask, markers, stray: blobTotal - inMarkers, matched };
  }
}

/** Max. oppervlakte van een polsbandje: een vierkant van 18 % van de lichaamslengte (in pixels van het grote beeld). */
export function maxMarkerArea(bodyHeightPx: number): number {
  const side = 0.18 * bodyHeightPx;
  return Math.max(36, side * side);
}

/**
 * Houdt links/rechts bij van frame tot frame (#33: zelfde kleur op beide polsen): eerst op de
 * dichtstbijzijnde vorige positie, en anders op positie tegenover het midden van het lichaam.
 */
export class MarkerPairing {
  private prev: { left: Marker | null; right: Marker | null } = { left: null, right: null };

  reset(): void {
    this.prev = { left: null, right: null };
  }

  pair(markers: Marker[], bodyCx: number): { left: Marker | null; right: Marker | null } {
    let left: Marker | null = null;
    let right: Marker | null = null;
    if (markers.length === 2) {
      const [a, b] = markers;
      const p = this.prev;
      if (p.left && p.right) {
        const keep = dist(a, p.left) + dist(b, p.right);
        const swap = dist(a, p.right) + dist(b, p.left);
        [left, right] = keep <= swap ? [a, b] : [b, a];
      } else {
        [left, right] = a.x <= b.x ? [a, b] : [b, a];
      }
    } else if (markers.length === 1) {
      const m = markers[0];
      const p = this.prev;
      if (p.left && p.right) {
        if (dist(m, p.left) <= dist(m, p.right)) left = m;
        else right = m;
      } else if (m.x < bodyCx) left = m;
      else right = m;
    }
    this.prev = { left: left ?? this.prev.left, right: right ?? this.prev.right };
    return { left, right };
  }
}

function dist(a: Marker, b: Marker): number {
  return Math.hypot(a.x - b.x, a.y - b.y);
}
