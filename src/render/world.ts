import { PALETTE } from './theme';

/**
 * De spelwereld (#35): nachtlucht, sterren, bergen in drie lagen (parallax) en het Oog van de Kat
 * als gloeiend juweel op de hoogste top. Alles procedureel getekend: geen afbeeldingen.
 */

const STARS: { x: number; y: number; r: number; tw: number }[] = (() => {
  let s = 7;
  const rnd = () => {
    s = (s * 16807) % 2147483647;
    return s / 2147483647;
  };
  return Array.from({ length: 140 }, () => ({ x: rnd(), y: rnd() * 0.7, r: 0.5 + rnd() * 1.6, tw: rnd() * Math.PI * 2 }));
})();

export function drawSky(ctx: CanvasRenderingContext2D, W: number, H: number, t: number): void {
  const g = ctx.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0, PALETTE.skyTop);
  g.addColorStop(0.55, PALETTE.skyMid);
  g.addColorStop(0.85, PALETTE.skyLow);
  g.addColorStop(1, '#5a3a6b');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);
  const k = Math.min(W, H) / 700;
  for (const st of STARS) {
    const a = 0.45 + 0.55 * Math.abs(Math.sin(t * 0.8 + st.tw));
    ctx.globalAlpha = a;
    ctx.fillStyle = PALETTE.star;
    ctx.beginPath();
    ctx.arc(st.x * W, st.y * H, st.r * k, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
  // Maan
  const mx = W * 0.14;
  const my = H * 0.16;
  const mr = Math.min(W, H) * 0.06;
  const mg = ctx.createRadialGradient(mx, my, mr * 0.2, mx, my, mr * 3);
  mg.addColorStop(0, 'rgba(255, 243, 214, 0.35)');
  mg.addColorStop(1, 'rgba(255, 243, 214, 0)');
  ctx.fillStyle = mg;
  ctx.fillRect(mx - mr * 3, my - mr * 3, mr * 6, mr * 6);
  ctx.fillStyle = PALETTE.moon;
  ctx.beginPath();
  ctx.arc(mx, my, mr, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = 'rgba(200, 190, 170, 0.35)';
  for (const [dx, dy, r] of [
    [-0.3, -0.2, 0.18],
    [0.25, 0.15, 0.24],
    [-0.05, 0.4, 0.12],
  ]) {
    ctx.beginPath();
    ctx.arc(mx + dx * mr, my + dy * mr, r * mr, 0, Math.PI * 2);
    ctx.fill();
  }
}

/** Hoogte van een berglaag op positie x (0..1 van de hoogte), som van sinussen = oneindig doorlopend. */
function ridge(x: number, seed: number, rough: number): number {
  return (
    0.5 +
    0.22 * Math.sin(x * 0.0021 + seed) +
    0.12 * Math.sin(x * 0.0057 + seed * 2.1) +
    rough * 0.05 * Math.sin(x * 0.019 + seed * 3.7) +
    rough * 0.025 * Math.sin(x * 0.047 + seed * 5.3)
  );
}

function layer(ctx: CanvasRenderingContext2D, W: number, H: number, scroll: number, base: number, amp: number, seed: number, rough: number, color: string): void {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(0, H);
  const step = Math.max(4, W / 160);
  for (let x = 0; x <= W + step; x += step) {
    const y = H * base - ridge(x + scroll, seed, rough) * H * amp;
    ctx.lineTo(x, y);
  }
  ctx.lineTo(W, H);
  ctx.closePath();
  ctx.fill();
}

export interface EyeSpot {
  x: number;
  y: number;
  r: number;
}

/**
 * Bergen in drie lagen. De verste laag heeft een vaste hoge top met het Oog.
 * @param scroll horizontale verschuiving in pixels (de wereld loopt mee met de held)
 * @param eyeX positie van de top (0..1 van de breedte)
 */
export function drawMountains(ctx: CanvasRenderingContext2D, W: number, H: number, scroll: number, t: number, eyeX = 0.72): EyeSpot {
  // Verste laag met de top van het Oog.
  const peakX = W * eyeX;
  const peakY = H * 0.2;
  const far = new Path2D();
  far.moveTo(0, H);
  const step = Math.max(4, W / 160);
  for (let x = 0; x <= W + step; x += step) {
    const ridgeY = H * 0.62 - ridge(x + scroll * 0.15, 1.3, 1) * H * 0.22;
    const d = Math.abs(x - peakX) / (W * 0.22);
    const peak = peakY + d * d * H * 0.45 + Math.sin(x * 0.05) * H * 0.006;
    far.lineTo(x, Math.min(ridgeY, peak));
  }
  far.lineTo(W, H);
  far.closePath();
  ctx.fillStyle = PALETTE.mountainFar;
  ctx.fill(far);
  // Sneeuw op de top: het deel van de berg boven een golvende lijn.
  ctx.save();
  ctx.clip(far);
  ctx.fillStyle = 'rgba(220, 230, 255, 0.2)';
  ctx.beginPath();
  ctx.moveTo(peakX - W * 0.2, 0);
  for (let x = peakX - W * 0.2; x <= peakX + W * 0.2; x += step) ctx.lineTo(x, peakY + H * 0.045 + Math.sin(x * 0.09) * H * 0.008);
  ctx.lineTo(peakX + W * 0.2, 0);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
  const eye = { x: peakX, y: peakY - H * 0.07, r: Math.min(W, H) * 0.05 };
  drawEye(ctx, eye.x, eye.y, eye.r, t);
  layer(ctx, W, H, scroll * 0.35, 0.86, 0.3, 4.2, 1.5, PALETTE.mountainMid);
  layer(ctx, W, H, scroll * 0.6, 1.0, 0.28, 8.9, 2.5, PALETTE.mountainNear);
  return eye;
}

/** Het Oog van de Kat: amandelvormig juweel met verticale pupil en een kloppende gloed. */
export function drawEye(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, t: number, open = 1): void {
  const pulse = 0.85 + 0.15 * Math.sin(t * 2.2);
  const glow = ctx.createRadialGradient(x, y, r * 0.2, x, y, r * 3.2 * pulse);
  glow.addColorStop(0, 'rgba(255, 178, 30, 0.55)');
  glow.addColorStop(0.5, 'rgba(255, 122, 26, 0.18)');
  glow.addColorStop(1, 'rgba(255, 122, 26, 0)');
  ctx.fillStyle = glow;
  ctx.fillRect(x - r * 3.5, y - r * 3.5, r * 7, r * 7);
  const h = r * 0.62 * open;
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(x - r, y);
  ctx.quadraticCurveTo(x, y - h * 1.6, x + r, y);
  ctx.quadraticCurveTo(x, y + h * 1.6, x - r, y);
  ctx.closePath();
  const iris = ctx.createRadialGradient(x, y - h * 0.2, r * 0.05, x, y, r);
  iris.addColorStop(0, '#fff3b0');
  iris.addColorStop(0.45, PALETTE.eye);
  iris.addColorStop(1, '#c2410c');
  ctx.fillStyle = iris;
  ctx.fill();
  ctx.lineWidth = Math.max(1.5, r * 0.08);
  ctx.strokeStyle = PALETTE.jade;
  ctx.stroke();
  ctx.clip();
  // Pupil: spleet die "ademt"
  const pw = r * (0.14 + 0.05 * Math.sin(t * 1.3));
  ctx.fillStyle = PALETTE.eyePupil;
  ctx.beginPath();
  ctx.moveTo(x, y - h * 1.1);
  ctx.quadraticCurveTo(x + pw, y, x, y + h * 1.1);
  ctx.quadraticCurveTo(x - pw, y, x, y - h * 1.1);
  ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,0.8)';
  ctx.beginPath();
  ctx.arc(x - r * 0.3, y - h * 0.35, r * 0.1, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

export type GroundKind = 'stone' | 'wood' | 'grass';

/** Grond/pad onderaan, met een bovenrand en patroon dat meeschuift. */
export function drawGround(ctx: CanvasRenderingContext2D, W: number, H: number, groundY: number, scroll: number, kind: GroundKind = 'stone'): void {
  ctx.fillStyle = PALETTE.ground;
  ctx.fillRect(0, groundY, W, H - groundY);
  ctx.fillStyle = PALETTE.groundTop;
  ctx.fillRect(0, groundY, W, Math.max(3, (H - groundY) * 0.08));
  const tile = Math.max(40, (H - groundY) * 0.9);
  const off = ((scroll % tile) + tile) % tile;
  ctx.strokeStyle = 'rgba(255,255,255,0.06)';
  ctx.lineWidth = 2;
  for (let x = -off; x < W + tile; x += tile) {
    ctx.beginPath();
    if (kind === 'wood') {
      ctx.moveTo(x, groundY);
      ctx.lineTo(x, H);
    } else {
      ctx.moveTo(x, groundY + (H - groundY) * 0.15);
      ctx.lineTo(x + tile * 0.4, H);
    }
    ctx.stroke();
  }
}
