// Maakt een synthetisch testfilmpje (y4m) voor de eind-tot-eind-test (#32): een getekende kamer
// met een getekende "persoon" die een vast draaiboek volgt. Geen echte beelden.
//
// Gebruik: npm run testvideo [-- uit.y4m]      (standaard: e2e-output/synthetisch.y4m)
//
// Draaiboek (seconden sinds de camera start; Chrome speelt het filmpje in een lus):
//    0.0– 2.5  staat in het midden (toestel klaarzetten)
//    2.5– 3.5  stapt naar rechts uit beeld
//    3.5– 9.0  lege kamer (aftellen 5 s + achtergrond leren)
//    9.0–10.0  komt terug naar het midden
//   10.0–14.0  staat stil (lichaamskalibratie)
//   14.0–19.0  4 sprongen
//   19.5–25.0  3 keer hurken
//   25.5–30.0  stap naar rechts, midden, stap naar links, midden
//   30.5–34.0  lopen ter plaatse (knieën + armen)
//   34.0–36.0  staat stil
//
// Node ≥ 22.6 leest de TypeScript-scène rechtstreeks (type stripping).

import fs from 'node:fs';
import path from 'node:path';
import { renderScene } from '../src/vision/testing/scene.ts';

const OUT = process.argv[2] ?? path.join('e2e-output', 'synthetisch.y4m');
const W = 320;
const H = 240;
const FPS = 20;
const DURATION = 36;
fs.mkdirSync(path.dirname(OUT), { recursive: true });

const base = { cx: W / 2, footY: H * 0.9, height: H * 0.62 };
const lerp = (a, b, f) => a + (b - a) * Math.min(1, Math.max(0, f));

/** De persoon op tijdstip t (of null = niemand). */
function person(t) {
  if (t < 2.5) return { ...base };
  if (t < 3.5) return { ...base, cx: lerp(W / 2, W + 60, (t - 2.5) / 1) };
  if (t < 9) return null;
  if (t < 10) return { ...base, cx: lerp(W + 60, W / 2, (t - 9) / 1) };
  if (t < 14) return { ...base };
  if (t < 19) {
    // 4 sprongen van 1,25 s: 0,45 s in de lucht (parabool tot 14 % van de lengte).
    const k = (t - 14) % 1.25;
    const lift = k < 0.45 ? Math.sin((k / 0.45) * Math.PI) * base.height * 0.14 : 0;
    return { ...base, lift };
  }
  if (t < 19.5) return { ...base };
  if (t < 25) {
    // 3 keer hurken van 1,8 s: 0,5 neer, 0,6 laag, 0,5 op, 0,2 rechtop.
    const k = (t - 19.5) % 1.8;
    const squat = k < 0.5 ? k / 0.5 : k < 1.1 ? 1 : k < 1.6 ? 1 - (k - 1.1) / 0.5 : 0;
    return { ...base, squat };
  }
  if (t < 25.5) return { ...base };
  if (t < 30) {
    const k = t - 25.5;
    const shift = base.height * 0.4;
    const cx = k < 0.3 ? lerp(W / 2, W / 2 + shift, k / 0.3) : k < 1.3 ? W / 2 + shift : k < 1.6 ? lerp(W / 2 + shift, W / 2, (k - 1.3) / 0.3) : k < 2.3 ? W / 2 : k < 2.6 ? lerp(W / 2, W / 2 - shift, (k - 2.3) / 0.3) : k < 3.6 ? W / 2 - shift : lerp(W / 2 - shift, W / 2, (k - 3.6) / 0.3);
    return { ...base, cx };
  }
  if (t < 30.5) return { ...base };
  if (t < 34) {
    // Lopen ter plaatse: ±3 passen per seconde.
    const phase = Math.sin((t - 30.5) * Math.PI * 6);
    const lift = Math.abs(phase) * base.height * 0.16;
    return {
      ...base,
      kneeLift: phase > 0 ? [lift, 0] : [0, lift],
      leftArm: phase > 0 ? 'up' : 'down',
      rightArm: phase > 0 ? 'down' : 'up',
    };
  }
  return { ...base };
}

/** RGBA → YUV 4:2:0 (BT.601). */
function toI420(rgba) {
  const y = Buffer.alloc(W * H);
  const u = Buffer.alloc((W / 2) * (H / 2));
  const v = Buffer.alloc((W / 2) * (H / 2));
  for (let j = 0; j < H; j++) {
    for (let i = 0; i < W; i++) {
      const p = (j * W + i) * 4;
      const r = rgba[p];
      const g = rgba[p + 1];
      const b = rgba[p + 2];
      y[j * W + i] = Math.max(0, Math.min(255, Math.round(0.257 * r + 0.504 * g + 0.098 * b + 16)));
      if (j % 2 === 0 && i % 2 === 0) {
        const q = (j / 2) * (W / 2) + i / 2;
        u[q] = Math.max(0, Math.min(255, Math.round(-0.148 * r - 0.291 * g + 0.439 * b + 128)));
        v[q] = Math.max(0, Math.min(255, Math.round(0.439 * r - 0.368 * g - 0.071 * b + 128)));
      }
    }
  }
  return Buffer.concat([y, u, v]);
}

const fd = fs.openSync(OUT, 'w');
fs.writeSync(fd, `YUV4MPEG2 W${W} H${H} F${FPS}:1 Ip A1:1 C420jpeg\n`);
const frames = DURATION * FPS;
for (let f = 0; f < frames; f++) {
  const t = f / FPS;
  const p = person(t);
  const frame = renderScene({ width: W, height: H, persons: p ? [p] : [], seed: f + 1, noise: 3 });
  fs.writeSync(fd, 'FRAME\n');
  fs.writeSync(fd, toI420(frame.data));
}
fs.closeSync(fd);
console.log(`✓ ${OUT}: ${frames} beelden, ${W}×${H} @ ${FPS} fps`);
