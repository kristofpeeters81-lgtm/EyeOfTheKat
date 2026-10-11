import type { Frame } from '../vision/types';

/**
 * Haalt het camerabeeld naar een klein canvas in het geheugen en leest de pixels uit (#46).
 * Het canvas wordt nooit aan het document toegevoegd en elk beeld overschrijft het vorige (#3).
 *
 * - `longSide` = de lange zijde van het analysebeeld (160 voor het silhouet, 320 als de
 *   kleurbandjes-modus kleine voorwerpen moet zien). De korte zijde volgt de camera-verhouding,
 *   dus staand (portret) geeft bv. 120×160 (#11).
 * - `mirror`: de voorcamera wordt gespiegeld, zodat links op het scherm ook links voor het kind is.
 */
export class FrameGrabber {
  private readonly canvas: HTMLCanvasElement;
  private readonly ctx: CanvasRenderingContext2D;

  constructor() {
    this.canvas = document.createElement('canvas');
    const ctx = this.canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) throw new Error('Canvas 2D wordt niet ondersteund.');
    this.ctx = ctx;
  }

  static sizeFor(videoWidth: number, videoHeight: number, longSide: number): { width: number; height: number } {
    if (videoWidth >= videoHeight) return { width: longSide, height: Math.max(1, Math.round((longSide * videoHeight) / videoWidth)) };
    return { width: Math.max(1, Math.round((longSide * videoWidth) / videoHeight)), height: longSide };
  }

  grab(video: HTMLVideoElement, longSide: number, mirror: boolean): Frame | null {
    const vw = video.videoWidth;
    const vh = video.videoHeight;
    if (!vw || !vh) return null;
    const { width, height } = FrameGrabber.sizeFor(vw, vh, longSide);
    if (this.canvas.width !== width || this.canvas.height !== height) {
      this.canvas.width = width;
      this.canvas.height = height;
    }
    const ctx = this.ctx;
    ctx.save();
    if (mirror) {
      ctx.translate(width, 0);
      ctx.scale(-1, 1);
    }
    ctx.drawImage(video, 0, 0, width, height);
    ctx.restore();
    const img = ctx.getImageData(0, 0, width, height);
    return { data: img.data, width, height };
  }
}
