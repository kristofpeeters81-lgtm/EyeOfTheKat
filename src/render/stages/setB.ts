import type { ShadowStrike } from '../../game/stages/shadowStrike';
import type { ShadowWall } from '../../game/stages/shadowWall';
import type { TheEye } from '../../game/stages/theEye';
import type { WallClimb } from '../../game/stages/wallClimb';
import type { StrikeZone } from '../../vision/moves';
import { drawHero, targetPose } from '../hero';
import { PALETTE, type HeroLook } from '../theme';
import { drawEye, drawGround } from '../world';
import type { SceneLayout } from './layout';
import { drawBeamAt, drawLogAt, obstacleSpeed, sparkle } from './setA';

/**
 * Tekeningen van de etappes uit blok 9: Shadow Wall, Shadow Strike, Wall Climb (vooraanzicht) en de
 * finale The Eye (zijaanzicht).
 */

const wallLayer = document.createElement('canvas');

/** Shadow Wall, deel 1 (achter de held): grond en de vasthoudbalk. */
export function drawShadowWallBack(ctx: CanvasRenderingContext2D, L: SceneLayout, stage: ShadowWall): void {
  const { w, h, groundY, heroSize } = L;
  drawGround(ctx, w, h, groundY, 0, 'stone');
  if (!stage.isActiveSet) return;
  const cx = w / 2;
  const bw = heroSize * 1.2;
  const by = groundY + heroSize * 0.08;
  ctx.fillStyle = 'rgba(255,255,255,0.15)';
  ctx.beginPath();
  ctx.roundRect(cx - bw / 2, by, bw, heroSize * 0.06, heroSize * 0.03);
  ctx.fill();
  ctx.fillStyle = stage.matching ? PALETTE.jade : PALETTE.eye;
  ctx.beginPath();
  ctx.roundRect(cx - bw / 2, by, Math.max(heroSize * 0.06, bw * stage.holdFraction), heroSize * 0.06, heroSize * 0.03);
  ctx.fill();
}

/**
 * Shadow Wall, deel 2 (vóór de held): de muur nadert (wordt groter en minder doorzichtig), met een
 * gat in de vorm van de gevraagde houding precies op de plek van de held. Klopt je houding, dan zie
 * je de held door het gat; klopt ze niet, dan bedekt de muur een deel van de held.
 */
export function drawShadowWallFront(ctx: CanvasRenderingContext2D, L: SceneLayout, stage: ShadowWall, look: HeroLook, t: number, dpr: number): void {
  if (!stage.isActiveSet) return;
  const { w, h, groundY, heroSize } = L;
  const p = stage.wallProgress;
  const cx = w / 2;
  const grow = 0.45 + 0.55 * Math.min(1, p / 0.85);
  const ww = Math.min(w * 0.96, heroSize * 2.8) * grow;
  const wh = Math.min(groundY + 10, heroSize * 1.75 * grow);
  const bottom = groundY + heroSize * 0.02;
  wallLayer.width = Math.max(1, Math.round(w * dpr));
  wallLayer.height = Math.max(1, Math.round(h * dpr));
  const wctx = wallLayer.getContext('2d');
  if (!wctx) return;
  wctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  wctx.clearRect(0, 0, w, h);
  wctx.fillStyle = PALETTE.stoneDark;
  wctx.fillRect(cx - ww / 2, bottom - wh, ww, wh);
  wctx.strokeStyle = 'rgba(0,0,0,0.35)';
  wctx.lineWidth = 2;
  const rows = 8;
  const bh = wh / rows;
  for (let r = 0; r < rows; r++) {
    const y = bottom - wh + r * bh;
    wctx.beginPath();
    wctx.moveTo(cx - ww / 2, y);
    wctx.lineTo(cx + ww / 2, y);
    wctx.stroke();
    for (let x = cx - ww / 2 + (r % 2 ? bh : bh * 1.8); x < cx + ww / 2; x += bh * 2.2) {
      wctx.beginPath();
      wctx.moveTo(x, y);
      wctx.lineTo(x, y + bh);
      wctx.stroke();
    }
  }
  // Gat in de vorm van de houding, met een gloeiende jade rand.
  const action = stage.pose === 'arms-up' ? 'armsUp' : stage.pose;
  const pose = targetPose(action, 'front', 0);
  const rim = { id: look.id, suit: PALETTE.jade, accent: PALETTE.jade };
  drawHero(wctx, pose, rim, cx, groundY, heroSize * 1.2, 'front', 0);
  wctx.globalCompositeOperation = 'destination-out';
  drawHero(wctx, pose, rim, cx, groundY, heroSize * 1.13, 'front', 0);
  wctx.globalCompositeOperation = 'source-over';
  ctx.save();
  const fadeOut = stage.outcome === 'detected' ? Math.max(0, 1 - (p - 0.85) * 6) : 1;
  ctx.globalAlpha = (0.35 + 0.55 * Math.min(1, p / 0.85)) * fadeOut;
  ctx.drawImage(wallLayer, 0, 0, w, h);
  ctx.restore();
  if (stage.outcome === 'detected') sparkle(ctx, cx, groundY - heroSize * 0.5, heroSize * 0.5, t);
}

/** Positie van een slagdoel rond de held (vooraanzicht). */
export function strikeSpot(L: SceneLayout, zone: StrikeZone): { x: number; y: number } {
  const cx = L.w / 2;
  const top = L.groundY - L.heroSize;
  if (zone === 'up') return { x: cx, y: top - L.heroSize * 0.22 };
  return { x: cx + (zone === 'left' ? -1 : 1) * L.heroSize * 0.72, y: top + L.heroSize * 0.3 };
}

export function drawShadowStrike(ctx: CanvasRenderingContext2D, L: SceneLayout, stage: ShadowStrike, t: number): void {
  drawGround(ctx, L.w, L.h, L.groundY, 0, 'wood');
  const r = L.heroSize * 0.16;
  for (const zone of ['left', 'right', 'up'] as StrikeZone[]) {
    const { x, y } = strikeSpot(L, zone);
    const active = stage.isActiveSet && stage.target === zone;
    // Plaats van het doel (zwak), het actieve doel als schaduwbol met een aftelring.
    ctx.strokeStyle = 'rgba(155, 231, 255, 0.18)';
    ctx.lineWidth = 2;
    ctx.setLineDash([6, 6]);
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);
    if (active) {
      const pulse = 1 + Math.sin(t * 12) * 0.05;
      const g = ctx.createRadialGradient(x, y, r * 0.1, x, y, r * 1.6);
      g.addColorStop(0, 'rgba(255, 77, 109, 0.95)');
      g.addColorStop(0.55, 'rgba(120, 20, 60, 0.85)');
      g.addColorStop(1, 'rgba(120, 20, 60, 0)');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(x, y, r * 1.6 * pulse, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#1a0610';
      ctx.beginPath();
      ctx.arc(x, y, r * 0.75, 0, Math.PI * 2);
      ctx.fill();
      // Boze ogen van de schaduw
      ctx.fillStyle = PALETTE.danger;
      for (const s of [-1, 1]) {
        ctx.beginPath();
        ctx.ellipse(x + s * r * 0.28, y - r * 0.05, r * 0.14, r * 0.08, s * 0.4, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.strokeStyle = PALETTE.eye;
      ctx.lineWidth = Math.max(3, r * 0.12);
      ctx.beginPath();
      ctx.arc(x, y, r * 1.15, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * stage.targetLeft);
      ctx.stroke();
    }
    const s = stage.lastStrike;
    if (s && s.zone === zone && s.hit && stage.clockMs - s.at < 400) sparkle(ctx, x, y, r * 1.8, t);
  }
}

/** Wall Climb: rotswand met grepen die meeschuift naarmate de held klimt. */
export function drawWallClimb(ctx: CanvasRenderingContext2D, L: SceneLayout, stage: WallClimb, climb: number, t: number): void {
  const { w, h, groundY, heroSize } = L;
  const cx = w / 2;
  const ww = Math.min(w * 0.8, heroSize * 2.4);
  const step = heroSize * 0.32;
  const offset = climb * step;
  // Grond verdwijnt naar onder als je klimt.
  drawGround(ctx, w, h, groundY + offset, 0, 'stone');
  ctx.fillStyle = '#3a3f6e';
  ctx.fillRect(cx - ww / 2, -10, ww, groundY + offset + 10);
  // Rotsstructuur: per rij enkele vlekken op "willekeurige" (vaste) plaatsen, schuift mee met de klim.
  ctx.fillStyle = 'rgba(0,0,0,0.18)';
  const rowH = heroSize * 0.28;
  const firstRow = Math.floor(-offset / rowH) - 1;
  for (let r = firstRow; r < firstRow + Math.ceil((groundY + offset) / rowH) + 3; r++) {
    const y = r * rowH + offset;
    if (y > groundY + offset) break;
    for (let k = 0; k < 3; k++) {
      const hash = Math.abs(Math.sin(r * 12.9898 + k * 78.233) * 43758.5453) % 1;
      const x = cx - ww / 2 + ww * (0.08 + 0.84 * ((hash + k / 3) % 1));
      ctx.beginPath();
      ctx.ellipse(x, y, heroSize * (0.07 + hash * 0.08), heroSize * 0.04, hash * 1.5, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.strokeStyle = 'rgba(255,255,255,0.08)';
  ctx.lineWidth = 3;
  ctx.strokeRect(cx - ww / 2, -10, ww, groundY + offset + 10);
  // Grepen: om beurt links en rechts, één per stap.
  const handY = groundY - heroSize * 1.1;
  for (let k = -3; k < 12; k++) {
    const n = Math.floor(climb) + k;
    if (n < 0) continue;
    const side = n % 2 === 0 ? -1 : 1;
    const x = cx + side * heroSize * 0.16;
    const y = handY - (n - climb) * step;
    if (y < -20 || y > h + 20) continue;
    const isNext = stage.isActiveSet && n === stage.grips && (side < 0 ? 'left' : 'right') === stage.next;
    const colors = [PALETTE.eye, PALETTE.jade, PALETTE.danger, '#9b7bff'];
    ctx.fillStyle = isNext ? PALETTE.jade : colors[n % colors.length];
    ctx.globalAlpha = n < stage.grips ? 0.45 : 1;
    ctx.beginPath();
    ctx.ellipse(x, y, heroSize * 0.07, heroSize * 0.05, side * 0.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
    if (isNext) {
      const pulse = 0.5 + 0.5 * Math.sin(t * 8);
      ctx.strokeStyle = `rgba(46, 230, 197, ${0.4 + 0.6 * pulse})`;
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(x, y, heroSize * 0.13, 0, Math.PI * 2);
      ctx.stroke();
    }
  }
}

/** Finale: stammen en balken op het pad, en het Oog dat opengaat. */
export function drawTheEye(ctx: CanvasRenderingContext2D, L: SceneLayout, stage: TheEye, scroll: number, t: number): void {
  drawGround(ctx, L.w, L.h, L.groundY, scroll, 'stone');
  if (stage.hud().phase !== 'active' && stage.hud().phase !== 'finished') return;
  const v = obstacleSpeed(L);
  for (const o of stage.obstacles) {
    const x = L.heroX + (o.at - stage.run) * v;
    if (x < -L.heroSize || x > L.w + L.heroSize) continue;
    if (o.kind === 'log') drawLogAt(ctx, L, x, L.groundY);
    else drawBeamAt(ctx, L, x, L.groundY, t, o.at);
  }
  if (stage.inFinal) {
    const ex = Math.min(L.w - L.heroSize * 0.6, L.heroX + L.heroSize * 1.4);
    const ey = L.groundY - L.heroSize * 1.5;
    const r = L.heroSize * (0.35 + 0.25 * stage.eyeOpen);
    drawEye(ctx, ex, ey, r, t, 0.15 + 0.85 * Math.max(stage.eyeOpen, Math.min(1, stage.held / stage.holdMs) * 0.6));
    if (stage.eyeOpen > 0) {
      ctx.save();
      ctx.globalAlpha = stage.eyeOpen * 0.35;
      ctx.fillStyle = PALETTE.eye;
      ctx.beginPath();
      ctx.moveTo(ex - r * 0.3, ey);
      ctx.lineTo(L.heroX - L.heroSize * 0.4, L.groundY);
      ctx.lineTo(L.heroX + L.heroSize * 0.4, L.groundY);
      ctx.lineTo(ex + r * 0.3, ey);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }
  }
}
