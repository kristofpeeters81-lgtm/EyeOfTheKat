import type { Frame } from '../types';

/**
 * Synthetische testbeelden (#32): een getekende kamer met een eenvoudige "persoon" uit
 * rechthoeken en cirkels. Zo kunnen we de motor testen zonder één echt beeld van een kind.
 * Alles is deterministisch (eigen toevalsgenerator met zaadje).
 */

export type Rgb = [number, number, number];

export class Rng {
  private s: number;
  constructor(seed: number) {
    this.s = seed;
  }
  next(): number {
    // mulberry32
    let t = (this.s += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }
}

export interface PersonSpec {
  /** Midden (x) van de persoon in pixels. */
  cx: number;
  /** Onderkant van de voeten als de persoon op de grond staat. */
  footY: number;
  /** Lengte rechtop in pixels. */
  height: number;
  /** 0 = rechtop, 1 = diep gehurkt (35 % kleiner). */
  squat?: number;
  /** Zoveel pixels boven de grond (sprong). */
  lift?: number;
  /** Armen: 'down' | 'out' (opzij) | 'up' (boven het hoofd). Per arm in te stellen. */
  leftArm?: 'down' | 'out' | 'up';
  rightArm?: 'down' | 'out' | 'up';
  /** Afstand tussen de voeten, als deel van de lengte (0,1 = normaal, 0,4 = spreidstand). */
  legSpread?: number;
  /** Knie heffen: zoveel pixels gaat de linker/rechter voet omhoog (lopen ter plaatse). */
  kneeLift?: [number, number];
  shirt?: Rgb;
  pants?: Rgb;
  /** Kleurbandje om beide polsen (#33), getekend als vierkantje op de hand. */
  bands?: Rgb;
  skin?: Rgb;
}

export interface SceneSpec {
  width: number;
  height: number;
  persons?: PersonSpec[];
  /** Schaduw op de vloer: rechthoek [x0,y0,x1,y1] die donkerder wordt (zelfde kleur). */
  shadow?: [number, number, number, number, number];
  /** Belichtingsfactor van de camera (1 = normaal). */
  gain?: number;
  /** Ruis per kanaal (±). */
  noise?: number;
  seed?: number;
}

function background(x: number, y: number, w: number, h: number): Rgb {
  const floorY = h * 0.78;
  if (y >= floorY) {
    // Houten vloer met planken.
    const plank = Math.floor((x + (Math.floor(y / 6) % 2) * 9) / 18) % 3;
    return [150 + plank * 8, 112 + plank * 6, 78 + plank * 4];
  }
  // Muur met zachte verloop, een kast links en een schilderij rechts.
  if (x > w * 0.04 && x < w * 0.2 && y > h * 0.25 && y < floorY) return [70, 90, 120];
  if (x > w * 0.75 && x < w * 0.9 && y > h * 0.15 && y < h * 0.35) return [190, 80, 60];
  const v = 205 - (y / h) * 30;
  return [v, v - 6, v - 18];
}

function inCircle(x: number, y: number, cx: number, cy: number, r: number): boolean {
  return (x - cx) ** 2 + (y - cy) ** 2 <= r * r;
}

function inRect(x: number, y: number, x0: number, y0: number, x1: number, y1: number): boolean {
  return x >= Math.min(x0, x1) && x < Math.max(x0, x1) && y >= Math.min(y0, y1) && y < Math.max(y0, y1);
}

/** Welke kleur heeft de persoon op (x, y), of null als daar geen persoon is. */
export function personColor(p: PersonSpec, x: number, y: number): Rgb | null {
  const H = p.height;
  const squat = p.squat ?? 0;
  const h = H * (1 - 0.35 * squat);
  const foot = p.footY - (p.lift ?? 0);
  const top = foot - h;
  const skin = p.skin ?? [224, 172, 140];
  const shirt = p.shirt ?? [40, 120, 200];
  const pants = p.pants ?? [40, 40, 60];
  const cx = p.cx;
  // Verticale verhoudingen schalen mee met het hurken (benen worden korter).
  const headR = H * 0.07;
  const headCy = top + headR;
  const shoulderY = top + H * 0.16;
  const hipY = top + H * 0.5 - (H - h) * 0.15;
  const torsoW = H * 0.22;
  if (inCircle(x, y, cx, headCy, headR)) return skin;
  if (inRect(x, y, cx - torsoW / 2, shoulderY - H * 0.02, cx + torsoW / 2, hipY)) return shirt;
  // Benen
  const spread = (p.legSpread ?? 0.1) * H;
  const legW = H * 0.08;
  for (const side of [-1, 1]) {
    const hipX = cx + side * (torsoW / 2 - legW / 2);
    const footX = cx + side * spread;
    const legFoot = foot - (p.kneeLift?.[side < 0 ? 0 : 1] ?? 0);
    if (y >= hipY && y < legFoot) {
      const f = (y - hipY) / Math.max(1, foot - hipY);
      const lx = hipX + (footX - hipX) * f;
      if (Math.abs(x - lx) <= legW / 2) return pants;
    }
  }
  // Armen (en kleurbandjes op de handen)
  const armW = H * 0.06;
  if (p.bands) {
    for (const side of [-1, 1] as const) {
      const hand = handPosition(p, side);
      if (Math.abs(x - hand.x) <= armW * 0.9 && Math.abs(y - hand.y) <= armW * 0.9) return p.bands;
    }
  }
  for (const side of [-1, 1] as const) {
    const mode = side < 0 ? (p.leftArm ?? 'down') : (p.rightArm ?? 'down');
    const sx = cx + side * (torsoW / 2 + armW / 2);
    if (mode === 'down' && inRect(x, y, sx - armW / 2, shoulderY, sx + armW / 2, shoulderY + H * 0.34)) return shirt;
    if (mode === 'out' && inRect(x, y, sx, shoulderY, sx + side * H * 0.4, shoulderY + armW)) return shirt;
    if (mode === 'up' && inRect(x, y, sx - armW / 2, shoulderY - H * 0.36, sx + armW / 2, shoulderY + armW)) return shirt;
  }
  return null;
}

/** Positie van de hand (einde van de arm) voor een kant (-1 = links op het scherm). */
export function handPosition(p: PersonSpec, side: -1 | 1): { x: number; y: number } {
  const H = p.height;
  const h = H * (1 - 0.35 * (p.squat ?? 0));
  const top = p.footY - (p.lift ?? 0) - h;
  const shoulderY = top + H * 0.16;
  const armW = H * 0.06;
  const sx = p.cx + side * (H * 0.11 + armW / 2);
  const mode = side < 0 ? (p.leftArm ?? 'down') : (p.rightArm ?? 'down');
  if (mode === 'out') return { x: sx + side * H * 0.37, y: shoulderY + armW / 2 };
  if (mode === 'up') return { x: sx, y: shoulderY - H * 0.33 };
  return { x: sx, y: shoulderY + H * 0.31 };
}

export function renderScene(spec: SceneSpec): Frame {
  const { width: w, height: h } = spec;
  const rng = new Rng(spec.seed ?? 1);
  const noise = spec.noise ?? 4;
  const gain = spec.gain ?? 1;
  const data = new Uint8ClampedArray(w * h * 4);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      let c: Rgb = background(x, y, w, h);
      if (spec.shadow) {
        const [x0, y0, x1, y1, f] = spec.shadow;
        if (inRect(x, y, x0, y0, x1, y1)) c = [c[0] * f, c[1] * f, c[2] * f];
      }
      for (const p of spec.persons ?? []) {
        const pc = personColor(p, x, y);
        if (pc) c = pc;
      }
      const o = (y * w + x) * 4;
      for (let k = 0; k < 3; k++) data[o + k] = c[k] * gain + (rng.next() * 2 - 1) * noise;
      data[o + 3] = 255;
    }
  }
  return { data, width: w, height: h };
}

/** Een standaardpersoon in het midden van een beeld van 160×120. */
export function standing(overrides: Partial<PersonSpec> = {}): PersonSpec {
  return { cx: 80, footY: 108, height: 78, ...overrides };
}
