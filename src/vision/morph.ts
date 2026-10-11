/**
 * Maskers opruimen (#46): erosie maakt vlekken kleiner (losse ruispixels verdwijnen), dilatatie
 * maakt ze groter (kleine gaten gaan dicht). Telkens een venster van 3×3, in twee doorgangen
 * (eerst horizontaal, dan verticaal), wat sneller is en hetzelfde resultaat geeft.
 * Buiten het beeld geldt de waarde van de dichtstbijzijnde randpixel (voeten aan de rand blijven).
 */

function pass(src: Uint8Array, dst: Uint8Array, w: number, h: number, horizontal: boolean, isMax: boolean): void {
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = y * w + x;
      let a: number;
      let c: number;
      if (horizontal) {
        a = src[x > 0 ? i - 1 : i];
        c = src[x < w - 1 ? i + 1 : i];
      } else {
        a = src[y > 0 ? i - w : i];
        c = src[y < h - 1 ? i + w : i];
      }
      const b = src[i];
      dst[i] = isMax ? a | b | c : a & b & c;
    }
  }
}

export class Morphology {
  private tmp = new Uint8Array(0);

  private ensure(n: number): void {
    if (this.tmp.length !== n) this.tmp = new Uint8Array(n);
  }

  /** In-place erosie of dilatatie (3×3). */
  apply(mask: Uint8Array, w: number, h: number, op: 'erode' | 'dilate'): void {
    this.ensure(w * h);
    const isMax = op === 'dilate';
    pass(mask, this.tmp, w, h, true, isMax);
    pass(this.tmp, mask, w, h, false, isMax);
  }

  /** Openen (erosie, dan dilatatie): verwijdert ruisvlekjes kleiner dan ~3×3. */
  open(mask: Uint8Array, w: number, h: number): void {
    this.apply(mask, w, h, 'erode');
    this.apply(mask, w, h, 'dilate');
  }

  /** Sluiten (dilatatie, dan erosie), `times` keer: vult gaatjes in het silhouet. */
  close(mask: Uint8Array, w: number, h: number, times = 1): void {
    for (let k = 0; k < times; k++) this.apply(mask, w, h, 'dilate');
    for (let k = 0; k < times; k++) this.apply(mask, w, h, 'erode');
  }

  /** Kopie van een masker, met dilatatie (bv. een veiligheidsmarge rond het silhouet). */
  grow(src: Uint8Array, dst: Uint8Array, w: number, h: number, times: number): void {
    dst.set(src);
    for (let k = 0; k < times; k++) this.apply(dst, w, h, 'dilate');
  }
}
