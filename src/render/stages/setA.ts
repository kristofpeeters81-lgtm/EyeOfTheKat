import type { DuckBeams } from '../../game/stages/duckBeams';
import type { FrogLeap } from '../../game/stages/frogLeap';
import type { LogRoll } from '../../game/stages/logRoll';
import type { StoneHop } from '../../game/stages/stoneHop';
import type { TimedObstacleStage } from '../../game/stages/timed';
import { PALETTE } from '../theme';
import { drawGround } from '../world';
import type { SceneLayout } from './layout';

/**
 * Tekeningen van de etappes uit blok 8: Log Roll, Duck Beams (zijaanzicht, obstakels komen van
 * rechts), Frog Leap (pilaren boven het water) en Stone Hop (vooraanzicht, rivier met stenen).
 */

/** Hoe lang (ms) een obstakel zichtbaar is voor het bij de held is: genoeg tijd om te reageren. */
export const LEAD_MS = 2300;

/** Snelheid van aankomende obstakels in pixels per ms: ze komen rechts in beeld, LEAD_MS vóór aankomst. */
export function obstacleSpeed(L: SceneLayout): number {
  return (L.w - L.heroX) / LEAD_MS;
}

/** Positie (x) van een getimed obstakel. */
function obstacleX(L: SceneLayout, stage: TimedObstacleStage, at: number): number {
  return L.heroX + (at - stage.setClock) * obstacleSpeed(L);
}

export function scrollFor(L: SceneLayout, stage: TimedObstacleStage): number {
  return stage.isActive ? stage.setClock * obstacleSpeed(L) : 0;
}

export function sparkle(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, t: number): void {
  ctx.save();
  ctx.strokeStyle = PALETTE.jade;
  ctx.lineWidth = 3;
  ctx.globalAlpha = 0.8;
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2 + t * 3;
    ctx.beginPath();
    ctx.moveTo(x + Math.cos(a) * r * 0.6, y + Math.sin(a) * r * 0.6);
    ctx.lineTo(x + Math.cos(a) * r, y + Math.sin(a) * r);
    ctx.stroke();
  }
  ctx.restore();
}

/** Eén rollende stam met de onderkant op `groundY`. */
export function drawLogAt(ctx: CanvasRenderingContext2D, L: SceneLayout, x: number, groundY: number): void {
  const r = L.heroSize * 0.13;
  const y = groundY - r;
  const rot = -x / r;
  ctx.save();
  ctx.translate(x, y);
  ctx.fillStyle = 'rgba(0,0,0,0.3)';
  ctx.beginPath();
  ctx.ellipse(0, r * 0.95, r, r * 0.18, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.rotate(rot);
  ctx.fillStyle = PALETTE.woodDark;
  ctx.beginPath();
  ctx.arc(0, 0, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#c99a6b';
  ctx.beginPath();
  ctx.arc(0, 0, r * 0.78, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = PALETTE.wood;
  ctx.lineWidth = Math.max(1.5, r * 0.07);
  for (const k of [0.55, 0.32]) {
    ctx.beginPath();
    ctx.arc(0, 0, r * k, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.beginPath();
  ctx.moveTo(-r * 0.7, 0);
  ctx.lineTo(r * 0.7, 0);
  ctx.stroke();
  ctx.restore();
}

export function drawLogRoll(ctx: CanvasRenderingContext2D, L: SceneLayout, stage: LogRoll, scroll: number, t: number): void {
  drawGround(ctx, L.w, L.h, L.groundY, scroll, 'stone');
  if (!stage.isActive) return;
  const r = L.heroSize * 0.13;
  for (const o of stage.obstacles) {
    const x = obstacleX(L, stage, o.at);
    if (x < -r * 2 || x > L.w + r * 2) continue;
    drawLogAt(ctx, L, x, L.groundY);
    if (o.result === 'detected' && x < L.heroX && x > L.heroX - L.heroSize) sparkle(ctx, x, L.groundY - r * 2.4, r, t);
  }
}

/** Eén balk aan touwen op hoofdhoogte. */
export function drawBeamAt(ctx: CanvasRenderingContext2D, L: SceneLayout, x: number, groundY: number, t: number, seed: number): number {
  const len = L.heroSize * 0.55;
  const thick = L.heroSize * 0.11;
  const beamY = groundY - L.heroSize * 0.74;
  const swing = Math.sin(t * 3 + seed) * 0.08;
  ctx.strokeStyle = PALETTE.woodDark;
  ctx.lineWidth = Math.max(2, thick * 0.18);
  ctx.beginPath();
  ctx.moveTo(x - len * 0.35, 0);
  ctx.lineTo(x - len * 0.35 + swing * L.heroSize, beamY);
  ctx.moveTo(x + len * 0.35, 0);
  ctx.lineTo(x + len * 0.35 + swing * L.heroSize, beamY);
  ctx.stroke();
  ctx.save();
  ctx.translate(x + swing * L.heroSize, beamY);
  ctx.rotate(swing * 0.5);
  ctx.fillStyle = PALETTE.wood;
  ctx.beginPath();
  ctx.roundRect(-len / 2, -thick / 2, len, thick, thick / 2);
  ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,0.12)';
  ctx.fillRect(-len / 2 + thick / 2, -thick / 2, len - thick, thick * 0.25);
  // Waarschuwingsstreep (rood)
  ctx.fillStyle = PALETTE.danger;
  for (let k = -2; k <= 2; k++) ctx.fillRect(k * len * 0.18 - thick * 0.15, -thick / 2, thick * 0.3, thick);
  ctx.restore();
  return beamY;
}

export function drawDuckBeams(ctx: CanvasRenderingContext2D, L: SceneLayout, stage: DuckBeams, scroll: number, t: number): void {
  drawGround(ctx, L.w, L.h, L.groundY, scroll, 'wood');
  if (!stage.isActive) return;
  const len = L.heroSize * 0.55;
  for (const o of stage.obstacles) {
    const x = obstacleX(L, stage, o.at);
    if (x < -len || x > L.w + len) continue;
    const beamY = drawBeamAt(ctx, L, x, L.groundY, t, o.at);
    if (o.result === 'detected' && x < L.heroX && x > L.heroX - L.heroSize) sparkle(ctx, x, beamY, L.heroSize * 0.22, t);
  }
}

export function drawFrogLeap(ctx: CanvasRenderingContext2D, L: SceneLayout, stage: FrogLeap, t: number): { heroY: number } {
  const { w, h, groundY, heroX, heroSize } = L;
  // Water
  const g = ctx.createLinearGradient(0, groundY, 0, h);
  g.addColorStop(0, PALETTE.water);
  g.addColorStop(1, '#0b2a4a');
  ctx.fillStyle = g;
  ctx.fillRect(0, groundY + heroSize * 0.05, w, h - groundY);
  ctx.strokeStyle = 'rgba(88, 196, 245, 0.35)';
  ctx.lineWidth = 2;
  for (let i = 0; i < 6; i++) {
    const y = groundY + heroSize * 0.15 + i * (h - groundY) * 0.15;
    const off = ((t * 40 * (1 + i * 0.2)) % 80) - 80;
    ctx.beginPath();
    for (let x = off; x < w + 80; x += 80) {
      ctx.moveTo(x, y);
      ctx.quadraticCurveTo(x + 20, y - 4, x + 40, y);
    }
    ctx.stroke();
  }
  const spacing = heroSize * 1.25;
  const p = stage.leapProgress;
  const pos = stage.platform - (p !== null ? 1 - easeInOut(p) : 0);
  const pw = heroSize * 0.42;
  for (let i = Math.floor(pos) - 2; i <= Math.ceil(pos) + Math.ceil(w / spacing); i++) {
    if (i < 0) continue;
    const x = heroX + (i - pos) * spacing;
    if (x < -pw || x > w + pw) continue;
    const top = groundY;
    ctx.fillStyle = PALETTE.stoneDark;
    ctx.fillRect(x - pw / 2, top, pw, h - top);
    ctx.fillStyle = PALETTE.stone;
    ctx.beginPath();
    ctx.roundRect(x - pw / 2 - 4, top - heroSize * 0.05, pw + 8, heroSize * 0.08, 6);
    ctx.fill();
    // Doel-gloed op het volgende platform
    if (i === stage.platform + 1 && stage.isActiveSet) {
      ctx.fillStyle = 'rgba(46, 230, 197, 0.35)';
      ctx.beginPath();
      ctx.ellipse(x, top - heroSize * 0.05, pw * 0.7, heroSize * 0.04, 0, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  return { heroY: groundY - heroSize * 0.05 };
}

function easeInOut(x: number): number {
  return x < 0.5 ? 2 * x * x : 1 - (-2 * x + 2) ** 2 / 2;
}

export function drawStoneHop(ctx: CanvasRenderingContext2D, L: SceneLayout, stage: StoneHop, t: number): void {
  const { w, h, groundY, heroSize } = L;
  const cx = w / 2;
  // Oevers links en rechts, rivier in het midden (perspectief: smaller naar boven).
  const riverTop = groundY - heroSize * 0.35;
  ctx.fillStyle = PALETTE.ground;
  ctx.fillRect(0, riverTop, w, h - riverTop);
  ctx.fillStyle = PALETTE.water;
  ctx.beginPath();
  ctx.moveTo(cx - heroSize * 0.6, riverTop);
  ctx.lineTo(cx + heroSize * 0.6, riverTop);
  ctx.lineTo(cx + w * 0.7, h);
  ctx.lineTo(cx - w * 0.7, h);
  ctx.closePath();
  ctx.fill();
  // Stroming
  ctx.strokeStyle = 'rgba(88, 196, 245, 0.4)';
  ctx.lineWidth = 2;
  for (let i = 0; i < 9; i++) {
    const f = ((i / 9 + t * 0.15 + stage.stones * 0.02) % 1);
    const y = riverTop + f * f * (h - riverTop);
    const half = heroSize * 0.6 + (w * 0.7 - heroSize * 0.6) * f * f;
    ctx.globalAlpha = 0.3 + f * 0.5;
    ctx.beginPath();
    ctx.moveTo(cx - half * 0.7, y);
    ctx.lineTo(cx - half * 0.3, y);
    ctx.moveTo(cx + half * 0.2, y);
    ctx.lineTo(cx + half * 0.6, y);
    ctx.stroke();
  }
  ctx.globalAlpha = 1;
  // Drie stenen: links, midden, rechts
  for (const lane of [-1, 0, 1] as const) {
    const x = cx + lane * heroSize * 0.8;
    const rx = heroSize * 0.32;
    const ry = heroSize * 0.09;
    const isTarget = stage.isActiveSet && !stage.waiting && lane === stage.target;
    if (isTarget) {
      const pulse = 0.6 + 0.4 * Math.sin(t * 8);
      ctx.fillStyle = `rgba(46, 230, 197, ${0.35 * pulse})`;
      ctx.beginPath();
      ctx.ellipse(x, groundY, rx * 1.5, ry * 2.2, 0, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.fillStyle = PALETTE.stoneDark;
    ctx.beginPath();
    ctx.ellipse(x, groundY + ry * 0.4, rx, ry * 1.2, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = isTarget ? PALETTE.jade : PALETTE.stone;
    ctx.beginPath();
    ctx.ellipse(x, groundY, rx * 0.92, ry, 0, 0, Math.PI * 2);
    ctx.fill();
    if (isTarget) {
      ctx.fillStyle = PALETTE.text;
      ctx.font = `900 ${Math.round(heroSize * 0.22)}px Unbounded, sans-serif`;
      ctx.textAlign = 'center';
      ctx.fillText(lane < 0 ? '◀' : '▶', x, groundY - heroSize * 1.15);
    }
  }
}
