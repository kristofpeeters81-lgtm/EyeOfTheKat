import { ZONE_NAMES } from '../vision/power';
import { VisionEngine, type VisionResult } from '../vision/engine';
import type { Frame } from '../vision/types';
import { debugStore } from './debug';
import { getSession } from './index';
import type { CameraSession } from './session';

/**
 * Verbindt camera, detectiemotor en debugpaneel. Eén exemplaar voor de hele app: de kalibratie
 * blijft bewaard tussen schermen. Het actieve scherm krijgt elk resultaat via `setListener`.
 */

export type VisionListener = (r: VisionResult, frame: Frame) => void;

export type DebugMaskKind = 'person' | 'motion';

const PRESENCE_TEXT = { ok: 'in beeld', missing: 'uit beeld', two: 'tweede persoon', scene: 'beeld veranderd' } as const;

export class VisionRuntime {
  readonly session: CameraSession;
  readonly engine = new VisionEngine();
  private listener: VisionListener | null = null;
  debugMask: DebugMaskKind = 'person';
  last: VisionResult | null = null;

  constructor() {
    this.session = getSession();
    this.session.onFrame((frame, t) => this.onFrame(frame, t));
  }

  get running(): boolean {
    return this.session.camera !== null;
  }

  async start(): Promise<void> {
    if (!this.session.camera) await this.session.start('user');
  }

  stop(): void {
    this.session.stop();
    debugStore.clear();
  }

  setListener(l: VisionListener | null): void {
    this.listener = l;
  }

  private onFrame(frame: Frame, t: number): void {
    const r = this.engine.process(frame, t);
    this.last = r;
    this.publishDebug(r);
    this.listener?.(r, frame);
  }

  private publishDebug(r: VisionResult): void {
    const mask = this.debugMask === 'motion' || r.phase !== 'running' ? r.motionMask : r.personMask;
    debugStore.setMasks(mask, r.width, r.height);
    debugStore.setPower(r.phase === 'running' && r.silhouette ? r.power : null, r.zone);
    const v: Record<string, string | number> = {
      fase: r.phase === 'running' ? 'actief' : r.phase === 'learning' ? `leren ${Math.round(r.learnProgress * 100)}%` : 'wacht',
      voorgrond: `${(r.fgFraction * 100).toFixed(1)} %`,
      belichting: `×${this.engine.background.gain.toFixed(2)}`,
    };
    if (r.silhouette) {
      v.silhouet = `${r.silhouette.width}×${r.silhouette.height} px`;
      v['ruimte-check'] = r.space;
    }
    if (r.pose) {
      v.hoogte = r.pose.heightRatio;
      v.breedte = r.pose.widthRatio;
      v['voeten los'] = r.pose.feetRise;
      v['top omhoog'] = r.pose.topRise;
      v.verschuiving = r.pose.shift;
      v.aanwezig = PRESENCE_TEXT[r.presence];
      v['benen-power'] = Math.round(r.legPower);
      v.zone = ZONE_NAMES[r.zone];
    }
    debugStore.set(v);
  }
}

let instance: VisionRuntime | null = null;

export function getVision(): VisionRuntime {
  instance ??= new VisionRuntime();
  return instance;
}
