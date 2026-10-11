import type { MaskBlob } from './types';

/**
 * Samenhangende vlekken in een masker zoeken (4-buren). Elke pixel krijgt een vlek-nummer
 * (`labels`, 0 = geen vlek). Geeft de vlekken terug, grootste eerst.
 */
export function labelComponents(mask: Uint8Array, w: number, h: number, labels: Int32Array, stack?: Int32Array): MaskBlob[] {
  labels.fill(0);
  const n = w * h;
  const st = stack && stack.length >= n ? stack : new Int32Array(n);
  const blobs: MaskBlob[] = [];
  let next = 1;
  for (let start = 0; start < n; start++) {
    if (!mask[start] || labels[start]) continue;
    const label = next++;
    let sp = 0;
    st[sp++] = start;
    labels[start] = label;
    let area = 0;
    let sx = 0;
    let sy = 0;
    let x0 = w;
    let y0 = h;
    let x1 = 0;
    let y1 = 0;
    while (sp > 0) {
      const i = st[--sp];
      const x = i % w;
      const y = (i - x) / w;
      area++;
      sx += x;
      sy += y;
      if (x < x0) x0 = x;
      if (x > x1) x1 = x;
      if (y < y0) y0 = y;
      if (y > y1) y1 = y;
      if (x > 0 && mask[i - 1] && !labels[i - 1]) {
        labels[i - 1] = label;
        st[sp++] = i - 1;
      }
      if (x < w - 1 && mask[i + 1] && !labels[i + 1]) {
        labels[i + 1] = label;
        st[sp++] = i + 1;
      }
      if (y > 0 && mask[i - w] && !labels[i - w]) {
        labels[i - w] = label;
        st[sp++] = i - w;
      }
      if (y < h - 1 && mask[i + w] && !labels[i + w]) {
        labels[i + w] = label;
        st[sp++] = i + w;
      }
    }
    blobs.push({ label, area, cx: sx / area, cy: sy / area, x0, y0, x1: x1 + 1, y1: y1 + 1 });
  }
  blobs.sort((a, b) => b.area - a.area);
  return blobs;
}
