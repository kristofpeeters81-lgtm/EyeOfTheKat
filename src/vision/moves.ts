import type { VisionResult } from './engine';
import { countInRect } from './motion';
import { coverage } from './silhouette';
import type { BodyCalibration, BodyPose, Rect } from './types';

/**
 * Bewegingsdetectoren (#15, #16): van houding (BodyPose) en maskers naar bewegingen die een game
 * begrijpt. Elke detector is een kleine toestandsmachine met hysterese (een aparte drempel om
 * "in" en "uit" een toestand te gaan), zodat ruis niet dubbel telt. Geen model: enkel vergelijken
 * met de gekalibreerde lichaamsmaten (#2).
 *
 * Alle drempels staan in MOVE_THRESHOLDS en zijn in lichaamslengtes (dus voor elk kind gelijk).
 */

export const MOVE_THRESHOLDS = {
  /** Sprong: voeten én bovenkant gaan zoveel omhoog. */
  jumpFeet: 0.06,
  jumpTop: 0.03,
  /** Geland als de voeten weer onder deze hoogte zijn. */
  landFeet: 0.025,
  /** Hurken: lichaam korter dan dit, of zwaartepunt zoveel lager. */
  squatHeight: 0.8,
  squatCyDrop: 0.1,
  /** Weer rechtop. */
  standHeight: 0.9,
  standCyDrop: 0.04,
  /** Zijstap: benen zoveel verschoven (naar de zijbaan), terug in het midden onder `laneBack`. */
  laneOut: 0.18,
  laneBack: 0.1,
  /** Slag/reiken: zoveel van het doelvlak moet bedekt zijn. */
  zoneHit: 0.08,
  zoneRelease: 0.03,
  /** Kikkersprong: zoveel tijd tussen het laagste punt van de hurk en de sprong. */
  frogWindowMs: 1300,
  /** Een houding vasthouden mag even wankelen. */
  holdGraceMs: 300,
  /** Een houding telt enkel als het kind redelijk stil staat (Ninja Power). */
  holdMaxPower: 45,
  /** Lopen: verschil links/rechts in beenbeweging om een pas te tellen. */
  stepBalance: 0.25,
} as const;

export type Side = 'left' | 'right';
export type StrikeZone = 'left' | 'right' | 'up';
export type Lane = -1 | 0 | 1;
export type HoldPose = 'squat' | 'star' | 'arms-up';

export type MoveEvent =
  | { type: 'jump'; t: number }
  | { type: 'land'; t: number; airMs: number }
  | { type: 'squat-down'; t: number }
  | { type: 'squat'; t: number; depth: number }
  | { type: 'lane'; t: number; lane: Lane }
  | { type: 'strike'; t: number; zone: StrikeZone }
  | { type: 'reach'; t: number; side: Side }
  | { type: 'frogleap'; t: number }
  | { type: 'step'; t: number; side: Side };

export interface MoveState {
  airborne: boolean;
  low: boolean;
  lane: Lane;
  /** Welke slagzones nu geraakt worden. */
  zones: Record<StrikeZone, boolean>;
  /** Arm boven het hoofd, per kant. */
  armUp: Record<Side, boolean>;
  /** Welke houdingen nu kloppen (zonder stilstaan-voorwaarde). */
  poses: Record<HoldPose, boolean>;
  /** Hoe lang (ms) de huidige houding al vastgehouden wordt, per houding. */
  holdMs: Record<HoldPose, number>;
}

/** Doelvlakken voor slagen (Shadow Strike) en reiken (Wall Climb), relatief tot het lichaam. */
export function strikeRect(zone: StrikeZone, cxNow: number, c: BodyCalibration): Rect {
  const H = c.height;
  if (zone === 'up') return { x0: cxNow - 0.2 * H, y0: c.top - 0.26 * H, x1: cxNow + 0.2 * H, y1: c.top - 0.05 * H };
  const sign = zone === 'left' ? -1 : 1;
  const a = cxNow + sign * 0.26 * H;
  const b = cxNow + sign * 0.7 * H;
  return { x0: Math.min(a, b), y0: c.top + 0.08 * H, x1: Math.max(a, b), y1: c.top + 0.45 * H };
}

export function reachRect(side: Side, cxNow: number, c: BodyCalibration): Rect {
  const H = c.height;
  const sign = side === 'left' ? -1 : 1;
  const a = cxNow + sign * 0.08 * H;
  const b = cxNow + sign * 0.34 * H;
  return { x0: Math.min(a, b), y0: c.top - 0.36 * H, x1: Math.max(a, b), y1: c.top - 0.04 * H };
}

export function poseMatches(pose: BodyPose): Record<HoldPose, boolean> {
  const grounded = pose.feetRise < 0.05;
  return {
    squat: grounded && (pose.heightRatio < 0.85 || pose.cyDrop > 0.08) && pose.heightRatio > 0.45,
    star: grounded && pose.widthRatio >= 1.6,
    'arms-up': grounded && pose.topRise >= 0.12 && pose.widthRatio < 1.6,
  };
}

const POSES: HoldPose[] = ['squat', 'star', 'arms-up'];

export class MoveTracker {
  private airborne = false;
  private takeoffT = 0;
  private lastJumpT = -Infinity;
  private low = false;
  private lowestT = -Infinity;
  private minHeight = 1;
  private lane: Lane = 0;
  private zones: Record<StrikeZone, boolean> = { left: false, right: false, up: false };
  private armUp: Record<Side, boolean> = { left: false, right: false };
  private holdMs: Record<HoldPose, number> = { squat: 0, star: 0, 'arms-up': 0 };
  private holdLost: Record<HoldPose, number> = { squat: 0, star: 0, 'arms-up': 0 };
  private poses: Record<HoldPose, boolean> = { squat: false, star: false, 'arms-up': false };
  private stepSide: Side | null = null;
  private legL = 0;
  private legR = 0;

  reset(): void {
    this.airborne = false;
    this.low = false;
    this.lane = 0;
    this.zones = { left: false, right: false, up: false };
    this.armUp = { left: false, right: false };
    this.holdMs = { squat: 0, star: 0, 'arms-up': 0 };
    this.holdLost = { squat: 0, star: 0, 'arms-up': 0 };
    this.stepSide = null;
    this.lastJumpT = -Infinity;
    this.lowestT = -Infinity;
  }

  get state(): MoveState {
    return {
      airborne: this.airborne,
      low: this.low,
      lane: this.lane,
      zones: { ...this.zones },
      armUp: { ...this.armUp },
      poses: { ...this.poses },
      holdMs: { ...this.holdMs },
    };
  }

  update(r: VisionResult): MoveEvent[] {
    const events: MoveEvent[] = [];
    const c = r.calibration;
    const s = r.silhouette;
    const pose = r.pose;
    if (!c || !s || !pose || r.presence !== 'ok') {
      // Niet in beeld: niets tellen, houdingen lopen niet verder.
      return events;
    }
    const t = r.t;
    const T = MOVE_THRESHOLDS;

    // Sprong: voeten en bovenkant omhoog, en niet gehurkt.
    if (!this.airborne) {
      if (pose.feetRise > T.jumpFeet && pose.topRise > T.jumpTop && pose.heightRatio > 0.75 && t - this.lastJumpT > 250) {
        this.airborne = true;
        this.takeoffT = t;
        this.lastJumpT = t;
        events.push({ type: 'jump', t });
        // Kikkersprong: kort na het laagste punt van een hurk.
        if (t - this.lowestT <= T.frogWindowMs) {
          events.push({ type: 'frogleap', t });
          this.lowestT = -Infinity;
        }
      }
    } else if (pose.feetRise < T.landFeet) {
      this.airborne = false;
      events.push({ type: 'land', t, airMs: t - this.takeoffT });
    }

    // Hurken.
    const isLow = pose.feetRise < 0.05 && (pose.heightRatio < T.squatHeight || pose.cyDrop > T.squatCyDrop);
    const isUp = pose.heightRatio > T.standHeight && pose.cyDrop < T.standCyDrop;
    if (!this.low && isLow) {
      this.low = true;
      this.minHeight = pose.heightRatio;
      this.lowestT = t;
      events.push({ type: 'squat-down', t });
    } else if (this.low) {
      if (pose.heightRatio < this.minHeight) {
        this.minHeight = pose.heightRatio;
        this.lowestT = t;
      } else if (isLow) {
        // Nog laag: het "laagste moment" schuift mee, zodat een kikkersprong na een lange hurk telt.
        this.lowestT = t;
      }
      if (isUp || pose.feetRise > T.jumpFeet) {
        this.low = false;
        events.push({ type: 'squat', t, depth: 1 - this.minHeight });
      }
    }

    // Zijbaan (benen, niet armen: shift gebruikt cxLow).
    let lane: Lane = this.lane;
    if (this.lane === 0) {
      if (pose.shift > T.laneOut) lane = 1;
      else if (pose.shift < -T.laneOut) lane = -1;
    } else if (Math.abs(pose.shift) < T.laneBack) {
      lane = 0;
    } else if (this.lane === 1 && pose.shift < -T.laneOut) {
      lane = -1;
    } else if (this.lane === -1 && pose.shift > T.laneOut) {
      lane = 1;
    }
    if (lane !== this.lane) {
      this.lane = lane;
      events.push({ type: 'lane', t, lane });
    }

    // Slagzones en reiken: bedekking van doelvlakken rond het huidige lichaam.
    const w = r.width;
    const h = r.height;
    for (const zone of ['left', 'right', 'up'] as StrikeZone[]) {
      const cov = coverage(r.personMask, w, h, strikeRect(zone, s.cxLow, c));
      if (!this.zones[zone] && cov >= T.zoneHit && !this.airborne) {
        this.zones[zone] = true;
        events.push({ type: 'strike', t, zone });
      } else if (this.zones[zone] && cov < T.zoneRelease) {
        this.zones[zone] = false;
      }
    }
    for (const side of ['left', 'right'] as Side[]) {
      const cov = coverage(r.personMask, w, h, reachRect(side, s.cxLow, c));
      if (!this.armUp[side] && cov >= T.zoneHit && !this.airborne && pose.feetRise < 0.04) {
        this.armUp[side] = true;
        events.push({ type: 'reach', t, side });
      } else if (this.armUp[side] && cov < T.zoneRelease) {
        this.armUp[side] = false;
      }
    }

    // Houdingen vasthouden (Shadow Wall).
    this.poses = poseMatches(pose);
    for (const p of POSES) {
      if (this.poses[p] && r.power <= T.holdMaxPower) {
        this.holdMs[p] += r.dt;
        this.holdLost[p] = 0;
      } else {
        this.holdLost[p] += r.dt;
        if (this.holdLost[p] > T.holdGraceMs) this.holdMs[p] = 0;
      }
    }

    // Lopen ter plaatse: beweging links vs. rechts in de benen (onder de heup), om beurt.
    const H = c.height;
    const legTop = c.top + 0.6 * H;
    const half = 0.3 * H;
    const left = countInRect(r.motionMask, w, h, { x0: s.cxLow - half, y0: legTop, x1: s.cxLow, y1: h });
    const right = countInRect(r.motionMask, w, h, { x0: s.cxLow, y0: legTop, x1: s.cxLow + half, y1: h });
    const k = 0.5;
    this.legL += k * (left - this.legL);
    this.legR += k * (right - this.legR);
    const total = this.legL + this.legR;
    if (total > c.area * 0.01 && !this.airborne) {
      const balance = (this.legL - this.legR) / total;
      const side: Side | null = balance > T.stepBalance ? 'left' : balance < -T.stepBalance ? 'right' : null;
      if (side && side !== this.stepSide) {
        this.stepSide = side;
        events.push({ type: 'step', t, side });
      }
    }
    return events;
  }
}

/** Handig voor tellers in het Testlab en voor de meetgegevens. */
export interface MoveCounts {
  jump: number;
  squat: number;
  laneChanges: number;
  strikeLeft: number;
  strikeRight: number;
  strikeUp: number;
  reachLeft: number;
  reachRight: number;
  frogleap: number;
  step: number;
}

export function emptyCounts(): MoveCounts {
  return { jump: 0, squat: 0, laneChanges: 0, strikeLeft: 0, strikeRight: 0, strikeUp: 0, reachLeft: 0, reachRight: 0, frogleap: 0, step: 0 };
}

export function countEvents(counts: MoveCounts, events: MoveEvent[]): void {
  for (const e of events) {
    switch (e.type) {
      case 'jump':
        counts.jump++;
        break;
      case 'squat':
        counts.squat++;
        break;
      case 'lane':
        counts.laneChanges++;
        break;
      case 'strike':
        if (e.zone === 'left') counts.strikeLeft++;
        else if (e.zone === 'right') counts.strikeRight++;
        else counts.strikeUp++;
        break;
      case 'reach':
        if (e.side === 'left') counts.reachLeft++;
        else counts.reachRight++;
        break;
      case 'frogleap':
        counts.frogleap++;
        break;
      case 'step':
        counts.step++;
        break;
      default:
        break;
    }
  }
}
