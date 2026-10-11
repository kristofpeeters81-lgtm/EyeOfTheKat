import { ColorTracker, maxMarkerArea, type ColorModel, type ColorResult, type Marker } from '../vision/color';
import { ZONE_NAMES } from '../vision/power';
import { VisionEngine, type VisionResult } from '../vision/engine';
import { MoveTracker, type MoveEvent, type MoveState } from '../vision/moves';
import type { Frame } from '../vision/types';
import { debugStore } from './debug';
import { getSession } from './index';
import type { CameraSession } from './session';

/**
 * Verbindt camera, detectiemotor en debugpaneel. Eén exemplaar voor de hele app: de kalibratie
 * blijft bewaard tussen schermen. Het actieve scherm krijgt elk resultaat via `setListener`.
 */

export interface Moves {
  events: MoveEvent[];
  state: MoveState;
  /** Kleurbandjes-modus: posities van de handen (silhouet-coördinaten), anders null. */
  markers: Marker[] | null;
  /** Ruwe kleurresultaten (op het grote beeld), enkel in de bandjes-modus. */
  color: ColorResult | null;
}

export type VisionListener = (r: VisionResult, frame: Frame, moves: Moves) => void;

export type DebugMaskKind = 'person' | 'motion';

const PRESENCE_TEXT = { ok: 'in beeld', missing: 'uit beeld', two: 'tweede persoon', scene: 'beeld veranderd' } as const;

export class VisionRuntime {
  readonly session: CameraSession;
  readonly engine = new VisionEngine();
  readonly moves = new MoveTracker();
  private listener: VisionListener | null = null;
  debugMask: DebugMaskKind = 'person';
  last: VisionResult | null = null;
  private color: ColorTracker | null = null;
  /** Geleerde kleur blijft bewaard als de modus even uit staat. */
  colorModel: ColorModel | null = null;
  /** Bandjes enkel zoeken (instelscherm), nog niet gebruiken voor slagen/reiken. */
  private colorPreviewOnly = false;

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

  get markerMode(): boolean {
    return this.color !== null && !this.colorPreviewOnly;
  }

  /**
   * Kleurbandjes aan (#40). De camera wordt dan op 320 px uitgelezen (kleine voorwerpen); de
   * silhouetmotor halveert dat zelf naar 160 px. `previewOnly` = enkel zoeken (instelscherm).
   */
  enableMarkers(model: ColorModel, previewOnly = false): void {
    this.colorModel = model;
    this.color = new ColorTracker(model);
    this.colorPreviewOnly = previewOnly;
    this.session.longSide = 320;
  }

  /** Grote beelden (voor het instelscherm), zonder al kleuren te zoeken. */
  setHighRes(on: boolean): void {
    this.session.longSide = on || this.color ? 320 : 160;
  }

  disableMarkers(): void {
    this.color = null;
    this.colorPreviewOnly = false;
    this.session.longSide = 160;
  }

  private onFrame(frame: Frame, t: number): void {
    const r = this.engine.process(frame, t);
    let color: ColorResult | null = null;
    let markers: Marker[] | null = null;
    if (this.color) {
      const k = r.width / frame.width;
      this.color.maxArea = r.calibration ? maxMarkerArea(r.calibration.height / k) : Infinity;
      color = this.color.find(frame);
      markers = color.markers.map((m) => ({ x: m.x * k, y: m.y * k, area: m.area * k * k }));
    }
    const events = this.moves.update(r, this.colorPreviewOnly ? null : markers);
    this.last = r;
    this.publishDebug(r, markers);
    this.listener?.(r, frame, { events, state: this.moves.state, markers, color });
  }

  private publishDebug(r: VisionResult, markers: Marker[] | null): void {
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
    if (markers) v.bandjes = `${markers.length} gevonden`;
    debugStore.set(v);
  }
}

let instance: VisionRuntime | null = null;

export function getVision(): VisionRuntime {
  instance ??= new VisionRuntime();
  return instance;
}
