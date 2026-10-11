import { startCamera, stopCamera, type CameraInfo, type Facing } from '../camera/camera';
import { FrameGrabber } from '../camera/frameGrabber';
import type { Frame } from '../vision/types';

/**
 * De camerasessie: camera aan/uit en de lus die elk nieuw camerabeeld ophaalt en doorgeeft.
 * Leeft buiten React (#27): React leest enkel af en toe de statistieken.
 *
 * Het <video>-element staat onzichtbaar in het document (sommige browsers spelen een losgekoppelde
 * video niet af). Het beeld wordt nergens getoond, behalve in de kleine instel-preview (#10).
 */

export interface LoopStats {
  /** Verwerkte beelden per seconde. */
  fps: number;
  /** Gemiddelde verwerkingstijd per beeld (ms), inclusief ophalen. */
  procMs: number;
  analysisWidth: number;
  analysisHeight: number;
}

export type FrameHandler = (frame: Frame, timeMs: number) => void;

export class CameraSession {
  readonly video: HTMLVideoElement;
  /** requestVideoFrameCallback: enkel verwerken als er een nieuw camerabeeld is (niet overal beschikbaar). */
  private readonly rvfc: boolean;
  private readonly grabber = new FrameGrabber();
  private info: CameraInfo | null = null;
  private running = false;
  private handle = 0;
  private lastVideoTime = -1;
  private handler: FrameHandler | null = null;
  private frames = 0;
  private procSum = 0;
  private windowStart = 0;
  private stats: LoopStats = { fps: 0, procMs: 0, analysisWidth: 0, analysisHeight: 0 };
  /** Lange zijde van het analysebeeld (#46). */
  longSide = 160;

  constructor() {
    const v = document.createElement('video');
    v.setAttribute('aria-hidden', 'true');
    v.style.cssText = 'position:fixed;left:0;top:0;width:2px;height:2px;opacity:0;pointer-events:none;';
    document.body.appendChild(v);
    this.video = v;
    this.rvfc = 'requestVideoFrameCallback' in v;
  }

  get camera(): CameraInfo | null {
    return this.info;
  }

  get loopStats(): LoopStats {
    return this.stats;
  }

  get mirrored(): boolean {
    return this.info?.facing !== 'environment';
  }

  onFrame(handler: FrameHandler | null): void {
    this.handler = handler;
  }

  async start(facing: Facing = 'user'): Promise<CameraInfo> {
    this.stop();
    this.info = await startCamera(this.video, facing, '480p');
    this.running = true;
    this.windowStart = performance.now();
    this.schedule();
    return this.info;
  }

  stop(): void {
    this.running = false;
    if (this.handle) {
      if (this.rvfc) this.video.cancelVideoFrameCallback(this.handle);
      else cancelAnimationFrame(this.handle);
      this.handle = 0;
    }
    stopCamera(this.video);
    this.info = null;
    this.lastVideoTime = -1;
  }

  destroy(): void {
    this.stop();
    this.video.remove();
  }

  private schedule(): void {
    if (!this.running) return;
    if (this.rvfc) this.handle = this.video.requestVideoFrameCallback(() => this.tick());
    else this.handle = requestAnimationFrame(() => this.tick());
  }

  private tick(): void {
    if (!this.running) return;
    // Zonder requestVideoFrameCallback: enkel verwerken als er echt een nieuw beeld is.
    if (this.video.currentTime !== this.lastVideoTime) {
      this.lastVideoTime = this.video.currentTime;
      const t0 = performance.now();
      const frame = this.grabber.grab(this.video, this.longSide, this.mirrored);
      if (frame) {
        try {
          this.handler?.(frame, t0);
        } catch (err) {
          console.error(err);
        }
        this.frames++;
        this.procSum += performance.now() - t0;
        this.stats.analysisWidth = frame.width;
        this.stats.analysisHeight = frame.height;
      }
      const elapsed = t0 - this.windowStart;
      if (elapsed >= 1000) {
        this.stats = { ...this.stats, fps: (this.frames * 1000) / elapsed, procMs: this.frames ? this.procSum / this.frames : 0 };
        this.frames = 0;
        this.procSum = 0;
        this.windowStart = t0;
      }
    }
    this.schedule();
  }
}
