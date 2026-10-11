import { BackgroundModel } from './background';
import { BodyCalibrator, spaceCheck, type SpaceHint } from './calibration';
import { Morphology } from './morph';
import { countInRect, MotionMeter } from './motion';
import { instantPower, Smoother, zoneOf, type Zone } from './power';
import { PresenceMonitor, type Presence } from './presence';
import { SilhouetteExtractor, toPose } from './silhouette';
import type { BodyCalibration, BodyPose, Frame, MaskBlob, Silhouette } from './types';

/**
 * De detectiemotor (#5): van camerabeeld naar silhouet, houding, Ninja Power en aanwezigheid.
 * Puur TypeScript zonder DOM (#14, #27). Eén `process()` per beeld.
 *
 * Fasen:
 *   idle      → nog niets geleerd
 *   learning  → de lege kamer leren (#30); vraagt `learnFrames` stilstaande beelden na elkaar
 *   running   → silhouet zoeken; na `calibrateBody()` ook de lichaamsmaten vastleggen
 */

export type EnginePhase = 'idle' | 'learning' | 'running';

export interface VisionResult {
  t: number;
  dt: number;
  width: number;
  height: number;
  phase: EnginePhase;
  /** 0..1 tijdens het leren van de achtergrond. */
  learnProgress: number;
  /** Tijdens het leren bewoog er iets: opnieuw begonnen. */
  learnUnstable: boolean;
  /** Deel van het beeld dat voorgrond is. */
  fgFraction: number;
  silhouette: Silhouette | null;
  /** 1 = spelerpixel. Geldig tot de volgende `process()`. */
  personMask: Uint8Array;
  /** Bewegende pixels (verschil met het vorige beeld). */
  motionMask: Uint8Array;
  others: MaskBlob[];
  space: SpaceHint;
  calibration: BodyCalibration | null;
  /** 0..1 terwijl de lichaamskalibratie loopt. */
  bodyProgress: number;
  /** Houding tegenover de kalibratie (null zonder kalibratie of silhouet). */
  pose: BodyPose | null;
  power: number;
  zone: Zone;
  /** Power van enkel de benen (onderste 45 % van het lichaam): voor Bridge Sprint. */
  legPower: number;
  /** Staat het kind stil? (Power laag) */
  still: boolean;
  presence: Presence;
}

export interface EngineOptions {
  /** Aantal stilstaande beelden om de achtergrond te leren. */
  learnFrames: number;
  /** Max. deel van het beeld dat mag bewegen tijdens het leren. */
  learnMaxMotion: number;
  /** Lange zijde waarop het silhouet berekend wordt. */
  analysisLongSide: number;
  /** Aanpassingssnelheid van de achtergrond per beeld. */
  adaptRate: number;
  adaptRateForeground: number;
}

export const DEFAULT_ENGINE_OPTIONS: EngineOptions = {
  learnFrames: 24,
  learnMaxMotion: 0.006,
  analysisLongSide: 160,
  adaptRate: 0.01,
  adaptRateForeground: 0.003,
};

/** Halveert een beeld (gemiddelde van 2×2 pixels). */
export function downsample2x(frame: Frame): Frame {
  const w = frame.width >> 1;
  const h = frame.height >> 1;
  const out = new Uint8ClampedArray(w * h * 4);
  const s = frame.data;
  const sw = frame.width;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const a = ((y * 2) * sw + x * 2) * 4;
      const b = a + 4;
      const c = a + sw * 4;
      const d = c + 4;
      const o = (y * w + x) * 4;
      out[o] = (s[a] + s[b] + s[c] + s[d]) >> 2;
      out[o + 1] = (s[a + 1] + s[b + 1] + s[c + 1] + s[d + 1]) >> 2;
      out[o + 2] = (s[a + 2] + s[b + 2] + s[c + 2] + s[d + 2]) >> 2;
      out[o + 3] = 255;
    }
  }
  return { data: out, width: w, height: h };
}

export class VisionEngine {
  readonly background = new BackgroundModel();
  private readonly motion = new MotionMeter();
  private readonly morph = new Morphology();
  private readonly extractor = new SilhouetteExtractor();
  private readonly presenceMonitor = new PresenceMonitor();
  private readonly bodyCalibrator = new BodyCalibrator();
  private readonly power = new Smoother(600);
  private readonly legPower = new Smoother(500);
  private phase: EnginePhase = 'idle';
  private stableFrames = 0;
  private unstable = false;
  private collectingBody = false;
  private calib: BodyCalibration | null = null;
  private fg = new Uint8Array(0);
  private keepOut = new Uint8Array(0);
  private lastT: number | null = null;

  constructor(readonly options: EngineOptions = DEFAULT_ENGINE_OPTIONS) {}

  get currentPhase(): EnginePhase {
    return this.phase;
  }

  get calibration(): BodyCalibration | null {
    return this.calib;
  }

  /** Begin (opnieuw) met het leren van de lege kamer. Wist ook de lichaamskalibratie. */
  startLearning(): void {
    this.phase = 'learning';
    this.stableFrames = 0;
    this.unstable = false;
    this.calib = null;
    this.collectingBody = false;
    this.background.ready = false;
    this.motion.reset();
    this.presenceMonitor.reset();
  }

  /** Begin met het vastleggen van de lichaamsmaten (het kind staat in de voetstappen). */
  calibrateBody(): void {
    this.collectingBody = true;
    this.bodyCalibrator.reset();
  }

  setCalibration(c: BodyCalibration | null): void {
    this.calib = c;
    this.collectingBody = false;
  }

  process(input: Frame, t: number): VisionResult {
    let frame = input;
    while (Math.max(frame.width, frame.height) >= this.options.analysisLongSide * 2) frame = downsample2x(frame);
    const w = frame.width;
    const h = frame.height;
    const n = w * h;
    const dt = this.lastT === null ? 33 : t - this.lastT;
    this.lastT = t;
    if (this.fg.length !== n) {
      this.fg = new Uint8Array(n);
      this.keepOut = new Uint8Array(n);
    }

    const motion = this.motion.update(frame);
    const base = {
      t,
      dt,
      width: w,
      height: h,
      motionMask: motion.mask,
    };

    if (this.phase !== 'running') {
      if (this.phase === 'learning') this.learn(frame, motion.total / n);
      this.fg.fill(0);
      return {
        ...base,
        phase: this.phase,
        learnProgress: this.phase === 'learning' ? this.stableFrames / this.options.learnFrames : 0,
        learnUnstable: this.unstable,
        fgFraction: 0,
        silhouette: null,
        personMask: this.fg,
        others: [],
        space: 'nobody',
        calibration: null,
        bodyProgress: 0,
        pose: null,
        power: 0,
        zone: 0,
        legPower: 0,
        still: true,
        presence: 'ok',
      };
    }

    // 1. Voorgrond, opgeruimd.
    const fg = this.fg;
    const fgCount = this.background.classify(frame, fg);
    const fgFraction = fgCount / n;
    this.morph.open(fg, w, h);
    this.morph.close(fg, w, h, 2);

    // 2. Silhouet.
    const { silhouette, personMask, others } = this.extractor.extract(fg, w, h);

    // 3. Achtergrond bijwerken, nooit waar de speler staat (+ marge).
    if (fgFraction < 0.5) {
      this.morph.grow(personMask, this.keepOut, w, h, 3);
      this.background.adapt(frame, fg, this.keepOut, this.options.adaptRate, this.options.adaptRateForeground);
    }

    // 4. Ninja Power: beweging binnen het spelerkader (+ marge).
    let power = this.power.value;
    let legPower = this.legPower.value;
    const refArea = this.calib?.area ?? silhouette?.area ?? 0;
    if (silhouette && refArea > 0) {
      const refH = this.calib?.height ?? silhouette.height;
      const m = refH * 0.15;
      const box = { x0: silhouette.x0 - m, y0: silhouette.y0 - m, x1: silhouette.x1 + m, y1: silhouette.y1 + m };
      const changed = countInRect(motion.mask, w, h, box);
      power = this.power.update(instantPower(changed, refArea, dt), dt);
      const legTop = this.calib ? this.calib.top + this.calib.height * 0.55 : silhouette.top + silhouette.height * 0.55;
      const legs = countInRect(motion.mask, w, h, { ...box, y0: legTop });
      legPower = this.legPower.update(instantPower(legs, refArea * 0.45, dt), dt);
    } else {
      power = this.power.update(0, dt);
      legPower = this.legPower.update(0, dt);
    }
    const still = power < 12;

    // 5. Ruimte-check en lichaamskalibratie.
    const space = spaceCheck(silhouette, w, h);
    let bodyProgress = 0;
    if (this.collectingBody) {
      const result = this.bodyCalibrator.add(silhouette, space === 'ok', still, w, h);
      bodyProgress = this.bodyCalibrator.progress;
      if (result) {
        this.calib = result;
        this.collectingBody = false;
        bodyProgress = 1;
        this.presenceMonitor.reset();
      }
    }

    // 6. Houding en aanwezigheid tegenover de kalibratie.
    const calib = this.calib;
    const pose = calib && silhouette ? toPose(silhouette, calib) : null;
    const presence = calib ? this.presenceMonitor.update(PresenceMonitor.instant(silhouette, others, fgFraction, calib), t) : 'ok';

    return {
      ...base,
      phase: this.phase,
      learnProgress: 1,
      learnUnstable: false,
      fgFraction,
      silhouette,
      personMask,
      others,
      space,
      calibration: calib,
      bodyProgress,
      pose,
      power,
      zone: zoneOf(power),
      legPower,
      still,
      presence,
    };
  }

  private learn(frame: Frame, motionFraction: number): void {
    if (this.stableFrames === 0) this.background.beginLearning(frame.width, frame.height);
    if (motionFraction > this.options.learnMaxMotion && this.stableFrames > 0) {
      // Er bewoog iets: opnieuw beginnen.
      this.stableFrames = 0;
      this.unstable = true;
      return;
    }
    this.background.addSample(frame);
    this.stableFrames++;
    if (this.stableFrames >= this.options.learnFrames) {
      this.background.finishLearning();
      this.phase = 'running';
      this.unstable = false;
      this.power.reset(0);
      this.legPower.reset(0);
    }
  }
}
